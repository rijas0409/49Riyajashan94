import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Custom styles to achieve exactly the same styling and grid textures as homie.html
const styleContent = `
  .no-scrollbar::-webkit-scrollbar { display: none; }
  .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  .map-bg {
      background-color: #f0f2f5;
      background-image: linear-gradient(#e5e7eb 2px, transparent 2px), linear-gradient(90deg, #e5e7eb 2px, transparent 2px);
      background-size: 40px 40px;
  }
  @keyframes subtleShimmer {
      0%, 100% { opacity: 0.15; }
      50% { opacity: 0.35; }
  }
  .shimmer-track {
      animation: subtleShimmer 3s infinite ease-in-out;
  }
`;

const getShortBookingId = (id: string | undefined): string => {
  if (!id) return "...";
  const clean = id.replace(/[-]/g, "");
  if (clean.length >= 9) {
    const slice = clean.slice(0, 9);
    return `${slice.slice(0, 4)}-${slice.slice(4, 7)}-${slice.slice(7, 9)}`;
  }
  return id;
};

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

const HomeVisitDetails = () => {
  const navigate = useNavigate();
  const { appointmentId } = useParams();
  const location = useLocation();

  // Retrieve state or use fallback mock data, then fetch real-time from DB
  const stateVisit = location.state?.visit;
  const realDbId = location.state?.realAppointmentId || stateVisit?.id || appointmentId;

  // Real-time states
  const [appointment, setAppointment] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userAddress, setUserAddress] = useState<any>(null);
  const [petPassport, setPetPassport] = useState<any>(null);
  const [medicalLog, setMedicalLog] = useState<any>(null);
  const [healthRecords, setHealthRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Interaction/Mutation states
  const [chiefComplaint, setChiefComplaint] = useState("Kiro is fainting I need emergency help.");
  const [isEditingReason, setIsEditingReason] = useState(false);
  const [reasonInput, setReasonInput] = useState("");
  const [isSwipeMode, setIsSwipeMode] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  
  // Camera & Video Scanner States
  const [qrOverlayOpen, setQrOverlayOpen] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Swipe slider Ref & Drag metrics
  const swipeContainerRef = useRef<HTMLDivElement | null>(null);
  const swipeHandleRef = useRef<HTMLDivElement | null>(null);
  const swipeFillRef = useRef<HTMLDivElement | null>(null);
  const swipeTextRef = useRef<HTMLDivElement | null>(null);

  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);

  // Camera access handler for QR Overlay
  useEffect(() => {
    let active = true;
    let autoScanTimeout: NodeJS.Timeout | null = null;

    const startCamera = async () => {
      try {
        setCameraError(false);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" }
        });
        if (!active) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(e => console.error("Video play failed", e));
        }

        // Apply torch state if camera supports it and flash is on
        const track = stream.getVideoTracks()[0];
        if (track) {
          try {
            await track.applyConstraints({
              advanced: [{ torch: flashOn }]
            } as any);
          } catch (e) {
            console.log("Torch constraint fail", e);
          }
        }

        // Simulated QR Auto scan completion after 3.2 seconds
        autoScanTimeout = setTimeout(() => {
          if (active) {
            handleSimulateQRSuccess();
          }
        }, 3200);

      } catch (err) {
        console.error("Camera access failed:", err);
        setCameraError(true);
      }
    };

    if (qrOverlayOpen) {
      startCamera();
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }

    return () => {
      active = false;
      if (autoScanTimeout) clearTimeout(autoScanTimeout);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, [qrOverlayOpen, flashOn]);

  // Handle flashOn changes with media stream constraints
  useEffect(() => {
    if (streamRef.current) {
      const track = streamRef.current.getVideoTracks()[0];
      if (track) {
        try {
          track.applyConstraints({
            advanced: [{ torch: flashOn }]
          } as any);
        } catch (e) {
          console.log("Torch toggle fail:", e);
        }
      }
    }
  }, [flashOn]);

  const handleSimulateQRSuccess = () => {
    setQrOverlayOpen(false);
    toast.success("Passport successfully verified via QR scan!");
  };

  // 1. Fetch live database values for the appointment & associated records
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        if (!realDbId) {
          return;
        }

        // Fetch appointment details
        const targetId = realDbId;
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(targetId || "");

        let apptQuery = supabase.from("vet_appointments").select("*");
        if (isUUID) {
          apptQuery = apptQuery.eq("id", targetId);
        } else {
          // If short ID was passed, convert or query appropriately
          // Usually we can check if it's the id column or query all and filter client side
        }

        const { data: appointmentsList, error: apptErr } = await apptQuery;

        if (apptErr) {
          console.error("Error fetching home appointment:", apptErr);
        }

        let appt = null;
        if (appointmentsList && appointmentsList.length > 0) {
          if (!isUUID) {
            // Find manually matching short ID
            appt = appointmentsList.find(a => getShortBookingId(a.id) === targetId) || appointmentsList[0];
          } else {
            appt = appointmentsList[0];
          }
        }

        if (appt) {
          setAppointment(appt);
          
          if (appt.status === "in_progress") {
            setIsSwipeMode(true);
          } else if (appt.status === "completed") {
            setIsCompleted(true);
          }

          // Format chief complaint from the appointment consultation_notes / JSON
          if (appt.consultation_notes) {
            try {
              const notesParsed = JSON.parse(appt.consultation_notes);
              // If it has a specific complaint structure, or else treatment
              setChiefComplaint(notesParsed.chiefComplaint || notesParsed.reason || appt.consultation_notes);
              setReasonInput(notesParsed.chiefComplaint || notesParsed.reason || appt.consultation_notes);
            } catch (e) {
              setChiefComplaint(appt.consultation_notes);
              setReasonInput(appt.consultation_notes);
            }
          } else {
            setChiefComplaint("General checkup & routine home consultation request.");
            setReasonInput("General checkup & routine home consultation request.");
          }

          // Fetch the user's profile
          if (appt.user_id) {
            const { data: prof } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", appt.user_id)
              .maybeSingle();
            if (prof) setUserProfile(prof);

            // Fetch the user's addresses
            const { data: addrs } = await supabase
              .from("addresses")
              .select("*")
              .eq("user_id", appt.user_id);
            if (addrs && addrs.length > 0) {
              const defAddr = addrs.find(a => a.is_default) || addrs[0];
              setUserAddress(defAddr);
            }

            // Fetch the user's pet passports
            const { data: passports } = await supabase
              .from("pet_passports")
              .select("*")
              .eq("user_id", appt.user_id);
            
            if (passports && passports.length > 0) {
              // Try to find matching passport by pet name
              const matchedPassport = passports.find(p => p.pet_name?.toLowerCase() === appt.pet_name?.toLowerCase()) || passports[0];
              setPetPassport(matchedPassport);

              // Fetch medical log & health records for this passport
              const { data: medLog } = await supabase
                .from("pet_medical_logs")
                .select("*")
                .eq("pet_passport_id", matchedPassport.id)
                .maybeSingle();
              if (medLog) setMedicalLog(medLog);

              const { data: docs } = await supabase
                .from("pet_health_records_documents")
                .select("*")
                .eq("pet_passport_id", matchedPassport.id)
                .order("created_at", { ascending: false });
              if (docs) setHealthRecords(docs);
            }
          }
        }

        setLoading(false);
      } catch (e) {
        console.error("Error loading home visit details:", e);
        setLoading(false);
      }
    };

    fetchAllData();
  }, [realDbId]);

  // Handle saving the modified Chief Complaint back to supabase DB
  const handleSaveReason = async () => {
    if (!reasonInput.trim()) {
      toast.error("Please enter a valid complaint reason.");
      return;
    }
    try {
      const appId = appointment?.id || realDbId;
      if (appId && appId !== "HV-123") {
        // Fetch current consultation_notes to preserve payment_id or details
        const { data: currentAppt } = await supabase
          .from("vet_appointments")
          .select("consultation_notes")
          .eq("id", appId)
          .single();

        let updatedNotes = reasonInput;
        if (currentAppt?.consultation_notes) {
          try {
            const notesParsed = JSON.parse(currentAppt.consultation_notes);
            notesParsed.chiefComplaint = reasonInput;
            notesParsed.reason = reasonInput;
            updatedNotes = JSON.stringify(notesParsed);
          } catch (e) {
            // It's a plain string, let's keep it as is or write JSON
          }
        }

        const { error } = await supabase
          .from("vet_appointments")
          .update({ consultation_notes: updatedNotes })
          .eq("id", appId);

        if (error) throw error;
      }
      setChiefComplaint(reasonInput);
      setIsEditingReason(false);
      toast.success("Chief complaint updated successfully!");
    } catch (e) {
      console.error(e);
      toast.error("Failed to update chief complaint.");
    }
  };

  // Start Consultation (updates status in supabase to 'in_progress' and opens swipe layout)
  const handleStartConsultation = async () => {
    try {
      const appId = appointment?.id || realDbId;
      if (appId && appId !== "HV-123") {
        await supabase
          .from("vet_appointments")
          .update({ status: "in_progress" })
          .eq("id", appId);
      }
      setIsSwipeMode(true);
      toast.success("Consultation started! Swipe layout activated.");
    } catch (e) {
      console.error(e);
      toast.error("Failed to start consultation.");
    }
  };

  // Complete Consultation via Slider Swipe (updates status in supabase to 'completed' and navigates back)
  const handleCompleteConsultation = async () => {
    try {
      const appId = appointment?.id || realDbId;
      if (appId && appId !== "HV-123") {
        await supabase
          .from("vet_appointments")
          .update({ status: "completed" })
          .eq("id", appId);
      }
      setIsCompleted(true);
      toast.success("Consultation Completed Successfully!");
      setTimeout(() => {
        navigate("/vet/schedule", { replace: true });
      }, 500);
    } catch (e) {
      console.error(e);
      toast.error("Failed to mark consultation complete.");
    }
  };

  // Drag and Drop Drag handlers for high-fidelity swipe complete
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (isCompleted) return;
    isDraggingRef.current = true;
    startXRef.current = "touches" in e ? e.touches[0].clientX : e.clientX;
    
    if (swipeHandleRef.current) {
      swipeHandleRef.current.style.transition = "none";
    }
  };

  const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDraggingRef.current) return;
    const currentX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const deltaX = currentX - startXRef.current;

    const handle = swipeHandleRef.current;
    const container = swipeContainerRef.current;
    const fill = swipeFillRef.current;
    const text = swipeTextRef.current;

    if (!handle || !container) return;

    const maxTrackWidth = container.clientWidth - handle.clientWidth - 12;
    const finalX = Math.max(0, Math.min(deltaX, maxTrackWidth));

    handle.style.transform = `translateX(${finalX}px)`;
    if (fill) fill.style.width = `${finalX + 26}px`;

    const progress = finalX / maxTrackWidth;
    if (text) {
      text.style.opacity = `${Math.max(0, 1 - progress * 1.6)}`;
      text.style.transform = `scale(${1 - progress * 0.15})`;
    }
  };

  const handleDragEnd = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;

    const handle = swipeHandleRef.current;
    const container = swipeContainerRef.current;
    const fill = swipeFillRef.current;
    const text = swipeTextRef.current;

    if (!handle || !container) return;

    const maxTrackWidth = container.clientWidth - handle.clientWidth - 12;
    // Extract actual numeric transform translation
    const style = window.getComputedStyle(handle);
    const matrix = new WebKitCSSMatrix(style.transform);
    const currentTransformX = matrix.m41;

    // Reset or complete if dragged past 85% width
    if (currentTransformX >= maxTrackWidth * 0.85) {
      handle.style.transition = "all 0.2s ease-out";
      handle.style.transform = `translateX(${maxTrackWidth}px)`;
      if (fill) fill.style.width = "100%";
      if (text) text.style.opacity = "0";

      setTimeout(() => {
        handleCompleteConsultation();
      }, 150);
    } else {
      handle.style.transition = "transform 0.3s cubic-bezier(0.19, 1, 0.22, 1)";
      handle.style.transform = "translateX(0px)";
      if (fill) fill.style.width = "0px";
      if (text) {
        text.style.opacity = "1";
        text.style.transform = "scale(1)";
      }
    }
  };

  // Add global event listeners to catch touch/mouse ends perfectly even off drag element
  useEffect(() => {
    const handleGlobalMove = (e: MouseEvent | TouchEvent) => {
      handleDragMove(e as any);
    };
    const handleGlobalEnd = () => {
      handleDragEnd();
    };

    window.addEventListener("mousemove", handleGlobalMove);
    window.addEventListener("mouseup", handleGlobalEnd);
    window.addEventListener("touchmove", handleGlobalMove);
    window.addEventListener("touchend", handleGlobalEnd);

    return () => {
      window.removeEventListener("mousemove", handleGlobalMove);
      window.removeEventListener("mouseup", handleGlobalEnd);
      window.removeEventListener("touchmove", handleGlobalMove);
      window.removeEventListener("touchend", handleGlobalEnd);
    };
  }, [appointment, isCompleted]);

  // Derived real-time visual values
  const petName = appointment?.pet_name || stateVisit?.petName || "Bella";
  const breedStr = appointment ? `${appointment.pet_breed || "Golden Retriever"}` : (stateVisit?.petBreed || "Golden Retriever");
  const ageStr = petPassport ? getFormattedPetAge(petPassport.approx_years, petPassport.approx_months, petPassport.dob) : "3 Years";
  const specBreedDisplay = petPassport ? `${petPassport.breed || "Breed"}` : breedStr;

  const resolvedPhoto = petPassport?.photo_url || appointment?.image || stateVisit?.image || "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=200&h=200";
  const addressDisplayStr = userAddress ? `${userAddress.address_line}, ${userAddress.city} - ${userAddress.pincode}` : (stateVisit?.address || "124 Maple Street, Apt 4B");
  const scheduledTimeStr = appointment ? `Today, ${appointment.appointment_time || "11:30 AM"}` : (stateVisit?.time || "Today, 11:30 AM");
  const appointmentTypeStr = appointment ? appointment.appointment_type : "home";
  
  // Custom status badge label
  const appStatus = appointment?.status || "confirmed";
  const statusLabel = useMemo(() => {
    if (appStatus === "pending") return "Pending Confirmation";
    if (appStatus === "confirmed") return "Consultation Confirmed";
    if (appStatus === "in_progress") return "Consultation In-Progress";
    if (appStatus === "completed") return "Consultation Completed";
    return appStatus.toUpperCase();
  }, [appStatus]);

  return (
    <div className="bg-gray-200 flex justify-center antialiased select-none min-h-screen">
      <style dangerouslySetInnerHTML={{ __html: styleContent }} />

      {/* Main viewport frame styled exactly as mobile layout max-w-[400px] */}
      <div className="relative w-full max-w-[400px] bg-[#f6f7fb] h-screen overflow-hidden shadow-2xl sm:border sm:border-gray-300 sm:rounded-3xl flex flex-col">
        
        {/* Header */}
        <header className="flex justify-between items-center px-6 py-4 bg-white sm:rounded-t-3xl z-20 relative shrink-0 border-b border-gray-100">
          <button 
            onClick={() => navigate(-1)} 
            className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-50 border border-gray-100 text-gray-700 hover:bg-gray-100 transition"
          >
            <i className="fas fa-arrow-left text-[14px]"></i>
          </button>
          <h1 className="text-[16px] font-bold text-[#1a1f36]">Visit Details</h1>
          <button className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-50 border border-gray-100 text-gray-700 hover:bg-gray-100 transition">
            <i className="fas fa-ellipsis-vertical text-[14px]"></i>
          </button>
        </header>

        {/* Main Scrollable Content */}
        <main className="flex-1 overflow-y-auto pb-[180px] relative z-0 no-scrollbar">
          
          {/* Pet Profile Section */}
          <div className="flex flex-col items-center pt-3 pb-2">
            <div className="relative w-[100px] h-[100px]">
              <img 
                src={resolvedPhoto} 
                alt={petName} 
                className="w-full h-full object-cover rounded-full border-[3px] border-white shadow-sm"
              />
              <div className="absolute bottom-1 right-1 w-[20px] h-[20px] bg-[#22c55e] border-[3px] border-white rounded-full"></div>
            </div>
            <h2 className="text-[26px] font-bold text-[#1a1f36] mt-2 tracking-tight">{petName}</h2>
            <p className="text-[#8b92a5] font-medium text-[14px] mt-0.5">{specBreedDisplay} • {ageStr}</p>
            
            <div className="mt-2.5 bg-[#f3e8ff] text-[#9d4edd] px-3 py-1 rounded-full flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-[#9d4edd] rounded-full"></div>
              <span className="text-[10px] font-bold tracking-widest uppercase">{statusLabel}</span>
            </div>
          </div>

          {/* Navigation Card (Terrain) */}
          <div className="mx-5 mt-2 bg-white rounded-[20px] overflow-hidden shadow-[0_8px_25px_-8px_rgba(0,0,0,0.06)]">
            <div className="p-4 pb-3 flex justify-between items-center">
              <h3 className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">Navigation to Owner</h3>
              <span className="text-[11px] font-bold text-[#9d4edd] tracking-wide uppercase">2.4 Miles Away</span>
            </div>
            
            <div className="relative h-[160px] map-bg w-full border-t border-gray-100">
              <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                <path d="M 60,130 L 160,130 L 160,50 L 320,50" fill="none" stroke="#9d4edd" strokeWidth="3" strokeLinejoin="round"/>
              </svg>
              <div className="absolute bottom-[26px] left-[54px] w-3 h-3 bg-blue-500 border-[2px] border-white rounded-full shadow-md"></div>
              <div className="absolute top-[44px] right-[74px] w-3 h-3 bg-[#9d4edd] border-[2px] border-white rounded-full shadow-md"></div>
              <div className="absolute top-[20px] right-[45px] bg-[#9d4edd] text-white text-[9px] font-bold px-2 py-1 rounded-md shadow-md">
                Owner's Home
              </div>
              
              <button 
                onClick={() => {
                  window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressDisplayStr)}`, '_blank');
                }}
                className="absolute bottom-3 right-3 bg-gradient-to-r from-[#a855f7] to-[#8b5cf6] text-white px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-[0_15px_35px_-5px_rgba(157,78,221,0.3)] transition transform hover:scale-105 active:scale-95"
              >
                <i className="fas fa-location-arrow text-[11px]"></i>
                <span className="text-[12px] font-bold">Start Navigation</span>
              </button>
            </div>
          </div>

          {/* Reason For Visit Card */}
          <div className="mx-5 mt-4">
            <div className="flex justify-between items-center mb-2 px-0.5">
              <h2 className="text-[16px] font-bold text-[#1a1f36] tracking-tight">Reason for Visit</h2>
              <button 
                onClick={() => {
                  setReasonInput(chiefComplaint);
                  setIsEditingReason(true);
                }}
                className="text-pink-500 font-semibold text-[11px] flex items-center gap-1"
              >
                <i className="fas fa-edit text-[10px]"></i> Edit
              </button>
            </div>

            {isEditingReason ? (
              <div className="bg-white rounded-[20px] p-4 shadow-[0_8px_25px_-8px_rgba(0,0,0,0.06)] flex flex-col gap-3">
                <textarea 
                  value={reasonInput}
                  onChange={(e) => setReasonInput(e.target.value)}
                  className="w-full p-3 border border-gray-200 rounded-xl text-[13px] text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[80px]"
                />
                <div className="flex justify-end gap-2">
                  <button 
                    onClick={() => setIsEditingReason(false)}
                    className="px-3 py-1.5 border border-gray-200 rounded-full text-xs font-bold text-gray-500 hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSaveReason}
                    className="px-4 py-1.5 bg-[#9d4edd] rounded-full text-xs font-bold text-white shadow-md hover:bg-purple-700 transition"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-[20px] p-4 shadow-[0_8px_25px_-8px_rgba(0,0,0,0.06)] flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                  <i className="fas fa-exclamation-circle"></i>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 tracking-wider uppercase mb-0.5">Chief Complaint</p>
                  <p className="text-[13px] text-gray-700 font-medium leading-relaxed">{chiefComplaint}</p>
                </div>
              </div>
            )}
          </div>

          {/* Visit Information Card */}
          <div className="mx-5 mt-4 bg-white rounded-[20px] p-4 shadow-[0_8px_25px_-8px_rgba(0,0,0,0.06)]">
            <div className="flex justify-between items-center mb-3.5">
              <h3 className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">Visit Information</h3>
              <div className="w-5 h-5 rounded-full bg-[#9d4edd] flex items-center justify-center text-white text-[9px]">
                <i className="fas fa-info"></i>
              </div>
            </div>
            
            <div className="flex flex-col gap-3.5">
              {/* Visit Type */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-md shrink-0">
                  <i className="fas fa-house-chimney-medical"></i>
                </div>
                <div>
                  <p className="text-[11px] text-gray-400 font-medium">Visit Type</p>
                  <p className="text-[14px] text-[#1a1f36] font-bold mt-0.5 capitalize">{appointmentTypeStr} Visit</p>
                </div>
              </div>

              {/* Reason for Visit */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center text-md shrink-0">
                  <i className="fas fa-syringe"></i>
                </div>
                <div>
                  <p className="text-[11px] text-gray-400 font-medium">Reason for Visit</p>
                  <p className="text-[14px] text-[#1a1f36] font-bold mt-0.5">Home {appointment?.pet_type === "Cat" ? "Vaccination" : "Consultation"}</p>
                </div>
              </div>

              {/* Scheduled Time */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center text-md shrink-0">
                  <i className="fas fa-clock"></i>
                </div>
                <div>
                  <p class="text-[11px] text-gray-400 font-medium">Scheduled Time</p>
                  <p className="text-[14px] text-[#1a1f36] font-bold mt-0.5">
                    {scheduledTimeStr} <span className="text-[#9d4edd] font-medium">(Scheduled)</span>
                  </p>
                </div>
              </div>

              {/* Owner Address */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#f3e8ff] text-[#9d4edd] flex items-center justify-center text-md shrink-0">
                  <i className="fas fa-location-dot"></i>
                </div>
                <div>
                  <p className="text-[11px] text-gray-400 font-medium">Owner Address</p>
                  <p className="text-[14px] text-[#1a1f36] font-bold mt-0.5">{addressDisplayStr}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Clinical Overview Card */}
          <div className="mx-5 mt-4">
            <h2 className="text-[16px] font-bold text-[#1a1f36] mb-2 px-0.5 tracking-tight">Clinical Overview</h2>
            <div className="bg-white rounded-[20px] p-4 shadow-[0_8px_25px_-8px_rgba(0,0,0,0.06)] flex items-center gap-3.5">
              <img 
                src={resolvedPhoto} 
                alt={petName} 
                className="w-[54px] h-[54px] rounded-xl object-cover"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[15px] font-bold text-[#1a1f36]">{petName}</span>
                  <span className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase scale-90 origin-left">Active</span>
                </div>
                <p className="text-[13px] text-gray-700 font-semibold mt-0.5">
                  {specBreedDisplay} • {petPassport?.gender || "Female"}
                </p>
                <div className="flex items-center gap-3 text-[#8b92a5] text-[11px] mt-1 font-medium">
                  <span className="flex items-center gap-1"><i className="far fa-clock text-[10px]"></i> {ageStr}</span>
                  <span className="flex items-center gap-1"><i className="fas fa-weight-hanging text-[10px]"></i> {petPassport?.weight ? `${petPassport.weight} lbs` : "4.9 lbs"}</span>
                  <span className="flex items-center gap-1">
                    <i className="far fa-calendar text-[10px]"></i> {petPassport?.dob ? new Date(petPassport.dob).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Jun 29, 2024"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Pet Passport Components Heading */}
          <div className="mx-5 mt-5">
            <p className="text-[10px] font-bold text-gray-400 tracking-widest uppercase px-0.5">Pet Passport Details</p>
          </div>

          {/* Identification Card */}
          <div className="mx-5 mt-2 bg-white rounded-[20px] p-4 shadow-[0_8px_25px_-8px_rgba(0,0,0,0.06)]">
            <div className="flex items-center gap-1.5 mb-3.5">
              <div className="w-1 h-3.5 bg-pink-500 rounded-full"></div>
              <h4 className="text-[11px] font-bold text-[#1a1f36] tracking-wider uppercase">I. Identification</h4>
            </div>
            <div className="grid grid-cols-2 gap-y-3.5 gap-x-2">
              <div>
                <p className="text-[10px] text-[#8b92a5] font-bold uppercase tracking-wide">Pet Name</p>
                <p className="text-[13px] text-[#1a1f36] font-bold mt-0.5">{petName}</p>
              </div>
              <div>
                <p className="text-[10px] text-[#8b92a5] font-bold uppercase tracking-wide">Passport ID</p>
                <p className="text-[13px] text-pink-500 font-bold mt-0.5">
                  {petPassport?.passport_id || (petPassport?.id ? `SRV-${petPassport.id.slice(0, 7).toUpperCase()}` : "SRV-K25-AG8")}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-[#8b92a5] font-bold uppercase tracking-wide">Species / Gender</p>
                <p className="text-[13px] text-[#1a1f36] font-bold mt-0.5">
                  {petPassport?.species || "Cat"} • {petPassport?.gender || "Female"}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-[#8b92a5] font-bold uppercase tracking-wide">Breed</p>
                <p className="text-[13px] text-[#1a1f36] font-bold mt-0.5">{specBreedDisplay}</p>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] text-[#8b92a5] font-bold uppercase tracking-wide">Appearance / Distinguishing Marks</p>
                <p className="text-[13px] text-[#1a1f36] font-bold mt-0.5">{petPassport?.appearance || "Grey whitish, soft coat patterns"}</p>
              </div>
              <div>
                <p className="text-[10px] text-[#8b92a5] font-bold uppercase tracking-wide">Date of Birth</p>
                <p className="text-[13px] text-[#1a1f36] font-bold mt-0.5">
                  {petPassport?.dob ? new Date(petPassport.dob).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Jun 29, 2024"}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-[#8b92a5] font-bold uppercase tracking-wide">Age / Weight</p>
                <p className="text-[13px] text-[#1a1f36] font-bold mt-0.5">
                  {ageStr} • {petPassport?.weight ? `${petPassport.weight} lbs` : "4.9 lbs"}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-[#8b92a5] font-bold uppercase tracking-wide">Issue Date</p>
                <p className="text-[13px] text-[#1a1f36] font-bold mt-0.5">
                  {petPassport?.created_at ? new Date(petPassport.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Jun 13, 2026"}
                </p>
              </div>
            </div>
          </div>

          {/* Ownership & Legal Guardian Card */}
          <div className="mx-5 mt-3.5 bg-white rounded-[20px] p-4 shadow-[0_8px_25px_-8px_rgba(0,0,0,0.06)]">
            <div className="flex items-center gap-1.5 mb-3.5">
              <div className="w-1 h-3.5 bg-pink-500 rounded-full"></div>
              <h4 className="text-[11px] font-bold text-[#1a1f36] tracking-wider uppercase">II. Ownership & Legal Guardian</h4>
            </div>
            <div className="grid grid-cols-2 gap-y-3.5 gap-x-2">
              <div>
                <p className="text-[10px] text-[#8b92a5] font-bold uppercase tracking-wide">Owner Name</p>
                <p className="text-[13px] text-[#1a1f36] font-bold mt-0.5">
                  {petPassport?.owner_name || userProfile?.full_name || userProfile?.name || "Jari Pabla"}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-[#8b92a5] font-bold uppercase tracking-wide">Primary Phone</p>
                <p className="text-[13px] text-[#1a1f36] font-bold mt-0.5">
                  {petPassport?.primary_phone || userProfile?.phone || "8349153416"}
                </p>
              </div>
              <div>
                <p class="text-[10px] text-[#8b92a5] font-bold uppercase tracking-wide">Emergency Contact</p>
                <p className="text-[13px] text-[#1a1f36] font-bold mt-0.5">
                  {petPassport?.emergency_contact_name || "Riya (Wife)"}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-[#8b92a5] font-bold uppercase tracking-wide">Emergency Phone</p>
                <p className="text-[13px] text-[#1a1f36] font-bold mt-0.5">
                  {petPassport?.emergency_phone || "8349153416"}
                </p>
              </div>
            </div>
          </div>

          {/* Clinical Notes & Allergies Card */}
          <div className="mx-5 mt-3.5 bg-white rounded-[20px] p-4 shadow-[0_8px_25px_-8px_rgba(0,0,0,0.06)]">
            <div className="flex items-center gap-1.5 mb-3.5">
              <div className="w-1 h-3.5 bg-pink-500 rounded-full"></div>
              <h4 className="text-[11px] font-bold text-[#1a1f36] tracking-wider uppercase">III. Clinical Notes & Allergies</h4>
            </div>
            <div className="grid grid-cols-2 gap-y-3.5 gap-x-2">
              <div className="col-span-2">
                <p className="text-[10px] text-[#8b92a5] font-bold uppercase tracking-wide">Known Allergies</p>
                <p className="text-[13px] text-red-500 font-bold mt-0.5">
                  {medicalLog?.known_allergies || "Pollen / environmental allergens"}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-[#8b92a5] font-bold uppercase tracking-wide">Last Veterinary Visit</p>
                <p className="text-[13px] text-[#1a1f36] font-bold mt-0.5">
                  {medicalLog?.last_veterinary_visit ? new Date(medicalLog.last_veterinary_visit).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Jun 13, 2026"}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-[#8b92a5] font-bold uppercase tracking-wide">Registered Conditions</p>
                <p className="text-[13px] text-[#1a1f36] font-bold mt-0.5">None registered</p>
              </div>
            </div>
          </div>

          {/* Health Records Section */}
          <div className="mx-5 mt-4">
            <div className="flex justify-between items-center mb-2 px-0.5">
              <h3 className="text-[11px] font-bold text-gray-400 tracking-widest uppercase">Health Records</h3>
              <button className="text-pink-500 font-bold text-[11px] hover:underline">View All</button>
            </div>
            <div className="flex flex-col gap-2">
              {healthRecords.length > 0 ? (
                healthRecords.map((doc, idx) => (
                  <div key={doc.id || idx} className="bg-white rounded-[16px] p-3.5 shadow-[0_8px_25px_-8px_rgba(0,0,0,0.06)] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-1 h-8 bg-emerald-500 rounded-full"></div>
                      <div>
                        <p className="text-[13px] text-[#1a1f36] font-bold">{doc.document_type || "Vaccination"}</p>
                        <p className="text-[11px] text-[#8b92a5] font-medium">{doc.notes || "Clinical document record"}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-[#8b92a5] uppercase">
                      {doc.created_at ? new Date(doc.created_at).toLocaleDateString("en-US", { day: 'numeric', month: 'short', year: 'numeric' }) : "13 Jun 2026"}
                    </span>
                  </div>
                ))
              ) : (
                <>
                  <div className="bg-white rounded-[16px] p-3.5 shadow-[0_8px_25px_-8px_rgba(0,0,0,0.06)] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-1 h-8 bg-emerald-500 rounded-full"></div>
                      <div>
                        <p className="text-[13px] text-[#1a1f36] font-bold">Vaccination</p>
                        <p className="text-[11px] text-[#8b92a5] font-medium">Clinical document record</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-[#8b92a5] uppercase">13 Jun 2026</span>
                  </div>
                  <div className="bg-white rounded-[16px] p-3.5 shadow-[0_8px_25px_-8px_rgba(0,0,0,0.06)] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-1 h-8 bg-emerald-500 rounded-full"></div>
                      <div>
                        <p className="text-[13px] text-[#1a1f36] font-bold">Vaccination</p>
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
          <div className="mx-5 mt-4 bg-white rounded-[20px] p-4 shadow-[0_8px_25px_-8px_rgba(0,0,0,0.06)]">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">Owner Information</h3>
              <a 
                href={`tel:${petPassport?.primary_phone || userProfile?.phone || "8349153416"}`}
                className="w-7 h-7 rounded-full bg-[#f3e8ff] flex items-center justify-center text-[#9d4edd] text-[11px] cursor-pointer"
              >
                <i className="fas fa-phone"></i>
              </a>
            </div>
            
            <div className="flex items-center gap-3">
              <img 
                src={userProfile?.profile_photo || "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100&h=100"} 
                alt="Owner" 
                className="w-[45px] h-[45px] rounded-full object-cover"
              />
              <div>
                <p className="text-[15px] text-[#1a1f36] font-bold">
                  {userProfile?.full_name || userProfile?.name || "Mark Thompson"}
                </p>
                <p className="text-[13px] text-[#8b92a5] font-medium mt-0.5">
                  {userProfile?.phone || "+1 (555) 234-5678"}
                </p>
              </div>
            </div>
          </div>

          {/* Medical Background Card */}
          <div className="mx-5 mt-4 bg-white rounded-[20px] p-4 shadow-[0_8px_25px_-8px_rgba(0,0,0,0.06)] mb-8">
            <h3 className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-3">Medical Background</h3>
            
            <div className="flex flex-col gap-3">
              <div className="flex gap-2.5 items-start">
                <div className="mt-0.5 w-[16px] h-[16px] rounded-full bg-[#22c55e] text-white flex items-center justify-center text-[9px] shrink-0">
                  <i className="fas fa-check"></i>
                </div>
                <p className="text-[13px] text-gray-700 font-medium leading-snug">Last Deworming: 2 months ago (Up to date)</p>
              </div>
              
              <div className="flex gap-2.5 items-start">
                <div className="mt-0.5 w-[16px] h-[16px] rounded-full bg-[#22c55e] text-white flex items-center justify-center text-[9px] shrink-0">
                  <i className="fas fa-check"></i>
                </div>
                <p className="text-[13px] text-gray-700 font-medium leading-snug">
                  Vaccination Status: {medicalLog?.last_vaccination_date ? `Current (Last: ${new Date(medicalLog.last_vaccination_date).toLocaleDateString("en-US", { month: "short", year: "numeric" })})` : "All current"}
                </p>
              </div>
              
              <div className="flex gap-2.5 items-start">
                <div className="text-orange-500 text-[16px] shrink-0">
                  <i className="fas fa-triangle-exclamation"></i>
                </div>
                <p className="text-[13px] text-gray-700 font-medium leading-snug">
                  Allergies: {medicalLog?.known_allergies || "Penicillin-based antibiotics / pollen list"}
                </p>
              </div>
            </div>
          </div>
          
        </main>

        {/* Floating QR Squircle Button */}
        <button 
          onClick={() => {
            setQrOverlayOpen(true);
            toast.info("Opening scanner...");
          }}
          id="qrButton" 
          className="absolute bottom-[160px] right-6 w-[56px] h-[56px] bg-[#f3e8ff] text-[#9d4edd] rounded-[22px] shadow-[0_8px_20px_-4px_rgba(157,78,221,0.2)] flex items-center justify-center text-[22px] transition transform hover:scale-105 active:scale-95 z-20" 
          title="Scan QR"
        >
          <i className="fas fa-qrcode"></i>
        </button>

        {/* Dynamic Footer Action Container */}
        <div className="absolute bottom-0 left-0 w-full px-5 pb-6 pt-10 bg-gradient-to-t from-[#f6f7fb] via-[#f6f7fb] to-transparent z-10 sm:rounded-b-3xl">
          
          {/* Phase 1: Initial Action Buttons */}
          {!isSwipeMode && !isCompleted && (
            <div id="initialActions" className="flex flex-col gap-2.5">
              <button 
                onClick={handleStartConsultation}
                className="w-full bg-gradient-to-r from-[#a855f7] to-[#8b5cf6] text-white py-[16px] rounded-2xl font-bold text-[15px] flex justify-center items-center gap-2.5 shadow-[0_15px_35px_-5px_rgba(157,78,221,0.3)] transition transform active:scale-95 cursor-pointer"
              >
                <div className="bg-white rounded-full w-4 h-4 flex items-center justify-center">
                  <i className="fas fa-play text-[#8b5cf6] text-[8px] ml-[2px]"></i>
                </div>
                Start Consultation
              </button>
              <button 
                onClick={() => {
                  toast.success("Opening Digital Pet Medical History files...");
                }}
                className="w-full bg-white text-gray-600 py-[16px] rounded-2xl font-bold text-[15px] border border-gray-200 hover:bg-gray-50 transition transform active:scale-95 cursor-pointer shadow-sm"
              >
                View Medical History
              </button>
            </div>
          )}

          {/* Phase 2: Upgraded Premium Swipe Slider */}
          {(isSwipeMode && !isCompleted) && (
            <div 
              ref={swipeContainerRef}
              id="swipeContainer" 
              className="relative w-full h-[64px] bg-white bg-opacity-80 backdrop-blur-md rounded-full border border-purple-100 p-1.5 flex items-center overflow-hidden shadow-[0_10px_30px_-6px_rgba(157,78,221,0.25)]"
            >
              
              {/* Dynamic Shimmer Track Glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 shimmer-track opacity-20 pointer-events-none"></div>

              {/* Single Line Centered Text Element */}
              <div 
                ref={swipeTextRef}
                id="swipeText" 
                className="absolute inset-0 flex items-center justify-center pointer-events-none transition-all duration-150 z-0 pl-10"
              >
                <span className="text-[13px] font-extrabold text-[#9d4edd] tracking-wide uppercase whitespace-nowrap select-none">
                  Swipe to Complete Consultation
                </span>
              </div>
              
              {/* Slider Dynamic Background Progress Color Mask */}
              <div 
                ref={swipeFillRef}
                id="swipeFill" 
                className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-l-full opacity-10 pointer-events-none z-0" 
                style={{ width: "0px" }}
              ></div>

              {/* Round High-Fidelity Handle/Trigger Button */}
              <div 
                ref={swipeHandleRef}
                onMouseDown={handleDragStart}
                onTouchStart={handleDragStart}
                id="swipeHandle" 
                className="w-[52px] h-[52px] bg-gradient-to-br from-[#b166fc] via-[#9d4edd] to-[#7b2cbf] rounded-full flex items-center justify-center text-white text-[15px] shadow-[0_4px_15px_-2px_rgba(139,92,246,0.5)] cursor-grab active:cursor-grabbing transition-transform duration-75 ease-out z-10 border border-white border-opacity-30"
              >
                <i className="fas fa-angles-right"></i>
              </div>
            </div>
          )}

          {/* Optional Completed state indicator */}
          {isCompleted && (
            <div className="w-full bg-emerald-500 text-white text-center py-[16px] rounded-2xl font-bold text-[15px] flex justify-center items-center gap-2 shadow-md">
              <i className="fas fa-check-circle"></i>
              Consultation Done
            </div>
          )}

        </div>

      </div>

      {/* ═══════════════ QR SCANNER OVERLAY ═══════════════ */}
      {qrOverlayOpen && (
        <div id="qr-overlay" style={{ position: "fixed", inset: 0, zIndex: 100, background: "black", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <style>{`
            @keyframes scan-line-anim {
              0% { transform: translateY(0); }
              50% { transform: translateY(226px); }
              100% { transform: translateY(0); }
            }
          `}</style>
          
          {/* Video feed */}
          <video 
            id="qr-video" 
            ref={videoRef}
            autoPlay 
            playsInline 
            muted 
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: cameraError ? "none" : "block" }}
          ></video>
          {cameraError && (
             <div style={{ position: "absolute", inset: 0, width: "100%", height: "100%", background: "linear-gradient(45deg, #111827, #000)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <p style={{ color: "#ec4899", fontFamily: "monospace", fontSize: "12px", letterSpacing: "1px", marginBottom: "8px" }}>CAMERA UNAVAILABLE</p>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "10px" }}>Permission denied or device missing</p>
             </div>
          )}

          {/* Dark vignette corners */}
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, transparent 38%, rgba(0,0,0,0.72) 100%)", pointerEvents: "none" }}></div>

          {/* Top bar */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "52px 20px 16px", display: "flex", alignItems: "center", justifyBetween: "space-between", zIndex: 102 }}>
            <button 
              onClick={() => setQrOverlayOpen(false)} 
              style={{ width: "40px", height: "40px", borderRadius: "50%", background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
            >
              <svg width="20" height="20" fill="none" stroke="white" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"/></svg>
            </button>
            <span style={{ color: "white", fontWeight: 700, fontSize: "16px", letterSpacing: ".3px" }}>Scan Vet's QR Code</span>
            
            {/* Flashlight toggle */}
            <button 
              id="flash-btn" 
              onClick={() => setFlashOn(!flashOn)} 
              style={{ width: "40px", height: "40px", borderRadius: "50%", background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
            >
              {!flashOn ? (
                <svg id="flash-off-icon" width="20" height="20" fill="none" stroke="white" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/></svg>
              ) : (
                <svg id="flash-on-icon" width="20" height="20" fill="#facc15" stroke="#facc15" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/></svg>
              )}
            </button>
          </div>

          {/* Scan frame */}
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -56%)", width: "240px", height: "240px" }}>
            {/* Corners */}
            <div className="qr-frame-corner" style={{ position: "absolute", top: 0, left: 0, borderWidth: "4px 0 0 4px", borderColor: "#ec4899", borderStyle: "solid", borderRadius: "8px 0 0 0", width: "30px", height: "30px" }}></div>
            <div className="qr-frame-corner" style={{ position: "absolute", top: 0, right: 0, borderWidth: "4px 4px 0 0", borderColor: "#ec4899", borderStyle: "solid", borderRadius: "0 8px 0 0", width: "30px", height: "30px" }}></div>
            <div className="qr-frame-corner" style={{ position: "absolute", bottom: 0, left: 0, borderWidth: "0 0 4px 4px", borderColor: "#ec4899", borderStyle: "solid", borderRadius: "0 0 0 8px", width: "30px", height: "30px" }}></div>
            <div className="qr-frame-corner" style={{ position: "absolute", bottom: 0, right: 0, borderWidth: "0 4px 4px 0", borderColor: "#ec4899", borderStyle: "solid", borderRadius: "0 0 8px 0", width: "30px", height: "30px" }}></div>
            {/* Scan line */}
            <div id="scan-line" style={{ position: "absolute", left: "6px", right: "6px", height: "2px", background: "linear-gradient(90deg, transparent, #ec4899, transparent)", borderRadius: "2px", boxShadow: "0 0 8px #ec4899", animation: "scan-line-anim 3s infinite linear" }}></div>
          </div>

          {/* Bottom hint */}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "24px 24px 48px", textAlign: "center" }}>
            <p style={{ color: "rgba(255,255,255,0.9)", fontSize: "14px", fontWeight: 600, marginBottom: "6px" }}>Point camera at veterinarian's QR code</p>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px" }}>Hold steady — auto-detects within frame</p>

            {/* Demo: simulate success */}
            <button 
              onClick={handleSimulateQRSuccess} 
              style={{ marginTop: "20px", background: "rgba(236,72,153,0.25)", border: "1px solid rgba(236,72,153,0.5)", color: "white", fontSize: "12px", fontWeight: 700, padding: "10px 28px", borderRadius: "50px", cursor: "pointer", backdropFilter: "blur(8px)" }}
            >
              Simulate Scan ✓
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default HomeVisitDetails;
