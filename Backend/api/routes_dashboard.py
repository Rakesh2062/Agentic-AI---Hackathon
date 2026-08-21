"""
Dashboard routes — department-facing case queues and state transitions.
"""

import logging
from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, HTTPException, Query

from schemas.models import (
    CaseResponse,
    CaseUpdateRequest,
    DepartmentStats,
    Status,
    StatusUpdate,
)
from agents.config import CATEGORY_DEPARTMENT_MAP
from database.connection import get_db
from database.collections import COMPLAINTS_COLLECTION, COMPLAINT_UPDATES_COLLECTION

log = logging.getLogger(__name__)

STATUS_MESSAGES = {
    "submitted": "Complaint submitted and queued for processing.",
    "under_review": "Your complaint is under official review.",
    "assigned": "Assigned to {department} for field dispatch.",
    "in_progress": "{department} crew is actively working on this.",
    "inspected": "Field supervisor inspection completed.",
    "resolved": "Issue resolved by {department}.",
    "closed": "Case archived after successful resolution.",
    "escalated": "Escalated to senior municipal leadership.",
}

router = APIRouter(prefix="/dashboard", tags=["Department Dashboard"])


@router.get(
    "/departments",
    summary="List all departments",
)
async def list_departments():
    """Return the department roster."""
    return {
        "departments": [
            {"id": cat, "name": name}
            for cat, name in CATEGORY_DEPARTMENT_MAP.items()
        ]
    }


@router.get(
    "/departments/{department_name}/cases",
    response_model=list[CaseResponse],
    summary="Get department case queue",
    description="Returns all cases assigned to a department, optionally filtered by status.",
)
async def get_department_cases(
    department_name: str,
    status_filter: Status | None = Query(None, alias="status"),
    limit: int = Query(50, le=200),
    skip: int = Query(0, ge=0),
):
    """Fetch cases for a department's Kanban board."""
    db = get_db()

    query: dict = {
        "$or": [
            {"department": department_name},
            {"category": department_name},
        ]
    }
    if status_filter:
        query["status"] = status_filter.value

    cursor = (
        db[COMPLAINTS_COLLECTION]
        .find(query)
        .sort("created_at", -1)
        .skip(skip)
        .limit(limit)
    )

    cases = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        if "complaint_id" not in doc and "complaint_number" in doc:
            doc["complaint_id"] = doc["complaint_number"]
        cases.append(doc)

    return cases


@router.get(
    "/departments/{department_name}/stats",
    response_model=DepartmentStats,
    summary="Department performance stats",
)
async def get_department_stats(department_name: str):
    """Aggregate stats for the department leaderboard."""
    db = get_db()

    pipeline = [
        {
            "$match": {
                "$or": [
                    {"department": department_name},
                    {"category": department_name},
                ]
            }
        },
        {
            "$group": {
                "_id": None,
                "total_cases": {"$sum": 1},
                "open_cases": {
                    "$sum": {
                        "$cond": [
                            {"$in": ["$status", ["submitted", "under_review", "assigned", "SUBMITTED", "PROCESSING", "CLASSIFIED", "PRIORITIZED", "ASSIGNED"]]},
                            1, 0,
                        ]
                    }
                },
                "in_progress": {
                    "$sum": {"$cond": [{"$in": ["$status", ["in_progress", "IN_PROGRESS"]]}, 1, 0]}
                },
                "resolved": {
                    "$sum": {
                        "$cond": [
                            {"$in": ["$status", ["resolved", "closed", "RESOLVED"]]},
                            1, 0,
                        ]
                    }
                },
                "escalated": {
                    "$sum": {"$cond": [{"$in": ["$status", ["escalated", "ESCALATED"]]}, 1, 0]}
                },
            }
        },
    ]

    results = await db[COMPLAINTS_COLLECTION].aggregate(pipeline).to_list(1)

    if not results:
        return DepartmentStats(
            department=department_name,
            total_cases=0,
            open_cases=0,
            in_progress=0,
            resolved=0,
            escalated=0,
        )

    r = results[0]
    return DepartmentStats(
        department=department_name,
        total_cases=r["total_cases"],
        open_cases=r["open_cases"],
        in_progress=r["in_progress"],
        resolved=r["resolved"],
        escalated=r["escalated"],
    )


@router.patch(
    "/cases/{case_id}",
    response_model=CaseResponse,
    summary="Update case status",
    description="Department-side state transition (e.g., in_progress → resolved).",
)
async def update_case_status(case_id: str, update: CaseUpdateRequest):
    """Transition a case to a new status."""
    db = get_db()

    try:
        oid = ObjectId(case_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid case ID format")

    case_doc = await db[COMPLAINTS_COLLECTION].find_one({"_id": oid})
    if not case_doc:
        raise HTTPException(status_code=404, detail="Case not found")

    now = datetime.now(timezone.utc)

    # Build status update entry
    message = update.message or STATUS_MESSAGES.get(
        update.status.value, "Status updated."
    )
    if "{department}" in message:
        message = message.format(department=case_doc.get("department", ""))

    status_entry = StatusUpdate(
        status=update.status,
        message=message,
        timestamp=now,
        updated_by=update.updated_by,
    )

    update_fields: dict = {
        "status": update.status.value,
        "updated_at": now,
    }
    if update.resolution_photo:
        update_fields["resolution_photo"] = update.resolution_photo

    # Trigger AI agent for resolution generation if applicable
    from agents.orchestrator import Orchestrator
    from agents.state.complaint_state import ComplaintState
    from agents.config import ComplaintStatus

    if update.status.value in ("resolved", "closed"):
        orchestrator = Orchestrator()
        # Reconstruct state from DB doc
        state = ComplaintState(
            complaint_id=case_doc.get("complaint_id", "") or case_doc.get("complaint_number", ""),
            description=case_doc.get("description", ""),
            current_status=ComplaintStatus.IN_PROGRESS
        )
        state = await orchestrator.admin_override(
            state,
            status=ComplaintStatus(update.status.value),
            notes=message
        )
        update_fields["resolution_summary"] = state.resolution_summary
        update_fields["citizen_message"] = state.citizen_message

    await db[COMPLAINTS_COLLECTION].update_one(
        {"_id": oid},
        {
            "$set": update_fields,
            "$push": {"status_history": status_entry.model_dump()},
        },
    )

    # Record update in complaint_updates collection
    audit_update = {
        "complaint_id": oid,
        "updated_by": None,
        "old_status": case_doc.get("status"),
        "new_status": update.status.value,
        "action": "STATUS_UPDATE",
        "message": message,
        "is_ai_action": False,
        "created_at": now,
    }
    try:
        await db[COMPLAINT_UPDATES_COLLECTION].insert_one(audit_update)
    except Exception as e:
        log.warning("Failed to record audit update log: %s", e)

    # Return updated case
    updated = await db[COMPLAINTS_COLLECTION].find_one({"_id": oid})
    updated["_id"] = str(updated["_id"])
    if "complaint_id" not in updated and "complaint_number" in updated:
        updated["complaint_id"] = updated["complaint_number"]
    return updated
