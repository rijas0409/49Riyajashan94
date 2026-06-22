import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Gear, ArrowUpRight, MagnifyingGlass, Funnel,
  VideoCamera, Buildings, House, Plus,
  HouseLine, CalendarDots, Wallet, User,
  CaretRight
} from "@phosphor-icons/react";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import SplashScreen from "@/components/SplashScreen";

const VetEarnings = () => {
  const navigate = useNavigate();
  const { isLoading: guardLoading, showSpinner } = useRoleGuard(["vet"], "/auth/vet", true);
  const [activeTab, setActiveTab] = useState("This Week");

  const transactions = [
    {
      id: 1,
      title: "Buddy (Video Call)",
      time: "Today, 10:30 AM",
      amount: "₹1,200",
      status: "COMPLETED",
      type: "video",
      iconColor: "bg-[#E5EFFF]",
      icon: <VideoCamera size={22} weight="fill" className="text-[#267BF6]" />
    },
    {
      id: 2,
      title: "Max (Clinic Visit)",
      time: "Today, 09:15 AM",
      amount: "₹850",
      status: "COMPLETED",
      type: "clinic",
      iconColor: "bg-[#F4E8FF]",
      icon: <Buildings size={22} weight="fill" className="text-[#9C2AF9]" />
    },
    {
      id: 3,
      title: "Luna (Home Visit)",
      time: "Yesterday, 04:30 PM",
      amount: "₹2,100",
      status: "PENDING",
      type: "home",
      iconColor: "bg-[#FFEDD6]",
      icon: <HouseLine size={22} weight="fill" className="text-[#F97116]" />
    }
  ];

  if (showSpinner) {
    return <SplashScreen message="Loading earnings..." />;
  }

  const hasCache = localStorage.getItem("sruvo_user_role") === "vet";
  if (guardLoading && !hasCache) {
    return null;
  }

  return (
    <div className="bg-[#F7F8FC] min-h-screen pb-32 font-sans text-[#1A1A2A] overflow-x-hidden selection:bg-purple-100">
      {/* Header */}
      <header className="flex justify-between items-center px-6 pt-8 pb-5 max-w-7xl mx-auto w-full">
        <h1 className="text-[26px] font-extrabold tracking-tight">Earnings</h1>
        <button className="w-11 h-11 bg-white rounded-full flex justify-center items-center shadow-[0_4px_15px_rgba(0,0,0,0.04)] cursor-pointer active:scale-95 transition-all">
          <Gear size={22} weight="bold" />
        </button>
      </header>

      {/* Earnings Card */}
      <div className="px-6 max-w-7xl mx-auto">
        <div className="bg-gradient-to-br from-[#8E3EFE] to-[#AE50FF] rounded-[36px] p-7 md:p-10 text-white shadow-[0_15px_35px_rgba(142,62,254,0.25)] relative overflow-hidden group">
          {/* Watermark/SVG decoration */}
          <div className="absolute top-5 right-5 w-20 h-20 opacity-15 pointer-events-none transform group-hover:rotate-12 transition-transform duration-700">
             <div className="w-full h-full border-[10px] border-white rounded-2xl relative">
                <div className="absolute -top-4 -left-4 w-10 h-10 border-[8px] border-white rounded-full"></div>
             </div>
          </div>

          <div className="relative z-10 flex justify-between items-start">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider opacity-90">Total Earnings</p>
              <h2 className="text-[42px] font-extrabold mt-2 tracking-tight">₹45,250</h2>
            </div>
            <div className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1 font-bold text-xs">
              <ArrowUpRight size={14} weight="bold" />
              +12%
            </div>
          </div>

          <div className="h-[1px] bg-white/25 my-6"></div>

          <div className="relative z-10 flex items-center">
            <div className="flex-1 flex flex-col gap-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider opacity-90">Today's Earnings</p>
              <p className="text-xl font-bold">₹2,800</p>
            </div>
            <div className="flex-1 pl-5 border-l border-white/25 flex flex-col gap-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider opacity-90">Appointments</p>
              <p className="text-xl font-bold">14</p>
            </div>
          </div>
        </div>
      </div>

      {/* Time Tabs */}
      <div className="px-6 my-6 max-w-7xl mx-auto">
        <div className="bg-[#EFF0F5] p-1.5 rounded-[30px] flex gap-1">
          {["Today", "This Week", "This Month"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-sm font-bold rounded-[25px] transition-all duration-300 ${
                activeTab === tab 
                  ? "bg-white text-[#9A3EF8] shadow-[0_4px_10px_rgba(0,0,0,0.04)]" 
                  : "text-[#8A8D9F] hover:text-[#1A1A2A]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Search Section */}
      <div className="px-6 mb-8 flex gap-3 max-w-7xl mx-auto">
        <div className="flex-1 bg-white rounded-full flex items-center px-5 shadow-[0_4px_15px_rgba(0,0,0,0.02)] group focus-within:ring-2 focus-within:ring-[#9A3EF8]/20 transition-all">
          <MagnifyingGlass size={20} className="text-[#8A8D9F] group-focus-within:text-[#9A3EF8]" />
          <input 
            type="text" 
            placeholder="Search transactions" 
            className="flex-1 bg-transparent border-none outline-none py-4 px-3 text-sm font-medium text-[#1A1A2A] placeholder:text-[#A0A3B1]"
          />
        </div>
        <button className="w-[52px] h-[52px] bg-white rounded-full flex justify-center items-center shadow-[0_4px_15px_rgba(0,0,0,0.02)] active:scale-95 transition-all">
          <Funnel size={20} weight="bold" />
        </button>
      </div>

      {/* Transactions Section */}
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center px-6 mb-4">
          <h3 className="text-lg font-bold">Recent Transactions</h3>
          <button className="text-xs font-bold text-[#9A3EF8] tracking-wider uppercase hover:underline">View All</button>
        </div>

        <div className="px-6 flex flex-col gap-3.5">
          {transactions.map((t) => (
            <div key={t.id} className="bg-white p-4 rounded-[24px] flex items-center shadow-[0_4px_15px_rgba(0,0,0,0.02)] hover:scale-[1.01] transition-all cursor-pointer">
              <div className={`w-[50px] h-[50px] rounded-full flex items-center justify-center mr-4 shrink-0 ${t.iconColor}`}>
                {t.icon}
              </div>
              <div className="flex-1">
                <p className="text-[15px] font-bold text-[#1A1A2A]">{t.title}</p>
                <p className="text-xs font-medium text-[#8A8D9F] mt-1">{t.time}</p>
              </div>
              <div className="text-right flex flex-col items-end gap-1.5">
                <p className="text-[15px] font-extrabold text-[#1A1A2A]">{t.amount}</p>
                <span className={`text-[9px] font-black px-2.5 py-1 rounded-full tracking-[0.5px] ${
                  t.status === "COMPLETED" 
                    ? "bg-green-100 text-green-600" 
                    : "bg-orange-100 text-orange-600"
                }`}>
                  {t.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

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
          <button className="flex flex-col items-center gap-1.5 text-[#a428ff] font-extrabold text-[9px] tracking-[0.5px] w-[60px]" onClick={() => navigate("/vet/earnings")}>
            <Wallet size={24} weight="fill" />
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

export default VetEarnings;
