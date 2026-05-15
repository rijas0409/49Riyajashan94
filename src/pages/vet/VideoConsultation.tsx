import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { 
  CaretLeft, MagnifyingGlass, Faders, Timer, 
  VideoCamera, User, House, CalendarDots, 
  Wallet, IdentificationCard, Clock, ArrowsClockwise
} from "@phosphor-icons/react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const VideoConsultation = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("Pending");
  const [activeStat, setActiveStat] = useState("Pending");
  const [consultations, setConsultations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const stats = [
    { label: "Pending", value: consultations.filter(c => c.status === 'pending').length.toString().padStart(2, '0') },
    { label: "Upcoming", value: (consultations.filter(c => c.status === 'confirmed').length + consultations.filter(c => c.status === 'accepted').length).toString().padStart(2, '0') },
    { label: "Active", value: "00" },
    { label: "Done", value: consultations.filter(c => c.status === 'completed').length.toString().padStart(2, '0') },
  ];

  const fetchConsultations = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('vet_appointments')
        .select('*')
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
        .select('*')
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
          filter: `vet_id=eq.${user?.id}`
        },
        () => {
          // Silent background update
          backgroundFetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchConsultations, backgroundFetch]);

  const handleAccept = async (id: string, consultation: any) => {
    try {
      const { error } = await supabase
        .from('vet_appointments')
        .update({ status: 'confirmed' })
        .eq('id', id);

      if (error) throw error;
      toast.success("Consultation accepted!");
      navigate("/vet/video-call", { 
        state: { 
          consultation: { 
            ...consultation, 
            petName: consultation.pet_name, 
            ownerName: 'Pet Owner' 
          } 
        } 
      });
    } catch (err) {
      toast.error("Failed to accept consultation");
    }
  };

  const handleDecline = async (id: string) => {
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

  const filteredConsultations = consultations.filter(c => {
    if (activeTab === "Pending") return c.status === 'pending';
    if (activeTab === "Upcoming") return c.status === 'confirmed' || c.status === 'accepted';
    return c.status === activeTab.toLowerCase();
  });

  return (
    <div className="bg-[#f8f8fb] min-h-screen pb-24 font-sans text-[#1e1e2d] selection:bg-purple-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#f8f8fb]/80 backdrop-blur-md px-5 py-6 flex items-center justify-between">
        <button 
          onClick={() => navigate(-1)}
          className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-[0_4px_15px_rgba(0,0,0,0.03)] active:scale-95 transition-all text-[#131a2d]"
        >
          <CaretLeft size={24} weight="bold" />
        </button>
        <h1 className="text-[22px] font-extrabold flex-1 ml-4 text-[#131a2d] tracking-tight">Video Consultations</h1>
        <div className="flex gap-3">
          <button className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-[0_4px_15px_rgba(0,0,0,0.03)] active:scale-95 transition-all text-[#131a2d]">
            <MagnifyingGlass size={22} weight="bold" />
          </button>
          <button className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-[0_4px_15px_rgba(0,0,0,0.03)] active:scale-95 transition-all text-[#131a2d]">
            <Faders size={22} weight="bold" />
          </button>
        </div>
      </header>

      {/* Stats Row */}
      <div className="flex gap-3.5 px-5 pb-8 overflow-x-auto no-scrollbar">
        {stats.map((stat) => (
          <button
            key={stat.label}
            onClick={() => setActiveStat(stat.label)}
            className={`flex-1 min-w-[85px] p-4 rounded-[24px] text-center transition-all ${
              activeStat === stat.label 
                ? "bg-[#f8e9ff] shadow-[0_8px_20px_rgba(161,81,255,0.08)]" 
                : "bg-[#f1f5f9]"
            }`}
          >
            <div className={`text-[11px] font-bold uppercase tracking-wider mb-2 ${
              activeStat === stat.label ? "text-[#a151ff]" : "text-[#7e8299]"
            }`}>
              {stat.label}
            </div>
            <div className="text-[22px] font-extrabold text-[#131a2d]">{stat.value}</div>
          </button>
        ))}
      </div>

      {/* Tab Switcher */}
      <div className="mx-5 mb-6 bg-[#f0f0f5] rounded-full flex p-1">
        {["Pending", "Upcoming", "Active"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-center text-sm font-semibold rounded-full transition-all ${
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
        {filteredConsultations.length === 0 ? (
          <div className="bg-white rounded-[32px] p-10 shadow-[0_10px_30px_rgba(0,0,0,0.04)] flex flex-col items-center justify-center text-center border border-gray-100">
            <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mb-6">
              <VideoCamera size={40} className="text-[#9d34da] opacity-40" />
            </div>
            <h3 className="text-xl font-black text-[#131a2d] mb-2">No {activeTab} Requests</h3>
            <p className="text-[#7e8299] text-sm mb-8 max-w-[200px] leading-relaxed font-medium">
              You don't have any incoming {activeTab.toLowerCase()} consultations right now.
            </p>
            <button 
              onClick={() => fetchConsultations()}
              className="px-10 py-4 bg-[#131a2d] text-white rounded-full text-sm font-bold shadow-lg active:scale-95 transition-all flex items-center gap-2.5"
            >
              <ArrowsClockwise size={20} weight="bold" className={loading ? "animate-spin" : ""} />
              REFRESH NOW
            </button>
          </div>
        ) : filteredConsultations.map((item) => (
          <div key={item.id} className="bg-white rounded-[24px] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.04)] relative overflow-hidden group">
            {/* Expiration Badge */}
            <div className="absolute top-0 right-0 bg-[#e1fbf0] text-[#04824f] text-[10px] font-bold px-3 py-1.5 rounded-bl-[12px] flex items-center gap-1.5">
              <Timer size={14} weight="bold" />
              {item.status === 'pending' ? 'EXPIRES SOON' : item.status.toUpperCase()}
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
                onClick={() => navigate("/vet/video-call", { state: { consultation: { ...item, petName: item.pet_name, ownerName: 'User' } } })}
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
          <button className="flex flex-col items-center gap-1.5 text-[#a428ff] font-extrabold text-[9px] tracking-[0.5px] w-[60px]" onClick={() => navigate("/vet/home")}>
            <House size={24} weight="fill" />
            HOME
          </button>
          <button className="flex flex-col items-center gap-1.5 text-[#b5b5c3] font-extrabold text-[9px] tracking-[0.5px] w-[60px]" onClick={() => navigate("/vet/schedule")}>
            <CalendarDots size={24} />
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

export default VideoConsultation;
