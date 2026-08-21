"""
Example: Run a single complaint through the complete agent pipeline.

This script demonstrates how the orchestrator processes a complaint
end-to-end, including admin override and resolution generation.

Usage:
    cd Backend
    python -m agents.example_usage

NOTE: Without a real LLM API key the agents will hit the LLM client and
      raise an error.  Set the following environment variables first:

      LLM_PROVIDER=gemini        (or groq, openai)
      LLM_API_KEY=<your-key>
      LLM_MODEL_NAME=gemini-2.0-flash
"""

from __future__ import annotations

import asyncio
import json
import os
import sys

# Ensure the Backend directory is on sys.path so `agents` can be imported
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from agents.orchestrator import Orchestrator
from agents.config import ComplaintStatus, PriorityLevel


async def main() -> None:
    print("=" * 70)
    print("  AI Civic Complaint-to-Resolution Intelligence Platform")
    print("  -- Example Pipeline Run --")
    print("=" * 70)

    # 1. Instantiate the orchestrator (reads config from env vars)
    orchestrator = Orchestrator()

    # 2. Simulate a citizen submitting a complaint
    complaint_data = {
        "complaint_id": "CMP-NEW-001",
        "citizen_id": "CIT-500",
        "description": (
            "There is a massive pothole on MG Road near Central Mall. "
            "It has been there for over two weeks and is causing accidents. "
            "Yesterday a two-wheeler skidded and the rider was injured. "
            "Many commuters are affected daily."
        ),
        "image_url": None,  # No image in this example
        "latitude": 12.9716,
        "longitude": 77.5946,
        "address": None,  # Will be reverse-geocoded from coordinates
    }

    print("\n[ ] Citizen Complaint Submitted:")
    print(f"   ID:          {complaint_data['complaint_id']}")
    print(f"   Citizen:     {complaint_data['citizen_id']}")
    print(f"   Description: {complaint_data['description'][:80]}...")
    print(f"   Coordinates: ({complaint_data['latitude']}, {complaint_data['longitude']})")

    # 3. Process through the full intake pipeline
    print("\n[*] Running AI Intake Pipeline...")
    print("-" * 50)

    result = await orchestrator.process_complaint(complaint_data)

    # 4. Display results
    print("\n[*] AI Recommendations (for Admin Review):")
    print("-" * 50)

    if result.classification:
        print(f"\n[-]  Classification:")
        print(f"   Category:    {result.classification.category}")
        print(f"   Subcategory: {result.classification.subcategory}")
        print(f"   Summary:     {result.classification.summary}")
        print(f"   Confidence:  {result.classification.confidence:.0%}")

    if result.duplicate:
        print(f"\n[-] Duplicate Check:")
        print(f"   Is Duplicate: {result.duplicate.is_duplicate}")
        if result.duplicate.duplicate_of:
            print(f"   Duplicate Of: {result.duplicate.duplicate_of}")
        print(f"   Confidence:   {result.duplicate.confidence:.0%}")
        print(f"   Reason:       {result.duplicate.reason}")

    if result.priority:
        print(f"\n[-] Priority Assessment:")
        print(f"   Level:  {result.priority.priority.value}")
        print(f"   Score:  {result.priority.priority_score}")
        print(f"   Reason: {result.priority.reason}")
        if result.priority.factors:
            print(f"   Factors: {', '.join(result.priority.factors)}")

    if result.routing:
        print(f"\n[-] Department Routing:")
        print(f"   Department:  {result.routing.recommended_department}")
        print(f"   Confidence:  {result.routing.confidence:.0%}")
        print(f"   Reason:      {result.routing.reason}")

    if result.escalation:
        print(f"\n[!] Escalation:")
        print(f"   Should Escalate: {result.escalation.should_escalate}")
        print(f"   Reason:          {result.escalation.reason}")
        print(f"   Action:          {result.escalation.recommended_action}")

    # 5. Show audit trail
    if result.state:
        print(f"\n[*] Audit Trail ({len(result.state.audit_events)} events):")
        for event in result.state.audit_events:
            status = "[OK]" if event.success else "[ERR]"
            print(
                f"   {status} {event.agent_name}: "
                f"{event.output_summary} "
                f"({(event.completed_at - event.started_at).total_seconds():.2f}s)"
            )

        if result.state.processing_errors:
            print(f"\n[!]  Processing Errors:")
            for err in result.state.processing_errors:
                print(f"   - {err}")

    # 6. Simulate admin override
    print("\n" + "=" * 50)
    print("[Admin] ADMIN ACTION: Accept routing, override priority to HIGH")
    print("=" * 50)

    if result.state:
        updated_state = await orchestrator.admin_override(
            result.state,
            priority=PriorityLevel.HIGH,
            status=ComplaintStatus.ASSIGNED,
            notes="Verified on-site. Assigning to Roads department.",
        )
        print(f"   Status:     {updated_state.current_status.value}")
        print(f"   Department: {updated_state.effective_department()}")
        print(f"   Priority:   {updated_state.effective_priority()}")

        # 7. Simulate resolution
        print("\n" + "=" * 50)
        print("[Admin] ADMIN ACTION: Resolve complaint")
        print("=" * 50)

        resolved_state = await orchestrator.admin_override(
            updated_state,
            status=ComplaintStatus.RESOLVED,
            notes="Pothole repaired on 2026-08-20. Road resurfaced.",
        )

        if resolved_state.citizen_message:
            print(f"\n[-] Citizen Message:")
            print(f"   {resolved_state.citizen_message}")
        if resolved_state.resolution_summary:
            print(f"\n[-] Internal Summary:")
            print(f"   {resolved_state.resolution_summary}")

    # 8. Analytics
    print("\n" + "=" * 50)
    print("[*] Running Analytics...")
    print("=" * 50)

    analytics = await orchestrator.run_analytics()
    if analytics.insights:
        for insight in analytics.insights:
            print(
                f"   [{insight.severity}] {insight.type}: "
                f"{insight.explanation} (count={insight.count})"
            )
    else:
        print("   No significant insights found.")

    # Final JSON dump
    print("\n" + "=" * 50)
    print("[-] Full Result (JSON):")
    print("=" * 50)
    print(json.dumps(result.to_dict(), indent=2, default=str)[:2000])
    print("... (truncated)")


if __name__ == "__main__":
    asyncio.run(main())
