# AI Civic Complaint-to-Resolution Intelligence Platform

## Agent Layer

This directory contains the **complete agentic AI layer** for processing civic complaints. It is fully independent from FastAPI, React, and database implementations.

---

## Architecture

```
agents/
├── orchestrator.py            # Central coordinator — entry point for all operations
│
├── classification/            # Classifies complaints into fixed categories
│   ├── agent.py
│   └── prompts.py
│
├── duplicate/                 # Embedding + similarity search + LLM dedup pipeline
│   ├── agent.py
│   └── prompts.py
│
├── priority/                  # Deterministic rules + LLM for urgency scoring
│   ├── agent.py
│   └── prompts.py
│
├── routing/                   # Recommends responsible department (validated against tool data)
│   ├── agent.py
│   └── prompts.py
│
├── escalation/                # SLA/critical/cluster triggers + LLM nuance
│   ├── agent.py
│   └── prompts.py
│
├── resolution/                # Generates citizen-facing resolution messages
│   ├── agent.py
│   └── prompts.py
│
├── analytics/                 # Recurring-problem detection from aggregated data
│   ├── agent.py
│   └── prompts.py
│
├── tools/                     # Tool interfaces with mock implementations
│   ├── complaint_tools.py     # CRUD for complaints
│   ├── search_tools.py        # Embedding generation + similarity search
│   ├── department_tools.py    # Department lookup + SLA retrieval
│   ├── location_tools.py      # Geocoding + distance calculation
│   └── notification_tools.py  # Citizen notification dispatch
│
├── state/
│   └── complaint_state.py     # Shared Pydantic state object
│
├── schemas/
│   └── agent_outputs.py       # Structured output schemas for all agents
│
├── config.py                  # LLM abstraction, enums, constants
│
├── example_usage.py           # End-to-end demo script
│
└── README.md                  # This file
```

---

## Complaint Processing Workflow

```
Citizen submits complaint
        │
        ▼
┌─────────────────────┐
│  Classification      │  → category, subcategory, summary, confidence
│  Agent               │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  Duplicate           │  → embedding → similarity search → LLM evaluation
│  Agent               │
└────────┬────────────┘
         │  (if not duplicate)
         ▼
┌─────────────────────┐
│  Priority            │  → deterministic base + LLM contextual reasoning
│  Agent               │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  Routing             │  → validated against actual department list
│  Agent               │
└────────┬────────────┘
         │
         ▼
  AI RECOMMENDATIONS RETURNED
         │
         ▼
┌─────────────────────┐
│  ADMIN reviews       │  → accepts / modifies / rejects
│  (human-in-the-loop) │
└────────┬────────────┘
         │
         ▼
  Complaint assigned → status tracked
         │
         ▼
┌─────────────────────┐
│  Escalation          │  → SLA check, critical priority, cluster detection
│  Agent               │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  Resolution          │  → citizen-facing explanation + notification
│  Agent               │
└─────────────────────┘
```

---

## User Roles

| Role    | Capabilities |
|---------|-------------|
| **Citizen** | Submit complaints, provide description/image/location, view status, receive AI explanations |
| **Admin**   | Review AI recommendations, accept/override department & priority, update status, resolve/escalate, view analytics |

---

## How FastAPI Integrates with the Agent Layer

The agent layer exposes clean Python interfaces. FastAPI simply calls them:

```python
from agents.orchestrator import Orchestrator
from agents.config import ComplaintStatus, PriorityLevel

orchestrator = Orchestrator()

# 1. Process a new complaint
@app.post("/api/complaints")
async def create_complaint(data: ComplaintCreate):
    result = await orchestrator.process_complaint(data.dict())
    save_to_database(result.state)
    return result.to_dict()

# 2. Admin overrides AI recommendations
@app.post("/api/complaints/{id}/override")
async def admin_override(id: str, override: AdminOverride):
    state = load_from_database(id)
    updated = await orchestrator.admin_override(
        state,
        department=override.department,
        priority=override.priority,
        status=override.status,
        notes=override.notes,
    )
    save_to_database(updated)
    return updated.model_dump()

# 3. Check escalation
@app.post("/api/complaints/{id}/escalation-check")
async def check_escalation(id: str):
    state = load_from_database(id)
    result = await orchestrator.check_escalation(state)
    return result.model_dump()

# 4. Generate resolution explanation
@app.post("/api/complaints/{id}/resolve")
async def resolve(id: str, body: ResolveRequest):
    state = load_from_database(id)
    result = await orchestrator.generate_resolution(
        state, body.admin_action, body.notes
    )
    return result.model_dump()

# 5. Analytics
@app.get("/api/analytics")
async def analytics(category: str = None):
    result = await orchestrator.run_analytics({"category": category} if category else None)
    return result.model_dump()
```

---

## Replacing Mock Tools with Real Implementations

Each tool file in `agents/tools/` contains mock implementations with comments showing the SQL/API call to use in production.

### Example: `search_tools.py`

```python
# MOCK:
async def search_similar_complaints(embedding, top_k=5, threshold=0.5):
    return _MOCK_SIMILAR_RESULTS  # ← replace this

# PRODUCTION (pgvector):
async def search_similar_complaints(embedding, top_k=5, threshold=0.5):
    query = """
        SELECT complaint_id, description, category, location,
               1 - (embedding <=> $1::vector) AS similarity_score
        FROM complaint_embeddings
        WHERE 1 - (embedding <=> $1::vector) >= $2
        ORDER BY similarity_score DESC
        LIMIT $3
    """
    return await db.fetch(query, embedding, threshold, top_k)
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `LLM_PROVIDER` | `gemini` | LLM provider: `gemini`, `groq`, `openai` |
| `LLM_API_KEY` | *(required)* | API key for the LLM provider |
| `LLM_MODEL_NAME` | `gemini-2.0-flash` | Model to use for text generation |
| `EMBEDDING_MODEL` | `models/text-embedding-004` | Model for embedding generation |
| `LLM_TEMPERATURE` | `0.2` | Generation temperature |
| `LLM_MAX_TOKENS` | `2048` | Max output tokens |

---

## Running the Example

```bash
cd Backend

# Set your LLM API key
set LLM_API_KEY=your-api-key-here
set LLM_PROVIDER=gemini

# Install dependencies
pip install pydantic google-genai

# Run the example
python -m agents.example_usage
```

---

## Key Design Decisions

1. **Human-in-the-loop**: AI recommendations are never final. The admin always has the last word via `admin_override()`.

2. **Deterministic + LLM hybrid**: Priority and escalation agents use rule-based baselines before invoking the LLM, ensuring predictable behavior and graceful fallbacks.

3. **Embedding-first dedup**: The duplicate agent uses vector similarity search before LLM evaluation, preventing the LLM from hallucinating duplicate status.

4. **Department validation**: The routing agent fetches the valid department list from tools, so it can never hallucinate departments.

5. **Structured outputs**: Every agent returns a Pydantic model — never raw strings.

6. **Provider abstraction**: The `BaseLLMClient` interface supports Gemini, Groq, and OpenAI out of the box. Adding a new provider requires implementing two methods: `generate()` and `embed()`.

7. **Audit trail**: Every agent execution produces an `AuditEvent` with timestamps, success/failure, and confidence scores.

8. **Graceful degradation**: If any agent fails, it returns a safe fallback result and the orchestrator continues processing.
