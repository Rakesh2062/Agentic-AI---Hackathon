import React, { useState } from "react";
import { StatusBadge, PriorityBadge, CategoryBadge } from "../common/Badge";
import { SLAIndicator } from "../common/SLAIndicator";
import { Status, Priority } from "../../utils/constants";
import { 
  Users, 
  MapPin, 
  Sparkles, 
  Clock, 
  ChevronRight, 
  AlertTriangle,
  ArrowUpRight,
  GripVertical
} from "lucide-react";

const KANBAN_COLUMNS = [
  {
    id: "intake",
    title: "Intake & Review",
    code: "01",
    targetStatus: Status.UNDER_REVIEW,
    statuses: [Status.SUBMITTED, Status.UNDER_REVIEW],
    dotColor: "bg-indigo-500",
    badgeBg: "bg-indigo-50 text-indigo-700 border-indigo-200"
  },
  {
    id: "assigned",
    title: "Assigned Queue",
    code: "02",
    targetStatus: Status.ASSIGNED,
    statuses: [Status.ASSIGNED],
    dotColor: "bg-violet-500",
    badgeBg: "bg-violet-50 text-violet-700 border-violet-200"
  },
  {
    id: "in_progress",
    title: "In Progress",
    code: "03",
    targetStatus: Status.IN_PROGRESS,
    statuses: [Status.IN_PROGRESS],
    dotColor: "bg-amber-500",
    badgeBg: "bg-amber-50 text-amber-700 border-amber-200"
  },
  {
    id: "inspected",
    title: "Inspected",
    code: "04",
    targetStatus: Status.INSPECTED,
    statuses: [Status.INSPECTED],
    dotColor: "bg-cyan-500",
    badgeBg: "bg-cyan-50 text-cyan-700 border-cyan-200"
  },
  {
    id: "resolved",
    title: "Resolved & Closed",
    code: "05",
    targetStatus: Status.RESOLVED,
    statuses: [Status.RESOLVED, Status.CLOSED],
    dotColor: "bg-emerald-500",
    badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200"
  },
  {
    id: "escalated",
    title: "SLA Escalated",
    code: "06",
    targetStatus: Status.ESCALATED,
    statuses: [Status.ESCALATED],
    dotColor: "bg-rose-500",
    badgeBg: "bg-rose-50 text-rose-700 border-rose-200"
  },
];

export function KanbanBoard({ cases = [], onSelectCase, onQuickStatusChange }) {
  const [draggedCaseId, setDraggedCaseId] = useState(null);
  const [activeDropColumn, setActiveDropColumn] = useState(null);

  const handleDragStart = (e, caseId) => {
    setDraggedCaseId(caseId);
    e.dataTransfer.setData("text/plain", caseId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, colId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (activeDropColumn !== colId) {
      setActiveDropColumn(colId);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, col) => {
    e.preventDefault();
    setActiveDropColumn(null);
    const caseId = e.dataTransfer.getData("text/plain") || draggedCaseId;
    if (caseId && onQuickStatusChange) {
      onQuickStatusChange(caseId, col.targetStatus);
    }
    setDraggedCaseId(null);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5 overflow-x-auto pb-4">
      {KANBAN_COLUMNS.map((col) => {
        const columnCases = cases.filter((c) => col.statuses.includes(c.status));

        // Sort by priority (critical > high > medium > low)
        const priorityOrder = {
          [Priority.CRITICAL]: 4,
          [Priority.HIGH]: 3,
          [Priority.MEDIUM]: 2,
          [Priority.LOW]: 1,
        };

        const sortedCases = [...columnCases].sort((a, b) => {
          return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
        });

        const isOver = activeDropColumn === col.id;

        return (
          <div
            key={col.id}
            onDragOver={(e) => handleDragOver(e, col.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, col)}
            className={`flex flex-col p-3.5 rounded-2xl min-w-[280px] xl:min-w-0 transition-all duration-200 border ${
              isOver
                ? "bg-indigo-50/80 border-indigo-400 shadow-xl scale-[1.01]"
                : "glass-panel border-white/80"
            }`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-200/80">
              <div className="flex items-center gap-1.5 truncate">
                <span className={`w-2 h-2 rounded-full ${col.dotColor}`} />
                <h3 className="text-xs font-bold text-slate-800 truncate uppercase tracking-wider font-display">
                  {col.title}
                </h3>
              </div>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${col.badgeBg}`}>
                {sortedCases.length}
              </span>
            </div>

            {/* Column Cards Container */}
            <div className="space-y-2.5 flex-1 min-h-[320px]">
              {sortedCases.length === 0 ? (
                <div className={`h-36 rounded-xl border border-dashed flex items-center justify-center text-xs font-medium transition ${
                  isOver ? "border-indigo-400 text-indigo-700 bg-indigo-50" : "border-slate-300 text-slate-400"
                }`}>
                  {isOver ? "Drop to transition" : "Empty Queue"}
                </div>
              ) : (
                sortedCases.map((caseItem) => {
                  const isCritical = caseItem.priority === Priority.CRITICAL;
                  const isEscalated = caseItem.status === Status.ESCALATED;

                  return (
                    <div
                      key={caseItem.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, caseItem.id)}
                      onClick={() => onSelectCase(caseItem)}
                      className={`p-3.5 rounded-xl border text-left cursor-grab active:cursor-grabbing transition-all duration-200 group bg-white shadow-sm hover:shadow-md hover:-translate-y-0.5 ${
                        isCritical
                          ? "border-rose-300 bg-rose-50/30 hover:border-rose-400"
                          : isEscalated
                          ? "border-amber-300 bg-amber-50/30 hover:border-amber-400"
                          : "border-slate-200 hover:border-indigo-300"
                      }`}
                    >
                      {/* Card Top: ID + Priority */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1">
                          <GripVertical className="w-3 h-3 text-slate-400 group-hover:text-indigo-600 -ml-1 cursor-grab" />
                          <span className="font-mono text-xs font-bold text-slate-900">
                            {caseItem.complaint_id}
                          </span>
                        </div>
                        <PriorityBadge priority={caseItem.priority} size="sm" />
                      </div>

                      {/* Summary / Text */}
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-2.5 font-medium">
                        {caseItem.summary || caseItem.raw_text}
                      </p>

                      {/* Category & Ward */}
                      <div className="flex items-center gap-1.5 mb-2.5 flex-wrap">
                        <CategoryBadge category={caseItem.category} size="sm" />
                        {caseItem.location?.ward && (
                          <span className="text-[9px] font-mono text-slate-500 px-2 py-0.5 rounded-md border border-slate-200 bg-slate-50 truncate max-w-[120px]">
                            {caseItem.location.ward.split(" - ")[0]}
                          </span>
                        )}
                      </div>

                      {/* Footer: SLA & Citizens */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                        <SLAIndicator slaDeadline={caseItem.sla_deadline} status={caseItem.status} />

                        <div className="flex items-center gap-1 text-slate-500 font-mono group-hover:text-indigo-600 transition">
                          <Users className="w-3 h-3 text-slate-400" />
                          <span>{caseItem.citizen_count || 1}</span>
                          <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition -ml-0.5" />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
