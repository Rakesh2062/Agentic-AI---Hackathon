"""
Priority Agent — calculates complaint urgency and impact.

Uses a combination of deterministic rules (for category-level baselines)
and LLM reasoning (for contextual nuance).
"""

from __future__ import annotations

import json
import logging
from datetime import datetime, timezone

from agents.config import BaseLLMClient, ComplaintCategory, PriorityLevel
from agents.schemas.agent_outputs import PriorityResult
from agents.state.complaint_state import AuditEvent, ComplaintState
from agents.priority.prompts import (
    PRIORITY_SYSTEM_PROMPT,
    build_priority_prompt,
)

logger = logging.getLogger(__name__)

# Deterministic baseline scores by category
_CATEGORY_BASE_SCORE: dict[str, int] = {
    ComplaintCategory.WATER: 55,
    ComplaintCategory.DRAINAGE: 50,
    ComplaintCategory.ROADS: 45,
    ComplaintCategory.WASTE: 40,
    ComplaintCategory.STREETLIGHTS: 30,
    ComplaintCategory.PUBLIC_FACILITIES: 25,
    ComplaintCategory.OTHER: 20,
}


def _score_to_level(score: float) -> PriorityLevel:
    if score >= 80:
        return PriorityLevel.CRITICAL
    if score >= 60:
        return PriorityLevel.HIGH
    if score >= 35:
        return PriorityLevel.MEDIUM
    return PriorityLevel.LOW


class PriorityAgent:
    """Assess the priority of a classified complaint."""

    NAME = "PriorityAgent"

    def __init__(self, llm_client: BaseLLMClient) -> None:
        self.llm = llm_client

    async def run(self, state: ComplaintState) -> PriorityResult:
        started = datetime.now(timezone.utc)
        try:
            category_str = state.category.value if state.category else "other"

            prompt = build_priority_prompt(
                description=state.description,
                category=category_str,
                subcategory=state.subcategory or "",
                address=state.address,
                similar_count=len(state.similar_complaints),
                is_duplicate=bool(state.is_duplicate),
            )

            raw = await self.llm.generate(
                prompt, system_prompt=PRIORITY_SYSTEM_PROMPT
            )
            result = self._parse_response(raw, category_str)

            # Write back into state
            state.priority = result.priority
            state.priority_score = result.priority_score
            state.priority_reason = result.reason
            state.priority_factors = result.factors

            self._record_audit(state, started, True, result)
            logger.info(
                "Priority assessment complete: %s (score=%s)",
                result.priority,
                result.priority_score,
            )
            return result

        except Exception as exc:
            logger.exception("PriorityAgent failed")
            fallback = self._deterministic_fallback(state)
            state.priority = fallback.priority
            state.priority_score = fallback.priority_score
            state.priority_reason = fallback.reason
            state.add_error(f"PriorityAgent error: {exc}")
            self._record_audit(state, started, False, fallback, str(exc))
            return fallback

    # ------------------------------------------------------------------
    def _parse_response(self, raw: str, category: str) -> PriorityResult:
        text = raw.strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[-1]
        if text.endswith("```"):
            text = text.rsplit("```", 1)[0]
        text = text.strip()

        data = json.loads(text)

        score = float(data.get("priority_score", 0))
        # Clamp
        score = max(0.0, min(100.0, score))

        level_str = data.get("priority", "").upper()
        try:
            level = PriorityLevel(level_str)
        except ValueError:
            level = _score_to_level(score)

        # Validate consistency: if score and level disagree, trust the score
        expected_level = _score_to_level(score)
        if level != expected_level:
            level = expected_level

        return PriorityResult(
            priority=level,
            priority_score=score,
            reason=data.get("reason", ""),
            factors=data.get("factors", []),
        )

    @staticmethod
    def _deterministic_fallback(state: ComplaintState) -> PriorityResult:
        """Rule-based fallback when the LLM is unavailable."""
        category_str = state.category.value if state.category else "other"
        base = _CATEGORY_BASE_SCORE.get(category_str, 20)

        # Boost for nearby similar complaints
        if len(state.similar_complaints) >= 3:
            base += 15
        elif len(state.similar_complaints) >= 1:
            base += 5

        base = min(base, 100)
        level = _score_to_level(base)

        return PriorityResult(
            priority=level,
            priority_score=float(base),
            reason="Deterministic fallback based on category and similar-complaint count.",
            factors=[f"category={category_str}", f"similar_count={len(state.similar_complaints)}"],
        )

    @staticmethod
    def _record_audit(
        state: ComplaintState,
        started: datetime,
        success: bool,
        result: PriorityResult,
        error: str | None = None,
    ) -> None:
        state.add_audit_event(
            AuditEvent(
                agent_name=PriorityAgent.NAME,
                started_at=started,
                completed_at=datetime.now(timezone.utc),
                success=success,
                input_summary=f"category={state.category}, similar={len(state.similar_complaints)}",
                output_summary=f"priority={result.priority}, score={result.priority_score}",
                confidence=result.priority_score / 100.0,
                error=error,
            )
        )
