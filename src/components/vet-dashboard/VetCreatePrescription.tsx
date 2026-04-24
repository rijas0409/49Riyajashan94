import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Search, Trash2, Plus, Star, Video, Calendar, Clock, Home as HomeIcon, DollarSign, User } from "lucide-react";
import { toast } from "sonner";

const VetCreatePrescription = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const appointment = location.state?.appointment;

  const apt = appointment || { pet_name: "Luna", pet_type: "dog", id: "demo" };

  const [medicines, setMedicines] = useState([
    { name: "Pet-O-Boost (Multivitamin)", price: 24.50, size: "200ml Syrup", dosage: "" }
  ]);
  const [searchMedicine, setSearchMedicine] = useState("");
  const [labTests, setLabTests] = useState(["Complete Blood Count (CBC)", "Urinalysis Panel", "Skin Scraping"]);
  const [customTest, setCustomTest] = useState("");
  const [clinicalNotes, setClinicalNotes] = useState("");
  const [nextDate, setNextDate] = useState("");
  const [nextTime, setNextTime] = useState("");
  const [rating, setRating] = useState(0);

  const removeMedicine = (index: number) => {
    setMedicines(prev => prev.filter((_, i) => i !== index));
  };

  const addLabTest = (test: string) => {
    if (test && !labTests.includes(test)) {
      setLabTests(prev => [...prev, test]);
      setCustomTest("");
    }
  };

  const removeLabTest = (test: string) => {
    setLabTests(prev => prev.filter(t => t !== test));
  };

  const handleGeneratePrescription = async () => {
    if (!appointment?.id || appointment.id === "demo") {
      toast.success("Prescription generated successfully!");
      navigate(-2);
      return;
    }

    try {
      const { error } = await supabase.from("vet_appointments").update({
        diagnosis: clinicalNotes,
        medicines: medicines.map(m => `${m.name} - ${m.dosage}`).join("\n"),
        care_instructions: `Lab Tests: ${labTests.join(", ")}\nNext Appointment: ${nextDate} ${nextTime}`,
        status: "completed",
      }).eq("id", appointment.id);

      if (error) throw error;
      toast.success("Prescription generated & sent to owner!");
      navigate("/vet-dashboard");
    } catch (err) {
      toast.error("Failed to save prescription");
    }
  };

  return (
    <div className="min-h-screen pb-32" style={{ background: "#F6F7FB" }}>
      {/* Header */}
      <div className="bg-white px-5 pt-5 pb-4 flex items-center gap-3 sticky top-0 z-40">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <h1 className="text-[18px] font-bold text-gray-900">Create Prescription</h1>
        <div className="ml-auto px-3 py-1.5 rounded-full bg-purple-100 text-purple-600 text-[11px] font-bold flex items-center gap-1.5">
          <Video className="w-3.5 h-3.5" />
          VIDEO CALL ENDED
        </div>
      </div>

      <div className="px-5 py-4 space-y-5">
        {/* Patient Card */}
        <div className="bg-white rounded-[20px] p-5 shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 overflow-hidden">
              <img
                src={`https://images.unsplash.com/photo-${apt.pet_type === "cat" ? "1514888286974-6c03e2ca1dba" : "1552053831-71594a27632d"}?w=200&h=200&fit=crop`}
                alt={apt.pet_name}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h2 className="text-[18px] font-bold text-gray-900">Prescription for {apt.pet_name}</h2>
              <p className="text-[13px] text-gray-400">Patient ID: #SRV-{Math.floor(1000 + Math.random() * 9000)}</p>
              <p className="text-[13px] text-gray-400">3 Years Old</p>
              <div className="flex gap-2 mt-1.5">
                <span className="px-2.5 py-1 bg-purple-50 text-purple-600 rounded-full text-[10px] font-semibold">
                  CONSULTATION: VIDEO CALL
                </span>
                <span className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-semibold">
                  WEIGHT: 24KG
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Medicines */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[13px] font-bold text-gray-500 uppercase tracking-wide flex items-center gap-2">
              <span>💊</span> Attach Medicines
            </h3>
            <button className="text-[13px] font-semibold text-purple-500 uppercase">Pharmacy Inventory</button>
          </div>

          <div className="bg-white rounded-2xl px-4 py-3 flex items-center gap-2 shadow-sm mb-3">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search medicines (e.g. Pet-O-Boost, K-9 Cal)"
              className="bg-transparent outline-none text-[14px] text-gray-700 flex-1"
              value={searchMedicine}
              onChange={e => setSearchMedicine(e.target.value)}
            />
          </div>

          {medicines.map((med, i) => (
            <div key={i} className="bg-white rounded-[16px] p-4 shadow-sm mb-3">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="text-[15px] font-bold text-gray-900">{med.name}</h4>
                  <p className="text-[13px] text-gray-400">₹{med.price} • {med.size}</p>
                </div>
                <button onClick={() => removeMedicine(i)} className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
                  <Trash2 className="w-4 h-4 text-gray-400" />
                </button>
              </div>
              <div>
                <p className="text-[11px] text-purple-500 font-semibold uppercase mb-1">Dosage Instructions</p>
                <input
                  type="text"
                  placeholder="e.g. 5ml twice daily after meals for 7 days"
                  className="w-full bg-gray-50 rounded-xl px-3 py-2.5 text-[13px] outline-none border border-gray-100"
                  value={med.dosage}
                  onChange={e => {
                    const updated = [...medicines];
                    updated[i].dosage = e.target.value;
                    setMedicines(updated);
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Lab Tests */}
        <div>
          <h3 className="text-[13px] font-bold text-gray-500 uppercase tracking-wide flex items-center gap-2 mb-3">
            <span>🔬</span> Recommended Lab Tests
          </h3>
          <div className="flex flex-wrap gap-2 mb-2">
            {labTests.map(test => (
              <span key={test} className="flex items-center gap-1.5 px-3 py-2 bg-purple-50 text-purple-600 rounded-full text-[12px] font-semibold border border-purple-100">
                {test}
                <button onClick={() => removeLabTest(test)}>
                  <Plus className="w-3.5 h-3.5 rotate-45" />
                </button>
              </span>
            ))}
          </div>
          <button
            onClick={() => addLabTest(customTest || "New Test")}
            className="text-[13px] font-semibold text-red-400 flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            Add Custom Test
          </button>
        </div>

        {/* Clinical Notes */}
        <div>
          <h3 className="text-[13px] font-bold text-gray-500 uppercase tracking-wide flex items-center gap-2 mb-3">
            <span>📋</span> Clinical Findings & Summary
          </h3>
          <textarea
            className="w-full bg-white rounded-[16px] p-4 text-[14px] text-gray-700 outline-none shadow-sm border border-gray-100 min-h-[120px] resize-y"
            placeholder="Add professional notes about the patient's condition, observed symptoms, and diagnosis..."
            value={clinicalNotes}
            onChange={e => setClinicalNotes(e.target.value)}
          />
        </div>

        {/* Next Appointment */}
        <div>
          <h3 className="text-[13px] font-bold text-gray-500 uppercase tracking-wide flex items-center gap-2 mb-3">
            <span>📅</span> Next Appointment
          </h3>
          <div className="flex gap-3">
            <div className="flex-1">
              <p className="text-[11px] text-gray-400 uppercase font-semibold mb-1.5">Date</p>
              <input type="date" className="w-full bg-white rounded-xl px-3 py-3 text-[14px] outline-none border border-gray-100" value={nextDate} onChange={e => setNextDate(e.target.value)} />
            </div>
            <div className="flex-1">
              <p className="text-[11px] text-gray-400 uppercase font-semibold mb-1.5">Time</p>
              <input type="time" className="w-full bg-white rounded-xl px-3 py-3 text-[14px] outline-none border border-gray-100" value={nextTime} onChange={e => setNextTime(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Rating */}
        <div className="text-center py-4">
          <p className="text-[12px] text-gray-400 uppercase tracking-widest font-semibold mb-3">Rate Consultation Experience</p>
          <div className="flex items-center justify-center gap-2">
            {[1, 2, 3, 4, 5].map(s => (
              <button key={s} onClick={() => setRating(s)}>
                <Star className={`w-8 h-8 ${s <= rating ? "text-amber-400 fill-amber-400" : "text-gray-200"}`} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Fixed Bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-white px-5 py-4 border-t border-gray-100 z-50">
        <button
          onClick={handleGeneratePrescription}
          className="w-full py-4 rounded-2xl text-white font-semibold text-[16px] flex items-center justify-center gap-2"
          style={{ background: "linear-gradient(135deg, #FF4D6D, #8B5CF6)" }}
        >
          <span>✂️</span>
          Generate & Send Prescription
        </button>
        <p className="text-[11px] text-gray-400 text-center mt-2 uppercase tracking-wide">
          Instantly available in owner's Sruvo App
        </p>
      </div>
    </div>
  );
};

export default VetCreatePrescription;
