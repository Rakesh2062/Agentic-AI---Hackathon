import React from "react";
import { ComplaintForm } from "./ComplaintForm";
import { StatusTracker } from "./StatusTracker";
import { MyComplaintsView } from "./MyComplaintsView";
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import { Send, Search, FileText, Award, Sparkles, MapPin } from "lucide-react";

export function CitizenPortal() {
  const { citizenSubTab, setCitizenSubTab } = useApp();
  const { currentUser } = useAuth();

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      
      {/* Top Welcome & Points Bar for Citizen */}
      <div className="glass-panel p-5 sm:p-6 rounded-3xl border border-white/80 shadow-float flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-r from-white/90 via-indigo-50/40 to-pink-50/40">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center shadow-neon font-bold text-lg">
            {currentUser?.name ? currentUser.name[0] : "C"}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 font-display">
                Welcome back, {currentUser?.name || "Citizen"}!
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                Level 2 Resident
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Spot a civic issue in your neighborhood? Report it below to earn points upon municipal resolution.
            </p>
          </div>
        </div>

        {/* Live Points Counter Pill */}
        <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
            <Award className="w-5 h-5" />
          </div>
          <div className="text-right font-mono">
            <span className="text-[10px] text-slate-400 block font-bold uppercase">Civic Points</span>
            <span className="text-lg font-extrabold text-indigo-600">
              {currentUser?.civicPoints || 45} pts
            </span>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Switcher with Colorful Pills */}
      <div className="flex justify-center">
        <div className="inline-flex items-center p-1.5 rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-xl shadow-sm gap-1">
          <button
            onClick={() => setCitizenSubTab("report")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
              citizenSubTab === "report"
                ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-neon"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Submit Issue</span>
          </button>

          <button
            onClick={() => setCitizenSubTab("my_reports")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
              citizenSubTab === "my_reports"
                ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-neon"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>My Reports</span>
          </button>

          <button
            onClick={() => setCitizenSubTab("track")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
              citizenSubTab === "track"
                ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-neon"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <Search className="w-4 h-4" />
            <span>Track by ID</span>
          </button>
        </div>
      </div>

      {/* Active Tab Component */}
      <div className="pt-2">
        {citizenSubTab === "report" && <ComplaintForm />}
        {citizenSubTab === "my_reports" && <MyComplaintsView onNewReportClick={() => setCitizenSubTab("report")} />}
        {citizenSubTab === "track" && <StatusTracker />}
      </div>
    </div>
  );
}
