import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Mic, MicOff, PhoneOff, PawPrint, Camera, CameraOff, X, FileText, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

const InstantVideoCall = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const { consultation, vet, petName } = location.state || {};
  
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);

  // Determine if current user is the vet
  const isVet = user?.role === 'vet';
  
  const remoteInfo = isVet ? {
    name: consultation?.pet_name || petName || "Patient",
    image: consultation?.symptoms_data?.photoUrl || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400&h=600&fit=crop"
  } : {
    name: vet?.name || consultation?.vet_name || "Dr. Vikram Malhotra",
    image: vet?.image || "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=800&h=1200&fit=crop"
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);

    // Initialize Camera
    const startCamera = async () => {
      try {
        setPermissionDenied(false);
        const userStream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        });
        setStream(userStream);
        if (videoRef.current) {
          videoRef.current.srcObject = userStream;
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        setPermissionDenied(true);
        toast.error("Camera access denied. Please enable camera permissions in your browser settings and refresh.");
      }
    };

    startCamera();

    return () => {
      clearInterval(timer);
    };
  }, []);

  // Separate effect for stream cleanup
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleMute = () => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    } else if (permissionDenied) {
      const startCamera = async () => {
        try {
          const userStream = await navigator.mediaDevices.getUserMedia({ 
            video: true, 
            audio: true 
          });
          setStream(userStream);
          setPermissionDenied(false);
          if (videoRef.current) {
            videoRef.current.srcObject = userStream;
          }
          toast.success("Camera access granted!");
        } catch (err) {
          console.error("Retry failed:", err);
          toast.error("Still no access to camera. Check your browser settings.");
        }
      };
      startCamera();
    }
  };

  const handleEndCall = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    
    if (isVet) {
      navigate("/vet/digital-prescription", { state: { ...location.state, callDuration } });
    } else {
      navigate("/vet/preparing-prescription", { state: { ...location.state, callDuration } });
    }
  };

  return (
    <div ref={containerRef} className="h-screen w-screen relative overflow-hidden bg-black font-sans">
      {/* Remote Video (Full Screen Background) */}
      <div className="absolute inset-0">
        <img 
          src={remoteInfo.image}
          alt={remoteInfo.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />
      </div>

      {/* Top Bar - Remote Info */}
      <div className="absolute top-6 left-4 right-4 z-20 flex items-center justify-between">
        <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md rounded-2xl p-2.5 pr-5 border border-white/10">
          <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-pink-400/80 p-0.5">
            <img 
              src={remoteInfo.image}
              alt={remoteInfo.name}
              className="w-full h-full object-cover rounded-full"
            />
          </div>
          <div>
            <h3 className="font-bold text-white text-[15px]">{remoteInfo.name}</h3>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[10px] text-white/90 font-bold tracking-wider uppercase">Live Consultation</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowSummary(true)}
            className="w-12 h-12 rounded-2xl bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 active:scale-95 transition-all"
          >
            <Info className="w-5 h-5 text-white" />
          </button>
          <div className="bg-black/40 backdrop-blur-md rounded-2xl px-4 py-3 flex items-center justify-center border border-white/10 min-w-[80px]">
            <span className="text-white font-mono font-black text-lg tracking-tight tabular-nums">{formatTime(callDuration)}</span>
          </div>
        </div>
      </div>

      {/* Self Video (Draggable PIP) */}
      <motion.div 
        drag
        dragConstraints={containerRef}
        dragElastic={0.1}
        initial={{ x: 0, y: 0 }}
        className="absolute bottom-32 right-5 z-20 cursor-move touch-none"
      >
        <div className="w-[110px] h-[155px] rounded-24px overflow-hidden shadow-2xl border-2 border-white/30 bg-gray-900 pointer-events-auto relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={cn(
              "w-full h-full object-cover mirror transform scale-x-[-1]",
              (isVideoOff || permissionDenied) && "hidden"
            )}
          />
          {(isVideoOff || permissionDenied) && (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gray-800 p-2 text-center" onClick={toggleVideo}>
              <CameraOff className={cn("w-8 h-8", permissionDenied ? "text-red-400" : "text-white/40")} />
              {permissionDenied && <p className="text-[9px] text-red-200 mt-2 font-bold uppercase">No Access</p>}
            </div>
          )}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm rounded-full px-2.5 py-1 flex items-center gap-1.5 pointer-events-none">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
            <span className="text-[10px] text-white font-black tracking-widest uppercase">YOU</span>
          </div>
        </div>
      </motion.div>

      {/* Bottom Controls */}
      <div className="absolute bottom-10 left-0 right-0 z-20 px-6">
        <div className="max-w-md mx-auto">
          {/* Status Banner */}
          <div className="flex justify-center mb-8">
            <div className="bg-gradient-to-r from-pink-500/90 to-violet-500/90 backdrop-blur-xl rounded-full px-5 py-2.5 flex items-center gap-3 shadow-xl border border-white/20">
              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                <PawPrint className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-[13px] text-white font-bold tracking-wide">Connection Stable</span>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-around gap-4 px-4 bg-black/30 backdrop-blur-2xl rounded-[32px] p-6 border border-white/10 shadow-2xl">
            {/* Mute Button */}
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={toggleMute}
                className={cn(
                  "w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg active:scale-95",
                  isMuted 
                    ? "bg-red-500 text-white" 
                    : "bg-white/10 text-white hover:bg-white/20"
                )}
              >
                {isMuted ? <MicOff size={24} weight="bold" /> : <Mic size={24} weight="bold" />}
              </button>
              <span className="text-[10px] font-black text-white/50 tracking-widest uppercase">Audio</span>
            </div>

            {/* End Call Button */}
            <button
              onClick={handleEndCall}
              className="group relative"
            >
              <div className="absolute -inset-2 bg-red-500/20 rounded-full blur-xl group-hover:bg-red-500/40 transition-all animate-pulse" />
              <div className="relative w-20 h-20 bg-gradient-to-br from-red-500 to-rose-600 rounded-full flex items-center justify-center shadow-[0_10px_30px_rgba(239,68,68,0.4)] hover:scale-105 active:scale-95 transition-all">
                <PhoneOff size={32} weight="bold" className="text-white" />
              </div>
            </button>

            {/* Video Toggle Button */}
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={toggleVideo}
                className={cn(
                  "w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg active:scale-95",
                  isVideoOff 
                    ? "bg-red-500 text-white" 
                    : "bg-white/10 text-white hover:bg-white/20"
                )}
              >
                {isVideoOff ? <CameraOff size={24} weight="bold" /> : <Camera size={24} weight="bold" />}
              </button>
              <span className="text-[10px] font-black text-white/50 tracking-widest uppercase">Video</span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Sidebar/Modal */}
      <AnimatePresence>
        {showSummary && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute top-0 right-0 w-full md:w-96 h-full bg-white z-50 p-6 shadow-2xl overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-purple-600" />
                </div>
                <h2 className="text-xl font-black text-gray-900">Consultation Summary</h2>
              </div>
              <button 
                onClick={() => setShowSummary(false)}
                className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center active:scale-95 transition-all"
              >
                <X size={20} className="text-gray-600" />
              </button>
            </div>

            <div className="space-y-8">
              {/* Patient Info */}
              <section>
                <h3 className="text-xs font-black text-purple-600 uppercase tracking-widest mb-4">Patient Profile</h3>
                <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 italic font-medium text-gray-700">
                  {consultation?.pet_name || petName || "Bella"} (Dog)
                </div>
              </section>

              {/* Symptoms */}
              <section>
                <h3 className="text-xs font-black text-purple-600 uppercase tracking-widest mb-4">Symptoms Analysis</h3>
                <div className="flex flex-wrap gap-2">
                  {(consultation?.symptoms_data?.selectedSymptoms || ["Lethargy", "Vomiting"]).map((s: string) => (
                    <span key={s} className="px-4 py-2 bg-pink-50 text-pink-600 rounded-full text-sm font-bold border border-pink-100 shadow-sm">
                      {s}
                    </span>
                  ))}
                </div>
              </section>

              {/* Urgency */}
              <section>
                <h3 className="text-xs font-black text-purple-600 uppercase tracking-widest mb-4">Urgency Level</h3>
                <div className={cn(
                  "inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-sm",
                  consultation?.symptoms_data?.urgency === 'urgent' ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-500'
                )}>
                  {consultation?.symptoms_data?.urgency?.toUpperCase() || 'CONCERNED'}
                </div>
              </section>

              {/* AI Insight */}
              <section className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-3xl p-6 text-white shadow-xl">
                 <div className="flex items-center gap-2 mb-3">
                   <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                     <span className="text-xs font-black">AI</span>
                   </div>
                   <h3 className="font-black text-sm uppercase tracking-widest">AI Assessment</h3>
                 </div>
                 <p className="text-[13px] leading-relaxed font-medium opacity-90">
                   {consultation?.ai_summary || consultation?.symptoms_data?.aiSummary || "Patient shows signs of acute gastrointestinal distress. Recommend checking heart rate and respiratory pattern during call."}
                 </p>
              </section>
            </div>

            <button 
              onClick={() => setShowSummary(false)}
              className="w-full mt-12 py-4 bg-gray-900 text-white rounded-2xl font-black text-sm tracking-widest uppercase shadow-xl active:scale-95 transition-all"
            >
              Return to Call
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InstantVideoCall;
