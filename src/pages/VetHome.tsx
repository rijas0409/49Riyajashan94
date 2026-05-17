import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import { 
  MagnifyingGlass, Bell, VideoCamera, DotsThree, 
  Wallet, User, CalendarDots, House, 
  CaretRight, PawPrint, ClipboardText, 
  Clock, ClockCounterClockwise, ChatTeardrop,
  Buildings
} from "@phosphor-icons/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const VetDashboard = () => {
  const navigate = useNavigate();
  const { isLoading: guardLoading, user, profile, error: guardError } = useRoleGuard(["vet"], "/auth-vet");
  const [isLoading, setIsLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  const fetchPendingCount = useCallback(async () => {
    if (!user) return;
    try {
      const { count, error } = await supabase
        .from('vet_appointments')
        .select('*', { count: 'exact', head: true })
        .eq('vet_id', user.id)
        .eq('status', 'pending');
      
      if (!error) setPendingCount(count || 0);
    } catch (err) {
      console.error("Error fetching pending count:", err);
    }
  }, [user]);

  const fetchData = useCallback(async () => {
    try {
      await supabase.from("vet_profiles").select("*").eq("user_id", user?.id).maybeSingle();
      await fetchPendingCount();
      setIsLoading(false);
    } catch (err) {
      console.error("Error fetching vet data:", err);
      setIsLoading(false);
    }
  }, [user?.id, fetchPendingCount]);

  useEffect(() => {
    if (user && profile) {
      if (profile.is_onboarding_complete === false) {
        navigate("/vet-onboarding");
      } else if (profile.is_admin_approved === false) {
        navigate("/vet-pending-approval");
      } else {
        fetchData();

        const channel = supabase
          .channel('vet_pending_count')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'vet_appointments',
              filter: `vet_id=eq.${user.id}`
            },
            () => {
              fetchPendingCount();
            }
          )
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      }
    }
  }, [user, profile, navigate, fetchData, fetchPendingCount]);

  if (guardError) return <div className="min-h-screen flex items-center justify-center p-4 bg-[#f9f9fb]">{guardError}</div>;

  if (guardLoading || !user || !profile || isLoading) {
    return <div className="min-h-screen bg-[#f9f9fb] flex items-center justify-center font-sans">Loading...</div>;
  }

  const doctorName = profile?.name || "Sarah";
  const doctorFirstName = doctorName.split(' ')[0];

  return (
    <div className="min-h-screen font-sans antialiased text-[#1a1a24] bg-[#f9f9fb] selection:bg-purple-100 overflow-x-hidden">
      {/* Main Content Container */}
      <main className="max-w-7xl mx-auto relative pb-[100px] px-[22px] py-[24px] lg:px-10 lg:py-10">
        
        {/* Header */}
        <header className="flex items-center justify-between mb-7 lg:mb-10 max-w-7xl mx-auto">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex-shrink-0 w-12 h-12 rounded-full p-[2.5px] bg-gradient-to-br from-[#d340ff] to-[#8728ff] flex items-center justify-center">
              <div className="w-full h-full p-0.5 bg-white rounded-full flex items-center justify-center">
                <Avatar className="w-full h-full border-none">
                  <AvatarImage src={profile?.avatar_url || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80"} className="object-cover rounded-full" />
                  <AvatarFallback className="bg-purple-100 text-[#a428ff] font-extrabold">{doctorFirstName[0]}</AvatarFallback>
                </Avatar>
              </div>
            </div>
            <div className="flex flex-col justify-center min-w-0">
              <h4 className="text-[9px] font-extrabold text-[#bd6eff] tracking-[0.8px] uppercase mb-[3px]">VET PANEL</h4>
              <h1 className="text-base lg:text-lg font-extrabold truncate">Welcome, Dr. {doctorFirstName}</h1>
            </div>
          </div>
          <div className="flex gap-2.5 flex-shrink-0">
            <button className="w-[42px] h-[42px] rounded-full bg-white flex items-center justify-center border-none shadow-[0_4px_15px_rgba(0,0,0,0.03)] cursor-pointer active:scale-95 transition-all">
              <MagnifyingGlass size={20} weight="bold" />
            </button>
            <button className="w-[42px] h-[42px] rounded-full bg-white flex items-center justify-center border-none shadow-[0_4px_15px_rgba(0,0,0,0.03)] cursor-pointer relative active:scale-95 transition-all">
              <Bell size={20} weight="fill" />
              <span className="absolute top-[10px] right-[12px] w-2 h-2 bg-[#ff4264] rounded-full border-2 border-white"></span>
            </button>
          </div>
        </header>

        {/* Responsive Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10">
          
          {/* Left Column: Awareness & Stats */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            
            {/* Main Banner */}
            <section className="bg-gradient-to-br from-[#d340ff] to-[#8728ff] rounded-[34px] px-6 py-7 lg:py-10 text-white shadow-[0_16px_32px_rgba(164,40,255,0.25)] relative transition-all hover:scale-[1.01]">
              <div className="max-w-lg">
                <h2 className="text-[22px] lg:text-[28px] font-extrabold leading-[1.25] mb-3 tracking-[-0.3px]">Ready for your next<br className="sm:hidden" /> consultation?</h2>
                <p className="text-[13px] lg:text-sm font-medium opacity-95 mb-[22px] leading-[1.4]">You have {pendingCount} pending consultation<br className="sm:hidden" /> requests.</p>
                <div className="flex items-center gap-2.5">
                  <button 
                    onClick={() => navigate("/vet/video-consultation")}
                    className="bg-white text-[#a428ff] py-3.5 px-5 lg:px-8 rounded-[28px] font-bold text-[13px] border-none flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(0,0,0,0.1)] active:scale-[0.98] transition-all"
                  >
                    <svg viewBox="4 4 16 16" xmlns="http://www.w3.org/2000/svg" className="w-[18px] h-[18px] fill-current">
                      <path d="M16 6C16.5523 6 17 6.44772 17 7V9.5L21.5 6.5C21.7761 6.3159 22 6.4741 22 6.809V17.191C22 17.5259 21.7761 17.6841 21.5 17.5L17 14.5V17C17 17.5523 16.5523 18 16 18H4C3.44772 18 3 17.5523 3 17V7C3 6.44772 3.44772 6 4 6H16ZM10 9C9.44772 9 9 9.44772 9 10V11H8C7.44772 11 7 11.4477 7 12C7 12.5523 7.44772 13 8 13H9V14C9 14.5523 9.44772 15 10 15C10.5523 15 11 14.5523 11 14V13H12C12.5523 13 13 12.5523 13 12C13 11.4477 12.5523 11 12 11H11V10C11 9.44772 10.5523 9 10 9Z"/>
                    </svg>
                    View Consultations
                  </button>
                  <button className="bg-white/25 text-white w-11 h-11 flex-shrink-0 rounded-full border-none flex items-center justify-center cursor-pointer active:scale-90 transition-all">
                    <DotsThree size={24} weight="bold" />
                  </button>
                </div>
              </div>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Revenue Card */}
              <section className="bg-white rounded-[32px] p-6 shadow-[0_12px_35px_rgba(0,0,0,0.035)] flex flex-col justify-between h-full">
                <div>
                  <div className="flex justify-between items-start mb-[22px]">
                    <div className="space-y-1.5">
                      <p className="text-[#8f8f9d] text-xs font-semibold">Today's Revenue</p>
                      <h3 className="text-[#1a1a24] text-[26px] font-extrabold tracking-[-0.5px]">₹1,284.50</h3>
                    </div>
                    <div className="w-10 h-10 bg-[#fae8ff] text-[#a428ff] rounded-[12px] flex items-center justify-center text-xl">
                      <Wallet size={20} weight="fill" />
                    </div>
                  </div>
                </div>
                <div className="flex items-end justify-between h-12 gap-[7px]">
                  {[14, 24, 20, 30, 34, 48, 34].map((h, i) => (
                    <div 
                      key={i} 
                      className={`grow rounded-[4px] w-full transition-all duration-700 ${i === 5 ? 'bg-[#a428ff]' : 'bg-[#e6c6ff]'}`}
                      style={{ height: `${h}px` }} 
                    />
                  ))}
                </div>
              </section>

              {/* Stats Row */}
              <div className="grid grid-cols-2 gap-4">
                <article className="bg-white rounded-[26px] p-5 shadow-[0_12px_35px_rgba(0,0,0,0.035)] flex flex-col">
                  <div className="w-[49px] h-[49px] rounded-full bg-[#eef4ff] text-[#4b83ff] flex items-center justify-center mb-4">
                    <PawPrint size={24} weight="fill" />
                  </div>
                  <p className="text-[#8f8f9d] text-[9.5px] font-extrabold tracking-[0.8px] uppercase mb-1.5 truncate">ACTIVE PATIENTS</p>
                  <h3 className="text-[#1a1a24] text-[22px] font-extrabold mb-2">42</h3>
                  <div className="text-[#10b981] font-bold text-xs flex items-center gap-1">
                    <span className="font-extrabold">↗</span> +12%
                  </div>
                </article>
                <article className="bg-white rounded-[26px] p-5 shadow-[0_12px_35px_rgba(0,0,0,0.035)] flex flex-col">
                  <div className="w-[49px] h-[49px] rounded-full bg-[#fff8eb] text-[#f5a623] flex items-center justify-center mb-4">
                    <ClipboardText size={24} weight="fill" />
                  </div>
                  <p className="text-[#8f8f9d] text-[9.5px] font-extrabold tracking-[0.8px] uppercase mb-1.5 truncate">PENDING TASKS</p>
                  <h3 className="text-[#1a1a24] text-[22px] font-extrabold mb-2">8</h3>
                  <div className="text-[#f59e0b] font-bold text-xs flex items-center gap-1 text-[11px] font-bold">
                    <Clock size={14} weight="fill" />
                    Action req.
                  </div>
                </article>
              </div>
            </div>
          </div>

          {/* Right Column: Focus & Schedule */}
          <div className="lg:col-span-5 flex flex-col gap-8">
            
            {/* Focus Mode Section */}
            <section>
              <div className="flex items-center gap-2.5 mb-[18px]">
                <svg viewBox="0 0 24 24" style={{ width: '24px', height: '24px', fill: 'none', stroke: '#a428ff', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round' }}>
                    <circle cx="12" cy="12" r="10" strokeDasharray="4 4" />
                    <circle cx="12" cy="12" r="6" />
                    <circle cx="12" cy="12" r="2" fill="#a428ff" />
                </svg>
                <h3 className="text-[#1a1a24] text-[17px] font-extrabold">Focus Mode</h3>
              </div>

              <div className="bg-white rounded-[34px] p-[22px] shadow-[0_16px_40px_rgba(0,0,0,0.04)] relative">
                <span className="absolute top-3 right-3 bg-[#fbedff] text-[#a428ff] text-[9px] font-extrabold px-2 py-1.5 rounded-lg tracking-[0.3px]">IN 15 MINS</span>
                
                <div className="flex items-center gap-3.5 mb-[22px]">
                  <img 
                    src="https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=150&q=80" 
                    alt="Oliver" 
                    className="w-[58px] h-[58px] rounded-full object-cover flex-shrink-0"
                  />
                  <div className="grow min-w-0">
                    <h4 className="text-[17px] font-extrabold text-[#1a1a24] mb-[3px]">Oliver</h4>
                    <p className="text-xs font-medium text-[#8f8f9d] mb-2 truncate">Domestic Shorthair • 3y</p>
                    <div className="inline-flex items-center gap-1.5 bg-[#fbedff] text-[#a428ff] text-[8.5px] font-extrabold px-2 py-1 rounded-lg tracking-[0.3px] uppercase">
                      <VideoCamera size={12} weight="fill" />
                      VIDEO CONSULTATION
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-[22px]">
                  <div className="bg-[#f7f7fb] p-3.5 rounded-[18px] min-w-0">
                    <span className="block text-[9px] text-[#b5b5c3] font-extrabold tracking-[0.5px] uppercase mb-1.5">REASON</span>
                    <strong className="block text-[13px] text-[#1a1a24] font-bold truncate">Post-op Checkup</strong>
                  </div>
                  <div className="bg-[#f7f7fb] p-3.5 rounded-[18px] min-w-0">
                    <span className="block text-[9px] text-[#b5b5c3] font-extrabold tracking-[0.5px] uppercase mb-1.5">OWNER</span>
                    <strong className="block text-[13px] text-[#1a1a24] font-bold truncate">Mark Thompson</strong>
                  </div>
                </div>

                <button className="w-full bg-[#a428ff] text-white p-4 rounded-[22px] border-none font-bold text-sm flex items-center justify-center gap-2 mb-3 shadow-[0_8px_20px_rgba(164,40,255,0.25)] active:scale-[0.98] transition-all">
                  <VideoCamera size={18} weight="fill" />
                  Join Video Call
                </button>
                
                <div className="flex gap-3">
                  <button className="grow bg-[#f3f4f8] text-[#4a4a5e] p-3.5 rounded-[20px] font-bold text-[18px] border-none flex items-center justify-center gap-1.5 active:scale-95 transition-all">
                    <ClockCounterClockwise size={22} weight="bold" className="text-[#7b7b8f]" /> Records
                  </button>
                  <button className="grow bg-[#f3f4f8] text-[#4a4a5e] p-3.5 rounded-[20px] font-bold text-[18px] border-none flex items-center justify-center gap-1.5 active:scale-95 transition-all">
                    <ChatTeardrop size={22} weight="fill" className="text-[#7b7b8f]" /> Chat
                  </button>
                </div>
              </div>
            </section>

            {/* Upcoming Section */}
            <section>
              <div className="flex justify-between items-center mb-[18px]">
                <h3 className="text-[17px] font-extrabold text-[#1a1a24]">Upcoming</h3>
                <button 
                  onClick={() => navigate("/vet/appointments")}
                  className="text-[#a428ff] text-xs font-extrabold no-underline uppercase"
                >
                  View All
                </button>
              </div>

              <div className="flex flex-col gap-2.5">
                {/* Highlighted Item */}
                <div className="bg-white rounded-[22px] p-3.5 flex items-center shadow-[0_12px_35px_rgba(0,0,0,0.035)] border-none transition-all active:scale-[0.99] cursor-pointer" onClick={() => navigate("/vet/appointments")}>
                  <div className="min-w-[55px] text-center pr-3.5 border-r-[1.5px] border-[#f0f0f5] flex-shrink-0">
                    <strong className="block text-[13px] text-[#8f8f9d] font-bold mb-0.5">11:30</strong>
                    <span className="text-[10.5px] text-[#b5b5c3] font-semibold">AM</span>
                  </div>
                  <div className="flex items-center gap-3 grow pl-3.5 min-w-0">
                    <img src="https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=100&q=80" alt="Bella" className="w-[38px] h-[38px] rounded-full object-cover flex-shrink-0" />
                    <div className="min-w-0">
                      <h5 className="text-[14.5px] font-extrabold text-[#1a1a24] mb-[3px] truncate">Bella</h5>
                      <p className="text-[11.5px] text-[#8f8f9d] font-medium flex items-center gap-1 truncate uppercase">
                        Vaccination • <Buildings size={14} weight="fill" className="inline-block" /> Clinic Visit
                      </p>
                    </div>
                  </div>
                  <CaretRight size={16} weight="bold" className="text-[#d1d1e0] flex-shrink-0" />
                </div>

                {/* Faded Items */}
                {[
                  { 
                    time: "01:00", 
                    ampm: "PM", 
                    name: "Cooper", 
                    type: "Ear Infection • ", 
                    suffix: "Video Call",
                    icon: <VideoCamera size={14} weight="fill" className="inline-block" />,
                    img: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=100&q=80" 
                  },
                  { 
                    time: "02:30", 
                    ampm: "PM", 
                    name: "Bruno", 
                    type: "Skin Allergy • ", 
                    suffix: "Home Visit",
                    icon: <House size={14} weight="fill" className="inline-block" />,
                    img: "https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=100&q=80" 
                  }
                ].map((apt, idx) => (
                  <div key={idx} className="bg-transparent rounded-[22px] p-3.5 flex items-center shadow-none opacity-60 grayscale-[30%] cursor-pointer" onClick={() => navigate("/vet/appointments")}>
                    <div className="min-w-[55px] text-center pr-3.5 border-r-[1.5px] border-[#f0f0f5] flex-shrink-0">
                      <strong className="block text-[13px] text-[#c4c4d4] font-bold mb-0.5">{apt.time}</strong>
                      <span className="text-[10.5px] text-[#c4c4d4] font-semibold uppercase">{apt.ampm}</span>
                    </div>
                    <div className="flex items-center gap-3 grow pl-3.5 min-w-0">
                      <img src={apt.img} alt={apt.name} className="w-[38px] h-[38px] rounded-full object-cover flex-shrink-0 opacity-50" />
                      <div className="min-w-0">
                        <h5 className="text-[14.5px] font-extrabold text-[#c4c4d4] mb-[3px] truncate">{apt.name}</h5>
                        <p className="text-[11.5px] text-[#c4c4d4] font-medium flex items-center gap-1 truncate uppercase">
                          {apt.type} {apt.icon} {apt.suffix}
                        </p>
                      </div>
                    </div>
                    <CaretRight size={16} weight="bold" className="text-[#c4c4d4] flex-shrink-0" />
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-sm flex justify-center z-50 border-t border-gray-50/50 pb-safe">
        <div className="w-full max-w-7xl flex justify-between px-6 pt-4 pb-7">
          <button className="flex flex-col items-center gap-1.5 text-[#a428ff] font-extrabold text-[9px] tracking-[0.5px] w-[60px]" onClick={() => navigate("/vet/home")}>
            <House size={24} weight="fill" />
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

export default VetDashboard;
