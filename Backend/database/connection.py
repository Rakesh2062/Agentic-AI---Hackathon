"""
Database connection manager supporting both Async (Motor) and Sync (PyMongo) clients.
"""

import os
from typing import Optional
from dotenv import load_dotenv
import pymongo
from pymongo import MongoClient
from pymongo.database import Database
import certifi

# Load environment variables if available
load_dotenv()

# Environment Configurations
MONGODB_URI = os.getenv("MONGODB_URI") or os.getenv("MONGO_URI") or "mongodb://localhost:27017"
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME") or os.getenv("MONGO_DB") or "civic_platform"
MAX_POOL_SIZE = int(os.getenv("MONGODB_MAX_POOL_SIZE", "50"))
MIN_POOL_SIZE = int(os.getenv("MONGODB_MIN_POOL_SIZE", "10"))
TIMEOUT_MS = int(os.getenv("MONGODB_TIMEOUT_MS", "5000"))

# Global Client Singletons
_sync_client: Optional[MongoClient] = None
_async_client = None  # Lazy-loaded Motor client


def get_sync_client(uri: Optional[str] = None) -> MongoClient:
    """
    Returns a synchronous PyMongo MongoClient instance.
    Reuses existing client singleton if uri matches default.
    """
    global _sync_client
    target_uri = uri or MONGODB_URI
    if _sync_client is None or uri is not None:
        client_kwargs = {
            "maxPoolSize": MAX_POOL_SIZE,
            "minPoolSize": MIN_POOL_SIZE,
            "serverSelectionTimeoutMS": TIMEOUT_MS,
            "connectTimeoutMS": TIMEOUT_MS,
        }
        if "mongodb+srv://" in target_uri:
            client_kwargs["tlsCAFile"] = certifi.where()

        client = MongoClient(target_uri, **client_kwargs)
        if uri is None:
            _sync_client = client
            return _sync_client
        return client
    return _sync_client


def get_sync_db(db_name: Optional[str] = None, client: Optional[MongoClient] = None) -> Database:
    """
    Returns a synchronous Database instance for the specified or default database name.
    """
    target_db = db_name or MONGODB_DB_NAME
    cli = client or get_sync_client()
    return cli[target_db]


def close_sync_client() -> None:
    """Closes the synchronous PyMongo client singleton."""
    global _sync_client
    if _sync_client is not None:
        _sync_client.close()
        _sync_client = None


def ping_sync_db(client: Optional[MongoClient] = None) -> bool:
    """
    Pings the MongoDB server synchronously to verify connection health.
    Returns True if reachable, False otherwise.
    """
    try:
        cli = client or get_sync_client()
        cli.admin.command("ping")
        return True
    except Exception:
        return False


def get_async_client(uri: Optional[str] = None):
    """
    Returns an asynchronous Motor AsyncIOMotorClient instance.
    Lazy imports motor to ensure environments without asyncio can still import connection.py.
    """
    global _async_client
    try:
        from motor.motor_asyncio import AsyncIOMotorClient
    except ImportError:
        raise ImportError(
            "The 'motor' package is required for async MongoDB access. "
            "Please install motor: pip install motor"
        )

    target_uri = uri or MONGODB_URI
    if _async_client is None or uri is not None:
        client_kwargs = {
            "maxPoolSize": MAX_POOL_SIZE,
            "minPoolSize": MIN_POOL_SIZE,
            "serverSelectionTimeoutMS": TIMEOUT_MS,
            "connectTimeoutMS": TIMEOUT_MS,
        }
        if "mongodb+srv://" in target_uri:
            client_kwargs["tlsCAFile"] = certifi.where()
            
        client = AsyncIOMotorClient(target_uri, **client_kwargs)
        if uri is None:
            _async_client = client
            return _async_client
        return client
    return _async_client


def get_async_db(db_name: Optional[str] = None, client=None):
    """
    Returns an asynchronous Motor Database instance for the specified or default database name.
    """
    target_db = db_name or MONGODB_DB_NAME
    cli = client or get_async_client()
    return cli[target_db]


def close_async_client() -> None:
    """Closes the asynchronous Motor client singleton."""
    global _async_client
    if _async_client is not None:
        _async_client.close()
        _async_client = None


async def ping_async_db(client=None) -> bool:
    """
    Pings the MongoDB server asynchronously to verify connection health.
    Returns True if reachable, False otherwise.
    """
    try:
        cli = client or get_async_client()
        await cli.admin.command("ping")
        return True
    except Exception:
        return False


def ping_database(client: Optional[MongoClient] = None) -> bool:
    """Convenience alias for ping_sync_db."""
    return ping_sync_db(client)

get_db = get_async_db

