import React from "react";
import { getSLARemaining } from "../../utils/formatters";
import { Clock, AlertTriangle, CheckCircle } from "lucide-react";

export function SLAIndicator({ slaDeadline, status, size = "md" }) {
  if (status === "resolved" || status === "closed") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-medium bg-emerald-950/40 border border-emerald-800/60 px-2 py-0.5 rounded">
        <CheckCircle className="w-3 h-3" />
        SLA Met
      </span>
    );
  }

  const { isOverdue, text, urgent } = getSLARemaining(slaDeadline);

  if (isOverdue) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-300 bg-rose-950/90 border border-rose-800 px-2.5 py-1 rounded shadow-sm animate-pulse">
        <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
        {text}
      </span>
    );
  }

  if (urgent) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-300 bg-amber-950/80 border border-amber-800 px-2.5 py-1 rounded">
        <Clock className="w-3.5 h-3.5 text-amber-400" />
        {text}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-slate-300 bg-slate-800/80 border border-slate-700/80 px-2.5 py-1 rounded">
      <Clock className="w-3.5 h-3.5 text-slate-400" />
      {text}
    </span>
  );
}
