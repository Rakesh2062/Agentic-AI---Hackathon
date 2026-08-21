"""
Tests for Duplicate Complaint Similarity Search & Detection (database/queries/duplicate_detection.py).
"""

import pytest
from bson import ObjectId
from datetime import datetime, timezone, timedelta

from database.collections import (
    COMPLAINTS_COLLECTION,
    COMPLAINT_EMBEDDINGS_COLLECTION,
    COMPLAINT_UPDATES_COLLECTION,
    ComplaintStatus,
)
from database.queries.duplicate_detection import (
    compute_cosine_similarity,
    calculate_haversine_distance_km,
    find_duplicate_candidates_vector_pipeline,
    find_duplicate_candidates,
    mark_complaint_as_duplicate,
)


def test_cosine_similarity_math():
    """Verifies vector cosine similarity calculations."""
    v1 = [1.0, 0.0, 0.0]
    v2 = [1.0, 0.0, 0.0]
    v3 = [0.0, 1.0, 0.0]
    v4 = [0.707106, 0.707106, 0.0]

    assert pytest.approx(compute_cosine_similarity(v1, v2), 0.0001) == 1.0
    assert pytest.approx(compute_cosine_similarity(v1, v3), 0.0001) == 0.0
    assert pytest.approx(compute_cosine_similarity(v1, v4), 0.0001) == 0.7071
    assert compute_cosine_similarity([], []) == 0.0
    assert compute_cosine_similarity([0.0, 0.0], [0.0, 0.0]) == 0.0


def test_haversine_distance_calculation():
    """Verifies geographic distance calculations."""
    # NYC Coordinates
    lat1, lon1 = 40.712776, -74.005974
    lat2, lon2 = 40.712790, -74.005960  # ~2 meters away
    d_close = calculate_haversine_distance_km(lat1, lon1, lat2, lon2)
    assert d_close < 0.01  # Less than 10 meters

    lat_far, lon_far = 34.0522, -118.2437  # Los Angeles
    d_far = calculate_haversine_distance_km(lat1, lon1, lat_far, lon_far)
    assert d_far > 3900.0  # Approx 3935 km


def test_vector_search_pipeline_construction():
    """Verifies MongoDB Atlas Vector Search pipeline structure and exclusions."""
    query_vec = [0.1] * 768
    cid = ObjectId()
    pipeline = find_duplicate_candidates_vector_pipeline(
        query_vector=query_vec,
        index_name="complaint_vector_index",
        exclude_complaint_id=cid,
    )
    assert len(pipeline) >= 4
    assert "$vectorSearch" in pipeline[0]
    assert "$lookup" in pipeline[1]
    assert "$match" in pipeline[2]
    assert pipeline[2]["$match"]["complaint_id"] == {"$ne": cid}


def test_find_duplicate_candidates_seeded(seeded_mock_db):
    """
    Verifies duplicate detection correctly finds the similar pothole complaint
    and never returns the target complaint itself.
    """
    db = seeded_mock_db
    # Target: CMP-2026-0001 (Pothole at 5th & Oak)
    target = db[COMPLAINTS_COLLECTION].find_one({"complaint_number": "CMP-2026-0001"})
    assert target is not None
    target_id = target["_id"]

    candidates = find_duplicate_candidates(
        db=db,
        target_complaint_id=target_id,
        similarity_threshold=0.80,
        max_distance_km=0.5,
        time_window_days=30,
    )

    assert len(candidates) > 0
    # Must never return itself
    assert all(c["candidate_complaint_id"] != target_id for c in candidates)

    # CMP-2026-0002 should be the top match
    top_match = candidates[0]
    assert top_match["complaint_number"] == "CMP-2026-0002"
    assert top_match["similarity_score"] >= 0.80
    assert top_match["distance_km"] < 0.1


def test_mark_complaint_as_duplicate(seeded_mock_db):
    """
    Verifies mark_complaint_as_duplicate updates complaint status, references primary,
    and inserts an audit log in complaint_updates.
    """
    db = seeded_mock_db
    primary = db[COMPLAINTS_COLLECTION].find_one({"complaint_number": "CMP-2026-0001"})
    target = db[COMPLAINTS_COLLECTION].find_one({"complaint_number": "CMP-2026-0005"})

    assert primary is not None and target is not None
    p_id = primary["_id"]
    t_id = target["_id"]

    success = mark_complaint_as_duplicate(
        db=db,
        complaint_id=t_id,
        duplicate_of_id=p_id,
        reason="Duplicate streetlight complaint verified by AI.",
        is_ai_action=True,
    )
    assert success is True

    # Verify updated complaint
    updated_target = db[COMPLAINTS_COLLECTION].find_one({"_id": t_id})
    assert updated_target["status"] == ComplaintStatus.DUPLICATE.value
    assert updated_target["is_duplicate"] is True
    assert updated_target["duplicate_of"] == p_id

    # Verify audit record in complaint_updates
    audit = db[COMPLAINT_UPDATES_COLLECTION].find_one({
        "complaint_id": t_id,
        "action": "MARK_DUPLICATE",
    })
    assert audit is not None
    assert audit["new_status"] == ComplaintStatus.DUPLICATE.value
    assert audit["is_ai_action"] is True
    assert "Duplicate streetlight complaint" in audit["message"]


def test_mark_complaint_as_duplicate_self_reference_forbidden(mock_db):
    """Verifies attempting to mark a complaint as a duplicate of itself is rejected."""
    cid = ObjectId()
    with pytest.raises(ValueError, match="Complaint cannot reference itself"):
        mark_complaint_as_duplicate(mock_db, cid, cid)
