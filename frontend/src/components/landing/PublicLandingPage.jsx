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
  Users,
  Eye,
  Award,
  ArrowUpRight,
  Radio,
  Globe2,
  Scan,
  Database,
  Flame,
  Truck,
  Droplets,
  Lightbulb,
  Trash2,
  Play,
  RotateCcw,
  Sliders
} from "lucide-react";
import { NagarSetuLogo } from "../common/NagarSetuLogo";

const SAMPLE_SIMULATION_ISSUES = [
  {
    id: "water_burst",
    title: "High-Pressure Water Main Burst",
    location: "Ward 04, Sector 7 Junction",
    reportedBy: "Simoni Shah",
    rawText: "Massive water leakage flooding 3 lanes near commercial market. Water pressure dropped in surrounding 400 households.",
    icon: Droplets,
    category: "water",
    department: "Water Supply & Sewerage Board (WSSB)",
    severity: "Critical",
    severityScore: 94,
    slaHours: 4,
    pointsAwarded: 65,
    color: "from-blue-500 to-cyan-500",
    badgeBg: "bg-blue-50 text-blue-700 border-blue-200"
  },
  {
    id: "road_pothole",
    title: "Deep Crater Pothole on Express Ring Road",
    location: "Ward 12, Metro Pillar 142",
    reportedBy: "Aarav Sharma",
    rawText: "Hazardous 2-foot pothole causing heavy two-wheeler skidding. High speed traffic corridor requires emergency asphalt patch.",
    icon: Truck,
    category: "roads",
    department: "Municipal Roads & Highways Division",
    severity: "High",
    severityScore: 78,
    slaHours: 12,
    pointsAwarded: 45,
    color: "from-amber-500 to-orange-500",
    badgeBg: "bg-amber-50 text-amber-700 border-amber-200"
  },
  {
    id: "electrical_blackout",
    title: "Overhead Streetlight Cable Sparking",
    location: "Ward 09, Heritage Walk Corridor",
    reportedBy: "Elena Rostova",
    rawText: "Streetlight transformer sparked during rain, 8 poles blacked out. Pedestrian risk near bus terminal.",
    icon: Lightbulb,
    category: "streetlight",
    department: "Urban Power & Electrical Grid",
    severity: "Medium",
    severityScore: 62,
    slaHours: 24,
    pointsAwarded: 30,
    color: "from-violet-500 to-indigo-500",
    badgeBg: "bg-violet-50 text-violet-700 border-violet-200"
  },
  {
    id: "waste_spill",
    title: "Illegal Industrial Waste Dump near Canal",
    location: "Ward 02, Eco-Buffer Zone",
    reportedBy: "Marcus Vance",
    rawText: "Unmarked barrels leaking chemical residue into stormwater drain. Immediate sanitation containment needed.",
    icon: Trash2,
    category: "waste",
    department: "Environmental & Solid Waste Management",
    severity: "Critical",
    severityScore: 96,
    slaHours: 2,
    pointsAwarded: 75,
    color: "from-emerald-500 to-teal-500",
    badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200"
  }
];

const WORKFLOW_INDEX = [
  {
    code: "01",
    title: "Multi-Modal Citizen Intake",
    category: "Intake & Geolocation",
    description: "Capture photographic evidence, voice dictation, and pin exact coordinates using high-accuracy CartoDB and OpenStreetMap spatial tiles.",
    tags: ["GPS Locator", "Voice NLP", "Photo Proof"],
    color: "text-indigo-600 bg-indigo-50 border-indigo-200"
  },
  {
    code: "02",
    title: "Agentic NLP & Computer Vision",
    category: "AI Triage & Classification",
    description: "Autonomous agents analyze image hazard severity, extract road/water damage taxonomies, and predict municipal impact score.",
    tags: ["Hazard Scoring", "Category Prediction", "Multi-Agent"],
    color: "text-violet-600 bg-violet-50 border-violet-200"
  },
  {
    code: "03",
    title: "Spatial Deduplication & Clustering",
    category: "Cluster Telemetry",
    description: "Deduplication algorithms identify multiple citizen reports for the same incident, merging them into an escalated priority cluster.",
    tags: ["Cluster Merge", "Co-Signing", "Priority Escalation"],
    color: "text-cyan-600 bg-cyan-50 border-cyan-200"
  },
  {
    code: "04",
    title: "Department Dispatch & SLA Clock",
    category: "Municipal Operations",
    description: "Automated routing to Roads, Water, Waste, or Electrical divisions with countdown SLA timers and automated escalation triggers.",
    tags: ["Kanban Dispatch", "SLA Guard", "Auto-Escalation"],
    color: "text-amber-600 bg-amber-50 border-amber-200"
  },
  {
    code: "05",
    title: "Human Validation & Point Minting",
    category: "Verification & Rewards",
    description: "Municipal staff perform final inspection, verify resolution photos, and credit validated civic points to contributing citizens.",
    tags: ["Point Allocation", "Trust Badges", "Public Audit"],
    color: "text-emerald-600 bg-emerald-50 border-emerald-200"
  }
];

export function PublicLandingPage({ onGetStarted }) {
  const [activeWorkflowHover, setActiveWorkflowHover] = useState(0);
  
  // Interactive Simulator State
  const [selectedSimIssue, setSelectedSimIssue] = useState(SAMPLE_SIMULATION_ISSUES[0]);
  const [simStep, setSimStep] = useState(3); // 0: Raw Intake, 1: AI Triage, 2: Spatial Deduplication, 3: Dispatch & Reward

  // Interactive Live Points Calculator State
  const [calcSeverity, setCalcSeverity] = useState("high"); // low, medium, high, critical
  const [hasPhoto, setHasPhoto] = useState(true);
  const [hasHighImpact, setHasHighImpact] = useState(true);
  const [isRecurring, setIsRecurring] = useState(false);

  const basePointsMap = { low: 5, medium: 15, high: 30, critical: 50 };
  const calculatedTotalPoints = (basePointsMap[calcSeverity] || 30) + (hasPhoto ? 5 : 0) + (hasHighImpact ? 10 : 0) + (isRecurring ? 5 : 0);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-indigo-200 selection:text-indigo-950 flex flex-col overflow-x-hidden relative scroll-smooth">
      
      {/* Consolto-Style Rich Ambient Gradient Mesh Blobs */}
      <div className="fixed top-[-5%] left-[-5%] w-[45vw] h-[45vw] rounded-full bg-gradient-to-br from-indigo-300/30 via-violet-200/25 to-pink-200/20 blur-3xl pointer-events-none -z-10 floating-elem-slow" />
      <div className="fixed top-[30%] right-[-5%] w-[40vw] h-[40vw] rounded-full bg-gradient-to-tl from-rose-200/30 via-amber-200/20 to-cyan-200/20 blur-3xl pointer-events-none -z-10 floating-elem" style={{ animationDelay: '2s' }} />
      <div className="fixed bottom-[-10%] left-[20%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-tr from-cyan-200/25 via-emerald-200/20 to-blue-200/20 blur-3xl pointer-events-none -z-10 floating-elem-slow" style={{ animationDelay: '4s' }} />

      {/* ---------------------------------------------------- */}
      {/* STICKY GLASSMORPHIC HEADER                           */}
      {/* ---------------------------------------------------- */}
      <header className="sticky top-0 z-40 w-full bg-white/75 backdrop-blur-2xl border-b border-black/[0.06] shadow-subtle">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 h-20 flex items-center justify-between">
          
          {/* Brand Logo & Title */}
          <div 
            className="flex items-center gap-3 cursor-pointer group" 
            onClick={() => scrollToSection("hero")}
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-600 to-pink-500 p-0.5 group-hover:scale-105 transition-transform flex items-center justify-center shadow-neon">
              <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center p-1.5">
                <NagarSetuLogo className="w-5 h-5 text-indigo-600" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg sm:text-xl tracking-tight text-slate-900 uppercase font-display">
                NAGAR<span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-600 bg-clip-text text-transparent">SETU</span>
              </span>
              <span className="font-mono text-[10px] text-indigo-600 font-bold px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-100 shadow-sm">
                AI Municipal v2
              </span>
              <span className="text-xs font-medium text-slate-400 font-sans ml-1">
                नगरसेतु
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden  md:flex items-center gap-8 text-xs font-bold uppercase tracking-wider text-slate-600">
            <button
              onClick={() => scrollToSection("simulator")}
              className="hover:text-indigo-600 transition-colors cursor-pointer hover-line flex items-center gap-1 text-indigo-600"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Simulator</span>
            </button>
            <button
              onClick={() => scrollToSection("workflow")}
              className="hover:text-indigo-600 transition-colors cursor-pointer hover-line"
            >
              Workflow
            </button>
            <button
              onClick={() => scrollToSection("calculator")}
              className="hover:text-indigo-600 transition-colors cursor-pointer hover-line"
            >
              Points &amp; Rewards
            </button>
            <button
              onClick={() => scrollToSection("impact")}
              className="hover:text-indigo-600 transition-colors cursor-pointer hover-line"
            >
              City Impact
            </button>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onGetStarted("civilian")}
              className="hidden sm:inline-flex px-4 py-2 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs transition shadow-sm cursor-pointer"
            >
              Citizen Portal
            </button>
            <button
              type="button"
              onClick={() => onGetStarted("official")}
              className="focus-ring px-5 py-2.5 rounded-full bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-600 hover:opacity-95 text-white font-bold text-xs uppercase tracking-wider transition-all duration-300 shadow-neon transform active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Official Login</span>
            </button>
          </div>

        </div>
      </header>

      {/* ---------------------------------------------------- */}
      {/* SECTION 1: HERO WITH CONSOLTO-INSPIRED VIBRANCY      */}
      {/* ---------------------------------------------------- */}
      <section id="hero" className="relative z-20 w-full max-w-7xl mx-auto px-6 sm:px-10 py-16 sm:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
          
          {/* Left Column (7 Cols) */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-8 text-left">
            
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 border border-indigo-100 shadow-sm backdrop-blur-md">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 pulse-dot"></span>
              <span className="text-xs font-bold bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent">
                AUTONOMOUS CIVIC INTELLIGENCE &amp; TRIAGE
              </span>
            </div>

            <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-[4.5rem] font-black uppercase tracking-[-0.04em] text-slate-900 leading-[0.94] font-display">
              Smart Cities.
              <br />
              <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-500 bg-clip-text text-transparent">
                Instant Action.
              </span>
              <br />
              Zero Bureaucracy.
            </h1>

            <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed max-w-xl">
              NagarSetu bridges civilian eyes and municipal dispatch crews with multi-agent AI computer vision, geospatial deduplication, and verified citizen reward capital.
            </p>

            {/* Interactive Dual-Entry Gateway Cards with Distinct Visual Identifiers */}
            <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
              <button
                type="button"
                onClick={() => onGetStarted("civilian")}
                className="focus-ring group glass-card glass-card-hover p-6 rounded-3xl text-left border border-white/80 transition duration-300 cursor-pointer relative overflow-hidden bg-gradient-to-br from-white/90 to-indigo-50/50 shadow-md"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500 text-white flex items-center justify-center shadow-neon">
                    <Users className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                    RESIDENT
                  </span>
                </div>
                <span className="font-bold text-base text-slate-900 flex items-center justify-between">
                  Citizen Reporting 
                  <ArrowRight className="w-4 h-4 text-indigo-600 group-hover:translate-x-1.5 transition-all" />
                </span>
                <span className="text-xs text-slate-500 block mt-1">Submit neighborhood issues, track tickets &amp; earn points</span>
              </button>

              <button
                type="button"
                onClick={() => onGetStarted("official")}
                className="focus-ring group glass-card glass-card-hover p-6 rounded-3xl text-left border border-slate-800 transition duration-300 cursor-pointer relative overflow-hidden bg-slate-950 text-white shadow-xl"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800">
                    OFFICIAL
                  </span>
                </div>
                <span className="font-bold text-base text-white flex items-center justify-between">
                  Department Ops Bureau
                  <ChevronRight className="w-4 h-4 text-blue-400 group-hover:translate-x-1.5 transition-all" />
                </span>
                <span className="text-xs text-slate-400 block mt-1">Kanban triage, SLA countdown clocks &amp; field dispatch</span>
              </button>
            </div>

            {/* Live Metrics Strip with Rich Badges */}
            <div className="pt-4 grid grid-cols-3 gap-4 border-t border-slate-200/80 max-w-xl">
              <div className="space-y-0.5">
                <span className="text-slate-900 font-mono font-extrabold block text-2xl sm:text-3xl text-indigo-600">98.4%</span>
                <span className="meta-label text-[10px]">Triage Accuracy</span>
              </div>
              <div className="space-y-0.5 border-l border-slate-200 pl-4">
                <span className="text-slate-900 font-mono font-extrabold block text-2xl sm:text-3xl text-violet-600">3.4x</span>
                <span className="meta-label text-[10px]">Faster Resolution</span>
              </div>
              <div className="space-y-0.5 border-l border-slate-200 pl-4">
                <span className="text-slate-900 font-mono font-extrabold block text-2xl sm:text-3xl text-pink-600">80+</span>
                <span className="meta-label text-[10px]">Wards Monitored</span>
              </div>
            </div>

          </div>

          {/* Right Column: Floating Interactive Telemetry Card */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end relative">
            <div className="relative w-full max-w-md sm:max-w-lg glass-panel p-4 rounded-3xl shadow-float group border border-white/90">
              
              {/* Main Visual Image with Radar */}
              <div className="relative h-80 sm:h-96 w-full overflow-hidden rounded-2xl bg-slate-900">
                <img
                  src="https://images.unsplash.com/photo-1477959858617-67f30bc75b82?w=1200&auto=format&fit=crop&q=80"
                  alt="Metropolitan Urban Architecture"
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 filter brightness-95"
                />
                
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/30" />

                {/* Radar HUD Scanner Tag */}
                <div className="absolute top-4 left-4 flex items-center gap-2 bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/80 text-[10px] font-mono font-bold text-slate-800 shadow-md">
                  <Scan className="w-3.5 h-3.5 text-indigo-600 animate-spin" style={{ animationDuration: '6s' }} />
                  <span>SECTOR 04 • LIVE MONITORING</span>
                </div>

                {/* Floating Live Issue Card with Vibrant Progress Bar */}
                <div className="absolute bottom-16 left-4 right-4 bg-white/95 backdrop-blur-xl p-4 rounded-2xl border border-white/90 shadow-xl space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-blue-500 text-white flex items-center justify-center shadow-md">
                        <Droplets className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 block leading-tight">Water Main Valve Rupture</span>
                        <span className="text-[10px] text-emerald-600 font-mono font-bold">● AI Classified: Critical (94/100)</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg border border-indigo-100">
                      SLA: 4h
                    </span>
                  </div>

                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-indigo-500 to-pink-500 w-3/4 animate-pulse" />
                  </div>
                </div>

                {/* Bottom Bar */}
                <div className="absolute bottom-3 left-3 right-3 bg-slate-950/80 backdrop-blur-md border border-white/10 rounded-xl p-2.5 flex items-center justify-between text-xs text-white">
                  <div className="flex items-center gap-2">
                    <Database className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="font-mono text-[11px] text-slate-200">OpenStreetMap + CartoDB Spatial Hub</span>
                  </div>
                  <div className="font-mono text-[10px] text-emerald-400 flex items-center gap-1 font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    LIVE
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* SECTION 2: ASTONISHING INTERACTIVE AI SIMULATOR      */}
      {/* ---------------------------------------------------- */}
      <section id="simulator" className="relative z-20 w-full max-w-7xl mx-auto px-6 sm:px-10 py-20 sm:py-28">
        <div className="glass-panel p-8 sm:p-12 rounded-3xl border border-white/90 shadow-float relative overflow-hidden">
          
          <div className="max-w-3xl mb-8 space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>INTERACTIVE PLAYGROUND</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-display">
              Test Drive the Autonomous Multi-Agent Triage Engine
            </h2>
            <p className="text-sm text-slate-600">
              Click any sample civic incident below to watch the autonomous AI pipeline classify severity, match department, enforce SLA, and mint citizen points in real time:
            </p>
          </div>

          {/* Sample Issue Selector Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {SAMPLE_SIMULATION_ISSUES.map((issue) => {
              const Icon = issue.icon;
              const isSelected = selectedSimIssue.id === issue.id;

              return (
                <button
                  key={issue.id}
                  type="button"
                  onClick={() => setSelectedSimIssue(issue)}
                  className={`p-4 rounded-2xl text-left border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-white shadow-neon border-indigo-300 scale-[1.02]"
                      : "bg-white/60 hover:bg-white border-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${issue.color} text-white flex items-center justify-center shadow-sm`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${issue.badgeBg}`}>
                      {issue.severity}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 truncate">{issue.title}</h4>
                  <span className="text-[10px] text-slate-500 font-mono block mt-0.5">{issue.location}</span>
                </button>
              );
            })}
          </div>

          {/* Live Simulation Live Output Box */}
          <div className="bg-slate-950 text-white p-6 sm:p-8 rounded-2xl border border-slate-800 shadow-2xl space-y-6">
            
            {/* Top Bar with Status */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                <div>
                  <span className="text-xs font-mono text-slate-400 block">ACTIVE INCIDENT SIMULATION</span>
                  <h3 className="text-base font-bold text-white">{selectedSimIssue.title}</h3>
                </div>
              </div>

              <div className="flex items-center gap-3 font-mono text-xs">
                <span className="px-3 py-1 bg-slate-900 border border-slate-700 rounded-lg text-slate-300">
                  Location: <strong className="text-white">{selectedSimIssue.location}</strong>
                </span>
                <span className="px-3 py-1 bg-emerald-950 border border-emerald-800 rounded-lg text-emerald-300 font-bold">
                  +{selectedSimIssue.pointsAwarded} Civic Points
                </span>
              </div>
            </div>

            {/* Simulated Live Agents Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
              
              {/* 1. Vision & NLP Agent */}
              <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-indigo-400">
                  <Eye className="w-4 h-4" />
                  <span className="font-bold">1. Vision &amp; NLP Agent</span>
                </div>
                <div className="text-[11px] text-slate-300">
                  Taxonomy: <strong className="text-white capitalize">{selectedSimIssue.category}</strong>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 w-full" />
                </div>
                <span className="text-[10px] text-emerald-400 block">98% Confidence Verified</span>
              </div>

              {/* 2. Prioritization Matrix */}
              <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-amber-400">
                  <Flame className="w-4 h-4" />
                  <span className="font-bold">2. Severity Scorecard</span>
                </div>
                <div className="text-[11px] text-slate-300">
                  Calculated: <strong className="text-amber-400">{selectedSimIssue.severityScore} / 100</strong>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500" style={{ width: `${selectedSimIssue.severityScore}%` }} />
                </div>
                <span className="text-[10px] text-amber-300 block">{selectedSimIssue.severity} Priority</span>
              </div>

              {/* 3. Department Routing */}
              <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-cyan-400">
                  <Truck className="w-4 h-4" />
                  <span className="font-bold">3. Department Dispatch</span>
                </div>
                <p className="text-[10px] text-slate-300 truncate" title={selectedSimIssue.department}>
                  {selectedSimIssue.department}
                </p>
                <span className="text-[10px] text-cyan-300 block">Target SLA: {selectedSimIssue.slaHours} Hours</span>
              </div>

              {/* 4. Reward Minting */}
              <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-pink-400">
                  <Award className="w-4 h-4" />
                  <span className="font-bold">4. Citizen Reward Gate</span>
                </div>
                <div className="text-[11px] text-slate-300">
                  Reporter: <strong className="text-white">{selectedSimIssue.reportedBy}</strong>
                </div>
                <span className="text-[10px] text-pink-300 block">+{selectedSimIssue.pointsAwarded} Civic Points Credited</span>
              </div>

            </div>

            <p className="text-xs text-slate-400 italic">
              "{selectedSimIssue.rawText}"
            </p>
          </div>

        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* SECTION 3: INTERACTIVE CIVIC POINTS CALCULATOR       */}
      {/* ---------------------------------------------------- */}
      <section id="calculator" className="relative z-20 w-full max-w-7xl mx-auto px-6 sm:px-10 py-20 sm:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Left Explanation */}
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold">
              <Award className="w-3.5 h-3.5" />
              <span>CIVIC REWARD ECONOMY</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight font-display">
              Earn Verified Points for Every Incident Fixed
            </h2>

            <p className="text-sm text-slate-600 leading-relaxed">
              Our multi-factor validation algorithm rewards high-integrity reports. Points unlock community badges, leaderboards, and municipal recognition.
            </p>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
              <div className="flex justify-between items-center font-mono text-xs">
                <span className="text-slate-500">Current Milestone:</span>
                <span className="font-bold text-indigo-600">Level 3: Urban Guardian</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 via-indigo-500 to-pink-500 w-4/5" />
              </div>
            </div>
          </div>

          {/* Right Interactive Simulator Widget */}
          <div className="lg:col-span-7 glass-panel p-6 sm:p-8 rounded-3xl border border-white/90 shadow-float space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Live Reward Multiplier Calculator</h3>
                <p className="text-xs text-slate-500">Adjust the incident parameters to see live point calculation</p>
              </div>
              <div className="text-right font-mono">
                <span className="text-xs text-slate-400 block">Calculated Reward</span>
                <span className="text-2xl sm:text-3xl font-extrabold text-indigo-600">+{calculatedTotalPoints} pts</span>
              </div>
            </div>

            {/* Severity Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">Incident Severity (Base Points):</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { key: "low", label: "Low (+5)" },
                  { key: "medium", label: "Medium (+15)" },
                  { key: "high", label: "High (+30)" },
                  { key: "critical", label: "Critical (+50)" }
                ].map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => setCalcSeverity(s.key)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                      calcSeverity === s.key
                        ? "bg-indigo-600 text-white shadow-neon"
                        : "bg-white hover:bg-slate-50 border border-slate-200 text-slate-700"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Checkbox Multipliers */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-white border border-slate-200 cursor-pointer text-xs text-slate-700 font-semibold shadow-sm hover:border-indigo-300 transition">
                <input
                  type="checkbox"
                  checked={hasPhoto}
                  onChange={(e) => setHasPhoto(e.target.checked)}
                  className="w-4 h-4 accent-indigo-600 rounded"
                />
                <span>Photo Evidence (+5)</span>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-white border border-slate-200 cursor-pointer text-xs text-slate-700 font-semibold shadow-sm hover:border-indigo-300 transition">
                <input
                  type="checkbox"
                  checked={hasHighImpact}
                  onChange={(e) => setHasHighImpact(e.target.checked)}
                  className="w-4 h-4 accent-indigo-600 rounded"
                />
                <span>High Public Reach (+10)</span>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-white border border-slate-200 cursor-pointer text-xs text-slate-700 font-semibold shadow-sm hover:border-indigo-300 transition">
                <input
                  type="checkbox"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="w-4 h-4 accent-indigo-600 rounded"
                />
                <span>Recurring Hazard (+5)</span>
              </label>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => onGetStarted("civilian")}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-600 text-white font-bold text-xs uppercase tracking-wider shadow-neon hover:opacity-95 transition"
              >
                Sign In to Start Earning Points →
              </button>
            </div>

          </div>

        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* SECTION 4: INTERACTIVE WORKFLOW INDEX (#workflow)    */}
      {/* ---------------------------------------------------- */}
      <section id="workflow" className="relative z-20 w-full max-w-7xl mx-auto px-6 sm:px-10 py-20 sm:py-28">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
          <div>
            <span className="meta-label block mb-2 text-indigo-600">[ 04 / SYSTEM ARCHITECTURE ]</span>
            <h2 className="text-3xl sm:text-5xl font-extrabold uppercase tracking-tight text-slate-900 font-display">
              Incident Lifecycle Workflow
            </h2>
          </div>
          <p className="text-xs font-mono text-slate-500 max-w-md">
            Explore the five sequential phases of the NagarSetu autonomous municipal pipeline.
          </p>
        </div>

        {/* High-Tech Translucent Interactive Hover Rows */}
        <div className="space-y-3">
          {WORKFLOW_INDEX.map((step, idx) => {
            const isHovered = activeWorkflowHover === idx;

            return (
              <div
                key={step.code}
                onMouseEnter={() => setActiveWorkflowHover(idx)}
                className={`p-6 sm:p-7 rounded-2xl transition-all duration-300 cursor-pointer border ${
                  isHovered 
                    ? "bg-white shadow-float border-indigo-300 scale-[1.01]" 
                    : "glass-card border-slate-200/70 hover:border-slate-300"
                }`}
              >
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  
                  {/* Step Code */}
                  <div className="md:col-span-1">
                    <span className={`font-mono text-base font-bold px-2.5 py-1 rounded-lg ${
                      isHovered ? "bg-indigo-50 text-indigo-600" : "text-slate-400"
                    }`}>
                      [{step.code}]
                    </span>
                  </div>

                  {/* Title & Category */}
                  <div className="md:col-span-4">
                    <h3 className="text-base sm:text-lg font-bold uppercase tracking-tight text-slate-900">
                      {step.title}
                    </h3>
                    <span className="text-xs font-mono text-indigo-500 font-semibold block mt-0.5">
                      {step.category}
                    </span>
                  </div>

                  {/* Description */}
                  <div className="md:col-span-5">
                    <p className="text-xs sm:text-sm leading-relaxed text-slate-600">
                      {step.description}
                    </p>
                  </div>

                  {/* Tags & Action Arrow */}
                  <div className="md:col-span-2 flex items-center justify-between md:justify-end gap-3">
                    <div className="flex gap-1 flex-wrap">
                      {step.tags.map((t, i) => (
                        <span 
                          key={i} 
                          className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200 uppercase"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                    <ArrowUpRight className={`w-5 h-5 flex-shrink-0 transition-transform duration-300 ${
                      isHovered ? "translate-x-1 -translate-y-1 text-indigo-600" : "text-slate-400"
                    }`} />
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* SECTION 5: CITYWIDE IMPACT & TELEMETRY (#impact)     */}
      {/* ---------------------------------------------------- */}
      <section id="impact" className="relative z-20 w-full max-w-7xl mx-auto px-6 sm:px-10 py-20 sm:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-5 space-y-6">
            <span className="meta-label block text-indigo-600">[ 05 / MUNICIPAL IMPACT ]</span>
            <h2 className="text-3xl sm:text-5xl font-extrabold uppercase tracking-tight text-slate-900 leading-tight font-display">
              Measurable Public Infrastructure ROI
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              NagarSetu eliminates citizen friction, tracks municipal response velocities, and guarantees verifiable proof for every resolved civic report.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => onGetStarted("civilian")}
                className="px-6 py-3.5 rounded-full bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-600 text-white font-bold text-xs uppercase tracking-wider shadow-neon hover:opacity-95 transition"
              >
                Join City Platform →
              </button>
            </div>
          </div>

          <div className="lg:col-span-7 grid grid-cols-2 gap-4 font-mono">
            <div className="p-6 glass-card glass-card-hover rounded-3xl space-y-2 border-l-4 border-l-indigo-500">
              <span className="meta-label text-[9px] text-indigo-500">[ METRIC / 01 ]</span>
              <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 block">14,200+</span>
              <span className="meta-label text-slate-700 font-bold block">Issues Resolved</span>
              <p className="text-[11px] text-slate-500 pt-1 font-sans">Verified fixes across water, road, and electrical networks.</p>
            </div>

            <div className="p-6 glass-card glass-card-hover rounded-3xl space-y-2 border-l-4 border-l-violet-500">
              <span className="meta-label text-[9px] text-violet-500">[ METRIC / 02 ]</span>
              <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 block">98.4%</span>
              <span className="meta-label text-slate-700 font-bold block">AI Triage Accuracy</span>
              <p className="text-[11px] text-slate-500 pt-1 font-sans">Automated categorization matching field team assignments.</p>
            </div>

            <div className="p-6 glass-card glass-card-hover rounded-3xl space-y-2 border-l-4 border-l-pink-500">
              <span className="meta-label text-[9px] text-pink-500">[ METRIC / 03 ]</span>
              <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 block">85,000+</span>
              <span className="meta-label text-slate-700 font-bold block">Civic Points Minted</span>
              <p className="text-[11px] text-slate-500 pt-1 font-sans">Awarded to citizens for high-integrity incident submissions.</p>
            </div>

            <div className="p-6 glass-card glass-card-hover rounded-3xl space-y-2 border-l-4 border-l-amber-500">
              <span className="meta-label text-[9px] text-amber-500">[ METRIC / 04 ]</span>
              <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 block">3.4x</span>
              <span className="meta-label text-slate-700 font-bold block">Speed Acceleration</span>
              <p className="text-[11px] text-slate-500 pt-1 font-sans">Faster turnaround compared to manual legacy municipal helplines.</p>
            </div>
          </div>

        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* SECTION 6: GRAND CTA BANNER                          */}
      {/* ---------------------------------------------------- */}
      <section className="relative z-20 w-full max-w-7xl mx-auto px-6 sm:px-10 py-24 sm:py-32 text-center space-y-8">
        <div className="glass-panel p-12 sm:p-16 rounded-3xl shadow-float max-w-4xl mx-auto space-y-6 relative overflow-hidden bg-gradient-to-br from-white/90 via-indigo-50/40 to-pink-50/40">
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl" />

          <span className="meta-label px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 inline-block">[ 06 / GET STARTED ]</span>
          
          <h2 className="text-4xl sm:text-6xl font-black uppercase tracking-tight text-slate-900 leading-tight font-display">
            Shape your city. <br />
            <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-600 bg-clip-text text-transparent">With precision.</span>
          </h2>

          <p className="text-sm text-slate-600 max-w-md mx-auto">
            Join thousands of active citizens and civic officials in transforming urban governance.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
            <button
              type="button"
              onClick={() => onGetStarted("civilian")}
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-600 hover:opacity-95 text-white font-bold text-xs uppercase tracking-wider shadow-neon transition cursor-pointer"
            >
              Launch Citizen Portal →
            </button>
            <button
              type="button"
              onClick={() => onGetStarted("official")}
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-slate-950 hover:bg-slate-900 text-white font-bold text-xs uppercase tracking-wider shadow-lg transition cursor-pointer"
            >
              Civic Official Login
            </button>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* SECTION 7: BUREAU FOOTER                             */}
      {/* ---------------------------------------------------- */}
      <footer className="relative z-20 w-full border-t border-slate-200 bg-white/70 py-10 px-6 sm:px-10 text-xs font-mono text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-pink-600 p-0.5 flex items-center justify-center shadow-sm">
              <NagarSetuLogo className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-extrabold text-sm text-slate-900 tracking-tight uppercase font-display">
              NAGAR<span className="text-indigo-600">SETU</span>
            </span>
          </div>

          <div className="flex items-center gap-6 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
            <button onClick={() => scrollToSection("hero")} className="hover:text-indigo-600 transition">Index</button>
            <button onClick={() => scrollToSection("simulator")} className="hover:text-indigo-600 transition">AI Simulator</button>
            <button onClick={() => scrollToSection("workflow")} className="hover:text-indigo-600 transition">Workflow</button>
            <button onClick={() => scrollToSection("calculator")} className="hover:text-indigo-600 transition">Calculator</button>
            <button onClick={() => scrollToSection("impact")} className="hover:text-indigo-600 transition">Impact</button>
          </div>

          <p className="text-[10px]">© 2026 NAGARSETU. Systematic Municipal Intelligence.</p>
        </div>
      </footer>

    </div>
  );
}

export default PublicLandingPage;
