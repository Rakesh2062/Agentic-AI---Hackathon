import React, { useState, useEffect } from "react";
import { Modal } from "../common/Modal";
import { StatusBadge, PriorityBadge, CategoryBadge } from "../common/Badge";
import { SLAIndicator } from "../common/SLAIndicator";
import { StatusTimeline } from "../citizen/StatusTimeline";
import { updateCaseStatus, validateAndAwardPoints } from "../../api/endpoints";
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import { formatDate } from "../../utils/formatters";
import { Status, Priority } from "../../utils/constants";
import { 
  Sparkles, 
  MapPin, 
  Users, 
  CheckCircle2, 
  Camera, 
  User, 
  Send, 
  Clock, 
  AlertTriangle, 
  Activity,
  Layers,
  ArrowRight,
  Loader2,
  Award,
  ShieldCheck,
  FileCheck2,
  XCircle,
  HelpCircle
} from "lucide-react";

export function CaseDetailModal({ isOpen, onClose, caseItem, onCaseUpdated }) {
  const { showToast } = useApp();
  const { isOfficial, currentUser, awardCivicPoints } = useAuth();

  const [newStatus, setNewStatus] = useState(caseItem?.status || Status.ASSIGNED);
  const [updateMessage, setUpdateMessage] = useState("");
  const [officerName, setOfficerName] = useState(currentUser?.name || "Officer Sarah Chen");
  const [resolutionPhoto, setResolutionPhoto] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Validation & Point Awarding Form State
  const [validatedSeverity, setValidatedSeverity] = useState(caseItem?.priority || Priority.HIGH);
  const [highPublicImpact, setHighPublicImpact] = useState(true);
  const [isRecurringProblem, setIsRecurringProblem] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    if (caseItem) {
      setNewStatus(caseItem.status);
      setUpdateMessage("");
      setResolutionPhoto(caseItem.resolution_photo || "");
      setValidatedSeverity(caseItem.validatedSeverity || caseItem.priority || Priority.HIGH);
    }
  }, [caseItem]);

  if (!caseItem) return null;

  // Calculate live preview points
  const basePoints = validatedSeverity === Priority.CRITICAL ? 50 : validatedSeverity === Priority.HIGH ? 30 : validatedSeverity === Priority.MEDIUM ? 15 : 5;
  const evidenceBonus = (caseItem.attachments && caseItem.attachments.length > 0) ? 5 : 0;
  const impactBonus = highPublicImpact ? 10 : 0;
  const recurringBonus = isRecurringProblem ? 5 : 0;
  const calculatedPoints = basePoints + evidenceBonus + impactBonus + recurringBonus;

  const handleValidateAndAward = async (e) => {
    e.preventDefault();
    setIsValidating(true);

    try {
      const result = await validateAndAwardPoints(
        caseItem.id,
        {
          validatedSeverity,
          highPublicImpact,
          isRecurringProblem,
          officerName: currentUser?.name || officerName,
        },
      );

      // Award points in AuthContext with duplicate prevention
      if (result.userId) {
        awardCivicPoints(
          result.userId, 
          result.pointsAwarded, 
          result.pointsReason, 
          caseItem.summary || caseItem.raw_text,
          caseItem.complaint_id || caseItem.id
        );
      }

      setIsValidating(false);
      showToast(`Complaint officially validated! +${result.pointsAwarded} Civic Points awarded to citizen.`, "success");
      onCaseUpdated(result.updatedCase);
      onClose();
    } catch (err) {
      setIsValidating(false);
      showToast(err.message || "Failed to validate complaint", "error");
    }
  };

  const handleReject = async () => {
    const reason = prompt("Enter reason for rejecting this report (citizen will be notified):", "Duplicate report or insufficient public safety criteria.");
    if (!reason) return;

    setIsUpdating(true);
    try {
      const updated = await updateCaseStatus(
        caseItem.id,
        {
          status: Status.CLOSED,
          message: `Official Rejected: ${reason}`,
          updated_by: currentUser?.name || "Civic Official",
        },
      );
      setIsUpdating(false);
      showToast(`Report ${caseItem.complaint_id} rejected and archived.`, "info");
      onCaseUpdated(updated);
      onClose();
    } catch (err) {
      setIsUpdating(false);
      showToast("Failed to reject report", "error");
    }
  };

  const handleRequestInfo = async () => {
    const note = prompt("Specify what additional information is required from the citizen:", "Please provide clearer photos of the affected water valve or exact street intersection.");
    if (!note) return;

    setIsUpdating(true);
    try {
      const updated = await updateCaseStatus(
        caseItem.id,
        {
          status: Status.UNDER_REVIEW,
          message: `Additional Information Requested: ${note}`,
          updated_by: currentUser?.name || "Civic Official",
        },
      );
      setIsUpdating(false);
      showToast(`Information requested from citizen.`, "info");
      onCaseUpdated(updated);
      onClose();
    } catch (err) {
      setIsUpdating(false);
      showToast("Failed to request info", "error");
    }
  };

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    setIsUpdating(true);

    const payload = {
      status: newStatus,
      message: updateMessage.trim() || undefined,
      updated_by: officerName.trim() || "Authorized Civic Official",
      resolution_photo: resolutionPhoto.trim() || undefined,
    };

    try {
      const updated = await updateCaseStatus(caseItem.id, payload);
      setIsUpdating(false);
      showToast(`Case ${caseItem.complaint_id} updated to ${newStatus.replace("_", " ")}`, "success");
      onCaseUpdated(updated);
      onClose();
    } catch (err) {
      setIsUpdating(false);
      showToast(err.message || "Failed to update case", "error");
    }
  };

  const confidencePercent = Math.round((caseItem.confidence || 0.95) * 100);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-white font-bold">{caseItem.complaint_id}</span>
          <StatusBadge status={caseItem.status} size="md" />
          <PriorityBadge priority={caseItem.priority} size="sm" />
        </div>
      }
      subtitle={`Submitted by ${caseItem.citizen_name || "Citizen"} • ${formatDate(caseItem.created_at)}`}
      maxWidth="max-w-6xl"
    >
      <div className="space-y-6">
        
        {/* Raw Complaint & AI Summary Box */}
        <div className="bg-zinc-900/60 border border-white/[0.08] p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="meta-label flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-zinc-400" /> [ 01 ] AI INTAKE &amp; NLP ANALYSIS
            </span>
            <span className="text-[10px] font-mono text-zinc-300 bg-zinc-950 border border-white/[0.10] px-2 py-0.5">
              {confidencePercent}% AI Confidence
            </span>
          </div>

          <p className="text-xs sm:text-sm font-mono text-zinc-100 bg-zinc-950 p-3.5 border border-white/[0.08]">
            "{caseItem.raw_text}"
          </p>

          <div className="flex flex-wrap gap-2 text-xs text-zinc-400 pt-1 font-mono">
            <CategoryBadge category={caseItem.category} />
            {caseItem.custom_category_specification && (
              <span className="px-2.5 py-0.5 bg-zinc-900 text-zinc-200 border border-white/[0.08] text-[10px]">
                Specified: {caseItem.custom_category_specification}
              </span>
            )}
            {caseItem.sub_category && (
              <span className="px-2.5 py-0.5 bg-zinc-900 text-zinc-300 border border-white/[0.08] text-[10px]">
                {caseItem.sub_category}
              </span>
            )}
            <span className="px-2.5 py-0.5 bg-zinc-900 text-zinc-300 border border-white/[0.08] text-[10px] flex items-center gap-1">
              <Users className="w-3 h-3 text-zinc-400" />
              {caseItem.citizen_count || 1} Reports Merged
            </span>
          </div>
        </div>

        {/* Official Civic Validation & Point Awarding Engine */}
        <div className="bg-zinc-950 border border-white/[0.12] p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-zinc-300" />
              <div>
                <h3 className="text-xs font-mono uppercase font-bold text-white tracking-wider">
                  [ 02 ] Official Verification &amp; Point Awarding
                </h3>
                <p className="meta-label text-[9px] text-zinc-500">
                  Validate severity and credit multi-factor civic contribution points to reporting citizen.
                </p>
              </div>
            </div>

            <div className="text-right font-mono">
              <span className="text-[10px] text-zinc-500 block">Calculated Points:</span>
              <span className="text-lg font-bold text-white">+{calculatedPoints} pts</span>
            </div>
          </div>

          <form onSubmit={handleValidateAndAward} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono">
              <div>
                <label className="meta-label block mb-1">
                  Validated Severity (Base Points)
                </label>
                <select
                  value={validatedSeverity}
                  onChange={(e) => setValidatedSeverity(e.target.value)}
                  className="focus-ring w-full bg-zinc-900 border border-white/[0.10] focus:border-white/40 px-3 py-2 text-xs font-mono text-zinc-100 outline-none"
                >
                  <option value={Priority.LOW}>Low (+5 pts)</option>
                  <option value={Priority.MEDIUM}>Medium (+15 pts)</option>
                  <option value={Priority.HIGH}>High (+30 pts)</option>
                  <option value={Priority.CRITICAL}>Critical (+50 pts)</option>
                </select>
              </div>

              <div className="flex flex-col justify-end">
                <label className="flex items-center gap-2 p-2 bg-zinc-900 border border-white/[0.08] cursor-pointer text-xs text-zinc-300">
                  <input
                    type="checkbox"
                    checked={highPublicImpact}
                    onChange={(e) => setHighPublicImpact(e.target.checked)}
                    className="accent-white"
                  />
                  <span>High Public Reach (+10 pts)</span>
                </label>
              </div>

              <div className="flex flex-col justify-end">
                <label className="flex items-center gap-2 p-2 bg-zinc-900 border border-white/[0.08] cursor-pointer text-xs text-zinc-300">
                  <input
                    type="checkbox"
                    checked={isRecurringProblem}
                    onChange={(e) => setIsRecurringProblem(e.target.checked)}
                    className="accent-white"
                  />
                  <span>Recurring Problem (+5 pts)</span>
                </label>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/[0.08]">
              <span className="text-[11px] font-mono text-zinc-400">
                Reporting Citizen: <strong className="text-zinc-200">{caseItem.citizen_name || "Civic Participant"}</strong>
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleReject}
                  className="px-3 py-1.5 bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 text-xs font-mono uppercase transition flex items-center gap-1"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Reject</span>
                </button>

                <button
                  type="button"
                  onClick={handleRequestInfo}
                  className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-white/[0.10] text-xs font-mono uppercase transition flex items-center gap-1"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Request Info</span>
                </button>

                <button
                  type="submit"
                  disabled={isValidating}
                  className="px-4 py-1.5 bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-mono uppercase font-bold transition flex items-center gap-1.5"
                >
                  {isValidating ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <ShieldCheck className="w-3.5 h-3.5" />
                  )}
                  <span>Validate &amp; Award +{calculatedPoints} pts</span>
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* AI Priority Scoring & Factors Breakdown */}
        {caseItem.priority_breakdown && (
          <div className="bg-zinc-900/50 border border-white/[0.08] p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="meta-label flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-zinc-400" /> [ 03 ] PRIORITIZATION AGENT SCORECARD
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-zinc-500">Score:</span>
                <span className="text-xs font-mono font-bold text-white px-2 py-0.5 bg-zinc-950 border border-white/[0.10]">
                  {caseItem.priority_breakdown.score} / 100
                </span>
              </div>
            </div>

            <div className="w-full bg-zinc-950 h-1.5 overflow-hidden border border-white/[0.08]">
              <div
                className="h-full bg-white transition-all duration-500"
                style={{ width: `${Math.min(100, caseItem.priority_breakdown.score || 50)}%` }}
              />
            </div>
          </div>
        )}

        {/* Location & Target SLA */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-zinc-900/50 border border-white/[0.08] p-4 text-xs font-mono space-y-2">
            <span className="meta-label flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-zinc-400" /> Incident Location
            </span>
            <p className="font-semibold text-zinc-200">
              {caseItem.location?.address || "Address not provided"}
            </p>
            <p className="text-zinc-500 text-[11px]">
              {caseItem.location?.ward || "General Ward"}
            </p>
          </div>

          <div className="bg-zinc-900/50 border border-white/[0.08] p-4 text-xs font-mono space-y-2">
            <span className="meta-label flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-zinc-400" /> Target SLA Deadline
            </span>
            <div className="pt-1">
              <SLAIndicator slaDeadline={caseItem.sla_deadline} status={caseItem.status} />
            </div>
            <p className="text-zinc-500 text-[11px] pt-1">
              Target Deadline: {formatDate(caseItem.sla_deadline)}
            </p>
          </div>
        </div>

        {/* Status Transition Action Form */}
        <form
          onSubmit={handleStatusUpdate}
          className="bg-zinc-950 border border-white/[0.12] p-5 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <div className="flex items-center gap-2">
              <Send className="w-4 h-4 text-zinc-400" />
              <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                [ 04 ] Transition Status &amp; Post Resolution Note
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono">
            <div>
              <label className="meta-label block mb-1.5">
                Update Status To:
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="focus-ring w-full bg-zinc-900 border border-white/[0.10] focus:border-white/40 px-3.5 py-2 text-xs font-mono text-zinc-100 outline-none uppercase"
              >
                <option value={Status.ASSIGNED}>Assigned to Field Crew</option>
                <option value={Status.IN_PROGRESS}>In Progress (Work Underway)</option>
                <option value={Status.INSPECTED}>Inspected by Supervisor</option>
                <option value={Status.RESOLVED}>Resolved (Issue Fixed)</option>
                <option value={Status.CLOSED}>Closed &amp; Verified</option>
                <option value={Status.ESCALATED}>Escalate Priority</option>
              </select>
            </div>

            <div>
              <label className="meta-label block mb-1.5">
                Updating Officer:
              </label>
              <input
                type="text"
                value={officerName}
                onChange={(e) => setOfficerName(e.target.value)}
                className="focus-ring w-full bg-zinc-900 border border-white/[0.10] focus:border-white/40 px-3.5 py-2 text-xs font-mono text-zinc-100 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="meta-label block mb-1.5">
              Citizen-Visible Resolution Note:
            </label>
            <textarea
              rows={2}
              value={updateMessage}
              onChange={(e) => setUpdateMessage(e.target.value)}
              placeholder="e.g. Field maintenance team dispatched. Water main valve repaired and pressure test normal."
              className="focus-ring w-full bg-zinc-900 border border-white/[0.10] focus:border-white/40 p-3 text-xs font-mono text-zinc-100 placeholder-zinc-500 outline-none resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 font-mono text-xs uppercase"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUpdating}
              className="focus-ring px-5 py-2 bg-white hover:bg-zinc-200 text-zinc-950 font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition disabled:opacity-50"
            >
              {isUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              <span>Apply Status Update</span>
            </button>
          </div>
        </form>

        {/* Existing Status History Timeline */}
        <div className="pt-2">
          <StatusTimeline
            history={caseItem.status_history || []}
            currentStatus={caseItem.status}
          />
        </div>
      </div>
    </Modal>
  );
}
