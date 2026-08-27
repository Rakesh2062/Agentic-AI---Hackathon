import React, { useEffect, useState } from "react";
import {
  Brain,
  Copy,
  Zap,
  GitBranch,
  AlertTriangle,
  BookOpen,
  Check,
  Loader2,
  Bot,
} from "lucide-react";

const PIPELINE_STEPS = [
  {
    id: "intake",
    icon: Brain,
    agent: "Intake Agent",
    action: "Parsing description & extracting metadata",
    color: "text-sky-400",
    borderColor: "border-sky-500/60",
    bgColor: "bg-sky-950/40",
    dotColor: "bg-sky-400",
    duration: 700,
  },
  {
    id: "classify",
    icon: GitBranch,
    agent: "Classification Agent",
    action: "Identifying issue category & department",
    color: "text-violet-400",
    borderColor: "border-violet-500/60",
    bgColor: "bg-violet-950/40",
    dotColor: "bg-violet-400",
    duration: 1100,
  },
  {
    id: "duplicate",
    icon: Copy,
    agent: "Duplicate Detection Agent",
    action: "Scanning embeddings for similar reports",
    color: "text-amber-400",
    borderColor: "border-amber-500/60",
    bgColor: "bg-amber-950/40",
    dotColor: "bg-amber-400",
    duration: 1300,
  },
  {
    id: "priority",
    icon: Zap,
    agent: "Priority Agent",
    action: "Scoring severity & urgency level",
    color: "text-rose-400",
    borderColor: "border-rose-500/60",
    bgColor: "bg-rose-950/40",
    dotColor: "bg-rose-400",
    duration: 900,
  },
  {
    id: "routing",
    icon: GitBranch,
    agent: "Routing Agent",
    action: "Routing to responsible department",
    color: "text-emerald-400",
    borderColor: "border-emerald-500/60",
    bgColor: "bg-emerald-950/40",
    dotColor: "bg-emerald-400",
    duration: 800,
  },
  {
    id: "escalation",
    icon: AlertTriangle,
    agent: "Escalation Agent",
    action: "Checking escalation threshold",
    color: "text-orange-400",
    borderColor: "border-orange-500/60",
    bgColor: "bg-orange-950/40",
    dotColor: "bg-orange-400",
    duration: 700,
  },
  {
    id: "rag",
    icon: BookOpen,
    agent: "RAG Knowledge Agent",
    action: "Retrieving municipal SOP guidelines",
    color: "text-cyan-400",
    borderColor: "border-cyan-500/60",
    bgColor: "bg-cyan-950/40",
    dotColor: "bg-cyan-400",
    duration: 600,
  },
];

// ── Inline pipeline shown BELOW the submit button while submitting ─────────────
export function AgentPipelineInline({ isVisible }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);

  useEffect(() => {
    if (!isVisible) {
      setCurrentStep(0);
      setCompletedSteps([]);
      return;
    }

    let elapsed = 0;
    const timeouts = PIPELINE_STEPS.map((step, i) => {
      const t = setTimeout(() => {
        setCurrentStep(i);
        if (i > 0) {
          setCompletedSteps((prev) => [...prev, PIPELINE_STEPS[i - 1].id]);
        }
      }, elapsed);
      elapsed += step.duration;
      return t;
    });

    const finalTimeout = setTimeout(() => {
      setCompletedSteps(PIPELINE_STEPS.map((s) => s.id));
    }, elapsed);

    return () => {
      timeouts.forEach(clearTimeout);
      clearTimeout(finalTimeout);
    };
  }, [isVisible]);

  if (!isVisible) return null;

  const activeStep = PIPELINE_STEPS[currentStep];

  return (
    <div className="mt-4 rounded-xl border border-slate-700/70 bg-slate-900/80 overflow-hidden animate-slide-up">
      {/* Header bar */}
      <div className="px-4 py-2.5 border-b border-slate-800 flex items-center gap-2.5 bg-slate-950/60">
        <div className="relative">
          <Bot className="w-4 h-4 text-sky-400" />
          <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        </div>
        <span className="text-xs font-bold text-white tracking-wide">
          Multi-Agent AI Pipeline
        </span>
        <span className="ml-auto text-[10px] text-slate-500 font-mono">
          {completedSteps.length}/{PIPELINE_STEPS.length} agents done
        </span>
      </div>

      {/* Compact step list */}
      <div className="px-3 py-2.5 space-y-1">
        {PIPELINE_STEPS.map((step, idx) => {
          const Icon = step.icon;
          const isCompleted = completedSteps.includes(step.id);
          const isActive = currentStep === idx && !isCompleted;
          const isPending = idx > currentStep;

          return (
            <div
              key={step.id}
              className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg border transition-all duration-300 ${
                isActive
                  ? `${step.bgColor} ${step.borderColor}`
                  : isCompleted
                  ? "bg-slate-800/40 border-slate-700/40"
                  : "border-transparent opacity-35"
              }`}
            >
              {/* Status dot/icon */}
              <div
                className={`w-5 h-5 flex-shrink-0 rounded-full flex items-center justify-center ${
                  isCompleted
                    ? "bg-emerald-500/20 border border-emerald-500/50"
                    : isActive
                    ? `border ${step.borderColor}`
                    : "border border-slate-700"
                }`}
              >
                {isCompleted ? (
                  <Check className="w-2.5 h-2.5 text-emerald-400" />
                ) : isActive ? (
                  <Loader2 className={`w-2.5 h-2.5 ${step.color} animate-spin`} />
                ) : (
                  <Icon className="w-2.5 h-2.5 text-slate-600" />
                )}
              </div>

              {/* Agent name */}
              <span
                className={`text-[11px] font-semibold flex-1 ${
                  isCompleted
                    ? "text-emerald-300"
                    : isActive
                    ? step.color
                    : "text-slate-600"
                }`}
              >
                {step.agent}
              </span>

              {/* Right side text */}
              {isActive && (
                <span className="text-[9px] text-slate-400 truncate max-w-[140px]">
                  {step.action}
                </span>
              )}
              {isCompleted && (
                <span className="text-[9px] text-emerald-500/70">done</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Active description strip */}
      {activeStep && !completedSteps.includes(activeStep.id) && (
        <div className={`px-4 py-2 border-t border-slate-800 ${activeStep.bgColor}`}>
          <p className={`text-[10px] font-semibold ${activeStep.color}`}>
            ▶ {activeStep.agent}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">{activeStep.action}…</p>
        </div>
      )}
    </div>
  );
}

// ── Post-submission summary shown inside ComplaintSuccess ─────────────────────
export function AgentResultSummary({ caseData }) {
  if (!caseData) return null;

  const agents = [
    {
      icon: GitBranch,
      agent: "Classification Agent",
      result: caseData.category
        ? `Identified as "${(caseData.category || "").replace(/_/g, " ")}" with ${Math.round((caseData.confidence || 0.95) * 100)}% confidence`
        : "Category classified",
      color: "text-violet-400",
      bg: "bg-violet-950/30",
      border: "border-violet-700/40",
    },
    {
      icon: Copy,
      agent: "Duplicate Detection Agent",
      result: caseData.is_duplicate
        ? `Flagged as duplicate of ${caseData.duplicate_of}`
        : "No duplicate found — unique report",
      color: "text-amber-400",
      bg: "bg-amber-950/30",
      border: "border-amber-700/40",
    },
    {
      icon: Zap,
      agent: "Priority Agent",
      result: `Assigned ${(caseData.priority || "medium").toUpperCase()} priority`,
      color: "text-rose-400",
      bg: "bg-rose-950/30",
      border: "border-rose-700/40",
    },
    {
      icon: GitBranch,
      agent: "Routing Agent",
      result: `Routed to ${caseData.recommended_department || caseData.department || "Municipal Dispatch"}`,
      color: "text-emerald-400",
      bg: "bg-emerald-950/30",
      border: "border-emerald-700/40",
    },
    {
      icon: AlertTriangle,
      agent: "Escalation Agent",
      result:
        caseData.priority === "critical"
          ? "Escalated to senior authority"
          : "No escalation required",
      color: "text-orange-400",
      bg: "bg-orange-950/30",
      border: "border-orange-700/40",
    },
  ];

  return (
    <div className="mt-5 text-left bg-slate-950/60 border border-slate-800 rounded-xl overflow-hidden">
      <div className="px-4 py-2.5 border-b border-slate-800 flex items-center gap-2">
        <Bot className="w-3.5 h-3.5 text-sky-400" />
        <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
          Behind-the-scenes AI processing flow
        </span>
      </div>

      <div className="p-4 space-y-0">
        {agents.map((a, index) => {
          const Icon = a.icon;
          return (
            <div key={a.agent} className="relative flex gap-3 pb-4 last:pb-0">
              {index < agents.length - 1 && (
                <span className="absolute left-3.5 top-8 h-[calc(100%-1rem)] w-px bg-slate-700" />
              )}
              <div className={`z-10 h-7 w-7 flex-shrink-0 rounded-full border ${a.border} ${a.bg} flex items-center justify-center`}>
                <Icon className={`w-3.5 h-3.5 ${a.color}`} />
              </div>
              <div className={`flex-1 rounded-lg border ${a.border} ${a.bg} px-3 py-2`}>
                <div className="flex items-center justify-between gap-2">
                  <p className={`text-[10px] font-bold ${a.color}`}>
                    Step {index + 1}: {a.agent}
                  </p>
                  <Check className="h-3 w-3 flex-shrink-0 text-emerald-400" />
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {a.result}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Keep backward compat — old overlay is now a no-op wrapper
export function AgentPipelineOverlay({ isVisible }) {
  return null;
}
