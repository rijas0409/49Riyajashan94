import React, { useState, useMemo, useEffect, useCallback } from "react";
import { format as formatDt } from "date-fns";
import { useNavigate } from "react-router-dom";
import { 
  CaretLeft, MagnifyingGlass, Bell, Clock, User, 
  CaretRight, CalendarDots, House, Wallet,
  Buildings, Syringe, Timer, Stethoscope,
  Check, X
} from "@phosphor-icons/react";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import { toast } from "sonner";
import SplashScreen from "@/components/SplashScreen";
import { supabase } from "@/integrations/supabase/client";

interface ScheduleAppointment {
  id: string;
  date: string;
  type: string;
  petName: string;
  breed: string;
  ownerName: string;
  ownerPhone: string;
  time: string;
  status: string;
  image: string;
  diagnosis?: string | null;
  medicines?: string | null;
  consultation_notes?: string | null;
  care_instructions?: string | null;
}

interface DbAppointmentRaw {
  id: string;
  appointment_date: string;
  appointment_time?: string | null;
  appointment_type?: string | null;
  amount?: number | null;
  status?: string | null;
  pet_name?: string | null;
  pet_type?: string | null;
  pet_breed?: string | null;
  diagnosis?: string | null;
  medicines?: string | null;
  consultation_notes?: string | null;
  care_instructions?: string | null;
  user?: {
    name?: string | null;
    full_name?: string | null;
    profile_photo?: string | null;
    phone?: string | null;
  } | null;
}

const VetSchedule = () => {
  const navigate = useNavigate();
  const { isLoading: guardLoading, showSpinner, user, profile } = useRoleGuard(["vet"], "/auth-vet", true);
  const today = useMemo(() => new Date(), []);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedDateId, setSelectedDateId] = useState(formatDt(today, "yyyy-MM-dd"));
  const [activeTab, setActiveTab] = useState<"Active" | "Upcoming" | "Cancelled" | "Done">("Active");
  const [appointments, setAppointments] = useState<ScheduleAppointment[]>([]);
  const [isDbLoading, setIsDbLoading] = useState(true);
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
      if (formatDt(now, "yyyy-MM-dd") !== formatDt(today, "yyyy-MM-dd")) {
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
        id: formatDt(d, "yyyy-MM-dd")
      });
    }
    return arr;
  }, [today]);

  const isToday = selectedDateId === formatDt(today, "yyyy-MM-dd");
  const isPast = new Date(selectedDateId) < new Date(formatDt(today, "yyyy-MM-dd"));
  const isFuture = new Date(selectedDateId) > new Date(formatDt(today, "yyyy-MM-dd"));

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

  const fetchAppointments = useCallback(async () => {
    if (!user?.id) return;
    try {
      setIsDbLoading(true);

      // Get real-time consultation types from DB
      const { data: vp } = await supabase
        .from("vet_profiles")
        .select("consultation_type")
        .eq("user_id", user.id)
        .maybeSingle();
      const allowed = (vp?.consultation_type || "").toLowerCase();

      const { data, error } = await supabase
        .from("vet_appointments")
        .select("*")
        .eq("vet_id", user.id);
      
      if (error) {
        console.error("CRITICAL ERROR fetching real appointments:", error);
      } else if (data) {
        console.log("CRITICAL INFO real appointments data:", data);
        
        // Fetch users manually to avoid foreign key relation errors with PostgREST
        const userIds = [...new Set(data.map(apt => apt.user_id))];
        let profilesMap: Record<string, any> = {};
        
        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, name, full_name, profile_photo, phone")
            .in("id", userIds);
            
          if (profiles) {
            profiles.forEach(p => {
              profilesMap[p.id] = p;
            });
          }
        }

        // Show all appointments for the vet. Do not hide booked appointments based on current consultation_type settings.
        const mapped = data.map((apt: any) => {
          const userProfile = profilesMap[apt.user_id] || {};
          return {
            id: apt.id,
            date: apt.appointment_date,
            type: apt.appointment_type || "clinic",
            petName: apt.pet_name || "Luna",
            breed: apt.pet_breed || (apt.pet_type ? `${apt.pet_type}` : "Dog"),
            ownerName: userProfile.full_name || userProfile.name || "Sarah Jenkins",
            ownerPhone: userProfile.phone || "+91 98765 43210",
            time: apt.appointment_time || "11:30 AM",
            status: apt.status || "pending",
            image: userProfile.profile_photo || "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=150&q=80",
            diagnosis: apt.diagnosis,
            medicines: apt.medicines,
            consultation_notes: apt.consultation_notes,
            care_instructions: apt.care_instructions
          };
        });
        setAppointments(mapped);
      }
    } catch (e) {
      console.error("Error in fetchAppointments:", e);
    } finally {
      setIsDbLoading(false);
    }
  }, [user?.id]);

  const updateAppointmentStatus = async (appointmentId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("vet_appointments")
        .update({ status: newStatus })
        .eq("id", appointmentId);

      if (error) throw error;
      
      toast.success(`Appointment ${newStatus === "confirmed" ? "accepted" : "declined"}!`);
      fetchAppointments();
    } catch (e) {
      console.error("Error updating appointment status:", e);
      toast.error("Failed to update status. Please try again.");
    }
  };

  useEffect(() => {
    if (!user?.id) return;
    
    fetchAppointments();

    const channel = supabase
      .channel("vet_appointments_realtime_schedule")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "vet_appointments",
          filter: `vet_id=eq.${user.id}`
        },
        () => {
          console.log("Realtime update detected for vet appointments!");
          fetchAppointments();
        }
      )
      .subscribe();

    // Fallback polling to guarantee real-time synchronization in secondary windows
    const pollInterval = setInterval(() => {
      fetchAppointments();
    }, 4000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, [user?.id, fetchAppointments]);

  // Real data filtering
  const filteredAppointments = useMemo(() => {
    const all = appointments;

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
  }, [activeTab, isToday, isPast, isFuture, currentTime, isTimeReached, selectedDateId, today, appointments]);

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

  if (showSpinner) {
    return <SplashScreen message="Loading schedule..." />;
  }

  const hasCache = localStorage.getItem("sruvo_user_role") === "vet";
  if (guardLoading && !hasCache) {
    return null;
  }

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
          const isRealToday = item.id === formatDt(today, "yyyy-MM-dd");
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
              onClick={() => {
                let currentBookingId = apt.id;
                let parsedPaymentDetails = null;
                if (apt.consultation_notes) {
                  try {
                    const notes = JSON.parse(apt.consultation_notes);
                    if (notes.bookingId) currentBookingId = notes.bookingId;
                    if (notes) parsedPaymentDetails = notes;
                  } catch(e) {}
                }
                navigate(apt.type === 'home' ? "/vet/home-visit-details" : "/vet/clinic-visit-details", {
                  state: {
                    visit: {
                      id: apt.id,
                      bookingId: currentBookingId,
                      paymentDetails: parsedPaymentDetails,
                      petName: apt.petName,
                      petBreed: apt.breed,
                      petAge: "4 Years",
                      ownerName: apt.ownerName,
                      ownerPhone: apt.ownerPhone,
                      address: apt.type === 'home' ? "123 Premium Residency, Indiranagar" : "HSR Paws Clinic, Sector 2",
                      time: "Today, " + apt.time,
                      reason: "General Consultation & Checkup",
                      image: apt.image,
                      distance: apt.type === 'home' ? "1.2 MILES AWAY" : ""
                    }
                  }
                });
              }}
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
                  <div className="text-[11px] text-[#8d8d9c] font-[700] uppercase tracking-[0.5px] mb-1.5 flex items-center gap-1.5">
                    {apt.breed}
                    {apt.consultation_notes && (() => {
                       try {
                         const notes = JSON.parse(apt.consultation_notes);
                         if (notes.bookingId) return (
                           <>
                             <span className="w-1 h-1 rounded-full bg-[#8d8d9c]" />
                             <span className="font-mono text-[#ae41ff]">{notes.bookingId}</span>
                           </>
                         );
                       } catch(e){}
                       return null;
                    })()}
                  </div>
                  <div className="text-[13px] text-[#8d8d9c] font-[600] flex items-center gap-1.5">
                    <User size={14} weight="bold" /> {apt.ownerName}
                  </div>
                </div>
              </div>
              
              {apt.status === "pending" && (
                <div className="mb-5 bg-orange-50 border border-orange-100 rounded-2xl p-4">
                  <p className="text-[11px] font-black text-orange-600 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                    New Request - Awaiting your response
                  </p>
                  <div className="flex gap-3">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        updateAppointmentStatus(apt.id, "cancelled");
                      }}
                      className="flex-1 h-12 bg-white border border-gray-200 rounded-xl text-[13px] font-black text-[#8d8d9c] flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                    >
                      <X size={15} weight="bold" /> Decline
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        updateAppointmentStatus(apt.id, "confirmed");
                      }}
                      className="flex-1 h-12 bg-[#12B76A] rounded-xl text-[13px] font-black text-white flex items-center justify-center gap-1.5 shadow-lg shadow-[#12B76A]/20 active:scale-95 transition-all"
                    >
                      <Check size={15} weight="bold" /> Accept
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 bg-[#f7f7fa] px-4 py-2.5 rounded-[20px] text-[13px] font-[800] text-[#1f1f2e]">
                  <Clock size={16} className="text-[#9b28f5]" weight="bold" /> {apt.time}
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(apt.type === 'home' ? "/vet/home-visit-details" : "/vet/clinic-visit-details", {
                      state: {
                        visit: {
                          id: apt.id,
                          petName: apt.petName,
                          petBreed: apt.breed,
                          petAge: "4 Years",
                          ownerName: apt.ownerName,
                          ownerPhone: apt.ownerPhone,
                          address: apt.type === 'home' ? "123 Premium Residency, Indiranagar" : "HSR Paws Clinic, Sector 2",
                          time: "Today, " + apt.time,
                          reason: "General Consultation & Checkup",
                          image: apt.image,
                          distance: apt.type === 'home' ? "1.2 MILES AWAY" : ""
                        }
                      }
                    });
                  }}
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
