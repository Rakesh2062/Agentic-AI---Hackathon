"""
Intake routes — citizen-facing complaint submission + retrieval.
"""

from fastapi import APIRouter, HTTPException, status

from agents.orchestrator import Orchestrator
from db.database import get_db
from schemas.models import CaseResponse, ComplaintCreate
from utils.logger import get_logger

log = get_logger(__name__)

router = APIRouter(prefix="/complaints", tags=["Complaints"])


@router.post(
    "",
    response_model=CaseResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit a new civic complaint",
    description="Accepts text, optional images, and geolocation. "
    "Runs the full agentic pipeline and returns a structured Case.",
)
async def create_complaint(submission: ComplaintCreate):
    """Run the orchestrator pipeline end-to-end."""
    log.info("POST /complaints — text: %s…", submission.raw_text[:60])
    try:
        orchestrator = Orchestrator()
        result = await orchestrator.process_complaint(submission.model_dump())
        
        if not result.success:
            raise HTTPException(status_code=400, detail=f"Processing errors: {result.errors}")
            
        case_data = result.state.model_dump()
        
        # Insert into DB
        db = get_db()
        inserted = await db.cases.insert_one(case_data)
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
    description="Retrieve the case associated with a complaint.",
)
async def get_complaint_case(complaint_id: str):
    """Look up the case created from a specific complaint."""
    db = get_db()
    case_doc = await db.cases.find_one({"complaint_id": complaint_id})

    if not case_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No case found for complaint {complaint_id}",
        )

    case_doc["_id"] = str(case_doc["_id"])
    return case_doc
