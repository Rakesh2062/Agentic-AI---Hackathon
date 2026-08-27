"""
Auth routes — user registration, login, and profile management.
Supports Civilian, Tourist, and Civic Official roles.
All user data is persisted in MongoDB.
"""

import logging
import os
from datetime import datetime, timezone
from typing import Optional

from bson import ObjectId
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from database.connection import get_db

log = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])

USERS_COLLECTION = "users"


# ---------------------------------------------------------------------------
# Request / Response schemas
# ---------------------------------------------------------------------------

class CivilianRegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    contact: Optional[str] = ""
    city: Optional[str] = "Metro Central"
    profilePhoto: Optional[str] = ""


class TouristRegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    passportId: str
    country: Optional[str] = "International"
    contact: Optional[str] = ""
    profilePhoto: Optional[str] = ""


class LoginRequest(BaseModel):
    identifier: str          # email / contact / officialId / passportId
    password: str
    role: Optional[str] = "civilian"   # civilian | tourist | official


class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    contact: Optional[str] = ""
    city: Optional[str] = None
    country: Optional[str] = None
    passportId: Optional[str] = None
    officialId: Optional[str] = None
    department: Optional[str] = None
    profilePhoto: Optional[str] = ""
    civicPoints: int = 0
    civicLevel: Optional[str] = "Civic Newcomer"
    trustScore: int = 95
    memberSince: str = ""
    reportsSubmitted: int = 0
    reportsValidated: int = 0
    issuesResolved: int = 0
    estimatedImpacted: int = 0
    pointHistory: list = Field(default_factory=list)


class UpdateProfileRequest(BaseModel):
    name: Optional[str] = None
    contact: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    profilePhoto: Optional[str] = None
    password: Optional[str] = None


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _normalize_phone(s: str) -> str:
    return "".join(c for c in (s or "") if c.isdigit())


def _doc_to_user(doc: dict) -> dict:
    doc["id"] = str(doc.pop("_id"))
    doc.pop("password", None)
    return doc


async def _find_user_by_identifier(db, identifier: str, role: str) -> Optional[dict]:
    """Find a user whose email, contact, officialId, or passportId matches."""
    raw = identifier.strip()
    low = raw.lower()
    digits = _normalize_phone(raw)

    query_clauses = [{"email": {"$regex": f"^{low}$", "$options": "i"}}]

    if role == "official":
        query_clauses.append({"officialId": {"$regex": f"^{low}$", "$options": "i"}})
    elif role == "tourist":
        query_clauses.append({"passportId": {"$regex": f"^{raw}$", "$options": "i"}})

    if len(digits) >= 7:
        query_clauses.append({"contact_digits": {"$regex": f"{digits[-10:]}$"}})

    return await db[USERS_COLLECTION].find_one({
        "role": role,
        "$or": query_clauses,
    })


# ---------------------------------------------------------------------------
# Registration endpoints
# ---------------------------------------------------------------------------

@router.post("/register/civilian", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_civilian(data: CivilianRegisterRequest):
    """Register a new civilian (resident) account."""
    db = get_db()

    # Check for duplicate email
    existing = await db[USERS_COLLECTION].find_one({"email": {"$regex": f"^{data.email.strip()}$", "$options": "i"}, "role": "civilian"})
    if existing:
        raise HTTPException(status_code=409, detail="An account with this email already exists. Please sign in.")

    # Check for duplicate contact
    if data.contact and data.contact.strip():
        digits = _normalize_phone(data.contact)
        if len(digits) >= 7:
            existing_contact = await db[USERS_COLLECTION].find_one({"contact_digits": {"$regex": f"{digits[-10:]}$"}, "role": "civilian"})
            if existing_contact:
                raise HTTPException(status_code=409, detail="An account with this contact number already exists. Please sign in.")

    now = datetime.now(timezone.utc)
    doc = {
        "name": data.name.strip(),
        "email": data.email.strip().lower(),
        "password": data.password,           # Plain text — replace with bcrypt in production
        "contact": data.contact.strip() if data.contact else "",
        "contact_digits": _normalize_phone(data.contact or ""),
        "role": "civilian",
        "profilePhoto": data.profilePhoto or "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
        "city": data.city or "Metro Central",
        "civicPoints": 0,
        "civicLevel": "Civic Newcomer",
        "trustScore": 95,
        "memberSince": now.strftime("%Y-%m-%d"),
        "reportsSubmitted": 0,
        "reportsValidated": 0,
        "issuesResolved": 0,
        "estimatedImpacted": 0,
        "pointHistory": [],
        "created_at": now,
    }

    result = await db[USERS_COLLECTION].insert_one(doc)
    doc["_id"] = result.inserted_id
    return _doc_to_user(doc)


@router.post("/register/tourist", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_tourist(data: TouristRegisterRequest):
    """Register a new tourist/visitor account."""
    db = get_db()

    existing = await db[USERS_COLLECTION].find_one({"email": {"$regex": f"^{data.email.strip()}$", "$options": "i"}, "role": "tourist"})
    if existing:
        raise HTTPException(status_code=409, detail="A visitor account with this email already exists. Please sign in.")

    if data.passportId and data.passportId.strip():
        existing_pp = await db[USERS_COLLECTION].find_one({"passportId": {"$regex": f"^{data.passportId.strip()}$", "$options": "i"}, "role": "tourist"})
        if existing_pp:
            raise HTTPException(status_code=409, detail="A visitor account with this passport ID already exists.")

    if data.contact and data.contact.strip():
        digits = _normalize_phone(data.contact)
        if len(digits) >= 7:
            existing_contact = await db[USERS_COLLECTION].find_one({"contact_digits": {"$regex": f"{digits[-10:]}$"}, "role": "tourist"})
            if existing_contact:
                raise HTTPException(status_code=409, detail="A visitor account with this contact number already exists.")

    now = datetime.now(timezone.utc)
    doc = {
        "name": data.name.strip(),
        "email": data.email.strip().lower(),
        "password": data.password,
        "passportId": data.passportId.strip(),
        "country": data.country or "International",
        "contact": data.contact.strip() if data.contact else "",
        "contact_digits": _normalize_phone(data.contact or ""),
        "role": "tourist",
        "profilePhoto": data.profilePhoto or "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80",
        "civicPoints": 0,
        "civicLevel": "Civic Newcomer",
        "trustScore": 98,
        "memberSince": now.strftime("%Y-%m-%d"),
        "reportsSubmitted": 0,
        "reportsValidated": 0,
        "issuesResolved": 0,
        "estimatedImpacted": 0,
        "pointHistory": [],
        "created_at": now,
    }

    result = await db[USERS_COLLECTION].insert_one(doc)
    doc["_id"] = result.inserted_id
    return _doc_to_user(doc)


# ---------------------------------------------------------------------------
# Login endpoint
# ---------------------------------------------------------------------------

@router.post("/login", response_model=UserResponse)
async def login(data: LoginRequest):
    """Unified login for all roles."""
    db = get_db()

    role = (data.role or "civilian").lower()
    user = await _find_user_by_identifier(db, data.identifier, role)

    if not user:
        if role == "official":
            raise HTTPException(status_code=401, detail="Official ID not recognized. Contact municipal administration.")
        raise HTTPException(status_code=401, detail="No account found with this email or mobile number. Please register first.")

    if user.get("password") != data.password:
        raise HTTPException(status_code=401, detail="Incorrect password. Please verify your credentials.")

    return _doc_to_user(user)


# ---------------------------------------------------------------------------
# User management endpoints
# ---------------------------------------------------------------------------

@router.get("/user/{user_id}", response_model=UserResponse)
async def get_user(user_id: str):
    """Get a user profile by ID."""
    db = get_db()
    try:
        oid = ObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user ID")

    user = await db[USERS_COLLECTION].find_one({"_id": oid})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return _doc_to_user(user)


@router.patch("/user/{user_id}", response_model=UserResponse)
async def update_user_profile(user_id: str, data: UpdateProfileRequest):
    """Update profile fields for a user."""
    db = get_db()
    try:
        oid = ObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user ID")

    updates: dict = {}
    if data.name is not None:
        updates["name"] = data.name.strip()
    if data.contact is not None:
        updates["contact"] = data.contact.strip()
        updates["contact_digits"] = _normalize_phone(data.contact)
    if data.city is not None:
        updates["city"] = data.city
    if data.country is not None:
        updates["country"] = data.country
    if data.profilePhoto is not None:
        updates["profilePhoto"] = data.profilePhoto
    if data.password is not None:
        updates["password"] = data.password

    if not updates:
        raise HTTPException(status_code=400, detail="No valid fields to update")

    await db[USERS_COLLECTION].update_one({"_id": oid}, {"$set": updates})
    user = await db[USERS_COLLECTION].find_one({"_id": oid})
    return _doc_to_user(user)


@router.post("/user/{user_id}/award-points")
async def award_civic_points(user_id: str, payload: dict):
    """Award civic points to a user after official validation."""
    db = get_db()
    try:
        oid = ObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user ID")

    user = await db[USERS_COLLECTION].find_one({"_id": oid})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.get("role") == "official":
        raise HTTPException(status_code=400, detail="Civic officials do not earn civic points")

    points = int(payload.get("points", 0))
    case_id = payload.get("caseId", "")
    reason = payload.get("reason", "Official municipal verification")
    case_title = payload.get("caseTitle", "Civic Incident Report")

    # Prevent duplicate award for the same case
    history = user.get("pointHistory", [])
    if case_id and any(tx.get("caseId") == case_id for tx in history):
        return {"message": "Points already awarded for this case", "civicPoints": user.get("civicPoints", 0)}

    new_tx = {
        "id": f"pt_{ObjectId()}",
        "caseId": case_id,
        "title": case_title,
        "reason": reason,
        "points": points,
        "date": datetime.now(timezone.utc).strftime("%b %d, %Y"),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "status": "Validated ✓",
    }

    new_total = (user.get("civicPoints") or 0) + points

    await db[USERS_COLLECTION].update_one(
        {"_id": oid},
        {
            "$inc": {
                "civicPoints": points,
                "reportsValidated": 1,
                "estimatedImpacted": points * 20,
            },
            "$push": {"pointHistory": {"$each": [new_tx], "$position": 0}},
        }
    )

    return {"message": "Points awarded", "civicPoints": new_total, "pointsAdded": points}
