"""
Structured Pydantic output schemas for every agent.

Each agent MUST return one of these objects — never raw strings.
"""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field

from agents.config import PriorityLevel


# ── Classification ─────────────────────────────────────────────────────────
class ClassificationResult(BaseModel):
    category: str = Field(..., description="One of the fixed complaint categories.")
    subcategory: str = Field("", description="More specific sub-classification.")
    summary: str = Field(..., description="AI-generated summary of the complaint.")
    confidence: float = Field(
        ..., ge=0.0, le=1.0, description="Classification confidence score."
    )


# ── Duplicate Detection ───────────────────────────────────────────────────
class DuplicateResult(BaseModel):
    is_duplicate: bool = Field(
        ..., description="Whether this complaint is a duplicate."
    )
    duplicate_of: Optional[str] = Field(
        None, description="Complaint ID of the original, if duplicate."
    )
    confidence: float = Field(
        ..., ge=0.0, le=1.0, description="Duplicate detection confidence."
    )
    reason: str = Field("", description="Explanation of the duplicate decision.")


# ── Priority ───────────────────────────────────────────────────────────────
class PriorityResult(BaseModel):
    priority: PriorityLevel = Field(
        ..., description="Priority level: LOW, MEDIUM, HIGH, CRITICAL."
    )
    priority_score: float = Field(
        ..., ge=0.0, le=100.0, description="Numeric urgency score 0-100."
    )
    reason: str = Field("", description="Why this priority was assigned.")
    factors: list[str] = Field(
        default_factory=list, description="Contributing factors."
    )


# ── Routing ────────────────────────────────────────────────────────────────
class RoutingResult(BaseModel):
    recommended_department: str = Field(
        ..., description="Department that should handle this complaint."
    )
    confidence: float = Field(
        ..., ge=0.0, le=1.0, description="Routing confidence."
    )
    reason: str = Field("", description="Routing rationale.")


# ── Escalation ─────────────────────────────────────────────────────────────
class EscalationResult(BaseModel):
    should_escalate: bool = Field(
        ..., description="Whether the complaint should be escalated."
    )
    reason: str = Field("", description="Why escalation is recommended.")
    recommended_action: str = Field(
        "", description="Suggested action for the admin."
    )


# ── Resolution ─────────────────────────────────────────────────────────────
class ResolutionResult(BaseModel):
    resolution_summary: str = Field(
        ..., description="Internal summary of the resolution."
    )
    citizen_message: str = Field(
        ..., description="Clear message to be sent to the citizen."
    )
    next_steps: list[str] = Field(
        default_factory=list,
        description="Remaining follow-up steps, if any.",
    )


# ── Analytics ──────────────────────────────────────────────────────────────
class InsightItem(BaseModel):
    type: str = Field(
        ...,
        description="Insight type, e.g. RECURRING_PROBLEM, TREND, HOTSPOT.",
    )
    category: Optional[str] = None
    location: Optional[str] = None
    count: int = 0
    severity: str = "MEDIUM"
    explanation: str = ""


class AnalyticsResult(BaseModel):
    insights: list[InsightItem] = Field(
        default_factory=list,
        description="List of analytical insights.",
    )
