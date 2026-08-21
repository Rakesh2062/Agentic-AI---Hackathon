"""
Vector Retriever Service for Civic RAG.
Retrieves relevant municipal SOP guidelines, resolution procedures, and SLA policies
using MongoDB Vector Search and in-memory cosine similarity fallback.
"""

from typing import Any, Dict, List, Optional
from database.connection import get_sync_db
from rag.embeddings import (
    EmbeddingService,
    get_embedding_service,
    compute_cosine_similarity,
    generate_embedding,
)
from rag.knowledge_base import KNOWLEDGE_BASE_COLLECTION, seed_knowledge_base


class RAGRetriever:
    """
    Retrieves relevant municipal policy chunks and standard operating procedures.
    """

    def __init__(
        self,
        db: Any = None,
        embedding_service: Optional[EmbeddingService] = None,
    ):
        self.db = db if db is not None else get_sync_db()
        self.embedding_service = embedding_service or get_embedding_service()

    def retrieve_relevant_guidelines(
        self,
        query: str,
        category: Optional[str] = None,
        department: Optional[str] = None,
        top_k: int = 5,
        min_score: float = 0.0,
    ) -> List[Dict[str, Any]]:
        """
        Retrieves top-k relevant knowledge-base chunks matching the query string.
        Applies optional category and department filtering.
        """
        if not query or not query.strip():
            return []

        # 1. Generate query embedding
        query_vector = self.embedding_service.generate_embedding(query, is_query=True)

        # 2. Check if knowledge base is seeded; auto-seed if empty
        coll = self.db[KNOWLEDGE_BASE_COLLECTION]
        count = coll.count_documents({})
        if count == 0:
            seed_knowledge_base(self.db)

        # 3. Query Filter
        filter_query: Dict[str, Any] = {}
        if category:
            filter_query["$or"] = [
                {"category": category},
                {"metadata.keywords": {"$in": [category.lower()]}},
            ]
        if department:
            filter_query["department"] = department

        # 4. Fetch candidate chunks
        candidate_chunks = list(coll.find(filter_query if filter_query else {}))

        # Fallback to all chunks if strict filter returned nothing
        if not candidate_chunks and filter_query:
            candidate_chunks = list(coll.find({}))

        scored_chunks: List[Dict[str, Any]] = []

        for chunk in candidate_chunks:
            chunk_emb = chunk.get("embedding")
            if not chunk_emb:
                continue

            score = compute_cosine_similarity(query_vector, chunk_emb)
            if score >= min_score:
                scored_chunks.append({
                    "chunk_id": chunk.get("chunk_id"),
                    "document_id": chunk.get("document_id"),
                    "title": chunk.get("title"),
                    "category": chunk.get("category"),
                    "department": chunk.get("department"),
                    "content": chunk.get("content"),
                    "source": chunk.get("source"),
                    "similarity_score": round(score, 4),
                    "metadata": chunk.get("metadata", {}),
                })

        # Sort descending by similarity score
        scored_chunks.sort(key=lambda x: x["similarity_score"], reverse=True)
        return scored_chunks[:top_k]

    def get_relevant_resolution_sop(
        self,
        complaint_text: str,
        category: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        High-level RAG extraction helper for the M2 Resolution Agent.
        Synthesizes relevant municipal SOP guidelines for formulating resolution messages.
        """
        chunks = self.retrieve_relevant_guidelines(
            query=complaint_text,
            category=category,
            top_k=3,
            min_score=0.0,
        )

        if not chunks:
            return {
                "has_guidance": False,
                "primary_sop_title": "Standard Civic Grievance Protocol",
                "category": category or "General Civic Services",
                "department": "Municipal Administration",
                "resolution_guidance": "Standard municipal review and field technician inspection required.",
                "citizen_communication_advice": "Acknowledge complaint receipt and provide estimated timeline.",
                "relevant_chunks": [],
            }

        top_chunk = chunks[0]
        combined_content = "\n\n---\n\n".join([f"[{c['title']}]\n{c['content']}" for c in chunks])

        return {
            "has_guidance": True,
            "primary_sop_title": top_chunk.get("title"),
            "category": top_chunk.get("category"),
            "department": top_chunk.get("department"),
            "resolution_guidance": combined_content,
            "citizen_communication_advice": f"Follow communication protocols defined in {top_chunk.get('title')}.",
            "relevant_chunks": chunks,
        }


# Singleton accessor
_retriever_instance: Optional[RAGRetriever] = None


def get_rag_retriever(db: Any = None) -> RAGRetriever:
    """Returns the global RAGRetriever instance."""
    global _retriever_instance
    if _retriever_instance is None or db is not None:
        _retriever_instance = RAGRetriever(db=db)
    return _retriever_instance


def retrieve_relevant_guidelines(
    query: str,
    category: Optional[str] = None,
    department: Optional[str] = None,
    top_k: int = 5,
    db: Any = None,
) -> List[Dict[str, Any]]:
    """Convenience helper to retrieve guidelines."""
    retriever = get_rag_retriever(db=db)
    return retriever.retrieve_relevant_guidelines(
        query=query,
        category=category,
        department=department,
        top_k=top_k,
    )


def get_relevant_resolution_sop(
    complaint_text: str,
    category: Optional[str] = None,
    db: Any = None,
) -> Dict[str, Any]:
    """Convenience helper to get resolution SOP guidance for M2 Resolution Agent."""
    retriever = get_rag_retriever(db=db)
    return retriever.get_relevant_resolution_sop(
        complaint_text=complaint_text,
        category=category,
    )
