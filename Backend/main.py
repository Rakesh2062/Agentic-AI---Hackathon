"""
CivicPulse AI — FastAPI Application Entry Point

Start with:
    cd Backend
    uvicorn main:app --reload --port 8000
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes_intake import router as intake_router
from api.routes_dashboard import router as dashboard_router
from api.routes_analytics import router as analytics_router
from api.routes_status import router as status_router

app = FastAPI(
    title="CivicPulse AI Backend",
    description=(
        "Agentic AI backend for civic complaint processing. "
        "Agents: Classification, Duplicate Detection, Priority, Routing, Escalation, Resolution, Analytics."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
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
    return {"status": "ok"}
