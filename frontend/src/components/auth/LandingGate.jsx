import React from "react";
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
  UserPlus 
} from "lucide-react";

export function LandingGate() {
  const { setAuthModalOpen, setAuthModalMode, loginWithGoogle } = useAuth();

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
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-8 max-w-6xl mx-auto animate-fade-in">
      
      {/* Top Brand Pill */}
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-950/80 border border-sky-800 text-sky-300 text-xs font-bold uppercase tracking-widest mb-6 shadow-glow-primary">
        <Sparkles className="w-4 h-4 text-sky-400" />
        <span>Next-Gen Autonomous Municipal Governance</span>
      </div>

      {/* Main Hero Header */}
      <div className="text-center max-w-3xl mb-12 sm:mb-16">
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight font-sans">
          Civic<span className="text-sky-400">Pulse</span> AI
        </h1>
        <p className="text-lg sm:text-2xl font-bold text-slate-200 mt-2">
          Agentic Civic Intelligence & Complaint-to-Resolution Platform
        </p>
        <p className="text-sm sm:text-base text-slate-400 mt-3 max-w-xl mx-auto leading-relaxed italic">
          "Report problems. Improve your city. Earn civic impact."
        </p>
      </div>

      {/* 3 Primary Role Gateway Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
        
        {/* 1. Civilian / Resident */}
        <div className="glass-panel p-6 sm:p-7 rounded-2xl border border-emerald-900/60 hover:border-emerald-500 transition-all duration-300 flex flex-col justify-between group shadow-xl hover:translate-y-[-3px] relative overflow-hidden bg-gradient-to-b from-slate-900/90 to-slate-950">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-emerald-500/20 transition"></div>
          
          <div>
            <div className="w-12 h-12 rounded-xl bg-emerald-950 border border-emerald-700/80 flex items-center justify-center mb-4 text-emerald-400 shadow-inner group-hover:scale-110 transition-transform">
              <UserCheck className="w-6 h-6" />
            </div>

            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">👤</span>
              <h2 className="text-lg font-bold text-white uppercase tracking-wider">
                Civilian
              </h2>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                Resident
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-6">
              Report civic issues, track resolutions and contribute to your community.
            </p>

            <ul className="text-xs text-slate-300 space-y-2 mb-6 font-medium">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>AI Intake & Real Map Pinning</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Personal "My Reports" Tracker</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Earn Validated Civic Points</span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <button
              type="button"
              onClick={() => handleOpenAuth("civilian_login")}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2 transition active:scale-95"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenAuth("civilian_register")}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 font-semibold text-xs transition"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Create Account</span>
            </button>

            <div className="relative flex items-center justify-center my-0.5">
              <div className="border-t border-slate-800 w-full"></div>
              <span className="bg-slate-900 px-2 text-[10px] uppercase text-slate-500 font-mono">or</span>
            </div>

            <GoogleLoginButton
              onSuccess={(res) => handleGoogleSuccess(res, UserRole.CIVILIAN)}
              onError={(err) => console.error("Google sign in error:", err)}
              text="Continue with Google"
            />
          </div>
        </div>

        {/* 2. Civic Official */}
        <div className="glass-panel p-6 sm:p-7 rounded-2xl border border-sky-900/60 hover:border-sky-500 transition-all duration-300 flex flex-col justify-between group shadow-xl hover:translate-y-[-3px] relative overflow-hidden bg-gradient-to-b from-slate-900/90 to-slate-950">
          <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-sky-500/20 transition"></div>
          
          <div>
            <div className="w-12 h-12 rounded-xl bg-sky-950 border border-sky-700/80 flex items-center justify-center mb-4 text-sky-400 shadow-inner group-hover:scale-110 transition-transform">
              <Building2 className="w-6 h-6" />
            </div>
            
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">🏛️</span>
              <h2 className="text-lg font-bold text-white uppercase tracking-wider">
                Official
              </h2>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800">
                Municipal Staff
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-6">
              Review, validate and coordinate civic issue resolution across departments.
            </p>

            <ul className="text-xs text-slate-300 space-y-2 mb-6 font-medium">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
                <span>Department Ops & Triage Queue</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
                <span>Validate Reports & Calculate Points</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
                <span>Citywide Hotspot Analytics</span>
              </li>
            </ul>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => handleOpenAuth("official_login")}
              className="w-full py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm shadow-md shadow-sky-600/30 flex items-center justify-center gap-2 transition active:scale-95"
            >
              <Building2 className="w-4 h-4" />
              <span>Official Login</span>
            </button>
            <p className="text-[10px] text-slate-500 text-center mt-2">
              Official credentials provisioned by municipal admin
            </p>
          </div>
        </div>

        {/* 3. Tourist / Visitor */}
        <div className="glass-panel p-6 sm:p-7 rounded-2xl border border-purple-900/60 hover:border-purple-500 transition-all duration-300 flex flex-col justify-between group shadow-xl hover:translate-y-[-3px] relative overflow-hidden bg-gradient-to-b from-slate-900/90 to-slate-950">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-purple-500/20 transition"></div>
          
          <div>
            <div className="w-12 h-12 rounded-xl bg-purple-950 border border-purple-700/80 flex items-center justify-center mb-4 text-purple-400 shadow-inner group-hover:scale-110 transition-transform">
              <Plane className="w-6 h-6" />
            </div>

            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">✈️</span>
              <h2 className="text-lg font-bold text-white uppercase tracking-wider">
                Tourist
              </h2>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                Visitor
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-6">
              Report civic issues during your visit and contribute to the city.
            </p>

            <ul className="text-xs text-slate-300 space-y-2 mb-6 font-medium">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
                <span>Tourist Route & Facility Reporting</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
                <span>Explore City Analytics</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
                <span>Secure Passport Masking & Privacy</span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <button
              type="button"
              onClick={() => handleOpenAuth("tourist_auth")}
              className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-md shadow-purple-600/30 flex items-center justify-center gap-2 transition active:scale-95"
            >
              <Plane className="w-4 h-4" />
              <span>Tourist Login / Register</span>
            </button>

            <div className="relative flex items-center justify-center my-0.5">
              <div className="border-t border-slate-800 w-full"></div>
              <span className="bg-slate-900 px-2 text-[10px] uppercase text-slate-500 font-mono">or</span>
            </div>

            <GoogleLoginButton
              onSuccess={(res) => handleGoogleSuccess(res, UserRole.TOURIST)}
              onError={(err) => console.error("Google sign in error:", err)}
              text="Continue with Google as Tourist"
            />
          </div>
        </div>

      </div>

    </div>
  );
}
