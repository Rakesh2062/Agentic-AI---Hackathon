"""
FastAPI & Database Bridge Integration Tests.
Tests FastAPI endpoints, health checks, and database read/write operations.
"""

import os
import sys
from datetime import datetime, timezone
import pytest
from bson import ObjectId
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient

# Ensure workspace root and Backend/ are in sys.path
workspace_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
backend_path = os.path.join(workspace_root, "Backend")
if workspace_root not in sys.path:
    sys.path.insert(0, workspace_root)
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from Backend.main import app
from database.collections import COMPLAINTS_COLLECTION, ComplaintStatus, ComplaintPriority


@pytest.fixture
def client():
    """Returns a FastAPI TestClient."""
    return TestClient(app)


def test_root_endpoint(client):
    """Verifies GET / returns service information and agent list."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["service"] == "CivicPulse AI Backend"
    assert data["status"] == "running"
    assert "ClassificationAgent" in data["agents"]


def test_health_endpoint_connected(client):
    """Verifies GET /health returns ok when database is connected."""
    with patch("Backend.main.ping_async_db", new_callable=AsyncMock) as mock_ping:
        mock_ping.return_value = True
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["database"] == "connected"


def test_health_endpoint_disconnected(client):
    """Verifies GET /health returns degraded when database is disconnected."""
    with patch("Backend.main.ping_async_db", new_callable=AsyncMock) as mock_ping:
        mock_ping.return_value = False
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "degraded"
        assert data["database"] == "disconnected"


def test_dashboard_departments_endpoint(client):
    """Verifies GET /api/v1/dashboard/departments returns department roster."""
    response = client.get("/api/v1/dashboard/departments")
    assert response.status_code == 200
    data = response.json()
    assert "departments" in data
    assert len(data["departments"]) > 0


@pytest.mark.asyncio
async def test_database_bridge_read_write(mock_db):
    """
    Verifies that the FastAPI DB bridge can write a complaint document
    and read it back from the canonical COMPLAINTS_COLLECTION.
    """
    # Write a test complaint
    test_complaint = {
        "complaint_id": "CMP-TEST-001",
        "complaint_number": "CMP-TEST-001",
        "description": "Integration test pothole on Broadway.",
        "category": "Roads & Infrastructure",
        "priority": ComplaintPriority.HIGH.value,
        "status": ComplaintStatus.SUBMITTED.value,
        "latitude": 40.7128,
        "longitude": -74.0060,
        "address": "Broadway & Main St",
        "is_duplicate": False,
        "citizen_message": "Complaint received and verified.",
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }

    insert_result = mock_db[COMPLAINTS_COLLECTION].insert_one(test_complaint)
    assert insert_result.inserted_id is not None

    # Read back from canonical collection
    found = mock_db[COMPLAINTS_COLLECTION].find_one({"complaint_id": "CMP-TEST-001"})
    assert found is not None
    assert found["complaint_number"] == "CMP-TEST-001"
    assert found["description"] == "Integration test pothole on Broadway."
    assert found["status"] == ComplaintStatus.SUBMITTED.value
