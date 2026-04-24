import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Mic, MicOff, RefreshCw, PhoneOff, PawPrint } from "lucide-react";
import { cn } from "@/lib/utils";

const VideoCall = () => {
  const navigate = useNavigate();
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndCall = () => {
    navigate("/vet/prescription");
  };

  return (
    <div className="h-screen w-screen relative overflow-hidden bg-black">
      {/* Doctor Video (Full Screen Background) */}
      <div className="absolute inset-0">
        <img 
          src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=800&h=1200&fit=crop"
          alt="Dr. Vikram"
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
                src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=100&h=100&fit=crop"
                alt="Dr. Vikram"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h3 className="font-bold text-white">Dr. Vikram Malhotra</h3>
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

      {/* User Video (Small PIP) */}
      <div className="absolute top-28 right-4 z-20">
        <div className="w-28 h-36 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/30">
          <div className="relative w-full h-full bg-gradient-to-br from-pink-100 to-purple-100">
            <img 
              src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=300&fit=crop"
              alt="You"
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1">
              <span className="text-[10px] text-white">👤 YOU</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-8 left-4 right-4 z-20">
        {/* Status Pill */}
        <div className="flex justify-center mb-4">
          <div className="bg-gradient-to-r from-pink-400/90 to-purple-400/90 backdrop-blur-md rounded-full px-4 py-2 flex items-center gap-2">
            <PawPrint className="w-4 h-4 text-white" />
            <span className="text-sm text-white font-medium">Dr. Vikram is reviewing Luna's chart</span>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-center gap-6">
          {/* Mute Button */}
          <button
            onClick={() => setIsMuted(!isMuted)}
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
          <p className="absolute bottom-0 left-14 text-[10px] text-white/60 mt-1">MUTE</p>

          {/* End Call Button */}
          <button
            onClick={handleEndCall}
            className="relative"
          >
            <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
              <PhoneOff className="w-7 h-7 text-white" />
            </div>
            {/* Paw prints decoration */}
            <div className="absolute -top-2 left-1/2 -translate-x-1/2">
              <div className="flex gap-0.5">
                <span className="text-pink-300 text-xs">🐾</span>
                <span className="text-pink-300 text-xs">🐾</span>
              </div>
            </div>
          </button>
          <p className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[10px] text-red-400 font-semibold">END</p>

          {/* Flip Camera Button */}
          <button
            className="w-14 h-14 rounded-full bg-gray-700/80 backdrop-blur-sm flex items-center justify-center"
          >
            <RefreshCw className="w-6 h-6 text-white" />
          </button>
          <p className="absolute bottom-0 right-14 text-[10px] text-white/60">FLIP</p>
        </div>
      </div>
    </div>
  );
};

export default VideoCall;
