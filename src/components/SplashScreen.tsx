import { SRUVO_LOGO_URL } from "@/constants/branding";

interface SplashScreenProps {
  message?: string;
}

const SplashScreen = ({ message = "Initializing Sruvo..." }: SplashScreenProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background fixed inset-0 z-[9999]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-20 h-20 flex items-center justify-center animate-pulse duration-2000">
          <img src={SRUVO_LOGO_URL} alt="Sruvo" className="w-full h-full object-contain" />
        </div>
        <div className="text-lg font-semibold tracking-tight text-[#151B32]">Sruvo</div>
        <div className="flex gap-1.5 mt-2">
          <div className="w-1.5 h-1.5 rounded-full bg-slate-200 animate-bounce [animation-delay:0s]" style={{ animationDuration: '1s' }}></div>
          <div className="w-1.5 h-1.5 rounded-full bg-slate-200 animate-bounce [animation-delay:0.2s]" style={{ animationDuration: '1s' }}></div>
          <div className="w-1.5 h-1.5 rounded-full bg-slate-200 animate-bounce [animation-delay:0.4s]" style={{ animationDuration: '1s' }}></div>
        </div>
        {message && <p className="text-xs font-medium text-muted-foreground mt-2 uppercase tracking-widest">{message}</p>}
      </div>
      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); background-color: #f1f5f9; }
          50% { transform: translateY(-4px); background-color: #B784E6; }
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;
