import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, HelpCircle, Star, Video, BadgeCheck } from "lucide-react";

const ConnectionReady = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { matchedVet } = location.state || {};

  const vet = matchedVet || {};
  const vetName = vet.name || "Doctor";
  const vetImage = vet.image || "";
  const vetSpecialization = vet.specialization || "Veterinarian";
  const vetRating = vet.rating || 0;
  const vetExperience = vet.experience || 0;

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg">
        <div className="flex items-center justify-between px-4 py-4">
          <button onClick={() => navigate("/vet")} className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <h1 className="text-lg font-bold">Connection Ready</h1>
            <p className="text-xs text-pink-500 font-medium">STEP 3 OF 3</p>
          </div>
          <button className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <HelpCircle className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </header>

      <div className="px-4 py-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-foreground">Great news!</h2>
          <h2 className="text-2xl font-bold text-foreground">{vetName} is ready.</h2>
        </div>

        <div className="bg-card rounded-3xl p-6 border border-border shadow-lg mb-8">
          <div className="flex flex-col items-center">
            <div className="relative mb-4">
              <div className="w-36 h-36 rounded-full overflow-hidden bg-gradient-to-br from-pink-100 to-purple-100 p-1">
                {vetImage ? (
                  <img src={vetImage} alt={vetName} className="w-full h-full object-cover rounded-full" />
                ) : (
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-pink-200 to-purple-200 flex items-center justify-center text-3xl font-bold text-pink-500">
                    {vetName.charAt(0)}
                  </div>
                )}
              </div>
              <div className="absolute bottom-2 right-2 w-10 h-10 bg-teal-500 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                <BadgeCheck className="w-5 h-5 text-white" />
              </div>
            </div>

            <h3 className="text-xl font-bold text-foreground mb-1">{vetName}</h3>
            <p className="text-pink-500 font-semibold mb-3">{vetSpecialization}</p>
            
            <div className="flex items-center gap-2 bg-muted/50 rounded-full px-4 py-2">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold">{vetRating}</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">{vetExperience}+ Years Exp.</span>
            </div>
          </div>
        </div>

        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
            <span className="font-semibold text-foreground">Connecting...</span>
          </div>
          <p className="text-muted-foreground text-sm">
            {vetName} is ready to see you and your pet. Tap below to begin the secure video call.
          </p>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-pink-500 font-semibold tracking-wider text-xs">NETWORK STABILITY</span>
            <span className="font-semibold text-foreground">Excellent</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-pink-500 to-pink-400 rounded-full w-full" />
          </div>
        </div>

        <button 
          onClick={() => navigate("/vet/video-call", { state: { ...location.state, matchedVet: vet } })}
          className="w-full bg-gradient-to-r from-pink-500 to-pink-400 text-white py-4 rounded-2xl font-bold text-base shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3"
        >
          <Video className="w-5 h-5" />
          Start Video Call
        </button>
      </div>
    </div>
  );
};

export default ConnectionReady;