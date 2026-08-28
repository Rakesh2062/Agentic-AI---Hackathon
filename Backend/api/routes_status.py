"""
Status routes — citizen-facing complaint tracking.
"""

import logging
from bson import ObjectId
from fastapi import APIRouter, HTTPException

from database.connection import get_db
from database.collections import COMPLAINTS_COLLECTION
from schemas.models import Case, StatusResponse

log = logging.getLogger(__name__)

router = APIRouter(prefix="/status", tags=["Status Tracking"])


def _normalise_case_for_tracking(case_doc: dict) -> dict:
    """Make legacy agent-state documents safe for the public tracker."""
    case_doc["_id"] = str(case_doc["_id"])
    case_doc.setdefault("complaint_id", case_doc.get("complaint_number", ""))
    case_doc.setdefault("description", case_doc.get("raw_text", ""))
    case_doc.setdefault("department", case_doc.get("admin_department_override") or case_doc.get("recommended_department"))
    case_doc.setdefault("status", case_doc.get("current_status", "submitted"))
    case_doc.setdefault("created_at", case_doc.get("submitted_at"))
    case_doc.setdefault("updated_at", case_doc.get("submitted_at"))

    # `classified` is an internal orchestration state, not a public status.
    if case_doc["status"] == "classified":
        case_doc["status"] = "under_review"

    history = case_doc.get("status_history") or []
    if not history:
        submitted_at = case_doc.get("submitted_at")
        history = [{
            "status": "submitted",
            "message": "Complaint received and queued for processing.",
            "timestamp": submitted_at,
            "updated_by": "CivicPulse Intake",
        }]
        if case_doc["status"] != "submitted":
            history.append({
                "status": case_doc["status"],
                "message": "AI analysis completed; the complaint is awaiting official review.",
                "timestamp": case_doc.get("updated_at") or submitted_at,
                "updated_by": "CivicPulse AI",
            })
    case_doc["status_history"] = history
    return case_doc


def _status_response(case_doc: dict) -> StatusResponse:
    """Build a tracking response without exposing internal database fields."""
    case_doc = _normalise_case_for_tracking(case_doc)
    case = Case(**case_doc)
    return StatusResponse(
        case_id=case.id or case_doc["_id"],
        complaint_id=case.complaint_id,
        status=case.status,
        message=case_doc.get("citizen_message") or "Your complaint is currently being processed.",
        department=case.department,
        priority=case.priority,
        last_updated=case_doc.get("updated_at"),
        history=case.status_history,
        confidence=case_doc.get("classification_confidence"),
        citizen_count=case_doc.get("citizen_count", 1),
        location=case_doc.get("location"),
        sla_deadline=case_doc.get("sla_deadline"),
        validatedSeverity=case_doc.get("validatedSeverity"),
        civicPointsAwarded=case_doc.get("civicPointsAwarded", 0),
        pointsBreakdown=case_doc.get("pointsBreakdown"),
    )


@router.get(
    "/case/{case_id}",
    response_model=StatusResponse,
    summary="Track case status (citizen-facing)",
    description="Returns plain-language status with full history.",
)
async def get_case_status(case_id: str):
    """Look up a case and return a citizen-friendly status explanation."""
    db = get_db()

    try:
        oid = ObjectId(case_id)
        query = {"_id": oid}
    except Exception:
        query = {"$or": [{"complaint_id": case_id}, {"complaint_number": case_id}]}

    case_doc = await db[COMPLAINTS_COLLECTION].find_one(query)

    if not case_doc:
        raise HTTPException(status_code=404, detail="Case not found")

    return _status_response(case_doc)


@router.get(
    "/complaint/{complaint_id}",
    response_model=StatusResponse,
    summary="Track status by complaint ID",
    description="Look up case status using the original complaint ID.",
)
async def get_status_by_complaint(complaint_id: str):
    """Look up a case by complaint_id and return status."""
    db = get_db()
    case_doc = await db[COMPLAINTS_COLLECTION].find_one({
        "$or": [
            {"complaint_id": complaint_id},
            {"complaint_number": complaint_id},
        ]
    })

    if not case_doc:
        raise HTTPException(
            status_code=404,
            detail=f"No case found for complaint {complaint_id}",
        )

    return _status_response(case_doc)
