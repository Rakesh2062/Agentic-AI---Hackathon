"""
Escalation Agent — determines whether a complaint should be escalated.

Uses deterministic SLA checks first, then LLM reasoning for edge cases.
Only RECOMMENDS escalation — never makes irreversible decisions.
"""

from __future__ import annotations

import json
import logging
from datetime import datetime, timezone

from agents.config import BaseLLMClient, PriorityLevel, SLA_HOURS
from agents.schemas.agent_outputs import EscalationResult
from agents.state.complaint_state import AuditEvent, ComplaintState
from agents.tools import department_tools
from agents.escalation.prompts import (
    ESCALATION_SYSTEM_PROMPT,
    build_escalation_prompt,
)

logger = logging.getLogger(__name__)


class EscalationAgent:
    """Evaluate whether a complaint needs escalation."""

    NAME = "EscalationAgent"

    def __init__(self, llm_client: BaseLLMClient) -> None:
        self.llm = llm_client

    async def run(self, state: ComplaintState) -> EscalationResult:
        started = datetime.now(timezone.utc)
        try:
            # ── Deterministic checks first ──
            deterministic = self._deterministic_check(state)
            if deterministic is not None:
                state.should_escalate = deterministic.should_escalate
                state.escalation_reason = deterministic.reason
                state.recommended_action = deterministic.recommended_action
                self._record_audit(state, started, True, deterministic)
                return deterministic

            # ── LLM-based evaluation for nuanced cases ──
            priority_str = state.priority.value if state.priority else "MEDIUM"
            category_str = state.category.value if state.category else "other"
            dept = state.effective_department()

            sla = await department_tools.get_department_sla(
                dept or "", priority_str
            )

            hours_open = 0.0
            if state.submitted_at:
                delta = datetime.now(timezone.utc) - state.submitted_at
                hours_open = delta.total_seconds() / 3600

            prompt = build_escalation_prompt(
                description=state.description,
                category=category_str,
                priority=priority_str,
                priority_score=state.priority_score or 0,
                status=state.current_status.value,
                department=dept,
                similar_count=len(state.similar_complaints),
                hours_open=hours_open,
                sla_hours=sla,
            )

            raw = await self.llm.generate(
                prompt, system_prompt=ESCALATION_SYSTEM_PROMPT
            )
            result = self._parse_response(raw)

            state.should_escalate = result.should_escalate
            state.escalation_reason = result.reason
            state.recommended_action = result.recommended_action

            self._record_audit(state, started, True, result)
            logger.info(
                "Escalation check complete: should_escalate=%s",
                result.should_escalate,
            )
            return result

        except Exception as exc:
            logger.exception("EscalationAgent failed")
            fallback = EscalationResult(
                should_escalate=False,
                reason=f"Escalation check failed: {exc}",
                recommended_action="Manual review recommended.",
            )
            state.should_escalate = False
            state.add_error(f"EscalationAgent error: {exc}")
            self._record_audit(state, started, False, fallback, str(exc))
            return fallback

    # ------------------------------------------------------------------
    def _deterministic_check(
        self, state: ComplaintState
    ) -> EscalationResult | None:
        """Apply rule-based triggers that don't need LLM reasoning."""
        priority = state.effective_priority()

        # Rule 1: CRITICAL priority → auto-recommend escalation
        if priority == PriorityLevel.CRITICAL:
            return EscalationResult(
                should_escalate=True,
                reason="Complaint has CRITICAL priority — immediate attention required.",
                recommended_action="Assign to senior official and expedite resolution.",
            )

        # Rule 2: SLA exceeded
        if state.submitted_at and priority:
            sla = SLA_HOURS.get(priority.value)
            if sla:
                delta = datetime.now(timezone.utc) - state.submitted_at
                hours_open = delta.total_seconds() / 3600
                if hours_open > sla:
                    return EscalationResult(
                        should_escalate=True,
                        reason=(
                            f"SLA exceeded: complaint open for {hours_open:.1f}h "
                            f"(limit: {sla}h for {priority.value} priority)."
                        ),
                        recommended_action="Expedite resolution or reassign to faster-responding department.",
                    )

        # Rule 3: High cluster count
        if len(state.similar_complaints) >= 5:
            return EscalationResult(
                should_escalate=True,
                reason=f"{len(state.similar_complaints)} similar complaints detected — recurring problem.",
                recommended_action="Investigate root cause and coordinate department-wide response.",
            )

        return None  # No deterministic trigger — defer to LLM

    def _parse_response(self, raw: str) -> EscalationResult:
        text = raw.strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[-1]
        if text.endswith("```"):
            text = text.rsplit("```", 1)[0]
        text = text.strip()

        data = json.loads(text)
        return EscalationResult(
            should_escalate=bool(data.get("should_escalate", False)),
            reason=data.get("reason", ""),
            recommended_action=data.get("recommended_action", ""),
        )

    @staticmethod
    def _record_audit(
        state: ComplaintState,
        started: datetime,
        success: bool,
        result: EscalationResult,
        error: str | None = None,
    ) -> None:
        state.add_audit_event(
            AuditEvent(
                agent_name=EscalationAgent.NAME,
                started_at=started,
                completed_at=datetime.now(timezone.utc),
                success=success,
                input_summary=f"priority={state.priority}, status={state.current_status}",
                output_summary=f"escalate={result.should_escalate}",
                confidence=None,
                error=error,
            )
        )
