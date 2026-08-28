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
  FileText,
  Bot
} from "lucide-react";
import { NagarSetuLogo } from "./NagarSetuLogo";

export function Navbar({ onOpenLanding }) {
  const { 
    activeTab, 
    setActiveTab, 
    setCitizenSubTab,
  } = useApp();

  const { currentUser, logout, isOfficial, isCivilian, isTourist, setAuthModalOpen } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLandingNavigation = () => {
    setAuthModalOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (onOpenLanding) onOpenLanding();
  };

  return (
    <header className="sticky top-0 z-40 bg-white/70 backdrop-blur-2xl border-b border-black/[0.06] shadow-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          
          {/* Logo & Brand */}
          <div 
            onClick={handleLandingNavigation}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 p-0.5 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-neon">
              <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center p-1.5">
                <NagarSetuLogo className="w-5 h-5 text-indigo-600" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-slate-900 font-display uppercase">
                  NAGAR<span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">SETU</span>
                </span>
                <span className="text-xs font-bold text-slate-400 font-sans">
                  नगरसेतु
                </span>
              </div>
              <p className="meta-label text-[9px] text-slate-400 hidden sm:block">
                Civic Intelligence Platform
              </p>
            </div>
          </div>

          {/* Role-Specific Desktop Navigation Tabs */}
          {currentUser && (
            <nav className="hidden md:flex items-center gap-1">
              {/* Civilian & Tourist Navigation */}
              {!isOfficial && (
                <>
                  <button
                    onClick={() => setActiveTab("agent")}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                      activeTab === "agent"
                        ? "bg-sky-600 text-white shadow-md shadow-sky-600/25"
                        : "text-slate-300 hover:text-white hover:bg-slate-800/60"
                    }`}
                  >
                    <Bot className="w-3.5 h-3.5 text-sky-400" />
                    <span>AI Agent</span>
                  </button>
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
                </>
              )}

              {/* Civic Official Navigation */}
              {isOfficial && (
                <button
                  onClick={() => setActiveTab("dashboard")}
                  className={`hover-line flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 ${
                    activeTab === "dashboard"
                      ? "text-indigo-700 bg-indigo-50"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Department Ops</span>
                </button>
              )}

              {/* City Analytics */}
              <button
                onClick={() => setActiveTab("analytics")}
                className={`hover-line flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 ${
                  activeTab === "analytics"
                    ? "text-indigo-700 bg-indigo-50"
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Analytics</span>
              </button>

              {/* Profile */}
              <button
                onClick={() => setActiveTab("profile")}
                className={`hover-line flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 ${
                  activeTab === "profile"
                    ? "text-indigo-700 bg-indigo-50"
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
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
                  className="focus-ring flex items-center gap-2 p-1.5 rounded-full bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-neon transition-all duration-200"
                >
                  <img
                    src={currentUser.profilePhoto || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80"}
                    alt={currentUser.name}
                    className="w-7 h-7 rounded-full object-cover ring-2 ring-indigo-100"
                  />
                  <div className="text-left hidden lg:block pr-1">
                    <span className="text-xs font-semibold text-slate-800 block truncate max-w-[120px]">
                      {currentUser.name}
                    </span>
                    {!isOfficial && (
                      <span className="text-[10px] text-indigo-500 font-mono block leading-none font-medium">
                        {currentUser.civicPoints || 0} pts
                      </span>
                    )}
                    {isOfficial && (
                      <span className="text-[10px] text-violet-500 font-mono block leading-none font-medium">
                        Official
                      </span>
                    )}
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* Dropdown Menu */}
                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white/95 backdrop-blur-2xl border border-slate-200 shadow-float z-40 p-2 text-xs animate-slide-up space-y-1">
                      <div className="p-3 border-b border-slate-100">
                        <div className="flex items-center gap-2.5 mb-2">
                          <img
                            src={currentUser.profilePhoto || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80"}
                            alt={currentUser.name}
                            className="w-10 h-10 rounded-full object-cover ring-2 ring-indigo-100"
                          />
                          <div>
                            <span className="font-semibold text-slate-900 block text-sm leading-tight">{currentUser.name}</span>
                            <span className="text-slate-400 block text-[11px] truncate">{currentUser.email}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <span className="meta-label text-[9px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
                            {RoleLabels[currentUser.role] || currentUser.role}
                          </span>
                          {!isOfficial && (
                            <span className="text-xs font-mono text-indigo-600 font-semibold">
                              {currentUser.civicPoints || 0} pts
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
                          className="w-full text-left px-3 py-2 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg transition flex items-center gap-2 font-medium"
                        >
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>My Profile</span>
                        </button>
                      </div>

                      <div className="border-t border-slate-100 pt-1">
                        <button
                          onClick={() => {
                            logout();
                            setUserMenuOpen(false);
                            onOpenLanding();
                          }}
                          className="w-full text-left px-3 py-2 text-rose-500 hover:bg-rose-50 rounded-lg transition flex items-center gap-2 font-semibold"
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
                type="button"
                onClick={handleLandingNavigation}
                className="focus-ring px-5 py-2 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs tracking-wide shadow-neon transition-all duration-300 cursor-pointer"
              >
                Get Started
              </button>
            )}

            {/* Mobile Menu Toggle */}
            <div className="flex md:hidden items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white/95 backdrop-blur-xl px-4 pt-3 pb-5 space-y-1 animate-slide-down">
          {!isOfficial && (
            <>
              <button
                onClick={() => {
                  setActiveTab("agent");
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold ${
                  activeTab === "agent" ? "bg-sky-600 text-white" : "text-slate-300 hover:bg-slate-900"
                }`}
              >
                <Bot className="w-4 h-4 text-sky-400" />
                AI Agent
              </button>
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
            </>
          )}

          {isOfficial && (
            <button
              onClick={() => {
                setActiveTab("dashboard");
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              <LayoutDashboard className="w-4 h-4" />
              Department Ops
            </button>
          )}

          <button
            onClick={() => {
              setActiveTab("analytics");
              setMobileMenuOpen(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            <BarChart3 className="w-4 h-4" />
            City Analytics
          </button>

          <button
            onClick={() => {
              setActiveTab("profile");
              setMobileMenuOpen(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            <User className="w-4 h-4" />
            My Profile
          </button>
        </div>
      )}
    </header>
  );
}
