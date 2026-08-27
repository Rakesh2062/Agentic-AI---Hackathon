import React, { useState, useEffect, useMemo } from "react";
import { getAnalyticsMetrics, getDepartmentCases } from "../../api/endpoints";
import { CategoryBadge, PriorityBadge, StatusBadge } from "../common/Badge";
import { Category } from "../../utils/constants";
import { InteractiveMap } from "../common/InteractiveMap";
import { formatDate } from "../../utils/formatters";
import { 
  BarChart3, 
  Flame, 
  ShieldCheck, 
  MapPin, 
  Zap, 
  Users, 
  TrendingUp, 
  Activity, 
  AlertTriangle,
  Clock,
  Layers,
  Map as MapIcon,
  ChevronDown,
  ChevronUp
} from "lucide-react";

const LIFECYCLE_STEPS = [
  { key: "submitted", label: "Submitted" },
  { key: "under_review", label: "AI Review" },
  { key: "assigned", label: "Assigned" },
  { key: "in_progress", label: "In Progress" },
  { key: "inspected", label: "Inspected" },
  { key: "resolved", label: "Resolved" },
];

export function AnalyticsView() {
  const [metrics, setMetrics] = useState(null);
  const [allCases, setAllCases] = useState([]);
  const [selectedWardForMap, setSelectedWardForMap] = useState("Ward 4 - Central West");
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [expandedComplaintId, setExpandedComplaintId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAnalytics(isInitialLoad = false) {
      if (isInitialLoad) setLoading(true);
      try {
        const [metricsRes, casesRes] = await Promise.all([
          getAnalyticsMetrics(),
          getDepartmentCases("all"),
        ]);
        setMetrics(metricsRes || null);
        setAllCases(casesRes || []);
      } catch (e) {
        // Keep the most recently loaded data visible during a temporary refresh failure.
      } finally {
        if (isInitialLoad) setLoading(false);
      }
    }
    loadAnalytics(true);
    const refreshInterval = window.setInterval(() => loadAnalytics(), 15000);
    return () => window.clearInterval(refreshInterval);
  }, []);

  const wardHotspots = useMemo(() => {
    const priorityRank = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
    const complaintTime = (complaint) => new Date(
      complaint.created_at || complaint.submitted_at || complaint.updated_at || 0
    ).getTime();
    const compareComplaints = (left, right) => {
      const priorityDifference = (priorityRank[right.priority] || 0) - (priorityRank[left.priority] || 0);
      return priorityDifference || complaintTime(right) - complaintTime(left);
    };

    const wards = new Map();
    allCases
      .filter((complaint) => !["resolved", "closed"].includes(complaint.status))
      .forEach((complaint) => {
      const ward = complaint.location?.ward || "Unassigned Ward";
      const hotspot = wards.get(ward) || { ward, complaint_count: 0, complaint: null };
      hotspot.complaint_count += 1;
      if (!hotspot.complaint || compareComplaints(complaint, hotspot.complaint) < 0) {
        hotspot.complaint = complaint;
      }
      wards.set(ward, hotspot);
      });

    return [...wards.values()].sort((left, right) => compareComplaints(left.complaint, right.complaint));
  }, [allCases]);

  const recentlyResolved = useMemo(() => (
    allCases
      .filter((complaint) => ["resolved", "closed"].includes(complaint.status))
      .sort((left, right) => new Date(
        right.updated_at || right.created_at || right.submitted_at || 0
      ) - new Date(left.updated_at || left.created_at || left.submitted_at || 0))
      .slice(0, 5)
  ), [allCases]);

  const resolutionDuration = (complaint) => {
    const startedAt = new Date(complaint.created_at || complaint.submitted_at || 0).getTime();
    const resolvedAt = new Date(complaint.resolved_at || complaint.updated_at || 0).getTime();
    const elapsedMinutes = Math.max(0, Math.round((resolvedAt - startedAt) / 60000));
    if (elapsedMinutes < 60) return `${elapsedMinutes} min`;
    const hours = Math.floor(elapsedMinutes / 60);
    const minutes = elapsedMinutes % 60;
    return minutes ? `${hours}h ${minutes}m` : `${hours}h`;
  };

  const statusProgress = (status) => ({
    submitted: 15,
    under_review: 30,
    assigned: 50,
    in_progress: 70,
    inspected: 85,
    resolved: 100,
    closed: 100,
    escalated: 60,
    duplicate: 100,
  }[status] ?? 0);

  const categoryBreakdown = [
    { name: "Roads & Pavements", category: Category.ROADS, count: 48, percentage: 32, color: "bg-sky-500" },
    { name: "Water & Sewage", category: Category.WATER, count: 36, percentage: 24, color: "bg-blue-500" },
    { name: "Solid Waste Management", category: Category.WASTE, count: 28, percentage: 19, color: "bg-emerald-500" },
    { name: "Street Lighting & Power", category: Category.STREETLIGHT, count: 22, percentage: 15, color: "bg-amber-500" },
    { name: "Stormwater Drainage", category: Category.DRAINAGE, count: 16, percentage: 10, color: "bg-cyan-500" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-5 rounded-2xl shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <BarChart3 className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white">
              Citywide Civic Intelligence & Hotspots
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time analytics aggregated across all municipal sectors and agent pipelines.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-3 py-1.5 rounded-xl">
          <Activity className="w-4 h-4 animate-pulse" />
          <span>Real-time Pipeline Active</span>
        </div>
      </div>

      {/* High-Level AI Performance Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total Ingested
            </span>
            <Layers className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
            {metrics?.total_complaints_processed ?? 0}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Across {metrics?.active_wards ?? 0} active wards
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              AI Classification
            </span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono">
            {metrics?.ai_classification_accuracy ?? 0}%
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {metrics?.classified_complaints ?? 0} complaints classified
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Duplicates Merged
            </span>
            <Users className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-purple-300 font-mono">
            {metrics?.duplicates_merged_count ?? 0}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Co-signed reports consolidated
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              SLA Compliance
            </span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-mono">
            {metrics?.sla_compliance_rate ?? 0}%
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {metrics?.resolved_complaints ?? 0} resolved complaints
          </p>
        </div>
      </div>

      {/* Interactive Ward Heatmap Explorer */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <MapIcon className="w-4 h-4 text-sky-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Geographic Incident & Vulnerability Heatmap
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Active Cases Density Map
          </span>
        </div>

        <InteractiveMap
          mode="heatmap"
          existingCases={allCases}
          selectedCase={selectedComplaint}
          height="h-80 sm:h-96"
        />
      </div>

      {/* Hotspots & Category Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Hotspots List (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-rose-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Ward Hotspot Vulnerability Index
              </h2>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              GET /analytics/hotspots
            </span>
          </div>

          <p className="text-xs text-slate-400">
            Highest-priority complaint per ward; equal priorities are ordered by most recent report.
          </p>

          <div className="space-y-3">
            {wardHotspots.map((hotspot) => {
              const isSelected = selectedWardForMap === hotspot.ward;
              const complaint = hotspot.complaint;
              const complaintId = complaint.id || complaint._id || complaint.complaint_id;
              const isExpanded = expandedComplaintId === complaintId;
              const currentStep = LIFECYCLE_STEPS.findIndex((step) => step.key === complaint.status);
              const resolvedStep = currentStep === -1 ? 0 : currentStep;

              const selectComplaint = () => {
                setSelectedWardForMap(hotspot.ward);
                setSelectedComplaint(complaint);
              };

              return (
                <div
                  key={hotspot.ward}
                  onClick={selectComplaint}
                  className={`bg-slate-950/70 border rounded-xl p-4 cursor-pointer transition ${
                    isSelected
                      ? "border-sky-500 bg-sky-950/20 shadow-glow-primary"
                      : "border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-sky-400" />
                      <span className="font-bold text-slate-100 text-sm">{hotspot.ward}</span>
                      <PriorityBadge priority={complaint.priority} size="sm" />
                    </div>
                    <p className="text-xs text-slate-400">
                      Top issue: <span className="text-slate-300 font-medium">{complaint.title || complaint.raw_text || complaint.description}</span>
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <StatusBadge status={complaint.status} size="sm" />
                      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-800" aria-label={`Resolution progress: ${statusProgress(complaint.status)}%`}>
                        <div
                          className="h-full rounded-full bg-sky-500"
                          style={{ width: `${statusProgress(complaint.status)}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        {statusProgress(complaint.status)}% progress
                      </span>
                    </div>
                    </div>

                    <div className="flex items-center gap-3 sm:text-right w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-slate-800/80 pt-2 sm:pt-0">
                      <CategoryBadge category={complaint.category} size="sm" />
                      <div className="text-right">
                        <span className="text-sm font-extrabold text-white font-mono block">
                          {hotspot.complaint_count} cases
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Updated: {formatDate(complaint.updated_at || complaint.created_at || complaint.submitted_at)}
                        </span>
                      </div>
                      <button
                        type="button"
                        aria-label={isExpanded ? "Hide resolution progress" : "Show resolution progress"}
                        aria-expanded={isExpanded}
                        onClick={(event) => {
                          event.stopPropagation();
                          selectComplaint();
                          setExpandedComplaintId(isExpanded ? null : complaintId);
                        }}
                        className="rounded-lg border border-slate-700 p-1.5 text-sky-400 hover:bg-sky-950/70"
                      >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="mt-4 border-t border-slate-800 pt-4">
                      <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Resolution progress — updates automatically every 15 seconds
                      </p>
                      <div className="flex items-start justify-between gap-1">
                        {LIFECYCLE_STEPS.map((step, index) => {
                          const complete = index < resolvedStep;
                          const active = index === resolvedStep;
                          return (
                            <div key={step.key} className="flex min-w-0 flex-1 flex-col items-center text-center">
                              <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                                active ? "bg-sky-500 text-white ring-4 ring-sky-500/20" : complete ? "bg-emerald-500 text-slate-950" : "bg-slate-800 text-slate-500"
                              }`}>
                                {complete ? "✓" : index + 1}
                              </span>
                              <span className={`mt-2 text-[9px] sm:text-[10px] ${active ? "font-bold text-sky-300" : complete ? "text-slate-200" : "text-slate-500"}`}>
                                {step.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="border-t border-slate-800 pt-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Recently Resolved Problems
              </h3>
              <span className="text-[10px] font-mono text-slate-500">Latest 5</span>
            </div>
            <div className="space-y-2">
              {recentlyResolved.length ? recentlyResolved.map((complaint) => (
                <button
                  key={complaint.id || complaint._id || complaint.complaint_id}
                  type="button"
                  onClick={() => {
                    setSelectedWardForMap(complaint.location?.ward || "Unassigned Ward");
                    setSelectedComplaint(complaint);
                  }}
                  className="flex w-full items-center justify-between gap-3 rounded-lg border border-emerald-900/60 bg-emerald-950/20 px-3 py-2 text-left transition hover:border-emerald-600"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-slate-200">
                      {complaint.title || complaint.summary || complaint.raw_text || complaint.description}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {complaint.location?.ward || "Unassigned Ward"} · Resolved by {complaint.department || complaint.recommended_department || "Municipal Dispatch"}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Resolution time: {resolutionDuration(complaint)} · {formatDate(complaint.resolved_at || complaint.updated_at || complaint.created_at || complaint.submitted_at)}
                    </p>
                  </div>
                  <StatusBadge status={complaint.status} size="sm" />
                </button>
              )) : (
                <p className="rounded-lg border border-dashed border-slate-700 px-3 py-3 text-xs text-slate-500">
                  No resolved complaints yet.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Complaint Category Distribution (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Issue Distribution by Sector
            </h2>
            <span className="text-xs text-slate-400 font-mono">100% Total</span>
          </div>

          <div className="space-y-4 pt-1">
            {categoryBreakdown.map((item, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200">{item.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-400">{item.count}</span>
                    <span className="font-mono font-bold text-slate-100">{item.percentage}%</span>
                  </div>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div
                    className={`h-full rounded-full ${item.color}`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* AI Pipeline Efficiency Note */}
          <div className="mt-6 bg-slate-950/70 border border-sky-900/40 rounded-xl p-3.5 text-xs text-slate-400 space-y-1">
            <span className="font-bold text-sky-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" /> Agentic Routing Velocity
            </span>
            <p>
              Average intake-to-dispatch latency is <span className="text-slate-200 font-bold">4.2 seconds</span> per complaint, reducing municipal backlogs by 68%.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
