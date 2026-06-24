import React from "react";
import { useNavigate } from "react-router-dom";
import { CaretLeft, Star, ChatTeardropText } from "@phosphor-icons/react";

const VetRecentReviews = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-[#FDFBFF] min-h-screen pb-24 font-sans text-slate-900 selection:bg-purple-100">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md px-4 py-4 flex items-center justify-between border-b border-transparent">
        <div className="flex items-center">
          <button onClick={() => navigate(-1)} className="p-2 text-slate-700 hover:bg-slate-50 rounded-full transition-colors mr-4">
            <CaretLeft size={24} weight="bold" />
          </button>
          <h1 className="text-xl font-bold text-slate-900">Recent Reviews</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-5 pt-6">
        <div className="bg-white rounded-[2rem] p-6 text-center shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-slate-100 mb-8">
          <h2 className="text-5xl font-extrabold text-slate-900 mb-2">5.0</h2>
          <div className="flex items-center justify-center gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} size={24} weight="fill" className="text-yellow-400" />
            ))}
          </div>
          <p className="text-slate-500 font-medium">Based on 0 reviews</p>
        </div>

        <div className="bg-white rounded-2xl p-8 text-center shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col items-center">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
            <ChatTeardropText size={32} weight="bold" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">No Reviews Yet</h3>
          <p className="text-slate-500 font-medium text-sm">When pet parents leave reviews for your consultations, they will appear here.</p>
        </div>
      </main>
    </div>
  );
};

export default VetRecentReviews;
