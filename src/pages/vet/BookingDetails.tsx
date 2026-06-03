import { useState, useMemo, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, MoreHorizontal, Star, Briefcase, ThumbsUp, Clock, Hospital, Home, MessageSquare, ArrowRight, CheckCircle2, Moon, ChevronUp, ChevronDown, Gift, Percent, ChevronRight, Ticket, X, Wallet, Lock, Check, Shield, Calendar } from "lucide-react";
import { format, addDays, startOfToday } from "date-fns";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

const COUPONS = [
  { code: "RJ49", value: 49, description: "Flat ₹49 off for first time users", type: "fixed" },
  { code: "SRUVO10", value: 25, description: "Save ₹25 on your first consultation", type: "fixed" },
  { code: "WELCOMEDOC", value: 30, description: "Special welcome discount of ₹30", type: "fixed" }
];

const parseTimeToMins = (str: string) => {
  const clean = str.trim().toUpperCase();
  const match = clean.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/);
  if (!match) return 0;
  let hours = Number(match[1]);
  const minutes = match[2] ? Number(match[2]) : 0;
  const modifier = match[3];
  if (modifier === "PM" && hours !== 12) hours += 12;
  if (modifier === "AM" && hours === 12) hours = 0;
  return hours * 60 + minutes;
};

const formatMinsToTime = (mins: number) => {
  let h = Math.floor(mins / 60);
  const m = mins % 60;
  const modifier = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")} ${modifier}`;
};

const getSlotPeriod = (sStr: string): "morning" | "afternoon" | "evening" | "night" => {
  const mins = parseTimeToMins(sStr);
  if (mins >= 360 && mins < 780) return "morning"; // 6 AM to 1 PM (780 mins)
  if (mins >= 780 && mins < 960) return "afternoon"; // 1 PM to 4 PM (960 mins)
  if (mins >= 960 && mins < 1200) return "evening"; // 4 PM to 8 PM (1200 mins)
  return "night"; // 8 PM to 6 AM (including late night slots)
};

interface AvailabilityPeriod {
  enabled: boolean;
  slots?: (string | { time: string; location?: string })[];
}

type DayData = Record<"morning" | "afternoon" | "evening" | "night", AvailabilityPeriod>;

const extractRawSlots = (dayData: DayData | null | undefined) => {
  if (!dayData) return [];
  const results: { timeVal: string; period: 'morning' | 'afternoon' | 'evening' | 'night' }[] = [];
  const periods = ["morning", "afternoon", "evening", "night"] as const;
  periods.forEach(p => {
    const period = dayData[p];
    if (period && period.enabled && period.slots) {
      period.slots.forEach((s: { time: string; location?: string } | string) => {
        if (!s) return;
        const timeValue = typeof s === "string" ? s : s.time;
        if (!timeValue) return;
        const parts = timeValue.split(/\s*(?:–|—|-)\s*/);
        if (parts.length === 2) {
          const startStr = parts[0];
          const endStr = parts[1];
          let start = parseTimeToMins(startStr);
          const end = parseTimeToMins(endStr);
          while (start < end) {
            results.push({ timeVal: formatMinsToTime(start), period: p });
            start += 30; // 30 minutes interval
          }
        } else {
          results.push({ timeVal: timeValue, period: p });
        }
      });
    }
  });
  return results;
};

const BookingDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { matchedVet, isDirectBooking: isDirectState } = location.state || {};
  const [visitType, setVisitType] = useState<"clinic" | "home">("clinic");

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const dates = useMemo(() => {
    const arr: Date[] = [];
    try {
      const base = new Date();
      base.setHours(0, 0, 0, 0);
      for (let i = 0; i < 4; i++) {
        const d = new Date(base);
        d.setDate(base.getDate() + i);
        arr.push(d);
      }
    } catch (e) {
      console.error("[BookingDetails] Failed to construct dates array:", e);
      const d = new Date();
      return [d, new Date(d.getTime() + 86400000), new Date(d.getTime() + 172800000), new Date(d.getTime() + 259200000)];
    }
    return arr;
  }, []);

  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [selectedSlot, setSelectedSlot] = useState("");
  const [selectedCoupon, setSelectedCoupon] = useState<typeof COUPONS[0] | null>(null);
  const [showCoupons, setShowCoupons] = useState(false);
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);

  // Razorpay sandbox simulation states
  const [razorpayOpen, setRazorpayOpen] = useState(false);
  const [paymentStep, setPaymentStep] = useState<"payment_method" | "processing" | "confirming" | "accepted">("payment_method");
  const [selectedPaymentOption, setSelectedPaymentOption] = useState<"upi" | "card" | "netbanking">("upi");
  const [simulatedUPIId, setSimulatedUPIId] = useState("jashan@okaxis");

  const vet = useMemo(() => matchedVet || {}, [matchedVet]);

  // Safely parse weekly_availability if it gets serialised as a string
  const weeklyAvailabilityObject = useMemo(() => {
    if (!vet?.weekly_availability) return null;
    if (typeof vet.weekly_availability === "string") {
      try {
        return JSON.parse(vet.weekly_availability);
      } catch (e) {
        console.error("[BookingDetails] Failed to parse weekly_availability JSON string:", e);
        return null;
      }
    }
    return vet.weekly_availability;
  }, [vet?.weekly_availability]);

  // Safe helper to format any date or compute names
  const safeFormatDate = useCallback((dateToFormat: Date | null | undefined, formatStr: string): string => {
    if (!dateToFormat || !(dateToFormat instanceof Date) || isNaN(dateToFormat.getTime())) {
      return "";
    }
    try {
      return format(dateToFormat, formatStr);
    } catch (err) {
      console.warn("[BookingDetails] safeFormatDate error:", err);
      return "";
    }
  }, []);

  // Safe wrapper for dating format to prevent formatting errors from crashing
  const safeFormatSelectedDate = useCallback((formatStr: string) => {
    return safeFormatDate(selectedDate, formatStr);
  }, [selectedDate, safeFormatDate]);

  const hasNightZoneActive = useMemo(() => {
    if (!weeklyAvailabilityObject) return true; // defaults to true to allow showing default night slots
    const currDayName = safeFormatSelectedDate("EEE");
    
    const prevDay = (() => {
      if (!selectedDate || !(selectedDate instanceof Date) || isNaN(selectedDate.getTime())) {
        return new Date();
      }
      const d = new Date(selectedDate);
      d.setDate(d.getDate() - 1);
      return d;
    })();
    const prevDayName = safeFormatDate(prevDay, "EEE");
    
    if (!currDayName || !prevDayName) return true;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const currDayData = (weeklyAvailabilityObject as any)[currDayName];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const prevDayData = (weeklyAvailabilityObject as any)[prevDayName];
    
    return (currDayData?.night?.enabled === true) || (prevDayData?.night?.enabled === true);
  }, [selectedDate, weeklyAvailabilityObject, safeFormatSelectedDate, safeFormatDate]);
  
  // Dynamic slots generation based on vet's availability
  const allSlots = useMemo(() => {
    const isToday = selectedDate && (selectedDate instanceof Date) && !isNaN(selectedDate.getTime()) &&
                    selectedDate.getFullYear() === new Date().getFullYear() &&
                    selectedDate.getMonth() === new Date().getMonth() &&
                    selectedDate.getDate() === new Date().getDate();

    let rawSlots: string[] = [];

    if (!weeklyAvailabilityObject) {
      const defaultSlots = [
        "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
        "12:00 PM", "12:30 PM", "01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM",
        "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM", "05:00 PM", "05:30 PM",
        "06:00 PM", "06:30 PM", "07:00 PM", "07:30 PM", "08:00 PM", "08:30 PM",
        "09:00 PM", "09:30 PM", "10:00 PM", "10:30 PM", "11:00 PM", "11:30 PM",
      ];
      rawSlots = defaultSlots;
    } else {
      const currDayName = safeFormatSelectedDate("EEE");
      const prevDay = (() => {
        if (!selectedDate || !(selectedDate instanceof Date) || isNaN(selectedDate.getTime())) {
          return new Date();
        }
        const d = new Date(selectedDate);
        d.setDate(d.getDate() - 1);
        return d;
      })();
      const prevDayName = safeFormatDate(prevDay, "EEE");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const currDayData = currDayName ? (weeklyAvailabilityObject as any)[currDayName] : null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const prevDayData = prevDayName ? (weeklyAvailabilityObject as any)[prevDayName] : null;

      const currentRaw = extractRawSlots(currDayData);
      const prevRaw = extractRawSlots(prevDayData);

      const finalSlotsWithPeriod: { time: string; period: "morning" | "afternoon" | "evening" | "night" }[] = [];

      currentRaw.forEach(item => {
        const mins = parseTimeToMins(item.timeVal);
        if (mins >= 360) {
          finalSlotsWithPeriod.push({ time: item.timeVal, period: item.period });
        }
      });

      prevRaw.forEach(item => {
        const mins = parseTimeToMins(item.timeVal);
        if (mins < 360) {
          finalSlotsWithPeriod.push({ time: item.timeVal, period: "night" });
        }
      });

      const uniqueMap = new Map<string, "morning" | "afternoon" | "evening" | "night" >();
      finalSlotsWithPeriod.forEach(item => {
        uniqueMap.set(item.time, item.period);
      });

      rawSlots = Array.from(uniqueMap.keys()).sort((a, b) => {
        return parseTimeToMins(a) - parseTimeToMins(b);
      });
    }

    // Filter by hasNightZoneActive
    const baseSlots = rawSlots.filter(s => {
      if (getSlotPeriod(s) === "night") {
        return hasNightZoneActive;
      }
      return true;
    });

    if (isToday) {
      const now = new Date();
      const currentMins = now.getHours() * 60 + now.getMinutes();

      // Only allow slots strictly in the future of today
      const futureSlots = baseSlots.filter(slot => parseTimeToMins(slot) > currentMins);

      const currentHour = now.getHours();
      let activePeriod: "morning" | "afternoon" | "evening" | "night" = "morning";
      if (currentHour >= 6 && currentHour < 13) {
        activePeriod = "morning";
      } else if (currentHour >= 13 && currentHour < 16) {
        activePeriod = "afternoon";
      } else if (currentHour >= 16 && currentHour < 20) {
        activePeriod = "evening";
      } else {
        activePeriod = "night";
      }

      const activeSlots = futureSlots.filter(s => getSlotPeriod(s) === activePeriod);
      if (activeSlots.length >= 6) {
        return activeSlots;
      } else {
        const subsequentSlots = futureSlots.filter(s => {
          const pOrder = { morning: 1, afternoon: 2, evening: 3, night: 4 };
          return pOrder[getSlotPeriod(s)] > pOrder[activePeriod];
        });
        const needed = 6 - activeSlots.length;
        const topUp = subsequentSlots.slice(0, needed);
        return [...activeSlots, ...topUp];
      }
    }

    return baseSlots;
  }, [selectedDate, weeklyAvailabilityObject, hasNightZoneActive, safeFormatSelectedDate, safeFormatDate]);

  const disabledSlots: string[] = []; // Can be expanded with real booking data later

  const clinicFee = Number(vet.online_fee !== undefined ? vet.online_fee : (vet.onlineFee !== undefined ? vet.onlineFee : (vet.fee || 500)));
  const homeFee = Number(vet.offline_fee !== undefined ? vet.offline_fee : (vet.offlineFee !== undefined ? vet.offlineFee : 800));

  // Determine dynamic demand and supply configuration for late night fee percentage
  const supplyAndDemand = useMemo(() => {
    const idHash = Array.from(vet.id || "vet").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    // Simulate active vets
    const activeVets = 4;
    
    // Simulate booking requests from 2 to 35
    const bookingRequestsOptions = [2, 4, 10, 30, (idHash % 25) + 2];
    const bookingRequests = bookingRequestsOptions[idHash % bookingRequestsOptions.length];
    
    const ratio = bookingRequests / activeVets;

    let surchargePercentage = 0.10; // Default 10%

    // Calculate percentage based on ranges
    if (ratio >= 7.5) { // Very High Demand (e.g. 30/4)
      surchargePercentage = 0.12 + ((idHash % 3) / 100); // 12% - 14%
    } else if (ratio >= 2.5) { // Moderately High (e.g. 10/4)
      surchargePercentage = 0.11 + ((idHash % 2) / 100); // 11% - 12%
    } else if (ratio >= 1.0) { // Balanced (e.g. 4/4)
      surchargePercentage = 0.10 + ((idHash % 2) / 100); // 10% - 11%
    } else { // Low Demand
      surchargePercentage = 0.09 + ((idHash % 2) / 100); // 9% - 10%
    }

    return {
      activeVets,
      bookingRequests,
      surchargePercentage
    };
  }, [vet]);

  const parsedNightMins = selectedSlot ? parseTimeToMins(selectedSlot) : 0;
  const isNightSlotSelected = selectedSlot ? (parsedNightMins >= 0 && parsedNightMins < 360) : false;

  const fees = {
    clinic: { visit: clinicFee },
    home: { visit: homeFee },
  };
  const current = fees[visitType];
  
  const appliedNightSurcharge = (hasNightZoneActive && isNightSlotSelected) ? Math.round(current.visit * supplyAndDemand.surchargePercentage) : 0;
  
  const platformFee = Math.round(current.visit * 0.26);
  const discount = selectedCoupon ? selectedCoupon.value : 0;
  const total = Math.max(0, current.visit + platformFee + appliedNightSurcharge - discount);

  const isSelectedDateToday = !!(selectedDate && (selectedDate instanceof Date) && !isNaN(selectedDate.getTime()) &&
                              selectedDate.getFullYear() === new Date().getFullYear() &&
                              selectedDate.getMonth() === new Date().getMonth() &&
                              selectedDate.getDate() === new Date().getDate());

  const colPairs = useMemo(() => {
    const half = Math.ceil(allSlots.length / 2);
    const r1 = allSlots.slice(0, half);
    const r2 = allSlots.slice(half);
    const pairs = [];
    for (let i = 0; i < half; i++) {
      pairs.push({
        top: r1[i] || null,
        bottom: r2[i] || null,
      });
    }
    return pairs;
  }, [allSlots]);

  const halfIndex = Math.ceil(allSlots.length / 2);
  const row1Slots = allSlots.slice(0, halfIndex);
  const row2Slots = allSlots.slice(halfIndex);

  // Simplified availability check for the status badge
  const availabilityStatus = useMemo(() => {
    if (!weeklyAvailabilityObject) return { isOnline: true, label: "AVAILABLE" };
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();
    const dayName = format(now, "EEE");
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dayData = (weeklyAvailabilityObject as any)[dayName];
    if (dayData) {
      const slots = extractRawSlots(dayData);
      const futureSlots = slots.filter(s => parseTimeToMins(s.timeVal) > currentMins);
      if (futureSlots.length > 0) return { isOnline: true, label: "AVAILABLE" };
    }
    return { isOnline: false, label: "OFFLINE" };
  }, [weeklyAvailabilityObject]);

  const vetName = vet.name || "Doctor";
  const vetSpecialization = vet.specialization || "Veterinarian";
  const vetImage = vet.image || "";
  const vetRating = vet.rating || 0;
  const vetExperience = vet.experience || 0;

  // Check if this is a direct profile booking or AI recommendation
  const isDirectBooking = isDirectState === true;

  const handleBack = () => {
    const backupId = sessionStorage.getItem("last_viewed_vet_id");
    const docId = vet?.id || vet?.vetProfileId || backupId;
    if (docId) {
      navigate(`/vet/doctor/${docId}`);
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <header className="flex-shrink-0 flex items-center justify-between px-4 py-4 relative z-50">
        <button 
          onClick={handleBack} 
          className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center cursor-pointer active:scale-95 transition-all z-10"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground">Booking Details</h1>
        <button className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center">
          <MoreHorizontal className="w-5 h-5 text-foreground" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-5">
        {!isDirectBooking && (
          <>
            <div className="flex justify-center">
              <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-green-50 text-green-600 text-xs font-bold tracking-wider uppercase">
                <span className="text-sm">✦</span> AI Recommended Specialist
              </span>
            </div>
            <p className="text-center text-sm text-muted-foreground -mt-2">
              Based on your pet's symptoms and history, we recommend this top-rated specialist.
            </p>
          </>
        )}

        {/* Doctor Card */}
        <div className="border border-border rounded-2xl p-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-teal-50 flex-shrink-0">
              {vetImage ? (
                <img src={vetImage} alt={vetName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center text-2xl font-bold text-pink-400">
                  {vetName.charAt(0)}
                </div>
              )}
              <div className="absolute bottom-0 right-0 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white">
                <CheckCircle2 className="w-3 h-3 text-white" />
              </div>
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">{vetName}</h2>
              <p className="text-sm font-semibold" style={{ color: '#22C55E' }}>{vetSpecialization}</p>
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> {vetRating}</span>
                <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" /> {vetExperience}+ Years Exp.</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center border-t border-border pt-3">
            <div>
              <p className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase">Fee</p>
              <p className="text-sm font-bold text-foreground">₹{current.visit}<span className="text-xs font-normal text-muted-foreground">/session</span></p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase">Experience</p>
              <p className="text-sm font-bold text-foreground">{vetExperience} Yrs</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase">Status</p>
              <p className="text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1" style={{ color: availabilityStatus.isOnline ? '#22C55E' : '#94A3B8' }}>
                <span className={`w-1.5 h-1.5 rounded-full ${availabilityStatus.isOnline ? 'bg-[#22C55E] animate-pulse' : 'bg-[#94A3B8]'}`}></span>
                {availabilityStatus.label}
              </p>
            </div>
          </div>
        </div>

        {/* Badges */}
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
              <ThumbsUp className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Highly Experienced</p>
              <p className="text-xs text-muted-foreground">{vetExperience}+ years of veterinary experience.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Immediate Availability</p>
              <p className="text-xs text-muted-foreground">Available for Home Visit & Clinic Appointment.</p>
            </div>
          </div>
        </div>

        {/* Visit Type */}
        <div>
          <h3 className="text-base font-bold text-foreground mb-3">Select Visit Type</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setVisitType("clinic")}
              className={`relative flex flex-col items-center gap-2 py-5 rounded-2xl border-2 transition-all ${visitType === "clinic" ? "border-pink-400 bg-pink-50/30" : "border-slate-100 bg-white"}`}
            >
              {visitType === "clinic" && (
                <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-pink-500 flex items-center justify-center">
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                </div>
              )}
              <Hospital className="w-6 h-6 text-pink-500" />
              <span className="text-sm font-bold text-foreground">Clinic Visit</span>
              <span className="text-xs font-semibold" style={{ color: '#FF4D6D' }}>₹{clinicFee}</span>
            </button>
            <button
              onClick={() => setVisitType("home")}
              className={`relative flex flex-col items-center gap-2 py-5 rounded-2xl border-2 transition-all ${visitType === "home" ? "border-pink-400 bg-pink-50/30" : "border-slate-100 bg-white"}`}
            >
              {visitType === "home" && (
                <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-pink-500 flex items-center justify-center">
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                </div>
              )}
              <Home className="w-6 h-6 text-muted-foreground" />
              <span className="text-sm font-bold text-foreground">Home Visit</span>
              <span className="text-xs font-semibold text-muted-foreground">₹{homeFee}</span>
            </button>
          </div>
        </div>

        {/* Booking Schedule */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold text-foreground">Select Date</h3>
            <span className="text-sm font-semibold" style={{ color: '#A78BFA' }}>{safeFormatSelectedDate("MMMM yyyy")}</span>
          </div>
          <div className="grid grid-cols-4 gap-3 mb-5">
            {dates.map((date) => {
              const dateStr = safeFormatDate(date, "yyyy-MM-dd");
              const selectedDateStr = safeFormatSelectedDate("yyyy-MM-dd");
              const isSelected = dateStr === selectedDateStr;
              const uniqueKey = date instanceof Date && !isNaN(date.getTime()) ? date.toISOString() : Math.random().toString();
              return (
                <button key={uniqueKey} onClick={() => setSelectedDate(date)}
                  className="flex flex-col items-center gap-1 py-3 rounded-2xl border-2 transition-all"
                  style={isSelected ? { background: 'linear-gradient(135deg, #C084FC, #F472B6)', border: '2px solid transparent', color: 'white' } : { border: '2px solid #F1F5F9', background: '#ffffff' }}>
                  <span className={`text-xs font-medium ${isSelected ? 'text-white/90' : 'text-muted-foreground'}`}>{safeFormatDate(date, "EEE")}</span>
                  <span className={`text-xl font-bold ${isSelected ? 'text-white' : 'text-foreground'}`}>{safeFormatDate(date, "d")}</span>
                </button>
              );
            })}
          </div>

          <h3 className="text-base font-bold text-foreground mb-3">Available Slots</h3>
          {isSelectedDateToday ? (
            <div className="space-y-3">
              <style>{`
                .no-scrollbar::-webkit-scrollbar {
                  display: none;
                }
              `}</style>
              <div 
                className="flex gap-3 overflow-x-auto no-scrollbar pb-1 snap-x scroll-smooth"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {colPairs.map((pair, idx) => {
                  const isTopDisabled = pair.top ? disabledSlots.includes(pair.top) : true;
                  const isTopSelected = pair.top ? (selectedSlot === pair.top && !isTopDisabled) : false;
                  
                  const isBottomDisabled = pair.bottom ? disabledSlots.includes(pair.bottom) : true;
                  const isBottomSelected = pair.bottom ? (selectedSlot === pair.bottom && !isBottomDisabled) : false;

                  return (
                    <div key={idx} className="flex flex-col gap-3 w-[calc((100%-24px)/3)] flex-shrink-0 snap-start">
                      {pair.top ? (
                        <button 
                          disabled={isTopDisabled} 
                          onClick={() => setSelectedSlot(pair.top!)}
                          className="py-3 rounded-2xl text-[13px] sm:text-sm font-semibold transition-all border-2 text-center"
                          style={isTopSelected ? { background: 'linear-gradient(135deg, #C084FC, #F472B6)', border: '2px solid transparent', color: 'white' } : isTopDisabled ? { border: '2px dotted hsl(var(--border))', color: 'hsl(var(--muted-foreground))', opacity: 0.35, textDecoration: 'line-through' } : { border: '2px solid #F1F5F9', background: '#ffffff', color: 'hsl(var(--foreground))' }}
                        >
                          {pair.top}
                        </button>
                      ) : (
                        <div className="py-3 rounded-2xl text-[13px] sm:text-sm font-semibold border-2 border-transparent select-none pointer-events-none opacity-0">
                          Spacer
                        </div>
                      )}

                      {pair.bottom ? (
                        <button 
                          disabled={isBottomDisabled} 
                          onClick={() => setSelectedSlot(pair.bottom!)}
                          className="py-3 rounded-2xl text-[13px] sm:text-sm font-semibold transition-all border-2 text-center"
                          style={isBottomSelected ? { background: 'linear-gradient(135deg, #C084FC, #F472B6)', border: '2px solid transparent', color: 'white' } : isBottomDisabled ? { border: '2px dotted hsl(var(--border))', color: 'hsl(var(--muted-foreground))', opacity: 0.35, textDecoration: 'line-through' } : { border: '2px solid #F1F5F9', background: '#ffffff', color: 'hsl(var(--foreground))' }}
                        >
                          {pair.bottom}
                        </button>
                      ) : (
                        <div className="py-3 rounded-2xl text-[13px] sm:text-sm font-semibold border-2 border-transparent select-none pointer-events-none opacity-0">
                          Spacer
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {allSlots.map((slot) => {
                const isDisabled = disabledSlots.includes(slot);
                const isSelected = selectedSlot === slot && !isDisabled;
                return (
                  <button key={slot} disabled={isDisabled} onClick={() => setSelectedSlot(slot)}
                    className="py-3 rounded-2xl text-[13px] sm:text-sm font-semibold transition-all border-2"
                    style={isSelected ? { background: 'linear-gradient(135deg, #C084FC, #F472B6)', border: '2px solid transparent', color: 'white' } : isDisabled ? { border: '2px dotted hsl(var(--border))', color: 'hsl(var(--muted-foreground))', opacity: 0.35, textDecoration: 'line-through' } : { border: '2px solid #F1F5F9', background: '#ffffff', color: 'hsl(var(--foreground))' }}>
                    {slot}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Saving Corner */}
        <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-2xl p-4 border border-green-100 mt-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                <Gift className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-bold text-foreground text-sm sm:text-base">Saving Corner</h3>
                <p className="text-xs text-muted-foreground">Apply coupons & save more</p>
              </div>
            </div>
            {selectedCoupon && (
              <button 
                onClick={() => setSelectedCoupon(null)}
                className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-1 rounded-md"
              >
                REMOVE
              </button>
            )}
          </div>
          
          <Dialog open={showCoupons} onOpenChange={setShowCoupons}>
            <DialogTrigger asChild>
              <button className="w-full bg-white/80 backdrop-blur-sm border-2 border-dashed border-green-350 rounded-xl py-3 px-4 flex items-center justify-between hover:bg-white transition-colors group">
                <div className="flex items-center gap-2">
                  <Percent className="w-4 h-4 text-teal-600" />
                  <span className="font-semibold text-teal-600 text-sm">
                    {selectedCoupon ? (
                      <span className="flex items-center gap-2">
                        Coupon Applied: <span className="bg-teal-100 px-2 py-0.5 rounded text-xs font-bold outline-dashed outline-1 outline-teal-300">{selectedCoupon.code}</span>
                      </span>
                    ) : "Apply Coupon"}
                  </span>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] sm:max-w-md rounded-3xl p-6">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  <Ticket className="w-5 h-5 text-teal-600" />
                  Available Coupons
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                {COUPONS.map((coupon) => (
                  <div 
                    key={coupon.code}
                    onClick={() => {
                      setSelectedCoupon(coupon);
                      setShowCoupons(false);
                      toast.success(`Coupon ${coupon.code} applied!`);
                    }}
                    className={`relative p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                      selectedCoupon?.code === coupon.code 
                        ? "border-teal-500 bg-teal-50/50" 
                        : "border-muted hover:border-teal-200"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-black text-[#151B32] text-sm tracking-wider bg-muted px-2 py-0.5 rounded border border-border">
                            {coupon.code}
                          </span>
                          {selectedCoupon?.code === coupon.code && (
                            <CheckCircle2 className="w-4 h-4 text-teal-600" />
                          )}
                        </div>
                        <p className="text-[13px] font-bold text-teal-700">Save ₹{coupon.value}</p>
                        <p className="text-[11px] text-muted-foreground mt-1">{coupon.description}</p>
                      </div>
                      <button className="text-xs font-bold text-teal-600">APPLY</button>
                    </div>
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary */}
        <div className="mt-4">
          <div className="bg-white rounded-[24px] border border-slate-100 p-5 shadow-[0_4px_24px_rgba(0,0,0,0.03)] space-y-5">
            {/* Header Section */}
            <div 
              onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}
              className="flex items-center justify-between cursor-pointer select-none"
            >
              <div className="flex items-center gap-3">
                {/* Receipt icon exactly matching the uploaded design */}
                <div className="w-10 h-10 flex items-center justify-center bg-transparent">
                  <svg 
                    width="42" 
                    height="42" 
                    viewBox="0 0 100 100" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                    className="text-[#0E8A4E]"
                  >
                    {/* Outline of the receipt of the exact uploaded layout */}
                    <path 
                      d="M 35 15 H 65 L 80 30 V 80 Q 72.5 87, 65 80 Q 57.5 87, 50 80 Q 42.5 87, 35 80 Q 27.5 87, 20 80 V 25 A 10 10 0 0 1 35 15 Z" 
                      stroke="currentColor" 
                      strokeWidth="5.5" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                    />
                    {/* Fold corner path */}
                    <path 
                      d="M 65 15 V 30 H 80" 
                      stroke="currentColor" 
                      strokeWidth="5.5" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                    />
                    {/* First checkmark and line */}
                    <path 
                      d="M 34 43 L 38 47 L 45 39" 
                      stroke="currentColor" 
                      strokeWidth="5.5" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                    />
                    <path 
                      d="M 52 43 H 72" 
                      stroke="currentColor" 
                      strokeWidth="5.5" 
                      strokeLinecap="round" 
                    />
                    {/* Second checkmark and line */}
                    <path 
                      d="M 34 54 L 38 58 L 45 50" 
                      stroke="currentColor" 
                      strokeWidth="5.5" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                    />
                    <path 
                      d="M 52 54 H 72" 
                      stroke="currentColor" 
                      strokeWidth="5.5" 
                      strokeLinecap="round" 
                    />
                    {/* Third checkmark and line */}
                    <path 
                      d="M 34 65 L 38 69 L 45 61" 
                      stroke="currentColor" 
                      strokeWidth="5.5" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                    />
                    <path 
                      d="M 52 65 H 72" 
                      stroke="currentColor" 
                      strokeWidth="5.5" 
                      strokeLinecap="round" 
                    />
                  </svg>
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900 leading-tight">Total Amount ₹{total.toFixed(2)}</h4>
                  <p className="text-[#0E8A4E] text-xs font-semibold">Breakdown of your consultation below.</p>
                </div>
              </div>
              {isSummaryExpanded ? (
                <ChevronUp className="w-5 h-5 text-slate-800" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-800" />
              )}
            </div>

            {isSummaryExpanded && (
              <>
                {/* Horizontal Dashed Divider Line */}
                <div className="border-t border-dashed border-slate-200" />

                {/* Content Rows */}
                <div className="space-y-4">
                  <div className="flex justify-between text-[15px] text-slate-900 font-medium">
                    <span>{visitType === "clinic" ? "Clinic Visit Fee" : "Home Visit Fee"}</span>
                    <span>₹{current.visit.toFixed(2)}</span>
                  </div>
                  {selectedCoupon && (
                    <div className="flex justify-between text-[15px] text-green-600 font-medium">
                      <span>Saving Corner Discount</span>
                      <span>- ₹{discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[15px] text-slate-900 font-medium">
                    <span>Platform Fee</span>
                    <span>₹{platformFee.toFixed(2)}</span>
                  </div>
                  {appliedNightSurcharge > 0 && (
                    <div className="flex justify-between text-[15px] items-center">
                      <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                        <Moon className="w-[18px] h-[18px] text-slate-500" />
                        <span>Late Night Fees</span>
                      </div>
                      <span className="font-medium text-slate-500">+ ₹{appliedNightSurcharge.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[15px] text-slate-500/80 font-normal">
                    <span>GST & Other Charges</span>
                    <span>₹0.00</span>
                  </div>
                </div>

                {/* Horizontal Dashed Divider Line */}
                <div className="border-t border-dashed border-slate-200" />

                {/* Bottom Total Block */}
                <div className="flex justify-between items-center pt-1">
                  <span className="font-bold text-slate-900 text-[16px]">Total Amount</span>
                  <span className="font-bold text-slate-900 text-lg">₹{total.toFixed(2)}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 px-4 pb-4 pt-3 bg-gradient-to-t from-background via-background to-transparent">
        <div className="flex items-center gap-3">
          <button className="w-12 h-12 rounded-full border border-border flex items-center justify-center flex-shrink-0">
            <MessageSquare className="w-5 h-5 text-muted-foreground" />
          </button>
          <button
            onClick={() => {
              if (!selectedSlot) {
                toast.error("Please select a time slot to continue booking.");
                return;
              }
              // Open beautiful Razorpay simulation overlay
              setRazorpayOpen(true);
              setPaymentStep("payment_method");
            }}
            className="flex-1 py-4 rounded-2xl font-bold text-white text-base flex items-center justify-center gap-2 shadow-lg"
            style={{ background: 'linear-gradient(90deg, #FF4D6D, #8B5CF6)' }}>
            Confirm Appointment
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ═══════════════ DETAILED RAZORPAY SANDBOX CHECKOUT POPUP OVERLAY ═══════════════ */}
      {razorpayOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 select-none">
          <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-gray-100 animate-scale-in">
            
            {/* Razorpay Secure header segment */}
            <div className="bg-[#181920] px-5 py-4 flex items-center justify-between text-white border-b border-gray-800">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-[#2280FF] flex items-center justify-center text-xs font-black italic text-white tracking-tighter">
                  r
                </div>
                <div>
                  <h3 className="text-xs font-black tracking-widest uppercase text-gray-400">Razorpay Secure</h3>
                  <p className="text-[10px] text-green-400 font-bold tracking-tight">SANDBOX MODE</p>
                </div>
              </div>
              
              {paymentStep === "payment_method" && (
                <button 
                  onClick={() => setRazorpayOpen(false)}
                  className="text-gray-400 hover:text-white p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Merchant info block */}
            <div className="bg-gray-50 px-5 py-3 flex justify-between items-center border-b border-gray-100">
              <div>
                <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider">Sruvo Pet Clinic</h4>
                <p className="text-[10px] text-gray-400 font-medium">Appointment Booking Fee</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-black text-slate-950">₹{total.toFixed(2)}</p>
                <span className="text-[9px] font-black text-[#2280FF] bg-blue-50 px-1.5 py-0.5 rounded outline-dashed outline-1 outline-blue-200 uppercase">Sandbox</span>
              </div>
            </div>

            {/* Simulated Checkout Steps Router */}
            <div className="p-5 flex-1 overflow-y-auto">
              
              {/* STEP 1: PAYMENT METHOD SELECTOR */}
              {paymentStep === "payment_method" && (
                <div className="space-y-4 animate-fade-in font-bold text-gray-700">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Select Payment Option</p>
                  
                  {/* Option 1: UPI Gateway */}
                  <div 
                    onClick={() => setSelectedPaymentOption("upi")}
                    className={`p-4 border-2 rounded-2xl cursor-pointer flex items-center justify-between transition-all ${
                      selectedPaymentOption === "upi" ? "border-[#2280FF] bg-blue-50/40" : "border-slate-100 hover:border-blue-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                        <Wallet className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900">UPI / QR (Recommended)</p>
                        <p className="text-[10px] text-slate-400">Google Pay, PhonePe, Paytm</p>
                      </div>
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      selectedPaymentOption === "upi" ? "bg-[#2280FF] border-[#2280FF]" : "border-gray-300"
                    }`}>
                      {selectedPaymentOption === "upi" && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3.5} />}
                    </div>
                  </div>

                  {/* Option 2: Simulated Card */}
                  <div 
                    onClick={() => setSelectedPaymentOption("card")}
                    className={`p-4 border-2 rounded-2xl cursor-pointer flex items-center justify-between transition-all ${
                      selectedPaymentOption === "card" ? "border-[#2280FF] bg-blue-50/40" : "border-slate-100 hover:border-blue-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900">Debit / Credit Card</p>
                        <p className="text-[10px] text-slate-400">Visa, MasterCard, RuPay</p>
                      </div>
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      selectedPaymentOption === "card" ? "bg-[#2280FF] border-[#2280FF]" : "border-gray-300"
                    }`}>
                      {selectedPaymentOption === "card" && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3.5} />}
                    </div>
                  </div>

                  {/* Option 3: Netbanking */}
                  <div 
                    onClick={() => setSelectedPaymentOption("netbanking")}
                    className={`p-4 border-2 rounded-2xl cursor-pointer flex items-center justify-between transition-all ${
                      selectedPaymentOption === "netbanking" ? "border-[#2280FF] bg-blue-50/40" : "border-slate-100 hover:border-blue-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
                        <Briefcase className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900">Net Banking</p>
                        <p className="text-[10px] text-slate-400">SBI, ICICI, HDFC, Axis</p>
                      </div>
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      selectedPaymentOption === "netbanking" ? "bg-[#2280FF] border-[#2280FF]" : "border-gray-300"
                    }`}>
                      {selectedPaymentOption === "netbanking" && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3.5} />}
                    </div>
                  </div>

                  {/* UPI Inputs prefilled precisely and cleanly for the user */}
                  {selectedPaymentOption === "upi" && (
                    <div className="mt-3 bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-2 animate-slide-down">
                      <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">PREFILLED UPI ID</label>
                      <input 
                        type="text" 
                        value={simulatedUPIId} 
                        onChange={(e) => setSimulatedUPIId(e.target.value)}
                        className="w-full text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#2280FF]"
                        placeholder="Enter your UPI ID..."
                      />
                    </div>
                  )}

                  <button 
                    onClick={() => {
                      // Trigger payment steps
                      setPaymentStep("processing");
                      setTimeout(() => {
                        setPaymentStep("confirming");
                        setTimeout(() => {
                          setPaymentStep("accepted");
                          setTimeout(async () => {
                            // Finish and redirect to Visit Details
                            setRazorpayOpen(false);

                            let realBookingId = "SRV-84721";
                            try {
                              // Get vet's profile user_id
                              const { data: vp } = await supabase
                                .from("vet_profiles")
                                .select("user_id")
                                .eq("id", vet.id)
                                .single();

                              const vetUserId = vp?.user_id || "f9834ef6-778d-4384-8d17-6316fffa03b6";

                              // Get current authenticated user
                              const { data: { user: authUser } } = await supabase.auth.getUser();
                              const userId = authUser?.id || "f9834ef6-778d-4384-8d17-6316fffa03b6";

                              const appointmentDate = safeFormatSelectedDate("yyyy-MM-dd");
                              const appointmentTime = selectedSlot || "11:30 AM";
                              const appointmentType = visitType || "clinic";
                              const amountVal = total || 499;

                              const petNameVal = location.state?.petName || location.state?.selectedPet?.name || "Luna";
                              const petTypeVal = location.state?.selectedPet?.type || "Dog";
                              const petBreedVal = location.state?.selectedPet?.breed || "Golden Retriever • Female";

                              const { data: insertResult, error: insertError } = await supabase
                                .from("vet_appointments")
                                .insert({
                                  vet_id: vetUserId,
                                  user_id: userId,
                                  appointment_date: appointmentDate,
                                  appointment_time: appointmentTime,
                                  appointment_type: appointmentType,
                                  amount: amountVal,
                                  status: "pending",
                                  pet_name: petNameVal,
                                  pet_type: petTypeVal,
                                  pet_breed: petBreedVal
                                })
                                .select()
                                .single();

                              if (insertError) {
                                console.error("Error creating real appointment:", insertError);
                              } else if (insertResult) {
                                console.log("Real appointment created:", insertResult);
                                realBookingId = insertResult.id;
                              }
                            } catch (insertErr) {
                              console.error("Error inserting appointment:", insertErr);
                            }

                            toast.success("Payment successful! Requesting vet confirmation...");
                            navigate("/vet/clinic-booking-confirmation", { 
                              state: { 
                                visit: {
                                  id: realBookingId,
                                  vet: {
                                    name: veterinarian.name,
                                    image: veterinarian.image,
                                    specialization: veterinarian.specialization || "Veterinarian"
                                  },
                                  appointmentId: realBookingId,
                                  visitType: visitType,
                                  petName: location.state?.petName || location.state?.selectedPet?.name || "Luna",
                                  petBreed: location.state?.selectedPet?.breed || "Golden Retriever • Female",
                                  petAge: "4 Years",
                                  ownerName: "Sarah Jenkins",
                                  ownerPhone: "+91 98765 43210",
                                  address: visitType === "home" ? "123 Premium Residency, Indiranagar" : "HSR Paws Clinic, Sector 2",
                                  time: safeFormatSelectedDate("dd MMM yyyy") + ", " + selectedSlot,
                                  reason: "General Consultation & Checkup",
                                  image: "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=300&q=80",
                                  distance: visitType === "home" ? "1.2 miles away" : "12 mins (4.2 miles)"
                                }
                              } 
                            });
                          }, 1800);
                        }, 1200);
                      }, 1200);
                    }}
                    className="w-full mt-3 bg-[#2280FF] hover:bg-blue-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-1.5 shadow-lg shadow-blue-100"
                  >
                    <Lock className="w-4 h-4" />
                    Simulate Pay ₹{total.toFixed(2)}
                  </button>
                </div>
              )}

              {/* STEP 2: PROCESSING SIMULATOR */}
              {paymentStep === "processing" && (
                <div className="flex flex-col items-center justify-center text-center py-6 space-y-4 animate-fade-in">
                  <div className="w-12 h-12 border-4 border-slate-150 border-t-[#2280FF] rounded-full animate-spin" />
                  <div>
                    <h4 className="font-extrabold text-[#111827] text-base">Processing Sandbox Payment...</h4>
                    <p className="text-xs text-slate-400 mt-1">Connecting securely with UPI bank gateway. Please do not close this modal or refresh.</p>
                  </div>
                </div>
              )}

              {/* STEP 3: CONFIRMING PAYMENT */}
              {paymentStep === "confirming" && (
                <div className="flex flex-col items-center justify-center text-center py-6 space-y-4 animate-fade-in">
                  <div className="w-12 h-12 border-4 border-slate-150 border-t-purple-500 rounded-full animate-spin" />
                  <div>
                    <h4 className="font-extrabold text-[#111827] text-base">Verifying Transaction Balance...</h4>
                    <p className="text-xs text-slate-400 mt-1">Acquiring settlement verification codes from simulated merchant gateway.</p>
                  </div>
                </div>
              )}

              {/* STEP 4: CONFIRMED & ACCEPTED */}
              {paymentStep === "accepted" && (
                <div className="flex flex-col items-center justify-center text-center py-6 space-y-5 animate-fade-in">
                  <div className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center text-white scale-110 shadow-lg shadow-green-100 animate-scale-in">
                    <Check className="w-7 h-7" strokeWidth={3} />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-green-600 text-lg">Payment Done ✓</h4>
                    <div className="mt-2.5 bg-green-50 text-green-700 text-xs font-bold py-2 px-4 rounded-xl border border-green-100 inline-block">
                      Dr. Anaya Accepted Request!
                    </div>
                    <p className="text-xs text-slate-400 mt-3 font-semibold blinking-anim text-center">Redirecting you to Springfield visit details...</p>
                  </div>
                </div>
              )}

            </div>

            {/* Secure security locks */}
            <div className="bg-gray-50 px-5 py-3 flex items-center justify-center gap-1.5 border-t border-gray-100 text-[10px] text-gray-400 font-bold">
              <Shield className="w-3.5 h-3.5 text-green-500" />
              <span>PCI-DSS Certified 256-bit Encrypted Session</span>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default BookingDetails;