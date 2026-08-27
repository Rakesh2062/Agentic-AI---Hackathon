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
  Sparkles
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

  // Live simulation ticker
  const [simulationActive, setSimulationActive] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [casesRes, statsRes] = await Promise.all([
        getDepartmentCases(selectedDepartment),
        getDepartmentStats(selectedDepartment),
      ]);
      setCases(casesRes || []);
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
    <div className="space-y-6">
      {/* Top Controls Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-lg">
        <div>
          <div className="flex items-center gap-3">
            <DepartmentSelector
              currentDepartment={selectedDepartment}
              onSelect={(dept) => setSelectedDepartment(dept)}
            />
            <button
              onClick={loadData}
              title="Refresh Queue"
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-sky-400" : ""}`} />
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-1.5 hidden sm:block">
            AI Triage Engine • Prioritized by SLA Urgency & Public Safety Weighting
          </p>
        </div>

        {/* View Switcher & Action Tools */}
        <div className="flex flex-wrap items-center gap-2 self-end md:self-auto">
          {/* CSV Export */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition"
            title="Download CSV report"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          {/* View Mode Switcher */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewMode("kanban")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                viewMode === "kanban"
                  ? "bg-sky-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>

            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                viewMode === "list"
                  ? "bg-sky-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Queue Table</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Metrics */}
      <KPICards stats={stats} loading={loading} />

      {/* Search & Filtering Strip */}
      <div className="glass-panel p-3.5 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter ID, street, keyword..."
            className="w-full bg-slate-950 border border-slate-800 focus:border-sky-500 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 outline-none"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-lg px-2.5 py-1.5 outline-none font-medium"
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
            className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-lg px-2.5 py-1.5 outline-none font-medium"
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
              className="text-xs text-sky-400 hover:text-sky-300 font-semibold px-2 py-1"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Main Work Area: Kanban or List View */}
      {loading ? (
        <div className="py-24 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-sky-500 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-400">
            Fetching department queues and AI priority matrices...
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
