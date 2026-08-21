"""
Tests for index definitions and index creation (database/indexes.py).
"""

import pytest
from database.collections import (
    USERS_COLLECTION,
    DEPARTMENTS_COLLECTION,
    COMPLAINTS_COLLECTION,
    COMPLAINT_UPDATES_COLLECTION,
    ASSIGNMENTS_COLLECTION,
    NOTIFICATIONS_COLLECTION,
    ESCALATIONS_COLLECTION,
    COMPLAINT_EMBEDDINGS_COLLECTION,
)
from database.indexes import (
    get_index_specifications,
    get_atlas_vector_index_spec,
    create_indexes,
)


def test_index_specifications_coverage():
    """Verifies index models are configured for all 8 collections."""
    specs = get_index_specifications()
    expected_collections = {
        USERS_COLLECTION,
        DEPARTMENTS_COLLECTION,
        COMPLAINTS_COLLECTION,
        COMPLAINT_UPDATES_COLLECTION,
        ASSIGNMENTS_COLLECTION,
        NOTIFICATIONS_COLLECTION,
        ESCALATIONS_COLLECTION,
        COMPLAINT_EMBEDDINGS_COLLECTION,
    }
    assert set(specs.keys()) == expected_collections


def test_unique_indexes():
    """Verifies mandatory unique indexes exist."""
    specs = get_index_specifications()

    # users.email unique
    users_indexes = specs[USERS_COLLECTION]
    email_idx = next((idx for idx in users_indexes if dict(idx.document.get("key", {})) == {"email": 1}), None)
    assert email_idx is not None
    assert email_idx.document.get("unique") is True

    # complaints.complaint_number unique
    complaints_indexes = specs[COMPLAINTS_COLLECTION]
    cnum_idx = next((idx for idx in complaints_indexes if dict(idx.document.get("key", {})) == {"complaint_number": 1}), None)
    assert cnum_idx is not None
    assert cnum_idx.document.get("unique") is True

    # complaint_embeddings.complaint_id unique
    emb_indexes = specs[COMPLAINT_EMBEDDINGS_COLLECTION]
    cid_idx = next((idx for idx in emb_indexes if dict(idx.document.get("key", {})) == {"complaint_id": 1}), None)
    assert cid_idx is not None
    assert cid_idx.document.get("unique") is True


def test_complaints_secondary_and_geospatial_indexes():
    """Verifies secondary, compound, and lat/long coordinate indexes for complaints."""
    specs = get_index_specifications()
    c_indexes = specs[COMPLAINTS_COLLECTION]
    keys = [dict(idx.document.get("key", {})) for idx in c_indexes]

    # Required single-field indexes
    assert {"user_id": 1} in keys
    assert {"status": 1} in keys
    assert {"category": 1} in keys
    assert {"priority": 1} in keys
    assert {"department_id": 1} in keys
    assert {"created_at": -1} in keys

    # Required latitude/longitude coordinate indexing
    assert {"latitude": 1, "longitude": 1} in keys



def test_atlas_vector_index_spec():
    """Verifies MongoDB Atlas Vector Search specification structure."""
    spec = get_atlas_vector_index_spec(dimensions=768, similarity="cosine")
    assert spec["name"] == "complaint_vector_index"
    assert spec["type"] == "vectorSearch"
    assert spec["definition"]["fields"][0]["path"] == "embedding"
    assert spec["definition"]["fields"][0]["numDimensions"] == 768
    assert spec["definition"]["fields"][0]["similarity"] == "cosine"


def test_create_indexes_execution(mock_db):
    """Verifies create_indexes creates indexes on all collections in database without errors."""
    results = create_indexes(mock_db)
    assert len(results) == 8
    for col_name, created in results.items():
        assert len(created) > 0
        assert not any("ERROR" in str(name) for name in created)
