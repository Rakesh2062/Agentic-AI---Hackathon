"""
Search Tools — embedding generation, vector similarity search, and RAG retrieval.
Connects the AI Agent layer to the canonical MongoDB database layer and RAG knowledge base.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any, Optional

from database.collections import (
    COMPLAINTS_COLLECTION,
    COMPLAINT_EMBEDDINGS_COLLECTION,
    ensure_object_id,
)
from database.connection import get_sync_db
from database.queries.duplicate_detection import (
    calculate_haversine_distance_km,
    compute_cosine_similarity,
)
from rag.embeddings import (
    EMBEDDING_DIMENSION,
    generate_embedding as rag_generate_embedding,
)
from rag.retriever import (
    get_relevant_resolution_sop,
    retrieve_relevant_guidelines,
)

logger = logging.getLogger(__name__)

# Re-export RAG retrieval functions for M2 agents
__all__ = [
    "generate_embedding",
    "store_embedding",
    "search_similar_complaints",
    "search_complaints_by_location",
    "retrieve_relevant_guidelines",
    "get_relevant_resolution_sop",
    "EMBEDDING_DIMENSION",
]


# ---------------------------------------------------------------------------
# Tool functions
# ---------------------------------------------------------------------------
async def generate_embedding(text: str) -> list[float]:
    """
    Generates a 768-dimensional embedding vector for input text.
    Uses Google GenAI SDK (gemini-embedding-2) with automatic fallback for offline/test environments.
    """
    logger.info("generate_embedding called (text length=%d)", len(text))
    return rag_generate_embedding(text, is_query=False)


async def store_embedding(
    complaint_id: str,
    embedding: list[float],
    db: Any = None,
) -> None:
    """
    Stores or updates the embedding vector for a complaint in COMPLAINT_EMBEDDINGS_COLLECTION.
    """
    logger.info("store_embedding called for complaint_id=%s", complaint_id)
    if not embedding or not complaint_id:
        return

    try:
        active_db = db if db is not None else get_sync_db()
        cid = ensure_object_id(complaint_id)
        now = datetime.now(timezone.utc)

        active_db[COMPLAINT_EMBEDDINGS_COLLECTION].update_one(
            {"complaint_id": cid},
            {
                "$set": {
                    "complaint_id": cid,
                    "embedding": embedding,
                    "model_name": "gemini-embedding-2",
                    "created_at": now,
                }
            },
            upsert=True,
        )
    except Exception as exc:
        logger.warning("store_embedding DB error (%s), skipping store", exc)


async def search_similar_complaints(
    embedding: list[float],
    *,
    top_k: int = 5,
    threshold: float = 0.5,
    db: Any = None,
) -> list[dict[str, Any]]:
    """
    Searches for complaints similar to the given embedding vector in MongoDB.
    Queries COMPLAINT_EMBEDDINGS_COLLECTION, joins with COMPLAINTS_COLLECTION,
    and returns matches meeting the similarity threshold.
    """
    logger.info(
        "search_similar_complaints called (top_k=%d, threshold=%s)",
        top_k,
        threshold,
    )
    if not embedding:
        return []

    try:
        active_db = db if db is not None else get_sync_db()

        # Fetch all complaint embeddings
        emb_docs = list(active_db[COMPLAINT_EMBEDDINGS_COLLECTION].find({}))
        if not emb_docs:
            return []

        # Calculate similarity scores
        scored_candidates: list[tuple[Any, float]] = []
        for doc in emb_docs:
            cand_emb = doc.get("embedding")
            if not cand_emb:
                continue
            score = compute_cosine_similarity(embedding, cand_emb)
            if score >= threshold:
                scored_candidates.append((doc.get("complaint_id"), score))

        if not scored_candidates:
            return []

        # Sort descending by score and take top candidates
        scored_candidates.sort(key=lambda x: x[1], reverse=True)
        top_candidates = scored_candidates[:top_k]

        # Resolve complaint details
        candidate_ids = [cid for cid, _ in top_candidates]
        complaints = list(
            active_db[COMPLAINTS_COLLECTION].find({"_id": {"$in": candidate_ids}})
        )
        complaints_by_id = {c["_id"]: c for c in complaints}

        results: list[dict[str, Any]] = []
        for cid, score in top_candidates:
            complaint = complaints_by_id.get(cid)
            if complaint:
                c_num = complaint.get("complaint_number") or str(complaint.get("_id", cid))
                desc = complaint.get("description", "")
                snippet = desc[:120] + "..." if len(desc) > 120 else desc
                loc = complaint.get("address")
                if not loc and complaint.get("latitude") and complaint.get("longitude"):
                    loc = f"{complaint.get('latitude')}, {complaint.get('longitude')}"

                c_date = complaint.get("created_at")
                created_str = (
                    c_date.isoformat()
                    if isinstance(c_date, datetime)
                    else str(c_date) if c_date else None
                )

                results.append(
                    {
                        "complaint_id": str(c_num),
                        "similarity_score": round(score, 4),
                        "category": complaint.get("category"),
                        "description_snippet": snippet,
                        "location": loc,
                        "created_at": created_str,
                    }
                )

        return results
    except Exception as exc:
        logger.warning("search_similar_complaints DB error (%s), returning empty list", exc)
        return []


async def search_complaints_by_location(
    latitude: float,
    longitude: float,
    radius_km: float = 1.0,
    db: Any = None,
) -> list[dict[str, Any]]:
    """
    Finds complaints within *radius_km* of the given coordinates using the canonical database.
    """
    logger.info(
        "search_complaints_by_location called (lat=%s, lon=%s, radius=%s km)",
        latitude,
        longitude,
        radius_km,
    )
    active_db = db if db is not None else get_sync_db()

    query = {
        "latitude": {"$ne": None},
        "longitude": {"$ne": None},
    }
    candidates = list(active_db[COMPLAINTS_COLLECTION].find(query))

    nearby_results: list[dict[str, Any]] = []
    for c in candidates:
        c_lat = c.get("latitude")
        c_lon = c.get("longitude")
        if c_lat is None or c_lon is None:
            continue

        dist_km = calculate_haversine_distance_km(latitude, longitude, float(c_lat), float(c_lon))
        if dist_km <= radius_km:
            c_num = c.get("complaint_number") or str(c.get("_id"))
            desc = c.get("description", "")
            snippet = desc[:120] + "..." if len(desc) > 120 else desc
            loc = c.get("address") or f"{c_lat}, {c_lon}"
            c_date = c.get("created_at")
            created_str = (
                c_date.isoformat()
                if isinstance(c_date, datetime)
                else str(c_date) if c_date else None
            )

            nearby_results.append(
                {
                    "complaint_id": str(c_num),
                    "distance_km": round(dist_km, 3),
                    "similarity_score": 1.0,  # Spatial match
                    "category": c.get("category"),
                    "description_snippet": snippet,
                    "location": loc,
                    "created_at": created_str,
                }
            )

    nearby_results.sort(key=lambda x: x.get("distance_km", 0.0))
    return nearby_results
