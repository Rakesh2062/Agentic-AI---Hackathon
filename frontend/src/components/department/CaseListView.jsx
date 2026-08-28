import React, { useState } from "react";
import { StatusBadge, PriorityBadge, CategoryBadge } from "../common/Badge";
import { SLAIndicator } from "../common/SLAIndicator";
import { formatDate, formatTimeAgo } from "../../utils/formatters";
import { 
  Users, 
  MapPin, 
  ChevronRight, 
  ArrowUpDown, 
  Sparkles,
  ArrowRight
} from "lucide-react";

export function CaseListView({ cases = [], onSelectCase }) {
  const [sortField, setSortField] = useState("priority");
  const [sortAsc, setSortAsc] = useState(false);

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const priorityScoreMap = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
  };

  const sortedCases = [...cases].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];

    if (sortField === "priority") {
      valA = a.priority_breakdown?.score ?? priorityScoreMap[a.priority] ?? 0;
      valB = b.priority_breakdown?.score ?? priorityScoreMap[b.priority] ?? 0;
    } else if (sortField === "created_at" || sortField === "sla_deadline") {
      valA = new Date(valA || 0).getTime();
      valB = new Date(valB || 0).getTime();
    }

    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  return (
    <div className="glass-panel rounded-3xl border border-white/80 shadow-float overflow-hidden bg-white/80 backdrop-blur-2xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          {/* Table Header */}
          <thead className="bg-slate-50/80 text-slate-500 font-mono text-[10px] uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th className="py-3.5 px-4 font-bold">Complaint ID</th>
              <th className="py-3.5 px-4 font-bold">AI Categorization &amp; Issue</th>
              <th 
                className="py-3.5 px-4 font-bold cursor-pointer hover:text-indigo-600 transition"
                onClick={() => toggleSort("priority")}
              >
                <div className="flex items-center gap-1">
                  <span>Priority</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3.5 px-4 font-bold">Status</th>
              <th 
                className="py-3.5 px-4 font-bold cursor-pointer hover:text-indigo-600 transition"
                onClick={() => toggleSort("sla_deadline")}
              >
                <div className="flex items-center gap-1">
                  <span>SLA</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3.5 px-4 font-bold">Ward</th>
              <th className="py-3.5 px-4 font-bold text-center">Reports</th>
              <th className="py-3.5 px-4 font-bold text-right">Action</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-100">
            {sortedCases.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-16 text-slate-400 font-mono text-xs">
                  No matching complaints in queue
                </td>
              </tr>
            ) : (
              sortedCases.map((caseItem) => (
                <tr
                  key={caseItem.id}
                  onClick={() => onSelectCase(caseItem)}
                  className="hover:bg-indigo-50/40 cursor-pointer transition-colors group"
                >
                  {/* ID */}
                  <td className="py-4 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                    {caseItem.complaint_id}
                  </td>

                  {/* Summary & Category */}
                  <td className="py-4 px-4 max-w-xs sm:max-w-sm">
                    <div className="flex items-center gap-1.5 mb-1">
                      <CategoryBadge category={caseItem.category} size="sm" />
                      {caseItem.sub_category && (
                        <span className="text-[10px] text-slate-500 font-mono truncate max-w-[150px]">
                          • {caseItem.sub_category}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-slate-700 line-clamp-1 group-hover:text-indigo-600 transition">
                      {caseItem.summary || caseItem.raw_text}
                    </p>
                  </td>

                  {/* Priority */}
                  <td className="py-4 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <PriorityBadge priority={caseItem.priority} size="sm" />
                      {caseItem.priority_breakdown?.score && (
                        <span className="text-[10px] font-mono text-slate-400">
                          [{caseItem.priority_breakdown.score}pts]
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-4 px-4 whitespace-nowrap">
                    <StatusBadge status={caseItem.status} size="sm" />
                  </td>

                  {/* SLA */}
                  <td className="py-4 px-4 whitespace-nowrap">
                    <SLAIndicator slaDeadline={caseItem.sla_deadline} status={caseItem.status} />
                  </td>

                  {/* Ward */}
                  <td className="py-4 px-4 text-xs text-slate-600 max-w-[160px] truncate">
                    <div className="flex items-center gap-1 font-mono text-[11px]">
                      <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{caseItem.location?.ward || "Ward 3"}</span>
                    </div>
                  </td>

                  {/* Duplicates count */}
                  <td className="py-4 px-4 text-center font-mono text-slate-600">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 text-xs font-bold">
                      <Users className="w-3 h-3 text-slate-400" />
                      {caseItem.citizen_count || 1}
                    </span>
                  </td>

                  {/* Action */}
                  <td className="py-4 px-4 text-right whitespace-nowrap">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectCase(caseItem);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-indigo-600 hover:text-white border border-slate-200 text-slate-700 font-bold text-xs shadow-sm inline-flex items-center gap-1 transition"
                    >
                      <span>Triage</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
