"""
ComplaintState — the shared, serializable state object that flows through
the orchestrator and every agent in the pipeline.

Each agent reads what it needs from the state, writes its results back,
and the orchestrator passes the updated state to the next agent.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field

from agents.config import (
    ComplaintCategory,
    ComplaintStatus,
    PriorityLevel,
)


class AuditEvent(BaseModel):
    """A single audit-trail entry produced by an agent execution."""

    agent_name: str
    started_at: datetime
    completed_at: datetime
    success: bool
    input_summary: str = ""
    output_summary: str = ""
    confidence: Optional[float] = None
    error: Optional[str] = None


class SimilarComplaint(BaseModel):
    """A candidate complaint returned by the similarity search."""

    complaint_id: str
    similarity_score: float
    category: Optional[str] = None
    description_snippet: str = ""
    location: Optional[str] = None
    created_at: Optional[datetime] = None


class ComplaintState(BaseModel):
    """
    Central state object for a single complaint flowing through the AI
    agent pipeline.  It is fully serializable (JSON-safe) and suitable
    for storage, transmission, and inspection.
    """

    # ── Core complaint fields ──────────────────────────────────────────
    complaint_id: str = ""
    citizen_id: str = ""
    description: str = ""
    image_url: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = None
    submitted_at: Optional[datetime] = None

    # ── AI Classification ──────────────────────────────────────────────
    ai_summary: Optional[str] = None
    category: Optional[ComplaintCategory] = None
    subcategory: Optional[str] = None
    classification_confidence: Optional[float] = None

    # ── Duplicate Analysis ─────────────────────────────────────────────
    is_duplicate: Optional[bool] = None
    duplicate_of: Optional[str] = None
    duplicate_confidence: Optional[float] = None
    similar_complaints: list[SimilarComplaint] = Field(default_factory=list)

    # ── Priority Analysis ──────────────────────────────────────────────
    priority: Optional[PriorityLevel] = None
    priority_score: Optional[float] = None
    priority_reason: Optional[str] = None
    priority_factors: list[str] = Field(default_factory=list)

    # ── Routing ────────────────────────────────────────────────────────
    recommended_department: Optional[str] = None
    routing_reason: Optional[str] = None
    routing_confidence: Optional[float] = None

    # ── Escalation ─────────────────────────────────────────────────────
    should_escalate: Optional[bool] = None
    escalation_reason: Optional[str] = None
    recommended_action: Optional[str] = None

    # ── Resolution ─────────────────────────────────────────────────────
    resolution_summary: Optional[str] = None
    citizen_message: Optional[str] = None
    next_steps: list[str] = Field(default_factory=list)

    # ── Admin overrides ────────────────────────────────────────────────
    admin_department_override: Optional[str] = None
    admin_priority_override: Optional[PriorityLevel] = None
    admin_notes: Optional[str] = None

    # ── Workflow ───────────────────────────────────────────────────────
    current_status: ComplaintStatus = ComplaintStatus.SUBMITTED
    processing_errors: list[str] = Field(default_factory=list)
    audit_events: list[AuditEvent] = Field(default_factory=list)

    # ── Helpers ────────────────────────────────────────────────────────
    def add_audit_event(self, event: AuditEvent) -> None:
        self.audit_events.append(event)

    def add_error(self, error_msg: str) -> None:
        self.processing_errors.append(error_msg)

    def effective_department(self) -> Optional[str]:
        """Return the admin override if present, else the AI recommendation."""
        return self.admin_department_override or self.recommended_department

    def effective_priority(self) -> Optional[PriorityLevel]:
        """Return the admin override if present, else the AI recommendation."""
        return self.admin_priority_override or self.priority
