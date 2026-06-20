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
import SplashScreen from "@/components/SplashScreen";

interface DashboardAppointment {
  id: string;
  time: string;
  name: string;
  breed: string;
  type: string;
  image: string;
  ownerName: string;
  ownerPhone: string;
  date: string;
  status: string;
}

interface DbAppointmentRaw {
  id: string;
  appointment_date: string;
  appointment_time?: string | null;
  appointment_type?: string | null;
  amount?: number | null;
  status?: string | null;
  pet_name?: string | null;
  pet_type?: string | null;
  pet_breed?: string | null;
  user?: {
    name?: string | null;
    full_name?: string | null;
    profile_photo?: string | null;
    phone?: string | null;
  } | null;
}

const formatDateString = (date: Date) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const getMinutesDifference = (timeStr: string) => {
  try {
    const [time, period] = timeStr.split(' ');
    let [rawHours, minutes] = time.split(':').map(Number);
    let hours = rawHours;
    if (period === 'PM' && hours < 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    
    const appTime = new Date();
    appTime.setHours(hours, minutes, 0, 0);
    
    const diffMs = appTime.getTime() - Date.now();
    return Math.round(diffMs / 60000); // positive if in future, negative if in past
  } catch (e) {
    return 1000;
  }
};

const getAppointmentDateObject = (dateStr: string, timeStr: string) => {
  try {
    const [time, period] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (period === 'PM' && hours < 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    
    const d = new Date(dateStr);
    d.setHours(hours, minutes, 0, 0);
    return d;
  } catch (e) {
    return new Date(dateStr + "T12:00:00");
  }
};

const VetDashboard = () => {
  const navigate = useNavigate();
  const { isLoading: guardLoading, showSpinner, user, profile, error: guardError } = useRoleGuard(["vet"], "/auth-vet", true);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [activeAppointment, setActiveAppointment] = useState<DashboardAppointment | null>(null);
  const [upcomingAppointments, setUpcomingAppointments] = useState<DashboardAppointment[]>([]);
  const [todayRevenue, setTodayRevenue] = useState(0);
  const [activePatients, setActivePatients] = useState(0);
  const [revenueBars, setRevenueBars] = useState<number[]>([14, 24, 20, 30, 34, 48, 34]);

  const [realProfilePhoto, setRealProfilePhoto] = useState<string | null>(null);

  const fetchPendingCount = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('vet_appointments')
        .select('*')
        .eq('vet_id', user.id)
        .eq('status', 'pending');
      
      if (!error && data) {
        setPendingCount(data.length);
      }
    } catch (err) {
      console.error("Error fetching pending count:", err);
    }
  }, [user]);

  const fetchUpcoming = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('vet_appointments')
        .select('*')
        .eq('vet_id', user.id)
        .order('appointment_date', { ascending: true })
        .limit(100);

      if (!error && data) {
        // Fetch users manually to avoid foreign key relation errors with PostgREST
        const userIds = [...new Set(data.map(apt => apt.user_id))];
        let profilesMap: Record<string, any> = {};
        
        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, name, full_name, profile_photo, phone")
            .in("id", userIds);
            
          if (profiles) {
            profiles.forEach(p => {
              profilesMap[p.id] = p;
            });
          }
        }

        const mapped = data.map((apt: any) => {
          const userProfile = profilesMap[apt.user_id] || {};
          let userPhoto = userProfile.profile_photo || "";
          if (userPhoto && !userPhoto.startsWith("http")) {
            userPhoto = supabase.storage.from("seller-documents").getPublicUrl(userPhoto).data.publicUrl;
          }
          return {
            id: apt.id,
            time: apt.appointment_time || "11:30 AM",
            name: apt.pet_name || "Luna",
            breed: apt.pet_breed || (apt.pet_type ? `${apt.pet_type}` : "Dog"),
            type: apt.appointment_type || "clinic",
            image: userPhoto || "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=150&q=80",
            ownerName: userProfile.full_name || userProfile.name || "Sarah Jenkins",
            ownerPhone: userProfile.phone || "+91 98765 43210",
            date: apt.appointment_date,
            status: apt.status,
            amount: apt.amount
          };
        });

        // Sort mapped list chronologically
        mapped.sort((a, b) => {
          const dateA = getAppointmentDateObject(a.date, a.time);
          const dateB = getAppointmentDateObject(b.date, b.time);
          return dateA.getTime() - dateB.getTime();
        });

        const now = new Date();
        const todayStr = formatDateString(now);
        let active: DashboardAppointment | null = null;
        const upcomingList: DashboardAppointment[] = [];

        // Compute metrics dynamically from real database data
        let todayRevenueSum = 0;
        const uniquePatients = new Set<string>();

        mapped.forEach((apt) => {
          if (apt.status !== "cancelled") {
            uniquePatients.add(apt.name || apt.id);
          }
          if (apt.date === todayStr && apt.status !== "cancelled") {
            todayRevenueSum += (Number(apt.amount) || 650);
          }

          // Continue filtering only active/upcoming statuses for layout arrays
          if (!['pending', 'confirmed', 'in_progress'].includes(apt.status)) {
            return;
          }

          const isTodaySession = apt.date === todayStr;
          
          // Check if this appointment should be the active one in Focus Mode
          if (apt.status === "in_progress" && isTodaySession) {
            if (!active) {
              active = apt;
              return; // Exclude from upcoming, goes directly to Focus Mode!
            }
          } else if (apt.status === "confirmed" && isTodaySession) {
            const diff = getMinutesDifference(apt.time);
            if (diff <= 15 && diff >= -45) {
              if (!active) {
                active = apt;
                return; // Exclude from upcoming, goes directly to Focus Mode!
              }
            }
          }

          // If not Focus Mode/Active, filter out past appointments (expired)
          const aptDate = getAppointmentDateObject(apt.date, apt.time);
          if (aptDate < now) {
            return; // skip expired/passed appointment
          }

          upcomingList.push(apt);
        });

        // Compute 7 days of dynamic daily revenue for the bar chart
        const dailyRevenue = Array(7).fill(0);
        for (let i = 0; i < 7; i++) {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i)); // 6 days ago to today
          const dStr = formatDateString(d);
          const dayAppts = mapped.filter(apt => apt.date === dStr && apt.status !== "cancelled");
          dailyRevenue[i] = dayAppts.reduce((sum, apt) => sum + (Number(apt.amount) || 650), 0);
        }
        const maxDaily = Math.max(...dailyRevenue, 1);
        const barHeights = dailyRevenue.map(rev => Math.max(8, Math.round((rev / maxDaily) * 48)));

        // Set state values
        setActiveAppointment(active);
        setUpcomingAppointments(upcomingList.slice(0, 5));
        setTodayRevenue(todayRevenueSum);
        setActivePatients(uniquePatients.size);
        setRevenueBars(barHeights);
      }
    } catch (err) {
      console.error("Error fetching upcoming appointments:", err);
    }
  }, [user]);

  const fetchData = useCallback(async () => {
    try {
      const { data: vetProfile } = await supabase.from("vet_profiles").select("*").eq("user_id", user?.id).maybeSingle();
      
      const photo = vetProfile?.profile_photo || profile?.profile_photo || profile?.avatar_url;
      let photoUrl = photo;
      if (photo && !photo.startsWith("http")) {
        photoUrl = supabase.storage.from("vet-documents").getPublicUrl(photo).data.publicUrl;
      }
      if (photoUrl) {
        setRealProfilePhoto(photoUrl);
      }

      await fetchPendingCount();
      await fetchUpcoming();
      setIsLoading(false);
    } catch (err) {
      console.error("Error fetching vet data:", err);
      setIsLoading(false);
    }
  }, [user?.id, profile, fetchPendingCount, fetchUpcoming]);

  useEffect(() => {
    if (guardLoading) return;
    if (user && profile) {
      if (profile.is_onboarding_complete === false) {
        navigate("/vet/onboarding");
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
              fetchUpcoming();
            }
          )
          .subscribe();

        const pollTimer = setInterval(() => {
          fetchUpcoming();
        }, 15000);

         return () => {
          supabase.removeChannel(channel);
          clearInterval(pollTimer);
        };
      }
    }
  }, [user, profile, navigate, fetchData, fetchPendingCount, fetchUpcoming]);

  if (guardError) return <div className="min-h-screen flex items-center justify-center p-4 bg-[#f9f9fb]">{guardError}</div>;

  if (showSpinner) {
    return <SplashScreen message="Preparing vet dashboard..." />;
  }

  const hasCache = localStorage.getItem("sruvo_user_role") === "vet";
  if ((guardLoading || !user || !profile || isLoading) && !hasCache) {
    return null;
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
                  <AvatarImage src={realProfilePhoto || profile?.profile_photo || profile?.avatar_url || ""} className="object-cover rounded-full" />
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
              <Bell size={20} weight="bold" />
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
                    onClick={() => navigate("/vet/virtual-consults")}
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
                      <h3 className="text-[#1a1a24] text-[26px] font-extrabold tracking-[-0.5px]">₹{todayRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h3>
                    </div>
                    <div className="w-10 h-10 bg-[#fae8ff] text-[#a428ff] rounded-[12px] flex items-center justify-center text-xl">
                      <Wallet size={20} weight="fill" />
                    </div>
                  </div>
                </div>
                <div className="flex items-end justify-between h-12 gap-[7px]">
                  {revenueBars.map((h, i) => (
                    <div 
                      key={i} 
                      className={`grow rounded-[4px] w-full transition-all duration-700 ${i === 6 ? 'bg-[#a428ff]' : 'bg-[#e6c6ff]'}`}
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
                  <h3 className="text-[#1a1a24] text-[22px] font-extrabold mb-2">{activePatients}</h3>
                  <div className="text-[#10b981] font-bold text-xs flex items-center gap-1">
                    <span className="font-extrabold">●</span> Live
                  </div>
                </article>
                <article className="bg-white rounded-[26px] p-5 shadow-[0_12px_35px_rgba(0,0,0,0.035)] flex flex-col">
                  <div className="w-[49px] h-[49px] rounded-full bg-[#fff8eb] text-[#f5a623] flex items-center justify-center mb-4">
                    <ClipboardText size={24} weight="fill" />
                  </div>
                  <p className="text-[#8f8f9d] text-[9.5px] font-extrabold tracking-[0.8px] uppercase mb-1.5 truncate">PENDING TASKS</p>
                  <h3 className="text-[#1a1a24] text-[22px] font-extrabold mb-2">{pendingCount}</h3>
                  <div className="text-[#f59e0b] font-bold text-xs flex items-center gap-1 text-[11px]">
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

              {activeAppointment ? (
                <div className="bg-white rounded-[34px] p-[22px] shadow-[0_16px_40px_rgba(0,0,0,0.04)] relative">
                  <span className="absolute top-3 right-3 bg-[#fbedff] text-[#a428ff] text-[9px] font-extrabold px-2 py-1.5 rounded-lg tracking-[0.3px]">
                    {(() => {
                      const diff = getMinutesDifference(activeAppointment.time);
                      if (diff > 0) return `IN ${diff} MINS`;
                      if (diff === 0) return `DUE NOW`;
                      return 'LIVE NOW';
                    })()}
                  </span>
                  
                  <div 
                    className="flex items-center gap-3.5 mb-[22px] cursor-pointer"
                    onClick={() => navigate(`/vet/schedule/visit-details/${activeAppointment.id}`, { 
                      state: { 
                        visit: { 
                          id: activeAppointment.id, 
                          petName: activeAppointment.name, 
                          petBreed: activeAppointment.breed, 
                          image: activeAppointment.image, 
                          ownerName: activeAppointment.ownerName, 
                          ownerPhone: activeAppointment.ownerPhone, 
                          time: activeAppointment.time, 
                          type: activeAppointment.type, 
                          status: activeAppointment.status 
                        } 
                      } 
                    })}
                  >
                    <img 
                      src={activeAppointment.image} 
                      alt={activeAppointment.name} 
                      className="w-[58px] h-[58px] rounded-full object-cover flex-shrink-0"
                    />
                    <div className="grow min-w-0">
                      <h4 className="text-[17px] font-extrabold text-[#1a1a24] mb-[3px]">{activeAppointment.name}</h4>
                      <p className="text-xs font-medium text-[#8f8f9d] mb-2 truncate">{activeAppointment.breed}</p>
                      <div className="inline-flex items-center gap-1.5 bg-[#fbedff] text-[#a428ff] text-[8.5px] font-extrabold px-2 py-1 rounded-lg tracking-[0.3px] uppercase">
                        {activeAppointment.type === 'video' ? <VideoCamera size={12} weight="fill" /> : activeAppointment.type === 'home' ? <House size={12} weight="fill" /> : <Buildings size={12} weight="fill" />}
                        {activeAppointment.type === 'video' ? 'VIDEO CONSULTATION' : activeAppointment.type === 'home' ? 'HOME VISIT' : 'CLINIC VISIT'}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-[22px]">
                    <div className="bg-[#f7f7fb] p-3.5 rounded-[18px] min-w-0">
                      <span className="block text-[9px] text-[#b5b5c3] font-extrabold tracking-[0.5px] uppercase mb-1.5">REASON</span>
                      <strong className="block text-[13px] text-[#1a1a24] font-bold truncate">
                        {activeAppointment.type === 'video' ? 'Video Consult' : activeAppointment.type === 'home' ? 'Home Visit' : 'Clinic Visit'}
                      </strong>
                    </div>
                    <div className="bg-[#f7f7fb] p-3.5 rounded-[18px] min-w-0">
                      <span className="block text-[9px] text-[#b5b5c3] font-extrabold tracking-[0.5px] uppercase mb-1.5">OWNER</span>
                      <strong className="block text-[13px] text-[#1a1a24] font-bold truncate">{activeAppointment.ownerName}</strong>
                    </div>
                  </div>

                  <button 
                    onClick={() => navigate(`/vet/schedule/visit-details/${activeAppointment.id}`, { 
                      state: { 
                        visit: { 
                          id: activeAppointment.id, 
                          petName: activeAppointment.name, 
                          petBreed: activeAppointment.breed, 
                          image: activeAppointment.image, 
                          ownerName: activeAppointment.ownerName, 
                          ownerPhone: activeAppointment.ownerPhone, 
                          time: activeAppointment.time, 
                          type: activeAppointment.type, 
                          status: activeAppointment.status 
                        } 
                      } 
                    })}
                    className="w-full bg-[#a428ff] text-white p-4 rounded-[22px] border-none font-bold text-sm flex items-center justify-center gap-2 mb-3 shadow-[0_8px_20px_rgba(164,40,255,0.25)] active:scale-[0.98] transition-all"
                  >
                    {activeAppointment.type === 'video' ? <VideoCamera size={18} weight="fill" /> : <Buildings size={18} weight="fill" />}
                    {activeAppointment.type === 'video' ? 'Join Video Call' : 'Start Consultation'}
                  </button>
                  
                  <div className="flex gap-3">
                    <button 
                      onClick={() => navigate(`/vet/schedule/visit-details/${activeAppointment.id}`, { 
                        state: { 
                          visit: { 
                            id: activeAppointment.id, 
                            petName: activeAppointment.name, 
                            petBreed: activeAppointment.breed, 
                            image: activeAppointment.image, 
                            ownerName: activeAppointment.ownerName, 
                            ownerPhone: activeAppointment.ownerPhone, 
                            time: activeAppointment.time, 
                            type: activeAppointment.type, 
                            status: activeAppointment.status 
                          } 
                        } 
                      })}
                      className="grow bg-[#f3f4f8] text-[#4a4a5e] p-3.5 rounded-[20px] font-bold text-[18px] border-none flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                    >
                      <ClockCounterClockwise size={22} weight="bold" className="text-[#7b7b8f]" /> Records
                    </button>
                    <button 
                      onClick={() => navigate("/chats")}
                      className="grow bg-[#f3f4f8] text-[#4a4a5e] p-3.5 rounded-[20px] font-bold text-[18px] border-none flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                    >
                      <ChatTeardrop size={22} weight="fill" className="text-[#7b7b8f]" /> Chat
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-[34px] p-[26px] shadow-[0_16px_40px_rgba(0,0,0,0.04)] text-center flex flex-col items-center justify-center min-h-[300px]">
                  <div className="w-[80px] h-[80px] bg-purple-50 text-[#a428ff] rounded-full flex items-center justify-center mb-5">
                    <PawPrint size={36} weight="fill" />
                  </div>
                  <h4 className="text-[17px] font-extrabold text-[#1a1a24] mb-2">You are all caught up!</h4>
                  <p className="text-[13px] text-[#8f8f9d] font-medium max-w-[280px] mb-6 leading-[1.4]">
                    There are no active consultations right now. Click below to view your full schedule.
                  </p>
                  <button 
                    onClick={() => navigate("/vet/schedule")}
                    className="bg-[#a428ff] text-white py-3 px-6 rounded-[22px] font-semibold text-xs shadow-[0_8px_20px_rgba(164,40,255,0.15)] hover:bg-[#931eee] transition-all active:scale-[0.98]"
                  >
                    View Schedule
                  </button>
                </div>
              )}
            </section>

            {/* Upcoming Section */}
            <section>
              <div className="flex justify-between items-center mb-[18px]">
                <h3 className="text-[17px] font-extrabold text-[#1a1a24]">Upcoming</h3>
                <button 
                  onClick={() => navigate("/vet/schedule")}
                  className="text-[#a428ff] text-xs font-extrabold no-underline uppercase"
                >
                  View All
                </button>
              </div>

              <div className="flex flex-col gap-2.5">
                {upcomingAppointments.length === 0 ? (
                  <div className="bg-white rounded-[22px] p-6 text-center shadow-[0_12px_35px_rgba(0,0,0,0.035)]">
                    <p className="text-[14px] text-zinc-400 font-bold">No upcoming appointments.</p>
                  </div>
                ) : (
                  upcomingAppointments.map((apt, index) => (
                    <div 
                      key={apt.id} 
                      className={`bg-white rounded-[22px] p-3.5 flex items-center shadow-[0_12px_35px_rgba(0,0,0,0.035)] border-none transition-all active:scale-[0.99] cursor-pointer ${
                        index > 0 ? "opacity-60 hover:opacity-100 duration-300" : ""
                      }`} 
                      onClick={() => navigate(`/vet/schedule/visit-details/${apt.id}`, { 
                        state: { 
                          visit: { 
                            id: apt.id, 
                            petName: apt.name, 
                            petBreed: apt.breed, 
                            image: apt.image, 
                            ownerName: apt.ownerName, 
                            ownerPhone: apt.ownerPhone, 
                            time: apt.time, 
                            type: apt.type, 
                            status: apt.status 
                          } 
                        } 
                      })}
                    >
                      <div className="min-w-[55px] text-center pr-3.5 border-r-[1.5px] border-[#f0f0f5] flex-shrink-0">
                        <strong className="block text-[13px] text-[#8f8f9d] font-bold mb-0.5">{apt.time.split(" ")[0]}</strong>
                        <span className="text-[10.5px] text-[#b5b5c3] font-semibold uppercase">{apt.time.split(" ")[1] || "AM"}</span>
                      </div>
                      <div className="flex items-center gap-3 grow pl-3.5 min-w-0">
                        <img src={apt.image} alt={apt.name} className="w-[38px] h-[38px] rounded-full object-cover flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-[3px] flex-wrap sm:flex-nowrap">
                            <h5 className="text-[14.5px] font-extrabold text-[#1a1a24] truncate">{apt.name}</h5>
                            {apt.type === 'home' ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-600 font-bold text-[9px] uppercase tracking-wider shrink-0">
                                <House size={11} weight="fill" />
                                Home Visit
                              </span>
                            ) : apt.type === 'video' ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-purple-50 text-purple-600 font-bold text-[9px] uppercase tracking-wider shrink-0">
                                <VideoCamera size={11} weight="fill" />
                                Video Call
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#eef4ff] text-[#4b83ff] font-bold text-[9px] uppercase tracking-wider shrink-0">
                                <Buildings size={11} weight="fill" />
                                Clinic Visit
                              </span>
                            )}
                          </div>
                          <p className="text-[11.5px] text-[#8f8f9d] font-medium truncate uppercase">
                            {apt.breed}
                          </p>
                        </div>
                      </div>
                      <CaretRight size={16} weight="bold" className="text-[#d1d1e0] flex-shrink-0" />
                    </div>
                  ))
                )}
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
