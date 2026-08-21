"""
Duplicate Detection Agent.

Pipeline:
  complaint → generate embedding → similarity search → LLM evaluation → decision

The agent does NOT rely solely on the LLM; it uses vector similarity search
first, then asks the LLM to evaluate only the top candidates.
"""

from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from typing import Optional

from agents.config import BaseLLMClient
from agents.schemas.agent_outputs import DuplicateResult
from agents.state.complaint_state import AuditEvent, ComplaintState, SimilarComplaint
from agents.tools import search_tools
from agents.duplicate.prompts import (
    DUPLICATE_SYSTEM_PROMPT,
    build_duplicate_prompt,
)

logger = logging.getLogger(__name__)


class DuplicateAgent:
    """Detect whether a complaint is a duplicate of an existing one."""

    NAME = "DuplicateAgent"

    def __init__(self, llm_client: BaseLLMClient) -> None:
        self.llm = llm_client

    async def run(self, state: ComplaintState) -> DuplicateResult:
        """Execute the full duplicate-detection pipeline."""
        started = datetime.now(timezone.utc)
        try:
            # Step 1: Generate embedding for the new complaint
            embedding = await search_tools.generate_embedding(state.description)

            # Step 2: Similarity search
            candidates = await search_tools.search_similar_complaints(
                embedding, top_k=5, threshold=0.5
            )

            # Filter out self-matches
            candidates = [
                c
                for c in candidates
                if c.get("complaint_id") != state.complaint_id
            ]

            # Store similar complaints in state
            state.similar_complaints = [
                SimilarComplaint(
                    complaint_id=c["complaint_id"],
                    similarity_score=c["similarity_score"],
                    category=c.get("category"),
                    description_snippet=c.get("description_snippet", ""),
                    location=c.get("location"),
                )
                for c in candidates
            ]

            # Step 3: If no candidates, not a duplicate
            if not candidates:
                result = DuplicateResult(
                    is_duplicate=False,
                    duplicate_of=None,
                    confidence=0.95,
                    reason="No similar complaints found in the database.",
                )
            else:
                # Step 4: LLM evaluates candidates
                new_complaint_info = {
                    "complaint_id": state.complaint_id,
                    "description": state.description,
                    "category": state.category.value if state.category else "unknown",
                    "address": state.address or "unknown",
                    "latitude": state.latitude,
                    "longitude": state.longitude,
                }
                prompt = build_duplicate_prompt(new_complaint_info, candidates)

                raw = await self.llm.generate(
                    prompt, system_prompt=DUPLICATE_SYSTEM_PROMPT
                )
                result = self._parse_response(raw)

            # Write back into state
            state.is_duplicate = result.is_duplicate
            state.duplicate_of = result.duplicate_of
            state.duplicate_confidence = result.confidence

            # Store the embedding for future searches
            await search_tools.store_embedding(state.complaint_id, embedding)

            self._record_audit(state, started, True, result)
            logger.info(
                "Duplicate check complete: is_duplicate=%s confidence=%.2f",
                result.is_duplicate,
                result.confidence,
            )
            return result

        except Exception as exc:
            logger.exception("DuplicateAgent failed")
            fallback = DuplicateResult(
                is_duplicate=False,
                duplicate_of=None,
                confidence=0.0,
                reason=f"Duplicate detection failed: {exc}",
            )
            state.is_duplicate = False
            state.add_error(f"DuplicateAgent error: {exc}")
            self._record_audit(state, started, False, fallback, str(exc))
            return fallback

    # ------------------------------------------------------------------
    def _parse_response(self, raw: str) -> DuplicateResult:
        text = raw.strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[-1]
        if text.endswith("```"):
            text = text.rsplit("```", 1)[0]
        text = text.strip()

        data = json.loads(text)
        return DuplicateResult(
            is_duplicate=bool(data.get("is_duplicate", False)),
            duplicate_of=data.get("duplicate_of"),
            confidence=float(data.get("confidence", 0.0)),
            reason=data.get("reason", ""),
        )

    @staticmethod
    def _record_audit(
        state: ComplaintState,
        started: datetime,
        success: bool,
        result: DuplicateResult,
        error: str | None = None,
    ) -> None:
        state.add_audit_event(
            AuditEvent(
                agent_name=DuplicateAgent.NAME,
                started_at=started,
                completed_at=datetime.now(timezone.utc),
                success=success,
                input_summary=f"complaint_id={state.complaint_id}",
                output_summary=f"is_dup={result.is_duplicate}, conf={result.confidence}",
                confidence=result.confidence,
                error=error,
            )
        )
