import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Peer from "simple-peer";
import { 
  VideoCamera, VideoCameraSlash, Microphone, MicrophoneSlash, 
  SpeakerHigh, SpeakerNone, Phone, DotsThree, X, 
  PawPrint, IdentificationBadge as IdentificationCard, Paperclip, Waveform, 
  CaretLeft, Heartbeat, Pill, Flask, Pulse as Activity, 
  Sparkle as Sparkles, Check, LockSimple, ArrowsClockwise, Cat, CircleNotch,
  CheckCircle, Microphone as MicrophoneStage
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

// Design System Variables (Tailwind equivalents or raw hex)
const COLORS = {
  bgDark: "#07080a",
  accentTeal: "#00e5ff",
  accentEmerald: "#30d158",
  accentPink: "#ff65a3",
  accentPurple: "#bf5af2",
  accentRed: "#ea4335",
  textMuted: "rgba(255, 255, 255, 0.55)",
  glassBg: "rgba(22, 26, 35, 0.65)",
  glassBorder: "rgba(255, 255, 255, 0.07)",
};

const USER_DOCUMENTS = [
  { name: "xray_chest_view.jpg", url: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=800&q=80" },
  { name: "skin_lesion_macro.jpg", url: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80" },
  { name: "blood_report_p1.jpg", url: "https://images.unsplash.com/photo-1530026405186-ed1ea0607330?auto=format&fit=crop&w=800&q=80" },
  { name: "vaccine_chart_v2.jpg", url: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=800&q=80" }
];

const AI_INSIGHT_SCENARIOS = [
  { label: "Distress / Pain", meta: "High Urgency", intensity: "88 dB (Critical)", desc: "AI Detected structural spike forms matching atypical pitch frequencies. High likelihood of sharp acute discomfort or physical pain indicator localized in movement logs.", tag: "Distress" },
  { label: "Anxiety & Stress", meta: "Behavioral Discomfort", intensity: "54 dB (Low Freq)", desc: "Repetitive low-amplitude whine patterns recognized during the consultation. Corresponds to environmental isolation or high anxiety threshold triggers.", tag: "Anxiety" },
  { label: "Excessive Crying", meta: "Sustained Stress", intensity: "62 dB (Chronic)", desc: "The acoustic buffer logged chronic duration loops. Indicates continuous attention demand or dull persistent physical stress parameters.", tag: "Whining" },
  { label: "Coughing Pattern", meta: "Respiratory Link", intensity: "76 dB (Spike)", desc: "Isolated transient sound clusters match feline/canine respiratory coughing anomalies. Recommended to review physical pulmonary pathways.", tag: "Respiratory" },
  { label: "Barking Anomaly", meta: "Vocal Variance", intensity: "71 dB (High Tempo)", desc: "Sound wave amplitude patterns display irregular rapid burst shifts. Sound intensity trends point towards immediate external behavioral stimuli or hyper-arousal.", tag: "Anomalous" }
];

type AIScenario = typeof AI_INSIGHT_SCENARIOS[number];

const PASSPORT_DATA = {
  "health records": { title: "Clinical Case Sheets", desc: "Primary vet clinical summary, health tracking diagnostics telemetry records, and systemic updates log lines.", icon: Heartbeat },
  "medication": { title: "Prescriptions Timelines", desc: "Active pharmaceutical medical treatment cycles, schedule anti-parasitic metrics, and custom drug dosages maps.", icon: Pill },
  "lab reports": { title: "Diagnostic Blood Panels", desc: "Comprehensive hematology panels, microbiological cultures data, metabolic checks, and laboratory values charts.", icon: Flask },
  "full health history": { title: "Chronological Life Summary", desc: "Master digital overview tracker summary mapping health logs from early puppy stages up to recent clinical setups.", icon: Activity }
};

const VideoCall = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { consultation, vet, petName, appointmentId } = location.state || {};

  // Standard Call State
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSpeakerOff, setIsSpeakerOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0); 
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [permissionError, setPermissionError] = useState<string | null>(null);
  
  // Premium UI State
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [showSlider, setShowSlider] = useState(false);
  const [petType, setPetType] = useState<"dog" | "cat">("dog");
  const [activeNodes, setActiveNodes] = useState<string[]>([]);
  const [selectedPads, setSelectedPads] = useState<string[]>([]);
  const [passportItems, setPassportItems] = useState<string[]>([]);
  const [activePassportTab, setActivePassportTab] = useState<string | null>(null);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [isAnalyzingVoice, setIsAnalyzingVoice] = useState(false);
  const [voiceResult, setVoiceResult] = useState<AIScenario | null>(null);
  const [sliderView, setSliderView] = useState<"hub" | "paw" | "passport" | "clip" | "voice">("hub");
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  // PIP Drag State (simplified for React)
  const [pipPos, setPipPos] = useState({ top: 112, right: 16 });

  const videoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<Peer.Instance | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragAreaRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const isVet = user?.role === "vet" || user?.email === "jas@sruvo.com" || user?.email === "rijas@123.com";

  const remoteInfo = isVet ? {
    name: consultation?.profiles?.full_name || consultation?.profiles?.name || consultation?.user_name || petName || "Patient Owner",
    image: consultation?.profiles?.profile_photo || consultation?.profiles?.avatar_url || consultation?.symptoms_data?.photoUrl || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=1080&h=1920&fit=crop",
    specialty: consultation?.pet_name ? `${consultation.pet_name} (Patient)` : "Patient Information"
  } : {
    name: vet?.name || consultation?.vet_name || "Dr. Rijas Pabla",
    image: vet?.image || "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=1080&h=1920&fit=crop",
    specialty: "Veterinary Surgeon"
  };

  const startCamera = useCallback(async (overrides: MediaStreamConstraints = {}) => {
    try {
      setPermissionError(null);
      
      // Basic checks
      if (!window.isSecureContext) {
        throw new Error("Camera access requires a secure (HTTPS) context.");
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Your browser does not support camera access or is in a restricted context.");
      }
      
      // Stop existing tracks before starting new ones for flip
      const currentStream = videoRef.current?.srcObject as MediaStream;
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }

      const constraints = { 
        video: { facingMode: facingMode }, 
        audio: !isMuted,
        ...overrides 
      };
      
      // Try to get the stream
      const userStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(userStream);
      streamRef.current = userStream;
      if (videoRef.current) {
        videoRef.current.srcObject = userStream;
      }
    } catch (err: unknown) {
      console.error("Camera error details:", err);
      
      // Extract error name and message safely
      let errorName = "";
      let errorMessage = "";
      
      if (err instanceof Error) {
        errorName = err.name;
        errorMessage = err.message;
      } else {
        errorMessage = String(err);
      }
      
      // Fallback: If both fail, try only video (sometimes mic issues block the whole stream)
      try {
        const videoOnlyStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode }, audio: false });
        setStream(videoOnlyStream);
        if (videoRef.current) {
          videoRef.current.srcObject = videoOnlyStream;
        }
        return;
      } catch (videoErr) {
        console.error("Video-only fallback also failed:", videoErr);
      }
      
      let errorMsg = "Permission denied. Please check your browser's camera/mic settings.";
      
      const isPermissionDenied = 
        errorName === "NotAllowedError" || 
        errorName === "PermissionDeniedError" || 
        errorMessage.toLowerCase().includes("permission denied") ||
        errorMessage.toLowerCase().includes("notallowederror");

      if (isPermissionDenied) {
        errorMsg = "Access denied. We need camera/mic for the call. Please click the camera icon in your browser's address bar to 'Allow' access. If you're using AI Studio, try clicking 'Open in new tab' at the top right of the preview.";
      } else if (errorName === "NotFoundError" || errorName === "DevicesNotFoundError") {
        errorMsg = "No camera or microphone found on your device. Please ensure they are connected.";
      } else if (errorName === "NotReadableError" || errorName === "TrackStartError") {
        errorMsg = "Camera or microphone is already in use by another application. Please close other apps and try again.";
      } else if (errorMessage.includes("secure (HTTPS)")) {
        errorMsg = errorMessage;
      }
      
      setPermissionError(errorMsg);
    }
  }, [facingMode, isMuted]);

  useEffect(() => {
    const timer = setInterval(() => setCallDuration(prev => prev + 1), 1000);
    startCamera();
    return () => {
      clearInterval(timer);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, [startCamera]);

  const toggleCamera = () => {
    const newMode = facingMode === "user" ? "environment" : "user";
    setFacingMode(newMode);
    startCamera({ video: { facingMode: newMode } });
  };

  useEffect(() => {
    if (!appointmentId || !stream) return;

    const channel = supabase.channel(`call_sync_${appointmentId}`, {
      config: {
        broadcast: { self: false }
      }
    });

    const initPeer = () => {
      if (peerRef.current) peerRef.current.destroy();

      const p = new Peer({
        initiator: true,
        trickle: true,
        stream: stream
      });

      p.on("signal", (data) => {
        channel.send({
          type: "broadcast",
          event: "WEBRTC_SIGNAL",
          payload: { signal: data, sender: "vet" }
        });
      });

      p.on("stream", (remoteStream) => {
        setRemoteStream(remoteStream);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
        }
      });

      p.on("error", (err) => console.error("Peer error:", err));
      p.on("close", () => setRemoteStream(null));

      peerRef.current = p;
    };

    channel
      .on("broadcast", { event: "WEBRTC_SIGNAL" }, ({ payload }) => {
        if (payload.sender === "user" && peerRef.current) {
          peerRef.current.signal(payload.signal);
        }
      })
      .on("broadcast", { event: "VET_STATE_CHANGE" }, (payload) => {
        // Handle other sync events
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // Send initial state
          initPeer();
        }
      });

    // Broadcast current UI state whenever it changes
    const broadcastState = () => {
      channel.send({
        type: "broadcast",
        event: "VET_UI_SYNC",
        payload: {
          activeNodes,
          activePanel,
          selectedPads,
          activePassportTab,
          galleryIndex,
          voiceResult,
          isAnalyzingVoice
        }
      });
    };

    broadcastState();

    return () => {
      if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
      }
      supabase.removeChannel(channel);
    };
  }, [appointmentId, activeNodes, activePanel, selectedPads, activePassportTab, galleryIndex, voiceResult, isAnalyzingVoice, stream]);

  // Separate effect for stream cleanup to handle changes correctly
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(t => {
          t.stop();
          t.enabled = false;
        });
      }
    };
  }, [stream]);

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const handleEndCall = () => {
    if (confirm("Terminate modern video link session safely?")) {
      if (stream) {
        stream.getTracks().forEach(t => {
          t.stop();
          t.enabled = false;
        });
      }
      if (isVet) {
        navigate("/vet/digital-prescription", { state: { ...location.state, callDuration } });
      } else {
        navigate("/vet/home");
      }
    }
  };

  const runVoiceAnalysis = () => {
    setIsAnalyzingVoice(true);
    setVoiceResult(null);
    setTimeout(() => {
      const result = AI_INSIGHT_SCENARIOS[Math.floor(Math.random() * AI_INSIGHT_SCENARIOS.length)];
      setVoiceResult(result);
      setIsAnalyzingVoice(false);
    }, 2200);
  };

  const syncActivationFlow = (type: string, enabled: boolean) => {
    if (enabled) {
      setActiveNodes(prev => [...prev, type]);
    } else {
      setActiveNodes(prev => prev.filter(n => n !== type));
      if (activePanel === type) setActivePanel(null);
    }
  };

  const toggleChecklistItem = (item: string) => {
    setPassportItems(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
  };

  const handlePassportTapRoute = () => {
    setActivePanel(null);
    if (passportItems.length === 0) {
      alert("Please activate Passport Tracker and configuration parameters inside slider setups first.");
      return;
    }
    setActivePassportTab(passportItems[0]);
    setActivePanel("passport");
  };

  // Node Positions Calculation
  const getNodePos = (nodeType: string) => {
    const idx = activeNodes.indexOf(nodeType);
    if (idx === -1) return -100;
    const baseOffset = 155; // 50 (dock) + 56 (dock h) + 49 (extra)
    const stepGap = 61; // 52 (btn) + 9 (gap)
    return baseOffset + (idx * stepGap);
  };

  return (
    <div ref={containerRef} className="h-screen w-screen bg-black overflow-hidden relative font-[-apple-system,BlinkMacSystemFont,'SF_Pro_Display','SF_Pro_Text',sans-serif] text-white">
      {/* Background Stream Feed */}
      <div className="absolute inset-0 z-0 bg-black">
        {remoteStream ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover opacity-90 transition-all duration-700"
          />
        ) : (
          <img 
            src={remoteInfo.image} 
            alt={remoteInfo.name} 
            className="w-full h-full object-cover opacity-90 transition-all duration-700"
          />
        )}
        {/* Cinematic Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[rgba(7,8,10,0.7)] via-[rgba(7,8,10,0.05)] to-[rgba(7,8,10,0.85)] z-[2] pointer-events-none" />
      </div>

      {/* Top Status Badge */}
      <div className="absolute top-[26px] left-1/2 -translate-x-1/2 z-[12] bg-black/50 backdrop-blur-xl border border-white/10 px-3 py-1.5 rounded-full flex items-center gap-1.5 whitespace-nowrap translate-y-[-100%]">
        <LockSimple size={13} className="text-white/90" />
        <span className="text-[11px] font-medium text-white/95">End-to-end encrypted</span>
      </div>

      {/* Top Header */}
      <div className="absolute top-[30px] left-4 right-4 z-10 bg-[rgba(22,26,35,0.65)] backdrop-blur-[35px] border border-white/10 border-t-white/10 rounded-[20px] p-[8px_12px] md:p-[10px_14px] flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-2 md:gap-2.5 overflow-hidden">
          <img src={remoteInfo.image} className="w-[34px] h-[34px] md:w-[38px] md:h-[38px] rounded-xl object-cover border border-white/10 bg-[#2a2f3a] shrink-0" alt="Avatar" />
          <div className="flex flex-col gap-0.5 overflow-hidden">
            <div className="text-[13px] md:text-sm font-semibold truncate">{remoteInfo.name}</div>
            <div className="text-[10px] md:text-[11px] text-white/55 truncate">{remoteInfo.specialty}</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
          <div className="flex items-center gap-1 text-[9px] md:text-[10px] font-bold text-[#30d158] uppercase bg-[#30d158]/12 px-1.5 py-1 rounded-md">
            <div className="w-[4px] h-[4px] md:w-[5px] md:h-[5px] bg-[#30d158] rounded-full animate-pulse" />
            Live
          </div>
          <div className="text-white text-[12px] md:text-sm font-semibold bg-white/10 px-2 py-1 rounded-md">
            {formatTime(callDuration)}
          </div>
        </div>
      </div>

      <div ref={dragAreaRef} className="absolute top-[100px] bottom-[100px] left-3 right-3 z-0 pointer-events-none" />

      {/* Draggable PIP Window */}
      <motion.div 
        drag
        dragMomentum={false}
        dragConstraints={dragAreaRef}
        dragElastic={0.05}
        className="absolute z-10 w-[90px] h-[135px] md:w-[105px] md:h-[155px] rounded-[18px] overflow-hidden shadow-2xl border border-white/15 bg-[#161a23]/65 backdrop-blur-xl cursor-grab active:cursor-grabbing"
        style={{ top: pipPos.top, right: pipPos.right }}
      >
        {permissionError ? (
          <div className="w-full h-full bg-[#1c1f26] flex flex-col items-center justify-center p-3 text-center gap-1.5">
            <VideoCameraSlash size={28} className="text-red-500 mb-1" />
            <p className="text-[10px] leading-[1.3] text-white/80 font-medium">{permissionError}</p>
            <button 
              onClick={() => startCamera()}
              className="mt-1 px-3 py-1 bg-teal-500/20 text-teal-400 text-[10px] font-bold rounded-full border border-teal-500/30 hover:bg-teal-500/30 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className={cn("w-full h-full object-cover mirror scale-x-[-1]", isVideoOff && "hidden")}
            />
            {isVideoOff && (
              <div className="w-full h-full bg-[#1c1f26] flex items-center justify-center">
                <VideoCameraSlash size={32} className="text-white/20" />
              </div>
            )}
          </>
        )}
        <div className="absolute bottom-2 left-2.5 bg-black/50 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] font-semibold text-white/90 pointer-events-none">You</div>
        <button 
          onClick={() => {
            if (permissionError) startCamera();
            else toggleCamera();
          }}
          className="absolute bottom-2 right-2.5 w-6 h-6 rounded-md bg-white/15 border border-white/20 text-white flex items-center justify-center text-xs transition-colors hover:bg-white/25"
        >
          <ArrowsClockwise size={12} className={cn(facingMode === "environment" && "rotate-180")} />
        </button>
      </motion.div>

      {/* Floating Action Nodes Layer */}
      <AnimatePresence>
        {activeNodes.map((node) => (
          <motion.div
            key={node}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1, bottom: getNodePos(node) }}
            exit={{ scale: 0.6, opacity: 0 }}
            className="absolute right-6 z-[11]"
          >
            <button 
              onClick={() => {
                if (node === 'passport') handlePassportTapRoute();
                else setActivePanel(activePanel === node ? null : node);
              }}
              className={cn(
                "w-[52px] h-[52px] rounded-[15px] flex items-center justify-center transition-all duration-300 backdrop-blur-xl border-[1.5px] border-[#ff65a3]/35 text-[#ff65a3] bg-[#ff65a3]/15 shadow-[0_8px_24px_rgba(255,101,163,0.15)]",
                activePanel === node && "bg-[#ff65a3] text-white border-[#ff65a3] shadow-[0_0_20px_rgba(255,101,163,0.45)]"
              )}
            >
              {node === "paw" && <PawPrint size={25} weight={activePanel === "paw" ? "fill" : "bold"} />}
              {node === "passport" && <IdentificationCard size={25} weight={activePanel === "passport" ? "fill" : "bold"} />}
              {node === "clip" && <Paperclip size={25} weight={activePanel === "clip" ? "bold" : "bold"} />}
              {node === "voice" && <Waveform size={25} weight={activePanel === "voice" ? "bold" : "bold"} />}
            </button>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* OVERLAY PANELS */}
      <AnimatePresence>
        {activePanel && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.98 }}
            className="absolute top-[50%] -translate-y-1/2 md:top-[108px] md:bottom-[100px] md:translate-y-0 left-3 md:left-4 right-3 md:right-4 z-[15] h-auto max-h-[78vh] bg-[#0d1117]/96 backdrop-blur-[40px] border border-white/[0.08] rounded-[24px] md:rounded-[28px] p-4 md:p-5 shadow-[0_30px_70px_rgba(0,0,0,0.9)] flex flex-col items-center overflow-y-auto no-scrollbar"
          >
            <button onClick={() => setActivePanel(null)} className="absolute top-[16px] md:top-[18px] right-[16px] md:right-[18px] bg-white/5 border-none text-white/55 w-7 h-7 rounded-full flex items-center justify-center transition-colors hover:bg-white/10">
              <X size={16} weight="bold" />
            </button>

            {/* Anatomy Map (Paw) */}
            {activePanel === "paw" && (
              <div className="w-full flex flex-col items-center">
                <div className="text-[16px] font-semibold mt-1.5 text-center">{petType === 'dog' ? 'Dog' : 'Cat'} Paw Anatomy Map</div>
                <div className="relative w-full min-h-[160px] md:flex-1 flex items-center justify-center my-4 md:my-5">
                  <svg className="h-[160px] md:h-[90%] md:max-h-[280px] w-auto overflow-visible" viewBox="0 0 100 110">
                    {petType === 'dog' ? (
                      <>
                        <ellipse className={cn("paw-pad-hotspot fill-white/10 stroke-white/20 stroke-[1.2] transition-all cursor-pointer hover:fill-[#ff65a3]/40 hover:stroke-[#ff65a3]", selectedPads.includes('L1') && "fill-[#ff65a3] stroke-[#ff65a3] stroke-[2] drop-shadow-[0_0_8px_rgba(255,101,163,0.8)]")} cx="22" cy="30" rx="11" ry="14" transform="rotate(-15 22 30)" onClick={() => setSelectedPads(prev => prev.includes('L1') ? prev.filter(p => p !== 'L1') : [...prev, 'L1'])} />
                        <ellipse className={cn("paw-pad-hotspot fill-white/10 stroke-white/20 stroke-[1.2] transition-all cursor-pointer hover:fill-[#ff65a3]/40 hover:stroke-[#ff65a3]", selectedPads.includes('L2') && "fill-[#ff65a3] stroke-[#ff65a3] stroke-[2] drop-shadow-[0_0_8px_rgba(255,101,163,0.8)]")} cx="41" cy="16" rx="11" ry="15" transform="rotate(-5 41 16)" onClick={() => setSelectedPads(prev => prev.includes('L2') ? prev.filter(p => p !== 'L2') : [...prev, 'L2'])} />
                        <ellipse className={cn("paw-pad-hotspot fill-white/10 stroke-white/20 stroke-[1.2] transition-all cursor-pointer hover:fill-[#ff65a3]/40 hover:stroke-[#ff65a3]", selectedPads.includes('R1') && "fill-[#ff65a3] stroke-[#ff65a3] stroke-[2] drop-shadow-[0_0_8px_rgba(255,101,163,0.8)]")} cx="63" cy="18" rx="11" ry="15" transform="rotate(5 63 18)" onClick={() => setSelectedPads(prev => prev.includes('R1') ? prev.filter(p => p !== 'R1') : [...prev, 'R1'])} />
                        <ellipse className={cn("paw-pad-hotspot fill-white/10 stroke-white/20 stroke-[1.2] transition-all cursor-pointer hover:fill-[#ff65a3]/40 hover:stroke-[#ff65a3]", selectedPads.includes('R2') && "fill-[#ff65a3] stroke-[#ff65a3] stroke-[2] drop-shadow-[0_0_8px_rgba(255,101,163,0.8)]")} cx="81" cy="34" rx="11" ry="14" transform="rotate(15 81 34)" onClick={() => setSelectedPads(prev => prev.includes('R2') ? prev.filter(p => p !== 'R2') : [...prev, 'R2'])} />
                        <path className={cn("paw-pad-hotspot fill-white/10 stroke-white/20 stroke-[1.2] transition-all cursor-pointer hover:fill-[#ff65a3]/40 hover:stroke-[#ff65a3]", selectedPads.includes('main') && "fill-[#ff65a3] stroke-[#ff65a3] stroke-[2] drop-shadow-[0_0_8px_rgba(255,101,163,0.8)]")} d="M 24,72 C 20,54 36,46 51,46 C 66,46 83,54 79,72 C 76,86 64,88 51,83 C 39,88 27,86 24,72 Z" onClick={() => setSelectedPads(prev => prev.includes('main') ? prev.filter(p => p !== 'main') : [...prev, 'main'])} />
                        <ellipse className={cn("paw-pad-hotspot fill-white/10 stroke-white/20 stroke-[1.2] transition-all cursor-pointer hover:fill-[#ff65a3]/40 hover:stroke-[#ff65a3]", selectedPads.includes('carpal') && "fill-[#ff65a3] stroke-[#ff65a3] stroke-[2] drop-shadow-[0_0_8px_rgba(255,101,163,0.8)]")} cx="51" cy="100" rx="14" ry="10" onClick={() => setSelectedPads(prev => prev.includes('carpal') ? prev.filter(p => p !== 'carpal') : [...prev, 'carpal'])} />
                      </>
                    ) : (
                      <>
                        <circle className={cn("paw-pad-hotspot fill-white/10 stroke-white/20 stroke-[1.2] transition-all cursor-pointer hover:fill-[#ff65a3]/40 hover:stroke-[#ff65a3]", selectedPads.includes('L1') && "fill-[#ff65a3] stroke-[#ff65a3] stroke-[2] drop-shadow-[0_0_8px_rgba(255,101,163,0.8)]")} cx="25" cy="35" r="9" onClick={() => setSelectedPads(prev => prev.includes('L1') ? prev.filter(p => p !== 'L1') : [...prev, 'L1'])} />
                        <circle className={cn("paw-pad-hotspot fill-white/10 stroke-white/20 stroke-[1.2] transition-all cursor-pointer hover:fill-[#ff65a3]/40 hover:stroke-[#ff65a3]", selectedPads.includes('L2') && "fill-[#ff65a3] stroke-[#ff65a3] stroke-[2] drop-shadow-[0_0_8px_rgba(255,101,163,0.8)]")} cx="42" cy="22" r="10" onClick={() => setSelectedPads(prev => prev.includes('L2') ? prev.filter(p => p !== 'L2') : [...prev, 'L2'])} />
                        <circle className={cn("paw-pad-hotspot fill-white/10 stroke-white/20 stroke-[1.2] transition-all cursor-pointer hover:fill-[#ff65a3]/40 hover:stroke-[#ff65a3]", selectedPads.includes('R1') && "fill-[#ff65a3] stroke-[#ff65a3] stroke-[2] drop-shadow-[0_0_8px_rgba(255,101,163,0.8)]")} cx="61" cy="24" r="10" onClick={() => setSelectedPads(prev => prev.includes('R1') ? prev.filter(p => p !== 'R1') : [...prev, 'R1'])} />
                        <circle className={cn("paw-pad-hotspot fill-white/10 stroke-white/20 stroke-[1.2] transition-all cursor-pointer hover:fill-[#ff65a3]/40 hover:stroke-[#ff65a3]", selectedPads.includes('R2') && "fill-[#ff65a3] stroke-[#ff65a3] stroke-[2] drop-shadow-[0_0_8px_rgba(255,101,163,0.8)]")} cx="77" cy="38" r="9" onClick={() => setSelectedPads(prev => prev.includes('R2') ? prev.filter(p => p !== 'R2') : [...prev, 'R2'])} />
                        <path className={cn("paw-pad-hotspot fill-white/10 stroke-white/20 stroke-[1.2] transition-all cursor-pointer hover:fill-[#ff65a3]/40 hover:stroke-[#ff65a3]", selectedPads.includes('main') && "fill-[#ff65a3] stroke-[#ff65a3] stroke-[2] drop-shadow-[0_0_8px_rgba(255,101,163,0.8)]")} d="M 26,70 C 23,55 35,52 40,54 C 45,46 57,46 62,54 C 67,52 79,55 76,70 C 74,84 65,85 51,81 C 37,85 28,84 26,70 Z" onClick={() => setSelectedPads(prev => prev.includes('main') ? prev.filter(p => p !== 'main') : [...prev, 'main'])} />
                        <ellipse className={cn("paw-pad-hotspot fill-white/10 stroke-white/20 stroke-[1.2] transition-all cursor-pointer hover:fill-[#ff65a3]/40 hover:stroke-[#ff65a3]", selectedPads.includes('carpal') && "fill-[#ff65a3] stroke-[#ff65a3] stroke-[2] drop-shadow-[0_0_8px_rgba(255,101,163,0.8)]")} cx="51" cy="98" rx="11" ry="8" onClick={() => setSelectedPads(prev => prev.includes('carpal') ? prev.filter(p => p !== 'carpal') : [...prev, 'carpal'])} />
                      </>
                    )}
                  </svg>
                </div>
                <div className="text-[13px] text-[#ff65a3] bg-[#ff65a3]/12 border border-[#ff65a3]/20 p-[8px_18px] rounded-2xl font-medium text-center w-full max-w-[300px]">
                  {selectedPads.length === 0 ? "No Area Selected" : selectedPads.length === 1 ? "1 Area Selected" : `${selectedPads.length} Areas Highlighted`}
                </div>
              </div>
            )}

            {/* Shared Diagnostics (Clip) */}
            {activePanel === "clip" && (
              <div className="w-full h-full flex flex-col">
                <div className="flex items-center gap-[6px] mt-1">
                  <Paperclip className="text-2xl text-[#ff65a3]" />
                  <div className="text-base font-semibold">Shared Diagnostics</div>
                </div>
                <div className="w-full flex-1 flex flex-col gap-3 mt-[10px] overflow-hidden">
                   <div className="w-full flex-1 bg-white/[0.03] border border-white/[0.08] rounded-[18px] overflow-hidden relative flex items-center justify-center">
                      <img src={USER_DOCUMENTS[galleryIndex].url} className="w-full h-full object-cover transition-opacity duration-300" alt="Primary" />
                      <div className="absolute bottom-[10px] left-[10px] bg-black/70 backdrop-blur-md p-[4px_10px] rounded-lg text-[10px] font-semibold border border-white/10 text-[#ff65a3]">
                        {USER_DOCUMENTS[galleryIndex].name}
                      </div>
                   </div>
                   <div className="flex gap-2 w-full overflow-x-auto p-[4px_2px] no-scrollbar">
                      {USER_DOCUMENTS.map((doc, idx) => (
                        <div 
                          key={idx}
                          onClick={() => setGalleryIndex(idx)}
                          className={cn(
                            "w-[54px] h-[54px] rounded-xl overflow-hidden border-2 border-transparent bg-white/5 shrink-0 cursor-pointer transition-all",
                            galleryIndex === idx && "border-[#ff65a3] shadow-[0_0_10px_rgba(255,101,163,0.3)] scale-[1.04]"
                          )}
                        >
                          <img src={doc.url} className="w-full h-full object-cover" alt="Thumb" />
                        </div>
                      ))}
                   </div>
                </div>
              </div>
            )}

            {/* Voice Insights */}
            {activePanel === "voice" && (
              <div className="w-full flex flex-col items-center">
                <div className="flex flex-col items-center w-full min-h-[64px] justify-center">
                  <div className="flex items-center gap-[6px] text-[#ff65a3] text-[20px]">
                    <Waveform weight="bold" /> <span className="text-[15px] font-bold text-white uppercase tracking-tight">Pet Voice Insights</span>
                  </div>
                  <p className="text-[11px] text-white/55 text-center px-4 mt-0.5 leading-tight">Real-time AI acoustic stream tracking animal sounds and consultation audio patterns.</p>
                </div>
                
                <div className="w-full flex items-center justify-center gap-[5px] h-[48px] md:h-[54px] my-[6px] px-[10px]">
                   {[...Array(12)].map((_, i) => (
                     <motion.div 
                        key={i} 
                        className="w-1 bg-gradient-to-b from-[#ff65a3] to-[#bf5af2] rounded-primary"
                        animate={isAnalyzingVoice || activePanel === 'voice' ? { height: [12, 35, 15, 45, 12] } : { height: 12 }}
                        transition={{ repeat: Infinity, duration: 0.8 + Math.random(), ease: "easeInOut", delay: i * 0.05 }}
                     />
                   ))}
                </div>

                <div className="w-full h-[46px] bg-white/[0.04] border border-white/[0.07] rounded-xl px-3.5 mb-2.5 flex items-center justify-between shrink-0">
                   <div className="flex items-center gap-2 text-xs font-semibold overflow-hidden">
                      <div className={cn("w-2 h-2 rounded-full shadow-[0_0_8px] shrink-0", isAnalyzingVoice ? "bg-[#00e5ff] shadow-[#00e5ff]" : "bg-[#ff65a3] shadow-[#ff65a3]")} />
                      <span className="truncate">{isAnalyzingVoice ? "AI Analysis Active..." : "Monitoring Acoustic Link..."}</span>
                   </div>
                   <div className="text-[10px] font-bold text-[#ff65a3] uppercase bg-[#ff65a3]/12 px-2 py-[3px] rounded-md shrink-0">
                    {voiceResult ? voiceResult.tag : "Live Feed"}
                   </div>
                </div>

                <div className="bg-[#ff65a3]/5 border border-[#ff65a3]/15 rounded-2xl p-4 mb-2.5 w-full h-[100px] md:h-[120px] shrink-0 overflow-y-auto no-scrollbar flex items-center justify-center shadow-inner">
                   {voiceResult ? (
                     <div className="text-center w-full animate-in zoom-in-95 duration-300">
                        <CheckCircle className="text-[#30d158] inline-block mb-1.5" size={18} weight="fill" />
                        <p className="text-[13px] leading-relaxed font-medium"><strong>AI Insight ({voiceResult.meta}):</strong> {voiceResult.desc}</p>
                     </div>
                   ) : (
                     <div className="text-center w-full">
                        <MicrophoneStage className="text-[#ff65a3] inline-block mb-1.5" size={20} />
                        <p className="text-[13px] text-white/55 font-medium leading-relaxed px-2 text-center">Tap the evaluation button below to let the AI process the pet vocal stream audio markers.</p>
                     </div>
                   )}
                </div>

                <div className="grid grid-cols-2 gap-2.5 w-full mb-1 shrink-0">
                   {[
                     { label: "Acoustic Target", val: voiceResult ? voiceResult.label : "--" },
                     { label: "Sound Matrix", val: voiceResult ? voiceResult.intensity : "--" }
                   ].map((m, i) => (
                     <div key={i} className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-[10px_12px] h-[52px] flex flex-col justify-center gap-[1px] overflow-hidden">
                        <span className="text-[10px] text-white/55 font-medium uppercase tracking-tight">{m.label}</span>
                        <h5 className="text-xs font-semibold truncate">{m.val}</h5>
                     </div>
                   ))}
                </div>

                <button 
                  disabled={isAnalyzingVoice}
                  onClick={runVoiceAnalysis}
                  className="w-full h-[46px] bg-gradient-to-br from-[#ff65a3] to-[#d43d7c] border-none rounded-xl text-[13px] font-bold mt-2 flex items-center justify-center gap-2 shadow-2xl active:scale-95 transition-all shrink-0"
                >
                  {isAnalyzingVoice ? <CircleNotch className="animate-spin" size={18} /> : <Sparkles size={18} />}
                  <span>{isAnalyzingVoice ? "Analyzing Stream..." : "Analyze Live Vocal Stream"}</span>
                </button>

                <div className="text-[9px] text-white/25 text-center mt-2.5 leading-tight border-t border-white/5 pt-2 w-full shrink-0">
                  Acoustic metadata analytics utility for diagnostic context. Not a medical diagnosis.
                </div>
              </div>
            )}

            {/* Health Passport */}
            {activePanel === "passport" && (
              <div className="w-full h-full flex flex-col">
                <div className="flex items-center gap-[6px] text-[#ff65a3] text-[22px]">
                  <IdentificationCard weight="fill" /> <span className="text-[15px] font-bold text-white">Pet Health Passport</span>
                </div>
                
                <div className="flex gap-2 w-full overflow-x-auto p-[4px_0_12px_0] mt-3.5 no-scrollbar">
                  {passportItems.map((item, idx) => (
                    <button 
                      key={idx}
                      onClick={() => setActivePassportTab(item)}
                      className={cn(
                        "bg-white/5 border border-white/[0.08] text-white/55 p-[8px_14px] rounded-xl text-[11px] font-semibold capitalize whitespace-nowrap transition-all",
                        activePassportTab === item && "bg-[#ff65a3]/15 border-[#ff65a3] text-[#ff65a3]"
                      )}
                    >
                      {item}
                    </button>
                  ))}
                </div>
                
                <div className="w-full flex-1 bg-white/[0.03] border border-white/[0.06] rounded-[18px] p-4 mt-1.5 flex flex-col justify-center items-center gap-2.5">
                   {activePassportTab ? (
                     <>
                        {(() => {
                           const data = PASSPORT_DATA[activePassportTab as keyof typeof PASSPORT_DATA];
                           const Icon = data.icon;
                           return (
                             <>
                               <Icon className="text-[32px] text-[#ff65a3] mb-1" />
                               <div className="text-sm font-semibold capitalize">{data.title}</div>
                               <div className="text-[11px] text-white/55 text-center px-2.5 leading-relaxed">{data.desc}</div>
                             </>
                           );
                        })()}
                     </>
                   ) : (
                     <div className="text-white/20">Select parameters</div>
                   )}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Configuration Slider Sheet */}
      <div className={cn("absolute inset-0 z-[18] bg-black/40 opacity-0 pointer-events-none transition-opacity", showSlider && "opacity-100 pointer-events-auto")} onClick={() => setShowSlider(false)} />
      
        <motion.div
          animate={showSlider ? { y: 0 } : { y: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="absolute bottom-0 left-0 right-0 bg-[#0d1117]/96 backdrop-blur-[40px] border-t border-white/[0.08] rounded-[32px_32px_0_0] p-6 pb-12 z-20 shadow-[0_-15px_40px_rgba(0,0,0,0.6)]"
        >
        <div className="w-[42px] h-[5px] bg-white/25 rounded-[3px] mx-auto mb-5 cursor-grab" onClick={() => setShowSlider(false)} />
        
        {/* Main Hub Menu */}
        <AnimatePresence mode="wait">
          {sliderView === "hub" ? (
            <motion.div 
              key="hub"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex justify-center items-center gap-6 py-4"
            >
              {[
                { id: "paw", icon: PawPrint, weight: "fill" },
                { id: "passport", icon: IdentificationCard, weight: "fill" },
                { id: "clip", icon: Paperclip, weight: "bold" },
                { id: "voice", icon: Waveform, weight: "fill" }
              ].map((b) => (
                <button 
                  key={b.id} 
                  onClick={() => setSliderView(b.id as "hub" | "paw" | "passport" | "clip" | "voice")}
                  className="w-14 h-14 rounded-[18px] bg-white/5 border border-white/10 flex items-center justify-center text-[#ff65a3] border-[#ff65a3]/20 transition-transform active:scale-90"
                >
                  <b.icon size={26} weight={b.weight as "fill" | "bold"} />
                </button>
              ))}
            </motion.div>
          ) : (
            <motion.div 
              key="sub"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
               <div className="flex items-center gap-3 mb-[18px]">
                  <button onClick={() => setSliderView('hub')} className="text-white/55 text-lg p-1 hover:text-white transition-colors">
                    <CaretLeft weight="bold" />
                  </button>
                  <div className="flex flex-col">
                    <h4 className="text-[15px] font-semibold capitalize">{sliderView === 'paw' ? 'Anatomy Mapping' : sliderView === 'clip' ? 'Attachment Pipeline' : sliderView === 'voice' ? 'Pet Voice Insights' : 'Health Identification'} Setup</h4>
                    <p className="text-[11px] text-white/55">Configure dynamic {sliderView} parameters</p>
                  </div>
               </div>

               {/* Sub-panels logic */}
               <div className="space-y-4">
                  {sliderView === 'paw' && (
                    <>
                      <div className="flex justify-between items-center py-3 border-b border-white/5">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">Pet Archetype</span>
                          <small className="text-[11px] text-white/55">Choose target physical map layer</small>
                        </div>
                        <div className="flex bg-white/5 p-[3px] rounded-xl">
                          <button onClick={() => setPetType('dog')} className={cn("px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all", petType === 'dog' ? "bg-white/10 text-white" : "text-white/55")}>Dog</button>
                          <button onClick={() => setPetType('cat')} className={cn("px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all", petType === 'cat' ? "bg-white/10 text-white" : "text-white/55")}>Cat</button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center py-3">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">Enable Anatomy Map</span>
                          <small className="text-[11px] text-white/55">Activate Paw Icon screen interface trigger</small>
                        </div>
                        <label className="relative inline-block w-[46px] h-[26px] cursor-pointer">
                          <input type="checkbox" checked={activeNodes.includes('paw')} onChange={(e) => syncActivationFlow('paw', e.target.checked)} className="opacity-0 w-0 h-0 peer" />
                          <div className="absolute inset-0 bg-white/15 rounded-[34px] transition-all peer-checked:bg-[#30d158] after:content-[''] after:absolute after:h-[20px] after:w-[20px] after:left-[3px] after:bottom-[3px] after:bg-white after:rounded-full after:transition-all peer-checked:after:translate-x-[20px]" />
                        </label>
                      </div>
                    </>
                  )}

                  {sliderView === 'passport' && (
                    <>
                      <div className="flex justify-between items-center pb-1">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">Enable Passport Tracker</span>
                          <small className="text-[11px] text-white/55">Activate floating target on interface</small>
                        </div>
                        <label className="relative inline-block w-[46px] h-[26px] cursor-pointer">
                          <input type="checkbox" checked={activeNodes.includes('passport')} onChange={(e) => syncActivationFlow('passport', e.target.checked)} className="opacity-0 w-0 h-0 peer" />
                          <div className="absolute inset-0 bg-white/15 rounded-[34px] transition-all peer-checked:bg-[#30d158] after:content-[''] after:absolute after:h-[20px] after:w-[20px] after:left-[3px] after:bottom-[3px] after:bg-white after:rounded-full after:transition-all peer-checked:after:translate-x-[20px]" />
                        </label>
                      </div>
                      <div className="mt-3 flex flex-col gap-2">
                        {Object.keys(PASSPORT_DATA).map((item) => {
                          const data = PASSPORT_DATA[item as keyof typeof PASSPORT_DATA];
                          const Icon = data.icon;
                          const selected = passportItems.includes(item);
                          return (
                            <div key={item} onClick={() => toggleChecklistItem(item)} className={cn("flex justify-between items-center bg-white/[0.03] border border-white/[0.04] p-[12px_16px] rounded-xl cursor-pointer transition-colors hover:bg-white/[0.06]", selected && "bg-white/[0.06]")}>
                              <div className="flex items-center gap-3">
                                <Icon className={cn("text-xl text-white/55 transition-colors", selected && "text-[#ff65a3]")} weight="fill" />
                                <span className={cn("text-[13px] font-medium capitalize", selected && "text-white")}>{item}</span>
                              </div>
                              <div className={cn("w-[18px] h-[18px] rounded-full border-2 border-white/20 flex items-center justify-center transition-all", selected && "border-[#ff65a3] bg-[#ff65a3]")}>
                                {selected && <Check size={11} weight="bold" className="text-black" />}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}

                  {(sliderView === 'clip' || sliderView === 'voice') && (
                    <div className="flex justify-between items-center py-3">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">Enable {sliderView === 'clip' ? 'Upload Hub' : 'AI Voice Analysis'}</span>
                        <small className="text-[11px] text-white/55">Activate floating {sliderView === 'clip' ? 'asset' : 'node'} on view layer</small>
                      </div>
                      <label className="relative inline-block w-[46px] h-[26px] cursor-pointer">
                        <input type="checkbox" checked={activeNodes.includes(sliderView)} onChange={(e) => syncActivationFlow(sliderView, e.target.checked)} className="opacity-0 w-0 h-0 peer" />
                        <div className="absolute inset-0 bg-white/15 rounded-[34px] transition-all peer-checked:bg-[#30d158] after:content-[''] after:absolute after:h-[20px] after:w-[20px] after:left-[3px] after:bottom-[3px] after:bg-white after:rounded-full after:transition-all peer-checked:after:translate-x-[20px]" />
                      </label>
                    </div>
                  )}
               </div>

               <button onClick={() => setShowSlider(false)} className="w-full bg-white/[0.08] border border-white/[0.05] text-white p-3 rounded-xl text-[13px] font-semibold mt-4 transition-colors hover:bg-white/15">Done</button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Bottom Dock (Controls) */}
      <div className="absolute bottom-[40px] md:bottom-[50px] left-3 md:left-5 right-3 md:right-5 z-10 flex justify-center">
        <div className="bg-[rgba(20,24,30,0.85)] backdrop-blur-[40px] border border-white/5 rounded-[28px] md:rounded-[32px] p-[10px_12px] md:p-[14px_16px] flex items-center justify-between shadow-[0_24px_50px_rgba(0,0,0,0.85)] w-full max-w-[420px]">
          <div className="flex-1 flex justify-center">
            <button onClick={() => { setSliderView('hub'); setShowSlider(true); }} className="w-[46px] h-[46px] md:w-[52px] md:h-[52px] rounded-full bg-white/10 flex items-center justify-center transition-all active:scale-90 hover:bg-white/20">
               <DotsThree size={22} weight="bold" />
            </button>
          </div>
          <div className="flex-1 flex justify-center relative">
            <button onClick={() => setIsVideoOff(!isVideoOff)} className={cn("w-[46px] h-[46px] md:w-[52px] md:h-[52px] rounded-full bg-white/10 flex items-center justify-center transition-all active:scale-90 hover:bg-white/20", isVideoOff && "text-white/40")}>
               {isVideoOff ? <VideoCameraSlash size={22} /> : <VideoCamera size={22} />}
            </button>
          </div>
          <div className="flex-1 flex justify-center">
            <button onClick={() => setIsSpeakerOff(!isSpeakerOff)} className={cn("w-[50px] h-[50px] md:w-[56px] md:h-[56px] rounded-full flex items-center justify-center transition-all active:scale-90", isSpeakerOff ? "bg-white/10 text-white/40" : "bg-white text-black")}>
               {isSpeakerOff ? <SpeakerNone size={24} /> : <SpeakerHigh size={24} weight="fill" />}
            </button>
          </div>
          <div className="flex-1 flex justify-center">
            <button onClick={() => setIsMuted(!isMuted)} className={cn("w-[46px] h-[46px] md:w-[52px] md:h-[52px] rounded-full bg-white/10 flex items-center justify-center transition-all active:scale-90 hover:bg-white/20", isMuted && "text-white/40")}>
               {isMuted ? <MicrophoneSlash size={22} /> : <Microphone size={22} />}
            </button>
          </div>
          <div className="flex-1 flex justify-center">
            <button onClick={handleEndCall} className="w-[50px] h-[50px] md:w-[56px] md:h-[56px] rounded-full bg-[#ea4335] text-white flex items-center justify-center shadow-lg active:scale-90 transition-transform">
               <Phone size={24} weight="fill" className="rotate-[135deg]" />
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .mirror { transform: scaleX(-1); }
        .rounded-primary { border-radius: 4px; }
      `}</style>
    </div>
  );
};

export default VideoCall;
