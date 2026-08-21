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
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm">
          {/* Table Header */}
          <thead className="bg-slate-950/80 text-slate-400 uppercase text-[11px] font-bold tracking-wider border-b border-slate-800">
            <tr>
              <th className="py-3.5 px-4 font-mono">Complaint ID</th>
              <th className="py-3.5 px-4">AI Categorization & Issue</th>
              <th 
                className="py-3.5 px-4 cursor-pointer hover:text-slate-200 transition"
                onClick={() => toggleSort("priority")}
              >
                <div className="flex items-center gap-1">
                  <span>AI Priority</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th className="py-3.5 px-4">Status</th>
              <th 
                className="py-3.5 px-4 cursor-pointer hover:text-slate-200 transition"
                onClick={() => toggleSort("sla_deadline")}
              >
                <div className="flex items-center gap-1">
                  <span>SLA Urgency</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th className="py-3.5 px-4">Ward / Location</th>
              <th className="py-3.5 px-4 text-center">Reports</th>
              <th className="py-3.5 px-4 text-right">Action</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-800/80">
            {sortedCases.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-slate-500 font-medium">
                  No complaints found matching current department filters.
                </td>
              </tr>
            ) : (
              sortedCases.map((caseItem) => (
                <tr
                  key={caseItem.id}
                  onClick={() => onSelectCase(caseItem)}
                  className="hover:bg-slate-800/50 cursor-pointer transition group"
                >
                  {/* ID */}
                  <td className="py-3.5 px-4 font-mono font-bold text-sky-400 whitespace-nowrap">
                    {caseItem.complaint_id}
                  </td>

                  {/* Summary & Category */}
                  <td className="py-3.5 px-4 max-w-xs sm:max-w-sm">
                    <div className="flex items-center gap-1.5 mb-1">
                      <CategoryBadge category={caseItem.category} size="sm" />
                      {caseItem.sub_category && (
                        <span className="text-[11px] text-slate-400 font-medium truncate max-w-[150px]">
                          • {caseItem.sub_category}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-200 font-medium line-clamp-1 group-hover:text-sky-300 transition">
                      {caseItem.summary || caseItem.raw_text}
                    </p>
                  </td>

                  {/* Priority */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <PriorityBadge priority={caseItem.priority} size="sm" />
                      {caseItem.priority_breakdown?.score && (
                        <span className="text-[11px] font-mono text-slate-400 font-bold">
                          {caseItem.priority_breakdown.score}pts
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <StatusBadge status={caseItem.status} size="sm" />
                  </td>

                  {/* SLA */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <SLAIndicator slaDeadline={caseItem.sla_deadline} status={caseItem.status} />
                  </td>

                  {/* Ward */}
                  <td className="py-3.5 px-4 text-xs text-slate-300 max-w-[160px] truncate">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-sky-400 flex-shrink-0" />
                      <span className="truncate">{caseItem.location?.ward || "Ward 3"}</span>
                    </div>
                  </td>

                  {/* Duplicates count */}
                  <td className="py-3.5 px-4 text-center font-mono font-semibold text-slate-300">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-xs">
                      <Users className="w-3 h-3 text-emerald-400" />
                      {caseItem.citizen_count || 1}
                    </span>
                  </td>

                  {/* Action */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectCase(caseItem);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-sky-600 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold inline-flex items-center gap-1 transition"
                    >
                      <span>Triage</span>
                      <ArrowRight className="w-3.5 h-3.5" />
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
