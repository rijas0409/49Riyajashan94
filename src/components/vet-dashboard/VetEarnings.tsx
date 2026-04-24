import { useState } from "react";
import { Search, SlidersHorizontal, Video, Building2, Home as HomeIcon, Calendar, DollarSign, User, Settings, TrendingUp } from "lucide-react";

interface Props {
  earnings: any[];
  appointments: any[];
  onTabChange: (tab: string) => void;
}

const VetEarnings = ({ earnings, appointments, onTabChange }: Props) => {
  const [filter, setFilter] = useState("week");
  const [searchQuery, setSearchQuery] = useState("");

  const totalEarnings = earnings.reduce((s, e) => s + Number(e.net_amount), 0);
  const todayStr = new Date().toISOString().split("T")[0];
  const todayEarnings = earnings
    .filter(e => new Date(e.created_at).toISOString().split("T")[0] === todayStr)
    .reduce((s, e) => s + Number(e.net_amount), 0);

  const completedAppointments = appointments.filter(a => a.status === "completed").length;

  const getTransactionIcon = (earning: any) => {
    const apt = appointments.find(a => a.id === earning.appointment_id);
    if (apt?.appointment_type === "online") return { icon: Video, color: "bg-blue-50 text-blue-500" };
    if (apt?.appointment_type === "home_visit") return { icon: HomeIcon, color: "bg-orange-50 text-orange-500" };
    return { icon: Building2, color: "bg-purple-50 text-purple-500" };
  };

  const getTransactionLabel = (earning: any) => {
    const apt = appointments.find(a => a.id === earning.appointment_id);
    if (!apt) return "Consultation";
    const typeLabel = apt.appointment_type === "online" ? "Video Call" : apt.appointment_type === "home_visit" ? "Home Visit" : "Clinic Visit";
    return `${apt.pet_name} (${typeLabel})`;
  };

  return (
    <div className="min-h-screen pb-24" style={{ background: "#F6F7FB" }}>
      {/* Header */}
      <div className="px-5 pt-6 pb-4 flex items-center justify-between">
        <h1 className="text-[26px] font-bold text-gray-900">Earnings</h1>
        <button className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center">
          <Settings className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Earnings Card */}
      <div className="px-5 mb-5">
        <div
          className="rounded-[20px] p-6 relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #8A3FFC 0%, #C84BFF 50%, #FF6FD8 100%)", boxShadow: "0 8px 32px rgba(138,63,252,0.35)" }}
        >
          <div className="flex items-center justify-between mb-1">
            <p className="text-[12px] text-white/70 uppercase tracking-wider font-semibold">Total Earnings</p>
            <div className="flex items-center gap-1 bg-white/20 rounded-full px-2.5 py-1">
              <TrendingUp className="w-3.5 h-3.5 text-white" />
              <span className="text-[12px] text-white font-semibold">+12%</span>
            </div>
          </div>
          <p className="text-[36px] font-bold text-white mb-4">₹{totalEarnings.toLocaleString()}</p>
          <div className="border-t border-white/20 pt-3 flex gap-8">
            <div>
              <p className="text-[10px] text-white/60 uppercase font-semibold tracking-wide">Today's Earnings</p>
              <p className="text-[18px] font-bold text-white">₹{todayEarnings.toLocaleString()}</p>
            </div>
            <div className="border-l border-white/20 pl-8">
              <p className="text-[10px] text-white/60 uppercase font-semibold tracking-wide">Appointments</p>
              <p className="text-[18px] font-bold text-white">{completedAppointments}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="px-5 mb-4">
        <div className="bg-gray-100 rounded-full p-1 flex">
          {[
            { key: "today", label: "Today" },
            { key: "week", label: "This Week" },
            { key: "month", label: "This Month" },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`flex-1 py-2 rounded-full text-[13px] font-semibold transition-all ${
                filter === f.key ? "bg-white text-purple-600 shadow-sm" : "text-gray-500"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="px-5 mb-4 flex gap-3">
        <div className="flex-1 bg-white rounded-2xl px-4 py-3 flex items-center gap-2 shadow-sm">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search transactions"
            className="bg-transparent outline-none text-[14px] text-gray-700 flex-1"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <button className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center">
          <SlidersHorizontal className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Transactions */}
      <div className="px-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[18px] font-bold text-gray-900">Recent Transactions</h3>
          <button className="text-[12px] font-bold text-purple-500 uppercase tracking-wide">View All</button>
        </div>

        {earnings.length === 0 ? (
          <div className="bg-white rounded-[20px] p-8 text-center shadow-sm">
            <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-[14px]">No earnings yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {earnings.slice(0, 10).map(earning => {
              const { icon: Icon, color } = getTransactionIcon(earning);
              const label = getTransactionLabel(earning);
              const date = new Date(earning.created_at);
              const isToday = date.toISOString().split("T")[0] === todayStr;
              const status = earning.payout_status;

              return (
                <div key={earning.id} className="bg-white rounded-[16px] p-4 flex items-center gap-3.5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color.split(" ")[0]}`}>
                    <Icon className={`w-5 h-5 ${color.split(" ")[1]}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-bold text-gray-900 truncate">{label}</p>
                    <p className="text-[12px] text-gray-400">
                      {isToday ? "Today" : "Yesterday"}, {date.toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[16px] font-bold text-gray-900">₹{Number(earning.net_amount).toLocaleString()}</p>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      status === "completed" ? "bg-green-50 text-green-600" : "bg-orange-50 text-orange-500"
                    }`}>
                      {(status || "pending").toUpperCase()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
              <item.icon className="w-5 h-5" style={{ color: item.id === "earnings" ? "#8A3FFC" : "#B0B5C3" }} />
              <span className="text-[10px] font-semibold" style={{ color: item.id === "earnings" ? "#8A3FFC" : "#B0B5C3" }}>{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default VetEarnings;
