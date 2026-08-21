"""
Tests for Vector Retriever & Resolution SOP Helper (rag/retriever.py).
"""

import pytest
from rag.knowledge_base import seed_knowledge_base
from rag.retriever import RAGRetriever, get_relevant_resolution_sop


@pytest.fixture
def seeded_rag_db(mock_db):
    """Provides a mongomock DB with seeded knowledge base chunks."""
    seed_knowledge_base(mock_db, chunk_size=400, chunk_overlap=80, drop_existing=True)
    return mock_db


def test_retrieve_relevant_guidelines_pothole(seeded_rag_db):
    """Verifies retriever finds relevant PWD road repair guidelines for pothole query."""
    retriever = RAGRetriever(db=seeded_rag_db)
    chunks = retriever.retrieve_relevant_guidelines(
        query="Large dangerous pothole on main road causing traffic hazard",
        category="Roads & Infrastructure",
        top_k=3,
        min_score=0.1,
    )
    assert len(chunks) > 0
    assert chunks[0]["category"] == "Roads & Infrastructure"
    assert "pothole" in chunks[0]["content"].lower() or "road" in chunks[0]["content"].lower()
    assert "similarity_score" in chunks[0]


def test_retrieve_relevant_guidelines_water_leak(seeded_rag_db):
    """Verifies retriever finds Water Board guidelines for pipeline burst query."""
    retriever = RAGRetriever(db=seeded_rag_db)
    chunks = retriever.retrieve_relevant_guidelines(
        query="Drinking water pipeline burst flooding street",
        top_k=3,
        min_score=0.1,
    )
    assert len(chunks) > 0
    categories = [c["category"] for c in chunks]
    assert "Water Supply & Sewerage" in categories


def test_retriever_department_filter(seeded_rag_db):
    """Verifies department filtering restricts results to target department."""
    retriever = RAGRetriever(db=seeded_rag_db)
    chunks = retriever.retrieve_relevant_guidelines(
        query="Broken streetlight causing dark zone",
        department="Electricity & Street Lighting",
        top_k=3,
        min_score=0.1,
    )
    assert len(chunks) > 0
    assert all(c["department"] == "Electricity & Street Lighting" for c in chunks)


def test_retriever_empty_query(seeded_rag_db):
    """Verifies empty or whitespace query returns empty list gracefully."""
    retriever = RAGRetriever(db=seeded_rag_db)
    assert retriever.retrieve_relevant_guidelines("") == []
    assert retriever.retrieve_relevant_guidelines("   ") == []


def test_get_relevant_resolution_sop_structure(seeded_rag_db):
    """Verifies M2 Resolution Agent helper returns structured SOP guidance."""
    sop_info = get_relevant_resolution_sop(
        complaint_text="Overflowing commercial dumpster spilling trash and creating severe odor",
        category="Solid Waste & Sanitation",
        db=seeded_rag_db,
    )
    assert sop_info["has_guidance"] is True
    assert "title" in sop_info["primary_sop_title"].lower() or "sop" in sop_info["primary_sop_title"].lower() or "waste" in sop_info["primary_sop_title"].lower()
    assert len(sop_info["resolution_guidance"]) > 50
    assert len(sop_info["relevant_chunks"]) > 0
