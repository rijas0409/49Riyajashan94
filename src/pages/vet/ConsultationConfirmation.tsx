import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, PawPrint, Stethoscope, Star, Clock, CheckCircle2, Loader2, Video, AlertCircle, RefreshCw } from "lucide-react";
import { motion } from "motion/react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ConsultationConfirmation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { vet, petName, appointmentId } = location.state || {};
  
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0); // 0: Payment, 1: Reviewing, 2: Connecting
  const [currentVet, setCurrentVet] = useState(vet || {
    name: "Dr. Sarah Wilson",
    specialization: "Pet Specialist • Dogs & Cats",
    image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=300&auto=format&fit=crop",
    rating: 4.9,
    consultations: "1.2k"
  });
  const [status, setStatus] = useState<string>("pending");
  const [isFindingNext, setIsFindingNext] = useState(false);

  // Initial step transition: Payment -> Reviewing after 94ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentStep(1);
    }, 94); 
    return () => clearTimeout(timer);
  }, []);

  // Progress animation for Step 1
  useEffect(() => {
    if (currentStep === 1 && !isFindingNext) {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev < 90) return prev + 0.5;
          return prev;
        });
      }, 500);
      return () => clearInterval(interval);
    }
  }, [currentStep, isFindingNext]);

  const handleRejection = useCallback(async () => {
    setIsFindingNext(true);
    setProgress(0);
    setCurrentStep(1); // Ensure we stay/return to reviewing step
    toast.info("Dr. is currently unavailable. Finding the next best specialist for you...");

    // Simulate finding the next best doctor
    setTimeout(async () => {
      const nextVets = [
        {
          name: "Dr. Michael Chen",
          specialization: "Behavioral Specialist • All Pets",
          image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=300&auto=format&fit=crop",
          rating: 4.8,
          consultations: "2.1k",
          userId: "next_vet_" + Math.floor(Math.random() * 1000)
        },
        {
          name: "Dr. Amrita Rao",
          specialization: "General Physician • Small Pets",
          image: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?q=80&w=300&auto=format&fit=crop",
          rating: 5.0,
          consultations: "3.4k",
          userId: "next_vet_" + Math.floor(Math.random() * 1000)
        },
        {
          name: "Dr. Jashan Saini",
          specialization: "Canine Specialist • 8+ Years",
          image: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?q=80&w=300&auto=format&fit=crop",
          rating: 4.9,
          consultations: "4.2k",
          userId: "next_vet_" + Math.floor(Math.random() * 1000)
        }
      ];

      // Filter out the current vet to avoid re-matching the same one immediately
      const availableVets = nextVets.filter(v => v.name !== currentVet.name);
      const nextVet = availableVets[Math.floor(Math.random() * availableVets.length)] || nextVets[0];
      
      setCurrentVet(nextVet);
      setIsFindingNext(false);
      setStatus("pending");

      // Update the appointment in DB to point to the new vet and reset status
      if (appointmentId) {
        await supabase
          .from('vet_appointments')
          .update({ 
            vet_id: nextVet.userId, 
            status: 'pending' 
          })
          .eq('id', appointmentId);
      }
    }, 5000);
  }, [appointmentId, currentVet.name]);

  // Real-time synchronization
  useEffect(() => {
    if (!appointmentId) return;

    const channel = supabase
      .channel(`appointment_${appointmentId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'vet_appointments',
          filter: `id=eq.${appointmentId}`,
        },
        (payload) => {
          const newStatus = payload.new.status;
          setStatus(newStatus);
          
          if (newStatus === 'confirmed') {
            toast.success("Consultation accepted! Connecting...");
            // Move to Step 2: Connecting for 94ms then navigate
            setCurrentStep(2);
            setProgress(100);
            
            setTimeout(() => {
              navigate("/vet/instant-video-call", { 
                state: { 
                  ...location.state, 
                  vet: currentVet,
                  appointmentId: appointmentId
                } 
              });
            }, 94); // Requested 94ms highlight for step 2
          } else if (newStatus === 'cancelled' || newStatus === 'rejected') {
            handleRejection();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [appointmentId, navigate, location.state, currentVet, handleRejection]);

  useEffect(() => {
    const progressTimer = setInterval(() => {
      setProgress(prev => (prev < 100 ? prev + 0.5 : 100));
    }, 100);

    return () => clearInterval(progressTimer);
  }, [status]);

  // Auto call timeout if vet does not respond
  useEffect(() => {
    if (status === 'pending' && !isFindingNext) {
      const timeoutTimer = setTimeout(() => {
        const handleTimeout = async () => {
          if (!appointmentId) return;
          await supabase.from('vet_appointments').update({ status: 'cancelled' }).eq('id', appointmentId);
          toast.error("Vet did not respond in time.");
        };
        handleTimeout();
      }, 60000); // 60 seconds timeout
      
      return () => clearTimeout(timeoutTimer);
    }
  }, [status, isFindingNext, appointmentId]);

  const displayVet = currentVet;

  return (
    <div className="bg-[#f3faff] font-sans text-[#071e27] min-h-screen overflow-x-hidden">
      {/* Header with Back Button - Aligned like Summary */}
      <header className="sticky top-0 z-50 bg-[#f3faff]/80 backdrop-blur-lg">
        <div className="flex items-center px-4 py-4">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full border border-[#ECECEC] bg-white flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 pb-8 flex flex-col">

        {/* Illustration or Finding State */}
        <div className="relative flex items-center justify-center mb-6 px-5">
          {/* Background Blur */}
          <div className="absolute w-56 h-56 bg-pink-100 rounded-full blur-3xl opacity-50 -left-8 top-0" />
          <div className="absolute w-56 h-56 bg-teal-100 rounded-full blur-3xl opacity-50 -right-8 bottom-0" />

          {/* Image / Spinner */}
          <div className="relative z-10">
            {isFindingNext ? (
              <div className="w-56 h-56 rounded-[32px] bg-white/40 backdrop-blur-md flex flex-col items-center justify-center border-2 border-dashed border-[#6b5a60]/30 shadow-inner">
                <RefreshCw className="w-16 h-16 text-[#6b5a60] animate-spin mb-4" />
                <p className="text-[#6b5a60] font-bold text-center px-4 leading-tight">
                  Finding another specialist...
                </p>
              </div>
            ) : (
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDJ_7b7hTiK9bT_75Kq4VdMZYT8gXDjFSON735REFwv6NXQaHRwPmYMztV6yEZUPm_mtXbtlWX-beOiJw34S2LXVx0aVNm4AIu3uY-mFopoRo-FCoa5EaARjKTv05MA0xAWtamEFl3fgFIBE0Vpj73SHEZXde450Z5cgmQ8TQwC6AE7H45jqDisFc-9S-v0wBj-2Mq9Al1Efj0E0sop46Ec-P71mTaVwYkjbrT0KGf4jZMKQ4s_fnwpKy_OLLwngudIDPF9tqDDBKb8"
                alt="Vet Illustration"
                className="w-56 h-56 object-cover rounded-[32px] shadow-2xl ring-8 ring-white/60"
              />
            )}

            {/* Floating Icons */}
            {!isFindingNext && (
              <>
                <motion.div 
                  animate={{ translateY: [0, -8, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -top-3 -right-3 w-11 h-11 bg-white/68 backdrop-blur-xl border border-white/45 rounded-full flex items-center justify-center shadow-lg"
                >
                  <PawPrint className="w-5 h-5 text-[#516161]" />
                </motion.div>

                <motion.div 
                  animate={{ translateY: [0, -8, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  className="absolute bottom-2 -left-4 w-12 h-12 bg-white/68 backdrop-blur-xl border border-white/45 rounded-full flex items-center justify-center shadow-lg"
                >
                  <Stethoscope className="w-6 h-6 text-[#6b5a60]" />
                </motion.div>
              </>
            )}
          </div>
        </div>

        {/* Doctor Card */}
        <motion.div 
          key={currentVet.name}
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="bg-white/68 backdrop-blur-xl border border-white/45 rounded-[28px] p-4 mb-5 flex items-center justify-between shadow-sm relative overflow-hidden"
        >
          {isFindingNext && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-20 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-[#6b5a60] animate-spin" />
            </div>
          )}
          
          <div className="flex items-center gap-3">
            {/* Doctor Image */}
            <div className="relative">
              <img
                src={displayVet.image || "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=300&auto=format&fit=crop"}
                alt={displayVet.name}
                className="w-14 h-14 rounded-2xl object-cover"
              />
              {/* Online Dot */}
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full animate-pulse" />
            </div>

            {/* Doctor Details */}
            <div>
              <p className="text-[15px] font-bold text-[#071e27] leading-5">
                {displayVet.name}
              </p>
              <p className="text-[12px] text-[#5f6b73] mt-0.5">
                {displayVet.specialization || "Senior Veterinarian"}
              </p>
              <div className="flex items-center gap-1 mt-1">
                <Star className="w-[14px] h-[14px] text-amber-500 fill-amber-500" />
                <p className="text-[12px] font-medium text-[#071e27]">
                  {displayVet.rating} • {displayVet.consultations || displayVet.experience + "+ yrs"}
                </p>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className={`px-3 py-2 rounded-2xl ${status === 'pending' ? 'bg-[#d4e6e5]' : 'bg-red-100'}`}>
            <p className={`text-[11px] font-semibold leading-4 text-center ${status === 'pending' ? 'text-[#516161]' : 'text-red-600'}`}>
              {status === 'pending' ? (
                <>Reviewing<br/>Summary</>
              ) : status === 'cancelled' || status === 'rejected' ? (
                <>Unavailable<br/>Re-matching</>
              ) : (
                <>Ready to<br/>Connect</>
              )}
            </p>
          </div>
        </motion.div>

        {/* Heading */}
        <div className="text-center mb-6 px-2">
          <h1 className="text-[28px] leading-[34px] font-extrabold text-[#6b5a60] tracking-tight">
            {isFindingNext ? "Finding Best Match" : status === 'confirmed' ? "Connection Ready!" : "Preparing Your Consultation"}
          </h1>
          <p className="text-[15px] leading-6 text-[#5f6b73] mt-3 max-w-[320px] mx-auto">
            {isFindingNext 
              ? "We're quickly connecting you with another top-rated specialist who is available right now."
              : status === 'confirmed'
              ? "Your veterinarian has accepted the call. We're connecting you to the secure video room."
              : "Your vet is analyzing the symptoms and details you submitted to prepare for your consultation."}
          </p>
        </div>

        {/* Wait Time */}
        <div className="flex justify-center mb-7">
          <div className="bg-[#fce4ec] px-5 py-2.5 rounded-full shadow-sm">
            <p className="text-[14px] font-semibold text-[#6b5a60] flex items-center gap-2">
              <Clock className="w-[18px] h-[18px]" />
              {isFindingNext ? "Priority Matching Active" : status === 'confirmed' ? "Connecting Now..." : "Estimated wait time: 1–3 mins"}
            </p>
          </div>
        </div>

        {/* Progress Cards */}
        <div className="space-y-4">
          {/* Card 1: Payment Confirmed */}
          <div className={`bg-white/68 backdrop-blur-xl border rounded-3xl p-4 flex items-center gap-4 transition-all duration-300 ${currentStep === 0 ? 'border-[#6b5a60]/20 shadow-lg' : 'border-white/45 opacity-60'}`}>
            <div className={`w-11 h-11 rounded-full flex items-center justify-center ${currentStep >= 0 ? 'bg-emerald-100' : 'bg-[#d4e6e5]'}`}>
              <CheckCircle2 className={`w-6 h-6 ${currentStep >= 0 ? 'text-emerald-600' : 'text-[#516161]'}`} />
            </div>
            <div>
              <p className={`text-[15px] font-bold ${currentStep === 0 ? 'text-[#6b5a60]' : 'text-[#071e27]'}`}>
                Payment Confirmed
              </p>
              <p className="text-[13px] text-[#5f6b73]">
                Successfully processed
              </p>
            </div>
          </div>

          {/* Card 2: Vet Reviewing Summary */}
          <div className={`bg-white/68 backdrop-blur-xl border rounded-3xl p-4 flex items-center gap-4 transition-all duration-300 ${currentStep === 1 ? 'border-[#6b5a60]/20 shadow-lg' : 'border-white/45 opacity-60'}`}>
            <div className={`w-11 h-11 rounded-full flex items-center justify-center ${isFindingNext ? 'bg-amber-100' : currentStep >= 2 ? 'bg-emerald-100' : (currentStep === 1 && status === "pending") ? 'bg-[#d4e6e5]' : 'bg-white/50'}`}>
              {isFindingNext ? (
                <RefreshCw className="w-6 h-6 text-amber-600 animate-spin" />
              ) : (currentStep === 1 && status === "pending") ? (
                <Loader2 className="w-6 h-6 text-[#6b5a60] animate-spin" />
              ) : currentStep >= 2 ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              ) : (
                <Clock className="w-6 h-6 text-[#5f6b73]/50" />
              )}
            </div>
            <div>
              <p className={`text-[15px] font-bold ${currentStep === 1 ? 'text-[#6b5a60]' : 'text-[#071e27]'}`}>
                {isFindingNext ? "Finding Next Vet" : "Vet Reviewing Summary"}
              </p>
              <p className="text-[13px] text-[#6b5a60]/80">
                {isFindingNext ? "Matching with available expert" : currentStep >= 2 ? "Review completed" : "Analyzing symptoms & history"}
              </p>
            </div>
          </div>

          {/* Card 3: Connecting Video Consultation */}
          <div className={`bg-white/68 backdrop-blur-xl border rounded-3xl p-4 flex items-center gap-4 transition-all duration-500 ${currentStep === 2 ? 'border-emerald-500/30 shadow-lg bg-emerald-50/50' : 'border-white/45 opacity-50'}`}>
            <div className={`w-11 h-11 rounded-full flex items-center justify-center ${currentStep === 2 ? 'bg-emerald-100' : 'bg-white/50'}`}>
              {currentStep === 2 ? (
                <Video className="w-6 h-6 text-emerald-600 animate-pulse" />
              ) : (
                <Video className="w-6 h-6 text-[#5f6b73]" />
              )}
            </div>
            <div>
              <p className={`text-[15px] font-bold ${currentStep === 2 ? 'text-emerald-700' : 'text-[#071e27]'}`}>
                Connecting Video Consultation
              </p>
              <p className="text-[13px] text-[#5f6b73]">
                {currentStep === 2 ? "Call starting shortly..." : "Waiting for vet to join"}
              </p>
            </div>
          </div>
        </div>

        {/* Progress Bar for the 2-3 minute wait */}
        {currentStep === 1 && !isFindingNext && (
          <div className="mt-8 px-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[11px] text-[#5f6b73] font-medium">Matching status</span>
              <span className="text-[11px] text-[#5f6b73] font-medium">{Math.floor(progress)}%</span>
            </div>
            <div className="h-1.5 w-full bg-white/30 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full bg-emerald-500 rounded-full"
              />
            </div>
            <p className="text-center text-[11px] text-[#5f6b73] mt-2 font-medium">
              Average wait time is 2-3 minutes
            </p>
          </div>
        )}

        {/* Simulation Notice for Demo */}
        <div className="mt-8 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <p className="text-[12px] text-amber-800 leading-tight font-medium">
            Your consultation request is being reviewed by the assigned veterinarian. If they're unavailable, we’ll seamlessly connect you with the next best available vet.
          </p>
        </div>

        {/* Footer Text */}
        <div className="mt-auto pt-8 text-center">
          <p className="text-[13px] text-[#5f6b73] italic">
            Please stay on this screen while we connect you with the veterinarian.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ConsultationConfirmation;
