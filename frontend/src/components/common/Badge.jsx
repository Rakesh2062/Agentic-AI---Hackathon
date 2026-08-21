import React from "react";
import { StatusConfig, PriorityConfig, CategoryLabels } from "../../utils/constants";
import { 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  ArrowUpRight, 
  ShieldAlert, 
  Flame,
  Truck,
  Droplets,
  Trash2,
  Lightbulb,
  Waves,
  HelpCircle
} from "lucide-react";

export function StatusBadge({ status, size = "md", showDot = true }) {
  const config = StatusConfig[status] || {
    label: status || "Unknown",
    bg: "bg-slate-800 text-slate-300 border-slate-700",
    dot: "bg-slate-400",
  };

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-xs px-2.5 py-1 font-medium",
    lg: "text-sm px-3 py-1.5 font-semibold",
  }[size] || "text-xs px-2.5 py-1 font-medium";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border shadow-sm transition-all ${config.bg} ${sizeClasses}`}
    >
      {showDot && (
        <span
          className={`h-2 w-2 rounded-full ${config.dot} ${
            status === "escalated" || status === "in_progress" ? "pulse-dot" : ""
          }`}
        />
      )}
      {config.label}
    </span>
  );
}

export function PriorityBadge({ priority, size = "md" }) {
  const config = PriorityConfig[priority] || PriorityConfig.medium;

  const sizeClasses = {
    sm: "text-[11px] px-2 py-0.5",
    md: "text-xs px-2.5 py-1 font-semibold",
    lg: "text-sm px-3 py-1 font-bold tracking-wide",
  }[size] || "text-xs px-2.5 py-1 font-semibold";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border tracking-wider uppercase ${config.badge} ${sizeClasses} ${
        priority === "critical" ? "glow-border-critical animate-pulse-subtle" : ""
      }`}
    >
      {priority === "critical" && <Flame className="w-3.5 h-3.5 text-red-400" />}
      {priority === "high" && <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />}
      {config.shortLabel || priority}
    </span>
  );
}

export function CategoryBadge({ category, size = "sm" }) {
  const label = CategoryLabels[category] || category || "General";
  
  const iconMap = {
    roads: Truck,
    water: Droplets,
    waste: Trash2,
    streetlight: Lightbulb,
    drainage: Waves,
    public_safety: ShieldAlert,
    other: HelpCircle,
  };

  const IconComponent = iconMap[category] || HelpCircle;

  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-300 bg-slate-800/90 border border-slate-700/70 px-2.5 py-1 rounded-md">
      <IconComponent className="w-3.5 h-3.5 text-sky-400" />
      {label}
    </span>
  );
}
