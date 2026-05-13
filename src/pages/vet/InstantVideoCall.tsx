import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Mic, MicOff, RefreshCw, PhoneOff, PawPrint, Camera, CameraOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { motion } from "framer-motion";

const InstantVideoCall = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);
  const { vet, petName } = location.state || {};
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const vetInfo = vet || {
    name: "Dr. Vikram Malhotra",
    image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=800&h=1200&fit=crop"
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
      // Retry starting camera if previously denied
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
    // Navigate to preparing prescription screen
    navigate("/vet/preparing-prescription", { state: { ...location.state, callDuration } });
  };

  return (
    <div ref={containerRef} className="h-screen w-screen relative overflow-hidden bg-black">
      {/* Doctor Video (Full Screen Background) */}
      <div className="absolute inset-0">
        <img 
          src={vetInfo.image}
          alt={vetInfo.name}
          className="w-full h-full object-cover"
        />
        {/* Gradient overlay for better readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50" />
      </div>

      {/* Top Bar - Doctor Info */}
      <div className="absolute top-4 left-4 right-4 z-20">
        <div className="bg-black/50 backdrop-blur-md rounded-2xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-pink-400">
              <img 
                src={vetInfo.image}
                alt={vetInfo.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h3 className="font-bold text-white">{vetInfo.name}</h3>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-400" />
                <span className="text-xs text-white/80">LIVE CONSULTATION</span>
              </div>
            </div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl px-3 py-2">
            <span className="text-white font-mono font-semibold">{formatTime(callDuration)}</span>
          </div>
        </div>
      </div>

      {/* User Video (Draggable PIP) */}
      <motion.div 
        drag
        dragConstraints={containerRef}
        dragElastic={0.1}
        className="absolute top-28 right-4 z-20 cursor-move touch-none"
      >
        <div className="w-28 h-36 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/30 bg-gray-900 pointer-events-auto">
          <div className="relative w-full h-full">
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
                {permissionDenied && (
                  <>
                    <p className="text-[8px] text-red-200 mt-1">Permission Denied</p>
                    <span className="mt-1 text-[8px] bg-red-500 text-white px-2 py-0.5 rounded uppercase">Retry</span>
                  </>
                )}
              </div>
            )}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1 pointer-events-none">
              <span className="text-[10px] text-white">👤 YOU</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Bottom Controls */}
      <div className="absolute bottom-8 left-4 right-4 z-20">
        {/* Status Pill */}
        <div className="flex justify-center mb-4">
          <div className="bg-gradient-to-r from-pink-400/90 to-purple-400/90 backdrop-blur-md rounded-full px-4 py-2 flex items-center gap-2">
            <PawPrint className="w-4 h-4 text-white" />
            <span className="text-sm text-white font-medium">{vetInfo.name} is connected</span>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-center gap-6">
          {/* Mute Button */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={toggleMute}
              className={cn(
                "w-14 h-14 rounded-full flex items-center justify-center transition-all",
                isMuted 
                  ? "bg-red-500 shadow-lg" 
                  : "bg-gray-700/80 backdrop-blur-sm"
              )}
            >
              {isMuted ? (
                <MicOff className="w-6 h-6 text-white" />
              ) : (
                <Mic className="w-6 h-6 text-white" />
              )}
            </button>
            <p className="text-[10px] text-white/60">MUTE</p>
          </div>

          {/* End Call Button */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={handleEndCall}
              className="relative"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
                <PhoneOff className="w-7 h-7 text-white" />
              </div>
              <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                <div className="flex gap-0.5">
                  <span className="text-pink-300 text-xs">🐾</span>
                  <span className="text-pink-300 text-xs">🐾</span>
                </div>
              </div>
            </button>
            <p className="text-[10px] text-red-400 font-semibold uppercase">End</p>
          </div>

          {/* Video Toggle Button */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={toggleVideo}
              className={cn(
                "w-14 h-14 rounded-full flex items-center justify-center transition-all",
                isVideoOff 
                  ? "bg-red-500 shadow-lg" 
                  : "bg-gray-700/80 backdrop-blur-sm"
              )}
            >
              {isVideoOff ? (
                <CameraOff className="w-6 h-6 text-white" />
              ) : (
                <Camera className="w-6 h-6 text-white" />
              )}
            </button>
            <p className="text-[10px] text-white/60">VIDEO</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstantVideoCall;
