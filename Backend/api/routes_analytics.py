"""
Analytics routes — recurring-problem hotspots, department leaderboard.
"""

from fastapi import APIRouter, Query

from db.database import get_db
from schemas.models import AnalyticsHotspot, DepartmentStats
from utils.logger import get_logger

log = get_logger(__name__)

router = APIRouter(prefix="/analytics", tags=["Analytics"])


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

    Stubbed: returns cases grouped by ward. Real version would
    use geo-clustering (e.g., DBSCAN on coordinates).
    """
    db = get_db()

    pipeline = [
        {"$match": {"location": {"$ne": None}}},
        {
            "$group": {
                "_id": "$location.ward",
                "total_complaints": {"$sum": "$citizen_count"},
                "open_cases": {
                    "$sum": {
                        "$cond": [
                            {"$in": ["$status", ["submitted", "under_review", "assigned", "in_progress"]]},
                            1, 0,
                        ]
                    }
                },
                "resolved_cases": {
                    "$sum": {
                        "$cond": [
                            {"$in": ["$status", ["resolved", "closed"]]},
                            1, 0,
                        ]
                    }
                },
                "top_category": {"$first": "$category"},
                "complaint_ids": {"$push": "$complaint_id"},
                "sample_location": {"$first": "$location"},
            }
        },
        {"$sort": {"total_complaints": -1}},
        {"$limit": limit},
    ]

    results = await db.cases.aggregate(pipeline).to_list(limit)

    hotspots = []
    for r in results:
        loc = r.get("sample_location", {})
        hotspots.append(
            AnalyticsHotspot(
                location={
                    "lat": loc.get("lat", 0),
                    "lng": loc.get("lng", 0),
                    "address": loc.get("address"),
                    "ward": r["_id"],
                    "zone": loc.get("zone"),
                },
                total_complaints=r["total_complaints"],
                open_cases=r["open_cases"],
                resolved_cases=r["resolved_cases"],
                top_category=r["top_category"],
                complaint_ids=r.get("complaint_ids", [])[:10],  # cap for response size
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
                "_id": "$department",
                "total_cases": {"$sum": 1},
                "open_cases": {
                    "$sum": {
                        "$cond": [
                            {"$in": ["$status", ["submitted", "under_review", "assigned"]]},
                            1, 0,
                        ]
                    }
                },
                "in_progress": {
                    "$sum": {"$cond": [{"$eq": ["$status", "in_progress"]}, 1, 0]}
                },
                "resolved": {
                    "$sum": {
                        "$cond": [
                            {"$in": ["$status", ["resolved", "closed"]]},
                            1, 0,
                        ]
                    }
                },
                "escalated": {
                    "$sum": {"$cond": [{"$eq": ["$status", "escalated"]}, 1, 0]}
                },
            }
        },
        {"$sort": {"resolved": -1}},
    ]

    results = await db.cases.aggregate(pipeline).to_list(50)

    return [
        DepartmentStats(
            department=r["_id"],
            total_cases=r["total_cases"],
            open_cases=r["open_cases"],
            in_progress=r["in_progress"],
            resolved=r["resolved"],
            escalated=r["escalated"],
        )
        for r in results
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
