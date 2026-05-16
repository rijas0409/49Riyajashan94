import { useEffect, useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Stethoscope, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner"; // Added toast import

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

const AIAnalyzingCondition = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const assessmentData = useMemo(() => location.state || {}, [location.state]);
  const [activeStep, setActiveStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const isBypassUser = user?.email === 'jas@sruvo.com' || user?.email === 'rijas@123.com';

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) return 100;
        return prev + (isBypassUser ? 5 : 1);
      });
    }, 80);

    const timers = steps.map((_, i) =>
      setTimeout(() => setActiveStep(i), i * (isBypassUser ? 500 : 2000))
    );

    // Fetch real vet from DB and navigate with data
    const fetchAndNavigate = async () => {
      try {
        if (isBypassUser) {
          setTimeout(() => {
            navigate("/vet/booking-details", {
              state: { 
                ...assessmentData, 
                matchedVet: {
                  id: "demo-vet-bypass",
                  userId: "00000000-0000-0000-0000-000000000000",
                  name: "Dr. Vikram Malhotra",
                  specialization: "General Veterinarian",
                  image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&h=200&fit=crop",
                  rating: 4.9,
                  experience: 10,
                  fee: 249,
                  qualification: "BVSc & AH",
                  onlineFee: 249,
                  offlineFee: 599,
                  clinicAddress: "Sector 5, Bangalore",
                }
              }
            });
          }, 2000);
          return;
        }

        const { data: vets } = await supabase
          .from('vet_profiles')
          .select('*, profile:profiles(is_admin_approved, name, full_name)')
          .eq('is_active', true)
          .eq('verification_status', 'verified')
          .limit(10);

        let matchedVet = null;

        if (vets && vets.length > 0) {
          // Filter to ensure profile is approved if joined (though it should be)
          const approvedVets = vets.filter(v => v.profile?.is_admin_approved); 
          
          if (approvedVets.length === 0) {
            // Fallback if none are explicitly approved via profile
            console.warn("No explicitly admin-approved vets found.");
          }
          
          const sourceVets = approvedVets.length > 0 ? approvedVets : vets;

          // Simple scoring based on pet type from assessment
          const petType = assessmentData.selectedPet || "";
          let bestVet = sourceVets[0];
          let bestScore = 0;

          for (const vet of sourceVets) {
            let score = 0;
            const specs = (vet.specializations || []).join(" ").toLowerCase();
            if (specs.includes(petType.toLowerCase())) score += 10;
            if (specs.includes("all") || specs.includes("general")) score += 3;
            score += (vet.years_of_experience || 0) * 0.5;
            score += (vet.average_rating || 0) * 2;
            if (score > bestScore) {
              bestScore = score;
              bestVet = vet;
            }
          }

          // Fetch real name using joined profile data
          const realName = bestVet.profile?.full_name || bestVet.profile?.name || "Doctor";

          matchedVet = {
            id: bestVet.id,
            userId: bestVet.user_id,
            name: `Dr. ${realName}`,
            specialization: bestVet.specializations?.[0] || "General Veterinarian",
            image: bestVet.profile_photo || bestVet.profile?.profile_photo || "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&h=200&fit=crop",
            rating: bestVet.average_rating || 4.9,
            experience: bestVet.years_of_experience || 0,
            fee: bestVet.offline_fee || 800,
            qualification: bestVet.qualification || "BVSc",
            onlineFee: bestVet.online_fee || 500,
            offlineFee: bestVet.offline_fee || 800,
            clinicAddress: bestVet.clinic_address || "",
          };
        }

        // Wait for animation to complete then navigate
        setTimeout(() => {
          navigate("/vet/booking-details", {
            state: { ...assessmentData, matchedVet }
          });
        }, isBypassUser ? 2000 : 8000);
      } catch (err) {
        console.error('Error fetching vet:', err);
        // toast.error("Failed to connect with analytical server. Retrying..."); // Optional or use regular console.error
        setTimeout(() => {
          navigate("/vet/booking-details", { state: assessmentData });
        }, isBypassUser ? 2000 : 8000);
      }
    };

    fetchAndNavigate();

    return () => {
      clearInterval(progressInterval);
      timers.forEach(clearTimeout);
    };
  }, [assessmentData, navigate, user?.email]);

  return (
    <div className="h-screen bg-background flex flex-col items-center justify-between px-4 py-8">
      <div className="text-center pt-4">
        <h1 className="text-2xl font-black text-foreground">AI Analyzing Condition</h1>
        <p className="text-sm text-muted-foreground mt-1">Please stay on this screen while we process</p>
      </div>

      <div className="relative flex items-center justify-center w-full" style={{ height: 300 }}>
        <div className="absolute w-56 h-56 border border-muted/60 rounded-full" style={{ animation: "spin 15s linear infinite" }} />
        <div className="absolute w-64 h-64 border border-muted/40 rounded-full" style={{ animation: "spin 20s linear infinite reverse" }} />
        <div className="absolute w-72 h-72 border border-muted/20 rounded-full" style={{ animation: "spin 25s linear infinite" }} />

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

        <div className="relative z-10">
          <div className="absolute inset-0 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full blur-xl opacity-40" style={{ animation: "pulse-glow 2s ease-in-out infinite" }} />
          <div className="relative w-28 h-28 bg-gradient-to-br from-pink-500 via-pink-400 to-purple-500 rounded-full flex items-center justify-center shadow-2xl" style={{ animation: "heartbeat 1.5s ease-in-out infinite" }}>
            <div className="absolute inset-0 rounded-full overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full" style={{ animation: "shimmer-move 3s ease-in-out infinite" }} />
            </div>
            <Stethoscope className="w-12 h-12 text-white" />
          </div>
        </div>
      </div>

      <div className="w-full">
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4 mb-5">
          {steps.map((label, i) => (
            <div key={i} className="flex items-start gap-3">
              {i <= activeStep ? (
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

        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mb-4">
          <div className="h-full rounded-full transition-all duration-200" style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #FF4D6D, #D4D4D8)' }} />
        </div>

        <button onClick={() => navigate("/vet/ai-assessment")} className="w-full text-center text-sm font-semibold text-muted-foreground py-2">
          Cancel Analysis
        </button>
      </div>

      <style>{`
        @keyframes orbit1 { 0% { transform: translate(-100px, -60px); } 25% { transform: translate(80px, -80px); } 50% { transform: translate(100px, 50px); } 75% { transform: translate(-60px, 80px); } 100% { transform: translate(-100px, -60px); } }
        @keyframes orbit2 { 0% { transform: translate(90px, 70px); } 25% { transform: translate(-80px, 60px); } 50% { transform: translate(-100px, -40px); } 75% { transform: translate(70px, -90px); } 100% { transform: translate(90px, 70px); } }
        @keyframes heartbeat { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
        @keyframes pulse-glow { 0%, 100% { opacity: 0.3; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.1); } }
        @keyframes shimmer-move { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default AIAnalyzingCondition;