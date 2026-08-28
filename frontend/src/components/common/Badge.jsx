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
    bg: "bg-slate-100 text-slate-600 border-slate-200",
    dot: "bg-slate-400",
  };

  const sizeClasses = {
    sm: "text-[10px] px-2 py-0.5",
    md: "text-[11px] px-2.5 py-0.5",
    lg: "text-xs px-3 py-1 font-semibold",
  }[size] || "text-[11px] px-2.5 py-0.5";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-mono uppercase tracking-[0.14em] ${config.bg} ${sizeClasses}`}
    >
      {showDot && (
        <span
          className={`h-1.5 w-1.5 rounded-full ${config.dot} ${
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
    sm: "text-[9px] px-2 py-0.5",
    md: "text-[10px] px-2.5 py-0.5 font-medium",
    lg: "text-xs px-3 py-1 font-bold tracking-wide",
  }[size] || "text-[10px] px-2.5 py-0.5 font-medium";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-mono tracking-[0.14em] uppercase ${config.badge} ${sizeClasses} ${
        priority === "critical" ? "glow-border-critical animate-pulse-subtle" : ""
      }`}
    >
      {priority === "critical" && <Flame className="w-3 h-3 text-red-500" />}
      {priority === "high" && <ShieldAlert className="w-3 h-3 text-amber-500" />}
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
    <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.14em] text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-0.5 rounded-full">
      <IconComponent className="w-3 h-3 text-slate-400" />
      {label}
    </span>
  );
}
