"""
Dashboard routes — department-facing case queues and state transitions.
"""

from datetime import datetime

from bson import ObjectId
from fastapi import APIRouter, HTTPException, Query

from db.database import get_db
from schemas.models import (
    CaseResponse,
    CaseUpdateRequest,
    DepartmentStats,
    Status,
    StatusUpdate,
)
from utils.constants import CATEGORY_DEPARTMENT_MAP, STATUS_MESSAGES
from utils.logger import get_logger

log = get_logger(__name__)

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

    query: dict = {"department": department_name}
    if status_filter:
        query["status"] = status_filter.value

    cursor = (
        db.cases.find(query)
        .sort("created_at", -1)
        .skip(skip)
        .limit(limit)
    )

    cases = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
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
        {"$match": {"department": department_name}},
        {
            "$group": {
                "_id": None,
                "total_cases": {"$sum": 1},
                "open_cases": {
                    "$sum": {
                        "$cond": [
                            {"$in": ["$status", ["submitted", "under_review", "assigned"]]},
                            1, 0,
                        ]
                    }
                },
                "in_progress": {
                    "$sum": {"$cond": [{"$eq": ["$status", "in_progress"]}, 1, 0]}
                },
                "resolved": {
                    "$sum": {
                        "$cond": [
                            {"$in": ["$status", ["resolved", "closed"]]},
                            1, 0,
                        ]
                    }
                },
                "escalated": {
                    "$sum": {"$cond": [{"$eq": ["$status", "escalated"]}, 1, 0]}
                },
            }
        },
    ]

    results = await db.cases.aggregate(pipeline).to_list(1)

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

    case_doc = await db.cases.find_one({"_id": oid})
    if not case_doc:
        raise HTTPException(status_code=404, detail="Case not found")

    now = datetime.utcnow()

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
            complaint_id=case_doc.get("complaint_id", ""),
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

    await db.cases.update_one(
        {"_id": oid},
        {
            "$set": update_fields,
            "$push": {"status_history": status_entry.model_dump()},
        },
    )

    # Return updated case
    updated = await db.cases.find_one({"_id": oid})
    updated["_id"] = str(updated["_id"])
    return updated
