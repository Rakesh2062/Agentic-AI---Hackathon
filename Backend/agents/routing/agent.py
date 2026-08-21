"""
Routing Agent — recommends which department should handle a complaint.

The department list always comes from the department tool / database,
so the agent cannot hallucinate departments.
"""

from __future__ import annotations

import json
import logging
from datetime import datetime, timezone

from agents.config import BaseLLMClient, CATEGORY_DEPARTMENT_MAP
from agents.schemas.agent_outputs import RoutingResult
from agents.state.complaint_state import AuditEvent, ComplaintState
from agents.tools import department_tools
from agents.routing.prompts import build_routing_prompt, build_system_prompt

logger = logging.getLogger(__name__)


class RoutingAgent:
    """Recommend the responsible department for a complaint."""

    NAME = "RoutingAgent"

    def __init__(self, llm_client: BaseLLMClient) -> None:
        self.llm = llm_client

    async def run(self, state: ComplaintState) -> RoutingResult:
        started = datetime.now(timezone.utc)
        try:
            # Fetch valid departments from the tool
            departments_data = await department_tools.get_departments()
            valid_departments = [d["name"] for d in departments_data]

            category_str = state.category.value if state.category else "other"
            priority_str = state.priority.value if state.priority else "MEDIUM"

            prompt = build_routing_prompt(
                description=state.description,
                category=category_str,
                subcategory=state.subcategory or "",
                priority=priority_str,
                address=state.address,
                departments=valid_departments,
            )
            system = build_system_prompt(valid_departments)

            raw = await self.llm.generate(prompt, system_prompt=system)
            result = self._parse_response(raw, valid_departments, category_str)

            # Write back into state
            state.recommended_department = result.recommended_department
            state.routing_reason = result.reason
            state.routing_confidence = result.confidence

            self._record_audit(state, started, True, result)
            logger.info(
                "Routing complete: dept=%s confidence=%.2f",
                result.recommended_department,
                result.confidence,
            )
            return result

        except Exception as exc:
            logger.exception("RoutingAgent failed")
            fallback = self._deterministic_fallback(state)
            state.recommended_department = fallback.recommended_department
            state.routing_reason = fallback.reason
            state.routing_confidence = fallback.confidence
            state.add_error(f"RoutingAgent error: {exc}")
            self._record_audit(state, started, False, fallback, str(exc))
            return fallback

    # ------------------------------------------------------------------
    def _parse_response(
        self, raw: str, valid_departments: list[str], category: str
    ) -> RoutingResult:
        text = raw.strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[-1]
        if text.endswith("```"):
            text = text.rsplit("```", 1)[0]
        text = text.strip()

        data = json.loads(text)
        dept = data.get("recommended_department", "")

        # Validate against the actual department list
        if dept not in valid_departments:
            # Try case-insensitive match
            for vd in valid_departments:
                if vd.lower() == dept.lower():
                    dept = vd
                    break
            else:
                # Fallback to category mapping
                dept = CATEGORY_DEPARTMENT_MAP.get(category, valid_departments[0])
                data["confidence"] = min(data.get("confidence", 0.0), 0.4)

        return RoutingResult(
            recommended_department=dept,
            confidence=float(data.get("confidence", 0.0)),
            reason=data.get("reason", ""),
        )

    @staticmethod
    def _deterministic_fallback(state: ComplaintState) -> RoutingResult:
        category_str = state.category.value if state.category else "other"
        dept = CATEGORY_DEPARTMENT_MAP.get(category_str, "Public Facilities")
        return RoutingResult(
            recommended_department=dept,
            confidence=0.6,
            reason=f"Deterministic fallback: category '{category_str}' maps to '{dept}'.",
        )

    @staticmethod
    def _record_audit(
        state: ComplaintState,
        started: datetime,
        success: bool,
        result: RoutingResult,
        error: str | None = None,
    ) -> None:
        state.add_audit_event(
            AuditEvent(
                agent_name=RoutingAgent.NAME,
                started_at=started,
                completed_at=datetime.now(timezone.utc),
                success=success,
                input_summary=f"category={state.category}",
                output_summary=f"dept={result.recommended_department}, conf={result.confidence}",
                confidence=result.confidence,
                error=error,
            )
        )
