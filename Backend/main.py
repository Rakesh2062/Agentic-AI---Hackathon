"""
CivicPulse AI — FastAPI Application Entry Point

Start with:
    cd Backend
    uvicorn main:app --reload --port 8000
"""

import os
import sys
import logging
from contextlib import asynccontextmanager

# Ensure Backend/ and workspace root are in sys.path for both local and root execution
backend_dir = os.path.dirname(os.path.abspath(__file__))
workspace_root = os.path.abspath(os.path.join(backend_dir, ".."))
for p in (backend_dir, workspace_root):
    if p not in sys.path:
        sys.path.insert(0, p)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes_intake import router as intake_router
from api.routes_dashboard import router as dashboard_router, user_router
from api.routes_analytics import router as analytics_router
from api.routes_status import router as status_router
from api.routes_auth import router as auth_router
from database.connection import ping_async_db, close_async_client

logger = logging.getLogger("civicpulse")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manages application lifecycle, validating DB connectivity and closing connection pools."""
    logger.info("Starting CivicPulse AI Backend...")
    try:
        is_connected = await ping_async_db()
        if is_connected:
            logger.info("Connected to MongoDB successfully.")
        else:
            logger.warning("MongoDB ping failed; please check MONGODB_URI.")
    except Exception as e:
        logger.warning("MongoDB connection check encountered: %s", e)
    yield
    logger.info("Shutting down CivicPulse AI Backend...")
    close_async_client()
    logger.info("MongoDB async client closed.")


app = FastAPI(
    title="CivicPulse AI Backend",
    description=(
        "Agentic AI backend for civic complaint processing. "
        "Agents: Classification, Duplicate Detection, Priority, Routing, Escalation, Resolution, Analytics."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# CORS — allow the Vite frontend (localhost:5173 by default)
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",   # Vite dev server
        "http://localhost:3000",   # Alternative dev port
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Mount all API routers under /api/v1 (matches frontend client.js BASE_URL)
# ---------------------------------------------------------------------------
PREFIX = "/api/v1"

app.include_router(intake_router, prefix=PREFIX)
app.include_router(dashboard_router, prefix=PREFIX)
app.include_router(analytics_router, prefix=PREFIX)
app.include_router(status_router, prefix=PREFIX)
app.include_router(auth_router, prefix=PREFIX)
app.include_router(user_router, prefix=PREFIX)


@app.get("/", tags=["Health"])
async def root():
    return {
        "service": "CivicPulse AI Backend",
        "status": "running",
        "docs": "/docs",
        "agents": [
            "ClassificationAgent",
            "DuplicateAgent",
            "PriorityAgent",
            "RoutingAgent",
            "EscalationAgent",
            "ResolutionAgent",
            "AnalyticsAgent",
        ],
    }


@app.get("/health", tags=["Health"])
async def health():
    db_connected = await ping_async_db()
    return {
        "status": "ok" if db_connected else "degraded",
        "database": "connected" if db_connected else "disconnected",
    }
