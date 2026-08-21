# MongoDB Database Layer

This module provides the complete MongoDB database layer for the **AI Civic Complaint-to-Resolution Intelligence Platform** (Hackathon MVP).

---

## 1. Core 8-Collection Schema Architecture

The platform strictly uses the following **8 collections** with `ObjectId` references:

1. **`users`**: System users across 4 roles (`citizen`, `staff`, `supervisor`, `admin`).
2. **`departments`**: Municipal departments (PWD, Water, Sanitation, Electricity, Health) with SLA definitions.
3. **`complaints`**: Primary civic complaint records containing coordinates, status, category, priority, and duplicate references.
4. **`complaint_updates`**: Immutable audit logs capturing status transitions and AI actions (`is_ai_action=True`).
5. **`assignments`**: Field worker task assignments dispatched by supervisors or automated triage.
6. **`notifications`**: User alert dispatch records across channels (`EMAIL`, `SMS`, `PUSH`, `IN_APP`).
7. **`escalations`**: SLA breach and safety escalation records triggered by threshold rules or manual supervisor actions.
8. **`complaint_embeddings`**: Isolated vector representations (768 dimensions) linked by unique `complaint_id` for semantic similarity search.

---

## 2. Directory Layout

```
database/
├── __init__.py                # Package exports
├── connection.py              # Async (Motor) and Sync (PyMongo) connection managers
├── collections.py             # Collection names, enums, validators, and validation logic
├── indexes.py                 # Unique, compound, and geospatial index definitions
├── seed.py                    # Seed script populating demo departments, users, and complaints
├── queries/
│   ├── __init__.py
│   ├── duplicate_detection.py # Vector + spatial duplicate candidate finder & linking
│   └── recurring_analytics.py # MongoDB Aggregation pipelines for hotspots, spikes, and SLA metrics
└── README.md                  # Documentation
```

---

## 3. Environment Configuration

Create a `.env` file or export the following variables:

```env
# MongoDB Connection URI (Local or Atlas)
MONGODB_URI=mongodb://localhost:27017

# Database Name
MONGODB_DB_NAME=civic_platform

# Connection Pool Settings (Optional)
MONGODB_MAX_POOL_SIZE=50
MONGODB_MIN_POOL_SIZE=10
MONGODB_TIMEOUT_MS=5000
```

---

## 4. Key Capabilities & Usage

### A. Connection Management

```python
# Synchronous (PyMongo) - Used for scripts, migrations, batch tasks
from database.connection import get_sync_db
db = get_sync_db()

# Asynchronous (Motor) - Used for FastAPI endpoints
from database.connection import get_async_db
async_db = get_async_db()
```

### B. Index Creation

```python
from database.connection import get_sync_db
from database.indexes import create_indexes

db = get_sync_db()
create_indexes(db)
```

### C. Seeding Demo Data

```bash
python -m database.seed
```

### D. Duplicate Detection

```python
from database.queries.duplicate_detection import find_duplicate_candidates, mark_complaint_as_duplicate

# Find potential duplicates based on semantic vector similarity and geographic radius
duplicates = find_duplicate_candidates(
    db=db,
    target_complaint_id=complaint_id,
    similarity_threshold=0.82,
    max_distance_km=1.0
)

# Mark complaint as duplicate and create audit entry
mark_complaint_as_duplicate(
    db=db,
    complaint_id=duplicate_id,
    duplicate_of_id=primary_id,
    reason="Identical pothole reported within 50 meters."
)
```

### E. Recurring Complaint Analytics (Aggregation Pipelines)

```python
from database.queries.recurring_analytics import get_recurring_complaints_summary

# Run non-blocking aggregation pipelines across complaints, departments, and escalations
analytics = get_recurring_complaints_summary(db=db, min_cluster_size=2, days_back=30)
```

---

## 5. Running Database Tests

```bash
pytest tests/database/ -v
```
