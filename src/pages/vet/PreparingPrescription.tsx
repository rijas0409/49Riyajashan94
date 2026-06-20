/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../../integrations/supabase/client";

const PreparingPrescription = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const appointmentId = location.state?.appointmentId;
  const stateRef = React.useRef(location.state);

  const [appointment, setAppointment] = useState<any>(null);

  useEffect(() => {
    stateRef.current = location.state;
  }, [location.state]);

  useEffect(() => {
    if (appointmentId) {
      const fetchDetails = async () => {
        const { data } = await supabase
          .from("vet_appointments")
          .select("*, vet:profiles!vet_appointments_vet_id_fkey(*), user:profiles!vet_appointments_user_id_fkey(*)")
          .eq("id", appointmentId)
          .maybeSingle();
        if (data) setAppointment(data);
      };
      
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(appointmentId);
      if (isUUID) {
         fetchDetails();
      }
    }
  }, [appointmentId]);

  useEffect(() => {
    // 1. Storage event sync for offline / fast fallback
    const handleStorage = (e: StorageEvent) => {
      if (appointmentId && e.key === `gp_prescription_${appointmentId}`) {
        navigate("/buyer/vet/prescription", { state: { ...stateRef.current, prescriptionData: JSON.parse(e.newValue || "{}") } });
      }
    };
    window.addEventListener("storage", handleStorage);

    // 2. Fallback check for already generated in this session
    if (appointmentId) {
       const existing = localStorage.getItem(`gp_prescription_${appointmentId}`);
       if (existing) {
          navigate("/buyer/vet/prescription", { state: { ...stateRef.current, prescriptionData: JSON.parse(existing) } });
          return;
       }
    }

    // 3. Instant query check on load
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

    // 4. Polling fallback check as secure backup (runs every 2 seconds)
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
    }, 2000);

    // 5. Supabase realtime
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

  const petName = appointment?.pet_name || location.state?.petName || "Luna";
  const vetName = appointment?.vet?.name || "Dr. Vikram Malhotra";
  const vetImage = appointment?.vet?.profile_photo || "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=150&q=80";
  const petBreed = appointment?.pet_breed || "Golden Retriever";
  const petType = appointment?.pet_type || "Dog";

  return (
    <div className="w-full min-h-screen bg-[#F8F9FC] flex flex-col items-center justify-center font-sans absolute inset-0 z-50 animate-in fade-in zoom-in duration-300">
      <div className="w-full max-w-[500px] h-full max-h-[900px] bg-[#F8F9FC] flex flex-col relative sm:rounded-2xl sm:shadow-2xl sm:my-auto sm:border sm:border-gray-100 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center p-6 relative">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50 active:bg-gray-100 transition-colors"
          >
            <i className="ph ph-arrow-left text-lg"></i>
          </button>
          <div className="absolute left-[50%] -translate-x-[50%] font-bold text-gray-900">
            Digital Prescription
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto pb-24 px-5">
          <div className="flex justify-center mb-6 mt-2 relative">
             <div className="w-20 h-20 bg-gradient-to-br from-[#DE54A4] to-[#8A4BFA] rounded-[24px] flex items-center justify-center text-white text-3xl shadow-[0_8px_24px_rgba(138,75,250,0.25)] rotate-[-5deg]">
               <i className="ph-fill ph-file-text"></i>
             </div>
             <div className="absolute -bottom-1 -right-2 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center border text-[#8A4BFA]">
               <i className="ph ph-arrows-clockwise animate-spin text-[16px]"></i>
             </div>
          </div>

          <div className="text-center mb-6">
            <h1 className="text-2xl font-semibold text-gray-400">Preparing Your</h1>
            <h2 className="text-[26px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#DE54A4] to-[#8A4BFA] leading-tight mt-1">
              Digital Prescription
            </h2>
            <p className="text-sm font-medium text-gray-500 mt-4 px-2 leading-relaxed">
              Your vet is finalizing the prescription. Feel free to stay here or leave — we'll notify you as soon as it's ready.
            </p>
          </div>

          <div className="space-y-4">
            {/* Vet Card */}
            <div className="bg-white rounded-[20px] p-5 flex items-center gap-4 shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-[#EFEFF5]">
              <img src={vetImage} alt="Vet" className="w-[60px] h-[60px] rounded-full object-cover shadow-sm bg-gray-50" />
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-[#1E1E24] text-[16px] truncate">{vetName}</h3>
                <p className="text-[#6B7280] text-[13px] font-medium mt-0.5">Senior Veterinarian</p>
                <div className="flex items-center gap-1 mt-2 bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-[10px] font-bold w-fit tracking-wide">
                  <span className="material-symbols-outlined text-[12px]">verified</span>
                  REG ID: VET-88291
                </div>
              </div>
            </div>

            {/* Pet Card */}
            <div className="bg-white rounded-[20px] p-5 flex items-center gap-4 shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-[#EFEFF5]">
              <div className="relative shrink-0">
                <img src={appointment?.user?.profile_photo || "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=150&q=80"} alt="Pet" className="w-[60px] h-[60px] rounded-[16px] object-cover shadow-sm bg-gray-50" />
                <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-[#1E1E24] text-[15px] truncate">Prescription for {petName}</h3>
                <p className="text-[#DE468B] text-[12px] font-bold mt-1 tracking-tight">{petType} • {petBreed}</p>
                <p className="text-[#6B7280] text-[11px] font-medium mt-0.5">3 Years Old • ID: {(appointmentId || "#SRV-9921").slice(-8).toUpperCase()}</p>
                
                <div className="flex gap-1.5 mt-2 overflow-x-auto no-scrollbar">
                  <span className="bg-[#FCE7F3] text-[#DE468B] px-2.5 py-1 rounded-full text-[9px] font-bold tracking-wider shrink-0">
                    CONSULTATION: {(appointment?.appointment_type || location.state?.consultationType || "VIDEO CALL").toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 w-full px-5 pb-8 pt-6 bg-gradient-to-t from-[#F8F9FC] via-[#F8F9FC] to-transparent">
           <button 
             onClick={() => {
               navigate('/buyer/home');
             }}
             className="w-full bg-gradient-to-r from-[#DE54A4] to-[#8A4BFA] text-white font-bold text-[16px] py-4 rounded-[16px] shadow-[0_8px_24px_rgba(138,75,250,0.25)] hover:shadow-[0_12px_28px_rgba(138,75,250,0.35)] hover:-translate-y-0.5 transition-all active:scale-[0.98]"
           >
             Notify Me When Ready
           </button>
        </div>

      </div>
    </div>
  );
};

export default PreparingPrescription;

