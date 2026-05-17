import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Peer from "simple-peer";
import { Mic, MicOff, PhoneOff, Camera, CameraOff, X, FileText, Info, Paperclip, Check } from "lucide-react";
import { 
  LockSimple, 
  ArrowsClockwise, 
  VideoCamera, 
  VideoCameraSlash, 
  SpeakerHigh, 
  SpeakerNone, 
  Microphone, 
  MicrophoneSlash, 
  Phone, 
  DotsThree,
  CaretRight,
  Waveform,
  PawPrint,
  ShieldCheck
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const USER_DOCUMENTS = [
  { name: "Blood Test Report", type: "pdf", date: "2023-11-15", url: "https://images.unsplash.com/photo-1576091160550-217359f4ecf8?w=800&h=1200&fit=crop" },
  { name: "X-Ray Chest", type: "img", date: "2023-11-16", url: "https://images.unsplash.com/photo-1581594658553-35942489435b?w=800&h=1200&fit=crop" },
];

const PASSPORT_DATA = {
  "health records": { title: "Clinical Case Sheets", desc: "Primary vet clinical summary, health tracking diagnostics telemetry records, and systemic updates log lines.", icon: ShieldCheck },
  "medication": { title: "Prescriptions Timelines", desc: "Active pharmaceutical medical treatment cycles, schedule anti-parasitic metrics, and custom drug dosages maps.", icon: ShieldCheck },
  "lab reports": { title: "Diagnostic Blood Panels", desc: "Comprehensive hematology panels, microbiological cultures data, metabolic checks, and laboratory values charts.", icon: ShieldCheck },
  "full health history": { title: "Chronological Life Summary", desc: "Master digital overview tracker summary mapping health logs from early puppy stages up to recent clinical setups.", icon: ShieldCheck }
};

const InstantVideoCall = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const dragAreaRef = useRef<HTMLDivElement>(null);
  const { consultation, vet, petName, appointmentId } = location.state || {};
  
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSpeakerOff, setIsSpeakerOff] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  
  // Real-time synced states from Vet
  const [activeNodes, setActiveNodes] = useState<string[]>([]);
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [selectedPads, setSelectedPads] = useState<string[]>([]);
  const [activePassportTab, setActivePassportTab] = useState<string | null>(null);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [voiceResult, setVoiceResult] = useState<string | null>(null);
  const [isAnalyzingVoice, setIsAnalyzingVoice] = useState(false);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<Peer.Instance | null>(null);
  const petType = consultation?.pet_type?.toLowerCase() || 'dog';

  // Remote Info
  const remoteInfo = {
    name: vet?.name || consultation?.vet_profiles?.full_name || "Dr. Vikram Malhotra",
    image: vet?.image || "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=800&h=1200&fit=crop",
    specialty: vet?.specialization || "Senior Veterinarian"
  };

  // Sync with Vet and handle WebRTC
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
        initiator: false,
        trickle: true,
        stream: stream
      });

      p.on("signal", (data) => {
        channel.send({
          type: "broadcast",
          event: "WEBRTC_SIGNAL",
          payload: { signal: data, sender: "user" }
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
        if (payload.sender === "vet") {
          if (!peerRef.current) initPeer();
          peerRef.current?.signal(payload.signal);
        }
      })
      .on("broadcast", { event: "VET_UI_SYNC" }, ({ payload }) => {
        console.log("Received Sync Data:", payload);
        if (payload.activeNodes !== undefined) setActiveNodes(payload.activeNodes);
        if (payload.activePanel !== undefined) setActivePanel(payload.activePanel);
        if (payload.selectedPads !== undefined) setSelectedPads(payload.selectedPads);
        if (payload.activePassportTab !== undefined) setActivePassportTab(payload.activePassportTab);
        if (payload.galleryIndex !== undefined) setGalleryIndex(payload.galleryIndex);
        if (payload.voiceResult !== undefined) setVoiceResult(payload.voiceResult);
        if (payload.isAnalyzingVoice !== undefined) setIsAnalyzingVoice(payload.isAnalyzingVoice);
      })
      .subscribe();

    return () => {
      if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
      }
      supabase.removeChannel(channel);
    };
  }, [appointmentId, stream]);

  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async (constraints: MediaStreamConstraints = { video: { facingMode }, audio: !isMuted }) => {
    try {
      setPermissionDenied(false);
      
      if (!window.isSecureContext) {
        throw new Error("Camera access requires a secure (HTTPS) context.");
      }

      const userStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(userStream);
      streamRef.current = userStream;
      if (videoRef.current) {
        videoRef.current.srcObject = userStream;
      }
    } catch (err: unknown) {
      let errorMsg = "Permission denied. Please check your browser's camera/mic settings.";
      const errName = (err as Error).name || "";
      const errMsg = (err as Error).message || "";
      
      const isPermissionDenied = 
        errName === "NotAllowedError" || 
        errName === "PermissionDeniedError" || 
        errMsg.toLowerCase().includes("permission denied");

      if (isPermissionDenied) {
        errorMsg = "Access denied. We need camera/mic for the call. Please click the camera icon in your browser's address bar to 'Allow' access. If you're using AI Studio, try clicking 'Open in new tab' at the top right of the preview.";
      } else if (errName === "NotFoundError" || errName === "DevicesNotFoundError") {
        errorMsg = "No camera or microphone found on your device.";
      }
      
      setPermissionDenied(true);
      toast.error(errorMsg);
    }
  }, [facingMode, isMuted]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);

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

  const toggleVideo = () => {
    if (stream) {
      const track = stream.getVideoTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
        setIsVideoOff(!track.enabled);
      }
    } else {
      startCamera();
    }
  };

  const handleEndCall = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    navigate("/vet/preparing-prescription", { state: { ...location.state, callDuration } });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div ref={containerRef} className="h-screen w-screen relative overflow-hidden bg-[#07080a] font-sans text-white">
      {/* Remote Video (Background) */}
      <div className="absolute inset-0 z-0 bg-black">
        {remoteStream ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover opacity-90"
          />
        ) : (
          <img 
            src={remoteInfo.image}
            alt={remoteInfo.name}
            className="w-full h-full object-cover opacity-90"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 z-[2] pointer-events-none" />
      </div>

      {/* Top Status */}
      <div className="absolute top-[26px] left-1/2 -translate-x-1/2 z-[12] bg-black/50 backdrop-blur-xl border border-white/10 px-3 py-1.5 rounded-full flex items-center gap-1.5 translate-y-[-100%] shadow-lg">
        <LockSimple size={13} className="text-white/90" />
        <span className="text-[11px] font-medium text-white/95 uppercase tracking-wider">End-to-end encrypted</span>
      </div>

      {/* Header */}
      <div className="absolute top-[30px] left-4 right-4 z-10 bg-[rgba(22,26,35,0.65)] backdrop-blur-[35px] border border-white/10 rounded-[24px] p-2 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-3 pl-1">
          <div className="w-10 h-10 rounded-2xl overflow-hidden border border-white/10 p-0.5 bg-gray-800">
            <img src={remoteInfo.image} alt={remoteInfo.name} className="w-full h-full object-cover rounded-xl" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white">{remoteInfo.name}</h3>
            <div className="flex items-center gap-1.5">
              <div className="w-1 h-1 rounded-full bg-[#30d158] animate-pulse" />
              <span className="text-[10px] text-white/60 font-bold uppercase tracking-widest">{remoteInfo.specialty}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 pr-1">
          <div className="bg-white/10 rounded-xl px-3 py-2 border border-white/5 min-w-[70px] text-center">
            <span className="text-white font-mono font-black text-sm">{formatTime(callDuration)}</span>
          </div>
          <button onClick={() => setShowSummary(true)} className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/10 active:scale-95 transition-all text-white">
            <Info size={20} />
          </button>
        </div>
      </div>

      <div ref={dragAreaRef} className="absolute top-[100px] bottom-[120px] left-3 right-3 z-0 pointer-events-none" />

      {/* Floating Nodes (Synced) */}
      <div className="absolute top-[105px] right-4 z-20 flex flex-col gap-3">
        {activeNodes.includes('paw') && (
          <motion.button initial={{ scale: 0, x: 20 }} animate={{ scale: 1, x: 0 }} onClick={() => setActivePanel(activePanel === "paw" ? null : "paw")}
            className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl border transition-all active:scale-90", activePanel === "paw" ? "bg-[#ff65a3] border-[#ff65a3]" : "bg-[rgba(13,17,23,0.85)] border-white/10 backdrop-blur-xl")}>
            <PawPrint size={22} weight="bold" />
          </motion.button>
        )}
        {activeNodes.includes('passport') && (
          <motion.button initial={{ scale: 0, x: 20 }} animate={{ scale: 1, x: 0 }} onClick={() => setActivePanel(activePanel === "passport" ? null : "passport")}
            className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl border transition-all active:scale-90", activePanel === "passport" ? "bg-[#4f86ff] border-[#4f86ff]" : "bg-[rgba(13,17,23,0.85)] border-white/10 backdrop-blur-xl")}>
            <LockSimple size={22} weight="bold" />
          </motion.button>
        )}
        {activeNodes.includes('clip') && (
          <motion.button initial={{ scale: 0, x: 20 }} animate={{ scale: 1, x: 0 }} onClick={() => setActivePanel(activePanel === "clip" ? null : "clip")}
            className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl border transition-all active:scale-90", activePanel === "clip" ? "bg-amber-500 border-amber-500" : "bg-[rgba(13,17,23,0.85)] border-white/10 backdrop-blur-xl")}>
            <Paperclip size={22} weight="bold" />
          </motion.button>
        )}
        {activeNodes.includes('voice') && (
          <motion.button initial={{ scale: 0, x: 20 }} animate={{ scale: 1, x: 0 }} onClick={() => setActivePanel(activePanel === "voice" ? null : "voice")}
            className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl border transition-all active:scale-90", activePanel === "voice" ? "bg-teal-500 border-teal-500" : "bg-[rgba(13,17,23,0.85)] border-white/10 backdrop-blur-xl")}>
            <Waveform size={22} weight="bold" />
          </motion.button>
        )}
      </div>

      {/* Overlay Panels */}
      <AnimatePresence>
        {activePanel && (
          <motion.div initial={{ opacity: 0, y: 30, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 30, scale: 0.98 }}
            className="absolute top-[50%] -translate-y-1/2 left-3 right-3 z-30 max-h-[70vh] bg-[#0d1117]/96 backdrop-blur-[40px] border border-white/[0.08] rounded-[28px] p-5 shadow-2xl flex flex-col items-center overflow-y-auto no-scrollbar">
            <button onClick={() => setActivePanel(null)} className="absolute top-4 right-4 bg-white/5 text-white/55 w-8 h-8 rounded-full flex items-center justify-center shadow-md">
              <X size={18} weight="bold" />
            </button>

            {activePanel === "paw" && (
              <div className="w-full flex flex-col items-center text-center">
                <div className="text-[16px] font-bold mt-2">{petType === 'dog' ? 'Dog' : 'Cat'} Anatomy Map</div>
                <p className="text-[11px] text-white/40 mt-1 uppercase font-black tracking-widest">Synced with Specialist</p>
                <div className="relative w-full h-[240px] flex items-center justify-center my-6">
                  <svg className="h-full w-auto overflow-visible" viewBox="0 0 100 110">
                    {petType === 'dog' ? (
                       <>
                         <ellipse className={cn("fill-white/10 transition-all", selectedPads.includes('L1') && "fill-[#ff65a3] drop-shadow-[0_0_8px_rgba(255,101,163,0.8)]")} cx="22" cy="30" rx="11" ry="14" transform="rotate(-15 22 30)" />
                         <ellipse className={cn("fill-white/10 transition-all", selectedPads.includes('L2') && "fill-[#ff65a3] drop-shadow-[0_0_8px_rgba(255,101,163,0.8)]")} cx="41" cy="16" rx="11" ry="15" transform="rotate(-5 41 16)" />
                         <ellipse className={cn("fill-white/10 transition-all", selectedPads.includes('R1') && "fill-[#ff65a3] drop-shadow-[0_0_8px_rgba(255,101,163,0.8)]")} cx="63" cy="18" rx="11" ry="15" transform="rotate(5 63 18)" />
                         <ellipse className={cn("fill-white/10 transition-all", selectedPads.includes('R2') && "fill-[#ff65a3] drop-shadow-[0_0_8px_rgba(255,101,163,0.8)]")} cx="81" cy="34" rx="11" ry="14" transform="rotate(15 81 34)" />
                         <path className={cn("fill-white/10 transition-all", selectedPads.includes('main') && "fill-[#ff65a3] drop-shadow-[0_0_8px_rgba(255,101,163,0.8)]")} d="M 24,72 C 20,54 36,46 51,46 C 66,46 83,54 79,72 C 76,86 64,88 51,83 C 39,88 27,86 24,72 Z" />
                         <ellipse className={cn("fill-white/10 transition-all", selectedPads.includes('carpal') && "fill-[#ff65a3] drop-shadow-[0_0_8px_rgba(255,101,163,0.8)]")} cx="51" cy="100" rx="14" ry="10" />
                       </>
                    ) : (
                       <>
                         <circle className={cn("fill-white/10 transition-all", selectedPads.includes('L1') && "fill-[#ff65a3] drop-shadow-[0_0_8px_rgba(255,101,163,0.8)]")} cx="25" cy="35" r="9" />
                         <circle className={cn("fill-white/10 transition-all", selectedPads.includes('L2') && "fill-[#ff65a3] drop-shadow-[0_0_8px_rgba(255,101,163,0.8)]")} cx="42" cy="22" r="10" />
                         <circle className={cn("fill-white/10 transition-all", selectedPads.includes('R1') && "fill-[#ff65a3] drop-shadow-[0_0_8px_rgba(255,101,163,0.8)]")} cx="61" cy="24" r="10" />
                         <circle className={cn("fill-white/10 transition-all", selectedPads.includes('R2') && "fill-[#ff65a3] drop-shadow-[0_0_8px_rgba(255,101,163,0.8)]")} cx="77" cy="38" r="9" />
                         <path className={cn("fill-white/10 transition-all", selectedPads.includes('main') && "fill-[#ff65a3] drop-shadow-[0_0_8px_rgba(255,101,163,0.8)]")} d="M 26,70 C 23,55 35,52 40,54 C 45,46 57,46 62,54 C 67,52 79,55 76,70 C 74,84 65,85 51,81 C 37,85 28,84 26,70 Z" />
                         <ellipse className={cn("fill-white/10 transition-all", selectedPads.includes('carpal') && "fill-[#ff65a3] drop-shadow-[0_0_8px_rgba(255,101,163,0.8)]")} cx="51" cy="98" rx="11" ry="8" />
                       </>
                    )}
                  </svg>
                </div>
                <div className="text-[13px] text-[#ff65a3] font-bold px-5 py-2.5 bg-[#ff65a3]/10 rounded-2xl border border-[#ff65a3]/20">
                  {selectedPads.length === 0 ? "Analyzing Areas..." : `${selectedPads.length} Concern Areas Tracked`}
                </div>
              </div>
            )}

            {activePanel === "clip" && (
              <div className="w-full flex flex-col items-center">
                 <div className="flex items-center gap-2 mt-2">
                   <Paperclip className="text-[#ff65a3]" size={20} />
                   <div className="text-base font-bold">Shared Diagnostics</div>
                 </div>
                 <div className="w-full aspect-[4/5] bg-white/5 rounded-3xl mt-5 overflow-hidden border border-white/10">
                   <img src={USER_DOCUMENTS[galleryIndex].url} className="w-full h-full object-cover" />
                 </div>
                 <div className="mt-4 px-4 py-2 bg-white/5 rounded-full text-[11px] font-bold text-white/50 border border-white/10 uppercase tracking-widest">{USER_DOCUMENTS[galleryIndex].name}</div>
              </div>
            )}

            {activePanel === "voice" && (
              <div className="w-full flex flex-col items-center text-center">
                <div className="flex items-center gap-2 mt-2">
                   <Waveform className="text-teal-400" size={24} weight="fill" />
                   <div className="text-base font-bold text-teal-400 uppercase tracking-widest">Pet Voice Analysis</div>
                </div>
                <div className="w-full bg-white/5 rounded-3xl p-8 mt-5 flex flex-col items-center border border-white/10">
                   {isAnalyzingVoice ? (
                     <div className="flex flex-col items-center gap-4">
                       <div className="flex gap-1 items-center h-12">
                         {[1,2,3,4,5].map(i => <motion.div key={i} animate={{ height: [12, 36, 12] }} transition={{ repeat: Infinity, duration: 0.8, delay: i*0.1 }} className="w-1.5 bg-teal-400 rounded-full" />)}
                       </div>
                       <p className="text-teal-400/80 font-bold text-[10px] uppercase tracking-widest animate-pulse">Analyzing Frequencies...</p>
                     </div>
                   ) : (
                     <div>
                       <div className="text-teal-400 font-black text-2xl mb-1 tracking-tight">{voiceResult || "Acoustic Normal"}</div>
                       <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Vocal Signature Detected</p>
                     </div>
                   )}
                </div>
              </div>
            )}

            {activePanel === "passport" && (
              <div className="w-full flex flex-col items-center">
                <div className="text-[17px] font-bold mb-5 flex items-center gap-2">
                   <LockSimple size={20} className="text-[#4f86ff]" />
                   Sruvo Health Passport
                </div>
                {activePassportTab && PASSPORT_DATA[activePassportTab as keyof typeof PASSPORT_DATA] ? (
                   <div className="w-full bg-white/5 p-5 rounded-3xl border border-white/10">
                     <div className="flex items-center justify-between mb-4">
                       <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-2xl bg-[#4f86ff]/10 flex items-center justify-center text-[#4f86ff] font-black text-xs uppercase">HP</div>
                         <div>
                           <h4 className="font-bold text-sm">{PASSPORT_DATA[activePassportTab as keyof typeof PASSPORT_DATA].title}</h4>
                           <p className="text-[10px] text-white/40 uppercase font-black">Verified by Sruvo</p>
                         </div>
                       </div>
                       <Check className="text-green-400" size={18} />
                     </div>
                     <p className="text-white/60 text-xs leading-relaxed">
                       {PASSPORT_DATA[activePassportTab as keyof typeof PASSPORT_DATA].desc}
                     </p>
                   </div>
                ) : (
                   <div className="text-white/20 font-bold py-10 uppercase text-xs tracking-widest">Awaiting Diagnostic Data...</div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* PIP Window (YOU) */}
      <motion.div drag dragMomentum={false} dragConstraints={dragAreaRef} dragElastic={0.05}
        className="absolute z-20 w-[95px] h-[145px] rounded-[22px] overflow-hidden shadow-2xl border-2 border-white/20 bg-gray-900 pointer-events-auto relative cursor-grab active:cursor-grabbing">
        <video ref={videoRef} autoPlay playsInline muted className={cn("w-full h-full object-cover mirror scale-x-[-1]", (isVideoOff || permissionDenied) && "hidden")} />
        {(isVideoOff || permissionDenied) && (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-800 p-2 text-center">
            <CameraOff className={cn("w-8 h-8", permissionDenied ? "text-red-400" : "text-white/40")} />
            {permissionDenied ? (
              <>
                <p className="text-[8px] text-red-200 mt-2 font-bold uppercase tracking-tighter leading-tight mb-1">Access Needed</p>
                <button 
                  onClick={(e) => { e.stopPropagation(); startCamera(); }}
                  className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-md text-[9px] font-bold border border-white/10 transition-colors"
                >
                  RETRY
                </button>
              </>
            ) : (
              <p className="text-[8px] text-white/40 mt-2 font-bold uppercase tracking-tighter">Video Off</p>
            )}
          </div>
        )}
        <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md rounded-full px-2.5 py-1 flex items-center gap-1.5 pointer-events-none ring-1 ring-white/10">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
          <span className="text-[9px] text-white font-black uppercase tracking-widest pl-1">YOU</span>
        </div>
        <button onClick={toggleCamera} className="absolute top-2.5 right-2.5 w-7 h-7 rounded-lg bg-black/40 backdrop-blur-md border border-white/20 text-white flex items-center justify-center active:scale-90">
          <ArrowsClockwise size={14} className={cn(facingMode === "environment" && "rotate-180")} />
        </button>
      </motion.div>

      {/* Bottom Controls */}
      <div className="absolute bottom-10 left-0 right-0 z-20 px-6">
        <div className="max-w-md mx-auto">
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-r from-pink-500/90 to-violet-500/90 backdrop-blur-2xl rounded-full px-5 py-2.5 flex items-center gap-3 shadow-xl border border-white/20">
              <ShieldCheck size={14} className="text-white" />
              <span className="text-[12px] text-white font-bold tracking-wide uppercase">Private Connection Established</span>
            </div>
          </div>

          <div className="flex items-center justify-around bg-[rgba(20,24,30,0.8)] backdrop-blur-[40px] rounded-[32px] p-6 border border-white/5 shadow-2xl">
            <button onClick={() => { if (stream) { const track = stream.getAudioTracks()[0]; if (track) { track.enabled = !track.enabled; setIsMuted(!track.enabled); } } }}
              className={cn("w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg active:scale-90", isMuted ? "bg-white/10 text-white/40" : "bg-white/10 text-white")}>
              {isMuted ? <MicrophoneSlash size={24} /> : <Microphone size={24} />}
            </button>

            <button onClick={handleEndCall} className="w-18 h-18 bg-[#ea4335] rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform">
              <Phone size={30} weight="fill" className="text-white rotate-[135deg]" />
            </button>

            <button onClick={toggleVideo} className={cn("w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg active:scale-90", isVideoOff ? "bg-white/10 text-white/40" : "bg-white/10 text-white")}>
              {isVideoOff ? <VideoCameraSlash size={24} /> : <VideoCamera size={24} />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showSummary && (
          <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} className="absolute top-0 right-0 w-full md:w-96 h-full bg-[#0d1117] z-[60] p-6 shadow-2xl overflow-y-auto border-l border-white/10">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center text-pink-400"><FileText size={20} /></div>
                <h2 className="text-xl font-bold text-white">Consultation Summary</h2>
              </div>
              <button onClick={() => setShowSummary(false)} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/50"><X size={20} /></button>
            </div>
            <div className="space-y-8">
              <section>
                <h3 className="text-xs font-black text-pink-400 uppercase tracking-widest mb-4">Patient Profile</h3>
                <div className="bg-white/5 rounded-2xl p-5 border border-white/5 text-white/80"><span className="font-bold text-white">{consultation?.pet_name || petName || "Bella"}</span> ({petType})</div>
              </section>
              <section>
                <h3 className="text-xs font-black text-pink-400 uppercase tracking-widest mb-4">Symptoms</h3>
                <div className="flex flex-wrap gap-2">{(consultation?.symptoms_data?.selectedSymptoms || ["Lethargy", "Vomiting"]).map((s: string) => <span key={s} className="px-4 py-2 bg-white/5 text-white font-semibold rounded-xl text-sm border border-white/5">{s}</span>)}</div>
              </section>
              <section className="bg-gradient-to-br from-purple-600/20 to-pink-500/20 rounded-3xl p-6 border border-white/10">
                 <div className="flex items-center gap-2 mb-3">
                   <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-black text-pink-400">AI</div>
                   <h3 className="font-bold text-xs uppercase tracking-widest text-white/60">Assessment</h3>
                 </div>
                 <p className="text-[13px] leading-relaxed text-white/80">{consultation?.ai_summary || consultation?.symptoms_data?.aiSummary || "Patient shows signs of distress."}</p>
              </section>
            </div>
            <button onClick={() => setShowSummary(false)} className="w-full mt-12 py-4 bg-white text-black rounded-2xl font-bold uppercase tracking-widest active:scale-95 transition-all">Return</button>
          </motion.div>
        )}
      </AnimatePresence>
      
      <style>{`.mirror { transform: scaleX(-1); } .no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
    </div>
  );
};

export default InstantVideoCall;
