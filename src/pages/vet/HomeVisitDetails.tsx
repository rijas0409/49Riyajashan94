import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  CaretLeft, DotsThreeVertical, MapPin, Clock, 
  Phone, Syringe, Info, NavigationArrow, 
  CheckCircle, Warning, Play, House, 
  CalendarDots, Wallet, User 
} from "@phosphor-icons/react";

interface HomeVisitDetailsState {
  visit: {
    id: string | number;
    petName: string;
    petBreed: string;
    petAge: string;
    ownerName: string;
    ownerPhone: string;
    address: string;
    time: string;
    reason: string;
    image: string;
    distance: string;
  };
}

const HomeVisitDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { visit } = (location.state as HomeVisitDetailsState) || {
    visit: {
      id: "HV-123",
      petName: "Bella",
      petBreed: "Golden Retriever • 3 Years",
      ownerName: "Mark Thompson",
      ownerPhone: "+1 (555) 234-5678",
      address: "124 Maple Street, Apt 4B",
      time: "Today, 11:30 AM (In 20 mins)",
      reason: "Home Vaccination",
      image: "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=300&q=80",
      distance: "2.4 MILES AWAY"
    }
  };

  return (
    <div className="bg-[#f8f9fb] min-h-screen pb-44 font-sans text-[#1a1c3d]">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-5 sticky top-0 bg-[#f8f9fb]/80 backdrop-blur-md z-50">
        <button 
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full border border-[#f0f0f5] bg-white flex items-center justify-center text-[#1a1c3d]"
        >
          <CaretLeft size={20} weight="bold" />
        </button>
        <h1 className="text-lg font-bold">Visit Details</h1>
        <button className="w-10 h-10 rounded-full border border-[#f0f0f5] bg-white flex items-center justify-center text-[#1a1c3d]">
          <DotsThreeVertical size={20} weight="bold" />
        </button>
      </header>

      {/* Pet Profile */}
      <div className="text-center mb-6 mt-2">
        <div className="relative w-[120px] h-[120px] mx-auto mb-4">
          <img 
            src={visit.image} 
            alt={visit.petName} 
            className="w-full h-full rounded-full object-cover border-4 border-white shadow-lg"
          />
          <div className="absolute bottom-2 right-2 w-5 h-5 bg-[#27c671] border-[3px] border-white rounded-full" />
        </div>
        <h2 className="text-[28px] font-extrabold mb-1">{visit.petName}</h2>
        <p className="text-[15px] text-[#9ba1b9] font-medium mb-3">{visit.petBreed}</p>
        <div className="inline-flex items-center gap-1.5 bg-[#f4e8ff] text-[#a347ff] px-4 py-1.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider">
          <span className="w-1.5 h-1.5 bg-[#a347ff] rounded-full" />
          Confirmed
        </div>
      </div>

      {/* Navigation Card */}
      <div className="bg-white mx-5 mb-4 rounded-[30px] shadow-[0_10px_25px_rgba(157,52,218,0.05)] overflow-hidden">
        <div className="p-5 pb-2.5 flex justify-between items-start">
          <span className="text-[12px] font-extrabold text-[#bdc3d1] uppercase tracking-wider">
            Navigation to<br />Owner
          </span>
          <span className="text-[12px] font-extrabold text-[#a347ff] text-right line-height-1.4">
            {visit.distance}
          </span>
        </div>
        <div className="h-[180px] bg-[#eef2f6] relative">
          {/* Simple Route Visualization */}
          <svg className="absolute inset-0 w-full h-full p-10" viewBox="0 0 200 100">
            <path 
              d="M 20 80 H 60 V 40 H 160" 
              fill="none" 
              stroke="#a347ff" 
              strokeWidth="4" 
              strokeLinecap="round"
            />
            <circle cx="20" cy="80" r="4" fill="#3b82f6" />
            <circle cx="160" cy="40" r="4" fill="#a347ff" />
          </svg>
          <button className="absolute bottom-4 right-4 bg-[#a347ff] text-white px-5 py-3 rounded-full text-[13px] font-bold flex items-center gap-2 shadow-[0_8px_20px_rgba(163,71,255,0.3)] hover:scale-105 active:scale-95 transition-all">
            <NavigationArrow size={18} weight="fill" />
            Start Navigation
          </button>
        </div>
      </div>

      {/* Visit Information */}
      <div className="bg-white mx-5 mb-4 rounded-[30px] p-5 shadow-[0_10px_25px_rgba(157,52,218,0.05)]">
        <div className="flex justify-between items-center mb-4">
          <span className="text-[12px] font-extrabold text-[#bdc3d1] uppercase tracking-wider">Visit Information</span>
          <Info size={18} className="text-[#a347ff]" weight="fill" />
        </div>
        <div className="space-y-5">
          <div className="flex gap-4">
            <div className="w-11 h-11 rounded-[14px] bg-[#f1f4ff] flex items-center justify-center text-[#a347ff]">
              <House size={22} weight="fill" />
            </div>
            <div>
              <p className="text-[11px] text-[#9ba1b9] font-semibold mb-1">Visit Type</p>
              <p className="text-[15px] font-bold">Home Visit</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-11 h-11 rounded-[14px] bg-[#f1f4ff] flex items-center justify-center text-[#a347ff]">
              <Syringe size={22} weight="fill" />
            </div>
            <div>
              <p className="text-[11px] text-[#9ba1b9] font-semibold mb-1">Reason for Visit</p>
              <p className="text-[15px] font-bold">{visit.reason}</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-11 h-11 rounded-[14px] bg-[#f1f4ff] flex items-center justify-center text-[#a347ff]">
              <Clock size={22} weight="fill" />
            </div>
            <div>
              <p className="text-[11px] text-[#9ba1b9] font-semibold mb-1">Scheduled Time</p>
              <p className="text-[15px] font-bold">
                {visit.time.split(' (')[0]} <span className="text-[#a347ff] text-xs font-semibold ml-1">{visit.time.includes('(') ? `(${visit.time.split('(')[1]}` : ''}</span>
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-11 h-11 rounded-[14px] bg-[#f1f4ff] flex items-center justify-center text-[#a347ff]">
              <MapPin size={22} weight="fill" />
            </div>
            <div>
              <p className="text-[11px] text-[#9ba1b9] font-semibold mb-1">Owner Address</p>
              <p className="text-[15px] font-bold">{visit.address}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Owner Info */}
      <div className="bg-white mx-5 mb-4 rounded-[30px] p-5 shadow-[0_10px_25px_rgba(157,52,218,0.05)]">
        <span className="text-[12px] font-extrabold text-[#bdc3d1] uppercase tracking-wider block mb-4">Owner Information</span>
        <div className="flex items-center gap-3">
          <img 
            src="https://i.pravatar.cc/150?u=mark" 
            className="w-12 h-12 rounded-full object-cover" 
            alt={visit.ownerName} 
          />
          <div className="flex-1">
            <h4 className="text-base font-bold">{visit.ownerName}</h4>
            <p className="text-[13px] text-[#9ba1b9] font-medium">{visit.ownerPhone}</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-[#f4e8ff] text-[#a347ff] flex items-center justify-center cursor-pointer active:scale-95 transition-all">
            <Phone size={18} weight="fill" />
          </div>
        </div>
      </div>

      {/* Medical Background */}
      <div className="bg-white mx-5 mb-4 rounded-[30px] p-5 shadow-[0_10px_25px_rgba(157,52,218,0.05)]">
        <span className="text-[12px] font-extrabold text-[#bdc3d1] uppercase tracking-wider block mb-4">Medical Background</span>
        <div className="space-y-4">
          <div className="flex gap-3 items-start">
            <CheckCircle size={18} weight="fill" className="text-[#27c671] mt-0.5" />
            <p className="text-sm font-medium text-[#4a4d61]">Last Deworming: 2 months ago (Up to date)</p>
          </div>
          <div className="flex gap-3 items-start">
            <CheckCircle size={18} weight="fill" className="text-[#27c671] mt-0.5" />
            <p className="text-sm font-medium text-[#4a4d61]">Vaccination Status: All current</p>
          </div>
          <div className="flex gap-3 items-start">
            <Warning size={18} weight="fill" className="text-[#ffab00] mt-0.5" />
            <p className="text-sm font-medium text-[#4a4d61]">Allergy: Penicillin-based antibiotics</p>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="fixed bottom-0 left-0 w-full max-w-7xl mx-auto px-5 pt-5 pb-32 bg-gradient-to-t from-[#f8f9fb] via-[#f8f9fb] to-transparent z-40 pointer-events-none">
        <div className="pointer-events-auto">
          <button className="w-full h-14 rounded-full bg-gradient-to-r from-[#8b2cf5] to-[#bc5cff] text-white text-base font-bold flex items-center justify-center gap-2.5 shadow-[0_8px_20px_rgba(163,71,255,0.3)] mb-3 active:scale-[0.98] transition-all">
            <Play size={20} weight="fill" />
            Start Consultation
          </button>
          <button className="w-full h-14 rounded-full bg-[#f0f3f8] text-[#4a4d61] text-base font-bold active:scale-[0.98] transition-all">
            View Medical History
          </button>
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-sm flex justify-center z-50 border-t border-gray-50/50 pb-safe shadow-[0_-5px_20px_rgba(0,0,0,0.03)] rounded-t-[25px]">
        <div className="w-full max-w-7xl flex justify-between px-6 pt-4 pb-7">
          <button className="flex flex-col items-center gap-1.5 text-[#b5b5c3] font-extrabold text-[9px] tracking-[0.5px] w-[60px]" onClick={() => navigate("/vet/home")}>
            <House size={24} weight="bold" />
            HOME
          </button>
          <button className="flex flex-col items-center gap-1.5 text-[#a428ff] font-extrabold text-[9px] tracking-[0.5px] w-[60px]" onClick={() => navigate("/vet/schedule")}>
            <CalendarDots size={24} weight="fill" />
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

export default HomeVisitDetails;
