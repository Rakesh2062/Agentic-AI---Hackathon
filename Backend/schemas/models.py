"""
Pydantic request/response models for the FastAPI routes.

These models form the contract between the frontend and the backend.
The agent layer uses agents/schemas/agent_outputs.py internally;
these are the HTTP-level models the API exposes.
"""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any, Optional

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Enums (mirror agents/config.py values for HTTP layer)
# ---------------------------------------------------------------------------
class Status(str, Enum):
    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    ASSIGNED = "assigned"
    IN_PROGRESS = "in_progress"
    INSPECTED = "inspected"
    RESOLVED = "resolved"
    CLOSED = "closed"
    ESCALATED = "escalated"
    DUPLICATE = "duplicate"


class Priority(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


# ---------------------------------------------------------------------------
# Sub-models
# ---------------------------------------------------------------------------
class StatusUpdate(BaseModel):
    status: Status
    message: str = ""
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    updated_by: str = "System"


class LocationInfo(BaseModel):
    lat: Optional[float] = None
    lng: Optional[float] = None
    address: Optional[str] = None
    ward: Optional[str] = None
    zone: Optional[str] = None


class PriorityBreakdown(BaseModel):
    score: float = 0.0
    level: str = "MEDIUM"
    factors: list[dict[str, Any]] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Request Models
# ---------------------------------------------------------------------------
class ComplaintCreate(BaseModel):
    """
    Intake payload sent by the frontend when a citizen submits a complaint.
    Maps frontend fields (raw_text, location, etc.) to what the agent needs.
    """
    # Frontend sends 'raw_text'; the orchestrator expects 'description'
    raw_text: str = Field(..., description="Full complaint text from the citizen.")
    citizen_name: Optional[str] = None
    userId: Optional[str] = None
    category: Optional[str] = None
    custom_category_specification: Optional[str] = None
    location: Optional[LocationInfo] = None
    image_url: Optional[str] = None
    attachments: list[str] = Field(default_factory=list)

    def to_agent_dict(self) -> dict:
        """Convert to the dict format expected by orchestrator.process_complaint()."""
        import uuid
        from datetime import timezone

        loc = self.location
        return {
            "complaint_id": f"CMP-{uuid.uuid4().hex[:8].upper()}",
            "citizen_id": self.userId or "anonymous",
            "description": self.raw_text,
            "image_url": self.image_url,
            "latitude": loc.lat if loc else None,
            "longitude": loc.lng if loc else None,
            "address": loc.address if loc else None,
            "submitted_at": datetime.now(timezone.utc),
        }


class CaseUpdateRequest(BaseModel):
    """Payload for PATCH /dashboard/cases/{case_id}."""
    status: Status
    message: Optional[str] = None
    updated_by: str = "Authorized Civic Official"
    resolution_photo: Optional[str] = None


class ValidateComplaintRequest(BaseModel):
    """Payload for POST /dashboard/cases/{case_id}/validate."""
    validatedSeverity: Priority = Priority.MEDIUM
    officerName: str = "Civic Official"
    highPublicImpact: bool = False
    isRecurringProblem: bool = False


# ---------------------------------------------------------------------------
# Response Models
# ---------------------------------------------------------------------------
class CaseResponse(BaseModel):
    """
    Full case object returned to the frontend after agent processing.
    Maps ComplaintState + agent results to the shape the frontend expects.
    """
    id: Optional[str] = None
    complaint_id: str
    citizen_id: Optional[str] = None
    citizen_name: Optional[str] = None
    raw_text: str = ""
    category: Optional[str] = None
    subcategory: Optional[str] = None
    sub_category: Optional[str] = None
    summary: Optional[str] = None
    confidence: Optional[float] = None
    department: Optional[str] = None
    priority: Optional[str] = None
    status: Status = Status.SUBMITTED
    status_history: list[StatusUpdate] = Field(default_factory=list)
    location: Optional[LocationInfo] = None
    priority_breakdown: Optional[PriorityBreakdown] = None
    citizen_message: Optional[str] = None
    resolution_summary: Optional[str] = None
    should_escalate: Optional[bool] = None
    is_duplicate: Optional[bool] = None
    duplicate_of: Optional[str] = None
    similar_complaints: list[dict] = Field(default_factory=list)
    sla_deadline: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    audit_events: list[dict] = Field(default_factory=list)
    processing_errors: list[str] = Field(default_factory=list)

    @classmethod
    def from_agent_result(cls, result, original_request: ComplaintCreate) -> "CaseResponse":
        """
        Map a ProcessingResult (from the Orchestrator) into a CaseResponse
        that the frontend can parse directly.
        """
        from datetime import timezone
        state = result.state
        now = datetime.now(timezone.utc)

        # Build status history mimicking the frontend's shape
        history = [
            StatusUpdate(
                status=Status.SUBMITTED,
                message="Complaint captured and successfully parsed by AI Intake Agent.",
                timestamp=state.submitted_at or now,
                updated_by="AI IntakeAgent",
            )
        ]

        if state.category:
            history.append(StatusUpdate(
                status=Status.UNDER_REVIEW,
                message=(
                    f"AI Classification categorized as {state.category.value} "
                    f"and scored priority level as {state.priority.value if state.priority else 'N/A'}. "
                    "Pending Official Validation."
                ),
                timestamp=now,
                updated_by="AI PrioritizationAgent",
            ))

        # Priority breakdown
        priority_breakdown = None
        if state.priority_score is not None:
            factors = [
                {"factor": f, "points": 0, "description": ""}
                for f in (state.priority_factors or [])
            ]
            priority_breakdown = PriorityBreakdown(
                score=state.priority_score,
                level=state.priority.value if state.priority else "MEDIUM",
                factors=factors,
            )

        # Location
        location = None
        if original_request.location:
            location = original_request.location
        elif state.address:
            location = LocationInfo(
                lat=state.latitude,
                lng=state.longitude,
                address=state.address,
            )

        return cls(
            id=state.complaint_id,
            complaint_id=state.complaint_id,
            citizen_id=state.citizen_id,
            citizen_name=original_request.citizen_name,
            raw_text=state.description,
            category=state.category.value if state.category else None,
            subcategory=state.subcategory,
            sub_category=state.subcategory,
            summary=state.ai_summary,
            confidence=state.classification_confidence,
            department=state.effective_department(),
            priority=state.effective_priority().value if state.effective_priority() else None,
            status=Status.UNDER_REVIEW if not state.is_duplicate else Status.DUPLICATE,
            status_history=history,
            location=location,
            priority_breakdown=priority_breakdown,
            citizen_message=state.citizen_message,
            resolution_summary=state.resolution_summary,
            should_escalate=state.should_escalate,
            is_duplicate=state.is_duplicate,
            duplicate_of=state.duplicate_of,
            similar_complaints=[s.model_dump() for s in state.similar_complaints],
            created_at=state.submitted_at or now,
            updated_at=now,
            audit_events=[e.model_dump() for e in state.audit_events],
            processing_errors=state.processing_errors,
        )


class StatusResponse(BaseModel):
    """Citizen-facing status tracking response."""
    case_id: Optional[str]
    complaint_id: str
    status: Status
    message: str
    department: Optional[str] = None
    priority: Optional[str] = None
    last_updated: Optional[datetime] = None
    history: list[StatusUpdate] = Field(default_factory=list)


class DepartmentStats(BaseModel):
    department: str
    total_cases: int = 0
    open_cases: int = 0
    in_progress: int = 0
    resolved: int = 0
    escalated: int = 0
    avg_resolution_hours: Optional[float] = None


class AnalyticsHotspot(BaseModel):
    location: dict
    total_complaints: int = 0
    open_cases: int = 0
    resolved_cases: int = 0
    top_category: Optional[str] = None
    complaint_ids: list[str] = Field(default_factory=list)


class Case(BaseModel):
    """Full internal case model (used when reading from DB)."""
    id: Optional[str] = None
    complaint_id: str
    description: str = ""
    raw_text: str = ""
    status: Status = Status.SUBMITTED
    department: Optional[str] = None
    priority: Optional[str] = None
    citizen_message: Optional[str] = None
    resolution_summary: Optional[str] = None
    status_history: list[StatusUpdate] = Field(default_factory=list)
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
