"""
Status routes — citizen-facing complaint tracking.
"""

import logging
from bson import ObjectId
from fastapi import APIRouter, HTTPException

# from agents.status_explainer_agent import explain_status
from schemas.models import Case, StatusResponse

log = logging.getLogger(__name__)

router = APIRouter(prefix="/status", tags=["Status Tracking"])


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
        case_doc = await db.cases.find_one({"_id": ObjectId(case_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid case ID format")

    if not case_doc:
        raise HTTPException(status_code=404, detail="Case not found")

    case_doc["_id"] = str(case_doc["_id"])
    case = Case(**case_doc)

    # Use the pre-generated citizen message from the pipeline
    message = case_doc.get("citizen_message", "Your complaint is currently being processed.")

    return StatusResponse(
        case_id=case.id,  # type: ignore[arg-type]
        complaint_id=case.complaint_id,
        status=case.status,
        message=message,
        department=case.department,
        priority=case.priority,
        last_updated=case.updated_at,
        history=case.status_history,
    )


@router.get(
    "/complaint/{complaint_id}",
    response_model=StatusResponse,
    summary="Track status by complaint ID",
    description="Look up case status using the original complaint ID.",
)
async def get_status_by_complaint(complaint_id: str):
    """Look up a case by complaint_id and return status."""
    db = get_db()
    case_doc = await db.cases.find_one({"complaint_id": complaint_id})

    if not case_doc:
        raise HTTPException(
            status_code=404,
            detail=f"No case found for complaint {complaint_id}",
        )

    case_doc["_id"] = str(case_doc["_id"])
    case = Case(**case_doc)

    message = case_doc.get("citizen_message", "Your complaint is currently being processed.")

    return StatusResponse(
        case_id=case.id,  # type: ignore[arg-type]
        complaint_id=case.complaint_id,
        status=case.status,
        message=message,
        department=case.department,
        priority=case.priority,
        last_updated=case.updated_at,
        history=case.status_history,
    )
