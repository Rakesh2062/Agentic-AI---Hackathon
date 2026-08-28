import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Bot, User, Send, Paperclip, MapPin, Check, Loader2, Sparkles, X,
  FileText, Camera, AlertCircle, RotateCcw, Plus, Clock, ChevronRight,
  MessageSquare, Trash2
} from "lucide-react";
import { createComplaint, chatWithAgent, uploadFile, saveChatSession, getUserChatSessions, deleteChatSession } from "../../api/endpoints";
import { useAuth } from "../../context/AuthContext";
import { useApp } from "../../context/AppContext";
import { GoogleMapsPicker } from "../common/GoogleMapsPicker";

// ── Constants ─────────────────────────────────────────────────────────────────
const WORKFLOW_STEPS = ["Understand Issue", "Collect Details", "Location", "Review", "Submit"];

const WELCOME_TEXT =
  "Hello! I'm the NAGARSETU AI Agent — your civic intelligence assistant.\n\n" +
  "I can help you:\n" +
  "• Report a civic issue (pothole, garbage, water leakage, streetlights, etc.)\n" +
  "• Attach photo or PDF evidence\n" +
  "• Pick the exact location on a map\n" +
  "• Track your complaint status\n\n" +
  "How can I help you today?";

const QUICK_ACTIONS = [
  "Report a civic issue",
  "Track my complaint",
  "Report a pothole",
  "Report garbage problem",
  "How does NAGARSETU work?",
];

function toStepIndex(state) {
  if (state === "SUCCESS") return 5;
  if (state === "SUBMITTING") return 4;
  if (["REVIEW", "ERROR"].includes(state)) return 3;
  if (["COLLECTING_LOCATION"].includes(state)) return 2;
  if (["COLLECTING_ISSUE", "COLLECTING_EVIDENCE"].includes(state)) return 1;
  return 0;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function makeSession(messages, extractedData, location, attachments, caseId) {
  const firstUser = messages.find((m) => m.role === "user");
  
  let title = "Conversation";
  if (extractedData?.issue_description) {
    title = extractedData.issue_description.slice(0, 45) + (extractedData.issue_description.length > 45 ? "…" : "");
  } else if (extractedData?.category) {
    title = `Report: ${extractedData.category}`;
  } else if (firstUser) {
    title = firstUser.text.slice(0, 45) + (firstUser.text.length > 45 ? "…" : "");
  }

  return {
    id: `session-${Date.now()}`,
    title,
    timestamp: new Date().toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" }),
    messages,
    extractedData,
    location,
    attachments,
    caseId,
  };
}

function freshChatState() {
  return {
    messages: [{ id: "msg-welcome", role: "agent", text: WELCOME_TEXT }],
    extractedData: { issue_description: null, category: null, location_needed: false, evidence_needed: false },
    location: null,
    attachments: [],
    conversationState: "IDLE",
    submittedCaseId: "",
  };
}

// ── Map Modal ─────────────────────────────────────────────────────────────────
function MapModal({ onSelect, onClose }) {
  const [tempLoc, setTempLoc] = useState(null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-slate-900 border border-sky-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
           style={{ maxHeight: "90vh" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-900/80 flex-shrink-0">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-sky-400" />
            <span className="text-sm font-bold text-white">Select Incident Location</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400">Click map or use ⊕ for live location</span>
            <button
              onClick={onClose}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 min-h-0 relative">
          <GoogleMapsPicker
            onLocationSelect={(loc) => setTempLoc(loc)}
            height="h-[60vh]"
            initialLat={20.5937}
            initialLng={78.9629}
          />
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-900 flex justify-between items-center gap-4">
          <div className="text-xs text-slate-400 truncate flex-1">
            {tempLoc ? tempLoc.address : "Move the pin or search to select location..."}
          </div>
          <button
            onClick={() => { if (tempLoc) onSelect(tempLoc); }}
            disabled={!tempLoc}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-sm font-bold transition flex-shrink-0"
          >
            Confirm Location
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export function AIAgentPortal() {
  const { currentUser, isOfficial } = useAuth();
  const { showToast } = useApp();

  // ── Session history (persisted in MongoDB) ──────────────────────
  const [sessionHistory, setSessionHistory] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  // Load sessions from DB on mount / user change
  useEffect(() => {
    if (!currentUser?.id) return;
    setSessionsLoading(true);
    getUserChatSessions(currentUser.id)
      .then((data) => setSessionHistory(data || []))
      .catch(() => {
        // Fallback: load from localStorage if DB unreachable
        const stored = localStorage.getItem(`nagarsetu_chat_history_${currentUser.id}`);
        if (stored) {
          try { setSessionHistory(JSON.parse(stored)); } catch {}
        }
      })
      .finally(() => setSessionsLoading(false));
  }, [currentUser?.id]);

  // Helper: persist a session to DB + update local list
  const persistSession = useCallback(async (session) => {
    if (!currentUser?.id) return session;
    try {
      const result = await saveChatSession({
        userId: currentUser.id,
        sessionId: session.dbId || null,
        title: session.title,
        messages: session.messages,
        extractedData: session.extractedData,
        location: session.location,
        attachments: session.attachments,
        caseId: session.caseId,
      });
      return { ...session, dbId: result.session_id, id: result.session_id };
    } catch {
      // Fallback to localStorage
      localStorage.setItem(`nagarsetu_chat_history_${currentUser.id}`, JSON.stringify(sessionHistory));
      return session;
    }
  }, [currentUser?.id, sessionHistory]);

  // Helper: delete a session from DB + local list
  const handleDeleteSession = useCallback(async (e, session) => {
    e.stopPropagation();
    const dbId = session.dbId || session.id;
    try {
      await deleteChatSession(dbId, currentUser.id);
    } catch {}
    setSessionHistory((prev) => prev.filter((s) => (s.dbId || s.id) !== (session.dbId || session.id)));
    if (activeSessionId === (session.dbId || session.id)) {
      const fresh = freshChatState();
      setMessages(fresh.messages);
      setExtractedData(fresh.extractedData);
      setLocation(null);
      setAttachments([]);
      setConversationState("IDLE");
      setSubmittedCaseId("");
      setActiveSessionId(null);
    }
  }, [currentUser?.id, activeSessionId]);


  // ── Chat state ────────────────────────────────────────────────────────────
  const [messages, setMessages] = useState(freshChatState().messages);
  const [extractedData, setExtractedData] = useState(freshChatState().extractedData);
  const [location, setLocation] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [conversationState, setConversationState] = useState("IDLE");
  const [submittedCaseId, setSubmittedCaseId] = useState("");

  // ── UI state ──────────────────────────────────────────────────────────────
  const [inputText, setInputText] = useState("");
  const [isAgentTyping, setIsAgentTyping] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);

  const scrollContainerRef = useRef(null);
  const fileInputRef = useRef(null);

  // ── Auto-scroll inner container ───────────────────────────────────────────
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, isAgentTyping]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const appendMessage = (role, text, extras = {}) => {
    setMessages((prev) => [
      ...prev,
      { id: `msg-${Date.now()}-${Math.random()}`, role, text, ...extras },
    ]);
  };

  const buildSystemContext = useCallback(
    (locationUpdate = null, attachmentUpdate = []) => {
      const parts = [];
      const loc = locationUpdate ?? location;
      const atts = [...attachments, ...attachmentUpdate];
      if (loc) parts.push(`User has selected a map location: "${loc.address}".`);
      if (atts.length > 0)
        parts.push(`User has attached ${atts.length} file(s): ${atts.map((a) => a.name).join(", ")}.`);
      return parts.length ? `[System: ${parts.join(" ")}]` : "";
    },
    [location, attachments]
  );

  // ── LLM call ─────────────────────────────────────────────────────────────
  const sendToBackend = useCallback(
    async (userText, systemCtx = "", currentMessages = null) => {
      const base = currentMessages ?? messages;
      const updatedMessages = [...base, { role: "user", text: userText }];

      setIsAgentTyping(true);
      try {
        const response = await chatWithAgent({
          messages: updatedMessages.map((m) => ({ role: m.role, text: m.text })),
          extractedData,
          systemContext: systemCtx,
        });

        if (response.extracted_data) {
          setExtractedData((prev) => ({ ...prev, ...response.extracted_data }));
        }

        appendMessage("agent", response.reply);

        if (response.is_ready) {
          setConversationState("REVIEW");
        } else {
          const d = response.extracted_data || {};
          if (d.location_needed) setConversationState("COLLECTING_LOCATION");
          else if (d.evidence_needed) setConversationState("COLLECTING_EVIDENCE");
          else if (d.issue_description) setConversationState("COLLECTING_ISSUE");
          else setConversationState("CHATTING");
        }
      } catch {
        appendMessage("agent", "I'm having trouble connecting right now. Please try again in a moment.");
      } finally {
        setIsAgentTyping(false);
      }
    },
    [messages, extractedData, location]
  );

  // ── Send message ──────────────────────────────────────────────────────────
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    const text = inputText.trim();
    if (!text || isAgentTyping || conversationState === "SUBMITTING") return;
    setInputText("");
    appendMessage("user", text);
    await sendToBackend(text, buildSystemContext());
  };

  // ── Quick actions ─────────────────────────────────────────────────────────
  const handleQuickAction = async (label) => {
    if (isAgentTyping) return;
    appendMessage("user", label);
    await sendToBackend(label, buildSystemContext());
  };

  // ── File attachment ───────────────────────────────────────────────────────
  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (fileInputRef.current) fileInputRef.current.value = "";
    const valid = files.filter((f) => f.type.startsWith("image/") || f.type === "application/pdf");
    if (valid.length < files.length)
      showToast("Some files were skipped (supports JPG, PNG, WEBP, PDF).", "warning");
    if (!valid.length) return;

    showToast(`Uploading ${valid.length} file(s) to server...`, "info");

    // Upload each file to backend immediately to get a stable server URL
    const newItems = [];
    for (const f of valid) {
      try {
        const result = await uploadFile(f);
        const backendBase = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1").replace("/api/v1", "");
        newItems.push({
          name: f.name,
          size: `${(f.size / (1024 * 1024)).toFixed(1)} MB`,
          url: `${backendBase}${result.url}`, // persistent server URL
          type: f.type.startsWith("image/") ? "image" : "document",
        });
      } catch (err) {
        showToast(`Failed to upload ${f.name}: ${err.message}`, "error");
      }
    }
    if (!newItems.length) return;

    setAttachments((prev) => [...prev, ...newItems]);
    appendMessage("user", `Attached ${newItems.length} file(s).`, { attachments: newItems });
    const systemCtx = buildSystemContext(null, newItems);
    await sendToBackend(`I have attached ${newItems.length} file(s) as evidence.`, systemCtx);
    showToast(`${newItems.length} file(s) uploaded successfully!`, "success");
  };

  // ── Map location ──────────────────────────────────────────────────────────
  const handleMapLocationSelect = async (loc) => {
    const locData = {
      lat: loc.lat,
      lng: loc.lng,
      address: loc.address || "Location pinned on map",
      ward: loc.ward || "Unspecified Ward",
      zone: "Municipal Zone",
    };
    setLocation(locData);
    setIsMapOpen(false);
    appendMessage("user", `Location selected: ${locData.address}`);
    const systemCtx = buildSystemContext(locData);
    await sendToBackend(`I have selected the location on the map: ${locData.address}`, systemCtx);
  };

  // ── Submission ────────────────────────────────────────────────────────────
  const handleSubmitComplaint = async () => {
    setConversationState("SUBMITTING");
    appendMessage("agent", "Submitting your complaint to the municipal system...");

    const desc = extractedData.issue_description || "No description provided.";
    const cat = extractedData.category || "other";
    const payload = {
      title: `${cat.charAt(0).toUpperCase() + cat.slice(1)} Issue (AI Intake)`,
      raw_text: desc,
      userId: currentUser?.id || "",
      citizen_name: currentUser?.name || "Citizen",
      citizen_email: currentUser?.email || "",
      location: location || { lat: 0, lng: 0, address: "Location not specified", ward: "Unspecified", zone: "Municipal Zone" },
      attachments: attachments.map(a => a.url),
    };

    try {
      const response = await createComplaint(payload);
      const caseId = response.complaint_id || response.case_id || response._id;
      setSubmittedCaseId(caseId);
      setConversationState("SUCCESS");

      // ── Success message appended — chat is NOT cleared ──────────────────
      appendMessage(
        "agent",
        `✓ Complaint submitted successfully.\n\nComplaint ID: ${caseId}\n\nYour complaint has been registered through NAGARSETU and is now being reviewed by our AI agents. You can track it using this ID in the Citizen Portal.\n\nYou can start a new conversation using the "New Chat" button.`
      );
      showToast(`Complaint ${caseId} submitted!`, "success");

      // Save this session to DB
      const session = makeSession(
        [...messages, { id: `msg-success`, role: "agent", text: `Complaint ${caseId} submitted.` }],
        extractedData, location, attachments, caseId
      );
      const saved = await persistSession(session);
      setSessionHistory((prev) => {
        const filtered = prev.filter((s) => (s.dbId || s.id) !== (saved.dbId || saved.id));
        return [saved, ...filtered];
      });
    } catch (err) {
      setConversationState("ERROR");
      appendMessage("agent", "❌ We could not submit the complaint right now.\n\nYour information has been kept. Please try again using the button below.");
      showToast(err.message || "Submission failed", "error");
    }
  };

  // ── New chat session ──────────────────────────────────────────────────────
  const handleNewChat = async () => {
    if (messages.some((m) => m.role === "user")) {
      const session = makeSession(messages, extractedData, location, attachments, submittedCaseId);
      const saved = await persistSession(session);
      setSessionHistory((prev) => {
        const filtered = prev.filter((s) => (s.dbId || s.id) !== (saved.dbId || saved.id));
        return [saved, ...filtered];
      });
    }
    const fresh = freshChatState();
    setMessages(fresh.messages);
    setExtractedData(fresh.extractedData);
    setLocation(null);
    setAttachments([]);
    setConversationState("IDLE");
    setSubmittedCaseId("");
    setActiveSessionId(null);
    setInputText("");
  };

  // ── Restore a history session ─────────────────────────────────────────────
  const handleRestoreSession = (session) => {
    setMessages(session.messages || []);
    setExtractedData(session.extractedData || session.extracted_data || {});
    setLocation(session.location || null);
    setAttachments(session.attachments || []);
    setConversationState("SUCCESS");
    setSubmittedCaseId(session.caseId || session.case_id || "");
    setActiveSessionId(session.dbId || session.id);
    setInputText("");
  };

  // ── Guard ─────────────────────────────────────────────────────────────────
  if (isOfficial) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="glass-card p-12 text-center rounded-2xl border border-sky-900/60 max-w-lg space-y-3">
          <AlertCircle className="w-12 h-12 text-sky-400 mx-auto" />
          <h2 className="text-lg font-bold text-white">Agent Restricted</h2>
          <p className="text-xs text-slate-400">The AI Intake Agent is for citizen reporting. Officials should use the Department Operations dashboard.</p>
        </div>
      </div>
    );
  }

  // ── Derived ───────────────────────────────────────────────────────────────
  const currentStepIdx = toStepIndex(conversationState);
  const showReviewCard = conversationState === "REVIEW" || conversationState === "ERROR";
  const isSubmitting = conversationState === "SUBMITTING";
  const isSuccess = conversationState === "SUCCESS";

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Full-screen Map Modal */}
      {isMapOpen && <MapModal onSelect={handleMapLocationSelect} onClose={() => setIsMapOpen(false)} />}

      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-4 h-[calc(100vh-140px)] min-h-[600px] mb-8">

        {/* ━━━ FAR LEFT: Chat History Sidebar ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="hidden xl:flex flex-col w-56 flex-shrink-0 glass-panel rounded-2xl border border-slate-800 bg-slate-950/60 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Chat History</span>
            </div>
          </div>

          {/* New Chat button */}
          <div className="px-3 pt-3 pb-2 flex-shrink-0">
            <button
              onClick={handleNewChat}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition shadow-md shadow-sky-600/20"
            >
              <Plus className="w-3.5 h-3.5" />
              New Chat
            </button>
          </div>

          {/* Session list */}
          <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1.5">
            {sessionsLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="w-4 h-4 animate-spin text-sky-500" />
              </div>
            ) : sessionHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-center">
                <MessageSquare className="w-6 h-6 text-slate-700 mb-2" />
                <p className="text-[11px] text-slate-600">No sessions yet</p>
              </div>
            ) : (
              sessionHistory.map((session) => (
                <div
                  key={session.dbId || session.id}
                  className={`relative group w-full text-left px-3 py-2.5 rounded-xl transition cursor-pointer ${
                    activeSessionId === (session.dbId || session.id)
                      ? "bg-sky-900/50 border border-sky-700/50"
                      : "bg-slate-900/60 border border-transparent hover:border-slate-700 hover:bg-slate-800/60"
                  }`}
                  onClick={() => handleRestoreSession(session)}
                >
                  <p className="text-xs font-semibold text-slate-200 truncate leading-tight pr-5">{session.title}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[10px] text-slate-500">
                      {typeof session.timestamp === "string" && session.timestamp.includes("T")
                        ? new Date(session.timestamp).toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })
                        : session.timestamp}
                    </span>
                    {session.caseId && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-900/50 text-emerald-400 font-mono border border-emerald-800/50 truncate max-w-[70px]">
                        {session.caseId.slice(0, 8)}…
                      </span>
                    )}
                  </div>
                  {/* Delete button */}
                  <button
                    onClick={(e) => handleDeleteSession(e, session)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded bg-rose-900/40 hover:bg-rose-800/70 text-rose-400 transition"
                    title="Delete session"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ━━━ CENTER: Chat Workspace (65%) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="flex-1 flex flex-col rounded-2xl overflow-hidden bg-slate-950/80"
          style={{ animation: "ai-agent-glow 3s ease-in-out infinite alternate" }}
        >
          <style>{`
            @keyframes ai-agent-glow {
              0%   { box-shadow: 0 0 0 1.5px rgba(56,189,248,0.3), 0 0 24px 4px rgba(56,189,248,0.15); }
              50%  { box-shadow: 0 0 0 1.5px rgba(52,211,153,0.3), 0 0 40px 8px rgba(52,211,153,0.15); }
              100% { box-shadow: 0 0 0 1.5px rgba(99,102,241,0.3), 0 0 32px 6px rgba(99,102,241,0.15); }
            }
          `}</style>

          {/* Header */}
          <div className="px-5 py-3.5 border-b border-slate-800/80 bg-slate-900/50 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-emerald-400 p-0.5 flex items-center justify-center flex-shrink-0">
                <div className="w-full h-full bg-slate-950 rounded-[9px] flex items-center justify-center">
                  <Bot className="w-4 h-4 text-sky-400" />
                </div>
              </div>
              <div>
                <h2 className="text-sm font-extrabold text-white leading-tight">NAGARSETU AI Agent</h2>
                <p className="text-xs text-sky-400 flex items-center gap-1.5 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Available
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Mobile-only new chat */}
              <button
                onClick={handleNewChat}
                title="New chat"
                className="xl:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-900/40 border border-sky-700/40 text-sky-300 text-xs font-semibold hover:bg-sky-800/50 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                New Chat
              </button>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[92%] sm:max-w-[85%] ${msg.role === "user" ? "ml-auto flex-row-reverse" : ""}`}
              >
                <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-1 border border-slate-700 bg-slate-800">
                  {msg.role === "agent"
                    ? <Bot className="w-3.5 h-3.5 text-sky-400" />
                    : <User className="w-3.5 h-3.5 text-emerald-400" />
                  }
                </div>
                <div className={`space-y-2 ${msg.role === "user" ? "items-end flex flex-col" : ""}`}>
                  <div className={`px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed ${
                    msg.role === "agent"
                      ? "bg-slate-800/60 border border-slate-700/50 text-slate-200 rounded-tl-none"
                      : "bg-sky-600 border border-sky-500 text-white rounded-tr-none"
                  }`}>
                    {msg.text}
                  </div>
                  {msg.attachments?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 justify-end">
                      {msg.attachments.map((att, i) => (
                        <div key={i} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200">
                          {att.type === "image"
                            ? <Camera className="w-3 h-3 text-emerald-400" />
                            : <FileText className="w-3 h-3 text-sky-400" />
                          }
                          <span className="truncate max-w-[120px]">{att.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isAgentTyping && (
              <div className="flex gap-3 max-w-[85%]">
                <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center border border-slate-700 bg-slate-800 mt-1">
                  <Bot className="w-3.5 h-3.5 text-sky-400" />
                </div>
                <div className="px-4 py-3 rounded-2xl rounded-tl-none bg-slate-800/60 border border-slate-700/50 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-sky-400 animate-spin" />
                  <span className="text-xs text-slate-400">Agent is thinking...</span>
                </div>
              </div>
            )}

            {/* Quick actions */}
            {conversationState === "IDLE" && messages.length === 1 && !isAgentTyping && (
              <div className="flex flex-wrap gap-2 pt-1 pl-10">
                {QUICK_ACTIONS.map((label) => (
                  <button
                    key={label}
                    onClick={() => handleQuickAction(label)}
                    className="px-3 py-1.5 rounded-lg border border-sky-700/50 bg-sky-900/30 text-sky-300 text-xs font-semibold hover:bg-sky-800/50 transition"
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}

            {/* Review Card */}
            {showReviewCard && (
              <div className="ml-10 mr-auto max-w-full sm:max-w-md w-full glass-card p-4 rounded-2xl border border-sky-800 shadow-xl bg-slate-900/90">
                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2 border-b border-slate-700/50 pb-2.5">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  Complaint Review
                </h3>
                <div className="space-y-2.5 text-xs">
                  <div>
                    <span className="text-slate-500 font-semibold uppercase tracking-wider block mb-0.5">Issue</span>
                    <p className="text-slate-200 leading-relaxed">{extractedData.issue_description || "Not specified"}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 font-semibold uppercase tracking-wider block mb-0.5">Location</span>
                    <p className="text-slate-200">
                      {location
                        ? <><Check className="w-3 h-3 inline text-emerald-400 mr-1" />{location.address}</>
                        : <span className="text-amber-400">Not specified — use the Map button below</span>
                      }
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500 font-semibold uppercase tracking-wider block mb-0.5">Evidence</span>
                    <p className="text-slate-200">
                      {attachments.length > 0
                        ? <><Check className="w-3 h-3 inline text-emerald-400 mr-1" />{attachments.length} file(s) attached</>
                        : "No files"
                      }
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500 font-semibold uppercase tracking-wider block mb-0.5">Citizen</span>
                    <p className="text-slate-200">{currentUser?.name || "Citizen"}</p>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-700/50 flex items-center gap-3">
                  {conversationState === "ERROR" ? (
                    <button
                      onClick={() => setConversationState("REVIEW")}
                      className="flex-1 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-600 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Try Again
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmitComplaint}
                      className="flex-1 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
                    >
                      Submit Complaint
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Post-success New Chat prompt */}
            {isSuccess && (
              <div className="ml-10 mr-auto">
                <button
                  onClick={handleNewChat}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-sky-700/50 bg-sky-900/30 text-sky-300 text-xs font-semibold hover:bg-sky-800/50 transition"
                >
                  <Plus className="w-3.5 h-3.5" /> Start a New Chat
                </button>
              </div>
            )}

            <div className="h-1" />
          </div>

          {/* Composer */}
          <div className="px-4 py-3 bg-slate-900/80 border-t border-slate-800 flex-shrink-0">
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <label
                className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white cursor-pointer transition flex-shrink-0"
                title="Attach evidence"
              >
                <Paperclip className="w-4 h-4" />
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </label>

              <button
                type="button"
                onClick={() => setIsMapOpen(true)}
                title="Select location on map"
                className={`p-2.5 rounded-xl border transition flex-shrink-0 ${
                  location
                    ? "bg-emerald-900/50 border-emerald-700/60 text-emerald-400"
                    : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white"
                }`}
              >
                <MapPin className="w-4 h-4" />
              </button>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={
                  isSubmitting ? "Submitting..."
                  : isAgentTyping ? "Agent is thinking..."
                  : isSuccess ? "Start a new chat above, or keep chatting..."
                  : "Type your message..."
                }
                disabled={isSubmitting || isAgentTyping}
                className="flex-1 bg-slate-950 border border-slate-700 focus:border-sky-500 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none disabled:opacity-50 transition"
              />

              <button
                type="submit"
                disabled={!inputText.trim() || isSubmitting || isAgentTyping}
                className="p-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition flex-shrink-0 shadow-md shadow-sky-600/20"
              >
                {isAgentTyping
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Send className="w-4 h-4" />
                }
              </button>
            </form>
          </div>
        </div>

        {/* ━━━ RIGHT: Agent Status Panel (35%) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="flex-[0.33] hidden lg:flex flex-col gap-4">

          {/* Status */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 shadow-lg bg-slate-950/60 relative overflow-hidden">
            <style>{`
              @keyframes text-shimmer {
                0% { background-position: -200% center; }
                100% { background-position: 200% center; }
              }
              .flowing-text {
                background: linear-gradient(90deg, #64748b 0%, #38bdf8 50%, #64748b 100%);
                background-size: 200% auto;
                color: transparent;
                -webkit-background-clip: text;
                background-clip: text;
                animation: text-shimmer 2.5s linear infinite;
                font-weight: 500;
              }
              @keyframes moving-dots {
                0% { content: ''; }
                25% { content: '.'; }
                50% { content: '..'; }
                75% { content: '...'; }
                100% { content: ''; }
              }
              .animated-dots::after {
                content: '';
                display: inline-block;
                width: 12px;
                text-align: left;
                animation: moving-dots 1.5s infinite steps(4);
              }
            `}</style>
            
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-800">
              <Sparkles className="w-4 h-4 text-sky-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Agent Status</h3>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Current Task</p>
                <p className="text-sm font-bold text-sky-400 mt-0.5">
                  {{
                    IDLE: "Standing By",
                    CHATTING: <span className="flowing-text">Processing<span className="animated-dots" /></span>,
                    COLLECTING_ISSUE: <span className="flowing-text">Collecting Issue<span className="animated-dots" /></span>,
                    COLLECTING_LOCATION: <span className="flowing-text">Securing Location<span className="animated-dots" /></span>,
                    COLLECTING_EVIDENCE: <span className="flowing-text">Gathering Evidence<span className="animated-dots" /></span>,
                    REVIEW: "Awaiting Confirmation",
                    SUBMITTING: <span className="flowing-text">Submitting<span className="animated-dots" /></span>,
                    SUCCESS: "Completed",
                    ERROR: "Failed",
                  }[conversationState] ?? <span className="flowing-text">Processing<span className="animated-dots" /></span>}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Description</p>
                <p className="text-sm text-slate-200 mt-0.5 line-clamp-2">
                  {extractedData.issue_description
                    ? <><Check className="w-3.5 h-3.5 inline text-emerald-400 mr-1" />Logged</>
                    : <span className={conversationState !== "IDLE" && conversationState !== "SUCCESS" ? "flowing-text text-[13px]" : "text-slate-500"}>Awaiting<span className={conversationState !== "IDLE" && conversationState !== "SUCCESS" ? "animated-dots" : ""} /></span>
                  }
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Location</p>
                <p className="text-sm text-slate-200 mt-0.5 truncate">
                  {location
                    ? <><Check className="w-3.5 h-3.5 inline text-emerald-400 mr-1" />{location.address.slice(0, 30)}{location.address.length > 30 ? "…" : ""}</>
                    : <span className={conversationState !== "IDLE" && conversationState !== "SUCCESS" ? "flowing-text text-[13px]" : "text-slate-500"}>Awaiting<span className={conversationState !== "IDLE" && conversationState !== "SUCCESS" ? "animated-dots" : ""} /></span>
                  }
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Evidence</p>
                <p className="text-sm text-slate-200 mt-0.5">
                  {attachments.length > 0
                    ? <><Check className="w-3.5 h-3.5 inline text-emerald-400 mr-1" />{attachments.length} file(s)</>
                    : <span className={conversationState !== "IDLE" && conversationState !== "SUCCESS" ? "flowing-text text-[13px]" : "text-slate-500"}>0 files<span className={conversationState !== "IDLE" && conversationState !== "SUCCESS" ? "animated-dots" : ""} /></span>
                  }
                </p>
              </div>
              {isSuccess && submittedCaseId && (
                <div className="pt-2 border-t border-slate-800">
                  <p className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">Complaint ID</p>
                  <p className="text-xs font-mono text-emerald-300 mt-0.5 break-all">{submittedCaseId}</p>
                </div>
              )}
            </div>
          </div>

          {/* Workflow */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 shadow-lg bg-slate-950/60 flex-1">
            <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-5">Workflow</h3>
            <div className="space-y-5 relative">
              <div className="absolute left-[9px] top-2 bottom-6 w-[2px] bg-slate-800 z-0" />
              {WORKFLOW_STEPS.map((step, idx) => {
                const done = idx < currentStepIdx;
                const active = idx === currentStepIdx;
                return (
                  <div key={idx} className="flex items-center gap-3 relative z-10">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 border transition-colors ${
                      done ? "bg-emerald-500 border-emerald-400"
                      : active ? "bg-sky-600 border-sky-400 ring-2 ring-sky-500/20"
                      : "bg-slate-900 border-slate-700"
                    }`}>
                      {done
                        ? <Check className="w-3 h-3 text-white" />
                        : <div className={`w-2 h-2 rounded-full ${active ? "bg-white" : "bg-slate-700"}`} />
                      }
                    </div>
                    <span className={`text-xs font-semibold ${done ? "text-emerald-400" : active ? "text-sky-400" : "text-slate-500"}`}>
                      {step}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
