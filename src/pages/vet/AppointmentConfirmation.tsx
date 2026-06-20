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
          .select("*")
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

          const { data: rawProfile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", data.vet_id)
            .maybeSingle();
            
          const localPayStr = localStorage.getItem(`payment_details_${appointmentId}`);
          const localPay = localPayStr ? JSON.parse(localPayStr) : null;
          
          let dbPay = null;
          if (data.consultation_notes) {
            try {
              dbPay = JSON.parse(data.consultation_notes);
            } catch (e) {
              console.error("Error parsing consultation notes:", e);
            }
          }
            
          setAppointment({ 
            ...data, 
            vet_profile: vp, 
            vet: rawProfile || data.vet,
            payment_details: localPay || dbPay 
          });
          
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
            vet_profile: location.state.visit.vet_profile || { specialization: location.state.visit.vet?.specialization },
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
    }, 20000);

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
      navigate(`/buyer/vet/visit-details/${appointmentId}`, { 
        replace: true,
        state: { fromBookingFlow: true }
      });
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
  const vetProfile = appointment.vet_profile || appointment.vet?.vet_profile || location.state?.visit?.vet_profile;

  const getPublicUrl = (photo: any) => {
    if (!photo) return "";
    const photoStr = String(photo);
    if (photoStr.startsWith("http") || photoStr.startsWith("data:")) return photoStr;
    return supabase.storage.from("vet-documents").getPublicUrl(photoStr).data.publicUrl;
  };

  const getVetDisplayName = () => {
    const rawName = vet?.full_name || vet?.name || "";
    if (!rawName) return "Veterinarian";
    if (rawName.startsWith("Dr.")) return rawName;
    return `Dr. ${rawName}`;
  };

  const vetImgUrl = getPublicUrl(vet?.profile_photo || vet?.image || vet?.avatar_url);

  // Dynamic values without fallbacks
  const displaySpecialization = vetProfile?.specialization || 
    (Array.isArray(vetProfile?.specializations) && vetProfile.specializations.length > 0 ? vetProfile.specializations.join(", ") : null) || 
    vet?.specialization || 
    null;

  const displayQualification = vetProfile?.qualification || vet?.qualification || null;
  const displayRating = vetProfile?.average_rating || vet?.average_rating || vetProfile?.rating || vet?.rating || null;
  const displayExperience = vetProfile?.years_of_experience || vet?.years_of_experience || vetProfile?.experience || vet?.experience || null;

  const payId = appointment.payment_details?.payment_id || appointment.payment_id || "";
  const payMethod = appointment.payment_details?.payment_method || appointment.payment_method || "Payment Completed";
  const payAmount = appointment.amount || appointment.payment_details?.amount || 0;

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
                    {vetImgUrl ? (
                      <img src={vetImgUrl} alt={getVetDisplayName()} className="w-full h-full object-cover rounded-full" />
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
                      {vetImgUrl ? (
                        <img src={vetImgUrl} alt={getVetDisplayName()} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-pink-500/10 flex items-center justify-center text-[15px] font-black text-[#E8336D]">
                          {(getVetDisplayName().replace("Dr. ", "")[0] || "V").toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <h4 className="text-[14.5px] font-black text-slate-900 truncate tracking-tight">
                        {getVetDisplayName()}
                      </h4>
                      {displaySpecialization && (
                        <p className="text-[11.5px] text-slate-500 font-semibold truncate">
                          {displaySpecialization}{displayQualification ? ` · ${displayQualification}` : ""}
                        </p>
                      )}
                      <div className="flex items-center gap-1 mt-0.5">
                        {displayRating && (
                          <div className="flex items-center">
                            <Star className="w-3 h-3 fill-[#F59E0B] text-[#F59E0B]" />
                            <span className="text-[10.5px] font-bold text-slate-600 ml-1">
                              {displayRating}
                            </span>
                          </div>
                        )}
                        {displayExperience && (
                          <span className="text-[10.5px] font-bold text-slate-400 ml-1">
                            {displayRating ? "· " : ""}{displayExperience}+ yrs exp
                          </span>
                        )}
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
                Waiting for {getVetDisplayName()}'s Confirmation
              </h2>
              <p className="text-[12.5px] text-slate-500 leading-relaxed font-semibold">
                We've instantly notified the veterinarian of your booking request. You'll be notified immediately upon confirmation.
              </p>
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
                <p className="text-[11.5px] text-[#A1A1AA] font-semibold mt-0.5">{getVetDisplayName()} has been notified</p>
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

      {/* REJECTION SCREEN */}
      <AnimatePresence>
        {showRejectSheet && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-[#F7F7FB] flex flex-col items-center justify-center p-6 text-center"
          >
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
                  {getVetDisplayName()} is currently unavailable. No worries! Here's what you can do right now to get your pet seen quickly.
                </p>
              </div>

              {/* Refund Info */}
              <div className="bg-[#12B76A]/10 border border-[#12B76A]/20 rounded-2xl p-4 flex items-center gap-3 w-full text-left">
                <CheckCircle2 className="w-5 h-5 text-[#12B76A] shrink-0" strokeWidth={3} />
                <p className="text-[13px] text-[#0A6640] font-bold">Your full refund of <span className="font-black">₹{payAmount}</span> will be processed within 24 hours</p>
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
          </motion.div>
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
              {getVetDisplayName()} accepted your request.<br/>Taking you to your visit details…
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
