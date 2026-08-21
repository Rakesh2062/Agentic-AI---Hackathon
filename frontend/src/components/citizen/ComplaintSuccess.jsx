import React, { useState } from "react";
import { 
  CheckCircle2, 
  Copy, 
  Check, 
  ArrowRight, 
  Sparkles, 
  Clock, 
  ShieldCheck,
  Building2,
  Share2
} from "lucide-react";
import { PriorityBadge, CategoryBadge } from "../common/Badge";
import { formatDate } from "../../utils/formatters";
import { AgentResultSummary } from "../common/AgentPipelineOverlay";

export function ComplaintSuccess({ createdCase, onTrackNow, onNewComplaint }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!createdCase?.complaint_id) return;
    navigator.clipboard.writeText(createdCase.complaint_id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl max-w-2xl mx-auto animate-slide-up text-center">
      {/* Success Icon */}
      <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4 text-emerald-400 shadow-glow-primary">
        <CheckCircle2 className="w-9 h-9" />
      </div>

      <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
        Complaint Successfully Registered!
      </h2>
      <p className="text-slate-400 text-sm mt-2 max-w-md mx-auto">
        Our multi-agent AI system has classified, scored priority, and queued your report for department routing.
      </p>

      {/* Complaint ID Callout Box */}
      <div className="mt-6 bg-slate-950/80 border border-sky-500/40 rounded-xl p-5 sm:p-6 shadow-inner relative overflow-hidden">
        <div className="absolute top-0 right-0 transform translate-x-3 -translate-y-3 w-20 h-20 bg-sky-500/10 rounded-full blur-xl pointer-events-none"></div>
        <p className="text-xs uppercase font-mono tracking-widest text-sky-400 font-semibold mb-1">
          Your Unique Tracking ID
        </p>
        
        <div className="flex items-center justify-center gap-3 my-2">
          <span className="font-mono text-2xl sm:text-3xl font-extrabold text-white tracking-wider selection:bg-sky-500">
            {createdCase.complaint_id}
          </span>
          <button
            onClick={handleCopy}
            title="Copy Tracking ID"
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
          >
            {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
          </button>
        </div>

        <p className="text-xs text-slate-400 flex items-center justify-center gap-1.5 mt-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          Save this ID to track real-time resolution progress anytime.
        </p>
      </div>

      {/* AI Initial Assessment Summary */}
      <div className="mt-6 text-left bg-slate-950/50 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" /> AI Intake Summary
          </span>
          <span className="text-xs text-sky-400 font-mono">
            {Math.round((createdCase.confidence || 0.95) * 100)}% Match
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-slate-400 block mb-1">Assigned Department:</span>
            <span className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-sky-400" />
              {createdCase.department || "Municipal Dispatch"}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block mb-1">Initial Priority:</span>
            <PriorityBadge priority={createdCase.priority} size="sm" />
          </div>

          <div>
            <span className="text-slate-400 block mb-1">Category:</span>
            <CategoryBadge category={createdCase.category} size="sm" />
          </div>

          <div>
            <span className="text-slate-400 block mb-1">SLA Target:</span>
            <span className="font-medium text-slate-200 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              {createdCase.priority === "critical" ? "6 Hours" : createdCase.priority === "high" ? "24 Hours" : "48 Hours"}
            </span>
          </div>
        </div>
      </div>

      {/* Agent Result Breakdown */}
      <AgentResultSummary caseData={createdCase} />

      {/* Actions */}
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          onClick={() => onTrackNow(createdCase.complaint_id)}
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm shadow-lg shadow-sky-600/30 flex items-center justify-center gap-2 transition transform active:scale-95"
        >
          <span>Track Status Live</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <button
          onClick={onNewComplaint}
          className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm border border-slate-700 transition"
        >
          Submit Another Report
        </button>
      </div>
    </div>
  );
}
