import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import { RoleLabels, UserRole } from "../../utils/constants";
import { 
  Building2, 
  Send, 
  LayoutDashboard, 
  BarChart3, 
  User, 
  LogOut, 
  ChevronDown, 
  Sparkles, 
  Menu, 
  X,
  FileText
} from "lucide-react";

export function Navbar({ onOpenLanding }) {
  const { 
    activeTab, 
    setActiveTab, 
    setCitizenSubTab,
  } = useApp();

  const { currentUser, logout, isOfficial, isCivilian, isTourist } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo & Brand */}
          <div 
            onClick={onOpenLanding}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 via-sky-500 to-emerald-400 p-0.5 shadow-glow-primary flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Building2 className="w-5 h-5 text-sky-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white font-sans">
                  Civic<span className="text-sky-400">Pulse</span>
                </span>
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 bg-sky-950/80 text-sky-300 border border-sky-800 rounded font-semibold flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 text-sky-400" /> AI
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block font-medium">
                Agentic Civic Intelligence Platform
              </p>
            </div>
          </div>

          {/* Role-Specific Desktop Navigation Tabs (No Duplicate My Reports) */}
          {currentUser && (
            <nav className="hidden md:flex items-center gap-1 bg-slate-900/90 p-1.5 rounded-xl border border-slate-800 shadow-inner">
              {/* Civilian & Tourist Navigation: [Citizen Portal] [City Analytics] [Profile] */}
              {!isOfficial && (
                <button
                  onClick={() => {
                    setActiveTab("citizen");
                    setCitizenSubTab("report");
                  }}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                    activeTab === "citizen"
                      ? "bg-sky-600 text-white shadow-md shadow-sky-600/25"
                      : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isTourist ? "Citizen / Visitor Portal" : "Citizen Portal"}</span>
                </button>
              )}

              {/* Civic Official Navigation: [Department Ops] [City Analytics] [Profile] */}
              {isOfficial && (
                <button
                  onClick={() => setActiveTab("dashboard")}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                    activeTab === "dashboard"
                      ? "bg-sky-600 text-white shadow-md shadow-sky-600/25"
                      : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-amber-400" />
                  <span>Department Ops</span>
                </button>
              )}

              {/* City Analytics (Available to All Roles) */}
              <button
                onClick={() => setActiveTab("analytics")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                  activeTab === "analytics"
                    ? "bg-sky-600 text-white shadow-md shadow-sky-600/25"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>City Analytics</span>
              </button>

              {/* Profile */}
              <button
                onClick={() => setActiveTab("profile")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                  activeTab === "profile"
                    ? "bg-sky-600 text-white shadow-md shadow-sky-600/25"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Profile</span>
              </button>
            </nav>
          )}

          {/* Right User Profile Dropdown */}
          <div className="flex items-center gap-3">
            {currentUser ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition"
                >
                  <img
                    src={currentUser.profilePhoto || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80"}
                    alt={currentUser.name}
                    className="w-8 h-8 rounded-lg object-cover border border-sky-500/40"
                  />
                  <div className="text-left hidden lg:block pr-1">
                    <span className="text-xs font-bold text-slate-100 block truncate max-w-[120px]">
                      {currentUser.name}
                    </span>
                    {!isOfficial && (
                      <span className="text-[10px] text-emerald-400 font-mono font-bold block leading-none">
                        🏆 {currentUser.civicPoints || 0} pts
                      </span>
                    )}
                    {isOfficial && (
                      <span className="text-[10px] text-sky-400 font-mono font-bold block leading-none">
                        Civic Official
                      </span>
                    )}
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* Dropdown Menu */}
                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl z-40 p-2 text-xs animate-slide-up space-y-1">
                      <div className="p-3 border-b border-slate-800">
                        <div className="flex items-center gap-2.5 mb-2">
                          <img
                            src={currentUser.profilePhoto || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80"}
                            alt={currentUser.name}
                            className="w-10 h-10 rounded-xl object-cover border border-sky-500/40"
                          />
                          <div>
                            <span className="font-bold text-white block text-sm leading-tight">{currentUser.name}</span>
                            <span className="text-slate-400 block text-[11px] truncate">{currentUser.email}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800 font-semibold">
                            {RoleLabels[currentUser.role] || currentUser.role}
                          </span>
                          {!isOfficial && (
                            <span className="text-xs font-mono font-extrabold text-amber-400">
                              🏆 {currentUser.civicPoints || 0} pts
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="py-1">
                        <button
                          onClick={() => {
                            setActiveTab("profile");
                            setUserMenuOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-800 rounded-lg transition flex items-center gap-2 font-medium"
                        >
                          <User className="w-3.5 h-3.5 text-sky-400" />
                          <span>My Profile</span>
                        </button>
                      </div>

                      <div className="border-t border-slate-800 pt-1">
                        <button
                          onClick={() => {
                            logout();
                            setUserMenuOpen(false);
                            onOpenLanding();
                          }}
                          className="w-full text-left px-3 py-2 text-rose-400 hover:bg-rose-950/40 rounded-lg transition flex items-center gap-2 font-semibold"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Logout</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenLanding}
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md shadow-sky-600/30 transition"
              >
                Sign In
              </button>
            )}

            {/* Mobile Menu Toggle */}
            <div className="flex md:hidden items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Mobile Menu Dropdown (Clean, No Duplicate Reports) */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-950/95 px-4 pt-3 pb-5 space-y-2 animate-slide-up">
          {!isOfficial && (
            <button
              onClick={() => {
                setActiveTab("citizen");
                setCitizenSubTab("report");
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold ${
                activeTab === "citizen" ? "bg-sky-600 text-white" : "text-slate-300 hover:bg-slate-900"
              }`}
            >
              <Send className="w-4 h-4" />
              {isTourist ? "Citizen / Visitor Portal" : "Citizen Portal"}
            </button>
          )}

          {isOfficial && (
            <button
              onClick={() => {
                setActiveTab("dashboard");
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-300 hover:bg-slate-900"
            >
              <LayoutDashboard className="w-4 h-4 text-amber-400" />
              Department Ops
            </button>
          )}

          <button
            onClick={() => {
              setActiveTab("analytics");
              setMobileMenuOpen(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-300 hover:bg-slate-900"
          >
            <BarChart3 className="w-4 h-4" />
            City Analytics
          </button>

          <button
            onClick={() => {
              setActiveTab("profile");
              setMobileMenuOpen(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-300 hover:bg-slate-900"
          >
            <User className="w-4 h-4" />
            My Profile
          </button>
        </div>
      )}
    </header>
  );
}
