import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Bell, ChevronRight, PawPrint, Video, Home as HomeIcon, Building2, Calendar, DollarSign, User, Clock, Timer, MapPin } from "lucide-react";

interface Props {
  appointments: any[];
  onTabChange: (tab: string) => void;
}

const VetSchedule = ({ appointments, onTabChange }: Props) => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<"day" | "week">("day");

  const today = new Date();
  const weekDays: { day: string; date: number; dateStr: string; isToday: boolean }[] = [];
  for (let i = -1; i < 4; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    weekDays.push({
      day: d.toLocaleDateString("en", { weekday: "short" }),
      date: d.getDate(),
      dateStr: d.toISOString().split("T")[0],
      isToday: i === 0,
    });
  }

  const [selectedDate, setSelectedDate] = useState(weekDays.find(d => d.isToday)?.dateStr || weekDays[0].dateStr);

  const todayStr = new Date().toISOString().split("T")[0];
  const todayAppointments = appointments
    .filter(a => a.appointment_date === selectedDate && ["pending", "confirmed"].includes(a.status))
    .sort((a, b) => (a.appointment_time || "").localeCompare(b.appointment_time || ""));

  const upcomingAppointments = appointments
    .filter(a => a.appointment_date > selectedDate && ["pending", "confirmed"].includes(a.status))
    .sort((a, b) => `${a.appointment_date}${a.appointment_time}`.localeCompare(`${b.appointment_date}${b.appointment_time}`))
    .slice(0, 4);

  const getAppointmentTypeInfo = (apt: any) => {
    if (apt.appointment_type === "online") return { icon: Video, label: "Video Call", color: "text-purple-500" };
    if (apt.appointment_type === "home_visit") return { icon: HomeIcon, label: "Home Visit", color: "text-orange-500", hasRoute: true };
    return { icon: Building2, label: "Clinic Visit", color: "text-blue-500" };
  };

  const handleCardClick = (apt: any) => {
    if (apt.appointment_type === "home_visit") {
      navigate("/vet-dashboard/home-visit-details", { state: { appointment: apt } });
    } else if (apt.appointment_type === "online") {
      navigate("/vet-dashboard/consultation-summary", { state: { appointment: apt } });
    } else {
      navigate("/vet-dashboard/visit-details", { state: { appointment: apt } });
    }
  };

  return (
    <div className="min-h-screen pb-24" style={{ background: "#F6F7FB" }}>
      {/* Header */}
      <div className="bg-white px-5 pt-5 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => onTabChange("overview")} className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-[20px] font-bold text-gray-900">Schedule</h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center"><Search className="w-5 h-5 text-gray-600" /></button>
          <button className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center"><Bell className="w-5 h-5 text-gray-600" /></button>
        </div>
      </div>

      {/* Date Strip */}
      <div className="px-5 py-4 flex gap-3 overflow-x-auto">
        {weekDays.map(d => (
          <button
            key={d.dateStr}
            onClick={() => setSelectedDate(d.dateStr)}
            className={`min-w-[62px] rounded-2xl py-3 text-center transition-all ${
              selectedDate === d.dateStr
                ? "text-white shadow-lg"
                : "bg-white border border-gray-100 text-gray-600"
            }`}
            style={selectedDate === d.dateStr ? { background: "linear-gradient(135deg, #8A3FFC, #C84BFF)" } : {}}
          >
            <p className={`text-[11px] font-medium ${selectedDate === d.dateStr ? "text-white/80" : "text-gray-400"}`}>{d.day}</p>
            <p className="text-[20px] font-bold">{d.date}</p>
          </button>
        ))}
      </div>

      {/* View Toggle */}
      <div className="px-5 mb-4">
        <div className="bg-gray-100 rounded-full p-1 flex">
          {(["day", "week"] as const).map(m => (
            <button
              key={m}
              onClick={() => setViewMode(m)}
              className={`flex-1 py-2 rounded-full text-[13px] font-semibold transition-all capitalize ${
                viewMode === m ? "bg-white text-purple-600 shadow-sm" : "text-gray-500"
              }`}
            >
              {m === "day" ? "Day View" : "Week View"}
            </button>
          ))}
        </div>
      </div>

      {/* Today's Appointments */}
      <div className="px-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-[18px] font-bold text-gray-900">Today's Appointments</h3>
          <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 text-[12px] font-bold flex items-center justify-center">
            {todayAppointments.length}
          </span>
        </div>

        {todayAppointments.length === 0 ? (
          <div className="bg-white rounded-[20px] p-6 text-center shadow-sm">
            <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-[13px] text-gray-400">No appointments for this date</p>
          </div>
        ) : (
          <div className="space-y-4">
            {todayAppointments.map(apt => {
              const typeInfo = getAppointmentTypeInfo(apt);
              const isHomeVisit = apt.appointment_type === "home_visit";
              return (
                <div key={apt.id} className="bg-white rounded-[20px] p-5 shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
                  {/* Expiry badge */}
                  <div className="flex justify-end mb-2">
                    <div className="flex items-center gap-1.5 bg-green-50 text-green-600 px-3 py-1 rounded-lg">
                      <Timer className="w-3.5 h-3.5" />
                      <span className="text-[12px] font-bold">EXPIRES IN 49S</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 mb-3">
                    <div className="w-20 h-20 rounded-2xl bg-gray-100 overflow-hidden">
                      <img
                        src={`https://images.unsplash.com/photo-${apt.pet_type === "cat" ? "1514888286974-6c03e2ca1dba" : "1587300003388-59208cc962cb"}?w=200&h=200&fit=crop`}
                        alt={apt.pet_name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-[18px] font-bold text-gray-900">{apt.pet_name}</h4>
                      <p className="text-[12px] text-gray-400 uppercase font-semibold">
                        {apt.pet_breed || apt.pet_type} • {Math.floor((apt.age_months || 24) / 12)}Y
                      </p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[12px]">👤</span>
                        <span className="text-[13px] text-gray-500">{apt.owner_name || "Pet Owner"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 bg-gray-50 rounded-full px-3 py-1.5">
                      <Clock className="w-4 h-4 text-purple-500" />
                      <span className="text-[13px] font-semibold text-gray-700">{apt.appointment_time} AM</span>
                    </div>
                    <button
                      className="flex-1 py-2.5 rounded-full text-[13px] font-semibold text-white text-center"
                      style={{ background: "linear-gradient(135deg, #8A3FFC, #C84BFF)" }}
                      onClick={() => handleCardClick(apt)}
                    >
                      {isHomeVisit ? "View Route" : "View Details"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Upcoming */}
      <div className="px-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[18px] font-bold text-gray-900">Upcoming</h3>
          <button className="text-[13px] font-semibold text-purple-500">See all</button>
        </div>
        <div className="space-y-3">
          {upcomingAppointments.map(apt => {
            const typeInfo = getAppointmentTypeInfo(apt);
            return (
              <div
                key={apt.id}
                className="bg-white rounded-[16px] p-4 flex items-center gap-3.5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] cursor-pointer active:scale-[0.98] transition-transform"
                onClick={() => handleCardClick(apt)}
              >
                <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center overflow-hidden">
                  <PawPrint className="w-6 h-6 text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-semibold text-gray-900">{apt.pet_name}</p>
                  <div className="flex items-center gap-1.5 text-[12px] text-gray-400">
                    <typeInfo.icon className={`w-3.5 h-3.5 ${typeInfo.color}`} />
                    <span>{apt.pet_type || "Pet"}</span>
                    <span>•</span>
                    <span>{apt.appointment_time}</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white z-50 border-t border-gray-100" style={{ borderTopLeftRadius: "20px", borderTopRightRadius: "20px", boxShadow: "0 -4px 20px rgba(0,0,0,0.06)" }}>
        <div className="flex justify-around py-2.5 px-2">
          {[
            { id: "overview", icon: HomeIcon, label: "Home" },
            { id: "schedule", icon: Calendar, label: "Schedule" },
            { id: "earnings", icon: DollarSign, label: "Earnings" },
            { id: "profile", icon: User, label: "Profile" },
          ].map(item => (
            <button key={item.id} className="flex flex-col items-center gap-0.5 py-1 px-3 min-w-[60px]" onClick={() => onTabChange(item.id)}>
              <item.icon className="w-5 h-5" style={{ color: item.id === "schedule" ? "#8A3FFC" : "#B0B5C3" }} />
              <span className="text-[10px] font-semibold" style={{ color: item.id === "schedule" ? "#8A3FFC" : "#B0B5C3" }}>{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default VetSchedule;
