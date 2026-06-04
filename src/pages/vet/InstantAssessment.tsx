import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, X, ArrowRight, Smile, AlertTriangle, Asterisk, Camera, Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const petTypes = [
  { id: "dog", label: "Dog", img: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=120&h=120&fit=crop" },
  { id: "cat", label: "Cat", img: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=120&h=120&fit=crop" },
  { id: "bird", label: "Bird", img: "https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=120&h=120&fit=crop" },
  { id: "hamster", label: "Hamster", img: "https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=120&h=120&fit=crop" },
];

const symptomsList = ["Lethargy", "Vomiting", "Loss of Appetite", "Itching", "Coughing", "Diarrhea"];
const durations = ["Today", "2–3 Days", "1+ Week"];
const urgencyLevels = [
  { id: "mild", label: "MILD", icon: Smile, color: "text-green-500", bg: "bg-green-50", border: "border-green-200" },
  { id: "concerned", label: "CONCERNED", icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-50", border: "border-amber-200" },
  { id: "urgent", label: "URGENT", icon: Asterisk, color: "text-red-500", bg: "bg-red-50", border: "border-red-200" },
];

const stepLabels = ["Pet Profile", "Symptoms Analysis", "Health History", "Photo Upload", "Review"];

const InstantAssessment = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [animating, setAnimating] = useState(false);

  // Step 1 state
  const [selectedPet, setSelectedPet] = useState("dog");
  const [petName, setPetName] = useState("");
  const [years, setYears] = useState("");
  const [months, setMonths] = useState("");

  // Step 2 state
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [otherSymptom, setOtherSymptom] = useState("");
  const [additionalDetails, setAdditionalDetails] = useState("");
  const [duration, setDuration] = useState("Today");
  const [urgency, setUrgency] = useState("concerned");

  // Step 3 state
  const [vaccinated, setVaccinated] = useState<string>("");
  const [existingConditions, setExistingConditions] = useState("");
  const [medications, setMedications] = useState("");

  // Step 4 state
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type === "image/jpeg" || file.type === "image/png") {
        setPhotoFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setPhotoPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const isStepValid = () => {
    switch (step) {
      case 1:
        return selectedPet && petName.trim() && (years || months);
      case 2:
        return selectedSymptoms.length > 0 || otherSymptom.trim() !== "";
      case 3:
        return vaccinated !== "";
      case 4:
        return true; // Photo is optional based on original code, but user can upload
      case 5:
        return true;
      default:
        return false;
    }
  };

  const goNext = () => {
    if (!isStepValid() || step >= 5 || animating) return;
    setDirection("forward");
    setAnimating(true);
    setTimeout(() => {
      setStep(s => s + 1);
      setAnimating(false);
    }, 300);
  };

  const goBack = () => {
    if (step <= 1 || animating) return;
    setDirection("backward");
    setAnimating(true);
    setTimeout(() => {
      setStep(s => s - 1);
      setAnimating(false);
    }, 300);
  };

  const toggleSymptom = (s: string) => {
    setSelectedSymptoms(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const { user } = useAuth();

  const progressPercent = (step / 5) * 100;

  const animClass = animating
    ? direction === "forward"
      ? "animate-slide-out-left"
      : "animate-slide-out-right"
    : direction === "forward"
      ? "animate-slide-in-right-custom"
      : "animate-slide-in-left";

  const ctaLabels = ["Continue", "Continue", "Continue", "Continue", "Analyze Symptoms"];

  const handleAnalyze = () => {
    navigate("/vet/instant-analyzing", { 
      state: { 
        flowType: "instant",
        selectedPet, 
        petName, 
        years, 
        months, 
        selectedSymptoms, 
        duration, 
        urgency, 
        additionalDetails, 
        vaccinated, 
        existingConditions, 
        medications,
        photoPreview
      } 
    });
  };

  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden">
      {/* Fixed Header */}
      <header className="flex-shrink-0 px-4 pt-5 pb-3">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => step > 1 ? goBack() : navigate("/vet/consultation-plan")} className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="text-center">
            <p className="text-sm font-bold text-foreground">AI Vet Assistant</p>
            <p className="text-xs font-bold tracking-widest uppercase" style={{ color: '#FF4D6D' }}>GUIDED DIAGNOSIS</p>
          </div>
          <button onClick={() => navigate("/buyer/vet")} className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center">
            <X className="w-5 h-5 text-foreground" />
          </button>
        </div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold text-muted-foreground">STEP {step} OF 5</span>
          <span className="text-xs font-semibold italic" style={{ color: '#FF4D6D' }}>{stepLabels[step - 1]}</span>
        </div>
        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%`, background: 'linear-gradient(90deg, #FF4D6D, #8B5CF6)' }}
          />
        </div>
      </header>

      {/* Scrollable Step Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div key={step} className={animClass} style={{ minHeight: '100%' }}>
          {step === 1 && <Step1
            selectedPet={selectedPet} setSelectedPet={setSelectedPet}
            petName={petName} setPetName={setPetName}
            years={years} setYears={setYears}
            months={months} setMonths={setMonths}
          />}
          {step === 2 && <Step2
            selectedSymptoms={selectedSymptoms} toggleSymptom={toggleSymptom}
            otherSymptom={otherSymptom} setOtherSymptom={setOtherSymptom}
            additionalDetails={additionalDetails} setAdditionalDetails={setAdditionalDetails}
            duration={duration} setDuration={setDuration}
            urgency={urgency} setUrgency={setUrgency}
            handleFileUpload={handleFileUpload} photoPreview={photoPreview}
          />}
          {step === 3 && <Step3
            vaccinated={vaccinated} setVaccinated={setVaccinated}
            existingConditions={existingConditions} setExistingConditions={setExistingConditions}
            medications={medications} setMedications={setMedications}
          />}
          {step === 4 && <Step4 photoPreview={photoPreview} handleFileUpload={handleFileUpload} />}
          {step === 5 && <Step5
            selectedPet={selectedPet} petName={petName} years={years} months={months}
            selectedSymptoms={selectedSymptoms} duration={duration} urgency={urgency}
            additionalDetails={additionalDetails} photoPreview={photoPreview}
          />}
        </div>
      </div>

      {/* Fixed Footer CTA */}
      <div className="flex-shrink-0 px-4 pb-4 pt-3 bg-gradient-to-t from-white via-white to-transparent">
        <div className="flex items-center gap-3">
          {step > 1 && (
            <button onClick={goBack} className="w-12 h-12 rounded-full border border-border flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-muted-foreground" />
            </button>
          )}
          <button
            onClick={step === 5 ? handleAnalyze : goNext}
            disabled={!isStepValid()}
            className={`flex-1 py-4 rounded-2xl font-bold text-white text-base flex items-center justify-center gap-2 shadow-lg transition-all ${!isStepValid() ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:shadow-xl active:scale-95'}`}
            style={{ background: 'linear-gradient(90deg, #FF4D6D, #8B5CF6)' }}
          >
            {ctaLabels[step - 1]}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

/* ── Step 1: Pet Profile ── */
function Step1({ selectedPet, setSelectedPet, petName, setPetName, years, setYears, months, setMonths }: any) {
  return (
    <div className="space-y-6 pt-4">
      <section>
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2 mb-3">
          <span className="w-1 h-5 rounded-full" style={{ background: '#FF4D6D' }} />
          Who is this for?
        </h3>
        <div className="flex gap-4">
          {petTypes.map(p => (
            <button key={p.id} onClick={() => setSelectedPet(p.id)} className="flex flex-col items-center gap-1">
              <div className={`w-16 h-16 rounded-full overflow-hidden border-2 transition-all ${selectedPet === p.id ? 'border-pink-500 ring-2 ring-pink-200' : 'border-transparent grayscale opacity-60'}`}>
                <img src={p.img} alt={p.label} className="w-full h-full object-cover" />
              </div>
              <span className={`text-xs font-semibold ${selectedPet === p.id ? 'text-pink-500' : 'text-muted-foreground'}`}>{p.label}</span>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2 mb-3">
          <span className="w-1 h-5 rounded-full" style={{ background: '#FF4D6D' }} />
          What's your pet's name?
        </h3>
        <input
          type="text"
          value={petName}
          onChange={e => setPetName(e.target.value)}
          placeholder="e.g. Buddy"
          className="w-full border border-border rounded-xl px-4 py-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-pink-200"
        />
      </section>

      <section>
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2 mb-3">
          <span className="w-1 h-5 rounded-full" style={{ background: '#FF4D6D' }} />
          How old is your pet?
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <input type="number" value={years} onChange={e => setYears(e.target.value)} placeholder="Years" className="border border-border rounded-xl px-4 py-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-pink-200" />
          <input type="number" value={months} onChange={e => setMonths(e.target.value)} placeholder="Months" className="border border-border rounded-xl px-4 py-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-pink-200" />
        </div>
      </section>
    </div>
  );
}

/* ── Step 2: Symptoms Analysis ── */
function Step2({ selectedSymptoms, toggleSymptom, otherSymptom, setOtherSymptom, additionalDetails, setAdditionalDetails, duration, setDuration, urgency, setUrgency, handleFileUpload, photoPreview }: any) {
  const fileInputRef = (input: any) => {
    if (input) {
      // We can trigger click via label or button
    }
  };

  return (
    <div className="space-y-6 pt-4">
      <section>
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2 mb-3">
          <span className="w-1 h-5 rounded-full" style={{ background: '#FF4D6D' }} />
          Select Symptoms
        </h3>
        <div className="flex flex-wrap gap-2">
          {symptomsList.map(s => (
            <button
              key={s}
              onClick={() => toggleSymptom(s)}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${selectedSymptoms.includes(s) ? 'text-white border-transparent' : 'text-foreground border-border bg-background'}`}
              style={selectedSymptoms.includes(s) ? { background: 'linear-gradient(90deg, #FF4D6D, #c44dff)' } : {}}
            >
              {s}
            </button>
          ))}
          <button
            onClick={() => setOtherSymptom(otherSymptom ? "" : " ")}
            className="px-4 py-2 rounded-full text-sm font-medium border border-border text-foreground bg-background"
          >
            + Other
          </button>
        </div>
        {otherSymptom !== "" && (
          <input
            type="text"
            value={otherSymptom.trim()}
            onChange={e => setOtherSymptom(e.target.value)}
            placeholder="Describe other symptom"
            className="mt-2 w-full border border-border rounded-xl px-4 py-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-pink-200"
          />
        )}
      </section>

      <section>
        <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase mb-2">Additional Details</p>
        <textarea
          value={additionalDetails}
          onChange={e => setAdditionalDetails(e.target.value)}
          rows={3}
          placeholder="Describe behavior, stool color, or any recent changes..."
          className="w-full border border-border rounded-xl px-4 py-3 text-sm bg-background resize-y focus:outline-none focus:ring-2 focus:ring-pink-200"
        />
      </section>

      <section>
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2 mb-3">
          <span className="w-1 h-5 rounded-full" style={{ background: '#FF4D6D' }} />
          Duration of issue
        </h3>
        <div className="flex gap-2">
          {durations.map(d => (
            <button
              key={d}
              onClick={() => setDuration(d)}
              className={`flex-1 py-2.5 rounded-full text-sm font-medium border transition-all ${duration === d ? 'text-pink-500 border-pink-300 bg-pink-50' : 'text-muted-foreground border-border bg-background'}`}
            >
              {d}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2 mb-3">
          <span className="w-1 h-5 rounded-full" style={{ background: '#FF4D6D' }} />
          Urgency Level
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {urgencyLevels.map(u => {
            const Icon = u.icon;
            return (
              <button
                key={u.id}
                onClick={() => setUrgency(u.id)}
                className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-all ${urgency === u.id ? `${u.bg} ${u.border}` : 'border-transparent bg-muted/30'}`}
              >
                <Icon className={`w-6 h-6 ${u.color}`} />
                <span className={`text-xs font-bold ${urgency === u.id ? u.color : 'text-muted-foreground'}`}>{u.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="bg-amber-50 rounded-2xl p-4">
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
            <span className="text-purple-500 text-lg">✦</span>
          </div>
          <div className="flex-1">
            <p className="font-bold text-foreground text-sm">AI Assistant Tip</p>
            <p className="text-xs text-muted-foreground mt-1">Adding a photo of the affected area helps me provide a more accurate initial assessment.</p>
            <label className="flex items-center gap-1 mt-2 text-xs font-bold cursor-pointer" style={{ color: '#FF4D6D' }}>
              <Camera className="w-3.5 h-3.5" /> 
              {photoPreview ? "Photo Added ✓" : "Upload Photo"}
              <input type="file" accept="image/jpeg,image/png" className="hidden" onChange={handleFileUpload} />
            </label>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ── Step 3: Health History ── */
function Step3({ vaccinated, setVaccinated, existingConditions, setExistingConditions, medications, setMedications }: any) {
  return (
    <div className="space-y-6 pt-4">
      <section>
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2 mb-3">
          <span className="w-1 h-5 rounded-full" style={{ background: '#8B5CF6' }} />
          Is your pet vaccinated?
        </h3>
        <div className="flex gap-2">
          {["Yes", "No", "Not Sure"].map(v => (
            <button
              key={v}
              onClick={() => setVaccinated(v)}
              className={`flex-1 py-2.5 rounded-full text-sm font-medium border transition-all ${vaccinated === v ? 'text-purple-600 border-purple-300 bg-purple-50' : 'text-muted-foreground border-border bg-background'}`}
            >
              {v}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2 mb-3">
          <span className="w-1 h-5 rounded-full" style={{ background: '#8B5CF6' }} />
          Any existing conditions?
        </h3>
        <textarea
          value={existingConditions}
          onChange={e => setExistingConditions(e.target.value)}
          rows={3}
          placeholder="e.g. Allergies, past surgeries, chronic conditions..."
          className="w-full border border-border rounded-xl px-4 py-3 text-sm bg-background resize-y focus:outline-none focus:ring-2 focus:ring-purple-200"
        />
      </section>

      <section>
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2 mb-3">
          <span className="w-1 h-5 rounded-full" style={{ background: '#8B5CF6' }} />
          Current medications?
        </h3>
        <textarea
          value={medications}
          onChange={e => setMedications(e.target.value)}
          rows={2}
          placeholder="List any medications your pet is currently taking..."
          className="w-full border border-border rounded-xl px-4 py-3 text-sm bg-background resize-y focus:outline-none focus:ring-2 focus:ring-purple-200"
        />
      </section>
    </div>
  );
}

/* ── Step 4: Photo Upload ── */
function Step4({ photoPreview, handleFileUpload }: any) {
  return (
    <div className="space-y-6 pt-4">
      <section>
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2 mb-3">
          <span className="w-1 h-5 rounded-full" style={{ background: '#FF4D6D' }} />
          Upload Photos (Optional)
        </h3>
        <p className="text-sm text-muted-foreground mb-4">Photos help our AI provide a more accurate assessment.</p>
        <label className="w-full border-2 border-dashed border-border rounded-2xl py-8 flex flex-col items-center gap-3 hover:border-pink-300 transition-colors cursor-pointer bg-muted/5">
          {photoPreview ? (
            <div className="relative w-32 h-32 rounded-xl overflow-hidden border-2 border-pink-200">
               <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-14 h-14 rounded-full bg-pink-50 flex items-center justify-center">
              <Camera className="w-7 h-7 text-pink-500" />
            </div>
          )}
          <p className="text-sm font-semibold text-foreground">{photoPreview ? "Change Photo ✓" : "Tap to upload photo"}</p>
          <p className="text-xs text-muted-foreground">JPG, PNG up to 10MB</p>
          <input type="file" accept="image/jpeg,image/png" className="hidden" onChange={handleFileUpload} />
        </label>
      </section>

      <section className="bg-purple-50 rounded-2xl p-4">
        <p className="font-bold text-foreground text-sm mb-1">📸 Photo Tips</p>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• Take photos in good lighting</li>
          <li>• Focus on the affected area</li>
          <li>• Include a size reference if possible</li>
        </ul>
      </section>
    </div>
  );
}

/* ── Step 5: Review ── */
function Step5({ selectedPet, petName, years, months, selectedSymptoms, duration, urgency, additionalDetails, photoPreview }: any) {
  return (
    <div className="space-y-4 pt-4 pb-20">
      <h3 className="text-lg font-bold text-foreground flex items-center gap-2 mb-2">
        <span className="w-1 h-5 rounded-full" style={{ background: '#8B5CF6' }} />
        Review Your Assessment
      </h3>

      <div className="bg-muted/30 rounded-2xl p-4 space-y-3">
        <Row label="Pet Type" value={selectedPet.charAt(0).toUpperCase() + selectedPet.slice(1)} />
        {petName && <Row label="Name" value={petName} />}
        <Row label="Age" value={`${years || 0} yrs ${months || 0} months`} />
        <Row label="Symptoms" value={selectedSymptoms.length ? selectedSymptoms.join(", ") : "None selected"} />
        <Row label="Duration" value={duration} />
        <Row label="Urgency" value={urgency.charAt(0).toUpperCase() + urgency.slice(1)} />
        {additionalDetails && <Row label="Details" value={additionalDetails} />}
        {photoPreview && (
          <div className="flex justify-between items-center py-1">
            <span className="text-xs text-muted-foreground font-medium">Attached Photo</span>
            <div className="w-12 h-12 rounded-lg overflow-hidden border border-border">
              <img src={photoPreview} alt="Attached" className="w-full h-full object-cover" />
            </div>
          </div>
        )}
      </div>

      <div className="bg-green-50 rounded-2xl p-4 flex gap-3 items-start">
        <span className="text-2xl">🩺</span>
        <div>
          <p className="font-bold text-foreground text-sm">Ready for Analysis</p>
          <p className="text-xs text-muted-foreground mt-1">Our AI will analyze your pet's symptoms and connect you with the best-matched veterinarian.</p>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start">
      <span className="text-xs text-muted-foreground font-medium">{label}</span>
      <span className="text-sm font-semibold text-foreground text-right max-w-[60%]">{value}</span>
    </div>
  );
}

export default InstantAssessment;
