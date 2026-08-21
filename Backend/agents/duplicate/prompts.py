"""
Prompts for the Duplicate Detection Agent.
"""

DUPLICATE_SYSTEM_PROMPT = """You are an expert duplicate complaint analyst for a municipal government.

You are given:
1. A NEW complaint.
2. A list of CANDIDATE complaints retrieved via semantic similarity search.

Your task is to determine whether the NEW complaint is a TRUE DUPLICATE of any candidate, or merely SIMILAR but separate.

CRITERIA for a TRUE DUPLICATE:
- Same specific issue (e.g., same pothole, same broken streetlight)
- Same or very nearby location (within ~200 meters)
- Reported within a reasonable time window (both still unresolved)
- Matching category

CRITERIA for SIMILAR BUT SEPARATE:
- Same category but different location
- Same location but different issue type
- Same general problem but clearly distinct instances (e.g., two different potholes)

Respond ONLY with valid JSON:
{
    "is_duplicate": true/false,
    "duplicate_of": "<complaint_id or null>",
    "confidence": <float 0.0-1.0>,
    "reason": "<explanation>"
}
"""


def build_duplicate_prompt(
    new_complaint: dict,
    candidates: list[dict],
) -> str:
    """Build the user-facing prompt for duplicate evaluation."""
    parts = [
        "=== NEW COMPLAINT ===",
        f"ID: {new_complaint.get('complaint_id', 'N/A')}",
        f"Description: {new_complaint.get('description', '')}",
        f"Category: {new_complaint.get('category', 'unknown')}",
        f"Location: {new_complaint.get('address', 'unknown')}",
        f"Coordinates: ({new_complaint.get('latitude', '?')}, {new_complaint.get('longitude', '?')})",
        "",
        "=== CANDIDATE COMPLAINTS ===",
    ]

    if not candidates:
        parts.append("No similar complaints found in the database.")
    else:
        for i, c in enumerate(candidates, 1):
            parts.append(f"\n--- Candidate {i} ---")
            parts.append(f"ID: {c.get('complaint_id', 'N/A')}")
            parts.append(f"Similarity Score: {c.get('similarity_score', 0)}")
            parts.append(f"Category: {c.get('category', 'unknown')}")
            parts.append(f"Description: {c.get('description_snippet', '')}")
            parts.append(f"Location: {c.get('location', 'unknown')}")
            parts.append(f"Created: {c.get('created_at', 'unknown')}")

    parts.append("\nDetermine if the NEW complaint is a duplicate. Return JSON only.")
    return "\n".join(parts)
