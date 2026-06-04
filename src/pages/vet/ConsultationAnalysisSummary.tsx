import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Clock, ShieldCheck, Video, Stethoscope, CheckCircle2, ChevronRight, AlertCircle, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";

const ConsultationAnalysisSummary = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { appointmentId, vet, assessmentData } = location.state || {};
  const [status, setStatus] = useState("pending");
  const [isSearchingNewVet, setIsSearchingNewVet] = useState(false);
  const [currentVet, setCurrentVet] = useState(vet);

  const handleRejection = useCallback(async () => {
    setIsSearchingNewVet(true);
    toast.error("The vet is unavailable. Finding you another specialist...");

    // Find next best vet logic
    try {
      const { data: vets, error } = await supabase
        .from('vet_profiles')
        .select('*')
        .eq('is_active', true)
        .eq('verification_status', 'verified')
        .neq('user_id', currentVet?.userId) // Don't pick the same one
        .limit(5);

      if (vets && vets.length > 0) {
        // Just pick the first available for now
        const nextVet = vets[0];
        
        // Fetch profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, name, profile_photo')
          .eq('id', nextVet.user_id)
          .single();

        const formattedVet = {
          id: nextVet.id,
          userId: nextVet.user_id,
          name: `Dr. ${profile?.full_name || profile?.name || "Specialist"}`,
          specialization: nextVet.specializations?.[0] || "Veterinarian",
          image: nextVet.profile_photo || profile?.profile_photo || "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&h=200&fit=crop",
          rating: nextVet.average_rating || 4.9,
          experience: nextVet.years_of_experience || 5,
        };

        // Update appointment with new vet
        await supabase
          .from('vet_appointments')
          .update({ 
            vet_id: formattedVet.userId,
            status: 'pending' 
          })
          .eq('id', appointmentId);

        setCurrentVet(formattedVet);
        setStatus("pending");
        setIsSearchingNewVet(false);
        toast.success(`Re-assigned to ${formattedVet.name}`);
      } else {
        toast.error("No other vets found available. Please try again later.");
        setIsSearchingNewVet(false);
        setStatus("failed");
      }
    } catch (err) {
      console.error("Reassignment error:", err);
      setIsSearchingNewVet(false);
    }
  }, [appointmentId, currentVet?.userId]);

  useEffect(() => {
    if (!appointmentId) {
      navigate("/vet/instant-assessment");
      return;
    }

    // Subscribe to appointment changes
    const channel = supabase
      .channel(`appointment_${appointmentId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "vet_appointments",
        },
        async (payload) => {
          if (payload.new.id !== appointmentId) return;

          const newStatus = payload.new.status;
          setStatus(newStatus);

          if (newStatus === "confirmed" || newStatus === "accepted") {
            toast.success("Vet accepted your request! Transitioning to call...");
            setTimeout(() => {
              navigate("/vet/instant-video-call", { 
                state: { 
                  appointmentId, 
                  vet: currentVet,
                  consultation: payload.new,
                  petName: payload.new.pet_name
                } 
              });
            }, 1500);
          } else if (newStatus === "rejected") {
            handleRejection();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [appointmentId, navigate, currentVet, handleRejection]);

  return (
    <div className="min-h-screen bg-[#FDF8FA] pb-10">
      {/* Header */}
      <div className="bg-white px-4 py-6 sticky top-0 z-50 shadow-sm flex items-center justify-between">
        <button 
          onClick={() => navigate("/buyer/vet")}
          className="w-10 h-10 rounded-full bg-[#F1F1F1] flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-[#151B32]" />
        </button>
        <h1 className="text-lg font-black text-[#151B32]">Analysis Summary</h1>
        <div className="w-10" />
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Connection Status Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[32px] p-6 shadow-sm border border-[#F1F1F1] text-center"
        >
          <div className="relative w-20 h-20 mx-auto mb-4">
            <div className="absolute inset-0 bg-pink-100 rounded-full animate-ping opacity-20" />
            <div className="relative w-20 h-20 bg-pink-50 rounded-full flex items-center justify-center shadow-inner">
              {isSearchingNewVet ? (
                <RefreshCw className="w-10 h-10 text-pink-500 animate-spin" />
              ) : status === "pending" ? (
                <Video className="w-10 h-10 text-pink-500 animate-pulse" />
              ) : (
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              )}
            </div>
          </div>
          
          <h2 className="text-xl font-black text-[#151B32] mb-2 text-balance">
            {isSearchingNewVet ? "Finding New Specialist..." : 
             status === "analyzing" ? "Vet is Analyzing your Summary..." :
             status === "pending" ? "Waiting for Vet to Join" : 
             "Connecting to Call..."}
          </h2>
          <p className="text-sm text-muted-foreground max-w-[240px] mx-auto">
            {status === "analyzing" ? "Dr. Malhotra is reviewing your pet's report to provide specialized care." :
             status === "pending" ? "Doctor is reviewing your pet's analysis report. Typically takes 30-60 seconds." : 
             "Get ready! Your consultation is starting."}
          </p>
        </motion.div>

        {/* Assigned Vet Card */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider px-1">Assigned Specialist</h3>
          <motion.div 
            key={currentVet?.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-[32px] p-5 shadow-sm border border-[#F1F1F1] flex items-center gap-4"
          >
            <div className="relative">
              <img 
                src={currentVet?.image} 
                alt={currentVet?.name} 
                className="w-16 h-16 rounded-2xl object-cover"
              />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#4F86FF] rounded-full flex items-center justify-center border-2 border-white">
                <ShieldCheck className="w-3 h-3 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-[#151B32]">{currentVet?.name}</h4>
              <p className="text-xs text-pink-500 font-bold">{currentVet?.specialization}</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center gap-1 text-[10px] bg-yellow-50 text-yellow-700 px-1.5 py-0.5 rounded-full font-bold">
                  ★ {currentVet?.rating}
                </div>
                <span className="text-[10px] text-muted-foreground font-medium">{currentVet?.experience}+ yrs exp.</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Analysis Overview */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider px-1">Pet Analysis Report</h3>
          <div className="bg-card border border-border rounded-[32px] p-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center shrink-0">
                <Stethoscope className="w-5 h-5 text-pink-500" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-[#151B32] text-sm">Condition AI Summary</h4>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Based on the symptoms reported ({assessmentData?.selectedSymptoms?.join(", ")}), the AI suggests 
                  possible {assessmentData?.selectedSymptoms?.[0]?.toLowerCase() || "ailment"}. The vet will verify 
                  clinical signs once connected.
                </p>
              </div>
            </div>

            <div className="h-px bg-muted/60" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-bold text-[#151B32] uppercase">Duration Requested</span>
              </div>
              <span className="text-xs font-black text-pink-500 mt-1">
                {assessmentData?.selectedDuration === 249 ? "10 Mins" : 
                 assessmentData?.selectedDuration === 399 ? "20 Mins" : "30 Mins"}
              </span>
            </div>
          </div>
        </div>

        {/* Security / Quality Badges */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-green-50/50 p-4 rounded-2xl border border-green-100 flex flex-col items-center text-center">
            <ShieldCheck className="w-6 h-6 text-green-600 mb-2" />
            <span className="text-[10px] font-bold text-green-700">Encrypted Call</span>
          </div>
          <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 flex flex-col items-center text-center">
            <CheckCircle2 className="w-6 h-6 text-blue-600 mb-2" />
            <span className="text-[10px] font-bold text-blue-700">Verified Vet</span>
          </div>
        </div>

        {/* Safety Note */}
        <div className="flex gap-3 p-4 bg-yellow-50 rounded-2xl border border-yellow-100">
          <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0" />
          <p className="text-[11px] text-yellow-800 font-medium leading-normal">
            If you're not connected within 2 minutes, the call will be auto-cancelled and you'll receive a full refund instantly.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ConsultationAnalysisSummary;
