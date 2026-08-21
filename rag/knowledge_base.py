"""
Municipal Civic Service Knowledge Base for RAG.
Contains structured standard operating procedures (SOPs), resolution policies,
SLA rules, and citizen communication guidelines across all municipal domains.
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from rag.chunker import chunk_document
from rag.embeddings import generate_embedding, generate_embeddings

KNOWLEDGE_BASE_COLLECTION = "knowledge_base"


class KnowledgeBaseDocument(BaseModel):
    """Represents a complete standard operating procedure document."""
    document_id: str
    title: str
    category: str
    department: str
    content: str
    source: str = "Municipal Standard Operating Procedures (SOP)"
    sla_hours: int = 24
    priority_level: str = "MEDIUM"
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


def get_municipal_knowledge_base_documents() -> List[KnowledgeBaseDocument]:
    """
    Returns the complete roster of 8 standard municipal civic service SOPs.
    """
    return [
        # 1. Road & Pothole Repair
        KnowledgeBaseDocument(
            document_id="SOP-ROADS-001",
            title="Road Surface, Asphalt Degradation & Pothole Remediation SOP",
            category="Roads & Infrastructure",
            department="Public Works & Road Infrastructure",
            sla_hours=48,
            priority_level="HIGH",
            content="""# Standard Operating Procedure: Road Surface & Pothole Remediation
## 1. Domain & Scope
Applies to municipal road potholes, cave-ins, asphalt erosion, damaged speed breakers, and arterial road cracks.
Responsible Department: Public Works & Road Infrastructure (PWD).

## 2. Priority & Severity Guidelines
- CRITICAL (SLA: 12 Hours): Potholes exceeding 15cm depth on arterial roadways, bus routes, or bridge approaches presenting immediate vehicle rollover or motorcyclist collision hazard.
- HIGH (SLA: 48 Hours): Potholes on collector roads, school zones, or intersection approaches causing traffic diversion or moderate vehicular wheel/rim damage.
- MEDIUM (SLA: 72 Hours): Minor potholes under 8cm depth on residential interior lanes.
- LOW (SLA: 7 Days): Cosmetic asphalt peeling or planned micro-surfacing requests.

## 3. Inspection & Repair Protocol
1. On-site technical inspection by PWD Field Engineer within 4 hours of dispatch.
2. Photographic verification before commencement.
3. Cold-mix asphalt patching for immediate temporary stabilization in wet/monsoon conditions.
4. Full hot-mix compaction with pneumatic roller for permanent restoration in dry conditions.
5. Road marking and reflective barricade placement during active curing.

## 4. Escalation Conditions
- Recurrent potholes at identical coordinates within 30 days indicates underlying water main leakage or base-course failure; escalate to Assistant Executive Engineer and coordinate with Water Supply Board.
- High accident risk or multi-vehicle damage reports escalate directly to PWD Chief Engineer.

## 5. Citizen Communication Guidance
Acknowledge citizen submission promptly with road repair crew assignment details. On resolution, include timestamped post-repair photograph verifying asphalt leveling and curing.""",
            metadata={"keywords": ["pothole", "asphalt", "road damage", "traffic", "cracks", "pavement", "pwd"]},
        ),

        # 2. Drainage & Sewerage
        KnowledgeBaseDocument(
            document_id="SOP-DRAIN-002",
            title="Stormwater Drainage & Sewer Line Blockage Resolution SOP",
            category="Water Supply & Sewerage",
            department="Water Supply & Sewerage Board",
            sla_hours=24,
            priority_level="HIGH",
            content="""# Standard Operating Procedure: Drainage & Sewerage Maintenance
## 1. Domain & Scope
Covers open drain clogs, overflowing manholes, stormwater flooding, backflow into residential basements, and collapsed sewer mains.
Responsible Department: Water Supply & Sewerage Board.

## 2. Priority & Severity Guidelines
- CRITICAL (SLA: 6 Hours): Untreated sewage overflowing into residential living areas, public markets, hospital premises, or contaminating open drinking water sources.
- HIGH (SLA: 24 Hours): Flooding of stormwater drains blocking arterial road traffic or back-pitching into storm inlets.
- MEDIUM (SLA: 48 Hours): Sluggish residential drainage or silt accumulation in secondary gutters.
- LOW (SLA: 5 Days): Preventative pre-monsoon desilting requests.

## 3. Inspection & Repair Protocol
1. Safety hazard verification: mandatory atmospheric testing for hydrogen sulfide (H2S) gas prior to manhole opening.
2. Deployment of super-sucker vacuum de-silting machines and high-pressure jetting units.
3. Clearing root intrusions, hardened grease, or debris blockages.
4. Structural inspection of broken pipe collars or displaced manhole rings.
5. Disinfection and lime bleaching of affected surface area following clearance.

## 4. Escalation Conditions
- Sewer main structural collapse or contamination of adjacent drinking water supply lines requires immediate inter-departmental emergency shutdown and escalation to Health Officer.

## 5. Citizen Communication Guidance
Inform citizen of dispatched suction truck unit and estimated clearance window. Warn of temporary odor during suction operations and confirm sanitary disinfection on completion.""",
            metadata={"keywords": ["drainage", "sewer", "manhole", "overflow", "flooding", "waterlogging", "sewage"]},
        ),

        # 3. Water Supply & Pipeline Leakage
        KnowledgeBaseDocument(
            document_id="SOP-WATER-003",
            title="Drinking Water Distribution & High-Pressure Pipeline Leak SOP",
            category="Water Supply & Sewerage",
            department="Water Supply & Sewerage Board",
            sla_hours=24,
            priority_level="CRITICAL",
            content="""# Standard Operating Procedure: Municipal Water Supply & Leak Repair
## 1. Domain & Scope
Covers municipal drinking water supply interruptions, distribution main bursts, valve leaks, contamination/discoloration, and low pressure.
Responsible Department: Water Supply & Sewerage Board.

## 2. Priority & Severity Guidelines
- CRITICAL (SLA: 4 Hours): High-pressure water trunk main burst causing massive clean water loss, roadway cavitation, or basement inundation.
- HIGH (SLA: 24 Hours): Intermittent drinking water supply failure affecting an entire neighborhood ward or reported muddy/contaminated water supply.
- MEDIUM (SLA: 48 Hours): Low pressure reports or minor service line curb-stop leaks.
- LOW (SLA: 4 Days): Meter replacement or billing valve inspection.

## 3. Inspection & Repair Protocol
1. Immediate isolation of feeding valve by zonal water distribution officer.
2. Excavation of leak site and installation of mechanical pipe repair clamp or ductile iron sleeve.
3. Chlorine residual testing following line pressurization to confirm potable quality.
4. Road trench backfilling and sand compaction.

## 4. Escalation Conditions
- Contamination reports (turbidity, chlorine absence, or foul odor) trigger immediate boil-water advisory and water tanker dispatch while lab samples are cultured.

## 5. Citizen Communication Guidance
Provide clear water restoration timeline and coordinate temporary emergency water tanker supply points for affected wards.""",
            metadata={"keywords": ["water pipe", "pipeline burst", "leak", "drinking water", "water supply", "contamination", "tanker"]},
        ),

        # 4. Solid Waste Management & Sanitation
        KnowledgeBaseDocument(
            document_id="SOP-WASTE-004",
            title="Solid Waste Clearance, Public Dumpster & Illegal Dumping SOP",
            category="Solid Waste & Sanitation",
            department="Solid Waste Management & Sanitation",
            sla_hours=12,
            priority_level="MEDIUM",
            content="""# Standard Operating Procedure: Solid Waste Management & Sanitation
## 1. Domain & Scope
Covers unattended commercial/residential garbage piles, overflowing secondary dumpsters, dead animal carcass removal, and illegal debris dumping.
Responsible Department: Solid Waste Management & Sanitation.

## 2. Priority & Severity Guidelines
- CRITICAL (SLA: 6 Hours): Animal carcasses on public thoroughfares or hazardous biomedical/chemical waste dumped in public parks or streets.
- HIGH (SLA: 12 Hours): Overflowing community waste containers spilling onto roadways, blocking pedestrian pathways or adjacent to schools/eateries.
- MEDIUM (SLA: 24 Hours): Missed daily door-to-door waste collection for residential clusters.
- LOW (SLA: 48 Hours): Bulk green waste (tree clippings) or construction debris removal requests.

## 3. Inspection & Repair Protocol
1. Dispatch of hydraulic compactor truck or tipper vehicle with sanitation crew.
2. Manual and mechanized clearance of waste container perimeter.
3. Application of bio-sanitizer spray and sodium hypochlorite solution to eliminate odors and bacterial hazards.
4. Photographic evidence of cleared bin enclosure uploaded to complaint record.

## 4. Escalation Conditions
- Chronic waste accumulation at identical spot for >3 days triggers spot-fine investigation for illegal commercial dumping and installation of CCTV monitoring.

## 5. Citizen Communication Guidance
Confirm clearance with time-stamped photo of cleared area. Remind citizens of designated segregation guidelines (wet, dry, sanitary).""",
            metadata={"keywords": ["garbage", "trash", "waste", "dumpster", "sanitation", "overflowing bin", "debris", "dead animal"]},
        ),

        # 5. Streetlights & Electricity
        KnowledgeBaseDocument(
            document_id="SOP-ELEC-005",
            title="Civic Streetlighting, Feeder Pillar & Electrical Hazard SOP",
            category="Electricity & Street Lighting",
            department="Electricity & Street Lighting",
            sla_hours=18,
            priority_level="MEDIUM",
            content="""# Standard Operating Procedure: Streetlighting & Electrical Infrastructure
## 1. Domain & Scope
Covers non-functioning streetlights, continuous daytime burning, exposed live wiring, fallen power poles, and malfunctioning traffic signal lights.
Responsible Department: Electricity & Street Lighting.

## 2. Priority & Severity Guidelines
- CRITICAL (SLA: 2 Hours): Exposed live wires within pedestrian reach, leaning power poles, sparking transformer units, or submerged electrical junctions.
- HIGH (SLA: 18 Hours): Entire street or stretch (>3 consecutive poles) dark in high-pedestrian or crime-sensitive corridors; major traffic signal outage.
- MEDIUM (SLA: 48 Hours): Single isolated LED fixture non-functional on residential lane.
- LOW (SLA: 5 Days): Timer recalibration for day-burning lamps.

## 3. Inspection & Repair Protocol
1. Power safety isolation before field crew physical contact.
2. Lineman hydraulic lift deployment to test driver, LED luminaire, and photocell switch.
3. Cable insulation replacement and waterproof junction box sealing.
4. Nighttime lux meter verification of adequate illumination spread.

## 4. Escalation Conditions
- Fallen live cables immediately trigger high-priority alert to State Electricity Distribution Utility and local police for traffic perimeter cordoning.

## 5. Citizen Communication Guidance
Assure citizens of safety isolation when wires are reported. Provide pole identifier number and status update once circuit is re-energized.""",
            metadata={"keywords": ["streetlight", "lighting", "dark street", "exposed wire", "electricity", "pole", "traffic light", "sparking"]},
        ),

        # 6. Public Health & Sanitation
        KnowledgeBaseDocument(
            document_id="SOP-HEALTH-006",
            title="Public Health Hazards, Vector-Borne Mosquito Control & Hygiene SOP",
            category="Public Health & Hygiene",
            department="Public Health & Hygiene",
            sla_hours=24,
            priority_level="HIGH",
            content="""# Standard Operating Procedure: Public Health & Vector Control
## 1. Domain & Scope
Covers stagnant water mosquito breeding sites, dengue/malaria outbreak prevention, stray animal vaccination/sterilization, and public hygiene violations.
Responsible Department: Public Health & Hygiene.

## 2. Priority & Severity Guidelines
- CRITICAL (SLA: 12 Hours): Multiple cluster dengue/chikungunya cases reported from a single apartment block or neighborhood; rabid animal bite hazard.
- HIGH (SLA: 24 Hours): Large stagnant water body breeding mosquito larvae near schools, hospitals, or high-density residential colonies.
- MEDIUM (SLA: 48 Hours): Rodent infestation in public markets or non-functional public restroom facilities.
- LOW (SLA: 7 Days): Routine fogging schedule requests.

## 3. Inspection & Repair Protocol
1. Inspection by Sanitary Inspector with larval dipping checks.
2. Deployment of thermal fogging equipment (pyrethrum-based) during dawn/dusk mosquito flight windows.
3. Introduction of Bacillus thuringiensis israelensis (BTI) bio-larvicide in non-drainable water bodies.
4. Issue of statutory sanitation notice to private property owners harboring breeding reservoirs.

## 4. Escalation Conditions
- Confirmed disease clusters trigger coordinated ward-level epidemiological survey and mass chemical treatment.

## 5. Citizen Communication Guidance
Provide preventative checklist (clear overhead tanks, discard tires, invert plant saucers) and confirm completed fogging/larvicide schedule.""",
            metadata={"keywords": ["mosquito", "fogging", "dengue", "malaria", "health", "hygiene", "stagnant water", "sanitary"]},
        ),

        # 7. Public Facilities & Parks
        KnowledgeBaseDocument(
            document_id="SOP-FACILITY-007",
            title="Public Parks, Playgrounds & Municipal Facility Maintenance SOP",
            category="Public Facilities & Parks",
            department="Public Works & Road Infrastructure",
            sla_hours=72,
            priority_level="LOW",
            content="""# Standard Operating Procedure: Public Parks & Community Infrastructure
## 1. Domain & Scope
Covers municipal park maintenance, broken children playground equipment, damaged public seating, perimeter fencing, walking track potholes, and public toilets.
Responsible Department: Public Works & Road Infrastructure / Parks Wing.

## 2. Priority & Severity Guidelines
- CRITICAL (SLA: 12 Hours): Structurally compromised playground equipment (broken swing chains, sharp protruding metal slides) presenting severe child injury hazard.
- HIGH (SLA: 48 Hours): Uprooted fallen trees blocking park gates or damaged electrical conduits inside park premises.
- MEDIUM (SLA: 72 Hours): Damaged garden benches, broken sprinkler lines, or overflowing trash bins in public recreation grounds.
- LOW (SLA: 10 Days): Lawn mowing, seasonal shrub pruning, or cosmetic landscaping requests.

## 3. Inspection & Repair Protocol
1. Site audit by Municipal Horticulturist / Maintenance Engineer.
2. Immediate barricading or removal of hazardous broken play structures.
3. Carpentry, welding, or structural masonry restoration.
4. Routine safety audit sign-off by park supervisor.

## 4. Citizen Communication Guidance
Notify citizen of park equipment repair schedule or tree trimming clearance.""",
            metadata={"keywords": ["park", "playground", "swing", "public toilet", "bench", "tree", "garden", "facility"]},
        ),

        # 8. General Civic Complaint Triage
        KnowledgeBaseDocument(
            document_id="SOP-TRIAGE-008",
            title="General Civic Triage, Multi-Department Routing & Citizen Dispute SOP",
            category="General Civic Services",
            department="Municipal Governance",
            sla_hours=24,
            priority_level="MEDIUM",
            content="""# Standard Operating Procedure: General Civic Triage & Resolution Protocol
## 1. Domain & Scope
Covers cross-departmental complaints, ambiguous civic reports, noise pollution, encroachment of public walkways, and escalation appeals.
Responsible Department: Municipal Governance & Central Citizen Grievance Cell.

## 2. Priority & Severity Guidelines
- CRITICAL (SLA: 4 Hours): Severe public safety emergencies, building collapse risks, or hazardous chemical spills requiring police, fire, and multi-agency response.
- HIGH (SLA: 24 Hours): Active encroachment blocking emergency vehicle access routes or severe public nuisance.
- MEDIUM (SLA: 48 Hours): Standard civic inquiries, cross-boundary jurisdictional clarifications, or noise complaints.
- LOW (SLA: 5 Days): General municipal procedural inquiries or feedback.

## 3. Triage & Routing Protocol
1. AI intake parses complaint description and validates coordinates against municipal ward map.
2. Auto-linking of duplicate complaints within 1.0 km radius and semantic similarity >= 0.82.
3. Assignment to primary responsible department with carbon-copy notification to zonal supervisor.
4. SLA tracking timer begins on status transition to SUBMITTED.

## 4. Citizen Communication Guidance
Send clear, empathetic confirmation to citizens with tracking ID, responsible officer contact, and transparent resolution timeline.""",
            metadata={"keywords": ["triage", "governance", "dispute", "encroachment", "grievance", "complaint", "sla"]},
        ),
    ]


def seed_knowledge_base(
    db: Any,
    chunk_size: int = 500,
    chunk_overlap: int = 100,
    drop_existing: bool = True,
) -> Dict[str, Any]:
    """
    Ingests all 8 municipal SOP documents into the dedicated knowledge_base collection.
    Chunks text, generates embeddings, and inserts document chunk records.
    """
    if drop_existing:
        db[KNOWLEDGE_BASE_COLLECTION].delete_many({})

    docs = get_municipal_knowledge_base_documents()
    all_chunks: List[Dict[str, Any]] = []

    for doc in docs:
        doc_dict = doc.model_dump()
        chunks = chunk_document(doc_dict, chunk_size=chunk_size, chunk_overlap=chunk_overlap)
        
        # Generate embeddings for each chunk
        for chunk in chunks:
            emb = generate_embedding(chunk["content"], is_query=False, title=chunk["title"])
            chunk["embedding"] = emb
            chunk["model_name"] = "gemini-embedding-2"
            chunk["created_at"] = datetime.now(timezone.utc)
            all_chunks.append(chunk)

    if all_chunks:
        db[KNOWLEDGE_BASE_COLLECTION].insert_many(all_chunks)

    return {
        "documents_processed": len(docs),
        "chunks_indexed": len(all_chunks),
        "collection": KNOWLEDGE_BASE_COLLECTION,
    }
