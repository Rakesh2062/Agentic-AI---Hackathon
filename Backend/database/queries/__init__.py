"""
Database Query and Analytics Module
"""

from database.queries.duplicate_detection import (
    find_duplicate_candidates,
    find_duplicate_candidates_vector_pipeline,
    compute_cosine_similarity,
    mark_complaint_as_duplicate,
)
from database.queries.recurring_analytics import (
    get_hotspot_clusters_pipeline,
    get_category_spikes_pipeline,
    get_department_sla_performance_pipeline,
    get_recurring_complaints_summary,
)

__all__ = [
    "find_duplicate_candidates",
    "find_duplicate_candidates_vector_pipeline",
    "compute_cosine_similarity",
    "mark_complaint_as_duplicate",
    "get_hotspot_clusters_pipeline",
    "get_category_spikes_pipeline",
    "get_department_sla_performance_pipeline",
    "get_recurring_complaints_summary",
]
