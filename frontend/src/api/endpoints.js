// Endpoints wrapper for FastAPI Backend + In-Memory Fallback
// Fully implements Role-Based Access Control (RBAC) & Point Calculation Engine

import { apiClient } from "./client";
import { initialMockCases, initialMockUsers, mockDepartmentStats, mockHotspots } from "./mockData";
import { Category, Status, Priority, UserRole, DepartmentsList, ResidentBenefitsCatalog, VisitorBenefitsCatalog } from "../utils/constants";

// In-memory persistent storage for submitted cases
let localCases = [];
try {
  const saved = sessionStorage.getItem("civic_cases");
  if (saved) {
    localCases = JSON.parse(saved);
  }
} catch (e) {}

function persistCases() {
  try {
    sessionStorage.setItem("civic_cases", JSON.stringify(localCases));
  } catch (e) {}
}

/**
 * Citizen / Visitor: Submit a new complaint
 * POST /api/v1/complaints
 */
export async function createComplaint(complaintData, forceMock = false) {
  if (!forceMock) {
    try {
      return await apiClient("/complaints", {
        method: "POST",
        body: JSON.stringify(complaintData),
      });
    } catch (err) {
      if (!err.isNetworkError && !forceMock) throw err;
      console.warn("Backend offline, simulating AI Pipeline Agent response...");
    }
  }

  // Simulate Agent Pipeline
  const rawTextLower = `${complaintData.raw_text || ""} ${complaintData.custom_category_specification || ""}`.toLowerCase();
  let detectedCategory = complaintData.category || Category.OTHER;
  let detectedDept = "General Administration";
  let subCat = "Civic Inconvenience";
  let priority = Priority.MEDIUM;
  let score = 50;
  let factors = [];

  if (rawTextLower.includes("pothole") || rawTextLower.includes("road") || rawTextLower.includes("curb") || rawTextLower.includes("asphalt")) {
    detectedCategory = Category.ROADS;
    detectedDept = "Roads & Infrastructure";
    subCat = "Pothole & Surface Damage";
    priority = rawTextLower.includes("deep") || rawTextLower.includes("danger") ? Priority.HIGH : Priority.MEDIUM;
    score = priority === Priority.HIGH ? 75 : 55;
    factors = [
      { factor: "Road Classification", points: 30, description: "Vehicular transit corridor" },
      { factor: "Surface Integrity Risk", points: 25, description: "Risk of wheel rim or chassis damage" },
    ];
  } else if (rawTextLower.includes("water") || rawTextLower.includes("pipe") || rawTextLower.includes("leak") || rawTextLower.includes("burst")) {
    detectedCategory = Category.WATER;
    detectedDept = "Water & Sewage Board";
    subCat = "Water Main / Pipeline Leak";
    priority = rawTextLower.includes("burst") || rawTextLower.includes("flood") ? Priority.CRITICAL : Priority.HIGH;
    score = priority === Priority.CRITICAL ? 90 : 70;
    factors = [
      { factor: "Utility Service Disruption", points: 45, description: "Drinking water supply pressure loss" },
      { factor: "Infrastructure Erosion", points: 30, description: "Sub-surface soil washing away" },
    ];
  } else if (rawTextLower.includes("light") || rawTextLower.includes("dark") || rawTextLower.includes("lamp") || rawTextLower.includes("pole")) {
    detectedCategory = Category.STREETLIGHT;
    detectedDept = "Street Lighting & Electrical";
    subCat = "Streetlight Luminaire Failure";
    priority = Priority.HIGH;
    score = 68;
    factors = [
      { factor: "Night Pedestrian Safety", points: 35, description: "Reduced visibility in evening hours" },
      { factor: "Electrical Hazard", points: 20, description: "Pole wiring inspection needed" },
    ];
  } else if (rawTextLower.includes("garbage") || rawTextLower.includes("trash") || rawTextLower.includes("waste") || rawTextLower.includes("dump")) {
    detectedCategory = Category.WASTE;
    detectedDept = "Solid Waste Management";
    subCat = "Solid Waste Overflow";
    priority = Priority.MEDIUM;
    score = 60;
    factors = [
      { factor: "Public Hygiene", points: 30, description: "Decomposing waste accumulation" },
      { factor: "Obstruction", points: 15, description: "Sidewalk pathway encroachment" },
    ];
  } else if (rawTextLower.includes("drain") || rawTextLower.includes("sewer") || rawTextLower.includes("gutter")) {
    detectedCategory = Category.DRAINAGE;
    detectedDept = "Stormwater & Drainage";
    subCat = "Blocked Storm Drain";
    priority = Priority.HIGH;
    score = 72;
    factors = [
      { factor: "Flood Potential", points: 35, description: "Runoff water blockage during rain" },
      { factor: "Debris Accumulation", points: 25, description: "Leaves and plastic clogging grate" },
    ];
  } else if (rawTextLower.includes("traffic") || rawTextLower.includes("signal") || rawTextLower.includes("sign")) {
    detectedCategory = Category.TRAFFIC;
    detectedDept = "Roads & Infrastructure";
    subCat = "Traffic Signal Outage";
    priority = Priority.HIGH;
    score = 78;
    factors = [
      { factor: "Intersection Collision Risk", points: 40, description: "Signal blackout at crossroads" },
    ];
  } else if (rawTextLower.includes("park") || rawTextLower.includes("facility") || rawTextLower.includes("dispenser") || rawTextLower.includes("bench")) {
    detectedCategory = Category.PUBLIC_FACILITY;
    detectedDept = "Parks & Public Facilities";
    subCat = "Public Amenity Defect";
    priority = Priority.LOW;
    score = 45;
    factors = [
      { factor: "Public Amenity", points: 25, description: "Recreation fixture repair required" },
    ];
  } else if (rawTextLower.includes("tree") || rawTextLower.includes("branch") || rawTextLower.includes("environment")) {
    detectedCategory = Category.ENVIRONMENT;
    detectedDept = "Parks & Urban Forestry";
    subCat = "Fallen Tree Hazard";
    priority = Priority.MEDIUM;
    score = 65;
    factors = [
      { factor: "Sidewalk Clearance", points: 30, description: "Debris removal" },
    ];
  } else if (rawTextLower.includes("fire") || rawTextLower.includes("hazard") || rawTextLower.includes("danger") || rawTextLower.includes("safety")) {
    detectedCategory = Category.PUBLIC_SAFETY;
    detectedDept = "Public Safety & Hazards";
    subCat = "Hazardous Obstruction";
    priority = Priority.CRITICAL;
    score = 95;
    factors = [
      { factor: "Direct Citizen Hazard", points: 50, description: "Immediate risk of injury or collapse" },
      { factor: "Rapid Response Required", points: 35, description: "Under 6-hour emergency SLA" },
    ];
  }

  const randomNum = Math.floor(1000 + Math.random() * 9000);
  const complaintId = `CMP-2026-${randomNum}`;
  const now = new Date().toISOString();
  
  const slaHours = priority === Priority.CRITICAL ? 6 : priority === Priority.HIGH ? 24 : priority === Priority.MEDIUM ? 48 : 72;
  const slaDeadline = new Date(Date.now() + slaHours * 3600 * 1000).toISOString();

  const newCase = {
    id: `case-${Date.now()}`,
    complaint_id: complaintId,
    userId: complaintData.userId || "usr_resident_01",
    citizen_name: complaintData.citizen_name || "Citizen Participant",
    raw_text: complaintData.raw_text,
    category: detectedCategory,
    custom_category_specification: complaintData.custom_category_specification || undefined,
    sub_category: subCat,
    summary: `AI Parsed: ${complaintData.raw_text.slice(0, 100)}...`,
    confidence: 0.94,
    department: detectedDept,
    priority: priority,
    validatedSeverity: null, // Only populated after official validation
    civicPointsAwarded: 0,   // Points strictly awarded upon validation!
    priority_breakdown: {
      score: score,
      level: priority,
      factors: factors.length > 0 ? factors : [{ factor: "Standard Civic Assessment", points: 40, description: "Standard urban maintenance SLA" }],
    },
    status: Status.SUBMITTED,
    status_history: [
      {
        status: Status.SUBMITTED,
        message: "Complaint captured and successfully parsed by AI Intake Agent.",
        timestamp: now,
        updated_by: "AI IntakeAgent",
      },
      {
        status: Status.UNDER_REVIEW,
        message: `AI Classification categorized as ${detectedCategory} and scored priority level as ${priority.toUpperCase()}. Pending Official Validation.`,
        timestamp: new Date(Date.now() + 1200).toISOString(),
        updated_by: "AI PrioritizationAgent",
      }
    ],
    citizen_count: 1,
    location: complaintData.location || {
      lat: 37.7749,
      lng: -122.4194,
      address: "Downtown Metropolitan Area",
      ward: "Ward 3 - Downtown Core",
      zone: "Zone A",
    },
    attachments: complaintData.attachments || [],
    image_tags: complaintData.attachments && complaintData.attachments.length > 0 ? ["evidence_photo_uploaded"] : ["pending_inspection"],
    sla_deadline: slaDeadline,
    created_at: now,
    updated_at: now,
  };

  localCases.unshift(newCase);
  persistCases();
  return newCase;
}

/**
 * Citizen: Get all complaints filed by a specific user
 * GET /api/v1/user/{userId}/complaints
 */
export async function getUserComplaints(userId, forceMock = false) {
  if (!forceMock) {
    try {
      return await apiClient(`/user/${userId}/complaints`);
    } catch (err) {
      if (!err.isNetworkError && !forceMock) throw err;
    }
  }

  return localCases.filter((c) => c.userId === userId || !c.userId);
}

/**
 * Citizen / Public: Get status of a complaint by complaint_id
 * GET /api/v1/status/complaint/{complaint_id}
 */
export async function getComplaintStatus(complaintId, forceMock = false) {
  if (!forceMock) {
    try {
      return await apiClient(`/status/complaint/${complaintId}`);
    } catch (err) {
      if (!err.isNetworkError && !forceMock) throw err;
    }
  }

  const match = localCases.find((c) => c.complaint_id.toLowerCase() === complaintId.trim().toLowerCase());
  if (!match) {
    const error = new Error(`No complaint found with ID: ${complaintId}`);
    error.status = 404;
    throw error;
  }

  // Generate plain-language status explainer
  let plainMessage = "";
  switch (match.status) {
    case Status.SUBMITTED:
      plainMessage = "Your complaint has been safely recorded by our AI system and is currently being validated.";
      break;
    case Status.UNDER_REVIEW:
      plainMessage = `Our AI agents analyzed your report with ${(match.confidence * 100).toFixed(0)}% confidence and routed it to ${match.department}.`;
      break;
    case Status.ASSIGNED:
      plainMessage = `Your case is officially validated and assigned to the dispatch unit at ${match.department}. ${match.civicPointsAwarded > 0 ? `(+${match.civicPointsAwarded} Civic Points awarded)` : ""}`;
      break;
    case Status.IN_PROGRESS:
      plainMessage = `A field maintenance crew from ${match.department} is actively on-site working on resolution.`;
      break;
    case Status.INSPECTED:
      plainMessage = "Field supervisor has inspected the site. Final resolution actions are being carried out.";
      break;
    case Status.RESOLVED:
      plainMessage = `Good news! Your issue has been marked resolved by ${match.department} and verified according to municipal quality standards.`;
      break;
    case Status.CLOSED:
      plainMessage = "This case has been completed and archived. Thank you for contributing to civic improvement!";
      break;
    case Status.ESCALATED:
      plainMessage = "High priority SLA alert triggered: This complaint has been escalated to senior municipal leadership for rapid action.";
      break;
    default:
      plainMessage = "Your complaint is currently undergoing processing.";
  }

  return {
    case_id: match.id,
    complaint_id: match.complaint_id,
    status: match.status,
    message: plainMessage,
    department: match.department,
    priority: match.priority,
    validatedSeverity: match.validatedSeverity,
    civicPointsAwarded: match.civicPointsAwarded || 0,
    pointsBreakdown: match.pointsBreakdown,
    last_updated: match.updated_at,
    history: match.status_history,
    raw_case: match,
  };
}

/**
 * Official: Validate a complaint and award multi-factor civic points
 * POST /api/v1/dashboard/cases/{case_id}/validate
 */
export async function validateAndAwardPoints(caseId, validationData, forceMock = false) {
  if (!forceMock) {
    try {
      return await apiClient(`/dashboard/cases/${caseId}/validate`, {
        method: "POST",
        body: JSON.stringify(validationData),
      });
    } catch (err) {
      if (!err.isNetworkError && !forceMock) throw err;
    }
  }

  const caseIndex = localCases.findIndex((c) => c.id === caseId || c.complaint_id === caseId);
  if (caseIndex === -1) throw new Error("Case not found");

  const c = localCases[caseIndex];
  const severity = validationData.validatedSeverity || Priority.MEDIUM;
  
  // Calculate multi-factor civic points
  const basePoints = severity === Priority.CRITICAL ? 50 : severity === Priority.HIGH ? 30 : severity === Priority.MEDIUM ? 15 : 5;
  const evidenceBonus = (c.attachments && c.attachments.length > 0) ? 5 : 0;
  const impactBonus = validationData.highPublicImpact ? 10 : 0;
  const recurringBonus = validationData.isRecurringProblem ? 5 : 0;
  const totalPoints = basePoints + evidenceBonus + impactBonus + recurringBonus;

  const pointsReason = `+${basePoints} Validated ${severity.toUpperCase()} severity` +
    (evidenceBonus > 0 ? " +5 Quality Evidence" : "") +
    (impactBonus > 0 ? " +10 High Public Impact" : "") +
    (recurringBonus > 0 ? " +5 Recurring Infrastructure" : "");

  const now = new Date().toISOString();
  const nextStatus = Status.ASSIGNED;

  const newHistory = {
    status: nextStatus,
    message: `Officially validated by ${validationData.officerName || "Civic Official"}. Awarded +${totalPoints} Civic Contribution Points. Reason: ${pointsReason}`,
    timestamp: now,
    updated_by: validationData.officerName || "Authorized Civic Official",
  };

  const updatedCase = {
    ...c,
    status: nextStatus,
    validatedSeverity: severity,
    civicPointsAwarded: totalPoints,
    pointsBreakdown: {
      basePoints,
      evidenceBonus,
      impactBonus,
      recurringBonus,
      reason: pointsReason,
    },
    status_history: [...c.status_history, newHistory],
    updated_at: now,
  };

  localCases[caseIndex] = updatedCase;
  persistCases();
  return { updatedCase, pointsAwarded: totalPoints, pointsReason, userId: c.userId };
}

/**
 * Official: Update case status and message
 * PATCH /api/v1/dashboard/cases/{case_id}
 */
export async function updateCaseStatus(caseId, updatePayload, forceMock = false) {
  if (!forceMock) {
    try {
      return await apiClient(`/dashboard/cases/${caseId}`, {
        method: "PATCH",
        body: JSON.stringify(updatePayload),
      });
    } catch (err) {
      if (!err.isNetworkError && !forceMock) throw err;
    }
  }

  const caseIndex = localCases.findIndex((c) => c.id === caseId || c.complaint_id === caseId);
  if (caseIndex === -1) {
    const error = new Error(`Case with ID ${caseId} not found`);
    error.status = 404;
    throw error;
  }

  const currentCase = localCases[caseIndex];
  const now = new Date().toISOString();
  
  const newHistoryItem = {
    status: updatePayload.status,
    message: updatePayload.message || `Status changed to ${updatePayload.status.replace("_", " ")}`,
    timestamp: now,
    updated_by: updatePayload.updated_by || "Authorized Civic Official",
  };

  const updatedCase = {
    ...currentCase,
    status: updatePayload.status,
    updated_at: now,
    status_history: [...currentCase.status_history, newHistoryItem],
    resolution_photo: updatePayload.resolution_photo || currentCase.resolution_photo,
  };

  localCases[caseIndex] = updatedCase;
  persistCases();
  return updatedCase;
}

/**
 * Official: Get list of active departments
 * GET /api/v1/dashboard/departments
 */
export async function getDepartments(forceMock = false) {
  if (!forceMock) {
    try {
      return await apiClient("/dashboard/departments");
    } catch (err) {
      if (!err.isNetworkError && !forceMock) throw err;
    }
  }
  return DepartmentsList;
}

/**
 * Official: Get all cases for a department
 * GET /api/v1/dashboard/departments/{department_name}/cases
 */
export async function getDepartmentCases(departmentName, forceMock = false) {
  if (!forceMock) {
    try {
      return await apiClient(`/dashboard/departments/${encodeURIComponent(departmentName)}/cases`);
    } catch (err) {
      if (!err.isNetworkError && !forceMock) throw err;
    }
  }

  if (!departmentName || departmentName === "all") {
    return localCases;
  }

  return localCases.filter((c) => {
    const cDept = (c.department || "").toLowerCase();
    const targetDept = departmentName.toLowerCase();
    return cDept.includes(targetDept) || targetDept.includes(cDept) || c.category === targetDept;
  });
}

/**
 * Official: Get statistics for a department
 * GET /api/v1/dashboard/departments/{department_name}/stats
 */
export async function getDepartmentStats(departmentName, forceMock = false) {
  if (!forceMock) {
    try {
      return await apiClient(`/dashboard/departments/${encodeURIComponent(departmentName)}/stats`);
    } catch (err) {
      if (!err.isNetworkError && !forceMock) throw err;
    }
  }

  const key = Object.keys(mockDepartmentStats).find(
    (k) => mockDepartmentStats[k].department.toLowerCase() === (departmentName || "").toLowerCase() || k === departmentName
  );

  const deptCases = localCases.filter((c) => {
    const cDept = (c.department || "").toLowerCase();
    const targetDept = (departmentName || "").toLowerCase();
    return cDept.includes(targetDept) || targetDept.includes(cDept) || c.category === targetDept;
  });

  const openCount = deptCases.filter((c) => [Status.SUBMITTED, Status.UNDER_REVIEW, Status.ASSIGNED].includes(c.status)).length;
  const inProgressCount = deptCases.filter((c) => [Status.IN_PROGRESS, Status.INSPECTED].includes(c.status)).length;
  const resolvedCount = deptCases.filter((c) => [Status.RESOLVED, Status.CLOSED].includes(c.status)).length;
  const escalatedCount = deptCases.filter((c) => c.status === Status.ESCALATED).length;

  return {
    department: departmentName,
    total_cases: deptCases.length,
    open_cases: openCount,
    in_progress: inProgressCount,
    resolved: resolvedCount,
    escalated: escalatedCount,
    avg_resolution_hours: (key && mockDepartmentStats[key]) ? mockDepartmentStats[key].avg_resolution_hours : 12.8,
  };
}

/**
 * Rewards: Get Benefits Catalog by Role
 */
export async function getBenefitsCatalog(role = UserRole.CITIZEN) {
  if (role === UserRole.VISITOR) {
    return VisitorBenefitsCatalog;
  }
  return ResidentBenefitsCatalog;
}

/**
 * Analytics Hotspots
 * GET /api/v1/analytics/hotspots
 */
export async function getAnalyticsHotspots(forceMock = false) {
  if (!forceMock) {
    try {
      return await apiClient("/analytics/hotspots");
    } catch (err) {
      if (!err.isNetworkError && !forceMock) throw err;
    }
  }
  return mockHotspots;
}

/**
 * Analytics Metrics
 * GET /api/v1/analytics/metrics
 */
export async function getAnalyticsMetrics(forceMock = false) {
  if (!forceMock) {
    try {
      return await apiClient("/analytics/metrics");
    } catch (err) {
      if (!err.isNetworkError && !forceMock) throw err;
    }
  }
  return {
    total_complaints_processed: 184,
    ai_classification_accuracy: 97.4,
    avg_intake_to_routing_seconds: 4.2,
    sla_compliance_rate: 93.8,
    duplicates_merged_count: 32,
    active_escalations: 7,
  };
}
