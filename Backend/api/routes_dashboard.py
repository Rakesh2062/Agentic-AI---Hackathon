"""
Dashboard routes — department-facing case queues and state transitions.
"""

import logging
from datetime import datetime, timezone
from typing import Optional

from bson import ObjectId
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from schemas.models import (
    CaseResponse,
    CaseUpdateRequest,
    DepartmentStats,
    Priority,
    Status,
    StatusUpdate,
)
from agents.config import CATEGORY_DEPARTMENT_MAP
from database.connection import get_db
from database.collections import COMPLAINTS_COLLECTION, COMPLAINT_UPDATES_COLLECTION

USERS_COLLECTION = "users"


class ValidateComplaintRequest(BaseModel):
    validatedSeverity: str = "MEDIUM"
    officerName: str = "Civic Official"
    highPublicImpact: bool = False
    isRecurringProblem: bool = False

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

# Second router for user-scoped complaint queries
user_router = APIRouter(prefix="/user", tags=["User Complaints"])


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
    "/cases",
    response_model=list[CaseResponse],
    summary="Get all cases (officials only)",
    description="Returns all complaints stored in MongoDB, for the official dashboard.",
)
async def get_all_cases(
    status_filter: Status | None = Query(None, alias="status"),
    limit: int = Query(100, le=500),
    skip: int = Query(0, ge=0),
):
    """Fetch all cases for the official dashboard queue."""
    db = get_db()

    query: dict = {}
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
        doc["id"] = doc["_id"]  # Map to Pydantic CaseResponse.id field
        if "complaint_id" not in doc and "complaint_number" in doc:
            doc["complaint_id"] = doc["complaint_number"]
        cases.append(doc)

    return cases


@router.post(
    "/cases/{case_id}/validate",
    summary="Validate a complaint and award civic points",
    description="Official validates a complaint, sets severity, and awards civic points to the reporting citizen.",
)
async def validate_complaint(case_id: str, validation: ValidateComplaintRequest):
    """Validate a complaint and award multi-factor civic points."""
    db = get_db()

    try:
        oid = ObjectId(case_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid case ID format")

    case_doc = await db[COMPLAINTS_COLLECTION].find_one({"_id": oid})
    if not case_doc:
        raise HTTPException(status_code=404, detail="Case not found")

    if case_doc.get("civicPointsAwarded") is not None:
        raise HTTPException(
            status_code=400,
            detail="This complaint has already been validated and points have been awarded."
        )

    severity = validation.validatedSeverity.upper()
    base_points = {"CRITICAL": 50, "HIGH": 30, "MEDIUM": 15, "LOW": 5}.get(severity, 15)
    evidence_bonus = 5 if case_doc.get("attachments") else 0
    impact_bonus = 10 if validation.highPublicImpact else 0
    recurring_bonus = 5 if validation.isRecurringProblem else 0
    total_points = base_points + evidence_bonus + impact_bonus + recurring_bonus

    points_reason = (
        f"+{base_points} Validated {severity} severity"
        + (f" +{evidence_bonus} Quality Evidence" if evidence_bonus else "")
        + (f" +{impact_bonus} High Public Impact" if impact_bonus else "")
        + (f" +{recurring_bonus} Recurring Infrastructure" if recurring_bonus else "")
    )

    now = datetime.now(timezone.utc)
    current_status = case_doc.get("status", "under_review")
    status_entry = {
        "status": current_status,
        "message": f"Officially validated by {validation.officerName}. Awarded +{total_points} Civic Points. {points_reason}",
        "timestamp": now.isoformat(),
        "updated_by": validation.officerName or "Civic Official",
    }

    await db[COMPLAINTS_COLLECTION].update_one(
        {"_id": oid},
        {
            "$set": {
                "validatedSeverity": severity,
                "civicPointsAwarded": total_points,
                "pointsBreakdown": {
                    "basePoints": base_points,
                    "evidenceBonus": evidence_bonus,
                    "impactBonus": impact_bonus,
                    "recurringBonus": recurring_bonus,
                    "reason": points_reason,
                },
                "updated_at": now,
            },
            "$push": {"status_history": status_entry},
        },
    )

    # Award points to the citizen who filed the complaint
    citizen_id = case_doc.get("userId") or case_doc.get("citizen_id")
    complaint_id_str = case_doc.get("complaint_id", "")

    if citizen_id and len(citizen_id) == 24:
        try:
            citizen_oid = ObjectId(citizen_id)
            citizen = await db[USERS_COLLECTION].find_one({"_id": citizen_oid})
            if citizen and citizen.get("role") != "official":
                # Prevent duplicate points
                existing_history = citizen.get("pointHistory", [])
                already_awarded = any(tx.get("caseId") == complaint_id_str for tx in existing_history)
                if not already_awarded:
                    new_tx = {
                        "id": f"pt_{ObjectId()}",
                        "caseId": complaint_id_str,
                        "title": case_doc.get("summary") or case_doc.get("raw_text", "")[:80],
                        "reason": points_reason,
                        "points": total_points,
                        "date": now.strftime("%b %d, %Y"),
                        "timestamp": now.isoformat(),
                        "status": "Validated ✓",
                    }
                    await db[USERS_COLLECTION].update_one(
                        {"_id": citizen_oid},
                        {
                            "$inc": {
                                "civicPoints": total_points,
                                "reportsValidated": 1,
                                "estimatedImpacted": total_points * 20,
                            },
                            "$push": {"pointHistory": {"$each": [new_tx], "$position": 0}},
                        },
                    )
        except Exception as e:
            log.warning("Failed to award points to citizen %s: %s", citizen_id, e)

    updated = await db[COMPLAINTS_COLLECTION].find_one({"_id": oid})
    updated["_id"] = str(updated["_id"])
    updated["id"] = updated["_id"]  # Map to Pydantic CaseResponse.id field
    if "complaint_id" not in updated and "complaint_number" in updated:
        updated["complaint_id"] = updated["complaint_number"]

    return {
        "updatedCase": updated,
        "pointsAwarded": total_points,
        "pointsReason": points_reason,
        "userId": citizen_id,
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
        doc["id"] = doc["_id"]  # Map to Pydantic CaseResponse.id field
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
    updated["id"] = updated["_id"]  # Map to Pydantic CaseResponse.id field
    if "complaint_id" not in updated and "complaint_number" in updated:
        updated["complaint_id"] = updated["complaint_number"]
    return updated


# ---------------------------------------------------------------------------
# User-scoped complaint routes
# ---------------------------------------------------------------------------

@user_router.get(
    "/{user_id}/complaints",
    response_model=list[CaseResponse],
    summary="Get complaints filed by a specific user",
    description="Returns all DB-stored complaints where userId or citizen_id matches.",
)
async def get_user_complaints(
    user_id: str,
    limit: int = Query(100, le=500),
    skip: int = Query(0, ge=0),
):
    """Fetch complaints filed by a specific user."""
    db = get_db()

    cursor = (
        db[COMPLAINTS_COLLECTION]
        .find({"$or": [{"userId": user_id}, {"citizen_id": user_id}]})
        .sort("created_at", -1)
        .skip(skip)
        .limit(limit)
    )

    cases = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        doc["id"] = doc["_id"]  # Map to Pydantic CaseResponse.id field
        if "complaint_id" not in doc and "complaint_number" in doc:
            doc["complaint_id"] = doc["complaint_number"]
        cases.append(doc)

    return cases
