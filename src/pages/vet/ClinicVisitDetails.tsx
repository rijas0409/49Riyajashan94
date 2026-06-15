/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { 
  ArrowLeft, MoreHorizontal, Moon, Shield, Copy, 
  CheckCircle2, Play, Calendar, Wallet, User, Home,
  MessageSquare, Star, MapPin, Clock, Compass, Plus, 
  Minus, Sparkles, Check, ChevronUp, ChevronDown, 
  Activity, Video, Phone, Tag, Trash, AlertTriangle, LifeBuoy, Info, X, Hourglass, Building2
} from "lucide-react";
import { toast } from "sonner";
import { VerifiedBadge } from "@/components/VerifiedBadge";
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

const PASSPORT_DATA = {
  luna: { 
    name: "Luna", 
    id: "#PP-88291", 
    age: "4 Years", 
    breed: "Golden Retriever · Female", 
    ageText: "4 yrs", 
    weight: "65 lbs", 
    dob: "Mar 2020", 
    avatar: "luna" 
  },
  max: { 
    name: "Max", 
    id: "#PP-44103", 
    age: "2 Years", 
    breed: "Labrador · Male", 
    ageText: "2 yrs", 
    weight: "55 lbs", 
    dob: "Jan 2022", 
    avatar: "max"  
  },
  coco: { 
    name: "Coco", 
    id: "#PP-76540", 
    age: "6 Years", 
    breed: "Beagle · Female", 
    ageText: "6 yrs", 
    weight: "22 lbs", 
    dob: "Sep 2018", 
    avatar: "coco" 
  },
};

const ClinicVisitDetails: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { appointmentId } = useParams();

  // Get state passed from payment/booking or use exact default details from custom layout
  const { visit: stateVisit } = (location.state as ClinicVisitDetailsState) || {};

  const [initialVisit, setInitialVisit] = useState({
    id: stateVisit?.id || appointmentId || "SRV-84721",
    petName: stateVisit?.petName || "Luna",
    petBreed: stateVisit?.petBreed || "Golden Retriever",
    petAge: stateVisit?.petAge || "4 Years",
    ownerName: stateVisit?.ownerName || "Sarah Jenkins",
    ownerPhone: stateVisit?.ownerPhone || "+91 98765 43210",
    address: stateVisit?.address || "123 Pet Lane, Springfield",
    time: stateVisit?.time || "Today, 2:30 PM – 3:00 PM",
    reason: stateVisit?.reason || "Luna has reduced appetite for last 2 days.",
    image: stateVisit?.image || "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=300&q=80",
    distance: "12 mins (4.2 miles)"
  });

  useEffect(() => {
    if (appointmentId && !stateVisit) {
      const fetchApptData = async () => {
        const { data, error } = await supabase
          .from("vet_appointments")
          .select("*, user:profiles!vet_appointments_user_id_fkey(*)")
          .eq("id", appointmentId)
          .single();
        
        if (!error && data) {
          const newVisit = {
            id: data.id,
            petName: data.pet_name || "Pet",
            petBreed: data.pet_breed || "Breed",
            petAge: "4 Years",
            ownerName: data.user?.full_name || data.user?.name || "Owner",
            ownerPhone: data.user?.phone || "+91 98765 43210",
            address: data.appointment_type === 'home' ? "123 Premium Residency, Indiranagar" : "HSR Paws Clinic, Sector 2",
            time: `${data.appointment_date}, ${data.appointment_time}`,
            reason: "General Consultation & Checkup",
            image: data.user?.profile_photo || "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=300&q=80",
            distance: data.appointment_type === 'home' ? "1.2 miles away" : "12 mins (4.2 miles)"
          };
          setInitialVisit(newVisit);
          setCurrentVisitId(newVisit.id);
        }
      };
      fetchApptData();
    }
  }, [appointmentId, stateVisit]);

  // Database and Real-time States
  const [currentVisitId, setCurrentVisitId] = useState<string>(initialVisit.id);
  const [dbVisit, setDbVisit] = useState<any>(null);
  const [paymentDetails, setPaymentDetails] = useState<any>(null);

  useEffect(() => {
    const targetId = appointmentId || stateVisit?.id || "SRV-84721";
    const localPayStr = localStorage.getItem(`payment_details_${targetId}`);
    if (localPayStr) {
      try {
        const parsed = JSON.parse(localPayStr);
        setPaymentDetails(parsed);
        setInitialVisit(prev => ({
          ...prev,
          petName: parsed.petName || prev.petName,
          petBreed: parsed.petBreed || prev.petBreed,
          petAge: parsed.petAge || prev.petAge,
          address: parsed.address || prev.address,
          time: parsed.time_display || prev.time,
        }));
      } catch (e) {
        console.error(e);
      }
    }
  }, [appointmentId, stateVisit?.id]);

  const [vetProfileId, setVetProfileId] = useState<string | null>(null);
  const [doctorProfile, setDoctorProfile] = useState<any>(null);

  // View state controllers
  const [passportOverlayOpen, setPassportOverlayOpen] = useState(false);
  const [qrOverlayOpen, setQrOverlayOpen] = useState(false);
  const [showUserQr, setShowUserQr] = useState(false);
  const [headerDropdownOpen, setHeaderDropdownOpen] = useState(false);
  const [helpScreenOpen, setHelpScreenOpen] = useState(false);

  // Functional interactive states
  const [selectedPassportId, setSelectedPassportId] = useState<string | null>(null);
  const [connectedPassport, setConnectedPassport] = useState<any | null>(null);
  const [connectedMedicalLog, setConnectedMedicalLog] = useState<any | null>(null);
  const [connectedConditions, setConnectedConditions] = useState<any[]>([]);
  const [connectedRecords, setConnectedRecords] = useState<any[]>([]);
  const [userPassports, setUserPassports] = useState<any[]>([]);
  const [loadingUserPassports, setLoadingUserPassports] = useState(false);

  const fetchUserPassports = async () => {
    setLoadingUserPassports(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please login to connect passport.");
        setLoadingUserPassports(false);
        return;
      }
      const { data, error } = await supabase
        .from("pet_passports")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) {
        console.error("Error fetching user passports:", error);
        toast.error("Failed to load pet passports.");
      } else {
        setUserPassports(data || []);
      }
    } catch (err) {
      console.error("Error loading passports exception:", err);
    } finally {
      setLoadingUserPassports(false);
    }
  };
  
  const [chiefComplaint, setChiefComplaint] = useState(initialVisit.reason);
  const [isEditingReason, setIsEditingReason] = useState(false);
  const [reasonInput, setReasonInput] = useState(initialVisit.reason);
  const [flashOn, setFlashOn] = useState(false);

  // Camera & Video Scanner States
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState(false);

  // Synchronize database values to local state when available
  useEffect(() => {
    if (dbVisit?.consultation_notes) {
      setChiefComplaint(dbVisit.consultation_notes);
      setReasonInput(dbVisit.consultation_notes);
    }
  }, [dbVisit?.consultation_notes]);

  // 1. Fetching appointment and veterinarian details
  useEffect(() => {
    let active = true;

    const fetchAppointmentAndVet = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        let query = supabase.from("vet_appointments").select("*");
        
        if (stateVisit?.id) {
          query = query.eq("id", stateVisit.id);
        } else {
          if (user?.id) {
            query = query.or(`user_id.eq.${user.id},vet_id.eq.${user.id}`);
          }
          query = query.order("created_at", { ascending: false }).limit(1);
        }

        const { data: apptData, error: apptError } = await query;
        if (apptError) {
          console.error("Error fetching appointment:", apptError);
          return;
        }

        if (apptData && apptData.length > 0) {
          const appt = apptData[0];
          if (!active) return;
          setDbVisit(appt);
          setCurrentVisitId(appt.id);

          // Fetch the corresponding vet's profile ID
          if (appt.vet_id) {
            const { data: vetProf, error: vetProfErr } = await supabase
               .from("vet_profiles")
               .select("id")
               .eq("user_id", appt.vet_id)
               .maybeSingle();

            if (vetProf && !vetProfErr) {
              setVetProfileId(vetProf.id);
            }
          }
        } else {
          // Fallback to use first veterinarian profile if no appointment exists
          const { data: fallbackVet } = await supabase
            .from("vet_profiles")
            .select("id")
            .limit(1)
            .maybeSingle();

          if (fallbackVet && active) {
            setVetProfileId(fallbackVet.id);
          }
        }
      } catch (err) {
        console.error("Error in fetchAppointmentAndVet:", err);
      }
    };

    fetchAppointmentAndVet();

    return () => {
      active = false;
    };
  }, [stateVisit?.id]);

  // 2. Real-time subscription to appointment table updates
  useEffect(() => {
    if (!currentVisitId || currentVisitId === "SRV-84721") return;

    const channel = supabase
      .channel("clinic_visit_details_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "vet_appointments",
          filter: `id=eq.${currentVisitId}`,
        },
        async (payload) => {
          console.log("Realtime appointment update received:", payload);
          if (payload.new) {
            setDbVisit(payload.new as any);
            
            // Redirect automatically if consultation started
            if (payload.new.status === "in_progress") {
               toast.success("Consultation Started! Proceeding...");
               setTimeout(() => {
                 navigate(`/vet/consultation-detail`, { state: { visitId: currentVisitId } });
               }, 1000);
            }

            if (payload.new.vet_id) {
              const { data: vetProf } = await supabase
                .from("vet_profiles")
                .select("id")
                .eq("user_id", payload.new.vet_id)
                .maybeSingle();

              if (vetProf) {
                setVetProfileId(vetProf.id);
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentVisitId]);

  // 3. Fetch Doctor details once vetProfileId is resolved
  useEffect(() => {
    if (!vetProfileId) return;
    
    const fetchDoctorProfile = async () => {
      try {
        const { data: vetProf, error: vetProfErr } = await supabase
          .from("vet_profiles")
          .select("*, profiles!vet_profiles_user_id_fkey(name, full_name, profile_photo)")
          .eq("id", vetProfileId)
          .maybeSingle();

        if (vetProf && !vetProfErr) {
          setDoctorProfile(vetProf);
        }
      } catch (err) {
        console.error("Error fetching doctor profile details:", err);
      }
    };

    fetchDoctorProfile();
  }, [vetProfileId]);

  // 4. Camera access handler for QR Overlay starts here
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
  }, [qrOverlayOpen]);

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

  const openQRScanner = () => {
    setQrOverlayOpen(true);
  };

  // Map interactive states
  const [scale, setScale] = useState(1);
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Map pan limit calculations
  const applyTransform = (newScale: number, newTx: number, newTy: number) => {
    // Clamping the pan translation bounds for safety
    const maxTx = 0;
    const minTx = Math.min(0, 360 - 840 * newScale);
    const maxTy = 0;
    const minTy = Math.min(0, 192 - 384 * newScale);

    const clampedTx = Math.max(minTx, Math.min(maxTx, newTx));
    const clampedTy = Math.max(minTy, Math.min(maxTy, newTy));

    setScale(newScale);
    setTranslateX(clampedTx);
    setTranslateY(clampedTy);
  };

  const handleZoomIn = () => {
    const newScale = Math.min(3, scale + 0.3);
    applyTransform(newScale, translateX, translateY);
  };

  const handleZoomOut = () => {
    const newScale = Math.max(0.5, scale - 0.3);
    applyTransform(newScale, translateX, translateY);
  };

  const handleRecenter = () => {
    applyTransform(1, 0, 0);
  };

  // Drag handlers for the map
  const handleMapMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - translateX, y: e.clientY - translateY });
  };

  const handleMapMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const nextTx = e.clientX - dragStart.x;
    const nextTy = e.clientY - dragStart.y;
    applyTransform(scale, nextTx, nextTy);
  };

  const handleMapMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  // Clipboard copies
  const handleCopyBookingId = () => {
    navigator.clipboard.writeText(currentVisitId);
    toast.success("Booking ID copied to clipboard!");
  };

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(dbVisit?.address || initialVisit.address);
    toast.success("Address copied to clipboard!");
  };

  // QR trigger simulates success
  const handleSimulateQRSuccess = async () => {
    setQrOverlayOpen(false);
    toast.custom((t) => (
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-xl flex items-center gap-3 animate-slide-in pointer-events-auto">
        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
          <Check className="w-5 h-5 text-white" strokeWidth={3} />
        </div>
        <div>
          <p className="font-bold text-gray-900 text-sm">Consultation Started!</p>
          <p className="text-xs text-slate-500 mt-0.5">Verified securely.</p>
        </div>
      </div>
    ), { duration: 4000 });

    if (currentVisitId && currentVisitId !== "SRV-84721") {
      try {
        await supabase.from("vet_appointments").update({ status: "in_progress" }).eq("id", currentVisitId);
      } catch (e) {
        console.error(e);
      }
    }
    
    // Redirect to final consultation view
    setTimeout(() => {
      navigate(`/vet/consultation-detail`, { state: { visitId: currentVisitId } });
    }, 1200);
  };

  // Editing Chief Complaint
  const handleSaveReason = async () => {
    setChiefComplaint(reasonInput);
    setIsEditingReason(false);
    toast.success("Visit reason updated successfully!");

    if (currentVisitId && currentVisitId !== "SRV-84721") {
      try {
        const { error } = await supabase
          .from("vet_appointments")
          .update({ consultation_notes: reasonInput })
          .eq("id", currentVisitId);
        if (error) {
          console.error("Error updating consultation notes:", error);
        }
      } catch (err) {
        console.error("Failed to update database consultation notes:", err);
      }
    }
  };

  const handleCancelReason = () => {
    setReasonInput(chiefComplaint);
    setIsEditingReason(false);
  };

  // Confirming Pet Passport connection
  const handleConfirmConnect = async () => {
    if (!selectedPassportId) return;
    const row = userPassports.find(p => p.id === selectedPassportId);
    if (!row) return;

    try {
      // Fetch details using direct tables
      const [medicalRes, conditionsRes, recordsRes] = await Promise.all([
        supabase
          .from("pet_medical_logs")
          .select("*")
          .eq("pet_passport_id", row.id)
          .maybeSingle(),
        supabase
          .from("pet_health_conditions")
          .select("*")
          .eq("pet_passport_id", row.id),
        supabase
          .from("pet_health_records_documents")
          .select("*")
          .eq("pet_passport_id", row.id)
      ]);

      setConnectedMedicalLog(medicalRes.data || null);
      setConnectedConditions(conditionsRes.data || []);
      setConnectedRecords(recordsRes.data || []);

      // Format EXACTLY in the layout schema so all downstream elements work perfect
      const pId = row.passport_id || `#PP-${row.id?.slice(0, 7).toUpperCase()}`;
      
      let ageVal = "N/A";
      let ageTextVal = "N/A";
      if (row.approx_years !== null && row.approx_years !== undefined) {
        ageVal = `${row.approx_years} Years${row.approx_months ? ` ${row.approx_months} Months` : ""}`;
        ageTextVal = `${row.approx_years} yrs${row.approx_months ? ` ${row.approx_months} mos` : ""}`;
      } else if (row.dob) {
        const years = new Date().getFullYear() - new Date(row.dob).getFullYear();
        ageVal = `${years} Years`;
        ageTextVal = `${years} yrs`;
      }

      const weightVal = row.weight ? `${row.weight} lbs` : "N/A";
      const dobVal = row.dob ? new Date(row.dob).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "N/A";
      const issueDateVal = row.created_at ? new Date(row.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "N/A";

      const mappedPassport = {
        id: pId,
        rawId: row.id,
        name: row.pet_name || "Unnamed Pet",
        species: row.species || "N/A",
        gender: row.gender || "N/A",
        breed: `${row.breed || "Breed"} · ${row.gender || ""}`,
        appearance: row.appearance || "N/A",
        age: ageVal,
        ageText: ageTextVal,
        weight: weightVal,
        dob: dobVal,
        issueDate: issueDateVal,
        ownerName: row.owner_name || "N/A",
        primaryPhone: row.primary_phone || "N/A",
        emergencyContactName: row.emergency_contact_name || "N/A",
        emergencyPhone: row.emergency_phone || "N/A",
        emergencyRelationship: row.emergency_relationship || "N/A",
        photo_url: row.photo_url || null,
        avatar: row.species?.toLowerCase() === "cat" ? "coco" : "luna"
      };

      setConnectedPassport(mappedPassport);
      setPassportOverlayOpen(false);
      toast.success(`${mappedPassport.name}'s Passport synced successfully!`);
    } catch (err) {
      console.error("Error setting up connected passport:", err);
      toast.error("Failed to connect passport completely.");
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#f8f9fa] text-[#1f1f1f] relative font-sans overflow-x-hidden">
      
      {/* ═══════════════ PASSPORT BOTTOM SHEET OVERLAY ═══════════════ */}
      {passportOverlayOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[3px] flex items-end md:items-center justify-center transition-all duration-300"
          onClick={() => setPassportOverlayOpen(false)}
        >
          <div 
            className="w-full max-w-md bg-white rounded-t-[1.5rem] md:rounded-2xl p-6 pb-8 animate-slide-up md:animate-zoom-in shadow-2xl mx-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Grab handle */}
            <div className="w-10 h-1.5 bg-gray-200 rounded-full mx-auto mb-5" />
            
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-bold text-gray-900">Select Pet Passport</h2>
              <button 
                onClick={() => setPassportOverlayOpen(false)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-gray-400 mb-5">Choose which passport to sync with this visit</p>
            
            <div className="space-y-3">
              {loadingUserPassports ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ec4899]"></div>
                  <p className="text-xs text-gray-500 font-medium">Fetching passports from database...</p>
                </div>
              ) : userPassports.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center select-none">
                  <div className="w-12 h-12 rounded-xl bg-pink-50 flex items-center justify-center text-[#ec4899] mb-3">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-gray-800">No passports found</p>
                  <p className="text-xs text-gray-500 max-w-[240px] mt-1">Please create a Pet Passport from your profile first.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {userPassports.map((passport) => {
                    const isSelected = selectedPassportId === passport.id;
                    const pId = passport.passport_id || `#PP-${passport.id?.slice(0, 6).toUpperCase()}`;
                    const pName = passport.pet_name || "Unnamed Pet";
                    const pBreed = `${passport.breed || "Breed"} · ${passport.gender || ""}`;
                    const isCat = passport.species?.toLowerCase() === "cat";
                    
                    return (
                      <div 
                        key={passport.id}
                        onClick={() => setSelectedPassportId(passport.id)}
                        className={`border-2 rounded-2xl p-4 cursor-pointer flex items-center gap-3.5 transition-all duration-200 ${
                          isSelected 
                            ? "border-[#ec4899] bg-[#fdf2f8]" 
                            : "border-gray-200 hover:border-[#f9a8d4] hover:bg-[#fff0f6]"
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          isCat ? "bg-amber-50 text-amber-500" : "bg-orange-50 text-orange-500"
                        }`}>
                          <Activity className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-800 text-sm">{pName}</p>
                          <p className="text-xs text-gray-400 font-mono">{pId} · {pBreed}</p>
                        </div>
                        
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                          isSelected ? "bg-[#ec4899] border-[#ec4899]" : "border-gray-300"
                        }`}>
                          {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <button 
              onClick={handleConfirmConnect}
              disabled={!selectedPassportId}
              className={`w-full mt-6 text-white font-bold py-4 rounded-xl transition-all shadow-md ${
                selectedPassportId 
                  ? "bg-[#ec4899] hover:bg-[#db2777] active:scale-[0.98]" 
                  : "bg-gray-300 cursor-not-allowed opacity-50"
              }`}
            >
              Connect Passport
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════ QR SCANNER OVERLAY ═══════════════ */}
      {qrOverlayOpen && (
        <div id="qr-overlay" style={{ position: "fixed", inset: 0, zIndex: 50, background: "black", display: "flex", flexDirection: "column", alignItems: "center" }}>
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
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "52px 20px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 2 }}>
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

      {/* ═══════════════ MAIN SCROLLABLE APP LAYOUT ═══════════════ */}
      <main className="w-full min-h-screen pb-48 flex flex-col relative bg-[#f8f9fa] overflow-x-hidden transition-all duration-300">
        
        {/* Header bar */}
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md px-4 md:px-6 py-4 flex items-center justify-between border-b border-gray-150 shadow-sm animate-fade-in">
          <button 
            onClick={() => navigate("/buyer/vet")}
            className="p-2 hover:bg-gray-100 rounded-full text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-800" strokeWidth={2.5} />
          </button>
          <h1 className="text-lg font-black tracking-tight text-gray-900">Visit Details</h1>
          
          <div className="relative">
            <button 
              onClick={() => setHeaderDropdownOpen(!headerDropdownOpen)}
              className="p-2 hover:bg-gray-100 rounded-full text-gray-800 transition-colors"
            >
              <MoreHorizontal className="w-5 h-5 text-gray-800" strokeWidth={2.5} />
            </button>

            {/* Header Dropdown Menu */}
            {headerDropdownOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setHeaderDropdownOpen(false)} />
                <div className="absolute right-0 top-full mt-1.5 bg-white border border-gray-200 rounded-[14px] shadow-xl min-width-[170px] overflow-hidden z-40 animate-slide-down">
                  {/* Help */}
                  <div 
                    onClick={() => {
                      setHeaderDropdownOpen(false);
                      setHelpScreenOpen(true);
                    }}
                    className="flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 cursor-pointer font-bold text-sm text-gray-800 border-b border-gray-100"
                  >
                    <div className="w-8 h-8 rounded-lg bg-pink-50 flex items-center justify-center text-[#ec4899]">
                      <LifeBuoy className="w-4 h-4" />
                    </div>
                    <span>Help</span>
                  </div>
                  {/* Info */}
                  <div 
                    onClick={() => {
                      setHeaderDropdownOpen(false);
                      toast.info("Visit status is confirmed by Sruvo Clinic Network.");
                    }}
                    className="flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 cursor-pointer font-bold text-sm text-gray-800"
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500">
                      <Info className="w-4 h-4" />
                    </div>
                    <span>Info</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Inner Content Padding */}
        <div className="w-full px-4 sm:px-6 lg:px-8 py-5 sm:py-6 lg:py-8 space-y-6 flex-1 overflow-y-auto bg-slate-50/50">
          
          {/* Confirmed Indicator Badge */}
          <div className="flex items-center justify-center w-full">
            <div className="bg-[#dcfce7] text-[#16a34a] flex items-center px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider shadow-sm border border-green-200">
              <span className="w-2 h-2 rounded-full mr-2 bg-[#16a34a] animate-pulse" />
              Consultation Confirmed
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 xl:gap-8 items-start pb-8">

            {/* ── INTERACTIVE PARKLANE MAP CARD ── */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex flex-col w-full">
              
              {/* Interactive map box */}
              <div 
                className="relative h-48 md:h-64 w-full bg-[#dce8d4] overflow-hidden cursor-grab active:cursor-grabbing select-none"
              onMouseDown={handleMapMouseDown}
              onMouseMove={handleMapMouseMove}
              onMouseUp={handleMapMouseUpOrLeave}
              onMouseLeave={handleMapMouseUpOrLeave}
            >
              <svg 
                viewBox="0 0 420 192" 
                className="absolute top-0 left-0 transition-transform duration-75"
                style={{
                  width: "840px",
                  height: "384px",
                  transformOrigin: "0 0",
                  transform: `translate(${translateX}px, ${translateY}px) scale(${scale})`,
                }}
              >
                <rect width="420" height="192" fill="#dce8d4" />
                <ellipse cx="60" cy="210" rx="110" ry="90" fill="#b5cc9e" />
                <ellipse cx="200" cy="220" rx="130" ry="85" fill="#c2d4a8" />
                <ellipse cx="360" cy="205" rx="100" ry="80" fill="#a8bf8c" />
                <ellipse cx="420" cy="215" rx="90" ry="80" fill="#b0c594" />
                <ellipse cx="80" cy="170" rx="60" ry="30" fill="#ccddb5" opacity="0.6" />
                <ellipse cx="300" cy="175" rx="80" ry="35" fill="#d0ddb8" opacity="0.5" />
                
                {/* Standard Roads Layout exactly matching original source design */}
                <path d="M0 115 Q80 108 160 112 Q240 116 320 110 Q370 107 420 112" stroke="#f5f0e0" strokeWidth="9" fill="none" strokeLinecap="round" />
                <path d="M0 115 Q80 108 160 112 Q240 116 320 110 Q370 107 420 112" stroke="#e8e0c8" strokeWidth="7" fill="none" strokeLinecap="round" />
                <path d="M0 115 Q80 108 160 112 Q240 116 320 110 Q370 107 420 112" stroke="#fff" strokeWidth="1.5" fill="none" strokeDasharray="12,10" strokeLinecap="round" />
                
                <path d="M130 0 Q128 50 132 115 Q133 150 130 192" stroke="#f5f0e0" strokeWidth="8" fill="none" strokeLinecap="round" />
                <path d="M130 0 Q128 50 132 115 Q133 150 130 192" stroke="#e8e0c8" strokeWidth="6" fill="none" strokeLinecap="round" />
                <path d="M130 0 Q128 50 132 115 Q133 150 130 192" stroke="#fff" strokeWidth="1.5" fill="none" strokeDasharray="12,10" strokeLinecap="round" />
                
                <path d="M260 0 Q280 40 300 80 Q310 95 320 110" stroke="#f5f0e0" strokeWidth="7" fill="none" strokeLinecap="round" />
                <path d="M260 0 Q280 40 300 80 Q310 95 320 110" stroke="#e8e0c8" strokeWidth="5" fill="none" strokeLinecap="round" />
                <path d="M320 110 Q360 100 420 95" stroke="#f5f0e0" strokeWidth="6" fill="none" strokeLinecap="round" />
                <path d="M320 110 Q360 100 420 95" stroke="#e8e0c8" strokeWidth="4" fill="none" strokeLinecap="round" />
                
                {/* Visual Foliage elements */}
                <circle cx="30" cy="95" r="10" fill="#7aaa60" />
                <circle cx="44" cy="88" r="8" fill="#6a9a52" />
                <circle cx="20" cy="88" r="7" fill="#82b468" />
                <circle cx="55" cy="95" r="9" fill="#72a25a" />
                <circle cx="360" cy="55" r="10" fill="#7aaa60" />
                <circle cx="374" cy="48" r="8" fill="#6a9a52" />
                <circle cx="348" cy="50" r="9" fill="#82b468" />
                <ellipse cx="190" cy="82" rx="22" ry="12" fill="#90bce0" opacity="0.75" />
                <ellipse cx="190" cy="82" rx="18" ry="8" fill="#a8d0f0" opacity="0.5" />
                <rect x="280" y="90" width="12" height="10" rx="1" fill="#c8c0b0" />
                <rect x="294" y="93" width="9" height="7" rx="1" fill="#d4ccbc" />
                <rect x="305" y="89" width="11" height="11" rx="1" fill="#c0b8a8" />
                
                {/* Dotted path */}
                <path d="M100 142 Q140 130 180 118 Q220 110 260 112 Q290 113 308 112" stroke="#3b82f6" strokeWidth="3" fill="none" strokeDasharray="7,5" strokeLinecap="round" opacity="0.85" />
                
                {/* Moving Pink Car marker */}
                <g className="animate-car-drive" transform="translate(80,130)">
                  <rect x="-10" y="-7" width="20" height="13" rx="3" fill="#ec4899" />
                  <rect x="-6" y="-12" width="12" height="7" rx="2" fill="#f9a8d4" />
                  <circle cx="-5" cy="6" r="3.5" fill="#1f1f1f" />
                  <circle cx="5" cy="6" r="3.5" fill="#1f1f1f" />
                  <circle cx="-5" cy="6" r="1.5" fill="#666" />
                  <circle cx="5" cy="6" r="1.5" fill="#666" />
                  <rect x="8" y="-3" width="3" height="2" rx="1" fill="#fef08a" />
                </g>
                
                {/* Glowing target pin node representing Springfield Clinic destination */}
                <g transform="translate(315,108)">
                  <circle cx="0" cy="0" r="16" fill="white" opacity="0.92" />
                  <circle cx="0" cy="0" r="16" stroke="#ec4899" strokeWidth="2.5" fill="none" />
                  <circle cx="0" cy="0" r="8" stroke="#ec4899" strokeWidth="2" fill="none" />
                  <circle cx="0" cy="0" r="3" fill="#ec4899" />
                  <line x1="-16" y1="0" x2="-10" y2="0" stroke="#ec4899" strokeWidth="2" strokeLinecap="round" />
                  <line x1="10" y1="0" x2="16" y2="0" stroke="#ec4899" strokeWidth="2" strokeLinecap="round" />
                  <line x1="0" y1="-16" x2="0" y2="-10" stroke="#ec4899" strokeWidth="2" strokeLinecap="round" />
                  <line x1="0" y1="10" x2="0" y2="16" stroke="#ec4899" strokeWidth="2" strokeLinecap="round" />
                </g>
                <circle cx="315" cy="108" r="14" fill="none" stroke="#ec4899" strokeWidth="2.5" className="animate-pin-ring" />
                
                {/* 123 Pet Lane Label tag */}
                <rect x="270" y="75" width="92" height="20" rx="5" fill="white" opacity="0.9" />
                <text x="316" y="89" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#1f1f1f">123 Pet Lane</text>
                
                {/* Compass Marker */}
                <g transform="translate(22,22)">
                  <circle cx="0" cy="0" r="12" fill="white" opacity="0.85" />
                  <text x="0" y="-5" textAnchor="middle" fontSize="7" fontWeight="800" fill="#1f1f1f">N</text>
                  <polygon points="0,-9 2,-2 0,1 -2,-2" fill="#ec4899" />
                  <polygon points="0,9 2,2 0,-1 -2,2" fill="#9ca3af" />
                </g>
              </svg>

              {/* Map controls */}
              <div className="absolute right-3 top-3 flex flex-col gap-1.5">
                <button 
                  onClick={handleZoomIn}
                  className="w-8 h-8 bg-white rounded-lg shadow-md border border-gray-100 flex items-center justify-center text-gray-700 font-bold hover:bg-gray-50 active:scale-95 transition-transform"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button 
                  onClick={handleZoomOut}
                  className="w-8 h-8 bg-white rounded-lg shadow-md border border-gray-100 flex items-center justify-center text-gray-700 font-bold hover:bg-gray-50 active:scale-95 transition-transform"
                >
                  <Minus className="w-4 h-4" />
                </button>
              </div>

              <button 
                onClick={handleRecenter}
                className="absolute bottom-3 right-3 bg-white p-2 rounded-lg shadow-md border border-gray-100 text-[#ec4899] active:scale-95 transition-transform"
              >
                <Compass className="w-5 h-5 text-[#ec4899]" />
              </button>
            </div>

            {/* Address detail strings and copy handlers */}
            <div className="p-4 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex gap-3">
                  <div className="w-10 h-10 bg-pink-50 rounded-lg flex items-center justify-center shrink-0">
                    <svg className="h-5 w-5 text-[#ec4899] text-brand-pink" fill="currentColor" viewBox="0 0 20 20">
                      <path clipRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" fillRule="evenodd"/>
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">{doctorProfile?.hospital_address || doctorProfile?.clinic_address || doctorProfile?.hospital_name || doctorProfile?.clinic_name || dbVisit?.address || initialVisit.address}</h2>
                    <p className="text-gray-500 text-xs mt-0.5">Estimated arrival: <span className="text-[#ec4899] text-brand-pink font-semibold">{initialVisit.distance.split('(')[0]}</span> {initialVisit.distance.includes('(') ? `(${initialVisit.distance.split('(')[1]}` : ''}</p>
                  </div>
                </div>
                <button 
                  onClick={handleCopyAddress}
                  className="text-gray-400 p-1 hover:text-gray-650 transition-colors"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/>
                  </svg>
                </button>
              </div>
              <div className="flex gap-3">
                <button className="flex-1 bg-pink-50 text-[#ec4899] text-brand-pink font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 border border-pink-100 hover:bg-[#fff0f6] hover:bg-pink-100 transition-colors">
                  <svg className="h-4 w-4 rotate-45" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"/>
                  </svg>
                  Start Navigation
                </button>
                {/* QR button next to navigation — same scanner */}
                <button 
                  onClick={() => setQrOverlayOpen(true)}
                  className="bg-gray-100 p-3.5 rounded-xl flex items-center justify-center text-gray-700 hover:bg-pink-50 hover:text-[#ec4899] hover:text-brand-pink transition-colors"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>

            {/* ── CLINICAL OVERVIEW MODULE ── */}
            <section className="w-full">
            <h2 className="text-xl font-bold mb-4">Clinical Overview</h2>
            <div className="space-y-4">
              
              {/* Connect Passport */}
              {!connectedPassport && (
                <div id="connect-passport-card" className="info-card p-4 rounded-2xl bg-pink-50/50 border border-pink-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#ec4899] text-white rounded-xl flex items-center justify-center shadow-sm shadow-pink-200">
                      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-800">Connect Passport</p>
                      <p className="text-xs text-gray-500">Sync digital medical records</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setSelectedPassportId(null);
                      setPassportOverlayOpen(true);
                      fetchUserPassports();
                    }}
                    className="bg-white text-[#ec4899] text-xs font-bold px-4 py-2 rounded-lg border border-pink-100 shadow-sm active:scale-95 transition-transform"
                  >
                    Connect
                  </button>
                </div>
              )}

              {/* Connected Active Passport State Displays */}
              {connectedPassport && (
                <div id="medical-sections" className="animate-fade-in space-y-4">
                  {/* Pet Profile Card */}
                  <div className="info-card p-4 rounded-2xl mb-4 bg-white border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div id="profile-avatar" className="w-14 h-14 rounded-2xl shrink-0 overflow-hidden bg-pink-50 border border-pink-100 shadow-sm flex items-center justify-center">
                        {connectedPassport.photo_url ? (
                          <img 
                            src={connectedPassport.photo_url} 
                            alt={connectedPassport.name} 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <>
                            {/* Luna */}
                            <svg 
                              id="avatar-luna" 
                              viewBox="0 0 56 56" 
                              xmlns="http://www.w3.org/2000/svg" 
                              className={`w-full h-full ${connectedPassport.avatar === "luna" ? "" : "hidden"}`}
                            >
                              <rect width="56" height="56" fill="#fff7ed" />
                              <ellipse cx="18" cy="20" rx="7" ry="10" fill="#f59e0b" transform="rotate(-15 18 20)" />
                              <ellipse cx="38" cy="20" rx="7" ry="10" fill="#f59e0b" transform="rotate(15 38 20)" />
                              <ellipse cx="18" cy="21" rx="4" ry="6.5" fill="#fbbf24" transform="rotate(-15 18 21)" />
                              <ellipse cx="38" cy="21" rx="4" ry="6.5" fill="#fbbf24" transform="rotate(15 38 21)" />
                              <ellipse cx="28" cy="30" rx="15" ry="14" fill="#fbbf24" />
                              <ellipse cx="28" cy="36" rx="8" ry="5.5" fill="#f59e0b" />
                              <ellipse cx="28" cy="33.5" rx="3.5" ry="2.5" fill="#1f1f1f" />
                              <circle cx="26.5" cy="34" r="0.8" fill="#374151" />
                              <circle cx="29.5" cy="34" r="0.8" fill="#374151" />
                              <path d="M25 36.5 Q28 39 31 36.5" fill="none" stroke="#92400e" strokeWidth="1.2" strokeLinecap="round" />
                              <circle cx="22" cy="28" r="3.5" fill="#1f1f1f" />
                              <circle cx="34" cy="28" r="3.5" fill="#1f1f1f" />
                              <circle cx="23" cy="27" r="1.2" fill="white" />
                              <circle cx="35" cy="27" r="1.2" fill="white" />
                            </svg>
                            {/* Max */}
                            <svg 
                              id="avatar-max" 
                              viewBox="0 0 56 56" 
                              xmlns="http://www.w3.org/2000/svg" 
                              className={`w-full h-full ${connectedPassport.avatar === "max" ? "" : "hidden"}`}
                            >
                              <rect width="56" height="56" fill="#eff6ff" />
                              <ellipse cx="17" cy="21" rx="7.5" ry="11" fill="#1e3a5f" transform="rotate(-10 17 21)" />
                              <ellipse cx="39" cy="21" rx="7.5" ry="11" fill="#1e3a5f" transform="rotate(10 39 21)" />
                              <ellipse cx="28" cy="30" rx="15" ry="14" fill="#374151" />
                              <ellipse cx="28" cy="33.5" rx="3.5" ry="2.5" fill="#111827" />
                              <path d="M25 37 Q28 39.5 31 37" fill="none" stroke="#1f2937" strokeWidth="1.2" strokeLinecap="round" />
                              <circle cx="22" cy="27.5" r="3.5" fill="#111827" />
                              <circle cx="34" cy="27.5" r="3.5" fill="#111827" />
                              <circle cx="23" cy="26.5" r="1.2" fill="white" />
                              <circle cx="35" cy="26.5" r="1.2" fill="white" />
                            </svg>
                            {/* Coco */}
                            <svg 
                              id="avatar-coco" 
                              viewBox="0 0 56 56" 
                              xmlns="http://www.w3.org/2000/svg" 
                              className={`w-full h-full ${connectedPassport.avatar === "coco" ? "" : "hidden"}`}
                            >
                              <rect width="56" height="56" fill="#fffbeb" />
                              <ellipse cx="15" cy="26" rx="7" ry="13" fill="#92400e" transform="rotate(-5 15 26)" />
                              <ellipse cx="41" cy="26" rx="7" ry="13" fill="#92400e" transform="rotate(5 41 26)" />
                              <ellipse cx="28" cy="29" rx="15" ry="14" fill="#fef3c7" />
                              <circle cx="22" cy="27" r="3.5" fill="#1f1f1f" />
                              <circle cx="34" cy="27" r="3.5" fill="#1f1f1f" />
                              <circle cx="23" cy="26" r="1.2" fill="white" />
                              <circle cx="35" cy="26" r="1.2" fill="white" />
                            </svg>
                          </>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p id="profile-name" className="font-bold text-gray-900 text-base leading-tight">{connectedPassport.name}</p>
                          <span className="text-[10px] font-bold bg-green-50 text-green-600 px-2 py-0.5 rounded-full border border-green-100">Active</span>
                        </div>
                        <p id="profile-breed" className="text-sm text-gray-600 font-medium font-semibold">{connectedPassport.breed}</p>
                        
                        <div className="flex items-center gap-3 mt-1.5 text-gray-400">
                          <span className="flex items-center gap-1 text-xs">
                            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                            </svg>
                            <span id="profile-age-text">{connectedPassport.ageText}</span>
                          </span>
                          <span className="flex items-center gap-1 text-xs">
                            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
                            </svg>
                            <span id="profile-weight">{connectedPassport.weight}</span>
                          </span>
                          <span className="flex items-center gap-1 text-xs">
                            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
                            </svg>
                            <span id="profile-dob">{connectedPassport.dob}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pet Passport */}
                  <div className="space-y-3 mb-4">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Pet Passport Details</h3>
                    <div className="info-card p-5 rounded-2xl bg-white border border-gray-200 shadow-sm space-y-5">
                      {/* Identification Section */}
                      <div>
                        <h4 className="text-xs font-extrabold text-[#ec4899] uppercase tracking-wide mb-2">I. Identification</h4>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                          <div><p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">Pet Name</p><p id="pp-name" className="font-bold text-gray-800 text-sm">{connectedPassport.name}</p></div>
                          <div><p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">Passport ID</p><p id="pp-id" className="font-bold text-brand-pink text-[#ec4899] text-sm font-mono">{connectedPassport.id}</p></div>
                          <div><p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">Species / Gender</p><p className="font-bold text-gray-800 text-sm capitalize">{connectedPassport.species} · {connectedPassport.gender}</p></div>
                          <div><p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">Breed</p><p className="font-bold text-gray-800 text-sm">{connectedPassport.breed?.replace(/\s*·\s*(?:Male|Female|N\/A)?$/i, "") || "N/A"}</p></div>
                          <div className="col-span-2"><p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">Appearance / Distinguishing Marks</p><p className="font-bold text-gray-700 text-xs leading-tight">{connectedPassport.appearance || "No distinctive marks registered"}</p></div>
                          <div><p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">Date of Birth</p><p className="font-bold text-gray-800 text-sm">{connectedPassport.dob}</p></div>
                          <div><p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">Age / Weight</p><p id="pp-age" className="font-bold text-gray-800 text-sm">{connectedPassport.age} · {connectedPassport.weight}</p></div>
                          <div className="col-span-2"><p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">Issue Date</p><p className="font-bold text-gray-800 text-sm">{connectedPassport.issueDate}</p></div>
                        </div>
                      </div>

                      {/* Line Separator */}
                      <hr className="border-gray-100" />

                      {/* Ownership Section */}
                      <div>
                        <h4 className="text-xs font-extrabold text-[#ec4899] uppercase tracking-wide mb-2">II. Ownership & Legal Guardian</h4>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                          <div><p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">Owner Name</p><p className="font-bold text-gray-800 text-sm">{connectedPassport.ownerName}</p></div>
                          <div><p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">Primary Phone</p><p className="font-bold text-gray-800 text-sm font-mono">{connectedPassport.primaryPhone}</p></div>
                          <div className="col-span-2"><p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">Emergency Contact</p><p className="font-bold text-gray-800 text-sm">{connectedPassport.emergencyContactName} ({connectedPassport.emergencyRelationship || "Relationship not specified"})</p></div>
                          <div><p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">Emergency Phone</p><p className="font-bold text-gray-800 text-sm font-mono">{connectedPassport.emergencyPhone}</p></div>
                        </div>
                      </div>

                      {/* Line Separator */}
                      <hr className="border-gray-100" />

                      {/* Clinical Overview Notes from Medical Log */}
                      <div>
                        <h4 className="text-xs font-extrabold text-[#ec4899] uppercase tracking-wide mb-2">III. Clinical Notes & Allergies</h4>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                          <div className="col-span-2">
                            <p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">Known Allergies</p>
                            <p className="font-bold text-red-600 text-xs leading-relaxed">
                              {connectedMedicalLog?.known_allergies || "No known allergies reported."}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">Last Veterinary Visit</p>
                            <p className="font-bold text-gray-800 text-xs">
                              {connectedMedicalLog?.last_veterinary_visit ? new Date(connectedMedicalLog.last_veterinary_visit).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "None recorded"}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">Registered Conditions</p>
                            <p className="font-bold text-gray-805 text-xs">
                              {connectedConditions.length > 0 
                                ? connectedConditions.map(c => c.condition_name || c.specify_other).join(", ") 
                                : "None reported."}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Health Records */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Health Records</h3>
                      <button className="text-xs font-bold text-brand-pink text-[#ec4899] hover:underline">View All</button>
                    </div>
                    <div className="space-y-2">
                      {connectedRecords.length === 0 ? (
                        <div className="text-center py-6 bg-white border rounded-2xl border-gray-100 text-xs text-gray-400">
                          No health or vaccination records found in the database for this pet.
                        </div>
                      ) : (
                        connectedRecords.map((rec) => {
                          const dateStr = rec.date_administered 
                            ? new Date(rec.date_administered).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })
                            : (rec.issue_date 
                              ? new Date(rec.issue_date).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })
                              : "N/A");
                          const title = rec.record_type === "vaccination" 
                            ? (rec.vaccine_name || rec.specify_vaccine || "Vaccination")
                            : (rec.record_type || "Medical Record");
                          const detail = rec.record_type === "vaccination"
                            ? `Next booster due: ${rec.next_due_date ? new Date(rec.next_due_date).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' }) : "N/A"}`
                            : (rec.diagnosis ? `Diagnosis: ${rec.diagnosis}${rec.prescribed_by ? ` (by ${rec.prescribed_by})` : ""}` : "Clinical document record");

                          return (
                            <div key={rec.id} className="info-card p-4 rounded-2xl flex items-center gap-4 bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                              <div className={`w-1 h-10 rounded-full ${rec.record_type === 'vaccination' ? 'bg-pink-500' : 'bg-green-500'}`}></div>
                              <div className="flex-1">
                                <div className="flex justify-between items-start">
                                  <p className="font-bold text-gray-850 text-sm capitalize">{title}</p>
                                  <p className="text-[10px] text-gray-400 font-bold uppercase">{dateStr}</p>
                                </div>
                                <p className="text-xs text-gray-500 line-clamp-2 mt-1">{detail}</p>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

            {/* ── REASON FOR VISIT ── */}
            <section className="w-full">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-bold">Reason for Visit</h2>
              {!isEditingReason && (
                <button 
                  id="reason-edit-btn" 
                  onClick={() => {
                    setReasonInput(chiefComplaint);
                    setIsEditingReason(true);
                  }} 
                  className="text-xs font-bold text-brand-pink text-[#ec4899] flex items-center gap-1 hover:underline"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/>
                  </svg>
                  Edit
                </button>
              )}
            </div>
            <div className="info-card rounded-2xl overflow-hidden bg-white border border-gray-200 shadow-sm">
              {!isEditingReason ? (
                /* View mode */
                <div id="reason-view" className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0 mt-0.5">
                      <svg className="h-4 w-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Chief Complaint</p>
                      <p id="reason-text" className="text-sm text-gray-800 leading-relaxed">{chiefComplaint}</p>
                    </div>
                  </div>
                </div>
              ) : (
                /* Edit mode */
                <div id="reason-edit" className="p-4">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">Chief Complaint</p>
                  <textarea 
                    id="reason-input" 
                    rows={3}
                    value={reasonInput}
                    onChange={(e) => setReasonInput(e.target.value)}
                    className="w-full text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:border-brand-pink focus:border-[#ec4899] focus:ring-1 focus:ring-pink-200 leading-relaxed placeholder-gray-300"
                    placeholder="Describe the reason for this visit…"
                  />
                  <div className="flex gap-2 mt-3">
                    <button 
                      onClick={handleCancelReason} 
                      className="flex-1 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleSaveReason} 
                      className="flex-1 py-2 rounded-xl bg-brand-pink bg-[#ec4899] text-white text-sm font-bold hover:bg-pink-600 hover:bg-[#db2777] transition-colors shadow-sm shadow-pink-100"
                    >
                      Save
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ── APPOINTMENT SUMMARY CARD PANEL ── */}
          <section className="w-full">
            <h2 className="text-xl font-bold mb-3 pl-1">Appointment Summary</h2>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
              {/* Card 1: Type */}
              <div className="bg-white border border-gray-250 p-4 rounded-2xl shadow-sm">
                <div className="w-7 h-7 rounded-lg bg-pink-50 flex items-center justify-center text-[#ec4899] mb-2">
                  <Building2 className="w-4 h-4" />
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Type</p>
                <p className="text-sm font-black text-gray-900 mt-0.5 capitalize">
                  {dbVisit?.appointment_type ? `${dbVisit.appointment_type} Visit` : "Clinic Visit"}
                </p>
              </div>

              {/* Card 2: Date */}
              <div className="bg-white border border-gray-250 p-4 rounded-2xl shadow-sm">
                <div className="w-7 h-7 rounded-lg bg-pink-50 flex items-center justify-center text-[#ec4899] mb-2">
                  <Calendar className="w-4 h-4" />
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date</p>
                <p className="text-sm font-black text-gray-900 mt-0.5">
                  {dbVisit?.appointment_date ? (() => {
                    try {
                      const dObj = new Date(dbVisit.appointment_date);
                      return isNaN(dObj.getTime()) ? dbVisit.appointment_date : dObj.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
                    } catch {
                      return dbVisit.appointment_date;
                    }
                  })() : (initialVisit.time?.split(",")[0] || "10 Jun 2026")}
                </p>
              </div>

              {/* Card 3: Time */}
              <div className="bg-white border border-gray-250 p-4 rounded-2xl shadow-sm">
                <div className="w-7 h-7 rounded-lg bg-pink-50 flex items-center justify-center text-[#ec4899] mb-2">
                  <Clock className="w-4 h-4" />
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Time</p>
                <p className="text-sm font-black text-gray-900 mt-0.5">
                  {dbVisit?.appointment_time || (initialVisit.time?.includes(",") ? initialVisit.time.split(",")[1]?.trim() : initialVisit.time) || "02:30 PM - 03:00 PM"}
                </p>
              </div>

              {/* Card 4: Duration */}
              <div className="bg-white border border-gray-250 p-4 rounded-2xl shadow-sm">
                <div className="w-7 h-7 rounded-lg bg-pink-50 flex items-center justify-center text-[#ec4899] mb-2">
                  <Hourglass className="w-4 h-4" />
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Duration</p>
                <p className="text-sm font-black text-gray-900 mt-0.5">30 Minutes</p>
              </div>
            </div>

            {/* Row 3: Booking ID with absolute copying */}
            <div className="bg-white border border-gray-250 p-4 rounded-2xl shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-pink-50 flex items-center justify-center text-[#ec4899] shrink-0">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Booking ID</p>
                  <p className="text-sm font-black text-[#ec4899] mt-0.5 tracking-wide font-mono">
                    {dbVisit?.id || (appointmentId && appointmentId !== "SRV-84721" ? appointmentId : "") || "Loading Booking ID..."}
                  </p>
                </div>
              </div>
              
              <button 
                onClick={handleCopyBookingId}
                className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-700 bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg active:scale-95 transition-all"
              >
                <Copy className="w-3.5 h-3.5" />
                Copy
              </button>
            </div>
          </section>

            {/* ── DR ANAYA DOCTOR PROFILE CARD ── */}
            <section className="w-full">
            <div className="bg-white border border-pink-100 rounded-2xl p-4 shadow-sm" style={{ background: "linear-gradient(135deg, #fff 0%, #fdf2f8 100%)" }}>
              <div className="flex items-center gap-4">
                
                {/* Doctor Avatar + Scalloped Violet verified index */}
                <div className="relative shrink-0">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-md border-2 border-pink-100">
                    <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                      <rect width="64" height="64" fill="#fdf2f8"/>
                      {/* scrubs top */}
                      <path d="M10 64 Q10 44 32 40 Q54 44 54 64Z" fill="#ec4899"/>
                      {/* collar detail */}
                      <path d="M26 40 L32 48 L38 40" fill="#f9a8d4" opacity="0.7"/>
                      {/* neck */}
                      <rect x="27" y="32" width="10" height="10" rx="4" fill="#fdba74"/>
                      {/* head */}
                      <ellipse cx="32" cy="26" rx="13" ry="14" fill="#fdba74"/>
                      {/* hair */}
                      <path d="M19 22 Q20 10 32 10 Q44 10 45 22 Q44 12 32 12 Q20 12 19 22Z" fill="#7c2d12"/>
                      <path d="M19 22 Q17 28 19 32 Q18 24 20 21Z" fill="#7c2d12"/>
                      <path d="M45 22 Q47 28 45 32 Q46 24 44 21Z" fill="#7c2d12"/>
                      {/* bun */}
                      <ellipse cx="32" cy="11" rx="7" ry="5" fill="#7c2d12"/>
                      <circle cx="32" cy="9" r="3" fill="#92400e"/>
                      {/* eyes */}
                      <ellipse cx="26.5" cy="26" rx="2.5" ry="2.8" fill="#1f1f1f"/>
                      <ellipse cx="37.5" cy="26" rx="2.5" ry="2.8" fill="#1f1f1f"/>
                      <circle cx="27.3" cy="25.2" r="1" fill="white"/>
                      <circle cx="38.3" cy="25.2" r="1" fill="white"/>
                      {/* eyebrows */}
                      <path d="M23.5 22.5 Q26.5 21 29.5 22.5" fill="none" stroke="#7c2d12" strokeWidth="1.3" strokeLinecap="round"/>
                      <path d="M34.5 22.5 Q37.5 21 40.5 22.5" fill="none" stroke="#7c2d12" strokeWidth="1.3" strokeLinecap="round"/>
                      {/* nose */}
                      <path d="M30.5 29.5 Q32 31 33.5 29.5" fill="none" stroke="#c2845a" strokeWidth="1.2" strokeLinecap="round"/>
                      {/* smile */}
                      <path d="M27.5 33.5 Q32 37 36.5 33.5" fill="none" stroke="#c2845a" strokeWidth="1.4" strokeLinecap="round"/>
                      {/* cheeks */}
                      <ellipse cx="22" cy="31" rx="4" ry="2.5" fill="#fca5a5" opacity="0.45"/>
                      <ellipse cx="42" cy="31" rx="4" ry="2.5" fill="#fca5a5" opacity="0.45"/>
                      {/* stethoscope */}
                      <path d="M24 44 Q22 52 28 55 Q32 57 36 55 Q42 52 40 44" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                      <circle cx="32" cy="57" r="3" fill="white" opacity="0.8"/>
                    </svg>
                  </div>
                  
                  {/* Verified badge with exact custom image look (scalloped star checkmark icon) */}
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white flex items-center justify-center p-0.5 shadow-sm">
                    <VerifiedBadge className="w-full h-full text-[#9A3EF8]" />
                  </div>
                </div>

                {/* Info block */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-black text-gray-900 text-base leading-tight">
                      {doctorProfile?.profiles?.full_name || doctorProfile?.profiles?.name ? `Dr. ${doctorProfile.profiles.full_name || doctorProfile.profiles.name}` : "Dr. Anaya"}
                    </p>
                    <span className="text-[10px] font-bold bg-pink-100 text-[#ec4899] px-2 py-0.5 rounded-full">BVSc</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 font-semibold">
                    {doctorProfile?.specialization || "Verified Veterinarian"}
                  </p>
                  
                  {/* Star rating and feedback counts */}
                  <div className="flex items-center gap-1.5 mt-1.5 text-slate-400">
                    <div className="flex text-amber-400 shrink-0">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <Star className="w-3.5 h-3.5 fill-current text-amber-200" />
                    </div>
                    <span className="text-[11px] text-gray-800 font-extrabold">
                      {doctorProfile?.average_rating != null ? doctorProfile.average_rating.toFixed(1) : "4.8"}
                    </span>
                    <span className="text-gray-300">·</span>
                    <span className="text-[11px] text-gray-550 font-bold">
                      {doctorProfile?.years_of_experience != null ? `${doctorProfile.years_of_experience}+ yrs exp` : "4+ yrs exp"}
                    </span>
                  </div>
                </div>

                {/* View profile button triggers redirection back to profile details */}
                <button 
                  onClick={() => navigate(vetProfileId ? `/vet/doctor/${vetProfileId}` : `/vet/doctor/any`)}
                  className="shrink-0 flex items-center gap-0.5 text-[#ec4899] text-xs font-black hover:underline"
                >
                  View
                  <ChevronDown className="w-3.5 h-3.5 -rotate-90" />
                </button>
              </div>

              {/* Tag section */}
              <div className="mt-4 pt-3.5 border-t border-pink-100 flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black bg-white border border-gray-100 text-gray-500 px-2.5 py-1 rounded-full shadow-sm">Small Animals</span>
                <span className="text-[10px] font-black bg-white border border-gray-100 text-gray-500 px-2.5 py-1 rounded-full shadow-sm">Home Visits</span>
                <span className="text-[10px] font-black bg-white border border-gray-100 text-gray-500 px-2.5 py-1 rounded-full shadow-sm">Vaccinations</span>
                
                <span className="ml-auto text-[10px] text-green-600 font-black flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block animate-pulse" />
                  Available Now
                </span>
              </div>
            </div>
          </section>

            {/* ── PAYMENT SUMMARY DETAILS ── */}
            <section className="pb-4 w-full">
            <h2 className="text-xl font-bold mb-4 pl-1">Payment Summary</h2>
            <div className="bg-white border border-gray-250 rounded-2xl shadow-sm overflow-hidden flex flex-col">
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600 font-medium">Consultation Fee</p>
                  <p className="text-sm font-bold text-gray-800">₹{paymentDetails?.consultation_fee || dbVisit?.amount || 499}</p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600 font-medium">Night Surcharge</p>
                  <p className="text-sm font-bold text-gray-800">₹{paymentDetails?.night_surcharge || 0}</p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm text-gray-600 font-medium">Platform Fee</p>
                    <span className="text-[10px] font-black bg-green-50 text-green-600 px-1.5 py-0.5 rounded-full border border-green-100">FREE</span>
                  </div>
                  <p className="text-sm font-bold text-gray-400 line-through">₹0</p>
                </div>
              </div>
              
              <div className="mx-4 border-t border-dashed border-gray-200" />
              
              <div className="flex items-center justify-between p-4">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5 font-bold uppercase tracking-wider">Total Paid</p>
                  <p className="text-2xl font-black text-gray-900">₹{paymentDetails?.amount || dbVisit?.amount || 549}</p>
                </div>
                <div className="flex items-center gap-1.5 bg-green-50 border border-green-100 text-green-700 text-xs font-black px-3.5 py-2 rounded-full shadow-inner">
                  <CheckCircle2 className="w-4 h-4 text-green-600" strokeWidth={2.5} />
                  Payment Done
                </div>
              </div>

              {/* Bottom transaction receipt notes */}
              <div className="bg-gray-50 border-t border-gray-100 px-4 py-3.5 flex items-center gap-2">
                <Wallet className="w-4 h-4 text-slate-400" />
                <p className="text-xs text-slate-400">Paid via <span className="font-semibold text-gray-600">{paymentDetails?.payment_id ? `${paymentDetails.payment_method} · ID: ${paymentDetails.payment_id}` : (paymentDetails?.payment_method || "UPI · sarah@okicici")}</span></p>
                <p className="ml-auto text-[10px] text-gray-400 font-mono">{paymentDetails?.created_at || (dbVisit?.created_at ? new Date(dbVisit.created_at).toLocaleDateString("en-IN") : "10 Jun, 1:48 PM")}</p>
              </div>
            </div>
          </section>

          </div>
        </div>

        {/* ── STICKY ACTION BAR ── */}
        <div className="fixed bottom-0 left-0 right-0 w-full px-4 sm:px-6 lg:px-8 py-4 bg-white/80 backdrop-blur-md border-t border-gray-100 z-40 transition-all duration-300">
          {localStorage.getItem("sruvo_user_role") === "vet" ? (
             <>
               <button 
                 onClick={openQRScanner} 
                 className="w-full bg-brand-pink hover:bg-pink-600 bg-[#ec4899] hover:bg-[#db2777] text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-pink-200 transition-all active:scale-[0.98]"
               >
                 <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/>
                 </svg>
                 Scan Client's QR
               </button>
               <p className="text-center text-[11px] text-gray-400 mt-3 flex items-center justify-center gap-1">
                 <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                   <path clipRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" fillRule="evenodd"/>
                 </svg>
                 Scan the user's QR code to begin consultation.
               </p>
             </>
          ) : (
             <>
               <button 
                 onClick={() => setShowUserQr(true)} 
                 className="w-full bg-[#151B32] hover:bg-neutral-800 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-neutral-200 transition-all active:scale-[0.98]"
               >
                 <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"/>
                 </svg>
                 Verify with Vet (Generate QR)
               </button>
               <p className="text-center text-[11px] text-gray-400 mt-3 flex items-center justify-center gap-1">
                 <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                   <path clipRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" fillRule="evenodd"/>
                 </svg>
                 Show this QR at the clinic.
               </p>
             </>
          )}
        </div>

      </main>

      {/* ═══════════════ BUYER GENERATED QR CODE OVERLAY ═══════════════ */}
      {showUserQr && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.85)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }} onClick={() => setShowUserQr(false)}>
           <div className="bg-white p-8 rounded-[32px] flex flex-col items-center justify-center max-w-[320px] w-full mx-auto" onClick={(e) => e.stopPropagation()}>
             <h2 className="text-xl font-black text-[#151B32] mb-1">Check-in QR Code</h2>
             <p className="text-xs text-neutral-500 mb-6 text-center">Ask the veterinarian to scan this QR code.</p>
             <div className="p-4 bg-white border-2 border-neutral-100 rounded-2xl shadow-sm mb-6">
               <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${currentVisitId}`} alt="Generated QR Code" className="w-[200px] h-[200px] object-contain" />
             </div>
             
             <button onClick={() => setShowUserQr(false)} className="w-full bg-neutral-100 text-neutral-700 py-3 rounded-xl font-bold active:scale-95 transition-transform">
                Close Code
             </button>
           </div>
        </div>
      )}

      {/* ═══════════════ DETAILED HELP & SUPPORT VIEW OVERLAY ═══════════════ */}
      {helpScreenOpen && (
        <div className="fixed inset-0 z-50 bg-[#eef0f5] flex flex-col overflow-y-auto animate-fade-in font-sans">
          
          {/* Sticky header */}
          <div className="sticky top-0 bg-[#eef0f5]/85 backdrop-blur-md z-10 padding-top-[52px] px-4 py-4 flex items-center gap-2 border-b border-gray-200/60 mt-8">
            <button 
              onClick={() => setHelpScreenOpen(false)}
              className="p-2 hover:bg-gray-200/50 rounded-full text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-800" strokeWidth={2.5} />
            </button>
            <h1 className="text-xl font-black text-gray-900 ml-1">Help &amp; Support</h1>
          </div>

          <div className="py-6 space-y-6 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8">

            {/* SECTION 1: Active conversations */}
            <div className="px-4">
              <p className="text-[11px] font-black tracking-widest text-gray-400 uppercase mb-3 px-1">Active Conversations</p>
              
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-4.5 py-4">
                  <p className="text-[13px] text-gray-400 font-bold uppercase tracking-wider">General Issues</p>
                </div>
                <div className="border-t border-dashed border-gray-220 mx-4" />
                
                <div className="p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-full bg-orange-400 flex items-center justify-center text-white shrink-0">
                      <User className="w-5 h-5 fill-current" />
                    </div>
                    <p className="text-[15px] font-extrabold text-gray-800 leading-tight flex-1">I have payment and refund<br/>related issues</p>
                  </div>
                  
                  <div className="flex items-center gap-1.5 text-[#16a34a] font-bold text-xs bg-green-50 px-2.5 py-1 rounded-full shrink-0 border border-green-100">
                    <span className="w-1.5 h-1.5 bg-[#16a34a] rounded-full animate-pulse" />
                    <span>Active</span>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2: General FAQ list */}
            <div className="px-4">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-105 divide-y divide-gray-100 overflow-hidden font-bold">
                <div 
                  onClick={() => toast.info("Searching for your order coordinates...")}
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <span className="text-[15px] text-gray-800">I did not receive this order</span>
                  <ChevronDown className="w-5 h-5 text-gray-400 -rotate-90" strokeWidth={2.5} />
                </div>
                <div 
                  onClick={() => toast.info("Refund request is created for validation.")}
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <span className="text-[15px] text-gray-800">I want to return items in my order</span>
                  <ChevronDown className="w-5 h-5 text-gray-400 -rotate-90" strokeWidth={2.5} />
                </div>
                <div 
                  onClick={() => toast.success("Connected with our agent.")}
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <span className="text-[15px] text-gray-800">I have payment and refund related issues</span>
                  <ChevronDown className="w-5 h-5 text-gray-400" strokeWidth={2.5} />
                </div>
              </div>
            </div>

            {/* SECTION 3: Past conversations archives */}
            <div className="px-4">
              <p className="text-[11px] font-black tracking-widest text-gray-400 uppercase mb-3 px-1">Past Conversations</p>
              
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[17px] font-black text-gray-900 leading-tight">Where is my order?</p>
                  <ChevronDown className="w-5 h-5 text-gray-400 -rotate-90" strokeWidth={2.5} />
                </div>
                <div className="border-t border-dashed border-gray-200 my-3.5" />
                <p className="text-xs text-slate-500 font-bold"><span className="text-slate-800 font-black">Opened on: </span>May 10, 2026, 10:30 PM</p>
                <p className="text-xs text-slate-500 font-bold mt-1.5"><span className="text-slate-800 font-black">Closed on: </span>May 10, 2026, 10:36 PM</p>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default ClinicVisitDetails;
