"""
Department Tools — department lookup, SLA retrieval.

Mock implementation.  Replace with database queries later.
"""

from __future__ import annotations

import logging
from typing import Any, Optional

from agents.config import (
    CATEGORY_DEPARTMENT_MAP,
    Department,
    SLA_HOURS,
)

from database.connection import get_db
from database.collections import DEPARTMENTS_COLLECTION

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Fallback department data
# ---------------------------------------------------------------------------
_DEPARTMENTS: list[dict[str, Any]] = [
    {
        "id": "DEPT-01",
        "name": Department.WATER,
        "description": "Handles water supply, leaks, and quality issues.",
        "contact_email": "water@municipality.gov",
    },
    {
        "id": "DEPT-02",
        "name": Department.SANITATION,
        "description": "Handles waste collection, garbage, and sanitation.",
        "contact_email": "sanitation@municipality.gov",
    },
    {
        "id": "DEPT-03",
        "name": Department.ROADS,
        "description": "Handles road repairs, potholes, and traffic signage.",
        "contact_email": "roads@municipality.gov",
    },
    {
        "id": "DEPT-04",
        "name": Department.DRAINAGE,
        "description": "Handles drainage blockages and waterlogging.",
        "contact_email": "drainage@municipality.gov",
    },
    {
        "id": "DEPT-05",
        "name": Department.STREETLIGHTS,
        "description": "Handles streetlight installation and repair.",
        "contact_email": "streetlights@municipality.gov",
    },
    {
        "id": "DEPT-06",
        "name": Department.PUBLIC_FACILITIES,
        "description": "Handles parks, benches, public restrooms, and other facilities.",
        "contact_email": "facilities@municipality.gov",
    },
]


# ---------------------------------------------------------------------------
# Tool functions
# ---------------------------------------------------------------------------
async def get_departments() -> list[dict[str, Any]]:
    """Return the list of all departments from MongoDB or fallback."""
    logger.info("get_departments called")
    try:
        db = get_db()
        cursor = db[DEPARTMENTS_COLLECTION].find({})
        depts = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            if "id" not in doc:
                doc["id"] = doc.get("code") or doc["_id"]
            depts.append(doc)
        if depts:
            return depts
    except Exception as exc:
        logger.warning("MongoDB get_departments error (%s), using fallback", exc)
    return _DEPARTMENTS


async def get_department_for_category(category: str) -> Optional[str]:
    """Return the default department name for a complaint category."""
    logger.info("get_department_for_category called for %s", category)
    return CATEGORY_DEPARTMENT_MAP.get(category)


async def get_department_sla(
    department_name: str, priority: str
) -> Optional[int]:
    """Return the SLA deadline in hours for a department+priority combo."""
    logger.info(
        "get_department_sla called for dept=%s, priority=%s",
        department_name,
        priority,
    )
    return SLA_HOURS.get(priority)


async def get_department_by_name(name: str) -> Optional[dict[str, Any]]:
    """Lookup a single department by name from MongoDB or fallback."""
    logger.info("get_department_by_name called for %s", name)
    try:
        db = get_db()
        doc = await db[DEPARTMENTS_COLLECTION].find_one({
            "$or": [
                {"name": name},
                {"code": name},
            ]
        })
        if doc:
            doc["_id"] = str(doc["_id"])
            if "id" not in doc:
                doc["id"] = doc.get("code") or doc["_id"]
            return doc
    except Exception as exc:
        logger.warning("MongoDB get_department_by_name error (%s), using fallback", exc)
    for dept in _DEPARTMENTS:
        if dept["name"] == name:
            return dept
    return None
