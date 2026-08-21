"""
Seed Data Generator for the Civic Complaint-to-Resolution Intelligence Platform.
Seeds realistic departments, demo users across all roles, civic complaints across categories,
embeddings, updates, assignments, notifications, and escalations.
"""

import math
import random
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional
from bson import ObjectId
from pymongo.database import Database

from database.collections import (
    USERS_COLLECTION,
    DEPARTMENTS_COLLECTION,
    COMPLAINTS_COLLECTION,
    COMPLAINT_UPDATES_COLLECTION,
    ASSIGNMENTS_COLLECTION,
    NOTIFICATIONS_COLLECTION,
    ESCALATIONS_COLLECTION,
    COMPLAINT_EMBEDDINGS_COLLECTION,
    UserRole,
    ComplaintStatus,
    ComplaintPriority,
    AssignmentStatus,
    NotificationType,
    EscalationTriggerType,
    EscalationStatus,
)
from database.indexes import create_indexes
from database.connection import get_sync_db


def generate_synthetic_embedding(seed_text: str, dim: int = 768) -> List[float]:
    """Generates a deterministic normalized synthetic embedding vector for testing/demo purposes."""
    rng = random.Random(seed_text)
    vec = [rng.gauss(0, 1) for _ in range(dim)]
    norm = math.sqrt(sum(x * x for x in vec))
    return [round(x / norm, 6) for x in vec]


def get_seed_departments() -> List[Dict[str, Any]]:
    """Returns department seed records with fixed ObjectIds for deterministic referencing."""
    now = datetime.now(timezone.utc) - timedelta(days=60)
    return [
        {
            "_id": ObjectId("65e000000000000000000001"),
            "name": "Public Works & Road Infrastructure",
            "description": "Responsible for road maintenance, pothole repairs, bridges, and public infrastructure.",
            "contact_email": "pwd-support@civic.gov",
            "contact_phone": "+1-800-555-0101",
            "default_sla_hours": 48,
            "created_at": now,
        },
        {
            "_id": ObjectId("65e000000000000000000002"),
            "name": "Water Supply & Sewerage Board",
            "description": "Manages municipal drinking water distribution, pipe leaks, sewage, and drainage.",
            "contact_email": "water-support@civic.gov",
            "contact_phone": "+1-800-555-0102",
            "default_sla_hours": 24,
            "created_at": now,
        },
        {
            "_id": ObjectId("65e000000000000000000003"),
            "name": "Solid Waste Management & Sanitation",
            "description": "Handles daily garbage collection, public bins, recycling, and street sweeping.",
            "contact_email": "sanitation-support@civic.gov",
            "contact_phone": "+1-800-555-0103",
            "default_sla_hours": 12,
            "created_at": now,
        },
        {
            "_id": ObjectId("65e000000000000000000004"),
            "name": "Electricity & Street Lighting",
            "description": "Responsible for civic power grid reliability, street lamps, and traffic signals.",
            "contact_email": "electricity-support@civic.gov",
            "contact_phone": "+1-800-555-0104",
            "default_sla_hours": 18,
            "created_at": now,
        },
        {
            "_id": ObjectId("65e000000000000000000005"),
            "name": "Public Health & Hygiene",
            "description": "Manages mosquito control, stray animal control, public sanitation hazards, and disease prevention.",
            "contact_email": "health-support@civic.gov",
            "contact_phone": "+1-800-555-0105",
            "default_sla_hours": 24,
            "created_at": now,
        },
    ]


def get_seed_users(departments: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Returns demo users across all roles (Admin, Supervisors, Staff, Citizens)."""
    now = datetime.now(timezone.utc) - timedelta(days=50)
    dept_pwd = departments[0]["_id"]
    dept_water = departments[1]["_id"]
    dept_sanitation = departments[2]["_id"]
    dept_electricity = departments[3]["_id"]

    return [
        # Admin
        {
            "_id": ObjectId("65e100000000000000000001"),
            "name": "System Administrator",
            "email": "admin@civic.gov",
            "password_hash": "$2b$12$eDxQOQ0X1JzF0k7d1y0Qe.V1JqP7Y5gGZz0c9v8aB",
            "phone": "+1-555-0100",
            "role": UserRole.ADMIN.value,
            "department_id": None,
            "is_active": True,
            "created_at": now,
        },
        # Supervisors
        {
            "_id": ObjectId("65e100000000000000000002"),
            "name": "Marcus Vance (PWD Supervisor)",
            "email": "marcus.pwd@civic.gov",
            "password_hash": "$2b$12$eDxQOQ0X1JzF0k7d1y0Qe.V1JqP7Y5gGZz0c9v8aB",
            "phone": "+1-555-0102",
            "role": UserRole.SUPERVISOR.value,
            "department_id": dept_pwd,
            "is_active": True,
            "created_at": now,
        },
        {
            "_id": ObjectId("65e100000000000000000003"),
            "name": "Elena Rostova (Water Supervisor)",
            "email": "elena.water@civic.gov",
            "password_hash": "$2b$12$eDxQOQ0X1JzF0k7d1y0Qe.V1JqP7Y5gGZz0c9v8aB",
            "phone": "+1-555-0103",
            "role": UserRole.SUPERVISOR.value,
            "department_id": dept_water,
            "is_active": True,
            "created_at": now,
        },
        {
            "_id": ObjectId("65e100000000000000000004"),
            "name": "David Chen (Sanitation Supervisor)",
            "email": "david.sanitation@civic.gov",
            "password_hash": "$2b$12$eDxQOQ0X1JzF0k7d1y0Qe.V1JqP7Y5gGZz0c9v8aB",
            "phone": "+1-555-0104",
            "role": UserRole.SUPERVISOR.value,
            "department_id": dept_sanitation,
            "is_active": True,
            "created_at": now,
        },
        # Staff / Field Workers
        {
            "_id": ObjectId("65e100000000000000000005"),
            "name": "Carlos Gomez (PWD Field Engineer)",
            "email": "carlos.pwd@civic.gov",
            "password_hash": "$2b$12$eDxQOQ0X1JzF0k7d1y0Qe.V1JqP7Y5gGZz0c9v8aB",
            "phone": "+1-555-0105",
            "role": UserRole.STAFF.value,
            "department_id": dept_pwd,
            "is_active": True,
            "created_at": now,
        },
        {
            "_id": ObjectId("65e100000000000000000006"),
            "name": "Sarah Jenkins (Water Line Tech)",
            "email": "sarah.water@civic.gov",
            "password_hash": "$2b$12$eDxQOQ0X1JzF0k7d1y0Qe.V1JqP7Y5gGZz0c9v8aB",
            "phone": "+1-555-0106",
            "role": UserRole.STAFF.value,
            "department_id": dept_water,
            "is_active": True,
            "created_at": now,
        },
        {
            "_id": ObjectId("65e100000000000000000007"),
            "name": "Ravi Patel (Sanitation Crew Lead)",
            "email": "ravi.sanitation@civic.gov",
            "password_hash": "$2b$12$eDxQOQ0X1JzF0k7d1y0Qe.V1JqP7Y5gGZz0c9v8aB",
            "phone": "+1-555-0107",
            "role": UserRole.STAFF.value,
            "department_id": dept_sanitation,
            "is_active": True,
            "created_at": now,
        },
        # Citizens
        {
            "_id": ObjectId("65e100000000000000000010"),
            "name": "Alice Montgomery",
            "email": "alice.montgomery@example.com",
            "password_hash": "$2b$12$eDxQOQ0X1JzF0k7d1y0Qe.V1JqP7Y5gGZz0c9v8aB",
            "phone": "+1-555-0201",
            "role": UserRole.CITIZEN.value,
            "department_id": None,
            "is_active": True,
            "created_at": now,
        },
        {
            "_id": ObjectId("65e100000000000000000011"),
            "name": "Bob Henderson",
            "email": "bob.henderson@example.com",
            "password_hash": "$2b$12$eDxQOQ0X1JzF0k7d1y0Qe.V1JqP7Y5gGZz0c9v8aB",
            "phone": "+1-555-0202",
            "role": UserRole.CITIZEN.value,
            "department_id": None,
            "is_active": True,
            "created_at": now,
        },
        {
            "_id": ObjectId("65e100000000000000000012"),
            "name": "Charlie Rivera",
            "email": "charlie.rivera@example.com",
            "password_hash": "$2b$12$eDxQOQ0X1JzF0k7d1y0Qe.V1JqP7Y5gGZz0c9v8aB",
            "phone": "+1-555-0203",
            "role": UserRole.CITIZEN.value,
            "department_id": None,
            "is_active": True,
            "created_at": now,
        },
    ]


def get_seed_complaints(
    users: List[Dict[str, Any]], departments: List[Dict[str, Any]]
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], List[Dict[str, Any]], List[Dict[str, Any]], List[Dict[str, Any]], List[Dict[str, Any]]]:
    """
    Constructs realistic complaints including duplicates, embeddings, audit updates, assignments, notifications, and escalations.
    """
    now = datetime.now(timezone.utc)
    c_alice = users[7]["_id"]
    c_bob = users[8]["_id"]
    c_charlie = users[9]["_id"]

    dept_pwd = departments[0]["_id"]
    dept_water = departments[1]["_id"]
    dept_sanitation = departments[2]["_id"]
    dept_electricity = departments[3]["_id"]

    staff_carlos = users[4]["_id"]
    staff_sarah = users[5]["_id"]
    staff_ravi = users[6]["_id"]
    sup_marcus = users[1]["_id"]
    sup_elena = users[2]["_id"]

    complaints: List[Dict[str, Any]] = []
    embeddings: List[Dict[str, Any]] = []
    updates: List[Dict[str, Any]] = []
    assignments: List[Dict[str, Any]] = []
    notifications: List[Dict[str, Any]] = []
    escalations: List[Dict[str, Any]] = []

    # --------------------------------------------------------------------------
    # 1. Primary Road Pothole Complaint (In Progress)
    # --------------------------------------------------------------------------
    cid_1 = ObjectId("65e200000000000000000001")
    t1_created = now - timedelta(days=3, hours=4)
    t1_sla = t1_created + timedelta(hours=48)
    complaints.append({
        "_id": cid_1,
        "complaint_number": "CMP-2026-0001",
        "user_id": c_alice,
        "description": "Deep dangerous pothole on 5th Avenue and Oak Street intersection causing traffic slowdowns and vehicle rim damage.",
        "ai_summary": "Dangerous deep pothole obstructing intersection traffic at 5th Ave & Oak St.",
        "category": "Roads & Infrastructure",
        "subcategory": "Potholes",
        "priority": ComplaintPriority.HIGH.value,
        "priority_score": 0.85,
        "status": ComplaintStatus.IN_PROGRESS.value,
        "latitude": 40.712776,
        "longitude": -74.005974,
        "address": "Corner of 5th Ave & Oak St, Ward 4",
        "image_url": "https://assets.civic.gov/complaints/pothole_5th_oak.jpg",
        "is_duplicate": False,
        "duplicate_of": None,
        "department_id": dept_pwd,
        "assigned_to": staff_carlos,
        "sla_deadline": t1_sla,
        "created_at": t1_created,
        "updated_at": now - timedelta(hours=6),
        "resolved_at": None,
    })
    embeddings.append({
        "_id": ObjectId("65e300000000000000000001"),
        "complaint_id": cid_1,
        "embedding": generate_synthetic_embedding("deep dangerous pothole 5th avenue oak street intersection road damage"),
        "model_name": "text-embedding-004",
        "created_at": t1_created,
    })
    updates.append({
        "_id": ObjectId("65e400000000000000000001"),
        "complaint_id": cid_1,
        "updated_by": None,
        "old_status": ComplaintStatus.SUBMITTED.value,
        "new_status": ComplaintStatus.PRIORITIZED.value,
        "action": "AI_TRIAGE",
        "message": "AI triage categorized as Roads & Infrastructure with HIGH priority (0.85).",
        "is_ai_action": True,
        "created_at": t1_created + timedelta(minutes=2),
    })
    updates.append({
        "_id": ObjectId("65e400000000000000000002"),
        "complaint_id": cid_1,
        "updated_by": sup_marcus,
        "old_status": ComplaintStatus.PRIORITIZED.value,
        "new_status": ComplaintStatus.IN_PROGRESS.value,
        "action": "DISPATCH_WORKER",
        "message": "Assigned road repair crew lead Carlos Gomez to inspect and patch pothole.",
        "is_ai_action": False,
        "created_at": t1_created + timedelta(hours=5),
    })
    assignments.append({
        "_id": ObjectId("65e500000000000000000001"),
        "complaint_id": cid_1,
        "department_id": dept_pwd,
        "assigned_to": staff_carlos,
        "assigned_by": sup_marcus,
        "assignment_reason": "Emergency cold-patch asphalt repair required.",
        "assigned_at": t1_created + timedelta(hours=5),
        "accepted_at": t1_created + timedelta(hours=6),
        "completed_at": None,
        "status": AssignmentStatus.ACCEPTED.value,
    })
    notifications.append({
        "_id": ObjectId("65e600000000000000000001"),
        "user_id": c_alice,
        "complaint_id": cid_1,
        "type": NotificationType.IN_APP.value,
        "title": "Complaint Status Update",
        "message": "Your complaint CMP-2026-0001 has been assigned to Carlos Gomez for road repair.",
        "is_read": True,
        "sent_at": t1_created + timedelta(hours=5),
        "created_at": t1_created + timedelta(hours=5),
    })

    # --------------------------------------------------------------------------
    # 2. Duplicate Pothole Complaint (Marked as Duplicate of CMP-2026-0001)
    # --------------------------------------------------------------------------
    cid_2 = ObjectId("65e200000000000000000002")
    t2_created = now - timedelta(days=2, hours=1)
    complaints.append({
        "_id": cid_2,
        "complaint_number": "CMP-2026-0002",
        "user_id": c_bob,
        "description": "Huge pothole at 5th Ave corner near Oak St. My car tire almost burst this morning.",
        "ai_summary": "Pothole hazard reported at 5th Ave and Oak St.",
        "category": "Roads & Infrastructure",
        "subcategory": "Potholes",
        "priority": ComplaintPriority.HIGH.value,
        "priority_score": 0.82,
        "status": ComplaintStatus.DUPLICATE.value,
        "latitude": 40.712790,
        "longitude": -74.005960,
        "address": "5th Ave & Oak St, Ward 4",
        "image_url": None,
        "is_duplicate": True,
        "duplicate_of": cid_1,
        "department_id": dept_pwd,
        "assigned_to": None,
        "sla_deadline": t2_created + timedelta(hours=48),
        "created_at": t2_created,
        "updated_at": t2_created + timedelta(minutes=5),
        "resolved_at": None,
    })
    embeddings.append({
        "_id": ObjectId("65e300000000000000000002"),
        "complaint_id": cid_2,
        "embedding": generate_synthetic_embedding("deep dangerous pothole 5th avenue oak street intersection road damage"),  # High similarity
        "model_name": "text-embedding-004",
        "created_at": t2_created,
    })
    updates.append({
        "_id": ObjectId("65e400000000000000000003"),
        "complaint_id": cid_2,
        "updated_by": None,
        "old_status": ComplaintStatus.SUBMITTED.value,
        "new_status": ComplaintStatus.DUPLICATE.value,
        "action": "AUTO_DUPLICATE_LINK",
        "message": "AI duplicate detection linked this to primary complaint CMP-2026-0001 (Similarity 0.94).",
        "is_ai_action": True,
        "created_at": t2_created + timedelta(minutes=3),
    })

    # --------------------------------------------------------------------------
    # 3. Main Water Pipe Burst (Critical / Escalated)
    # --------------------------------------------------------------------------
    cid_3 = ObjectId("65e200000000000000000003")
    t3_created = now - timedelta(days=1, hours=8)
    t3_sla = t3_created + timedelta(hours=24)
    complaints.append({
        "_id": cid_3,
        "complaint_number": "CMP-2026-0003",
        "user_id": c_charlie,
        "description": "High pressure water pipe burst flooding Elm Street. Drinking water is being wasted and entering basements.",
        "ai_summary": "Major municipal water pipe burst on Elm St causing basement flooding.",
        "category": "Water Supply & Sewerage",
        "subcategory": "Pipeline Leak",
        "priority": ComplaintPriority.CRITICAL.value,
        "priority_score": 0.98,
        "status": ComplaintStatus.ESCALATED.value,
        "latitude": 40.715100,
        "longitude": -74.009200,
        "address": "142 Elm Street, Ward 7",
        "image_url": "https://assets.civic.gov/complaints/water_burst_elm.jpg",
        "is_duplicate": False,
        "duplicate_of": None,
        "department_id": dept_water,
        "assigned_to": staff_sarah,
        "sla_deadline": t3_sla,
        "created_at": t3_created,
        "updated_at": now - timedelta(hours=2),
        "resolved_at": None,
    })
    embeddings.append({
        "_id": ObjectId("65e300000000000000000003"),
        "complaint_id": cid_3,
        "embedding": generate_synthetic_embedding("high pressure water pipe burst flooding elm street basement leak"),
        "model_name": "text-embedding-004",
        "created_at": t3_created,
    })
    updates.append({
        "_id": ObjectId("65e400000000000000000004"),
        "complaint_id": cid_3,
        "updated_by": None,
        "old_status": ComplaintStatus.ASSIGNED.value,
        "new_status": ComplaintStatus.ESCALATED.value,
        "action": "SLA_BREACH_ESCALATION",
        "message": "Automated SLA system triggered escalation due to impending deadline and critical severity.",
        "is_ai_action": True,
        "created_at": now - timedelta(hours=2),
    })
    escalations.append({
        "_id": ObjectId("65e700000000000000000001"),
        "complaint_id": cid_3,
        "escalated_from": staff_sarah,
        "escalated_to": sup_elena,
        "reason": "Water main valve jammed; requires heavy excavator and emergency department head approval.",
        "trigger_type": EscalationTriggerType.CRITICAL.value,
        "priority_before": ComplaintPriority.HIGH.value,
        "priority_after": ComplaintPriority.CRITICAL.value,
        "status": EscalationStatus.OPEN.value,
        "created_at": now - timedelta(hours=2),
        "resolved_at": None,
    })

    # --------------------------------------------------------------------------
    # 4. Overflowing Sanitation Dumpster (Resolved)
    # --------------------------------------------------------------------------
    cid_4 = ObjectId("65e200000000000000000004")
    t4_created = now - timedelta(days=5, hours=2)
    t4_resolved = t4_created + timedelta(hours=8)
    complaints.append({
        "_id": cid_4,
        "complaint_number": "CMP-2026-0004",
        "user_id": c_alice,
        "description": "Commercial dumpster overflowing on Market Street causing severe foul smell and stray animals gathering.",
        "ai_summary": "Overflowing waste dumpster at Market St cleared by sanitation crew.",
        "category": "Solid Waste & Sanitation",
        "subcategory": "Dumpster Overflow",
        "priority": ComplaintPriority.MEDIUM.value,
        "priority_score": 0.60,
        "status": ComplaintStatus.RESOLVED.value,
        "latitude": 40.718000,
        "longitude": -74.002000,
        "address": "88 Market St, Ward 2",
        "image_url": "https://assets.civic.gov/complaints/dumpster_market.jpg",
        "is_duplicate": False,
        "duplicate_of": None,
        "department_id": dept_sanitation,
        "assigned_to": staff_ravi,
        "sla_deadline": t4_created + timedelta(hours=12),
        "created_at": t4_created,
        "updated_at": t4_resolved,
        "resolved_at": t4_resolved,
    })
    embeddings.append({
        "_id": ObjectId("65e300000000000000000004"),
        "complaint_id": cid_4,
        "embedding": generate_synthetic_embedding("commercial dumpster overflowing market street foul smell garbage waste"),
        "model_name": "text-embedding-004",
        "created_at": t4_created,
    })
    updates.append({
        "_id": ObjectId("65e400000000000000000005"),
        "complaint_id": cid_4,
        "updated_by": staff_ravi,
        "old_status": ComplaintStatus.IN_PROGRESS.value,
        "new_status": ComplaintStatus.RESOLVED.value,
        "action": "RESOLVE_COMPLAINT",
        "message": "Compactor truck cleared 2.5 tons of debris and sanitized dumpster enclosure.",
        "is_ai_action": False,
        "created_at": t4_resolved,
    })
    assignments.append({
        "_id": ObjectId("65e500000000000000000002"),
        "complaint_id": cid_4,
        "department_id": dept_sanitation,
        "assigned_to": staff_ravi,
        "assigned_by": users[3]["_id"],
        "assignment_reason": "Scheduled compactor unit dispatch.",
        "assigned_at": t4_created + timedelta(hours=1),
        "accepted_at": t4_created + timedelta(hours=2),
        "completed_at": t4_resolved,
        "status": AssignmentStatus.COMPLETED.value,
    })

    # --------------------------------------------------------------------------
    # 5. Non-functional Streetlight Dark Zone (Assigned)
    # --------------------------------------------------------------------------
    cid_5 = ObjectId("65e200000000000000000005")
    t5_created = now - timedelta(days=1, hours=2)
    complaints.append({
        "_id": cid_5,
        "complaint_number": "CMP-2026-0005",
        "user_id": c_bob,
        "description": "Three consecutive streetlights on Pine Boulevard are completely off creating dark unsafe stretch for pedestrians.",
        "ai_summary": "Multiple dark streetlights on Pine Blvd creating pedestrian hazard.",
        "category": "Electricity & Street Lighting",
        "subcategory": "Streetlight Outage",
        "priority": ComplaintPriority.MEDIUM.value,
        "priority_score": 0.55,
        "status": ComplaintStatus.ASSIGNED.value,
        "latitude": 40.721500,
        "longitude": -74.008100,
        "address": "210-230 Pine Blvd, Ward 5",
        "image_url": None,
        "is_duplicate": False,
        "duplicate_of": None,
        "department_id": dept_electricity,
        "assigned_to": None,
        "sla_deadline": t5_created + timedelta(hours=18),
        "created_at": t5_created,
        "updated_at": t5_created + timedelta(hours=1),
        "resolved_at": None,
    })
    embeddings.append({
        "_id": ObjectId("65e300000000000000000005"),
        "complaint_id": cid_5,
        "embedding": generate_synthetic_embedding("three consecutive streetlights pine boulevard dark pedestrian safety outage"),
        "model_name": "text-embedding-004",
        "created_at": t5_created,
    })

    return complaints, embeddings, updates, assignments, notifications, escalations


def seed_database(db: Database, drop_existing: bool = True) -> Dict[str, int]:
    """
    Seeds all 8 collections with rich demo data and creates all required indexes.
    Returns record counts per collection.
    """
    if drop_existing:
        for coll_name in [
            COMPLAINT_EMBEDDINGS_COLLECTION,
            ESCALATIONS_COLLECTION,
            NOTIFICATIONS_COLLECTION,
            ASSIGNMENTS_COLLECTION,
            COMPLAINT_UPDATES_COLLECTION,
            COMPLAINTS_COLLECTION,
            USERS_COLLECTION,
            DEPARTMENTS_COLLECTION,
        ]:
            db[coll_name].delete_many({})

    # 1. Seed Departments
    departments = get_seed_departments()
    db[DEPARTMENTS_COLLECTION].insert_many(departments)

    # 2. Seed Users
    users = get_seed_users(departments)
    db[USERS_COLLECTION].insert_many(users)

    # 3. Seed Complaints and Related Collections
    complaints, embeddings, updates, assignments, notifications, escalations = get_seed_complaints(
        users, departments
    )

    if complaints:
        db[COMPLAINTS_COLLECTION].insert_many(complaints)
    if embeddings:
        db[COMPLAINT_EMBEDDINGS_COLLECTION].insert_many(embeddings)
    if updates:
        db[COMPLAINT_UPDATES_COLLECTION].insert_many(updates)
    if assignments:
        db[ASSIGNMENTS_COLLECTION].insert_many(assignments)
    if notifications:
        db[NOTIFICATIONS_COLLECTION].insert_many(notifications)
    if escalations:
        db[ESCALATIONS_COLLECTION].insert_many(escalations)

    # 4. Create All Indexes
    create_indexes(db)

    return {
        DEPARTMENTS_COLLECTION: len(departments),
        USERS_COLLECTION: len(users),
        COMPLAINTS_COLLECTION: len(complaints),
        COMPLAINT_EMBEDDINGS_COLLECTION: len(embeddings),
        COMPLAINT_UPDATES_COLLECTION: len(updates),
        ASSIGNMENTS_COLLECTION: len(assignments),
        NOTIFICATIONS_COLLECTION: len(notifications),
        ESCALATIONS_COLLECTION: len(escalations),
    }


if __name__ == "__main__":
    db = get_sync_db()
    print("Seeding MongoDB database...")
    counts = seed_database(db, drop_existing=True)
    print("Database seeding completed successfully:")
    for coll, count in counts.items():
        print(f"  - {coll}: {count} documents")
