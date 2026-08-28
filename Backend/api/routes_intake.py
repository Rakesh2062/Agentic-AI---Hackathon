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

        # Store the public tracking fields in the same shape consumed by the
        # dashboard and citizen status endpoints.  The orchestrator keeps
        # these as `current_status` and `audit_events` internally.
        case_data["status"] = case_data.get("current_status", "submitted")
        case_data["department"] = (
            case_data.get("admin_department_override")
            or case_data.get("recommended_department")
        )
        case_data["updated_at"] = case_data.get("submitted_at")
        case_data["status_history"] = [
            {
                "status": "submitted",
                "message": "Complaint received and queued for AI processing.",
                "timestamp": case_data.get("submitted_at"),
                "updated_by": "CivicPulse Intake",
            },
            {
                "status": case_data["status"],
                "message": "AI analysis completed; the complaint is awaiting official review.",
                "timestamp": case_data.get("submitted_at"),
                "updated_by": "CivicPulse AI",
            },
        ]

        # Enrich with frontend-submitted fields for user filtering & display
        case_data["userId"] = submission.userId or ""
        case_data["citizen_name"] = submission.citizen_name or ""
        case_data["raw_text"] = submission.raw_text
        case_data["attachments"] = submission.attachments or []
        if submission.location:
            case_data["location"] = submission.location.model_dump()

        # Insert into canonical complaints collection
        db = get_db()
        case_data["_id"] = str(inserted.inserted_id)
        case_data["id"] = case_data["_id"]

        # Persist the embedding after MongoDB assigns the ObjectId.  The
        # duplicate agent can then find this report in later submissions.
        try:
            from agents.tools.search_tools import generate_embedding, store_embedding
            embedding = await generate_embedding(case_data.get("description", submission.raw_text))
            await store_embedding(case_data["_id"], embedding)
        except Exception as exc:
            log.warning("Could not store complaint embedding: %s", exc)

        # Update user's reportsSubmitted counter (non-critical)
        if submission.userId:
            from api.routes_auth import USERS_COLLECTION
            from bson import ObjectId as ObjId
            try:
                uid_oid = ObjId(submission.userId)
                await db[USERS_COLLECTION].update_one(
                    {"_id": uid_oid},
                    {"$inc": {"reportsSubmitted": 1}},
                )
            except Exception:
                pass

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
    case_doc["id"] = case_doc["_id"]
    return case_doc
