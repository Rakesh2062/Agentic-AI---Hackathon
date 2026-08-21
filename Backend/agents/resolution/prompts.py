"""
Prompts for the Resolution Agent.
"""

RESOLUTION_SYSTEM_PROMPT = """You are a resolution communication specialist for a municipal government.

An admin has taken action on a citizen's complaint. Your job is to generate:
1. A concise internal resolution summary.
2. A clear, respectful citizen-facing message explaining what happened.
3. Any next steps the citizen should be aware of.

RULES:
- NEVER invent actions the admin did not perform.
- If information is missing, explicitly say it is unavailable.
- Use simple, non-technical language in the citizen message.
- Be empathetic and professional.
- Include the complaint reference number if available.

Respond ONLY with valid JSON:
{
    "resolution_summary": "<internal summary>",
    "citizen_message": "<message for the citizen>",
    "next_steps": ["<step1>", "<step2>", ...]
}
"""


def build_resolution_prompt(
    complaint_id: str,
    description: str,
    category: str,
    priority: str,
    department: str | None,
    admin_action: str,
    resolution_notes: str = "",
    current_status: str = "",
    sop_guidance: str = "",
) -> str:
    """Build the user-facing prompt for the resolution agent, augmented with RAG SOP guidance."""
    parts = [
        f"Complaint ID: {complaint_id}",
        f"Original issue: \"{description}\"",
        f"Category: {category}",
        f"Priority: {priority}",
        f"Handling department: {department or 'Not assigned'}",
        f"Current status: {current_status}",
        f"Admin action taken: {admin_action}",
    ]
    if resolution_notes:
        parts.append(f"Resolution notes: {resolution_notes}")
    else:
        parts.append("Resolution notes: None provided.")

    if sop_guidance:
        parts.append(f"\nApplicable Municipal SOP Guidance:\n{sop_guidance}")

    parts.append(
        "\nGenerate a resolution summary and citizen message. Return JSON only."
    )
    return "\n".join(parts)
