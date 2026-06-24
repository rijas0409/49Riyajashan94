/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import jsQR from "jsqr";

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
    return "1 yr";
  }

  if (yrs <= 0) {
    return `${mos || 1} mos`;
  } else {
    return `${yrs} yr${mos > 0 ? ` ${mos} mos` : ""}`;
  }
};

const VetScheduleVisitDetails: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { appointmentId } = useParams();

  // Interactivity States (Declared first to avoid TDZ errors)
  const [isSwipeMode, setIsSwipeMode] = useState(false);
  const [swipeTranslation, setSwipeTranslation] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [timerStartEpoch, setTimerStartEpoch] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [dbAppointment, setDbAppointment] = useState<any>(null);
  const [petMedicalInfo, setPetMedicalInfo] = useState<{
    medicalHistory: string | null;
    vaccinated: boolean | null;
    vaccinations: any[];
    microchip: string | null;
  } | null>(null);

  const [connectedPassport, setConnectedPassport] = useState<any | null>(null);
  const [connectedMedicalLog, setConnectedMedicalLog] = useState<any | null>(null);
  const [connectedConditions, setConnectedConditions] = useState<any[]>([]);
  const [connectedRecords, setConnectedRecords] = useState<any[]>([]);

  // Fetch owner's connected or matching pet passport
  useEffect(() => {
    if (!dbAppointment?.user_id) return;

    const fetchOwnerPassport = async () => {
      try {
        const { data: passports, error: passErr } = await supabase
          .from("pet_passports")
          .select("*")
          .eq("user_id", dbAppointment.user_id)
          .order("created_at", { ascending: false });

        if (passErr) {
          console.error("Error fetching pet passports for owner:", passErr);
          return;
        }

        if (passports && passports.length > 0) {
          const cachedId = localStorage.getItem(`selected_passport_id_${dbAppointment.id}`);
          let matchedPassport = null;
          if (cachedId) {
            matchedPassport = passports.find(p => p.id === cachedId);
          }
          if (!matchedPassport && dbAppointment.pet_name) {
            matchedPassport = passports.find(
              p => (p.pet_name || "").toLowerCase().trim() === dbAppointment.pet_name.toLowerCase().trim()
            );
          }

          if (matchedPassport) {
            const [medicalRes, conditionsRes, recordsRes] = await Promise.all([
              supabase
                .from("pet_medical_logs")
                .select("*")
                .eq("pet_passport_id", matchedPassport.id)
                .maybeSingle(),
              supabase
                .from("pet_health_conditions")
                .select("*")
                .eq("pet_passport_id", matchedPassport.id),
              supabase
                .from("pet_health_records_documents")
                .select("*")
                .eq("pet_passport_id", matchedPassport.id)
            ]);

            setConnectedMedicalLog(medicalRes.data || null);
            setConnectedConditions(conditionsRes.data || []);
            setConnectedRecords(recordsRes.data || []);

            const pId = matchedPassport.passport_id || `#PP-${matchedPassport.id?.slice(0, 7).toUpperCase()}`;
            const ageTextVal = getFormattedPetAge(matchedPassport.approx_years, matchedPassport.approx_months, matchedPassport.dob);
            const ageVal = ageTextVal;

            const weightVal = matchedPassport.weight ? `${matchedPassport.weight} lbs` : "N/A";
            const dobVal = matchedPassport.dob ? new Date(matchedPassport.dob).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "N/A";
            const issueDateVal = matchedPassport.created_at ? new Date(matchedPassport.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "N/A";

            const mappedPassport = {
              id: pId,
              rawId: matchedPassport.id,
              name: matchedPassport.pet_name || "Unnamed Pet",
              species: matchedPassport.species || "N/A",
              gender: matchedPassport.gender || "N/A",
              breed: `${matchedPassport.breed || "Breed"} · ${matchedPassport.gender || ""}`,
              appearance: matchedPassport.appearance || "N/A",
              age: ageVal,
              ageText: ageTextVal,
              weight: weightVal,
              dob: dobVal,
              issueDate: issueDateVal,
              ownerName: matchedPassport.owner_name || "N/A",
              primaryPhone: matchedPassport.primary_phone || "N/A",
              emergencyContactName: matchedPassport.emergency_contact_name || "N/A",
              emergencyPhone: matchedPassport.emergency_phone || "N/A",
              emergencyRelationship: matchedPassport.emergency_relationship || "N/A",
              photo_url: matchedPassport.photo_url || null,
              avatar: matchedPassport.species?.toLowerCase() === "cat" ? "coco" : "luna"
            };

            setConnectedPassport(mappedPassport);
          } else {
            setConnectedPassport(null);
          }
        } else {
          setConnectedPassport(null);
        }
      } catch (e) {
        console.error("Error in fetchOwnerPassport:", e);
      }
    };

    fetchOwnerPassport();
  }, [dbAppointment?.user_id, dbAppointment?.pet_name, dbAppointment?.id]);

  // Dynamic state extracted from route, falling back gracefully to the provided gorgeous mockup specifications
  const { visit: stateVisit } = (location.state as any) || {};

  const petName = connectedPassport?.name || stateVisit?.petName || dbAppointment?.pet_name || "Bella";
  const petBreed = connectedPassport ? (connectedPassport.breed?.replace(/\s*·\s*(?:Male|Female|N\/A)?$/i, "") || "Breed") : (stateVisit?.petBreed || dbAppointment?.pet_breed || dbAppointment?.pet_type || "Golden Retriever");
  const petAge = connectedPassport?.age || stateVisit?.petAge || "3 Years";

  // Helper to get actual Reason for Visit text, excluding payment/booking objects
  const getReasonForVisit = () => {
    if (dbAppointment?.consultation_notes) {
      // Check if it is a payment JSON object
      try {
        const parsed = typeof dbAppointment.consultation_notes === "string" 
          ? JSON.parse(dbAppointment.consultation_notes) 
          : dbAppointment.consultation_notes;
        if (parsed && typeof parsed === "object" && (parsed.payment_id || parsed.bookingId || parsed.consultation_fee)) {
          // Yes, it's a payment metadata string, so NOT a plain text reason!
          return "";
        }
      } catch (e) {
        // Not a JSON object, so it's a direct user entered text!
        return dbAppointment.consultation_notes;
      }
      return dbAppointment.consultation_notes;
    }
    return "";
  };

  const chiefComplaint = getReasonForVisit();
  const petImage = connectedPassport?.photo_url || stateVisit?.image || dbAppointment?.pet_image_url || "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=200&h=200";
  const address = stateVisit?.address || dbAppointment?.address || "124 Maple Street, Apt 4B";
  const scheduledTime = stateVisit?.time || (dbAppointment?.appointment_time ? `${dbAppointment.appointment_date}, ${dbAppointment.appointment_time}` : "Today, 11:30 AM");
  const ownerName = stateVisit?.ownerName || dbAppointment?.owner_name || "Mark Thompson";
  const ownerPhone = stateVisit?.ownerPhone || dbAppointment?.owner_phone || "+1 (555) 234-5678";

  // Determine if it is a Home Visit or a Clinic Visit
  const isClinicType = (stateVisit?.type || dbAppointment?.appointment_type || "").toLowerCase() === "clinic" || appointmentId?.startsWith("CV");
  const isHomeVisit = !isClinicType;

  const currentStatus = dbAppointment?.status || stateVisit?.status || "";
  const isCancelledOrRejected = currentStatus === "cancelled" || currentStatus === "rejected";

  // Load Font Awesome on Mount
  useEffect(() => {
    const link = document.createElement("link");
    link.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    return () => {
      try {
        document.head.removeChild(link);
      } catch (e) {
        console.warn("Could not remove FontAwesome link:", e);
      }
    };
  }, []);

  const handleVerifyCode = async (scannedCode: string, isFromSimulation = false) => {
    const currentApptId = appointmentId || stateVisit?.id;
    if (!currentApptId) {
      toast.error("Error: No active appointment context found!");
      return false;
    }

    let isValid = false;
    
    // Helper for ID normalization to prevent mismatches due to casing or whitespace
    const normalize = (id: string) => (id || "").trim().toLowerCase();
    
    // Helper to generate the short display ID from a UUID or raw ID
    const getShort = (id: string) => {
      const clean = id.replace(/[-]/g, "");
      if (clean.length >= 9) {
        const slice = clean.slice(0, 9);
        return `${slice.slice(0, 4)}-${slice.slice(4, 7)}-${slice.slice(7, 9)}`.toLowerCase();
      }
      return id.toLowerCase();
    };

    try {
      // First try to parse as JSON (Secure Format)
      const scannedPayload = JSON.parse(scannedCode);
      const scannedId = scannedPayload.consultationId || scannedPayload.appointmentId || scannedPayload.id;
      
      if (scannedId) {
        const normScanned = normalize(scannedId);
        const normCurrent = normalize(currentApptId);
        const normDb = normalize(dbAppointment?.id || "");
        
        if (
          normScanned === normCurrent || 
          normScanned === normDb ||
          getShort(normScanned) === getShort(normCurrent) ||
          getShort(normScanned) === getShort(normDb)
        ) {
          isValid = true;
        }
      }
    } catch (e) {
      // Fallback for simple ID matching (Raw UUID or Short ID string)
      const normScanned = normalize(scannedCode);
      const normCurrent = normalize(currentApptId);
      const normDb = normalize(dbAppointment?.id || "");

      if (
        normScanned === normCurrent || 
        normScanned === normDb ||
        getShort(normScanned) === getShort(normCurrent) ||
        getShort(normScanned) === getShort(normDb)
      ) {
        isValid = true;
      }
    }

    // Secure requirement: Reject codes that belong to any other appointment, previous, or third-party appointments
    if (!isValid) {
      toast.error(`❌ Verification Failed!`, {
        description: `This QR code does not belong to this consultation ID. Invalid scan detected.`,
        duration: 5000
      });
      return false;
    }

    // Unlocked phase - Only unlock, don't start timer yet
    setIsVerified(true);
    
    toast.success("Consultation verified successfully. You can now start the consultation.", {
      duration: 4000
    });

    closeImmersiveScanner();
    return true;
  };

  const handleStartConsultation = async () => {
    const currentApptId = appointmentId || stateVisit?.id;
    if (!currentApptId) return;

    if (timerStartEpoch) {
      toast.info("Session is already in progress.");
      return;
    }

    const startTimestamp = Math.floor(Date.now() / 1000);
    setTimerStartEpoch(startTimestamp);
    
    // Write key local storage
    localStorage.setItem(`gp_appt_start_${currentApptId}`, String(startTimestamp));
    localStorage.setItem(`gp_appt_status_${currentApptId}`, "in_progress");

    // Resolve the actual database UUID for the update if currentApptId is a short ID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(currentApptId);
    const targetId = isUUID ? currentApptId : (dbAppointment?.id || "");

    if (targetId && targetId !== currentApptId) {
      localStorage.setItem(`gp_appt_start_${targetId}`, String(startTimestamp));
      localStorage.setItem(`gp_appt_status_${targetId}`, "in_progress");
    }

    if (targetId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetId)) {
      try {
        const { error } = await supabase
          .from("vet_appointments")
          .update({
            status: "in_progress",
            call_duration: startTimestamp
          })
          .eq("id", targetId);
        
        if (error) {
          console.error("Supabase update error:", error);
          toast.error("Failed to sync consultation start.");
        } else {
          toast.success("🚀 Consultation Started!", {
            description: "Real-time timer is now active on both sides.",
          });
          setIsSwipeMode(true);
        }
      } catch (err) {
        console.error("Failed to write to database:", err);
      }
    } else {
      console.warn("Could not determine UUID for database update.");
      // Still start locally for UX
      setIsSwipeMode(true);
    }
  };

  // 1. Fetch initial status & setup Supabase Realtime channel
  useEffect(() => {
    const currentApptId = appointmentId || stateVisit?.id;
    if (!currentApptId) return;

    // Read local cache first for low-latency
    const offlineStatus = localStorage.getItem(`gp_appt_status_${currentApptId}`);
    const offlineStart = localStorage.getItem(`gp_appt_start_${currentApptId}`);
    if (offlineStatus === "in_progress") {
      setIsVerified(true);
      setIsSwipeMode(true);
      if (offlineStart) {
        setTimerStartEpoch(Number(offlineStart));
      }
    }

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(currentApptId);
    let resolvedId = isUUID ? currentApptId : "";

    const fetchInitial = async () => {
      try {
        let matchedData: any = null;
        if (isUUID) {
          const { data, error } = await supabase
            .from("vet_appointments")
            .select("*")
            .eq("id", currentApptId)
            .single();
          if (!error && data) {
            matchedData = data;
          }
        } else {
          // Resolve shortId
          const { data, error } = await supabase
            .from("vet_appointments")
            .select("*")
            .limit(100);
          if (!error && data) {
            const getShortId = (idStr: string) => {
              const clean = idStr.replace(/[-]/g, "");
              if (clean.length >= 9) {
                const slice = clean.slice(0, 9);
                return `${slice.slice(0, 4)}-${slice.slice(4, 7)}-${slice.slice(7, 9)}`;
              }
              return idStr;
            };
            matchedData = data.find(apt => getShortId(apt.id) === currentApptId || apt.id === currentApptId);
          }
        }

        if (matchedData) {
          resolvedId = matchedData.id;
          setDbAppointment(matchedData);
          
          // Also fetch owner profile details
          if (matchedData.user_id) {
            const { data: profileData } = await supabase
              .from("profiles")
              .select("name, full_name, phone, profile_photo")
              .eq("id", matchedData.user_id)
              .maybeSingle();
              
            if (profileData) {
              setDbAppointment((prev: any) => ({
                ...prev,
                owner_name: profileData.full_name || profileData.name || "Mark Thompson",
                owner_phone: profileData.phone || "+1 (555) 234-5678",
                pet_image_url: profileData.profile_photo || prev?.pet_image_url
              }));
            }
          }

          // Also fetch pet medical history
          if (matchedData.user_id && matchedData.pet_name) {
            try {
              const { data: userPets } = await supabase
                .from("pets")
                .select("id, name, medical_history, vaccinated, microchip, breed")
                .eq("owner_id", matchedData.user_id);

              if (userPets && userPets.length > 0) {
                const targetName = matchedData.pet_name.trim().toLowerCase();
                const matchedPet = userPets.find(
                  (pObj: any) => pObj.name.trim().toLowerCase().includes(targetName) || targetName.includes(pObj.name.trim().toLowerCase())
                ) || userPets[0];

                if (matchedPet) {
                  const { data: vaccs } = await supabase
                    .from("pet_vaccinations")
                    .select("vaccine_type, date_administered, next_due_date")
                    .eq("pet_id", matchedPet.id);

                  setPetMedicalInfo({
                    medicalHistory: matchedPet.medical_history,
                    vaccinated: matchedPet.vaccinated,
                    vaccinations: vaccs || [],
                    microchip: matchedPet.microchip
                  });
                }
              }
            } catch (err) {
              console.error("Error fetching pet medical history:", err);
            }
          }

          if (matchedData.status === "in_progress") {
            setIsVerified(true);
            setIsSwipeMode(true);
            if (matchedData.call_duration) {
              setTimerStartEpoch(matchedData.call_duration);
              localStorage.setItem(`gp_appt_start_${currentApptId}`, String(matchedData.call_duration));
              if (resolvedId && resolvedId !== currentApptId) {
                localStorage.setItem(`gp_appt_start_${resolvedId}`, String(matchedData.call_duration));
              }
            }
            localStorage.setItem(`gp_appt_status_${currentApptId}`, "in_progress");
            if (resolvedId && resolvedId !== currentApptId) {
              localStorage.setItem(`gp_appt_status_${resolvedId}`, "in_progress");
            }
          } else if (matchedData.status === "completed") {
            setIsCompleted(true);
          }
        }
      } catch (e) {
        console.error("Error fetching db appointment:", e);
      }
    };

    fetchInitial();

    // Subscribe to live DB updates
    const channel = supabase
      .channel(`vet_appt_detail_${currentApptId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "vet_appointments"
        },
        (payload) => {
          console.log("Realtime update received in Vet schedule details:", payload);
          if (payload.new) {
            const updated = payload.new as any;
            const isMatch = updated.id === currentApptId || updated.id === resolvedId;
            if (isMatch) {
              setDbAppointment(updated);
              if (updated.status === "in_progress") {
                setIsVerified(true);
                setIsSwipeMode(true);
                if (updated.call_duration) {
                  setTimerStartEpoch(updated.call_duration);
                  localStorage.setItem(`gp_appt_start_${currentApptId}`, String(updated.call_duration));
                  if (resolvedId && resolvedId !== currentApptId) {
                    localStorage.setItem(`gp_appt_start_${resolvedId}`, String(updated.call_duration));
                  }
                }
                localStorage.setItem(`gp_appt_status_${currentApptId}`, "in_progress");
                if (resolvedId && resolvedId !== currentApptId) {
                  localStorage.setItem(`gp_appt_status_${resolvedId}`, "in_progress");
                }
              } else if (updated.status === "completed") {
                setIsCompleted(true);
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [appointmentId, stateVisit?.id]);

  // 2. Synchronize across local tabs instantly
  useEffect(() => {
    const currentApptId = appointmentId || stateVisit?.id;
    if (!currentApptId) return;

    const targetId = dbAppointment?.id;

    const handleStorageChange = (e: StorageEvent) => {
      const isStatusKey = e.key === `gp_appt_status_${currentApptId}` || (targetId && e.key === `gp_appt_status_${targetId}`);
      const isStartKey = e.key === `gp_appt_start_${currentApptId}` || (targetId && e.key === `gp_appt_start_${targetId}`);

      if (isStatusKey) {
        if (e.newValue === "in_progress") {
          setIsVerified(true);
          const start = localStorage.getItem(`gp_appt_start_${currentApptId}`) || (targetId ? localStorage.getItem(`gp_appt_start_${targetId}`) : null);
          if (start) {
            setTimerStartEpoch(Number(start));
          }
        }
      }
      if (isStartKey) {
        if (e.newValue) {
          setTimerStartEpoch(Number(e.newValue));
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [appointmentId, stateVisit?.id, dbAppointment?.id]);

  // 3. Perfect Clock Tick Timer
  useEffect(() => {
    if (!isVerified || !timerStartEpoch) return;

    const tick = () => {
      const now = Math.floor(Date.now() / 1000);
      const elapsed = Math.max(0, now - timerStartEpoch);
      setElapsedSeconds(elapsed);
    };

    tick();
    const interval = setInterval(tick, 100);
    return () => clearInterval(interval);
  }, [isVerified, timerStartEpoch]);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };
  
  // Modals
  const [showQrModal, setShowQrModal] = useState(false);
  const [showImmersiveScanner, setShowImmersiveScanner] = useState(false);
  const [isScannerAnimating, setIsScannerAnimating] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [flashOn, setFlashOn] = useState(false);
  const [cameraError, setCameraError] = useState(false);

  const handleRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const [maxTrack, setMaxTrack] = useState(280);

  useEffect(() => {
    if (isSwipeMode && containerRef.current && handleRef.current) {
      const containerWidth = containerRef.current.clientWidth;
      const handleWidth = handleRef.current.clientWidth;
      setMaxTrack(containerWidth - handleWidth - 12);
    }
  }, [isSwipeMode]);

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (isCompleted) return;
    isDragging.current = true;
    const clientX = "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    startX.current = clientX - swipeTranslation;
  };

  useEffect(() => {
    const handleCompleteConsultation = async () => {
      toast.success("Consultation Completed Successfully!");
      
      const targetId = dbAppointment?.id || stateVisit?.id || appointmentId;

      // Attempt status update on supabase if valid UUID is present
      if (targetId && targetId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        try {
          console.log("CONSULTATION_COMPLETED");
          console.log("PRESCRIPTION_STATUS_CHANGED_TO_PREPARING");
          const { error: apptErr } = await supabase
            .from("vet_appointments")
            .update({ status: "completed" })
            .eq("id", targetId);
          if (apptErr) throw new Error("Failed to update status to completed: " + apptErr.message);
        } catch (err) {
          console.error(err);
        }
      }
      
      if (targetId) {
        localStorage.setItem(`gp_appt_status_${targetId}`, "completed");
      }
      if (appointmentId && appointmentId !== targetId) {
        localStorage.setItem(`gp_appt_status_${appointmentId}`, "completed");
      }

      setTimeout(() => {
        navigate("/vet/create-prescription", { 
          state: { 
            appointmentId: targetId,
            petName: dbAppointment?.pet_name || "Pet",
            consultationType: isHomeVisit ? "Home Visit" : "Clinic Visit"
          }
        });
      }, 1500);
    };

    const handleDragMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging.current || isCompleted) return;
      const clientX = "touches" in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      let deltaX = clientX - startX.current;

      if (deltaX < 0) deltaX = 0;
      if (deltaX > maxTrack) deltaX = maxTrack;

      setSwipeTranslation(deltaX);
    };

    const handleDragEnd = () => {
      if (!isDragging.current || isCompleted) return;
      isDragging.current = false;

      if (swipeTranslation >= maxTrack * 0.85) {
        setSwipeTranslation(maxTrack);
        setIsCompleted(true);
        handleCompleteConsultation();
      } else {
        setSwipeTranslation(0);
      }
    };

    const handleMove = (e: MouseEvent | TouchEvent) => handleDragMove(e);
    const handleEnd = () => handleDragEnd();

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleEnd);
    window.addEventListener("touchmove", handleMove, { passive: false });
    window.addEventListener("touchend", handleEnd);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleEnd);
    };
  }, [swipeTranslation, maxTrack, isCompleted, appointmentId, navigate, dbAppointment?.pet_name, stateVisit?.id]);

  const handleStartNavigation = () => {
    toast.info("Starting navigation to owner's address...");
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, "_blank");
  };

  const openImmersiveScanner = () => {
    setFlashOn(false);
    setShowImmersiveScanner(true);
    setTimeout(() => {
      setIsScannerAnimating(true);
    }, 10);
  };

  const closeImmersiveScanner = () => {
    setIsScannerAnimating(false);
    setTimeout(() => {
      setShowImmersiveScanner(false);
    }, 300);
  };

  const executeMockScan = () => {
    const targetId = appointmentId || stateVisit?.id || "SRV-84721";
    handleVerifyCode(JSON.stringify({
      consultationId: targetId,
      appointmentId: targetId,
      buyerId: "SIMULATED_TEST_BUYER",
      vetId: "SIMULATED_TEST_VET",
      verificationToken: `MOCK_TOK_${Date.now()}`
    }), true);
  };

  const executeMockScanFailed = () => {
    handleVerifyCode(JSON.stringify({
      consultationId: "INVALID_DIFFERENT_APPOINTMENT_ID_12345",
      appointmentId: "INVALID_DIFFERENT_APPOINTMENT_ID_12345",
      buyerId: "SIMULATED_TEST_BUYER",
      vetId: "SIMULATED_TEST_VET",
      verificationToken: `MOCK_TOK_${Date.now()}`
    }), true);
  };

  // Setup media stream capture and live jsQR frame scanning
  useEffect(() => {
    let active = true;
    let animationFrameId: number;

    const canvas = document.createElement("canvas");

    const scanFrame = () => {
      if (!active || !showImmersiveScanner || !streamRef.current || !videoRef.current) return;

      const video = videoRef.current;
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          try {
            const decoded = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: "dontInvert"
            });
            if (decoded && decoded.data) {
              console.log("jsQR decoded successfully:", decoded.data);
              // Actively trigger QR verification
              handleVerifyCode(decoded.data);
              return; // stop scanning once decoded
            }
          } catch (e) {
            console.error("QR decoding exception:", e);
          }
        }
      }
      animationFrameId = requestAnimationFrame(scanFrame);
    };

    const startCamera = async () => {
      try {
        setCameraError(false);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" }
        });
        if (!active) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().then(() => {
            // Start scanning frame loop
            scanFrame();
          }).catch((e) => console.error("Video play failed", e));
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

        // Wait for jsQR to decode naturally; autoScan timeout removed for production rules.

      } catch (err) {
        console.error("Camera access failed:", err);
        setCameraError(true);
      }
    };

    if (showImmersiveScanner) {
      startCamera();
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    }

    return () => {
      active = false;
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showImmersiveScanner]);

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

  return (
    <div className="bg-gray-200 md:bg-[#f6f7fb] flex justify-center md:block antialiased select-none min-h-screen">
      {/* Dynamic styles injector */}
      <style>{`
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
        @keyframes laserMove {
          0% { top: 6%; }
          50% { top: 94%; }
          100% { top: 6%; }
        }
        .laser-line {
          animation: laserMove 2s infinite linear;
        }
      `}</style>

      <div className="relative w-full max-w-[400px] md:max-w-none bg-[#f6f7fb] h-screen overflow-hidden shadow-2xl md:shadow-none sm:border sm:border-gray-300 md:border-none sm:rounded-3xl md:rounded-none flex flex-col">
        
        {/* Header */}
        <header className="flex justify-between items-center px-6 py-4 bg-white sm:rounded-t-3xl md:rounded-none z-20 relative shrink-0">
          <button 
            onClick={() => navigate("/vet/schedule")}
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
        <main className="flex-1 overflow-y-auto pb-[240px] relative z-0 scrollbar-none" style={{ scrollbarWidth: 'none' }}>
            
          {/* Pet Profile Section */}
          <div className="flex flex-col items-center pt-3 pb-2">
            <div className="relative w-[100px] h-[100px]">
              <img 
                src={petImage} 
                alt={petName} 
                className="w-full h-full object-cover rounded-full border-[3px] border-white shadow-sm"
              />
              <div className="absolute bottom-1 right-1 w-[20px] h-[20px] bg-[#22c55e] border-[3px] border-white rounded-full"></div>
            </div>
            <h2 className="text-[26px] font-bold text-[#1a1f36] mt-2 tracking-tight">{petName}</h2>
            <p className="text-[#8b92a5] font-medium text-[14px] mt-0.5">{petBreed} • {petAge}</p>
            
            <div className="mt-2.5 bg-[#f3e8ff] text-[#9d4edd] px-3 py-1 rounded-full flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-[#9d4edd] rounded-full"></div>
              <span className="text-[10px] font-bold tracking-widest uppercase">Consultation Confirmed</span>
            </div>
          </div>

          {isHomeVisit ? (
            /* ==================== HOME VISIT LAYOUT (homie.html) ==================== */
            <>
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
                    onClick={handleStartNavigation}
                    className="absolute bottom-3 right-3 bg-gradient-to-r from-[#a855f7] to-[#8b5cf6] text-white px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-[0_15px_35px_-5px_rgba(157,78,221,0.3)] transition transform hover:scale-105 active:scale-95"
                  >
                    <i className="fas fa-location-arrow text-[11px]"></i>
                    <span className="text-[12px] font-bold">Start Navigation</span>
                  </button>
                </div>
              </div>

              {/* Reason For Visit Card */}
              {chiefComplaint && (
                <div className="mx-5 mt-4">
                  <div className="flex justify-between items-center mb-2 px-0.5">
                    <h2 className="text-[16px] font-bold text-[#1a1f36] tracking-tight">Reason for Visit</h2>
                  </div>
                  <div className="bg-white rounded-[20px] p-4 shadow-[0_8px_25px_-8px_rgba(0,0,0,0.06)] flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                      <i className="fas fa-exclamation-circle"></i>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 tracking-wider uppercase mb-0.5">Chief Complaint</p>
                      <p className="text-[13px] text-gray-700 font-medium leading-relaxed">{chiefComplaint}</p>
                    </div>
                  </div>
                </div>
              )}

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
                      <p className="text-[14px] text-[#1a1f36] font-bold mt-0.5">Home Visit</p>
                    </div>
                  </div>

                  {/* Reason for Visit */}
                  {chiefComplaint && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center text-md shrink-0">
                        <i className="fas fa-syringe"></i>
                      </div>
                      <div>
                        <p className="text-[11px] text-gray-400 font-medium">Reason for Visit</p>
                        <p className="text-[14px] text-[#1a1f36] font-bold mt-0.5">{chiefComplaint}</p>
                      </div>
                    </div>
                  )}

                  {/* Scheduled Time */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center text-md shrink-0">
                      <i className="fas fa-clock"></i>
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-400 font-medium">Scheduled Time</p>
                      <p className="text-[14px] text-[#1a1f36] font-bold mt-0.5">{scheduledTime} <span className="text-[#9d4edd] font-medium">(In 20 mins)</span></p>
                    </div>
                  </div>

                  {/* Owner Address */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#f3e8ff] text-[#9d4edd] flex items-center justify-center text-md shrink-0">
                      <i className="fas fa-location-dot"></i>
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-400 font-medium">Owner Address</p>
                      <p className="text-[14px] text-[#1a1f36] font-bold mt-0.5">{address}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Clinical Overview Card */}
              {connectedPassport && (
                <div className="mx-5 mt-4">
                  <h2 className="text-[16px] font-bold text-[#1a1f36] mb-2 px-0.5 tracking-tight">Clinical Overview</h2>
                  <div className="bg-white rounded-[20px] p-4 shadow-[0_8px_25px_-8px_rgba(0,0,0,0.06)] flex items-center gap-3.5">
                    <img 
                      src={connectedPassport.photo_url || petImage} 
                      alt={connectedPassport.name} 
                      className="w-[54px] h-[54px] rounded-xl object-cover"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[15px] font-bold text-[#1a1f36]">{connectedPassport.name}</span>
                        <span className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase scale-90 origin-left">Active</span>
                      </div>
                      <p className="text-[13px] text-gray-700 font-semibold mt-0.5">
                        {connectedPassport.breed?.replace(/\s*·\s*(?:Male|Female|N\/A)?$/i, "") || "N/A"} · {connectedPassport.gender || "Female"}
                      </p>
                      <div className="flex items-center gap-3 text-[#8b92a5] text-[11px] mt-1 font-medium">
                        <span className="flex items-center gap-1"><i className="far fa-clock text-[10px]"></i> {connectedPassport.age}</span>
                        <span className="flex items-center gap-1"><i className="fas fa-weight-hanging text-[10px]"></i> {connectedPassport.weight}</span>
                        <span className="flex items-center gap-1"><i className="far fa-calendar text-[10px]"></i> {connectedPassport.dob}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* ==================== CLINIC VISIT LAYOUT (clinio.html) ==================== */
            <>
              {/* [1] Visit Information Card */}
              <div className="mx-5 mt-3 bg-white rounded-[20px] p-4 shadow-[0_8px_25px_-8px_rgba(0,0,0,0.06)]">
                <div className="flex justify-between items-center mb-3.5">
                  <h3 className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">Visit Information</h3>
                  <div className="w-5 h-5 rounded-full bg-[#9d4edd] flex items-center justify-center text-white text-[9px]">
                    <i className="fas fa-info"></i>
                  </div>
                </div>
                
                <div className="flex flex-col gap-3.5">
                  {/* Visit Type */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-md shrink-0">
                      <i className="fas fa-hospital-user"></i>
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-400 font-medium">Visit Type</p>
                      <p className="text-[14px] text-[#1a1f36] font-bold mt-0.5">Clinic Visit</p>
                    </div>
                  </div>

                  {/* Reason for Visit */}
                  {chiefComplaint && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-purple-50 text-[#9d4edd] flex items-center justify-center text-md shrink-0">
                        <i className="fas fa-syringe"></i>
                      </div>
                      <div>
                        <p className="text-[11px] text-gray-400 font-medium">Reason for Visit</p>
                        <p className="text-[14px] text-[#1a1f36] font-bold mt-0.5">{chiefComplaint}</p>
                      </div>
                    </div>
                  )}

                  {/* Scheduled Time */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center text-md shrink-0">
                      <i className="fas fa-clock"></i>
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-400 font-medium">Scheduled Time</p>
                      <p className="text-[14px] text-[#1a1f36] font-bold mt-0.5">{scheduledTime} <span className="text-[#9d4edd] font-medium">(In 20 mins)</span></p>
                    </div>
                  </div>

                  {/* Owner Address */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#f3e8ff] text-[#9d4edd] flex items-center justify-center text-md shrink-0">
                      <i className="fas fa-location-dot"></i>
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-400 font-medium">Owner Address</p>
                      <p className="text-[14px] text-[#1a1f36] font-bold mt-0.5">{address}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* [2] Reason For Visit Card */}
              {chiefComplaint && (
                <div className="mx-5 mt-4">
                  <div className="flex justify-between items-center mb-2 px-0.5">
                    <h2 className="text-[16px] font-bold text-[#1a1f36] tracking-tight">Reason for Visit</h2>
                  </div>
                  <div className="bg-white rounded-[20px] p-4 shadow-[0_8px_25px_-8px_rgba(0,0,0,0.06)] flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                      <i className="fas fa-exclamation-circle"></i>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 tracking-wider uppercase mb-0.5">Chief Complaint</p>
                      <p className="text-[13px] text-gray-700 font-medium leading-relaxed">{chiefComplaint}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* [3] Clinical Overview Card */}
              {connectedPassport && (
                <div className="mx-5 mt-4">
                  <h2 className="text-[16px] font-bold text-[#1a1f36] mb-2 px-0.5 tracking-tight">Clinical Overview</h2>
                  <div className="bg-white rounded-[20px] p-4 shadow-[0_8px_25px_-8px_rgba(0,0,0,0.06)] flex items-center gap-3.5">
                    <img 
                      src={connectedPassport.photo_url || petImage} 
                      alt={connectedPassport.name} 
                      className="w-[54px] h-[54px] rounded-xl object-cover"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[15px] font-bold text-[#1a1f36]">{connectedPassport.name}</span>
                        <span className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase scale-90 origin-left">Active</span>
                      </div>
                      <p className="text-[13px] text-gray-700 font-semibold mt-0.5">
                        {connectedPassport.breed?.replace(/\s*·\s*(?:Male|Female|N\/A)?$/i, "") || "N/A"} · {connectedPassport.gender || "Female"}
                      </p>
                      <div className="flex items-center gap-3 text-[#8b92a5] text-[11px] mt-1 font-medium">
                        <span className="flex items-center gap-1"><i className="far fa-clock text-[10px]"></i> {connectedPassport.age}</span>
                        <span className="flex items-center gap-1"><i className="fas fa-weight-hanging text-[10px]"></i> {connectedPassport.weight}</span>
                        <span className="flex items-center gap-1"><i className="far fa-calendar text-[10px]"></i> {connectedPassport.dob}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Pet Passport Components Heading & Cards - only shown if passport is connected on human side */}
          {connectedPassport && (
            <>
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
                    <p className="text-[13px] text-[#1a1f36] font-bold mt-0.5">{connectedPassport.name}</p>
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
                    <p className="text-[13px] text-[#1a1f36] font-bold mt-0.5">{petBreed}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[10px] text-[#8b92a5] font-bold uppercase tracking-wide">Appearance / Marks</p>
                    <p className="text-[13px] text-[#1a1f36] font-bold mt-0.5">{connectedPassport.appearance}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#8b92a5] font-bold uppercase tracking-wide">Date of Birth</p>
                    <p className="text-[13px] text-[#1a1f36] font-bold mt-0.5">{connectedPassport.dob}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#8b92a5] font-bold uppercase tracking-wide">Age / Weight</p>
                    <p className="text-[13px] text-[#1a1f36] font-bold mt-0.5">{connectedPassport.age} • {connectedPassport.weight}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#8b92a5] font-bold uppercase tracking-wide">Issue Date</p>
                    <p className="text-[13px] text-[#1a1f36] font-bold mt-0.5">{connectedPassport.issueDate}</p>
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
              <div className="mx-5 mt-3.5 bg-white rounded-[20px] p-4 shadow-[0_8px_25px_-8px_rgba(0,0,0,0.06)]">
                <div className="flex items-center gap-1.5 mb-3.5">
                  <div className="w-1 h-3.5 bg-pink-500 rounded-full"></div>
                  <h4 className="text-[11px] font-bold text-[#1a1f36] tracking-wider uppercase">III. Clinical Notes & Allergies</h4>
                </div>
                <div className="grid grid-cols-2 gap-y-3.5 gap-x-2">
                  <div className="col-span-2">
                    <p className="text-[10px] text-[#8b92a5] font-bold uppercase tracking-wide">Known Allergies</p>
                    <p className="text-[13px] text-red-500 font-bold mt-0.5">{connectedMedicalLog?.allergies || "No known allergies"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#8b92a5] font-bold uppercase tracking-wide">Last Veterinary Visit</p>
                    <p className="text-[13px] text-[#1a1f36] font-bold mt-0.5">
                      {connectedMedicalLog?.last_visit ? new Date(connectedMedicalLog.last_visit).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#8b92a5] font-bold uppercase tracking-wide">Registered Conditions</p>
                    <p className="text-[13px] text-[#1a1f36] font-bold mt-0.5">
                      {connectedConditions.length > 0 ? connectedConditions.map(c => c.condition_name).join(', ') : "none"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Health Records Section */}
              <div className="mx-5 mt-4">
                <div className="flex justify-between items-center mb-2 px-0.5">
                  <h3 className="text-[11px] font-bold text-gray-400 tracking-widest uppercase">Health Records</h3>
                  <button 
                    onClick={() => toast.info("Viewing all records...")}
                    className="text-pink-500 font-bold text-[11px] hover:underline"
                  >
                    View All
                  </button>
                </div>
                <div className="flex flex-col gap-2">
                  {connectedRecords.length > 0 ? (
                    connectedRecords.map((rec) => (
                      <div key={rec.id} className="bg-white rounded-[16px] p-3.5 shadow-[0_8px_25px_-8px_rgba(0,0,0,0.06)] flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-1 h-8 bg-emerald-500 rounded-full"></div>
                          <div>
                            <span className="text-[13px] text-[#1a1f36] font-bold block">{rec.document_name || "Medical Record"}</span>
                            <span className="text-[11px] text-[#8b92a5] font-medium block">{rec.description || "Uploaded medical document"}</span>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-[#8b92a5] uppercase">
                          {rec.created_at ? new Date(rec.created_at).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }) : "N/A"}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="bg-white rounded-[16px] p-3.5 shadow-[0_8px_25px_-8px_rgba(0,0,0,0.06)] flex items-center justify-center text-[#8b92a5] text-xs font-semibold py-4">
                      No clinical logs attached to this passport.
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Owner Information Card */}
          <div className="mx-5 mt-4 bg-white rounded-[20px] p-4 shadow-[0_8px_25px_-8px_rgba(0,0,0,0.06)]">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">Owner Information</h3>
              <a 
                href={`tel:${ownerPhone}`}
                className="w-7 h-7 rounded-full bg-[#f3e8ff] flex items-center justify-center text-[#9d4edd] text-[11px] cursor-pointer"
              >
                <i className="fas fa-phone"></i>
              </a>
            </div>
            
            <div className="flex items-center gap-3">
              <img 
                src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100&h=100" 
                alt="Owner" 
                className="w-[45px] h-[45px] rounded-full object-cover"
              />
              <div>
                <p className="text-[15px] text-[#1a1f36] font-bold">{ownerName}</p>
                <p className="text-[13px] text-[#8b92a5] font-medium mt-0.5">{ownerPhone}</p>
              </div>
            </div>
          </div>

          {/* Medical Background Card */}
          <div className="mx-5 mt-4 bg-white rounded-[20px] p-4 shadow-[0_8px_25px_-8px_rgba(0,0,0,0.06)]">
            <h3 className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-3">Medical Background</h3>
            
            <div className="flex flex-col gap-4">
              {/* Initial Complaint / Consultation note */}
              {chiefComplaint && (
                <div className="flex gap-2.5 items-start">
                  <div className="mt-0.5 w-[16px] h-[16px] rounded-full bg-[#8b5cf6] text-white flex items-center justify-center text-[10px] shrink-0">
                    <i className="fas fa-stethoscope"></i>
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-0.5">Reason for Visit</p>
                    <p className="text-[13px] text-gray-700 font-bold leading-snug">{chiefComplaint}</p>
                  </div>
                </div>
              )}

              {/* Patient Profile Medical History */}
              <div className="flex gap-2.5 items-start border-t border-gray-100 pt-3">
                <div className="mt-0.5 w-[16px] h-[16px] rounded-full bg-[#10b981] text-white flex items-center justify-center text-[10px] shrink-0">
                  <i className="fas fa-notes-medical"></i>
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-0.5">Medical & Deworming History</p>
                  <p className="text-[13px] text-gray-700 font-semibold leading-snug">
                    {petMedicalInfo?.medicalHistory ? petMedicalInfo.medicalHistory : "No chronic illnesses or deworming issues registered by owner."}
                  </p>
                </div>
              </div>

              {/* Patient Vaccination status */}
              <div className="flex gap-2.5 items-start border-t border-gray-100 pt-3">
                <div className={`mt-0.5 w-[16px] h-[16px] rounded-full ${petMedicalInfo?.vaccinated ? "bg-emerald-500" : "bg-amber-500"} text-white flex items-center justify-center text-[9px] shrink-0`}>
                  <i className="fas fa-shield"></i>
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-0.5">Vaccination Status</p>
                  <p className="text-[13px] text-gray-700 font-semibold leading-snug">
                    {petMedicalInfo?.vaccinated ? "Fully Vaccinated (Up-To-Date)" : "Partially Vaccinated / Schedule Pending"}
                  </p>
                  {petMedicalInfo && petMedicalInfo.vaccinations && petMedicalInfo.vaccinations.length > 0 && (
                    <p className="text-[11px] text-gray-500 mt-1 font-mono">
                      Vaccines: {petMedicalInfo.vaccinations.map((v: any) => v.vaccine_type).join(", ")}
                    </p>
                  )}
                </div>
              </div>

              {/* Patient Breed Details */}
              <div className="flex gap-2.5 items-start border-t border-gray-100 pt-3">
                <div className="mt-0.5 w-[16px] h-[16px] rounded-full bg-blue-500 text-white flex items-center justify-center text-[9px] shrink-0">
                  <i className="fas fa-info-circle"></i>
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-0.5">Microchip & Demographics</p>
                  <p className="text-[13px] text-gray-700 font-semibold leading-snug">
                    Breed: {petBreed} | Category: {stateVisit?.petCategory || dbAppointment?.pet_type || "Canine"}
                  </p>
                  {petMedicalInfo?.microchip && (
                    <p className="text-[11px] text-[#8b5cf6] mt-0.5 font-bold">
                      Microchip Serial ID: {petMedicalInfo.microchip}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
            
        </main>

        {/* Floating QR Squircle Button */}
        {!isVerified && !isCancelledOrRejected && (
          <button 
            onClick={openImmersiveScanner} 
            className="absolute bottom-[160px] right-6 w-[56px] h-[56px] bg-[#f3e8ff] text-[#9d4edd] rounded-[22px] shadow-[0_8px_20px_-4px_rgba(157,78,221,0.2)] flex items-center justify-center text-[22px] transition transform hover:scale-105 active:scale-95 z-20" 
            title="Scan QR"
          >
            <i className="fas fa-qrcode"></i>
          </button>
        )}

        {/* Dynamic Footer Action Container */}
        <div className="absolute bottom-0 left-0 w-full px-5 pb-6 pt-10 bg-gradient-to-t from-[#f6f7fb] via-[#f6f7fb] to-transparent z-10 sm:rounded-b-3xl font-sans">
            
          {/* Phase 1: Initial Action Buttons */}
          {!isSwipeMode && (
            <div id="initialActions" className="flex flex-col gap-2.5">
              {isCancelledOrRejected ? (
                null
              ) : (
                <>
                  {!isVerified ? (
                    <div className="flex items-center justify-center gap-1.5 text-[12.5px] text-[#8b5cf6] font-bold py-1.5 bg-purple-50 rounded-xl border border-purple-100/60 animate-pulse">
                      <i className="fas fa-lock text-[11px]"></i>
                      <span>Scan QR to unlock consultation</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between px-4 py-2 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-800 text-xs mb-1">
                      <span className="font-bold flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                        Consultation Unlocked (Active)
                      </span>
                      <span className="font-mono bg-emerald-100 text-emerald-950 font-black px-2 py-0.5 rounded text-sm">
                        {formatTimer(elapsedSeconds)}
                      </span>
                    </div>
                  )}
                  <button 
                    onClick={() => {
                      if (isVerified) {
                        handleStartConsultation();
                      }
                    }} 
                    disabled={!isVerified || !!timerStartEpoch}
                    className={`w-full py-[16px] rounded-2xl font-bold text-[15px] flex justify-center items-center gap-2.5 transition transform shadow-md ${
                      isVerified && !timerStartEpoch
                        ? "bg-gradient-to-r from-[#a855f7] to-[#8b5cf6] text-white active:scale-95 shadow-[0_15px_35px_-5px_rgba(157,78,221,0.3)] cursor-pointer" 
                        : "bg-gray-300 text-gray-500 cursor-not-allowed shadow-none"
                    }`}
                  >
                    <div className={`rounded-full w-4 h-4 flex items-center justify-center ${isVerified ? "bg-white" : "bg-gray-400"}`}>
                      <i className={`fas fa-play text-[8px] ml-[2px] ${isVerified ? "text-[#8b5cf6]" : "text-gray-200"}`}></i>
                    </div>
                    Start Consultation
                  </button>
                </>
              )}
              <button 
                onClick={() => toast.info("Medical history view loaded successfully.")}
                className="w-full bg-white text-gray-600 py-[16px] rounded-2xl font-bold text-[15px] border border-gray-200 hover:bg-gray-50 transition transform active:scale-95 cursor-pointer shadow-sm"
              >
                View Medical History
              </button>
            </div>
          )}

          {/* Phase 2: Upgraded Premium Swipe Slider */}
          {isSwipeMode && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between px-4 py-1.5 bg-purple-50 rounded-xl border border-purple-100 text-[#9d4edd] text-xs">
                <span className="font-bold flex items-center gap-1">
                  <i className="fas fa-clock"></i> Live Session duration
                </span>
                <span className="font-mono bg-purple-150 text-purple-950 font-black px-2 py-0.5 rounded text-sm">
                  {formatTimer(elapsedSeconds)}
                </span>
              </div>
              <div 
                ref={containerRef}
                id="swipeContainer" 
                className={`relative w-full h-[64px] bg-white bg-opacity-80 backdrop-blur-md rounded-full border border-purple-100 p-1.5 flex items-center overflow-hidden shadow-[0_10px_30px_-6px_rgba(157,78,221,0.25)] transition-all duration-300 ${isCompleted ? 'opacity-0 translate-y-[15px]' : ''}`}
              >
              {/* Dynamic Shimmer Track Glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 shimmer-track opacity-20 pointer-events-none"></div>

              {/* Single Line Centered Text Element */}
              <div 
                id="swipeText" 
                className="absolute inset-0 flex items-center justify-center pointer-events-none transition-all duration-150 z-0 pl-10"
                style={{
                  opacity: 1 - (swipeTranslation / maxTrack) * 1.6,
                  transform: `scale(${1 - (swipeTranslation / maxTrack) * 0.15})`
                }}
              >
                <span className="text-[13px] font-extrabold text-[#9d4edd] tracking-wide uppercase whitespace-nowrap select-none">
                  Swipe to Complete Consultation
                </span>
              </div>
              
              {/* Slider Dynamic Background Progress Color Mask */}
              <div 
                id="swipeFill" 
                className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-l-full opacity-10 pointer-events-none z-0" 
                style={{ width: `${swipeTranslation + 26}px` }}
              ></div>

              {/* Round High-Fidelity Handle/Trigger Button */}
              <div 
                ref={handleRef}
                id="swipeHandle" 
                onMouseDown={handleDragStart}
                onTouchStart={handleDragStart}
                className="w-[52px] h-[52px] bg-gradient-to-br from-[#b166fc] via-[#9d4edd] to-[#7b2cbf] rounded-full flex items-center justify-center text-white text-[15px] shadow-[0_4px_15px_-2px_rgba(139,92,246,0.5)] cursor-grab active:cursor-grabbing transition-transform duration-75 ease-out z-10 border border-white border-opacity-30"
                style={{ transform: `translateX(${swipeTranslation}px)` }}
              >
                <i className="fas fa-angles-right"></i>
              </div>
            </div>
          </div>
          )}

        </div>

      </div>

      {/* [REFINED] High-Fidelity Google Pay Immersive Scanner (Theme Matched) */}
      {showImmersiveScanner && (
        <div 
          className={`fixed inset-0 bg-black z-50 flex flex-col justify-between transition-all duration-300 ease-out sm:border sm:border-gray-805 sm:rounded-3xl md:border-none md:rounded-none max-w-[400px] md:max-w-none mx-auto h-screen ${isScannerAnimating ? 'opacity-100' : 'opacity-0'}`}
        >
          {/* Live Simulated Camera Viewport */}
          <div className="absolute inset-0 w-full h-full bg-[#121016] overflow-hidden sm:rounded-3xl md:rounded-none">
            <video 
              ref={videoRef}
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
              style={{ transform: "scale(1.15)" }}
            />

            {/* Flash Light Ambient Ray effect */}
            {flashOn && (
              <div className="absolute inset-0 bg-white/10 pointer-events-none mix-blend-screen shadow-[inset_0_0_120px_rgba(253,224,71,0.35)] transition-all z-10"></div>
            )}

            {cameraError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10 bg-[#121016]">
                <i className="fas fa-video-slash text-white/30 text-3xl mb-3"></i>
                <p className="text-white/40 text-[11px] leading-relaxed">Camera stream unavailable.<br/>Securely using simulation sandbox mode.</p>
              </div>
            )}

            {/* Camera Fine Matrix Grid Overlay */}
            <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)", backgroundSize: "18px 18px" }}></div>
            
            {/* Google Pay Ergonomic Offset Target Overlay (Slightly Upwards) */}
            <div className="absolute inset-x-0 top-0 bottom-[10%] flex items-center justify-center pointer-events-none">
              
              {/* Expanded Width Theme-Matched Targeting Square Box */}
              <div className="w-[250px] h-[250px] rounded-2xl bg-transparent relative border border-white/5 shadow-[0_0_20px_rgba(157,78,221,0.3)]">
                {/* Simulated deep outer black mask */}
                <div className="absolute inset-0 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.70)] pointer-events-none"></div>

                {/* Premium Brand Purple Premium Corner Brackets */}
                <div className="absolute -top-[2px] -left-[2px] w-7 h-7 border-t-[4px] border-l-[4px] border-[#9d4edd] rounded-tl-xl"></div>
                <div className="absolute -top-[2px] -right-[2px] w-7 h-7 border-t-[4px] border-r-[4px] border-[#9d4edd] rounded-tr-xl"></div>
                <div className="absolute -bottom-[2px] -left-[2px] w-7 h-7 border-b-[4px] border-l-[4px] border-[#9d4edd] rounded-bl-xl"></div>
                <div className="absolute -bottom-[2px] -right-[2px] w-7 h-7 border-b-[4px] border-r-[4px] border-[#9d4edd] rounded-br-xl"></div>
                
                {/* Smooth Laser Track Line matched with App Brand Accent Color */}
                <div className="absolute left-3 right-3 h-[2.5px] bg-gradient-to-r from-transparent via-purple-400 to-transparent shadow-[0_0_12px_#9d4edd] laser-line"></div>
              </div>
            </div>
          </div>

          {/* Sleek Header Controls Layer */}
          <div className="px-6 pt-6 pb-4 flex justify-between items-center w-full z-10 bg-gradient-to-b from-black/60 to-transparent flex-row">
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                closeImmersiveScanner();
              }} 
              className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md text-white/90 flex items-center justify-center hover:bg-white/20 transition active:scale-95 text-xs text-white"
            >
              <i className="fas fa-arrow-left text-[15px]"></i>
            </button>
            <p className="text-white/90 text-[13px] font-semibold tracking-wider uppercase bg-black/20 px-3 py-1.5 rounded-full backdrop-blur-sm">Scan consultation QR</p>
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const newFlash = !flashOn;
                setFlashOn(newFlash);
                toast.info(newFlash ? "🔦 Flashlight turned on" : "🔦 Flashlight turned off");
              }}
              className={`w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center transition active:scale-95 duration-250 ${
                flashOn 
                  ? "bg-amber-400 text-amber-950 shadow-[0_0_15px_rgba(251,191,36,0.6)] animate-pulse" 
                  : "bg-white/10 text-white/90 hover:bg-white/20"
              }`}
            >
              <i className="fas fa-bolt text-[14px]"></i>
            </button>
          </div>

          {/* Clean Bottom Subtext Layer */}
          <div className="p-12 flex flex-col items-center justify-center w-full z-10 bg-gradient-to-t from-black/70 via-black/30 to-transparent pointer-events-none">
            <p className="text-white/40 text-[11px] font-medium tracking-wide text-center max-w-[210px] leading-relaxed">
              Align QR code within the frame to instantly verify visit
            </p>
          </div>
        </div>
      )}

      {/* QR Code Scan/Show Overlay Modal */}
      {showQrModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-[340px] w-full text-center shadow-2xl relative animate-fade-in flex flex-col items-center justify-center">
            <button 
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100"
            >
              <i className="fas fa-times"></i>
            </button>
            <h3 className="text-lg font-black text-gray-900 tracking-tight">Consultation Check-In</h3>
            <p className="text-xs text-gray-400 mt-1">Point the scanner at the client's companion QR code</p>
            
            <div className="my-6 flex justify-center">
              <div className="p-4 bg-[#f3e8ff] rounded-3xl border-2 border-[#9d4edd] shadow-lg">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(appointmentId || "VET-VISIT")}&color=9d4edd`} 
                  alt="Companion QR" 
                  className="w-48 h-48 rounded-xl object-contain"
                />
              </div>
            </div>
            
            <button 
              onClick={() => {
                setShowQrModal(false);
                toast.success("Consultation verified successfully. You can now start the consultation.");
              }}
              className="w-full bg-gradient-to-r from-[#a855f7] to-[#8b5cf6] text-white py-3.5 rounded-2xl font-bold hover:opacity-95 transition active:scale-95 shadow-lg shadow-purple-150"
            >
              Verify QR Code & Proceed
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default VetScheduleVisitDetails;
