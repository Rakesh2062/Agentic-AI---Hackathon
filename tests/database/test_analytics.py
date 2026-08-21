"""
Tests for Recurring Complaint Analytics Aggregation Pipelines (database/queries/recurring_analytics.py).
"""

import pytest
from datetime import datetime, timezone, timedelta
from bson import ObjectId

from database.collections import (
    COMPLAINTS_COLLECTION,
    DEPARTMENTS_COLLECTION,
    ComplaintStatus,
    ComplaintPriority,
)
from database.queries.recurring_analytics import (
    get_hotspot_clusters_pipeline,
    get_category_spikes_pipeline,
    get_department_sla_performance_pipeline,
    get_recurring_complaints_summary,
)


def test_hotspot_clusters_pipeline_structure():
    """Verifies hotspot aggregation pipeline structure and stages."""
    pipeline = get_hotspot_clusters_pipeline(min_count=2, precision_decimals=3, days_back=30)
    assert len(pipeline) >= 3
    assert "$match" in pipeline[0]
    assert "$group" in pipeline[1]
    assert "$project" in pipeline[3]


def test_hotspot_clusters_execution(seeded_mock_db):
    """
    Verifies that the aggregation correctly detects the hotspot cluster
    for the two pothole complaints at 5th & Oak.
    """
    db = seeded_mock_db
    pipeline = get_hotspot_clusters_pipeline(min_count=2, precision_decimals=3, days_back=60)
    clusters = list(db[COMPLAINTS_COLLECTION].aggregate(pipeline))

    assert len(clusters) >= 1
    pothole_cluster = next((c for c in clusters if c["category"] == "Roads & Infrastructure"), None)
    assert pothole_cluster is not None
    assert pothole_cluster["total_complaints"] == 2
    assert pothole_cluster["duplicate_reports"] == 1
    assert "latitude" in pothole_cluster and "longitude" in pothole_cluster


def test_category_spikes_pipeline_execution(seeded_mock_db):
    """Verifies category trends and spikes aggregation pipeline execution."""
    db = seeded_mock_db
    pipeline = get_category_spikes_pipeline(days_back=60)
    spikes = list(db[COMPLAINTS_COLLECTION].aggregate(pipeline))

    assert len(spikes) >= 1
    categories = [s["category"] for s in spikes]
    assert "Roads & Infrastructure" in categories
    assert "Water Supply & Sewerage" in categories


def test_department_sla_performance_execution(seeded_mock_db):
    """Verifies department SLA compliance aggregation pipeline execution."""
    db = seeded_mock_db
    pipeline = get_department_sla_performance_pipeline()
    dept_metrics = list(db[COMPLAINTS_COLLECTION].aggregate(pipeline))

    assert len(dept_metrics) >= 1
    for metric in dept_metrics:
        assert "department" in metric
        assert "total_complaints" in metric
        assert "resolved_complaints" in metric
        assert "sla_compliance_rate" in metric


def test_recurring_complaints_summary(seeded_mock_db):
    """Verifies unified recurring complaint intelligence summary function."""
    db = seeded_mock_db
    summary = get_recurring_complaints_summary(db=db, min_cluster_size=2, days_back=60)

    assert "generated_at" in summary
    assert "days_window" in summary
    assert "total_hotspot_clusters" in summary
    assert "hotspots" in summary
    assert "category_trends" in summary
    assert "department_sla_performance" in summary
    assert summary["total_hotspot_clusters"] >= 1
