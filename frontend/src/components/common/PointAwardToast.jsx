import React from "react";
import confetti from "canvas-confetti";
import { useAuth } from "../../context/AuthContext";
import { Award, Sparkles, X, CheckCircle2 } from "lucide-react";

export function PointAwardToast() {
  const { pointAwardNotification, setPointAwardNotification } = useAuth();

  if (!pointAwardNotification) return null;

  const { points, reason, caseTitle, newTotal } = pointAwardNotification;

  return (
    <div className="fixed top-20 right-6 z-50 animate-slide-up max-w-md">
      <div className="bg-slate-900 border-2 border-amber-500/80 rounded-2xl p-4 sm:p-5 shadow-2xl shadow-amber-500/20 backdrop-blur-md relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 w-28 h-28 bg-amber-500/15 rounded-full blur-xl pointer-events-none"></div>

        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 flex-shrink-0 shadow-glow-primary">
              <Award className="w-6 h-6" />
            </div>

            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-400">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Civic Contribution Earned!</span>
              </div>
              <h4 className="text-sm font-extrabold text-white mt-0.5">
                +{points} Civic Points Awarded
              </h4>
            </div>
          </div>

          <button
            onClick={() => setPointAwardNotification(null)}
            className="text-slate-400 hover:text-white p-1 -mr-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-3 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-1">
          <p className="text-slate-200 font-medium">
            Issue: <span className="text-slate-300">{caseTitle}</span>
          </p>
          <p className="text-slate-400 font-mono text-[11px] leading-tight">
            {reason}
          </p>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-800">
          <span className="text-slate-400">New Civic Score:</span>
          <span className="font-mono font-extrabold text-emerald-400 text-sm">
            🏆 {newTotal} Points
          </span>
        </div>
      </div>
    </div>
  );
}
