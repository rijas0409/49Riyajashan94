import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, Bell, Video, MoreHorizontal, PawPrint, ClipboardList,
  TrendingUp, FileText, MessageSquare, ChevronRight, Plus,
  Home, Calendar, DollarSign, User, MapPin, Building2
} from "lucide-react";

interface VetDashboardHomeProps {
  profile: any;
  vetProfile: any;
  appointments: any[];
  earnings: any[];
  onTabChange: (tab: string) => void;
}

const VetDashboardHome = ({ profile, vetProfile, appointments, earnings, onTabChange }: VetDashboardHomeProps) => {
  const navigate = useNavigate();
  const [barsAnimated, setBarsAnimated] = useState(false);
  const [cardsVisible, setCardsVisible] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTimeout(() => setCardsVisible(true), 100);
    setTimeout(() => setBarsAnimated(true), 400);
  }, []);

  const todayStr = new Date().toISOString().split("T")[0];
  const todayAppointments = appointments.filter(a => a.appointment_date === todayStr);
  const pendingConsultations = appointments.filter(a => a.status === "pending" && a.appointment_type === "online");
  const upcomingAppointments = appointments
    .filter(a => ["pending", "confirmed"].includes(a.status) && a.appointment_date >= todayStr)
    .sort((a, b) => `${a.appointment_date}${a.appointment_time}`.localeCompare(`${b.appointment_date}${b.appointment_time}`))
    .slice(0, 4);

  const nextAppointment = upcomingAppointments.find(a => a.appointment_type === "online") || upcomingAppointments[0];

  const todayEarnings = earnings
    .filter(e => new Date(e.created_at).toISOString().split("T")[0] === todayStr)
    .reduce((s, e) => s + Number(e.net_amount), 0);

  const activePatients = appointments.filter(a => ["pending", "confirmed"].includes(a.status)).length;
  const pendingTasks = appointments.filter(a => a.status === "pending").length;

  const barHeights = [35, 45, 55, 60, 70, 85, 100];
  const doctorName = profile?.full_name || profile?.name || "Doctor";

  const getTimeUntil = (apt: any) => {
    if (!apt) return "";
    const now = new Date();
    const aptDate = new Date(`${apt.appointment_date}T${apt.appointment_time}`);
    const diff = aptDate.getTime() - now.getTime();
    if (diff < 0) return "NOW";
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `IN ${mins} MINS`;
    const hrs = Math.floor(mins / 60);
    return `IN ${hrs}H ${mins % 60}M`;
  };

  const getAppointmentIcon = (apt: any) => {
    if (apt.appointment_type === "online") return <Video className="w-4 h-4 text-purple-500" />;
    if (apt.appointment_type === "home_visit") return <Home className="w-4 h-4 text-orange-500" />;
    return <Building2 className="w-4 h-4 text-blue-500" />;
  };

  const getAppointmentLabel = (apt: any) => {
    if (apt.appointment_type === "online") return "Video Call";
    if (apt.appointment_type === "home_visit") return "Home Visit";
    return "Clinic Visit";
  };

  const handleUpcomingClick = (apt: any) => {
    if (apt.appointment_type === "online") {
      navigate("/vet-dashboard/consultation-summary", { state: { appointment: apt } });
    } else if (apt.appointment_type === "home_visit") {
      navigate("/vet-dashboard/home-visit-details", { state: { appointment: apt } });
    } else {
      navigate("/vet-dashboard/visit-details", { state: { appointment: apt } });
    }
  };

  return (
    <div className="min-h-screen pb-24" style={{ background: "#F6F7FB" }}>
      {/* Header */}
      <div className={`px-5 pt-6 pb-4 flex items-center justify-between transition-all duration-500 ${cardsVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-lg overflow-hidden">
            {vetProfile?.profile_photo ? (
              <img src={vetProfile.profile_photo} alt="" className="w-full h-full object-cover" />
            ) : (
              doctorName.charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <p className="text-[11px] font-semibold tracking-widest text-purple-500 uppercase">VET PANEL</p>
            <h1 className="text-[18px] font-bold text-gray-900 leading-tight">Welcome, Dr. {doctorName.split(" ")[0]}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <button className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center">
            <Search className="w-[18px] h-[18px] text-gray-600" />
          </button>
          <button className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center relative">
            <Bell className="w-[18px] h-[18px] text-gray-600" />
            {pendingTasks > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {pendingTasks}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Hero Card */}
      <div className={`px-5 mb-5 transition-all duration-700 delay-100 ${cardsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
        <div
          className="rounded-[20px] p-5 relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #8A3FFC 0%, #C84BFF 50%, #FF6FD8 100%)",
            boxShadow: "0 8px 32px rgba(138, 63, 252, 0.35)",
          }}
        >
          <div
            className="absolute inset-0 opacity-20"
            style={{
              background: "linear-gradient(110deg, transparent 25%, rgba(255,255,255,0.3) 50%, transparent 75%)",
              backgroundSize: "200% 100%",
              animation: "heroShimmer 3s ease-in-out infinite",
            }}
          />
          <h2 className="text-[22px] font-bold text-white leading-tight mb-1.5 relative z-10">
            Ready for your next<br />consultation?
          </h2>
          <p className="text-[13px] text-white/80 mb-5 relative z-10">
            You have {pendingConsultations.length || todayAppointments.length} pending consultation requests.
          </p>
          <div className="flex items-center gap-3 relative z-10">
            <button
              className="flex-1 flex items-center justify-center gap-2 bg-white rounded-full py-3 px-5 shadow-lg active:scale-95 transition-transform"
              onClick={() => navigate("/vet-dashboard/video-consultations")}
            >
              <div className="w-5 h-5 rounded bg-purple-500 flex items-center justify-center">
                <Video className="w-3 h-3 text-white" />
              </div>
              <span className="text-[14px] font-semibold text-gray-800">View Consultations</span>
            </button>
            <button className="w-11 h-11 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
              <MoreHorizontal className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Revenue Card */}
      <div className={`px-5 mb-5 transition-all duration-700 delay-200 ${cardsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
        <div className="bg-white rounded-[20px] p-5 shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[13px] text-gray-400 font-medium">Today's Revenue</p>
            <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-purple-500" />
            </div>
          </div>
          <p className="text-[28px] font-bold text-gray-900 mb-4">₹{todayEarnings.toLocaleString() || "0"}</p>
          <div ref={barRef} className="flex items-end gap-2.5 h-16">
            {barHeights.map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t-lg transition-all duration-700 ease-out"
                style={{
                  height: barsAnimated ? `${h}%` : "4%",
                  background: i === barHeights.length - 1
                    ? "linear-gradient(180deg, #8A3FFC, #C84BFF)"
                    : `hsl(265, 60%, ${85 - i * 3}%)`,
                  transitionDelay: `${i * 80}ms`,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className={`px-5 mb-5 flex gap-4 transition-all duration-700 delay-300 ${cardsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
        <div className="flex-1 bg-white rounded-[20px] p-4 shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-3">
            <PawPrint className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">Active Patients</p>
          <p className="text-[28px] font-bold text-gray-900 leading-tight">{activePatients}</p>
          <div className="flex items-center gap-1 mt-1">
            <TrendingUp className="w-3 h-3 text-green-500" />
            <span className="text-[11px] font-semibold text-green-500">+12%</span>
          </div>
        </div>
        <div className="flex-1 bg-white rounded-[20px] p-4 shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center mb-3">
            <ClipboardList className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">Pending Tasks</p>
          <p className="text-[28px] font-bold text-gray-900 leading-tight">{pendingTasks}</p>
          <div className="flex items-center gap-1 mt-1">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-[11px] font-medium text-amber-500">Action req.</span>
          </div>
        </div>
      </div>

      {/* Focus Mode */}
      {nextAppointment && (
        <div className={`px-5 mb-5 transition-all duration-700 delay-[400ms] ${cardsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-5 h-5 rounded-full border-2 border-purple-500 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-purple-500" />
            </div>
            <h3 className="text-[16px] font-bold text-gray-900">Focus Mode</h3>
          </div>
          <div className="bg-white rounded-[20px] p-5 shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-200 to-amber-100 flex items-center justify-center overflow-hidden">
                  <PawPrint className="w-7 h-7 text-orange-400" />
                </div>
                <div>
                  <h4 className="text-[16px] font-bold text-gray-900">{nextAppointment.pet_name}</h4>
                  <p className="text-[13px] text-gray-400">
                    {nextAppointment.pet_breed || nextAppointment.pet_type} • {Math.floor((nextAppointment.age_months || 36) / 12)}y
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Video className="w-3 h-3 text-purple-500" />
                    <span className="text-[11px] font-semibold text-purple-500 uppercase">Video Consultation</span>
                  </div>
                </div>
              </div>
              <span
                className="text-[11px] font-bold px-2.5 py-1 rounded-lg"
                style={{ color: "#8A3FFC", background: "rgba(138,63,252,0.08)" }}
              >
                {getTimeUntil(nextAppointment)}
              </span>
            </div>

            <div className="flex gap-3 mb-4">
              <div className="flex-1 bg-gray-50 rounded-xl px-3.5 py-2.5">
                <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wide">Reason</p>
                <p className="text-[13px] font-semibold text-gray-800 mt-0.5">
                  {nextAppointment.appointment_type === "online" ? "Video Consult" : "Post-op Checkup"}
                </p>
              </div>
              <div className="flex-1 bg-gray-50 rounded-xl px-3.5 py-2.5">
                <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wide">Owner</p>
                <p className="text-[13px] font-semibold text-gray-800 mt-0.5">Pet Owner</p>
              </div>
            </div>

            {/* Join Video Call Button */}
            <button
              className="w-full py-3.5 rounded-2xl text-white font-semibold text-[15px] flex items-center justify-center gap-2 mb-3 relative overflow-hidden active:scale-[0.98] transition-transform"
              style={{
                background: "linear-gradient(135deg, #8A3FFC, #C84BFF)",
                boxShadow: "0 4px 20px rgba(138, 63, 252, 0.4)",
              }}
              onClick={() => navigate("/vet-dashboard/consultation-summary", { state: { appointment: nextAppointment } })}
            >
              <div
                className="absolute inset-0"
                style={{
                  background: "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.2) 0%, transparent 70%)",
                  animation: "glowPulse 2.5s ease-in-out infinite",
                }}
              />
              <Video className="w-5 h-5 relative z-10" />
              <span className="relative z-10">Join Video Call</span>
            </button>

            <div className="flex gap-3">
              <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-[13px] font-medium text-gray-600">
                <FileText className="w-4 h-4" />
                Records
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-[13px] font-medium text-gray-600">
                <MessageSquare className="w-4 h-4" />
                Chat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upcoming Section */}
      <div className={`px-5 mb-6 transition-all duration-700 delay-500 ${cardsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[18px] font-bold text-gray-900">Upcoming</h3>
          <button className="text-[13px] font-semibold text-purple-500" onClick={() => onTabChange("schedule")}>
            View All
          </button>
        </div>
        {upcomingAppointments.length === 0 ? (
          <div className="bg-white rounded-[20px] p-6 text-center shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
            <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-[13px] text-gray-400">No upcoming appointments</p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingAppointments.map((apt) => (
              <div
                key={apt.id}
                className="bg-white rounded-[16px] p-4 flex items-center gap-3.5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] active:scale-[0.98] transition-transform cursor-pointer"
                onClick={() => handleUpcomingClick(apt)}
              >
                <div className="text-center min-w-[44px]">
                  <p className="text-[14px] font-bold text-gray-800">{apt.appointment_time?.slice(0, 5)}</p>
                  <p className="text-[10px] text-gray-400 uppercase">
                    {parseInt(apt.appointment_time) >= 12 ? "PM" : "AM"}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                  <PawPrint className="w-5 h-5 text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-gray-900">{apt.pet_name}</p>
                  <div className="flex items-center gap-1.5 text-[12px] text-gray-400">
                    <span>{apt.pet_type || "Pet"}</span>
                    <span>•</span>
                    {getAppointmentIcon(apt)}
                    <span>{getAppointmentLabel(apt)}</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        className="fixed bottom-24 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full flex items-center justify-center z-40 active:scale-90 transition-transform"
        style={{
          background: "linear-gradient(135deg, #8A3FFC, #C84BFF)",
          boxShadow: "0 4px 24px rgba(138, 63, 252, 0.45)",
          animation: "fabGlow 2s ease-in-out infinite",
        }}
      >
        <Plus className="w-7 h-7 text-white" />
      </button>

      {/* Bottom Nav */}
      <nav
        className="fixed bottom-0 left-0 right-0 bg-white z-50 border-t border-gray-100"
        style={{
          borderTopLeftRadius: "20px",
          borderTopRightRadius: "20px",
          boxShadow: "0 -4px 20px rgba(0,0,0,0.06)",
        }}
      >
        <div className="flex justify-around py-2.5 px-2">
          {[
            { id: "overview", icon: Home, label: "HOME" },
            { id: "schedule", icon: Calendar, label: "SCHEDULE" },
            { id: "earnings", icon: DollarSign, label: "EARNINGS" },
            { id: "profile", icon: User, label: "PROFILE" },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = item.id === "overview";
            return (
              <button
                key={item.id}
                className="flex flex-col items-center gap-0.5 py-1 px-3 min-w-[60px]"
                onClick={() => onTabChange(item.id)}
              >
                <Icon
                  className="w-5 h-5 transition-colors"
                  style={{ color: isActive ? "#8A3FFC" : "#B0B5C3" }}
                />
                <span
                  className="text-[10px] font-semibold tracking-wide"
                  style={{ color: isActive ? "#8A3FFC" : "#B0B5C3" }}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      <style>{`
        @keyframes heroShimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes glowPulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.05); }
        }
        @keyframes fabGlow {
          0%, 100% { box-shadow: 0 4px 24px rgba(138, 63, 252, 0.35); }
          50% { box-shadow: 0 4px 32px rgba(138, 63, 252, 0.6); }
        }
      `}</style>
    </div>
  );
};

export default VetDashboardHome;
