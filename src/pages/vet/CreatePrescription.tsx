import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Video, 
  Search, 
  HeartPulse, 
  Stethoscope, 
  Pill, 
  Microscope, 
  Paperclip, 
  FileText, 
  Calendar, 
  CheckCircle2, 
  Send,
  X,
  Plus,
  Star,
  Trash2,
  CalendarCheck2,
  AlertCircle,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../integrations/supabase/client';

interface Medicine {
  id: string;
  name: string;
  type: string;
  price?: string;
  dose: string;
  frequency: string;
  timing: string;
  duration: string;
}

interface LabTest {
  id: string;
  name: string;
  note: string;
  active: boolean;
}

const CreatePrescription = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const apptState = location.state || {};
  const appointmentId = apptState.appointmentId || "SRV-9921";
  const petName = apptState.petName || "Luna";
  const rawConsultationType = apptState.consultationType || "VIDEO CALL";
  const consultationType = rawConsultationType.toUpperCase();

  // Helper for dynamic icon
  const getConsultationIcon = (className: string) => {
    if (consultationType.includes("HOME")) return <span className={`material-symbols-outlined ${className}`} style={{fontSize: "14px", marginRight: "4px"}}>home</span>;
    if (consultationType.includes("CLINIC")) return <span className={`material-symbols-outlined ${className}`} style={{fontSize: "14px", marginRight: "4px"}}>local_hospital</span>;
    return <Video className={`${className} mr-1`} />;
  };

  // --- State ---
  const [vitals, setVitals] = useState({ temp: "", hr: "" });
  const [diagnosis, setDiagnosis] = useState<string[]>([]);
  const [diagSearch, setDiagSearch] = useState("");
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [labTests, setLabTests] = useState<LabTest[]>([]);
  // Store actual File object alongside metadata for Supabase storage upload
  const [uploadedFiles, setUploadedFiles] = useState<{ id: string; name: string; type: string; file: File; size: number }[]>([]);
  const [clinicalFindings, setClinicalFindings] = useState("");
  const [nextApptDate, setNextApptDate] = useState("");
  const [nextApptTime, setNextApptTime] = useState("");
  const [outcome, setOutcome] = useState("");
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isCustomTestOpen, setIsCustomTestOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdPrescriptionId, setCreatedPrescriptionId] = useState<string | null>(null);

  // Real DB state
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [masterDiagnoses, setMasterDiagnoses] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [inventoryMedicines, setInventoryMedicines] = useState<any[]>([]);
  
  const userStr = localStorage.getItem("vet_user");
  const vetUser = userStr ? JSON.parse(userStr) : null;
  const vetId = vetUser?.id || "";

  // --- Realtime and Initial Fetch ---
  useEffect(() => {
    const fetchMasters = async () => {
      const { data: mDiag } = await supabase.from('master_diagnoses').select('*');
      if (mDiag) setMasterDiagnoses(mDiag);
      
      const { data: mMed } = await supabase.from('master_medicines').select('*');
      if (mMed) setInventoryMedicines(mMed);
      
      const { data: mLab } = await supabase.from('master_lab_tests').select('*');
      if (mLab) {
        // Map to LabTest interface
        setLabTests(mLab.map(l => ({ id: l.id, name: l.test_name, note: l.specific_instructions || "", active: false })));
      }
    };
    fetchMasters();
    
    // Setup Realtime Subs
    const ch = supabase.channel('master_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'master_diagnoses' }, async () => {
        const { data } = await supabase.from('master_diagnoses').select('*');
        if (data) setMasterDiagnoses(data);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'master_medicines' }, async () => {
        const { data } = await supabase.from('master_medicines').select('*');
        if (data) setInventoryMedicines(data);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'master_lab_tests' }, async () => {
         const { data: mLab } = await supabase.from('master_lab_tests').select('*');
         if (mLab) {
            setLabTests(prev => {
               const activeIds = new Set(prev.filter(p => p.active).map(p => p.id));
               return mLab.map(l => ({ id: l.id, name: l.test_name, note: l.specific_instructions || "", active: activeIds.has(l.id) }));
            });
         }
      })
      .subscribe();
      
      return () => { supabase.removeChannel(ch); }
  }, []);

  // --- Inventory State ---
  const [customMed, setCustomMed] = useState({ name: "", type: "" });
  const [showCustomMedForm, setShowCustomMedForm] = useState(false);
  const [customTest, setCustomTest] = useState({ name: "", note: "" });

  // --- Handlers ---
  const addMedicine = async (med: { name: string; type: string; price?: string }) => {
    // If from DB, name is medicine_name, type is form_type, price is unit_price
    const newMed: Medicine = {
      id: `med-${Date.now()}`,
      name: med.name,
      type: med.type,
      price: med.price,
      dose: "",
      frequency: "Twice daily (BID)",
      timing: "After food",
      duration: ""
    };
    setMedicines([...medicines, newMed]);
    setIsInventoryOpen(false);
    toast.success(`Added ${med.name}`);
  };

  const removeMedicine = (id: string) => {
    setMedicines(medicines.filter(m => m.id !== id));
  };

  const updateMedicine = (id: string, field: keyof Medicine, value: string) => {
    setMedicines(medicines.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const toggleLabTest = (id: string) => {
    setLabTests(labTests.map(t => t.id === id ? { ...t, active: !t.active } : t));
  };

  const addCustomTest = async () => {
    if (!customTest.name.trim()) return;
    
    // Save to master_lab_tests
    const { data, error } = await supabase.from('master_lab_tests').insert({
      test_name: customTest.name,
      specific_instructions: customTest.note,
      created_by_vet: vetId || null
    }).select().single();
    
    if (error) {
      toast.error("Failed to add test to catalog.");
      return;
    }
    
    const newTest: LabTest = {
      id: data.id,
      name: data.test_name,
      note: data.specific_instructions,
      active: true
    };
    setLabTests(prev => [...prev, newTest]);
    setIsCustomTestOpen(false);
    setCustomTest({ name: "", note: "" });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFiles(prev => [...prev, { id: `file-${Date.now()}`, name: file.name, type: file.type, file, size: file.size }]);
      toast.success(`Attached ${file.name}`);
    }
  };

  const removeUploadedFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleAddDiagnosis = async (item: string) => {
    if (!diagnosis.includes(item)) {
      setDiagnosis([...diagnosis, item]);
      
      // Immediately try to persist to master_diagnoses if not exists
      const existing = masterDiagnoses.find(d => d.diagnosis_name.toLowerCase() === item.toLowerCase());
      if (!existing && item.trim() !== '') {
        await supabase.from('master_diagnoses').insert({
          diagnosis_name: item,
          created_by_vet: vetId || null
        });
      }
    }
  };

  const handleGenerate = async () => {
    // 1. Diagnosis check
    if (diagnosis.length === 0) {
      toast.error("Please add at least one Diagnosis/Complaint.");
      return;
    }

    // 2. Attach Medicine check
    if (medicines.length === 0) {
      toast.error("Please add at least one Medicine recommendation.");
      return;
    }

    // Check each medicine has dose, frequency, timing, duration filled
    for (const med of medicines) {
      if (!med.dose.trim()) { toast.error(`Please specify the Dose for ${med.name}.`); return; }
      if (!med.frequency.trim()) { toast.error(`Please specify the Frequency for ${med.name}.`); return; }
      if (!med.timing.trim()) { toast.error(`Please specify the Timing for ${med.name}.`); return; }
      if (!med.duration.trim()) { toast.error(`Please specify the Duration for ${med.name}.`); return; }
    }

    // 3. Reports & Attachments check
    if (uploadedFiles.length === 0) {
      toast.error("Please upload at least one Report / Laboratory Attachment.");
      return;
    }

    // 4. Clinical Findings check
    if (!clinicalFindings.trim()) {
      toast.error("Please provide Clinical Findings & Summary.");
      return;
    }

    // 5. Next Appointment Date check
    if (!nextApptDate) {
      toast.error("Please specify a Next Appointment Date.");
      return;
    }

    // 6. Consultation Outcome check
    if (!outcome) {
      toast.error("Please select a Consultation Outcome.");
      return;
    }

    setIsSubmitting(true);
    let prescriptionId = null;

    try {
      // Step 1: Save Prescription
      const { data: pData, error: pErr } = await supabase.from('prescriptions').insert({
        appointment_id: appointmentId,
        vet_id: vetId || null,
        temperature_f: vitals.temp ? parseFloat(vitals.temp) : null,
        heart_rate_bpm: vitals.hr ? parseFloat(vitals.hr) : null,
        diagnosis_tags: diagnosis, // JSONB directly handled
        clinical_summary: clinicalFindings,
        next_appointment_date: nextApptDate || null,
        next_appointment_time: nextApptTime || null,
        consultation_outcome: outcome,
        prescription_status: 'completed'
      }).select().single();

      if (pErr) throw new Error("Failed to save prescription: " + pErr.message);
      prescriptionId = pData.id;

      // Step 2: Save Medicines
      const medInserts = medicines.map(m => ({
        prescription_id: prescriptionId,
        medicine_name: m.name,
        form_type: m.type,
        unit_price: m.price ? parseFloat(m.price.replace(/[^0-9.]/g, '')) : null,
        dosage_quantity: m.dose,
        dosage_frequency: m.frequency,
        dosage_timing: m.timing,
        dosage_duration: m.duration
      }));
      const { error: mErr } = await supabase.from('prescription_medicines').insert(medInserts);
      if (mErr) throw new Error("Failed to save medicines: " + mErr.message);

      // Save custom medicines to master if not exists
      for (const m of medicines) {
        const existing = inventoryMedicines.find(i => i.medicine_name.toLowerCase() === m.name.toLowerCase());
        if (!existing) {
          await supabase.from('master_medicines').insert({
            medicine_name: m.name,
            form_type: m.type,
            unit_price: m.price ? parseFloat(m.price.replace(/[^0-9.]/g, '')) : null,
            created_by_vet: vetId || null
          });
        }
      }

      // Step 3: Save Lab Tests
      const activeLabTests = labTests.filter(t => t.active);
      if (activeLabTests.length > 0) {
        const labInserts = activeLabTests.map(t => ({
          prescription_id: prescriptionId,
          test_name: t.name,
          test_instructions: t.note
        }));
        const { error: lErr } = await supabase.from('prescription_lab_tests').insert(labInserts);
        if (lErr) throw new Error("Failed to save lab tests: " + lErr.message);
      }

      // Step 4: Upload Attachments & Save Records
      for (const fileObj of uploadedFiles) {
        const fileExt = fileObj.file.name.split('.').pop();
        const fileName = `${prescriptionId}-${Math.random()}.${fileExt}`;
        const filePath = `${vetId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('prescription-files')
          .upload(filePath, fileObj.file);

        if (uploadError) throw new Error(`Failed to upload ${fileObj.file.name}: ` + uploadError.message);

        const { data: urlData } = supabase.storage.from('prescription-files').getPublicUrl(filePath);

        const { error: attErr } = await supabase.from('prescription_attachments').insert({
          prescription_id: prescriptionId,
          file_name: fileObj.file.name,
          file_type: fileObj.file.type,
          file_size: fileObj.size,
          file_url: urlData.publicUrl,
          uploaded_by: vetId || null
        });
        if (attErr) throw new Error(`Failed to save attachment metadata for ${fileObj.file.name}: ` + attErr.message);
      }

      // Step 5: Update Appointment status
      if (appointmentId && appointmentId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
         console.log("PRESCRIPTION_GENERATED");
         const { error: apptErr } = await supabase.from('vet_appointments').update({
           status: 'generated',
           medicines: JSON.stringify(medicines),
           diagnosis: diagnosis.join(', ')
         }).eq('id', appointmentId);
         if (apptErr) throw new Error("Failed to update appointment status: " + apptErr.message);
      }

      setCreatedPrescriptionId(prescriptionId);
      setIsSuccessModalOpen(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "An error occurred during submission.");
      
      // Rollback logic
      if (prescriptionId) {
        await supabase.from('prescriptions').delete().eq('id', prescriptionId);
        // Cascading deletes will remove associated medicines, lab tests, and attachments.
        // We do *not* delete storage files here for simplicity, though ideally we would.
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinalSubmit = async () => {
    if (rating > 0 && createdPrescriptionId) {
      await supabase.from('consultation_ratings').insert({
        appointment_id: appointmentId,
        prescription_id: createdPrescriptionId,
        vet_id: vetId || null,
        rating: rating,
      });
    }
    toast.success("Prescription finalized!");
    navigate("/vet/schedule");
  };

  return (
    <div className="min-h-screen bg-[#F8F8FC] font-sans text-[#1E1E2D]">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-[#F8F8FC] px-5 py-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-[#555] p-1">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="flex-1 text-[#9C42F5] text-base font-medium truncate">Create Prescription</h1>
        <div className="flex items-center bg-[#F4E8FF] text-[#9C42F5] px-2.5 py-1.5 rounded-full text-[9px] font-bold tracking-wider shrink-0">
          {getConsultationIcon("w-3.5 h-3.5")}
          {consultationType} ENDED
        </div>
      </div>

      <div className="pb-10">
        {/* Patient Card */}
        <div className="bg-white mx-4 mb-5 rounded-[24px] p-4 flex items-center gap-3.5 shadow-sm">
          <div className="relative shrink-0">
            <img 
              src="https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=150&q=80" 
              alt={petName} 
              className="w-[74px] h-[74px] rounded-full object-cover border-2 border-[#9C42F5] p-0.5" 
            />
            <div className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-[#22C55E] border-[2.5px] border-white rounded-full"></div>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-[17px] font-bold truncate">Prescription for {petName}</h2>
            <div className="text-[#9C42F5] text-[12px] font-semibold mb-1">Dog • Golden Retriever</div>
            <p className="text-[#8A8A9E] text-[12px] font-medium">3 Years Old • ID: #{appointmentId}</p>
            <div className="flex gap-1.5 mt-2 overflow-x-auto no-scrollbar">
              <span className="bg-[#F4E8FF] text-[#9C42F5] px-2.5 py-1.5 rounded-[12px] text-[9px] font-bold whitespace-nowrap">CONSULTATION: {consultationType}</span>
              <span className="bg-[#F0F0F5] text-[#8A8A9E] px-2.5 py-1.5 rounded-[12px] text-[9px] font-bold whitespace-nowrap">WEIGHT: 24KG</span>
            </div>
          </div>
        </div>

        {/* Vital Parameters */}
        <div className="px-5 mb-6">
          <div className="flex items-center mb-4">
            <HeartPulse className="text-[#9C42F5] w-5 h-5 mr-2.5" />
            <div className="text-[#A1A1B5] text-[11px] font-bold tracking-widest uppercase flex-1">
              VITAL PARAMETERS
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] text-[#8A8A9E] font-semibold uppercase">Temp (°F)</span>
              <input 
                type="text" 
                value={vitals.temp}
                onChange={(e) => setVitals({ ...vitals, temp: e.target.value })}
                placeholder="e.g. 101.5" 
                className="w-full bg-white border border-[#EFEFF5] rounded-[12px] px-3 py-2.5 text-sm font-medium outline-none focus:border-[#9C42F5]"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] text-[#8A8A9E] font-semibold uppercase">HR (bpm)</span>
              <input 
                type="text" 
                value={vitals.hr}
                onChange={(e) => setVitals({ ...vitals, hr: e.target.value })}
                placeholder="e.g. 80" 
                className="w-full bg-white border border-[#EFEFF5] rounded-[12px] px-3 py-2.5 text-sm font-medium outline-none focus:border-[#9C42F5]"
              />
            </div>
          </div>
        </div>

        {/* Diagnosis */}
        <div className="px-5 mb-6">
          <div className="flex items-center mb-4">
            <Stethoscope className="text-[#9C42F5] w-5 h-5 mr-2.5" />
            <div className="text-[#A1A1B5] text-[11px] font-bold tracking-widest uppercase flex-1">
              DIAGNOSIS / COMPLAINTS
            </div>
          </div>
          <div className="bg-white flex items-center px-4 py-3 rounded-[16px] border border-[#EFEFF5] mb-2.5 shadow-sm">
            <Search className="text-[#9C42F5] w-5 h-5 mr-3 font-semibold" />
            <input 
              type="text" 
              value={diagSearch}
              onChange={(e) => setDiagSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && diagSearch.trim()) {
                  handleAddDiagnosis(diagSearch.trim());
                  setDiagSearch("");
                }
              }}
              placeholder="Type diagnosis and press Enter" 
              className="bg-transparent border-none outline-none w-full text-sm placeholder:text-[#A1A1B5]"
            />
            {diagSearch.trim() && (
              <button 
                onClick={() => {
                  handleAddDiagnosis(diagSearch.trim());
                  setDiagSearch("");
                }}
                className="bg-[#9C42F5] text-white text-[10px] px-2.5 py-1.5 rounded-lg font-bold hover:bg-[#8629df] transition-colors"
                type="button"
              >
                ADD
              </button>
            )}
          </div>
          
          <div className="flex flex-wrap gap-1.5 mb-3.5">
             {["Fever", "Ear Infection", "Mild Dehydration", "Skin Allergy", "Indigestion", "Flu"].map((item) => {
                const added = diagnosis.includes(item);
                if (added) return null;
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => handleAddDiagnosis(item)}
                    className="bg-[#FAF8FF] hover:bg-[#F3EDFF] border border-[#EFEFF5] text-[#9C42F5] text-[10px] font-bold px-2 py-1 rounded-[10px] transition-all"
                  >
                    + {item}
                  </button>
                );
             })}
          </div>

          <div className="flex flex-wrap gap-2">
            {diagnosis.length === 0 ? (
              <div className="w-full text-center py-4 bg-white border border-dashed border-gray-200 rounded-[16px] text-xs text-[#8A8A9E] font-medium italic">
                No diagnosis added yet
              </div>
            ) : (
              diagnosis.map((d, index) => (
                <div 
                  key={index} 
                  onClick={() => setDiagnosis(diagnosis.filter((_, i) => i !== index))}
                  className="bg-[#F4E8FF] h-9 text-[#9C42F5] px-4 py-2 rounded-[24px] text-xs font-semibold flex items-center inline-flex justify-center cursor-pointer hover:bg-[#ebd7ff] transition-colors animate-fade-in w-auto whitespace-nowrap"
                >
                  {d} <X className="w-3.5 h-3.5 ml-1.5 shrink-0" />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Attach Medicines */}
        <div className="px-5 mb-6">
          <div className="flex items-center mb-4">
            <Pill className="text-[#9C42F5] w-5 h-5 mr-2.5" />
            <div className="text-[#A1A1B5] text-[11px] font-bold tracking-widest uppercase flex-1">
              ATTACH MEDICINES
            </div>
            <button 
              onClick={() => setIsInventoryOpen(true)}
              className="text-[#9C42F5] text-[11px] font-bold tracking-wider hover:underline"
              type="button"
            >
              PHARMACY INVENTORY
            </button>
          </div>

          <div className="flex flex-col gap-4">
            {medicines.length === 0 ? (
              <div className="text-center py-6 bg-white border border-dashed border-gray-200 rounded-[20px] text-xs text-[#8A8A9E] font-medium italic">
                No medicines attached yet. Click 'Pharmacy Inventory' above to add recommendations
              </div>
            ) : (
              medicines.map((med) => (
                <div key={med.id} className="bg-white rounded-[20px] p-4 shadow-[0_4px_20px_rgba(0,0,0,0.02)] relative border border-[#EFEFF5]">
                  <div className="flex items-center mb-3 pb-4 border-b border-[#EFEFF5] pr-6">
                    <div className="w-[50px] h-[50px] bg-[#FDF1D9] rounded-[12px] flex items-center justify-center mr-4 shrink-0">
                      <Pill className="w-6 h-6 text-orange-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold leading-tight">{med.name}<br/>({med.type})</h4>
                      <p className="text-[#8A8A9E] text-xs mt-0.5">{med.price || "Recommendation"} • {med.type}</p>
                    </div>
                    <button 
                      onClick={() => removeMedicine(med.id)}
                      className="absolute top-5 right-5 text-[#A1A1B5] hover:text-red-500"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  <label className="text-[#A1A1B5] text-[10px] font-bold tracking-wider mb-2.5 block uppercase">DOSAGE INSTRUCTIONS</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[9px] text-[#8A8A9E] font-semibold uppercase">Dose</span>
                      <input 
                        type="text" 
                        value={med.dose}
                        onChange={(e) => updateMedicine(med.id, 'dose', e.target.value)}
                        placeholder="e.g. 5ml" 
                        className="w-full bg-[#F8F8FC] border border-[#EFEFF5] rounded-[12px] px-3 py-2 text-xs font-medium outline-none focus:border-[#9C42F5]"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[9px] text-[#8A8A9E] font-semibold uppercase">Frequency</span>
                      <select 
                        value={med.frequency}
                        onChange={(e) => updateMedicine(med.id, 'frequency', e.target.value)}
                        className="w-full bg-[#F8F8FC] border border-[#EFEFF5] rounded-[12px] px-3 py-2 text-xs font-medium outline-none appearance-none bg-no-repeat bg-[right_10px_center] bg-[length:16px] pr-8"
                        style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%238A8A9E' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")` }}
                      >
                        <option value="">Select Frequency</option>
                        <option value="Once daily (OD)">Once daily (OD)</option>
                        <option value="Twice daily (BID)">Twice daily (BID)</option>
                        <option value="Thrice daily (TID)">Thrice daily (TID)</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[9px] text-[#8A8A9E] font-semibold uppercase">Timing</span>
                      <select 
                        value={med.timing}
                        onChange={(e) => updateMedicine(med.id, 'timing', e.target.value)}
                        className="w-full bg-[#F8F8FC] border border-[#EFEFF5] rounded-[12px] px-3 py-2 text-xs font-medium outline-none appearance-none bg-no-repeat bg-[right_10px_center] bg-[length:16px] pr-8"
                        style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%238A8A9E' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")` }}
                      >
                        <option value="">Select Timing</option>
                        <option value="Before food">Before food</option>
                        <option value="After food">After food</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[9px] text-[#8A8A9E] font-semibold uppercase">Duration</span>
                      <input 
                        type="text" 
                        value={med.duration}
                        onChange={(e) => updateMedicine(med.id, 'duration', e.target.value)}
                        placeholder="e.g. 7 Days" 
                        className="w-full bg-[#F8F8FC] border border-[#EFEFF5] rounded-[12px] px-3 py-2 text-xs font-medium outline-none focus:border-[#9C42F5]"
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Lab Tests */}
        <div className="px-5 mb-6">
          <div className="flex items-center mb-4">
            <Microscope className="text-[#9C42F5] w-5 h-5 mr-2.5" />
            <div className="text-[#A1A1B5] text-[11px] font-bold tracking-widest uppercase flex-1">RECOMMENDED LAB TESTS</div>
          </div>
          <div className="flex flex-col gap-3">
            {labTests.map((test) => (
              <div key={test.id} className="flex flex-col gap-2">
                <div 
                  onClick={() => toggleLabTest(test.id)}
                  className={`chip self-start ${test.active ? 'bg-[#F4E8FF] text-[#9C42F5]' : 'bg-white text-[#1E1E2D] border border-[#EFEFF5]'} px-4 py-2.5 rounded-[24px] text-sm font-semibold flex items-center justify-center cursor-pointer transition-all`}
                >
                  {test.name} <Plus className={`w-4 h-4 ml-1.5 transition-transform ${test.active ? 'rotate-45' : ''}`} />
                </div>
                {test.active && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="ml-1">
                    <input 
                      type="text" 
                      defaultValue={test.note}
                      placeholder="Add specific parameters or instructions..." 
                      className="w-full bg-[#FAF6FF] border border-dashed border-[#D6B3FF] rounded-[12px] px-3.5 py-2.5 text-xs font-medium outline-none"
                    />
                  </motion.div>
                )}
              </div>
            ))}
          </div>
          
          <button 
            type="button"
            onClick={() => setIsCustomTestOpen(true)}
            className="w-full mt-3 border border-dashed border-[#9C42F5] text-[#9C42F5] rounded-[24px] px-4 py-3 flex items-center justify-center text-sm font-semibold gap-1.5 bg-transparent hover:bg-[#F4E8FF] transition-colors"
          >
            <Plus className="w-4.5 h-4.5" /> Custom Lab Test
          </button>
        </div>

        {/* Reports & Attachments */}
        <div className="px-5 mb-6">
          <div className="flex items-center mb-4">
            <Paperclip className="text-[#9C42F5] w-5 h-5 mr-2.5" />
            <div className="text-[#A1A1B5] text-[11px] font-bold tracking-widest uppercase flex-1">
              REPORTS & ATTACHMENTS
            </div>
          </div>
          <div className="flex flex-col gap-2.5">
            {uploadedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2.5">
                {uploadedFiles.map((file) => (
                  <div key={file.id} className="relative bg-white border border-[#EFEFF5] rounded-[24px] pl-4 pr-10 py-2.5 text-sm font-semibold flex items-center gap-1.5 shadow-sm">
                    <FileText className="w-4 h-4 text-[#9C42F5]" /> 
                    <span className="max-w-[150px] truncate">{file.name}</span>
                    <button 
                      onClick={() => removeUploadedFile(file.id)}
                      className="absolute right-3.5 text-[#8A8A9E] hover:text-red-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <label className="w-full border border-dashed border-[#9C42F5] text-[#9C42F5] rounded-[24px] px-4 py-3 flex items-center justify-center text-sm font-semibold gap-1.5 bg-transparent hover:bg-[#F4E8FF] transition-colors cursor-pointer">
              <input type="file" className="hidden" accept="image/*,.pdf" onChange={handleFileUpload} />
              <Send className="w-4.5 h-4.5" /> Upload Lab PDF / Image
            </label>
          </div>
        </div>

        {/* Clinical Findings */}
        <div className="px-5 mb-6">
          <div className="flex items-center mb-4">
            <FileText className="text-[#9C42F5] w-5 h-5 mr-2.5" />
            <div className="text-[#A1A1B5] text-[11px] font-bold tracking-widest uppercase flex-1">
              CLINICAL FINDINGS & SUMMARY
            </div>
          </div>
          <textarea 
            value={clinicalFindings}
            onChange={(e) => setClinicalFindings(e.target.value)}
            placeholder="Add additional professional notes, observed symptoms, or general remarks..." 
            className="w-full h-[100px] bg-white border border-[#EFEFF5] rounded-[20px] p-4 text-sm font-medium outline-none resize-none shadow-sm leading-relaxed focus:border-[#9C42F5]-intensity"
          ></textarea>
        </div>

        {/* Next Appointment */}
        <div className="px-5 mb-6">
          <div className="flex items-center mb-4">
            <Calendar className="text-[#9C42F5] w-5 h-5 mr-2.5" />
            <div className="text-[#A1A1B5] text-[11px] font-bold tracking-widest uppercase flex-1">
              NEXT APPOINTMENT
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-1 min-w-0 relative">
              <label className="text-[#A1A1B5] text-[10px] font-bold tracking-wider mb-2.5 block ml-1 uppercase">DATE</label>
              <input 
                type={nextApptDate ? "date" : "text"}
                onFocus={(e) => { e.currentTarget.type = "date"; }}
                onBlur={(e) => { if (!nextApptDate) e.currentTarget.type = "text"; }}
                placeholder="Choose date"
                value={nextApptDate}
                onChange={(e) => setNextApptDate(e.target.value)}
                className="w-full bg-white border border-[#EFEFF5] rounded-[16px] pl-3 pr-10 py-3 text-sm font-medium outline-none focus:border-[#9C42F5] shadow-sm appearance-none cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer" 
              />
              <Calendar className="w-4.5 h-4.5 text-[#1E1E2D] absolute right-3.5 bottom-3.5 pointer-events-none" />
            </div>
            <div className="flex-1 min-w-0 relative">
              <label className="text-[#A1A1B5] text-[10px] font-bold tracking-wider mb-2.5 block ml-1 uppercase">TIME</label>
              <input 
                type={nextApptTime ? "time" : "text"}
                onFocus={(e) => { e.currentTarget.type = "time"; }}
                onBlur={(e) => { if (!nextApptTime) e.currentTarget.type = "text"; }}
                placeholder="Choose time"
                value={nextApptTime}
                onChange={(e) => setNextApptTime(e.target.value)}
                className="w-full bg-white border border-[#EFEFF5] rounded-[16px] pl-3 pr-10 py-3 text-sm font-medium outline-none focus:border-[#9C42F5] shadow-sm appearance-none cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer" 
              />
              <Clock className="w-4.5 h-4.5 text-[#1E1E2D] absolute right-3.5 bottom-3.5 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Consultation Outcome */}
        <div className="px-5 mb-10">
          <div className="flex items-center mb-4">
            <CheckCircle2 className="text-[#9C42F5] w-5 h-5 mr-2.5" />
            <div className="text-[#A1A1B5] text-[11px] font-bold tracking-widest uppercase flex-1">
              CONSULTATION OUTCOME
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {["Recovered", "Under Treatment", "Follow-up Required", "Emergency Referral"].map((item) => (
              <div 
                key={item}
                onClick={() => setOutcome(item)}
                className={`px-4 py-2.5 rounded-[24px] text-xs font-semibold flex items-center justify-center cursor-pointer transition-all ${
                  outcome === item 
                    ? item === "Emergency Referral" 
                      ? "bg-red-50 text-red-500 border border-red-200" 
                      : "bg-[#F4E8FF] text-[#9C42F5] border border-transparent"
                    : "bg-white text-[#1E1E2D] border border-[#EFEFF5]"
                }`}
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Action Area */}
        <div className="px-5 mb-10">
          <button 
            disabled={isSubmitting}
            onClick={handleGenerate}
            className="w-full bg-gradient-to-br from-[#A855F7] to-[#7E22CE] text-white rounded-[30px] p-[18px] text-base font-semibold flex items-center justify-center gap-2.5 shadow-[0_10px_25px_rgba(156,66,245,0.4)] active:scale-95 transition-all font-bold disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
               <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
               <Send className="w-5 h-5" />
            )}
            {isSubmitting ? 'Saving Prescription...' : 'Generate & Send Prescription'}
          </button>
        </div>
      </div>

      {/* Success Modal */}
      <AnimatePresence>
        {isSuccessModalOpen && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-5">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={handleFinalSubmit}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-[400px] bg-white rounded-[28px] p-6 text-center shadow-2xl"
            >
              <h3 className="text-[19px] font-bold text-[#1E1E2D] flex items-center justify-center gap-2 mb-1">
                Prescription Sent!
              </h3>
              <p className="text-[#8A8A9E] text-xs font-medium mb-5">Instantly available in owner's Sruvo app.</p>
              <hr className="border-[#EFEFF5] mb-5" />
              <p className="text-[14px] font-bold mb-4">How was your consultation experience?</p>
              <div className="flex justify-center gap-3 mb-8">
                {[1, 2, 3, 4, 5].map((num) => (
                  <Star 
                    key={num} 
                    onClick={() => setRating(num)}
                    className={`w-10 h-10 cursor-pointer transition-colors ${rating >= num ? 'fill-[#FFC107] text-[#FFC107]' : 'text-[#E2E2EC]'}`} 
                  />
                ))}
              </div>
              <button 
                onClick={handleFinalSubmit}
                className="w-full bg-[#F0F0F5] text-[#1E1E2D] py-3.5 rounded-[20px] text-sm font-semibold hover:bg-gray-200 transition-colors"
              >
                Submit & Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Pharmacy Inventory Modal */}
      <AnimatePresence>
        {isInventoryOpen && (
          <div className="fixed inset-0 z-[1000] flex items-end justify-center">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsInventoryOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: "100%" }} 
              animate={{ y: 0 }} 
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-[500px] bg-white rounded-t-[32px] p-6 max-h-[88vh] overflow-y-auto no-scrollbar shadow-2xl"
            >
              <div className="flex justify-between items-center mb-4">
                <div className="flex-1">
                  <h3 className="text-[19px] font-bold">Pharmacy Inventory</h3>
                  <p className="text-[#8A8A9E] text-[13px] font-medium">Attach items directly to prescription form</p>
                </div>
                <button 
                  onClick={() => setIsInventoryOpen(false)}
                  className="p-1.5 bg-[#F0F0F5] rounded-full text-[#A1A1B5]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="bg-[#F8F8FC] flex items-center px-3.5 py-2.5 rounded-[14px] mb-4">
                <Search className="w-4.5 h-4.5 text-[#9C42F5] mr-2.5" />
                <input 
                  type="text" 
                  placeholder="Search item in system database..." 
                  className="bg-transparent border-none outline-none w-full text-sm font-medium"
                />
              </div>

              <div className="flex flex-col gap-3 mb-5">
                {inventoryMedicines.map((item, i) => (
                  <div 
                    key={i} 
                    onClick={() => addMedicine({
                      name: item.medicine_name || item.name,
                      type: item.form_type || item.type,
                      price: item.unit_price ? `₹${item.unit_price}` : item.price
                    })}
                    className="flex items-center justify-between bg-[#F8F8FC] p-3 rounded-[18px] border border-transparent hover:border-[#F4E8FF] hover:bg-[#FAF6FF] transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-[12px] flex items-center justify-center shrink-0 ${i % 3 === 1 ? 'bg-[#FFE6EE]' : i % 3 === 2 ? 'bg-[#E1F7E3]' : 'bg-[#EAE6FF]'}`}>
                        {i % 3 === 2 ? <CheckCircle2 className="w-6 h-6 text-[#22C55E]" /> : <Pill className={`w-6 h-6 ${i % 3 === 1 ? 'text-red-500' : 'text-[#9C42F5]'}`} />}
                      </div>
                      <div className="text-left">
                        <h5 className="text-sm font-semibold">{item.medicine_name || item.name}</h5>
                        <p className="text-[#8A8A9E] text-xs font-medium">{item.unit_price ? `₹${item.unit_price}` : item.price} • {item.form_type || item.type}</p>
                      </div>
                    </div>
                    <div className="bg-white text-[#9C42F5] border border-[#EFEFF5] p-2 rounded-[14px] group-hover:bg-[#9C42F5] group-hover:text-white group-hover:border-[#9C42F5] transition-all">
                      <Plus className="w-4 h-4" />
                    </div>
                  </div>
                ))}
              </div>

              <hr className="border-[#EFEFF5] mb-3" />
              
              <button 
                onClick={() => setShowCustomMedForm(!showCustomMedForm)}
                className="w-full text-[#9C42F5] text-[13px] font-bold flex items-center justify-center gap-1.5 p-2.5 rounded-[12px] hover:bg-[#F4E8FF] transition-colors"
              >
                <Plus className="w-4.5 h-4.5" /> Not in inventory? Prescribe custom item
              </button>

              {showCustomMedForm && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }} 
                  animate={{ opacity: 1, scale: 1 }} 
                  className="bg-[#FAF8FF] border border-dashed border-[#9C42F5] p-4 rounded-[20px] mt-3.5 flex flex-col gap-3"
                >
                  <div className="flex flex-col gap-1.5 text-left">
                    <span className="text-[9px] text-[#8A8A9E] font-semibold uppercase">Medicine Name</span>
                    <input 
                      type="text" 
                      value={customMed.name}
                      onChange={(e) => setCustomMed({ ...customMed, name: e.target.value })}
                      placeholder="e.g. Panacur Rabbit" 
                      className="bg-white border border-[#EFEFF5] rounded-[12px] px-3.5 py-2.5 text-sm font-medium outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 text-left">
                    <span className="text-[9px] text-[#8A8A9E] font-semibold uppercase">Form / Type</span>
                    <input 
                      type="text" 
                      value={customMed.type}
                      onChange={(e) => setCustomMed({ ...customMed, type: e.target.value })}
                      placeholder="e.g. Tablet / Syrup / Injection" 
                      className="bg-white border border-[#EFEFF5] rounded-[12px] px-3.5 py-2.5 text-sm font-medium outline-none"
                    />
                  </div>
                  <button 
                    onClick={() => {
                        if (!customMed.name) return;
                        addMedicine({ name: customMed.name, type: customMed.type || "Custom Formulation" });
                        setCustomMed({ name: "", type: "" });
                        setShowCustomMedForm(false);
                    }}
                    className="w-full bg-[#9C42F5] text-white py-3 rounded-[14px] text-xs font-bold mt-1 shadow-md active:scale-95 transition-transform"
                  >
                    Confirm & Attach Recommendation
                  </button>
                </motion.div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Lab Test Modal */}
      <AnimatePresence>
        {isCustomTestOpen && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-5">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsCustomTestOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-[400px] bg-white rounded-[28px] p-6 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-4">
                <div className="text-left">
                  <h3 className="text-[19px] font-bold">Custom Lab Test</h3>
                  <p className="text-[#8A8A9E] text-[13px] font-medium">Recommend a specific test to pet parent</p>
                </div>
                <button 
                  onClick={() => setIsCustomTestOpen(false)}
                  className="p-1.5 bg-[#F0F0F5] rounded-full text-[#A1A1B5]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex flex-col gap-4 text-left mb-6">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[9px] text-[#8A8A9E] font-semibold uppercase">Test Name</span>
                  <input 
                    type="text" 
                    value={customTest.name}
                    onChange={(e) => setCustomTest({ ...customTest, name: e.target.value })}
                    placeholder="e.g. Thyroid Profile (T3, T4, TSH)" 
                    className="bg-white border border-[#EFEFF5] rounded-[16px] px-3.5 py-3 text-sm font-medium outline-none focus:border-[#9C42F5]"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[9px] text-[#8A8A9E] font-semibold uppercase">Specific Instructions (Optional)</span>
                  <input 
                    type="text" 
                    value={customTest.note}
                    onChange={(e) => setCustomTest({ ...customTest, note: e.target.value })}
                    placeholder="e.g. 12-hour fasting required" 
                    className="bg-white border border-[#EFEFF5] rounded-[16px] px-3.5 py-3 text-sm font-medium outline-none focus:border-[#9C42F5]"
                  />
                </div>
              </div>
              
              <button 
                onClick={addCustomTest}
                className="w-full bg-[#9C42F5] text-white py-4 rounded-[18px] text-sm font-bold shadow-lg active:scale-95 transition-transform"
              >
                Add to Prescription
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CreatePrescription;
