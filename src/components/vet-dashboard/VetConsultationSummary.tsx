import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Video, ShieldCheck, Syringe, AlertTriangle, Sparkles, Image } from "lucide-react";

const VetConsultationSummary = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { appointment, autoAccept } = location.state || {};

  const apt = appointment || {
    id: "demo",
    pet_name: "Bruno",
    pet_type: "dog",
    pet_breed: "Beagle",
    appointment_type: "online",
    amount: 500,
    status: "pending",
  };

  const handleAccept = () => {
    // Navigate to video call screen in vet panel
    navigate("/vet-dashboard/vet-video-call", { state: { appointment: apt } });
  };

  const handleDecline = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen pb-28" style={{ background: "#F6F7FB" }}>
      {/* Header */}
      <div className="bg-white px-5 pt-5 pb-4 flex items-center gap-3 sticky top-0 z-40">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <h1 className="text-[20px] font-bold text-gray-900">Consultation Summary</h1>
      </div>

      <div className="px-5 py-4 space-y-5">
        {/* Pet Card */}
        <div className="bg-white rounded-[20px] p-5 shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
          <div className="flex items-start gap-4">
            <div className="w-20 h-24 rounded-2xl bg-gray-100 overflow-hidden">
              <img
                src={`https://images.unsplash.com/photo-${apt.pet_type === "cat" ? "1514888286974-6c03e2ca1dba" : "1587300003388-59208cc962cb"}?w=200&h=300&fit=crop`}
                alt={apt.pet_name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-red-500 uppercase">REGULAR</span>
                <span className="text-[12px] text-gray-400">ID: #SR-{Math.floor(Math.random() * 999)}</span>
              </div>
              <h2 className="text-[20px] font-bold text-gray-900 mt-0.5">{apt.pet_name}</h2>
              <p className="text-[13px] text-gray-500">{apt.pet_breed || apt.pet_type} • 3y • Male</p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center">
                  <span className="text-[10px]">👤</span>
                </div>
                <span className="text-[13px] text-gray-500">Owner: Pet Owner</span>
              </div>
            </div>
          </div>
        </div>

        {/* Symptoms Analysis */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 bg-purple-500 rounded-full" />
              <h3 className="text-[13px] font-bold text-gray-400 uppercase tracking-wide">Symptoms Analysis</h3>
            </div>
            <span className="text-[13px] font-semibold text-red-400">Duration: Today</span>
          </div>
          <div className="flex flex-wrap gap-2 mb-2">
            <span className="px-4 py-2 bg-white rounded-full text-[13px] font-medium text-gray-700 border border-gray-100">Lethargy</span>
            <span className="px-4 py-2 bg-white rounded-full text-[13px] font-medium text-gray-700 border border-gray-100">Itching</span>
          </div>
          <span className="px-4 py-1.5 bg-orange-50 rounded-full text-[12px] font-semibold text-orange-500 border border-orange-100">
            Concerned Urgency
          </span>
        </div>

        {/* Health History */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-5 bg-purple-500 rounded-full" />
            <h3 className="text-[13px] font-bold text-gray-400 uppercase tracking-wide">Health History</h3>
          </div>
          <div className="bg-white rounded-[20px] p-5 shadow-[0_2px_16px_rgba(0,0,0,0.06)] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[14px] text-gray-700">Vaccinated</span>
              <span className="text-[14px] font-semibold text-green-500">Yes</span>
            </div>
            <div>
              <p className="text-[11px] text-orange-400 font-semibold uppercase tracking-wide">Existing Conditions</p>
              <p className="text-[14px] text-gray-700 mt-0.5">Persistent itching and red spots on belly</p>
            </div>
            <div>
              <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide">Current Medications</p>
              <p className="text-[14px] text-gray-400 italic mt-0.5">None reported</p>
            </div>
          </div>
        </div>

        {/* AI Vet Assistant Tip */}
        <div className="bg-green-50 rounded-[20px] p-5 border border-green-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-purple-500" />
            </div>
            <h3 className="text-[16px] font-bold text-gray-900">AI Vet Assistant Tip</h3>
          </div>
          <p className="text-[14px] text-gray-600 leading-relaxed">
            {apt.pet_name} is showing signs of localized dermatitis. The sudden onset today and reported itching suggest an allergic reaction or environmental irritant. Analysis of the attached photo confirms skin redness.
          </p>
        </div>

        {/* Attached Media */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-5 bg-purple-500 rounded-full" />
            <h3 className="text-[13px] font-bold text-gray-400 uppercase tracking-wide">Attached Media</h3>
          </div>
          <div className="bg-green-100/60 rounded-[20px] p-8 flex flex-col items-center justify-center">
            <Image className="w-10 h-10 text-green-600 mb-2" />
            <p className="text-[16px] font-bold text-green-800 uppercase">Affected Area</p>
            <p className="text-[12px] text-green-600">Safe For Work</p>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white px-5 py-4 border-t border-gray-100 flex gap-3 z-50">
        <button
          onClick={handleDecline}
          className="flex-1 py-3.5 rounded-2xl border border-gray-200 text-[15px] font-semibold text-gray-600"
        >
          Decline
        </button>
        <button
          onClick={handleAccept}
          className="flex-1 py-3.5 rounded-2xl text-[15px] font-semibold text-white flex items-center justify-center gap-2"
          style={{ background: "linear-gradient(135deg, #FF4D6D, #8B5CF6)" }}
        >
          <Video className="w-5 h-5" />
          Accept
        </button>
      </div>
    </div>
  );
};

export default VetConsultationSummary;
