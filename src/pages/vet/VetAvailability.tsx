import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Building2, 
  Hospital, 
  Plus, 
  Check, 
  Loader2, 
  X, 
  Clock, 
  Sunrise, 
  Sun, 
  Moon, 
  CheckSquare, 
  Sparkles,
  CalendarDays,
  Copy
} from "lucide-react";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import SplashScreen from "@/components/SplashScreen";
import ClockPickerModal from "@/components/ClockPicker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const daysList = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface Slot {
  time: string;
  location: string;
}

interface PeriodData {
  enabled: boolean;
  slots: Slot[];
}

interface DayAvailability {
  morning: PeriodData;
  afternoon: PeriodData;
  evening: PeriodData;
  night: PeriodData;
}

const defaultDayConfig = (): DayAvailability => ({
  morning: { enabled: false, slots: [] },
  afternoon: { enabled: false, slots: [] },
  evening: { enabled: false, slots: [] },
  night: { enabled: false, slots: [] }
});

const cloneDayData = (dayObj: DayAvailability): DayAvailability => {
  return {
    morning: { enabled: dayObj.morning.enabled, slots: (dayObj.morning.slots || []).map(s => ({ ...s })) },
    afternoon: { enabled: dayObj.afternoon.enabled, slots: (dayObj.afternoon.slots || []).map(s => ({ ...s })) },
    evening: { enabled: dayObj.evening.enabled, slots: (dayObj.evening.slots || []).map(s => ({ ...s })) },
    night: { enabled: dayObj.night.enabled, slots: (dayObj.night.slots || []).map(s => ({ ...s })) }
  };
};

const VetAvailability = () => {
  const navigate = useNavigate();
  const { user, isLoading: guardLoading, showSpinner } = useRoleGuard(["vet"], "/auth/vet", true);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Database stored fields
  const [practiceType, setPracticeType] = useState<string[]>(["Hospital / Organization"]);
  const [weeklyAvailability, setWeeklyAvailability] = useState<Record<string, DayAvailability>>({
    Mon: defaultDayConfig(),
    Tue: defaultDayConfig(),
    Wed: defaultDayConfig(),
    Thu: defaultDayConfig(),
    Fri: defaultDayConfig(),
    Sat: defaultDayConfig(),
    Sun: defaultDayConfig()
  });

  const [selectedDay, setSelectedDay] = useState("Mon");
  const [sameTimingAllDays, setSameTimingAllDays] = useState(false);

  // Clock picker state
  const [isClockPickerOpen, setIsClockPickerOpen] = useState(false);
  const [clockPickerPeriod, setClockPickerPeriod] = useState<"morning" | "afternoon" | "evening" | "night">("morning");

  // Fetch data
  const fetchAvailabilityData = useCallback(async () => {
    if (!user) return;
    try {
      const { data: vetProfile, error } = await supabase
        .from("vet_profiles")
        .select("weekly_availability, practice_type")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching weekly availability:", error);
        toast.error("Failed to load availability details.");
      } else if (vetProfile) {
        if (vetProfile.practice_type) {
          setPracticeType(vetProfile.practice_type || ["Hospital / Organization"]);
        }
        
        let rawAvail = vetProfile.weekly_availability;
        if (rawAvail) {
          // If stored as a string representation
          if (typeof rawAvail === "string") {
            try {
              rawAvail = JSON.parse(rawAvail);
            } catch (e) {
              console.error("Failed to parse JSON weekly_availability:", e);
            }
          }
          
          if (typeof rawAvail === "object" && rawAvail !== null) {
            const casted = rawAvail as Record<string, Record<string, { enabled?: boolean; slots?: Slot[] }>>;
            const parsedConfig: Record<string, DayAvailability> = {};
            
            daysList.forEach(day => {
              const dayData = casted[day] || {};
              parsedConfig[day] = {
                morning: {
                  enabled: !!dayData.morning?.enabled,
                  slots: Array.isArray(dayData.morning?.slots) ? dayData.morning.slots : []
                },
                afternoon: {
                  enabled: !!dayData.afternoon?.enabled,
                  slots: Array.isArray(dayData.afternoon?.slots) ? dayData.afternoon.slots : []
                },
                evening: {
                  enabled: !!dayData.evening?.enabled,
                  slots: Array.isArray(dayData.evening?.slots) ? dayData.evening.slots : []
                },
                night: {
                  enabled: !!dayData.night?.enabled,
                  slots: Array.isArray(dayData.night?.slots) ? dayData.night.slots : []
                }
              };
            });
            setWeeklyAvailability(parsedConfig);

            // Find first active day as default selectedDay, else default to "Mon"
            const activeDays = daysList.filter(d => {
              const dayObj = parsedConfig[d];
              return dayObj.morning.enabled || dayObj.afternoon.enabled || dayObj.evening.enabled || dayObj.night.enabled;
            });
            if (activeDays.length > 0) {
              setSelectedDay(activeDays[0]);
            }
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchAvailabilityData();
    }
  }, [user, fetchAvailabilityData]);

  // Derived enabled days from weeklyAvailability
  const enabledDays = daysList.filter(d => {
    const dayData = weeklyAvailability[d];
    return dayData && (dayData.morning.enabled || dayData.afternoon.enabled || dayData.evening.enabled || dayData.night.enabled);
  });

  // Toggle whole day availability
  const toggleDay = (day: string) => {
    setIsDirty(true);
    setWeeklyAvailability(prev => {
      const dayData = prev[day];
      const isAnyPeriodEnabled = dayData && (dayData.morning.enabled || dayData.afternoon.enabled || dayData.evening.enabled || dayData.night.enabled);

      let nextDayData: DayAvailability;
      if (isAnyPeriodEnabled) {
        // Disable all periods
        nextDayData = defaultDayConfig();
      } else {
        // Enable with morning as default
        nextDayData = {
          morning: { enabled: true, slots: [] },
          afternoon: { enabled: false, slots: [] },
          evening: { enabled: false, slots: [] },
          night: { enabled: false, slots: [] }
        };
      }

      const updated = {
        ...prev,
        [day]: nextDayData
      };

      return updated;
    });

    // Handle selectedDay index adjustment
    setTimeout(() => {
      setWeeklyAvailability(latest => {
        const active = daysList.filter(d => {
          const dayObj = latest[d];
          return dayObj.morning.enabled || dayObj.afternoon.enabled || dayObj.evening.enabled || dayObj.night.enabled;
        });
        if (active.length > 0) {
          if (!active.includes(selectedDay)) {
            setSelectedDay(active[0]);
          }
        } else {
          setSelectedDay("Mon");
        }
        return latest;
      });
    }, 0);
  };

  // Toggle specific period (Morning, Afternoon, etc.)
  const handleTogglePeriod = (period: "morning" | "afternoon" | "evening" | "night") => {
    setIsDirty(true);
    setWeeklyAvailability(prev => {
      const dayData = prev[selectedDay];
      const pData = dayData[period];
      const nextEnabled = !pData.enabled;

      const next = {
        ...prev,
        [selectedDay]: {
          ...dayData,
          [period]: {
            ...pData,
            enabled: nextEnabled,
            slots: pData.slots || []
          }
        }
      };

      if (sameTimingAllDays) {
        const sourceDayData = next[selectedDay];
        daysList.forEach(day => {
          if (day !== selectedDay) {
            next[day] = cloneDayData(sourceDayData);
          }
        });
      }
      return next;
    });
  };

  const handleOpenAddSlot = (period: "morning" | "afternoon" | "evening" | "night") => {
    setClockPickerPeriod(period);
    setIsClockPickerOpen(true);
  };

  const convertTimeTo12Hr = (time24: string): string => {
    if (!time24) return "";
    const [hourStr, minStr] = time24.split(":");
    let hour = parseInt(hourStr, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12;
    hour = hour ? hour : 12;
    const hrStr = hour < 10 ? `0${hour}` : `${hour}`;
    return `${hrStr}:${minStr} ${ampm}`;
  };

  const handleSaveClockPickerSlot = (start24: string, end24: string) => {
    setIsDirty(true);
    setIsClockPickerOpen(false);

    const formattedStart = convertTimeTo12Hr(start24);
    const formattedEnd = convertTimeTo12Hr(end24);
    const timeStr = `${formattedStart} – ${formattedEnd}`;

    let defaultLocation = "Hospital";
    if (practiceType.length === 1) {
      if (practiceType.includes("Independent Clinic / Hospital Partner") || practiceType.includes("Clinic")) {
        defaultLocation = "Independent Clinic";
      }
    }

    setWeeklyAvailability(prev => {
      const dayData = prev[selectedDay];
      const pData = dayData[clockPickerPeriod];
      
      const newSlot: Slot = {
        time: timeStr,
        location: defaultLocation
      };

      const updatedSlots = [...pData.slots, newSlot];

      const next = {
        ...prev,
        [selectedDay]: {
          ...dayData,
          [clockPickerPeriod]: {
            ...pData,
            slots: updatedSlots
          }
        }
      };

      if (sameTimingAllDays) {
        const sourceDayData = next[selectedDay];
        daysList.forEach(day => {
          if (day !== selectedDay) {
            next[day] = cloneDayData(sourceDayData);
          }
        });
      }
      return next;
    });
  };

  const handleRemoveSlot = (period: "morning" | "afternoon" | "evening" | "night", index: number) => {
    setIsDirty(true);
    setWeeklyAvailability(prev => {
      const dayData = prev[selectedDay];
      const pData = dayData[period];
      const updatedSlots = [...pData.slots];
      updatedSlots.splice(index, 1);

      const next = {
        ...prev,
        [selectedDay]: {
          ...dayData,
          [period]: {
            ...pData,
            slots: updatedSlots
          }
        }
      };

      if (sameTimingAllDays) {
        const sourceDayData = next[selectedDay];
        daysList.forEach(day => {
          if (day !== selectedDay) {
            next[day] = cloneDayData(sourceDayData);
          }
        });
      }
      return next;
    });
  };

  const updateSlotLocation = (period: "morning" | "afternoon" | "evening" | "night", index: number, loc: string) => {
    setIsDirty(true);
    setWeeklyAvailability(prev => {
      const dayData = prev[selectedDay];
      const pData = dayData[period];
      const updatedSlots = pData.slots.map((s, idx) => idx === index ? { ...s, location: loc } : s);

      const next = {
        ...prev,
        [selectedDay]: {
          ...dayData,
          [period]: {
            ...pData,
            slots: updatedSlots
          }
        }
      };

      if (sameTimingAllDays) {
        const sourceDayData = next[selectedDay];
        daysList.forEach(day => {
          if (day !== selectedDay) {
            next[day] = cloneDayData(sourceDayData);
          }
        });
      }
      return next;
    });
  };

  const handleSaveToDatabase = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const activeDays = daysList.filter(d => {
        const dayData = weeklyAvailability[d];
        return dayData && (dayData.morning.enabled || dayData.afternoon.enabled || dayData.evening.enabled || dayData.night.enabled);
      });

      const hasMorning = Object.values(weeklyAvailability).some(d => d.morning.enabled && d.morning.slots.length > 0);
      const hasEvening = Object.values(weeklyAvailability).some(d => d.evening.enabled && d.evening.slots.length > 0);

      // We preserve the ai_description property inside weekly_availability if already present
      const { data: currentProfile } = await supabase
        .from("vet_profiles")
        .select("weekly_availability")
        .eq("user_id", user.id)
        .maybeSingle();

      const mergedAvail: Record<string, unknown> = { ...weeklyAvailability };
      if (currentProfile?.weekly_availability && typeof currentProfile.weekly_availability === "object") {
        const rawObj = currentProfile.weekly_availability as Record<string, unknown>;
        if (rawObj.ai_description) {
          mergedAvail.ai_description = rawObj.ai_description;
        }
      }

      const { error } = await supabase
        .from("vet_profiles")
        .update({
          weekly_availability: mergedAvail,
          available_days: activeDays,
          morning_slots: hasMorning,
          evening_slots: hasEvening
        })
        .eq("user_id", user.id);

      if (error) throw error;

      setIsDirty(false);
      toast.success("Schedule timings updated successfully!");
    } catch (err: unknown) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Failed to save: ${errMsg}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (showSpinner || loading) {
    return <SplashScreen message="Loading schedule settings..." />;
  }

  return (
    <div className="bg-[#F9FAFC] min-h-screen pb-32 font-sans text-slate-900 selection:bg-indigo-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md px-4 py-4 flex items-center justify-between border-b border-slate-100 shadow-sm">
        <button 
          onClick={() => navigate("/vet/profile")}
          className="p-2 text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-bold text-slate-900">Manage Availability</h1>
        <div className="w-10"></div>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-6 space-y-6">
        {/* Banner Card */}
        <div className="bg-gradient-to-br from-pink-50 to-indigo-50 rounded-2xl p-5 border border-pink-100/60 flex items-start gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-pink-100 flex items-center justify-center text-pink-600 shrink-0">
            <Sparkles size={24} className="animate-pulse" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-[15px]">Schedule & Timings</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed font-medium">
              Update your days, active periods, and custom time slots here. Changes reflect immediately on the buyer booking screen, ensuring zero scheduling conflicts.
            </p>
          </div>
        </div>

        {/* 1. Day Selection Toggles */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-indigo-600" />
            <h3 className="font-extrabold text-slate-800 text-sm">Select Available Days</h3>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
            {daysList.map(day => {
              const dayData = weeklyAvailability[day];
              const isEnabled = dayData && (dayData.morning.enabled || dayData.afternoon.enabled || dayData.evening.enabled || dayData.night.enabled);

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`flex flex-col items-center justify-center py-3 px-2 rounded-xl border transition-all relative select-none active:scale-95 ${
                    isEnabled
                      ? "border-pink-300 bg-pink-50/45 text-pink-950 shadow-xs font-bold"
                      : "border-slate-100 bg-white text-slate-400 hover:bg-slate-50"
                  }`}
                >
                  <span className={`text-[11px] font-bold ${isEnabled ? "text-[#EC4899]" : "text-slate-400"}`}>
                    {day}
                  </span>
                  <div className="mt-2.5">
                    {isEnabled ? (
                      <CheckSquare className="w-4 h-4 text-pink-500 fill-pink-50" />
                    ) : (
                      <div className="w-4 h-4 border border-slate-300 rounded bg-slate-50" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Customize timings per day tab */}
        {enabledDays.length > 0 ? (
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Configure Slots for Selected Day</span>
              
              {/* Copy Timings Toggle */}
              <button
                type="button"
                onClick={() => {
                  setSameTimingAllDays(!sameTimingAllDays);
                  if (!sameTimingAllDays) {
                    // Instantly copy selectedDay configuration to all other days unconditionally
                    setWeeklyAvailability(prev => {
                      const next = { ...prev };
                      const sourceDayData = next[selectedDay];
                      daysList.forEach(day => {
                        if (day !== selectedDay) {
                          next[day] = cloneDayData(sourceDayData);
                        }
                      });
                      return next;
                    });
                    toast.success(`Applied ${selectedDay}'s schedule to all days!`);
                  }
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                  sameTimingAllDays 
                    ? "bg-indigo-50 border-indigo-200 text-indigo-700" 
                    : "border-slate-200 text-slate-500 hover:bg-slate-50"
                }`}
              >
                <Copy size={13} />
                <span>Apply same timing to all days</span>
              </button>
            </div>

            {/* Selected day tabs */}
            <div className="border border-slate-100 bg-slate-50/50 p-1 rounded-xl flex flex-wrap gap-1.5">
              {daysList.filter(d => enabledDays.includes(d)).map(d => {
                const isChosen = selectedDay === d;
                const isSunday = d === "Sun";
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setSelectedDay(d)}
                    className={`flex-1 min-w-[64px] py-2 rounded-lg font-extrabold text-xs text-center transition-all ${
                      isChosen
                        ? "bg-gradient-to-br from-[#B26BFF] to-[#8E2DE2] text-white shadow-sm"
                        : isSunday
                          ? "text-red-500 hover:bg-slate-100"
                          : "text-slate-500 hover:bg-slate-100"
                    }`}
                  >
                    {d}
                  </button>
                );
              })}
            </div>

            {/* Custom period list */}
            <div className="space-y-4 pt-2">
              {(["morning", "afternoon", "evening", "night"] as const).map(periodKey => {
                const periodInfo = {
                  morning: { label: "Morning", hours: "09:00 AM - 01:00 PM", bg: "bg-emerald-50/45 border-emerald-100 text-emerald-800", icon: <Sunrise className="w-4 h-4 text-emerald-600" /> },
                  afternoon: { label: "Afternoon", hours: "01:00 PM - 04:00 PM", bg: "bg-amber-50/45 border-amber-100 text-amber-850", icon: <Sun className="w-4 h-4 text-amber-600" /> },
                  evening: { label: "Evening", hours: "04:00 PM - 08:00 PM", bg: "bg-indigo-50/45 border-indigo-100 text-indigo-900", icon: <Moon className="w-4 h-4 text-indigo-600" /> },
                  night: { label: "Night", hours: "08:00 PM - 12:00 AM", bg: "bg-pink-50/45 border-pink-100 text-pink-900", icon: <Moon className="w-4 h-4 text-pink-600" /> }
                }[periodKey];

                const dayData = weeklyAvailability[selectedDay];
                const periodAvailability = dayData ? dayData[periodKey] : { enabled: false, slots: [] };
                const isEnabled = periodAvailability.enabled;

                return (
                  <div
                    key={periodKey}
                    className={`flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 border rounded-2xl transition-all ${
                      isEnabled
                        ? "border-slate-100 bg-[#FAFAFC] shadow-2xs"
                        : "border-slate-100 bg-slate-50/40 opacity-70"
                    }`}
                  >
                    {/* Period metadata & Toggle */}
                    <div className={`flex items-center justify-between gap-3 py-2 px-3 rounded-xl border w-full md:w-[185px] shrink-0 ${periodInfo.bg}`}>
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="shrink-0">{periodInfo.icon}</div>
                        <div className="min-w-0 flex-1 text-left">
                          <span className="font-extrabold text-xs tracking-tight block text-slate-800">{periodInfo.label}</span>
                          <span className="text-[9px] opacity-75 font-semibold block truncate mt-0.5">{periodInfo.hours}</span>
                        </div>
                      </div>
                      
                      {/* Inner Switch - Vertically centered! */}
                      <button
                        type="button"
                        onClick={() => handleTogglePeriod(periodKey)}
                        className={`relative inline-flex h-4 w-8 shrink-0 cursor-pointer rounded-full border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          isEnabled ? "bg-[#EC4899]" : "bg-slate-200"
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                            isEnabled ? "translate-x-4" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>

                    {/* Slots Area */}
                    <div className="flex-1 flex flex-wrap items-center gap-2 min-w-0">
                      {isEnabled ? (
                        <>
                          {periodAvailability.slots.map((slot, sIdx) => {
                            const showLocationSelector = practiceType.length > 1;
                            const defaultLoc = (practiceType[0]?.includes("Hospital") || !practiceType[0]) ? "Hospital" : "Independent Clinic";
                            const slotLocation = slot.location || defaultLoc;
                            const locIcon = slotLocation === "Hospital" ? <Hospital className="w-3.5 h-3.5 text-pink-500" /> : <Building2 className="w-3.5 h-3.5 text-indigo-500" />;

                            return (
                              <div key={`${slot.time}-${sIdx}`} className="flex items-center gap-3 bg-white border border-slate-200/80 pl-3 pr-2 py-1.5 rounded-xl shadow-3xs shrink-0">
                                {/* Time & Delete button */}
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-black text-slate-700">{slot.time}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveSlot(periodKey, sIdx)}
                                    className="text-slate-400 hover:text-red-500 transition-colors p-0.5 rounded-full hover:bg-slate-50 shrink-0"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                {/* Divider */}
                                <div className="w-[1px] h-4 bg-slate-200 shrink-0" />

                                {/* 30 Minutes Duration Pill */}
                                <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-50 text-[10px] text-indigo-600 font-bold border border-indigo-100/50 shrink-0">
                                  <Clock className="w-3 h-3 text-indigo-500 shrink-0" />
                                  <span>30 Mins</span>
                                </div>

                                {/* Divider */}
                                <div className="w-[1px] h-4 bg-slate-200 shrink-0" />

                                {/* Location Select/Badge */}
                                {showLocationSelector ? (
                                  <Select
                                    value={slotLocation}
                                    onValueChange={(val) => updateSlotLocation(periodKey, sIdx, val)}
                                  >
                                    <SelectTrigger className="h-7 w-fit text-[10px] py-0 px-2 rounded-lg border-none bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold focus:ring-0 shadow-none shrink-0 transition-all flex items-center gap-1">
                                      {locIcon}
                                      <SelectValue placeholder="Location" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {practiceType.map(type => {
                                        const valueStr = type === "Hospital / Organization" ? "Hospital" : "Independent Clinic";
                                        return (
                                          <SelectItem key={type} value={valueStr}>
                                            {valueStr}
                                          </SelectItem>
                                        );
                                      })}
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <div className="flex items-center gap-1 px-2 h-7 rounded-lg bg-slate-50 text-[10px] text-slate-500 font-bold border-none shrink-0">
                                    {locIcon}
                                    <span>{slotLocation}</span>
                                  </div>
                                )}
                              </div>
                            );
                          })}

                          {periodAvailability.slots.length === 0 && (
                            <button
                              type="button"
                              onClick={() => handleOpenAddSlot(periodKey)}
                              className="flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl border-2 border-dashed border-pink-200 text-[#EC4899] bg-white hover:bg-pink-50/50 font-black text-xs transition-all active:scale-95 shrink-0"
                            >
                              <Plus className="w-3.5 h-3.5 text-pink-500" />
                              <span>Add slot</span>
                            </button>
                          )}
                        </>
                      ) : (
                        <span className="text-slate-400 font-medium text-xs italic">Disabled for {selectedDay}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 px-6 border border-dashed border-slate-200 rounded-3xl bg-white shadow-sm space-y-3">
            <CalendarDays className="w-12 h-12 text-slate-300 mx-auto" />
            <h4 className="font-extrabold text-slate-700 text-sm">No active days selected</h4>
            <p className="text-slate-400 text-xs max-w-sm mx-auto">
              Please select at least one available day above to begin configuring your timing slots.
            </p>
          </div>
        )}
      </main>

      {/* Floating Save button */}
      {isDirty && (
        <div className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-200/80 p-4 shadow-[0_-8px_30px_rgba(0,0,0,0.06)] flex justify-center z-50 animate-in fade-in slide-in-from-bottom-4 duration-350">
          <div className="w-full max-w-2xl flex gap-3">
            <button
              onClick={() => {
                fetchAvailabilityData();
                setIsDirty(false);
                toast.success("Changes reverted!");
              }}
              disabled={isSaving}
              className="flex-1 py-3.5 border border-slate-200 text-slate-600 font-extrabold rounded-2xl text-xs sm:text-sm hover:bg-slate-50 transition-colors active:scale-98 disabled:opacity-50"
            >
              Reset
            </button>
            <button
              onClick={handleSaveToDatabase}
              disabled={isSaving}
              className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl text-xs sm:text-sm transition-all active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2 shadow-md shadow-indigo-200"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check size={16} />
              )}
              Save Schedule
            </button>
          </div>
        </div>
      )}

      {/* Standard ClockPickerModal */}
      <ClockPickerModal
        isOpen={isClockPickerOpen}
        onClose={() => setIsClockPickerOpen(false)}
        onSave={handleSaveClockPickerSlot}
        period={clockPickerPeriod}
        periodLabel={
          clockPickerPeriod === "morning" ? "Morning" :
          clockPickerPeriod === "afternoon" ? "Afternoon" :
          clockPickerPeriod === "evening" ? "Evening" : "Night"
        }
      />
    </div>
  );
};

export default VetAvailability;
