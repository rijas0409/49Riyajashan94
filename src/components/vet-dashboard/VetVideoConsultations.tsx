import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, SlidersHorizontal, Video, Timer, User, ChevronRight, Home, Calendar, DollarSign, User as UserIcon } from "lucide-react";

interface Props {
  appointments: any[];
  onBack: () => void;
  onTabChange: (tab: string) => void;
}

const VetVideoConsultations = ({ appointments, onBack, onTabChange }: Props) => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState("pending");
  const [countdowns, setCountdowns] = useState<Record<string, number>>({});

  const onlineAppointments = appointments.filter(a => a.appointment_type === "online");
  const pendingApts = onlineAppointments.filter(a => a.status === "pending");
  const upcomingApts = onlineAppointments.filter(a => a.status === "confirmed");
  const activeApts = onlineAppointments.filter(a => a.status === "in_progress");
  const doneApts = onlineAppointments.filter(a => a.status === "completed");

  const counts = { pending: pendingApts.length, upcoming: upcomingApts.length, active: activeApts.length, done: doneApts.length };

  const filteredApts = activeFilter === "pending" ? pendingApts
    : activeFilter === "upcoming" ? upcomingApts
    : activeFilter === "active" ? activeApts : doneApts;

  // Countdown timers for pending appointments
  useEffect(() => {
    const interval = setInterval(() => {
      const newCountdowns: Record<string, number> = {};
      pendingApts.forEach(apt => {
        const created = new Date(apt.created_at).getTime();
        const expiresAt = created + 5 * 60 * 1000; // 5 min expiry
        const remaining = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
        newCountdowns[apt.id] = remaining;
      });
      setCountdowns(newCountdowns);
    }, 1000);
    return () => clearInterval(interval);
  }, [pendingApts]);

  const formatCountdown = (seconds: number) => {
    if (seconds >= 60) return `${Math.floor(seconds / 60)}M`;
    return `${seconds}S`;
  };

  return (
    <div className="min-h-screen pb-24" style={{ background: "#F6F7FB" }}>
      {/* Header */}
      <div className="bg-white px-5 pt-5 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-[20px] font-bold text-gray-900">Video Consultations</h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
            <Search className="w-5 h-5 text-gray-600" />
          </button>
          <button className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
            <SlidersHorizontal className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="px-5 py-4 flex gap-3 overflow-x-auto">
        {[
          { key: "pending", label: "PENDING", count: counts.pending },
          { key: "upcoming", label: "UPCOMING", count: counts.upcoming },
          { key: "active", label: "ACTIVE", count: counts.active },
          { key: "done", label: "DONE", count: counts.done },
        ].map(item => (
          <button
            key={item.key}
            onClick={() => setActiveFilter(item.key)}
            className={`flex-1 min-w-[75px] rounded-2xl px-3 py-3 text-center transition-all ${
              activeFilter === item.key
                ? "bg-purple-100 border-2 border-purple-300"
                : "bg-white border border-gray-100"
            }`}
          >
            <p className={`text-[10px] font-semibold tracking-wide ${activeFilter === item.key ? "text-purple-600" : "text-gray-400"}`}>
              {item.label}
            </p>
            <p className={`text-[22px] font-bold ${activeFilter === item.key ? "text-purple-700" : "text-gray-700"}`}>
              {String(item.count).padStart(2, "0")}
            </p>
          </button>
        ))}
      </div>

      {/* Sub-filter tabs */}
      <div className="px-5 mb-4">
        <div className="bg-gray-100 rounded-full p-1 flex">
          {["Pending", "Upcoming", "Active"].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveFilter(tab.toLowerCase())}
              className={`flex-1 py-2 rounded-full text-[13px] font-semibold transition-all ${
                activeFilter === tab.toLowerCase()
                  ? "bg-purple-500 text-white shadow-md"
                  : "text-gray-500"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Consultation Cards */}
      <div className="px-5 space-y-4">
        {filteredApts.length === 0 ? (
          <div className="bg-white rounded-[20px] p-8 text-center shadow-sm">
            <Video className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-[14px]">No {activeFilter} consultations</p>
          </div>
        ) : (
          filteredApts.map(apt => {
            const countdown = countdowns[apt.id];
            return (
              <div key={apt.id} className="bg-white rounded-[20px] p-5 shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
                {/* Expiry badge */}
                {activeFilter === "pending" && countdown !== undefined && (
                  <div className="flex justify-end mb-2">
                    <div className="flex items-center gap-1.5 bg-green-50 text-green-600 px-3 py-1 rounded-lg">
                      <Timer className="w-3.5 h-3.5" />
                      <span className="text-[12px] font-bold">EXPIRES IN {formatCountdown(countdown)}</span>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-4 mb-3">
                  <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center overflow-hidden relative">
                    <img
                      src={`https://images.unsplash.com/photo-${apt.pet_type === "cat" ? "1514888286974-6c03e2ca1dba" : "1587300003388-59208cc962cb"}?w=200&h=200&fit=crop`}
                      alt={apt.pet_name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-1 right-1 w-6 h-6 rounded-lg bg-purple-500 flex items-center justify-center">
                      <Video className="w-3 h-3 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-[18px] font-bold text-gray-900">{apt.pet_name}</h3>
                    <p className="text-[13px] text-gray-400 uppercase font-medium">
                      {apt.pet_breed || apt.pet_type} • {apt.appointment_time ? `${Math.ceil(15)} MINS` : "15 MINS"}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <User className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-[13px] text-gray-500">Pet Owner</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <button
                    className="text-[13px] font-semibold text-gray-500 uppercase tracking-wide"
                    onClick={() => navigate("/vet-dashboard/consultation-summary", { state: { appointment: apt } })}
                  >
                    VIEW SUMMARY
                  </button>
                  <span className="text-[18px] font-bold text-purple-600">₹{Number(apt.amount).toFixed(2)}</span>
                </div>

                {activeFilter === "pending" && (
                  <div className="flex gap-3">
                    <button
                      className="flex-1 py-3 rounded-2xl border border-gray-200 text-[14px] font-semibold text-gray-600"
                      onClick={() => {/* decline logic */}}
                    >
                      Decline
                    </button>
                    <button
                      className="flex-1 py-3 rounded-2xl text-[14px] font-semibold text-white"
                      style={{ background: "linear-gradient(135deg, #8A3FFC, #C84BFF)" }}
                      onClick={() => navigate("/vet-dashboard/consultation-summary", { state: { appointment: apt, autoAccept: true } })}
                    >
                      Accept
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Nav */}
      <nav
        className="fixed bottom-0 left-0 right-0 bg-white z-50 border-t border-gray-100"
        style={{ borderTopLeftRadius: "20px", borderTopRightRadius: "20px", boxShadow: "0 -4px 20px rgba(0,0,0,0.06)" }}
      >
        <div className="flex justify-around py-2.5 px-2">
          {[
            { id: "overview", icon: Home, label: "Home" },
            { id: "schedule", icon: Calendar, label: "Schedule" },
            { id: "earnings", icon: DollarSign, label: "Earnings" },
            { id: "profile", icon: UserIcon, label: "Profile" },
          ].map((item) => (
            <button key={item.id} className="flex flex-col items-center gap-0.5 py-1 px-3 min-w-[60px]" onClick={() => onTabChange(item.id)}>
              <item.icon className="w-5 h-5" style={{ color: item.id === "overview" ? "#8A3FFC" : "#B0B5C3" }} />
              <span className="text-[10px] font-semibold" style={{ color: item.id === "overview" ? "#8A3FFC" : "#B0B5C3" }}>{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default VetVideoConsultations;
