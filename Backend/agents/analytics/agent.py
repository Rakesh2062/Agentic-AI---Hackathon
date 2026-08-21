"""
Analytics Agent — analyses historical complaints to identify recurring
problems, hotspots, and trends.

Works from aggregated data returned by tools / database queries,
never hallucinating statistics.
"""

from __future__ import annotations

import json
import logging
from collections import Counter
from datetime import datetime, timezone
from typing import Any

from agents.config import BaseLLMClient
from agents.schemas.agent_outputs import AnalyticsResult, InsightItem
from agents.state.complaint_state import AuditEvent, ComplaintState
from agents.tools import complaint_tools
from agents.analytics.prompts import (
    ANALYTICS_SYSTEM_PROMPT,
    build_analytics_prompt,
)

logger = logging.getLogger(__name__)


class AnalyticsAgent:
    """Identify recurring problems and complaint trends."""

    NAME = "AnalyticsAgent"

    def __init__(self, llm_client: BaseLLMClient) -> None:
        self.llm = llm_client

    async def run(
        self,
        filters: dict[str, Any] | None = None,
    ) -> AnalyticsResult:
        """Analyse complaints and return insights.

        Unlike other agents, analytics does not operate on a single
        ComplaintState. It queries bulk data through tools.
        """
        started = datetime.now(timezone.utc)
        audit_state = ComplaintState()  # synthetic state for audit
        try:
            # Fetch all complaints (filtered if needed)
            complaints = await complaint_tools.get_all_complaints(filters)

            if not complaints:
                return AnalyticsResult(insights=[])

            # Pre-aggregate data so the LLM works with summaries, not raw PII
            aggregated = self._aggregate(complaints)

            prompt = build_analytics_prompt(aggregated)
            raw = await self.llm.generate(
                prompt, system_prompt=ANALYTICS_SYSTEM_PROMPT
            )
            result = self._parse_response(raw)

            self._record_audit(audit_state, started, True, result)
            logger.info("Analytics complete: %d insights", len(result.insights))
            return result

        except Exception as exc:
            logger.exception("AnalyticsAgent failed")
            # Provide rule-based fallback insights
            fallback = self._rule_based_fallback(complaints if "complaints" in dir() else [])
            self._record_audit(audit_state, started, False, fallback, str(exc))
            return fallback

    # ------------------------------------------------------------------
    @staticmethod
    def _aggregate(complaints: list[dict[str, Any]]) -> dict[str, Any]:
        """Build a privacy-safe summary of complaints for the LLM."""
        category_counts = Counter(c.get("category", "other") for c in complaints)
        status_counts = Counter(c.get("status", "unknown") for c in complaints)
        location_counts = Counter(c.get("address", "unknown") for c in complaints)
        priority_counts = Counter(c.get("priority", "MEDIUM") for c in complaints)

        # Find unresolved
        unresolved = [
            c for c in complaints if c.get("status") not in ("resolved", "closed")
        ]

        return {
            "total_complaints": len(complaints),
            "category_distribution": dict(category_counts),
            "status_distribution": dict(status_counts),
            "top_locations": dict(location_counts.most_common(10)),
            "priority_distribution": dict(priority_counts),
            "unresolved_count": len(unresolved),
            "unresolved_by_category": dict(
                Counter(c.get("category", "other") for c in unresolved)
            ),
        }

    def _parse_response(self, raw: str) -> AnalyticsResult:
        text = raw.strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[-1]
        if text.endswith("```"):
            text = text.rsplit("```", 1)[0]
        text = text.strip()

        data = json.loads(text)
        insights = [
            InsightItem(
                type=item.get("type", "UNKNOWN"),
                category=item.get("category"),
                location=item.get("location"),
                count=int(item.get("count", 0)),
                severity=item.get("severity", "MEDIUM"),
                explanation=item.get("explanation", ""),
            )
            for item in data.get("insights", [])
        ]
        return AnalyticsResult(insights=insights)

    @staticmethod
    def _rule_based_fallback(
        complaints: list[dict[str, Any]],
    ) -> AnalyticsResult:
        """Simple rule-based insights when the LLM is unavailable."""
        if not complaints:
            return AnalyticsResult(insights=[])

        insights: list[InsightItem] = []
        category_counts = Counter(c.get("category", "other") for c in complaints)

        for cat, count in category_counts.most_common(3):
            if count >= 3:
                insights.append(
                    InsightItem(
                        type="RECURRING_PROBLEM",
                        category=cat,
                        count=count,
                        severity="MEDIUM" if count < 10 else "HIGH",
                        explanation=f"{count} complaints in category '{cat}' — potential recurring issue.",
                    )
                )

        return AnalyticsResult(insights=insights)

    @staticmethod
    def _record_audit(
        state: ComplaintState,
        started: datetime,
        success: bool,
        result: AnalyticsResult,
        error: str | None = None,
    ) -> None:
        state.add_audit_event(
            AuditEvent(
                agent_name=AnalyticsAgent.NAME,
                started_at=started,
                completed_at=datetime.now(timezone.utc),
                success=success,
                input_summary="bulk_analysis",
                output_summary=f"insights_count={len(result.insights)}",
                confidence=None,
                error=error,
            )
        )
