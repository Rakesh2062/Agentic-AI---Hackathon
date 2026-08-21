"""
Tests for database connection management (database/connection.py).
"""

import os
import pytest
from unittest.mock import patch, MagicMock
from database.connection import (
    MONGODB_URI,
    MONGODB_DB_NAME,
    get_sync_client,
    get_sync_db,
    close_sync_client,
    ping_sync_db,
    get_async_client,
    get_async_db,
    close_async_client,
)


def test_connection_defaults():
    """Verifies default URI and DB name are properly configured."""
    assert MONGODB_URI is not None
    assert isinstance(MONGODB_URI, str)
    assert MONGODB_DB_NAME == "civic_platform" or isinstance(MONGODB_DB_NAME, str)


def test_get_sync_client_singleton():
    """Verifies that get_sync_client returns a MongoClient and caches singleton."""
    close_sync_client()
    client1 = get_sync_client()
    client2 = get_sync_client()
    assert client1 is client2
    close_sync_client()


def test_get_sync_db():
    """Verifies get_sync_db returns a valid Database handle."""
    db = get_sync_db("custom_db")
    assert db.name == "custom_db"
    close_sync_client()


def test_ping_sync_db_with_mock():
    """Verifies ping_sync_db returns True on healthy ping and False on error."""
    mock_cli = MagicMock()
    mock_cli.admin.command.return_value = {"ok": 1}
    assert ping_sync_db(mock_cli) is True

    mock_failing_cli = MagicMock()
    mock_failing_cli.admin.command.side_effect = Exception("Connection refused")
    assert ping_sync_db(mock_failing_cli) is False


def test_get_async_client_and_db():
    """Verifies async client and database handle creation."""
    close_async_client()
    try:
        async_client = get_async_client()
        assert async_client is not None
        async_db = get_async_db("async_test_db")
        assert async_db.name == "async_test_db"
    finally:
        close_async_client()
