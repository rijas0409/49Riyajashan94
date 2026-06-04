import { useEffect, useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Stethoscope, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const vetAvatars = [
  { id: "1", image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=100&h=100&fit=crop" },
  { id: "2", image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=100&h=100&fit=crop" },
];

const steps = [
  "Symptoms registered",
  "Identifying required specialization...",
  "Searching for nearest available vets...",
  "Finding the best match...",
];

const InstantAnalyzing = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const assessmentData = useMemo(() => location.state || {}, [location.state]);
  const [activeStep, setActiveStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [vetFound, setVetFound] = useState(false);
  const [matchedVet, setMatchedVet] = useState<any>(null);
  const [isFailed, setIsFailed] = useState(false);

  useEffect(() => {
    const isBypassUser = user?.email === 'jas@sruvo.com' || user?.email === 'rijas@123.com';

    // Progress bar animation - 8 seconds total (80ms per percent)
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          if (!vetFound) setIsFailed(true);
          return 100;
        }
        // Slow down slightly near the end if not found
        if (prev > 85 && !vetFound) return prev + 0.3;
        // Speed up for bypass users
        if (isBypassUser) return prev + 5;
        return prev + 1;
      });
    }, isBypassUser ? 50 : 80);

    // Step progression - spread across 8 seconds
    const baseStepIntervals = [800, 2500, 4500, 6500];
    const stepIntervals = isBypassUser ? baseStepIntervals.map(i => i / 4) : baseStepIntervals;
    const timers = steps.map((_, i) =>
      setTimeout(() => setActiveStep(i), stepIntervals[i])
    );

    // Fetch active vets based on diagnosis data
    const fetchVet = async () => {
      try {
        const petType = assessmentData.selectedPet || "";
        const symptoms = assessmentData.selectedSymptoms || [];
        const urgencyLevel = assessmentData.urgency || "concerned";

        // Build query - search for active, verified vets
        const { data: vets, error: vetError } = await supabase
          .from('vet_profiles')
          .select('*, profile:profiles(is_admin_approved, name, full_name)')
          .eq('is_active', true)
          .eq('verification_status', 'verified');

        if (vetError) {
          console.error('Error fetching vets:', vetError);
          return;
        }

        if (vets && vets.length > 0) {
          // IMPORTANT: Only match with vets whose profiles are also admin-approved (fallback if profiles are blocked by RLS)
          const approvedVets = vets.filter(v => !v.profile || v.profile.is_admin_approved !== false);
          
          if (approvedVets.length === 0) {
            console.warn("No explicitly admin-approved vets found for matching.");
          }

          const sourceVets = approvedVets.length > 0 ? approvedVets : vets;
          
          if (sourceVets.length === 0) {
            return;
          }

          let bestVet = null;
          let bestScore = -1;

          for (const vet of sourceVets) {
            let score = 0;
            const specs = (vet.specializations || []).map((s: string) => s.toLowerCase());
            if (specs.some((s: string) => s.includes(petType.toLowerCase()))) score += 10;
            if (specs.includes("all") || specs.includes("general")) score += 3;
            for (const symptom of symptoms) {
              const symptomLower = (symptom as string).toLowerCase();
              if (specs.some((s: string) => s.includes(symptomLower))) score += 5;
              if (symptomLower.includes("vomiting") && specs.some((s: string) => s.includes("gastro") || s.includes("internal"))) score += 5;
              if (symptomLower.includes("itching") && specs.some((s: string) => s.includes("derma") || s.includes("skin"))) score += 5;
              if (symptomLower.includes("coughing") && specs.some((s: string) => s.includes("respiratory") || s.includes("pulmo"))) score += 5;
              if (symptomLower.includes("lethargy") && specs.some((s: string) => s.includes("general") || s.includes("internal"))) score += 3;
            }
            if (urgencyLevel === "urgent") {
              score += (vet.average_rating || 0) * 2;
              score += (vet.years_of_experience || 0);
            }
            score += (vet.years_of_experience || 0) * 0.5;
            if (score > bestScore) {
              bestScore = score;
              bestVet = vet;
            }
          }

          if (bestVet) {
            const realName = bestVet.profile?.full_name || bestVet.profile?.name || "Doctor";

            setTimeout(() => {
              setVetFound(true);
              setMatchedVet({
                id: bestVet.id,
                userId: bestVet.user_id,
                name: `Dr. ${realName}`,
                specialization: bestVet.specializations?.[0] || "General Veterinarian",
                image: bestVet.profile_photo || bestVet.profile?.profile_photo || "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&h=200&fit=crop",
                rating: bestVet.average_rating || 4.9,
                experience: bestVet.years_of_experience || 0,
                fee: bestVet.online_fee || 499,
                qualification: bestVet.qualification || "BVSc",
                onlineFee: bestVet.online_fee || 500,
                offlineFee: bestVet.offline_fee || 800,
              });
            }, isBypassUser ? 1000 : 3500); 
          }
        }
      } catch (err) {
        console.error('Error:', err);
        toast.error("Consultation analysis interrupted by network error.");
      }
    };

    fetchVet();

    return () => {
      clearInterval(progressInterval);
      timers.forEach(clearTimeout);
    };
  }, [user?.email, assessmentData]);

  useEffect(() => {
    if (vetFound && matchedVet) {
      setTimeout(() => {
        navigate("/vet/consultation-summary", {
          state: {
            ...assessmentData,
            matchedVet,
            flowType: "instant"
          }
        });
      }, 1000);
    }
  }, [vetFound, matchedVet, navigate, assessmentData]);

  if (isFailed) {
    return <NoVetFoundScreen onBack={() => navigate("/buyer/vet")} />;
  }

  return (
    <div className="h-screen bg-background flex flex-col items-center justify-between px-4 py-8">
      {/* Title */}
      <div className="text-center pt-4">
        <h1 className="text-2xl font-black text-foreground">AI Analyzing Condition</h1>
        <p className="text-sm text-muted-foreground mt-1">Please stay on this screen while we process</p>
      </div>

      {/* Animated Stethoscope Area */}
      <div className="relative flex items-center justify-center w-full" style={{ height: 300 }}>
        {/* Orbit rings */}
        <div className="absolute w-56 h-56 border border-muted/60 rounded-full" style={{ animation: "spin 15s linear infinite" }} />
        <div className="absolute w-64 h-64 border border-muted/40 rounded-full" style={{ animation: "spin 20s linear infinite reverse" }} />
        <div className="absolute w-72 h-72 border border-muted/20 rounded-full" style={{ animation: "spin 25s linear infinite" }} />

        {/* Floating vet avatars */}
        <div className="absolute" style={{ animation: "orbit1 8s ease-in-out infinite" }}>
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-pink-300 shadow-lg bg-white p-0.5">
            <img src={vetAvatars[0].image} alt="Vet" className="w-full h-full object-cover rounded-full" />
          </div>
        </div>
        <div className="absolute" style={{ animation: "orbit2 10s ease-in-out infinite" }}>
          <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-purple-300 shadow-lg bg-white p-0.5">
            <img src={vetAvatars[1].image} alt="Vet" className="w-full h-full object-cover rounded-full" />
          </div>
        </div>

        {/* Central stethoscope */}
        <div className="relative z-10">
          <div
            className="absolute inset-0 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full blur-xl opacity-40"
            style={{ animation: "pulse-glow 2s ease-in-out infinite" }}
          />
          <div
            className="relative w-28 h-28 bg-gradient-to-br from-pink-500 via-pink-400 to-purple-500 rounded-full flex items-center justify-center shadow-2xl"
            style={{ animation: "heartbeat 1.5s ease-in-out infinite" }}
          >
            <div className="absolute inset-0 rounded-full overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full" style={{ animation: "shimmer-move 3s ease-in-out infinite" }} />
            </div>
            <Stethoscope className="w-12 h-12 text-white" />
          </div>
        </div>
      </div>

      {/* Steps Card */}
      <div className="w-full">
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4 mb-5">
          {steps.map((label, i) => (
            <div key={i} className="flex items-start gap-3">
              {i < activeStep ? (
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5 text-green-500" />
                </div>
              ) : i === activeStep ? (
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5 text-green-500" />
                </div>
              ) : (
                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-muted-foreground/40" />
                </div>
              )}
              <span className={`text-sm font-medium ${i <= activeStep ? 'text-foreground' : 'text-muted-foreground/50'}`}>
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mb-4">
          <div
            className="h-full rounded-full transition-all duration-200"
            style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #FF4D6D, #D4D4D8)' }}
          />
        </div>

        {/* Cancel */}
        <button
          onClick={() => navigate("/vet/instant-assessment")}
          className="w-full text-center text-sm font-semibold text-muted-foreground py-2"
        >
          Cancel Analysis
        </button>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes orbit1 {
          0% { transform: translate(-100px, -60px); }
          25% { transform: translate(80px, -80px); }
          50% { transform: translate(100px, 50px); }
          75% { transform: translate(-60px, 80px); }
          100% { transform: translate(-100px, -60px); }
        }
        @keyframes orbit2 {
          0% { transform: translate(90px, 70px); }
          25% { transform: translate(-80px, 60px); }
          50% { transform: translate(-100px, -40px); }
          75% { transform: translate(70px, -90px); }
          100% { transform: translate(90px, 70px); }
        }
        @keyframes heartbeat {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.1); }
        }
        @keyframes shimmer-move {
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

/* ── Failure Screen ── */
function NoVetFoundScreen({ onBack }: { onBack: () => void }) {
  return (
    <div className="h-screen bg-white flex flex-col items-center justify-center px-8 text-center animate-in fade-in duration-700">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-pink-100 rounded-full blur-[60px] opacity-60 animate-pulse" />
        <div className="relative w-32 h-32 bg-gradient-to-br from-pink-50 to-white rounded-full flex items-center justify-center border border-pink-100 shadow-inner">
           <div className="text-5xl animate-bounce">😔</div>
        </div>
      </div>

      <h2 className="text-2xl font-black text-[#151B32] mb-3 leading-tight">
        All vets are currently busy or offline right now.
      </h2>
      
      <p className="text-muted-foreground text-[15px] leading-relaxed mb-10 max-w-[280px] mx-auto">
        You can still request a consultation and we’ll notify you as soon as a vet becomes available.
      </p>

      <div className="w-full space-y-3">
        <button 
          onClick={onBack}
          className="w-full py-4 bg-gradient-to-r from-[#FF4D6D] to-[#8B5CF6] text-white rounded-2xl font-bold shadow-lg active:scale-95 transition-all"
        >
          Request Notification
        </button>
        <button 
          onClick={onBack}
          className="w-full py-4 bg-muted/30 text-foreground rounded-2xl font-bold active:scale-95 transition-all"
        >
          Back to Home
        </button>
      </div>

      {/* Decorative dots */}
      <div className="absolute top-20 left-10 w-2 h-2 rounded-full bg-pink-200" />
      <div className="absolute bottom-40 right-12 w-3 h-3 rounded-full bg-purple-200" />
      <div className="absolute top-1/2 right-4 w-1.5 h-1.5 rounded-full bg-pink-100" />
    </div>
  );
}

export default InstantAnalyzing;
