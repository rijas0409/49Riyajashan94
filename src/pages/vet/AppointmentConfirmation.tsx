import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { motion, useMotionValue, useTransform, AnimatePresence } from "motion/react";
import { 
  ArrowLeft, 
  MoreHorizontal, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  Timer, 
  Search, 
  Video, 
  MessageSquare, 
  ChevronRight,
  User,
  Star
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function AppointmentConfirmation() {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [appointment, setAppointment] = useState<any>(location.state?.appointment || location.state?.visit || null);
  const [isLoading, setIsLoading] = useState(!location.state?.appointment && !location.state?.visit);
  const [isRevealed, setIsRevealed] = useState(false);
  const [showRejectSheet, setShowRejectSheet] = useState(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [progressWidth, setProgressWidth] = useState(0);

  // Gesture Controls
  const y = useMotionValue(0);
  const COMMIT_THRESHOLD = 70;
  const bubbleScale = useTransform(y, [0, COMMIT_THRESHOLD], [1, 0.45]);
  const bubbleOpacity = useTransform(y, [0, COMMIT_THRESHOLD], [1, 0]);
  const pullHintOpacity = useTransform(y, [0, COMMIT_THRESHOLD / 2], [1, 0]);

  useEffect(() => {
    if (!appointmentId) return;

    const fetchAppointment = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("vet_appointments")
          .select("*, vet:profiles!vet_appointments_vet_id_fkey(*)")
          .eq("id", appointmentId)
          .maybeSingle();

        if (error) throw error;
        
        if (data) {
          // Fetch vet profile separately to avoid complex join issues if FKs aren't naming-compliant
          const { data: vp } = await supabase
            .from("vet_profiles")
            .select("*")
            .eq("user_id", data.vet_id)
            .maybeSingle();
            
          const localPayStr = localStorage.getItem(`payment_details_${appointmentId}`);
          const localPay = localPayStr ? JSON.parse(localPayStr) : null;
            
          setAppointment({ ...data, vet_profile: vp, payment_details: localPay });
          
          if (data.status === "confirmed" || data.status === "approved") {
            triggerSuccess();
          } else if (data.status === "cancelled" || data.status === "failed") {
            setShowRejectSheet(true);
          }
        } else if (location.state?.visit) {
          const localPayStr = localStorage.getItem(`payment_details_${appointmentId}`);
          const localPay = localPayStr ? JSON.parse(localPayStr) : null;

          // If not found in DB yet (maybe delay), use state visit
          setAppointment({
            ...location.state.visit,
            vet: location.state.visit.vet,
            vet_profile: { specialization: location.state.visit.vet?.specialization },
            payment_details: localPay
          });
        }
      } catch (err) {
        console.error("Error fetching appointment:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAppointment();

    // REAL-TIME SUBSCRIPTION
    const channel = supabase
      .channel(`appointment_${appointmentId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "vet_appointments",
          filter: `id=eq.${appointmentId}`,
        },
        (payload) => {
          const newStatus = payload.new.status;
          console.log("Appointment status updated:", newStatus);
          if (newStatus === "confirmed" || newStatus === "approved") {
            triggerSuccess();
          } else if (newStatus === "cancelled" || newStatus === "failed") {
            setShowRejectSheet(true);
          }
        }
      )
      .subscribe();

    const pollInterval = setInterval(() => {
      fetchAppointment();
    }, 4000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, [appointmentId]);

  const triggerSuccess = () => {
    setIsRevealed(true);
    setShowSuccessOverlay(true);
    setTimeout(() => setProgressWidth(100), 100);
    setTimeout(() => {
      navigate(`/vet/clinic-visit-details/${appointmentId}`, { replace: true });
    }, 3500);
  };

  const handleDragEnd = () => {
    if (y.get() >= COMMIT_THRESHOLD) {
      setIsRevealed(true);
    } else {
      y.set(0);
    }
  };

  if (isLoading && !appointment) {
    return (
      <div className="min-h-screen bg-[#F7F7FB] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-[#E8336D] rounded-full animate-spin" />
          <p className="text-sm font-bold text-slate-500">Preparing your status...</p>
        </div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="min-h-screen bg-[#F7F7FB] flex items-center justify-center p-6 text-center">
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm max-w-sm">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Timer className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-slate-800 mb-2">Booking Not Found</h2>
          <p className="text-sm text-slate-500 mb-6 font-medium">We couldn't retrieve your booking details. Please check your internet or try again.</p>
          <button 
            onClick={() => navigate("/vet/home")}
            className="w-full h-12 bg-slate-900 text-white rounded-xl font-bold"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const vet = appointment.vet || appointment.vet_info || (location.state?.visit?.vet);
  const vetProfile = appointment.vet_profile;

  const payId = appointment.payment_details?.payment_id || ("pay_rzp_" + (appointmentId ? appointmentId.replace(/-/g, "").substring(0, 14).toUpperCase() : "QY82JKDLAJS"));
  const payMethod = appointment.payment_details?.payment_method || (appointment.appointment_type === 'home' ? "Card (Visa ending in 8124)" : "UPI (GPay)");
  const payAmount = appointment.amount || appointment.payment_details?.amount || 499;

  return (
    <div className="min-h-screen bg-[#F7F7FB] font-['Inter'] relative overflow-x-hidden">
      {/* Background Gradient */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_85%_42%_at_50%_0%,rgba(232,51,109,0.07)_0%,transparent_65%)] pointer-events-none z-0" />

      {/* Navigation */}
      <div className="fixed top-0 left-0 right-0 flex items-center justify-between px-4 py-4 z-[100] bg-[#F7F7FB]/80 backdrop-blur-md">
        <button 
          onClick={() => navigate('/vet/booking-details')}
          className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center cursor-pointer active:scale-95 transition-all z-10"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground">Appointment Status</h1>
        <button className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center cursor-pointer active:scale-95 transition-all">
          <MoreHorizontal className="w-5 h-5 text-foreground" />
        </button>
      </div>

      <div className="px-4 space-y-4 pb-32 pt-24 max-w-md mx-auto relative z-10">
        
        {/* Real-time Dynamic Awaiting Confirmation Card (Visually Independent) */}
        <div className="relative z-20 bg-[linear-gradient(155deg,#FFFBFD_0%,#F6F3FF_100%)] rounded-[22px] border border-pink-100/50 shadow-[0_8px_30px_rgba(0,0,0,0.03),0_1px_3px_rgba(0,0,0,0.01)] overflow-hidden">
          <div className="p-6 pt-10 flex flex-col items-center select-none relative">
            
            {/* Status Pill */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-[#F59E0B]/10 border border-[#F59E0B]/20 text-[#F59E0B] text-[10px] font-black tracking-widest uppercase px-3 py-1 rounded-full flex items-center gap-1.5 whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] animate-pulse" />
              Awaiting Confirmation
            </div>

            {/* The Interaction Stage - Vet profile photo inside the circle! */}
            <div className="w-full mt-4 flex flex-col items-center relative min-h-[140px] justify-center">
              {!isRevealed ? (
                <div className="flex flex-col items-center w-full">
                  <motion.div
                    drag="y"
                    dragConstraints={{ top: 0, bottom: 120 }}
                    style={{ y, scale: bubbleScale, opacity: bubbleOpacity }}
                    onDragEnd={handleDragEnd}
                    className="w-20 h-20 rounded-full bg-white border-[3px] border-white shadow-[0_0_0_5px_rgba(232,51,109,0.12),0_8px_24px_rgba(0,0,0,0.12)] flex items-center justify-center cursor-grab active:cursor-grabbing z-30 overflow-hidden shrink-0"
                    animate={{ y: [0, -6, 0] }}
                    transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                  >
                    {vet?.profile_photo ? (
                      <img src={vet.profile_photo} alt={vet?.name} className="w-full h-full object-cover rounded-full" />
                    ) : (
                      <User className="w-8 h-8 text-[#E8336D]" />
                    )}
                  </motion.div>
                  
                  <motion.div style={{ opacity: pullHintOpacity }} className="mt-2.5 flex flex-col items-center gap-1">
                    <span className="text-[10px] font-bold text-[#E8336D]/60 tracking-wider uppercase">Swipe Down to Confirm</span>
                    <motion.div
                      animate={{ y: [0, 4, 0] }}
                      transition={{ repeat: Infinity, duration: 1.3, ease: "easeInOut" }}
                    >
                      <ArrowLeft className="w-3.5 h-3.5 text-[#E8336D]/50 rotate-[270deg]" strokeWidth={3} />
                    </motion.div>
                  </motion.div>

                  {/* Connector Line */}
                  <div className="h-8 w-0.5 bg-[linear-gradient(to_bottom,#FFD6E7,rgba(124,58,237,0.1))] rounded-full relative my-1.5">
                    <motion.div 
                      className="absolute left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[#E8336D]"
                      animate={{ top: ["-4px", "100%"], opacity: [0, 1, 1, 0] }}
                      transition={{ repeat: Infinity, duration: 1.55, ease: [0.4, 0, 0.6, 1] }}
                    />
                  </div>
                </div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, y: 15, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="w-full z-40"
                >
                  <div className="bg-white/95 backdrop-blur rounded-2xl border border-[#E8336D]/15 p-4 flex items-center gap-3 shadow-[0_4px_16px_rgba(232,51,109,0.08)]">
                    <div className="w-12 h-12 rounded-full bg-slate-100 border-2 border-white shadow-sm flex items-center justify-center shrink-0 overflow-hidden">
                      {vet?.profile_photo ? (
                        <img src={vet.profile_photo} alt={vet.name} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-5 h-5 text-[#E8336D]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <h4 className="text-[14.5px] font-black text-slate-900 truncate tracking-tight">
                        {vet?.full_name || vet?.name || "Dr. Jashan Pabla"}
                      </h4>
                      <p className="text-[11.5px] text-slate-500 font-semibold truncate">
                        {vetProfile?.specialization || (vetProfile?.specializations && vetProfile.specializations[0]) || "Veterinary Specialist"} · {vetProfile?.qualification || "BVSc & AH"}
                      </p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <div className="flex gap-0.5">
                          {[1,2,3,4,5].map(i => <Star key={i} className="w-2.5 h-2.5 fill-[#F59E0B] text-[#F59E0B]" />)}
                        </div>
                        <span className="text-[10.5px] font-bold text-slate-400 ml-1">
                          {vetProfile?.average_rating || "4.9"} · {vetProfile?.years_of_experience || 6}+ yrs exp
                        </span>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-[#12B76A] flex items-center justify-center shadow-lg shadow-[#12B76A]/30 shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-white" strokeWidth={3} />
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Waiting Message block */}
            <div className="w-full mt-2 pt-4 border-t border-slate-100 text-center">
              <h2 className="text-[16.5px] font-extrabold text-slate-950 leading-tight mb-1 tracking-tight">
                Waiting for {vet?.full_name || vet?.name || "Dr. Jashan Pabla"}'s Confirmation
              </h2>
              <p className="text-[12.5px] text-slate-500 leading-relaxed font-semibold">
                We've instantly notified the veterinarian of your booking request. You'll be notified immediately upon confirmation.
              </p>
            </div>

          </div>
        </div>

        {/* Large Veterinarian Information Card (Visual independent card starting below) */}
        <div className="relative z-10 -mt-6 bg-white rounded-[22px] border border-slate-200/60 shadow-[0_10px_25px_rgba(0,0,0,0.02)] overflow-hidden">
          
          {/* Header Banner bg */}
          <div className="h-20 bg-gradient-to-r from-pink-50/50 to-purple-50/50 border-b border-slate-100/50" />
          
          <div className="px-5 pb-6 pt-0 relative">
            {/* Round Avatar overlapping banner */}
            <div className="absolute -top-10 left-5 w-20 h-20 rounded-full border-4 border-white shadow-md bg-slate-50 overflow-hidden shrink-0">
              {vet?.profile_photo ? (
                <img src={vet.profile_photo} alt={vet?.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-pink-100 flex items-center justify-center text-[#E8336D]">
                  <User className="w-8 h-8" />
                </div>
              )}
            </div>

            {/* Right side content: Verification badge */}
            <div className="flex justify-end pt-3">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-50 border border-green-100 text-[10px] font-black text-green-600 uppercase tracking-widest leading-none">
                <CheckCircle2 className="w-3 h-3 text-green-500" strokeWidth={3} />
                Verified Partner
              </span>
            </div>

            {/* Vet Meta Details */}
            <div className="mt-4 space-y-3">
              <div>
                <h3 className="text-[19px] font-black text-slate-900 tracking-tight leading-none">
                  {vet?.full_name || vet?.name || "Dr. Jashan Pabla"}
                </h3>
                <p className="text-xs font-bold text-pink-500 mt-1.5">
                  {vetProfile?.specialization || (vetProfile?.specializations && vetProfile.specializations[0]) || "Veterinary Consultant"}
                </p>
                <p className="text-xs text-slate-400 font-semibold mt-1">
                  {vetProfile?.qualification || "BVSc & AH • MVSc"}
                </p>
              </div>

              {/* Grid of stats */}
              <div className="grid grid-cols-3 gap-2.5 pt-1.5">
                <div className="bg-slate-50 p-2.5 rounded-xl text-center">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Experience</span>
                  <span className="text-sm font-black text-slate-900 block mt-0.5">{vetProfile?.years_of_experience || 8}+ Yrs</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl text-center">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Rating</span>
                  <span className="text-sm font-black text-slate-900 block mt-0.5">★ {vetProfile?.average_rating || "4.9"}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl text-center">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Type</span>
                  <span className="text-sm font-black text-slate-900 block mt-0.5 truncate">
                    {appointment.appointment_type === "home" ? "Home Visit" : "In-Clinic"}
                  </span>
                </div>
              </div>

              {/* Consultation Details */}
              <div className="bg-slate-50/50 rounded-xl p-3 border border-slate-100 space-y-2">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Clinic Address</span>
                    <p className="text-[11.5px] font-bold text-slate-800 leading-tight">
                      {vetProfile?.clinic_address || "Indiranagar Primary Care, Sector 4, Bengaluru"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Timeline Section */}
        <div className="bg-white rounded-[22px] border border-black/5 shadow-sm p-4 px-5">
          <span className="text-[10px] font-black text-[#A1A1AA] tracking-[0.08em] uppercase">Status Timeline</span>
          <div className="mt-4 space-y-6 relative">
            {/* Step 1 */}
            <div className="flex gap-3.5 relative z-10">
              <div className="w-7 h-7 rounded-full bg-[#12B76A]/10 border-[1.5px] border-[#12B76A]/28 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#12B76A]" strokeWidth={3} />
              </div>
              <div className="pt-0.5">
                <h4 className="text-[13.5px] font-bold text-[#18181B]">Payment Completed</h4>
                <p className="text-[11.5px] text-[#A1A1AA] font-semibold mt-0.5">₹{payAmount} · {payMethod} · {payId}</p>
              </div>
              <div className="absolute left-[13.5px] top-8 w-[1.5px] h-6 bg-black/5" />
            </div>

            {/* Step 2 */}
            <div className="flex gap-3.5 relative z-10">
              <div className="w-7 h-7 rounded-full bg-[#E8336D]/5 border-[1.5px] border-[#E8336D]/20 flex items-center justify-center shrink-0 shadow-[0_0_0_4px_rgba(232,51,109,0.05)]">
                <div className="w-3.5 h-3.5 border-2 border-[#E8336D]/20 border-t-[#E8336D] rounded-full animate-spin" />
              </div>
              <div className="pt-0.5">
                <h4 className="text-[13.5px] font-bold text-[#18181B]">Veterinarian Reviewing</h4>
                <p className="text-[11.5px] text-[#A1A1AA] font-semibold mt-0.5">{vet?.full_name || vet?.name || "The vet"} has been notified</p>
              </div>
              <div className="absolute left-[13.5px] top-8 w-[1.5px] h-6 bg-black/5" />
            </div>

            {/* Step 3 */}
            <div className="flex gap-3.5 relative z-10">
              <div className="w-7 h-7 rounded-full bg-black/[0.03] border-[1.5px] border-black/5 flex items-center justify-center shrink-0">
                <div className="w-2 h-2 rounded-full border-[1.5px] border-[#A1A1AA]" />
              </div>
              <div className="pt-0.5">
                <h4 className="text-[13.5px] font-bold text-[#A1A1AA]">Consultation Scheduled</h4>
                <p className="text-[11.5px] text-[#A1A1AA] font-semibold mt-0.5">Awaiting vet confirmation</p>
              </div>
            </div>
          </div>
        </div>

        {/* ETA Card */}
        <div className="bg-white rounded-[22px] border border-black/5 shadow-sm p-4 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-[13px] bg-[#FFF0F5] border border-[#E8336D]/10 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 text-[#E8336D]" strokeWidth={2.2} />
          </div>
          <div className="flex-1">
            <span className="text-[10px] font-black text-[#A1A1AA] tracking-widest uppercase">Estimated Response</span>
            <p className="text-[13.5px] font-bold text-[#18181B] mt-0.5">Most vets respond within 5–15 minutes</p>
          </div>
          <div className="bg-[linear-gradient(135deg,#E8336D,#7C3AED)] text-white text-[11px] font-black px-3 py-1.5 rounded-full shrink-0">
            ~10 min
          </div>
        </div>
      </div>

      {/* Floating Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 pb-8 bg-gradient-to-t from-[#F7F7FB] via-[#F7F7FB] to-transparent z-[100] max-w-md mx-auto">
        <button className="w-full bg-[linear-gradient(135deg,#E8336D,#7C3AED)] text-white h-[58px] rounded-[16px] font-black flex items-center justify-center gap-2.5 shadow-[0_6px_22px_rgba(232,51,109,0.34)] active:scale-[0.98] transition-all relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-[3500ms] ease-in-out" />
          <CheckCircle2 className="w-5 h-5" strokeWidth={2.5} />
          Booking Active
        </button>
      </div>

      {/* REJECTION SHEET */}
      <AnimatePresence>
        {showRejectSheet && (
          <div className="fixed inset-0 z-[200] flex items-end justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setShowRejectSheet(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="bg-white w-full max-w-md rounded-t-[32px] p-6 pb-12 relative z-10 border-t border-black/5"
            >
              <div className="w-9 h-1 bg-black/5 rounded-full mx-auto mb-6" />
              <div className="space-y-5">
                <div className="inline-flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[11px] font-black text-red-600 uppercase tracking-widest leading-none">Appointment Declined</span>
                </div>
                <div>
                  <h3 className="text-[20px] font-black text-[#18181B] leading-tight tracking-tight">
                    Unable to Confirm<br/>Appointment
                  </h3>
                  <p className="text-[13.5px] text-[#52525B] font-medium leading-relaxed mt-2">
                    Dr. {vet?.name || "The vet"} is currently unavailable. Here's what you can do right now to get your pet seen quickly.
                  </p>
                </div>

                <div className="bg-[#12B76A]/10 border border-[#12B76A]/20 rounded-2xl p-4 flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-[#12B76A]" strokeWidth={3} />
                  <p className="text-[13px] text-[#0A6640] font-bold">Your full refund of <span className="font-black">₹{payAmount}</span> will be processed within 24 hours</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button className="bg-[linear-gradient(135deg,#E8336D,#7C3AED)] text-white p-4 rounded-2xl text-left flex flex-col gap-3 shadow-lg shadow-[#E8336D]/20 active:scale-95 transition-transform">
                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                      <Search className="w-4.5 h-4.5 text-white" strokeWidth={2.5} />
                    </div>
                    <div>
                      <div className="text-[14px] font-black tracking-tight">Find Another Vet</div>
                      <div className="text-[10px] font-bold opacity-80 uppercase tracking-widest mt-0.5">Available Now</div>
                    </div>
                  </button>
                  <button className="bg-[#FFF0F5] border border-[#E8336D]/15 text-[#E8336D] p-4 rounded-2xl text-left flex flex-col gap-3 active:scale-95 transition-transform">
                    <div className="w-8 h-8 rounded-lg bg-[#E8336D]/10 flex items-center justify-center">
                      <Video className="w-4.5 h-4.5 text-[#E8336D]" strokeWidth={2.5} />
                    </div>
                    <div>
                      <div className="text-[14px] font-black tracking-tight">Instant Video</div>
                      <div className="text-[10px] font-bold text-[#52525B]/70 uppercase tracking-widest mt-0.5">Ready in {"< 2min"}</div>
                    </div>
                  </button>
                </div>
                
                <button className="w-full h-14 bg-black/[0.02] border border-black/5 rounded-xl flex items-center px-4 gap-3">
                  <MessageSquare className="w-4 h-4 text-[#A1A1AA]" />
                  <span className="flex-1 text-[14px] font-bold text-[#52525B]">Need help? Contact Support</span>
                  <ChevronRight className="w-4 h-4 text-[#D4D4D8]" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SUCCESS OVERLAY */}
      <AnimatePresence>
        {showSuccessOverlay && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[500] bg-[linear-gradient(135deg,#E8336D,#7C3AED)] flex flex-col items-center justify-center p-10 text-center"
          >
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 15, stiffness: 300, delay: 0.1 }}
              className="w-24 h-24 rounded-full bg-white/20 border-4 border-white/40 flex items-center justify-center mb-8"
            >
              <CheckCircle2 className="w-12 h-12 text-white" strokeWidth={3} />
            </motion.div>
            <h2 className="text-[28px] font-black text-white tracking-tight mb-2">Appointment Confirmed!</h2>
            <p className="text-white/80 font-medium leading-relaxed">
              Dr. {vet?.name || "The vet"} accepted your request.<br/>Taking you to your visit details…
            </p>
            <div className="w-40 h-1 bg-white/20 rounded-full mt-8 overflow-hidden">
              <motion.div 
                className="h-full bg-white transition-all duration-[3000ms] linear"
                style={{ width: `${progressWidth}%` }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
