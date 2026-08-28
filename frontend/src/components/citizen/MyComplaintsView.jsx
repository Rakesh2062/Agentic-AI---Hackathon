import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useApp } from "../../context/AppContext";
import { getUserComplaints } from "../../api/endpoints";
import { StatusBadge, PriorityBadge, CategoryBadge } from "../common/Badge";
import { SLAIndicator } from "../common/SLAIndicator";
import { StatusTimeline } from "./StatusTimeline";
import { formatDate } from "../../utils/formatters";
import { 
  FileText, 
  Search, 
  Filter, 
  CheckCircle2, 
  Award, 
  Clock, 
  ChevronRight, 
  MapPin, 
  RefreshCw,
  Plus,
  Loader2,
  Camera,
  Image,
  ExternalLink
} from "lucide-react";

export function MyComplaintsView({ onNewReportClick }) {
  const { currentUser } = useAuth();
  const { setActiveTrackingId, setActiveTab, setCitizenSubTab } = useApp();

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedCase, setSelectedCase] = useState(null);

  const loadUserComplaints = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const data = await getUserComplaints(currentUser.id);
      setComplaints(data || []);
      setLoading(false);
    } catch (e) {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserComplaints();
  }, [currentUser]);

  const filtered = complaints.filter((c) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      c.complaint_id.toLowerCase().includes(q) ||
      (c.raw_text || "").toLowerCase().includes(q) ||
      (c.summary || "").toLowerCase().includes(q) ||
      (c.title || "").toLowerCase().includes(q) ||
      (c.location?.address || "").toLowerCase().includes(q);

    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-5 rounded-2xl shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <FileText className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white">
              My Reports
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Track all civic issues submitted under your account, official validation milestones, and earned points.
          </p>
        </div>

        <button
          onClick={onNewReportClick}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md shadow-sky-600/30 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Report New Issue</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel p-3.5 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search reports by ID or keyword..."
            className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-lg px-3 py-1.5 outline-none font-medium"
          >
            <option value="all">All Statuses</option>
            <option value="submitted">Submitted</option>
            <option value="under_review">Awaiting Official Validation</option>
            <option value="assigned">Validated & Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="escalated">Escalated</option>
          </select>

          <button
            onClick={loadUserComplaints}
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition"
            title="Refresh my reports"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-sky-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* Reports List */}
      {loading ? (
        <div className="py-20 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-sky-500 mx-auto mb-3" />
          <p className="text-xs text-slate-400">Loading your reports...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-12 text-center rounded-2xl border border-slate-800 space-y-3">
          <FileText className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-200">No reports found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            You haven't submitted any reports matching this filter. Spot a civic issue in your neighborhood?
          </p>
          <button
            onClick={onNewReportClick}
            className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Submit Your First Report</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const hasPoints = item.civicPointsAwarded > 0;

            return (
              <div
                key={item.id}
                onClick={() => setSelectedCase(selectedCase?.id === item.id ? null : item)}
                className={`glass-card p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer hover:border-sky-500/60 ${
                  selectedCase?.id === item.id ? "border-sky-500 bg-slate-900/90" : "border-slate-800"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-sky-400">
                        {item.complaint_id}
                      </span>
                      <StatusBadge status={item.status} size="sm" />
                      <PriorityBadge priority={item.priority} size="sm" />
                      {hasPoints && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono font-extrabold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                          <Award className="w-3 h-3" />
                          +{item.civicPointsAwarded} pts Awarded
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-semibold text-slate-100 truncate">
                      {item.title || item.summary || item.raw_text}
                    </h3>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      <CategoryBadge category={item.category} size="sm" />
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-500" />
                        {item.location?.ward || "Metro Zone"}
                      </span>
                      <span className="text-[11px] font-mono">
                        Submitted: {formatDate(item.created_at)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 justify-between sm:justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                    <SLAIndicator slaDeadline={item.sla_deadline} status={item.status} />
                    <ChevronRight className={`w-5 h-5 text-slate-400 transition-transform ${selectedCase?.id === item.id ? "rotate-90 text-sky-400" : ""}`} />
                  </div>
                </div>

                  {/* Expanded Drawer */}
                  {selectedCase?.id === item.id && (
                    <div className="mt-5 pt-5 border-t border-slate-800/80 animate-slide-up space-y-4">
                      <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1">
                        <span className="font-bold text-slate-300 block">Full Incident Details:</span>
                        <p className="text-slate-400">{item.raw_text}</p>
                      </div>

                      {/* Attachments */}
                      {item.attachments?.length > 0 && (
                        <div className="space-y-2">
                          <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                            <Camera className="w-3.5 h-3.5 text-sky-400" />
                            Evidence Attached ({item.attachments.length})
                          </span>
                          <div className="flex flex-wrap gap-3">
                            {item.attachments.map((url, idx) => {
                              const isPdf = typeof url === "string" && url.endsWith(".pdf") || (typeof url === "string" && url.includes("/files/") && !url.match(/\.(jpe?g|png|webp|gif)$/i));
                              return isPdf ? (
                                <a
                                  key={idx}
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-sky-300 hover:border-sky-600 transition"
                                >
                                  <FileText className="w-4 h-4 text-sky-400 flex-shrink-0" />
                                  <span className="max-w-[140px] truncate">Document {idx + 1}</span>
                                  <ExternalLink className="w-3 h-3 flex-shrink-0" />
                                </a>
                              ) : (
                                <a
                                  key={idx}
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="relative group block w-28 h-28 rounded-xl overflow-hidden border border-slate-700 hover:border-sky-500 transition flex-shrink-0"
                                >
                                  <img
                                    src={url}
                                    alt={`Evidence ${idx + 1}`}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.currentTarget.style.display = "none";
                                      e.currentTarget.parentElement.classList.add("bg-slate-900", "flex", "items-center", "justify-center");
                                    }}
                                  />
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
                                    <ExternalLink className="w-5 h-5 text-white" />
                                  </div>
                                </a>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {item.pointsBreakdown && (
                        <div className="p-3 bg-emerald-950/40 rounded-xl border border-emerald-800/60 text-xs">
                          <span className="font-bold text-emerald-300 block flex items-center gap-1.5">
                            <Award className="w-3.5 h-3.5" /> Validation Points Breakdown:
                          </span>
                          <p className="text-slate-300 mt-0.5 font-mono">{item.pointsBreakdown.reason}</p>
                        </div>
                      )}

                      <StatusTimeline
                        history={item.status_history || []}
                        currentStatus={item.status}
                      />
                    </div>
                  )}
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
