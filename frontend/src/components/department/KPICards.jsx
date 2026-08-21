import React from "react";
import { 
  Inbox, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  TrendingUp,
  Timer
} from "lucide-react";

export function KPICards({ stats, loading }) {
  const cards = [
    {
      title: "Total Cases",
      value: stats?.total_cases ?? 0,
      icon: Layers,
      color: "sky",
      borderColor: "border-sky-500/20",
      bgGradient: "from-sky-950/40 to-slate-900/60",
      iconColor: "text-sky-400",
      badge: "Assigned Queue",
    },
    {
      title: "Open / Intake",
      value: stats?.open_cases ?? 0,
      icon: Inbox,
      color: "slate",
      borderColor: "border-slate-700/60",
      bgGradient: "from-slate-900 to-slate-950",
      iconColor: "text-slate-300",
      badge: "Pending Action",
    },
    {
      title: "In Progress",
      value: stats?.in_progress ?? 0,
      icon: Clock,
      color: "amber",
      borderColor: "border-amber-500/30",
      bgGradient: "from-amber-950/40 to-slate-900/60",
      iconColor: "text-amber-400",
      badge: "Active Field Crews",
    },
    {
      title: "Resolved",
      value: stats?.resolved ?? 0,
      icon: CheckCircle2,
      color: "emerald",
      borderColor: "border-emerald-500/30",
      bgGradient: "from-emerald-950/40 to-slate-900/60",
      iconColor: "text-emerald-400",
      badge: "Completed",
    },
    {
      title: "SLA Escalations",
      value: stats?.escalated ?? 0,
      icon: AlertTriangle,
      color: "rose",
      borderColor: "border-rose-500/40",
      bgGradient: "from-rose-950/50 to-slate-900/60",
      iconColor: "text-rose-400",
      isEscalated: true,
      badge: "Urgent Attention",
    },
    {
      title: "Avg Turnaround",
      value: stats?.avg_resolution_hours ? `${stats.avg_resolution_hours}h` : "12.4h",
      icon: Timer,
      color: "purple",
      borderColor: "border-purple-500/30",
      bgGradient: "from-purple-950/40 to-slate-900/60",
      iconColor: "text-purple-400",
      badge: "SLA Speed",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
      {cards.map((card, idx) => {
        const IconComponent = card.icon;
        const isPulse = card.isEscalated && (card.value > 0);

        return (
          <div
            key={idx}
            className={`relative rounded-2xl p-4 sm:p-5 border bg-gradient-to-b ${card.bgGradient} ${card.borderColor} shadow-md overflow-hidden transition hover:translate-y-[-2px] ${
              isPulse ? "glow-border-critical ring-1 ring-rose-500/30" : ""
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">
                {card.title}
              </span>
              <IconComponent className={`w-4 h-4 ${card.iconColor}`} />
            </div>

            <div className="flex items-baseline gap-2">
              <span className={`text-2xl sm:text-3xl font-extrabold text-white font-mono ${loading ? "opacity-40 animate-pulse" : ""}`}>
                {card.value}
              </span>
            </div>

            <span className="text-[10px] text-slate-400 mt-1 block truncate">
              {card.badge}
            </span>
          </div>
        );
      })}
    </div>
  );
}
