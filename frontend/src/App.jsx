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
              <div className="w-7 h-7 rounded-lg bg-sky-600 flex items-center justify-center text-white p-1">
                <NagarSetuLogo className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-base tracking-tight text-white uppercase">
                NAGAR<span className="text-sky-400">SETU</span> <span className="text-xs font-bold text-sky-300/90 font-sans ml-1">नगरसेतु</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Empowering proactive civic participation and rapid infrastructure resolution with real-time AI triage.
            </p>
            <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-mono">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Municipal Data Certified • 256-bit SSL</span>
            </div>
          </div>

          {/* Quick Access */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-200 uppercase tracking-wider text-xs">
              Portal Access
            </h4>
            <ul className="space-y-2">
              {!isOfficial && (
                <li>
                  <button
                    onClick={() => {
                      setActiveTab("citizen");
                      if (setCitizenSubTab) setCitizenSubTab("report");
                    }}
                    className="hover:text-white transition"
                  >
                    File an Incident
                  </button>
                </li>
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
                  City Analytics & Heatmap
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setActiveTab("citizen");
                    if (setCitizenSubTab) setCitizenSubTab("rewards");
                  }}
                  className="hover:text-white transition"
                >
                  Civic Leaderboard
                </button>
              </li>
            </ul>
          </div>

          {/* Citizen Resources */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-200 uppercase tracking-wider text-xs">
              Citizen Trust
            </h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => {
                    setActiveTab("citizen");
                    if (setCitizenSubTab) setCitizenSubTab("tracker");
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

          {/* Connect & Social Media */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-200 uppercase tracking-wider text-xs">
              Civic Trust & Connect
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              All reported public safety issues are verified through human municipal oversight and agentic triage.
            </p>
            <div className="flex items-center gap-2 pt-1.5 flex-wrap">
              {/* LinkedIn */}
              <a
                href="https://www.linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-[#0A66C2] hover:border-[#0A66C2]/60 hover:bg-[#0A66C2]/10 transition-all duration-200 shadow-sm group"
                title="LinkedIn"
              >
                <svg className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
                </svg>
              </a>

              {/* X (formerly Twitter) */}
              <a
                href="https://x.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="X (formerly Twitter)"
                className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-600 hover:bg-slate-800 transition-all duration-200 shadow-sm group"
                title="X (Twitter)"
              >
                <svg className="w-3.5 h-3.5 fill-current group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>

              {/* Instagram */}
              <a
                href="https://www.instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-[#E4405F] hover:border-[#E4405F]/60 hover:bg-[#E4405F]/10 transition-all duration-200 shadow-sm group"
                title="Instagram"
              >
                <svg className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>

              {/* GitHub */}
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
                className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-100 hover:border-slate-600 hover:bg-slate-800 transition-all duration-200 shadow-sm group"
                title="GitHub"
              >
                <svg className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                </svg>
              </a>

              {/* YouTube */}
              <a
                href="https://www.youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-[#FF0000] hover:border-[#FF0000]/60 hover:bg-[#FF0000]/10 transition-all duration-200 shadow-sm group"
                title="YouTube"
              >
                <svg className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>
            </div>
          </div>

        </div>

        {/* Footer Bottom Bar */}
        <div className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>© 2026 NAGARSETU. Building better communities through intelligent civic participation.</p>
          
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

function MainAppShell() {
  const { currentUser } = useAuth();
  const [showAuthGateway, setShowAuthGateway] = useState(false);

  // When user logs in, ensure showAuthGateway resets
  useEffect(() => {
    if (currentUser) {
      setShowAuthGateway(false);
    }
  }, [currentUser]);

  // 1. Initial State: If not logged in & not on auth gateway, render the new Public Editorial Landing Page (NO footer)
  if (!currentUser && !showAuthGateway) {
    return (
      <div className="min-h-screen flex flex-col bg-[#050811] text-slate-100 font-sans">
        <PublicLandingPage onGetStarted={() => setShowAuthGateway(true)} />
        <Toast />
        <PointAwardToast />
        <AuthModal />
      </div>
    );
  }

  // 2. Authentication Role Gateway State: If not logged in & clicked Get Started / Sign In, render Role Gateway (with Footer)
  if (!currentUser && showAuthGateway) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-sky-500 selection:text-white">
        <Navbar onOpenLanding={() => setShowAuthGateway(false)} />
        <div className="flex-1 flex flex-col justify-center">
          <LandingGate onBackToLanding={() => setShowAuthGateway(false)} />
        </div>
        <ProfessionalFooter />
        <Toast />
        <PointAwardToast />
        <AuthModal />
      </div>
    );
  }

  // 3. Authenticated State: User is logged in, render main portal/ops
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-sky-500 selection:text-white">
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
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

  const appContent = (
    <AuthProvider>
      <AppProvider>
        <MainAppShell />
      </AppProvider>
    </AuthProvider>
  );

  // Wrap with GoogleOAuthProvider only if client ID is configured
  if (googleClientId) {
    return (
      <GoogleOAuthProvider clientId={googleClientId}>
        {appContent}
      </GoogleOAuthProvider>
    );
  }

  return appContent;
}
