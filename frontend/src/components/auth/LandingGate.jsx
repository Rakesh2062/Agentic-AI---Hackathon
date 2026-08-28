import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { UserRole } from "../../utils/constants";
import { GoogleLoginButton } from "./GoogleLoginButton";
import { 
  Building2, 
  UserCheck, 
  Plane, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  CheckCircle2, 
  LogIn, 
  UserPlus,
  ArrowLeft,
  Zap,
  Lock,
  Award,
  MapPin,
  Flame,
  Radio
} from "lucide-react";
import { NagarSetuLogo } from "../common/NagarSetuLogo";

export function LandingGate({ onBackToLanding, defaultRole = "civilian" }) {
  const { setAuthModalOpen, setAuthModalMode, loginWithGoogle } = useAuth();
  const [activeRoleTab, setActiveRoleTab] = useState(defaultRole || "civilian");

  useEffect(() => {
    if (defaultRole) {
      setActiveRoleTab(defaultRole);
    }
  }, [defaultRole]);

  const handleOpenAuth = (mode) => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const handleGoogleSuccess = (credentialResponse, role) => {
    try {
      loginWithGoogle(credentialResponse, role);
    } catch (err) {
      console.error("Google login failed:", err);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center px-4 sm:px-6 py-10 max-w-5xl mx-auto animate-fade-in relative font-sans">
      
      {/* Top Bar with Back Button & Role Switcher */}
      <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
        {onBackToLanding && (
          <button
            type="button"
            onClick={onBackToLanding}
            className="self-start inline-flex items-center gap-2 px-4 py-2 bg-white/80 hover:bg-white border border-slate-200 text-slate-700 hover:text-slate-900 rounded-full text-xs font-semibold shadow-sm transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>← Back to Overview</span>
          </button>
        )}

        {/* Distinct Role Switcher Tabs */}
        <div className="flex p-1 bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200 shadow-sm gap-1">
          <button
            type="button"
            onClick={() => setActiveRoleTab("civilian")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeRoleTab === "civilian"
                ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-neon"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Citizen Portal</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveRoleTab("official")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeRoleTab === "official"
                ? "bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-lg"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Civic Official</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveRoleTab("tourist")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeRoleTab === "tourist"
                ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-neon-cyan"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <Plane className="w-3.5 h-3.5" />
            <span>Tourist / Visitor</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 1. DEDICATED CIVILIAN / CITIZEN PORTAL LOGIN              */}
      {/* ========================================================= */}
      {activeRoleTab === "civilian" && (
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center glass-panel p-8 sm:p-10 rounded-3xl shadow-float border border-white/90 animate-slide-up relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          
          {/* Left Hero & Benefits */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 pulse-dot" />
              <span>Resident Civic Engagement</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight font-display">
              Citizen Reporting &amp; <br />
              <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-600 bg-clip-text text-transparent">
                Community Points Portal
              </span>
            </h2>

            <p className="text-sm text-slate-600 leading-relaxed">
              Report civic issues in your neighborhood, track municipal resolution milestones in real time, and earn verified points for your public contributions.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/80 border border-indigo-100 shadow-sm">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <span className="font-bold text-slate-800 block">Precise Location Pinning</span>
                  <span className="text-slate-500">Auto-geocoded with Ward &amp; Street info</span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/80 border border-indigo-100 shadow-sm">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <Award className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <span className="font-bold text-slate-800 block">Earn Validated Rewards</span>
                  <span className="text-slate-500">Redeem points for civic commendations</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Action Box */}
          <div className="lg:col-span-6 bg-white/95 p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xl space-y-4">
            <div className="text-center pb-2 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Sign In to Citizen Portal</h3>
              <p className="text-xs text-slate-500 mt-0.5">Use your real Google account or email</p>
            </div>

            <GoogleLoginButton
              onSuccess={(res) => handleGoogleSuccess(res, UserRole.CIVILIAN)}
              onError={(err) => console.error("Google sign in error:", err)}
              text="Continue with Google"
            />

            <div className="relative flex items-center justify-center my-2">
              <div className="border-t border-slate-200 w-full"></div>
              <span className="bg-white px-3 text-[10px] uppercase text-slate-400 font-mono font-bold">or sign in with password</span>
            </div>

            <button
              type="button"
              onClick={() => handleOpenAuth("civilian_login")}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs shadow-neon flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Civilian Email Login</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenAuth("civilian_register")}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold text-xs transition cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>New Resident? Create Account</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. DEDICATED CIVIC OFFICIAL COMMAND ACCESS PORTAL         */}
      {/* ========================================================= */}
      {activeRoleTab === "official" && (
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-slate-950 text-white p-8 sm:p-10 rounded-3xl shadow-2xl border border-slate-800 animate-slide-up relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          
          {/* Left Hero & Official Clearance */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/80 border border-blue-800 text-blue-300 text-xs font-mono font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>MUNICIPAL COMMAND CLEARANCE</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight font-display">
              Civic Operations &amp; <br />
              <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">
                Department Triage Bureau
              </span>
            </h2>

            <p className="text-sm text-slate-300 leading-relaxed">
              Authorized municipal workspace for inspecting AI-triaged incidents, supervising field crew dispatch, and validating multi-factor citizen contribution points.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2 font-mono text-xs">
              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
                <span className="text-blue-400 block font-bold">Kanban Triage</span>
                <span className="text-slate-400 text-[11px]">Real-time queue &amp; SLA clock</span>
              </div>

              <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
                <span className="text-emerald-400 block font-bold">Point Validation</span>
                <span className="text-slate-400 text-[11px]">Award multi-factor points</span>
              </div>
            </div>
          </div>

          {/* Right Official Login Box */}
          <div className="lg:col-span-6 bg-slate-900/90 p-6 sm:p-8 rounded-2xl border border-slate-800 shadow-2xl space-y-4">
            <div className="text-center pb-2 border-b border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-blue-950 border border-blue-800 flex items-center justify-center text-blue-400 mx-auto mb-2">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Authorized Official Sign In</h3>
              <p className="text-xs text-slate-400 mt-0.5">Use your department provisioned Officer ID</p>
            </div>

            <button
              type="button"
              onClick={() => handleOpenAuth("official_login")}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs tracking-wide shadow-lg flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>Enter with Official Credentials</span>
            </button>

            <p className="text-[11px] text-slate-400 text-center leading-relaxed">
              Official accounts are provisioned and audited by Municipal IT Administration.
            </p>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. DEDICATED TOURIST / VISITOR PORTAL                     */}
      {/* ========================================================= */}
      {activeRoleTab === "tourist" && (
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center glass-panel p-8 sm:p-10 rounded-3xl shadow-float border border-white/90 animate-slide-up relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          
          {/* Left Hero & Benefits */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-50 border border-cyan-100 text-cyan-700 text-xs font-bold">
              <Plane className="w-3.5 h-3.5" />
              <span>International &amp; Domestic Visitors</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight font-display">
              Tourist &amp; Visitor <br />
              <span className="bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                Corridor Reporting
              </span>
            </h2>

            <p className="text-sm text-slate-600 leading-relaxed">
              Report issues along tourist routes, transit stations, and public venues with automated passport privacy masking.
            </p>

            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-600" />
                <span>Multilingual voice dictation support</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-600" />
                <span>Encrypted passport ID verification</span>
              </div>
            </div>
          </div>

          {/* Right Action Box */}
          <div className="lg:col-span-6 bg-white/95 p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xl space-y-4">
            <div className="text-center pb-2 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Visitor Authentication</h3>
              <p className="text-xs text-slate-500 mt-0.5">Quick passport or Google sign in</p>
            </div>

            <GoogleLoginButton
              onSuccess={(res) => handleGoogleSuccess(res, UserRole.TOURIST)}
              onError={(err) => console.error("Google sign in error:", err)}
              text="Continue with Google as Visitor"
            />

            <div className="relative flex items-center justify-center my-2">
              <div className="border-t border-slate-200 w-full"></div>
              <span className="bg-white px-3 text-[10px] uppercase text-slate-400 font-mono font-bold">or</span>
            </div>

            <button
              type="button"
              onClick={() => handleOpenAuth("tourist_auth")}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-neon-cyan flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Plane className="w-4 h-4" />
              <span>Passport Register / Login</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
