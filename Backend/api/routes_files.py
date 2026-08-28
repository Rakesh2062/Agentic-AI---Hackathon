"""
File upload endpoint — stores images/PDFs as base64 in MongoDB and returns a
stable URL of the form /api/v1/files/{file_id} that the frontend can use as a
persistent image_url / attachment URL.
"""
import base64
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import Response

from database.connection import get_db

log = logging.getLogger("civicpulse.files")

router = APIRouter(tags=["Files"])

FILES_COLLECTION = "uploaded_files"
MAX_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB


@router.post("/files/upload")
async def upload_file(file: UploadFile = File(...)):
    """
    Accept a single image or PDF, store it as base64 in MongoDB,
    and return a persistent URL the frontend can save as an attachment.
    """
    content_type = file.content_type or "application/octet-stream"
    allowed = {"image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"}
    if content_type not in allowed:
        raise HTTPException(status_code=415, detail=f"Unsupported file type: {content_type}")

    data = await file.read()
    if len(data) > MAX_SIZE_BYTES:
        raise HTTPException(status_code=413, detail="File too large (max 10 MB).")

    encoded = base64.b64encode(data).decode("utf-8")

    db = get_db()
    doc = {
        "filename": file.filename,
        "content_type": content_type,
        "data_b64": encoded,
        "uploaded_at": datetime.now(timezone.utc),
    }
    result = await db[FILES_COLLECTION].insert_one(doc)
    file_id = str(result.inserted_id)

    log.info("Stored file %s (%s, %d bytes) as id=%s", file.filename, content_type, len(data), file_id)
    return {"file_id": file_id, "url": f"/api/v1/files/{file_id}", "content_type": content_type}


@router.get("/files/{file_id}")
async def serve_file(file_id: str):
    """Serve a previously uploaded file by its MongoDB ObjectId."""
    from bson import ObjectId
    from bson.errors import InvalidId

    try:
        oid = ObjectId(file_id)
    except InvalidId:
        raise HTTPException(status_code=404, detail="Invalid file ID.")

    db = get_db()
    doc = await db[FILES_COLLECTION].find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="File not found.")

    raw = base64.b64decode(doc["data_b64"])
    return Response(content=raw, media_type=doc["content_type"])
