/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  CaretLeft, Tag, Plus, Trash, Clock, Calendar, Check, 
  CurrencyInr, Percent, Gift, Ticket, Circle, CheckCircle, Warning, MagnifyingGlass
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
  const [searchQuery, setSearchQuery] = useState("");

  const filteredOffers = useMemo(() => {
    if (!searchQuery.trim()) return offers;
    const query = searchQuery.toLowerCase();
    return offers.filter((offer) => {
      let details: any = {};
      try {
        details = JSON.parse(offer.description);
      } catch (e) {
        details = { code: offer.title };
      }
      const codeMatches = (details.code || offer.title || "").toLowerCase().includes(query);
      const titleMatches = (offer.title || "").toLowerCase().includes(query);
      const descMatches = (offer.description || "").toLowerCase().includes(query);
      return codeMatches || titleMatches || descMatches;
    });
  }, [offers, searchQuery]);

  const [loadingOffers, setLoadingOffers] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [expandedOffers, setExpandedOffers] = useState<Record<string, boolean>>({});

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
    <div className="bg-[#F8F8FC] min-h-screen pb-24 font-sans text-slate-900 selection:bg-pink-100">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md px-4 py-4 flex items-center border-b border-slate-100">
        <button onClick={() => navigate("/vet/profile")} className="p-2 text-slate-700 hover:bg-slate-50 rounded-full transition-colors mr-4">
          <CaretLeft size={24} weight="bold" />
        </button>
        <h1 className="text-xl font-bold text-slate-900">Saving Corner</h1>
      </header>

      <main className="max-w-md mx-auto px-4 sm:px-5 pt-6 space-y-6">
        {/* Intro Section - Clean and Professional */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-[0_4px_24px_rgba(236,72,153,0.04)]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-pink-50 flex items-center justify-center text-pink-500">
              <Ticket size={24} weight="fill" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold tracking-wider text-pink-500 uppercase">VET SAVINGS ENGINE</span>
              <h2 className="text-xl font-extrabold text-slate-900 leading-tight">Clinic & Home Offers</h2>
            </div>
          </div>
          <p className="text-slate-500 text-xs font-medium leading-relaxed mb-5">
            Create your own customized clinic and home consultation offers. Coupons created here will appear exclusively in the "Saving Corner" on your profile card.
          </p>
          <button 
            onClick={() => { resetForm(); setShowCreateModal(true); }}
            className="w-full bg-pink-500 text-white hover:bg-pink-600 font-bold py-3.5 px-6 rounded-2xl transition-all active:scale-95 text-sm flex items-center justify-center gap-2 shadow-lg shadow-pink-550/10"
          >
            <Plus size={16} weight="bold" /> Create New Offer
          </button>
        </div>

        {/* Offers list */}
        <div>
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 px-1 flex items-center justify-between">
            <span>Your Active Coupons ({offers.length})</span>
            {offers.length > 0 && <span className="text-xs text-pink-550 font-extrabold">Realtime Live</span>}
          </h3>

          {/* Search bar inside VetSavingCorner */}
          {offers.length > 0 && (
            <div className="relative mb-4">
              <MagnifyingGlass size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search your created coupon codes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-100 rounded-2xl text-xs font-semibold placeholder:text-slate-400 focus:outline-none focus:border-pink-500 shadow-sm transition-all"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 hover:text-slate-600"
                >
                  CLEAR
                </button>
              )}
            </div>
          )}

          {loadingOffers ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-400 text-xs font-medium">Loading active offers...</p>
            </div>
          ) : offers.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-slate-100 shadow-sm flex flex-col items-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
                <Tag size={32} weight="bold" className="text-pink-300" />
              </div>
              <h4 className="font-bold text-slate-900 mb-1">No Offers Created</h4>
              <p className="text-slate-500 text-xs font-medium mb-5 max-w-[240px] mx-auto">
                Create custom discount codes to attract pet parents to schedule consultations.
              </p>
              <button 
                onClick={() => setShowCreateModal(true)}
                className="bg-pink-50 text-pink-550 font-bold py-3 px-6 rounded-xl hover:bg-pink-100 transition-colors active:scale-95 text-sm"
              >
                Create First Code
              </button>
            </div>
          ) : filteredOffers.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-slate-100 shadow-sm flex flex-col items-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
                <Tag size={32} weight="bold" className="text-slate-400" />
              </div>
              <h4 className="font-bold text-slate-900 mb-1">No matching coupons</h4>
              <p className="text-slate-500 text-xs font-medium mx-auto">
                Try searching with a different code or keyword.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOffers.map((offer) => {
                let details: any = {};
                try {
                  details = JSON.parse(offer.description);
                } catch (e) {
                  details = { code: offer.title, title: "Offer", type: "fixed", value: 50 };
                }

                const isActive = offer.status === "active";
                const isPercentage = details.type === "percentage";
                const discountText = isPercentage 
                  ? `Save ${details.value}% on this order!` 
                  : `Save ₹${details.value} on this order!`;
                
                const isExpanded = !!expandedOffers[offer.id];

                return (
                  <div 
                    key={offer.id} 
                    className={`relative flex bg-white rounded-3xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.015)] overflow-hidden transition-all ${
                      isExpanded ? "" : "h-[110px] max-h-[110px]"
                    }`}
                  >
                    
                    {/* Left Colored Band (Zomato/Swiggy style themed in Buyer Lavender/Pink) */}
                    <div className="w-[64px] sm:w-[76px] shrink-0 bg-gradient-to-b from-pink-500 to-pink-600 relative overflow-hidden flex items-center justify-center">
                      {/* Subtle multiple-stripe diagonal sheen (tirchhi lines) of light, translucent white */}
                      <div 
                        className="absolute inset-0 pointer-events-none opacity-40 mix-blend-overlay" 
                        style={{
                          backgroundImage: "repeating-linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0px, rgba(255, 255, 255, 0.8) 3px, transparent 3px, transparent 10px)"
                        }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center z-10">
                        <span className="font-black text-white text-[13px] sm:text-[15px] tracking-wider uppercase whitespace-nowrap -rotate-90 select-none drop-shadow-sm">
                          {isPercentage ? `${details.value}% OFF` : `₹${details.value} OFF`}
                        </span>
                      </div>
                    </div>

                    {/* Classic Circle Punch Notches over the dividing line */}
                    <div className="absolute top-0 bottom-0 left-[58px] sm:left-[70px] w-3 flex flex-col justify-around py-2.5 z-20 pointer-events-none">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#F8F8FC]" />
                      <div className="w-2.5 h-2.5 rounded-full bg-[#F8F8FC]" />
                      <div className="w-2.5 h-2.5 rounded-full bg-[#F8F8FC]" />
                    </div>

                    {/* Right Main Coupon Body */}
                    <div className="flex-1 p-3 bg-white flex flex-col justify-between overflow-hidden">
                      <div className={isExpanded ? "" : "h-full flex flex-col justify-between"}>
                        <div>
                          {/* Title & Status Row */}
                          <div className="flex justify-between items-center gap-2">
                            <span className="font-black text-[#1E1E2D] text-xs sm:text-sm tracking-wider uppercase leading-none">
                              {details.code || offer.title}
                            </span>
                            <span className={`text-[8px] sm:text-[9px] font-extrabold px-1.5 sm:px-2 py-0.5 rounded-full tracking-wider leading-none ${
                              isActive 
                                ? "bg-emerald-50 text-emerald-600" 
                                : "bg-amber-50 text-amber-600"
                            }`}>
                              {isActive ? "LIVE" : "PAUSED"}
                            </span>
                          </div>

                          {/* Discount Banner (Green text like Swiggy) */}
                          <p className="text-emerald-600 font-extrabold text-[10px] sm:text-xs tracking-tight mt-1 leading-none">
                            {discountText}
                          </p>

                          {/* Dotted / Dashed Divider */}
                          <div className="border-t border-dashed border-slate-100 my-1 sm:my-1.5" />

                          {/* Description */}
                          <p className={`text-slate-500 font-medium text-[9px] sm:text-[10px] leading-tight sm:leading-relaxed ${
                            isExpanded ? "" : "line-clamp-2"
                          }`}>
                            Use code {details.code || offer.title} & get {isPercentage ? `${details.value}%` : `₹${details.value}`} off on orders above ₹{details.minAmount || 0}.{details.maxDiscount && isPercentage ? ` Max: ₹${details.maxDiscount}.` : ""}
                          </p>
                        </div>

                        {/* Info & Action Area */}
                        <div className="mt-1.5">
                          {isExpanded && (
                            <div className="bg-slate-50 rounded-xl p-2 mb-2 text-[9px] sm:text-[10px] text-slate-500 font-semibold space-y-1 animate-fade-in border border-slate-100">
                              <div className="flex justify-between">
                                <span>Valid Until:</span>
                                <span className="text-slate-700">{offer.end_date ? new Date(offer.end_date).toLocaleDateString() : "Never Expires"}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Slots:</span>
                                <span className="text-slate-700 uppercase">{details.targetSlots === "all" ? "All Slots" : `${details.targetSlots} slots`}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Usage Limit:</span>
                                <span className="text-slate-700">{details.limitPerUser === "one-time" ? "One-time use" : "Unlimited uses"}</span>
                              </div>
                            </div>
                          )}

                          <div className="flex justify-between items-center leading-none">
                            {/* MORE info toggle */}
                            <button 
                              onClick={() => setExpandedOffers(prev => ({ ...prev, [offer.id]: !prev[offer.id] }))}
                              className="text-[9px] font-black tracking-wider text-pink-500 hover:underline uppercase flex items-center gap-0.5"
                            >
                              {isExpanded ? "- LESS" : "+ MORE"}
                            </button>

                            {/* Controls (Pause/Resume, Delete) */}
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => handleToggleStatus(offer.id, offer.status)}
                                className={`text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-lg border transition-all ${
                                  isActive 
                                    ? "border-amber-200 text-amber-600 hover:bg-amber-50" 
                                    : "border-pink-200 text-pink-500 hover:bg-pink-50/50"
                                }`}
                              >
                                {isActive ? "Pause" : "Resume"}
                              </button>
                              <button 
                                onClick={() => handleDeleteOffer(offer.id)}
                                className="p-0.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all active:scale-95"
                                title="Delete Coupon"
                              >
                                <Trash size={12} weight="bold" />
                              </button>
                            </div>
                          </div>
                        </div>
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
                <Ticket size={24} className="text-pink-500" /> Create Custom Offer
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
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-pink-500 focus:bg-white transition-all"
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
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-pink-500 focus:bg-white transition-all"
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
                          ? "bg-pink-500 text-white" 
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
                          ? "bg-pink-500 text-white" 
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-pink-500 focus:bg-white transition-all"
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-pink-500 focus:bg-white transition-all"
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-pink-500 focus:bg-white transition-all disabled:opacity-50"
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-pink-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">END DATE (OPTIONAL)</label>
                  <input 
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-pink-500"
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
                          ? "bg-pink-50 border-pink-500 text-pink-600" 
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {targetSlots === s.key ? <CheckCircle size={14} weight="fill" className="text-pink-500" /> : <Circle size={14} />}
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
                      className="accent-pink-500"
                    />
                    One-time per user
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input 
                      type="radio" 
                      name="userLimit" 
                      checked={limitPerUser === "unlimited"} 
                      onChange={() => setLimitPerUser("unlimited")}
                      className="accent-pink-500"
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
                  className="flex-1 py-3 text-sm font-bold text-white bg-pink-500 hover:bg-pink-600 disabled:bg-pink-200 rounded-2xl transition-all flex items-center justify-center gap-1.5 shadow-md shadow-pink-500/10"
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
