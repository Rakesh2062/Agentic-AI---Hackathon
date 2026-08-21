import os
import sys

# Ensure Backend/ and workspace root are in sys.path
cur_dir = os.path.dirname(os.path.abspath(__file__))
workspace_root = os.path.abspath(os.path.join(cur_dir, "..", ".."))
backend_dir = os.path.join(workspace_root, "Backend")
for p in (workspace_root, backend_dir):
    if p not in sys.path:
        sys.path.insert(0, p)

from datetime import datetime, timezone
import pytest
from bson import ObjectId

from database.collections import (
    COMPLAINTS_COLLECTION,
    COMPLAINT_EMBEDDINGS_COLLECTION,
    ComplaintPriority,
    ComplaintStatus,
)
from Backend.agents.tools.search_tools import (
    generate_embedding,
    store_embedding,
    search_similar_complaints,
    search_complaints_by_location,
    retrieve_relevant_guidelines,
    get_relevant_resolution_sop,
    EMBEDDING_DIMENSION,
)
from Backend.agents.duplicate.agent import DuplicateAgent
from Backend.agents.config import BaseLLMClient
from Backend.agents.state.complaint_state import ComplaintState, ComplaintCategory


class MockTestLLMClient(BaseLLMClient):
    def __init__(self, response_json: str = '{"is_duplicate": false, "duplicate_of": null, "confidence": 0.95, "reason": "No duplicate found"}'):
        self.response_json = response_json

    async def generate(self, prompt: str, **kwargs) -> str:
        return self.response_json

    async def embed(self, text: str) -> list[float]:
        return [0.0] * 768


@pytest.mark.asyncio
async def test_generate_embedding_768_dim():
    """Verifies that generate_embedding returns a 768-dimensional float vector."""
    emb = await generate_embedding("Dangerous pothole near the intersection.")
    assert isinstance(emb, list)
    assert len(emb) == 768
    assert all(isinstance(x, float) for x in emb)


@pytest.mark.asyncio
async def test_offline_deterministic_fallback():
    """Verifies deterministic embedding generation in offline/test environments."""
    emb1 = await generate_embedding("Water main leakage on 3rd Avenue")
    emb2 = await generate_embedding("Water main leakage on 3rd Avenue")
    assert emb1 == emb2


@pytest.mark.asyncio
async def test_store_embedding_and_upsert(mock_db):
    """Verifies storing embeddings in MongoDB COMPLAINT_EMBEDDINGS_COLLECTION with idempotency."""
    cid = ObjectId()
    emb = [0.05] * 768

    await store_embedding(str(cid), emb, db=mock_db)

    # Verify insertion
    doc = mock_db[COMPLAINT_EMBEDDINGS_COLLECTION].find_one({"complaint_id": cid})
    assert doc is not None
    assert doc["complaint_id"] == cid
    assert len(doc["embedding"]) == 768
    assert doc["model_name"] == "gemini-embedding-2"

    # Upsert with new values - should update, not create duplicate
    emb_updated = [0.09] * 768
    await store_embedding(str(cid), emb_updated, db=mock_db)

    count = mock_db[COMPLAINT_EMBEDDINGS_COLLECTION].count_documents({"complaint_id": cid})
    assert count == 1
    updated_doc = mock_db[COMPLAINT_EMBEDDINGS_COLLECTION].find_one({"complaint_id": cid})
    assert updated_doc["embedding"][0] == 0.09


@pytest.mark.asyncio
async def test_search_similar_complaints_structure(mock_db):
    """Verifies searching similar complaints returns the exact contract expected by DuplicateAgent."""
    cid1 = ObjectId()
    cid2 = ObjectId()

    # 1. Insert two complaints into COMPLAINTS_COLLECTION
    mock_db[COMPLAINTS_COLLECTION].insert_many([
        {
            "_id": cid1,
            "complaint_number": "CMP-2025-101",
            "description": "Deep asphalt pothole causing vehicular damage on Main Road.",
            "category": "Roads & Infrastructure",
            "priority": ComplaintPriority.HIGH.value,
            "status": ComplaintStatus.SUBMITTED.value,
            "latitude": 40.7128,
            "longitude": -74.0060,
            "address": "123 Main Road",
            "is_duplicate": False,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
        },
        {
            "_id": cid2,
            "complaint_number": "CMP-2025-102",
            "description": "Streetlight fixture broken and dark on Oak Avenue.",
            "category": "Electricity & Street Lighting",
            "priority": ComplaintPriority.MEDIUM.value,
            "status": ComplaintStatus.SUBMITTED.value,
            "latitude": 40.7200,
            "longitude": -74.0100,
            "address": "456 Oak Avenue",
            "is_duplicate": False,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
        },
    ])

    # 2. Store embeddings for both
    emb1 = await generate_embedding("Deep asphalt pothole causing vehicular damage on Main Road.")
    emb2 = await generate_embedding("Streetlight fixture broken and dark on Oak Avenue.")
    await store_embedding(str(cid1), emb1, db=mock_db)
    await store_embedding(str(cid2), emb2, db=mock_db)

    # 3. Search using query embedding similar to complaint 1
    query_emb = await generate_embedding("Dangerous large pothole in road asphalt.")
    results = await search_similar_complaints(query_emb, top_k=5, threshold=0.1, db=mock_db)

    assert len(results) > 0
    top = results[0]
    assert "complaint_id" in top
    assert "similarity_score" in top
    assert "category" in top
    assert "description_snippet" in top
    assert "location" in top
    assert "created_at" in top
    assert top["complaint_id"] == "CMP-2025-101"
    assert top["category"] == "Roads & Infrastructure"
    assert isinstance(top["similarity_score"], float)


@pytest.mark.asyncio
async def test_search_complaints_by_location(mock_db):
    """Verifies location-based search using latitude, longitude, and radius_km."""
    mock_db[COMPLAINTS_COLLECTION].insert_many([
        {
            "_id": ObjectId(),
            "complaint_number": "CMP-NEAR-01",
            "description": "Nearby broken pipe",
            "category": "Water Supply & Sewerage",
            "latitude": 40.7128,
            "longitude": -74.0060,
            "address": "Near Broadway",
            "created_at": datetime.now(timezone.utc),
        },
        {
            "_id": ObjectId(),
            "complaint_number": "CMP-FAR-02",
            "description": "Far away issue",
            "category": "Roads & Infrastructure",
            "latitude": 41.7128,  # >100 km away
            "longitude": -74.0060,
            "address": "Far Away City",
            "created_at": datetime.now(timezone.utc),
        },
    ])

    results = await search_complaints_by_location(
        latitude=40.7130,
        longitude=-74.0062,
        radius_km=1.0,
        db=mock_db,
    )
    assert len(results) == 1
    assert results[0]["complaint_id"] == "CMP-NEAR-01"
    assert results[0]["distance_km"] < 1.0


def test_rag_helper_exports(mock_db):
    """Verifies that RAG retrieval functions are re-exported and operational."""
    guidelines = retrieve_relevant_guidelines(
        query="Road pothole remediation",
        category="Roads & Infrastructure",
        top_k=2,
        db=mock_db,
    )
    assert isinstance(guidelines, list)

    sop = get_relevant_resolution_sop(
        complaint_text="Sewer water overflow on residential lane",
        category="Water Supply & Sewerage",
        db=mock_db,
    )
    assert isinstance(sop, dict)
    assert "has_guidance" in sop


@pytest.mark.asyncio
async def test_duplicate_agent_end_to_end(mock_db):
    """Verifies that DuplicateAgent executes end-to-end without code modifications."""
    mock_llm = MockTestLLMClient(response_json='{"is_duplicate": false, "duplicate_of": null, "confidence": 0.95, "reason": "No matching duplicate"}')
    agent = DuplicateAgent(llm_client=mock_llm)

    state = ComplaintState(
        complaint_id="CMP-TEST-999",
        citizen_id="CIT-101",
        description="Pothole in front of school entrance",
        category=ComplaintCategory.ROADS,
        address="100 School Lane",
        latitude=40.7128,
        longitude=-74.0060,
    )

    result = await agent.run(state)
    assert result.is_duplicate is False
    assert state.is_duplicate is False
    assert len(state.audit_events) == 1
