import logging
from fastapi import APIRouter, HTTPException, status

from agents.orchestrator import Orchestrator
from database.connection import get_async_db as get_db
from database.collections import COMPLAINTS_COLLECTION
from schemas.models import CaseResponse, ComplaintCreate

log = logging.getLogger(__name__)

router = APIRouter(prefix="/complaints", tags=["Complaints"])


@router.post(
    "",
    response_model=CaseResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit a new civic complaint",
    description=(
        "Accepts text, optional images, and geolocation. "
        "Runs the full agentic pipeline (Classification → Duplicate → Priority → Routing) "
        "and returns a structured case with AI recommendations."
    ),
)
async def create_complaint(submission: ComplaintCreate):
    """Run the full orchestrator pipeline end-to-end."""
    log.info("POST /complaints — text: %.60s…", submission.raw_text)
    try:
        orchestrator = Orchestrator()
        result = await orchestrator.process_complaint(submission.to_agent_dict())
        
        case_data = result.state.model_dump()
        
        # Ensure canonical schema compatibility
        if "complaint_number" not in case_data or not case_data["complaint_number"]:
            case_data["complaint_number"] = case_data.get("complaint_id")
        if "created_at" not in case_data or not case_data["created_at"]:
            case_data["created_at"] = case_data.get("submitted_at")
        
        # Insert into canonical complaints collection
        db = get_db()
        inserted = await db[COMPLAINTS_COLLECTION].insert_one(case_data)
        case_data["_id"] = str(inserted.inserted_id)
        
        return case_data
    except HTTPException:
        raise
    except Exception as e:
        log.exception("Pipeline failed: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Pipeline error: {str(e)}",
        )


@router.get(
    "/{complaint_id}",
    response_model=CaseResponse,
    summary="Get case by complaint ID",
    description="Retrieve the case associated with a complaint. (Requires DB layer)",
)
async def get_complaint_case(complaint_id: str):
    """Look up the case created from a specific complaint."""
    db = get_db()
    case_doc = await db[COMPLAINTS_COLLECTION].find_one({
        "$or": [
            {"complaint_id": complaint_id},
            {"complaint_number": complaint_id},
        ]
    })

    if not case_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No case found for complaint {complaint_id}",
        )

    case_doc["_id"] = str(case_doc["_id"])
    return case_doc
