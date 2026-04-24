import { useState, useRef, useCallback, useEffect } from "react";
import { ArrowLeft, Share2, Heart, Play, Pause, Volume2, VolumeX, Maximize } from "lucide-react";

interface MediaItem {
  type: "image" | "video";
  url: string;
}

interface PetImageHeaderProps {
  media: MediaItem[];
  isInWishlist: boolean;
  onBack: () => void;
  onShare: () => void;
  onWishlistToggle: () => void;
}

const PetImageHeader = ({ media, isInWishlist, onBack, onShare, onWishlistToggle }: PetImageHeaderProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showVideoControls, setShowVideoControls] = useState(true);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoDuration, setVideoDuration] = useState("");
  const [videoError, setVideoError] = useState(false);

  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const swiping = useRef(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    media
      .filter((item) => item.type === "image")
      .forEach((item) => {
        const img = new Image();
        img.src = item.url;
      });
  }, [media]);

  useEffect(() => {
    setVideoError(false);
    setVideoProgress(0);
    setShowVideoControls(true);

    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [currentIndex]);

  useEffect(() => {
    return () => {
      if (controlsTimeout.current) {
        clearTimeout(controlsTimeout.current);
      }
    };
  }, []);

  const resetControlsTimer = useCallback(() => {
    setShowVideoControls(true);
    if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
    controlsTimeout.current = setTimeout(() => {
      if (isPlaying) setShowVideoControls(false);
    }, 3000);
  }, [isPlaying]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    swiping.current = true;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!swiping.current || media.length <= 1) return;

    swiping.current = false;
    const diff = touchStartX.current - touchEndX.current;

    if (Math.abs(diff) < 50) return;

    if (diff > 0) {
      setCurrentIndex((prev) => (prev + 1) % media.length);
    } else {
      setCurrentIndex((prev) => (prev - 1 + media.length) % media.length);
    }
  }, [media.length]);

  const togglePlay = async (event?: React.MouseEvent) => {
    event?.stopPropagation();
    if (!videoRef.current || videoError) return;

    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
      setShowVideoControls(true);
      return;
    }

    try {
      await videoRef.current.play();
      setIsPlaying(true);
      resetControlsTimer();
    } catch {
      setIsPlaying(false);
      setShowVideoControls(true);
    }
  };

  const toggleMute = (event?: React.MouseEvent) => {
    event?.stopPropagation();
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleFullscreen = async (event?: React.MouseEvent) => {
    event?.stopPropagation();
    if (!videoRef.current) return;

    try {
      if (videoRef.current.requestFullscreen) {
        await videoRef.current.requestFullscreen();
      }
    } catch {
      // silent fallback
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current || !Number.isFinite(videoRef.current.duration) || videoRef.current.duration <= 0) return;
    setVideoProgress((videoRef.current.currentTime / videoRef.current.duration) * 100);
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current || !Number.isFinite(videoRef.current.duration)) return;
    const dur = videoRef.current.duration;
    setVideoDuration(`${Math.floor(dur / 60)}:${Math.floor(dur % 60).toString().padStart(2, "0")}`);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!videoRef.current || !Number.isFinite(videoRef.current.duration) || videoRef.current.duration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    videoRef.current.currentTime = ((e.clientX - rect.left) / rect.width) * videoRef.current.duration;
  };

  const getVideoMimeType = (videoUrl: string) => {
    const lowerUrl = videoUrl.toLowerCase();
    if (lowerUrl.endsWith(".webm")) return "video/webm";
    if (lowerUrl.endsWith(".ogg")) return "video/ogg";
    if (lowerUrl.endsWith(".m3u8")) return "application/x-mpegURL";
    if (lowerUrl.endsWith(".ts")) return "video/mp2t";
    return "video/mp4";
  };

  const currentMedia = media[currentIndex];
  const isCurrentVideo = currentMedia?.type === "video";

  return (
    <div
      className="relative bg-[#F8F7FC]"
      style={{ paddingTop: "90%" }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="absolute inset-0 flex items-center justify-center p-6">
        {media.length > 0 ? (
          isCurrentVideo && !videoError ? (
            <div className="w-full h-full relative flex items-center justify-center" onClick={resetControlsTimer}>
              <video
                ref={videoRef}
                className="max-w-full max-h-full object-contain rounded-lg"
                playsInline
                preload="metadata"
                muted={isMuted}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={() => { setIsPlaying(false); setShowVideoControls(true); }}
                onError={() => setVideoError(true)}
              >
                <source src={currentMedia.url} type={getVideoMimeType(currentMedia.url)} />
              </video>

              {videoDuration && !isPlaying && (
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/50 text-white text-[11px] font-medium z-10">
                  {videoDuration}
                </div>
              )}

              <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/30 to-transparent pointer-events-none rounded-b-lg" />

              {!isPlaying && (
                <button onClick={(event) => { void togglePlay(event); }} className="absolute inset-0 flex items-center justify-center z-10">
                  <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg" style={{ boxShadow: "0 0 20px rgba(244,114,182,0.3)" }}>
                    <Play className="w-7 h-7 text-[#333] ml-1" fill="#333" />
                  </div>
                </button>
              )}

              {isPlaying && showVideoControls && (
                <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2 z-10" style={{ animation: "fadeIn 0.15s ease-out" }}>
                  <button onClick={(event) => { void togglePlay(event); }} className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center">
                    <Pause className="w-4 h-4 text-white" />
                  </button>

                  <div className="flex-1 h-[3px] bg-white/30 rounded-full cursor-pointer" onClick={handleSeek}>
                    <div className="h-full bg-white rounded-full transition-all" style={{ width: `${videoProgress}%` }} />
                  </div>

                  <button onClick={(event) => toggleMute(event)} className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center">
                    {isMuted ? <VolumeX className="w-4 h-4 text-white" /> : <Volume2 className="w-4 h-4 text-white" />}
                  </button>

                  <button onClick={(event) => { void handleFullscreen(event); }} className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center">
                    <Maximize className="w-4 h-4 text-white" />
                  </button>
                </div>
              )}
            </div>
          ) : isCurrentVideo && videoError ? (
            <div className="w-full h-full flex items-center justify-center bg-[#E5E7EB] rounded-lg">
              <div className="w-16 h-16 rounded-full bg-white/60 flex items-center justify-center">
                <Play className="w-7 h-7 text-[#999] ml-1" />
              </div>
            </div>
          ) : (
            <img
              key={currentIndex}
              src={currentMedia?.url}
              alt="Pet"
              className="max-w-full max-h-full object-contain"
              loading="eager"
              decoding="async"
              style={{ animation: "fadeIn 0.15s ease-out" }}
            />
          )
        ) : (
          <div className="text-6xl">🐾</div>
        )}
      </div>

      {media.length > 1 && (
        <div className="absolute top-14 right-4 px-2.5 py-1 rounded-full bg-black/40 text-white text-[11px] font-semibold z-10">
          {currentIndex + 1}/{media.length}
        </div>
      )}

      <div className="absolute top-10 left-4 right-4 flex justify-between z-10">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-[#F3F0F9] flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-[#6B7280]" />
        </button>
        <div className="flex gap-2.5">
          <button onClick={onWishlistToggle} className="w-10 h-10 rounded-full bg-[#F3F0F9] flex items-center justify-center">
            <Heart className={`w-5 h-5 ${isInWishlist ? "fill-[#A855F7] text-[#A855F7]" : "text-[#6B7280]"}`} />
          </button>
          <button onClick={onShare} className="w-10 h-10 rounded-full bg-[#F3F0F9] flex items-center justify-center">
            <Share2 className="w-5 h-5 text-[#6B7280]" />
          </button>
        </div>
      </div>

      {media.length > 1 && (
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
          {media.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-[6px] rounded-full transition-all duration-200 ${index === currentIndex ? "w-5 bg-[#A855F7]" : "w-[6px] bg-[#D1D5DB]"}`}
            />
          ))}
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default PetImageHeader;
