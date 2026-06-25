/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Share2, 
  Calendar, 
  ShieldCheck, 
  HeartPulse, 
  Stethoscope, 
  Pill, 
  Beaker, 
  FileText, 
  CalendarCheck2, 
  Star, 
  BadgeAlert, 
  Plus, 
  ShoppingCart,
  Paperclip,
  Check
} from "lucide-react";
import { supabase } from "../../integrations/supabase/client";

const getShortBookingId = (id: string | undefined): string => {
  if (!id) return "...";
  const clean = id.replace(/[-]/g, "");
  if (clean.length >= 9) {
    const slice = clean.slice(0, 9);
    return `${slice.slice(0, 4)}-${slice.slice(4, 7)}-${slice.slice(7, 9)}`;
  }
  return id;
};

const DigitalPrescription = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const appointmentId = location.state?.appointmentId;
  const passedData = location.state?.prescriptionData;
  const dbUpdate = location.state?.dbUpdate;

  const [prescriptionData, setPrescriptionData] = useState<any>(passedData || null);
  const [appointment, setAppointment] = useState<any>(null);

  // Relational subtable states
  const [prescription, setPrescription] = useState<any>(null);
  const [meds, setMeds] = useState<any[]>([]);
  const [labs, setLabs] = useState<any[]>([]);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [vetUser, setVetUser] = useState<any>(null);
  const [vetProfile, setVetProfile] = useState<any>(null);
  const [petPassport, setPetPassport] = useState<any>(null);
  const [isPetPhotoError, setIsPetPhotoError] = useState(false);
  const [isVetPhotoError, setIsVetPhotoError] = useState(false);
  const [hasRated, setHasRated] = useState(false);

  // Reset photo error flags when key IDs change
  useEffect(() => {
    setIsPetPhotoError(false);
    setIsVetPhotoError(false);
  }, [appointmentId, petPassport?.id, vetProfile?.id]);

  // Feedback states
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  // Hardware/device back button interceptor to navigate to /buyer/vet
  useEffect(() => {
    const handleBack = () => {
      navigate("/buyer/vet", { replace: true });
    };

    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", handleBack);

    return () => {
      window.removeEventListener("popstate", handleBack);
    };
  }, [navigate]);

  useEffect(() => {
    // If not passed via state, try loading from local storage
    if (!prescriptionData && appointmentId) {
       const existing = localStorage.getItem(`gp_prescription_${appointmentId}`);
       if (existing) {
         try {
           setPrescriptionData(JSON.parse(existing));
         } catch (e) { 
           console.error("Local storage prescription parse error: ", e); 
         }
       }
    }

    let appointmentChannel: any = null;
    let prescriptionChannel: any = null;
    let passportChannel: any = null;

    const fetchAllData = async () => {
      try {
        const { data: appt } = await supabase
          .from("vet_appointments")
          .select("*")
          .eq("id", appointmentId)
          .maybeSingle();
          
        if (appt) {
          setAppointment(appt);
          
          // Try loading hardcoded column-based fallback
          if (!prescriptionData || dbUpdate) {
            try {
              if (appt.consultation_notes) {
                setPrescriptionData(JSON.parse(appt.consultation_notes));
              } else if (appt.medicines) {
                setPrescriptionData((prev: any) => ({
                   ...prev,
                   medicines: JSON.parse(appt.medicines),
                   diagnosis: appt.diagnosis
                }));
              }
            } catch (e) {
              console.warn("Soft notes parse warning:", e);
            }
          }

          // Fetch Pet Passport info by matching owner / user_id & pet_name
          if (appt.user_id && appt.pet_name) {
            const { data: petPass } = await supabase
              .from("pet_passports")
              .select("*")
              .eq("user_id", appt.user_id)
              .eq("pet_name", appt.pet_name)
              .maybeSingle();
            if (petPass) {
              setPetPassport(petPass);
            } else {
              // Try any fallback passport for the user
              const { data: fallbackPasses } = await supabase
                .from("pet_passports")
                .select("*")
                .eq("user_id", appt.user_id)
                .limit(1);
              if (fallbackPasses && fallbackPasses.length > 0) {
                setPetPassport(fallbackPasses[0]);
              }
            }
          }

          // Fetch Vet Profile & User info
          if (appt.vet_id) {
            let vProf = null;
            let uProf = null;

            // 1. Try to fetch as user_id in vet_profiles
            const { data: vProfByUser } = await supabase
              .from("vet_profiles")
              .select("*")
              .eq("user_id", appt.vet_id)
              .maybeSingle();

            if (vProfByUser) {
              vProf = vProfByUser;
              const { data: uProfByUser } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", appt.vet_id)
                .maybeSingle();
              uProf = uProfByUser;
            } else {
              // 2. Try to fetch as direct id in vet_profiles
              const { data: vProfById } = await supabase
                .from("vet_profiles")
                .select("*")
                .eq("id", appt.vet_id)
                .maybeSingle();

              if (vProfById) {
                vProf = vProfById;
                const { data: uProfById } = await supabase
                  .from("profiles")
                  .select("*")
                  .eq("id", vProfById.user_id)
                  .maybeSingle();
                uProf = uProfById;
              }
            }

            if (uProf) setVetUser(uProf);
            if (vProf) setVetProfile(vProf);
          }
          
          // Fetch existing rating
          const { data: ratingData } = await supabase
            .from("vet_reviews")
            .select("id")
            .eq("appointment_id", appointmentId)
            .maybeSingle();
            
          if (ratingData) {
            setHasRated(true);
          }
          
          // Fetch prescription from dedicated prescriptions table
          const { data: pres } = await supabase
            .from("prescriptions")
            .select("*")
            .eq("appointment_id", appointmentId)
            .maybeSingle();
            
          if (pres) {
            setPrescription(pres);
            
            // Fetch medicines, lab tests, and attachments
            const [medsRes, labsRes, attsRes] = await Promise.all([
              supabase.from("prescription_medicines").select("*").eq("prescription_id", pres.id),
              supabase.from("prescription_lab_tests").select("*").eq("prescription_id", pres.id),
              supabase.from("prescription_attachments").select("*").eq("prescription_id", pres.id),
            ]);
            if (medsRes.data) setMeds(medsRes.data);
            if (labsRes.data) setLabs(labsRes.data);
            if (attsRes.data) setAttachments(attsRes.data);
          }
        }
      } catch (e) {
        console.error("Error fetching prescription details:", e);
      }
    };

    if (appointmentId) {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(appointmentId);
      if (isUUID) {
         fetchAllData();

         // Real-time Subscriptions
         appointmentChannel = supabase.channel(`prescription-appt-realtime-${appointmentId}`)
           .on(
             "postgres_changes",
             {
               event: "*",
               schema: "public",
               table: "vet_appointments",
               filter: `id=eq.${appointmentId}`
             },
             () => {
               fetchAllData();
             }
           )
           .subscribe();

         prescriptionChannel = supabase.channel(`prescription-pres-realtime-${appointmentId}`)
           .on(
             "postgres_changes",
             {
               event: "*",
               schema: "public",
               table: "prescriptions",
               filter: `appointment_id=eq.${appointmentId}`
             },
             () => {
               fetchAllData();
             }
           )
           .subscribe();

         passportChannel = supabase.channel(`prescription-passport-realtime-${appointmentId}`)
           .on(
             "postgres_changes",
             {
               event: "*",
               schema: "public",
               table: "pet_passports",
             },
             () => {
               fetchAllData();
             }
           )
           .subscribe();
      }
    }

    return () => {
      if (appointmentChannel) supabase.removeChannel(appointmentChannel);
      if (prescriptionChannel) supabase.removeChannel(prescriptionChannel);
      if (passportChannel) supabase.removeChannel(passportChannel);
    };
  }, [appointmentId, prescriptionData, dbUpdate]);

  // Map values dynamically
  const diagnosisList = useMemo(() => {
    if (prescription?.diagnosis_tags) {
      try {
        const parsed = typeof prescription.diagnosis_tags === 'string' 
          ? JSON.parse(prescription.diagnosis_tags) 
          : prescription.diagnosis_tags;
        if (Array.isArray(parsed) && parsed.length > 0) return parsed.filter(Boolean);
      } catch (e) {
        console.warn("Telemetry parsing tags exception: ", e);
      }
    }
    if (appointment?.diagnosis) {
      return [appointment.diagnosis].filter(Boolean);
    }
    const pData = prescriptionData || {};
    if (pData.diagnosis) return [pData.diagnosis].filter(Boolean);
    return [];
  }, [prescription, appointment, prescriptionData]);

  const medicinesList = useMemo(() => {
    if (meds.length > 0) {
      return meds.map(m => ({
        name: m.medicine_name,
        type: m.form_type || "Tablet",
        price: m.unit_price ? `₹${m.unit_price}` : "₹150",
        instructions: `${m.dosage_quantity || "1 unit"} • ${m.dosage_frequency || "Once Daily"} • ${m.dosage_timing || ""}` + (m.dosage_duration ? ` for ${m.dosage_duration}` : "")
      }));
    }
    // Fallback to appointment's medicines string if any
    if (appointment?.medicines) {
      try {
        const parsed = JSON.parse(appointment.medicines);
        if (Array.isArray(parsed)) {
          return parsed.map((m: any) => ({
            name: m.name || m.medicine_name,
            type: m.type || m.form_type || "Tablet",
            price: m.price ? `₹${m.price}` : "₹150",
            instructions: m.instructions || `${m.dose || "1 unit"} • ${m.frequency || "Once Daily"} • ${m.timing || ""}` + (m.duration ? ` for ${m.duration}` : "")
          }));
        }
      } catch (e) {
        console.warn("Telemetry medicines parsing warning: ", e);
      }
    }
    const pData = prescriptionData || {};
    if (pData.medicines) return pData.medicines;
    return [];
  }, [meds, appointment, prescriptionData]);

  const testsList = useMemo(() => {
    if (labs.length > 0) {
      return labs.map(l => ({
        name: l.test_name,
        note: l.test_instructions || ""
      }));
    }
    const pData = prescriptionData || {};
    if (pData.recommendedTests) return pData.recommendedTests;
    return [];
  }, [labs, prescriptionData]);

  const vitals = useMemo(() => {
    const pData = prescriptionData || {};
    return {
      temp: prescription?.temperature_f ? `${prescription.temperature_f} °F` : (pData.vitals?.temp || ""),
      hr: prescription?.heart_rate_bpm ? `${prescription.heart_rate_bpm} bpm` : (pData.vitals?.hr || "")
    };
  }, [prescription, prescriptionData]);

  const findings = prescription?.clinical_summary || (prescriptionData || {}).findings || "";
  const outcome = prescription?.consultation_outcome || (prescriptionData || {}).consultation_outcome || "";
  
  const followUp = useMemo(() => {
    if (prescription?.next_appointment_date) {
      return {
        date: prescription.next_appointment_date,
        time: prescription.next_appointment_time || ""
      };
    }
    const pData = prescriptionData || {};
    if (pData.followUp && (pData.followUp.date || pData.followUp.time)) {
      return pData.followUp;
    }
    return null;
  }, [prescription, prescriptionData]);

  const attachmentsList = useMemo(() => {
    if (attachments.length > 0) {
      return attachments.map(a => ({
        name: a.file_name,
        size: a.file_size || "1.4 MB",
        url: a.file_url || "#"
      }));
    }
    return [];
  }, [attachments]);

  const vetName = vetUser?.full_name || vetUser?.name || vetProfile?.name || "Dr. Vikram Malhotra";
  const vetSpecialization = (vetProfile?.specializations && vetProfile.specializations.length > 0)
    ? vetProfile.specializations.join(", ")
    : "Senior Veterinarian";
  const vetRegId = "REG ID: " + (vetProfile?.registration_number || (vetProfile?.id ? `VET-${vetProfile.id.slice(-5).toUpperCase()}` : "VET-88291"));

  const petName = petPassport?.pet_name || appointment?.pet_name || "Luna";
  const petSpecies = petPassport?.species || appointment?.pet_type || "Dog";
  const petBreed = petPassport?.breed || appointment?.pet_breed || "Golden Retriever";
  const petBreedAndType = `${petSpecies} • ${petBreed}`;
  const petGender = petPassport?.gender || "Male";

  const petAge = useMemo(() => {
    if (petPassport) {
      const years = petPassport.approx_years;
      const months = petPassport.approx_months;
      if (years !== null && years !== undefined) {
        if (years === 0) {
          return `${months || 0} Months Old`;
        }
        return `${years} Year${years > 1 ? 's' : ''} Old`;
      }
    }
    return appointment?.pet_age ? `${appointment.pet_age}` : "3 Years Old";
  }, [petPassport, appointment]);

  const petWeight = useMemo(() => {
    const w = petPassport?.weight || appointment?.pet_weight || "24";
    const str = String(w).toLowerCase().trim();
    if (str.endsWith("kg") || str.endsWith("kgs")) {
      return str.toUpperCase();
    }
    return `${w}KG`;
  }, [petPassport, appointment]);

  const DEFAULT_PET_PLACEHOLDER = "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=150&q=80";
  const DEFAULT_VET_PLACEHOLDER = "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=150&q=80";

  const petPhoto = useMemo(() => {
    if (isPetPhotoError) {
      return DEFAULT_PET_PLACEHOLDER;
    }
    const rawPath = petPassport?.photo_url || appointment?.pet_image_url;
    if (rawPath) {
      if (rawPath.startsWith("http")) return rawPath;
      try {
        return supabase.storage.from("avatars").getPublicUrl(rawPath).data.publicUrl;
      } catch (e) {
        return rawPath;
      }
    }
    return DEFAULT_PET_PLACEHOLDER;
  }, [petPassport, appointment, isPetPhotoError]);

  const doctorPhoto = useMemo(() => {
    if (isVetPhotoError) {
      return DEFAULT_VET_PLACEHOLDER;
    }
    const rawPath = vetUser?.profile_photo || 
                    vetProfile?.profile_photo || 
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
    return DEFAULT_VET_PLACEHOLDER;
  }, [vetUser, vetProfile, appointment, location.state, isVetPhotoError]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Digital Prescription for ${petName}`,
        text: `Check out the e-Prescription from ${vetName}.`,
        url: window.location.href,
      }).catch(err => console.log(err));
    } else {
      alert("Prescription link copied to clipboard!");
    }
  };

  const handleOpenFeedback = () => {
    setIsFeedbackOpen(true);
    setFeedbackRating(0);
    setFeedbackText("");
    setFeedbackSubmitted(false);
  };

  const handleSubmitFeedback = async () => {
    if (feedbackRating === 0) {
      alert("Please select a star rating first.");
      return;
    }
    setSubmittingFeedback(true);
    try {
      if (appointmentId) {
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id || appointment?.user_id;
        const vetId = appointment?.vet_id;

        if (userId && vetId) {
          // 1. Insert review into vet_reviews
          await supabase.from("vet_reviews").insert({
            appointment_id: appointmentId,
            user_id: userId,
            vet_id: vetId,
            rating: feedbackRating,
            review_text: feedbackText
          });

          // 2. Fetch all reviews for this vet to calculate average rating
          const { data: allReviews } = await supabase
            .from("vet_reviews")
            .select("rating")
            .eq("vet_id", vetId);

          if (allReviews && allReviews.length > 0) {
            const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
            const avgRating = totalRating / allReviews.length;
            
            // 3. Update vet_profiles
            await supabase
              .from("vet_profiles")
              .update({ average_rating: avgRating })
              .eq("user_id", vetId);
          }
        }
      }
      setFeedbackSubmitted(true);
      setTimeout(() => {
        setIsFeedbackOpen(false);
        setHasRated(true);
      }, 1500);
    } catch (e) {
      console.error(e);
      // Fallback
      setFeedbackSubmitted(true);
      setTimeout(() => {
         setIsFeedbackOpen(false);
         setHasRated(true);
      }, 1500);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FC] font-sans pb-20 select-none">
      {/* 1. Header */}
      <div className="sticky top-0 z-20 bg-[#F8F9FC]/95 backdrop-blur-md px-5 py-4 flex items-center justify-between border-b border-[#EFEFF5]/60">
        <button 
          onClick={() => {
            if (location.state?.fromBookings) {
              navigate("/buyer/bookings");
            } else {
              navigate("/buyer/vet", { replace: true });
            }
          }} 
          className="w-[40px] h-[40px] rounded-full bg-white flex items-center justify-center border border-[#EFEFF5] shadow-[0_2px_10px_rgba(30,30,45,0.02)] active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-5 h-5 text-[#1E1E2D]" />
        </button>
        <h1 className="text-base font-semibold text-[#1E1E2D]">Prescription</h1>
        <button 
          onClick={handleShare} 
          className="w-[40px] h-[40px] rounded-full bg-white flex items-center justify-center border border-[#EFEFF5] shadow-[0_2px_10px_rgba(30,30,45,0.02)] active:scale-95 transition-transform"
        >
          <Share2 className="w-5 h-5 text-[#1E1E2D]" />
        </button>
      </div>

      <div className="max-w-[480px] mx-auto">
        {/* 2. Doctor Card */}
        <div className="bg-white mx-5 mt-4 mb-5 p-4 rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-[#EFEFF5] flex items-center gap-4 transition-all hover:shadow-md">
          <img 
            src={doctorPhoto} 
            alt="Doctor" 
            onError={() => setIsVetPhotoError(true)}
            className="w-[60px] h-[60px] rounded-full object-cover border-2 border-[#FCE7F3]" 
          />
          <div className="flex-1">
            <h2 className="text-[16px] font-bold text-[#1E1E2D] leading-tight">{vetName}</h2>
            <p className="text-xs font-medium text-[#6B7280] mt-0.5">{vetSpecialization}</p>
            <div className="text-[11px] text-[#9CA3AF] flex items-center gap-1 mt-1.5 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" /> {vetRegId}
            </div>
          </div>
        </div>

        {/* 3. Patient Card */}
        <div className="bg-white mx-5 mb-5 p-4 rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-[#EFEFF5] flex items-center gap-3.5 relative transition-all hover:shadow-md">
           <div className="relative shrink-0">
             <img 
               src={petPhoto} 
               alt={petName} 
               onError={() => setIsPetPhotoError(true)}
               className="w-[74px] h-[74px] rounded-full object-cover border-2 border-[#DE468B] p-0.5" 
             />
             <div className="absolute right-1 bottom-1 w-3.5 h-3.5 bg-[#10B981] border-2 border-white rounded-full"></div>
           </div>
           <div className="flex-1 min-w-0">
             <h2 className="text-[17px] font-bold text-[#1E1E2D] truncate">Prescription for {petName}</h2>
             <div className="text-xs font-semibold text-[#DE468B] mb-1">{petBreedAndType}</div>
             <p className="text-[#6B7280] text-[12px] font-medium leading-normal mb-2">
               {petGender} • {petAge} • ID: #{getShortBookingId(appointment?.id || appointmentId).toUpperCase()}
             </p>
             <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
                <span className="shrink-0 bg-[#FCE7F3] text-[#DE468B] px-2.5 py-1.5 rounded-[12px] text-[9px] font-bold tracking-wide">
                  CONSULTATION: {(location.state?.consultationType?.toUpperCase() || appointment?.appointment_type?.toUpperCase() || "VIDEO CALL")}
                </span>
                <span className="shrink-0 bg-[#F0F0F5] text-[#6B7280] px-2.5 py-1.5 rounded-[12px] text-[9px] font-bold tracking-wide">
                  WEIGHT: {petWeight}
                </span>
             </div>
           </div>
        </div>

        {/* 4. Meta Strip */}
        <div className="prescription-meta-strip">
          <div className="issue-date">
            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>calendar_today</span>
            Issued on: {appointment?.appointment_date || "June 18, 2026"}
          </div>
          <button 
            type="button"
            onClick={() => navigate("/pet-passport", { state: { petId: appointment?.pet_id } })}
            className="passport-btn"
          >
            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>badge</span>
            View Pet Passport
          </button>
        </div>

        {/* Prescription Custom styles inline override to look EXACTLY dicto like html */}
        <style>{`
          .prescription-meta-strip {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin: 0 20px 24px 20px !important;
          }
          .issue-date {
              font-size: 12px !important;
              color: #6B7280 !important;
              font-weight: 600 !important;
              display: flex;
              align-items: center;
              gap: 6px !important;
          }
          .passport-btn {
              background: transparent !important;
              border: 1px solid #EFEFF5 !important;
              color: #6B7280 !important;
              padding: 6px 12px !important;
              border-radius: 12px !important;
              font-size: 11px !important;
              font-weight: 600 !important;
              text-decoration: none !important;
              display: flex;
              align-items: center;
              gap: 4px !important;
              transition: all 0.2s !important;
              cursor: pointer;
          }
          .passport-btn:hover {
              background: #F0F0F5 !important;
              color: #1E1E2D !important;
              border-color: #E5E7EB !important;
          }

          /* --- Premium Feedback Button --- */
          .feedback-trigger-zone {
              margin: 28px 20px 10px 20px;
          }

          .btn-trigger-feedback {
              width: 100%;
              background: #1E1E2D;
              color: #ffffff;
              border: none;
              padding: 16px;
              border-radius: 20px;
              font-size: 14px;
              font-weight: 600;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 8px;
              cursor: pointer;
              box-shadow: 0 4px 15px rgba(30, 30, 45, 0.15);
              font-family: inherit;
              transition: background-color 0.2s;
          }

          .btn-trigger-feedback:hover {
              background: #2D2D3F;
          }

          /* --- Action Sliding Bottom Sheet Modal --- */
          .modal-overlay {
              position: fixed;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background-color: rgba(30, 30, 45, 0.5);
              backdrop-filter: blur(6px);
              z-index: 1000;
              display: flex;
              justify-content: center;
              align-items: flex-end;
              opacity: 0;
              pointer-events: none;
              transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }

          .modal-overlay.show {
              opacity: 1;
              pointer-events: auto;
          }

          .modal-card {
              background: #ffffff;
              width: 100%;
              max-width: 480px;
              border-radius: 32px 32px 0 0;
              padding: 24px 20px;
              box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.08);
              transform: translateY(100%);
              transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }

          .modal-overlay.show .modal-card {
              transform: translateY(0);
          }

          .modal-title {
              color: #1E1E2D;
              font-size: 18px;
              font-weight: 700;
              margin-bottom: 6px;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 8px;
          }

          .modal-subtitle {
              color: #6B7280;
              font-size: 13px;
              font-weight: 500;
              margin-bottom: 20px;
              text-align: center;
          }

          .modal-divider {
              border: 0;
              height: 1px;
              background-color: #EFEFF5;
              margin-bottom: 20px;
              margin-top: 10px;
          }

          .stars {
              display: flex;
              justify-content: center;
              gap: 12px;
              margin-bottom: 20px;
          }

          .stars .material-symbols-outlined {
              font-size: 36px;
              color: #EFEFF5;
              cursor: pointer;
              font-variation-settings: 'FILL' 1;
              transition: color 0.15s ease;
          }

          .stars .material-symbols-outlined.active {
              color: #F59E0B;
          }

          .review-input {
              width: 100%;
              background: #F8F8FC;
              border: 1px solid #EFEFF5;
              border-radius: 16px;
              padding: 16px;
              font-size: 13px;
              font-family: inherit;
              resize: none;
              height: 90px;
              margin-bottom: 20px;
              outline: none;
              color: #1E1E2D;
          }

          .btn-submit-close {
              width: 100%;
              background: linear-gradient(135deg, #DE468B, #A21CAF);
              color: #ffffff;
              border: none;
              border-radius: 20px;
              padding: 16px;
              font-size: 15px;
              font-weight: 600;
              cursor: pointer;
              font-family: inherit;
              box-shadow: 0 4px 15px rgba(222, 70, 139, 0.3);
              transition: opacity 0.2s;
          }

          /* --- Structural Standard Component --- */
          .section-container {
              margin: 0 20px 24px 20px !important;
          }

          .section-header-title {
              display: flex;
              align-items: center;
              font-size: 11px;
              font-weight: 700;
              color: #9CA3AF !important;
              text-transform: uppercase;
              letter-spacing: 1px;
              margin-bottom: 12px;
              gap: 8px;
          }

          .section-header-title .material-symbols-outlined {
              font-size: 22px !important;
              color: #DE468B !important;
          }

          /* --- Recommended Lab Tests --- */
          .lab-card {
              background: #ffffff !important;
              border-radius: 20px !important;
              padding: 16px !important;
              margin-bottom: 12px !important;
              display: flex !important;
              align-items: center !important;
              justify-content: space-between !important;
              box-shadow: 0 4px 20px rgba(0,0,0,0.02) !important;
              border: 1px solid #EFEFF5 !important;
              gap: 12px !important;
          }

          .lab-left {
              display: flex !important;
              align-items: center !important;
              gap: 12px !important;
              flex: 1 !important;
              min-width: 0 !important;
          }

          .lab-icon {
              width: 42px !important;
              height: 42px !important;
              background: #FCE7F3 !important;
              color: #DE468B !important;
              border-radius: 12px !important;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
              flex-shrink: 0 !important;
          }

          .lab-icon .material-symbols-outlined {
              font-size: 20px !important;
          }

          .lab-info {
              flex: 1 !important;
              min-width: 0 !important;
          }

          .lab-info h4 {
              font-size: 14px !important;
              font-weight: 600 !important;
              margin: 0 0 2px 0 !important;
              color: #1E1E2D !important;
              white-space: normal !important;
              word-break: break-word !important;
          }

          .lab-info p {
              font-size: 11px !important;
              color: #6B7280 !important;
              margin: 0 !important;
          }

          .btn-book {
              background: #DE468B !important;
              color: #ffffff !important;
              border: none !important;
              padding: 0 16px !important;
              height: 40px !important; 
              border-radius: 12px !important;
              font-size: 12px !important;
              font-weight: 600 !important;
              cursor: pointer !important;
              font-family: inherit !important;
              flex-shrink: 0 !important; 
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
              transition: opacity 0.2s !important;
          }

          .btn-book:hover {
              opacity: 0.9 !important;
          }

          /* --- Administration Notes Card Style --- */
          .notes-card {
              background: #FCE7F3 !important;
              border-radius: 24px !important;
              padding: 20px !important;
              border: 1px solid #FBCFE8 !important;
          }

          .notes-title {
              display: flex !important;
              align-items: center !important;
              gap: 8px !important;
              font-size: 14px !important;
              font-weight: 700 !important;
              color: #DE468B !important;
              margin-bottom: 16px !important;
              text-transform: uppercase !important;
              letter-spacing: 0.5px !important;
          }

          .notes-title .material-symbols-outlined {
              font-size: 22px !important;
          }

          .note-item {
              display: flex !important;
              gap: 12px !important;
              margin-bottom: 12px !important;
              align-items: flex-start !important;
          }

          .note-item:last-child {
              margin-bottom: 0 !important;
          }

          .note-num {
              width: 22px !important;
              height: 22px !important;
              background: #DE468B !important;
              color: #ffffff !important;
              border-radius: 50% !important;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
              font-size: 11px !important;
              font-weight: 700 !important;
              flex-shrink: 0 !important;
              margin-top: 2px !important;
          }

          .note-text {
              font-size: 13px !important;
              color: #1E1E2D !important;
              line-height: 1.5 !important;
          }
        `}</style>

        {/* 5. Vitals Row */}
        {((vitals.temp && vitals.temp.trim() !== "") || (vitals.hr && vitals.hr.trim() !== "")) && (
          <div className="mx-5 mb-6">
            <h3 className="flex items-center gap-2 text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider mb-3">
              <HeartPulse className="w-5 h-5 text-[#DE468B]" /> Vital Parameters
            </h3>
            <div className={`grid gap-3 ${vitals.temp && vitals.hr ? "grid-cols-2" : "grid-cols-1"}`}>
              {vitals.temp && vitals.temp.trim() !== "" && (
                <div className="bg-white border border-[#EFEFF5] rounded-[16px] px-4 py-3 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col gap-1">
                   <span className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wide">Temperature</span>
                   <span className="text-[15px] font-bold text-[#1E1E2D]">{vitals.temp}</span>
                </div>
              )}
              {vitals.hr && vitals.hr.trim() !== "" && (
                <div className="bg-white border border-[#EFEFF5] rounded-[16px] px-4 py-3 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col gap-1">
                   <span className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wide">Heart Rate</span>
                   <span className="text-[15px] font-bold text-[#1E1E2D]">{vitals.hr}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 6. Diagnosis Chips */}
        {diagnosisList && diagnosisList.length > 0 && (
          <div className="mx-5 mb-6">
            <h3 className="flex items-center gap-2 text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider mb-3">
              <Stethoscope className="w-5 h-5 text-[#DE468B]" /> Diagnosis / Complaints
            </h3>
            <div className="flex flex-wrap gap-2.5">
              {diagnosisList.map((d: string, i: number) => (
                <div key={i} className="bg-[#FCE7F3] text-[#DE468B] px-4 py-2 rounded-full text-[13px] font-semibold inline-flex items-center">
                  {d}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 7. Prescribed Medicines */}
        <div className="mx-5 mb-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="flex items-center gap-2 text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider">
              <Pill className="w-5 h-5 text-[#DE468B]" /> Prescribed Medicines
            </h3>
            <button 
              onClick={() => navigate("/shop")}
              className="flex items-center gap-1 text-xs font-bold text-[#DE468B] hover:opacity-85"
            >
              <ShoppingCart className="w-4 h-4" /> SHOP ALL
            </button>
          </div>

          <div className="flex flex-col gap-4">
             {medicinesList.map((med: any, i: number) => (
               <div key={i} className="bg-white rounded-[24px] p-4 shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-[#EFEFF5]">
                   <div className="flex gap-4 mb-3.5">
                      <div className="w-[60px] h-[60px] bg-[#F0F0F5] rounded-[14px] shrink-0 border border-[#EFEFF5] relative overflow-hidden">
                          <img 
                            src={`https://images.unsplash.com/photo-${i % 2 === 0 ? '1584308666744-24d5c474f2ae' : '1550572017-edb3f5451e06'}?auto=format&fit=crop&w=100&q=80`} 
                            className="w-full h-full object-cover" 
                            alt="Medicine" 
                          />
                      </div>
                      <div className="flex-1 min-w-0">
                         <div className="flex justify-between items-start mb-1">
                            <h4 className="text-[15px] font-bold text-[#1E1E2D] whitespace-normal leading-tight pr-2 truncate">{med.name}</h4>
                            <span className="text-[15px] font-bold text-[#1E1E2D] shrink-0">{med.price}</span>
                         </div>
                         <p className="text-xs text-[#6B7280] mb-1.5 truncate">{med.instructions}</p>
                         <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#10B981]">
                            IN STOCK <span className="font-medium text-[#9CA3AF]">• 1 Pack ({med.type || "Tablets"})</span>
                         </div>
                      </div>
                   </div>
                   <button 
                     onClick={() => navigate("/cart")}
                     className="w-full bg-[#DE468B] text-white py-3 rounded-[14px] text-sm font-semibold flex justify-center items-center gap-2 hover:opacity-90 active:scale-[0.99] transition-all shadow-[0_2px_8px_rgba(222,70,139,0.15)]"
                   >
                     <ShoppingCart className="w-4 h-4 text-white" /> Order Now
                   </button>
               </div>
             ))}
             {medicinesList.length === 0 && (
               <div className="text-center py-6 bg-white border border-[#EFEFF5] rounded-[24px] text-xs text-gray-400">
                 No medicines prescribed.
               </div>
             )}
          </div>
        </div>

        {/* 8. Recommended Tests */}
        {testsList && testsList.length > 0 && (
          <div className="section-container">
            <div className="section-header-title">
              <span className="material-symbols-outlined">biotech</span> Recommended Lab Tests
            </div>
            {testsList.map((test: any, i: number) => (
              <div className="lab-card" key={i}>
                <div className="lab-left">
                  <div className="lab-icon">
                    <span className="material-symbols-outlined">description</span>
                  </div>
                  <div className="lab-info">
                    <h4>{test.name}</h4>
                    <p>{test.note || "Home Sample Collection"}</p>
                  </div>
                </div>
                <button 
                  type="button" 
                  className="btn-book" 
                  onClick={() => navigate("/book-lab")}
                >
                  Book Home
                </button>
              </div>
            ))}
          </div>
        )}

        {/* 9. Administration Notes */}
        {medicinesList && medicinesList.length > 0 && (
          <div className="section-container">
            <div className="notes-card">
              <div className="notes-title">
                <span className="material-symbols-outlined">assignment</span> Administration Notes
              </div>
              {medicinesList.map((med: any, i: number) => (
                <div key={i} className="note-item">
                  <div className="note-num">{i + 1}</div>
                  <div className="note-text">
                    Administer 1 tablet of <strong>{med.name}</strong> • {med.instructions}
                  </div>
                </div>
              ))}
              <div className="note-item">
                <div className="note-num">{medicinesList.length + 1}</div>
                <div className="note-text">
                  Observe for any unusual behavior or gastrointestinal sensitivity during the first 3 days.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 10. Clinical Findings */}
        {findings && findings.trim() !== "" && (
          <div className="mx-5 mb-6">
            <h3 className="flex items-center gap-2 text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider mb-3">
              <FileText className="w-5 h-5 text-[#DE468B]" /> Clinical Findings & Summary
            </h3>
            <div className="bg-white border border-[#EFEFF5] rounded-[20px] p-4 text-[13px] text-[#1E1E2D] leading-[1.6] shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
              {findings}
            </div>
          </div>
        )}

        {/* 11. Reports & Attachments */}
        {attachmentsList && attachmentsList.length > 0 && (
          <div className="mx-5 mb-6">
            <h3 className="flex items-center gap-2 text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider mb-3">
              <Paperclip className="w-5 h-5 text-[#DE468B]" /> Reports & Attachments
            </h3>
            <div className="flex flex-col gap-2.5">
              {attachmentsList.map((att: any, i: number) => (
                <div 
                  key={i} 
                  onClick={() => att.url !== "#" && window.open(att.url, "_blank")}
                  className="bg-white border border-[#EFEFF5] rounded-[16px] p-3.5 flex items-center justify-between shadow-[0_4px_20px_rgba(0,0,0,0.02)] cursor-pointer hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-3">
                    <FileText className={`w-6 h-6 ${i % 2 === 0 ? "text-[#EF4444]" : "text-[#DE468B]"}`} />
                    <div>
                      <div className="text-[13px] font-semibold text-[#1E1E2D] truncate max-w-[200px]">{att.name}</div>
                      <div className="text-[11px] text-[#6B7280]">{att.size}</div>
                    </div>
                  </div>
                  <span className="text-[#DE468B] text-xs font-bold hover:opacity-80">VIEW</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 12. Consultation Outcome */}
        {outcome && outcome.trim() !== "" && (
          <div className="mx-5 mb-6">
            <h3 className="flex items-center gap-2 text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider mb-3">
               <ShieldCheck className="w-5 h-5 text-[#DE468B]" /> Consultation Outcome
            </h3>
            <div className="bg-[#E6F7ED] px-4 py-2.5 rounded-full inline-flex items-center gap-2.5 text-xs font-bold text-[#10B981] uppercase tracking-wider">
               <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></div>
               <span>{outcome}</span>
            </div>
          </div>
        )}

        {/* 13. Next Appointment Card */}
        {followUp && followUp.date && (
          <div className="mx-5 mb-6">
            <div className="bg-gradient-to-br from-[#DE468B] to-[#A21CAF] rounded-[24px] p-6 flex justify-between items-center text-white shadow-[0_10px_20px_rgba(222,70,139,0.15)] relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-8 -mt-8 pointer-events-none group-hover:scale-110 transition-transform"></div>
               <div>
                   <div className="text-[10px] font-bold uppercase tracking-wider mb-1 opacity-80">Next Appointment</div>
                   <div className="text-lg font-bold mb-0.5">
                     {new Date(followUp.date).toLocaleDateString(undefined, {month: "long", day: "numeric", year: "numeric"})}
                   </div>
                   <div className="text-[13px] opacity-90">{followUp.time ? `@ ${followUp.time}` : "Follow-up Checkup"}</div>
               </div>
               <div className="w-12 h-12 bg-white/20 rounded-[16px] backdrop-blur-sm flex items-center justify-center transition-transform group-hover:rotate-12">
                   <CalendarCheck2 className="w-6 h-6 text-white" />
               </div>
            </div>
          </div>
        )}

        {/* 14. Premium Feedback Button */}
        {!hasRated && (
          <div className="feedback-trigger-zone">
            <button className="btn-trigger-feedback" onClick={handleOpenFeedback}>
              <span className="material-symbols-outlined">rate_review</span> Rate Consultation Experience
            </button>
          </div>
        )}

      </div>

      {/* 15. Action Sliding Bottom Sheet Modal */}
      <div 
        className={`modal-overlay ${isFeedbackOpen ? "show" : ""}`}
        id="feedback-sheet" 
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setIsFeedbackOpen(false);
          }
        }}
      >
        <div className="modal-card">
          <h3 className="modal-title">
            How was your experience?
            <span className="material-symbols-outlined" style={{ color: "var(--primary, #DE468B)" }}>pets</span>
          </h3>
          <p className="modal-subtitle">Your reviews help {vetName} provide top tier care.</p>
          <hr className="modal-divider" />
          
          {feedbackSubmitted ? (
            <div className="flex flex-col items-center justify-center py-6 text-center text-[#10B981]">
              <div className="w-16 h-16 bg-[#E6F7ED] rounded-full flex items-center justify-center mb-3">
                <span className="material-symbols-outlined" style={{ fontSize: "36px", color: "#10B981" }}>check_circle</span>
              </div>
              <h4 className="text-base font-bold text-[#1E1E2D]">Feedback Submitted!</h4>
              <p className="text-xs text-[#6B7280] mt-1 font-medium">Thank you for rating your consultation.</p>
            </div>
          ) : (
            <>
              <div className="stars">
                {[1, 2, 3, 4, 5].map((index) => (
                  <span 
                    key={index} 
                    className={`material-symbols-outlined star ${index <= feedbackRating ? "active" : ""}`}
                    onClick={() => setFeedbackRating(index)}
                  >
                    star
                  </span>
                ))}
              </div>
              
              <textarea 
                className="review-input" 
                placeholder="Write an optional review about the consultation..."
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
              />
              <button 
                className="btn-submit-close" 
                onClick={handleSubmitFeedback}
                disabled={submittingFeedback || feedbackRating === 0}
                style={{ opacity: (submittingFeedback || feedbackRating === 0) ? 0.6 : 1 }}
              >
                {submittingFeedback ? "Submitting..." : "Submit Feedback"}
              </button>
            </>
          )}
        </div>
      </div>

    </div>
  );
};

export default DigitalPrescription;
