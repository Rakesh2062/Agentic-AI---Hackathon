import React, { useState } from "react";
import { Modal } from "../common/Modal";
import { useAuth } from "../../context/AuthContext";
import { UserRole } from "../../utils/constants";
import { 
  Building2, 
  UserCheck, 
  Plane, 
  Mail, 
  Lock, 
  Phone, 
  MapPin, 
  ShieldCheck, 
  Camera, 
  AlertCircle, 
  CheckCircle2, 
  Loader2,
  Globe2,
  KeyRound,
  FileText
} from "lucide-react";

export function AuthModal() {
  const { 
    authModalOpen, 
    setAuthModalOpen, 
    authModalMode, 
    setAuthModalMode,
    loginCivilian,
    registerCivilian,
    loginOfficial,
    registerTourist,
    loginTourist,
    loginWithGoogle
  } = useAuth();

  // Form Fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [contact, setContact] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passportId, setPassportId] = useState("");
  const [country, setCountry] = useState("United States");
  const [officialId, setOfficialId] = useState("");
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  
  // UI State
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [touristTab, setTouristTab] = useState("register"); // 'register' | 'login'

  if (!authModalOpen) return null;

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type and size (max 5MB)
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setErrorMsg("Please upload a valid image file (JPG, PNG, WebP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg("Profile photo size must be less than 5MB.");
      return;
    }

    setErrorMsg("");
    const reader = new FileReader();
    reader.onload = () => {
      setPhotoPreview(reader.result);
      setProfilePhoto(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleCivilianSubmit = (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (authModalMode === "civilian_register") {
      if (!name.trim() || !email.trim() || !contact.trim() || !password) {
        setErrorMsg("Please fill in all required fields.");
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg("Passwords do not match. Please verify.");
        return;
      }
      if (password.length < 6) {
        setErrorMsg("Password must be at least 6 characters long.");
        return;
      }

      setLoading(true);
      try {
        registerCivilian({
          name,
          email,
          contact,
          password,
          profilePhoto: photoPreview,
        });
        setLoading(false);
      } catch (err) {
        setLoading(false);
        setErrorMsg(err.message || "Registration failed.");
      }
    } else {
      // Civilian Login
      if (!email.trim() || !password) {
        setErrorMsg("Please enter your email and password.");
        return;
      }
      setLoading(true);
      try {
        loginCivilian(email, password);
        setLoading(false);
      } catch (err) {
        setLoading(false);
        setErrorMsg(err.message || "Login failed. Check your credentials.");
      }
    }
  };

  const handleOfficialSubmit = (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!officialId.trim() || !password) {
      setErrorMsg("Please provide your Official ID and password.");
      return;
    }

    setLoading(true);
    try {
      loginOfficial(officialId, password);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setErrorMsg(err.message || "Official authentication failed.");
    }
  };

  const handleTouristSubmit = (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (touristTab === "register") {
      if (!passportId.trim() || !name.trim() || !email.trim() || !password) {
        setErrorMsg("Please fill in all required visitor fields.");
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg("Passwords do not match.");
        return;
      }
      setLoading(true);
      try {
        registerTourist({
          passportId,
          name,
          email,
          country,
          password,
          profilePhoto: photoPreview,
        });
        setLoading(false);
      } catch (err) {
        setLoading(false);
        setErrorMsg(err.message || "Visitor registration failed.");
      }
    } else {
      if (!email.trim() || !password) {
        setErrorMsg("Please enter your email/passport and password.");
        return;
      }
      setLoading(true);
      try {
        loginTourist(email, password);
        setLoading(false);
      } catch (err) {
        setLoading(false);
        setErrorMsg(err.message || "Visitor login failed.");
      }
    }
  };

  return (
    <Modal
      isOpen={authModalOpen}
      onClose={() => setAuthModalOpen(false)}
      title={
        <div className="flex items-center gap-2">
          {authModalMode.includes("civilian") && <UserCheck className="w-5 h-5 text-emerald-400" />}
          {authModalMode === "official_login" && <Building2 className="w-5 h-5 text-sky-400" />}
          {authModalMode === "tourist_auth" && <Plane className="w-5 h-5 text-purple-400" />}
          <span>
            {authModalMode === "civilian_register"
              ? "Create Civilian Account"
              : authModalMode === "civilian_login"
              ? "Civilian Sign In"
              : authModalMode === "official_login"
              ? "Civic Official Login"
              : "Tourist / Visitor Account"}
          </span>
        </div>
      }
      subtitle="Authorized Civic Authentication & Session Security"
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        {/* Error Alert */}
        {errorMsg && (
          <div className="flex items-center gap-2 p-3 bg-rose-950/80 border border-rose-800 text-rose-200 rounded-xl text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* 1. Civilian Authentication */}
        {authModalMode.includes("civilian") && (
          <form onSubmit={handleCivilianSubmit} className="space-y-3.5">
            {authModalMode === "civilian_register" && (
              <>
                {/* Photo Upload with Live Preview */}
                <div className="flex items-center gap-4 p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-slate-900 border border-slate-700 flex items-center justify-center flex-shrink-0">
                    {photoPreview ? (
                      <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-6 h-6 text-slate-500" />
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-200 block mb-1">
                      Profile Photo
                    </label>
                    <label className="text-[11px] px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 cursor-pointer font-semibold inline-block">
                      Upload Photo
                      <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoUpload} className="hidden" />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Simoni Shah"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Contact Number *</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="tel"
                      required
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-sky-500"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Gmail / Email *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="simoni@gmail.com"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Password *</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-sky-500"
                />
              </div>
            </div>

            {authModalMode === "civilian_register" && (
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Confirm Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-sky-500"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2 transition"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>{authModalMode === "civilian_register" ? "Create Account" : "Sign In"}</span>
            </button>

            {/* Google OAuth Login button */}
            <div className="pt-2">
              <div className="relative flex items-center justify-center mb-3">
                <div className="border-t border-slate-800 w-full"></div>
                <span className="bg-slate-900 px-2 text-[10px] uppercase text-slate-500 font-mono">or</span>
              </div>

              <button
                type="button"
                onClick={() => loginWithGoogle(UserRole.CIVILIAN)}
                className="w-full py-2 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Continue with Google</span>
              </button>
            </div>

            {/* Switch between Sign In and Register */}
            <div className="text-center pt-2">
              {authModalMode === "civilian_register" ? (
                <p className="text-xs text-slate-400">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setAuthModalMode("civilian_login")}
                    className="text-sky-400 font-bold hover:underline"
                  >
                    Sign In
                  </button>
                </p>
              ) : (
                <p className="text-xs text-slate-400">
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setAuthModalMode("civilian_register")}
                    className="text-sky-400 font-bold hover:underline"
                  >
                    Create Account
                  </button>
                </p>
              )}
            </div>
          </form>
        )}

        {/* 2. Civic Official Authentication */}
        {authModalMode === "official_login" && (
          <form onSubmit={handleOfficialSubmit} className="space-y-4">
            <div className="p-3 rounded-xl bg-sky-950/40 border border-sky-800/60 text-xs text-slate-300">
              <span className="font-bold text-sky-300 block mb-0.5">Municipal Official Portal</span>
              Please sign in using your department provisioned credentials.
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Official ID *</label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={officialId}
                  onChange={(e) => setOfficialId(e.target.value)}
                  placeholder="e.g. OFF-7841"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-100 font-mono placeholder-slate-500 outline-none focus:border-sky-500 uppercase"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Password *</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm shadow-md shadow-sky-600/30 flex items-center justify-center gap-2 transition"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Building2 className="w-4 h-4" />}
              <span>Official Sign In</span>
            </button>
          </form>
        )}

        {/* 3. Tourist / Visitor Authentication */}
        {authModalMode === "tourist_auth" && (
          <div className="space-y-3.5">
            {/* Toggle Sign In / Register */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setTouristTab("register")}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                  touristTab === "register" ? "bg-purple-600 text-white shadow" : "text-slate-400 hover:text-white"
                }`}
              >
                New Tourist Registration
              </button>
              <button
                type="button"
                onClick={() => setTouristTab("login")}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                  touristTab === "login" ? "bg-purple-600 text-white shadow" : "text-slate-400 hover:text-white"
                }`}
              >
                Sign In
              </button>
            </div>

            <form onSubmit={handleTouristSubmit} className="space-y-3">
              {touristTab === "register" ? (
                <>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-300">Passport ID *</label>
                      <span className="text-[10px] text-emerald-400 font-medium">Encrypted & Masked</span>
                    </div>
                    <div className="relative">
                      <FileText className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        required
                        value={passportId}
                        onChange={(e) => setPassportId(e.target.value)}
                        placeholder="e.g. GBR-9482104"
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-100 font-mono placeholder-slate-500 outline-none focus:border-sky-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Elena Rostova"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Country *</label>
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-500"
                    >
                      <option value="United States">United States</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="Canada">Canada</option>
                      <option value="Australia">Australia</option>
                      <option value="Germany">Germany</option>
                      <option value="France">France</option>
                      <option value="Japan">Japan</option>
                      <option value="India">India</option>
                    </select>
                  </div>
                </>
              ) : null}

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  {touristTab === "register" ? "Gmail / Email *" : "Email or Passport ID *"}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="elena@gmail.com"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              {touristTab === "register" && (
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Confirm Password *</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-sky-500"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-md shadow-purple-600/30 flex items-center justify-center gap-2 transition"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plane className="w-4 h-4" />}
                <span>{touristTab === "register" ? "Create Visitor Account" : "Sign In as Visitor"}</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </Modal>
  );
}
