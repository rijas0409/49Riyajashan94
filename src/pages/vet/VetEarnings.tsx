/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowUpRight, MagnifyingGlass, Funnel,
  VideoCamera, Buildings, House, Plus,
  HouseLine, CalendarDots, Wallet, User,
  CaretRight, Bell, ArrowLeft
} from "@phosphor-icons/react";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import SplashScreen from "@/components/SplashScreen";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const formatDateString = (date: Date) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const VetEarnings = () => {
  const navigate = useNavigate();
  const { isLoading: guardLoading, showSpinner, user, profile } = useRoleGuard(["vet"], "/auth/vet", true);
  const [activeTab, setActiveTab] = useState("This Week");
  const [appointments, setAppointments] = useState<any[]>([]);
  
  // Dedicated transaction screen and filtering states
  const [isViewAllOpen, setIsViewAllOpen] = useState(false);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [activeFilterType, setActiveFilterType] = useState("all");
  const [activeFilterStatus, setActiveFilterStatus] = useState("all");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  
  // Header search and notification states matching Schedule page exactly
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, text: "Sarah Jenkins requested a home visit for Bella.", time: "2 mins ago", isUnread: true },
    { id: 2, text: "Bella's vaccination session was successfully completed.", time: "1 hour ago", isUnread: true },
    { id: 3, text: "Michael Ross uploaded medical records for Gabru.", time: "Yesterday", isUnread: false },
    { id: 4, text: "Wallet balance auto-withdrawn successfully.", time: "2 days ago", isUnread: false }
  ]);
  const showUnreadBadge = useMemo(() => notifications.some(n => n.isUnread), [notifications]);

  useEffect(() => {
    const prefetchProfile = async () => {
      if (!user) return;
      try {
        const { data: vp } = await supabase.from("vet_profiles").select("*").eq("user_id", user.id).maybeSingle();
        if (vp) {
          const { data: reviewsData } = await supabase
            .from("vet_reviews")
            .select("rating")
            .eq("vet_id", user.id);

          const reviewsCount = reviewsData ? reviewsData.length : 0;
          let avgRating = 5.0;
          if (reviewsData && reviewsData.length > 0) {
            avgRating = reviewsData.reduce((sum, r) => sum + r.rating, 0) / reviewsData.length;
          } else if (vp.average_rating != null) {
            avgRating = vp.average_rating;
          }

          const photo = vp.profile_photo || profile?.profile_photo;
          let photoUrl = photo;
          if (photo && !photo.startsWith("http")) {
            photoUrl = supabase.storage.from("vet-documents").getPublicUrl(photo).data.publicUrl;
          }

          const designation = vp.hospital_role || vp.qualification || vp.specializations?.[0] || "";

          localStorage.setItem("sruvo_vet_name", profile?.name || profile?.full_name || "Doctor");
          localStorage.setItem("sruvo_vet_designation", designation);
          localStorage.setItem("sruvo_vet_rating", String(avgRating));
          localStorage.setItem("sruvo_vet_reviews", String(reviewsCount));
          if (photoUrl) {
            localStorage.setItem("sruvo_vet_photo", photoUrl);
          }
        }
      } catch (err) {
        console.error("Error prefetching vet profile:", err);
      }
    };
    if (user) {
      prefetchProfile();
    }
  }, [user, profile]);

  const fetchAppointments = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from("vet_appointments")
        .select(`
          id,
          appointment_date,
          appointment_time,
          appointment_type,
          amount,
          status,
          pet_name,
          pet_type,
          pet_breed,
          user_id,
          consultation_notes
        `)
        .eq("vet_id", user.id);

      if (!error && data) {
        // Fetch users manually to avoid foreign key relation errors with PostgREST
        const userIds = [...new Set(data.map(apt => apt.user_id))];
        const profilesMap: Record<string, any> = {};
        
        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, name, full_name, profile_photo")
            .in("id", userIds);
            
          if (profiles) {
            profiles.forEach(p => {
              profilesMap[p.id] = p;
            });
          }
        }

        const mapped = data.map((apt: any) => {
          const userProfile = profilesMap[apt.user_id] || {};
          return {
            id: apt.id,
            date: apt.appointment_date,
            type: apt.appointment_type || "clinic",
            petName: apt.pet_name || "Luna",
            breed: apt.pet_breed || (apt.pet_type ? `${apt.pet_type}` : "Dog"),
            ownerName: userProfile.full_name || userProfile.name || "Sarah Jenkins",
            time: apt.appointment_time || "11:30 AM",
            status: apt.status || "pending",
            image: userProfile.profile_photo || "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=150&q=80",
            amount: (() => {
              if (apt.consultation_notes) {
                try {
                  const notes = typeof apt.consultation_notes === "string" 
                    ? JSON.parse(apt.consultation_notes) 
                    : apt.consultation_notes;
                  if (notes && notes.consultation_fee !== undefined) {
                    const baseFee = Number(notes.consultation_fee) || 0;
                    const nightFee = Number(notes.night_surcharge) || 0;
                    return baseFee + Math.round(nightFee * 0.5);
                  }
                } catch (e) {
                  console.warn("Failed to parse consultation_notes:", e);
                }
              }
              const totalAmount = Number(apt.amount) || 0;
              return Math.round(totalAmount * 0.74);
            })()
          };
        });
        setAppointments(mapped);
      }
    } catch (e) {
      console.error("Error in fetchAppointments:", e);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    fetchAppointments();
  }, [user?.id, fetchAppointments]);

  const totalEarnings = useMemo(() => {
    return appointments
      .filter(apt => apt.status !== "cancelled" && apt.status !== "pending")
      .reduce((sum, apt) => sum + (Number(apt.amount) || 650), 0);
  }, [appointments]);

  const todayEarnings = useMemo(() => {
    const todayStr = formatDateString(new Date());
    return appointments
      .filter(apt => apt.date === todayStr && apt.status !== "cancelled" && apt.status !== "pending")
      .reduce((sum, apt) => sum + (Number(apt.amount) || 650), 0);
  }, [appointments]);

  const growthPercentage = useMemo(() => {
    const today = new Date();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(today.getDate() - 7);
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(today.getDate() - 14);

    const thisWeekSum = appointments
      .filter(apt => {
        const d = new Date(apt.date);
        return d >= oneWeekAgo && d <= today && apt.status !== "cancelled" && apt.status !== "pending";
      })
      .reduce((sum, apt) => sum + (Number(apt.amount) || 650), 0);

    const lastWeekSum = appointments
      .filter(apt => {
        const d = new Date(apt.date);
        return d >= twoWeeksAgo && d < oneWeekAgo && apt.status !== "cancelled" && apt.status !== "pending";
      })
      .reduce((sum, apt) => sum + (Number(apt.amount) || 650), 0);

    if (lastWeekSum === 0) return thisWeekSum > 0 ? "+100%" : "+0%";
    const pct = ((thisWeekSum - lastWeekSum) / lastWeekSum) * 100;
    return `${pct >= 0 ? "+" : ""}${pct.toFixed(0)}%`;
  }, [appointments]);

  const mappedTransactions = useMemo(() => {
    return appointments.map((apt) => {
      const isCompleted = apt.status === "confirmed" || apt.status === "completed" || apt.status === "done";
      let displayStatus = isCompleted ? "COMPLETED" : "PENDING";
      if (apt.status === "cancelled") displayStatus = "CANCELLED";

      let iconColor = "bg-[#F4E8FF]";
      let icon = <Buildings size={22} weight="fill" className="text-[#9C2AF9]" />;
      
      if (apt.type === "video") {
        iconColor = "bg-[#E5EFFF]";
        icon = <VideoCamera size={22} weight="fill" className="text-[#267BF6]" />;
      } else if (apt.type === "home") {
        iconColor = "bg-[#FFEDD6]";
        icon = <HouseLine size={22} weight="fill" className="text-[#F97116]" />;
      }

      // Format date/time
      const dateObj = new Date(apt.date);
      const isToday = apt.date === formatDateString(new Date());
      const isYesterday = apt.date === formatDateString(new Date(Date.now() - 86400000));
      let displayTime = apt.time;
      if (isToday) displayTime = `Today, ${apt.time}`;
      else if (isYesterday) displayTime = `Yesterday, ${apt.time}`;
      else displayTime = `${dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${apt.time}`;

      return {
        id: apt.id,
        title: `${apt.petName} (${apt.type === "video" ? "Video Call" : apt.type === "clinic" ? "Clinic Visit" : "Home Visit"})`,
        time: displayTime,
        amount: `₹${(apt.amount || 650).toLocaleString('en-IN')}`,
        status: displayStatus,
        type: apt.type,
        iconColor,
        icon,
        rawAmount: apt.amount || 650,
        rawDate: apt.date,
        rawStatus: apt.status
      };
    });
  }, [appointments]);

  const filteredTransactions = useMemo(() => {
    const todayStr = formatDateString(new Date());
    
    // Date ranges
    const now = new Date();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(now.getDate() - 7);
    const oneMonthAgo = new Date();
    oneMonthAgo.setDate(now.getDate() - 30);

    return mappedTransactions.filter((t) => {
      // 1. Apply search query
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        const matchesTitle = t.title?.toLowerCase().includes(query);
        const matchesAmount = t.amount?.toLowerCase().includes(query);
        const matchesTime = t.time?.toLowerCase().includes(query);
        const matchesStatus = t.status?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesAmount && !matchesTime && !matchesStatus) {
          return false;
        }
      }

      // 2. Type filter
      if (activeFilterType !== "all" && t.type !== activeFilterType) {
        return false;
      }

      // 3. Status filter
      if (activeFilterStatus !== "all" && t.status !== activeFilterStatus) {
        return false;
      }

      const tDate = new Date(t.rawDate);

      // 4. Custom Date Range Filter (from drawer)
      if (filterStartDate) {
        const start = new Date(filterStartDate);
        start.setHours(0, 0, 0, 0);
        if (tDate < start) return false;
      }
      if (filterEndDate) {
        const end = new Date(filterEndDate);
        end.setHours(23, 59, 59, 999);
        if (tDate > end) return false;
      }

      // 5. Tab Date Range Filter (only if no custom date filters are applied)
      if (!filterStartDate && !filterEndDate) {
        if (activeTab === "Today") {
          return t.rawDate === todayStr;
        } else if (activeTab === "This Week") {
          return tDate >= oneWeekAgo && tDate <= now;
        } else if (activeTab === "This Month") {
          return tDate >= oneMonthAgo && tDate <= now;
        }
      }
      return true;
    });
  }, [mappedTransactions, activeTab, searchQuery, activeFilterType, activeFilterStatus, filterStartDate, filterEndDate]);

  const appointmentsCountForSelectedTab = useMemo(() => {
    return filteredTransactions.length;
  }, [filteredTransactions]);

  const displayedTransactions = useMemo(() => {
    return filteredTransactions.slice(0, 9);
  }, [filteredTransactions]);

  if (showSpinner) {
    return <SplashScreen message="Loading earnings..." />;
  }

  const hasCache = localStorage.getItem("sruvo_user_role") === "vet";
  if (guardLoading && !hasCache) {
    return null;
  }

  if (isViewAllOpen) {
    return (
      <div className="bg-[#F7F8FC] min-h-screen pb-12 font-sans text-[#1A1A2A] overflow-x-hidden selection:bg-purple-100">
        {/* View All Header */}
        <header className="flex items-center px-5 py-6 bg-white border-b border-gray-100 shadow-sm sticky top-0 z-40">
          <button 
            onClick={() => {
              setIsViewAllOpen(false);
              setSearchQuery("");
            }}
            className="w-[42px] h-[42px] rounded-full bg-slate-50 flex items-center justify-center border-none cursor-pointer active:scale-95 transition-all shrink-0"
          >
            <ArrowLeft size={20} weight="bold" />
          </button>
          <h1 className="text-[18px] font-[800] text-[#1f1f2e] ml-4 flex-grow">
            All Transactions ({activeTab})
          </h1>
          <div className="text-xs font-bold text-gray-400 bg-gray-100 px-3 py-1.5 rounded-full shrink-0">
            {filteredTransactions.length} Items
          </div>
        </header>

        {/* Search & Filter Section (Exactly as required) */}
        <div className="px-6 my-6 flex gap-3 max-w-7xl mx-auto">
          <div className="flex-1 bg-white rounded-full flex items-center px-5 shadow-[0_4px_15px_rgba(0,0,0,0.02)] border border-gray-100 focus-within:ring-2 focus-within:ring-[#9A3EF8]/20 transition-all">
            <MagnifyingGlass size={20} className="text-[#8A8D9F]" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search transactions" 
              className="flex-1 bg-transparent border-none outline-none py-4 px-3 text-sm font-medium text-[#1A1A2A]"
            />
          </div>
          <button 
            onClick={() => setIsFilterDrawerOpen(true)}
            className="w-[52px] h-[52px] bg-white rounded-full flex justify-center items-center border border-gray-100 shadow-[0_4px_15px_rgba(0,0,0,0.02)] active:scale-95 transition-all shrink-0"
          >
            <Funnel size={20} weight="bold" />
          </button>
        </div>

        {/* Transactions list */}
        <div className="max-w-7xl mx-auto px-6 flex flex-col gap-3.5">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-10 text-gray-400 font-semibold text-sm bg-white rounded-[24px] shadow-[0_4px_15px_rgba(0,0,0,0.02)]">
              No transactions found
            </div>
          ) : (
            filteredTransactions.map((t) => (
              <div key={t.id} className="bg-white p-4 rounded-[24px] flex items-center shadow-[0_4px_15px_rgba(0,0,0,0.02)] border border-gray-100/40">
                <div className={`w-[50px] h-[50px] rounded-full flex items-center justify-center mr-4 shrink-0 ${t.iconColor}`}>
                  {t.icon}
                </div>
                <div className="flex-1">
                  <p className="text-[15px] font-bold text-[#1A1A2A]">{t.title}</p>
                  <p className="text-xs font-medium text-[#8A8D9F] mt-1">{t.time}</p>
                </div>
                <div className="text-right flex flex-col items-end gap-1.5">
                  <p className="text-[15px] font-extrabold text-[#1A1A2A]">{t.amount}</p>
                  <span className={`text-[9px] font-black px-2.5 py-1 rounded-full tracking-[0.5px] ${
                    t.status === "COMPLETED" 
                      ? "bg-green-100 text-green-600" 
                      : "bg-orange-100 text-orange-600"
                  }`}>
                    {t.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Filter Drawer inside View All overlay */}
        {isFilterDrawerOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end justify-center transition-all duration-300">
            <div className="absolute inset-0" onClick={() => setIsFilterDrawerOpen(false)} />
            <div className="bg-white rounded-t-[40px] w-full max-w-md p-6 relative z-10 shadow-[0_-15px_40px_rgba(0,0,0,0.1)] max-h-[85vh] flex flex-col overflow-hidden animate-[slideUp_0.3s_ease-out_forwards]">
              <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6" />
              
              <h3 className="text-[20px] font-[800] text-[#1f1f2e] mb-6">Filter Transactions</h3>

              <div className="space-y-6 overflow-y-auto flex-1 pb-6 pr-1">
                {/* Type Filter */}
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-wider text-gray-400 mb-3">Transaction Type</p>
                  <div className="flex flex-wrap gap-2.5">
                    {[
                      { value: "all", label: "All Types" },
                      { value: "video", label: "Video Calls" },
                      { value: "clinic", label: "Clinic Visits" },
                      { value: "home", label: "Home Visits" }
                    ].map((type) => (
                      <button
                        key={type.value}
                        onClick={() => setActiveFilterType(type.value)}
                        className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                          activeFilterType === type.value
                            ? "bg-[#9A3EF8] text-white shadow-md shadow-purple-100"
                            : "bg-[#EFF0F5] text-[#8A8D9F] hover:text-[#1A1A2A]"
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Status Filter */}
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-wider text-gray-400 mb-3">Status</p>
                  <div className="flex flex-wrap gap-2.5">
                    {[
                      { value: "all", label: "All Statuses" },
                      { value: "COMPLETED", label: "Completed" },
                      { value: "PENDING", label: "Pending" },
                      { value: "CANCELLED", label: "Cancelled" }
                    ].map((status) => (
                      <button
                        key={status.value}
                        onClick={() => setActiveFilterStatus(status.value)}
                        className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                          activeFilterStatus === status.value
                            ? "bg-[#9A3EF8] text-white shadow-md shadow-purple-100"
                            : "bg-[#EFF0F5] text-[#8A8D9F] hover:text-[#1A1A2A]"
                        }`}
                      >
                        {status.label}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Date Filter */}
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-wider text-gray-400 mb-3">Date Range</p>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <input 
                        type="date"
                        value={filterStartDate}
                        onChange={(e) => setFilterStartDate(e.target.value)}
                        className="w-full bg-[#EFF0F5] border-none outline-none py-3 px-4 rounded-2xl text-sm font-bold text-[#1A1A2A]"
                      />
                    </div>
                    <div className="flex-1">
                      <input 
                        type="date"
                        value={filterEndDate}
                        onChange={(e) => setFilterEndDate(e.target.value)}
                        className="w-full bg-[#EFF0F5] border-none outline-none py-3 px-4 rounded-2xl text-sm font-bold text-[#1A1A2A]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <button 
                  onClick={() => {
                    setActiveFilterType("all");
                    setActiveFilterStatus("all");
                    setFilterStartDate("");
                    setFilterEndDate("");
                    setIsFilterDrawerOpen(false);
                    toast.success("Filters cleared");
                  }}
                  className="flex-1 text-[#5a5a6a] font-[700] py-4 rounded-[24px] tracking-wide active:scale-95 transition-all text-[15px] bg-[#ececf3]"
                >
                  Reset
                </button>
                <button 
                  onClick={() => {
                    setIsFilterDrawerOpen(false);
                    toast.success("Filters applied");
                  }}
                  className="flex-1 text-white bg-gradient-to-br from-[#8E3EFE] to-[#AE50FF] font-[700] py-4 rounded-[24px] tracking-wide active:scale-95 transition-all text-[15px] shadow-lg shadow-purple-100"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-[#F7F8FC] min-h-screen pb-32 font-sans text-[#1A1A2A] overflow-x-hidden selection:bg-purple-100">
      {/* Header aligned exactly like Schedule Header */}
      <header className="flex items-center justify-between px-5 py-6">
        {isSearchOpen ? (
          <div className="flex-1 h-[42px] bg-white rounded-[21px] px-4 shadow-[0_4px_15px_rgba(0,0,0,0.03)] border-none flex items-center gap-2 animate-[fadeIn_0.2s_ease-out_forwards]">
            <MagnifyingGlass size={18} weight="bold" className="text-[#8d8d9c] flex-shrink-0" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search transactions..."
              className="w-full bg-transparent border-none outline-none text-[14px] font-[600] text-[#1E1E2F] placeholder-[#8d8d9c]"
              autoFocus
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="text-gray-400 p-1 font-bold text-xs"
              >
                Clear
              </button>
            )}
            <button 
              onClick={() => {
                setIsSearchOpen(false);
                setSearchQuery("");
              }} 
              className="text-[#a428ff] font-bold text-[14px] px-1 active:scale-95 transition-all"
            >
              Cancel
            </button>
          </div>
        ) : (
          <>
            <h1 className="text-[22px] font-[800] text-[#1f1f2e] flex-grow">Earnings</h1>
            <div className="flex gap-2.5">
              {/* Search Button matching the Schedule layout */}
              <button 
                onClick={() => setIsSearchOpen(true)}
                className="w-[42px] h-[42px] rounded-full bg-white flex items-center justify-center border-none shadow-[0_4px_15px_rgba(0,0,0,0.03)] cursor-pointer active:scale-95 transition-all"
                title="Search Earnings"
              >
                <MagnifyingGlass size={20} weight="bold" />
              </button>

              {/* Notification Button matching Schedule exactly */}
              <button 
                onClick={() => setIsNotificationsOpen(true)}
                className="w-[42px] h-[42px] rounded-full bg-white flex items-center justify-center border-none shadow-[0_4px_15px_rgba(0,0,0,0.03)] cursor-pointer relative active:scale-95 transition-all"
                title="Notifications"
              >
                <Bell size={20} weight="bold" />
                {showUnreadBadge && (
                  <span className="absolute top-[10px] right-[12px] w-2 h-2 bg-[#ff4264] rounded-full border-2 border-white"></span>
                )}
              </button>
            </div>
          </>
        )}
      </header>

      {/* Earnings Card */}
      <div className="px-6 max-w-7xl mx-auto">
        <div className="bg-gradient-to-br from-[#8E3EFE] to-[#AE50FF] rounded-[36px] p-7 md:p-10 text-white shadow-[0_15px_35px_rgba(142,62,254,0.25)] relative overflow-hidden group">
          {/* Watermark/SVG decoration */}
          <div className="absolute top-5 right-5 w-20 h-20 opacity-15 pointer-events-none transform group-hover:rotate-12 transition-transform duration-700">
             <div className="w-full h-full border-[10px] border-white rounded-2xl relative">
                <div className="absolute -top-4 -left-4 w-10 h-10 border-[8px] border-white rounded-full"></div>
             </div>
          </div>

          <div className="relative z-10 flex justify-between items-start">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider opacity-90">Total Earnings</p>
              <h2 className="text-[42px] font-extrabold mt-2 tracking-tight">₹{totalEarnings.toLocaleString('en-IN')}</h2>
            </div>
            <div className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1 font-bold text-xs">
              <ArrowUpRight size={14} weight="bold" />
              {growthPercentage}
            </div>
          </div>

          <div className="h-[1px] bg-white/25 my-6"></div>

          <div className="relative z-10 flex items-center">
            <div className="flex-1 flex flex-col gap-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider opacity-90">Today's Earnings</p>
              <p className="text-xl font-bold">₹{todayEarnings.toLocaleString('en-IN')}</p>
            </div>
            <div className="flex-1 pl-5 border-l border-white/25 flex flex-col gap-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider opacity-90">Appointments</p>
              <p className="text-xl font-bold">{appointmentsCountForSelectedTab}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Time Tabs */}
      <div className="px-6 my-6 max-w-7xl mx-auto">
        <div className="bg-[#EFF0F5] p-1.5 rounded-[30px] flex gap-1">
          {["Today", "This Week", "This Month"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-sm font-bold rounded-[25px] transition-all duration-300 ${
                activeTab === tab 
                  ? "bg-white text-[#9A3EF8] shadow-[0_4px_10px_rgba(0,0,0,0.04)]" 
                  : "text-[#8A8D9F] hover:text-[#1A1A2A]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Search Section */}
      <div className="px-6 mb-8 flex gap-3 max-w-7xl mx-auto">
        <div className="flex-1 min-w-0 bg-white rounded-full flex items-center px-5 shadow-[0_4px_15px_rgba(0,0,0,0.02)] border border-gray-100 focus-within:ring-2 focus-within:ring-[#9A3EF8]/20 transition-all">
          <MagnifyingGlass size={20} className="text-[#8A8D9F] shrink-0" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search transactions" 
            className="flex-1 min-w-0 bg-transparent border-none outline-none py-4 px-3 text-sm font-medium text-[#1A1A2A]"
          />
        </div>
        <button 
          onClick={() => setIsFilterDrawerOpen(true)}
          className="w-[52px] h-[52px] bg-white rounded-full flex justify-center items-center shadow-[0_4px_15px_rgba(0,0,0,0.02)] border border-gray-100 active:scale-95 transition-all shrink-0"
        >
          <Funnel size={20} weight="bold" />
        </button>
      </div>

      {/* Transactions Section */}
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center px-6 mb-4">
          <h3 className="text-lg font-bold">Recent Transactions</h3>
          {filteredTransactions.length > 9 && (
            <button 
              onClick={() => setIsViewAllOpen(true)}
              className="text-xs font-bold text-[#9A3EF8] tracking-wider uppercase hover:underline"
            >
              View All
            </button>
          )}
        </div>

        <div className="px-6 flex flex-col gap-3.5">
          {displayedTransactions.length === 0 ? (
            <div className="text-center py-10 text-gray-400 font-semibold text-sm bg-white rounded-[24px] shadow-[0_4px_15px_rgba(0,0,0,0.02)]">
              No transactions found
            </div>
          ) : (
            displayedTransactions.map((t) => (
              <div key={t.id} className="bg-white p-4 rounded-[24px] flex items-center shadow-[0_4px_15px_rgba(0,0,0,0.02)] border border-gray-100/40">
                <div className={`w-[50px] h-[50px] rounded-full flex items-center justify-center mr-4 shrink-0 ${t.iconColor}`}>
                  {t.icon}
                </div>
                <div className="flex-1">
                  <p className="text-[15px] font-bold text-[#1A1A2A]">{t.title}</p>
                  <p className="text-xs font-medium text-[#8A8D9F] mt-1">{t.time}</p>
                </div>
                <div className="text-right flex flex-col items-end gap-1.5">
                  <p className="text-[15px] font-extrabold text-[#1A1A2A]">{t.amount}</p>
                  <span className={`text-[9px] font-black px-2.5 py-1 rounded-full tracking-[0.5px] ${
                    t.status === "COMPLETED" 
                      ? "bg-green-100 text-green-600" 
                      : "bg-orange-100 text-orange-600"
                  }`}>
                    {t.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-sm flex justify-center z-50 border-t border-gray-50/50 pb-safe">
        <div className="w-full max-w-7xl flex justify-between px-6 pt-4 pb-7">
          <button className="flex flex-col items-center gap-1.5 text-[#b5b5c3] font-extrabold text-[9px] tracking-[0.5px] w-[60px]" onClick={() => navigate("/vet/home")}>
            <House size={24} weight="bold" />
            HOME
          </button>
          <button className="flex flex-col items-center gap-1.5 text-[#b5b5c3] font-extrabold text-[9px] tracking-[0.5px] w-[60px]" onClick={() => navigate("/vet/schedule")}>
            <CalendarDots size={24} weight="bold" />
            SCHEDULE
          </button>
          <button className="flex flex-col items-center gap-1.5 text-[#a428ff] font-extrabold text-[9px] tracking-[0.5px] w-[60px]" onClick={() => navigate("/vet/earnings")}>
            <Wallet size={24} weight="fill" />
            EARNINGS
          </button>
          <button className="flex flex-col items-center gap-1.5 text-[#b5b5c3] font-extrabold text-[9px] tracking-[0.5px] w-[60px]" onClick={() => navigate("/vet/profile")}>
            <User size={24} weight="bold" />
            PROFILE
          </button>
        </div>
      </nav>

      {/* Notifications Bottom Sheet Drawer */}
      {isNotificationsOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end justify-center transition-all duration-300">
          <div className="absolute inset-0" onClick={() => setIsNotificationsOpen(false)} />
          <div className="bg-white rounded-t-[40px] w-full max-w-md p-6 relative z-10 shadow-[0_-15px_40px_rgba(0,0,0,0.1)] max-h-[85vh] flex flex-col overflow-hidden animate-[slideUp_0.3s_ease-out_forwards]">
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6" />
            
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[20px] font-[800] text-[#1f1f2e]">Notifications</h3>
              {showUnreadBadge && (
                <button 
                  onClick={() => {
                    setNotifications(prev => prev.map(n => ({ ...n, isUnread: false })));
                    toast.success("All notifications marked as read!");
                  }}
                  className="text-[13px] font-[700] text-[#a428ff] hover:underline"
                >
                  Mark all as read
                </button>
              )}
            </div>

            <div className="space-y-4 overflow-y-auto flex-1 pb-6 pr-1">
              {notifications.map((notif) => (
                <div 
                  key={notif.id}
                  className={`p-4 rounded-[22px] border transition-all duration-200 flex gap-3 ${
                    notif.isUnread 
                      ? "bg-[#f8f2ff] border-[#e9d9ff]" 
                      : "bg-[#fcfcfd] border-gray-100"
                  }`}
                >
                  <div className="mt-1">
                    {notif.isUnread ? (
                      <div className="w-2.5 h-2.5 rounded-full bg-[#ae41ff] animate-pulse" />
                    ) : (
                      <div className="w-2.5 h-2.5 rounded-full bg-gray-300" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={`text-[14px] leading-snug ${notif.isUnread ? "text-[#1f1f2e] font-[700]" : "text-[#5a5a6a] font-[500]"}`}>
                      {notif.text}
                    </p>
                    <span className="text-[11px] font-[600] text-gray-400 mt-1 block">
                      {notif.time}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <button 
              onClick={() => setIsNotificationsOpen(false)}
              className="w-full text-[#1f1f2e] font-[700] py-4 rounded-[24px] tracking-wide active:scale-95 transition-all text-[15px] mt-2 mb-2 bg-[#ececf3]"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Filter Bottom Sheet Drawer for Main Screen */}
      {isFilterDrawerOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end justify-center transition-all duration-300">
          <div className="absolute inset-0" onClick={() => setIsFilterDrawerOpen(false)} />
          <div className="bg-white rounded-t-[40px] w-full max-w-md p-6 relative z-10 shadow-[0_-15px_40px_rgba(0,0,0,0.1)] max-h-[85vh] flex flex-col overflow-hidden animate-[slideUp_0.3s_ease-out_forwards]">
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6" />
            
            <h3 className="text-[20px] font-[800] text-[#1f1f2e] mb-6">Filter Transactions</h3>

            <div className="space-y-6 overflow-y-auto flex-1 pb-6 pr-1">
              {/* Type Filter */}
              <div>
                <p className="text-xs font-extrabold uppercase tracking-wider text-gray-400 mb-3">Transaction Type</p>
                <div className="flex flex-wrap gap-2.5">
                  {[
                    { value: "all", label: "All Types" },
                    { value: "video", label: "Video Calls" },
                    { value: "clinic", label: "Clinic Visits" },
                    { value: "home", label: "Home Visits" }
                  ].map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setActiveFilterType(type.value)}
                      className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                        activeFilterType === type.value
                          ? "bg-[#9A3EF8] text-white shadow-md shadow-purple-100"
                          : "bg-[#EFF0F5] text-[#8A8D9F] hover:text-[#1A1A2A]"
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <p className="text-xs font-extrabold uppercase tracking-wider text-gray-400 mb-3">Status</p>
                <div className="flex flex-wrap gap-2.5">
                  {[
                    { value: "all", label: "All Statuses" },
                    { value: "COMPLETED", label: "Completed" },
                    { value: "PENDING", label: "Pending" },
                    { value: "CANCELLED", label: "Cancelled" }
                  ].map((status) => (
                    <button
                      key={status.value}
                      onClick={() => setActiveFilterStatus(status.value)}
                      className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                        activeFilterStatus === status.value
                          ? "bg-[#9A3EF8] text-white shadow-md shadow-purple-100"
                          : "bg-[#EFF0F5] text-[#8A8D9F] hover:text-[#1A1A2A]"
                      }`}
                    >
                      {status.label}
                    </button>
                  ))}
                </div>
              </div>
                {/* Date Filter */}
              <div>
                <p className="text-xs font-extrabold uppercase tracking-wider text-gray-400 mb-3">Date Range</p>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <input 
                      type="date"
                      value={filterStartDate}
                      onChange={(e) => setFilterStartDate(e.target.value)}
                      className="w-full bg-[#EFF0F5] border-none outline-none py-3 px-4 rounded-2xl text-sm font-bold text-[#1A1A2A]"
                    />
                  </div>
                  <div className="flex-1">
                    <input 
                      type="date"
                      value={filterEndDate}
                      onChange={(e) => setFilterEndDate(e.target.value)}
                      className="w-full bg-[#EFF0F5] border-none outline-none py-3 px-4 rounded-2xl text-sm font-bold text-[#1A1A2A]"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-4">
              <button 
                onClick={() => {
                  setActiveFilterType("all");
                  setActiveFilterStatus("all");
                  setFilterStartDate("");
                  setFilterEndDate("");
                  setIsFilterDrawerOpen(false);
                  toast.success("Filters cleared");
                }}
                className="flex-1 text-[#5a5a6a] font-[700] py-4 rounded-[24px] tracking-wide active:scale-95 transition-all text-[15px] bg-[#ececf3]"
              >
                Reset
              </button>
              <button 
                onClick={() => {
                  setIsFilterDrawerOpen(false);
                  toast.success("Filters applied");
                }}
                className="flex-1 text-white bg-gradient-to-br from-[#8E3EFE] to-[#AE50FF] font-[700] py-4 rounded-[24px] tracking-wide active:scale-95 transition-all text-[15px] shadow-lg shadow-purple-100"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VetEarnings;
