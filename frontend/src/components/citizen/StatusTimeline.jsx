import React from "react";
import { StatusBadge } from "../common/Badge";
import { formatDate, formatTimeAgo } from "../../utils/formatters";
import { 
  CheckCircle, 
  Clock, 
  User, 
  Bot, 
  ShieldCheck, 
  AlertCircle, 
  ArrowDown,
  Sparkles
} from "lucide-react";

const LIFECYCLE_STEPS = [
  { key: "submitted", label: "Submitted" },
  { key: "under_review", label: "AI Review" },
  { key: "assigned", label: "Assigned" },
  { key: "in_progress", label: "In Progress" },
  { key: "inspected", label: "Inspected" },
  { key: "resolved", label: "Resolved" },
];

export function StatusTimeline({ history = [], currentStatus = "submitted" }) {
  // Determine step index in lifecycle
  const currentStepIndex = LIFECYCLE_STEPS.findIndex((s) => s.key === currentStatus);
  const isEscalated = currentStatus === "escalated";

  return (
    <div className="space-y-6">
      {/* Visual Stepper */}
      <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 sm:p-5">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
          Lifecycle Progression
        </h4>

        {isEscalated ? (
          <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-lg flex items-center gap-3 text-rose-300">
            <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 animate-pulse" />
            <div>
              <p className="text-xs font-bold">Escalated Status Active</p>
              <p className="text-[11px] text-rose-300/80">
                This case has triggered an SLA exception and is being expedited by senior supervisors.
              </p>
            </div>
          </div>
        ) : (
          <div className="relative flex items-center justify-between">
            {/* Background Line */}
            <div className="absolute top-1/2 left-4 right-4 -translate-y-1/2 h-0.5 bg-slate-800 -z-0"></div>

            {LIFECYCLE_STEPS.map((step, idx) => {
              const isPast = idx <= currentStepIndex;
              const isCurrent = idx === currentStepIndex;

              return (
                <div key={step.key} className="relative z-10 flex flex-col items-center group">
                  <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-md ${
                      isCurrent
                        ? "bg-sky-500 text-white ring-4 ring-sky-500/20 scale-110 shadow-glow-primary"
                        : isPast
                        ? "bg-emerald-500 text-slate-950 font-extrabold"
                        : "bg-slate-800 text-slate-500 border border-slate-700"
                    }`}
                  >
                    {isPast && !isCurrent ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <span>{idx + 1}</span>
                    )}
                  </div>
                  <span
                    className={`text-[10px] sm:text-xs mt-2 font-medium hidden sm:block ${
                      isCurrent
                        ? "text-sky-300 font-bold"
                        : isPast
                        ? "text-slate-200"
                        : "text-slate-500"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detailed Chronological History Log */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-sky-400" /> Audit Log & Agent Updates ({history.length})
        </h4>

        <div className="space-y-3 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-800/80">
          {history.map((item, index) => {
            const isAgent = (item.updated_by || "").toLowerCase().includes("agent") || (item.updated_by || "").toLowerCase().includes("ai");

            return (
              <div key={index} className="relative flex items-start gap-4 pl-1">
                {/* Node Icon */}
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center z-10 text-xs flex-shrink-0 mt-1 shadow ${
                    isAgent
                      ? "bg-sky-950 border border-sky-600 text-sky-300"
                      : "bg-slate-800 border border-slate-600 text-slate-200"
                  }`}
                >
                  {isAgent ? <Sparkles className="w-3 h-3 text-sky-400" /> : <User className="w-3 h-3 text-slate-300" />}
                </div>

                {/* Card */}
                <div className="flex-1 bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 text-xs shadow-sm hover:border-slate-700/80 transition">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={item.status} size="sm" />
                      <span className="font-semibold text-slate-200">
                        {item.updated_by || "System"}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono" title={formatDate(item.timestamp)}>
                      {formatTimeAgo(item.timestamp)}
                    </span>
                  </div>

                  <p className="text-slate-300 leading-relaxed text-xs sm:text-[13px]">
                    {item.message}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
