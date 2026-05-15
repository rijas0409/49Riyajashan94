import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { 
  CaretLeft, Cat, User, MagicWand, Camera, 
  CheckCircle, VideoCamera, XCircle, Clock
} from "@phosphor-icons/react";
import { supabase } from "@/integrations/supabase/client";

const ConsultationDetail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { consultationId } = location.state || {};
  const [appointment, setAppointment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [ownerProfile, setOwnerProfile] = useState<any>(null);

  useEffect(() => {
    const fetchDetail = async () => {
      if (!consultationId) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('vet_appointments')
          .select('*')
          .eq('id', consultationId)
          .single();

        if (error) throw error;
        setAppointment(data);

        // Fetch owner profile
        if (data.user_id) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, name, profile_photo')
            .eq('id', data.user_id)
            .single();
          setOwnerProfile(profile);
        }
      } catch (err) {
        console.error("Fetch detail error:", err);
        toast.error("Failed to load consultation details");
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [consultationId]);

  const handleAccept = async () => {
    try {
      const { error } = await supabase
        .from('vet_appointments')
        .update({ status: 'confirmed' })
        .eq('id', consultationId);

      if (error) throw error;
      toast.success("Consultation accepted!");
      navigate("/vet/video-call", { 
        state: { 
          consultation: { 
            ...appointment, 
            petName: appointment.pet_name, 
            ownerName: ownerProfile?.full_name || 'Pet Owner' 
          } 
        } 
      });
    } catch (err) {
      toast.error("Failed to accept");
    }
  };

  const handleDecline = async () => {
    try {
      const { error } = await supabase
        .from('vet_appointments')
        .update({ status: 'rejected' })
        .eq('id', consultationId);

      if (error) throw error;
      toast.info("Consultation declined");
      navigate(-1);
    } catch (err) {
      toast.error("Failed to decline");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-4 border-[#9d34da] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-10 text-center">
        <h2 className="text-xl font-bold mb-4">Consultation not found</h2>
        <button onClick={() => navigate(-1)} className="text-pink-500 font-bold underline">Go Back</button>
      </div>
    );
  }

  const symptoms = appointment.symptoms_data?.selectedSymptoms || [];
  const petType = appointment.pet_type || "Pet";
  const urgency = appointment.symptoms_data?.urgency || "None";

  return (
    <div className="bg-[#fcfcfd] min-h-screen pb-32 font-sans text-[#2d3142]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#fcfcfd]/80 backdrop-blur-md px-5 py-6 flex items-center">
        <button 
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-white border border-[#f0f0f5] flex items-center justify-center active:scale-95 transition-all text-[#2d3142]"
        >
          <CaretLeft size={20} weight="bold" />
        </button>
        <h1 className="text-lg font-bold flex-1 text-center mr-10">Consultation Summary</h1>
      </header>

      {/* Profile Card */}
      <div className="mx-5 mb-8 bg-white p-5 rounded-[28px] shadow-[0_10px_30px_rgba(157,52,218,0.06)] flex gap-4 relative">
        <span className="absolute top-5 right-5 text-[11px] font-semibold text-[#bdc3d1]">
          ID: #{appointment.id.toString().slice(0, 6)}
        </span>
        <div className="relative w-20 h-20 shrink-0">
          <div className="w-full h-full bg-[#f8f9fa] rounded-[18px] flex items-center justify-center">
             <User size={40} className="text-[#bdc3d1]" />
          </div>
          <div className="absolute -bottom-1 -right-1 bg-[#9d34da] text-white w-[22px] h-[22px] rounded-md flex items-center justify-center text-[10px] border-2 border-white">
            <VideoCamera size={12} weight="fill" />
          </div>
        </div>
        <div className="flex flex-col justify-center">
          <span className="bg-[#f8e8ff] text-[#9d34da] text-[9px] font-extrabold px-2 py-0.5 rounded-[6px] uppercase mb-1.5 w-fit">
            {appointment.appointment_type || 'Regular'}
          </span>
          <h2 className="text-xl font-extrabold mb-1">{appointment.pet_name}</h2>
          <div className="text-[13px] text-[#9ba1b9] font-medium mb-3 capitalize">
            {petType} • {appointment.selected_duration || '15'} MINS
          </div>
          <div className="flex items-center gap-2 text-xs text-[#9ba1b9]">
            <img 
              src={ownerProfile?.profile_photo || `https://i.pravatar.cc/100?u=${appointment.user_id}`} 
              alt="Owner" 
              className="w-6 h-6 rounded-full"
            />
            <span>Owner: <span className="text-[#2d3142] font-semibold">{ownerProfile?.full_name || ownerProfile?.name || 'User'}</span></span>
          </div>
        </div>
      </div>

      {/* Symptoms Analysis */}
      <div className="px-5 mb-8">
        <div className="flex items-center gap-2 font-extrabold text-[11px] text-[#bdc3d1] uppercase tracking-wider mb-4">
          <div className="w-1 h-3.5 bg-[#9d34da] rounded-[2px]" />
          Symptoms Analysis
          <span className="ml-auto bg-[#fff0f0] text-[#ff5e5e] px-2.5 py-1 rounded-full text-[10px] font-bold capitalize">
            Urgency: {urgency}
          </span>
        </div>
        <div className="flex flex-wrap gap-2.5">
          {symptoms.map((label: string, idx: number) => (
            <div 
              key={idx}
              className="px-5 py-2.5 rounded-full text-[13px] font-semibold border bg-white border-[#f0f0f5] text-[#2d3142]"
            >
              {label}
            </div>
          ))}
          {symptoms.length === 0 && <p className="text-sm text-muted-foreground">No symptoms reported</p>}
        </div>
      </div>

      {/* Health History Placeholder */}
      <div className="px-5 mb-8">
        <div className="flex items-center gap-2 font-extrabold text-[11px] text-[#bdc3d1] uppercase tracking-wider mb-4">
          <div className="w-1 h-3.5 bg-[#9d34da] rounded-[2px]" />
          Health History
        </div>
        <div className="bg-white p-6 rounded-[28px] shadow-[0_10px_30px_rgba(157,52,218,0.06)] space-y-5">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-[#9ba1b9]">Information Provided</span>
            <span className="bg-[#e1fbf0] text-[#04824f] px-3.5 py-1 rounded-[12px] text-xs font-bold">
              Yes
            </span>
          </div>
          <div className="pt-4 border-t border-[#f0f0f5]">
            <div className="text-[10px] font-extrabold text-[#bdc3d1] uppercase mb-1.5">
              Additional Notes
            </div>
            <p className="text-sm font-medium leading-relaxed">
              {appointment.symptoms_data?.additionalNotes || "No additional notes provided by the user."}
            </p>
          </div>
        </div>
      </div>

      {/* AI Summary */}
      <div className="mx-5 mb-8 bg-[#faf5ff] p-5 rounded-[28px] border border-purple-100 relative">
        <div className="flex items-center gap-2.5 mb-3 font-bold text-[15px]">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#f06292] to-[#9d34da] flex items-center justify-center text-white">
            <MagicWand size={16} weight="fill" />
          </div>
          AI Analysis Summary
        </div>
        <p className="text-[13px] font-medium leading-relaxed text-[#4a4d61]">
          {appointment.ai_summary || `The patient (${appointment.pet_name}), a ${petType.toLowerCase()}, is presenting with ${symptoms.join(", ")}. The user identifies the urgency as '${urgency}'. Preliminary AI analysis suggests initial assessment for ${symptoms[0]?.toLowerCase() || 'general health concerns'} is required during the live video consultation.`}
        </p>
      </div>

      {/* Attached Media */}
      <div className="px-5 mb-10">
        <div className="flex items-center gap-2 font-extrabold text-[11px] text-[#bdc3d1] uppercase tracking-wider mb-4">
          <div className="w-1 h-3.5 bg-[#9d34da] rounded-[2px]" />
          Attached Media
        </div>
        {appointment.symptoms_data?.photoUrl ? (
          <div className="w-full rounded-[28px] overflow-hidden shadow-md">
            <img 
              src={appointment.symptoms_data.photoUrl} 
              alt="Pet Condition" 
              className="w-full h-auto object-cover max-h-[300px]"
              referrerPolicy="no-referrer"
            />
          </div>
        ) : (
          <div className="h-[120px] w-full rounded-[28px] bg-gray-100 flex flex-col items-center justify-center text-gray-400 text-center border-2 border-dashed border-gray-200">
            <Camera size={32} className="mb-2 opacity-50" />
            <p className="text-xs font-bold uppercase tracking-widest">No Media Attached</p>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="fixed bottom-0 left-0 w-full bg-[#fcfcfd]/90 backdrop-blur-md px-5 py-5 flex gap-4 z-50 border-t border-[#f0f0f5]">
        <button 
          onClick={handleDecline}
          className="flex-1 py-4.5 bg-[#f8f9fb] text-[#4a4d61] rounded-[18px] text-[15px] font-bold active:scale-95 transition-all shadow-sm border border-gray-100"
        >
          Decline
        </button>
        <button 
          onClick={handleAccept}
          className="flex-1 py-4.5 bg-gradient-to-r from-[#ff5e92] to-[#9d34da] text-white rounded-[18px] text-[15px] font-bold shadow-[0_8px_20px_rgba(157,52,218,0.3)] active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <VideoCamera size={18} weight="fill" />
          Accept
        </button>
      </div>
    </div>
  );
};

export default ConsultationDetail;
