"""
Chat session persistence — save / load per-user AI agent conversation history.
Stored in MongoDB collection: chat_sessions
"""
import logging
from datetime import datetime, timezone
from typing import Optional, List, Any

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from bson import ObjectId
from bson.errors import InvalidId

from database.connection import get_db

log = logging.getLogger("civicpulse.chat_sessions")
router = APIRouter(prefix="/chat-sessions", tags=["Chat Sessions"])
COLLECTION = "chat_sessions"


# ── Pydantic models ───────────────────────────────────────────────────────────

class ChatMessage(BaseModel):
    role: str       # "user" | "agent"
    text: str
    id: Optional[str] = None

class ExtractedData(BaseModel):
    issue_description: Optional[str] = None
    category: Optional[str] = None
    location_needed: Optional[bool] = False
    evidence_needed: Optional[bool] = False

class SaveSessionRequest(BaseModel):
    user_id: str
    session_id: Optional[str] = None      # pass existing id to update, omit to create
    title: str = "Conversation"
    messages: List[dict] = Field(default_factory=list)
    extracted_data: dict = Field(default_factory=dict)
    location: Optional[dict] = None
    attachments: List[str] = Field(default_factory=list)
    case_id: Optional[str] = None

class SessionSummary(BaseModel):
    id: str
    title: str
    timestamp: str
    case_id: Optional[str] = None
    messages: List[dict] = Field(default_factory=list)
    extracted_data: dict = Field(default_factory=dict)
    location: Optional[dict] = None
    attachments: List[str] = Field(default_factory=list)


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("/save")
async def save_session(req: SaveSessionRequest):
    """
    Upsert a chat session for a user.
    If session_id is provided, updates that document; otherwise inserts a new one.
    """
    db = get_db()
    now = datetime.now(timezone.utc).isoformat()

    doc = {
        "user_id": req.user_id,
        "title": req.title,
        "messages": req.messages,
        "extracted_data": req.extracted_data,
        "location": req.location,
        "attachments": req.attachments,
        "case_id": req.case_id,
        "updated_at": now,
    }

    if req.session_id:
        try:
            oid = ObjectId(req.session_id)
        except InvalidId:
            raise HTTPException(status_code=400, detail="Invalid session_id")
        doc["created_at"] = now  # will be overwritten if doc already exists
        result = await db[COLLECTION].update_one(
            {"_id": oid, "user_id": req.user_id},
            {"$set": doc, "$setOnInsert": {"created_at": now}},
            upsert=True,
        )
        return {"session_id": str(oid), "updated": True}
    else:
        doc["created_at"] = now
        result = await db[COLLECTION].insert_one(doc)
        return {"session_id": str(result.inserted_id), "updated": False}


@router.get("/user/{user_id}")
async def get_user_sessions(user_id: str, limit: int = Query(50, le=200)):
    """Return all chat sessions for a user, newest first."""
    db = get_db()
    cursor = (
        db[COLLECTION]
        .find({"user_id": user_id})
        .sort("updated_at", -1)
        .limit(limit)
    )
    sessions = []
    async for doc in cursor:
        sessions.append({
            "id": str(doc["_id"]),
            "title": doc.get("title", "Conversation"),
            "timestamp": doc.get("updated_at", doc.get("created_at", "")),
            "case_id": doc.get("case_id"),
            "messages": doc.get("messages", []),
            "extracted_data": doc.get("extracted_data", {}),
            "location": doc.get("location"),
            "attachments": doc.get("attachments", []),
        })
    return sessions


@router.delete("/{session_id}")
async def delete_session(session_id: str, user_id: str = Query(...)):
    """Delete a specific session belonging to the user."""
    db = get_db()
    try:
        oid = ObjectId(session_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid session_id")
    result = await db[COLLECTION].delete_one({"_id": oid, "user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"deleted": True}
