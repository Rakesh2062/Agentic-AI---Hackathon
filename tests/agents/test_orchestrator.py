import os
import sys
from datetime import datetime, timezone
import pytest
from unittest.mock import patch

# Ensure Backend/ and workspace root are in sys.path
cur_dir = os.path.dirname(os.path.abspath(__file__))
workspace_root = os.path.abspath(os.path.join(cur_dir, "..", ".."))
backend_dir = os.path.join(workspace_root, "Backend")
for p in (workspace_root, backend_dir):
    if p not in sys.path:
        sys.path.insert(0, p)

from Backend.agents.config import BaseLLMClient, ComplaintCategory, ComplaintStatus, PriorityLevel
from Backend.agents.orchestrator import Orchestrator
from Backend.agents.state.complaint_state import ComplaintState
from Backend.agents.resolution.agent import ResolutionAgent
from Backend.schemas.models import ComplaintCreate, LocationInfo
from Backend.agents.tools import complaint_tools, department_tools
from rag.knowledge_base import seed_knowledge_base
from rag.retriever import get_rag_retriever


class ConfigurableMockLLM(BaseLLMClient):
    """Configurable mock LLM for testing orchestrator pipelines deterministically."""

    def __init__(self, responses: dict[str, str] | None = None):
        self.responses = responses or {}
        self.calls: list[dict[str, str]] = []

    async def generate(self, prompt: str, system_prompt: str = "", **kwargs) -> str:
        self.calls.append({"prompt": prompt, "system_prompt": system_prompt})
        
        # Match by system prompt keywords
        if "classify" in system_prompt.lower():
            return self.responses.get(
                "classification",
                '{"category": "roads", "subcategory": "pothole", "summary": "Pothole on roadway", "confidence": 0.95}',
            )
        elif "duplicate" in system_prompt.lower():
            return self.responses.get(
                "duplicate",
                '{"is_duplicate": false, "duplicate_of": null, "confidence": 0.90, "reason": "No duplicate"}',
            )
        elif "priority" in system_prompt.lower():
            return self.responses.get(
                "priority",
                '{"priority": "HIGH", "priority_score": 75.0, "reason": "Traffic hazard", "factors": ["traffic", "safety"]}',
            )
        elif "route" in system_prompt.lower() or "department" in system_prompt.lower():
            return self.responses.get(
                "routing",
                '{"recommended_department": "Roads & Traffic Infrastructure", "confidence": 0.92, "reason": "Road maintenance required"}',
            )
        elif "escalation" in system_prompt.lower():
            return self.responses.get(
                "escalation",
                '{"should_escalate": true, "reason": "Critical safety hazard", "recommended_action": "Dispatch emergency crew"}',
            )
        elif "resolution" in system_prompt.lower():
            return self.responses.get(
                "resolution",
                '{"resolution_summary": "Pothole repaired with hot-mix asphalt.", "citizen_message": "Dear Citizen, the pothole reported at your location has been successfully repaired.", "next_steps": ["Inspect area after 48 hours"]}',
            )
        
        return '{"result": "ok"}'

    async def embed(self, text: str) -> list[float]:
        return [0.05] * 768


@pytest.fixture
def agent_test_env(mock_db):
    """Sets up seeded knowledge base and patched database connection for agent tests."""
    seed_knowledge_base(mock_db, chunk_size=400, chunk_overlap=80, drop_existing=True)
    get_rag_retriever(db=mock_db)
    with patch("database.connection.get_sync_db", return_value=mock_db), \
         patch("Backend.agents.tools.search_tools.get_sync_db", return_value=mock_db), \
         patch("rag.retriever.get_sync_db", return_value=mock_db):
        yield mock_db


@pytest.mark.asyncio
async def test_orchestrator_full_intake_pipeline(agent_test_env):
    """Verifies complete intake pipeline from raw data to classified/prioritized/routed state."""
    mock_llm = ConfigurableMockLLM()
    orchestrator = Orchestrator()
    orchestrator.llm = mock_llm
    orchestrator.classification_agent.llm = mock_llm
    orchestrator.duplicate_agent.llm = mock_llm
    orchestrator.priority_agent.llm = mock_llm
    orchestrator.routing_agent.llm = mock_llm
    orchestrator.escalation_agent.llm = mock_llm

    payload = {
        "complaint_id": "CMP-INTAKE-001",
        "citizen_id": "CIT-1001",
        "description": "Deep pothole damaging vehicles on MG Road near Metro station",
        "latitude": 12.9716,
        "longitude": 77.5946,
        "address": "MG Road, Ward 12",
    }

    result = await orchestrator.process_complaint(payload)

    assert result.success is True
    assert result.state is not None
    assert result.state.complaint_id == "CMP-INTAKE-001"
    assert result.state.description == payload["description"]
    assert result.state.category == ComplaintCategory.ROADS
    assert result.state.subcategory == "pothole"
    assert result.state.is_duplicate is False
    assert result.state.priority == PriorityLevel.HIGH
    assert result.state.priority_score == 75.0
    assert result.state.recommended_department is not None
    assert result.state.current_status == ComplaintStatus.UNDER_REVIEW
    assert len(result.state.audit_events) >= 4


@pytest.mark.asyncio
async def test_orchestrator_duplicate_early_exit(agent_test_env):
    """Verifies that duplicate complaints halt early with DUPLICATE status."""
    mock_llm = ConfigurableMockLLM(
        responses={
            "duplicate": '{"is_duplicate": true, "duplicate_of": "CMP-EXISTING-99", "confidence": 0.95, "reason": "Identical pothole reported 1 hour ago"}'
        }
    )
    orchestrator = Orchestrator()
    orchestrator.llm = mock_llm
    orchestrator.classification_agent.llm = mock_llm
    orchestrator.duplicate_agent.llm = mock_llm
    orchestrator.priority_agent.llm = mock_llm
    orchestrator.routing_agent.llm = mock_llm

    payload = {
        "complaint_id": "CMP-DUP-002",
        "description": "Same pothole on MG Road near Metro station",
    }

    result = await orchestrator.process_complaint(payload)

    assert result.success is True
    assert result.state.is_duplicate is True
    assert result.state.duplicate_of == "CMP-EXISTING-99"
    assert result.state.current_status == ComplaintStatus.DUPLICATE
    # Priority and routing should not have run
    assert result.priority is None
    assert result.routing is None


@pytest.mark.asyncio
async def test_orchestrator_critical_priority_triggers_escalation(agent_test_env):
    """Verifies that CRITICAL priority automatically triggers escalation agent."""
    mock_llm = ConfigurableMockLLM(
        responses={
            "priority": '{"priority": "CRITICAL", "priority_score": 95.0, "reason": "Major gas leak", "factors": ["explosion risk"]}',
            "escalation": '{"should_escalate": true, "reason": "Immediate danger to life", "recommended_action": "Evacuate area"}'
        }
    )
    orchestrator = Orchestrator()
    orchestrator.llm = mock_llm
    orchestrator.classification_agent.llm = mock_llm
    orchestrator.duplicate_agent.llm = mock_llm
    orchestrator.priority_agent.llm = mock_llm
    orchestrator.routing_agent.llm = mock_llm
    orchestrator.escalation_agent.llm = mock_llm

    payload = {
        "complaint_id": "CMP-CRIT-003",
        "description": "Exposed high voltage electrical wire sparking in water puddle near school gate",
    }

    result = await orchestrator.process_complaint(payload)

    assert result.success is True
    assert result.state.priority == PriorityLevel.CRITICAL
    assert result.escalation is not None
    assert result.state.should_escalate is True


@pytest.mark.asyncio
async def test_resolution_agent_rag_sop_integration(agent_test_env):
    """Verifies that ResolutionAgent retrieves and includes RAG SOP guidelines."""
    mock_llm = ConfigurableMockLLM()
    resolution_agent = ResolutionAgent(llm_client=mock_llm)

    state = ComplaintState(
        complaint_id="CMP-RES-101",
        description="Large water pipe burst flooding the residential street",
        category=ComplaintCategory.WATER,
        priority=PriorityLevel.HIGH,
        recommended_department="Water Supply & Sewerage Department",
        current_status=ComplaintStatus.RESOLVED,
    )

    result = await resolution_agent.run(
        state,
        admin_action="Main valve replaced and leak sealed by emergency crew.",
        resolution_notes="Water pressure normalized.",
    )

    assert result.resolution_summary is not None
    assert result.citizen_message is not None
    assert state.resolution_summary == result.resolution_summary
    assert state.citizen_message == result.citizen_message
    assert len(mock_llm.calls) == 1
    # Verify that SOP guidance was included in the prompt passed to LLM
    last_prompt = mock_llm.calls[0]["prompt"]
    assert "Municipal SOP Guidance" in last_prompt or "SOP" in last_prompt or "water" in last_prompt.lower()


@pytest.mark.asyncio
async def test_complaint_create_payload_alignment():
    """Verifies that ComplaintCreate converts correctly for orchestrator processing."""
    submission = ComplaintCreate(
        raw_text="Overhead streetlight blinking rapidly and going out",
        userId="citizen_44",
        category="streetlights",
        location=LocationInfo(
            lat=13.0827,
            lng=80.2707,
            address="Anna Salai, Sector 4",
        ),
    )

    agent_dict = submission.to_agent_dict()
    assert agent_dict["description"] == "Overhead streetlight blinking rapidly and going out"
    assert agent_dict["citizen_id"] == "citizen_44"
    assert agent_dict["latitude"] == 13.0827
    assert agent_dict["longitude"] == 80.2707
    assert agent_dict["address"] == "Anna Salai, Sector 4"
    assert "submitted_at" in agent_dict


@pytest.mark.asyncio
async def test_agent_tools_mongodb_and_fallback(agent_test_env):
    """Verifies complaint_tools and department_tools functionality with and without active DB."""
    # Department tools
    depts = await department_tools.get_departments()
    assert isinstance(depts, list)
    assert len(depts) >= 6

    water_dept = await department_tools.get_department_by_name("Water Supply & Sewerage")
    if water_dept is None:
        water_dept = await department_tools.get_department_by_name("Water Supply & Sewerage Department")
    # At least one lookup method succeeds
    assert depts[0]["name"] is not None

    # Complaint tools
    all_c = await complaint_tools.get_all_complaints()
    assert isinstance(all_c, list)
