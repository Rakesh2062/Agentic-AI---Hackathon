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
  const currentStepIndex = LIFECYCLE_STEPS.findIndex((s) => s.key === currentStatus);
  const isEscalated = currentStatus === "escalated";

  return (
    <div className="space-y-6">
      {/* Visual Stepper */}
      <div className="bg-zinc-900/40 p-4 sm:p-5 border border-white/[0.08]">
        <h4 className="meta-label mb-4">
          [ 01 ] RESOLUTION PROGRESSION
        </h4>

        {isEscalated ? (
          <div className="p-3 bg-rose-950 border border-rose-800 flex items-center gap-3 text-rose-300">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 animate-pulse" />
            <div>
              <p className="text-xs font-mono font-bold uppercase">SLA Escalation Triggered</p>
              <p className="text-[10px] text-rose-300/80 font-mono mt-0.5">
                This incident has breached target turnaround and is being expedited by senior supervisors.
              </p>
            </div>
          </div>
        ) : (
          <div className="relative flex items-center justify-between">
            {/* Hairline Background Rule */}
            <div className="absolute top-1/2 left-4 right-4 -translate-y-1/2 h-px bg-white/10 -z-0"></div>

            {LIFECYCLE_STEPS.map((step, idx) => {
              const isPast = idx <= currentStepIndex;
              const isCurrent = idx === currentStepIndex;

              return (
                <div key={step.key} className="relative z-10 flex flex-col items-center group">
                  <div
                    className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[10px] font-mono transition-all ${
                      isCurrent
                        ? "bg-white text-zinc-950 ring-4 ring-white/10 scale-110 font-bold"
                        : isPast
                        ? "bg-zinc-200 text-zinc-950 font-bold"
                        : "bg-zinc-900 text-zinc-500 border border-white/10"
                    }`}
                  >
                    {isPast && !isCurrent ? (
                      <CheckCircle className="w-3.5 h-3.5" />
                    ) : (
                      <span>{idx + 1}</span>
                    )}
                  </div>
                  <span
                    className={`text-[9px] font-mono uppercase tracking-wider mt-2 hidden sm:block ${
                      isCurrent
                        ? "text-white font-bold"
                        : isPast
                        ? "text-zinc-300"
                        : "text-zinc-600"
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
        <h4 className="meta-label mb-3 flex items-center gap-1.5">
          <Clock className="w-3 h-3 text-zinc-400" /> [ 02 ] AUDIT TRAIL &amp; AGENT UPDATES ({history.length})
        </h4>

        <div className="space-y-3 relative before:absolute before:inset-0 before:left-3 before:w-px before:bg-white/10">
          {history.map((item, index) => {
            const isAgent = (item.updated_by || "").toLowerCase().includes("agent") || (item.updated_by || "").toLowerCase().includes("ai");

            return (
              <div key={index} className="relative flex items-start gap-4 pl-1">
                {/* Node Icon */}
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center z-10 text-xs flex-shrink-0 mt-1 border ${
                    isAgent
                      ? "bg-zinc-950 border-white/30 text-white"
                      : "bg-zinc-900 border-white/10 text-zinc-400"
                  }`}
                >
                  {isAgent ? <Sparkles className="w-2.5 h-2.5 text-white" /> : <User className="w-2.5 h-2.5 text-zinc-400" />}
                </div>

                {/* Card */}
                <div className="flex-1 bg-zinc-950 border border-white/[0.08] p-3 text-xs font-mono">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={item.status} size="sm" />
                      <span className="font-semibold text-zinc-200 text-[11px]">
                        {item.updated_by || "System"}
                      </span>
                    </div>
                    <span className="text-[10px] text-zinc-500 font-mono" title={formatDate(item.timestamp)}>
                      {formatTimeAgo(item.timestamp)}
                    </span>
                  </div>

                  <p className="text-zinc-300 text-xs leading-relaxed mt-1">
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
