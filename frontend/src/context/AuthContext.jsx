import React, { createContext, useContext, useState, useEffect } from "react";
import { UserRole, getCivicLevel } from "../utils/constants";
import { apiClient } from "../api/client";

const AuthContext = createContext();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function normalizePhone(str) {
  if (!str) return "";
  return str.replace(/\D/g, "");
}

// ---------------------------------------------------------------------------
// AuthProvider
// ---------------------------------------------------------------------------
export function AuthProvider({ children }) {
  // Current authenticated user — persisted across browser refreshes
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
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState("civilian_login");
  const [pointAwardNotification, setPointAwardNotification] = useState(null);

  // Persist active user to localStorage
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

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  function applyLevelInfo(user) {
    if (!user) return user;
    const levelInfo = getCivicLevel(user.civicPoints || 0);
    return { ...user, civicLevel: levelInfo.title, pointHistory: user.pointHistory || [] };
  }

  // ---------------------------------------------------------------------------
  // Civilian Login — backend call
  // ---------------------------------------------------------------------------
  const loginCivilian = async (identifier, password) => {
    if (!identifier || !password) {
      throw new Error("Please enter your email or contact number and password.");
    }
    const user = await apiClient("/auth/login", {
      method: "POST",
      body: JSON.stringify({ identifier, password, role: "civilian" }),
    });
    const authed = applyLevelInfo(user);
    setCurrentUser(authed);
    setAuthModalOpen(false);
    return authed;
  };

  // ---------------------------------------------------------------------------
  // Civilian Registration — backend call
  // ---------------------------------------------------------------------------
  const registerCivilian = async (userData) => {
    const newUser = await apiClient("/auth/register/civilian", {
      method: "POST",
      body: JSON.stringify({
        name: userData.name,
        email: userData.email,
        password: userData.password,
        contact: userData.contact || "",
        city: userData.city || "Metro Central",
        profilePhoto: userData.profilePhoto || "",
      }),
    });
    const authed = applyLevelInfo(newUser);
    setCurrentUser(authed);
    setAuthModalOpen(false);
    return authed;
  };

  // ---------------------------------------------------------------------------
  // Official Login — backend call
  // ---------------------------------------------------------------------------
  const loginOfficial = async (officialId, password) => {
    if (!officialId || !password) {
      throw new Error("Please enter your Official ID or email and password.");
    }
    const user = await apiClient("/auth/login", {
      method: "POST",
      body: JSON.stringify({ identifier: officialId, password, role: "official" }),
    });
    setCurrentUser(user);
    setAuthModalOpen(false);
    return user;
  };

  // ---------------------------------------------------------------------------
  // Tourist Registration — backend call
  // ---------------------------------------------------------------------------
  const registerTourist = async (userData) => {
    const newUser = await apiClient("/auth/register/tourist", {
      method: "POST",
      body: JSON.stringify({
        name: userData.name,
        email: userData.email,
        password: userData.password,
        passportId: userData.passportId,
        country: userData.country || "International",
        contact: userData.contact || "",
        profilePhoto: userData.profilePhoto || "",
      }),
    });
    const authed = applyLevelInfo(newUser);
    setCurrentUser(authed);
    setAuthModalOpen(false);
    return authed;
  };

  // ---------------------------------------------------------------------------
  // Tourist Login — backend call
  // ---------------------------------------------------------------------------
  const loginTourist = async (identifier, password) => {
    if (!identifier || !password) {
      throw new Error("Please enter your email, mobile number, or passport ID and password.");
    }
    const user = await apiClient("/auth/login", {
      method: "POST",
      body: JSON.stringify({ identifier, password, role: "tourist" }),
    });
    const authed = applyLevelInfo(user);
    setCurrentUser(authed);
    setAuthModalOpen(false);
    return authed;
  };

  // ---------------------------------------------------------------------------
  // Google OAuth Login — stores/retrieves user in DB
  // ---------------------------------------------------------------------------
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

  const loginWithGoogle = async (response, role = UserRole.CIVILIAN) => {
    let googleEmail, googleName, googlePhoto;

    if (response?.userInfo) {
      const info = response.userInfo;
      googleEmail = (info.email || "").toLowerCase();
      googleName = info.name || info.email?.split("@")[0] || "Google User";
      googlePhoto = info.picture || "";
    } else if (response?.credential) {
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

    if (!googleEmail) throw new Error("Could not retrieve email from Google account.");

    // Try login first, fall back to registration
    const backendRole = role === UserRole.CIVIC_OFFICIAL ? "official" : role === UserRole.TOURIST ? "tourist" : "civilian";

    try {
      const user = await apiClient("/auth/login", {
        method: "POST",
        body: JSON.stringify({ identifier: googleEmail, password: `google_${googleEmail}`, role: backendRole }),
      });
      const authed = applyLevelInfo(user);
      setCurrentUser(authed);
      setAuthModalOpen(false);
      return authed;
    } catch (loginErr) {
      // Account doesn't exist — register it
      let newUser;
      if (backendRole === "tourist") {
        newUser = await apiClient("/auth/register/tourist", {
          method: "POST",
          body: JSON.stringify({
            name: googleName,
            email: googleEmail,
            password: `google_${googleEmail}`,
            passportId: `GOOG-${Date.now()}`,
            country: "International",
            profilePhoto: googlePhoto,
          }),
        });
      } else {
        newUser = await apiClient("/auth/register/civilian", {
          method: "POST",
          body: JSON.stringify({
            name: googleName,
            email: googleEmail,
            password: `google_${googleEmail}`,
            profilePhoto: googlePhoto,
          }),
        });
      }
      const authed = applyLevelInfo(newUser);
      setCurrentUser(authed);
      setAuthModalOpen(false);
      return authed;
    }
  };

  // ---------------------------------------------------------------------------
  // Logout
  // ---------------------------------------------------------------------------
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

  // ---------------------------------------------------------------------------
  // Update Profile — backend call + local state sync
  // ---------------------------------------------------------------------------
  const updateUserProfile = async (updates) => {
    if (!currentUser) return;
    try {
      const updatedUser = await apiClient(`/auth/user/${currentUser.id}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      });
      const authed = applyLevelInfo(updatedUser);
      setCurrentUser(authed);
    } catch (err) {
      // Fallback: update only local state if backend fails
      const updated = { ...currentUser, ...updates };
      if (updated.civicPoints !== undefined) {
        const levelInfo = getCivicLevel(updated.civicPoints);
        updated.civicLevel = levelInfo.title;
      }
      setCurrentUser(updated);
    }
  };

  // ---------------------------------------------------------------------------
  // Record a filed complaint in user stats (local optimistic update)
  // ---------------------------------------------------------------------------
  const recordComplaintSubmitted = (userId) => {
    if (!userId || !currentUser || currentUser.id !== userId) return;
    setCurrentUser((prev) =>
      prev ? { ...prev, reportsSubmitted: (prev.reportsSubmitted || 0) + 1 } : prev
    );
  };

  // ---------------------------------------------------------------------------
  // Award Civic Points — backend call + local state sync
  // ---------------------------------------------------------------------------
  const awardCivicPoints = async (targetUserId, points, reason, caseTitle, caseId) => {
    if (!targetUserId || !points) return;

    try {
      const result = await apiClient(`/auth/user/${targetUserId}/award-points`, {
        method: "POST",
        body: JSON.stringify({ points, reason, caseTitle, caseId }),
      });

      // If the currently logged-in user is the one receiving points, update local state
      if (currentUser && currentUser.id === targetUserId && currentUser.role !== UserRole.CIVIC_OFFICIAL) {
        const newTransaction = {
          id: `pt_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          caseId: caseId || "CMP-VALIDATED",
          title: caseTitle || "Validated Civic Incident Report",
          reason: reason || "Official municipal verification",
          points: Number(points),
          date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          timestamp: new Date().toISOString(),
          status: "Validated ✓",
        };

        const history = currentUser.pointHistory || [];
        if (caseId && history.some((tx) => tx.caseId === caseId)) return;

        const nextPoints = (currentUser.civicPoints || 0) + points;
        const levelInfo = getCivicLevel(nextPoints);
        const updatedUser = {
          ...currentUser,
          civicPoints: nextPoints,
          civicLevel: levelInfo.title,
          reportsValidated: (currentUser.reportsValidated || 0) + 1,
          estimatedImpacted: (currentUser.estimatedImpacted || 0) + points * 20,
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
    } catch (err) {
      console.warn("Failed to award points via backend:", err.message);
    }
  };

  // ---------------------------------------------------------------------------
  // Claim Reward (local, no backend needed for demo)
  // ---------------------------------------------------------------------------
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

  // ---------------------------------------------------------------------------
  // Refresh current user from DB (call this after validation to get updated points)
  // ---------------------------------------------------------------------------
  const refreshCurrentUser = async () => {
    if (!currentUser?.id) return;
    try {
      const freshUser = await apiClient(`/auth/user/${currentUser.id}`);
      const authed = applyLevelInfo(freshUser);
      setCurrentUser(authed);
    } catch (err) {
      console.warn("Failed to refresh user from DB:", err.message);
    }
  };

  const isOfficial = currentUser?.role === "official" || currentUser?.role === UserRole.CIVIC_OFFICIAL;
  const isCivilian = currentUser?.role === "civilian" || currentUser?.role === UserRole.CIVILIAN;
  const isTourist = currentUser?.role === "tourist" || currentUser?.role === UserRole.TOURIST;

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
        refreshCurrentUser,
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
