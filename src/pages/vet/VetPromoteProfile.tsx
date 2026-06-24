import React from "react";
import { useNavigate } from "react-router-dom";
import { CaretLeft, Megaphone, TrendUp, Users, Target } from "@phosphor-icons/react";

const VetPromoteProfile = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-[#FDFBFF] min-h-screen pb-24 font-sans text-slate-900 selection:bg-purple-100">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md px-4 py-4 flex items-center border-b border-transparent">
        <button onClick={() => navigate(-1)} className="p-2 text-slate-700 hover:bg-slate-50 rounded-full transition-colors mr-4">
          <CaretLeft size={24} weight="bold" />
        </button>
        <h1 className="text-xl font-bold text-slate-900">Promote Profile</h1>
      </header>

      <main className="max-w-md mx-auto px-5 pt-6">
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2rem] p-6 text-white mb-8 shadow-lg shadow-purple-200">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-sm">
            <Megaphone size={32} weight="fill" />
          </div>
          <h2 className="text-2xl font-extrabold mb-2">Reach more pet parents</h2>
          <p className="text-indigo-100 font-medium text-sm mb-6 leading-relaxed">
            Run targeted ads to appear at the top of search results in your city. Get more bookings and grow your practice.
          </p>
          <button className="bg-white text-purple-600 font-extrabold w-full py-4 rounded-2xl shadow-sm active:scale-95 transition-all text-sm sm:text-base">
            Start Campaign
          </button>
        </div>

        <h3 className="text-lg font-bold text-slate-900 mb-4 px-1">How it works</h3>
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-slate-100 flex gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
              <Target size={20} weight="bold" />
            </div>
            <div>
              <p className="font-bold text-slate-900 mb-1">Targeted Reach</p>
              <p className="text-sm text-slate-500 font-medium">Your profile will be shown to pet parents actively searching in your selected locations.</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-slate-100 flex gap-4">
            <div className="w-10 h-10 rounded-full bg-pink-50 text-pink-500 flex items-center justify-center shrink-0">
              <TrendUp size={20} weight="bold" />
            </div>
            <div>
              <p className="font-bold text-slate-900 mb-1">Top Placement</p>
              <p className="text-sm text-slate-500 font-medium">Get featured at the top of the "Vets Near You" section with a sponsored badge.</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-slate-100 flex gap-4">
            <div className="w-10 h-10 rounded-full bg-green-50 text-green-500 flex items-center justify-center shrink-0">
              <Users size={20} weight="bold" />
            </div>
            <div>
              <p className="font-bold text-slate-900 mb-1">More Consultations</p>
              <p className="text-sm text-slate-500 font-medium">Promoted profiles receive up to 3x more consultation requests on average.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default VetPromoteProfile;
