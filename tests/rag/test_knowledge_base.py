"""
Tests for Municipal Knowledge Base & Ingestion (rag/knowledge_base.py).
"""

import pytest
from rag.knowledge_base import (
    KNOWLEDGE_BASE_COLLECTION,
    get_municipal_knowledge_base_documents,
    seed_knowledge_base,
)
from rag.embeddings import EMBEDDING_DIMENSION


def test_municipal_documents_coverage():
    """Verifies all 8 civic service domain SOPs are defined with required attributes."""
    docs = get_municipal_knowledge_base_documents()
    assert len(docs) == 8

    doc_ids = [d.document_id for d in docs]
    assert "SOP-ROADS-001" in doc_ids
    assert "SOP-DRAIN-002" in doc_ids
    assert "SOP-WATER-003" in doc_ids
    assert "SOP-WASTE-004" in doc_ids
    assert "SOP-ELEC-005" in doc_ids
    assert "SOP-HEALTH-006" in doc_ids
    assert "SOP-FACILITY-007" in doc_ids
    assert "SOP-TRIAGE-008" in doc_ids

    for d in docs:
        assert len(d.title) > 5
        assert len(d.content) > 100
        assert d.sla_hours > 0
        assert d.priority_level in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
        assert len(d.department) > 0


def test_seed_knowledge_base_execution(mock_db):
    """Verifies knowledge base seeding generates chunks with embeddings in MongoDB."""
    result = seed_knowledge_base(mock_db, chunk_size=400, chunk_overlap=80, drop_existing=True)
    assert result["documents_processed"] == 8
    assert result["chunks_indexed"] > 8
    assert result["collection"] == KNOWLEDGE_BASE_COLLECTION

    # Verify documents in collection
    coll = mock_db[KNOWLEDGE_BASE_COLLECTION]
    total_docs = coll.count_documents({})
    assert total_docs == result["chunks_indexed"]

    sample = coll.find_one({})
    assert sample is not None
    assert "chunk_id" in sample
    assert "content" in sample
    assert "embedding" in sample
    assert len(sample["embedding"]) == EMBEDDING_DIMENSION
    assert "title" in sample
    assert "department" in sample
