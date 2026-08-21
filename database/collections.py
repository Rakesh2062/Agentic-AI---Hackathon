"""
MongoDB Collection Names, Schema Definitions, Enums, and JSON Schema Validators.
Strictly adheres to the 8-collection architecture for the Civic Complaint-to-Resolution Platform.
"""

from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional
from bson import ObjectId


# ==============================================================================
# Exact 8 Collection Names
# ==============================================================================
USERS_COLLECTION = "users"
DEPARTMENTS_COLLECTION = "departments"
COMPLAINTS_COLLECTION = "complaints"
COMPLAINT_UPDATES_COLLECTION = "complaint_updates"
ASSIGNMENTS_COLLECTION = "assignments"
NOTIFICATIONS_COLLECTION = "notifications"
ESCALATIONS_COLLECTION = "escalations"
COMPLAINT_EMBEDDINGS_COLLECTION = "complaint_embeddings"

COLLECTIONS = [
    USERS_COLLECTION,
    DEPARTMENTS_COLLECTION,
    COMPLAINTS_COLLECTION,
    COMPLAINT_UPDATES_COLLECTION,
    ASSIGNMENTS_COLLECTION,
    NOTIFICATIONS_COLLECTION,
    ESCALATIONS_COLLECTION,
    COMPLAINT_EMBEDDINGS_COLLECTION,
]


# ==============================================================================
# Enumerations
# ==============================================================================
class UserRole(str, Enum):
    CITIZEN = "citizen"
    STAFF = "staff"
    SUPERVISOR = "supervisor"
    ADMIN = "admin"


class ComplaintStatus(str, Enum):
    SUBMITTED = "SUBMITTED"
    PROCESSING = "PROCESSING"
    CLASSIFIED = "CLASSIFIED"
    DUPLICATE = "DUPLICATE"
    PRIORITIZED = "PRIORITIZED"
    ASSIGNED = "ASSIGNED"
    IN_PROGRESS = "IN_PROGRESS"
    ESCALATED = "ESCALATED"
    RESOLVED = "RESOLVED"
    REJECTED = "REJECTED"


class ComplaintPriority(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class AssignmentStatus(str, Enum):
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    COMPLETED = "COMPLETED"
    REJECTED = "REJECTED"


class NotificationType(str, Enum):
    EMAIL = "EMAIL"
    SMS = "SMS"
    PUSH = "PUSH"
    IN_APP = "IN_APP"


class EscalationTriggerType(str, Enum):
    SLA = "SLA"
    CRITICAL = "CRITICAL"
    MANUAL = "MANUAL"


class EscalationStatus(str, Enum):
    OPEN = "OPEN"
    RESOLVED = "RESOLVED"


# ==============================================================================
# Application-level Validation Rules
# ==============================================================================
def validate_complaint_duplicate_reference(
    complaint_id: Optional[ObjectId], duplicate_of: Optional[ObjectId]
) -> None:
    """
    Prevents a complaint from referencing itself as duplicate_of.
    Raises ValueError if complaint_id and duplicate_of are identical.
    """
    if complaint_id is not None and duplicate_of is not None:
        if str(complaint_id) == str(duplicate_of):
            raise ValueError(
                f"Complaint cannot reference itself as duplicate_of (ID: {complaint_id})"
            )


def ensure_object_id(val: Any) -> Optional[ObjectId]:
    """Ensures input value is converted to a valid bson ObjectId if present."""
    if val is None:
        return None
    if isinstance(val, ObjectId):
        return val
    if isinstance(val, str) and ObjectId.is_valid(val):
        return ObjectId(val)
    raise ValueError(f"Invalid ObjectId format: {val}")


# ==============================================================================
# MongoDB JSON Schema Validators for Collection Creation / Validation
# ==============================================================================
def get_collection_validators() -> Dict[str, Dict[str, Any]]:
    """
    Returns the MongoDB JSON Schema validator dictionaries for all 8 collections.
    """
    return {
        USERS_COLLECTION: {
            "$jsonSchema": {
                "bsonType": "object",
                "required": ["name", "email", "password_hash", "role", "is_active", "created_at"],
                "properties": {
                    "_id": {"bsonType": "objectId"},
                    "name": {"bsonType": "string"},
                    "email": {"bsonType": "string", "pattern": "^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\\.[a-zA-Z0-9-.]+$"},
                    "password_hash": {"bsonType": "string"},
                    "phone": {"bsonType": ["string", "null"]},
                    "role": {
                        "enum": [r.value for r in UserRole],
                        "description": "Must be one of citizen, staff, supervisor, admin",
                    },
                    "department_id": {"bsonType": ["objectId", "null"]},
                    "is_active": {"bsonType": "bool"},
                    "created_at": {"bsonType": "date"},
                },
            }
        },
        DEPARTMENTS_COLLECTION: {
            "$jsonSchema": {
                "bsonType": "object",
                "required": ["name", "description", "contact_email", "contact_phone", "default_sla_hours", "created_at"],
                "properties": {
                    "_id": {"bsonType": "objectId"},
                    "name": {"bsonType": "string"},
                    "description": {"bsonType": "string"},
                    "contact_email": {"bsonType": "string"},
                    "contact_phone": {"bsonType": "string"},
                    "default_sla_hours": {"bsonType": "int", "minimum": 1},
                    "created_at": {"bsonType": "date"},
                },
            }
        },
        COMPLAINTS_COLLECTION: {
            "$jsonSchema": {
                "bsonType": "object",
                "required": [
                    "complaint_number",
                    "user_id",
                    "description",
                    "category",
                    "priority",
                    "status",
                    "latitude",
                    "longitude",
                    "address",
                    "is_duplicate",
                    "created_at",
                    "updated_at",
                ],
                "properties": {
                    "_id": {"bsonType": "objectId"},
                    "complaint_number": {"bsonType": "string"},
                    "user_id": {"bsonType": "objectId"},
                    "description": {"bsonType": "string"},
                    "ai_summary": {"bsonType": ["string", "null"]},
                    "category": {"bsonType": "string"},
                    "subcategory": {"bsonType": ["string", "null"]},
                    "priority": {
                        "enum": [p.value for p in ComplaintPriority],
                        "description": "Must be LOW, MEDIUM, HIGH, or CRITICAL",
                    },
                    "priority_score": {"bsonType": ["double", "int", "null"]},
                    "status": {
                        "enum": [s.value for s in ComplaintStatus],
                        "description": "Must match one of the standard complaint statuses",
                    },
                    "latitude": {"bsonType": ["double", "int"]},
                    "longitude": {"bsonType": ["double", "int"]},
                    "address": {"bsonType": "string"},
                    "image_url": {"bsonType": ["string", "null"]},
                    "is_duplicate": {"bsonType": "bool"},
                    "duplicate_of": {"bsonType": ["objectId", "null"]},
                    "department_id": {"bsonType": ["objectId", "null"]},
                    "assigned_to": {"bsonType": ["objectId", "null"]},
                    "sla_deadline": {"bsonType": ["date", "null"]},
                    "created_at": {"bsonType": "date"},
                    "updated_at": {"bsonType": "date"},
                    "resolved_at": {"bsonType": ["date", "null"]},
                },
            }
        },
        COMPLAINT_UPDATES_COLLECTION: {
            "$jsonSchema": {
                "bsonType": "object",
                "required": ["complaint_id", "new_status", "action", "message", "is_ai_action", "created_at"],
                "properties": {
                    "_id": {"bsonType": "objectId"},
                    "complaint_id": {"bsonType": "objectId"},
                    "updated_by": {"bsonType": ["objectId", "null"]},
                    "old_status": {"bsonType": ["string", "null"]},
                    "new_status": {"bsonType": "string"},
                    "action": {"bsonType": "string"},
                    "message": {"bsonType": "string"},
                    "is_ai_action": {"bsonType": "bool"},
                    "created_at": {"bsonType": "date"},
                },
            }
        },
        ASSIGNMENTS_COLLECTION: {
            "$jsonSchema": {
                "bsonType": "object",
                "required": ["complaint_id", "department_id", "assigned_to", "assigned_by", "assigned_at", "status"],
                "properties": {
                    "_id": {"bsonType": "objectId"},
                    "complaint_id": {"bsonType": "objectId"},
                    "department_id": {"bsonType": "objectId"},
                    "assigned_to": {"bsonType": "objectId"},
                    "assigned_by": {"bsonType": "objectId"},
                    "assignment_reason": {"bsonType": ["string", "null"]},
                    "assigned_at": {"bsonType": "date"},
                    "accepted_at": {"bsonType": ["date", "null"]},
                    "completed_at": {"bsonType": ["date", "null"]},
                    "status": {
                        "enum": [s.value for s in AssignmentStatus],
                        "description": "Must be PENDING, ACCEPTED, COMPLETED, or REJECTED",
                    },
                },
            }
        },
        NOTIFICATIONS_COLLECTION: {
            "$jsonSchema": {
                "bsonType": "object",
                "required": ["user_id", "type", "title", "message", "is_read", "created_at"],
                "properties": {
                    "_id": {"bsonType": "objectId"},
                    "user_id": {"bsonType": "objectId"},
                    "complaint_id": {"bsonType": ["objectId", "null"]},
                    "type": {
                        "enum": [t.value for t in NotificationType],
                        "description": "Must be EMAIL, SMS, PUSH, or IN_APP",
                    },
                    "title": {"bsonType": "string"},
                    "message": {"bsonType": "string"},
                    "is_read": {"bsonType": "bool"},
                    "sent_at": {"bsonType": ["date", "null"]},
                    "created_at": {"bsonType": "date"},
                },
            }
        },
        ESCALATIONS_COLLECTION: {
            "$jsonSchema": {
                "bsonType": "object",
                "required": [
                    "complaint_id",
                    "reason",
                    "trigger_type",
                    "priority_before",
                    "priority_after",
                    "status",
                    "created_at",
                ],
                "properties": {
                    "_id": {"bsonType": "objectId"},
                    "complaint_id": {"bsonType": "objectId"},
                    "escalated_from": {"bsonType": ["objectId", "null"]},
                    "escalated_to": {"bsonType": ["objectId", "null"]},
                    "reason": {"bsonType": "string"},
                    "trigger_type": {
                        "enum": [t.value for t in EscalationTriggerType],
                        "description": "Must be SLA, CRITICAL, or MANUAL",
                    },
                    "priority_before": {"bsonType": "string"},
                    "priority_after": {"bsonType": "string"},
                    "status": {
                        "enum": [s.value for s in EscalationStatus],
                        "description": "Must be OPEN or RESOLVED",
                    },
                    "created_at": {"bsonType": "date"},
                    "resolved_at": {"bsonType": ["date", "null"]},
                },
            }
        },
        COMPLAINT_EMBEDDINGS_COLLECTION: {
            "$jsonSchema": {
                "bsonType": "object",
                "required": ["complaint_id", "embedding", "model_name", "created_at"],
                "properties": {
                    "_id": {"bsonType": "objectId"},
                    "complaint_id": {"bsonType": "objectId"},
                    "embedding": {
                        "bsonType": "array",
                        "items": {"bsonType": ["double", "int"]},
                        "description": "Numerical vector array representing semantic embeddings",
                    },
                    "model_name": {"bsonType": "string"},
                    "created_at": {"bsonType": "date"},
                },
            }
        },
    }
