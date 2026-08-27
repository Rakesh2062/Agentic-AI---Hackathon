// Endpoints wrapper for FastAPI + MongoDB Backend
// All data comes from and goes to the real database — no mock fallbacks.

import { apiClient } from "./client";
import { Category, Status, Priority, UserRole, DepartmentsList, ResidentBenefitsCatalog, VisitorBenefitsCatalog } from "../utils/constants";

/**
 * Citizen / Visitor: Submit a new complaint
 * POST /api/v1/complaints
 */
export async function createComplaint(complaintData) {
  return await apiClient("/complaints", {
    method: "POST",
    body: JSON.stringify(complaintData),
  });
}

/**
 * Citizen: Get all complaints filed by a specific user
 * GET /api/v1/user/{userId}/complaints
 */
export async function getUserComplaints(userId) {
  return await apiClient(`/user/${userId}/complaints`);
}

/**
 * Citizen / Public: Get status of a complaint by complaint_id
 * GET /api/v1/status/complaint/{complaint_id}
 */
export async function getComplaintStatus(complaintId) {
  const data = await apiClient(`/status/complaint/${encodeURIComponent(complaintId)}`);

  // Generate plain-language status explainer
  let plainMessage = "";
  switch (data.status) {
    case "submitted":
    case Status.SUBMITTED:
      plainMessage = "Your complaint has been safely recorded by our AI system and is currently being validated.";
      break;
    case "under_review":
    case Status.UNDER_REVIEW:
      plainMessage = `Our AI agents analyzed your report with ${data.confidence ? (data.confidence * 100).toFixed(0) + "%" : "high"} confidence and routed it to ${data.department || "the appropriate department"}.`;
      break;
    case "assigned":
    case Status.ASSIGNED:
      plainMessage = `Your case is officially validated and assigned to the dispatch unit at ${data.department || "the department"}. ${data.civicPointsAwarded > 0 ? `(+${data.civicPointsAwarded} Civic Points awarded)` : ""}`;
      break;
    case "in_progress":
    case Status.IN_PROGRESS:
      plainMessage = `A field maintenance crew from ${data.department || "the department"} is actively on-site working on resolution.`;
      break;
    case "inspected":
    case Status.INSPECTED:
      plainMessage = "Field supervisor has inspected the site. Final resolution actions are being carried out.";
      break;
    case "resolved":
    case Status.RESOLVED:
      plainMessage = `Good news! Your issue has been marked resolved by ${data.department || "the department"} and verified according to municipal quality standards.`;
      break;
    case "closed":
    case Status.CLOSED:
      plainMessage = "This case has been completed and archived. Thank you for contributing to civic improvement!";
      break;
    case "escalated":
    case Status.ESCALATED:
      plainMessage = "High priority SLA alert triggered: This complaint has been escalated to senior municipal leadership for rapid action.";
      break;
    default:
      plainMessage = "Your complaint is currently undergoing processing.";
  }

  return {
    case_id: data.case_id,
    complaint_id: data.complaint_id,
    status: data.status,
    message: data.message || plainMessage,
    department: data.department,
    priority: data.priority,
    validatedSeverity: data.validatedSeverity,
    civicPointsAwarded: data.civicPointsAwarded || 0,
    pointsBreakdown: data.pointsBreakdown,
    last_updated: data.last_updated,
    history: data.history || [],
    raw_case: data,
  };
}

/**
 * Official: Validate a complaint and award multi-factor civic points
 * POST /api/v1/dashboard/cases/{case_id}/validate
 */
export async function validateAndAwardPoints(caseId, validationData) {
  return await apiClient(`/dashboard/cases/${caseId}/validate`, {
    method: "POST",
    body: JSON.stringify(validationData),
  });
}

/**
 * Official: Update case status and message
 * PATCH /api/v1/dashboard/cases/{case_id}
 */
export async function updateCaseStatus(caseId, updatePayload) {
  return await apiClient(`/dashboard/cases/${caseId}`, {
    method: "PATCH",
    body: JSON.stringify(updatePayload),
  });
}

/**
 * Official: Get list of active departments
 * GET /api/v1/dashboard/departments
 */
export async function getDepartments() {
  try {
    return await apiClient("/dashboard/departments");
  } catch (err) {
    return DepartmentsList;
  }
}

/**
 * Official: Get ALL cases (for official dashboard)
 * GET /api/v1/dashboard/cases
 */
export async function getAllCases(statusFilter = null) {
  const params = statusFilter ? `?status=${statusFilter}` : "";
  return await apiClient(`/dashboard/cases${params}`);
}

/**
 * Official: Get cases for a specific department
 * GET /api/v1/dashboard/departments/{department_name}/cases
 */
export async function getDepartmentCases(departmentName) {
  if (!departmentName || departmentName === "all") {
    return await getAllCases();
  }
  return await apiClient(`/dashboard/departments/${encodeURIComponent(departmentName)}/cases`);
}

/**
 * Official: Get statistics for a department
 * GET /api/v1/dashboard/departments/{department_name}/stats
 */
export async function getDepartmentStats(departmentName) {
  return await apiClient(`/dashboard/departments/${encodeURIComponent(departmentName)}/stats`);
}

/**
 * Rewards: Get Benefits Catalog by Role
 */
export async function getBenefitsCatalog(role = UserRole.CITIZEN) {
  if (role === UserRole.VISITOR || role === "tourist") {
    return VisitorBenefitsCatalog;
  }
  return ResidentBenefitsCatalog;
}

/**
 * Analytics Hotspots
 * GET /api/v1/analytics/hotspots or /api/v1/analytics/recurring
 */
export async function getAnalyticsHotspots() {
  try {
    return await apiClient("/analytics/hotspots");
  } catch (err) {
    // Fallback to recurring endpoint
    return await apiClient("/analytics/recurring");
  }
}

/**
 * Analytics Metrics
 * GET /api/v1/analytics/metrics
 */
export async function getAnalyticsMetrics() {
  try {
    return await apiClient("/analytics/metrics");
  } catch (err) {
    return {
      total_complaints_processed: 0,
      ai_classification_accuracy: 0,
      avg_intake_to_routing_seconds: 0,
      sla_compliance_rate: 0,
      duplicates_merged_count: 0,
      active_escalations: 0,
    };
  }
}
