"""
Resolution Agent — generates clear resolution explanations and
citizen-facing messages after an admin updates / resolves a complaint.
"""

from __future__ import annotations

import json
import logging
from datetime import datetime, timezone

from agents.config import BaseLLMClient
from agents.schemas.agent_outputs import ResolutionResult
from agents.state.complaint_state import AuditEvent, ComplaintState
from agents.tools.search_tools import get_relevant_resolution_sop
from agents.resolution.prompts import (
    RESOLUTION_SYSTEM_PROMPT,
    build_resolution_prompt,
)

logger = logging.getLogger(__name__)


class ResolutionAgent:
    """Generate resolution summaries and citizen messages grounded in municipal RAG SOP guidance."""

    NAME = "ResolutionAgent"

    def __init__(self, llm_client: BaseLLMClient) -> None:
        self.llm = llm_client

    async def run(
        self,
        state: ComplaintState,
        admin_action: str = "",
        resolution_notes: str = "",
    ) -> ResolutionResult:
        started = datetime.now(timezone.utc)
        sop_guidance_text = ""
        try:
            # ── Retrieve Municipal SOP Guidance via RAG ──
            category_str = state.category.value if state.category else ""
            try:
                sop_data = get_relevant_resolution_sop(
                    complaint_text=state.description,
                    category=category_str,
                )
                if sop_data and sop_data.get("has_guidance") and sop_data.get("resolution_guidance"):
                    sop_guidance_text = sop_data.get("resolution_guidance", "")
            except Exception as sop_exc:
                logger.warning("RAG SOP retrieval in ResolutionAgent failed (continuing with baseline): %s", sop_exc)
                sop_guidance_text = ""

            prompt = build_resolution_prompt(
                complaint_id=state.complaint_id,
                description=state.description,
                category=category_str or "unknown",
                priority=state.priority.value if state.priority else "unknown",
                department=state.effective_department(),
                admin_action=admin_action or "Status updated",
                resolution_notes=resolution_notes,
                current_status=state.current_status.value,
                sop_guidance=sop_guidance_text,
            )

            raw = await self.llm.generate(
                prompt, system_prompt=RESOLUTION_SYSTEM_PROMPT
            )
            result = self._parse_response(raw)

            state.resolution_summary = result.resolution_summary
            state.citizen_message = result.citizen_message
            state.next_steps = result.next_steps

            self._record_audit(state, started, True, result)
            logger.info("Resolution explanation generated successfully.")
            return result

        except Exception as exc:
            logger.exception("ResolutionAgent failed")
            fallback = ResolutionResult(
                resolution_summary=f"Resolution processing failed: {exc}",
                citizen_message=(
                    f"Dear Citizen, your complaint {state.complaint_id} has been "
                    "updated. We are unable to provide full details at this time. "
                    "Please contact our support office for more information."
                ),
                next_steps=["Contact municipal support for details."],
            )
            state.resolution_summary = fallback.resolution_summary
            state.citizen_message = fallback.citizen_message
            state.add_error(f"ResolutionAgent error: {exc}")
            self._record_audit(state, started, False, fallback, str(exc))
            return fallback

    # ------------------------------------------------------------------
    def _parse_response(self, raw: str) -> ResolutionResult:
        text = raw.strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[-1]
        if text.endswith("```"):
            text = text.rsplit("```", 1)[0]
        text = text.strip()

        data = json.loads(text)
        return ResolutionResult(
            resolution_summary=data.get("resolution_summary", ""),
            citizen_message=data.get("citizen_message", ""),
            next_steps=data.get("next_steps", []),
        )

    @staticmethod
    def _record_audit(
        state: ComplaintState,
        started: datetime,
        success: bool,
        result: ResolutionResult,
        error: str | None = None,
    ) -> None:
        state.add_audit_event(
            AuditEvent(
                agent_name=ResolutionAgent.NAME,
                started_at=started,
                completed_at=datetime.now(timezone.utc),
                success=success,
                input_summary=f"complaint_id={state.complaint_id}",
                output_summary=f"summary_len={len(result.resolution_summary)}",
                confidence=None,
                error=error,
            )
        )
