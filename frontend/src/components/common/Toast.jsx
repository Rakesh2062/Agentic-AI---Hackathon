import React from "react";
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from "lucide-react";
import { useApp } from "../../context/AppContext";

export function Toast() {
  const { toastMessage, showToast } = useApp();

  if (!toastMessage) return null;

  const { message, type = "info" } = toastMessage;

  const typeConfig = {
    success: {
      icon: CheckCircle2,
      border: "border-emerald-500/50 bg-emerald-950/90 text-emerald-200",
      iconColor: "text-emerald-400",
    },
    error: {
      icon: AlertCircle,
      border: "border-rose-500/50 bg-rose-950/90 text-rose-200",
      iconColor: "text-rose-400",
    },
    warning: {
      icon: AlertTriangle,
      border: "border-amber-500/50 bg-amber-950/90 text-amber-200",
      iconColor: "text-amber-400",
    },
    info: {
      icon: Info,
      border: "border-sky-500/50 bg-slate-900/95 text-slate-200",
      iconColor: "text-sky-400",
    },
  }[type] || {
    icon: Info,
    border: "border-sky-500/50 bg-slate-900/95 text-slate-200",
    iconColor: "text-sky-400",
  };

  const IconComponent = typeConfig.icon;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-up max-w-md">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl backdrop-blur-md ${typeConfig.border}`}
      >
        <IconComponent className={`w-5 h-5 flex-shrink-0 ${typeConfig.iconColor}`} />
        <p className="text-sm font-medium pr-2">{message}</p>
        <button
          onClick={() => showToast(null)}
          className="text-slate-400 hover:text-slate-200 p-1 -mr-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
