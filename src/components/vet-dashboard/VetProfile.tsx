import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, MoreVertical, Edit, Star, ChevronRight, Briefcase, Phone, Wallet, FileText, Megaphone, MessageSquare, Settings, LogOut, Home as HomeIcon, Calendar, DollarSign, User } from "lucide-react";

interface Props {
  profile: any;
  vetProfile: any;
  earnings: any[];
  reviews: any[];
  onTabChange: (tab: string) => void;
}

const VetProfile = ({ profile, vetProfile, earnings, reviews, onTabChange }: Props) => {
  const navigate = useNavigate();

  const totalEarnings = earnings.reduce((s, e) => s + Number(e.net_amount), 0);
  const pendingEarnings = earnings.filter(e => e.payout_status === "pending").reduce((s, e) => s + Number(e.net_amount), 0);
  const last7Days = earnings
    .filter(e => new Date(e.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
    .reduce((s, e) => s + Number(e.net_amount), 0);

  const avgRating = vetProfile?.average_rating || (reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : "4.9");
  const doctorName = profile?.full_name || profile?.name || "Doctor";

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth-vet");
  };

  const menuItems = [
    { icon: Briefcase, label: "My Services", color: "bg-purple-50 text-purple-500" },
    { icon: Phone, label: "Contact Details", color: "bg-blue-50 text-blue-500" },
    { icon: Wallet, label: "Wallet", color: "bg-green-50 text-green-500" },
    { icon: FileText, label: "Documents", color: "bg-amber-50 text-amber-500" },
    { icon: Megaphone, label: "Promote Profile", color: "bg-pink-50 text-pink-500" },
    { icon: MessageSquare, label: "Recent Reviews", color: "bg-indigo-50 text-indigo-500" },
    { icon: Settings, label: "Settings", color: "bg-gray-50 text-gray-500" },
  ];

  return (
    <div className="min-h-screen pb-24" style={{ background: "#F6F7FB" }}>
      {/* Header */}
      <div className="bg-white px-5 pt-5 pb-4 flex items-center justify-between">
        <button onClick={() => onTabChange("overview")} className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <h1 className="text-[20px] font-bold text-gray-900">Profile</h1>
        <button className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
          <MoreVertical className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Profile Hero */}
      <div className="px-5 py-6">
        <div className="flex flex-col items-center text-center mb-5">
          <div className="w-28 h-28 rounded-full overflow-hidden mb-3 border-4 border-white shadow-lg bg-gradient-to-br from-teal-200 to-teal-400">
            {vetProfile?.profile_photo ? (
              <img src={vetProfile.profile_photo} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white text-3xl font-bold">
                {doctorName.charAt(0)}
              </div>
            )}
          </div>
          <h2 className="text-[22px] font-bold text-gray-900">Dr. {doctorName}</h2>
          <p className="text-[14px] text-purple-500 font-medium">{vetProfile?.qualification || "Senior Veterinarian"}</p>
          <div className="flex items-center gap-1 mt-1">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span className="text-[14px] font-semibold text-gray-700">{avgRating}</span>
            <span className="text-[13px] text-gray-400">({reviews.length || 128} reviews)</span>
          </div>
        </div>

        {/* Edit Profile Button */}
        <button
          className="w-full py-3 rounded-2xl text-white font-semibold text-[15px] flex items-center justify-center gap-2 mb-5"
          style={{ background: "linear-gradient(135deg, #8A3FFC, #C84BFF)" }}
        >
          <Edit className="w-4 h-4" />
          Edit Profile
        </button>

        {/* Earnings Card */}
        <div className="bg-purple-50 rounded-[20px] p-5 mb-5 border border-purple-100">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-[11px] text-gray-400 uppercase font-semibold tracking-wide">Total Earnings</p>
              <p className="text-[28px] font-bold text-gray-900">₹{totalEarnings.toLocaleString()}</p>
            </div>
            <button
              className="px-5 py-2 rounded-full text-white text-[13px] font-semibold"
              style={{ background: "linear-gradient(135deg, #8A3FFC, #C84BFF)" }}
            >
              Withdraw
            </button>
          </div>
          <div className="border-t border-purple-200 pt-2 flex gap-6">
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-semibold">Pending</p>
              <p className="text-[15px] font-bold text-purple-600">₹{pendingEarnings.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase font-semibold">Last 7 Days</p>
              <p className="text-[15px] font-bold text-green-600">+₹{last7Days.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="space-y-2">
          {menuItems.map(item => (
            <button
              key={item.label}
              className="w-full bg-white rounded-[16px] p-4 flex items-center gap-3.5 shadow-[0_1px_8px_rgba(0,0,0,0.04)] active:scale-[0.98] transition-transform"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.color.split(" ")[0]}`}>
                <item.icon className={`w-5 h-5 ${item.color.split(" ")[1]}`} />
              </div>
              <span className="flex-1 text-left text-[15px] font-semibold text-gray-800">{item.label}</span>
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </button>
          ))}

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full bg-white rounded-[16px] p-4 flex items-center gap-3.5 shadow-[0_1px_8px_rgba(0,0,0,0.04)] active:scale-[0.98] transition-transform"
          >
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
              <LogOut className="w-5 h-5 text-red-500" />
            </div>
            <span className="flex-1 text-left text-[15px] font-semibold text-red-500">Logout</span>
            <ChevronRight className="w-4 h-4 text-gray-300" />
          </button>
        </div>
      </div>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white z-50 border-t border-gray-100" style={{ borderTopLeftRadius: "20px", borderTopRightRadius: "20px", boxShadow: "0 -4px 20px rgba(0,0,0,0.06)" }}>
        <div className="flex justify-around py-2.5 px-2">
          {[
            { id: "overview", icon: HomeIcon, label: "HOME" },
            { id: "schedule", icon: Calendar, label: "SCHEDULE" },
            { id: "earnings", icon: DollarSign, label: "EARNINGS" },
            { id: "profile", icon: User, label: "PROFILE" },
          ].map(item => (
            <button key={item.id} className="flex flex-col items-center gap-0.5 py-1 px-3 min-w-[60px]" onClick={() => onTabChange(item.id)}>
              <item.icon className="w-5 h-5" style={{ color: item.id === "profile" ? "#8A3FFC" : "#B0B5C3" }} />
              <span className="text-[10px] font-semibold" style={{ color: item.id === "profile" ? "#8A3FFC" : "#B0B5C3" }}>{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default VetProfile;
