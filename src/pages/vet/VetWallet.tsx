import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CaretLeft, Wallet, CurrencyInr, ChartLineUp, Megaphone } from "@phosphor-icons/react";

const VetWallet = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"payouts" | "ads">("payouts");

  return (
    <div className="bg-[#FDFBFF] min-h-screen pb-24 font-sans text-slate-900 selection:bg-purple-100">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md px-4 py-4 flex items-center border-b border-transparent">
        <button onClick={() => navigate(-1)} className="p-2 text-slate-700 hover:bg-slate-50 rounded-full transition-colors mr-4">
          <CaretLeft size={24} weight="bold" />
        </button>
        <h1 className="text-xl font-bold text-slate-900">Wallet</h1>
      </header>

      <main className="max-w-md mx-auto px-5 pt-6">
        <div className="flex bg-slate-100 rounded-2xl p-1 mb-6">
          <button 
            onClick={() => setActiveTab("payouts")}
            className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${activeTab === "payouts" ? "bg-white shadow-sm text-purple-600" : "text-slate-500 hover:text-slate-700"}`}
          >
            Payouts
          </button>
          <button 
            onClick={() => setActiveTab("ads")}
            className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${activeTab === "ads" ? "bg-white shadow-sm text-purple-600" : "text-slate-500 hover:text-slate-700"}`}
          >
            Ads Wallet
          </button>
        </div>

        {activeTab === "payouts" ? (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-[#9A3EF8] to-[#8E2DE2] rounded-[2rem] p-6 text-white shadow-lg shadow-purple-200">
              <div className="flex items-center justify-between mb-4 opacity-90">
                <span className="font-semibold text-sm uppercase tracking-wider">Available for Payout</span>
                <Wallet size={24} weight="fill" />
              </div>
              <h2 className="text-4xl font-extrabold flex items-center">
                <CurrencyInr size={32} weight="bold" />
                0.00
              </h2>
              <button className="w-full mt-6 bg-white/20 hover:bg-white/30 text-white font-bold py-3.5 rounded-2xl backdrop-blur-md transition-colors border border-white/20 active:scale-95">
                Withdraw Funds
              </button>
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-4">Recent Payouts</h3>
              <div className="bg-white rounded-2xl p-8 text-center shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col items-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-3">
                  <ChartLineUp size={32} weight="bold" />
                </div>
                <p className="text-slate-500 font-medium">No payout history yet</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-pink-500 to-rose-500 rounded-[2rem] p-6 text-white shadow-lg shadow-pink-200">
              <div className="flex items-center justify-between mb-4 opacity-90">
                <span className="font-semibold text-sm uppercase tracking-wider">Ads Balance</span>
                <Megaphone size={24} weight="fill" />
              </div>
              <h2 className="text-4xl font-extrabold flex items-center">
                <CurrencyInr size={32} weight="bold" />
                0.00
              </h2>
              <button className="w-full mt-6 bg-white/20 hover:bg-white/30 text-white font-bold py-3.5 rounded-2xl backdrop-blur-md transition-colors border border-white/20 active:scale-95">
                Add Funds
              </button>
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-4">Ads Transactions</h3>
              <div className="bg-white rounded-2xl p-8 text-center shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col items-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-3">
                  <Megaphone size={32} weight="bold" />
                </div>
                <p className="text-slate-500 font-medium">No transactions yet</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default VetWallet;
