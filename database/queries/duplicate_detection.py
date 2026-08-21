"""
Duplicate Complaint Similarity Search and Detection Engine.
Integrates with MongoDB Atlas Vector Search on `complaint_embeddings` with spatial and category filtering,
and includes resilient in-engine cosine similarity fallbacks for local/testing environments.
"""

import math
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional, Tuple
from bson import ObjectId
from pymongo.database import Database

from database.collections import (
    COMPLAINTS_COLLECTION,
    COMPLAINT_EMBEDDINGS_COLLECTION,
    COMPLAINT_UPDATES_COLLECTION,
    ComplaintStatus,
    ensure_object_id,
    validate_complaint_duplicate_reference,
)


def compute_cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
    """Computes cosine similarity between two numerical vectors."""
    if not vec1 or not vec2 or len(vec1) != len(vec2):
        return 0.0
    dot = sum(a * b for a, b in zip(vec1, vec2))
    norm1 = math.sqrt(sum(a * a for a in vec1))
    norm2 = math.sqrt(sum(b * b for b in vec2))
    if norm1 == 0.0 or norm2 == 0.0:
        return 0.0
    return float(dot / (norm1 * norm2))


def calculate_haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates great-circle distance between two points on Earth in kilometers."""
    r = 6371.0  # Earth radius in kilometers
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (
        math.sin(d_lat / 2) ** 2
        + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(d_lon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return r * c


def find_duplicate_candidates_vector_pipeline(
    query_vector: List[float],
    index_name: str = "complaint_vector_index",
    num_candidates: int = 50,
    limit: int = 5,
    exclude_complaint_id: Optional[ObjectId] = None,
) -> List[Dict[str, Any]]:
    """
    Constructs an aggregation pipeline using MongoDB Atlas `$vectorSearch`
    on the `complaint_embeddings` collection, joining with `complaints`.
    """
    pipeline: List[Dict[str, Any]] = [
        {
            "$vectorSearch": {
                "index": index_name,
                "path": "embedding",
                "queryVector": query_vector,
                "numCandidates": num_candidates,
                "limit": limit,
            }
        },
        {
            "$lookup": {
                "from": COMPLAINTS_COLLECTION,
                "localField": "complaint_id",
                "foreignField": "_id",
                "as": "complaint",
            }
        },
        {"$unwind": "$complaint"},
        {
            "$project": {
                "_id": 0,
                "embedding_id": "$_id",
                "complaint_id": "$complaint_id",
                "similarity_score": {"$meta": "vectorSearchScore"},
                "complaint": "$complaint",
            }
        },
    ]

    if exclude_complaint_id:
        pipeline.insert(2, {"$match": {"complaint_id": {"$ne": ensure_object_id(exclude_complaint_id)}}})

    return pipeline


def find_duplicate_candidates(
    db: Database,
    target_complaint_id: Any,
    similarity_threshold: float = 0.82,
    max_distance_km: float = 1.0,
    time_window_days: int = 30,
    limit: int = 5,
) -> List[Dict[str, Any]]:
    """
    Finds potential duplicate complaints matching a given complaint.
    Combines embedding semantic similarity, spatial proximity (lat/long), and category matching.
    Guarantees that a complaint will NEVER match itself.
    """
    cid = ensure_object_id(target_complaint_id)
    target_complaint = db[COMPLAINTS_COLLECTION].find_one({"_id": cid})
    if not target_complaint:
        return []

    target_category = target_complaint.get("category")
    target_lat = target_complaint.get("latitude")
    target_lon = target_complaint.get("longitude")
    target_created_at = target_complaint.get("created_at") or datetime.now(timezone.utc)

    # 1. Fetch target embedding if available
    target_emb_doc = db[COMPLAINT_EMBEDDINGS_COLLECTION].find_one({"complaint_id": cid})
    target_embedding = target_emb_doc.get("embedding") if target_emb_doc else None

    # 2. Time and Category Filter on Complaints (excluding target complaint)
    time_cutoff = target_created_at - timedelta(days=time_window_days)
    query: Dict[str, Any] = {
        "_id": {"$ne": cid},
        "created_at": {"$gte": time_cutoff},
    }
    if target_category:
        query["category"] = target_category

    candidate_complaints = list(db[COMPLAINTS_COLLECTION].find(query))

    matches: List[Dict[str, Any]] = []

    for candidate in candidate_complaints:
        candidate_id = candidate["_id"]
        # Enforce self-exclusion rule
        if candidate_id == cid:
            continue

        c_lat = candidate.get("latitude")
        c_lon = candidate.get("longitude")

        # Spatial Distance Filter
        distance_km = 0.0
        if target_lat is not None and target_lon is not None and c_lat is not None and c_lon is not None:
            distance_km = calculate_haversine_distance_km(target_lat, target_lon, c_lat, c_lon)
            if distance_km > max_distance_km:
                continue  # Out of geographic proximity radius

        # Vector / Semantic Similarity
        sim_score = 0.0
        if target_embedding:
            cand_emb_doc = db[COMPLAINT_EMBEDDINGS_COLLECTION].find_one({"complaint_id": candidate_id})
            if cand_emb_doc and cand_emb_doc.get("embedding"):
                sim_score = compute_cosine_similarity(target_embedding, cand_emb_doc["embedding"])
        else:
            # Fallback text keyword comparison if embeddings are not yet generated
            t_words = set(target_complaint.get("description", "").lower().split())
            c_words = set(candidate.get("description", "").lower().split())
            if t_words and c_words:
                sim_score = len(t_words & c_words) / len(t_words | c_words)

        if sim_score >= similarity_threshold:
            matches.append(
                {
                    "candidate_complaint_id": candidate_id,
                    "complaint_number": candidate.get("complaint_number"),
                    "category": candidate.get("category"),
                    "description": candidate.get("description"),
                    "similarity_score": round(sim_score, 4),
                    "distance_km": round(distance_km, 3),
                    "status": candidate.get("status"),
                    "created_at": candidate.get("created_at"),
                }
            )

    # Sort descending by similarity score
    matches.sort(key=lambda x: x["similarity_score"], reverse=True)
    return matches[:limit]


def mark_complaint_as_duplicate(
    db: Database,
    complaint_id: Any,
    duplicate_of_id: Any,
    updated_by_user_id: Optional[Any] = None,
    reason: Optional[str] = None,
    is_ai_action: bool = True,
) -> bool:
    """
    Safely marks a complaint as a duplicate of an existing primary complaint.
    Enforces application-level self-referencing check and writes an audit record to complaint_updates.
    """
    cid = ensure_object_id(complaint_id)
    dup_id = ensure_object_id(duplicate_of_id)
    uid = ensure_object_id(updated_by_user_id) if updated_by_user_id else None

    # Enforce self-referencing prevention rule
    validate_complaint_duplicate_reference(cid, dup_id)

    # Check existence of duplicate_of complaint
    primary_doc = db[COMPLAINTS_COLLECTION].find_one({"_id": dup_id})
    if not primary_doc:
        raise ValueError(f"Primary complaint with ID {dup_id} does not exist.")

    complaint_doc = db[COMPLAINTS_COLLECTION].find_one({"_id": cid})
    if not complaint_doc:
        raise ValueError(f"Target complaint with ID {cid} does not exist.")

    old_status = complaint_doc.get("status", ComplaintStatus.SUBMITTED.value)
    now = datetime.now(timezone.utc)

    # 1. Update Complaint Document
    db[COMPLAINTS_COLLECTION].update_one(
        {"_id": cid},
        {
            "$set": {
                "status": ComplaintStatus.DUPLICATE.value,
                "is_duplicate": True,
                "duplicate_of": dup_id,
                "updated_at": now,
            }
        },
    )

    # 2. Record Audit Entry in complaint_updates
    audit_message = reason or f"Marked as duplicate of complaint #{primary_doc.get('complaint_number', str(dup_id))}"
    update_record = {
        "_id": ObjectId(),
        "complaint_id": cid,
        "updated_by": uid,
        "old_status": old_status,
        "new_status": ComplaintStatus.DUPLICATE.value,
        "action": "MARK_DUPLICATE",
        "message": audit_message,
        "is_ai_action": is_ai_action,
        "created_at": now,
    }
    db[COMPLAINT_UPDATES_COLLECTION].insert_one(update_record)

    return True
