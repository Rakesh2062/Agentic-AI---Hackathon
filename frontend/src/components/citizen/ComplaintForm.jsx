import React, { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import { 
  Send, 
  MapPin, 
  Sparkles, 
  Navigation, 
  AlertCircle, 
  Check, 
  Loader2, 
  Camera, 
  FileText, 
  Paperclip, 
  UploadCloud, 
  X, 
  Mic, 
  MicOff, 
  Wand2, 
  Map as MapIcon,
  Layers,
  Building2,
  Lock,
  Award
} from "lucide-react";
import { createComplaint, getDepartmentCases, uploadFile } from "../../api/endpoints";
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import { ComplaintSuccess } from "./ComplaintSuccess";
import { GoogleMapsPicker } from "../common/GoogleMapsPicker";
import { AgentPipelineOverlay, AgentPipelineInline } from "../common/AgentPipelineOverlay";

const QUICK_PROMPTS = [
  {
    title: "Deep Pothole at Main Intersection",
    text: "Deep hazardous pothole in middle lane near 5th Avenue and Oak Street intersection causing cars to swerve into oncoming traffic.",
    ward: "Ward 4 - Central West",
    address: "850 5th Avenue intersection",
  },
  {
    title: "Clean Water Pipeline Rupture",
    text: "High-pressure clean water supply pipeline rupture on sidewalk near residential block 12, flooding street and dropping pressure in 100+ homes.",
    ward: "Ward 2 - North Heights",
    address: "1420 Oakridge Lane, Block 12",
  },
  {
    title: "Commercial Waste Bin Overflow",
    text: "Commercial garbage dumpsters overflowing onto pedestrian sidewalk outside central market, strong odor and blocking pathway.",
    ward: "Ward 3 - Downtown Core",
    address: "310 Market Square, outside Greenleaf",
  },
  {
    title: "Three Broken Streetlights in Row",
    text: "Three consecutive streetlights dark along pedestrian corridor near school zone creating severe night visibility hazard.",
    ward: "Ward 5 - University District",
    address: "Elm St Pedestrian Corridor, Poles 401-403",
  },
  {
    title: "Broken City Park Water Station",
    text: "Public drinking water fountain valve sheared off and water continuously overflowing across accessible pathway.",
    ward: "Ward 1 - South Valley",
    address: "Central Park West Pavillion",
  },
];

export function ComplaintForm() {
  const { showToast, setCitizenSubTab, navigateToTrack } = useApp();
  const { currentUser, isOfficial, recordComplaintSubmitted } = useAuth();

  const [title, setTitle] = useState("");
  const [rawText, setRawText] = useState("");
  const [address, setAddress] = useState("");
  const [ward, setWard] = useState("");
  const [coords, setCoords] = useState({ lat: 16.5062, lng: 80.6480 });
  const [locationPinned, setLocationPinned] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedResult, setSubmittedResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [existingCases, setExistingCases] = useState([]);
  const [showMapPicker, setShowMapPicker] = useState(false);

  // Voice recording simulation
  const [isRecording, setIsRecording] = useState(false);
  const [speechRecognition, setSpeechRecognition] = useState(null);
  const [isEnhancing, setIsEnhancing] = useState(false);

  // Initialize browser Web Speech API
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setRawText((prev) => (prev ? prev + " " + transcript : transcript));
      };

      recognition.onerror = (event) => {
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      setSpeechRecognition(recognition);
    }
  }, []);

  const toggleVoiceRecording = () => {
    if (!speechRecognition) {
      alert("Speech recognition is not supported in this browser. Please type your complaint.");
      return;
    }

    if (isRecording) {
      speechRecognition.stop();
      setIsRecording(false);
    } else {
      try {
        speechRecognition.start();
        setIsRecording(true);
      } catch (err) {
        setIsRecording(false);
      }
    }
  };

  const handleAIEnhance = async () => {
    if (!rawText.trim()) return;
    setIsEnhancing(true);
    
    // Simulate AI intelligent refinement
    setTimeout(() => {
      let enhanced = rawText.trim();
      if (!enhanced.endsWith(".")) enhanced += ".";
      enhanced += " Immediate municipal inspection requested to mitigate public safety risks.";
      setRawText(enhanced);
      setIsEnhancing(false);
      showToast("Complaint enhanced with AI municipal context!", "info");
    }, 800);
  };

  useEffect(() => {
    getDepartmentCases()
      .then((data) => setExistingCases(data || []))
      .catch(() => {});
  }, []);

  const handleQuickPrompt = (item) => {
    setTitle(item.title);
    setRawText(item.text);
    setWard(item.ward);
    setAddress(item.address);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    addFiles(files);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer?.files || []);
    addFiles(files);
  };

  const addFilesToAttachments = (files) => {
    const validFiles = files.filter((f) => {
      const isImg = f.type.startsWith("image/");
      const isPdf = f.type === "application/pdf";
      const isVid = f.type.startsWith("video/");
      return isImg || isPdf || isVid;
    });

    if (validFiles.length < files.length) {
      showToast("Some unsupported file formats were skipped (Supports JPG, PNG, WEBP, PDF).", "warning");
    }

    const newItems = validFiles.map((f) => ({
      name: f.name,
      size: `${(f.size / (1024 * 1024)).toFixed(1)} MB`,
      url: URL.createObjectURL(f),
      type: f.type.startsWith("image/") ? "image" : f.type === "application/pdf" ? "document" : "video",
    }));

    setAttachments([...attachments, ...newItems]);
    showToast(`Attached ${validFiles.length} file(s)`, "success");
  };

  const removeAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMapLocationSelect = (loc) => {
    setCoords({ lat: loc.lat, lng: loc.lng });
    setAddress(loc.address || address);
    setWard(loc.ward || ward);
    setLocationPinned(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rawText.trim()) return;

    setIsSubmitting(true);
    setErrorMsg("");

    const payload = {
      raw_text: rawText.trim(),
      title: title.trim() || undefined,
      location: {
        address: address.trim() || "Unspecified Location",
        ward: ward.trim() || "Ward 4 - Central West",
        latitude: coords.lat,
        longitude: coords.lng,
      },
      attachments: attachments.map((a) => ({ name: a.name, size: a.size, url: a.url, type: a.type })),
    };

    try {
      const result = await createComplaint(payload);
      setIsSubmitting(false);

      if (currentUser?.id) {
        recordComplaintSubmitted(currentUser.id);
      }

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });

      setSubmittedResult(result);
      showToast("Incident report processed by AI and submitted!", "success");
    } catch (err) {
      setIsSubmitting(false);
      setErrorMsg(err.message || "Failed to submit report. Please try again.");
    }
  };

  if (isOfficial) {
    return (
      <div className="glass-panel p-12 rounded-3xl text-center max-w-lg mx-auto space-y-4 shadow-float">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-sm">
          <Building2 className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 font-display">Official Account Active</h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          Civic officials review, triage, and manage department operations. Citizen incident reporting is restricted for administrative accountability.
        </p>
      </div>
    );
  }

  if (submittedResult) {
    return (
      <ComplaintSuccess
        createdCase={submittedResult}
        onTrackNow={(id) => {
          // Navigate to the Track tab and pre-fill the tracking ID
          if (navigateToTrack) {
            navigateToTrack(id);
          } else {
            setCitizenSubTab("track");
          }
        }}
        onNewComplaint={() => {
          setSubmittedResult(null);
          setRawText("");
          setTitle("");
          setAttachments([]);
          setAddress("");
          setWard("");
          setLocationPinned(false);
          setErrorMsg("");
        }}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <AgentPipelineOverlay isVisible={isSubmitting} />
      
      {/* Header Info */}
      <div className="text-center mb-6 space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold shadow-sm">
          <Sparkles className="w-3.5 h-3.5" />
          <span>AUTONOMOUS MULTI-AGENT INTAKE</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-display">
          Submit Incident Report
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto">
          Describe any municipal infrastructure problem. Our AI pipeline categorizes, scores priority, and queues it for official verification.
        </p>
      </div>

      {/* Main Form Card */}
      <form
        onSubmit={handleSubmit}
        className="glass-panel p-6 sm:p-10 rounded-3xl border border-white/80 shadow-float space-y-6 bg-white/85 backdrop-blur-2xl"
      >
        {/* Quick Example Autofills */}
        <div>
          <span className="text-xs font-bold text-slate-700 block mb-2">✨ Quick Example Pre-fills:</span>
          <div className="flex flex-wrap gap-2">
            {QUICK_PROMPTS.map((item, idx) => (
              <button
                type="button"
                key={idx}
                onClick={() => handleQuickPrompt(item)}
                className="text-xs font-medium px-3.5 py-1.5 rounded-xl bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 border border-slate-200 shadow-sm transition"
              >
                {item.title}
              </button>
            ))}
          </div>
        </div>

        {/* Issue Title / Headline */}
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-1.5">
            Issue Title / Headline
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Deep Pothole at Main Intersection"
            className="w-full bg-white border border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 outline-none transition shadow-sm"
          />
        </div>

        {/* Description Textarea + Voice & AI Tools */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <span>Detailed Description</span>
              <span className="text-rose-500">*</span>
            </label>
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleVoiceRecording}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition flex items-center gap-1.5 ${
                  isRecording
                    ? "bg-rose-50 text-rose-600 border-rose-300 animate-pulse"
                    : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-sm"
                }`}
                title="Dictate with voice"
              >
                {isRecording ? <MicOff className="w-3.5 h-3.5 text-rose-500" /> : <Mic className="w-3.5 h-3.5 text-indigo-600" />}
                <span>{isRecording ? "Recording..." : "Voice Input"}</span>
              </button>

              <button
                type="button"
                onClick={handleAIEnhance}
                disabled={isEnhancing || !rawText.trim()}
                className="text-xs font-bold px-3 py-1.5 rounded-xl bg-white hover:bg-indigo-50 text-indigo-600 border border-indigo-200 shadow-sm transition flex items-center gap-1.5 disabled:opacity-40"
              >
                {isEnhancing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Wand2 className="w-3.5 h-3.5" />
                )}
                <span>AI Enhance</span>
              </button>
            </div>
          </div>

          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Describe what is happening, exact location clues, hazard severity, or affected public..."
            rows={4}
            required
            className="w-full bg-white border border-slate-200 focus:border-indigo-500 rounded-2xl p-4 text-slate-900 placeholder-slate-400 text-xs outline-none transition resize-y shadow-sm"
          />
          <span className="text-[10px] block mt-1 text-right text-slate-400 font-mono">
            {rawText.length} characters
          </span>
        </div>

        {/* Multi-File Evidence & Attachments Section */}
        <div className="p-5 rounded-2xl border border-indigo-100 bg-indigo-50/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Paperclip className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-bold text-slate-800">Upload Evidence Photos or Documents</span>
            </div>
            <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              +5 Bonus Points for verified photo
            </span>
          </div>

          {/* Drag and Drop Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-6 text-center transition ${
              isDragging
                ? "border-indigo-500 bg-indigo-50"
                : "border-slate-300 hover:border-indigo-300 bg-white/80"
            }`}
          >
            <UploadCloud className="w-7 h-7 text-indigo-500 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-700">
              Drag and drop incident photos or PDF documents here
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Supports JPG, PNG, WEBP, PDF up to 10MB
            </p>

            <label className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl cursor-pointer shadow-sm transition">
              <Camera className="w-3.5 h-3.5" />
              <span>Choose Files</span>
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
          </div>

          {/* Attached Files List */}
          {attachments.length > 0 && (
            <div className="space-y-2 pt-2">
              <span className="text-xs font-bold text-slate-700 block">
                Evidence Files ({attachments.length}):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {attachments.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200 text-xs shadow-sm"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {file.type === "image" ? (
                        <Camera className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                      ) : (
                        <FileText className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                      )}
                      <div className="min-w-0">
                        <span className="font-semibold text-slate-800 truncate block">
                          {file.name}
                        </span>
                        <span className="text-[9px] text-slate-400 font-mono">
                          {file.size}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeAttachment(idx)}
                      className="text-slate-400 hover:text-rose-500 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Location Picker Section */}
        <div className="p-5 rounded-2xl border border-slate-200 bg-white/70 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-bold text-slate-800">Incident Location &amp; Ward</span>
            </div>

            <button
              type="button"
              onClick={() => setShowMapPicker(!showMapPicker)}
              className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border transition ${
                showMapPicker
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                  : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-sm"
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>{showMapPicker ? "Hide Map Picker" : "Select on Map"}</span>
            </button>
          </div>

          {/* Map Picker */}
          {showMapPicker && (
            <div className="pt-1 animate-slide-up">
              <GoogleMapsPicker
                onLocationSelect={handleMapLocationSelect}
                selectedWard={ward}
                existingCases={existingCases}
                height="h-64 sm:h-72"
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Street Address / Landmark
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. 742 Evergreen Terrace, near Library"
                className="w-full bg-white border border-slate-200 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Municipal Ward / District
              </label>
              <input
                type="text"
                value={ward}
                onChange={(e) => setWard(e.target.value)}
                placeholder="Auto-detected or type manually"
                className="w-full bg-white border border-slate-200 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 outline-none"
              />
              {ward && (
                <p className="text-[10px] text-emerald-600 mt-1 flex items-center gap-1 font-semibold">
                  <MapPin className="w-3 h-3" />
                  Ward detected from map location
                </p>
              )}
            </div>
          </div>

          {locationPinned && (
            <div className="text-xs text-slate-700 font-mono flex items-center gap-1.5 bg-indigo-50 p-2.5 rounded-xl border border-indigo-100">
              <Check className="w-3.5 h-3.5 text-emerald-500 font-bold" />
              <span>Location anchored: Lat {coords.lat}, Lng {coords.lng}</span>
            </div>
          )}
        </div>

        {/* Authenticated User Account Auto-Association */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <span>Reporting as: <strong className="text-slate-900">{currentUser?.name || "Civilian Participant"}</strong> ({currentUser?.email})</span>
          <span className="text-slate-400 font-mono text-[11px]">Verified Citizen</span>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting || !rawText.trim()}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-600 hover:opacity-95 text-white font-bold text-xs uppercase tracking-wider shadow-neon flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition duration-300 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Running AI Agent Pipeline...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Submit Complaint to City AI</span>
              </>
            )}
          </button>
          <AgentPipelineInline isVisible={isSubmitting} />
        </div>
      </form>
    </div>
  );
}
