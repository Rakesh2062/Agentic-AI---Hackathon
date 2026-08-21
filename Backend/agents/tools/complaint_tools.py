"""
Complaint Tools — CRUD helpers for complaint data.

Queries the canonical MongoDB complaints collection with automatic deterministic fallback.
"""

from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from database.connection import get_db
from database.collections import COMPLAINTS_COLLECTION, COMPLAINT_UPDATES_COLLECTION

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# In-memory fallback store for testing / offline environments
# ---------------------------------------------------------------------------
_MOCK_COMPLAINTS: dict[str, dict[str, Any]] = {
    "CMP-001": {
        "complaint_id": "CMP-001",
        "citizen_id": "CIT-100",
        "description": "Large pothole on Main Street near the market causing traffic issues.",
        "image_url": None,
        "latitude": 12.9716,
        "longitude": 77.5946,
        "address": "Main Street, Sector 5",
        "category": "roads",
        "priority": "HIGH",
        "status": "in_progress",
        "department": "Roads",
        "created_at": (datetime.now(timezone.utc) - timedelta(days=3)).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    },
    "CMP-002": {
        "complaint_id": "CMP-002",
        "citizen_id": "CIT-101",
        "description": "Blocked drainage causing water logging in residential area.",
        "image_url": None,
        "latitude": 12.9720,
        "longitude": 77.5950,
        "address": "2nd Cross Road, Sector 5",
        "category": "drainage",
        "priority": "MEDIUM",
        "status": "assigned",
        "department": "Drainage",
        "created_at": (datetime.now(timezone.utc) - timedelta(days=5)).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    },
    "CMP-003": {
        "complaint_id": "CMP-003",
        "citizen_id": "CIT-102",
        "description": "Streetlight not working near the park for two weeks.",
        "image_url": None,
        "latitude": 12.9750,
        "longitude": 77.5900,
        "address": "Park Avenue, Sector 8",
        "category": "streetlights",
        "priority": "LOW",
        "status": "submitted",
        "department": None,
        "created_at": (datetime.now(timezone.utc) - timedelta(days=1)).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    },
}


# ---------------------------------------------------------------------------
# Tool functions
# ---------------------------------------------------------------------------
async def get_complaint(complaint_id: str) -> Optional[dict[str, Any]]:
    """Retrieve a complaint by ID from MongoDB or in-memory fallback."""
    logger.info("get_complaint called for %s", complaint_id)
    try:
        db = get_db()
        doc = await db[COMPLAINTS_COLLECTION].find_one({
            "$or": [
                {"complaint_id": complaint_id},
                {"complaint_number": complaint_id},
            ]
        })
        if doc:
            doc["_id"] = str(doc["_id"])
            if "complaint_id" not in doc and "complaint_number" in doc:
                doc["complaint_id"] = doc["complaint_number"]
            return doc
    except Exception as exc:
        logger.warning("MongoDB get_complaint error (%s), using fallback", exc)
    return _MOCK_COMPLAINTS.get(complaint_id)


async def update_complaint(
    complaint_id: str, updates: dict[str, Any]
) -> Optional[dict[str, Any]]:
    """Update a complaint's fields in MongoDB or in-memory fallback."""
    logger.info("update_complaint called for %s with %s", complaint_id, updates)
    try:
        db = get_db()
        now = datetime.now(timezone.utc)
        updates["updated_at"] = now
        res = await db[COMPLAINTS_COLLECTION].update_one(
            {
                "$or": [
                    {"complaint_id": complaint_id},
                    {"complaint_number": complaint_id},
                ]
            },
            {"$set": updates},
        )
        if res.matched_count > 0:
            doc = await db[COMPLAINTS_COLLECTION].find_one({
                "$or": [
                    {"complaint_id": complaint_id},
                    {"complaint_number": complaint_id},
                ]
            })
            if doc:
                doc["_id"] = str(doc["_id"])
                if "complaint_id" not in doc and "complaint_number" in doc:
                    doc["complaint_id"] = doc["complaint_number"]
                return doc
    except Exception as exc:
        logger.warning("MongoDB update_complaint error (%s), using fallback", exc)

    if complaint_id in _MOCK_COMPLAINTS:
        _MOCK_COMPLAINTS[complaint_id].update(updates)
        _MOCK_COMPLAINTS[complaint_id]["updated_at"] = datetime.now(
            timezone.utc
        ).isoformat()
        return _MOCK_COMPLAINTS[complaint_id]
    return None


async def get_complaint_history(complaint_id: str) -> list[dict[str, Any]]:
    """Return the status-change history for a complaint."""
    logger.info("get_complaint_history called for %s", complaint_id)
    try:
        db = get_db()
        cursor = db[COMPLAINT_UPDATES_COLLECTION].find({
            "$or": [
                {"complaint_id": complaint_id},
                {"complaint_number": complaint_id},
            ]
        }).sort("created_at", 1)
        history = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            history.append(doc)
        if history:
            return history
    except Exception as exc:
        logger.warning("MongoDB get_complaint_history error (%s), using fallback", exc)

    complaint = _MOCK_COMPLAINTS.get(complaint_id)
    if complaint is None:
        return []
    return [
        {
            "complaint_id": complaint_id,
            "old_status": "submitted",
            "new_status": complaint.get("status", "submitted"),
            "changed_at": complaint.get("updated_at", datetime.now(timezone.utc).isoformat()),
            "changed_by": "system",
        }
    ]


async def get_all_complaints(
    filters: dict[str, Any] | None = None,
) -> list[dict[str, Any]]:
    """Return all complaints from MongoDB, optionally filtered, with fallback."""
    logger.info("get_all_complaints called with filters=%s", filters)
    try:
        db = get_db()
        query = {}
        if filters:
            for key, value in filters.items():
                if value is not None:
                    query[key] = value
        cursor = db[COMPLAINTS_COLLECTION].find(query)
        complaints = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            if "complaint_id" not in doc and "complaint_number" in doc:
                doc["complaint_id"] = doc["complaint_number"]
            complaints.append(doc)
        if complaints:
            return complaints
    except Exception as exc:
        logger.warning("MongoDB get_all_complaints error (%s), using fallback", exc)

    results = list(_MOCK_COMPLAINTS.values())
    if filters:
        for key, value in filters.items():
            results = [c for c in results if c.get(key) == value]
    return results
