import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, MoreVertical, Info, Clock, MapPin, Phone, CheckCircle, AlertTriangle, Play, FileText, Navigation, Diamond } from "lucide-react";

const VetHomeVisitDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const appointment = location.state?.appointment;

  const apt = appointment || {
    pet_name: "Bella",
    pet_type: "dog",
    pet_breed: "Golden Retriever",
    appointment_time: "11:30",
    appointment_date: new Date().toISOString().split("T")[0],
  };

  return (
    <div className="min-h-screen pb-28" style={{ background: "#F6F7FB" }}>
      {/* Header */}
      <div className="bg-white px-5 pt-5 pb-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-[20px] font-bold text-gray-900">Home Visit Details</h1>
        </div>
        <button className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
          <MoreVertical className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      <div className="px-5 py-6 space-y-5">
        {/* Pet Photo & Status */}
        <div className="flex flex-col items-center text-center">
          <div className="relative w-36 h-36 rounded-full overflow-hidden mb-3 border-4 border-white shadow-lg">
            <img
              src={`https://images.unsplash.com/photo-${apt.pet_type === "cat" ? "1514888286974-6c03e2ca1dba" : "1552053831-71594a27632d"}?w=400&h=400&fit=crop`}
              alt={apt.pet_name}
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-2 right-2 w-5 h-5 bg-green-400 rounded-full border-2 border-white" />
          </div>
          <h2 className="text-[22px] font-bold text-gray-900">{apt.pet_name}</h2>
          <p className="text-[14px] text-gray-500">{apt.pet_breed || apt.pet_type} • 3 Years</p>
          <div className="mt-2 px-4 py-1.5 bg-green-50 rounded-full border border-green-200">
            <span className="text-[12px] font-semibold text-green-600 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-400" />
              CONFIRMED
            </span>
          </div>
        </div>

        {/* Navigation Card */}
        <div className="bg-white rounded-[20px] p-5 shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[13px] font-bold text-purple-500 uppercase tracking-wide">Navigation to Owner</h3>
            <span className="text-[13px] font-bold text-purple-500">2.4 MILES AWAY</span>
          </div>
          {/* Map placeholder */}
          <div className="w-full h-40 rounded-2xl bg-gradient-to-br from-green-50 to-blue-50 mb-3 relative overflow-hidden">
            <div className="absolute inset-0 opacity-40" style={{
              backgroundImage: "url('https://api.mapbox.com/styles/v1/mapbox/light-v11/static/-73.99,40.73,12,0/400x200?access_token=placeholder')",
              backgroundSize: "cover"
            }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col items-center">
                <MapPin className="w-8 h-8 text-purple-500 mb-1" />
                <span className="text-[11px] bg-purple-500 text-white px-3 py-1 rounded-full font-semibold">Owner's Home</span>
              </div>
            </div>
            <button className="absolute bottom-3 right-3 flex items-center gap-2 bg-purple-500 text-white px-4 py-2 rounded-full text-[12px] font-semibold shadow-lg">
              <Diamond className="w-3.5 h-3.5" />
              Start Navigation
            </button>
          </div>
        </div>

        {/* Visit Information */}
        <div className="bg-white rounded-[20px] p-5 shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[13px] font-bold text-purple-500 uppercase tracking-wide">Visit Information</h3>
            <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center">
              <Info className="w-4 h-4 text-purple-500" />
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center mt-0.5">
                <FileText className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-[12px] text-gray-400">Reason for Visit</p>
                <p className="text-[15px] font-semibold text-gray-900">Home Vaccination</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center mt-0.5">
                <Clock className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-[12px] text-gray-400">Scheduled Time</p>
                <p className="text-[15px] font-semibold text-gray-900">
                  Today, {apt.appointment_time} AM{" "}
                  <span className="text-purple-500 text-[13px]">(In 20 mins)</span>
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mt-0.5">
                <MapPin className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-[12px] text-gray-400">Owner Address</p>
                <p className="text-[15px] font-semibold text-gray-900">124 Maple Street, Apt 4B</p>
              </div>
            </div>
          </div>
        </div>

        {/* Owner Information */}
        <div className="bg-white rounded-[20px] p-5 shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[13px] font-bold text-purple-500 uppercase tracking-wide">Owner Information</h3>
            <button className="w-9 h-9 rounded-full bg-purple-50 flex items-center justify-center">
              <Phone className="w-4 h-4 text-purple-500" />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden">
              <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop" alt="Owner" className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="text-[16px] font-bold text-gray-900">Mark Thompson</p>
              <p className="text-[13px] text-gray-400">+1 (555) 234-5678</p>
            </div>
          </div>
        </div>

        {/* Medical Background */}
        <div className="bg-white rounded-[20px] p-5 shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
          <h3 className="text-[13px] font-bold text-purple-500 uppercase tracking-wide mb-4">Medical Background</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
              <p className="text-[14px] text-gray-700">Last Deworming: 2 months ago (Up to date)</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
              <p className="text-[14px] text-gray-700">Vaccination Status: All current</p>
            </div>
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
              <p className="text-[14px] text-gray-700">Allergy: Penicillin-based antibiotics</p>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-white px-5 py-4 border-t border-gray-100 space-y-3 z-50">
        <button
          className="w-full py-3.5 rounded-2xl text-white font-semibold text-[15px] flex items-center justify-center gap-2"
          style={{ background: "linear-gradient(135deg, #8A3FFC, #C84BFF)" }}
          onClick={() => navigate("/vet-dashboard/create-prescription", { state: { appointment: apt } })}
        >
          <Play className="w-5 h-5" />
          Start Consultation
        </button>
        <button className="w-full py-3.5 rounded-2xl border border-gray-200 text-[15px] font-semibold text-gray-600">
          View Medical History
        </button>
      </div>
    </div>
  );
};

export default VetHomeVisitDetails;
