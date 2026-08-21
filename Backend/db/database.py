"""
FastAPI Database Bridge Module.
Bridges the existing canonical MongoDB layer in database/ to the FastAPI backend
without creating a second MongoDB client, connection pool, or duplicate configuration.
"""

import os
import sys
from typing import Optional

# Ensure workspace root is in sys.path so the canonical 'database' package resolves
workspace_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
if workspace_root not in sys.path:
    sys.path.insert(0, workspace_root)

# Re-export exact connection functions from canonical database.connection
from database.connection import (
    get_async_client,
    get_async_db,
    close_async_client,
    ping_async_db,
    get_sync_client,
    get_sync_db,
    close_sync_client,
    ping_sync_db,
)

# Re-export collection names and enums from canonical database.collections
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
)

# Canonical alias expected by FastAPI routers (e.g. from db.database import get_db)
get_db = get_async_db
