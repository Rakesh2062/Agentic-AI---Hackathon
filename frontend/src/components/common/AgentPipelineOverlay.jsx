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
} from "lucide-react";

// Each step mirrors a real backend agent in the orchestrator pipeline
const PIPELINE_STEPS = [
  {
    id: "intake",
    icon: Brain,
    agent: "Intake Agent",
    action: "Parsing complaint & extracting metadata...",
    color: "text-sky-400",
    borderColor: "border-sky-500",
    bgColor: "bg-sky-950/60",
    duration: 800,
  },
  {
    id: "classify",
    icon: GitBranch,
    agent: "Classification Agent",
    action: "Categorizing issue & identifying department...",
    color: "text-violet-400",
    borderColor: "border-violet-500",
    bgColor: "bg-violet-950/60",
    duration: 1200,
  },
  {
    id: "duplicate",
    icon: Copy,
    agent: "Duplicate Detection Agent",
    action: "Embedding complaint & scanning for duplicates...",
    color: "text-amber-400",
    borderColor: "border-amber-500",
    bgColor: "bg-amber-950/60",
    duration: 1400,
  },
  {
    id: "priority",
    icon: Zap,
    agent: "Priority Agent",
    action: "Scoring severity & assigning priority level...",
    color: "text-rose-400",
    borderColor: "border-rose-500",
    bgColor: "bg-rose-950/60",
    duration: 1000,
  },
  {
    id: "routing",
    icon: GitBranch,
    agent: "Routing Agent",
    action: "Routing to responsible municipal department...",
    color: "text-emerald-400",
    borderColor: "border-emerald-500",
    bgColor: "bg-emerald-950/60",
    duration: 900,
  },
  {
    id: "escalation",
    icon: AlertTriangle,
    agent: "Escalation Agent",
    action: "Checking if escalation to senior authority needed...",
    color: "text-orange-400",
    borderColor: "border-orange-500",
    bgColor: "bg-orange-950/60",
    duration: 800,
  },
  {
    id: "rag",
    icon: BookOpen,
    agent: "RAG Knowledge Agent",
    action: "Retrieving municipal SOP guidelines...",
    color: "text-cyan-400",
    borderColor: "border-cyan-500",
    bgColor: "bg-cyan-950/60",
    duration: 700,
  },
];

export function AgentPipelineOverlay({ isVisible }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);

  useEffect(() => {
    if (!isVisible) {
      setCurrentStep(0);
      setCompletedSteps([]);
      return;
    }

    let stepIndex = 0;
    let elapsed = 0;

    const timeouts = PIPELINE_STEPS.map((step, i) => {
      const timeout = setTimeout(() => {
        setCurrentStep(i);
        if (i > 0) {
          setCompletedSteps((prev) => [...prev, PIPELINE_STEPS[i - 1].id]);
        }
      }, elapsed);
      elapsed += step.duration;
      return timeout;
    });

    // Mark last step complete after it runs
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm">
      <div className="w-full max-w-md mx-4 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center gap-3">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-sky-600/20 border border-sky-500/40 flex items-center justify-center">
              <Loader2 className="w-4 h-4 text-sky-400 animate-spin" />
            </div>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse border border-slate-900" />
          </div>
          <div>
            <p className="text-xs font-bold text-white tracking-wide">
              Multi-Agent AI Pipeline
            </p>
            <p className="text-[10px] text-slate-400 font-mono">
              Processing your complaint...
            </p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-[10px] text-slate-500 font-mono">
              {completedSteps.length}/{PIPELINE_STEPS.length} complete
            </p>
          </div>
        </div>

        {/* Pipeline Steps */}
        <div className="px-5 py-4 space-y-2 max-h-72 overflow-y-auto">
          {PIPELINE_STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isCompleted = completedSteps.includes(step.id);
            const isActive = currentStep === idx && !isCompleted;
            const isPending = idx > currentStep;

            return (
              <div
                key={step.id}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all duration-300 ${
                  isActive
                    ? `${step.bgColor} ${step.borderColor}`
                    : isCompleted
                    ? "bg-slate-800/50 border-slate-700/50"
                    : "bg-slate-900/50 border-slate-800/50 opacity-40"
                }`}
              >
                {/* Status Icon */}
                <div
                  className={`w-6 h-6 flex-shrink-0 rounded-full flex items-center justify-center ${
                    isCompleted
                      ? "bg-emerald-500/20 border border-emerald-500/40"
                      : isActive
                      ? `border ${step.borderColor} bg-transparent`
                      : "border border-slate-700 bg-transparent"
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : isActive ? (
                    <Loader2 className={`w-3 h-3 ${step.color} animate-spin`} />
                  ) : (
                    <Icon className="w-3 h-3 text-slate-600" />
                  )}
                </div>

                {/* Agent info */}
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-xs font-bold truncate ${
                      isCompleted
                        ? "text-emerald-300"
                        : isActive
                        ? step.color
                        : "text-slate-600"
                    }`}
                  >
                    {step.agent}
                  </p>
                  {isActive && (
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">
                      {step.action}
                    </p>
                  )}
                  {isCompleted && (
                    <p className="text-[10px] text-emerald-500/70 truncate mt-0.5">
                      Done
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Active step description bar */}
        {activeStep && !completedSteps.includes(activeStep.id) && (
          <div className="px-5 pb-4">
            <div
              className={`px-3 py-2 rounded-lg ${activeStep.bgColor} border ${activeStep.borderColor}/40`}
            >
              <p className={`text-[11px] font-semibold ${activeStep.color}`}>
                ▶ {activeStep.agent}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {activeStep.action}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
