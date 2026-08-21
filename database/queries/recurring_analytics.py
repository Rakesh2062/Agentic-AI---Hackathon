"""
Recurring Complaint Analytics Engine.
Runs purely on MongoDB Aggregation Pipelines across existing collections (complaints, departments, escalations)
WITHOUT requiring any additional database collections or cache tables.
"""

from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional
from pymongo.database import Database

from database.collections import (
    COMPLAINTS_COLLECTION,
    DEPARTMENTS_COLLECTION,
    ESCALATIONS_COLLECTION,
    ASSIGNMENTS_COLLECTION,
    ComplaintStatus,
)


def get_hotspot_clusters_pipeline(
    min_count: int = 2,
    precision_decimals: int = 3,
    category: Optional[str] = None,
    days_back: Optional[int] = 30,
) -> List[Dict[str, Any]]:
    """
    MongoDB Aggregation Pipeline to detect geographic hotspot clusters.
    Groups complaints by latitude/longitude coordinate bins (e.g. ~100m at 3 decimal places) and category.
    Compatible with both MongoDB Atlas and standard aggregation engines.
    """
    match_stage: Dict[str, Any] = {}
    if days_back:
        cutoff = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=days_back)
        match_stage["created_at"] = {"$gte": cutoff}
    if category:
        match_stage["category"] = category

    pipeline: List[Dict[str, Any]] = []
    if match_stage:
        pipeline.append({"$match": match_stage})

    multiplier = 10 ** precision_decimals

    pipeline.extend([
        {
            "$group": {
                "_id": {
                    "lat_bin": {"$divide": [{"$trunc": {"$multiply": ["$latitude", multiplier]}}, multiplier]},
                    "lon_bin": {"$divide": [{"$trunc": {"$multiply": ["$longitude", multiplier]}}, multiplier]},
                    "category": "$category",
                },
                "total_complaints": {"$sum": 1},
                "duplicate_reports": {
                    "$sum": {"$cond": [{"$eq": ["$is_duplicate", True]}, 1, 0]}
                },
                "active_complaints": {
                    "$sum": {
                        "$cond": [
                            {
                                "$in": [
                                    "$status",
                                    [
                                        ComplaintStatus.SUBMITTED.value,
                                        ComplaintStatus.PROCESSING.value,
                                        ComplaintStatus.CLASSIFIED.value,
                                        ComplaintStatus.PRIORITIZED.value,
                                        ComplaintStatus.ASSIGNED.value,
                                        ComplaintStatus.IN_PROGRESS.value,
                                        ComplaintStatus.ESCALATED.value,
                                    ],
                                ]
                            },
                            1,
                            0,
                        ]
                    }
                },
                "resolved_complaints": {
                    "$sum": {
                        "$cond": [{"$eq": ["$status", ComplaintStatus.RESOLVED.value]}, 1, 0]
                    }
                },
                "critical_count": {
                    "$sum": {"$cond": [{"$eq": ["$priority", "CRITICAL"]}, 1, 0]}
                },
                "avg_priority_score": {"$avg": "$priority_score"},
                "complaint_ids": {"$push": "$_id"},
                "sample_addresses": {"$addToSet": "$address"},
                "latest_complaint_at": {"$max": "$created_at"},
                "first_complaint_at": {"$min": "$created_at"},
            }
        },
        {"$match": {"total_complaints": {"$gte": min_count}}},
        {
            "$project": {
                "_id": 0,
                "latitude": "$_id.lat_bin",
                "longitude": "$_id.lon_bin",
                "category": "$_id.category",
                "total_complaints": 1,
                "duplicate_reports": 1,
                "active_complaints": 1,
                "resolved_complaints": 1,
                "critical_count": 1,
                "avg_priority_score": {"$divide": [{"$trunc": {"$multiply": ["$avg_priority_score", 100]}}, 100]},
                "sample_addresses": {"$slice": ["$sample_addresses", 3]},
                "complaint_count": "$total_complaints",
                "latest_complaint_at": 1,
                "first_complaint_at": 1,
            }
        },
        {"$sort": {"total_complaints": -1, "critical_count": -1}},
    ])

    return pipeline


def get_category_spikes_pipeline(
    days_back: int = 30,
) -> List[Dict[str, Any]]:
    """
    MongoDB Aggregation Pipeline to track complaint velocity and volume spikes across categories.
    """
    cutoff = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=days_back)
    return [
        {"$match": {"created_at": {"$gte": cutoff}}},
        {
            "$group": {
                "_id": {
                    "category": "$category",
                    "date": {"$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}},
                },
                "daily_count": {"$sum": 1},
                "critical_count": {
                    "$sum": {"$cond": [{"$eq": ["$priority", "CRITICAL"]}, 1, 0]}
                },
            }
        },
        {
            "$group": {
                "_id": "$_id.category",
                "total_volume": {"$sum": "$daily_count"},
                "total_critical": {"$sum": "$critical_count"},
                "peak_daily_volume": {"$max": "$daily_count"},
                "daily_history": {
                    "$push": {
                        "date": "$_id.date",
                        "count": "$daily_count",
                        "critical": "$critical_count",
                    }
                },
            }
        },
        {
            "$project": {
                "_id": 0,
                "category": "$_id",
                "total_volume": 1,
                "total_critical": 1,
                "peak_daily_volume": 1,
                "daily_history": 1,
            }
        },
        {"$sort": {"total_volume": -1}},
    ]


def get_department_sla_performance_pipeline() -> List[Dict[str, Any]]:
    """
    MongoDB Aggregation Pipeline to calculate SLA compliance and bottlenecks by department.
    """
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    return [
        {
            "$lookup": {
                "from": DEPARTMENTS_COLLECTION,
                "localField": "department_id",
                "foreignField": "_id",
                "as": "department",
            }
        },
        {
            "$unwind": {
                "path": "$department",
                "preserveNullAndEmptyArrays": True,
            }
        },
        {
            "$project": {
                "department_name": {"$ifNull": ["$department.name", "Unassigned"]},
                "status": 1,
                "priority": 1,
                "created_at": 1,
                "resolved_at": 1,
                "sla_deadline": 1,
                "is_sla_breached": {
                    "$cond": [
                        {
                            "$and": [
                                {"$ne": ["$sla_deadline", None]},
                                {
                                    "$or": [
                                        {"$and": [{"$ne": ["$resolved_at", None]}, {"$gt": ["$resolved_at", "$sla_deadline"]}]},
                                        {"$and": [{"$eq": ["$resolved_at", None]}, {"$gt": [now, "$sla_deadline"]}]},
                                    ]
                                },
                            ]
                        },
                        1,
                        0,
                    ]
                },
                "resolution_time_hours": {
                    "$cond": [
                        {"$and": [{"$ne": ["$resolved_at", None]}, {"$ne": ["$created_at", None]}]},
                        {"$divide": [{"$subtract": ["$resolved_at", "$created_at"]}, 3600000]},
                        None,
                    ]
                },
            }
        },
        {
            "$group": {
                "_id": "$department_name",
                "total_complaints": {"$sum": 1},
                "resolved_complaints": {
                    "$sum": {"$cond": [{"$eq": ["$status", ComplaintStatus.RESOLVED.value]}, 1, 0]}
                },
                "pending_complaints": {
                    "$sum": {"$cond": [{"$ne": ["$status", ComplaintStatus.RESOLVED.value]}, 1, 0]}
                },
                "sla_breaches": {"$sum": "$is_sla_breached"},
                "avg_resolution_time_hours": {"$avg": "$resolution_time_hours"},
            }
        },
        {
            "$project": {
                "_id": 0,
                "department": "$_id",
                "total_complaints": 1,
                "resolved_complaints": 1,
                "pending_complaints": 1,
                "sla_breaches": 1,
                "sla_compliance_rate": {
                    "$cond": [
                        {"$gt": ["$total_complaints", 0]},
                        {
                            "$divide": [
                                {
                                    "$trunc": {
                                        "$multiply": [
                                            {
                                                "$multiply": [
                                                    {"$divide": [{"$subtract": ["$total_complaints", "$sla_breaches"]}, "$total_complaints"]},
                                                    100,
                                                ]
                                            },
                                            10,
                                        ]
                                    }
                                },
                                10,
                            ]
                        },
                        100.0,
                    ]
                },
                "avg_resolution_time_hours": {
                    "$divide": [
                        {"$trunc": {"$multiply": ["$avg_resolution_time_hours", 10]}},
                        10,
                    ]
                },
            }
        },
        {"$sort": {"total_complaints": -1}},
    ]


def get_recurring_complaints_summary(
    db: Database,
    min_cluster_size: int = 2,
    days_back: int = 30,
) -> Dict[str, Any]:
    """
    Executes aggregation pipelines and returns a consolidated recurring complaint intelligence summary.
    """
    hotspot_pipeline = get_hotspot_clusters_pipeline(min_count=min_cluster_size, days_back=days_back)
    hotspots = list(db[COMPLAINTS_COLLECTION].aggregate(hotspot_pipeline))

    spikes_pipeline = get_category_spikes_pipeline(days_back=days_back)
    category_spikes = list(db[COMPLAINTS_COLLECTION].aggregate(spikes_pipeline))

    sla_pipeline = get_department_sla_performance_pipeline()
    dept_performance = list(db[COMPLAINTS_COLLECTION].aggregate(sla_pipeline))

    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "days_window": days_back,
        "total_hotspot_clusters": len(hotspots),
        "hotspots": hotspots,
        "category_trends": category_spikes,
        "department_sla_performance": dept_performance,
    }
