import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { 
  CaretLeft, MagnifyingGlass, Faders, Timer, 
  VideoCamera, User, House, CalendarDots, 
  Wallet, IdentificationCard, Clock, ArrowsClockwise,
  Pulse as Activity, X, Sparkle as Sparkles, Check
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import SplashScreen from "@/components/SplashScreen";
import { cn } from "@/lib/utils";

interface Consultation {
  id: string;
  vet_id: string;
  user_id: string;
  pet_name: string;
  pet_type: string;
  appointment_type: string;
  status: string;
  amount: number;
  selected_duration: string;
  created_at: string;
  appointment_date?: string;
  appointment_time?: string;
  symptoms_data?: {
    photoUrl?: string;
    urgency?: string;
    selectedSymptoms?: string[];
    additionalNotes?: string[];
  };
  ai_summary?: string;
}

const VirtualConsults = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isLoading: guardLoading, showSpinner } = useRoleGuard(["vet"], "/auth/vet", true);
  const [activeTab, setActiveTab] = useState("Active");
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30000); // Update every 30s
    return () => clearInterval(timer);
  }, []);

  const isTimeReached = (dateStr: string, timeStr: string) => {
    try {
      const [hours, minutes] = timeStr.split(':').map(Number);
      const appDate = new Date(dateStr);
      appDate.setHours(hours, minutes, 0, 0);
      return currentTime >= appDate;
    } catch (e) {
      return true;
    }
  };

  const getFilteredConsultations = (tab: string) => {
    const filtered = consultations.filter(c => {
      if (tab === "Active") {
        if (c.status === 'pending' || c.status === 'analyzing') return true;
        return c.status === 'confirmed' && isTimeReached(c.appointment_date || c.created_at, c.appointment_time || "00:00");
      }
      if (tab === "Upcoming") {
        if (c.status === 'confirmed') {
          return !isTimeReached(c.appointment_date || c.created_at, c.appointment_time || "00:00");
        }
        return false;
      }
      if (tab === "Cancelled") return c.status === 'rejected' || c.status === 'cancelled';
      if (tab === "Done") return c.status === 'completed';
      return false;
    });

    // Add demo card for Active/Upcoming if user is jas or gucci or just for testing
    if (filtered.length === 0 && (tab === "Active" || tab === "Upcoming")) {
      const demoCard: Consultation = {
        id: "demo-id-" + tab,
        user_id: "demo-user",
        vet_id: user?.id || "demo-vet",
        pet_name: "Bella (Demo)",
        pet_type: "Golden Retriever",
        appointment_type: "instant",
        status: tab === "Active" ? "confirmed" : "pending",
        amount: 249,
        selected_duration: "15",
        created_at: new Date().toISOString(),
        appointment_date: new Date().toISOString().split('T')[0],
        appointment_time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
        symptoms_data: {
          urgency: "urgent",
          selectedSymptoms: ["Lethargy", "Loss of Appetite", "Vomiting"],
          photoUrl: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400&h=600&fit=crop"
        },
        ai_summary: "Patient shows signs of acute gastrointestinal distress. Recommend checking heart rate and respiratory pattern during call."
      };
      return [demoCard];
    }

    return filtered;
  };

  const stats = [
    { label: "Active", value: getFilteredConsultations("Active").length.toString().padStart(2, '0') },
    { label: "Upcoming", value: getFilteredConsultations("Upcoming").length.toString().padStart(2, '0') },
    { label: "Cancelled", value: getFilteredConsultations("Cancelled").length.toString().padStart(2, '0') },
    { label: "Done", value: getFilteredConsultations("Done").length.toString().padStart(2, '0') },
  ];

  const fetchConsultations = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('vet_appointments')
        .select(`
          *,
          profiles:user_id (
            full_name,
            profile_photo,
            name
          )
        `)
        .eq('vet_id', user.id)
        .eq('appointment_type', 'instant')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setConsultations(data || []);
    } catch (err) {
      console.error("Fetch error:", err);
      toast.error("Failed to load consultations");
    } finally {
      setLoading(false);
    }
  }, [user]);

  const backgroundFetch = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('vet_appointments')
        .select(`
          *,
          profiles:user_id (
            full_name,
            profile_photo,
            name
          )
        `)
        .eq('vet_id', user.id)
        .eq('appointment_type', 'instant')
        .order('created_at', { ascending: false });

      if (!error) setConsultations(data || []);
    } catch (err) {
      console.error("Background fetch error:", err);
    }
  }, [user]);

  useEffect(() => {
    fetchConsultations();

    const channel = supabase
      .channel('vet_appointments_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vet_appointments',
        },
        (payload) => {
          // Handle inserts/updates/deletes for this vet locally
          const record = payload.new || payload.old;
          if (record && record.vet_id === user?.id) {
            backgroundFetch();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchConsultations, backgroundFetch]);

  const [showSummaryModal, setShowSummaryModal] = useState<Consultation | null>(null);

  const handleAccept = async (id: string, consultation: Consultation) => {
    if (id.startsWith('demo-id-')) {
      toast.success("Demo consultation accepted!");
      navigate("/vet/video-call", { 
        state: { 
          appointmentId: id,
          consultation: { 
            ...consultation, 
            petName: consultation.pet_name, 
            ownerName: consultation.profiles?.full_name || consultation.profiles?.name || 'Demo Owner' 
          } 
        } 
      });
      return;
    }
    try {
      const { error } = await supabase
        .from('vet_appointments')
        .update({ status: 'confirmed' })
        .eq('id', id);

      if (error) throw error;
      toast.success("Consultation accepted!");
      navigate("/vet/video-call", { 
        state: { 
          appointmentId: id,
          consultation: { 
            ...consultation, 
            petName: consultation.pet_name, 
            ownerName: consultation.profiles?.full_name || consultation.profiles?.name || 'Patient Owner' 
          } 
        } 
      });
    } catch (err) {
      toast.error("Failed to accept consultation");
    }
  };

  const handleDecline = async (id: string) => {
    if (id.startsWith('demo-id-')) {
      toast.info("Demo consultation declined");
      return;
    }
    try {
      const { error } = await supabase
        .from('vet_appointments')
        .update({ status: 'rejected' })
        .eq('id', id);

      if (error) throw error;
      toast.info("Consultation declined");
    } catch (err) {
      toast.error("Failed to decline consultation");
    }
  };

  const handleViewSummary = async (consultation: Consultation) => {
    setShowSummaryModal(consultation);
    if (!consultation.id.startsWith('demo-')) {
      try {
        await supabase
          .from('vet_appointments')
          .update({ status: 'analyzing' })
          .eq('id', consultation.id);
      } catch (err) {
        console.error("Error updating status to analyzing:", err);
      }
    }
  };

  const handleCloseSummary = async () => {
    if (showSummaryModal && !showSummaryModal.id.startsWith('demo-') && showSummaryModal.status === 'analyzing') {
       // Optionally revert to pending if closed without accepting? 
    }
    setShowSummaryModal(null);
  };

  if (showSpinner) {
    return <SplashScreen message="Loading consultations..." />;
  }

  const hasCache = localStorage.getItem("sruvo_user_role") === "vet";
  if (guardLoading && !hasCache) {
    return null;
  }

  return (
    <div className="bg-[#f8f8fb] min-h-screen pb-24 font-sans text-[#1e1e2d] selection:bg-purple-100 relative">
      {/* Summary Modal Overlay */}
      <AnimatePresence>
        {showSummaryModal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseSummary}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" 
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[32px] z-[101] p-6 max-h-[85vh] overflow-y-auto shadow-2xl border-t border-gray-100"
            >
              <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6" onClick={handleCloseSummary} />
              
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-[#9d34da]">
                    <Activity size={24} weight="bold" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-[#131a2d]">Consultation Summary</h2>
                    <p className="text-xs text-[#7e8299] font-bold uppercase tracking-wider">Reviewing {showSummaryModal.pet_name}'s Symptoms</p>
                  </div>
                </div>
                <button 
                  onClick={handleCloseSummary}
                  className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-[#7e8299] hover:bg-gray-100 transition-all"
                >
                  <X size={20} weight="bold" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Pet Identity */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <span className="text-[10px] font-bold text-[#b5b5c3] uppercase tracking-widest block mb-1">Pet Patient</span>
                    <p className="text-sm font-black text-[#131a2d]">{showSummaryModal.pet_name}</p>
                    <p className="text-[11px] font-bold text-[#9d34da]">{showSummaryModal.pet_type}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <span className="text-[10px] font-bold text-[#b5b5c3] uppercase tracking-widest block mb-1">Urgency Level</span>
                    <div className="flex items-center gap-2">
                       <div className={cn("w-2 h-2 rounded-full animate-pulse", showSummaryModal.symptoms_data?.urgency === 'urgent' ? "bg-red-500" : "bg-amber-500")} />
                       <p className={cn("text-xs font-black uppercase tracking-wide", showSummaryModal.symptoms_data?.urgency === 'urgent' ? "text-red-500" : "text-amber-500")}>
                         {showSummaryModal.symptoms_data?.urgency || 'Concerned'}
                       </p>
                    </div>
                  </div>
                </div>

                {/* Symptoms */}
                <div className="bg-white border-2 border-gray-50 p-5 rounded-[24px]">
                  <h3 className="text-xs font-black text-[#131a2d] uppercase tracking-widest mb-4 flex items-center gap-2">
                    <div className="w-1.5 h-4 bg-[#9d34da] rounded-full" />
                    Key Symptoms Reported
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {(showSummaryModal.symptoms_data?.selectedSymptoms || ["General weakness", "Not eating properly"]).map((s: string) => (
                      <span key={s} className="px-4 py-2 bg-purple-50 text-[#9d34da] rounded-full text-[12px] font-black border border-purple-100/50">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                {/* AI Summary Card */}
                <div className="bg-gradient-to-br from-[#131a2d] to-[#252c41] p-6 rounded-[28px] text-white shadow-xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Sparkles size={60} weight="fill" />
                  </div>
                  <div className="flex items-center gap-2.5 mb-4 relative z-10">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/10">
                       <span className="text-[10px] font-black">AI</span>
                    </div>
                    <h3 className="text-xs font-black uppercase tracking-[2px] opacity-80">AI Assessment Insight</h3>
                  </div>
                  <p className="text-[13px] leading-relaxed font-medium text-white/90 relative z-10 italic">
                    "{showSummaryModal.ai_summary || "Based on the reported symptoms of lethargy and vomiting, the patient likely has a mild gastrointestinal upset. Immediate assessment of hydration and abdomen sensitivity is recommended during the call."}"
                  </p>
                </div>

                {/* Action Buttons in Modal */}
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <button 
                    onClick={() => { handleDecline(showSummaryModal.id); handleCloseSummary(); }}
                    className="py-4 bg-gray-100 text-[#7e8299] rounded-[20px] text-sm font-bold active:scale-95 transition-all"
                  >
                    Reject Call
                  </button>
                  <button 
                    onClick={() => { handleAccept(showSummaryModal.id, showSummaryModal); handleCloseSummary(); }}
                    className="py-4 bg-[#9d34da] text-white rounded-[20px] text-sm font-bold shadow-lg shadow-purple-200 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    Accept & Connect
                    <Check size={18} weight="bold" />
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#f8f8fb]/80 backdrop-blur-md px-5 py-6 flex items-center justify-between">
        <button 
          onClick={() => navigate(-1)}
          className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#1f1f2e] shadow-sm active:scale-95 transition-all"
        >
          <CaretLeft size={20} weight="bold" />
        </button>
        <h1 className="text-[22px] font-[800] text-[#1f1f2e] flex-grow ml-4">Virtual Consults</h1>
        <div className="flex gap-3">
          <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#1f1f2e] shadow-sm active:scale-95 transition-all">
            <MagnifyingGlass size={20} weight="bold" />
          </button>
          <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#1f1f2e] shadow-sm active:scale-95 transition-all">
            <Faders size={20} weight="bold" />
          </button>
        </div>
      </header>

      {/* Stats Row */}
      <div className="flex gap-3.5 px-5 pb-8 overflow-x-auto no-scrollbar">
        {stats.map((stat) => (
          <div
            key={stat.label}
            onClick={() => setActiveTab(stat.label)}
            className={`flex-1 min-w-[85px] p-4 rounded-[24px] text-center cursor-pointer transition-all ${
              activeTab === stat.label 
                ? "bg-[#f8e9ff] shadow-[0_8px_20px_rgba(161,81,255,0.08)] ring-2 ring-[#a151ff]/20" 
                : "bg-[#f1f5f9]"
            }`}
          >
            <div className={`text-[11px] font-bold uppercase tracking-wider mb-2 ${
              activeTab === stat.label ? "text-[#a151ff]" : "text-[#7e8299]"
            }`}>
              {stat.label}
            </div>
            <div className="text-[22px] font-extrabold text-[#131a2d]">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Tab Switcher */}
      <div className="mx-5 mb-6 bg-[#f0f0f5] rounded-full flex p-1">
        {["Active", "Upcoming", "Cancelled", "Done"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-center text-[12px] font-bold rounded-full transition-all ${
              activeTab === tab 
                ? "bg-[#9d34da] text-white shadow-[0_4px_12px_rgba(157,52,218,0.2)]" 
                : "text-[#7e8299]"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Consultations List */}
      <main className="px-5 space-y-5 pb-10">
        {getFilteredConsultations(activeTab).length === 0 ? (
          <div className="bg-white rounded-[32px] p-10 shadow-[0_10px_30px_rgba(0,0,0,0.04)] flex flex-col items-center justify-center text-center border border-gray-100">
            <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mb-6">
              <VideoCamera size={40} className="text-[#9d34da] opacity-40" />
            </div>
            <h3 className="text-xl font-black text-[#131a2d] mb-2">No {activeTab} Requests</h3>
            <p className="text-[#7e8299] text-sm mb-8 max-w-[200px] leading-relaxed font-medium">
              You don't have any {activeTab.toLowerCase()} consultations right now.
            </p>
            <button 
              onClick={() => fetchConsultations()}
              className="px-10 py-4 bg-[#131a2d] text-white rounded-full text-sm font-bold shadow-lg active:scale-95 transition-all flex items-center gap-2.5"
            >
              <ArrowsClockwise size={20} weight="bold" className={loading ? "animate-spin" : ""} />
              REFRESH NOW
            </button>
          </div>
        ) : getFilteredConsultations(activeTab).map((item) => (
          <div key={item.id} className="bg-white rounded-[24px] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.04)] relative overflow-hidden group">
            {/* Status Badge */}
            <div className={`absolute top-0 right-0 ${
              item.status === 'pending' ? 'bg-[#fff8eb] text-[#f5a623]' : 
              item.status === 'confirmed' ? 'bg-[#e1fbf0] text-[#04824f]' :
              item.status === 'rejected' || item.status === 'cancelled' ? 'bg-[#fff1f1] text-[#ff4d4f]' :
              'bg-[#f0f0f5] text-[#7e8299]'
            } text-[10px] font-bold px-3 py-1.5 rounded-bl-[12px] flex items-center gap-1.5`}>
              {item.status === 'pending' ? 'PENDING' : 
               item.status === 'confirmed' ? (isTimeReached(item.appointment_date || item.created_at, item.appointment_time || "00:00") ? 'ACTIVE' : 'SCHEDULED') :
               item.status === 'rejected' || item.status === 'cancelled' ? 'CANCELLED' : 
               item.status.toUpperCase()}
            </div>

            <div className="flex gap-4 mb-5 mt-2">
              <div className="relative w-[70px] h-[70px] shrink-0">
                <div className="w-full h-full bg-[#f8f9fa] rounded-2xl flex items-center justify-center">
                   <User size={32} className="text-[#bdc3d1]" />
                </div>
                <div className="absolute -bottom-1 -right-1 bg-[#9d34da] text-white w-6 h-6 rounded-full flex items-center justify-center text-[10px] border-2 border-white">
                  <VideoCamera size={12} weight="fill" />
                </div>
              </div>
              <div className="flex flex-col justify-center">
                <h2 className="text-lg font-bold mb-0.5">{item.pet_name}</h2>
                <div className="text-[11px] font-semibold text-[#b5b5c3] uppercase tracking-wider mb-2">
                  {item.pet_type} • {item.selected_duration || '15'} MINS
                </div>
                <div className="flex items-center gap-1.5 text-sm text-[#7e8299] font-medium">
                  <Clock size={16} className="text-[#b5b5c3]" />
                  {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center mb-5">
              <button 
                onClick={() => navigate("/vet/consultation-detail", { state: { consultationId: item.id } })}
                className="text-[11px] font-bold text-[#9ba1b9] tracking-wider uppercase hover:text-[#9d34da] transition-colors"
              >
                VIEW SUMMARY
              </button>
              <div className="text-xl font-extrabold text-[#9d34da]">₹{item.amount || '0'}</div>
            </div>

            {item.status === 'pending' && (
              <div className="flex gap-3">
                <button 
                  onClick={() => handleDecline(item.id)}
                  className="flex-1 py-3.5 bg-[#f8f9fa] text-[#7e8299] rounded-full text-sm font-bold active:scale-95 transition-all"
                >
                  Decline
                </button>
                <button 
                  onClick={() => handleAccept(item.id, item)}
                  className="flex-1 py-3.5 bg-[#9d34da] text-white rounded-full text-sm font-bold shadow-[0_8px_24px_rgba(157,52,218,0.15)] active:scale-95 transition-all"
                >
                  Accept
                </button>
              </div>
            )}

            {item.status === 'confirmed' && (
              <button 
                onClick={() => navigate("/vet/video-call", { 
                  state: { 
                    appointmentId: item.id,
                    consultation: { 
                      ...item, 
                      petName: item.pet_name, 
                      ownerName: item.profiles?.full_name || item.profiles?.name || 'Patient Owner' 
                    } 
                  } 
                })}
                className="w-full py-3.5 bg-[#9d34da] text-white rounded-full text-sm font-bold shadow-[0_8px_24px_rgba(157,52,218,0.15)] active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <VideoCamera size={18} weight="fill" />
                Join Call
              </button>
            )}
          </div>
        ))}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-sm flex justify-center z-50 border-t border-gray-50/50 pb-safe">
        <div className="w-full max-w-7xl flex justify-between px-6 pt-4 pb-7">
          <button className="flex flex-col items-center gap-1.5 text-[#b5b5c3] font-extrabold text-[9px] tracking-[0.5px] w-[60px]" onClick={() => navigate("/vet/home")}>
            <House size={24} weight="bold" />
            HOME
          </button>
          <button className="flex flex-col items-center gap-1.5 text-[#b5b5c3] font-extrabold text-[9px] tracking-[0.5px] w-[60px]" onClick={() => navigate("/vet/schedule")}>
            <CalendarDots size={24} weight="bold" />
            SCHEDULE
          </button>
          <button className="flex flex-col items-center gap-1.5 text-[#b5b5c3] font-extrabold text-[9px] tracking-[0.5px] w-[60px]" onClick={() => navigate("/vet/earnings")}>
            <Wallet size={24} weight="bold" />
            EARNINGS
          </button>
          <button className="flex flex-col items-center gap-1.5 text-[#b5b5c3] font-extrabold text-[9px] tracking-[0.5px] w-[60px]" onClick={() => navigate("/vet/profile")}>
            <User size={24} weight="bold" />
            PROFILE
          </button>
        </div>
      </nav>
    </div>
  );
};

export default VirtualConsults;
