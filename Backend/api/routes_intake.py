"""
Intake routes — citizen-facing complaint submission + retrieval.
"""

import logging
from fastapi import APIRouter, HTTPException, status

from agents.orchestrator import Orchestrator
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

        if not result.success and not result.state:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Agent pipeline failed: {result.errors}",
            )

        # Map ProcessingResult → CaseResponse (frontend-compatible shape)
        case_response = CaseResponse.from_agent_result(result, submission)

        # --- DB persistence goes here once your teammate's DB layer is ready ---
        # db = get_db()
        # inserted = await db.cases.insert_one(case_response.model_dump())
        # case_response.id = str(inserted.inserted_id)
        # -----------------------------------------------------------------------

        return case_response

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
    # --- Requires DB layer from teammate ---
    # db = get_db()
    # case_doc = await db.cases.find_one({"complaint_id": complaint_id})
    # if not case_doc:
    #     raise HTTPException(status_code=404, detail=f"No case found for complaint {complaint_id}")
    # case_doc["_id"] = str(case_doc["_id"])
    # return case_doc
    raise HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail="DB lookup not yet available. Agents are live — submit a new complaint to test.",
    )
