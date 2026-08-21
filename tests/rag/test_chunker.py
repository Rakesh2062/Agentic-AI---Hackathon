"""
Tests for RAG Text Chunker (rag/chunker.py).
"""

import pytest
from rag.chunker import chunk_text, chunk_document, TextChunk


def test_chunk_small_text_single_chunk():
    """Verifies that text smaller than chunk_size produces a single chunk."""
    text = "Short municipal announcement regarding road maintenance."
    chunks = chunk_text(text, chunk_size=500, chunk_overlap=100, chunk_id_prefix="TEST")
    assert len(chunks) == 1
    assert chunks[0].chunk_id == "TEST-0"
    assert chunks[0].text == text
    assert chunks[0].chunk_index == 0


def test_chunk_large_text_multiple_chunks():
    """Verifies that large text is split into multiple overlapping chunks."""
    long_text = "Paragraph 1: Road repair procedures for municipal asphalt.\n\n" * 20
    chunks = chunk_text(long_text, chunk_size=300, chunk_overlap=50, chunk_id_prefix="SOP-1")
    assert len(chunks) > 1
    for i, c in enumerate(chunks):
        assert isinstance(c, TextChunk)
        assert c.chunk_index == i
        assert c.chunk_id == f"SOP-1-{i}"
        assert len(c.text) > 0


def test_chunk_metadata_preservation():
    """Verifies that metadata dictionaries are passed to all generated chunks."""
    text = "Detailed guidelines for water pipeline isolation and pressure testing."
    meta = {"department": "Water Board", "sla_hours": 24, "priority": "HIGH"}
    chunks = chunk_text(text, chunk_size=100, chunk_overlap=20, metadata=meta)
    assert len(chunks) >= 1
    for c in chunks:
        assert c.metadata["department"] == "Water Board"
        assert c.metadata["sla_hours"] == 24


def test_chunk_document_structure():
    """Verifies chunk_document returns dictionary records ready for database storage."""
    doc = {
        "document_id": "SOP-ELEC-005",
        "title": "Streetlighting Repair SOP",
        "category": "Electricity & Street Lighting",
        "department": "Electricity Department",
        "content": "Step 1: Check power feeder.\n\nStep 2: Replace LED luminaire.\n\nStep 3: Test circuit breaker.",
        "source": "Municipal SOP Manual",
        "metadata": {"keywords": ["lighting", "pole"]},
    }
    records = chunk_document(doc, chunk_size=100, chunk_overlap=20)
    assert len(records) >= 1
    for r in records:
        assert r["document_id"] == "SOP-ELEC-005"
        assert r["title"] == "Streetlighting Repair SOP"
        assert r["category"] == "Electricity & Street Lighting"
        assert r["department"] == "Electricity Department"
        assert "content" in r
        assert "metadata" in r
