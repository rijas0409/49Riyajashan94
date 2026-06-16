/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { 
  ArrowLeft, MoreHorizontal, Shield, MapPin, Clock, Compass, Plus, 
  Minus, Sparkles, Check, Activity, FileText, PawPrint, AlertTriangle, 
  Info, X, Calendar, Edit2, CheckCircle, Smartphone
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ClinicVisitDetailsState {
  visit?: {
    id: string;
    petName: string;
    petBreed: string;
    petAge: string;
    ownerName: string;
    ownerPhone: string;
    address: string;
    time: string;
    reason: string;
    image: string;
    distance: string;
  };
}

const getFormattedPetAge = (approxYears: any, approxMonths: any, dob: any) => {
  let yrs = 0;
  let mos = 0;
  let hasData = false;

  if (approxYears !== null && approxYears !== undefined && !isNaN(parseInt(approxYears, 10))) {
    yrs = parseInt(approxYears, 10);
    mos = parseInt(approxMonths, 10) || 0;
    hasData = true;
  } else if (dob) {
    const dobDate = new Date(dob);
    if (!isNaN(dobDate.getTime())) {
      const today = new Date();
      yrs = today.getFullYear() - dobDate.getFullYear();
      mos = today.getMonth() - dobDate.getMonth();
      if (mos < 0) {
        yrs--;
        mos += 12;
      }
      hasData = true;
    }
  }

  if (!hasData) {
    return "3 Years";
  }

  if (yrs <= 0) {
    return `${mos || 1} mos`;
  } else {
    return `${yrs} Year${yrs > 1 ? "s" : ""}${mos > 0 ? ` ${mos} mos` : ""}`;
  }
};

const ClinicVisitDetails: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { appointmentId } = useParams();

  const { visit: stateVisit } = (location.state as ClinicVisitDetailsState) || {};
  const realDbId = location.state?.realAppointmentId || stateVisit?.id || appointmentId || "SRV-84721";

  // Initial and database states
  const [dbVisit, setDbVisit] = useState<any>(null);
  const [currentVisitId, setCurrentVisitId] = useState<string>(realDbId);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Chief Complaint Editing States
  const [chiefComplaint, setChiefComplaint] = useState("Regular Vaccination");
  const [isEditingReason, setIsEditingReason] = useState(false);
  const [reasonInput, setReasonInput] = useState("");

  // Sub-overlays and dropdowns
  const [headerDropdownOpen, setHeaderDropdownOpen] = useState(false);
  const [passportOverlayOpen, setPassportOverlayOpen] = useState(false);
  const [qrOverlayOpen, setQrOverlayOpen] = useState(false);

  // Passport Syncing and database records
  const [userPassports, setUserPassports] = useState<any[]>([]);
  const [loadingUserPassports, setLoadingUserPassports] = useState(false);
  const [selectedPassportId, setSelectedPassportId] = useState<string | null>(null);
  const [connectedPassport, setConnectedPassport] = useState<any | null>(null);
  const [connectedMedicalLog, setConnectedMedicalLog] = useState<any | null>(null);
  const [connectedConditions, setConnectedConditions] = useState<any[]>([]);
  const [connectedRecords, setConnectedRecords] = useState<any[]>([]);

  // Action Phase (Phase 1 = buttons, Phase 2 = swipe complete slider)
  const [phase, setPhase] = useState<number>(1);

  // Swipe completable slider states
  const [swipeProgress, setSwipeProgress] = useState(0); // 0 to 1
  const [isSwiping, setIsSwiping] = useState(false);
  const swipeStartRef = useRef(0);
  const swipeContainerRef = useRef<HTMLDivElement>(null);

  // 1. Fetch main appointment details on load
  useEffect(() => {
    let active = true;

    const fetchApptAndUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && active) setCurrentUser(user);

        // Fetch appointment with booking profile fkey relation to load requester profile picture & info
        const targetId = realDbId;
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(targetId || "");

        let query = supabase.from("vet_appointments").select("*, user:profiles!vet_appointments_user_id_fkey(*)");
        
        if (targetId && targetId !== "SRV-84721" && isUUID) {
          query = query.eq("id", targetId);
          const { data, error } = await query.maybeSingle();

          if (!error && data && active) {
            setDbVisit(data);
            setCurrentVisitId(data.id);
            if (data.consultation_notes || data.appointment_reason) {
              const notes = data.consultation_notes || data.appointment_reason;
              setChiefComplaint(notes);
              setReasonInput(notes);
            }
            if (data.status === "in_progress") {
              setPhase(2);
            }

            // Proactively auto-sync passport if pet_passport_id exists or can be matched
            if (data.user_id) {
              const { data: passports } = await supabase
                .from("pet_passports")
                .select("*")
                .eq("user_id", data.user_id);
              
              if (passports && passports.length > 0) {
                // Pick matching or first
                const matched = passports.find(p => p.pet_name?.toLowerCase() === data.pet_name?.toLowerCase()) || passports[0];
                if (matched) {
                  autoConnectPassport(matched, data.user_id);
                }
              }
            }
          }
        }
        if (active) setIsAuthLoading(false);
      } catch (err) {
        console.error("Error fetching ClinicVisitDetails:", err);
        if (active) setIsAuthLoading(false);
      }
    };

    fetchApptAndUser();

    return () => {
      active = false;
    };
  }, [realDbId]);

  // Real-time listener for the active appointment
  useEffect(() => {
    if (!currentVisitId || currentVisitId === "SRV-84721") return;

    const channel = supabase
      .channel("clinic_visit_realtime_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "vet_appointments",
          filter: `id=eq.${currentVisitId}`,
        },
        async (payload) => {
          console.log("Real-time update on ClinicVisitDetails:", payload);
          if (payload.new) {
            setDbVisit((prev: any) => ({ ...prev, ...(payload.new as any) }));
            if (payload.new.status === "in_progress") {
              setPhase(2);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentVisitId]);

  // Auto connect passport helper
  const autoConnectPassport = async (passport: any, userId: string) => {
    try {
      const [medicalRes, conditionsRes, recordsRes] = await Promise.all([
        supabase.from("pet_medical_logs").select("*").eq("pet_passport_id", passport.id).maybeSingle(),
        supabase.from("pet_health_conditions").select("*").eq("pet_passport_id", passport.id),
        supabase.from("pet_health_records_documents").select("*").eq("pet_passport_id", passport.id)
      ]);

      const ageTextVal = getFormattedPetAge(passport.approx_years, passport.approx_months, passport.dob);
      const weightVal = passport.weight ? `${passport.weight} lbs` : "4.9 lbs";
      const dobVal = passport.dob ? new Date(passport.dob).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Jun 29, 2024";
      const issueDateVal = passport.created_at ? new Date(passport.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Jun 13, 2026";

      setConnectedMedicalLog(medicalRes.data || null);
      setConnectedConditions(conditionsRes.data || []);
      setConnectedRecords(recordsRes.data || []);

      setConnectedPassport({
        id: passport.passport_id || `SRV-${passport.id?.slice(0, 6).toUpperCase()}`,
        rawId: passport.id,
        name: passport.pet_name || "Bella",
        species: passport.species || "Dog",
        gender: passport.gender || "Female",
        breed: passport.breed || "Golden Retriever",
        appearance: passport.appearance || "Grey whitish",
        age: ageTextVal,
        weight: weightVal,
        dob: dobVal,
        issueDate: issueDateVal,
        ownerName: passport.owner_name || "Mark Thompson",
        primaryPhone: passport.primary_phone || "+1 (555) 234-5678",
        emergencyContactName: passport.emergency_contact_name || "Riya (Wife)",
        emergencyPhone: passport.emergency_phone || "8349153416",
        photo_url: passport.photo_url || null,
        avatar: passport.species?.toLowerCase() === "cat" ? "coco" : "luna"
      });
    } catch (err) {
      console.error("Error auto connecting passport:", err);
    }
  };

  // Fetch pet owner passports to select/connect
  const fetchUserPassports = async () => {
    setLoadingUserPassports(true);
    try {
      const targetUserId = dbVisit?.user_id;
      if (!targetUserId) {
        toast.error("Requester user information is not loaded yet.");
        setLoadingUserPassports(false);
        return;
      }

      const { data, error } = await supabase
        .from("pet_passports")
        .select("*")
        .eq("user_id", targetUserId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading passports:", error);
        toast.error("Failed to load owner's passports.");
      } else {
        setUserPassports(data || []);
      }
    } catch (err) {
      console.error("Exception loading passports:", err);
    } finally {
      setLoadingUserPassports(false);
    }
  };

  // Confirm Connect passport manually
  const handleConfirmConnect = async () => {
    if (!selectedPassportId) return;
    const row = userPassports.find(p => p.id === selectedPassportId);
    if (!row) return;

    try {
      const [medicalRes, conditionsRes, recordsRes] = await Promise.all([
        supabase.from("pet_medical_logs").select("*").eq("pet_passport_id", row.id).maybeSingle(),
        supabase.from("pet_health_conditions").select("*").eq("pet_passport_id", row.id),
        supabase.from("pet_health_records_documents").select("*").eq("pet_passport_id", row.id)
      ]);

      const ageTextVal = getFormattedPetAge(row.approx_years, row.approx_months, row.dob);
      const weightVal = row.weight ? `${row.weight} lbs` : "4.9 lbs";
      const dobVal = row.dob ? new Date(row.dob).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Jun 29, 2024";
      const issueDateVal = row.created_at ? new Date(row.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Jun 13, 2026";

      setConnectedMedicalLog(medicalRes.data || null);
      setConnectedConditions(conditionsRes.data || []);
      setConnectedRecords(recordsRes.data || []);

      setConnectedPassport({
        id: row.passport_id || `SRV-${row.id?.slice(0, 6).toUpperCase()}`,
        rawId: row.id,
        name: row.pet_name || "Bella",
        species: row.species || "Dog",
        gender: row.gender || "Female",
        breed: row.breed || "Golden Retriever",
        appearance: row.appearance || "Grey whitish",
        age: ageTextVal,
        weight: weightVal,
        dob: dobVal,
        issueDate: issueDateVal,
        ownerName: row.owner_name || "Mark Thompson",
        primaryPhone: row.primary_phone || "+1 (555) 234-5678",
        emergencyContactName: row.emergency_contact_name || "Riya (Wife)",
        emergencyPhone: row.emergency_phone || "8349153416",
        photo_url: row.photo_url || null,
        avatar: row.species?.toLowerCase() === "cat" ? "coco" : "luna"
      });

      setPassportOverlayOpen(false);
      toast.success(`${row.pet_name}'s Passport synced successfully!`);
    } catch (e) {
      console.error(e);
      toast.error("Failed to sync passport medical details.");
    }
  };

  // Editing Chief Complaint in real DB
  const handleSaveReason = async () => {
    if (!reasonInput.trim()) {
      toast.error("Chief complaint cannot be empty!");
      return;
    }
    setChiefComplaint(reasonInput);
    setIsEditingReason(false);

    if (currentVisitId && currentVisitId !== "SRV-84721") {
      try {
        const { error } = await supabase
          .from("vet_appointments")
          .update({ consultation_notes: reasonInput, appointment_reason: reasonInput })
          .eq("id", currentVisitId);
        if (!error) {
          toast.success("Visit chief complaint updated in real time!");
        } else {
          console.error("Database error updating compliant info:", error);
        }
      } catch (err) {
        console.error("Exception updating compliant info:", err);
      }
    } else {
      toast.success("Reason updated successfully (Dev Sandbox Mode)");
    }
  };

  // Start Consultation (hides Phase 1, activates Phase 2 slide)
  const handleStartConsultation = async () => {
    if (currentVisitId && currentVisitId !== "SRV-84721") {
      try {
        await supabase
          .from("vet_appointments")
          .update({ status: "in_progress" })
          .eq("id", currentVisitId);
        toast.success("Consultation started! Please swipe the bottom slider when done.");
      } catch (err) {
        console.error("Database error starting consultation:", err);
      }
    } else {
      toast.success("Consultation started! Please swipe the bottom slider when done.");
    }
    setPhase(2);
  };

  // QR trigger scan success action
  const executeMockScan = async () => {
    setQrOverlayOpen(false);
    toast.success("✨ QR Code Verified: Pet verified successfully!");
    handleStartConsultation();
  };

  // Complete consultation swipe action
  const handleCompleteConsultation = async () => {
    toast.success("Consultation Completed Successfully!");

    if (currentVisitId && currentVisitId !== "SRV-84721") {
      try {
        await supabase
          .from("vet_appointments")
          .update({ status: "completed" })
          .eq("id", currentVisitId);
      } catch (err) {
        console.error("Database error completing appointment:", err);
      }
    }

    // Wait a brief period and navigate back to schedule page
    setTimeout(() => {
      navigate("/vet/schedule");
    }, 1500);
  };

  // Handling continuous mouse/touch dragging of swipe completable slider
  const handleSwipeStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsSwiping(true);
    const startX = "touches" in e ? e.touches[0].clientX : e.clientX;
    swipeStartRef.current = startX;
  };

  const handleSwipeMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isSwiping || !swipeContainerRef.current) return;
    const currentX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const deltaX = currentX - swipeStartRef.current;
    
    const containerWidth = swipeContainerRef.current.clientWidth;
    const handleWidth = 52 + 12; // Button size + padding around
    const maxTrack = containerWidth - handleWidth;

    let progress = deltaX / maxTrack;
    if (progress < 0) progress = 0;
    if (progress > 1) progress = 1;
    setSwipeProgress(progress);
  };

  const handleSwipeEnd = () => {
    if (!isSwiping) return;
    setIsSwiping(false);
    if (swipeProgress >= 0.85) {
      setSwipeProgress(1);
      handleCompleteConsultation();
    } else {
      setSwipeProgress(0);
    }
  };

  // Helper values mapping clinic DB visit beautifully
  const petNameDisplay = connectedPassport?.name || dbVisit?.pet_name || "Bella";
  const petBreedDisplay = connectedPassport?.breed || dbVisit?.pet_breed || "Golden Retriever";
  const petAgeDisplay = connectedPassport?.age || "3 Years";
  const petPhotoDisplay = connectedPassport?.photo_url || dbVisit?.user?.profile_photo || "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=200&h=200";
  const ownerNameDisplay = dbVisit?.user?.full_name || dbVisit?.user?.name || "Mark Thompson";
  const ownerPhoneDisplay = dbVisit?.user?.phone || "+1 (555) 234-5678";
  const scheduledTimeDisplay = dbVisit?.appointment_time 
    ? `Today, ${dbVisit.appointment_time}` 
    : "Today, 11:30 AM";
  const clinicAddressDisplay = "124 Maple Street, Apt 4B";

  return (
    <div className="bg-gray-200 min-h-screen flex justify-center antialiased select-none font-sans text-[#1a1f36] relative">
      
      {/* Dynamic Custom Embedded Styling block to achieve exact CSS of clinio.html */}
      <style>{`
        ::-webkit-scrollbar { display: none; }
        * { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes subtleShimmer {
          0%, 100% { opacity: 0.15; }
          50% { opacity: 0.35; }
        }
        .shimmer-track {
          animation: subtleShimmer 3s infinite ease-in-out;
        }
        @keyframes laserMove {
          0% { top: 6%; }
          50% { top: 94%; }
          100% { top: 6%; }
        }
        .laser-line {
          animation: laserMove 2s infinite linear;
        }
        .shadow-card {
          box-shadow: 0 8px 25px -8px rgba(0,0,0,0.06);
        }
        .shadow-floating {
          box-shadow: 0 15px 35px -5px rgba(157, 78, 221, 0.3);
        }
        .shadow-qrShadow {
          box-shadow: 0 8px 20px -4px rgba(157, 78, 221, 0.2);
        }
        .shadow-premiumSwipe {
          box-shadow: 0 10px 30px -6px rgba(157, 78, 221, 0.25);
        }
        .shadow-handleShadow {
          box-shadow: 0 4px 15px -2px rgba(139, 92, 246, 0.5);
        }
        .shadow-scannerTarget {
          box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.70);
        }
        .shadow-brandFrameGlow {
          box-shadow: 0 0 20px rgba(157, 78, 221, 0.3);
        }
      `}</style>

      {/* Main centered mobile simulator column */}
      <div className="relative w-full max-w-[400px] bg-[#f6f7fb] h-screen overflow-hidden shadow-2xl sm:border sm:border-gray-300 sm:rounded-3xl flex flex-col justify-between">
        
        {/* Header Bar */}
        <header id="header-bar" className="flex justify-between items-center px-6 py-4 bg-white sm:rounded-t-3xl z-20 relative shrink-0 border-b border-gray-100">
          <button 
            id="btn-nav-back"
            onClick={() => navigate("/vet/schedule")}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-50 border border-gray-100 text-gray-700 hover:bg-gray-100 transition active:scale-95"
          >
            <ArrowLeft className="w-4 h-4 text-[#1a1f36]" strokeWidth={2.5} />
          </button>
          
          <h1 id="header-title" className="text-[16px] font-bold text-[#1a1f36]">Visit Details</h1>
          
          <div className="relative">
            <button 
              id="btn-header-more"
              onClick={() => setHeaderDropdownOpen(!headerDropdownOpen)}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-50 border border-gray-100 text-gray-700 hover:bg-gray-100 transition active:scale-95"
            >
              <MoreHorizontal className="w-4 h-4 text-[#1a1f36]" strokeWidth={2.5} />
            </button>

            {headerDropdownOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setHeaderDropdownOpen(false)} />
                <div id="dropdown-menu" className="absolute right-0 top-full mt-1.5 bg-white border border-gray-200 rounded-[14px] shadow-xl w-[170px] overflow-hidden z-40 animate-slide-down">
                  <div 
                    onClick={() => {
                      setHeaderDropdownOpen(false);
                      toast.info("Visit status is confirmed by Sruvo Clinic Network.");
                    }}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 cursor-pointer font-bold text-xs text-gray-800"
                  >
                    <Info className="w-4 h-4 text-[#9d4edd]" />
                    <span>Clinic Info</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Scrollable Contents column */}
        <main id="main-scrollable" className="flex-1 overflow-y-auto pb-[180px] relative z-0">
          
          {/* Pet Profile Cover Section */}
          <div id="pet-profile-hero" className="flex flex-col items-center pt-3 pb-2">
            <div className="relative w-[100px] h-[100px]">
              <img 
                id="pet-avatar-photo"
                src={petPhotoDisplay} 
                alt={petNameDisplay} 
                className="w-full h-full object-cover rounded-full border-[3px] border-white shadow-sm"
                referrerPolicy="no-referrer"
              />
              <div id="active-status-dot" className="absolute bottom-1 right-1 w-[20px] h-[20px] bg-[#22c55e] border-[3px] border-white rounded-full"></div>
            </div>
            
            <h2 id="pet-name-heading" className="text-[26px] font-bold text-[#1a1f36] mt-2 tracking-tight">{petNameDisplay}</h2>
            <p id="pet-breed-heading" className="text-[#8b92a5] font-medium text-[14px] mt-0.5">{petBreedDisplay} • {petAgeDisplay}</p>
            
            <div id="consultation-status-badge" className="mt-2.5 bg-[#f3e8ff] text-[#9d4edd] px-3 py-1 rounded-full flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-[#9d4edd] rounded-full"></div>
              <span className="text-[10px] font-bold tracking-widest uppercase">
                {dbVisit?.status === "completed" ? "Consultation Done" : dbVisit?.status === "in_progress" ? "In Progress" : "Consultation Confirmed"}
              </span>
            </div>
          </div>

          {/* [1] Visit Information Card */}
          <div id="card-visit-info" className="mx-5 mt-3 bg-white rounded-[20px] p-4 shadow-card">
            <div className="flex justify-between items-center mb-3.5">
              <h3 className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">Visit Information</h3>
              <div className="w-5 h-5 rounded-full bg-[#9d4edd] flex items-center justify-center text-white text-[9px]">
                <Info size={10} className="text-white" strokeWidth={3} />
              </div>
            </div>
            
            <div className="flex flex-col gap-3.5">
              {/* Visit Type */}
              <div id="info-row-type" className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-md shrink-0">
                  <PawPrint className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-[11px] text-gray-400 font-medium">Visit Type</p>
                  <p className="text-[14px] text-[#1a1f36] font-bold mt-0.5">Clinic Visit</p>
                </div>
              </div>

              {/* Reason for Visit */}
              <div id="info-row-reason" className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-50 text-[#9d4edd] flex items-center justify-center text-md shrink-0">
                  <Sparkles className="w-5 h-5 text-[#9d4edd]" />
                </div>
                <div>
                  <p className="text-[11px] text-gray-400 font-medium">Reason for Visit</p>
                  <p className="text-[14px] text-[#1a1f36] font-bold mt-0.5">{chiefComplaint}</p>
                </div>
              </div>

              {/* Scheduled Time */}
              <div id="info-row-time" className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center text-md shrink-0">
                  <Clock className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-[11px] text-gray-400 font-medium">Scheduled Time</p>
                  <p className="text-[14px] text-[#1a1f36] font-bold mt-0.5">
                    {scheduledTimeDisplay} <span className="text-[#9d4edd] font-medium">(Confirmed)</span>
                  </p>
                </div>
              </div>

              {/* Owner Address */}
              <div id="info-row-address" className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#f3e8ff] text-[#9d4edd] flex items-center justify-center text-md shrink-0">
                  <MapPin className="w-5 h-5 text-[#9d4edd]" />
                </div>
                <div>
                  <p className="text-[11px] text-gray-400 font-medium">Clinic Address</p>
                  <p className="text-[14px] text-[#1a1f36] font-bold mt-0.5">{clinicAddressDisplay}</p>
                </div>
              </div>
            </div>
          </div>

          {/* [2] Reason For Visit (Chief Complaint) Card with inline editor */}
          <div id="card-chief-complaint-section" className="mx-5 mt-4">
            <div className="flex justify-between items-center mb-2 px-0.5">
              <h2 className="text-[16px] font-bold text-[#1a1f36] tracking-tight">Reason for Visit</h2>
              <button 
                id="btn-edit-reason"
                onClick={() => {
                  setReasonInput(chiefComplaint);
                  setIsEditingReason(true);
                }}
                className="text-pink-500 font-semibold text-[11px] flex items-center gap-1 active:scale-95 transition-transform"
              >
                <Edit2 className="w-3 h-3 text-pink-500" /> Edit
              </button>
            </div>

            {isEditingReason ? (
              <div id="reason-editor-box" className="bg-white rounded-[20px] p-4 shadow-card flex flex-col gap-3 animate-fade-in">
                <p className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">Edit Chief Complaint</p>
                <textarea
                  id="textarea-chief-complaint"
                  className="w-full text-[13px] text-gray-700 font-medium leading-relaxed bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-[#9d4edd]"
                  rows={3}
                  value={reasonInput}
                  onChange={(e) => setReasonInput(e.target.value)}
                  placeholder="Kiro is fainting I need emergency help."
                />
                <div className="flex items-center gap-2 justify-end">
                  <button 
                    id="btn-cancel-reason"
                    className="px-3 py-1.5 text-xs font-bold text-gray-400 hover:text-gray-600"
                    onClick={() => setIsEditingReason(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    id="btn-save-reason"
                    className="bg-[#9d4edd] text-white px-4 py-1.5 text-xs font-bold rounded-lg hover:shadow-md transition active:scale-95"
                    onClick={handleSaveReason}
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div id="reason-box-display" className="bg-white rounded-[20px] p-4 shadow-card flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 tracking-wider uppercase mb-0.5">Chief Complaint</p>
                  <p className="text-[13px] text-gray-700 font-medium leading-relaxed">{chiefComplaint}</p>
                </div>
              </div>
            )}
          </div>

          {/* Connect Passport Flow Card (Active when NO passport is connected yet) */}
          {!connectedPassport && (
            <div id="connect-passport-card" className="mx-5 mt-4 p-4 rounded-2xl bg-pink-50/50 border border-pink-100 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#ec4899] text-white rounded-xl flex items-center justify-center shadow-sm shadow-pink-200">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800">Connect Passport</p>
                  <p className="text-xs text-gray-500">Sync digital medical records</p>
                </div>
              </div>
              <button 
                id="btn-open-passport-selector"
                onClick={() => {
                  setSelectedPassportId(null);
                  setPassportOverlayOpen(true);
                  fetchUserPassports();
                }}
                className="bg-white text-[#ec4899] text-xs font-bold px-4 py-2 rounded-lg border border-pink-100 shadow-sm hover:bg-pink-50 transition active:scale-95"
              >
                Connect
              </button>
            </div>
          )}

          {/* [3] Clinical Overview Card (Only rendered when passport is connected) */}
          {connectedPassport && (
            <div id="connected-clinical-overview" className="mx-5 mt-4 animate-fade-in">
              <h2 className="text-[16px] font-bold text-[#1a1f36] mb-2 px-0.5 tracking-tight">Clinical Overview</h2>
              <div className="bg-white rounded-[20px] p-4 shadow-card flex items-center gap-3.5">
                <img 
                  id="clinical-overview-pet-photo"
                  src={petPhotoDisplay} 
                  alt={petNameDisplay} 
                  className="w-[54px] h-[54px] rounded-xl object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span id="clinical-overview-pet-name" className="text-[15px] font-bold text-[#1a1f36]">{petNameDisplay}</span>
                    <span className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase scale-90 origin-left">Active</span>
                  </div>
                  <p id="clinical-overview-breed-desc" className="text-[13px] text-gray-700 font-semibold mt-0.5">{petBreedDisplay} • {connectedPassport.gender}</p>
                  <div className="flex items-center gap-3 text-[#8b92a5] text-[11px] mt-1 font-medium">
                    <span className="flex items-center gap-1"><Clock size={10} /> {petAgeDisplay}</span>
                    <span className="flex items-center gap-1"><Activity size={10} /> {connectedPassport.weight}</span>
                    <span className="flex items-center gap-1"><Calendar size={10} /> {connectedPassport.dob}</span>
                  </div>
                </div>
              </div>

              {/* Pet Passport Components Heading */}
              <div id="passport-details-heading" className="mt-5">
                <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase px-0.5">Pet Passport Details</p>
              </div>

              {/* Identification Card */}
              <div id="card-passport-id" className="mt-2 bg-white rounded-[20px] p-4 shadow-card">
                <div className="flex items-center gap-1.5 mb-3.5">
                  <div className="w-1 h-3.5 bg-pink-500 rounded-full"></div>
                  <h4 className="text-[11px] font-bold text-[#1a1f36] tracking-wider uppercase">I. Identification</h4>
                </div>
                <div className="grid grid-cols-2 gap-y-3.5 gap-x-2">
                  <div>
                    <p className="text-[10px] text-[#8b92a5] font-bold uppercase tracking-wide">Pet Name</p>
                    <p className="text-[13px] text-[#1a1f36] font-bold mt-0.5">{petNameDisplay}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#8b92a5] font-bold uppercase tracking-wide">Passport ID</p>
                    <p className="text-[13px] text-pink-500 font-bold mt-0.5">{connectedPassport.id}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#8b92a5] font-bold uppercase tracking-wide">Species / Gender</p>
                    <p className="text-[13px] text-[#1a1f36] font-bold mt-0.5">{connectedPassport.species} • {connectedPassport.gender}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#8b92a5] font-bold uppercase tracking-wide">Breed</p>
                    <p className="text-[13px] text-[#1a1f36] font-bold mt-0.5">{petBreedDisplay}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[10px] text-[#8b92a5] font-bold uppercase tracking-wide">Appearance / Distinguishing Marks</p>
                    <p className="text-[13px] text-[#1a1f36] font-bold mt-0.5">{connectedPassport.appearance}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#8b92a5] font-bold uppercase tracking-wide">Date of Birth</p>
                    <p className="text-[13px] text-[#1a1f36] font-bold mt-0.5">{connectedPassport.dob}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#8b92a5] font-bold uppercase tracking-wide">Age / Weight</p>
                    <p className="text-[13px] text-[#1a1f36] font-bold mt-0.5">{petAgeDisplay} • {connectedPassport.weight}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#8b92a5] font-bold uppercase tracking-wide">Issue Date</p>
                    <p className="text-[13px] text-[#1a1f36] font-bold mt-0.5">{connectedPassport.issueDate}</p>
                  </div>
                </div>
              </div>

              {/* Ownership & Legal Guardian Card */}
              <div id="card-passport-guard" className="mt-3.5 bg-white rounded-[20px] p-4 shadow-card">
                <div className="flex items-center gap-1.5 mb-3.5">
                  <div className="w-1 h-3.5 bg-pink-500 rounded-full"></div>
                  <h4 className="text-[11px] font-bold text-[#1a1f36] tracking-wider uppercase">II. Ownership & Legal Guardian</h4>
                </div>
                <div className="grid grid-cols-2 gap-y-3.5 gap-x-2">
                  <div>
                    <p className="text-[10px] text-[#8b92a5] font-bold uppercase tracking-wide">Owner Name</p>
                    <p className="text-[13px] text-[#1a1f36] font-bold mt-0.5">{connectedPassport.ownerName}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#8b92a5] font-bold uppercase tracking-wide">Primary Phone</p>
                    <p className="text-[13px] text-[#1a1f36] font-bold mt-0.5">{connectedPassport.primaryPhone}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#8b92a5] font-bold uppercase tracking-wide">Emergency Contact</p>
                    <p className="text-[13px] text-[#1a1f36] font-bold mt-0.5">{connectedPassport.emergencyContactName}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#8b92a5] font-bold uppercase tracking-wide">Emergency Phone</p>
                    <p className="text-[13px] text-[#1a1f36] font-bold mt-0.5">{connectedPassport.emergencyPhone}</p>
                  </div>
                </div>
              </div>

              {/* Clinical Notes & Allergies Card */}
              <div id="card-passport-allergies" className="mt-3.5 bg-white rounded-[20px] p-4 shadow-card">
                <div className="flex items-center gap-1.5 mb-3.5">
                  <div className="w-1 h-3.5 bg-pink-500 rounded-full"></div>
                  <h4 className="text-[11px] font-bold text-[#1a1f36] tracking-wider uppercase">III. Clinical Notes & Allergies</h4>
                </div>
                <div className="grid grid-cols-2 gap-y-3.5 gap-x-2">
                  <div className="col-span-2">
                    <p className="text-[10px] text-[#8b92a5] font-bold uppercase tracking-wide">Known Allergies</p>
                    <p className="text-[13px] text-red-500 font-bold mt-0.5">{connectedMedicalLog?.allergies || "No major registered allergies"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#8b92a5] font-bold uppercase tracking-wide">Last Veterinary Visit</p>
                    <p className="text-[13px] text-[#1a1f36] font-bold mt-0.5">{connectedMedicalLog?.last_visit || "Jun 13, 2026"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#8b92a5] font-bold uppercase tracking-wide">Registered Conditions</p>
                    <p className="text-[13px] text-[#1a1f36] font-bold mt-0.5">{connectedMedicalLog?.conditions || "None"}</p>
                  </div>
                </div>
              </div>

              {/* Health Records Section */}
              <div id="passport-health-records" className="mt-4">
                <div className="flex justify-between items-center mb-2 px-0.5">
                  <h3 className="text-[11px] font-bold text-gray-400 tracking-widest uppercase">Health Records</h3>
                  <button 
                    onClick={() => toast.info("Displaying all verified health certificates")}
                    className="text-pink-500 font-bold text-[11px] hover:underline"
                  >
                    View All
                  </button>
                </div>
                <div className="flex flex-col gap-2">
                  {connectedRecords.length > 0 ? (
                    connectedRecords.map((rec, idx) => (
                      <div key={rec.id || idx} className="bg-white rounded-[16px] p-3.5 shadow-card flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-1 h-8 bg-emerald-500 rounded-full"></div>
                          <div>
                            <p className="text-[13px] text-[#1a1f36] font-bold">{rec.record_title || "Vaccination Certificate"}</p>
                            <p className="text-[11px] text-[#8b92a5] font-medium">{rec.record_type || "Clinical document record"}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-[#8b92a5] uppercase">
                          {rec.date_administered ? new Date(rec.date_administered).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }) : "13 Jun 2026"}
                        </span>
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="bg-white rounded-[16px] p-3.5 shadow-card flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-1 h-8 bg-emerald-500 rounded-full"></div>
                          <div>
                            <p className="text-[13px] text-[#1a1f36] font-bold">Vaccination Certificate</p>
                            <p className="text-[11px] text-[#8b92a5] font-medium">Clinical document record</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-[#8b92a5] uppercase">13 Jun 2026</span>
                      </div>
                      <div className="bg-white rounded-[16px] p-3.5 shadow-card flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-1 h-8 bg-emerald-500 rounded-full"></div>
                          <div>
                            <p className="text-[13px] text-[#1a1f36] font-bold">General Checkup Form</p>
                            <p className="text-[11px] text-[#8b92a5] font-medium">Clinical document record</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-[#8b92a5] uppercase">13 Jun 2026</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Owner Information Card */}
              <div id="card-passport-owner" className="mt-4 bg-white rounded-[20px] p-4 shadow-card">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">Owner Information</h3>
                  <a 
                    href={`tel:${ownerPhoneDisplay}`}
                    className="w-7 h-7 rounded-full bg-[#f3e8ff] flex items-center justify-center text-[#9d4edd] text-[11px] cursor-pointer hover:bg-purple-100 transition"
                  >
                    <Smartphone className="w-3.5 h-3.5 text-[#9d4edd]" />
                  </a>
                </div>
                
                <div className="flex items-center gap-3">
                  <img 
                    id="owner-profile-photo"
                    src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100&h=100" 
                    alt={ownerNameDisplay} 
                    className="w-[45px] h-[45px] rounded-full object-cover"
                  />
                  <div>
                    <p id="owner-name-text" className="text-[15px] text-[#1a1f36] font-bold">{ownerNameDisplay}</p>
                    <p id="owner-phone-text" className="text-[13px] text-[#8b92a5] font-medium mt-0.5">{ownerPhoneDisplay}</p>
                  </div>
                </div>
              </div>

              {/* Medical Background Card */}
              <div id="card-passport-medical" className="mt-4 bg-white rounded-[20px] p-4 shadow-card">
                <h3 className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-3">Medical Background</h3>
                
                <div className="flex flex-col gap-3">
                  <div className="flex gap-2.5 items-start">
                    <div className="mt-0.5 w-[16px] h-[16px] rounded-full bg-[#22c55e] text-white flex items-center justify-center text-[9px] shrink-0">
                      <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                    </div>
                    <p className="text-[13px] text-gray-700 font-medium leading-snug">Last Deworming: 2 months ago (Up to date)</p>
                  </div>
                  
                  <div className="flex gap-2.5 items-start">
                    <div className="mt-0.5 w-[16px] h-[16px] rounded-full bg-[#22c55e] text-white flex items-center justify-center text-[9px] shrink-0">
                      <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                    </div>
                    <p className="text-[13px] text-gray-700 font-medium leading-snug">Vaccination Status: All current</p>
                  </div>
                  
                  <div className="flex gap-2.5 items-start">
                    <div className="text-orange-500 text-[16px] shrink-0">
                      <AlertTriangle className="w-4 h-4 text-orange-500" />
                    </div>
                    <p className="text-[13px] text-gray-700 font-medium leading-snug">
                      {connectedMedicalLog?.allergies ? `Allergy to: ${connectedMedicalLog.allergies}` : "Allergy: Penicillin-based antibiotics"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
        </main>

        {/* Floating QR Button */}
        <button 
          id="btn-trigger-scanner"
          onClick={() => setQrOverlayOpen(true)}
          className="absolute bottom-[160px] right-6 w-[56px] h-[56px] bg-[#f3e8ff] text-[#9d4edd] rounded-[22px] shadow-qrShadow flex items-center justify-center text-[22px] transition transform hover:scale-105 active:scale-95 z-20" 
          title="Scan QR"
        >
          <svg className="w-6 h-6 text-[#9d4edd]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 15h.008v.008H15V15zm0 2.25h.008v.008H15v-.008zm0 2.25h.008v.008H15V19.5zm2.25-2.25h.008V17.25h-.008zm0 2.25h.008v.008H17.25V19.5zm2.25-4.5h.008v.008H19.5V15zm0 2.25h.008v.008H19.5v-.008zm0 2.25h.008v.008H19.5V19.5z" />
          </svg>
        </button>

        {/* [REFINED] High-Fidelity Google Pay Immersive Scanner overlay */}
        {qrOverlayOpen && (
          <div 
            id="scanner-viewport-modal" 
            className="absolute inset-0 bg-black z-50 flex flex-col justify-between transition-all duration-300 ease-out sm:rounded-3xl animate-fade-in"
          >
            {/* Simulated Live Viewport camera stream */}
            <div className="absolute inset-0 w-full h-full bg-[#121016] overflow-hidden sm:rounded-3xl">
              {/* Matrix alignment grid network wrapper */}
              <div 
                className="absolute inset-0 opacity-[0.05] pointer-events-none" 
                style={{
                  backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
                  backgroundSize: "18px 18px"
                }} 
              />
              
              {/* Centered offset scanning bounding targets */}
              <div className="absolute inset-x-0 top-0 bottom-[10%] flex items-center justify-center pointer-events-none">
                
                {/* Targeting square boundaries glow frame */}
                <div className="w-[250px] h-[250px] rounded-2xl shadow-scannerTarget bg-transparent relative border border-white/5 shadow-brandFrameGlow">
                  
                  {/* Purple high tech bounding corner indicators */}
                  <div className="absolute -top-[2px] -left-[2px] w-7 h-7 border-t-[4px] border-l-[4px] border-[#9d4edd] rounded-tl-xl"></div>
                  <div className="absolute -top-[2px] -right-[2px] w-7 h-7 border-t-[4px] border-r-[4px] border-[#9d4edd] rounded-tr-xl"></div>
                  <div className="absolute -bottom-[2px] -left-[2px] w-7 h-7 border-b-[4px] border-l-[4px] border-[#9d4edd] rounded-bl-xl"></div>
                  <div className="absolute -bottom-[2px] -right-[2px] w-7 h-7 border-b-[4px] border-r-[4px] border-[#9d4edd] rounded-br-xl"></div>
                  
                  {/* Moving high laser scan track line */}
                  <div className="absolute left-3 right-3 h-[2.5px] bg-gradient-to-r from-transparent via-purple-400 to-transparent shadow-[0_0_12px_#9d4edd] laser-line"></div>
                </div>
              </div>
            </div>

            {/* Header controls layer */}
            <div className="px-6 pt-6 pb-4 flex justify-between items-center w-full z-10 bg-gradient-to-b from-black/60 to-transparent">
              <button 
                id="btn-close-scanner"
                onClick={() => setQrOverlayOpen(false)} 
                className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md text-white/90 flex items-center justify-center hover:bg-white/20 transition active:scale-95"
              >
                <ArrowLeft className="w-5 h-5 text-white" strokeWidth={2.5} />
              </button>
              <p className="text-white/90 text-[13px] font-semibold tracking-wider uppercase bg-black/20 px-3 py-1.5 rounded-full backdrop-blur-sm">
                Scan Consultation QR
              </p>
              <div className="w-10 h-10" /> {/* Balance spacer */}
            </div>

            {/* Overlay screen clickable hitbox - click anywhere to verify mock scan */}
            <div 
              id="click-to-scan-simulator"
              onClick={executeMockScan} 
              className="absolute inset-0 z-0 cursor-pointer" 
              title="Tap screen to simulate successful QR detection"
            />

            {/* Bottom description banner */}
            <div className="p-12 flex flex-col items-center justify-center w-full z-10 bg-gradient-to-t from-black/70 via-black/30 to-transparent pointer-events-none">
              <p className="text-white/40 text-[11px] font-medium tracking-wide text-center max-w-[210px] leading-relaxed">
                Align QR code within the frame to instantly verify visit
              </p>
            </div>
          </div>
        )}

        {/* Dynamic footer action containers */}
        <div id="footer-actions-container" className="absolute bottom-0 left-0 w-full px-5 pb-6 pt-10 bg-gradient-to-t from-[#f6f7fb] via-[#f6f7fb] to-transparent z-10 sm:rounded-b-3xl shrink-0">
          
          {/* Phase 1: Default initial buttons */}
          {phase === 1 && (
            <div id="initialActions" className="flex flex-col gap-2.5 animate-slide-up">
              <button 
                id="btn-start-consultation"
                onClick={handleStartConsultation} 
                className="w-full bg-gradient-to-r from-[#a855f7] to-[#8b5cf6] text-white py-[16px] rounded-2xl font-bold text-[15px] flex justify-center items-center gap-2.5 shadow-floating transition transform active:scale-95 cursor-pointer"
              >
                <div className="bg-white rounded-full w-4 h-4 flex items-center justify-center">
                  <span className="text-[9px] text-[#8b5cf6] font-bold">▶</span>
                </div>
                Start Consultation
              </button>
              
              <button 
                id="btn-view-med-history"
                onClick={() => {
                  if (connectedPassport) {
                    toast.success("Medical History Loaded!");
                  } else {
                    toast.info("Connecting a Pet Passport first will allow complete history syncing!");
                    // Trigger passport overlay
                    setSelectedPassportId(null);
                    setPassportOverlayOpen(true);
                    fetchUserPassports();
                  }
                }}
                className="w-full bg-white text-gray-600 py-[16px] rounded-2xl font-bold text-[15px] border border-gray-200 hover:bg-gray-50 transition transform active:scale-95 cursor-pointer shadow-sm"
              >
                View Medical History
              </button>
            </div>
          )}

          {/* Phase 2: Touch slider completed swipe indicator */}
          {phase === 2 && (
            <div 
              id="swipeContainer" 
              ref={swipeContainerRef}
              className="relative w-full h-[64px] bg-white bg-opacity-80 backdrop-blur-md rounded-full border border-purple-100 p-1.5 flex items-center overflow-hidden shadow-premiumSwipe animate-fade-in"
            >
              {/* Shimmer layout bg styling */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 shimmer-track opacity-20 pointer-events-none" />

              {/* Central instruction phrase - vanishes as slider progresses */}
              <div 
                id="swipeText" 
                className="absolute inset-0 flex items-center justify-center pointer-events-none transition-all duration-150 z-0 pl-10"
                style={{
                  opacity: 1 - swipeProgress * 1.6,
                  transform: `scale(${1 - swipeProgress * 0.15})`
                }}
              >
                <span className="text-[11px] font-extrabold text-[#9d4edd] tracking-wider uppercase whitespace-nowrap select-none">
                  Swipe to Complete Consultation
                </span>
              </div>
              
              {/* Dynamic filled progress mask */}
              <div 
                id="swipeFill" 
                className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-l-full opacity-10 pointer-events-none z-0" 
                style={{ width: `${swipeProgress * 100}%` }}
              />

              {/* Custom draggable circular swipe handle trigger button */}
              <div 
                id="swipeHandle" 
                onMouseDown={handleSwipeStart}
                onTouchStart={handleSwipeStart}
                onMouseMove={handleSwipeMove}
                onTouchMove={handleSwipeMove}
                onMouseLeave={handleSwipeEnd}
                onMouseUp={handleSwipeEnd}
                onTouchEnd={handleSwipeEnd}
                className="w-[52px] h-[52px] bg-gradient-to-br from-[#b166fc] via-[#9d4edd] to-[#7b2cbf] rounded-full flex items-center justify-center text-white text-[15px] shadow-handleShadow cursor-grab active:cursor-grabbing z-10 border border-white border-opacity-30 transition-transform duration-75"
                style={{
                  transform: swipeContainerRef.current 
                    ? `translateX(${swipeProgress * (swipeContainerRef.current.clientWidth - 64)}px)` 
                    : "translateX(0px)"
                }}
              >
                <div className="flex gap-0.5 items-center justify-center">
                  <span className="font-extrabold text-sm text-white">»</span>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* ═══════════════ SELECT PET PASSPORT BOTTOM SHEET OVERLAY ═══════════════ */}
      {passportOverlayOpen && (
        <div 
          id="passport-select-overlay"
          className="fixed inset-0 z-50 bg-[#000000]/45 backdrop-blur-[3px] flex items-end md:items-center justify-center transition-all duration-300"
          onClick={() => setPassportOverlayOpen(false)}
        >
          <div 
            id="passport-bottom-sheet"
            className="w-full max-w-[500px] bg-white rounded-t-[2.2rem] md:rounded-[2.5rem] rounded-b-none md:rounded-b-[2.5rem] p-5 md:p-7 pb-6 md:pb-8 shadow-2xl mx-auto flex flex-col select-none relative animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Decorative pull grab handle */}
            <div className="w-14 h-1.5 bg-[#e2e8f0] rounded-full mx-auto mb-5 md:mb-6" />

            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl md:text-[26px] font-extrabold text-[#0c1322] tracking-tight leading-none text-gray-850">Select Pet Passport</h2>
              <button 
                id="btn-close-passport-sheet"
                onClick={() => setPassportOverlayOpen(false)}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5 md:w-6 md:h-6" strokeWidth={2.5} />
              </button>
            </div>
            <p className="text-xs md:text-[14px] text-[#8b92a5] font-bold mb-4 pointer-events-none">Choose which passport to sync with this visit</p>

            <div className="flex-1 overflow-y-auto max-h-[300px] space-y-3 pr-1 py-1">
              {loadingUserPassports ? (
                <div id="loader-passports" className="flex flex-col items-center justify-center py-10 gap-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ec4899]"></div>
                  <p className="text-xs text-gray-500 font-medium">Fetching passports...</p>
                </div>
              ) : userPassports.length === 0 ? (
                <div id="no-passports-display" className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="w-12 h-12 rounded-xl bg-pink-50 flex items-center justify-center text-[#ec4899] mb-3">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-gray-850">No passports found</p>
                  <p className="text-xs text-gray-400 max-w-[240px] mt-1">This user hasn't created a Pet Passport yet.</p>
                </div>
              ) : (
                userPassports.map((passport) => {
                  const isSelected = selectedPassportId === passport.id;
                  const pId = (passport.passport_id || `SRV-${passport.id?.slice(0, 6).toUpperCase()}`).replace(/^#/, "");
                  const pName = passport.pet_name || "Unnamed Pet";
                  const pBreed = passport.breed || "Breed";
                  const pAge = getFormattedPetAge(passport.approx_years, passport.approx_months, passport.dob);
                  const isCat = passport.species?.toLowerCase() === "cat";
                  const gender = passport.gender || "Male";

                  return (
                    <div 
                      key={passport.id}
                      id={`passport-row-${passport.id}`}
                      onClick={() => setSelectedPassportId(passport.id)}
                      className={`border-2 rounded-[20px] p-3 md:p-4 cursor-pointer flex items-center gap-3 md:gap-4 transition-all duration-200 ${
                        isSelected 
                          ? "border-[#f9a8d4] bg-[#fff5f8]" 
                          : "border-gray-250 bg-white hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {/* Pet photo avatar */}
                      <div className="w-[56px] h-[56px] rounded-[14px] overflow-hidden shrink-0 border border-gray-100 flex items-center justify-center bg-gray-50">
                        {passport.photo_url ? (
                          <img 
                            src={passport.photo_url} 
                            alt={pName} 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className={`w-full h-full flex items-center justify-center ${
                            isCat ? "bg-amber-50 text-amber-500" : "bg-orange-50 text-orange-500"
                          }`}>
                            <Activity className="w-5 h-5" />
                          </div>
                        )}
                      </div>

                      {/* Middle description fields */}
                      <div className="flex-1 min-w-0">
                        <p className="font-extrabold text-[#0c1322] text-sm md:text-lg leading-tight mb-1">{pName}</p>
                        
                        <div className="flex flex-wrap items-center text-[10px] md:text-xs text-gray-400 font-semibold gap-1 px-0.5">
                          <FileText className="w-3 h-3 text-[#ec4899] shrink-0" />
                          <span className="truncate">{pId}</span>
                          <span className="text-gray-300 mx-1 font-extrabold">·</span>
                          <PawPrint className="w-3 h-3 text-[#ec4899] shrink-0" />
                          <span className="truncate">{pBreed}</span>
                        </div>

                        {/* Attribute label tag chips */}
                        <div className="flex items-center gap-1.5 mt-1.5">
                          {gender.toLowerCase() === "female" ? (
                            <span className="bg-[#fff1f2] text-[#f43f5e] px-2 py-0.5 text-[10px] font-bold rounded-md flex items-center gap-1">
                              <span className="text-xs">♀</span> Female
                            </span>
                          ) : (
                            <span className="bg-[#eff6ff] text-[#3b82f6] px-2 py-0.5 text-[10px] font-bold rounded-md flex items-center gap-1">
                              <span className="text-xs">♂</span> Male
                            </span>
                          )}

                          <span className="bg-[#f0fdf4] text-[#16a34a] px-2 py-0.5 text-[10px] font-bold rounded-md flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-[#16a34a]" /> {pAge}
                          </span>
                        </div>
                      </div>

                      {/* Check indicator circle on right */}
                      <div className="shrink-0 ml-1">
                        {isSelected ? (
                          <div className="w-[20px] h-[20px] rounded-full border-2 border-[#ec4899] flex items-center justify-center bg-white">
                            <div className="w-[10px] h-[10px] rounded-full bg-[#ec4899]" />
                          </div>
                        ) : (
                          <div className="w-[20px] h-[20px] rounded-full border-2 border-slate-200 bg-white" />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex items-center gap-2 mt-4 mb-4 px-1">
              <Info className="w-5 h-5 text-[#ec4899] shrink-0" />
              <span className="text-[13px] text-gray-500 font-bold">Select a passport to continue</span>
            </div>

            <button 
              id="btn-confirm-connect-passport"
              onClick={handleConfirmConnect}
              disabled={!selectedPassportId}
              className={`w-full py-3.5 text-[16px] font-extrabold text-white rounded-[20px] shadow-sm transition-all duration-200 ${
                selectedPassportId 
                  ? "bg-[#eb5e99] hover:bg-[#e14f8a] active:scale-[0.98]" 
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              Connect Passport
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default ClinicVisitDetails;
