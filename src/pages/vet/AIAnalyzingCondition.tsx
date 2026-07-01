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
        return prev + (isBypassUser ? 5 : 2);
      });
    }, isBypassUser ? 40 : 80);

    const timers = steps.map((_, i) =>
      setTimeout(() => setActiveStep(i), i * (isBypassUser ? 300 : 900))
    );

    const fetchAndNavigate = async () => {
      const startTime = Date.now();
      const maxSearchDuration = 49000;
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      let matchedVet: any = null;
      let attempt = 0;

      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      const navigateWithTiming = (path: string, stateData?: any) => {
        const elapsed = Date.now() - startTime;
        let delay = 0;
        
        // Ensure steps finish animating if found early (minimum 4.5 seconds for visual steps)
        if (elapsed < 4500 && path !== "/vet/no-vet-found") {
          delay = 4500 - elapsed;
        }

        if (delay > 0) {
          setTimeout(() => {
            navigate(path, { state: stateData });
          }, delay);
        } else {
          navigate(path, { state: stateData });
        }
      };

      console.log("Smart Match request received - starting search...");

      while (Date.now() - startTime < maxSearchDuration) {
        attempt++;
        console.log(`Smart Match database search & AI analysis started (attempt ${attempt})...`);
        try {
          // 1. Fetch verified active vet_profiles first
          const { data: vetProfiles, error: vpErr } = await supabase
            .from("vet_profiles")
            .select("id, user_id, specializations, years_of_experience, online_fee, average_rating, verification_status, is_active, profile_photo, offline_fee, qualification, clinic_address, weekly_availability, consultation_type")
            .in("verification_status", ["verified", "approved"])
            .eq("is_active", true);

          if (vpErr) {
            console.error("Database query failed:", vpErr);
            throw vpErr;
          }

          console.log(`Number of veterinarians retrieved: ${vetProfiles?.length || 0}`);

          if (vetProfiles && vetProfiles.length > 0) {
            // 2. Fetch corresponding profiles
            const { data: profiles, error: profileErr } = await supabase
              .from("profiles")
              .select("id, name, full_name, profile_photo, is_admin_approved, role")
              .in("id", vetProfiles.map(p => p.user_id));

            if (profileErr) {
              console.error("Error fetching user profiles:", profileErr);
            }

            const pMap = new Map((profiles || []).map(p => [p.id, p]));
            const searchMode = (assessmentData.selectedMode || "video").toLowerCase();

            const verifiedVets = vetProfiles
              .filter(vp => {
                const p = pMap.get(vp.user_id);
                // If profile exists, check if admin approved. If profile is missing, bypass check.
                if (p && !p.is_admin_approved) return false;

                // Real-time Booking Assignment matching filter
                const modes = Array.isArray(vp.consultation_type)
                  ? vp.consultation_type.map((m: unknown) => String(m).toLowerCase())
                  : typeof vp.consultation_type === 'string'
                    ? [vp.consultation_type.toLowerCase()]
                    : [];

                if (searchMode.includes("clinic") && !modes.some((m: string) => m.includes("clinic"))) return false;
                if (searchMode.includes("home") && !modes.some((m: string) => m.includes("home"))) return false;
                if (searchMode.includes("video") && !modes.some((m: string) => m.includes("video"))) return false;

                return true;
              })
              .map(vp => {
                const p = pMap.get(vp.user_id);
                return {
                  ...vp,
                  profile: p
                };
              });

            console.log(`Number of eligible veterinarians: ${verifiedVets.length}`);

            if (verifiedVets.length > 0) {
              const formattedVets = verifiedVets.map(v => ({
                id: v.id,
                name: v.profile?.full_name || v.profile?.name || "Veterinarian",
                specializations: v.specializations,
                experience: v.years_of_experience,
                rating: v.average_rating,
                consultation_type: v.consultation_type,
                address: v.clinic_address
              }));

              console.log("Ranking started: sending ranked candidate veterinarians to AI...");
              const response = await fetch("/api/smart-match", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({
                  payload: assessmentData,
                  vets: formattedVets
                })
              });

              if (response.ok) {
                const data = await response.json();
                console.log("Selected veterinarian ID from AI matching response:", data.selectedVetId);
                if (data.selectedVetId) {
                  const matched = verifiedVets.find(v => v.id === data.selectedVetId);
                  if (matched) {
                    const rawName = matched.profile?.full_name || matched.profile?.name || "Veterinarian";
                    const realName = `Dr. ${rawName}`;

                    matchedVet = {
                      id: matched.id,
                      userId: matched.user_id,
                      name: realName,
                      specialization: (matched.specializations || []).join(", ") || "General Veterinarian",
                      image: matched.profile_photo || matched.profile?.profile_photo || "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&h=200&fit=crop",
                      rating: matched.average_rating || 4.9,
                      experience: matched.years_of_experience || 0,
                      fee: matched.online_fee || 800,
                      qualification: matched.qualification || "BVSc",
                      onlineFee: matched.online_fee || 500,
                      offlineFee: matched.offline_fee || 800,
                      clinicAddress: matched.clinic_address || "",
                      weekly_availability: matched.weekly_availability || null,
                    };
                    console.log("Search completed - Match found:", matchedVet);
                    break;
                  }
                }
              } else {
                console.error("Smart match API returned error status:", response.status);
              }
            }
          }
        } catch (err) {
          console.error("Error fetching vet profile or calling AI during attempt:", err);
        }

        // Wait before retrying to prevent aggressive loops, up to the remaining duration of the 49-second budget
        const elapsed = Date.now() - startTime;
        const remaining = maxSearchDuration - elapsed;
        if (remaining <= 5000) {
          console.log(`Timeout approaching (${Math.round(remaining / 1000)}s left). Breaking retry loop.`);
          break;
        }

        console.log(`No match found on this attempt. Retrying in 5 seconds... (${Math.round(remaining / 1000)}s remaining in search budget)`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }

      if (matchedVet) {
        console.log("Navigation decision: redirecting to Booking Details screen");
        navigateWithTiming("/vet/booking-details", { ...assessmentData, matchedVet });
      } else {
        console.log("Navigation decision: 49-second timeout expired with no qualified veterinarians. Redirecting to No Vet Found screen.");
        navigate("/vet/no-vet-found");
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