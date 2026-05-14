import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import { 
  XCircle, Search, Bell, Video, Calendar, 
  MapPin, Home as HomeIcon, Clock, MoreHorizontal, 
  ChevronRight, BarChart3, Wallet, User, MessageSquare, 
  Target, LayoutDashboard
} from "lucide-react";
import { SRUVO_LOGO_URL } from "@/constants/branding";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const VetDashboard = () => {
  const navigate = useNavigate();
  const { isLoading: guardLoading, user, profile, error: guardError } = useRoleGuard(["vet"], "/auth-vet");
  const [appointments, setAppointments] = useState<any[]>([]);
  const [vetProfile, setVetProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user && profile) {
      if (!profile.is_onboarding_complete) {
        navigate("/vet-onboarding");
      } else if (!profile.is_admin_approved) {
        navigate("/vet-pending-approval");
      } else {
        fetchData();
      }
    }
  }, [user, profile, navigate]);

  const fetchData = async () => {
    try {
      const [aptRes, profRes] = await Promise.all([
        supabase.from("vet_appointments").select("*").eq("vet_id", user?.id).order("appointment_time", { ascending: true }),
        supabase.from("vet_profiles").select("*").eq("user_id", user?.id).maybeSingle()
      ]);
      setAppointments(aptRes.data || []);
      setVetProfile(profRes.data || null);
    } catch (err) {
      console.error("Error fetching vet data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (guardError) return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#F8F9FD]">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center shadow-xl shadow-purple-100/50">
        <XCircle className="w-16 h-16 text-red-500 mx-auto mb-6 opacity-80" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-500 mb-8">{guardError}</p>
        <div className="flex gap-4">
          <Button onClick={() => window.location.reload()} className="flex-1 rounded-2xl bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-200">Try Again</Button>
          <Button variant="outline" onClick={() => navigate("/auth-vet")} className="flex-1 rounded-2xl border-gray-200">Login</Button>
        </div>
      </div>
    </div>
  );

  if (guardLoading || !user || !profile || isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F9FD] p-6 space-y-6">
        <div className="flex justify-between items-center px-4">
          <div className="flex gap-3">
             <Skeleton className="h-12 w-12 rounded-full" />
             <div className="space-y-2">
               <Skeleton className="h-4 w-24" />
               <Skeleton className="h-6 w-32" />
             </div>
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
        </div>
        <Skeleton className="h-48 w-full rounded-[40px]" />
        <Skeleton className="h-40 w-full rounded-[32px]" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-32 rounded-[32px]" />
          <Skeleton className="h-32 rounded-[32px]" />
        </div>
      </div>
    );
  }

  const doctorName = profile?.name || "Doctor";
  const pendingCount = appointments.filter(a => a.status === 'pending').length;
  const currentAppointment = appointments.find(a => a.status === 'confirmed' || a.status === 'pending') || appointments[0];

  return (
    <div className="min-h-screen bg-[#F8F9FD] pb-32 font-sans text-gray-900 overflow-x-hidden">
      {/* Top Header */}
      <header className="px-6 pt-10 pb-4 flex items-center justify-between sticky top-0 bg-[#F8F9FD]/80 backdrop-blur-md z-40">
        <div className="flex items-center gap-4">
          <div className="relative group cursor-pointer" onClick={() => navigate("/vet/profile")}>
            <Avatar className="w-14 h-14 border-2 border-white shadow-md ring-2 ring-purple-100 transition-transform active:scale-90">
              <AvatarImage src={profile?.avatar_url || "https://images.unsplash.com/photo-1559839734-2b71ef159961?auto=format&fit=crop&q=80&w=200"} />
              <AvatarFallback className="bg-purple-50 text-purple-600 font-bold">{doctorName[0]}</AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-0.5 -right-0.5 w-4.5 h-4.5 bg-green-500 border-2 border-white rounded-full"></div>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.15em] font-black text-purple-500 mb-0.5">VET PANEL</p>
            <h1 className="text-xl font-black tracking-tight text-[#1A1C1E]">Welcome, Dr. {doctorName.split(' ')[0]}</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="w-11 h-11 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 hover:bg-gray-50 transition-all active:scale-95">
            <Search className="w-5 h-5 text-gray-600" />
          </button>
          <button className="w-11 h-11 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 hover:bg-gray-50 transition-all active:scale-95 relative">
            <Bell className="w-5 h-5 text-gray-600" />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
          </button>
        </div>
      </header>

      <main className="px-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Main Banner Card */}
        <section className="relative overflow-hidden group">
          <div className="bg-gradient-to-br from-[#BF40FF] via-[#A832FF] to-[#8A2BE2] rounded-[40px] p-8 text-white shadow-2xl shadow-purple-200/60 relative z-10">
            <div className="flex justify-between items-start mb-6">
              <div className="space-y-2">
                <h2 className="text-[28px] font-black leading-[1.1] max-w-[220px]">Ready for your next consultation?</h2>
                <p className="text-purple-100/90 text-sm font-medium">You have {pendingCount} pending consultation requests.</p>
              </div>
              <button className="w-11 h-11 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center transition-all active:scale-95">
                <MoreHorizontal className="w-6 h-6" />
              </button>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                className="bg-white text-purple-700 hover:bg-purple-50 font-black rounded-2xl h-14 px-7 gap-3 shadow-xl shadow-black/10 transition-all active:scale-95"
                onClick={() => navigate("/vet/appointments")}
              >
                <div className="bg-purple-100 p-1.5 rounded-lg">
                   <Video className="w-4 h-4 fill-purple-600 text-purple-600" strokeWidth={3} />
                </div>
                View Consultations
              </Button>
            </div>
          </div>
          {/* Decorative glow */}
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-black/10 rounded-full blur-2xl"></div>
        </section>

        {/* Revenue Section */}
        <section className="bg-white rounded-[32px] p-7 shadow-sm border border-gray-100/50">
          <div className="flex justify-between items-center mb-8">
            <div>
              <p className="text-gray-400 text-[12px] font-bold uppercase tracking-widest mb-1.5">Today's Revenue</p>
              <h3 className="text-3xl font-black tracking-tight text-[#1A1C1E]">₹{vetProfile?.today_revenue || "1,284.50"}</h3>
            </div>
            <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-500 shadow-inner">
              <Wallet className="w-6 h-6" />
            </div>
          </div>
          <div className="flex items-end justify-between h-20 gap-2.5">
            {[15, 25, 20, 28, 40, 35, 30].map((height, i) => (
              <div 
                key={i} 
                className={`flex-1 rounded-xl transition-all duration-700 ease-out h-full flex items-end ${i === 5 ? 'bg-[#A832FF]' : i === 6 ? 'bg-[#D699FF]' : 'bg-purple-50'}`}
                style={{ height: `${height}%` }}
              ></div>
            ))}
          </div>
        </section>

        {/* Info Cards Grid */}
        <div className="grid grid-cols-2 gap-5">
          <div className="bg-white rounded-[32px] p-7 shadow-sm border border-gray-100/50 group active:scale-95 transition-transform">
            <div className="w-12 h-12 bg-[#EEF2FF] rounded-2xl flex items-center justify-center text-[#4F46E5] mb-5">
              <User className="w-6 h-6" />
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-1.5">ACTIVE PATIENTS</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-[#1A1C1E]">42</span>
              <span className="text-[11px] font-black text-green-500 flex items-center bg-green-50 px-1.5 py-0.5 rounded-lg">
                 +12%
              </span>
            </div>
          </div>
          <div className="bg-white rounded-[32px] p-7 shadow-sm border border-gray-100/50 group active:scale-95 transition-transform">
            <div className="w-12 h-12 bg-[#FFF7ED] rounded-2xl flex items-center justify-center text-[#F97316] mb-5">
              <Calendar className="w-6 h-6" />
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-1.5">PENDING TASKS</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-[#1A1C1E]">8</span>
            </div>
            <p className="text-[10px] font-black text-orange-500 mt-2 flex items-center gap-1.5 uppercase tracking-wider">
              <Clock className="w-3 h-3" /> Action req.
            </p>
          </div>
        </div>

        {/* Focus Mode Section */}
        <section>
          <div className="flex items-center gap-3 mb-6 px-1">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center shadow-inner">
              <Target className="w-4.5 h-4.5 text-purple-600" />
            </div>
            <h2 className="text-xl font-black tracking-tight text-[#1A1C1E]">Focus Mode</h2>
          </div>
          
          <div className="relative">
            <Card className="rounded-[44px] border-none shadow-2xl shadow-purple-100/40 overflow-hidden bg-white">
              <CardContent className="p-8">
                <div className="flex items-start justify-between mb-8">
                  <div className="flex items-center gap-5">
                    <div className="relative">
                      <Avatar className="w-20 h-20 ring-4 ring-gray-50 shadow-lg">
                        <AvatarImage src={currentAppointment?.pet_image || "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=200"} />
                        <AvatarFallback>PET</AvatarFallback>
                      </Avatar>
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md">
                        <Video className="w-3 h-3 text-purple-600 fill-purple-600" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-2xl font-black tracking-tight text-[#1A1C1E]">{currentAppointment?.pet_name || "Oliver"}</h4>
                        <span className="bg-[#F3E8FF] text-[#A832FF] text-[9px] font-black px-2.5 py-1.5 rounded-xl uppercase tracking-wider shadow-sm">IN 15 MINS</span>
                      </div>
                      <p className="text-gray-400 font-bold text-sm">{currentAppointment?.pet_type || "Domestic Shorthair"} • {currentAppointment?.pet_age || "3y"}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className="bg-[#FAF5FF] text-[#A832FF] border-none font-black text-[10px] py-2 px-3.5 rounded-2xl gap-2 tracking-wide uppercase">
                          <Video className="w-3.5 h-3.5 text-purple-600 fill-purple-600" /> VIDEO CONSULTATION
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-10">
                  <div className="bg-[#F8F9FD] rounded-3xl p-5 border border-gray-100/50">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.15em] mb-1.5">REASON</p>
                    <p className="font-black text-[13px] text-[#1A1C1E]">{currentAppointment?.reason || "Post-op Checkup"}</p>
                  </div>
                  <div className="bg-[#F8F9FD] rounded-3xl p-5 border border-gray-100/50">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.15em] mb-1.5">OWNER</p>
                    <p className="font-black text-[13px] text-[#1A1C1E]">{currentAppointment?.owner_name || "Mark Thompson"}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <Button className="w-full h-18 rounded-[28px] bg-[#A832FF] hover:bg-[#8A2BE2] text-white text-lg font-black gap-3 shadow-2xl shadow-purple-200 transition-all active:scale-95">
                    <Video className="w-6 h-6 fill-white/20 border-none" strokeWidth={3} /> Join Video Call
                  </Button>
                  <div className="grid grid-cols-2 gap-4">
                    <Button variant="outline" className="h-15 rounded-2xl border-gray-100 bg-[#F6F7FB] font-black gap-2 hover:bg-gray-100 transition-colors active:scale-95">
                      <FileText className="w-5 h-5 text-gray-500" /> Records
                    </Button>
                    <Button variant="outline" className="h-15 rounded-2xl border-gray-100 bg-[#F6F7FB] font-black gap-2 hover:bg-gray-100 transition-colors active:scale-95">
                      <MessageSquare className="w-5 h-5 text-gray-500" /> Chat
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Upcoming Section */}
        <section className="pb-10">
          <div className="flex items-center justify-between mb-6 px-1">
            <h2 className="text-xl font-black tracking-tight text-[#1A1C1E]">Upcoming</h2>
            <button className="text-[#A832FF] font-black text-[13px] hover:opacity-80 transition-opacity tracking-tight" onClick={() => navigate("/vet/schedule")}>View All</button>
          </div>
          
          <div className="space-y-4">
            {appointments.length > 0 ? appointments.slice(0, 3).map((apt, i) => (
              <div key={i} className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-50 flex items-center justify-between group cursor-pointer hover:border-purple-200 transition-all active:scale-[0.98]">
                <div className="flex items-center gap-7">
                  <span className="text-gray-400 font-black text-[11px] w-14 leading-tight uppercase tracking-tighter">{apt.appointment_time || "11:30 AM"}</span>
                  <div className="flex items-center gap-5">
                    <Avatar className="w-13 h-13 ring-4 ring-[#F8F9FD] shadow-sm">
                      <AvatarImage src={apt.pet_image || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=150"} />
                      <AvatarFallback>{apt.pet_name?.[0] || 'P'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h5 className="font-black text-[#1A1C1E]">{apt.pet_name || "Pet"}</h5>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-[10px] font-bold text-gray-400">{apt.reason || "Checkup"}</p>
                        <span className="w-1 h-1 bg-gray-200 rounded-full"></span>
                        <div className="flex items-center gap-1.5">
                          {apt.appointment_type === 'online' ? <Video className="w-3 h-3 text-purple-400" /> : <MapPin className="w-3 h-3 text-blue-400" />}
                          <p className="text-[10px] font-black text-gray-500 uppercase tracking-wider">{apt.appointment_type === 'online' ? "Video Call" : "Clinic Visit"}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
              </div>
            )) : (
              <div className="text-center py-10 bg-white rounded-[32px] border border-dashed border-gray-200">
                <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm font-bold text-gray-400">No upcoming consultations</p>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Bottom Navbar */}
      <nav className="fixed bottom-0 left-0 right-0 h-28 bg-white/95 backdrop-blur-2xl border-t border-gray-100/50 px-9 flex items-center justify-between z-50 rounded-t-[40px] shadow-[0_-20px_50px_-20px_rgba(168,50,255,0.15)]">
        <button className="flex flex-col items-center gap-2 group" onClick={() => navigate("/vet/home")}>
          <div className="bg-[#A832FF] p-3.5 rounded-[22px] shadow-2xl shadow-purple-400/50 transition-all active:scale-90">
            <HomeIcon className="w-6.5 h-6.5 text-white fill-white/10" strokeWidth={2.5} />
          </div>
          <span className="text-[10px] font-black text-[#A832FF] uppercase tracking-[0.2em]">HOME</span>
        </button>
        <button className="flex flex-col items-center gap-2 text-gray-300 hover:text-purple-400 transition-all active:scale-90" onClick={() => navigate("/vet/schedule")}>
          <div className="p-3.5 rounded-[22px]">
            <Calendar className="w-6.5 h-6.5" strokeWidth={2.5} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] mt-0.5">SCHEDULE</span>
        </button>
        <button className="flex flex-col items-center gap-2 text-gray-300 hover:text-purple-400 transition-all active:scale-90" onClick={() => navigate("/vet/earnings")}>
          <div className="p-3.5 rounded-[22px]">
            <BarChart3 className="w-6.5 h-6.5" strokeWidth={2.5} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] mt-0.5">EARNINGS</span>
        </button>
        <button className="flex flex-col items-center gap-2 text-gray-300 hover:text-purple-400 transition-all active:scale-90" onClick={() => navigate("/vet/profile")}>
          <div className="p-3.5 rounded-[22px]">
            <User className="w-6.5 h-6.5" strokeWidth={2.5} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] mt-0.5">PROFILE</span>
        </button>
      </nav>
    </div>
  );
};

export default VetDashboard;
