from datetime import datetime
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field

class UserRole(str, Enum):
    CIVILIAN = "CIVILIAN"
    CIVIC_OFFICIAL = "CIVIC_OFFICIAL"
    TOURIST = "TOURIST"

class Category(str, Enum):
    ROADS = "roads"
    WATER = "water"
    DRAINAGE = "drainage"
    WASTE = "waste"
    STREETLIGHT = "streetlight"
    TRAFFIC = "traffic"
    PUBLIC_FACILITY = "public_facility"
    ENVIRONMENT = "environment"
    OTHER = "other"

class Status(str, Enum):
    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    ASSIGNED = "assigned"
    IN_PROGRESS = "in_progress"
    INSPECTED = "inspected"
    RESOLVED = "resolved"
    CLOSED = "closed"
    ESCALATED = "escalated"

class Priority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class Attachment(BaseModel):
    name: str
    size: str
    url: str
    type: Optional[str] = "image"

class GeoLocation(BaseModel):
    lat: float
    lng: float
    address: Optional[str] = None
    ward: Optional[str] = None
    zone: Optional[str] = None

class User(BaseModel):
    id: str
    name: str
    email: str
    contact: Optional[str] = None
    passwordHash: Optional[str] = None
    googleId: Optional[str] = None
    role: UserRole = UserRole.CIVILIAN
    profilePhoto: Optional[str] = None
    country: Optional[str] = None
    passportIdEncrypted: Optional[str] = None
    city: Optional[str] = "Metro Central"
    civicPoints: int = 0
    civicLevel: str = "Civic Starter"
    trustScore: int = 96
    memberSince: str = Field(default_factory=lambda: datetime.utcnow().strftime("%Y-%m-%d"))
    reportsSubmitted: int = 0
    reportsValidated: int = 0
    issuesResolved: int = 0
    estimatedImpacted: int = 0
    department: Optional[str] = None
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

class StatusUpdate(BaseModel):
    status: Status
    message: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    updated_by: str

class ComplaintCreate(BaseModel):
    title: Optional[str] = None
    raw_text: str
    category: Optional[Category] = Category.OTHER
    custom_category_specification: Optional[str] = None
    sub_category: Optional[str] = None
    priority: Optional[Priority] = Priority.MEDIUM
    userId: Optional[str] = None
    citizen_name: Optional[str] = None
    citizen_email: Optional[str] = None
    location: Optional[GeoLocation] = None
    attachments: Optional[List[Attachment]] = []

class ComplaintValidationRequest(BaseModel):
    validatedSeverity: Priority
    highPublicImpact: bool = False
    isRecurringProblem: bool = False
    officerName: str

class CaseResponse(BaseModel):
    id: str
    complaint_id: str
    userId: Optional[str] = None
    citizen_name: Optional[str] = None
    title: Optional[str] = None
    raw_text: str
    category: Category
    custom_category_specification: Optional[str] = None
    sub_category: Optional[str] = None
    summary: str
    confidence: float
    department: str
    priority: Priority
    validatedSeverity: Optional[Priority] = None
    civicPointsAwarded: int = 0
    status: Status
    status_history: List[StatusUpdate] = []
    citizen_count: int = 1
    location: Optional[GeoLocation] = None
    attachments: List[Attachment] = []
    sla_deadline: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

class Reward(BaseModel):
    id: str
    title: str
    description: str
    type: str
    pointsRequired: int
    category: str
    partner: str
    status: str = "available"
    isAvailable: bool = True

class RewardClaim(BaseModel):
    id: str
    userId: str
    rewardId: str
    title: str
    pointsUsed: int
    voucherCode: str
    claimedAt: datetime = Field(default_factory=datetime.utcnow)
    expiryDate: str
    status: str = "ACTIVE"

class LoginRequest(BaseModel):
    identifier: str  # Email, contact/mobile number, official ID, or passport ID
    password: str
    role: Optional[UserRole] = None

class RegisterCivilianRequest(BaseModel):
    name: str
    email: str
    contact: Optional[str] = None
    password: str
    city: Optional[str] = "Metro Central"
    profilePhoto: Optional[str] = None

class RegisterTouristRequest(BaseModel):
    passportId: str
    name: str
    email: str
    country: str
    contact: Optional[str] = None
    password: str
    profilePhoto: Optional[str] = None
