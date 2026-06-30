import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  CaretLeft, Megaphone, TrendUp, Users, Target, CurrencyInr, 
  X, CheckCircle, StopCircle, Plus, Wallet, MapPin, MapPinLine,
  CalendarBlank, ChartLineUp, Storefront, VideoCamera, HouseLine,
  ChartBar, Eye, CursorClick, CalendarCheck, Percent, CaretRight,
  Star
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import SplashScreen from "@/components/SplashScreen";

export default function VetPromoteProfile() {
  const navigate = useNavigate();
  const { user, isLoading: guardLoading } = useRoleGuard(["vet"], "/auth/vet");
  
  const [walletBalance, setWalletBalance] = useState(0);
  const [activeAds, setActiveAds] = useState<Record<string, unknown>[]>([]);
  const [fetchingData, setFetchingData] = useState(true);
  
  // Setup Modal State
  const [showModal, setShowModal] = useState(false);
  const [setupStep, setSetupStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Campaign Config
  const [campaignGoal, setCampaignGoal] = useState("");
  const [serviceArea, setServiceArea] = useState("");
  const [duration, setDuration] = useState("15 Days");
  const [customDuration, setCustomDuration] = useState("");
  const [audience, setAudience] = useState<string[]>(["Dog", "Cat"]);
  const [budgetPlan, setBudgetPlan] = useState<"Starter"|"Growth"|"Premium"|"Custom"|null>(null);
  const [customBudget, setCustomBudget] = useState("");
  
  const fetchDashboardData = async () => {
    try {
      setFetchingData(true);
      // Fetch Wallet
      const { data: walletData } = await supabase
        .from("wallets")
        .select("balance")
        .eq("user_id", user?.id)
        .maybeSingle();
        
      if (walletData) {
        setWalletBalance(walletData.balance || 0);
      }

      // Fetch Ads
      const { data: adsData } = await supabase
        .from("user_advertisements")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });
        
      if (adsData) {
        setActiveAds(adsData);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setFetchingData(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const getDailyBudget = () => {
    if (budgetPlan === "Starter") return 99;
    if (budgetPlan === "Growth") return 199;
    if (budgetPlan === "Premium") return 299;
    if (budgetPlan === "Custom" && customBudget) return Number(customBudget);
    return 0;
  };

  const getDurationDays = () => {
    if (duration === "7 Days") return 7;
    if (duration === "15 Days") return 15;
    if (duration === "30 Days") return 30;
    if (duration === "Custom" && customDuration) return Number(customDuration);
    return 15;
  };

  const estimatedSpend = getDailyBudget() * getDurationDays();

  const handleLaunchCampaign = async () => {
    if (walletBalance < estimatedSpend) {
      toast.error("Insufficient wallet balance.");
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await supabase.from("user_advertisements").insert({
        user_id: user?.id,
        title: campaignGoal || "Profile Promotion",
        ad_type: "profile_promotion",
        daily_cost: getDailyBudget(),
        status: "active",
        total_cost: estimatedSpend,
        start_date: new Date().toISOString(),
        description: JSON.stringify({
          serviceArea,
          duration: getDurationDays(),
          audience,
          budgetPlan
        })
      });
      
      if (error) throw error;
      
      await fetchDashboardData();
      setShowModal(false);
      resetSetup();
      toast.success("Campaign launched successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to launch campaign.");
    } finally {
      setLoading(false);
    }
  };

  const handleStopCampaign = async (id: string) => {
    try {
      const { error } = await supabase
        .from("user_advertisements")
        .update({ status: "completed", end_date: new Date().toISOString() })
        .eq("id", id);
        
      if (error) throw error;
      
      await fetchDashboardData();
      toast.success("Campaign stopped successfully.");
    } catch (error) {
      console.error(error);
      toast.error("Failed to stop campaign.");
    }
  };

  const resetSetup = () => {
    setSetupStep(1);
    setCampaignGoal("");
    setServiceArea("");
    setDuration("15 Days");
    setCustomDuration("");
    setAudience(["Dog", "Cat"]);
    setBudgetPlan(null);
    setCustomBudget("");
  };

  if (guardLoading || fetchingData) {
    return <SplashScreen message="Loading campaign dashboard..." />;
  }

  const runningAds = activeAds.filter(a => a.status === "active");
  const pastAds = activeAds.filter(a => a.status !== "active");

  return (
    <div className="bg-[#FDFBFF] min-h-screen pb-24 font-sans text-slate-900 selection:bg-purple-100">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md px-4 py-4 flex items-center border-b border-transparent">
        <button onClick={() => navigate("/vet/profile")} className="p-2 text-slate-700 hover:bg-slate-50 rounded-full transition-colors mr-4">
          <CaretLeft size={24} weight="bold" />
        </button>
        <h1 className="text-xl font-bold text-slate-900">Promote Profile</h1>
      </header>

      <main className="max-w-md mx-auto px-5 pt-6 space-y-8">
        
        {/* Ads Wallet Balance */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 text-white shadow-lg shadow-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-xs uppercase tracking-wider text-slate-300">Wallet Balance</span>
            <Wallet size={24} weight="fill" className="text-purple-400" />
          </div>
          <h2 className="text-4xl font-extrabold flex items-center mb-6">
            <CurrencyInr size={28} weight="bold" className="mr-1 opacity-80" />
            {walletBalance.toLocaleString('en-IN')}
          </h2>
          <div className="flex gap-3">
            <button 
              onClick={() => navigate("/vet/wallet")}
              className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-2xl backdrop-blur-md transition-all border border-white/10 active:scale-95 text-sm flex items-center justify-center gap-2"
            >
              <Plus size={16} weight="bold" /> Add Funds
            </button>
            <button 
              onClick={() => setShowModal(true)}
              className="flex-1 bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 rounded-2xl transition-all active:scale-95 text-sm flex items-center justify-center gap-2"
            >
              <Megaphone size={16} weight="bold" /> New Campaign
            </button>
          </div>
        </div>

        {/* Current Campaigns */}
        <div>
          <h3 className="text-lg font-bold text-slate-900 mb-4 px-1">Active Campaigns</h3>
          {runningAds.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-slate-100 shadow-sm flex flex-col items-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
                <ChartLineUp size={32} weight="bold" />
              </div>
              <h4 className="font-bold text-slate-900 mb-1">No Active Campaigns</h4>
              <p className="text-slate-500 text-sm font-medium mb-5">Start a campaign to boost your profile visibility.</p>
              <button 
                onClick={() => setShowModal(true)}
                className="bg-purple-50 text-purple-600 font-bold py-3 px-6 rounded-xl hover:bg-purple-100 transition-colors active:scale-95 text-sm"
              >
                Start Campaign
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {runningAds.map(ad => (
                <div key={ad.id} className="bg-white rounded-3xl p-5 border border-purple-100 shadow-[0_4px_20px_rgba(168,85,247,0.05)] relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                  
                  <div className="flex justify-between items-start mb-4 relative">
                    <div>
                      <h4 className="font-bold text-slate-900">{ad.title}</h4>
                      <p className="text-xs font-medium text-slate-500 mt-0.5">
                        {new Date(ad.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        {ad.end_date ? ` - ${new Date(ad.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}` : ' - Ongoing'}
                      </p>
                    </div>
                    <div className="bg-green-50 text-green-600 text-[10px] font-extrabold uppercase tracking-wider px-2 py-1 rounded-lg flex items-center gap-1.5 shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                      Running
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mb-5">
                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">Daily Budget</p>
                      <p className="font-extrabold text-slate-700 flex items-center">
                        <CurrencyInr size={14} weight="bold" /> {ad.daily_cost}
                      </p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">Spent So Far</p>
                      <p className="font-extrabold text-slate-700 flex items-center">
                        <CurrencyInr size={14} weight="bold" /> {ad.total_cost || 0}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 relative">
                    <button onClick={() => toast.info("Detailed analytics coming soon.")} className="flex-1 bg-slate-50 text-slate-600 font-bold py-2.5 rounded-xl hover:bg-slate-100 transition-colors text-sm flex justify-center items-center gap-2">
                      <ChartBar size={16} weight="bold" /> Analytics
                    </button>
                    <button 
                      onClick={() => handleStopCampaign(ad.id)}
                      className="bg-red-50 text-red-600 font-bold px-4 py-2.5 rounded-xl hover:bg-red-100 transition-colors text-sm flex justify-center items-center"
                    >
                      Stop
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Promotion Types Info */}
        <div className="pt-4">
          <h3 className="text-lg font-bold text-slate-900 mb-4 px-1">How Promotions Work</h3>
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex gap-4">
              <div className="w-10 h-10 rounded-full bg-yellow-50 text-yellow-600 flex items-center justify-center shrink-0">
                <Star size={20} weight="fill" />
              </div>
              <div>
                <p className="font-bold text-slate-900 mb-1">Featured Search</p>
                <p className="text-sm text-slate-500 font-medium">Appear at the top of vet search results with a Sponsored badge.</p>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                <MapPin size={20} weight="fill" />
              </div>
              <div>
                <p className="font-bold text-slate-900 mb-1">Nearby Boost</p>
                <p className="text-sm text-slate-500 font-medium">Get priority visibility when users look for "Vets near me".</p>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <TrendUp size={20} weight="fill" />
              </div>
              <div>
                <p className="font-bold text-slate-900 mb-1">Smart Match Priority Boost</p>
                <p className="text-sm text-slate-500 font-medium">Acts as a tie-breaker when your Smart Match score equals another vet's score.</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex gap-4">
              <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center shrink-0">
                <Target size={20} weight="fill" />
              </div>
              <div>
                <p className="font-bold text-slate-900 mb-1">Category Boost</p>
                <p className="text-sm text-slate-500 font-medium">Rank higher when users search for your specific specializations.</p>
              </div>
            </div>
          </div>
        </div>

      </main>

      {/* Setup Campaign Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-[#FDFBFF] animate-in slide-in-from-bottom-full duration-300">
          <header className="bg-white px-4 py-4 flex items-center justify-between border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-3">
              {setupStep > 1 && (
                <button onClick={() => setSetupStep(prev => prev - 1)} className="p-1 text-slate-700 hover:bg-slate-50 rounded-full">
                  <CaretLeft size={24} weight="bold" />
                </button>
              )}
              <h3 className="font-bold text-lg text-slate-900">
                {setupStep === 1 && "Campaign Goal"}
                {setupStep === 2 && "Target Audience"}
                {setupStep === 3 && "Service Area"}
                {setupStep === 4 && "Duration"}
                {setupStep === 5 && "Budget"}
                {setupStep === 6 && "Summary"}
              </h3>
            </div>
            <button onClick={() => { setShowModal(false); resetSetup(); }} className="p-2 text-slate-500 bg-slate-50 rounded-full hover:bg-slate-100">
              <X size={16} weight="bold" />
            </button>
          </header>

          <div className="flex-1 overflow-y-auto p-5 pb-24">
            
            {/* Step 1: Goal */}
            {setupStep === 1 && (
              <div className="space-y-3">
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 px-1">What do you want to achieve?</p>
                {[
                  { id: "Featured in Search Results", icon: <Star size={24} weight="fill" className="text-yellow-500" /> },
                  { id: "Top Vet in Nearby Results", icon: <MapPin size={24} weight="fill" className="text-blue-500" /> },
                  { id: "Increase Consultation Bookings", badge: "Recommended", icon: <CalendarCheck size={24} weight="fill" className="text-purple-500" /> },
                  { id: "Promote Clinic Visits", icon: <Storefront size={24} weight="fill" className="text-emerald-500" /> },
                  { id: "Promote Video Consultations", icon: <VideoCamera size={24} weight="fill" className="text-rose-500" /> },
                  { id: "Promote Home Visits", icon: <HouseLine size={24} weight="fill" className="text-indigo-500" /> }
                ].map(goal => (
                  <div 
                    key={goal.id}
                    onClick={() => { setCampaignGoal(goal.id); setSetupStep(2); }}
                    className={`bg-white p-4 rounded-2xl border-2 flex items-center gap-4 cursor-pointer transition-all active:scale-[0.98] ${campaignGoal === goal.id ? 'border-purple-500 shadow-md shadow-purple-100' : 'border-slate-100 hover:border-slate-200 shadow-sm'}`}
                  >
                    <div className="shrink-0">{goal.icon}</div>
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-900">{goal.id}</h4>
                      {goal.badge && (
                        <span className="inline-block mt-1 bg-purple-50 text-purple-600 text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md">
                          {goal.badge}
                        </span>
                      )}
                    </div>
                    <CaretRight size={20} className="text-slate-300" weight="bold" />
                  </div>
                ))}
              </div>
            )}

            {/* Step 2: Audience */}
            {setupStep === 2 && (
              <div className="space-y-4">
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2 px-1">Who should see your ad?</p>
                <div className="grid grid-cols-2 gap-3">
                  {["Dog", "Cat", "Bird", "Hamster"].map(pet => (
                    <div 
                      key={pet}
                      onClick={() => {
                        if (audience.includes(pet)) setAudience(audience.filter(a => a !== pet));
                        else setAudience([...audience, pet]);
                      }}
                      className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98] ${audience.includes(pet) ? 'bg-purple-50 border-purple-500' : 'bg-white border-slate-100'}`}
                    >
                      <div className={`w-5 h-5 rounded flex items-center justify-center border-2 ${audience.includes(pet) ? 'bg-purple-500 border-purple-500 text-white' : 'border-slate-200'}`}>
                        {audience.includes(pet) && <CheckCircle size={16} weight="bold" />}
                      </div>
                      <span className={`font-bold ${audience.includes(pet) ? 'text-purple-700' : 'text-slate-600'}`}>{pet}s</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Area */}
            {setupStep === 3 && (
              <div className="space-y-3">
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 px-1">Where should the ad run?</p>
                {[
                  { id: "Entire City", desc: "Maximum reach across your city" },
                  { id: "5 km Radius", desc: "Target pet parents very close to you" },
                  { id: "10 km Radius", desc: "A balanced local reach" },
                  { id: "Selected Localities", desc: "Choose specific neighborhoods" }
                ].map(area => (
                  <div 
                    key={area.id}
                    onClick={() => { setServiceArea(area.id); setSetupStep(4); }}
                    className={`bg-white p-4 rounded-2xl border-2 cursor-pointer transition-all active:scale-[0.98] ${serviceArea === area.id ? 'border-purple-500 bg-purple-50' : 'border-slate-100 hover:border-slate-200 shadow-sm'}`}
                  >
                    <h4 className="font-bold text-slate-900">{area.id}</h4>
                    <p className="text-sm text-slate-500 font-medium mt-0.5">{area.desc}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Step 4: Duration */}
            {setupStep === 4 && (
              <div className="space-y-3">
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 px-1">How long should it run?</p>
                {[
                  { id: "7 Days", desc: "Quick boost for immediate bookings" },
                  { id: "15 Days", desc: "Standard recommended duration" },
                  { id: "30 Days", desc: "Sustained long-term visibility" },
                  { id: "Custom", desc: "Enter specific number of days" }
                ].map(dur => (
                  <div 
                    key={dur.id}
                    onClick={() => { 
                      setDuration(dur.id); 
                      if (dur.id !== "Custom") setSetupStep(5);
                    }}
                    className={`bg-white p-4 rounded-2xl border-2 cursor-pointer transition-all active:scale-[0.98] ${duration === dur.id ? 'border-purple-500 bg-purple-50' : 'border-slate-100 hover:border-slate-200 shadow-sm'}`}
                  >
                    <h4 className="font-bold text-slate-900">{dur.id}</h4>
                    <p className="text-sm text-slate-500 font-medium mt-0.5">{dur.desc}</p>
                    
                    {duration === "Custom" && dur.id === "Custom" && (
                      <div className="mt-4 flex gap-2">
                        <input 
                          type="number"
                          placeholder="Days"
                          value={customDuration}
                          onChange={e => setCustomDuration(e.target.value)}
                          className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2 font-bold focus:outline-none focus:border-purple-500"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Step 5: Budget */}
            {setupStep === 5 && (
              <div className="space-y-4">
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2 px-1">Select Daily Budget</p>
                
                <div 
                  onClick={() => setBudgetPlan("Starter")}
                  className={`bg-white p-5 rounded-2xl border-2 cursor-pointer transition-all ${budgetPlan === "Starter" ? 'border-green-500 ring-4 ring-green-500/10' : 'border-slate-200'}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-lg flex items-center gap-1.5">
                        Starter <span className="bg-green-100 text-green-700 text-[10px] uppercase px-2 py-0.5 rounded-md">Best for first time</span>
                      </h4>
                      <p className="text-slate-500 font-medium text-sm">₹99 / day</p>
                    </div>
                    {budgetPlan === "Starter" && <CheckCircle size={24} weight="fill" className="text-green-500" />}
                  </div>
                </div>

                <div 
                  onClick={() => setBudgetPlan("Growth")}
                  className={`bg-white p-5 rounded-2xl border-2 cursor-pointer transition-all ${budgetPlan === "Growth" ? 'border-purple-500 ring-4 ring-purple-500/10' : 'border-slate-200'}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-lg flex items-center gap-1.5">
                        Growth <span className="bg-purple-100 text-purple-700 text-[10px] uppercase px-2 py-0.5 rounded-md">Higher Reach</span>
                      </h4>
                      <p className="text-slate-500 font-medium text-sm">₹199 / day</p>
                    </div>
                    {budgetPlan === "Growth" && <CheckCircle size={24} weight="fill" className="text-purple-500" />}
                  </div>
                </div>

                <div 
                  onClick={() => setBudgetPlan("Premium")}
                  className={`bg-white p-5 rounded-2xl border-2 cursor-pointer transition-all ${budgetPlan === "Premium" ? 'border-orange-500 ring-4 ring-orange-500/10' : 'border-slate-200'}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-lg flex items-center gap-1.5">
                        Premium <span className="bg-orange-100 text-orange-700 text-[10px] uppercase px-2 py-0.5 rounded-md">Max Visibility</span>
                      </h4>
                      <p className="text-slate-500 font-medium text-sm">₹299 / day</p>
                    </div>
                    {budgetPlan === "Premium" && <CheckCircle size={24} weight="fill" className="text-orange-500" />}
                  </div>
                </div>

                <div 
                  onClick={() => setBudgetPlan("Custom")}
                  className={`bg-white p-5 rounded-2xl border-2 cursor-pointer transition-all ${budgetPlan === "Custom" ? 'border-slate-800 ring-4 ring-slate-800/10' : 'border-slate-200'}`}
                >
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-extrabold text-slate-900 text-lg">Custom Amount</h4>
                    {budgetPlan === "Custom" && <CheckCircle size={24} weight="fill" className="text-slate-800" />}
                  </div>
                  {budgetPlan === "Custom" && (
                    <div className="relative">
                      <CurrencyInr size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="number"
                        placeholder="Min ₹99"
                        value={customBudget}
                        onChange={e => setCustomBudget(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 font-bold text-slate-900 focus:outline-none focus:border-slate-400"
                      />
                    </div>
                  )}
                </div>

                {budgetPlan && (
                  <div className="bg-slate-900 rounded-2xl p-5 text-white mt-6 animate-in slide-in-from-bottom-4">
                    <p className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-4">Estimated Performance</p>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Eye size={20} className="text-blue-400" />
                          <span className="font-medium text-sm">Est. Reach</span>
                        </div>
                        <span className="font-bold">{getDailyBudget() * 8} - {getDailyBudget() * 12} views</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CursorClick size={20} className="text-purple-400" />
                          <span className="font-medium text-sm">Profile Visits</span>
                        </div>
                        <span className="font-bold">{Math.round(getDailyBudget() * 1.5)} - {Math.round(getDailyBudget() * 2.5)} clicks</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CalendarCheck size={20} className="text-green-400" />
                          <span className="font-medium text-sm">Consultation Requests</span>
                        </div>
                        <span className="font-bold">{Math.round(getDailyBudget() * 0.1)} - {Math.round(getDailyBudget() * 0.2)} requests</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 6: Summary */}
            {setupStep === 6 && (
              <div className="space-y-6">
                
                {walletBalance < estimatedSpend && (
                  <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-red-100 rounded-full text-red-500 flex items-center justify-center mb-3">
                      <Wallet size={24} weight="bold" />
                    </div>
                    <h4 className="font-bold text-red-900 mb-1">Insufficient Wallet Balance</h4>
                    <p className="text-sm font-medium text-red-700 mb-4">
                      You need ₹{estimatedSpend.toLocaleString('en-IN')} to launch this campaign, but you only have ₹{walletBalance.toLocaleString('en-IN')}.
                    </p>
                    <button 
                      onClick={() => { setShowModal(false); navigate("/vet/wallet"); }}
                      className="bg-red-500 text-white font-bold px-6 py-2.5 rounded-xl hover:bg-red-600 active:scale-95 transition-all flex items-center gap-2"
                    >
                      <Plus size={16} weight="bold" /> Add Funds
                    </button>
                  </div>
                )}

                <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 p-1 overflow-hidden">
                  <div className="bg-slate-50 rounded-[22px] p-5">
                    <h3 className="font-extrabold text-slate-900 text-lg mb-4 text-center">Campaign Summary</h3>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between items-start border-b border-slate-200/60 pb-3">
                        <span className="text-sm font-medium text-slate-500">Goal</span>
                        <span className="font-bold text-slate-900 text-right max-w-[150px]">{campaignGoal}</span>
                      </div>
                      <div className="flex justify-between items-start border-b border-slate-200/60 pb-3">
                        <span className="text-sm font-medium text-slate-500">Audience</span>
                        <span className="font-bold text-slate-900">{audience.join(", ")}</span>
                      </div>
                      <div className="flex justify-between items-start border-b border-slate-200/60 pb-3">
                        <span className="text-sm font-medium text-slate-500">Location</span>
                        <span className="font-bold text-slate-900">{serviceArea}</span>
                      </div>
                      <div className="flex justify-between items-start border-b border-slate-200/60 pb-3">
                        <span className="text-sm font-medium text-slate-500">Duration</span>
                        <span className="font-bold text-slate-900">{getDurationDays()} Days</span>
                      </div>
                      <div className="flex justify-between items-start border-b border-slate-200/60 pb-3">
                        <span className="text-sm font-medium text-slate-500">Daily Budget</span>
                        <span className="font-bold text-slate-900">₹{getDailyBudget()}</span>
                      </div>
                      <div className="flex justify-between items-start pt-2">
                        <span className="text-base font-bold text-slate-800">Estimated Spend</span>
                        <span className="text-xl font-extrabold text-purple-600">₹{estimatedSpend.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>
          
          {/* Footer Controls */}
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-4 shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] z-50">
            {setupStep === 1 && (
              <button
                disabled={!campaignGoal}
                onClick={() => setSetupStep(2)}
                className="w-full bg-slate-900 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-4 rounded-2xl transition-all active:scale-95"
              >
                Next Step
              </button>
            )}
            {setupStep === 2 && (
              <button
                disabled={audience.length === 0}
                onClick={() => setSetupStep(3)}
                className="w-full bg-slate-900 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-4 rounded-2xl transition-all active:scale-95"
              >
                Next Step
              </button>
            )}
            {setupStep === 3 && (
              <button
                disabled={!serviceArea}
                onClick={() => setSetupStep(4)}
                className="w-full bg-slate-900 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-4 rounded-2xl transition-all active:scale-95"
              >
                Next Step
              </button>
            )}
            {setupStep === 4 && (
              <button
                disabled={duration === "Custom" && (!customDuration || Number(customDuration) <= 0)}
                onClick={() => setSetupStep(5)}
                className="w-full bg-slate-900 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-4 rounded-2xl transition-all active:scale-95"
              >
                Next Step
              </button>
            )}
            {setupStep === 5 && (
              <button
                disabled={!budgetPlan || (budgetPlan === "Custom" && Number(customBudget) < 99)}
                onClick={() => setSetupStep(6)}
                className="w-full bg-slate-900 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-4 rounded-2xl transition-all active:scale-95"
              >
                Review Campaign
              </button>
            )}
            {setupStep === 6 && (
              <button
                disabled={walletBalance < estimatedSpend || loading}
                onClick={handleLaunchCampaign}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-4 rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Launch Campaign
                    <Target size={20} weight="bold" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
