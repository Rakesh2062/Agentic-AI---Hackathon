import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useApp } from "../../context/AppContext";
import { CivicLevelBadge } from "./CivicLevelBadge";
import { Modal } from "../common/Modal";
import { RoleLabels, UserRole } from "../../utils/constants";
import { 
  User, 
  ShieldCheck, 
  Award, 
  CheckCircle2, 
  Clock, 
  Flame, 
  Gift, 
  Lock, 
  Eye, 
  EyeOff, 
  Bell, 
  MapPin, 
  Building2, 
  Calendar,
  Sparkles,
  ArrowRight,
  TrendingUp,
  FileCheck2,
  Users,
  Edit3,
  Camera,
  Phone,
  Mail,
  LogOut,
  Plane,
  FileText,
  KeyRound
} from "lucide-react";
import { CountrySelect } from "../common/CountrySelect";

export function ProfileView() {
  const { currentUser, isOfficial, isCivilian, isTourist, updateUserProfile, logout } = useAuth();
  const { setActiveTab, setCitizenSubTab, showToast } = useApp();

  // Edit Profile Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState(currentUser?.name || "");
  const [editContact, setEditContact] = useState(currentUser?.contact || "");
  const [editCountry, setEditCountry] = useState(currentUser?.country || "United States");
  const [editPhotoPreview, setEditPhotoPreview] = useState(currentUser?.profilePhoto || null);
  const [editPassword, setEditPassword] = useState("");
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [editError, setEditError] = useState("");

  if (!currentUser) return null;

  const points = currentUser.civicPoints || 0;
  const trustScore = currentUser.trustScore || 96;

  // Mask sensitive passport ID for tourists
  const getMaskedPassport = (id) => {
    if (!id) return "N/A";
    if (id.length <= 4) return "********";
    return `********${id.slice(-4)}`;
  };

  const handleOpenEdit = () => {
    setEditName(currentUser.name || "");
    setEditContact(currentUser.contact || "");
    setEditCountry(currentUser.country || "United States");
    setEditPhotoPreview(currentUser.profilePhoto || null);
    setEditPassword("");
    setShowEditPassword(false);
    setEditError("");
    setIsEditModalOpen(true);
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setEditError("Please select a valid image (JPG, PNG, WebP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setEditError("Image size must be less than 5MB.");
      return;
    }

    setEditError("");
    const reader = new FileReader();
    reader.onload = () => {
      setEditPhotoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    if (!editName.trim()) {
      setEditError("Name cannot be empty.");
      return;
    }

    const updates = {
      name: editName.trim(),
      contact: editContact.trim(),
      profilePhoto: editPhotoPreview,
    };
    if (isTourist && editCountry) {
      updates.country = editCountry;
    }
    if (editPassword.trim()) {
      updates.password = editPassword.trim();
    }

    updateUserProfile(updates);
    setIsEditModalOpen(false);
    showToast("Profile details and photo updated successfully!", "success");
  };

  const pointHistory = currentUser.pointHistory || [];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      
      {/* Header Profile Hero Card */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4 sm:gap-6">
            {/* User Profile Photo */}
            <div className="relative">
              <img
                src={currentUser.profilePhoto || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80"}
                alt={currentUser.name}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-sky-500/50 shadow-glow-primary"
              />
              <span className="absolute -bottom-1.5 -right-1.5 p-1 rounded-lg bg-slate-900 border border-slate-700 text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-white">
                  {currentUser.name}
                </h1>
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-sky-950 text-sky-300 border border-sky-800 uppercase">
                  {RoleLabels[currentUser.role] || currentUser.role}
                </span>
              </div>

              <div className="text-xs text-slate-400 space-y-0.5 pt-0.5">
                <p className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  <span>{currentUser.email}</span>
                </p>
                {currentUser.contact && (
                  <p className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span>{currentUser.contact}</span>
                  </p>
                )}
                {isTourist && currentUser.passportId && (
                  <p className="flex items-center gap-1.5 font-mono text-purple-300">
                    <FileText className="w-3.5 h-3.5 text-purple-400" />
                    <span>Passport: {getMaskedPassport(currentUser.passportId)} ({currentUser.country})</span>
                  </p>
                )}
                {isOfficial && (
                  <p className="flex items-center gap-1.5 text-sky-300 font-semibold">
                    <Building2 className="w-3.5 h-3.5 text-sky-400" />
                    <span>Department: {currentUser.department || "Roads & Infrastructure"}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Edit Profile & Logout Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleOpenEdit}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold transition shadow"
            >
              <Edit3 className="w-3.5 h-3.5 text-sky-400" />
              <span>Edit Profile</span>
            </button>

            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800 text-xs font-bold transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Points & Stats Row (For Civilians & Tourists ONLY - NOT for Officials) */}
      {!isOfficial && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Civic Points Card */}
            <div className="glass-card rounded-2xl p-5 sm:p-6 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-400" /> Civic Contribution Score
                </span>
                <span className="text-xs text-emerald-400 font-mono font-bold">
                  Verified Impact
                </span>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-extrabold text-white font-mono">
                  🏆 {points}
                </span>
                <span className="text-xs text-slate-400">Validated Civic Points</span>
              </div>

              {/* Level Progress */}
              <div className="pt-2">
                <CivicLevelBadge points={points} showProgress={true} />
              </div>
            </div>

            {/* Anti-Spam / Trust Score Card */}
            <div className="glass-card rounded-2xl p-5 sm:p-6 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-sky-400" /> Civic Trust Rating
                </span>
                <span className="text-xs text-sky-400 font-mono font-bold">
                  Anti-Spam Verified
                </span>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-extrabold text-sky-300 font-mono">
                  {trustScore}%
                </span>
                <span className="text-xs text-slate-400">Trust Score</span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Calculated from photo evidence clarity, accurate locations, and verified resolution rates.
              </p>

              <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-sky-500 rounded-full"
                  style={{ width: `${trustScore}%` }}
                />
              </div>
            </div>
          </div>

          {/* 4 Community Impact Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow">
              <span className="text-[11px] font-bold text-slate-400 uppercase block mb-1">
                Reports Filed
              </span>
              <span className="text-2xl font-extrabold text-white font-mono">
                {currentUser.reportsSubmitted ?? 0}
              </span>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow">
              <span className="text-[11px] font-bold text-slate-400 uppercase block mb-1">
                Validated Reports
              </span>
              <span className="text-2xl font-extrabold text-emerald-400 font-mono">
                {currentUser.reportsValidated ?? 0}
              </span>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow">
              <span className="text-[11px] font-bold text-slate-400 uppercase block mb-1">
                Resolved Reports
              </span>
              <span className="text-2xl font-extrabold text-sky-400 font-mono">
                {currentUser.issuesResolved ?? 0}
              </span>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow">
              <span className="text-[11px] font-bold text-slate-400 uppercase block mb-1">
                Estimated Impact
              </span>
              <span className="text-2xl font-extrabold text-amber-400 font-mono">
                ~{(currentUser.estimatedImpacted ?? 0).toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-500 block">Citizens benefited</span>
            </div>
          </div>

          {/* Point History & "Why did I receive these points?" */}
          <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Recent Points & Itemized Validation Audit
                </h2>
              </div>
              <span className="text-xs text-slate-400 font-mono font-bold">
                Total My Points: <span className="text-emerald-400 font-extrabold">🏆 {points} pts</span>
              </span>
            </div>

            {pointHistory.length === 0 ? (
              <div className="bg-slate-950/40 border border-dashed border-slate-800 rounded-xl p-8 text-center space-y-2">
                <Award className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-sm font-semibold text-slate-300">No points earned yet.</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Points are awarded once your submitted civic reports are officially validated by municipal authorities.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {pointHistory.map((c, i) => (
                  <div
                    key={c.id || i}
                    className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-slate-700 transition"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        {c.caseId && (
                          <span className="font-mono text-xs font-bold text-sky-400 bg-sky-950/80 px-2 py-0.5 rounded border border-sky-800/80">
                            {c.caseId}
                          </span>
                        )}
                        <span className="font-semibold text-slate-100 text-sm">{c.title}</span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                          {c.status || "Validated ✓"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 font-mono">
                        <strong className="text-slate-300">Why did I receive these points? </strong>
                        {c.reason}
                      </p>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="text-base font-extrabold text-emerald-400 font-mono block">
                        +{c.points}
                      </span>
                      <span className="text-[10px] text-slate-500">{c.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Official Operations Metric Card (Only for Civic Officials) */}
      {isOfficial && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="glass-card p-5 rounded-2xl border border-slate-800 text-center space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase">Cases Validated</span>
            <span className="text-3xl font-extrabold text-sky-400 font-mono block">
              {currentUser.reportsValidated ?? 0}
            </span>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-slate-800 text-center space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase">Resolutions Verified</span>
            <span className="text-3xl font-extrabold text-emerald-400 font-mono block">
              {currentUser.issuesResolved ?? 0}
            </span>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-slate-800 text-center space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase">Department SLA</span>
            <span className="text-3xl font-extrabold text-amber-400 font-mono block">
              96.4%
            </span>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Profile"
        subtitle="Update your personal information and profile picture"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveProfile} className="space-y-4">
          {editError && (
            <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs">
              {editError}
            </div>
          )}

          {/* Photo Edit with Live Preview */}
          <div className="flex items-center gap-4 p-3 bg-slate-950 rounded-xl border border-slate-800">
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-900 border border-slate-700 flex items-center justify-center flex-shrink-0">
              {editPhotoPreview ? (
                <img src={editPhotoPreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <Camera className="w-6 h-6 text-slate-500" />
              )}
            </div>

            <div>
              <label className="text-xs font-bold text-slate-200 block mb-1">
                Change Profile Photo
              </label>
              <label className="text-[11px] px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 cursor-pointer font-semibold inline-block">
                Choose Image (JPG, PNG, WebP)
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoUpload} className="hidden" />
              </label>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">Full Name</label>
            <input
              type="text"
              required
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-slate-100 outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">Contact Number</label>
            <input
              type="tel"
              value={editContact}
              onChange={(e) => setEditContact(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-slate-100 outline-none focus:border-sky-500"
            />
          </div>

          {isTourist && (
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Country / Nationality</label>
              <CountrySelect
                value={editCountry}
                onChange={setEditCountry}
                placeholder="Search and select your country..."
              />
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">Change Password (Optional)</label>
            <div className="relative">
              <input
                type={showEditPassword ? "text" : "password"}
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
                placeholder="Leave blank to keep existing password"
                autoComplete="new-password"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-3.5 pr-10 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-sky-500"
              />
              <button
                type="button"
                onClick={() => setShowEditPassword(!showEditPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200 transition focus:outline-none"
                aria-label={showEditPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showEditPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md shadow-sky-600/30 transition flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
