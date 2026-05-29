import React, { useState, useEffect, useRef } from "react";
import { X, Clock, Check } from "lucide-react";

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
  const [activeTab, setActiveTab] = useState<"start" | "end">("start");
  const [pickerMode, setPickerMode] = useState<"hours" | "minutes">("hours");

  // Default initial timings matching Google/Onboarding hours
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

  const currentActiveTime = activeTab === "start" ? startTime : endTime;
  const setCurrentActiveTime = activeTab === "start" ? setStartTime : setEndTime;

  const [isDragging, setIsDragging] = useState(false);
  const dialRef = useRef<HTMLDivElement>(null);

  const handleSelectHour = (h: number) => {
    setCurrentActiveTime((prev) => ({ ...prev, hour: h }));
  };

  const handleSelectMinute = (m: number) => {
    setCurrentActiveTime((prev) => ({ ...prev, minute: m }));
  };

  const handleToggleAmPm = (ampm: "AM" | "PM") => {
    setCurrentActiveTime((prev) => ({ ...prev, ampm }));
  };

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

  const hoursList = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const minutesList = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  const activeValue = pickerMode === "hours" ? currentActiveTime.hour : currentActiveTime.minute;
  const angleDeg = pickerMode === "hours" 
    ? (activeValue % 12) * 30 
    : (activeValue / 60) * 360;

  // Real-time drag math tracking target cursor angle
  const handleDialInteraction = (clientX: number, clientY: number) => {
    if (!dialRef.current) return;
    const rect = dialRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = clientX - centerX;
    const dy = clientY - centerY;
    
    let angleRad = Math.atan2(dy, dx);
    let angleDeg = (angleRad * 180) / Math.PI + 90;
    if (angleDeg < 0) angleDeg += 360;

    if (pickerMode === "hours") {
      let hour = Math.round(angleDeg / 30);
      if (hour === 0) hour = 12;
      if (hour > 12) hour = 12;
      setCurrentActiveTime((prev) => ({ ...prev, hour }));
    } else {
      let minute = Math.round(angleDeg / 6);
      if (minute >= 60) minute = 0;
      setCurrentActiveTime((prev) => ({ ...prev, minute }));
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    handleDialInteraction(e.clientX, e.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    // Only call preventDefault to stop scroll/pinch if interaction is on dial
    if (e.cancelable) {
      e.preventDefault();
    }
    setIsDragging(true);
    if (e.touches[0]) {
      handleDialInteraction(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      handleDialInteraction(e.clientX, e.clientY);
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        // Seamless Google transition from hours to minutes
        if (pickerMode === "hours") {
          setTimeout(() => {
            setPickerMode("minutes");
          }, 200);
        }
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      if (e.touches[0]) {
        handleDialInteraction(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handleTouchEnd = () => {
      if (isDragging) {
        setIsDragging(false);
        if (pickerMode === "hours") {
          setTimeout(() => {
            setPickerMode("minutes");
          }, 200);
        }
      }
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("touchmove", handleTouchMove, { passive: false });
      window.addEventListener("touchend", handleTouchEnd);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isDragging, pickerMode, activeTab]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
      <div 
        className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl border border-slate-100 flex flex-col items-stretch"
        id="custom-clock-modal"
      >
        {/* Header Block with gradient inspired by date of birth calendar */}
        <div className="bg-gradient-primary text-primary-foreground p-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary-foreground/80 animate-pulse" />
            <h3 className="font-extrabold text-base tracking-tight font-sans">
              Set {periodLabel} Timing
            </h3>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="text-primary-foreground/80 hover:text-white hover:bg-white/10 p-1.5 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection Row */}
        <div className="flex border-b border-slate-100 bg-slate-50 p-1.5 m-4 rounded-2xl gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveTab("start");
              setPickerMode("hours");
            }}
            className={`flex-1 py-2 rounded-xl font-bold text-xs sm:text-sm text-center transition-all flex flex-col items-center justify-center gap-0.5 border ${
              activeTab === "start"
                ? "bg-white text-primary shadow-sm border-slate-200"
                : "text-slate-500 border-transparent hover:text-slate-700"
            }`}
          >
            <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400">Start Time</span>
            <span className="text-sm font-extrabold">
              {startTime.hour.toString().padStart(2, "0")}:{startTime.minute.toString().padStart(2, "0")} {startTime.ampm}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("end");
              setPickerMode("hours");
            }}
            className={`flex-1 py-2 rounded-xl font-bold text-xs sm:text-sm text-center transition-all flex flex-col items-center justify-center gap-0.5 border ${
              activeTab === "end"
                ? "bg-white text-primary shadow-sm border-slate-200"
                : "text-slate-500 border-transparent hover:text-slate-700"
            }`}
          >
            <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400">End Time</span>
            <span className="text-sm font-extrabold">
              {endTime.hour.toString().padStart(2, "0")}:{endTime.minute.toString().padStart(2, "0")} {endTime.ampm}
            </span>
          </button>
        </div>

        {/* Material Numeric Input Area */}
        <div className="flex flex-col items-center py-4 px-5 space-y-5">
          <div className="flex items-center justify-center gap-3">
            {/* Hour Block */}
            <button
              type="button"
              onClick={() => setPickerMode("hours")}
              className={`text-3xl sm:text-4xl font-extrabold rounded-2xl px-5 py-3 transition-all duration-200 ${
                pickerMode === "hours" 
                  ? "bg-primary/10 text-primary font-sans scale-105 shadow-xs border border-primary/20" 
                  : "text-slate-400 bg-slate-50 hover:text-slate-600 hover:bg-slate-100"
              }`}
            >
              {currentActiveTime.hour.toString().padStart(2, "0")}
            </button>
            <span className="text-3xl font-bold text-slate-300 animate-pulse">:</span>
            
            {/* Minute Block */}
            <button
              type="button"
              onClick={() => setPickerMode("minutes")}
              className={`text-3xl sm:text-4xl font-extrabold rounded-2xl px-5 py-3 transition-all duration-200 ${
                pickerMode === "minutes" 
                  ? "bg-primary/10 text-primary font-sans scale-105 shadow-xs border border-primary/20" 
                  : "text-slate-400 bg-slate-50 hover:text-slate-600 hover:bg-slate-100"
              }`}
            >
              {currentActiveTime.minute.toString().padStart(2, "0")}
            </button>

            {/* AM/PM Control */}
            <div className="flex flex-col gap-1 ml-1 bg-slate-100/80 p-1 rounded-2xl border border-slate-200/50">
              <button
                type="button"
                onClick={() => handleToggleAmPm("AM")}
                className={`px-3 py-1.5 text-xs font-black rounded-xl transition-all duration-200 ${
                  currentActiveTime.ampm === "AM"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                AM
              </button>
              <button
                type="button"
                onClick={() => handleToggleAmPm("PM")}
                className={`px-3 py-1.5 text-xs font-black rounded-xl transition-all duration-200 ${
                  currentActiveTime.ampm === "PM"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                PM
              </button>
            </div>
          </div>

          {/* Clean Google Material style Interactive Dial Face */}
          <div 
            ref={dialRef}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            className="relative w-56 h-56 sm:w-60 sm:h-60 bg-[#F8FAFC] rounded-full border border-slate-200/60 flex items-center justify-center shadow-inner cursor-pointer select-none touch-none"
          >
            {/* Center Pivot Pin */}
            <div className="absolute left-1/2 top-1/2 w-2.5 h-2.5 -translate-x-1/2 -translate-y-1/2 bg-primary rounded-full z-20 shadow-sm" />

            {/* Selector Hand (Sui) with circle tip and stem connector */}
            <div 
              className="absolute bottom-1/2 left-1/2 w-0.5 bg-primary origin-bottom pointer-events-none"
              style={{ 
                height: `${pickerMode === "hours" ? "74px" : "84px"}`,
                transform: `rotate(${angleDeg}deg)`,
                transition: isDragging ? "none" : "transform 150ms cubic-bezier(0.4, 0, 0.2, 1)"
              }}
            >
              {/* Highlight Circle Tip - perfectly aligned with the numbers */}
              <div className="absolute w-8 h-8 -translate-x-1/2 -translate-y-1/2 top-0 bg-primary rounded-full flex items-center justify-center shadow-md">
                <div className="w-1.5 h-1.5 bg-white rounded-full" />
              </div>
            </div>

            {/* Render Numbers on Face dial */}
            {pickerMode === "hours" ? (
              hoursList.map((h, index) => {
                const angle = (index * 30 - 90) * (Math.PI / 180);
                const x = Math.round(74 * Math.cos(angle));
                const y = Math.round(74 * Math.sin(angle));
                const isSelected = currentActiveTime.hour === h;

                return (
                  <button
                    key={`hour-num-${h}`}
                    type="button"
                    onClick={() => handleSelectHour(h)}
                    style={{
                      left: "50%",
                      top: "50%",
                      transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                    }}
                    className={`absolute w-8 h-8 rounded-full flex items-center justify-center font-bold text-[13px] sm:text-[14px] transition-all duration-150 cursor-pointer ${
                      isSelected
                        ? "text-primary-foreground font-black z-10"
                        : "text-slate-600 hover:bg-primary/10 hover:text-primary"
                    }`}
                  >
                    {h}
                  </button>
                );
              })
            ) : (
              minutesList.map((m, index) => {
                const angle = (index * 30 - 90) * (Math.PI / 180);
                const x = Math.round(84 * Math.cos(angle));
                const y = Math.round(84 * Math.sin(angle));
                const isSelected = currentActiveTime.minute === m;

                return (
                  <button
                    key={`minute-num-${m}`}
                    type="button"
                    onClick={() => handleSelectMinute(m)}
                    style={{
                      left: "50%",
                      top: "50%",
                      transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                    }}
                    className={`absolute w-8 h-8 rounded-full flex items-center justify-center font-bold text-[13px] sm:text-[14px] transition-all duration-150 cursor-pointer ${
                      isSelected
                        ? "text-primary-foreground font-black z-10"
                        : "text-slate-600 hover:bg-primary/10 hover:text-primary"
                    }`}
                  >
                    {m.toString().padStart(2, "0")}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Action Button Row */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2 justify-end animate-fade-in">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-extrabold text-slate-500 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-all"
          >
            Cancel
          </button>
          
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 text-xs font-extrabold text-primary-foreground bg-primary hover:opacity-90 rounded-xl transition-all shadow flex items-center gap-1.5 active:scale-[0.98]"
          >
            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Apply Slot</span>
          </button>
        </div>
      </div>
    </div>
  );
}
