/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../../integrations/supabase/client";
import { ArrowLeft, FileText, RefreshCw, CheckCircle2, Bell } from "lucide-react";
import { motion } from "motion/react";

const PreparingPrescription = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const appointmentId = location.state?.appointmentId;
  const stateRef = React.useRef(location.state);

  // Dynamic database states
  const [appointment, setAppointment] = useState<any>(null);
  const [doctorProfile, setDoctorProfile] = useState<any>(null);
  const [isAlertSet, setIsAlertSet] = useState(false);

  useEffect(() => {
    stateRef.current = location.state;
  }, [location.state]);

  // Fetch real appointment details & veterinarian profiles dynamically
  useEffect(() => {
    if (!appointmentId) return;

    const fetchDetails = async () => {
      try {
        const { data: appt, error: apptErr } = await supabase
          .from("vet_appointments")
          .select("*")
          .eq("id", appointmentId)
          .maybeSingle();

        if (appt && !apptErr) {
          setAppointment(appt);

          if (appt.vet_id) {
            let vProfile = null;
            let vProfErr = null;

            // 1. Try to fetch as user_id
            const { data: vProfileByUser, error: vProfByUserErr } = await supabase
              .from("vet_profiles")
              .select("*")
              .eq("user_id", appt.vet_id)
              .maybeSingle();

            if (vProfileByUser) {
              vProfile = vProfileByUser;
            } else {
              // 2. Try to fetch as vet_profile id
              const { data: vProfileById, error: vProfByIdErr } = await supabase
                .from("vet_profiles")
                .select("*")
                .eq("id", appt.vet_id)
                .maybeSingle();
              if (vProfileById) {
                vProfile = vProfileById;
              } else {
                vProfErr = vProfByUserErr || vProfByIdErr;
              }
            }

            if (vProfile) {
              const { data: uProfile } = await supabase
                .from("profiles")
                .select("name, full_name, profile_photo")
                .eq("id", vProfile.user_id)
                .maybeSingle();

              if (uProfile) {
                vProfile.profiles = uProfile;
              }
              setDoctorProfile(vProfile);
            }
          }
        }
      } catch (err) {
        console.error("Error in PreparingPrescription data fetching:", err);
      }
    };

    fetchDetails();
  }, [appointmentId]);

  // Real-time synchronization & database listener pipeline
  useEffect(() => {
    // 1. Local storage event sync for offline / same-system fallback
    const handleStorage = (e: StorageEvent) => {
      if (appointmentId && e.key === `gp_prescription_${appointmentId}`) {
        navigate("/buyer/vet/prescription", {
          state: { ...stateRef.current, prescriptionData: JSON.parse(e.newValue || "{}") }
        });
      }
    };
    window.addEventListener("storage", handleStorage);

    // 2. Early return check for already generated prescriptions
    if (appointmentId) {
      const existing = localStorage.getItem(`gp_prescription_${appointmentId}`);
      if (existing) {
        navigate("/buyer/vet/prescription", {
          state: { ...stateRef.current, prescriptionData: JSON.parse(existing) }
        });
        return;
      }
    }

    // 3. Instant query check on initial page render
    if (appointmentId) {
      const checkImmediately = async () => {
        const { data } = await supabase
          .from("vet_appointments")
          .select("status, medicines, consultation_notes")
          .eq("id", appointmentId)
          .maybeSingle();
        if (data && (data.status === "generated" || data.medicines || data.consultation_notes?.includes("prescription"))) {
          navigate("/buyer/vet/prescription", { state: { ...stateRef.current, dbUpdate: true } });
        }
      };
      checkImmediately();
    }

    // 4. Dynamic low-latency polling (every 1 second for perfect synchronization)
    const pollInterval = setInterval(async () => {
      if (!appointmentId) return;
      const { data } = await supabase
        .from("vet_appointments")
        .select("status, medicines, consultation_notes")
        .eq("id", appointmentId)
        .maybeSingle();
      if (data && (data.status === "generated" || data.medicines || data.consultation_notes?.includes("prescription"))) {
        console.log("BUYER_RECEIVED_GENERATED_EVENT");
        clearInterval(pollInterval);
        console.log("BUYER_NAVIGATED_TO_PRESCRIPTION");
        navigate("/buyer/vet/prescription", { state: { ...stateRef.current, dbUpdate: true } });
      }
    }, 1000);

    // 5. Supabase Postgres changes real-time channel subscription
    let channel: any = null;
    if (appointmentId && appointmentId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      channel = supabase
        .channel(`prescription_prep_${appointmentId}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "vet_appointments",
            filter: `id=eq.${appointmentId}`
          },
          (payload: any) => {
            const up = payload.new;
            if (up.status === 'generated' || up.medicines || up.consultation_notes?.includes('prescription')) {
              console.log("BUYER_RECEIVED_GENERATED_EVENT");
              clearInterval(pollInterval);
              console.log("BUYER_NAVIGATED_TO_PRESCRIPTION");
              navigate("/buyer/vet/prescription", { state: { ...stateRef.current, dbUpdate: true } });
            }
          }
        )
        .subscribe();
    }

    return () => {
      clearInterval(pollInterval);
      if (channel) {
        supabase.removeChannel(channel);
      }
      window.removeEventListener("storage", handleStorage);
    };
  }, [appointmentId, navigate]);

  // Back button compatibility messenger
  const handleBackNavigation = () => {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'GO_BACK' }, '*');
    } else {
      navigate(-1);
    }
  };

  // Back button window message listener
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'GO_BACK') {
        navigate(-1);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [navigate]);

  // Computed visual properties to match the exact public/preparingprescription.html design
  const doctorName = useMemo(() => {
    let name = "Dr. Vikram Malhotra";
    if (doctorProfile?.profiles?.full_name) {
      name = doctorProfile.profiles.full_name;
    } else if (doctorProfile?.profiles?.name) {
      name = doctorProfile.profiles.name;
    }
    if (!name.toLowerCase().startsWith('dr.') && !name.toLowerCase().startsWith('dr ')) {
      return `Dr. ${name}`;
    }
    return name;
  }, [doctorProfile]);

  const doctorSpecialization = useMemo(() => {
    return doctorProfile?.specialization || "Senior Veterinarian";
  }, [doctorProfile]);

  const doctorRegId = useMemo(() => {
    return doctorProfile?.registration_number || "VET-88291";
  }, [doctorProfile]);

  const doctorPhoto = useMemo(() => {
    const rawPath = doctorProfile?.profiles?.profile_photo || 
                    doctorProfile?.profile_photo || 
                    appointment?.vet_image || 
                    appointment?.image || 
                    location.state?.visit?.image || 
                    location.state?.vet?.image || 
                    location.state?.vet?.profile_photo || 
                    location.state?.vetPhoto || 
                    location.state?.doctorPhoto;

    if (rawPath) {
      if (rawPath.startsWith("http")) return rawPath;
      try {
        return supabase.storage.from("avatars").getPublicUrl(rawPath).data.publicUrl;
      } catch (e) {
        return rawPath;
      }
    }
    return "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=150&q=80";
  }, [doctorProfile, appointment, location.state]);

  const petNameValue = useMemo(() => {
    return appointment?.pet_name || location.state?.petName || "Luna";
  }, [appointment, location.state]);

  const petBreedValue = useMemo(() => {
    return appointment?.pet_breed || "Golden Retriever";
  }, [appointment]);

  const petAgeValue = useMemo(() => {
    return appointment?.pet_age || "3 Years Old";
  }, [appointment]);

  const petWeightValue = useMemo(() => {
    // parse weight from consultation_notes JSON if available
    if (appointment?.consultation_notes) {
      try {
        const parsed = JSON.parse(appointment.consultation_notes);
        if (parsed?.petWeight) return `${parsed.petWeight}KG`;
      } catch (e) {
        // Safe fallback
      }
    }
    return "24KG";
  }, [appointment]);

  const visitTypeLabel = useMemo(() => {
    const type = appointment?.appointment_type || "Video Call";
    return type.toUpperCase();
  }, [appointment]);

  const displayShortId = useMemo(() => {
    const getShortBookingId = (id: string | undefined): string => {
      if (!id) return "...";
      const clean = id.replace(/[-]/g, "");
      if (clean.length >= 9) {
        const slice = clean.slice(0, 9);
        return `${slice.slice(0, 4)}-${slice.slice(4, 7)}-${slice.slice(7, 9)}`;
      }
      return id;
    };
    
    if (appointmentId) {
      return `ID: #${getShortBookingId(appointmentId)}`;
    }
    return "ID: #SRV-9921";
  }, [appointmentId]);

  return (
    <div className="w-full min-h-screen bg-[#F8F9FC] text-[#1E1E24] relative font-sans flex flex-col justify-between overflow-x-hidden">
      {/* Upper Navigation Header */}
      <div className="w-full flex items-center px-5 py-6 relative max-w-lg mx-auto">
        <button
          onClick={handleBackNavigation}
          className="w-10 h-10 rounded-full border border-gray-200 bg-white flex items-center justify-center cursor-pointer hover:bg-gray-50 active:scale-95 transition-all text-[#1E1E24] outline-none"
        >
          <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
        </button>
        <span className="flex-grow text-center text-[16px] font-semibold text-[#1E1E24] mr-10">Digital Prescription</span>
      </div>

      {/* Main Content Area */}
      <div className="flex-grow w-full max-w-lg mx-auto px-5 py-5 flex flex-col items-center text-center overflow-y-auto">
        {/* Animated Hero Icon Container */}
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 4, ease: "easeInOut", repeat: Infinity }}
          className="relative my-7 shrink-0"
        >
          <div className="w-[120px] h-[120px] bg-gradient-to-br from-[#DE54A4] to-[#8A4BFA] rounded-[32px] flex justify-center items-center text-white text-[56px] shadow-[0_16px_32px_rgba(138,75,250,0.2)]">
            <FileText className="w-14 h-14" />
          </div>
          <div className="absolute -bottom-2.5 -right-2.5 w-12 h-12 bg-white rounded-full flex justify-center items-center shadow-[0_8px_16px_rgba(0,0,0,0.1)] text-[#8A4BFA] text-[24px]">
            <RefreshCw className="w-[20px] h-[20px] animate-spin" style={{ animationDuration: "2s" }} />
          </div>
        </motion.div>

        {/* Visual Header Text */}
        <div className="mb-4 shrink-0">
          <div className="text-[24px] font-semibold text-[#1E1E24] mb-1">Preparing Your</div>
          <div className="text-[24px] font-bold bg-gradient-to-r from-[#DE54A4] to-[#8A4BFA] bg-clip-text text-transparent">
            Digital Prescription
          </div>
        </div>

        {/* Sub-description statement */}
        <p className="text-[14px] text-[#6B7280] leading-[1.5] mb-2.5 px-2.5 max-w-xs shrink-0">
          {doctorName} is preparing your prescription. It will be available here shortly.
        </p>

        {/* Doctor & Patient detail cards wrappers */}
        <div className="w-full flex flex-col gap-4 mt-4 mb-4">
          {/* dynamic Veterinarian profile information card */}
          <div className="bg-white rounded-[24px] p-4 flex items-center gap-4 shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-[#EFEFF5] text-left w-full">
            <img
              src={doctorPhoto}
              alt={doctorName}
              className="w-[60px] h-[60px] rounded-full object-cover border-2 border-[#FCE7F3]"
            />
            <div className="flex-1 min-w-0">
              <h2 className="text-[16px] font-bold mb-1 text-[#1E1E24]">{doctorName}</h2>
              <p className="text-[#6B7280] text-[12px] font-semibold mb-0.5">{doctorSpecialization}</p>
              <div className="text-[#9CA3AF] text-[11px] flex items-center gap-1 font-medium">
                {/* Visual verified inline badge matching styling perfectly */}
                <svg className="w-3.5 h-3.5 text-[#DE468B]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23 12l-2.44-2.79.34-3.69-3.61-.82-1.89-3.2L12 2.96 8.6 1.5 6.71 4.7l-3.61.81.34 3.68L1 12l2.44 2.79-.34 3.69 3.61.82 1.89 3.2L12 21.04l3.4 1.46 1.89-3.2 3.61-.82-.34-3.69L23 12zm-12.91 4.72l-3.8-3.81 1.48-1.48 2.32 2.33 5.85-5.87 1.48 1.48-7.33 7.35z"/>
                </svg>
                REG ID: {doctorRegId}
              </div>
            </div>
          </div>

          {/* dynamic Pet / Patient profile information card */}
          <div className="bg-white rounded-[24px] p-4 flex items-center gap-3.5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-[#EFEFF5] text-left w-full">
            <div className="relative shrink-0">
              <img
                src="https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=150&q=80"
                alt={petNameValue}
                className="w-[74px] h-[74px] rounded-full object-cover border-2 border-[#DE468B] p-[2px]"
              />
              <div className="absolute bottom-0.5 right-0.5 w-[14px] h-[14px] bg-[#10B981] border-[2.5px] border-white rounded-full" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-[#1E1E24] text-[17px] font-bold mb-0.5 truncate">Prescription for {petNameValue}</h2>
              <div className="text-[#DE468B] text-[12px] font-semibold mb-1">
                {appointment?.pet_type ? `${appointment.pet_type} • ` : "Dog • "}{petBreedValue}
              </div>
              <p className="text-[#6B7280] text-[12px] mb-0.5 font-medium">{petAgeValue} • {displayShortId}</p>
              <div className="flex gap-1.5 mt-2 overflow-x-auto scrollbar-none">
                <span className="px-2.5 py-1.5 rounded-[12px] text-[9px] font-bold tracking-[0.5px] whitespace-nowrap bg-[#FCE7F3] text-[#DE468B]">
                  CONSULTATION: {visitTypeLabel}
                </span>
                <span className="px-2.5 py-1.5 rounded-[12px] text-[9px] font-bold tracking-[0.5px] whitespace-nowrap bg-[#F0F0F5] text-[#6B7280]">
                  WEIGHT: {petWeightValue}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Sticky Alert Setup Buttons */}
      <div className="p-5 w-full max-w-lg mx-auto shrink-0">
        <motion.button
          onClick={() => {
            navigate("/buyer/vet", { replace: true });
          }}
          whileTap={{ scale: 0.98 }}
          className="w-full p-[18px] rounded-[16px] text-white font-semibold text-[16px] shadow-[0_8px_24px_rgba(138,75,250,0.25)] flex items-center justify-center gap-2 outline-none transition-all"
          style={{
            background: isAlertSet ? '#10B981' : 'linear-gradient(135deg, #DE54A4 0%, #8A4BFA 100%)',
            boxShadow: isAlertSet ? '0 8px 24px rgba(16, 185, 129, 0.25)' : '0 8px 24px rgba(138, 75, 250, 0.25)'
          }}
        >
          {isAlertSet ? (
            <>
              <CheckCircle2 className="w-5 h-5 text-white" />
              <span>Alert Set</span>
            </>
          ) : (
            <>
              <Bell className="w-4.5 h-4.5" />
              <span>Notify Me When Ready</span>
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
};

export default PreparingPrescription;
