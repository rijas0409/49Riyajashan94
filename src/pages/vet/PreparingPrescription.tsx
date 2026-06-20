import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../../integrations/supabase/client";

const PreparingPrescription = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const appointmentId = location.state?.appointmentId;

  useEffect(() => {
    // 1. Storage event sync for offline / fast fallback
    const handleStorage = (e: StorageEvent) => {
      if (appointmentId && e.key === `gp_prescription_${appointmentId}`) {
        navigate("/buyer/vet/prescription", { state: { ...location.state, prescriptionData: JSON.parse(e.newValue || "{}") } });
      }
    };
    window.addEventListener("storage", handleStorage);

    // 2. Fallback check for already generated in this session
    if (appointmentId) {
       const existing = localStorage.getItem(`gp_prescription_${appointmentId}`);
       if (existing) {
          navigate("/buyer/vet/prescription", { state: { ...location.state, prescriptionData: JSON.parse(existing) } });
       }
    }

    // 3. Supabase realtime
    if (appointmentId && appointmentId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      const channel = supabase
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
                // To avoid string parse issues, just redirect to the page
                navigate("/buyer/vet/prescription", { state: { ...location.state, dbUpdate: true } });
            }
          }
        )
        .subscribe();
      return () => {
        supabase.removeChannel(channel);
        window.removeEventListener("storage", handleStorage);
      };
    }

    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, [appointmentId, navigate, location.state]);

  // legacy handle message for backwards compat with whatever was in html
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

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', backgroundColor: '#E5E7EB' }}>
      <iframe 
        src="/preparingprescription.html" 
        style={{ width: '100%', height: '100%', border: 'none', display: 'block', transform: 'translateZ(0)' }} 
        title="Preparing Prescription"
        loading="eager"
      />
    </div>
  );
};

export default PreparingPrescription;
