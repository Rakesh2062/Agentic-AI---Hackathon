"""
Orchestrator — coordinates the agent pipeline for civic complaint processing.

The orchestrator provides several entry points that FastAPI (or any caller)
can invoke:

  • process_complaint()   — full intake pipeline (classify → dedup → prioritize → route)
  • check_escalation()    — evaluate whether a complaint should be escalated
  • generate_resolution() — produce citizen-facing resolution explanation
  • run_analytics()       — batch analysis for recurring-problem detection
  • admin_override()      — record an admin's accept/modify/reject decision

Each method accepts and returns plain Python / Pydantic objects, keeping
the layer independent from FastAPI, SQLAlchemy, and React.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any, Optional

from agents.config import (
    BaseLLMClient,
    ComplaintStatus,
    LLMConfig,
    PriorityLevel,
    get_llm_client,
)
from agents.state.complaint_state import ComplaintState
from agents.schemas.agent_outputs import (
    AnalyticsResult,
    ClassificationResult,
    DuplicateResult,
    EscalationResult,
    PriorityResult,
    ResolutionResult,
    RoutingResult,
)
from agents.classification.agent import ClassificationAgent
from agents.duplicate.agent import DuplicateAgent
from agents.priority.agent import PriorityAgent
from agents.routing.agent import RoutingAgent
from agents.escalation.agent import EscalationAgent
from agents.resolution.agent import ResolutionAgent
from agents.analytics.agent import AnalyticsAgent
from agents.tools import location_tools, notification_tools

logger = logging.getLogger(__name__)


class ProcessingResult:
    """Container for the full pipeline output — returned to the caller."""

    def __init__(self) -> None:
        self.state: ComplaintState | None = None
        self.classification: ClassificationResult | None = None
        self.duplicate: DuplicateResult | None = None
        self.priority: PriorityResult | None = None
        self.routing: RoutingResult | None = None
        self.escalation: EscalationResult | None = None
        self.resolution: ResolutionResult | None = None
        self.analytics: AnalyticsResult | None = None
        self.success: bool = True
        self.errors: list[str] = []

    def to_dict(self) -> dict[str, Any]:
        """Serialize everything to a plain dict for JSON responses."""
        return {
            "success": self.success,
            "errors": self.errors,
            "state": self.state.model_dump(mode="json") if self.state else None,
            "classification": (
                self.classification.model_dump() if self.classification else None
            ),
            "duplicate": (
                self.duplicate.model_dump() if self.duplicate else None
            ),
            "priority": (
                self.priority.model_dump() if self.priority else None
            ),
            "routing": (
                self.routing.model_dump() if self.routing else None
            ),
            "escalation": (
                self.escalation.model_dump() if self.escalation else None
            ),
            "resolution": (
                self.resolution.model_dump() if self.resolution else None
            ),
            "analytics": (
                self.analytics.model_dump() if self.analytics else None
            ),
        }


class Orchestrator:
    """
    Central coordinator for the AI agent pipeline.

    Usage::

        orchestrator = Orchestrator()
        result = await orchestrator.process_complaint({
            "complaint_id": "CMP-100",
            "citizen_id": "CIT-200",
            "description": "...",
        })
    """

    def __init__(self, llm_config: LLMConfig | None = None) -> None:
        self.llm: BaseLLMClient = get_llm_client(llm_config)
        self.classification_agent = ClassificationAgent(self.llm)
        self.duplicate_agent = DuplicateAgent(self.llm)
        self.priority_agent = PriorityAgent(self.llm)
        self.routing_agent = RoutingAgent(self.llm)
        self.escalation_agent = EscalationAgent(self.llm)
        self.resolution_agent = ResolutionAgent(self.llm)
        self.analytics_agent = AnalyticsAgent(self.llm)

    # ==================================================================
    # 1. FULL INTAKE PIPELINE
    # ==================================================================
    async def process_complaint(
        self, complaint_data: dict[str, Any]
    ) -> ProcessingResult:
        """
        Run the complete intake pipeline:
          Classification → Duplicate → Priority → Routing

        Returns a ProcessingResult with AI recommendations for admin review.
        """
        result = ProcessingResult()

        # Extract location fields if nested
        loc = complaint_data.get("location")
        lat = complaint_data.get("latitude")
        lng = complaint_data.get("longitude")
        addr = complaint_data.get("address")
        if isinstance(loc, dict):
            lat = lat if lat is not None else loc.get("lat")
            lng = lng if lng is not None else loc.get("lng")
            addr = addr if addr is not None else loc.get("address")
        elif hasattr(loc, "lat"):
            lat = lat if lat is not None else loc.lat
            lng = lng if lng is not None else loc.lng
            addr = addr if addr is not None else loc.address

        desc = complaint_data.get("description") or complaint_data.get("raw_text") or ""
        cid = complaint_data.get("complaint_id") or complaint_data.get("complaint_number") or ""

        # Build initial state
        state = ComplaintState(
            complaint_id=cid,
            citizen_id=complaint_data.get("citizen_id") or complaint_data.get("userId") or "anonymous",
            description=desc,
            image_url=complaint_data.get("image_url"),
            latitude=lat,
            longitude=lng,
            address=addr,
            submitted_at=complaint_data.get(
                "submitted_at", datetime.now(timezone.utc)
            ),
            current_status=ComplaintStatus.SUBMITTED,
        )

        # Reverse-geocode if we have coordinates but no address
        if state.latitude and state.longitude and not state.address:
            try:
                state.address = await location_tools.reverse_geocode(
                    state.latitude, state.longitude
                )
            except Exception as exc:
                logger.warning("Reverse geocode failed: %s", exc)

        # ── Step 1: Classification ─────────────────────────────────────
        logger.info("▶ Step 1: Classification")
        classification = await self.classification_agent.run(state)
        result.classification = classification

        # If classification confidence is too low, flag for admin review
        if classification.confidence < 0.4:
            logger.warning(
                "Low classification confidence (%.2f) — marking for admin review.",
                classification.confidence,
            )
            state.current_status = ComplaintStatus.UNDER_REVIEW

        state.current_status = ComplaintStatus.CLASSIFIED

        # ── Step 2: Duplicate Detection ────────────────────────────────
        logger.info("▶ Step 2: Duplicate Detection")
        duplicate = await self.duplicate_agent.run(state)
        result.duplicate = duplicate

        # If it's a clear duplicate, flag it and stop early
        if duplicate.is_duplicate and duplicate.confidence >= 0.8:
            logger.info(
                "Complaint flagged as duplicate of %s (conf=%.2f).",
                duplicate.duplicate_of,
                duplicate.confidence,
            )
            state.current_status = ComplaintStatus.DUPLICATE
            result.state = state
            result.success = True
            return result

        # ── Step 3: Priority Assessment ────────────────────────────────
        logger.info("▶ Step 3: Priority Assessment")
        priority = await self.priority_agent.run(state)
        result.priority = priority

        # ── Step 4: Department Routing ─────────────────────────────────
        logger.info("▶ Step 4: Department Routing")
        routing = await self.routing_agent.run(state)
        result.routing = routing

        # ── Conditional Step 5: Escalation check for critical ──────────
        if state.priority == PriorityLevel.CRITICAL:
            logger.info("▶ Step 5 (conditional): Escalation check — CRITICAL priority")
            escalation = await self.escalation_agent.run(state)
            result.escalation = escalation

        state.current_status = ComplaintStatus.UNDER_REVIEW
        result.state = state
        result.errors = list(state.processing_errors)
        result.success = not any(
            not e.success for e in state.audit_events
        )

        logger.info(
            "✅ Intake pipeline complete for %s — category=%s, priority=%s, dept=%s",
            state.complaint_id,
            state.category,
            state.priority,
            state.recommended_department,
        )
        return result

    # ==================================================================
    # 2. ESCALATION CHECK
    # ==================================================================
    async def check_escalation(
        self, state: ComplaintState
    ) -> EscalationResult:
        """Run the escalation agent on an existing complaint state."""
        logger.info("▶ Escalation check for %s", state.complaint_id)
        return await self.escalation_agent.run(state)

    # ==================================================================
    # 3. RESOLUTION GENERATION
    # ==================================================================
    async def generate_resolution(
        self,
        state: ComplaintState,
        admin_action: str,
        resolution_notes: str = "",
    ) -> ResolutionResult:
        """Generate resolution explanation after an admin action."""
        logger.info("▶ Resolution generation for %s", state.complaint_id)
        resolution = await self.resolution_agent.run(
            state,
            admin_action=admin_action,
            resolution_notes=resolution_notes,
        )

        # Send notification to the citizen
        if state.citizen_message:
            try:
                await notification_tools.notify_citizen(
                    citizen_id=state.citizen_id,
                    complaint_id=state.complaint_id,
                    message=state.citizen_message,
                )
            except Exception as exc:
                logger.warning("Notification failed: %s", exc)

        return resolution

    # ==================================================================
    # 4. ANALYTICS
    # ==================================================================
    async def run_analytics(
        self, filters: dict[str, Any] | None = None
    ) -> AnalyticsResult:
        """Run the analytics agent on historical complaint data."""
        logger.info("▶ Analytics run (filters=%s)", filters)
        return await self.analytics_agent.run(filters)

    # ==================================================================
    # 5. ADMIN HUMAN-IN-THE-LOOP: OVERRIDE / ACCEPT
    # ==================================================================
    async def admin_override(
        self,
        state: ComplaintState,
        *,
        department: str | None = None,
        priority: PriorityLevel | None = None,
        status: ComplaintStatus | None = None,
        notes: str | None = None,
    ) -> ComplaintState:
        """
        Apply admin decisions to a complaint state.

        This is the human-in-the-loop entry point.  The admin can:
        - Accept the AI recommendations (pass nothing)
        - Override department, priority, or status
        - Add notes
        """
        logger.info(
            "▶ Admin override for %s: dept=%s, priority=%s, status=%s",
            state.complaint_id,
            department,
            priority,
            status,
        )

        if department is not None:
            state.admin_department_override = department
        if priority is not None:
            state.admin_priority_override = priority
        if status is not None:
            state.current_status = status
        if notes is not None:
            state.admin_notes = notes

        # If complaint is being resolved, generate resolution explanation
        if status in (ComplaintStatus.RESOLVED, ComplaintStatus.CLOSED):
            await self.generate_resolution(
                state,
                admin_action=f"Complaint {status.value} by admin.",
                resolution_notes=notes or "",
            )

        return state
