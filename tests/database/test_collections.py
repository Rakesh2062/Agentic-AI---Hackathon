"""
Tests for collection definitions, enums, schema validators, and constraints (database/collections.py).
"""

import pytest
from bson import ObjectId
from database.collections import (
    COLLECTIONS,
    USERS_COLLECTION,
    DEPARTMENTS_COLLECTION,
    COMPLAINTS_COLLECTION,
    COMPLAINT_UPDATES_COLLECTION,
    ASSIGNMENTS_COLLECTION,
    NOTIFICATIONS_COLLECTION,
    ESCALATIONS_COLLECTION,
    COMPLAINT_EMBEDDINGS_COLLECTION,
    UserRole,
    ComplaintStatus,
    ComplaintPriority,
    AssignmentStatus,
    NotificationType,
    EscalationTriggerType,
    EscalationStatus,
    validate_complaint_duplicate_reference,
    ensure_object_id,
    get_collection_validators,
)


def test_exact_8_collections_defined():
    """Verifies that exactly the approved 8 collections are defined and no forbidden ones exist."""
    expected_8 = {
        "users",
        "departments",
        "complaints",
        "complaint_updates",
        "assignments",
        "notifications",
        "escalations",
        "complaint_embeddings",
    }
    assert set(COLLECTIONS) == expected_8
    assert len(COLLECTIONS) == 8


def test_enum_values():
    """Verifies all enumeration values match the approved specification."""
    # Roles
    assert set(r.value for r in UserRole) == {"citizen", "staff", "supervisor", "admin"}

    # Complaint Statuses
    expected_statuses = {
        "SUBMITTED",
        "PROCESSING",
        "CLASSIFIED",
        "DUPLICATE",
        "PRIORITIZED",
        "ASSIGNED",
        "IN_PROGRESS",
        "ESCALATED",
        "RESOLVED",
        "REJECTED",
    }
    assert set(s.value for s in ComplaintStatus) == expected_statuses

    # Priorities
    assert set(p.value for p in ComplaintPriority) == {"LOW", "MEDIUM", "HIGH", "CRITICAL"}

    # Assignments
    assert set(a.value for a in AssignmentStatus) == {"PENDING", "ACCEPTED", "COMPLETED", "REJECTED"}

    # Notifications
    assert set(n.value for n in NotificationType) == {"EMAIL", "SMS", "PUSH", "IN_APP"}

    # Escalation Triggers & Statuses
    assert set(t.value for t in EscalationTriggerType) == {"SLA", "CRITICAL", "MANUAL"}
    assert set(s.value for s in EscalationStatus) == {"OPEN", "RESOLVED"}


def test_self_reference_prevention():
    """Verifies that a complaint cannot reference itself as duplicate_of."""
    cid = ObjectId()
    # Different ID or None should succeed without error
    validate_complaint_duplicate_reference(cid, None)
    validate_complaint_duplicate_reference(cid, ObjectId())

    # Self-reference must raise ValueError
    with pytest.raises(ValueError, match="Complaint cannot reference itself"):
        validate_complaint_duplicate_reference(cid, cid)


def test_ensure_object_id():
    """Verifies ObjectId conversion helper behaves correctly."""
    assert ensure_object_id(None) is None
    oid = ObjectId()
    assert ensure_object_id(oid) is oid
    assert ensure_object_id(str(oid)) == oid

    with pytest.raises(ValueError, match="Invalid ObjectId format"):
        ensure_object_id("invalid-hex-id")


def test_collection_validators_defined():
    """Verifies all 8 collections have valid JSON Schema validator definitions."""
    validators = get_collection_validators()
    assert len(validators) == 8
    for col in COLLECTIONS:
        assert col in validators
        assert "$jsonSchema" in validators[col]
        assert "required" in validators[col]["$jsonSchema"]
        assert "properties" in validators[col]["$jsonSchema"]
