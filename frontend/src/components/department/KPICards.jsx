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
      iconColor: "text-indigo-600",
      iconBg: "bg-indigo-50 border-indigo-100",
      badge: "Assigned Queue",
      trend: "+12.6%",
      trendColor: "text-indigo-600 bg-indigo-50"
    },
    {
      title: "Open Intake",
      value: stats?.open_cases ?? 0,
      icon: Inbox,
      iconColor: "text-slate-600",
      iconBg: "bg-slate-100 border-slate-200",
      badge: "Pending Action",
      trend: "+4.2%",
      trendColor: "text-slate-600 bg-slate-100"
    },
    {
      title: "In Progress",
      value: stats?.in_progress ?? 0,
      icon: Clock,
      iconColor: "text-amber-600",
      iconBg: "bg-amber-50 border-amber-100",
      badge: "Field Crews",
      trend: "+8.4%",
      trendColor: "text-amber-600 bg-amber-50"
    },
    {
      title: "Resolved",
      value: stats?.resolved ?? 0,
      icon: CheckCircle2,
      iconColor: "text-emerald-600",
      iconBg: "bg-emerald-50 border-emerald-100",
      badge: "Completed",
      trend: "+18.2%",
      trendColor: "text-emerald-600 bg-emerald-50"
    },
    {
      title: "SLA Escalated",
      value: stats?.escalated ?? 0,
      icon: AlertTriangle,
      iconColor: "text-rose-600",
      iconBg: "bg-rose-50 border-rose-100",
      isEscalated: true,
      badge: "Urgent Attention",
      trend: "Needs Review",
      trendColor: "text-rose-600 bg-rose-50"
    },
    {
      title: "Avg Turnaround",
      value: stats?.avg_resolution_hours ? `${stats.avg_resolution_hours}h` : "12.4h",
      icon: Timer,
      iconColor: "text-violet-600",
      iconBg: "bg-violet-50 border-violet-100",
      badge: "SLA Velocity",
      trend: "-1.8h",
      trendColor: "text-violet-600 bg-violet-50"
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
      {cards.map((card, idx) => {
        const IconComponent = card.icon;
        const isPulse = card.isEscalated && (card.value > 0);

        return (
          <article
            key={idx}
            className={`glass-panel p-4 sm:p-5 rounded-2xl border border-white/90 shadow-sm transition-all duration-300 hover:shadow-md hover:scale-[1.02] flex flex-col justify-between ${
              isPulse ? "border-rose-300 bg-rose-50/40" : ""
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">
                {card.title}
              </span>
              <div className={`w-8 h-8 rounded-xl border flex items-center justify-center ${card.iconBg} ${card.iconColor}`}>
                <IconComponent className="w-4 h-4" />
              </div>
            </div>

            <div className="flex items-baseline gap-2 mb-2">
              <span className={`text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tracking-tight ${loading ? "opacity-40 animate-pulse" : ""}`}>
                {card.value}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[10px]">
              <span className="text-slate-400 font-medium truncate">{card.badge}</span>
              <span className={`px-2 py-0.5 rounded-md font-bold font-mono ${card.trendColor}`}>
                {card.trend}
              </span>
            </div>
          </article>
        );
      })}
    </div>
  );
}
