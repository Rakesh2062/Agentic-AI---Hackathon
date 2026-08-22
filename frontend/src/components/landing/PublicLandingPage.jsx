import React, { useState } from "react";
import {
  Building2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Activity,
  MapPin,
  CheckCircle2,
  X,
  Compass,
  Layers,
  ChevronRight,
  TrendingUp,
  Cpu,
  Users
} from "lucide-react";
import { NagarSetuLogo } from "../common/NagarSetuLogo";

export function PublicLandingPage({ onGetStarted }) {
  const [activeModal, setActiveModal] = useState(null); // 'about' | 'how' | 'features' | 'impact' | null

  return (
    <div className="min-h-screen bg-[#050811] text-slate-100 font-sans selection:bg-sky-500 selection:text-white flex flex-col justify-between overflow-x-hidden relative">
      
      {/* Background Decorative Ambient Glows & Subtle Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:32px_32px] opacity-25 pointer-events-none" />
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-sky-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 -right-40 w-96 h-96 bg-blue-600/10 rounded-full blur-[160px] pointer-events-none" />

      {/* ---------------------------------------------------- */}
      {/* HEADER / NAVBAR                                      */}
      {/* ---------------------------------------------------- */}
      <header className="relative z-30 w-full max-w-7xl mx-auto px-6 sm:px-10 pt-6 sm:pt-8 flex items-center justify-between">
        
        {/* Left: Brand Logo & Title */}
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 via-sky-500 to-emerald-400 p-0.5 shadow-lg shadow-sky-500/20 group-hover:scale-105 transition-transform flex items-center justify-center">
            <div className="w-full h-full bg-[#070b14] rounded-[10px] flex items-center justify-center p-1.5">
              <NagarSetuLogo className="w-6 h-6" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-xl sm:text-2xl tracking-tight text-white uppercase font-sans">
              NAGAR<span className="text-sky-400">SETU</span>
            </span>
            <span className="text-xs font-bold text-sky-300/90 font-sans">
              नगरसेतु
            </span>
          </div>
        </div>

        {/* Center / Right Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-xs uppercase tracking-widest font-bold text-slate-300">
          <button
            onClick={() => setActiveModal("about")}
            className="hover:text-sky-400 transition cursor-pointer"
          >
            About
          </button>
          <button
            onClick={() => setActiveModal("how")}
            className="hover:text-sky-400 transition cursor-pointer"
          >
            How It Works
          </button>
          <button
            onClick={() => setActiveModal("features")}
            className="hover:text-sky-400 transition cursor-pointer"
          >
            Features
          </button>
          <button
            onClick={() => setActiveModal("impact")}
            className="hover:text-sky-400 transition cursor-pointer"
          >
            Impact
          </button>
        </nav>

        {/* Far Right: Clean Minimal Sign Up Button */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onGetStarted}
            className="px-6 py-2.5 rounded-full bg-white hover:bg-sky-400 text-slate-950 hover:text-slate-950 font-black text-xs uppercase tracking-wider transition-all duration-300 transform active:scale-95 shadow-xl shadow-white/10 hover:shadow-sky-400/25 cursor-pointer"
          >
            Sign Up
          </button>
        </div>

      </header>

      {/* ---------------------------------------------------- */}
      {/* HERO SECTION (Bold Editorial Asymmetric Layout)      */}
      {/* ---------------------------------------------------- */}
      <main className="relative z-20 w-full max-w-7xl mx-auto px-6 sm:px-10 py-10 sm:py-16 my-auto flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Oversized Bold Editorial Typography (7 Cols) */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-8 text-left">
            
            {/* Tagline Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-950/80 border border-sky-800/80 text-sky-300 text-[11px] font-mono uppercase tracking-widest font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Autonomous Municipal Intelligence
            </div>

            {/* Oversized Headline */}
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-black uppercase tracking-tight text-white leading-[0.92] select-none">
              Smarter Cities.
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-sky-300 to-emerald-300">
                Faster Action.
              </span>
              <br />
              Real Impact.
            </h1>

            {/* Supporting Description */}
            <p className="text-base sm:text-lg md:text-xl text-slate-300 font-normal leading-relaxed max-w-xl">
              AI-powered civic intelligence that turns community reports into verified, actionable solutions.
            </p>

            {/* Strong CTAs */}
            <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <button
                type="button"
                onClick={onGetStarted}
                className="w-full sm:w-auto px-9 py-4 rounded-2xl bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 text-white font-black text-sm uppercase tracking-wider shadow-2xl shadow-sky-500/30 flex items-center justify-center gap-3 transition-all duration-300 transform active:scale-95 group cursor-pointer"
              >
                <span>GET STARTED</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
              </button>

              <button
                type="button"
                onClick={() => setActiveModal("how")}
                className="text-xs uppercase tracking-widest font-bold text-slate-400 hover:text-white transition flex items-center gap-2 py-2 cursor-pointer group"
              >
                <span>Explore NagarSetu</span>
                <ChevronRight className="w-4 h-4 text-sky-400 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Live Stats Preview */}
            <div className="pt-4 flex items-center gap-8 text-xs font-mono text-slate-400 border-t border-slate-800/80">
              <div>
                <span className="text-white font-bold block text-sm sm:text-base">98.4%</span>
                <span className="text-[10px] uppercase text-slate-500">Triage Accuracy</span>
              </div>
              <div className="h-6 w-[1px] bg-slate-800" />
              <div>
                <span className="text-emerald-400 font-bold block text-sm sm:text-base">3.4x</span>
                <span className="text-[10px] uppercase text-slate-500">Faster Resolution</span>
              </div>
              <div className="h-6 w-[1px] bg-slate-800" />
              <div>
                <span className="text-sky-400 font-bold block text-sm sm:text-base">24/7</span>
                <span className="text-[10px] uppercase text-slate-500">AI Sentinel</span>
              </div>
            </div>

          </div>

          {/* Right Column: Tilted Hero Visual Card with City + AI Overlay (5 Cols) */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end relative">
            
            {/* Glow Aura */}
            <div className="absolute inset-0 bg-sky-500/20 rounded-3xl blur-3xl transform rotate-3 scale-95 pointer-events-none" />

            {/* Angled Hero Card */}
            <div className="relative w-full max-w-md sm:max-w-lg lg:max-w-none rounded-3xl overflow-hidden border-2 border-slate-700/80 bg-slate-900/90 shadow-[0_20px_60px_rgba(0,0,0,0.8)] transform lg:rotate-2 hover:rotate-0 transition-transform duration-500 group">
              
              {/* City Environment Image */}
              <div className="relative h-80 sm:h-96 md:h-[430px] w-full overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1673086636045-9aa873babc91?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjZ8fG1hcCUyMHBob3RvfGVufDB8fDB8fHww"
                  alt="Smart Metropolis Infrastructure"
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 filter brightness-90 contrast-110"
                />
                
                {/* Tech Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#070b14] via-[#070b14]/40 to-transparent" />

                {/* Radar Grid Scanning Line */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(56,189,248,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(56,189,248,0.05)_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

                {/* AI Geospatial HUD Markers */}
                <div className="absolute top-6 left-6 flex items-center gap-2 bg-slate-950/50 backdrop-blur-md px-3 py-1.5 rounded-xl border border-sky-500/50 shadow-lg text-[10px] font-mono text-sky-300">
                  <Activity className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
                  <span>SECTOR 04 • 16.5062° N, 80.6480° E</span>
                </div>

                {/* Live Incident Ping 1 */}
                <div className="absolute top-28 right-10 flex items-center gap-2 bg-slate-950/55 backdrop-blur-md p-2 rounded-xl border border-emerald-500/60 shadow-xl animate-bounce duration-1000">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <div className="text-[10px] text-left">
                    <span className="font-bold text-white block">Water Pipeline AI Triage</span>
                    <span className="text-emerald-400 font-mono">Dispatched ✓</span>
                  </div>
                </div>

                {/* Live Incident Ping 2 */}
                <div className="absolute bottom-24 left-6 flex items-center gap-2 bg-slate-950/55 backdrop-blur-md p-2 rounded-xl border border-amber-500/60 shadow-xl">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  <div className="text-[10px] text-left">
                    <span className="font-bold text-white block">Main Corridor Pothole</span>
                    <span className="text-amber-400 font-mono">Priority: High</span>
                  </div>
                </div>

                {/* Bottom Card Banner */}
                <div className="absolute bottom-4 left-4 right-4 bg-slate-950/55 backdrop-blur-md border border-slate-700/80 rounded-2xl p-4 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-wider text-sky-400 font-bold block">
                      Civic Telemetry Engine
                    </span>
                    <span className="text-white font-bold text-sm">Real-Time Municipal Geo-Routing</span>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-300">
                    <Zap className="w-4 h-4" />
                  </div>
                </div>

              </div>
            </div>

          </div>

        </div>
      </main>

      {/* ---------------------------------------------------- */}
      {/* BELOW HERO: MINIMAL HIGH-AESTHETIC TICKER STRIP      */}
      {/* ---------------------------------------------------- */}
      <section className="relative z-20 w-full border-t border-slate-800/80 bg-slate-950/90 backdrop-blur-md py-4 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between gap-4 text-[11px] sm:text-xs font-mono font-bold uppercase tracking-widest text-slate-400 overflow-x-auto whitespace-nowrap scrollbar-none">
          <span className="flex items-center gap-2 text-sky-400">
            <Sparkles className="w-3.5 h-3.5" /> AI-Powered Civic Intelligence
          </span>
          <span className="text-slate-700">•</span>
          <span className="flex items-center gap-2 text-slate-300">
            <Compass className="w-3.5 h-3.5 text-emerald-400" /> Real-Time Reporting
          </span>
          <span className="text-slate-700">•</span>
          <span className="flex items-center gap-2 text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-sky-400" /> Smart Validation
          </span>
          <span className="text-slate-700">•</span>
          <span className="flex items-center gap-2 text-slate-300">
            <Layers className="w-3.5 h-3.5 text-purple-400" /> City-Wide Insights
          </span>
        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* ELEGANT MODALS FOR NAVBAR LINKS                      */}
      {/* ---------------------------------------------------- */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 max-w-lg w-full text-slate-100 shadow-2xl relative space-y-5 animate-scale-up">
            
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-5 right-5 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {activeModal === "about" && (
              <>
                <div className="w-12 h-12 rounded-2xl bg-sky-950 border border-sky-700 flex items-center justify-center text-sky-400 mb-2 p-2">
                  <NagarSetuLogo className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black uppercase text-white tracking-tight">About NAGARSETU (नगरसेतु)</h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  NagarSetu is an advanced civic intelligence platform connecting residents, civic visitors, and municipal departments. Through agentic triage, automated categorization, and live geospatial analytics, we transform civic reports into rapid, verified public infrastructure solutions.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => {
                      setActiveModal(null);
                      onGetStarted();
                    }}
                    className="w-full py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs uppercase tracking-wider transition"
                  >
                    Join the Platform →
                  </button>
                </div>
              </>
            )}

            {activeModal === "how" && (
              <>
                <div className="w-12 h-12 rounded-2xl bg-emerald-950 border border-emerald-700 flex items-center justify-center text-emerald-400 mb-2">
                  <Cpu className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-black uppercase text-white tracking-tight">How It Works</h3>
                <div className="space-y-3 text-xs text-slate-300">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <strong className="text-sky-400 block mb-1">1. Report with Precision</strong>
                    Pin issues on the interactive map with photos or voice descriptions.
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <strong className="text-emerald-400 block mb-1">2. AI Agentic Triage</strong>
                    AI automatically analyzes severity, deduplicates, and routes to the exact department.
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <strong className="text-purple-400 block mb-1">3. Real Resolution & Points</strong>
                    Track verification in real time and earn civic points and commendations.
                  </div>
                </div>
                <div className="pt-2">
                  <button
                    onClick={() => {
                      setActiveModal(null);
                      onGetStarted();
                    }}
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition"
                  >
                    Get Started Now →
                  </button>
                </div>
              </>
            )}

            {activeModal === "features" && (
              <>
                <div className="w-12 h-12 rounded-2xl bg-purple-950 border border-purple-700 flex items-center justify-center text-purple-400 mb-2">
                  <Layers className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-black uppercase text-white tracking-tight">Platform Features</h3>
                <ul className="space-y-2 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Real-time worldwide OpenStreetMap & CartoDB geospatial mapping</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Live GPS "My Location" locator with accuracy ring</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Multi-role support: Civilian, Tourist, and Department Official</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Gamified civic rewards with real point transactions</span>
                  </li>
                </ul>
                <div className="pt-2">
                  <button
                    onClick={() => {
                      setActiveModal(null);
                      onGetStarted();
                    }}
                    className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-wider transition"
                  >
                    Explore All Features →
                  </button>
                </div>
              </>
            )}

            {activeModal === "impact" && (
              <>
                <div className="w-12 h-12 rounded-2xl bg-amber-950 border border-amber-700 flex items-center justify-center text-amber-400 mb-2">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-black uppercase text-white tracking-tight">Civic Impact</h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  NagarSetu bridges the communication gap between citizens and city officials, eliminating bureaucratic delays and empowering communities with data-driven public governance.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => {
                      setActiveModal(null);
                      onGetStarted();
                    }}
                    className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs uppercase tracking-wider transition"
                  >
                    Start Making An Impact →
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      )}

    </div>
  );
}

export default PublicLandingPage;
