"""
Classification Agent — analyses citizen complaints and classifies them.

Supports multimodal input (text + optional image).
Returns a structured ClassificationResult.
"""

from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from typing import Optional

from agents.config import BaseLLMClient, ComplaintCategory
from agents.schemas.agent_outputs import ClassificationResult
from agents.state.complaint_state import AuditEvent, ComplaintState
from agents.classification.prompts import (
    CLASSIFICATION_SYSTEM_PROMPT,
    build_classification_prompt,
)

logger = logging.getLogger(__name__)

# Valid categories set for validation
_VALID_CATEGORIES = {c.value for c in ComplaintCategory}


class ClassificationAgent:
    """Classify a civic complaint into a fixed set of categories."""

    NAME = "ClassificationAgent"

    def __init__(self, llm_client: BaseLLMClient) -> None:
        self.llm = llm_client

    async def run(self, state: ComplaintState) -> ClassificationResult:
        """Execute classification and update *state* in-place."""
        started = datetime.now(timezone.utc)
        try:
            prompt = build_classification_prompt(
                description=state.description,
                address=state.address,
            )

            raw = await self.llm.generate(
                prompt,
                system_prompt=CLASSIFICATION_SYSTEM_PROMPT,
                image_url=state.image_url,
            )

            result = self._parse_response(raw)

            # Write back into state
            state.ai_summary = result.summary
            state.category = ComplaintCategory(result.category)
            state.subcategory = result.subcategory
            state.classification_confidence = result.confidence

            self._record_audit(state, started, True, result)
            logger.info(
                "Classification complete: category=%s confidence=%.2f",
                result.category,
                result.confidence,
            )
            return result

        except Exception as exc:
            logger.exception("ClassificationAgent failed")
            fallback = self._fallback_result(str(exc))
            state.category = ComplaintCategory.OTHER
            state.classification_confidence = 0.0
            state.ai_summary = fallback.summary
            state.add_error(f"ClassificationAgent error: {exc}")
            self._record_audit(state, started, False, fallback, str(exc))
            return fallback

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------
    def _parse_response(self, raw: str) -> ClassificationResult:
        """Parse LLM response JSON into a ClassificationResult."""
        # Strip markdown fences if present
        text = raw.strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[-1]
        if text.endswith("```"):
            text = text.rsplit("```", 1)[0]
        text = text.strip()

        data = json.loads(text)

        # Validate category
        category = data.get("category", "other").lower().strip()
        if category not in _VALID_CATEGORIES:
            category = "other"
            data["confidence"] = min(data.get("confidence", 0.0), 0.3)

        return ClassificationResult(
            category=category,
            subcategory=data.get("subcategory", ""),
            summary=data.get("summary", ""),
            confidence=float(data.get("confidence", 0.0)),
        )

    @staticmethod
    def _fallback_result(error_msg: str) -> ClassificationResult:
        return ClassificationResult(
            category="other",
            subcategory="unknown",
            summary=f"Classification failed: {error_msg}",
            confidence=0.0,
        )

    @staticmethod
    def _record_audit(
        state: ComplaintState,
        started: datetime,
        success: bool,
        result: ClassificationResult,
        error: str | None = None,
    ) -> None:
        state.add_audit_event(
            AuditEvent(
                agent_name=ClassificationAgent.NAME,
                started_at=started,
                completed_at=datetime.now(timezone.utc),
                success=success,
                input_summary=f"description_len={len(state.description)}",
                output_summary=f"category={result.category}, conf={result.confidence}",
                confidence=result.confidence,
                error=error,
            )
        )
