import React, { createContext, useContext, useState, useEffect } from "react";
import { UserRole, getCivicLevel } from "../utils/constants";
import { initialClaimedRewards } from "../api/mockData";

const AuthContext = createContext();

// Pre-seeded database of valid accounts for login
const SEED_USERS = [
  {
    id: "usr_civilian_01",
    name: "Simoni Shah",
    email: "simoni@gmail.com",
    contact: "+91 98765 43210",
    password: "password123",
    role: UserRole.CIVILIAN,
    profilePhoto: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
    civicPoints: 420,
    civicLevel: "Community Champion",
    trustScore: 96,
    memberSince: "2025-03-10",
    reportsSubmitted: 18,
    reportsValidated: 14,
    issuesResolved: 11,
    estimatedImpacted: 8400,
    city: "Metro Central (Ward 4)",
    pointHistory: [
      {
        id: "pt_seed_01",
        caseId: "CMP-10245",
        title: "Major Water Pipeline Breach at Central Junction",
        reason: "+50 Critical Priority validated +10 High Public Impact +5 Verified Evidence",
        points: 65,
        date: "Aug 20, 2026",
        timestamp: "2026-08-20T10:30:00.000Z",
        status: "Validated ✓"
      },
      {
        id: "pt_seed_02",
        caseId: "CMP-10198",
        title: "Exposed High-Voltage Cable Near School Bus Stop",
        reason: "+50 Critical public hazard validated +5 Clear Photo Proof",
        points: 55,
        date: "Aug 16, 2026",
        timestamp: "2026-08-16T14:15:00.000Z",
        status: "Validated ✓"
      },
      {
        id: "pt_seed_03",
        caseId: "CMP-10172",
        title: "Blockage in Stormwater Drain on 4th Main Road",
        reason: "+30 High Priority validated +10 Flood Risk Mitigation",
        points: 40,
        date: "Aug 11, 2026",
        timestamp: "2026-08-11T09:45:00.000Z",
        status: "Validated ✓"
      },
      {
        id: "pt_seed_04",
        caseId: "CMP-10088",
        title: "Traffic Signal Failure at Commercial Boulevard",
        reason: "+30 High Priority verified +5 Evidence submitted",
        points: 35,
        date: "Jul 28, 2026",
        timestamp: "2026-07-28T16:20:00.000Z",
        status: "Validated ✓"
      }
    ]
  },
  {
    id: "usr_official_01",
    officialId: "OFF-7841",
    name: "Officer Sarah Chen",
    email: "sarah.chen@civicpulse.gov",
    contact: "+1 (555) 912-3841",
    password: "official123",
    role: UserRole.CIVIC_OFFICIAL,
    department: "Roads & Infrastructure",
    profilePhoto: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80",
    trustScore: 99,
    memberSince: "2024-01-15",
    reportsValidated: 142,
    issuesResolved: 98,
    civicPoints: 0,
    pointHistory: []
  },
  {
    id: "usr_tourist_01",
    passportId: "GBR-9482104",
    name: "Elena Rostova",
    email: "elena@gmail.com",
    country: "United Kingdom",
    contact: "+44 7700 900142",
    password: "tourist123",
    role: UserRole.TOURIST,
    profilePhoto: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80",
    civicPoints: 80,
    civicLevel: "Civic Contributor",
    trustScore: 98,
    memberSince: "2026-08-18",
    reportsSubmitted: 3,
    reportsValidated: 2,
    issuesResolved: 2,
    estimatedImpacted: 1200,
    pointHistory: [
      {
        id: "pt_seed_t01",
        caseId: "CMP-10310",
        title: "Broken Safety Railing on Heritage Walking Bridge",
        reason: "+30 High Priority tourist route issue +10 Public Safety Bonus +5 Photo Evidence",
        points: 45,
        date: "Aug 19, 2026",
        timestamp: "2026-08-19T11:00:00.000Z",
        status: "Validated ✓"
      },
      {
        id: "pt_seed_t02",
        caseId: "CMP-10280",
        title: "Damaged Multilingual Signpost Near Old Town Museum",
        reason: "+30 Tourist Route Accessibility validated +5 Photo Proof",
        points: 35,
        date: "Aug 18, 2026",
        timestamp: "2026-08-18T15:30:00.000Z",
        status: "Validated ✓"
      }
    ]
  }
];

// Helper function for phone normalization
function normalizePhone(str) {
  if (!str) return "";
  return str.replace(/\D/g, "");
}

// Robust identifier matcher for Email, Mobile Number, Passport ID, and Official ID
function matchUserIdentifier(user, identifier) {
  if (!user || !identifier) return false;
  const rawInput = identifier.trim();
  const lowerInput = rawInput.toLowerCase();

  // 1. Exact Email Match
  if (user.email && user.email.toLowerCase() === lowerInput) {
    return true;
  }

  // 2. Official ID Match
  if (user.officialId && user.officialId.toLowerCase() === lowerInput) {
    return true;
  }

  // 3. Passport ID Match
  if (user.passportId && user.passportId.toLowerCase() === lowerInput) {
    return true;
  }

  // 4. Contact / Mobile Number Match (handles country codes, +91, spaces, dashes)
  if (user.contact) {
    const userDigits = normalizePhone(user.contact);
    const inputDigits = normalizePhone(rawInput);

    if (inputDigits.length >= 7 && userDigits.length >= 7) {
      if (userDigits === inputDigits) return true;
      if (userDigits.endsWith(inputDigits) || inputDigits.endsWith(userDigits)) {
        return true;
      }
    }
  }

  return false;
}

export function AuthProvider({ children }) {
  // Accounts registered in this browser session or localStorage
  const [registeredAccounts, setRegisteredAccounts] = useState(() => {
    try {
      const saved = localStorage.getItem("civicpulse_registered_users");
      return saved ? JSON.parse(saved) : SEED_USERS;
    } catch (e) {
      return SEED_USERS;
    }
  });

  // Current authenticated user
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem("civicpulse_active_user");
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [claimedRewards, setClaimedRewards] = useState(() => {
    try {
      const saved = localStorage.getItem("civicpulse_claimed_rewards");
      return saved ? JSON.parse(saved) : initialClaimedRewards;
    } catch (e) {
      return initialClaimedRewards;
    }
  });

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState("civilian_login"); // 'civilian_login' | 'civilian_register' | 'official_login' | 'tourist_auth'
  const [pointAwardNotification, setPointAwardNotification] = useState(null);

  useEffect(() => {
    localStorage.setItem("civicpulse_registered_users", JSON.stringify(registeredAccounts));
  }, [registeredAccounts]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem("civicpulse_active_user", JSON.stringify(currentUser));
    } else {
      localStorage.removeItem("civicpulse_active_user");
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem("civicpulse_claimed_rewards", JSON.stringify(claimedRewards));
  }, [claimedRewards]);

  // Civilian Login by Email OR Contact/Mobile Number
  const loginCivilian = (identifier, password) => {
    if (!identifier || !password) {
      throw new Error("Please enter your email or contact number and password.");
    }

    const user = registeredAccounts.find(
      (u) => u.role === UserRole.CIVILIAN && matchUserIdentifier(u, identifier)
    );

    if (!user) {
      throw new Error("No civilian account found with this email or mobile number. Please register first.");
    }
    if (user.password !== password) {
      throw new Error("Incorrect password. Please verify your credentials.");
    }

    const levelInfo = getCivicLevel(user.civicPoints || 0);
    const authedUser = { ...user, civicLevel: levelInfo.title, pointHistory: user.pointHistory || [] };
    setCurrentUser(authedUser);
    setAuthModalOpen(false);
    return authedUser;
  };

  // Civilian Registration
  const registerCivilian = (userData) => {
    const existingEmail = registeredAccounts.find(
      (u) => u.role === UserRole.CIVILIAN && u.email.toLowerCase() === userData.email.trim().toLowerCase()
    );
    if (existingEmail) {
      throw new Error("An account with this email address already exists. Please sign in.");
    }

    if (userData.contact?.trim()) {
      const existingContact = registeredAccounts.find(
        (u) => u.role === UserRole.CIVILIAN && matchUserIdentifier(u, userData.contact)
      );
      if (existingContact) {
        throw new Error("An account with this contact number already exists. Please sign in.");
      }
    }

    const levelInfo = getCivicLevel(0);
    const newUser = {
      id: `usr_civ_${Date.now()}`,
      name: userData.name.trim(),
      email: userData.email.trim(),
      contact: userData.contact?.trim() || "",
      password: userData.password,
      role: UserRole.CIVILIAN,
      profilePhoto: userData.profilePhoto || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
      civicPoints: 0,
      civicLevel: levelInfo.title,
      trustScore: 95,
      memberSince: new Date().toISOString().split("T")[0],
      reportsSubmitted: 0,
      reportsValidated: 0,
      issuesResolved: 0,
      estimatedImpacted: 0,
      city: userData.city || "Metro Central",
      pointHistory: [],
    };

    setRegisteredAccounts((prev) => [newUser, ...prev]);
    setCurrentUser(newUser);
    setAuthModalOpen(false);
    return newUser;
  };

  // Civic Official Login (No public registration)
  const loginOfficial = (officialId, password) => {
    const user = registeredAccounts.find(
      (u) => u.role === UserRole.CIVIC_OFFICIAL && (
        (u.officialId && u.officialId.toLowerCase() === officialId.trim().toLowerCase()) ||
        u.email.toLowerCase() === officialId.trim().toLowerCase()
      )
    );

    if (!user) {
      throw new Error("Official ID not recognized. Official accounts are managed by municipal administration.");
    }
    if (user.password !== password) {
      throw new Error("Invalid official credentials. Access denied.");
    }

    setCurrentUser(user);
    setAuthModalOpen(false);
    return user;
  };

  // Tourist Registration & Login
  const registerTourist = (userData) => {
    const existingEmail = registeredAccounts.find(
      (u) => u.role === UserRole.TOURIST && u.email.toLowerCase() === userData.email.trim().toLowerCase()
    );
    if (existingEmail) {
      throw new Error("A visitor account with this email already exists. Please sign in.");
    }

    if (userData.passportId?.trim()) {
      const existingPassport = registeredAccounts.find(
        (u) => u.role === UserRole.TOURIST && u.passportId?.toLowerCase() === userData.passportId.trim().toLowerCase()
      );
      if (existingPassport) {
        throw new Error("A visitor account with this passport ID already exists. Please sign in.");
      }
    }

    if (userData.contact?.trim()) {
      const existingContact = registeredAccounts.find(
        (u) => u.role === UserRole.TOURIST && matchUserIdentifier(u, userData.contact)
      );
      if (existingContact) {
        throw new Error("A visitor account with this contact number already exists. Please sign in.");
      }
    }

    const levelInfo = getCivicLevel(0);
    const newTourist = {
      id: `usr_tourist_${Date.now()}`,
      passportId: userData.passportId.trim(),
      name: userData.name.trim(),
      email: userData.email.trim(),
      country: userData.country || "International",
      contact: userData.contact?.trim() || "",
      password: userData.password,
      role: UserRole.TOURIST,
      profilePhoto: userData.profilePhoto || "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80",
      civicPoints: 0,
      civicLevel: levelInfo.title,
      trustScore: 98,
      memberSince: new Date().toISOString().split("T")[0],
      reportsSubmitted: 0,
      reportsValidated: 0,
      issuesResolved: 0,
      estimatedImpacted: 0,
      pointHistory: [],
    };

    setRegisteredAccounts((prev) => [newTourist, ...prev]);
    setCurrentUser(newTourist);
    setAuthModalOpen(false);
    return newTourist;
  };

  // Tourist Login by Email, Contact/Mobile Number, or Passport ID
  const loginTourist = (identifier, password) => {
    if (!identifier || !password) {
      throw new Error("Please enter your email, mobile number, or passport ID and password.");
    }

    const user = registeredAccounts.find(
      (u) => u.role === UserRole.TOURIST && matchUserIdentifier(u, identifier)
    );

    if (!user) {
      throw new Error("No visitor account found with this email, mobile number, or passport. Please register first.");
    }
    if (user.password !== password) {
      throw new Error("Incorrect password. Please verify your credentials.");
    }

    const levelInfo = getCivicLevel(user.civicPoints || 0);
    const authedUser = { ...user, civicLevel: levelInfo.title, pointHistory: user.pointHistory || [] };
    setCurrentUser(authedUser);
    setAuthModalOpen(false);
    return authedUser;
  };

  // Helper: Decode Google JWT ID Token (base64url payload)
  const decodeGoogleJwt = (credential) => {
    try {
      const payload = credential.split(".")[1];
      const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
      const jsonStr = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      return JSON.parse(jsonStr);
    } catch (e) {
      console.error("Failed to decode Google credential:", e);
      return null;
    }
  };

  // Real Google OAuth Login — receives response from GoogleLogin component
  const loginWithGoogle = (response, role = UserRole.CIVILIAN) => {
    let googleEmail, googleName, googlePhoto;

    if (response?.userInfo) {
      // Implicit flow — userInfo was fetched from Google's userinfo endpoint
      const info = response.userInfo;
      googleEmail = (info.email || "").toLowerCase();
      googleName = info.name || info.email?.split("@")[0] || "Google User";
      googlePhoto = info.picture || "";
    } else if (response?.credential) {
      // One Tap / Popup flow — decode the JWT
      const decoded = decodeGoogleJwt(response.credential);
      if (!decoded || !decoded.email) {
        throw new Error("Could not decode Google account information.");
      }
      googleEmail = decoded.email.toLowerCase();
      googleName = decoded.name || decoded.email.split("@")[0];
      googlePhoto = decoded.picture || "";
    } else {
      throw new Error("Google authentication failed. No credential received.");
    }

    if (!googleEmail) {
      throw new Error("Could not retrieve email from Google account.");
    }

    // Check if an account with this email already exists for THIS role
    let user = registeredAccounts.find(
      (u) => u.email.toLowerCase() === googleEmail && u.role === role
    );

    if (user) {
      // Existing account found for this role — log in directly
      const levelInfo = getCivicLevel(user.civicPoints || 0);
      const authedUser = { ...user, civicLevel: levelInfo.title, pointHistory: user.pointHistory || [] };
      setCurrentUser(authedUser);
      setAuthModalOpen(false);
      return authedUser;
    }

    // Check if email exists under a DIFFERENT role (don't block, just create new role profile)
    const levelInfo = getCivicLevel(0);
    const newUser = {
      id: `usr_g_${Date.now()}`,
      name: googleName,
      email: googleEmail,
      contact: "",
      role: role,
      profilePhoto: googlePhoto || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
      civicPoints: 0,
      civicLevel: levelInfo.title,
      trustScore: 95,
      memberSince: new Date().toISOString().split("T")[0],
      reportsSubmitted: 0,
      reportsValidated: 0,
      issuesResolved: 0,
      estimatedImpacted: 0,
      city: "Metro Central",
      googleLinked: true,
      pointHistory: [],
      ...(role === UserRole.TOURIST ? { passportId: `GOOG-${Date.now()}`, country: "International" } : {}),
    };

    setRegisteredAccounts((prev) => [newUser, ...prev]);
    setCurrentUser(newUser);
    setAuthModalOpen(false);
    return newUser;
  };

  // Logout: Completely clears session, token, and cached Google OAuth states.
  const logout = () => {
    const lastGoogleToken = sessionStorage.getItem("civicpulse_google_access_token");
    if (lastGoogleToken) {
      fetch(`https://oauth2.googleapis.com/revoke?token=${lastGoogleToken}`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }).catch(() => {});
      sessionStorage.removeItem("civicpulse_google_access_token");
    }

    try {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.disableAutoSelect();
      }
    } catch (_) {}

    setCurrentUser(null);
    localStorage.removeItem("civicpulse_active_user");
  };

  // Update Profile (Name, Contact, Photo, Password, Country)
  const updateUserProfile = (updates) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...updates };
    if (updated.civicPoints !== undefined) {
      const levelInfo = getCivicLevel(updated.civicPoints);
      updated.civicLevel = levelInfo.title;
    }
    setCurrentUser(updated);

    // Sync in registered accounts store
    setRegisteredAccounts((prev) =>
      prev.map((u) => (u.id === updated.id ? updated : u))
    );
  };

  // Record a newly filed complaint in user stats
  const recordComplaintSubmitted = (userId) => {
    if (!userId) return;
    setRegisteredAccounts((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          return {
            ...u,
            reportsSubmitted: (u.reportsSubmitted || 0) + 1,
          };
        }
        return u;
      })
    );

    if (currentUser && currentUser.id === userId) {
      setCurrentUser((prev) =>
        prev
          ? {
              ...prev,
              reportsSubmitted: (prev.reportsSubmitted || 0) + 1,
            }
          : prev
      );
    }
  };

  // Official Validates Complaint & Awards Points to reporting citizen
  // Enforces:
  // 1. Civic Officials NEVER earn civic points
  // 2. Prevent duplicate points if the same caseId is validated again
  // 3. Creates a real itemized point transaction in the user's pointHistory
  const awardCivicPoints = (targetUserId, points, reason, caseTitle, caseId) => {
    if (!targetUserId || !points) return;

    const newTransaction = {
      id: `pt_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      caseId: caseId || "CMP-VALIDATED",
      title: caseTitle || "Validated Civic Incident Report",
      reason: reason || "Official municipal verification and triage",
      points: Number(points),
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      timestamp: new Date().toISOString(),
      status: "Validated ✓",
    };

    setRegisteredAccounts((prev) =>
      prev.map((u) => {
        if (u.id === targetUserId) {
          // Civic officials do not earn civic points
          if (u.role === UserRole.CIVIC_OFFICIAL) return u;

          const history = u.pointHistory || [];
          // Prevent duplicate points if this caseId was already awarded
          if (caseId && history.some((tx) => tx.caseId === caseId)) {
            return u;
          }

          const nextPts = (u.civicPoints || 0) + points;
          const levelInfo = getCivicLevel(nextPts);
          return {
            ...u,
            civicPoints: nextPts,
            civicLevel: levelInfo.title,
            reportsValidated: (u.reportsValidated || 0) + 1,
            estimatedImpacted: (u.estimatedImpacted || 0) + (points * 20),
            pointHistory: [newTransaction, ...history],
          };
        }
        return u;
      })
    );

    if (currentUser && currentUser.id === targetUserId && currentUser.role !== UserRole.CIVIC_OFFICIAL) {
      const history = currentUser.pointHistory || [];
      // Prevent duplicate if already awarded
      if (caseId && history.some((tx) => tx.caseId === caseId)) {
        return;
      }

      const nextPoints = (currentUser.civicPoints || 0) + points;
      const levelInfo = getCivicLevel(nextPoints);
      const updatedUser = {
        ...currentUser,
        civicPoints: nextPoints,
        civicLevel: levelInfo.title,
        reportsValidated: (currentUser.reportsValidated || 0) + 1,
        estimatedImpacted: (currentUser.estimatedImpacted || 0) + (points * 20),
        pointHistory: [newTransaction, ...history],
      };
      setCurrentUser(updatedUser);

      setPointAwardNotification({
        points,
        reason,
        caseTitle: caseTitle || "Civic Incident Report",
        newTotal: nextPoints,
        id: Date.now(),
      });
      setTimeout(() => setPointAwardNotification(null), 6000);
    }
  };

  // Claim Reward from Benefits Wallet
  const claimReward = (reward) => {
    if (!currentUser) throw new Error("Please log in to claim rewards.");
    const userPoints = currentUser.civicPoints || 0;
    if (userPoints < reward.pointsRequired) {
      throw new Error(`Insufficient points. You need ${reward.pointsRequired} points but have ${userPoints}.`);
    }

    const code = `CIVIC-${(reward.type || "PERK").toUpperCase()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    const claimEntry = {
      id: `clm_${Date.now()}`,
      rewardId: reward.id,
      title: reward.title,
      code,
      claimedAt: new Date().toISOString(),
      partner: reward.partner,
      type: reward.type,
      pointsSpent: reward.pointsRequired,
    };

    setClaimedRewards((prev) => [claimEntry, ...prev]);
    return { ...reward, voucherCode: code };
  };

  const isOfficial = currentUser?.role === UserRole.CIVIC_OFFICIAL;
  const isCivilian = currentUser?.role === UserRole.CIVILIAN;
  const isTourist = currentUser?.role === UserRole.TOURIST;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        role: currentUser?.role || null,
        isOfficial,
        isCivilian,
        isTourist,
        claimedRewards,
        claimReward,
        authModalOpen,
        setAuthModalOpen,
        authModalMode,
        setAuthModalMode,
        pointAwardNotification,
        setPointAwardNotification,
        loginCivilian,
        registerCivilian,
        loginOfficial,
        registerTourist,
        loginTourist,
        loginWithGoogle,
        logout,
        updateUserProfile,
        recordComplaintSubmitted,
        awardCivicPoints,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
