"""
Database Bridge Package.
Re-exports the canonical database layer without creating duplicate clients or connections.
"""

from db.database import (
    get_db,
    get_async_db,
    get_async_client,
    close_async_client,
    ping_async_db,
    COMPLAINTS_COLLECTION,
    DEPARTMENTS_COLLECTION,
    USERS_COLLECTION,
    COMPLAINT_UPDATES_COLLECTION,
    ASSIGNMENTS_COLLECTION,
    NOTIFICATIONS_COLLECTION,
    ESCALATIONS_COLLECTION,
    COMPLAINT_EMBEDDINGS_COLLECTION,
)

__all__ = [
    "get_db",
    "get_async_db",
    "get_async_client",
    "close_async_client",
    "ping_async_db",
    "COMPLAINTS_COLLECTION",
    "DEPARTMENTS_COLLECTION",
    "USERS_COLLECTION",
    "COMPLAINT_UPDATES_COLLECTION",
    "ASSIGNMENTS_COLLECTION",
    "NOTIFICATIONS_COLLECTION",
    "ESCALATIONS_COLLECTION",
    "COMPLAINT_EMBEDDINGS_COLLECTION",
]
