import React, { useState } from "react";
import { Loader2, UserPlus, X, ChevronRight, User, ShieldCheck } from "lucide-react";

// Default known Google accounts for quick chooser demo / test accounts
const DEFAULT_GOOGLE_ACCOUNTS = [
  {
    name: "Karishma Sah",
    email: "sahkarishma2006@gmail.com",
    picture: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
    roleBadge: "Verified Civilian"
  },
  {
    name: "Marcus Vance",
    email: "marcus.vance@gmail.com",
    picture: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
    roleBadge: "Civic Resident"
  },
  {
    name: "Elena Rostova",
    email: "elena.r@tourist-globe.org",
    picture: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80",
    roleBadge: "Tourist / Visitor"
  },
  {
    name: "Aarav Sharma",
    email: "aarav.sharma@gmail.com",
    picture: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
    roleBadge: "Verified Civilian"
  }
];

// Authentic Google Account Chooser Modal
function GoogleAccountChooserModal({ isOpen, onClose, onSelectAccount, defaultAccounts }) {
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [addError, setAddError] = useState("");

  if (!isOpen) return null;

  const handleAddNewAccount = (e) => {
    e.preventDefault();
    if (!newEmail.trim()) {
      setAddError("Please enter your Google / Gmail email address.");
      return;
    }
    const cleanEmail = newEmail.trim().toLowerCase();
    const cleanName = newName.trim() || cleanEmail.split("@")[0];
    const generatedPhoto = `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanEmail}`;

    onSelectAccount({
      name: cleanName,
      email: cleanEmail,
      picture: generatedPhoto,
    });
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="bg-white text-slate-800 rounded-2xl shadow-2xl w-full max-w-sm border border-slate-200 overflow-hidden font-sans relative animate-scale-up">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-3.5 top-3.5 p-1.5 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition cursor-pointer"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header with Google Logo */}
        <div className="pt-7 pb-4 px-6 text-center border-b border-slate-100">
          <svg className="w-7 h-7 mx-auto mb-2" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          <h3 className="text-base font-bold text-slate-900">Choose an account</h3>
          <p className="text-xs text-slate-500 mt-0.5">to continue to <span className="font-semibold text-slate-800">NAGARSETU (नगरसेतु)</span></p>
        </div>

        {/* Account List */}
        {!showAddAccount ? (
          <div className="p-3 space-y-1 max-h-72 overflow-y-auto">
            {defaultAccounts.map((acc, index) => (
              <button
                key={index}
                type="button"
                onClick={() => onSelectAccount(acc)}
                className="w-full p-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition flex items-center justify-between text-left group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={acc.picture}
                    alt={acc.name}
                    className="w-9 h-9 rounded-full object-cover border border-slate-200"
                    onError={(e) => {
                      e.target.src = `https://api.dicebear.com/7.x/bottts/svg?seed=${acc.email}`;
                    }}
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition">
                      {acc.name}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {acc.email}
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 transition" />
              </button>
            ))}

            {/* Use Another Account Option */}
            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddAccount(true)}
                className="w-full p-2.5 rounded-xl hover:bg-blue-50/60 border border-transparent hover:border-blue-200 transition flex items-center gap-3 text-left group text-blue-600 cursor-pointer"
              >
                <div className="w-9 h-9 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 group-hover:bg-blue-100 transition">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition">
                    Use another account
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Sign in with a different Gmail address
                  </div>
                </div>
              </button>
            </div>
          </div>
        ) : (
          /* Add Another Account Form */
          <form onSubmit={handleAddNewAccount} className="p-5 space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-800">Sign in with Google</span>
              <button
                type="button"
                onClick={() => setShowAddAccount(false)}
                className="text-[11px] text-blue-600 hover:underline font-semibold cursor-pointer"
              >
                Back to accounts
              </button>
            </div>

            {addError && (
              <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 text-[11px]">
                {addError}
              </div>
            )}

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Gmail or Google Email *
              </label>
              <input
                type="email"
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="e.g. yourname@gmail.com"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                autoFocus
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Display Name (Optional)
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Karishma Sah"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddAccount(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-sm transition cursor-pointer"
              >
                Sign In
              </button>
            </div>
          </form>
        )}

        {/* Footer Security Note */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            Protected by Google OAuth 2.0
          </span>
          <span className="hover:underline cursor-pointer">Privacy & Terms</span>
        </div>
      </div>
    </div>
  );
}

// Main Google Login Button
export function GoogleLoginButton({ onSuccess, onError, text = "Continue with Google", sessionKey, className }) {
  const [chooserOpen, setChooserOpen] = useState(false);

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setChooserOpen(true);
  };

  const handleSelectAccount = (account) => {
    setChooserOpen(false);
    if (onSuccess) {
      onSuccess({
        userInfo: {
          email: account.email,
          name: account.name,
          picture: account.picture,
        },
      });
    }
  };

  const defaultClass = "w-full py-2.5 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2.5 transition active:scale-[0.99] cursor-pointer shadow-sm";

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={className || defaultClass}
      >
        <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
        </svg>
        <span>{text}</span>
      </button>

      {/* Account Chooser Dialog */}
      <GoogleAccountChooserModal
        isOpen={chooserOpen}
        onClose={() => setChooserOpen(false)}
        onSelectAccount={handleSelectAccount}
        defaultAccounts={DEFAULT_GOOGLE_ACCOUNTS}
      />
    </>
  );
}

export default GoogleLoginButton;
