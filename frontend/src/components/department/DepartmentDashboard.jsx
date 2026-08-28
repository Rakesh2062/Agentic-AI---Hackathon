import React, { useState, useEffect } from "react";
import { DepartmentSelector } from "./DepartmentSelector";
import { KPICards } from "./KPICards";
import { KanbanBoard } from "./KanbanBoard";
import { CaseListView } from "./CaseListView";
import { CaseDetailModal } from "./CaseDetailModal";
import { getDepartmentCases, getDepartmentStats, updateCaseStatus } from "../../api/endpoints";
import { useApp } from "../../context/AppContext";
import { Priority, Status } from "../../utils/constants";
import { 
  LayoutGrid, 
  List, 
  Search, 
  Filter, 
  RefreshCw, 
  SlidersHorizontal,
  ShieldAlert,
  Loader2,
  Download,
  Radio,
  Sparkles,
  Building2
} from "lucide-react";

export function DepartmentDashboard() {
  const { selectedDepartment, setSelectedDepartment, showToast } = useApp();

  const [viewMode, setViewMode] = useState("kanban"); // 'kanban' | 'list'
  const [cases, setCases] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Selected Case Modal
  const [selectedCase, setSelectedCase] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [casesRes, statsRes] = await Promise.all([
        getDepartmentCases(selectedDepartment),
        getDepartmentStats(selectedDepartment),
      ]);
      // Normalize: ensure each case has `id` set from MongoDB's `_id`
      const normalized = (casesRes || []).map((c) => ({
        ...c,
        id: c._id || c.id,
      }));
      setCases(normalized);
      setStats(statsRes || null);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      showToast(err.message || "Error loading department data", "error");
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDepartment]);

  // Drag-and-drop quick status transition handler
  const handleQuickStatusChange = async (caseId, nextStatus) => {
    try {
      const payload = {
        status: nextStatus,
        message: `Quick drag-and-drop dispatch update: Status set to ${nextStatus.replace("_", " ")}`,
        updated_by: "Department Dispatcher",
      };
      const updated = await updateCaseStatus(caseId, payload);
      setCases((prev) => prev.map((c) => (c.id === caseId ? updated : c)));
      showToast(`Case status transitioned to ${nextStatus.toUpperCase()}`, "success");
      // refresh stats
      getDepartmentStats(selectedDepartment).then((res) => {
        if (res) setStats(res);
      });
    } catch (err) {
      showToast(err.message || "Failed to transition status", "error");
    }
  };

  const handleOpenCase = (caseItem) => {
    setSelectedCase(caseItem);
    setIsModalOpen(true);
  };

  const handleCaseUpdated = (updatedCase) => {
    setCases((prev) =>
      prev.map((c) => (c.id === updatedCase.id ? updatedCase : c))
    );
    getDepartmentStats(selectedDepartment).then((res) => {
      if (res) setStats(res);
    });
  };

  // CSV Export
  const handleExportCSV = () => {
    if (cases.length === 0) return;
    const headers = ["Complaint_ID", "Category", "Priority", "Status", "Ward", "Citizens", "Created_At"];
    const rows = cases.map((c) => [
      c.complaint_id,
      c.category,
      c.priority,
      c.status,
      c.location?.ward || "N/A",
      c.citizen_count || 1,
      c.created_at,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `CivicPulse_${selectedDepartment.replace(/\s+/g, "_")}_Cases.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Case export downloaded as CSV", "success");
  };

  // Filtered cases
  const filteredCases = cases.filter((c) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      c.complaint_id.toLowerCase().includes(q) ||
      (c.raw_text || "").toLowerCase().includes(q) ||
      (c.summary || "").toLowerCase().includes(q) ||
      (c.location?.address || "").toLowerCase().includes(q) ||
      (c.location?.ward || "").toLowerCase().includes(q);

    const matchesPriority = priorityFilter === "all" || c.priority === priorityFilter;
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;

    return matchesSearch && matchesPriority && matchesStatus;
  });

  return (
    <div className="space-y-6 pb-6 animate-fade-in max-w-7xl mx-auto">
      
      {/* Top Controls Bar with Clean Command Aesthetics */}
      <div className="glass-panel p-5 sm:p-6 rounded-3xl border border-white/80 shadow-float flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-gradient-to-r from-white/90 via-slate-50/60 to-blue-50/40">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white flex items-center justify-center shadow-md">
              <Building2 className="w-5 h-5" />
            </div>
            <DepartmentSelector
              currentDepartment={selectedDepartment}
              onSelect={(dept) => setSelectedDepartment(dept)}
            />
            <button
              onClick={loadData}
              title="Refresh Queue"
              className="p-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 transition shadow-sm cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-indigo-600" : ""}`} />
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-2 font-medium">
            AI Triage Engine • Municipal Command &amp; Real-Time Field Dispatch
          </p>
        </div>

        {/* View Switcher & Action Tools */}
        <div className="flex flex-wrap items-center gap-2 self-end md:self-auto">
          {/* CSV Export */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs rounded-xl shadow-sm transition cursor-pointer"
            title="Download CSV report"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          {/* View Mode Switcher */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode("kanban")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition duration-200 cursor-pointer ${
                viewMode === "kanban"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>

            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition duration-200 cursor-pointer ${
                viewMode === "list"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Metrics Strip */}
      <KPICards stats={stats} loading={loading} />

      {/* Search & Filtering Strip */}
      <div className="glass-panel p-3.5 rounded-2xl border border-white/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search complaint ID, street, keyword..."
            className="w-full bg-white border border-slate-200 focus:border-indigo-500 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 outline-none transition shadow-sm"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-1.5 outline-none shadow-sm"
          >
            <option value="all">All Priorities</option>
            <option value={Priority.CRITICAL}>Critical Only</option>
            <option value={Priority.HIGH}>High Priority</option>
            <option value={Priority.MEDIUM}>Medium Priority</option>
            <option value={Priority.LOW}>Low Priority</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-1.5 outline-none shadow-sm"
          >
            <option value="all">All Statuses</option>
            <option value={Status.SUBMITTED}>Submitted</option>
            <option value={Status.ASSIGNED}>Assigned</option>
            <option value={Status.IN_PROGRESS}>In Progress</option>
            <option value={Status.RESOLVED}>Resolved</option>
            <option value={Status.ESCALATED}>Escalated</option>
          </select>

          {(searchQuery || priorityFilter !== "all" || statusFilter !== "all") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setPriorityFilter("all");
                setStatusFilter("all");
              }}
              className="text-xs font-bold text-indigo-600 hover:underline px-2 py-1"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Main Work Area: Kanban or List View */}
      {loading ? (
        <div className="py-24 text-center glass-panel rounded-3xl shadow-sm">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-3" />
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">
            Fetching Department Telemetry &amp; AI Matrices...
          </p>
        </div>
      ) : viewMode === "kanban" ? (
        <KanbanBoard
          cases={filteredCases}
          onSelectCase={handleOpenCase}
          onQuickStatusChange={handleQuickStatusChange}
        />
      ) : (
        <CaseListView cases={filteredCases} onSelectCase={handleOpenCase} />
      )}

      {/* Case Detail & Status Transition Modal */}
      <CaseDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        caseItem={selectedCase}
        onCaseUpdated={handleCaseUpdated}
      />
    </div>
  );
}
