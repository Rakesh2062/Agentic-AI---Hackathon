"""
API route: Conversational AI intake chat.

POST /api/v1/chat/intake
  — Accepts the full conversation history and current extracted data.
  — Calls the LLM-backed IntakeChatAgent.
  — Returns the agent's reply, updated extracted fields, and a readiness flag.

This endpoint is STATELESS. The frontend maintains all state and sends
the full conversation history with every request.

NOTE: This endpoint does NOT submit complaints to MongoDB.
      The final submission still goes through the existing POST /api/v1/complaints.
"""

import logging
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from agents.intake_chat.agent import IntakeChatAgent

log = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["AI Chat"])


# ---------------------------------------------------------------------------
# Request / Response Models
# ---------------------------------------------------------------------------

class ChatMessage(BaseModel):
    """A single message in the conversation history."""
    role: str = Field(..., description="'agent' or 'user'")
    text: str = Field(..., description="Message text content")


class ExtractedData(BaseModel):
    """Fields extracted from conversation so far."""
    issue_description: Optional[str] = None
    category: Optional[str] = None
    location_needed: bool = False
    evidence_needed: bool = False


class ChatIntakeRequest(BaseModel):
    """Request body for POST /chat/intake."""
    messages: List[ChatMessage] = Field(
        ...,
        description="Full conversation history in order"
    )
    extracted_data: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Currently extracted complaint fields from prior turns"
    )
    system_context: Optional[str] = Field(
        default=None,
        description=(
            "Extra context injected by the frontend (e.g. location selected, "
            "file attached) — not shown directly to the citizen"
        )
    )


class ChatIntakeResponse(BaseModel):
    """Response body for POST /chat/intake."""
    reply: str = Field(..., description="Agent's next conversational message")
    extracted_data: Dict[str, Any] = Field(
        default_factory=dict,
        description="Updated extracted complaint fields"
    )
    is_ready: bool = Field(
        False,
        description=(
            "True when the agent has enough information and the user "
            "has confirmed — frontend should show the Review card"
        )
    )


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------

@router.post(
    "/intake",
    response_model=ChatIntakeResponse,
    status_code=status.HTTP_200_OK,
    summary="Conversational intake turn",
    description=(
        "Accepts the full chat history and returns the agent's next reply. "
        "Stateless — the frontend holds all conversation state. "
        "Submission to MongoDB still goes through POST /api/v1/complaints."
    ),
)
async def intake_chat(request: ChatIntakeRequest) -> ChatIntakeResponse:
    """Process one conversational turn with the LLM intake agent."""
    log.info(
        "POST /chat/intake — %d messages, is_ready=%s",
        len(request.messages),
        request.extracted_data,
    )

    try:
        agent = IntakeChatAgent()
        result = await agent.chat(
            messages=[m.model_dump() for m in request.messages],
            extracted_data=request.extracted_data or {},
            system_context=request.system_context or "",
        )
        return ChatIntakeResponse(
            reply=result["reply"],
            extracted_data=result.get("extracted_data", {}),
            is_ready=result.get("is_ready", False),
        )
    except Exception as exc:
        log.exception("Chat intake failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Agent error: {str(exc)}",
        )
