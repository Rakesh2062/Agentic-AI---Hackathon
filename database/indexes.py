"""
MongoDB Index Definitions and Management.
Creates unique, single-field, compound, and geospatial indexes for all 8 collections.
"""

from typing import Any, Dict, List, Optional
import pymongo
from pymongo import ASCENDING, DESCENDING, IndexModel
from pymongo.database import Database

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


def get_index_specifications() -> Dict[str, List[IndexModel]]:
    """
    Returns the comprehensive index definitions for all 8 collections.
    """
    return {
        USERS_COLLECTION: [
            IndexModel([("email", ASCENDING)], unique=True, name="idx_users_email_unique"),
            IndexModel([("department_id", ASCENDING)], name="idx_users_department_id"),
            IndexModel([("role", ASCENDING)], name="idx_users_role"),
        ],
        DEPARTMENTS_COLLECTION: [
            IndexModel([("name", ASCENDING)], unique=True, name="idx_departments_name_unique"),
        ],
        COMPLAINTS_COLLECTION: [
            # Unique Index
            IndexModel([("complaint_number", ASCENDING)], unique=True, name="idx_complaints_number_unique"),
            # Single-field Indexes
            IndexModel([("user_id", ASCENDING)], name="idx_complaints_user_id"),
            IndexModel([("status", ASCENDING)], name="idx_complaints_status"),
            IndexModel([("category", ASCENDING)], name="idx_complaints_category"),
            IndexModel([("priority", ASCENDING)], name="idx_complaints_priority"),
            IndexModel([("department_id", ASCENDING)], name="idx_complaints_department_id"),
            IndexModel([("assigned_to", ASCENDING)], name="idx_complaints_assigned_to"),
            IndexModel([("created_at", DESCENDING)], name="idx_complaints_created_at"),
            IndexModel([("duplicate_of", ASCENDING)], name="idx_complaints_duplicate_of"),
            # Coordinate / Geospatial Indexing (without altering schema)
            IndexModel([("latitude", ASCENDING), ("longitude", ASCENDING)], name="idx_complaints_lat_long"),
            # Compound Indexes for Fast Filtering & Analytics
            IndexModel(
                [("category", ASCENDING), ("status", ASCENDING), ("created_at", DESCENDING)],
                name="idx_complaints_cat_status_date",
            ),
            IndexModel(
                [("department_id", ASCENDING), ("status", ASCENDING), ("priority", ASCENDING)],
                name="idx_complaints_dept_status_priority",
            ),
        ],
        COMPLAINT_UPDATES_COLLECTION: [
            IndexModel([("complaint_id", ASCENDING)], name="idx_updates_complaint_id"),
            IndexModel([("is_ai_action", ASCENDING)], name="idx_updates_is_ai_action"),
            IndexModel([("created_at", DESCENDING)], name="idx_updates_created_at"),
            IndexModel(
                [("complaint_id", ASCENDING), ("created_at", DESCENDING)],
                name="idx_updates_complaint_created",
            ),
        ],
        ASSIGNMENTS_COLLECTION: [
            IndexModel([("complaint_id", ASCENDING)], name="idx_assignments_complaint_id"),
            IndexModel([("department_id", ASCENDING)], name="idx_assignments_department_id"),
            IndexModel([("assigned_to", ASCENDING)], name="idx_assignments_assigned_to"),
            IndexModel([("status", ASCENDING)], name="idx_assignments_status"),
            IndexModel(
                [("assigned_to", ASCENDING), ("status", ASCENDING)],
                name="idx_assignments_assigned_to_status",
            ),
        ],
        NOTIFICATIONS_COLLECTION: [
            IndexModel([("user_id", ASCENDING)], name="idx_notifications_user_id"),
            IndexModel([("complaint_id", ASCENDING)], name="idx_notifications_complaint_id"),
            IndexModel([("is_read", ASCENDING)], name="idx_notifications_is_read"),
            IndexModel(
                [("user_id", ASCENDING), ("is_read", ASCENDING), ("created_at", DESCENDING)],
                name="idx_notifications_user_read_date",
            ),
        ],
        ESCALATIONS_COLLECTION: [
            IndexModel([("complaint_id", ASCENDING)], name="idx_escalations_complaint_id"),
            IndexModel([("trigger_type", ASCENDING)], name="idx_escalations_trigger_type"),
            IndexModel([("status", ASCENDING)], name="idx_escalations_status"),
            IndexModel(
                [("status", ASCENDING), ("trigger_type", ASCENDING)],
                name="idx_escalations_status_trigger",
            ),
        ],
        COMPLAINT_EMBEDDINGS_COLLECTION: [
            IndexModel([("complaint_id", ASCENDING)], unique=True, name="idx_embeddings_complaint_unique"),
            IndexModel([("model_name", ASCENDING)], name="idx_embeddings_model_name"),
            IndexModel([("created_at", DESCENDING)], name="idx_embeddings_created_at"),
        ],
    }


def get_atlas_vector_index_spec(
    dimensions: int = 768, similarity: str = "cosine"
) -> Dict[str, Any]:
    """
    Returns the MongoDB Atlas Vector Search Index definition for `complaint_embeddings`.
    """
    return {
        "name": "complaint_vector_index",
        "type": "vectorSearch",
        "definition": {
            "fields": [
                {
                    "type": "vector",
                    "path": "embedding",
                    "numDimensions": dimensions,
                    "similarity": similarity,
                }
            ]
        },
    }


def create_indexes(db: Database) -> Dict[str, List[str]]:
    """
    Creates all defined indexes across all 8 collections in the provided database.
    Returns a dictionary mapping collection name to list of created index names.
    """
    specs = get_index_specifications()
    results: Dict[str, List[str]] = {}

    for coll_name, index_models in specs.items():
        collection = db[coll_name]
        try:
            created_names = collection.create_indexes(index_models)
            results[coll_name] = created_names
        except Exception as e:
            results[coll_name] = [f"ERROR: {str(e)}"]

    return results
