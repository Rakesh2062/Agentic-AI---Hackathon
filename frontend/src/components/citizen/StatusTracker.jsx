import React, { useState, useEffect } from "react";
import { 
  Search, 
  Sparkles, 
  Building2, 
  Clock, 
  MapPin, 
  Users, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Tag,
  Share2,
  ThumbsUp,
  FileCheck,
  Check,
  Map as MapIcon,
  Printer
} from "lucide-react";
import { getComplaintStatus } from "../../api/endpoints";
import { useApp } from "../../context/AppContext";
import { StatusBadge, PriorityBadge, CategoryBadge } from "../common/Badge";
import { SLAIndicator } from "../common/SLAIndicator";
import { StatusTimeline } from "./StatusTimeline";
import { InteractiveMap } from "../common/InteractiveMap";
import { formatDate } from "../../utils/formatters";

const SAMPLE_TRACK_IDS = [
  "CMP-2026-8821",
  "CMP-2026-7419",
  "CMP-2026-5510",
  "CMP-2026-3392",
  "CMP-2026-0045"
];

export function StatusTracker() {
  const { activeTrackingId, setActiveTrackingId, demoMode, showToast } = useApp();

  const [searchId, setSearchId] = useState(activeTrackingId || "");
  const [loading, setLoading] = useState(false);
  const [statusData, setStatusData] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  
  // Interactive features
  const [hasCoSigned, setHasCoSigned] = useState(false);
  const [coSignCount, setCoSignCount] = useState(0);
  const [showLocationMap, setShowLocationMap] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const handleSearch = async (idToSearch) => {
    const targetId = (idToSearch || searchId).trim();
    if (!targetId) {
      setErrorMsg("Please enter a valid Complaint Tracking ID.");
      return;
    }

    setErrorMsg("");
    setLoading(true);
    setHasCoSigned(false);

    try {
      const data = await getComplaintStatus(targetId, demoMode);
      setStatusData(data);
      setCoSignCount(data.raw_case?.citizen_count || 1);
      setActiveTrackingId(targetId);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setStatusData(null);
      setErrorMsg(err.message || `No active record found for tracking ID "${targetId}".`);
      showToast(err.message || "Tracking lookup failed", "error");
    }
  };

  useEffect(() => {
    if (activeTrackingId) {
      setSearchId(activeTrackingId);
      handleSearch(activeTrackingId);
    }
  }, [activeTrackingId]);

  const handleCoSign = () => {
    if (hasCoSigned) {
      showToast("You have already co-signed this complaint report.", "info");
      return;
    }
    setHasCoSigned(true);
    setCoSignCount((c) => c + 1);
    showToast("Co-signed! Duplicate report count increased & priority score escalated.", "success");
  };

  const handleShareLink = () => {
    const url = window.location.origin;
    navigator.clipboard.writeText(`${url}/?track=${statusData.complaint_id}`);
    setLinkCopied(true);
    showToast("Tracking link copied to clipboard", "info");
    setTimeout(() => setLinkCopied(false), 2500);
  };

  const handlePrintCertificate = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Search Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-950/80 border border-sky-800 text-sky-300 text-xs font-semibold uppercase tracking-wider mb-3 shadow-inner">
          <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
          Public Civic Transparency Portal
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight font-sans">
          Track Complaint Resolution
        </h1>
        <p className="text-sm sm:text-base text-slate-400 mt-2 max-w-xl mx-auto">
          Enter your Complaint ID to inspect live AI status summaries, department dispatches, and SLA timeline.
        </p>
      </div>

      {/* Search Input Bar */}
      <div className="glass-panel p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-xl space-y-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              placeholder="e.g. CMP-2026-8821"
              className="w-full bg-slate-950/90 border border-slate-700/80 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 rounded-xl pl-11 pr-4 py-3 text-sm sm:text-base text-slate-100 placeholder-slate-500 font-mono outline-none uppercase"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !searchId.trim()}
            className="px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm shadow-md shadow-sky-600/30 flex items-center justify-center gap-2 disabled:opacity-50 transition"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Searching...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Track Status</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Sample IDs */}
        <div className="flex items-center flex-wrap gap-1.5 pt-1 text-xs text-slate-400">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">
            Quick Examples:
          </span>
          {SAMPLE_TRACK_IDS.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setSearchId(id);
                handleSearch(id);
              }}
              className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 transition"
            >
              {id}
            </button>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="flex items-center gap-3 p-4 bg-rose-950/80 border border-rose-800 text-rose-200 rounded-xl text-sm animate-fade-in">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
          <div>
            <p className="font-semibold">{errorMsg}</p>
            <p className="text-xs text-rose-300/80 mt-0.5">
              Check the ID format (e.g. CMP-2026-XXXX) or try one of the sample tracking IDs above.
            </p>
          </div>
        </div>
      )}

      {/* Results View */}
      {statusData && (
        <div className="space-y-6 animate-slide-up">
          {/* Main Status Hero Card */}
          <div className="glass-card rounded-2xl p-6 sm:p-7 border border-slate-800 space-y-5">
            {/* Top Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs uppercase font-mono tracking-widest text-slate-400">
                  Tracking Record
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white font-mono flex items-center gap-2">
                  {statusData.complaint_id}
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <StatusBadge status={statusData.status} size="lg" />
                <PriorityBadge priority={statusData.priority} size="md" />
              </div>
            </div>

            {/* AI Status Explainer Box */}
            <div className="bg-gradient-to-r from-sky-950/60 via-slate-900 to-emerald-950/30 border border-sky-800/60 rounded-xl p-4 sm:p-5 shadow-inner">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-300">
                  <Sparkles className="w-4 h-4 text-sky-400" />
                  <span>AI Status Explainer Agent Output</span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  Updated: {formatDate(statusData.last_updated)}
                </span>
              </div>
              <p className="text-slate-100 text-sm sm:text-base leading-relaxed font-medium">
                "{statusData.message}"
              </p>
            </div>

            {/* Meta Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 block mb-1">Assigned Department</span>
                <span className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-sky-400" />
                  {statusData.department}
                </span>
              </div>

              <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 block mb-1">SLA Target & Urgency</span>
                <SLAIndicator 
                  slaDeadline={statusData.raw_case?.sla_deadline} 
                  status={statusData.status} 
                />
              </div>

              <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 block mb-1">Civic Verification</span>
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Autonomous Agent Validated
                </span>
              </div>
            </div>

            {/* Interactive Co-Signing & Map Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleCoSign}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    hasCoSigned
                      ? "bg-emerald-950 text-emerald-300 border border-emerald-700"
                      : "bg-slate-900 hover:bg-sky-600 text-slate-200 hover:text-white border border-slate-700"
                  }`}
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>{hasCoSigned ? "You Co-Signed (+1)" : "I'm Affected Too"}</span>
                </button>

                <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                  <Users className="w-3.5 h-3.5 text-emerald-400" />
                  <strong className="text-slate-200 font-bold">{coSignCount}</strong> citizens reported
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowLocationMap(!showLocationMap)}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition"
                >
                  <MapIcon className="w-3.5 h-3.5 text-sky-400" />
                  <span>{showLocationMap ? "Hide Location Map" : "View Ward Map"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleShareLink}
                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700 transition"
                  title="Share tracking link"
                >
                  {linkCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                </button>

                <button
                  type="button"
                  onClick={handlePrintCertificate}
                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700 transition"
                  title="Print case report"
                >
                  <Printer className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Optional Map View */}
            {showLocationMap && (
              <div className="pt-1 animate-slide-up">
                <InteractiveMap
                  mode="viewer"
                  existingCases={statusData.raw_case ? [statusData.raw_case] : []}
                  selectedWard={statusData.raw_case?.location?.ward}
                  height="h-60"
                />
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className="glass-card rounded-2xl p-6 sm:p-7 border border-slate-800 shadow-xl">
            <StatusTimeline
              history={statusData.history}
              currentStatus={statusData.status}
            />
          </div>
        </div>
      )}
    </div>
  );
}
