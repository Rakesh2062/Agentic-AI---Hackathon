import React, { useState, useEffect } from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { AppProvider, useApp } from "./context/AppContext";
import { Navbar } from "./components/common/Navbar";
import { Toast } from "./components/common/Toast";
import { PointAwardToast } from "./components/common/PointAwardToast";
import { PublicLandingPage } from "./components/landing/PublicLandingPage";
import { LandingGate } from "./components/auth/LandingGate";
import { AuthModal } from "./components/auth/AuthModal";
import { CitizenPortal } from "./components/citizen/CitizenPortal";
import { DepartmentDashboard } from "./components/department/DepartmentDashboard";
import { AnalyticsView } from "./components/analytics/AnalyticsView";
import { ProfileView } from "./components/profile/ProfileView";
import { AIAgentPortal } from "./components/agent/AIAgentPortal";
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
import { NagarSetuLogo } from "./components/common/NagarSetuLogo";

function MainAppContent() {
  const { activeTab, setActiveTab, setCitizenSubTab } = useApp();
  const { currentUser, isOfficial } = useAuth();

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

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* 1. Citizen / Tourist Portal */}
      {activeTab === "citizen" && !isOfficial && <CitizenPortal />}

      {/* 1.5 AI Agent Portal */}
      {activeTab === "agent" && !isOfficial && <AIAgentPortal />}

      {/* 2. Department Ops (Protected for Civic Officials ONLY) */}
      {activeTab === "dashboard" && (
        isOfficial ? (
          <DepartmentDashboard />
        ) : (
          <div className="p-12 text-center glass-card rounded-2xl max-w-lg mx-auto space-y-3 animate-scale-up">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center mx-auto">
              <Lock className="w-7 h-7 text-rose-500" />
            </div>
            <h2 className="text-sm font-display uppercase font-bold text-slate-900 tracking-wider">Department Operations Restricted</h2>
            <p className="text-xs text-slate-500">
              Department triage and status modification require an Authorized Civic Official account.
            </p>
            <button
              onClick={() => setActiveTab("citizen")}
              className="mt-3 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold text-xs shadow-neon transition hover:shadow-lg"
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
    <footer className="border-t border-slate-200 bg-white/60 backdrop-blur-xl mt-20 pt-12 pb-8 text-xs text-slate-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Footer Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand Col */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 p-0.5 flex items-center justify-center shadow-neon">
                <div className="w-full h-full bg-white rounded-[8px] flex items-center justify-center p-1">
                  <NagarSetuLogo className="w-4 h-4 text-indigo-600" />
                </div>
              </div>
              <span className="font-extrabold text-base tracking-tight text-slate-900 uppercase font-display">
                NAGAR<span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">SETU</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              AI-powered civic intelligence and municipal issue triage designed for urban harmony and accountability.
            </p>
            <div className="flex items-center gap-1.5 text-[10px] text-indigo-500 font-mono">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Municipal Infrastructure Certified</span>
            </div>
          </div>

          {/* Quick Access */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-700 uppercase tracking-wider text-xs">
              Portal Access
            </h4>
            <ul className="space-y-2 text-xs">
              {!isOfficial && (
                <li>
                  <button
                    onClick={() => {
                      setActiveTab("citizen");
                      if (setCitizenSubTab) setCitizenSubTab("report");
                    }}
                    className="hover:text-indigo-600 transition hover-line"
                  >
                    File an Incident Report
                  </button>
                </li>
              )}
              {isOfficial && (
                <li>
                  <button
                    onClick={() => setActiveTab("dashboard")}
                    className="hover:text-indigo-600 transition hover-line"
                  >
                    Department Operations
                  </button>
                </li>
              )}
              <li>
                <button
                  onClick={() => setActiveTab("analytics")}
                  className="hover:text-indigo-600 transition hover-line"
                >
                  City Analytics &amp; Heatmap
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setActiveTab("citizen");
                    if (setCitizenSubTab) setCitizenSubTab("my_reports");
                  }}
                  className="hover:text-indigo-600 transition hover-line"
                >
                  My Incident Archives
                </button>
              </li>
            </ul>
          </div>

          {/* Citizen Resources */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-700 uppercase tracking-wider text-xs">
              Transparency
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => {
                    setActiveTab("citizen");
                    if (setCitizenSubTab) setCitizenSubTab("track");
                  }}
                  className="hover:text-indigo-600 transition hover-line"
                >
                  Track Report by ID
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab("profile")}
                  className="hover:text-indigo-600 transition hover-line"
                >
                  Civic Points &amp; Credentials
                </button>
              </li>
              <li>
                <span className="text-slate-300">Community Commendations</span>
              </li>
            </ul>
          </div>

          {/* Connect */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-700 uppercase tracking-wider text-xs">
              Bureau Oversight
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              All reported public safety issues are verified through human municipal oversight and agentic triage.
            </p>
            <div className="flex items-center gap-2 pt-1.5 flex-wrap">
              {["LinkedIn", "GitHub", "X"].map((platform) => (
                <a
                  key={platform}
                  href="#"
                  className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition shadow-sm"
                  title={platform}
                >
                  <span className="text-[10px] font-bold">{platform[0]}</span>
                </a>
              ))}
            </div>
          </div>

        </div>

        {/* Footer Bottom Bar */}
        <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-slate-400 font-mono">
          <p>© 2026 NAGARSETU. Systematic Municipal Intelligence.</p>
          
          <div className="flex items-center gap-4">
            <span className="hover:text-indigo-500 cursor-pointer">Privacy Protocol</span>
            <span className="hover:text-indigo-500 cursor-pointer">Terms of Service</span>
            <span className="hover:text-indigo-500 cursor-pointer">Accessibility</span>
          </div>
        </div>

      </div>
    </footer>
  );
}

function MainAppShell() {
  const { currentUser } = useAuth();
  const [showAuthGateway, setShowAuthGateway] = useState(false);
  const [targetRoleGateway, setTargetRoleGateway] = useState("civilian");

  useEffect(() => {
    if (currentUser) {
      setShowAuthGateway(false);
    }
  }, [currentUser]);

  const handleLaunchGateway = (role = "civilian") => {
    setTargetRoleGateway(role);
    setShowAuthGateway(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // 1. Landing Page
  if (!currentUser && !showAuthGateway) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
        <PublicLandingPage onGetStarted={handleLaunchGateway} />
        <Toast />
        <PointAwardToast />
        <AuthModal />
      </div>
    );
  }

  // 2. Distinct Role Auth Gateway
  if (!currentUser && showAuthGateway) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-indigo-200 selection:text-indigo-950">
        <Navbar onOpenLanding={() => setShowAuthGateway(false)} />
        <div className="flex-1 flex flex-col justify-center py-6">
          <LandingGate onBackToLanding={() => setShowAuthGateway(false)} defaultRole={targetRoleGateway} />
        </div>
        <ProfessionalFooter />
        <Toast />
        <PointAwardToast />
        <AuthModal />
      </div>
    );
  }

  // 3. Authenticated State
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-indigo-200 selection:text-indigo-950">
      <Navbar onOpenLanding={() => setShowAuthGateway(false)} />
      <div className="flex-1 flex flex-col">
        <MainAppContent />
      </div>
      <ProfessionalFooter />
      <Toast />
      <PointAwardToast />
      <AuthModal />
    </div>
  );
}

export default function App() {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "407408718192.apps.googleusercontent.com";

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <AuthProvider>
        <AppProvider>
          <MainAppShell />
        </AppProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}
