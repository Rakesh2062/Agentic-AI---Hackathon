"""
Analytics routes — recurring-problem hotspots, department leaderboard.
"""

import logging
from datetime import datetime
from fastapi import APIRouter, Query

from schemas.models import AnalyticsHotspot, DepartmentStats
from database.connection import get_db
from database.collections import COMPLAINTS_COLLECTION

log = logging.getLogger(__name__)

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get(
    "/metrics",
    summary="Live citywide analytics metrics",
    description="Returns metrics calculated from the complaints currently stored in MongoDB.",
)
async def get_live_metrics():
    """Calculate dashboard counters from live complaint records."""
    db = get_db()
    cases = await db[COMPLAINTS_COLLECTION].find({}).to_list(None)
    total = len(cases)
    classified = sum(1 for case in cases if case.get("category"))
    duplicates = sum(
        1 for case in cases
        if case.get("is_duplicate") or case.get("status") == "duplicate"
    )
    resolved = [
        case for case in cases
        if case.get("status") in {"resolved", "closed"}
    ]

    def _as_datetime(value):
        if isinstance(value, datetime):
            return value.replace(tzinfo=None)
        if isinstance(value, str):
            try:
                return datetime.fromisoformat(value.replace("Z", "+00:00")).replace(tzinfo=None)
            except ValueError:
                return None
        return None

    resolved_with_sla = 0
    resolved_within_sla = 0
    for case in resolved:
        deadline = _as_datetime(case.get("sla_deadline"))
        completed_at = _as_datetime(case.get("resolved_at") or case.get("updated_at"))
        if deadline and completed_at:
            resolved_with_sla += 1
            if completed_at <= deadline:
                resolved_within_sla += 1

    wards = {
        (case.get("location") or {}).get("ward")
        for case in cases
        if (case.get("location") or {}).get("ward")
    }

    return {
        "total_complaints_processed": total,
        "classified_complaints": classified,
        "ai_classification_accuracy": round((classified / total * 100) if total else 0, 1),
        "duplicates_merged_count": duplicates,
        "resolved_complaints": len(resolved),
        "sla_compliance_rate": round(
            (resolved_within_sla / resolved_with_sla * 100) if resolved_with_sla else 0,
            1,
        ),
        "active_wards": len(wards),
    }


@router.get(
    "/recurring",
    response_model=list[AnalyticsHotspot],
    summary="Recurring problem hotspots",
    description="Locations with the most complaints in a given time window.",
)
async def get_recurring_hotspots(
    limit: int = Query(10, le=50),
):
    """
    Aggregate complaints by location to find hotspots.
    """
    db = get_db()

    pipeline = [
        {"$match": {"latitude": {"$ne": None}, "longitude": {"$ne": None}}},
        {
            "$group": {
                "_id": {
                    "address": "$address",
                    "category": "$category",
                },
                "total_complaints": {"$sum": 1},
                "open_cases": {
                    "$sum": {
                        "$cond": [
                            {"$in": ["$status", ["submitted", "under_review", "assigned", "in_progress", "SUBMITTED", "PROCESSING", "CLASSIFIED", "PRIORITIZED", "ASSIGNED", "IN_PROGRESS", "ESCALATED"]]},
                            1, 0,
                        ]
                    }
                },
                "resolved_cases": {
                    "$sum": {
                        "$cond": [
                            {"$in": ["$status", ["resolved", "closed", "RESOLVED"]]},
                            1, 0,
                        ]
                    }
                },
                "top_category": {"$first": "$category"},
                "complaint_ids": {"$push": {"$ifNull": ["$complaint_id", "$complaint_number"]}},
                "sample_lat": {"$first": "$latitude"},
                "sample_lng": {"$first": "$longitude"},
                "sample_address": {"$first": "$address"},
            }
        },
        {"$sort": {"total_complaints": -1}},
        {"$limit": limit},
    ]

    results = await db[COMPLAINTS_COLLECTION].aggregate(pipeline).to_list(limit)

    hotspots = []
    for r in results:
        addr = r.get("sample_address") or (r["_id"]["address"] if isinstance(r["_id"], dict) else "General Area")
        hotspots.append(
            AnalyticsHotspot(
                location={
                    "lat": r.get("sample_lat", 0),
                    "lng": r.get("sample_lng", 0),
                    "address": addr,
                    "ward": addr,
                    "zone": None,
                },
                total_complaints=r["total_complaints"],
                open_cases=r["open_cases"],
                resolved_cases=r["resolved_cases"],
                top_category=r["top_category"],
                complaint_ids=[str(cid) for cid in r.get("complaint_ids", [])[:10]],
            )
        )

    return hotspots


@router.get(
    "/leaderboard",
    response_model=list[DepartmentStats],
    summary="Department accountability leaderboard",
    description="Departments ranked by resolution performance.",
)
async def get_department_leaderboard():
    """All departments ranked by total cases and resolution rate."""
    db = get_db()

    pipeline = [
        {
            "$group": {
                "_id": {"$ifNull": ["$department", "$category"]},
                "total_cases": {"$sum": 1},
                "open_cases": {
                    "$sum": {
                        "$cond": [
                            {"$in": ["$status", ["submitted", "under_review", "assigned", "SUBMITTED", "PROCESSING", "CLASSIFIED", "PRIORITIZED", "ASSIGNED"]]},
                            1, 0,
                        ]
                    }
                },
                "in_progress": {
                    "$sum": {"$cond": [{"$in": ["$status", ["in_progress", "IN_PROGRESS"]]}, 1, 0]}
                },
                "resolved": {
                    "$sum": {
                        "$cond": [
                            {"$in": ["$status", ["resolved", "closed", "RESOLVED"]]},
                            1, 0,
                        ]
                    }
                },
                "escalated": {
                    "$sum": {"$cond": [{"$in": ["$status", ["escalated", "ESCALATED"]]}, 1, 0]}
                },
            }
        },
        {"$sort": {"resolved": -1}},
    ]

    results = await db[COMPLAINTS_COLLECTION].aggregate(pipeline).to_list(50)

    return [
        DepartmentStats(
            department=r["_id"] or "Unassigned",
            total_cases=r["total_cases"],
            open_cases=r["open_cases"],
            in_progress=r["in_progress"],
            resolved=r["resolved"],
            escalated=r["escalated"],
        )
        for r in results
        if r["_id"] is not None
    ]


@router.get(
    "/insights",
    summary="AI-Generated Analytics Insights",
    description="Run the AI Analytics Agent to detect trends and insights.",
)
async def get_ai_insights(department: str | None = None):
    """Trigger the Orchestrator to run the analytics agent."""
    from agents.orchestrator import Orchestrator
    
    orchestrator = Orchestrator()
    filters = {"department": department} if department else {}
    
    result = await orchestrator.run_analytics(filters=filters)
    return result.model_dump()
