import { SRUVO_LOGO_URL } from "@/constants/branding";

interface SplashScreenProps {
  message?: string;
}

const SplashScreen = ({ message = "Initializing Sruvo..." }: SplashScreenProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white fixed inset-0 z-[9999]">
      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          <div className="w-24 h-24 flex items-center justify-center logo-bounce bg-white rounded-3xl shadow-[0_12px_40px_-12px_rgba(183,132,230,0.4)] border border-purple-50/50 p-4">
            <img src={SRUVO_LOGO_URL} alt="Sruvo" className="w-full h-full object-contain" />
          </div>
          <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-[#F472D0] rounded-full flex items-center justify-center shadow-lg border-2 border-white animate-pulse">
            <div className="w-3 h-3 bg-white rounded-full" />
          </div>
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className="text-3xl font-bold tracking-tight text-[#151B32]">Sruvo</div>
          <div className="text-[10px] font-bold text-[#F472D0] uppercase tracking-[0.3em] opacity-80">Premium Pet Care</div>
        </div>
        
        <div className="flex gap-2 mt-4">
          <div className="w-2 h-2 rounded-full bg-[#B784E6]/20 animate-loading-dot-1"></div>
          <div className="w-2 h-2 rounded-full bg-[#B784E6]/20 animate-loading-dot-2"></div>
          <div className="w-2 h-2 rounded-full bg-[#B784E6]/20 animate-loading-dot-3"></div>
        </div>
        
        {message && <p className="text-[11px] font-medium text-muted-foreground mt-2 tracking-wide opacity-60 italic">{message}</p>}
      </div>
      <style>{`
        .logo-bounce {
          animation: logo-bounce 2s ease-in-out infinite;
        }
        @keyframes logo-bounce {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-10px) scale(1.05); }
        }
        @keyframes loading-dot {
          0%, 100% { transform: scale(1); background-color: rgba(183, 132, 230, 0.2); }
          50% { transform: scale(1.5); background-color: #B784E6; }
        }
        .animate-loading-dot-1 { animation: loading-dot 1s infinite 0s; }
        .animate-loading-dot-2 { animation: loading-dot 1s infinite 0.2s; }
        .animate-loading-dot-3 { animation: loading-dot 1s infinite 0.4s; }
      `}</style>
    </div>
  );
};

export default SplashScreen;
