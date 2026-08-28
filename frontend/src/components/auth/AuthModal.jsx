import React, { useState, useRef, useCallback, useEffect } from "react";
import { Modal } from "../common/Modal";
import { CountrySelect } from "../common/CountrySelect";
import { useAuth } from "../../context/AuthContext";
import { UserRole } from "../../utils/constants";
import { GoogleLoginButton } from "./GoogleLoginButton";
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
  FileText,
  Eye,
  EyeOff,
  Sparkles
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
  const [officialId, setOfficialId] = useState("OFF-7841");
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  
  // UI State
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [touristTab, setTouristTab] = useState("register"); // 'register' | 'login'

  const googleSessionRef = useRef(0);
  if (authModalOpen) {
    googleSessionRef.current += 1;
  }
  const googleSessionKey = `google-session-${googleSessionRef.current}`;

  useEffect(() => {
    if (authModalOpen) {
      setName("");
      setEmail("");
      setContact("");
      setPassword("");
      setConfirmPassword("");
      setPassportId("");
      setCountry("United States");
      setOfficialId("OFF-7841");
      setProfilePhoto(null);
      setPhotoPreview(null);
      setShowPassword(false);
      setShowConfirmPassword(false);
      setErrorMsg("");
      setLoading(false);
      setTouristTab("register");
    }
  }, [authModalOpen]);

  if (!authModalOpen) return null;

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

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

  const handleCivilianSubmit = async (e) => {
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
        await registerCivilian({
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
        setErrorMsg("Please enter your email or contact number and password.");
        return;
      }
      setLoading(true);
      try {
        await loginCivilian(email, password);
        setLoading(false);
      } catch (err) {
        setLoading(false);
        setErrorMsg(err.message || "Login failed. Check your credentials.");
      }
    }
  };

  const handleOfficialSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!officialId.trim() || !password) {
      setErrorMsg("Please provide your Official ID and password.");
      return;
    }

    setLoading(true);
    try {
      await loginOfficial(officialId, password);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setErrorMsg(err.message || "Official authentication failed.");
    }
  };

  const handleTouristSubmit = async (e) => {
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
        await registerTourist({
          passportId,
          name,
          email,
          contact,
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
        setErrorMsg("Please enter your email, mobile number, or passport ID and password.");
        return;
      }
      setLoading(true);
      try {
        await loginTourist(email, password);
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
          {authModalMode.includes("civilian") && <UserCheck className="w-5 h-5 text-indigo-600" />}
          {authModalMode === "official_login" && <Building2 className="w-5 h-5 text-violet-600" />}
          {authModalMode === "tourist_auth" && <Plane className="w-5 h-5 text-cyan-600" />}
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
      subtitle="Authorized Municipal Authentication & Session Security"
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        {/* Error Alert */}
        {errorMsg && (
          <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* 1. Civilian Authentication */}
        {authModalMode.includes("civilian") && (
          <form onSubmit={handleCivilianSubmit} className="space-y-3.5" autoComplete="off">
            {authModalMode === "civilian_register" && (
              <>
                {/* Photo Upload with Live Preview */}
                <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center flex-shrink-0 shadow-sm">
                    {photoPreview ? (
                      <img src={photoPreview} alt="Preview" className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      <Camera className="w-5 h-5 text-slate-400" />
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Profile Photo (Optional)
                    </label>
                    <label className="text-[11px] px-3 py-1 bg-white hover:bg-slate-50 text-indigo-600 border border-slate-200 rounded-lg cursor-pointer font-semibold inline-block shadow-sm transition">
                      Choose File
                      <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoUpload} className="hidden" />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Simoni Shah"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Contact Number *</label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="tel"
                      required
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                {authModalMode === "civilian_register" ? "Email / ID *" : "Email or Contact Number *"}
              </label>
              <div className="relative">
                {authModalMode === "civilian_register" ? (
                  <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                ) : (
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                )}
                <input
                  type={authModalMode === "civilian_register" ? "email" : "text"}
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={authModalMode === "civilian_register" ? "simoni@gmail.com" : "simoni@gmail.com or +91 98765 43210"}
                  autoComplete="off"
                  className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Password *</label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete={authModalMode === "civilian_register" ? "new-password" : "current-password"}
                  className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-10 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 transition focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {authModalMode === "civilian_register" && (
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Confirm Password *</label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-10 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 transition focus:outline-none"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs shadow-neon flex items-center justify-center gap-2 transition cursor-pointer"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              <span>{authModalMode === "civilian_register" ? "Create Account" : "Sign In"}</span>
            </button>

            {/* Google OAuth Login */}
            <div className="pt-2">
              <div className="relative flex items-center justify-center mb-3">
                <div className="border-t border-slate-200 w-full"></div>
                <span className="bg-white px-2 text-[9px] uppercase text-slate-400 font-mono">or</span>
              </div>

              <div className="flex justify-center">
                <GoogleLoginButton
                  sessionKey={googleSessionKey}
                  onSuccess={(credentialResponse) => {
                    try {
                      loginWithGoogle(credentialResponse, UserRole.CIVILIAN);
                    } catch (err) {
                      setErrorMsg(err.message || "Google login failed.");
                    }
                  }}
                  onError={(err) => setErrorMsg(err || "Google sign-in was cancelled or failed.")}
                  text="Continue with Google"
                />
              </div>
            </div>

            {/* Switch between Sign In and Register */}
            <div className="text-center pt-2">
              {authModalMode === "civilian_register" ? (
                <p className="text-xs text-slate-500">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setAuthModalMode("civilian_login")}
                    className="text-indigo-600 font-bold hover:underline"
                  >
                    Sign In
                  </button>
                </p>
              ) : (
                <p className="text-xs text-slate-500">
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setAuthModalMode("civilian_register")}
                    className="text-indigo-600 font-bold hover:underline"
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
          <form onSubmit={handleOfficialSubmit} className="space-y-4" autoComplete="off">
            <div className="p-3.5 bg-violet-50 border border-violet-100 rounded-xl text-xs text-violet-900 space-y-1">
              <span className="font-bold text-violet-700 block">Municipal Official Portal</span>
              <p className="text-[11px] text-slate-600">
                Sign in with your Officer ID or Official Email.
              </p>
              <div className="pt-1 text-[10px] text-violet-700 font-mono flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-violet-600" />
                <span>Default Credentials: <strong>OFF-7841</strong> | Password: <strong>admin123</strong></span>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Official ID or Email *</label>
              <div className="relative">
                <KeyRound className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={officialId}
                  onChange={(e) => setOfficialId(e.target.value)}
                  placeholder="OFF-7841 or official@nagarsetu.gov.in"
                  autoComplete="off"
                  className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-mono text-slate-900 placeholder-slate-400 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 uppercase"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Password *</label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-10 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 transition focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs shadow-neon flex items-center justify-center gap-2 transition cursor-pointer"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Building2 className="w-3.5 h-3.5" />}
              <span>Official Sign In</span>
            </button>
          </form>
        )}

        {/* 3. Tourist / Visitor Authentication */}
        {authModalMode === "tourist_auth" && (
          <div className="space-y-3.5">
            {/* Toggle Sign In / Register */}
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setTouristTab("register")}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
                  touristTab === "register" ? "bg-white text-cyan-700 shadow-sm" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Register
              </button>
              <button
                type="button"
                onClick={() => setTouristTab("login")}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
                  touristTab === "login" ? "bg-white text-cyan-700 shadow-sm" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Sign In
              </button>
            </div>

            <form onSubmit={handleTouristSubmit} className="space-y-3" autoComplete="off">
              {touristTab === "register" ? (
                <>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-700">Passport ID *</label>
                      <span className="text-[9px] text-emerald-600 font-mono font-medium">Encrypted &amp; Masked</span>
                    </div>
                    <div className="relative">
                      <FileText className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        required
                        value={passportId}
                        onChange={(e) => setPassportId(e.target.value)}
                        placeholder="e.g. GBR-9482104"
                        autoComplete="off"
                        className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-mono text-slate-900 placeholder-slate-400 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 uppercase"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Elena Rostova"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Country *</label>
                    <CountrySelect
                      value={country}
                      onChange={setCountry}
                      placeholder="Search country..."
                      required
                    />
                  </div>
                </>
              ) : null}

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  {touristTab === "register" ? "Email *" : "Email, Mobile, or Passport ID *"}
                </label>
                <div className="relative">
                  {touristTab === "register" ? (
                    <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  ) : (
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  )}
                  <input
                    type={touristTab === "register" ? "email" : "text"}
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={touristTab === "register" ? "elena@gmail.com" : "elena@gmail.com or GBR-9482104"}
                    autoComplete="off"
                    className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Password *</label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete={touristTab === "register" ? "new-password" : "current-password"}
                    className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-10 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 transition focus:outline-none"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {touristTab === "register" && (
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Confirm Password *</label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-10 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 transition focus:outline-none"
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-neon-cyan flex items-center justify-center gap-2 transition cursor-pointer"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plane className="w-3.5 h-3.5" />}
                <span>{touristTab === "register" ? "Create Visitor Account" : "Sign In as Visitor"}</span>
              </button>
            </form>

            {/* Google OAuth for Tourist */}
            <div className="pt-2">
              <div className="relative flex items-center justify-center mb-3">
                <div className="border-t border-slate-200 w-full"></div>
                <span className="bg-white px-2 text-[9px] uppercase text-slate-400 font-mono">or</span>
              </div>

              <div className="flex justify-center">
                <GoogleLoginButton
                  sessionKey={googleSessionKey}
                  onSuccess={(credentialResponse) => {
                    try {
                      loginWithGoogle(credentialResponse, UserRole.TOURIST);
                    } catch (err) {
                      setErrorMsg(err.message || "Google login failed.");
                    }
                  }}
                  onError={(err) => setErrorMsg(err || "Google sign-in was cancelled or failed.")}
                  text="Continue with Google as Tourist"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
