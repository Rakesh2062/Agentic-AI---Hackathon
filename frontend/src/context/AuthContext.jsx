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
  }
];

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

  // Civilian Login
  const loginCivilian = (email, password) => {
    const user = registeredAccounts.find(
      (u) => u.role === UserRole.CIVILIAN && u.email.toLowerCase() === email.trim().toLowerCase()
    );

    if (!user) {
      throw new Error("No civilian account found with this email. Please register first.");
    }
    if (user.password !== password) {
      throw new Error("Incorrect password. Please verify your credentials.");
    }

    const levelInfo = getCivicLevel(user.civicPoints || 0);
    const authedUser = { ...user, civicLevel: levelInfo.title };
    setCurrentUser(authedUser);
    setAuthModalOpen(false);
    return authedUser;
  };

  // Civilian Registration
  const registerCivilian = (userData) => {
    const existing = registeredAccounts.find(
      (u) => u.email.toLowerCase() === userData.email.trim().toLowerCase()
    );
    if (existing) {
      throw new Error("An account with this email address already exists. Please sign in.");
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
    const existing = registeredAccounts.find(
      (u) => u.email.toLowerCase() === userData.email.trim().toLowerCase() ||
             (userData.passportId && u.passportId === userData.passportId.trim())
    );
    if (existing) {
      // If already exists and password matches, log in
      if (existing.password === userData.password) {
        setCurrentUser(existing);
        setAuthModalOpen(false);
        return existing;
      }
      throw new Error("A visitor account with this email/passport already exists.");
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
    };

    setRegisteredAccounts((prev) => [newTourist, ...prev]);
    setCurrentUser(newTourist);
    setAuthModalOpen(false);
    return newTourist;
  };

  const loginTourist = (emailOrPassport, password) => {
    const user = registeredAccounts.find(
      (u) => u.role === UserRole.TOURIST && (
        u.email.toLowerCase() === emailOrPassport.trim().toLowerCase() ||
        (u.passportId && u.passportId.toLowerCase() === emailOrPassport.trim().toLowerCase())
      )
    );

    if (!user) {
      throw new Error("No visitor account found with this email or passport. Please register first.");
    }
    if (user.password !== password) {
      throw new Error("Incorrect password.");
    }

    setCurrentUser(user);
    setAuthModalOpen(false);
    return user;
  };

  // Google OAuth Login Simulation
  const loginWithGoogle = (role = UserRole.CIVILIAN) => {
    // If real Google Client ID is configured in env, frontend can invoke Google OAuth
    const googleEmail = role === UserRole.TOURIST ? "tourist.google@gmail.com" : "simoni.google@gmail.com";
    let user = registeredAccounts.find((u) => u.email === googleEmail);
    if (!user) {
      user = {
        id: `usr_g_${Date.now()}`,
        name: role === UserRole.TOURIST ? "Elena Rostova (Google)" : "Simoni Shah",
        email: googleEmail,
        contact: "+91 98765 43210",
        role: role,
        profilePhoto: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80",
        civicPoints: role === UserRole.TOURIST ? 20 : 420,
        civicLevel: role === UserRole.TOURIST ? "Civic Starter" : "Community Champion",
        trustScore: 96,
        memberSince: new Date().toISOString().split("T")[0],
        reportsSubmitted: 18,
        reportsValidated: 14,
        issuesResolved: 11,
        city: "Metro Central",
      };
      setRegisteredAccounts((prev) => [user, ...prev]);
    }
    setCurrentUser(user);
    setAuthModalOpen(false);
    return user;
  };

  // Logout: Completely clears session, token, and cached states
  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem("civicpulse_active_user");
  };

  // Update Profile (Name, Contact, Photo, Password)
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

  // Official Validates Complaint & Awards Points to reporting citizen
  const awardCivicPoints = (targetUserId, points, reason, caseTitle) => {
    setRegisteredAccounts((prev) =>
      prev.map((u) => {
        if (u.id === targetUserId) {
          const nextPts = (u.civicPoints || 0) + points;
          const levelInfo = getCivicLevel(nextPts);
          return {
            ...u,
            civicPoints: nextPts,
            civicLevel: levelInfo.title,
            reportsValidated: (u.reportsValidated || 0) + 1,
          };
        }
        return u;
      })
    );

    if (currentUser && currentUser.id === targetUserId) {
      const nextPoints = (currentUser.civicPoints || 0) + points;
      const levelInfo = getCivicLevel(nextPoints);
      const updatedUser = {
        ...currentUser,
        civicPoints: nextPoints,
        civicLevel: levelInfo.title,
        reportsValidated: (currentUser.reportsValidated || 0) + 1,
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
