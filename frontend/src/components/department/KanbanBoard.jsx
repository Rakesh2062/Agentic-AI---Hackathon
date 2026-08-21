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
    title: "Intake & AI Review",
    targetStatus: Status.UNDER_REVIEW,
    statuses: [Status.SUBMITTED, Status.UNDER_REVIEW],
    dotColor: "bg-sky-400",
    headerBg: "border-sky-500/20 bg-sky-950/20",
  },
  {
    id: "assigned",
    title: "Assigned / Dispatch",
    targetStatus: Status.ASSIGNED,
    statuses: [Status.ASSIGNED],
    dotColor: "bg-purple-400",
    headerBg: "border-purple-500/20 bg-purple-950/20",
  },
  {
    id: "in_progress",
    title: "In Progress",
    targetStatus: Status.IN_PROGRESS,
    statuses: [Status.IN_PROGRESS],
    dotColor: "bg-amber-400",
    headerBg: "border-amber-500/20 bg-amber-950/20",
  },
  {
    id: "inspected",
    title: "Field Inspected",
    targetStatus: Status.INSPECTED,
    statuses: [Status.INSPECTED],
    dotColor: "bg-cyan-400",
    headerBg: "border-cyan-500/20 bg-cyan-950/20",
  },
  {
    id: "resolved",
    title: "Resolved & Closed",
    targetStatus: Status.RESOLVED,
    statuses: [Status.RESOLVED, Status.CLOSED],
    dotColor: "bg-emerald-400",
    headerBg: "border-emerald-500/20 bg-emerald-950/20",
  },
  {
    id: "escalated",
    title: "SLA Escalated",
    targetStatus: Status.ESCALATED,
    statuses: [Status.ESCALATED],
    dotColor: "bg-rose-500",
    headerBg: "border-rose-500/30 bg-rose-950/30",
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 overflow-x-auto pb-4">
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
            className={`flex flex-col rounded-2xl p-3 min-w-[280px] xl:min-w-0 transition-all border ${
              isOver
                ? "bg-slate-800/90 border-sky-500 shadow-glow-primary scale-[1.01]"
                : "bg-slate-900/60 border-slate-800"
            }`}
          >
            {/* Column Header */}
            <div className={`flex items-center justify-between p-2.5 rounded-xl border mb-3 ${col.headerBg}`}>
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${col.dotColor}`} />
                <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">
                  {col.title}
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-slate-300 px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700">
                {sortedCases.length}
              </span>
            </div>

            {/* Column Cards Container */}
            <div className="space-y-3 flex-1 min-h-[320px]">
              {sortedCases.length === 0 ? (
                <div className={`h-36 border border-dashed rounded-xl flex items-center justify-center text-xs font-medium transition ${
                  isOver ? "border-sky-500 text-sky-400 bg-sky-950/20" : "border-slate-800 text-slate-600"
                }`}>
                  {isOver ? "Drop to transition here" : "No cases in stage"}
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
                      className={`glass-card p-3.5 rounded-xl border text-left cursor-grab active:cursor-grabbing transition-all hover:translate-y-[-2px] group relative ${
                        isCritical
                          ? "border-red-800/80 bg-red-950/20 hover:border-red-500 shadow-sm"
                          : isEscalated
                          ? "border-rose-700 bg-rose-950/30 hover:border-rose-500"
                          : "border-slate-800 hover:border-sky-500/60"
                      }`}
                    >
                      {/* Card Top: ID + Priority */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5">
                          <GripVertical className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 -ml-1 cursor-grab" />
                          <span className="font-mono text-xs font-bold text-sky-400">
                            {caseItem.complaint_id}
                          </span>
                        </div>
                        <PriorityBadge priority={caseItem.priority} size="sm" />
                      </div>

                      {/* Summary / Text */}
                      <p className="text-xs font-medium text-slate-200 line-clamp-2 leading-relaxed mb-2.5">
                        {caseItem.summary || caseItem.raw_text}
                      </p>

                      {/* Category & Ward */}
                      <div className="flex items-center gap-1.5 mb-2.5 flex-wrap">
                        <CategoryBadge category={caseItem.category} size="sm" />
                        {caseItem.location?.ward && (
                          <span className="text-[10px] text-slate-400 font-medium px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 truncate max-w-[120px]">
                            {caseItem.location.ward.split(" - ")[0]}
                          </span>
                        )}
                      </div>

                      {/* Footer: SLA & Citizens */}
                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                        <SLAIndicator slaDeadline={caseItem.sla_deadline} status={caseItem.status} />

                        <div className="flex items-center gap-1 text-slate-400 group-hover:text-sky-300 transition">
                          <Users className="w-3 h-3 text-emerald-400" />
                          <span className="font-mono">{caseItem.citizen_count || 1}</span>
                          <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition -ml-0.5" />
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
