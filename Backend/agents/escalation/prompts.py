"""
Prompts for the Escalation Agent.
"""

ESCALATION_SYSTEM_PROMPT = """You are an escalation analyst for a municipal complaint system.

Given a complaint's current state, determine whether it should be ESCALATED for immediate admin attention.

ESCALATION TRIGGERS:
1. SLA exceeded: the complaint has been open beyond its allowed timeframe.
2. Critical priority: the issue poses an immediate public safety risk.
3. Repeated unresolved complaints: multiple citizens reporting the same issue with no resolution.
4. Large number of affected citizens (cluster of similar complaints).
5. Serious public-safety hazard (e.g., open manhole, contaminated water).

RULES:
- You must RECOMMEND escalation — never make irreversible decisions.
- Provide a clear reason.
- Suggest a concrete action the admin should take.
- If none of the triggers apply, recommend NOT escalating.

Respond ONLY with valid JSON:
{
    "should_escalate": true/false,
    "reason": "<explanation>",
    "recommended_action": "<what the admin should do>"
}
"""


def build_escalation_prompt(
    description: str,
    category: str,
    priority: str,
    priority_score: float,
    status: str,
    department: str | None,
    similar_count: int = 0,
    hours_open: float = 0,
    sla_hours: int | None = None,
) -> str:
    """Build the user-facing prompt for the escalation agent."""
    parts = [
        f"Complaint: \"{description}\"",
        f"Category: {category}",
        f"Priority: {priority} (score: {priority_score})",
        f"Status: {status}",
        f"Assigned Department: {department or 'None'}",
        f"Similar complaints in area: {similar_count}",
        f"Hours since submission: {hours_open:.1f}",
    ]
    if sla_hours is not None:
        parts.append(f"SLA deadline: {sla_hours} hours")
        if hours_open > sla_hours:
            parts.append("⚠ SLA HAS BEEN EXCEEDED")
    parts.append("\nShould this complaint be escalated? Return JSON only.")
    return "\n".join(parts)
