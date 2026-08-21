import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { AppProvider, useApp } from "./context/AppContext";
import { Navbar } from "./components/common/Navbar";
import { Toast } from "./components/common/Toast";
import { PointAwardToast } from "./components/common/PointAwardToast";
import { LandingGate } from "./components/auth/LandingGate";
import { AuthModal } from "./components/auth/AuthModal";
import { CitizenPortal } from "./components/citizen/CitizenPortal";
import { DepartmentDashboard } from "./components/department/DepartmentDashboard";
import { AnalyticsView } from "./components/analytics/AnalyticsView";
import { ProfileView } from "./components/profile/ProfileView";
import { UserRole } from "./utils/constants";
import { 
  Building2, 
  ShieldCheck, 
  Sparkles, 
  Lock,
  Mail,
  Phone,
  Globe2,
  HeartHandshake
} from "lucide-react";

function MainAppContent({ onOpenLanding }) {
  const { activeTab, setActiveTab, setCitizenSubTab } = useApp();
  const { currentUser, isOfficial, isCivilian, isTourist } = useAuth();

  // Redirect to role home on login
  useEffect(() => {
    if (currentUser) {
      if (isOfficial) {
        setActiveTab("dashboard");
      } else {
        setActiveTab("citizen");
        if (setCitizenSubTab) setCitizenSubTab("report");
      }
    }
  }, [currentUser?.id, currentUser?.role]);

  // If no user is logged in, show Landing Gateway
  if (!currentUser) {
    return (
      <div className="flex-1 flex flex-col justify-center">
        <LandingGate />
      </div>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* 1. Citizen / Tourist Portal */}
      {activeTab === "citizen" && !isOfficial && <CitizenPortal />}

      {/* 2. Department Ops (Protected for Civic Officials ONLY) */}
      {activeTab === "dashboard" && (
        isOfficial ? (
          <DepartmentDashboard />
        ) : (
          <div className="glass-card p-12 text-center rounded-2xl border border-rose-900/60 max-w-lg mx-auto space-y-3">
            <Lock className="w-12 h-12 text-rose-500 mx-auto" />
            <h2 className="text-lg font-bold text-white">Department Operations Restricted</h2>
            <p className="text-xs text-slate-400">
              Department triage and status modification require an Authorized Civic Official account.
            </p>
            <button
              onClick={() => setActiveTab("citizen")}
              className="mt-3 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition"
            >
              Return to Citizen Portal
            </button>
          </div>
        )
      )}

      {/* 3. City Analytics */}
      {activeTab === "analytics" && <AnalyticsView />}

      {/* 4. User Profile */}
      {activeTab === "profile" && <ProfileView />}
    </main>
  );
}

function ProfessionalFooter() {
  const { setActiveTab, setCitizenSubTab } = useApp();
  const { isOfficial, currentUser } = useAuth();

  return (
    <footer className="border-t border-slate-800/80 bg-slate-950/80 mt-20 pt-12 pb-8 text-xs text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Footer Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand Col */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-sky-600 flex items-center justify-center text-white">
                <Building2 className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-base text-white tracking-tight">
                Civic<span className="text-sky-400">Pulse</span> AI
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Agentic Civic Intelligence for Smarter, Safer Communities.
            </p>
            <div className="pt-1 text-[11px] text-slate-500 space-y-1">
              <p className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>support@civicpulse.ai</span>
              </p>
              <p className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>+91 80000 12345</span>
              </p>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-slate-200 uppercase tracking-wider mb-3 text-xs">
              Quick Links
            </h4>
            <ul className="space-y-2 text-xs">
              {!isOfficial && (
                <>
                  <li>
                    <button
                      onClick={() => {
                        setActiveTab("citizen");
                        setCitizenSubTab("report");
                      }}
                      className="hover:text-white transition"
                    >
                      Citizen Portal
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => {
                        setActiveTab("citizen");
                        setCitizenSubTab("my_reports");
                      }}
                      className="hover:text-white transition"
                    >
                      My Reports
                    </button>
                  </li>
                </>
              )}
              {isOfficial && (
                <li>
                  <button
                    onClick={() => setActiveTab("dashboard")}
                    className="hover:text-white transition"
                  >
                    Department Operations
                  </button>
                </li>
              )}
              <li>
                <button
                  onClick={() => setActiveTab("analytics")}
                  className="hover:text-white transition"
                >
                  City Analytics
                </button>
              </li>
              <li>
                <span className="text-slate-500">Help Center & SLA Policy</span>
              </li>
            </ul>
          </div>

          {/* For Citizens */}
          <div>
            <h4 className="font-bold text-slate-200 uppercase tracking-wider mb-3 text-xs">
              For Citizens & Visitors
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => {
                    setActiveTab("citizen");
                    setCitizenSubTab("report");
                  }}
                  className="hover:text-white transition"
                >
                  Report a Civic Issue
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setActiveTab("citizen");
                    setCitizenSubTab("track");
                  }}
                  className="hover:text-white transition"
                >
                  Track Report by ID
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab("profile")}
                  className="hover:text-white transition"
                >
                  Civic Points & Levels
                </button>
              </li>
              <li>
                <span className="text-slate-500">Community Commendations</span>
              </li>
            </ul>
          </div>

          {/* Connect & Trust */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-200 uppercase tracking-wider text-xs">
              Civic Trust & Standards
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              All reported public safety issues are verified through human municipal oversight and agentic triage.
            </p>
            <div className="flex items-center gap-3 pt-1 text-slate-400 text-xs">
              <span className="hover:text-sky-400 cursor-pointer">LinkedIn</span>
              <span>•</span>
              <span className="hover:text-sky-400 cursor-pointer">X</span>
              <span>•</span>
              <span className="hover:text-sky-400 cursor-pointer">Instagram</span>
            </div>
          </div>

        </div>

        {/* Footer Bottom Bar */}
        <div className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>© 2026 CivicPulse AI. Building better communities through intelligent civic participation.</p>
          
          <div className="flex items-center gap-4">
            <span className="hover:text-slate-400 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-slate-400 cursor-pointer">Terms of Service</span>
            <span className="hover:text-slate-400 cursor-pointer">Accessibility</span>
          </div>
        </div>

      </div>
    </footer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-sky-500 selection:text-white">
          <Navbar onOpenLanding={() => {}} />
          <div className="flex-1 flex flex-col">
            <MainAppContent />
          </div>
          <ProfessionalFooter />
          <Toast />
          <PointAwardToast />
          <AuthModal />
        </div>
      </AppProvider>
    </AuthProvider>
  );
}
