"""
AI Civic Complaint-to-Resolution Intelligence Platform
Database Module (MongoDB)
"""

from database.connection import (
    get_async_client,
    get_async_db,
    get_sync_client,
    get_sync_db,
    close_async_client,
    close_sync_client,
    ping_database,
)
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
    get_collection_validators,
)
from database.indexes import create_indexes

__all__ = [
    "get_async_client",
    "get_async_db",
    "get_sync_client",
    "get_sync_db",
    "close_async_client",
    "close_sync_client",
    "ping_database",
    "COLLECTIONS",
    "USERS_COLLECTION",
    "DEPARTMENTS_COLLECTION",
    "COMPLAINTS_COLLECTION",
    "COMPLAINT_UPDATES_COLLECTION",
    "ASSIGNMENTS_COLLECTION",
    "NOTIFICATIONS_COLLECTION",
    "ESCALATIONS_COLLECTION",
    "COMPLAINT_EMBEDDINGS_COLLECTION",
    "UserRole",
    "ComplaintStatus",
    "ComplaintPriority",
    "AssignmentStatus",
    "NotificationType",
    "EscalationTriggerType",
    "EscalationStatus",
    "get_collection_validators",
    "create_indexes",
]
