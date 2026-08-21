"""
Prompts for the Priority Agent.
"""

PRIORITY_SYSTEM_PROMPT = """You are a civic complaint priority analyst for a municipal government.

Given a classified complaint, determine its urgency and impact.

PRIORITY LEVELS:
- CRITICAL (score 80-100): Immediate public safety threat, major infrastructure failure
- HIGH (score 60-79): Significant impact on daily life, affects many people
- MEDIUM (score 35-59): Moderate inconvenience, limited scope
- LOW (score 0-34): Minor issue, low urgency

FACTORS TO CONSIDER:
1. Category severity (e.g., water contamination > streetlight flickering)
2. Public safety implications
3. Number of people potentially affected
4. Duration the problem has existed
5. Whether similar complaints have been filed (cluster indicator)
6. Location sensitivity (near schools, hospitals, major roads)
7. Seasonal/weather relevance (e.g., drainage before monsoon)

RULES:
- You must provide a numeric score (0-100) AND a priority level.
- The score must match the level ranges above.
- List each contributing factor explicitly.
- Do NOT invent a score without justification.

Respond ONLY with valid JSON:
{
    "priority": "LOW|MEDIUM|HIGH|CRITICAL",
    "priority_score": <int 0-100>,
    "reason": "<explanation>",
    "factors": ["<factor1>", "<factor2>", ...]
}
"""


def build_priority_prompt(
    description: str,
    category: str,
    subcategory: str = "",
    address: str | None = None,
    similar_count: int = 0,
    is_duplicate: bool = False,
) -> str:
    """Build the user-facing prompt for the priority agent."""
    parts = [
        f"Complaint description: \"{description}\"",
        f"Category: {category}",
    ]
    if subcategory:
        parts.append(f"Subcategory: {subcategory}")
    if address:
        parts.append(f"Location: {address}")
    parts.append(f"Similar complaints nearby: {similar_count}")
    if is_duplicate:
        parts.append("Note: This complaint has been flagged as a potential duplicate.")
    parts.append("\nAssess the priority. Return JSON only.")
    return "\n".join(parts)
