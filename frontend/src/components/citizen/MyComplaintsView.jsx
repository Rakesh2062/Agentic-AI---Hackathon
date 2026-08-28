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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50 border border-slate-200 p-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold uppercase text-slate-900 font-mono">
              [ 01 ] MY FILED INCIDENTS
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Track all civic issues submitted under your account, official validation milestones, and earned points.
          </p>
        </div>

        <button
          onClick={onNewReportClick}
          className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-mono text-xs uppercase tracking-wider font-bold transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Report New Issue</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-50 p-3 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search reports by ID or keyword..."
            className="w-full bg-white border border-slate-200 focus:border-slate-400 pl-8 pr-3 py-1.5 text-xs font-mono text-slate-850 placeholder-slate-400 outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-slate-200 text-slate-700 text-xs font-mono uppercase px-3 py-1.5 outline-none font-medium"
          >
            <option value="all">All Statuses</option>
            <option value="submitted">Submitted</option>
            <option value="under_review">Awaiting Validation</option>
            <option value="assigned">Validated &amp; Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="escalated">Escalated</option>
          </select>

          <button
            onClick={loadUserComplaints}
            className="p-1.5 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 border border-slate-200 transition cursor-pointer"
            title="Refresh my reports"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-slate-900" : ""}`} />
          </button>
        </div>
      </div>

      {/* Reports List */}
      {loading ? (
        <div className="py-20 text-center border border-slate-200 bg-slate-50">
          <Loader2 className="w-6 h-6 animate-spin text-slate-600 mx-auto mb-3" />
          <p className="meta-label text-slate-500">[ LOADING INCIDENT ARCHIVES... ]</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-slate-50 p-12 text-center border border-slate-200 space-y-3">
          <FileText className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="text-sm font-mono uppercase font-bold text-slate-805">[ No Matching Reports Found ]</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            You haven't submitted any reports matching this filter. Spot a civic issue in your neighborhood?
          </p>
          <button
            onClick={onNewReportClick}
            className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 border border-slate-200 bg-slate-900 hover:bg-slate-800 text-white font-mono text-xs uppercase tracking-wider transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
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
                className={`p-4 sm:p-5 border transition-all cursor-pointer hover:border-slate-350 ${
                  selectedCase?.id === item.id ? "border-slate-400 bg-slate-50" : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900">
                        {item.complaint_id}
                      </span>
                      <StatusBadge status={item.status} size="sm" />
                      <PriorityBadge priority={item.priority} size="sm" />
                      {hasPoints && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 border border-emerald-200">
                          <Award className="w-3 h-3 text-emerald-600" />
                          +{item.civicPointsAwarded} pts Awarded
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-medium text-slate-800 truncate">
                      {item.title || item.summary || item.raw_text}
                    </h3>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-mono">
                      <CategoryBadge category={item.category} size="sm" />
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {item.location?.ward || "Metro Zone"}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Submitted: {formatDate(item.created_at)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 justify-between sm:justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200">
                    <SLAIndicator slaDeadline={item.sla_deadline} status={item.status} />
                    <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${selectedCase?.id === item.id ? "rotate-90 text-slate-800" : ""}`} />
                  </div>
                </div>

                  {/* Expanded Drawer */}
                  {selectedCase?.id === item.id && (
                    <div className="mt-5 pt-5 border-t border-slate-200 animate-slide-up space-y-4">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                        <span className="font-bold text-slate-700 block">Full Incident Details:</span>
                        <p className="text-slate-600">{item.raw_text}</p>
                      </div>

                      {/* Attachments */}
                      {item.attachments?.length > 0 && (
                        <div className="space-y-2">
                          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                            <Camera className="w-3.5 h-3.5 text-indigo-500" />
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
                                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-sky-50 border border-sky-200 text-xs text-sky-700 hover:bg-sky-100 transition cursor-pointer"
                                >
                                  <FileText className="w-4 h-4 text-sky-600 flex-shrink-0" />
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
                                  className="relative group block w-28 h-28 rounded-xl overflow-hidden border border-slate-200 hover:border-indigo-500 transition flex-shrink-0"
                                >
                                  <img
                                    src={url}
                                    alt={`Evidence ${idx + 1}`}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.currentTarget.style.display = "none";
                                      e.currentTarget.parentElement.classList.add("bg-slate-100", "flex", "items-center", "justify-center");
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
                        <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-250 text-xs">
                          <span className="font-bold text-emerald-700 block flex items-center gap-1.5">
                            <Award className="w-3.5 h-3.5" /> Validation Points Breakdown:
                          </span>
                          <p className="text-slate-655 mt-0.5 font-mono">{item.pointsBreakdown.reason}</p>
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
