/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { 
  CaretLeft, Tag, Plus, Trash, Clock, Calendar, Check, 
  CurrencyInr, Percent, Gift, Ticket, Circle, CheckCircle, Warning
} from "@phosphor-icons/react";
import { useAuth } from "@/contexts/AuthContext";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import SplashScreen from "@/components/SplashScreen";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Offer {
  id: string;
  title: string;
  ad_type: string;
  start_date: string;
  end_date: string | null;
  status: string;
  description: string; // JSON string
  created_at: string;
}

const VetSavingCorner = () => {
  const navigate = useNavigate();
  const { isLoading: guardLoading, showSpinner, user } = useRoleGuard(["vet"], "/auth/vet", true);
  
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form State
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [minBookingAmount, setMinBookingAmount] = useState("");
  const [maxDiscount, setMaxDiscount] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState("");
  const [targetSlots, setTargetSlots] = useState<"all" | "morning" | "afternoon" | "evening" | "night">("all");
  const [limitPerUser, setLimitPerUser] = useState<"one-time" | "unlimited">("one-time");

  const fetchOffers = useCallback(async () => {
    if (!user?.id) return;
    setLoadingOffers(true);
    try {
      const { data, error } = await supabase
        .from("user_advertisements")
        .select("*")
        .eq("user_id", user.id)
        .eq("ad_type", "saving_corner_offer")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOffers(data || []);
    } catch (err: any) {
      console.error("Failed to load offers:", err);
      toast.error("Error loading offers");
    } finally {
      setLoadingOffers(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user) {
      fetchOffers();
    }
  }, [user, fetchOffers]);

  const handleCreateOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !title.trim() || !discountValue) {
      toast.error("Please fill in all required fields.");
      return;
    }

    const cleanCode = code.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (cleanCode.length < 3) {
      toast.error("Coupon code must be at least 3 characters.");
      return;
    }

    setCreating(true);
    try {
      const offerDescription = {
        code: cleanCode,
        title,
        type: discountType,
        value: Number(discountValue),
        minAmount: minBookingAmount ? Number(minBookingAmount) : 0,
        maxDiscount: maxDiscount ? Number(maxDiscount) : null,
        targetSlots,
        limitPerUser,
        description: discountType === "percentage" 
          ? `Get ${discountValue}% off (up to ₹${maxDiscount || "no cap"}) on consultations!`
          : `Get flat ₹${discountValue} off on your consultation!`
      };

      const { error } = await supabase.from("user_advertisements").insert({
        user_id: user?.id,
        user_role: "vet",
        title: cleanCode,
        ad_type: "saving_corner_offer",
        daily_cost: 0,
        total_cost: 0,
        start_date: new Date(startDate).toISOString(),
        end_date: endDate ? new Date(endDate).toISOString() : null,
        status: "active",
        description: JSON.stringify(offerDescription)
      });

      if (error) throw error;

      toast.success(`Coupon ${cleanCode} created successfully!`);
      setShowCreateModal(false);
      resetForm();
      fetchOffers();
    } catch (err: any) {
      console.error("Failed to create coupon:", err);
      toast.error(err.message || "Failed to create coupon");
    } finally {
      setCreating(false);
    }
  };

  const handleToggleStatus = async (offerId: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "paused" : "active";
    try {
      const { error } = await supabase
        .from("user_advertisements")
        .update({ status: newStatus })
        .eq("id", offerId);

      if (error) throw error;
      toast.success(`Offer ${newStatus === "active" ? "resumed" : "paused"} successfully!`);
      fetchOffers();
    } catch (err: any) {
      console.error("Failed to update status:", err);
      toast.error("Failed to update status");
    }
  };

  const handleDeleteOffer = async (offerId: string) => {
    if (!window.confirm("Are you sure you want to delete this offer?")) return;
    try {
      const { error } = await supabase
        .from("user_advertisements")
        .delete()
        .eq("id", offerId);

      if (error) throw error;
      toast.success("Offer deleted successfully!");
      fetchOffers();
    } catch (err: any) {
      console.error("Failed to delete offer:", err);
      toast.error("Failed to delete offer");
    }
  };

  const resetForm = () => {
    setCode("");
    setTitle("");
    setDiscountType("percentage");
    setDiscountValue("");
    setMinBookingAmount("");
    setMaxDiscount("");
    setStartDate(new Date().toISOString().split("T")[0]);
    setEndDate("");
    setTargetSlots("all");
    setLimitPerUser("one-time");
  };

  if (showSpinner) {
    return <SplashScreen message="Loading saving corner..." />;
  }

  const hasCache = localStorage.getItem("sruvo_user_role") === "vet";
  if (guardLoading && !hasCache) {
    return null;
  }

  return (
    <div className="bg-[#F8F8FC] min-h-screen pb-24 font-sans text-slate-900 selection:bg-purple-100">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md px-4 py-4 flex items-center border-b border-slate-100">
        <button onClick={() => navigate("/vet/profile")} className="p-2 text-slate-700 hover:bg-slate-50 rounded-full transition-colors mr-4">
          <CaretLeft size={24} weight="bold" />
        </button>
        <h1 className="text-xl font-bold text-slate-900">Saving Corner</h1>
      </header>

      <main className="max-w-md mx-auto px-5 pt-6 space-y-6">
        {/* Intro Section - Clean and Professional */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_4px_24px_rgba(156,66,245,0.04)]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-[#F4E8FF] flex items-center justify-center text-[#9C42F5]">
              <Ticket size={24} weight="fill" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold tracking-wider text-[#9C42F5] uppercase">VET SAVINGS ENGINE</span>
              <h2 className="text-xl font-extrabold text-slate-900 leading-tight">Clinic & Home Offers</h2>
            </div>
          </div>
          <p className="text-slate-500 text-xs font-medium leading-relaxed mb-5">
            Create your own customized clinic and home consultation offers. Coupons created here will appear exclusively in the "Saving Corner" on your profile card.
          </p>
          <button 
            onClick={() => { resetForm(); setShowCreateModal(true); }}
            className="w-full bg-[#9C42F5] text-white hover:bg-[#8629df] font-bold py-4 px-6 rounded-2xl transition-all active:scale-95 text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#9C42F5]/10"
          >
            <Plus size={16} weight="bold" /> Create New Offer
          </button>
        </div>

        {/* Offers list */}
        <div>
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 px-1 flex items-center justify-between">
            <span>Your Active Coupons ({offers.length})</span>
            {offers.length > 0 && <span className="text-xs text-[#9C42F5] font-extrabold">Realtime Live</span>}
          </h3>

          {loadingOffers ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <div className="w-8 h-8 border-4 border-[#9C42F5] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-400 text-xs font-medium">Loading active offers...</p>
            </div>
          ) : offers.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-slate-100 shadow-sm flex flex-col items-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
                <Tag size={32} weight="bold" className="text-purple-300" />
              </div>
              <h4 className="font-bold text-slate-900 mb-1">No Offers Created</h4>
              <p className="text-slate-500 text-xs font-medium mb-5 max-w-[240px] mx-auto">
                Create custom discount codes to attract pet parents to schedule consultations.
              </p>
              <button 
                onClick={() => setShowCreateModal(true)}
                className="bg-[#F4E8FF] text-[#9C42F5] font-bold py-3 px-6 rounded-xl hover:bg-[#ebd7ff] transition-colors active:scale-95 text-sm"
              >
                Create First Code
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {offers.map((offer) => {
                let details: any = {};
                try {
                  details = JSON.parse(offer.description);
                } catch (e) {
                  details = { code: offer.title, title: "Offer", type: "fixed", value: 50 };
                }

                const isActive = offer.status === "active";
                const isPercentage = details.type === "percentage";

                return (
                  <div key={offer.id} className="bg-white rounded-3xl border border-slate-100 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] relative overflow-hidden">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="font-black text-slate-900 text-sm tracking-wider bg-slate-50 border border-slate-200 px-2.5 py-0.5 rounded-lg">
                            {details.code || offer.title}
                          </span>
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                            isActive 
                              ? "bg-[#F4E8FF] text-[#9C42F5]" 
                              : "bg-amber-50 text-amber-600"
                          }`}>
                            {isActive ? "LIVE" : "PAUSED"}
                          </span>
                        </div>
                        <h4 className="font-extrabold text-sm text-slate-800">{details.title || offer.title}</h4>
                        <p className="text-xs text-slate-500 font-semibold mt-1">
                          {isPercentage ? `${details.value}% Off` : `₹${details.value} Off`} • {details.targetSlots === "all" ? "All Day" : `${details.targetSlots} slots`}
                        </p>
                      </div>

                      <div className="flex gap-1.5">
                        <button 
                          onClick={() => handleToggleStatus(offer.id, offer.status)}
                          className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all ${
                            isActive 
                              ? "border-amber-200 text-amber-600 hover:bg-amber-50" 
                              : "border-purple-200 text-[#9C42F5] hover:bg-[#FAF6FF]"
                          }`}
                        >
                          {isActive ? "Pause" : "Resume"}
                        </button>
                        <button 
                          onClick={() => handleDeleteOffer(offer.id)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                        >
                          <Trash size={16} weight="bold" />
                        </button>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-3 mt-3 flex flex-wrap gap-y-2 justify-between items-center text-[11px] text-slate-400">
                      <div className="flex items-center gap-1 font-semibold">
                        <Calendar size={13} />
                        <span>Ends {offer.end_date ? new Date(offer.end_date).toLocaleDateString() : "Never"}</span>
                      </div>
                      <div className="flex items-center gap-1 font-semibold">
                        <Clock size={13} />
                        <span>Min Value: ₹{details.minAmount || 0}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Creation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Ticket size={24} className="text-[#9C42F5]" /> Create Custom Offer
              </h3>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateOffer} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">COUPON CODE (UPPERCASE)*</label>
                <input 
                  type="text"
                  required
                  placeholder="E.G. DOC50, MONSOON20"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-[#9C42F5] focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">OFFER TITLE / SLOGAN*</label>
                <input 
                  type="text"
                  required
                  placeholder="E.G. Flat 50% Off / Monsoon Special"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-[#9C42F5] focus:bg-white transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">DISCOUNT TYPE</label>
                  <div className="flex border border-slate-200 rounded-2xl overflow-hidden">
                    <button 
                      type="button"
                      onClick={() => setDiscountType("percentage")}
                      className={`flex-1 py-3 text-xs font-extrabold flex items-center justify-center gap-1 transition-all ${
                        discountType === "percentage" 
                          ? "bg-[#9C42F5] text-white" 
                          : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                      }`}
                    >
                      <Percent size={14} /> Percentage
                    </button>
                    <button 
                      type="button"
                      onClick={() => setDiscountType("fixed")}
                      className={`flex-1 py-3 text-xs font-extrabold flex items-center justify-center gap-1 transition-all ${
                        discountType === "fixed" 
                          ? "bg-[#9C42F5] text-white" 
                          : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                      }`}
                    >
                      <CurrencyInr size={14} /> Flat ₹
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    {discountType === "percentage" ? "PERCENT VALUE (%)*" : "FLAT AMOUNT (₹)*"}
                  </label>
                  <input 
                    type="number"
                    required
                    min="1"
                    placeholder={discountType === "percentage" ? "e.g. 15" : "e.g. 100"}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-[#9C42F5] focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">MIN BOOKING VALUE (₹)</label>
                  <input 
                    type="number"
                    placeholder="e.g. 300 (0 for none)"
                    value={minBookingAmount}
                    onChange={(e) => setMinBookingAmount(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-[#9C42F5] focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">MAX DISCOUNT CAP (₹)</label>
                  <input 
                    type="number"
                    disabled={discountType === "fixed"}
                    placeholder={discountType === "fixed" ? "N/A" : "e.g. 150"}
                    value={maxDiscount}
                    onChange={(e) => setMaxDiscount(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-[#9C42F5] focus:bg-white transition-all disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">START DATE</label>
                  <input 
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#9C42F5]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">END DATE (OPTIONAL)</label>
                  <input 
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#9C42F5]"
                  />
                </div>
              </div>

              {/* Slot Filter */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 flex items-center gap-1">
                  <Clock size={14} /> TARGET VISITING SLOTS*
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: "all", label: "All Slots (All Day)" },
                    { key: "morning", label: "Morning Only (6AM-1PM)" },
                    { key: "afternoon", label: "Afternoon (1PM-4PM)" },
                    { key: "evening", label: "Evening (4PM-8PM)" },
                    { key: "night", label: "Night (8PM-6AM)" }
                  ].map((s) => (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => setTargetSlots(s.key as any)}
                      className={`py-2 px-3 text-[11px] font-bold rounded-xl border flex items-center gap-1.5 transition-all text-left ${
                        targetSlots === s.key 
                          ? "bg-[#F4E8FF] border-[#9C42F5] text-[#9C42F5]" 
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {targetSlots === s.key ? <CheckCircle size={14} weight="fill" className="text-[#9C42F5]" /> : <Circle size={14} />}
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">USER LIMIT</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input 
                      type="radio" 
                      name="userLimit" 
                      checked={limitPerUser === "one-time"} 
                      onChange={() => setLimitPerUser("one-time")}
                      className="accent-[#9C42F5]"
                    />
                    One-time per user
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input 
                      type="radio" 
                      name="userLimit" 
                      checked={limitPerUser === "unlimited"} 
                      onChange={() => setLimitPerUser("unlimited")}
                      className="accent-[#9C42F5]"
                    />
                    Multiple uses allowed
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-3 text-sm font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={creating}
                  className="flex-1 py-3 text-sm font-bold text-white bg-[#9C42F5] hover:bg-[#8629df] disabled:bg-[#ebd7ff] rounded-2xl transition-all flex items-center justify-center gap-1.5 shadow-md shadow-[#9C42F5]/10"
                >
                  {creating ? (
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : "Create & Live"}
                </button>
              </div>
          </form>
        </div>
      </div>
    )}
    </div>
  );
};

export default VetSavingCorner;
