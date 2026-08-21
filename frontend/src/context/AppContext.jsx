import React, { createContext, useContext, useState, useEffect } from "react";
import { BASE_URL } from "../api/client";

const AppContext = createContext();

export function AppProvider({ children }) {
  const [activeTab, setActiveTab] = useState("citizen"); // 'citizen' | 'dashboard' | 'analytics'
  const [citizenSubTab, setCitizenSubTab] = useState("report"); // 'report' | 'track'
  const [selectedDepartment, setSelectedDepartment] = useState("Roads & Infrastructure");
  const [activeTrackingId, setActiveTrackingId] = useState("");
  const [demoMode, setDemoMode] = useState(false);
  const [backendOnline, setBackendOnline] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Check Backend health on mount
  useEffect(() => {
    async function checkBackend() {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        const res = await fetch(`${BASE_URL}/dashboard/departments`, {
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (res.ok) {
          setBackendOnline(true);
        } else {
          setBackendOnline(false);
        }
      } catch (err) {
        setBackendOnline(false);
      }
    }
    checkBackend();
  }, []);

  const showToast = (message, type = "info") => {
    setToastMessage({ message, type, id: Date.now() });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const navigateToTrack = (complaintId) => {
    setActiveTab("citizen");
    setCitizenSubTab("track");
    setActiveTrackingId(complaintId);
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        citizenSubTab,
        setCitizenSubTab,
        selectedDepartment,
        setSelectedDepartment,
        activeTrackingId,
        setActiveTrackingId,
        demoMode,
        setDemoMode,
        backendOnline,
        toastMessage,
        showToast,
        navigateToTrack,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
