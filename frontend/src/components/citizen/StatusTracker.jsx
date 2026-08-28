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
  "CMP-55503AB2",
  "CMP-2A66E6B8",
  "CMP-FC642D28",
  "CMP-73523B22"
];

export function StatusTracker() {
  const { activeTrackingId, setActiveTrackingId, showToast } = useApp();

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
    const targetId = (idToSearch || searchId).trim().toUpperCase();
    if (!targetId) {
      setErrorMsg("Please enter a valid Complaint Tracking ID.");
      return;
    }

    setErrorMsg("");
    setLoading(true);
    setHasCoSigned(false);

    try {
      const data = await getComplaintStatus(targetId);
      setStatusData(data);
      setCoSignCount(data.raw_case?.citizen_count || 1);
      setSearchId(data.complaint_id);
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
        <div className="meta-label inline-flex items-center gap-2 border-b border-white/10 pb-1 mb-3">
          <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
          [ 01 ] PUBLIC CIVIC TRANSPARENCY
        </div>
        <h1 className="text-3xl sm:text-5xl font-bold text-white tracking-tight uppercase">
          Track Incident Resolution
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-2 max-w-xl mx-auto">
          Enter your Complaint ID to inspect live AI status summaries, department dispatches, and SLA timeline.
        </p>
      </div>

      {/* Search Input Bar */}
      <div className="bg-zinc-950 border border-white/[0.10] p-4 sm:p-5 space-y-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              placeholder="e.g. CMP-2026-8821"
              className="focus-ring w-full bg-zinc-900 border border-white/[0.10] focus:border-white/40 pl-10 pr-4 py-2.5 text-xs sm:text-sm text-zinc-100 placeholder-zinc-500 font-mono outline-none uppercase"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !searchId.trim()}
            className="focus-ring px-6 py-2.5 bg-white hover:bg-zinc-200 text-zinc-950 font-mono text-xs uppercase tracking-wider font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition"
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
        <div className="flex items-center flex-wrap gap-1.5 pt-1 text-xs">
          <span className="meta-label text-[9px] mr-1">
            Examples:
          </span>
          {SAMPLE_TRACK_IDS.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setSearchId(id);
                handleSearch(id);
              }}
              className="font-mono text-[10px] px-2 py-0.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-white/[0.08] transition"
            >
              {id}
            </button>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="flex items-center gap-3 p-4 bg-rose-950 border border-rose-800 text-rose-200 text-xs font-mono animate-fade-in">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
          <div>
            <p className="font-semibold">{errorMsg}</p>
            <p className="text-[10px] text-rose-300/80 mt-0.5">
              Check the ID format (e.g. CMP-XXXX) or try one of the sample tracking IDs above.
            </p>
          </div>
        </div>
      )}

      {/* Results View */}
      {statusData && (
        <div className="space-y-6 animate-slide-up">
          {/* Main Status Hero Card */}
          <div className="bg-zinc-950 border border-white/[0.10] p-6 sm:p-7 space-y-5">
            {/* Top Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
              <div>
                <span className="meta-label block mb-1">
                  [ TRACKING RECORD ]
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-white font-mono flex items-center gap-2">
                  {statusData.complaint_id}
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <StatusBadge status={statusData.status} size="lg" />
                <PriorityBadge priority={statusData.priority} size="md" />
              </div>
            </div>

            {/* AI Status Explainer Box */}
            <div className="bg-zinc-900/80 border border-white/[0.10] p-4 sm:p-5">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="meta-label text-[10px] text-zinc-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
                  <span>AI Status Explainer Output</span>
                </div>
                <span className="text-[10px] text-zinc-500 font-mono">
                  Updated: {formatDate(statusData.last_updated)}
                </span>
              </div>
              <p className="text-zinc-200 text-xs sm:text-sm leading-relaxed font-mono">
                "{statusData.message}"
              </p>
            </div>

            {/* Meta Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="bg-zinc-900/50 p-3.5 border border-white/[0.08]">
                <span className="meta-label text-[9px] block mb-1">Assigned Bureau</span>
                <span className="text-xs font-mono font-bold text-zinc-200 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-zinc-400" />
                  {statusData.department}
                </span>
              </div>

              <div className="bg-zinc-900/50 p-3.5 border border-white/[0.08]">
                <span className="meta-label text-[9px] block mb-1">SLA Target &amp; Urgency</span>
                <SLAIndicator 
                  slaDeadline={statusData.raw_case?.sla_deadline} 
                  status={statusData.status} 
                />
              </div>

              <div className="bg-zinc-900/50 p-3.5 border border-white/[0.08]">
                <span className="meta-label text-[9px] block mb-1">Civic Verification</span>
                <span className="text-xs font-mono text-zinc-300 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Validated by City AI
                </span>
              </div>
            </div>

            {/* Interactive Co-Signing & Map Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-900/40 p-3 border border-white/[0.08]">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleCoSign}
                  className={`px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition flex items-center gap-1.5 ${
                    hasCoSigned
                      ? "bg-zinc-800 text-zinc-200 border border-white/20"
                      : "bg-white hover:bg-zinc-200 text-zinc-950 font-bold"
                  }`}
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>{hasCoSigned ? "You Co-Signed (+1)" : "I'm Affected Too"}</span>
                </button>

                <span className="text-xs text-zinc-400 flex items-center gap-1 font-mono">
                  <Users className="w-3.5 h-3.5 text-zinc-500" />
                  <strong className="text-zinc-200">{coSignCount}</strong> citizens affected
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowLocationMap(!showLocationMap)}
                  className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-mono uppercase tracking-wider border border-white/[0.10] flex items-center gap-1.5 transition"
                >
                  <MapIcon className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{showLocationMap ? "Hide Map" : "View Map"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleShareLink}
                  className="p-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-white/[0.10] transition"
                  title="Share tracking link"
                >
                  {linkCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
                </button>

                <button
                  type="button"
                  onClick={handlePrintCertificate}
                  className="p-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-white/[0.10] transition"
                  title="Print case report"
                >
                  <Printer className="w-3.5 h-3.5" />
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
          <div className="bg-zinc-950 border border-white/[0.10] p-6 sm:p-7">
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
