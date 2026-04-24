import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Stethoscope, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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
  const assessmentData = location.state || {};
  const [activeStep, setActiveStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [vetFound, setVetFound] = useState(false);
  const [matchedVet, setMatchedVet] = useState<any>(null);

  useEffect(() => {
    // Progress bar animation
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) return 100;
        return prev + 1;
      });
    }, 80);

    // Step progression
    const timers = steps.map((_, i) =>
      setTimeout(() => setActiveStep(i), i * 2000)
    );

    // Fetch active vets based on diagnosis data
    const fetchVet = async () => {
      try {
        const petType = assessmentData.selectedPet || "";
        const symptoms = assessmentData.selectedSymptoms || [];
        const urgencyLevel = assessmentData.urgency || "concerned";

        // Build query - search for active, approved vets
        let query = supabase
          .from('vet_profiles')
          .select('*')
          .eq('is_active', true)
          .eq('verification_status', 'approved');

        const { data: vets, error } = await query.limit(10);

        if (error) {
          console.error('Error fetching vets:', error);
          return;
        }

        if (vets && vets.length > 0) {
          let bestVet = null;
          let bestScore = -1;

          for (const vet of vets) {
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
            // Fetch real name from profiles table
            const { data: profileData } = await supabase
              .from('profiles')
              .select('name, full_name, profile_photo')
              .eq('id', bestVet.user_id)
              .single();

            const realName = profileData?.full_name || profileData?.name || "Doctor";

            setTimeout(() => {
              setVetFound(true);
              setMatchedVet({
                id: bestVet.id,
                userId: bestVet.user_id,
                name: `Dr. ${realName}`,
                specialization: bestVet.specializations?.[0] || "General Veterinarian",
                image: bestVet.profile_photo || profileData?.profile_photo || "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&h=200&fit=crop",
                rating: bestVet.average_rating || 4.9,
                experience: bestVet.years_of_experience || 0,
                fee: bestVet.online_fee || 499,
                qualification: bestVet.qualification || "BVSc",
                onlineFee: bestVet.online_fee || 500,
                offlineFee: bestVet.offline_fee || 800,
              });
            }, 7000);
          }
        }
      } catch (err) {
        console.error('Error:', err);
      }
    };

    fetchVet();

    return () => {
      clearInterval(progressInterval);
      timers.forEach(clearTimeout);
    };
  }, []);

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

export default InstantAnalyzing;
