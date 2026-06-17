import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, MapPin, Clock, Loader2, CheckCircle2, Calendar, PhoneCall, RefreshCw, ChevronRight, Search, Video, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const getShortBookingId = (id: string | undefined): string => {
  if (!id) return "...";
  const clean = id.replace(/[-]/g, "");
  if (clean.length >= 9) {
    const slice = clean.slice(0, 9);
    return `${slice.slice(0, 4)}-${slice.slice(4, 7)}-${slice.slice(7, 9)}`;
  }
  return id;
};

const ClinicBookingConfirmation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const stateData = location.state || {};
  const { vet, appointmentId, visitType } = stateData.visit || {};
  
  const [currentStep, setCurrentStep] = useState(0); // 0: Payment, 1: Reviewing, 2: Scheduled
  const [status, setStatus] = useState<string>("pending");
  const [isRejected, setIsRejected] = useState(false);
  const [currentVet, setCurrentVet] = useState({
    name: vet?.name || location.state?.vet?.name || "Dr. Anaya",
    image: vet?.image || location.state?.vet?.image || "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=300&auto=format&fit=crop",
    specialization: vet?.specialization || location.state?.vet?.specialization || "Veterinarian",
  });

  // Step 1: Payment Completed -> Reviewing Request (Simulated after a small delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentStep(1);
    }, 600); 
    return () => clearTimeout(timer);
  }, []);

  // Real-time synchronization for appointment status
  useEffect(() => {
    if (!appointmentId) {
      // In simulation mode without a real DB ID, wait a bit and confirm automatically
      const simTimer = setTimeout(() => {
        setStatus("confirmed");
        setCurrentStep(2);
        toast.success("Consultation Scheduled Successfully!");
        setTimeout(() => {
          const bookingId = "SRV-84721";
          navigate(`/buyer/vet/visit-details/${bookingId}`, { 
            state: {
              ...location.state,
              realAppointmentId: "SRV-84721",
              fromBookingFlow: true
            },
            replace: true
          });
        }, 1500);
      }, 5000); // simulate vet accepting in 5 seconds
      return () => clearTimeout(simTimer);
    }

    const channel = supabase
      .channel(`appointment_clinic_${appointmentId}`)
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
            toast.success("Appointment request accepted!");
            setCurrentStep(2);
            setTimeout(() => {
               const bookingId = getShortBookingId(appointmentId);
                navigate(`/buyer/vet/visit-details/${bookingId}`, { 
                  state: {
                    ...location.state,
                    realAppointmentId: appointmentId,
                    fromBookingFlow: true
                  },
                  replace: true
                });
            }, 1200);
          } else if (newStatus === 'cancelled' || newStatus === 'rejected') {
            setIsRejected(true);
            setCurrentStep(1); // Stay on step 1 but show rejected
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [appointmentId, navigate, location.state, visitType]);

  return (
    <div className="bg-[#f8f9fa] font-sans text-gray-900 min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="flex items-center justify-between px-4 py-4">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <span className="font-bold text-base tracking-wide">Status</span>
          <div className="w-10"></div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-md mx-auto px-4 pt-6 pb-24 flex flex-col">
        {!isRejected ? (
          <>
            {/* Header copy */}
            <div className="text-center mb-8 px-2">
              <h1 className="text-2xl font-black mb-2 tracking-tight flex items-center justify-center gap-2">
                Waiting for {currentVet.name.includes("Dr") ? currentVet.name : `Dr. ${currentVet.name}`}'s Confirmation
              </h1>
              <p className="text-[13px] text-gray-500 font-medium">
                We've notified the veterinarian about your appointment request. You'll be notified once it's confirmed.
              </p>
            </div>

            {/* Animation area: Doctor -> network -> request */}
            <div className="relative py-10 mb-8 flex items-center justify-center bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Simulated travelling dots */}
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-100 -translate-y-1/2 rounded-full overflow-hidden">
                    <motion.div 
                        initial={{ x: "-100%" }}
                        animate={{ x: "100%" }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                        className="w-1/2 h-full bg-gradient-to-r from-transparent via-[#ec4899] to-transparent opacity-60"
                    />
                </div>
                
                <AnimatePresence>
                  {status === 'confirmed' ? (
                      <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="relative z-10 w-24 h-24 rounded-full bg-green-50 flex items-center justify-center border-4 border-white shadow-xl"
                      >
                         <CheckCircle2 className="w-12 h-12 text-green-500" />
                      </motion.div>
                  ) : (
                    <motion.div 
                      key="avatar"
                      animate={{ y: [-5, 5, -5] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                      className="relative z-10 flex flex-col items-center"
                    >
                      <div className="relative">
                        <img 
                          src={currentVet.image} 
                          alt="Doctor" 
                          className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg mx-auto bg-gray-50"
                        />
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#ec4899] rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                           <Loader2 className="w-3 h-3 text-white animate-spin" />
                        </div>
                      </div>
                      <div className="mt-3 text-center bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm border border-gray-100">
                         <span className="text-xs font-bold text-gray-800">Sending request...</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
            </div>

            {/* Status Timeline */}
            <h2 className="text-sm font-black text-gray-900 mb-3 tracking-wide px-1">Status Timeline</h2>
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm mb-6 relative">
               {/* Timeline vertical bar */}
               <div className="absolute left-[31px] top-10 bottom-10 w-0.5 bg-gray-100 rounded-full"></div>
               
               <div className="space-y-6 relative z-10">
                 {/* Step 1: Payment Completed */}
                 <div className="flex items-start gap-4">
                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center shrink-0 mt-0.5 relative z-10 border-2 border-white shadow-sm">
                       <CheckCircle2 className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                       <p className="font-bold text-gray-900 text-[14px]">Payment Completed</p>
                    </div>
                 </div>

                 {/* Step 2: Veterinarian Reviewing */}
                 <div className="flex items-start gap-4">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 relative z-10 border-2 border-white shadow-sm transition-colors ${currentStep >= 1 ? 'bg-amber-100' : 'bg-gray-100'}`}>
                       {currentStep >= 2 ? (
                         <CheckCircle2 className="w-4 h-4 text-green-600 fill-green-100" />
                       ) : currentStep === 1 ? (
                         <Loader2 className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                       ) : (
                         <Clock className="w-3.5 h-3.5 text-gray-400" />
                       )}
                    </div>
                    <div>
                       <p className={`font-bold text-[14px] ${currentStep >= 1 ? 'text-gray-900' : 'text-gray-400'}`}>Veterinarian Reviewing Request</p>
                    </div>
                 </div>

                 {/* Step 3: Scheduled */}
                 <div className="flex items-start gap-4">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 relative z-10 border-2 border-white shadow-sm transition-colors ${currentStep >= 2 ? 'bg-green-100' : 'bg-gray-100'}`}>
                       {currentStep >= 2 ? (
                         <CheckCircle2 className="w-4 h-4 text-green-600" />
                       ) : (
                         <div className="w-2 h-2 rounded-full border-2 border-gray-300"></div>
                       )}
                    </div>
                    <div>
                       <p className={`font-bold text-[14px] ${currentStep >= 2 ? 'text-gray-900' : 'text-gray-400'}`}>Consultation Scheduled</p>
                    </div>
                 </div>
               </div>
            </div>

            {/* Estimated time */}
            {currentStep < 2 && (
              <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3 shadow-sm mb-6">
                <Clock className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-gray-900">Estimated Response Time</p>
                  <p className="text-xs text-gray-500 mt-0.5 font-medium">Most veterinarians respond within 5–15 minutes.</p>
                </div>
              </div>
            )}

          </>
        ) : (
          /* Rejected / Unable to confirm state - perfectly full screen */
          <div className="fixed inset-0 z-[200] bg-[#F7F7FB] flex flex-col items-center justify-center p-6 text-center">
            {/* Top Navigation Row */}
            <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10">
              <button 
                onClick={() => navigate(-1)}
                className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center cursor-pointer active:scale-95 transition-all"
              >
                <ArrowLeft className="w-5 h-5 text-slate-800" />
              </button>
              <span className="font-bold text-base text-slate-800">Status</span>
              <div className="w-10"></div>
            </div>

            {/* Centered Content */}
            <div className="w-full max-w-sm space-y-6 flex flex-col items-center justify-center">
              {/* Alert Badge */}
              <div className="inline-flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs font-black text-red-600 uppercase tracking-widest leading-none">Veterinarian Unavailable</span>
              </div>

              {/* Title & Description */}
              <div className="text-center">
                <h3 className="text-[24px] font-black text-[#18181B] leading-tight tracking-tight">
                  Veterinarian Unavailable
                </h3>
                <p className="text-sm text-[#52525B] font-medium leading-relaxed mt-3 max-w-[320px] mx-auto">
                  Dr. {currentVet.name} is currently unavailable. No worries! Here's what you can do right now to get your pet seen quickly.
                </p>
              </div>

              {/* Refund Info */}
              <div className="bg-[#12B76A]/10 border border-[#12B76A]/20 rounded-2xl p-4 flex items-center gap-3 w-full text-left">
                <CheckCircle2 className="w-5 h-5 text-[#12B76A] shrink-0" strokeWidth={3} />
                <p className="text-[13px] text-[#0A6640] font-bold">Your payment has been processed for a full refund within 24 hours.</p>
              </div>

              {/* Action Cards */}
              <div className="grid grid-cols-2 gap-4 w-full">
                <button 
                  onClick={() => navigate("/vet/all-specialists")}
                  className="bg-[linear-gradient(135deg,#E8336D,#7C3AED)] text-white p-5 rounded-2xl text-left flex flex-col gap-3 shadow-lg shadow-[#E8336D]/20 active:scale-95 transition-transform cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <Search className="w-5 h-5 text-white" strokeWidth={2.5} />
                  </div>
                  <div>
                    <div className="text-[14px] font-black tracking-tight leading-snug">Find Another Vet</div>
                    <div className="text-[10px] font-bold opacity-80 uppercase tracking-widest mt-1">Available Now</div>
                  </div>
                </button>
                <button 
                  onClick={() => navigate("/vet/consultation-plan")}
                  className="bg-white border border-[#E8336D]/15 text-[#E8336D] p-5 rounded-2xl text-left flex flex-col gap-3 shadow-[0_4px_12px_rgba(0,0,0,0.02)] active:scale-95 transition-transform cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#FFF0F5] flex items-center justify-center">
                    <Video className="w-5 h-5 text-[#E8336D]" strokeWidth={2.5} />
                  </div>
                  <div>
                    <div className="text-[14px] font-black tracking-tight leading-snug">Instant Video</div>
                    <div className="text-[10px] font-bold text-[#52525B]/70 uppercase tracking-widest mt-1">Ready in {"< 2min"}</div>
                  </div>
                </button>
              </div>
              
              <button className="w-full h-14 bg-white border border-slate-100 rounded-xl flex items-center px-4 gap-3 shadow-[0_2px_8px_rgba(0,0,0,0.01)]">
                <MessageSquare className="w-4 h-4 text-[#A1A1AA]" />
                <span className="flex-1 text-[14px] font-bold text-[#52525B] text-left">Need help? Contact Support</span>
                <ChevronRight className="w-4 h-4 text-[#D4D4D8]" />
              </button>
            </div>
          </div>
        )}
      </main>

      {!isRejected && currentStep < 2 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 z-10 w-full md:max-w-md md:mx-auto">
          <button 
            className="w-full py-4 rounded-full bg-white border border-gray-200 text-gray-900 font-bold flex flex-col items-center justify-center shadow-sm active:bg-gray-50 transition-colors"
          >
            <span className="text-[13px] flex items-center gap-1">View Booking Status <ChevronRight className="w-3.5 h-3.5 opacity-50" /></span>
          </button>
        </div>
      )}
    </div>
  );
};

export default ClinicBookingConfirmation;
