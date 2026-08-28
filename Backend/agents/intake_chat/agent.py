"""
Conversational Intake Agent — stateless LLM-powered chat agent
for guiding citizens through civic complaint intake.

Accepts the full conversation history and the currently extracted data,
then returns:
  - reply: the agent's next message to the citizen
  - extracted_data: updated JSON with any newly parsed fields
  - is_ready: True when enough info is collected to present for review
"""

from __future__ import annotations

import json
import logging
from typing import Any

from agents.config import BaseLLMClient, get_llm_client

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are the NAGARSETU AI Agent — a professional, friendly civic complaint intake assistant
for a municipal civic intelligence platform in India.

Your job is to help citizens report civic infrastructure issues through a guided conversation.
You are helpful, concise, and clear. You speak in simple English.

## WHAT YOU COLLECT
You gather these fields from the conversation to file a complaint:
  1. issue_description (string) — what the civic problem is (e.g., "large pothole on MG Road")
  2. category (string) — one of: roads, drainage, waste, water, streetlights, public_facilities, other
  3. location_needed (boolean) — set true when you have asked for location and are waiting
  4. evidence_needed (boolean) — set true when you have asked about evidence/photos

## RULES
- Ask one question at a time. Don't overwhelm the user.
- Be warm but professional. No emojis.
- If the user's message already contains the issue, extract it and ask for location next.
- Once you have an issue_description AND a location (or the user says they will use the map),
  ask if they want to attach evidence (photo/PDF).
- After evidence step, set is_ready = true and write a brief summary asking the user to confirm.
- If a user asks about NAGARSETU or how the platform works, explain briefly and then offer to help report an issue.
- If a user asks to track a complaint, tell them to use the "Track by ID" section in the Citizen Portal.
- Never mention MongoDB, databases, pipelines, or internal system details.
- Do not invent complaint IDs. The real ID is assigned after submission.
- Keep responses under 3 sentences when possible.

## RESPONSE FORMAT
You MUST respond ONLY with a valid JSON object. No extra text before or after.
Schema:
{
  "reply": "<your conversational message to the citizen>",
  "extracted_data": {
    "issue_description": "<string or null>",
    "category": "<string or null>",
    "location_needed": <boolean>,
    "evidence_needed": <boolean>
  },
  "is_ready": <boolean>
}

Set is_ready = true ONLY when:
  - issue_description is filled
  - The user has provided or confirmed a location (either typed or said they'll use the map)
  - You have asked about evidence (even if user says no)
  - You have presented a brief summary asking for confirmation

Do NOT set is_ready = true prematurely.
"""


def _build_user_messages(messages: list[dict]) -> str:
    """Converts the frontend conversation history to a compact prompt string."""
    lines = []
    for m in messages:
        role = m.get("role", "user")
        text = m.get("text", "")
        if role == "agent":
            lines.append(f"AGENT: {text}")
        else:
            lines.append(f"CITIZEN: {text}")
    return "\n".join(lines)


class IntakeChatAgent:
    """Stateless conversational agent for civic complaint intake."""

    def __init__(self, llm_client: BaseLLMClient | None = None) -> None:
        self.llm = llm_client or get_llm_client()

    async def chat(
        self,
        messages: list[dict[str, Any]],
        extracted_data: dict[str, Any],
        system_context: str = "",
    ) -> dict[str, Any]:
        """
        Process a conversation turn.

        Args:
            messages: Full chat history from the frontend [{role, text}, ...]
            extracted_data: Currently known fields (from previous turns)
            system_context: Optional extra context injected by the frontend
                            e.g. "[System: User has attached 1 file and selected a map location]"

        Returns:
            dict with keys: reply, extracted_data, is_ready
        """
        conversation_text = _build_user_messages(messages)

        current_state = json.dumps(extracted_data or {}, ensure_ascii=False)
        prompt = (
            f"## Current extracted data:\n{current_state}\n\n"
            f"## Conversation so far:\n{conversation_text}"
        )

        if system_context:
            prompt += f"\n\n## System context (not shown to citizen):\n{system_context}"

        prompt += "\n\n## Your response (JSON only):"

        try:
            raw = await self.llm.generate(
                prompt,
                system_prompt=SYSTEM_PROMPT,
                temperature=0.3,
                max_tokens=512,
            )
            return self._parse_response(raw, extracted_data)
        except Exception as exc:
            logger.exception("IntakeChatAgent.chat failed: %s", exc)
            return {
                "reply": (
                    "I'm having a bit of trouble right now. "
                    "Could you please repeat what you said?"
                ),
                "extracted_data": extracted_data or {},
                "is_ready": False,
            }

    def _parse_response(
        self, raw: str, fallback_data: dict
    ) -> dict[str, Any]:
        """Parse the LLM JSON response robustly."""
        text = raw.strip()
        # Strip markdown fences
        if text.startswith("```"):
            text = text.split("\n", 1)[-1]
        if text.endswith("```"):
            text = text.rsplit("```", 1)[0]
        # Strip leading/trailing junk
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1:
            text = text[start : end + 1]

        try:
            data = json.loads(text)
        except json.JSONDecodeError:
            logger.warning("Failed to parse LLM JSON: %r", text)
            return {
                "reply": raw.strip()[:400],
                "extracted_data": fallback_data or {},
                "is_ready": False,
            }

        return {
            "reply": data.get("reply", "I didn't catch that. Could you rephrase?"),
            "extracted_data": data.get("extracted_data", fallback_data or {}),
            "is_ready": bool(data.get("is_ready", False)),
        }
