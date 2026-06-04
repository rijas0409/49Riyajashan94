import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, MapPin, Clock, Loader2, CheckCircle2, Calendar, PhoneCall, RefreshCw, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

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
          navigate(visitType === "home" ? "/vet/home-visit-details" : "/vet/clinic-visit-details", { 
            state: location.state
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
               navigate(visitType === "home" ? "/vet/home-visit-details" : "/vet/clinic-visit-details", { 
                 state: location.state
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
          /* Rejected / Unable to confirm state */
          <div className="flex flex-col items-center justify-center pt-8 animate-fade-in text-center">
             <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-6 border border-red-100 shadow-sm">
                <Calendar className="w-10 h-10 text-red-500 opacity-60" />
                <div className="absolute w-8 h-8 bg-white rounded-full flex items-center justify-center -bottom-1 -right-1 shadow-sm">
                  <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
                    <span className="text-red-600 font-bold text-sm">✕</span>
                  </div>
                </div>
             </div>
             <h1 className="text-2xl font-black mb-3 text-gray-900">Unable to Confirm Appointment</h1>
             <p className="text-sm text-gray-500 mb-8 max-w-[280px]">
               Dr. {currentVet.name} is currently unavailable for this timeslot. Your payment has been refunded or held as credits.
             </p>

             <div className="w-full space-y-3">
               <button 
                 onClick={() => navigate("/buyer/vet")}
                 className="w-full py-4 bg-gray-900 text-white font-bold rounded-2xl flex items-center justify-center gap-2"
               >
                 Find Another Vet
               </button>
               <button 
                 onClick={() => navigate("/vet/video-consultation")}
                 className="w-full py-4 bg-purple-50 text-purple-700 border border-purple-100 font-bold rounded-2xl flex items-center justify-center gap-2"
               >
                 <PhoneCall className="w-4 h-4" /> Instant Video Consultation
               </button>
               <button className="w-full py-4 text-gray-500 font-bold rounded-2xl">
                 Contact Support
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
