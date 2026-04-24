import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, HelpCircle, Check, Stethoscope } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const vetAvatars = [
  { id: "1", image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=100&h=100&fit=crop" },
  { id: "2", image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=100&h=100&fit=crop" },
];

const FindingVet = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const stateData = location.state || {};
  const [searchTime, setSearchTime] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSearchTime(prev => prev + 1);
    }, 1000);

    // Fetch real vet from DB
    const fetchAndNavigate = async () => {
      try {
        const { data: vets } = await supabase
          .from('vet_profiles')
          .select('*')
          .eq('is_active', true)
          .eq('verification_status', 'verified')
          .limit(5);

        let matchedVet = stateData.matchedVet || null;

        if (!matchedVet && vets && vets.length > 0) {
          const bestVet = vets[0];
          const { data: profileData } = await supabase
            .from('profiles')
            .select('name, full_name, profile_photo')
            .eq('id', bestVet.user_id)
            .single();

          const realName = profileData?.full_name || profileData?.name || "Doctor";

          matchedVet = {
            id: bestVet.id,
            userId: bestVet.user_id,
            name: `Dr. ${realName}`,
            specialization: bestVet.specializations?.[0] || "General Veterinarian",
            image: bestVet.profile_photo || profileData?.profile_photo || "",
            rating: bestVet.average_rating || 0,
            experience: bestVet.years_of_experience || 0,
            fee: bestVet.online_fee || 499,
            onlineFee: bestVet.online_fee || 500,
            offlineFee: bestVet.offline_fee || 800,
          };
        }

        setTimeout(() => {
          navigate("/vet/connection-ready", {
            state: { ...stateData, matchedVet }
          });
        }, Math.random() * 3000 + 5000);
      } catch (err) {
        console.error('Error finding vet:', err);
        setTimeout(() => {
          navigate("/vet/connection-ready", { state: stateData });
        }, 6000);
      }
    };

    fetchAndNavigate();

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg">
        <div className="flex items-center justify-between px-4 py-4">
          <button onClick={() => navigate("/vet")} className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <h1 className="text-lg font-bold">Finding a Vet</h1>
            <p className="text-xs text-pink-500 font-medium">STEP 2 OF 3</p>
          </div>
          <button className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <HelpCircle className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </header>

      <div className="px-4 py-6">
        <div className="relative h-80 mb-8 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="absolute w-64 h-64 border border-purple-200/50 rounded-full" style={{ animation: "spin 15s linear infinite" }} />
            <div className="absolute w-72 h-72 border border-pink-200/30 rounded-full" style={{ animation: "spin 20s linear infinite reverse" }} />
            <div className="absolute w-80 h-80 border border-blue-200/20 rounded-full" style={{ animation: "spin 25s linear infinite" }} />
          </div>

          <div className="absolute" style={{ animation: "orbit1 8s ease-in-out infinite" }}>
            <div className="w-14 h-14 rounded-full overflow-hidden border-3 border-pink-400 shadow-lg bg-white p-0.5">
              <img src={vetAvatars[0].image} alt="Vet" className="w-full h-full object-cover rounded-full" />
            </div>
          </div>
          <div className="absolute" style={{ animation: "orbit2 10s ease-in-out infinite" }}>
            <div className="w-12 h-12 rounded-full overflow-hidden border-3 border-purple-400 shadow-lg bg-white p-0.5">
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

        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Connecting you with a<br />specialist in seconds
          </h2>
          <div className="flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
            <span className="text-pink-500 font-semibold tracking-wider text-sm">SEARCHING NEARBY...</span>
          </div>
        </div>

        <button onClick={() => navigate("/vet")} className="w-full bg-muted text-muted-foreground py-4 rounded-2xl font-semibold">
          Cancel Search
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

export default FindingVet;