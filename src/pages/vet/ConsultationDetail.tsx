import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { 
  CaretLeft, Cat, User, MagicWand, Camera, 
  CheckCircle, VideoCamera, XCircle, Clock
} from "@phosphor-icons/react";

interface ConsultationDetailState {
  consultation: {
    id: string | number;
    petName: string;
    petDetails: string;
    ownerName: string;
    image: string;
    expiresIn?: string;
  };
}

const ConsultationDetail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { consultation } = (location.state as ConsultationDetailState) || {
    consultation: {
      id: "SR-882",
      petName: "Bruno",
      petDetails: "BEAGLE • 3Y • MALE",
      ownerName: "Rajesh Kumar",
      image: "https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?auto=format&fit=crop&w=150&q=80"
    }
  };

  const symptoms = [
    { label: "Lethargy", urgency: false },
    { label: "Itching", urgency: false },
    { label: "Concerned Urgency", urgency: true },
  ];

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
          ID: #{consultation.id}
        </span>
        <div className="relative w-20 h-20 shrink-0">
          <img 
            src={consultation.image} 
            alt={consultation.petName} 
            className="w-full h-full object-cover rounded-[18px]"
          />
          <div className="absolute -bottom-1 -right-1 bg-[#9d34da] text-white w-[22px] h-[22px] rounded-md flex items-center justify-center text-[10px] border-2 border-white">
            <VideoCamera size={12} weight="fill" />
          </div>
        </div>
        <div className="flex flex-col justify-center">
          <span className="bg-[#f8e8ff] text-[#9d34da] text-[9px] font-extrabold px-2 py-0.5 rounded-[6px] uppercase mb-1.5 w-fit">
            Regular
          </span>
          <h2 className="text-xl font-extrabold mb-1">{consultation.petName}</h2>
          <div className="text-[13px] text-[#9ba1b9] font-medium mb-3">
            {consultation.petDetails}
          </div>
          <div className="flex items-center gap-2 text-xs text-[#9ba1b9]">
            <img 
              src="https://i.pravatar.cc/100?img=11" 
              alt={consultation.ownerName} 
              className="w-6 h-6 rounded-full"
            />
            <span>Owner: <span className="text-[#2d3142] font-semibold">{consultation.ownerName}</span></span>
          </div>
        </div>
      </div>

      {/* Symptoms Analysis */}
      <div className="px-5 mb-8">
        <div className="flex items-center gap-2 font-extrabold text-[11px] text-[#bdc3d1] uppercase tracking-wider mb-4">
          <div className="w-1 h-3.5 bg-[#9d34da] rounded-[2px]" />
          Symptoms Analysis
          <span className="ml-auto bg-[#fff0f0] text-[#ff5e5e] px-2.5 py-1 rounded-full text-[10px] font-bold">
            Duration: Today
          </span>
        </div>
        <div className="flex flex-wrap gap-2.5">
          {symptoms.map((symptom, idx) => (
            <div 
              key={idx}
              className={`px-5 py-2.5 rounded-full text-[13px] font-semibold border ${
                symptom.urgency 
                  ? "bg-[#fdf8ff] border-[#e0b0ff] text-[#9d34da]" 
                  : "bg-white border-[#f0f0f5] text-[#2d3142]"
              }`}
            >
              {symptom.label}
            </div>
          ))}
        </div>
      </div>

      {/* Health History */}
      <div className="px-5 mb-8">
        <div className="flex items-center gap-2 font-extrabold text-[11px] text-[#bdc3d1] uppercase tracking-wider mb-4">
          <div className="w-1 h-3.5 bg-[#9d34da] rounded-[2px]" />
          Health History
        </div>
        <div className="bg-white p-6 rounded-[28px] shadow-[0_10px_30px_rgba(157,52,218,0.06)] space-y-5">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-[#9ba1b9]">Vaccinated</span>
            <span className="bg-[#e1fbf0] text-[#04824f] px-3.5 py-1 rounded-[12px] text-xs font-bold">
              Yes
            </span>
          </div>
          <div className="pt-4 border-t border-[#f0f0f5]">
            <div className="text-[10px] font-extrabold text-[#bdc3d1] uppercase mb-1.5">
              Existing Conditions
            </div>
            <p className="text-sm font-medium leading-relaxed">
              Persistent itching and red spots on belly
            </p>
          </div>
          <div>
            <div className="text-[10px] font-extrabold text-[#bdc3d1] uppercase mb-1.5">
              Current Medications
            </div>
            <p className="text-sm font-medium text-[#bdc3d1] italic">
              None reported
            </p>
          </div>
        </div>
      </div>

      {/* AI Tip */}
      <div className="mx-5 mb-8 bg-[#faf5ff] p-5 rounded-[28px] relative">
        <div className="flex items-center gap-2.5 mb-3 font-bold text-[15px]">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#f06292] to-[#9d34da] flex items-center justify-center text-white">
            <MagicWand size={16} weight="fill" />
          </div>
          AI Vet Assistant Tip
        </div>
        <p className="text-[13px] font-medium leading-relaxed text-[#4a4d61]">
          {consultation.petName} is showing signs of localized dermatitis. The sudden onset today and reported itching suggest an allergic reaction or environmental irritant. Analysis of the attached photo confirms skin redness.
        </p>
      </div>

      {/* Attached Media */}
      <div className="px-5 mb-10">
        <div className="flex items-center gap-2 font-extrabold text-[11px] text-[#bdc3d1] uppercase tracking-wider mb-4">
          <div className="w-1 h-3.5 bg-[#9d34da] rounded-[2px]" />
          Attached Media
        </div>
        <div className="h-[200px] w-full rounded-[28px] bg-[#94b488] flex flex-col items-center justify-center text-white text-center">
          <Camera size={40} className="mb-4 opacity-90" />
          <h2 className="text-2xl font-bold tracking-wider uppercase">Affected Area</h2>
          <p className="text-[11px] font-bold opacity-70 mt-1 uppercase tracking-widest">Safe for work</p>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="fixed bottom-0 left-0 w-full bg-[#fcfcfd]/90 backdrop-blur-md px-5 py-5 flex gap-4 z-50 border-t border-[#f0f0f5]">
        <button 
          onClick={() => {
            toast.info("Consultation declined");
            navigate(-1);
          }}
          className="flex-1 py-4.5 bg-[#f8f9fb] text-[#4a4d61] rounded-[18px] text-[15px] font-bold active:scale-95 transition-all"
        >
          Decline
        </button>
        <button 
          onClick={() => {
            navigate("/vet/video-call", { state: { consultation } });
          }}
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
