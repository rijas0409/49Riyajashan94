import React, { useState, useEffect } from "react";
import { X, Clock, Sunrise, Sun, Moon, Check } from "lucide-react";

interface ClockPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (start: string, end: string) => void;
  period: "morning" | "afternoon" | "evening" | "night";
  periodLabel: string;
}

export default function ClockPickerModal({
  isOpen,
  onClose,
  onSave,
  period,
  periodLabel,
}: ClockPickerModalProps) {
  // We keep a draft start time & end time as hour (1-12), minute (0-59), and period (AM/PM)
  const [activeTab, setActiveTab] = useState<"start" | "end">("start");
  const [pickerMode, setPickerMode] = useState<"hours" | "minutes">("hours");

  // Initial values based on period
  const getInitialTime = (tab: "start" | "end") => {
    if (period === "morning") {
      return tab === "start" ? { hour: 9, minute: 0, ampm: "AM" as const } : { hour: 11, minute: 0, ampm: "AM" as const };
    } else if (period === "afternoon") {
      return tab === "start" ? { hour: 1, minute: 30, ampm: "PM" as const } : { hour: 3, minute: 30, ampm: "PM" as const };
    } else if (period === "evening") {
      return tab === "start" ? { hour: 4, minute: 30, ampm: "PM" as const } : { hour: 6, minute: 30, ampm: "PM" as const };
    } else {
      return tab === "start" ? { hour: 8, minute: 0, ampm: "PM" as const } : { hour: 10, minute: 0, ampm: "PM" as const };
    }
  };

  const [startTime, setStartTime] = useState(() => getInitialTime("start"));
  const [endTime, setEndTime] = useState(() => getInitialTime("end"));

  useEffect(() => {
    if (isOpen) {
      setStartTime(getInitialTime("start"));
      setEndTime(getInitialTime("end"));
      setActiveTab("start");
      setPickerMode("hours");
    }
  }, [isOpen, period]);

  if (!isOpen) return null;

  const currentActiveTime = activeTab === "start" ? startTime : endTime;
  const setCurrentActiveTime = activeTab === "start" ? setStartTime : setEndTime;

  // Change hour
  const handleSelectHour = (h: number) => {
    setCurrentActiveTime((prev) => ({ ...prev, hour: h }));
    // Auto shift to minutes after hour select
    setTimeout(() => {
      setPickerMode("minutes");
    }, 200);
  };

  // Change minute
  const handleSelectMinute = (m: number) => {
    setCurrentActiveTime((prev) => ({ ...prev, minute: m }));
  };

  const handleToggleAmPm = (ampm: "AM" | "PM") => {
    setCurrentActiveTime((prev) => ({ ...prev, ampm }));
  };

  // Build 24h string form: "HH:MM"
  const formatTo24HStr = (t: { hour: number; minute: number; ampm: "AM" | "PM" }) => {
    let h24 = t.hour;
    if (t.ampm === "PM" && t.hour < 12) h24 += 12;
    if (t.ampm === "AM" && t.hour === 12) h24 = 0;
    const hStr = h24 < 10 ? `0${h24}` : `${h24}`;
    const mStr = t.minute < 10 ? `0${t.minute}` : `${t.minute}`;
    return `${hStr}:${mStr}`;
  };

  const handleSave = () => {
    const start24 = formatTo24HStr(startTime);
    const end24 = formatTo24HStr(endTime);
    onSave(start24, end24);
  };

  // Display labels on the clock face
  const hoursList = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const minutesList = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  // Helper variables for clock hand angle
  const activeValue = pickerMode === "hours" ? currentActiveTime.hour : currentActiveTime.minute;
  const angleDeg = pickerMode === "hours" 
    ? (activeValue % 12) * 30 
    : (activeValue / 60) * 360;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
      <div 
        className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl border border-slate-100/50 flex flex-col items-stretch"
        id="custom-clock-modal"
      >
        {/* Header Title */}
        <div className="bg-[#8A1550] text-white p-5 flex items-center justify-between border-b border-[#701041]">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 opacity-90 animate-pulse text-pink-300" />
            <h3 className="font-extrabold text-base tracking-tight font-sans">
              Set {periodLabel} Timing
            </h3>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Start vs End Time Nav Tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50/50 p-1 m-3 rounded-2xl gap-1">
          <button
            type="button"
            onClick={() => {
              setActiveTab("start");
              setPickerMode("hours");
            }}
            className={`flex-1 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm text-center transition-all flex flex-col items-center gap-0.5 ${
              activeTab === "start"
                ? "bg-white text-[#8A1550] shadow-xs border border-slate-100"
                : "text-slate-500 hover:text-slate-700 hover:bg-white/40"
            }`}
          >
            <span className="text-[10px] uppercase font-bold tracking-wider opacity-60">Start Time</span>
            <span className="text-sm font-black">
              {startTime.hour.toString().padStart(2, "0")}:{startTime.minute.toString().padStart(2, "0")} {startTime.ampm}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("end");
              setPickerMode("hours");
            }}
            className={`flex-1 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm text-center transition-all flex flex-col items-center gap-0.5 ${
              activeTab === "end"
                ? "bg-white text-[#8A1550] shadow-xs border border-slate-100"
                : "text-slate-500 hover:text-slate-700 hover:bg-white/40"
            }`}
          >
            <span className="text-[10px] uppercase font-bold tracking-wider opacity-60">End Time</span>
            <span className="text-sm font-black">
              {endTime.hour.toString().padStart(2, "0")}:{endTime.minute.toString().padStart(2, "0")} {endTime.ampm}
            </span>
          </button>
        </div>

        {/* Visual Clock display */}
        <div className="flex flex-col items-center py-4 px-5 space-y-4">
          <div className="flex items-center justify-center gap-4">
            {/* Hours Mode Selector Tab */}
            <button
              type="button"
              onClick={() => setPickerMode("hours")}
              className={`text-3xl font-black rounded-2xl px-4 py-2 transition-all ${
                pickerMode === "hours" 
                  ? "bg-[#FFEAF2] text-[#8A1550] font-sans scale-105 shadow-xs" 
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {currentActiveTime.hour.toString().padStart(2, "0")}
            </button>
            <span className="text-3xl font-bold text-slate-300">:</span>
            {/* Minutes Mode Selector Tab */}
            <button
              type="button"
              onClick={() => setPickerMode("minutes")}
              className={`text-3xl font-black rounded-2xl px-4 py-2 transition-all ${
                pickerMode === "minutes" 
                  ? "bg-[#FFEAF2] text-[#8A1550] font-sans scale-105 shadow-xs" 
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {currentActiveTime.minute.toString().padStart(2, "0")}
            </button>

            {/* AM/PM Column */}
            <div className="flex flex-col gap-1.5 ml-2 bg-slate-50 p-1 rounded-xl border border-slate-150">
              <button
                type="button"
                onClick={() => handleToggleAmPm("AM")}
                className={`px-3 py-1 text-xs font-extrabold rounded-lg transition-all ${
                  currentActiveTime.ampm === "AM"
                    ? "bg-[#8A1550] text-white shadow-xs"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                AM
              </button>
              <button
                type="button"
                onClick={() => handleToggleAmPm("PM")}
                className={`px-3 py-1 text-xs font-extrabold rounded-lg transition-all ${
                  currentActiveTime.ampm === "PM"
                    ? "bg-[#8A1550] text-white shadow-xs"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                PM
              </button>
            </div>
          </div>

          {/* Clean Radial Face */}
          <div className="relative w-52 h-52 sm:w-56 sm:h-56 bg-[#FAFAFC] rounded-full border border-slate-100 flex items-center justify-center p-2 shadow-inner">
            {/* Pivot Point */}
            <div className="absolute w-2.5 h-2.5 bg-[#8A1550] rounded-full z-10 shadow-xs" />

            {/* Hand Line inside Face */}
            <div 
              className="absolute bottom-1/2 left-1/2 w-0.5 bg-[#8A1550] origin-bottom transition-all duration-300 ease-out pointer-events-none"
              style={{ 
                height: `${pickerMode === "hours" ? "75px" : "80px"}`,
                transform: `rotate(${angleDeg}deg)` 
              }}
            >
              {/* Selective Circle Header Pointer */}
              <div className="absolute w-7 h-7 -translate-x-1/2 -top-3.5 bg-[#8A1550] border-2 border-white rounded-full shadow flex items-center justify-center text-[10px] font-black text-white" />
            </div>

            {/* Interactive dial nodes rendering */}
            {pickerMode === "hours" ? (
              hoursList.map((h, index) => {
                const angle = (index * 30 - 90) * (Math.PI / 180);
                const x = Math.round(92 * Math.cos(angle));
                const y = Math.round(92 * Math.sin(angle));
                const isSelected = currentActiveTime.hour === h;

                return (
                  <button
                    key={`h-${h}`}
                    type="button"
                    onClick={() => handleSelectHour(h)}
                    style={{
                      transform: `translate(${x}px, ${y}px)`,
                    }}
                    className={`absolute w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-colors hover:bg-[#FFEAF2] hover:text-[#8A1550] cursor-pointer ${
                      isSelected
                        ? "text-white hover:text-white"
                        : "text-slate-600"
                    }`}
                  >
                    {h}
                  </button>
                );
              })
            ) : (
              minutesList.map((m, index) => {
                const angle = (index * 30 - 90) * (Math.PI / 180);
                const x = Math.round(92 * Math.cos(angle));
                const y = Math.round(92 * Math.sin(angle));
                const isSelected = currentActiveTime.minute === m;

                return (
                  <button
                    key={`m-${m}`}
                    type="button"
                    onClick={() => handleSelectMinute(m)}
                    style={{
                      transform: `translate(${x}px, ${y}px)`,
                    }}
                    className={`absolute w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-colors hover:bg-[#FFEAF2] hover:text-[#8A1550] cursor-pointer ${
                      isSelected
                        ? "text-white hover:text-white"
                        : "text-slate-600"
                    }`}
                  >
                    {m.toString().padStart(2, "0")}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Bottom Actions Frame */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-150 rounded-xl transition"
          >
            Cancel
          </button>
          
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 text-xs font-bold text-white bg-[#8A1550] hover:bg-[#701041] rounded-xl transition shadow flex items-center gap-1.5 active:scale-[0.98]"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Apply Time</span>
          </button>
        </div>
      </div>
    </div>
  );
}
