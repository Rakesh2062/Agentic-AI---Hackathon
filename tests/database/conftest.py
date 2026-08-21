"""
Pytest configuration and test fixtures for the database test suite.
Provides in-memory mongomock database fixtures and seeded mock databases.
"""

import os
import sys
from typing import Generator
import pytest
from bson import ObjectId

# Ensure workspace root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

import mongomock
from database.collections import COLLECTIONS
from database.seed import seed_database
from database.indexes import create_indexes


@pytest.fixture
def mock_client() -> mongomock.MongoClient:
    """Returns a clean in-memory mongomock client for testing."""
    return mongomock.MongoClient()


@pytest.fixture
def mock_db(mock_client: mongomock.MongoClient):
    """Returns a clean in-memory database instance."""
    db = mock_client["test_civic_platform"]
    for col in COLLECTIONS:
        db[col].delete_many({})
    return db


@pytest.fixture
def seeded_mock_db(mock_db) -> mongomock.Database:
    """Returns a mongomock database pre-populated with standard seed data and indexes."""
    seed_database(mock_db, drop_existing=True)
    return mock_db
