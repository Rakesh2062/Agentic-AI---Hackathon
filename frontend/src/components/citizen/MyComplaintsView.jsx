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
  Loader2
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-zinc-950 border border-white/[0.10] p-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold uppercase text-white font-mono">
              [ 01 ] MY FILED INCIDENTS
            </h1>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Track all civic issues submitted under your account, official validation milestones, and earned points.
          </p>
        </div>

        <button
          onClick={onNewReportClick}
          className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-zinc-200 text-zinc-950 font-mono text-xs uppercase tracking-wider font-bold transition"
        >
          <Plus className="w-4 h-4" />
          <span>Report New Issue</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-zinc-950 p-3 border border-white/[0.10] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search reports by ID or keyword..."
            className="w-full bg-zinc-900 border border-white/[0.10] focus:border-white/40 pl-8 pr-3 py-1.5 text-xs font-mono text-zinc-200 placeholder-zinc-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-zinc-900 border border-white/[0.10] text-zinc-300 text-xs font-mono uppercase px-3 py-1.5 outline-none font-medium"
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
            className="p-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-white/[0.10] transition"
            title="Refresh my reports"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-white" : ""}`} />
          </button>
        </div>
      </div>

      {/* Reports List */}
      {loading ? (
        <div className="py-20 text-center border border-white/[0.10] bg-zinc-950">
          <Loader2 className="w-6 h-6 animate-spin text-white mx-auto mb-3" />
          <p className="meta-label text-zinc-400">[ LOADING INCIDENT ARCHIVES... ]</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-zinc-950 p-12 text-center border border-white/[0.10] space-y-3">
          <FileText className="w-8 h-8 text-zinc-600 mx-auto" />
          <h3 className="text-sm font-mono uppercase font-bold text-zinc-300">[ No Matching Reports Found ]</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            You haven't submitted any reports matching this filter. Spot a civic issue in your neighborhood?
          </p>
          <button
            onClick={onNewReportClick}
            className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 border border-white/20 bg-zinc-900 hover:bg-white hover:text-zinc-950 text-white font-mono text-xs uppercase tracking-wider transition"
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
                className={`bg-zinc-950 p-4 sm:p-5 border transition-all cursor-pointer hover:border-white/40 ${
                  selectedCase?.id === item.id ? "border-white bg-zinc-900/80" : "border-white/[0.08]"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-white">
                        {item.complaint_id}
                      </span>
                      <StatusBadge status={item.status} size="sm" />
                      <PriorityBadge priority={item.priority} size="sm" />
                      {hasPoints && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-zinc-200 bg-zinc-900 px-2 py-0.5 border border-white/20">
                          <Award className="w-3 h-3 text-emerald-400" />
                          +{item.civicPointsAwarded} pts Awarded
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-medium text-zinc-100 truncate">
                      {item.title || item.summary || item.raw_text}
                    </h3>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400 font-mono">
                      <CategoryBadge category={item.category} size="sm" />
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-zinc-500" />
                        {item.location?.ward || "Metro Zone"}
                      </span>
                      <span className="text-[10px] text-zinc-500">
                        Submitted: {formatDate(item.created_at)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 justify-between sm:justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-white/[0.08]">
                    <SLAIndicator slaDeadline={item.sla_deadline} status={item.status} />
                    <ChevronRight className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${selectedCase?.id === item.id ? "rotate-90 text-white" : ""}`} />
                  </div>
                </div>

                {/* Expanded Timeline Drawer */}
                {selectedCase?.id === item.id && (
                  <div className="mt-5 pt-5 border-t border-white/[0.08] animate-slide-up space-y-4">
                    <div className="p-3 bg-zinc-900 border border-white/[0.08] text-xs font-mono space-y-1">
                      <span className="meta-label text-[9px] block text-zinc-300">FULL INCIDENT DETAILS:</span>
                      <p className="text-zinc-300">{item.raw_text}</p>
                    </div>

                    {item.pointsBreakdown && (
                      <div className="p-3 bg-zinc-900 border border-white/[0.08] text-xs">
                        <span className="meta-label text-[9px] text-emerald-400 block flex items-center gap-1.5 mb-1">
                          <Award className="w-3.5 h-3.5" /> VALIDATION POINTS BREAKDOWN:
                        </span>
                        <p className="text-zinc-300 font-mono">{item.pointsBreakdown.reason}</p>
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
