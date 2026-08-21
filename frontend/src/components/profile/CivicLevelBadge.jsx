import React from "react";
import { getCivicLevel } from "../../utils/constants";
import { Award, Sparkles, TrendingUp } from "lucide-react";

export function CivicLevelBadge({ points = 0, showProgress = true }) {
  const level = getCivicLevel(points);
  
  const currentMin = level.minPoints;
  const nextTarget = level.nextAt;
  const pointsInCurrentLevel = points - currentMin;
  const span = Math.max(1, nextTarget - currentMin);
  const progressPercent = Math.min(100, Math.round((pointsInCurrentLevel / span) * 100));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{level.badge}</span>
          <div>
            <span className="text-xs text-slate-400 font-mono uppercase block leading-none">
              Civic Level
            </span>
            <span className="text-sm font-bold text-slate-100">
              {level.title}
            </span>
          </div>
        </div>

        {showProgress && nextTarget < 99999 && (
          <span className="text-xs text-slate-400 font-mono">
            Next: <strong className="text-sky-300">{level.nextTitle}</strong> ({points}/{nextTarget})
          </span>
        )}
      </div>

      {showProgress && nextTarget < 99999 && (
        <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 via-sky-500 to-amber-400 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}
    </div>
  );
}
