import React, { useEffect, useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Share2, Calendar, ShieldCheck, HeartPulse, Stethoscope, Pill, Beaker, FileText, CalendarCheck2, Star, BadgeAlert, Plus } from "lucide-react";
import { supabase } from "../../integrations/supabase/client";

const DigitalPrescription = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const appointmentId = location.state?.appointmentId;
  const passedData = location.state?.prescriptionData;
  const dbUpdate = location.state?.dbUpdate;

  const [prescriptionData, setPrescriptionData] = useState<any>(passedData || null);
  const [appointment, setAppointment] = useState<any>(null);

  useEffect(() => {
    // If not passed via state, try loading from local storage
    if (!prescriptionData && appointmentId) {
       const existing = localStorage.getItem(`gp_prescription_${appointmentId}`);
       if (existing) {
         try {
           setPrescriptionData(JSON.parse(existing));
         } catch (e) { console.error(e) }
       }
    }

    if (appointmentId) {
      const fetchAppt = async () => {
        const { data } = await supabase.from('vet_appointments').select('*, user:profiles!vet_appointments_user_id_fkey(*)').eq('id', appointmentId).maybeSingle();
        if (data) {
          setAppointment(data);
          
          if (!prescriptionData || dbUpdate) {
            try {
              if (data.consultation_notes) {
                setPrescriptionData(JSON.parse(data.consultation_notes));
              } else if (data.medicines) {
                // partial parsing
                setPrescriptionData(prev => ({
                   ...prev,
                   medicines: JSON.parse(data.medicines),
                   diagnosis: data.diagnosis
                }));
              }
            } catch (e) {}
          }
        }
      };
      
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(appointmentId);
      if (isUUID) {
         fetchAppt();
      }
    }
  }, [appointmentId, prescriptionData, dbUpdate]);

  const pData = prescriptionData || {};
  const diagnosisList = pData.diagnosis ? [pData.diagnosis] : ["General Checkup"];
  const medicinesList = pData.medicines || [];
  const testsList = pData.recommendedTests || [];

  return (
    <div className="min-h-screen bg-[#F8F9FC] font-sans pb-20">
      <div className="sticky top-0 z-20 bg-[#F8F9FC] px-5 py-4 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="w-[40px] h-[40px] rounded-full bg-white flex items-center justify-center border border-[#EFEFF5] shadow-sm">
          <ArrowLeft className="w-5 h-5 text-[#1E1E2D]" />
        </button>
        <h1 className="text-base font-semibold">Prescription</h1>
        <button className="w-[40px] h-[40px] rounded-full bg-white flex items-center justify-center border border-[#EFEFF5] shadow-sm">
          <Share2 className="w-5 h-5 text-[#1E1E2D]" />
        </button>
      </div>

      <div className="md:flex md:flex-wrap md:px-4">
        <div className="bg-white m-3 px-4 py-4 rounded-[24px] shadow-sm border border-[#EFEFF5] flex items-center gap-4">
          <img src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=150&q=80" alt="Doctor" className="w-[60px] h-[60px] rounded-full object-cover border-2 border-[#FCE7F3]" />
          <div>
            <h2 className="text-base font-bold text-[#1E1E2D]">Dr. Vikram Malhotra</h2>
            <p className="text-xs font-medium text-[#6B7280]">Senior Veterinarian</p>
            <div className="text-[11px] text-[#9CA3AF] flex items-center gap-1 mt-1 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" /> REG ID: VET-88291
            </div>
          </div>
        </div>

        <div className="bg-white mx-4 mt-1 mb-5 px-4 py-4 rounded-[24px] shadow-sm flex items-center gap-3.5 relative">
           <div className="relative shrink-0">
             <img src="https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=150&q=80" alt="Luna" className="w-[74px] h-[74px] rounded-full object-cover border-[2px] border-[#DE468B] p-0.5" />
             <div className="absolute right-1 bottom-1 w-3.5 h-3.5 bg-[#10B981] border-2 border-white rounded-full"></div>
           </div>
           <div className="flex-1 min-w-0">
             <h2 className="text-[17px] font-bold text-[#1E1E2D] truncate">Prescription for Luna</h2>
             <div className="text-xs font-semibold text-[#DE468B] mb-1">Dog • Golden Retriever</div>
             <p className="text-[#6B7280] text-xs font-medium mb-1.5">3 Years Old • ID: #{(appointmentId || "SRV-9921").slice(-8)}</p>
             <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
                <span className="shrink-0 bg-[#FCE7F3] text-[#DE468B] px-2.5 py-1.5 rounded-[12px] text-[9px] font-bold tracking-wide">{location.state?.consultationType?.toUpperCase() || "VIDEO CALL"}</span>
                <span className="shrink-0 bg-[#F0F0F5] text-[#6B7280] px-2.5 py-1.5 rounded-[12px] text-[9px] font-bold tracking-wide">WEIGHT: 24KG</span>
             </div>
           </div>
        </div>
      </div>

      <div className="flex justify-between items-center px-5 mb-6">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#6B7280]">
           <Calendar className="w-4 h-4" /> Issued on: {new Date().toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})}
        </div>
        <button className="flex items-center gap-1 text-[11px] font-semibold text-[#6B7280] border border-[#EFEFF5] rounded-[12px] px-3 py-1.5 bg-transparent">
          <BadgeAlert className="w-4 h-4" /> View Pet Passport
        </button>
      </div>

      <div className="px-5 mb-6">
        <h3 className="flex items-center gap-2 text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wide mb-3">
          <HeartPulse className="w-5 h-5 text-[#DE468B]" /> Vital Parameters
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white border border-[#EFEFF5] rounded-[16px] px-4 py-3 shadow-sm flex flex-col gap-1">
             <span className="text-[10px] font-semibold text-[#6B7280] uppercase">Temperature</span>
             <span className="text-[15px] font-bold text-[#1E1E2D]">{pData.vitals?.temp || "101.5 °F"}</span>
          </div>
          <div className="bg-white border border-[#EFEFF5] rounded-[16px] px-4 py-3 shadow-sm flex flex-col gap-1">
             <span className="text-[10px] font-semibold text-[#6B7280] uppercase">Heart Rate</span>
             <span className="text-[15px] font-bold text-[#1E1E2D]">{pData.vitals?.hr || "80 bpm"}</span>
          </div>
        </div>
      </div>

      <div className="px-5 mb-6">
        <h3 className="flex items-center gap-2 text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wide mb-3">
          <Stethoscope className="w-5 h-5 text-[#DE468B]" /> Diagnosis / Complaints
        </h3>
        <div className="flex flex-wrap gap-2.5">
          {diagnosisList.map((d: string, i: number) => (
            <div key={i} className="bg-[#FCE7F3] text-[#DE468B] px-4 py-2.5 rounded-full text-[13px] font-semibold inline-flex items-center">
              {d}
            </div>
          ))}
        </div>
      </div>

      <div className="px-5 mb-6">
        <h3 className="flex items-center gap-2 text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wide mb-3">
          <Pill className="w-5 h-5 text-[#DE468B]" /> Prescribed Medicines
        </h3>
        <div className="flex flex-col gap-4">
           {medicinesList.map((med: any, i: number) => (
             <div key={i} className="bg-white rounded-[24px] p-4 shadow-sm border border-[#EFEFF5]">
                <div className="flex gap-4 mb-3.5">
                   <div className="w-[60px] h-[60px] bg-[#F0F0F5] rounded-[14px] shrink-0 border border-[#EFEFF5] relative overflow-hidden">
                       <img src={`https://images.unsplash.com/photo-${i % 2 === 0 ? '1584308666744-24d5c474f2ae' : '1550572017-edb3f5451e06'}?auto=format&fit=crop&w=100&q=80`} className="w-full h-full object-cover" />
                   </div>
                   <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                         <h4 className="text-[15px] font-bold text-[#1E1E2D] whitespace-normal leading-tight pr-2">{med.name}</h4>
                         <span className="text-[15px] font-bold text-[#1E1E2D] shrink-0">₹{Math.floor(Math.random() * 500) + 120}</span>
                      </div>
                      <p className="text-xs text-[#6B7280] mb-1.5">{med.instructions}</p>
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#10B981]">
                         IN STOCK <span className="font-medium text-[#9CA3AF]">• 1 Pack</span>
                      </div>
                   </div>
                </div>
                <button className="w-full bg-[#DE468B] text-white py-3 rounded-[14px] text-sm font-semibold flex justify-center items-center gap-2 hover:opacity-90">
                   Add to Cart <Plus className="w-4 h-4" />
                </button>
             </div>
           ))}
        </div>
      </div>

      {testsList.length > 0 && (
        <div className="px-5 mb-6">
          <h3 className="flex items-center gap-2 text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wide mb-3">
            <Beaker className="w-5 h-5 text-[#DE468B]" /> Recommended Lab Tests
          </h3>
          <div className="flex flex-col gap-3">
            {testsList.map((test: any, i: number) => (
              <div key={i} className="bg-white rounded-[20px] p-4 flex items-center justify-between shadow-sm border border-[#EFEFF5] gap-3">
                 <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-[42px] h-[42px] rounded-[12px] bg-[#FCE7F3] text-[#DE468B] flex items-center justify-center shrink-0">
                       <FileText className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                       <h4 className="text-sm font-semibold text-[#1E1E2D] mb-0.5 truncate">{test.name}</h4>
                       <p className="text-[11px] text-[#6B7280] truncate">{test.note || "Home Sample Collection"}</p>
                    </div>
                 </div>
                 <button className="bg-[#DE468B] text-white px-4 h-[40px] rounded-[12px] text-xs font-semibold shrink-0">
                    Book Home
                 </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {medicinesList.length > 0 && (
         <div className="px-5 mb-6">
            <div className="bg-[#FCE7F3] rounded-[24px] p-5 border border-[#FBCFE8]">
               <h3 className="flex items-center gap-2 text-sm font-bold text-[#DE468B] uppercase tracking-wide mb-4">
                  <span className="material-symbols-outlined text-[18px]">assignment</span> Administration Notes
               </h3>
               {medicinesList.map((med: any, i: number) => (
                 <div key={i} className="flex gap-3 mb-3 items-start last:mb-0">
                    <div className="w-[22px] h-[22px] bg-[#DE468B] text-white rounded-full flex justify-center items-center text-[11px] font-bold shrink-0 mt-0.5">
                      {i + 1}
                    </div>
                    <p className="text-[13px] text-[#1E1E2D] leading-relaxed">
                      Administer <strong>{med.name}</strong> • {med.instructions}
                    </p>
                 </div>
               ))}
            </div>
         </div>
      )}

      <div className="px-5 mb-6">
        <h3 className="flex items-center gap-2 text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wide mb-3">
          <FileText className="w-5 h-5 text-[#DE468B]" /> Clinical Findings & Summary
        </h3>
        <div className="bg-white border border-[#EFEFF5] rounded-[20px] p-4 text-[13px] text-[#1E1E2D] leading-[1.6] shadow-sm">
          {pData.findings || "Patient shows signs of fatigue and mild dehydration. Vital parameters are stable but require structural multivitamin support over the week."}
        </div>
      </div>

      <div className="px-5 mb-6">
        <h3 className="flex items-center gap-2 text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wide mb-3">
           <ShieldCheck className="w-5 h-5 text-[#DE468B]" /> Consultation Outcome
        </h3>
        <div className="bg-[#E6F7ED] px-4 py-2.5 rounded-full inline-flex items-center gap-2.5 text-xs font-bold text-[#10B981] uppercase tracking-wide">
           <div className="w-2 h-2 rounded-full bg-[#10B981]"></div>
           Consultation Confirmed
        </div>
      </div>

      {pData.followUp && (pData.followUp.date || pData.followUp.time) && (
        <div className="px-5 mb-6">
          <div className="bg-gradient-to-br from-[#DE468B] to-[#A21CAF] rounded-[24px] p-6 flex justify-between items-center text-white shadow-[0_10px_20px_rgba(222,70,139,0.2)]">
             <div>
                <div className="text-[10px] font-bold uppercase tracking-wider mb-1.5 opacity-80">Next Appointment</div>
                <div className="text-lg font-bold mb-1">{pData.followUp.date || "To be scheduled"} {pData.followUp.time && `- ${pData.followUp.time}`}</div>
                <div className="text-[13px] opacity-90">Follow-up Checkup</div>
             </div>
             <div className="w-12 h-12 bg-white/20 rounded-[16px] backdrop-blur-sm flex items-center justify-center">
                <CalendarCheck2 className="w-6 h-6" />
             </div>
          </div>
        </div>
      )}

      <div className="px-5 mt-7 mb-4">
        <button className="w-full bg-[#1E1E2D] text-white py-4 rounded-[20px] text-sm font-semibold flex items-center justify-center gap-2 shadow-[0_4px_15px_rgba(30,30,45,0.15)]">
           <Star className="w-5 h-5 fill-white" /> Rate Consultation Experience
        </button>
      </div>

    </div>
  );
};

export default DigitalPrescription;
