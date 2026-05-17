import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  CaretLeft, MagnifyingGlass, Bell, Clock, User, 
  CaretRight, CalendarDots, House, Wallet,
  Buildings, Syringe, Timer, Stethoscope
} from "@phosphor-icons/react";

const VetSchedule = () => {
  const navigate = useNavigate();
  const today = useMemo(() => new Date(), []);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedDateId, setSelectedDateId] = useState(today.toISOString().split('T')[0]);
  const [activeTab, setActiveTab] = useState<"Active" | "Upcoming" | "Cancelled" | "Done">("Active");
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const isInitialMount = React.useRef(true);

  // Month and Year display for the selected date
  const monthYearHeader = useMemo(() => {
    const d = new Date(selectedDateId);
    return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }, [selectedDateId]);

  // Update current time periodically
  React.useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      // Auto-update today if date changes
      if (now.toISOString().split('T')[0] !== today.toISOString().split('T')[0]) {
        // This would require more complex state handling for 'today', 
        // but for demo it's fine as initialized.
      }
    }, 30000);
    return () => clearInterval(timer);
  }, [today]);

  // Generate 8 days before and 8 days after today
  const yesterday = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() - 1);
    return d;
  }, [today]);

  const dates = useMemo(() => {
    const arr = [];
    for (let i = -8; i <= 8; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      arr.push({
        day: d.toLocaleDateString("en-US", { weekday: "short" }),
        date: d.getDate(),
        fullDate: d,
        id: d.toISOString().split('T')[0]
      });
    }
    return arr;
  }, [today]);

  const isToday = selectedDateId === today.toISOString().split('T')[0];
  const isPast = new Date(selectedDateId) < new Date(today.toISOString().split('T')[0]);
  const isFuture = new Date(selectedDateId) > new Date(today.toISOString().split('T')[0]);

  // Utility to check if a specific time is reached today
  const isTimeReached = (timeStr: string) => {
    if (!isToday) return isPast;
    try {
      const [time, period] = timeStr.split(' ');
      const [rawHours, minutes] = time.split(':').map(Number);
      let hours = rawHours;
      if (period === 'PM' && hours < 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;
      
      const appTime = new Date(currentTime);
      appTime.setHours(hours, minutes, 0, 0);
      return currentTime >= appTime;
    } catch (e) {
      return false;
    }
  };

  // Auto-scroll to selected date
  React.useEffect(() => {
    const element = document.getElementById(`date-${selectedDateId}`);
    if (element) {
      if (isInitialMount.current) {
        // Instant scroll on first load
        element.scrollIntoView({ behavior: 'auto', block: 'nearest', inline: 'center' });
        isInitialMount.current = false;
      } else {
        // Smooth scroll on user selection
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [selectedDateId]);

  const tabs = useMemo(() => {
    if (isPast) return ["Cancelled", "Done"];
    return ["Active", "Upcoming", "Cancelled", "Done"];
  }, [isPast]);

  // Ensure activeTab is valid for the current selection
  React.useEffect(() => {
    if (isPast && (activeTab === "Active" || activeTab === "Upcoming")) {
      setActiveTab("Cancelled");
    }
  }, [isPast, activeTab]);

  // Mock filtering for demo purposes
  const filteredAppointments = useMemo(() => {
    const all = [
      {
        id: "HV-123",
        date: today.toISOString().split('T')[0],
        type: "home",
        petName: "Bella",
        breed: "Golden Retriever • 2Y",
        ownerName: "Sarah Jenkins",
        time: "11:30 AM",
        status: "confirmed",
        image: "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=150&q=80"
      },
      {
        id: "CV-124",
        date: today.toISOString().split('T')[0],
        type: "clinic",
        petName: "Gabru",
        breed: "Labrador • 3Y",
        ownerName: "Michael Ross",
        time: "12:30 PM",
        status: "pending",
        image: "https://images.unsplash.com/photo-1593134257782-e89567b7718a?auto=format&fit=crop&w=150&q=80"
      },
      {
        id: "CV-125",
        date: today.toISOString().split('T')[0],
        type: "clinic",
        petName: "Cooper",
        breed: "Beagle • 1Y",
        ownerName: "Alice Cooper",
        time: "09:00 AM",
        status: "completed",
        image: "https://images.unsplash.com/photo-1537151608804-ea6f254191eb?auto=format&fit=crop&w=150&q=80"
      },
      {
        id: "CAN-1",
        date: today.toISOString().split('T')[0],
        type: "clinic",
        petName: "Luna",
        breed: "Persian Cat • 1Y",
        ownerName: "Emily Davis",
        time: "03:00 PM",
        status: "cancelled",
        image: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=150&q=80"
      },
      {
        id: "OLD-1",
        date: yesterday.toISOString().split('T')[0],
        type: "clinic",
        petName: "Rocky",
        breed: "Doberman • 4Y",
        ownerName: "John Wick",
        time: "10:00 AM",
        status: "completed",
        image: "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=150&q=80"
      }
    ];

    return all.filter(apt => {
      // Only show items for the selected date
      if (apt.date !== selectedDateId) return false;
      
      // Logic for each tab
      if (activeTab === "Active") {
        if (!isToday) return false;
        return apt.status === "confirmed" && isTimeReached(apt.time);
      }
      
      if (activeTab === "Upcoming") {
        if (isPast) return false; // User requested: "upcoming" should not show on previous dates
        if (isToday) {
          return (apt.status === "pending" || (apt.status === "confirmed" && !isTimeReached(apt.time)));
        }
        return (apt.status === "pending" || apt.status === "confirmed"); // All future are upcoming
      }

      if (activeTab === "Cancelled") {
        return apt.status === "cancelled" || apt.status === "rejected";
      }

      if (activeTab === "Done") {
        if (isPast) return apt.status === "completed" || apt.status === "confirmed" || apt.status === "pending"; // All past events are essentially done
        if (isToday) return apt.status === "completed";
        return false; // Future can't be done
      }
      
      return false;
    });
  }, [activeTab, isToday, isPast, isFuture, currentTime, isTimeReached, selectedDateId, today]);

  const handleHomeVisitClick = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    navigate("/vet/home-visit-details", { 
      state: { 
        visit: {
          id: "HV-123",
          petName: "Bella",
          petBreed: "Golden Retriever • 2Y",
          ownerName: "Sarah Jenkins",
          ownerPhone: "+1 (555) 987-6543",
          address: "123 Premium Residency, Indiranagar",
          time: "Today, 11:30 AM",
          reason: "Vaccination & General Checkup",
          image: "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=300&q=80",
          distance: "1.2 MILES AWAY"
        } 
      } 
    });
  };

  const handleClinicVisitClick = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    navigate("/vet/clinic-visit-details", { 
      state: { 
        visit: {
          id: "CV-124",
          petName: "Gabru",
          petBreed: "Labrador • 3Y",
          ownerName: "Michael Ross",
          ownerPhone: "+1 (555) 345-6789",
          address: "HSR Paws Clinic, Sector 2",
          time: "Today, 12:30 PM",
          reason: "Routine Checkup",
          image: "https://images.unsplash.com/photo-1593134257782-e89567b7718a?auto=format&fit=crop&w=300&q=80",
          distance: ""
        } 
      } 
    });
  };

  return (
    <div className="bg-[#f7f7fa] min-h-screen pb-24 font-['Nunito'] overflow-x-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-6">
        <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#1f1f2e] shadow-sm active:scale-95 transition-all">
          <CaretLeft size={20} weight="bold" />
        </button>
        <h1 className="text-[22px] font-[800] text-[#1f1f2e] flex-grow ml-4">Schedule</h1>
        <div className="flex gap-3">
          <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#1f1f2e] shadow-sm active:scale-95 transition-all">
            <MagnifyingGlass size={20} weight="bold" />
          </button>
          <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#1f1f2e] shadow-sm active:scale-95 transition-all">
            <Bell size={20} weight="bold" />
          </button>
        </div>
      </header>
      
      {/* Month & Year Display */}
      <div className="px-5 mb-4">
        <h2 className="text-[14px] font-[800] text-[#a428ff] uppercase tracking-[1px]">{monthYearHeader}</h2>
      </div>

      {/* Date Picker */}
      <div ref={scrollContainerRef} className="flex px-5 gap-4 overflow-x-auto no-scrollbar pb-6 scroll-smooth pt-2">
        {dates.map((item) => {
          const isRealToday = item.id === today.toISOString().split('T')[0];
          const isSelected = selectedDateId === item.id;
          
          return (
            <button
              key={item.id}
              id={`date-${item.id}`}
              onClick={() => setSelectedDateId(item.id)}
              className={`min-w-[68px] h-[88px] rounded-[22px] flex flex-col items-center justify-center flex-shrink-0 transition-all duration-300 ${
                isSelected 
                  ? "bg-gradient-to-br from-[#ae41ff] to-[#8a14f5] shadow-[0_12px_28px_rgba(155,40,245,0.35)] text-white scale-110 z-10" 
                  : isRealToday
                    ? "bg-white border-2 border-[#ae41ff]/20 text-[#1f1f2e] scale-105"
                    : "bg-white shadow-[0_10px_30px_rgba(155,40,245,0.08)] text-[#1f1f2e] opacity-80"
              }`}
            >
              <span className={`text-[12px] font-[700] mb-1.5 uppercase tracking-wider ${isSelected ? "text-white/80" : "text-[#8d8d9c]"}`}>
                {item.day}
              </span>
              <span className="text-[20px] font-[900] tracking-tight">{item.date}</span>
              {isRealToday && !isSelected && (
                <div className="w-1.5 h-1.5 bg-[#ae41ff] rounded-full mt-1 animate-pulse"></div>
              )}
            </button>
          );
        })}
      </div>

      {/* View Toggle / Tabs */}
      <div className="mx-5 my-6 bg-[#ececf3] rounded-[30px] flex p-1 relative overflow-x-auto no-scrollbar">
        {tabs.map((tab) => (
          <label
            key={tab}
            className={`flex-1 min-w-[80px] text-center py-[12px] text-[13px] font-[700] rounded-[26px] z-10 cursor-pointer transition-all whitespace-nowrap px-2 ${
              activeTab === tab ? "bg-white text-[#9b28f5] shadow-[0_2px_8px_rgba(0,0,0,0.05)]" : "text-[#8d8d9c]"
            }`}
            onClick={() => setActiveTab(tab as "Active" | "Upcoming" | "Cancelled" | "Done")}
          >
            {tab}
          </label>
        ))}
      </div>

      {/* Section Header */}
      <div className="flex items-center px-5 mb-4 mt-2">
        <h2 className="text-[18px] font-[800] text-[#1f1f2e]">
          {isToday ? "Today's Appointments" : `Appointments for ${new Date(selectedDateId).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}`}
        </h2>
        {filteredAppointments.length > 0 && (
          <div className="bg-[#eedaff] text-[#9b28f5] w-6 h-6 rounded-full flex items-center justify-center text-[12px] font-[800] ml-3">
            {filteredAppointments.length}
          </div>
        )}
      </div>

      {/* Appointments List */}
      <div className="px-5 flex flex-col gap-5 pb-10">
        {(filteredAppointments.length === 0) ? (
          <div className="bg-white rounded-[24px] p-10 shadow-[0_10px_30px_rgba(155,40,245,0.08)] flex flex-col items-center justify-center text-center">
            <CalendarDots className="text-[#8d8d9c] mb-4 opacity-20" size={54} />
            <p className="text-[#8d8d9c] font-bold">No {activeTab.toLowerCase()} consultations for this date.</p>
          </div>
        ) : (
          filteredAppointments.map((apt) => (
            <div 
              key={apt.id}
              onClick={apt.type === 'home' ? handleHomeVisitClick : handleClinicVisitClick}
              className="bg-white rounded-[24px] p-5 shadow-[0_10px_30px_rgba(155,40,245,0.08)] relative overflow-hidden cursor-pointer active:scale-[0.98] transition-all"
            >
              {isToday && activeTab === 'Active' && (
                <div className="absolute top-0 right-0 bg-[#d4f7e5] text-[#199450] px-3 py-1.5 rounded-bl-[12px] text-[10px] font-[800] tracking-[0.5px] flex items-center gap-1">
                  <Timer size={12} weight="bold" className="animate-pulse" /> LIVE NOW
                </div>
              )}
              {activeTab === 'Done' && (
                <div className="absolute top-0 right-0 bg-[#eef4ff] text-[#4b83ff] px-3 py-1.5 rounded-bl-[12px] text-[10px] font-[800] tracking-[0.5px] flex items-center gap-1 uppercase">
                  Processed
                </div>
              )}
              <div className="flex gap-4 mb-5">
                <div className="relative">
                  <img 
                    src={apt.image} 
                    alt={apt.petName} 
                    className="w-[60px] h-[60px] rounded-[16px] object-cover"
                  />
                  <div className="absolute -bottom-1 -right-1 w-[22px] h-[22px] bg-gradient-to-br from-[#ae41ff] to-[#8a14f5] border-2 border-white rounded-full flex items-center justify-center text-white">
                    {apt.type === 'home' ? <House size={11} weight="bold" /> : <Buildings size={11} weight="bold" />}
                  </div>
                </div>
                <div className="pt-1">
                  <h3 className="text-[18px] font-[800] text-[#1f1f2e] mb-0.5">{apt.petName}</h3>
                  <div className="text-[11px] text-[#8d8d9c] font-[700] uppercase tracking-[0.5px] mb-1.5">{apt.breed}</div>
                  <div className="text-[13px] text-[#8d8d9c] font-[600] flex items-center gap-1.5">
                    <User size={14} weight="bold" /> {apt.ownerName}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 bg-[#f7f7fa] px-4 py-2.5 rounded-[20px] text-[13px] font-[800] text-[#1f1f2e]">
                  <Clock size={16} className="text-[#9b28f5]" weight="bold" /> {apt.time}
                </div>
                <button 
                  onClick={apt.type === 'home' ? handleHomeVisitClick : handleClinicVisitClick}
                  className="bg-gradient-to-br from-[#ae41ff] to-[#8a14f5] text-white px-6 py-2.5 rounded-[20px] text-[13px] font-[800] shadow-[0_12px_24px_rgba(155,40,245,0.3)] active:scale-95 transition-all"
                >
                  {apt.type === 'home' ? 'View Route' : 'View Details'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-sm flex justify-center z-50 border-t border-gray-50/50 pb-safe">
        <div className="w-full max-w-7xl flex justify-between px-6 pt-4 pb-7">
          <button className="flex flex-col items-center gap-1.5 text-[#b5b5c3] font-extrabold text-[9px] tracking-[0.5px] w-[60px]" onClick={() => navigate("/vet/home")}>
            <House size={24} weight="bold" />
            HOME
          </button>
          <button className="flex flex-col items-center gap-1.5 text-[#a428ff] font-extrabold text-[9px] tracking-[0.5px] w-[60px]" onClick={() => navigate("/vet/schedule")}>
            <CalendarDots size={24} weight="fill" />
            SCHEDULE
          </button>
          <button className="flex flex-col items-center gap-1.5 text-[#b5b5c3] font-extrabold text-[9px] tracking-[0.5px] w-[60px]" onClick={() => navigate("/vet/earnings")}>
            <Wallet size={24} weight="bold" />
            EARNINGS
          </button>
          <button className="flex flex-col items-center gap-1.5 text-[#b5b5c3] font-extrabold text-[9px] tracking-[0.5px] w-[60px]" onClick={() => navigate("/vet/profile")}>
            <User size={24} weight="bold" />
            PROFILE
          </button>
        </div>
      </nav>
    </div>
  );
};

export default VetSchedule;
