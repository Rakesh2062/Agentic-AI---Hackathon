import React from "react";
import { ComplaintForm } from "./ComplaintForm";
import { StatusTracker } from "./StatusTracker";
import { MyComplaintsView } from "./MyComplaintsView";
import { useApp } from "../../context/AppContext";
import { Send, Search, FileText } from "lucide-react";

export function CitizenPortal() {
  const { citizenSubTab, setCitizenSubTab } = useApp();

  return (
    <div className="space-y-6">
      {/* Sub-Navigation Switcher */}
      <div className="flex justify-center">
        <div className="inline-flex items-center p-1.5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg">
          <button
            onClick={() => setCitizenSubTab("report")}
            className={`flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              citizenSubTab === "report"
                ? "bg-sky-600 text-white shadow-md shadow-sky-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Submit Issue</span>
          </button>

          <button
            onClick={() => setCitizenSubTab("my_reports")}
            className={`flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              citizenSubTab === "my_reports"
                ? "bg-sky-600 text-white shadow-md shadow-sky-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>My Reports</span>
          </button>

          <button
            onClick={() => setCitizenSubTab("track")}
            className={`flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              citizenSubTab === "track"
                ? "bg-sky-600 text-white shadow-md shadow-sky-600/30"
                : "text-slate-400 hover:text-white"
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
