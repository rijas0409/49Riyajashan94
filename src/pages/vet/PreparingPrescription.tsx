import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Stethoscope, PawPrint, FileText, RefreshCw } from "lucide-react";

const PreparingPrescription = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { vet, petName, selectedPet } = location.state || {};
  const [isReady, setIsReady] = useState(false);

  const vetInfo = vet || {
    name: "Dr. Vikram Malhotra",
    image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=100&h=100&fit=crop"
  };

  useEffect(() => {
    // Simulate doctor preparing prescription (in real app, this would be a webhook/realtime subscription)
    const timer = setTimeout(() => {
      setIsReady(true);
      // Auto navigate after prescription is ready
      setTimeout(() => {
        navigate("/vet/prescription");
      }, 1500);
    }, 8000); // 8 seconds for demo

    return () => clearTimeout(timer);
  }, [navigate]);

  const handleNotifyMe = () => {
    // In real app, register for push notification
    navigate("/vet");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg">
        <div className="flex items-center justify-between px-4 py-4">
          <button 
            onClick={() => navigate("/vet")}
            className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold">Digital Prescription</h1>
          <div className="w-10" />
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        {/* Animated Document Icon */}
        <div className="relative mb-8">
          {/* Outer glow */}
          <div 
            className="absolute inset-0 bg-gradient-to-br from-pink-400 to-purple-500 rounded-3xl blur-xl opacity-30"
            style={{ animation: "pulse-glow 2s ease-in-out infinite" }}
          />
          
          {/* Main icon container */}
          <div 
            className="relative w-36 h-36 bg-gradient-to-br from-pink-500 via-purple-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl"
            style={{ animation: "float 3s ease-in-out infinite" }}
          >
            {/* Document icon */}
            <div className="relative">
              <FileText className="w-16 h-16 text-white" />
              {/* Shimmer effect */}
              <div 
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                style={{ animation: "shimmer 2s ease-in-out infinite" }}
              />
            </div>
          </div>

          {/* Refresh/Sync indicator */}
          <div 
            className="absolute -bottom-2 -right-2 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center border-2 border-gray-100"
          >
            <RefreshCw 
              className="w-6 h-6 text-purple-500"
              style={{ animation: isReady ? "none" : "spin 2s linear infinite" }}
            />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-foreground text-center mb-2">
          Preparing Your
        </h2>
        <h2 
          className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent text-center mb-4"
        >
          Digital Prescription
        </h2>

        {/* Subtitle */}
        <p className="text-muted-foreground text-center max-w-xs mb-10">
          Your vet is finalizing the prescription. Feel free to stay here or leave — we'll notify you as soon as it's ready.
        </p>

        {/* Info Cards */}
        <div className="w-full max-w-sm bg-card rounded-2xl border border-border p-5 space-y-4">
          {/* Veterinarian */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-purple-100 flex items-center justify-center">
              <Stethoscope className="w-7 h-7 text-purple-500" />
            </div>
            <div className="border-l border-border pl-4">
              <p className="text-xs font-bold text-muted-foreground tracking-wider">VETERINARIAN</p>
              <p className="font-bold text-foreground">{vetInfo.name}</p>
            </div>
          </div>

          <div className="border-t border-border" />

          {/* Patient */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-red-100 flex items-center justify-center">
              <PawPrint className="w-7 h-7 text-red-400" />
            </div>
            <div className="border-l border-border pl-4">
              <p className="text-xs font-bold text-muted-foreground tracking-wider">PATIENT</p>
              <p className="font-bold text-foreground">
                {petName || "Your Pet"} – {selectedPet ? selectedPet.charAt(0).toUpperCase() + selectedPet.slice(1) : "Pet"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="px-4 pb-8 pt-4">
        <button 
          onClick={handleNotifyMe}
          className="w-full py-4 rounded-2xl font-bold text-white text-base shadow-lg hover:shadow-xl transition-all"
          style={{ background: 'linear-gradient(90deg, #FF4D6D, #8B5CF6)' }}
        >
          Notify Me When Ready
        </button>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.05); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default PreparingPrescription;
