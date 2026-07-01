import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Stethoscope, 
  Video, 
  Briefcase, 
  Home, 
  Calendar, 
  Clock, 
  Sparkles, 
  Check, 
  Pencil, 
  User, 
  Award, 
  Activity, 
  HeartPulse,
  AlertCircle,
  X,
  Languages,
  ShieldAlert,
  Save,
  Undo2,
  Dog,
  Cat,
  Bird
} from "lucide-react";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import SplashScreen from "@/components/SplashScreen";

// Helper components for UI
const HamsterIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect x="5" y="8" width="14" height="12" rx="6" />
    <path d="M7 8V5a2 2 0 1 1 4 0v3" />
    <path d="M13 8V5a2 2 0 1 1 4 0v3" />
    <circle cx="9.5" cy="13.5" r="1.2" fill="currentColor" />
    <circle cx="14.5" cy="13.5" r="1.2" fill="currentColor" />
  </svg>
);

const SPECIALIZATION_OPTIONS = ["Dog", "Cat", "Bird", "Hamster"];

const MEDICAL_SPEC_OPTIONS: Record<string, string[]> = {
  Dog: [
    "General Practice",
    "Internal Medicine",
    "Surgery",
    "Orthopedic Surgery",
    "Dermatology (Skin)",
    "Ophthalmology (Eyes)",
    "Dentistry",
    "Cardiology",
    "Neurology",
    "Oncology",
    "Nutrition",
    "Behaviour Medicine",
    "Reproductive Medicine",
    "Emergency & Critical Care",
    "Diagnostic Imaging"
  ],
  Cat: [
    "General Practice",
    "Internal Medicine",
    "Surgery",
    "Dermatology",
    "Ophthalmology",
    "Dentistry",
    "Cardiology",
    "Nutrition",
    "Behaviour Medicine",
    "Emergency & Critical Care",
    "Diagnostic Imaging"
  ],
  Bird: [
    "Avian Medicine",
    "Avian Surgery",
    "Emergency & Critical Care",
    "Nutrition",
    "Behaviour",
    "Diagnostic Imaging"
  ],
  Hamster: [
    "Exotic Pet Medicine",
    "Small Mammal Surgery",
    "Nutrition",
    "Emergency Care",
    "Diagnostic Imaging"
  ]
};

const EXPERTISE_DOG = [
  "Puppy Health & Growth", "Senior Dog Wellness", "Skin, Coat & Allergy Care", "Digestive & Stomach Problems", "Weight Management", "Joint & Mobility Issues", "Arthritis Care", "Ear Infections", "Eye Health", "Anxiety & Behavioral Training", "Vaccination & Preventive Care", "Chronic Disease Management", "Post-Surgical Recovery", "Emergency & Critical Care", "Nutrition Planning"
];

const EXPERTISE_CAT = [
  "Kitten Health & Growth", "Senior Cat Wellness", "Urinary & Kidney Issues", "Skin & Coat Health", "Digestive Problems", "Weight Management", "Anxiety & Behavioral Issues", "Eye Health", "Ear Infections", "Diabetes Management", "Vaccination & Preventive Care", "Chronic Disease Management", "Post-Surgical Recovery", "Emergency & Critical Care", "Nutrition Planning"
];

const EXPERTISE_BIRD = [
  "General Avian Care", "Feather Picking & Feather Loss", "Beak & Nail Disorders", "Respiratory Problems", "Nutritional Deficiencies", "Digestive Issues", "Behavioral Problems", "Eye Health", "Egg-Laying & Reproductive Issues", "Vaccination & Preventive Care", "Post-Surgical Recovery", "Emergency & Critical Care"
];

const EXPERTISE_HAMSTER = [
  "General Small Animal Care", "Dental & Teeth Problems", "Digestive Issues", "Skin & Fur Conditions", "Nutritional Care", "Weight Management", "Respiratory Problems", "Behavioral Issues", "Senior Small Animal Care", "Preventive Care", "Emergency Care"
];

const MyServices = () => {
  const navigate = useNavigate();
  const { user, isLoading: guardLoading, showSpinner } = useRoleGuard(["vet"], "/auth/vet", true);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Core Form / Display states
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [clinicalExpertise, setClinicalExpertise] = useState<string[]>([]);
  const [medicalSpecializations, setMedicalSpecializations] = useState<Record<string, { primary: string; secondary: string[] }>>({});
  const [consultationTypes, setConsultationTypes] = useState<string[]>([]);
  const [yearsOfExperience, setYearsOfExperience] = useState("0");
  const [onlineFee, setOnlineFee] = useState("500");
  const [offlineFee, setOfflineFee] = useState("800");
  const [emergencyAvailable, setEmergencyAvailable] = useState(false);
  const [support24x7, setSupport24x7] = useState("no");
  const [weekendAvailability, setWeekendAvailability] = useState("no");

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("vet_profiles")
        .select(`
          specializations,
          clinical_expertise,
          medical_specializations,
          consultation_type,
          online_fee,
          offline_fee,
          years_of_experience,
          emergency_available,
          support_24x7,
          weekend_availability
        `)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching vet details:", error);
        toast.error("Failed to load active services");
      } else if (data) {
        setSpecializations(data.specializations || []);
        setClinicalExpertise(data.clinical_expertise || []);
        
        const medSpecs = (data.medical_specializations as Record<string, { primary: string; secondary: string[] }>) || {};
        setMedicalSpecializations(medSpecs);
        
        const types = data.consultation_type ? data.consultation_type.split(", ") : [];
        setConsultationTypes(types);
        
        setYearsOfExperience(data.years_of_experience?.toString() || "0");
        setOnlineFee(data.online_fee?.toString() || "500");
        setOfflineFee(data.offline_fee?.toString() || "800");
        setEmergencyAvailable(data.emergency_available ?? false);
        setSupport24x7(data.support_24x7 || "no");
        setWeekendAvailability(data.weekend_availability || "no");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, fetchData]);

  // Handle toggles in Edit Mode
  const toggleSpecialization = (spec: string) => {
    let updated = [...specializations];
    if (updated.includes(spec)) {
      updated = updated.filter(s => s !== spec);
    } else {
      updated.push(spec);
    }
    setSpecializations(updated);

    // Filter clinical expertise tags for species that are no longer selected
    const allowedTags = [
      ...(updated.includes("Dog") ? EXPERTISE_DOG : []),
      ...(updated.includes("Cat") ? EXPERTISE_CAT : []),
      ...(updated.includes("Bird") ? EXPERTISE_BIRD : []),
      ...(updated.includes("Hamster") ? EXPERTISE_HAMSTER : [])
    ];
    setClinicalExpertise(prev => prev.filter(tag => allowedTags.includes(tag)));

    // Clean up medical specializations for unselected species
    const updatedMedSpecs = { ...medicalSpecializations };
    Object.keys(updatedMedSpecs).forEach(key => {
      if (!updated.includes(key)) {
        delete updatedMedSpecs[key];
      }
    });
    setMedicalSpecializations(updatedMedSpecs);
  };

  const setPrimarySpec = (spec: string, val: string) => {
    setMedicalSpecializations(prev => {
      const current = prev[spec] || { primary: "", secondary: [] };
      return {
        ...prev,
        [spec]: {
          primary: val,
          secondary: current.secondary.filter(s => s !== val)
        }
      };
    });
  };

  const toggleSecondarySpec = (spec: string, val: string) => {
    setMedicalSpecializations(prev => {
      const current = prev[spec] || { primary: "", secondary: [] };
      let secondary = [...current.secondary];
      if (secondary.includes(val)) {
        secondary = secondary.filter(s => s !== val);
      } else {
        if (secondary.length >= 3) {
          toast.warning("You can choose up to 3 secondary specializations.");
          return prev;
        }
        secondary.push(val);
      }
      return {
        ...prev,
        [spec]: {
          primary: current.primary === val ? "" : current.primary,
          secondary
        }
      };
    });
  };

  const toggleClinicalExpertise = (tag: string) => {
    setClinicalExpertise(prev => {
      if (prev.includes(tag)) {
        return prev.filter(t => t !== tag);
      } else {
        return [...prev, tag];
      }
    });
  };

  const toggleConsultationType = (type: string) => {
    setConsultationTypes(prev => {
      if (prev.includes(type)) {
        return prev.filter(t => t !== type);
      } else {
        return [...prev, type];
      }
    });
  };

  const handleSave = async () => {
    if (consultationTypes.length === 0) {
      toast.error("Please choose at least one Consultation Type.");
      return;
    }

    const expVal = parseInt(yearsOfExperience) || 0;
    if (expVal < 0) {
      toast.error("Experience cannot be negative.");
      return;
    }

    const onlineVal = parseFloat(onlineFee) || 0;
    const offlineVal = parseFloat(offlineFee) || 0;

    if (consultationTypes.includes("Video consultation") && onlineVal <= 0) {
      toast.error("Please set a valid fee for Video Consultations.");
      return;
    }
    if ((consultationTypes.includes("Clinic visit") || consultationTypes.includes("Home visits")) && offlineVal <= 0) {
      toast.error("Please set a valid fee for In-Clinic or Home Visit consultations.");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("vet_profiles")
        .update({
          consultation_type: consultationTypes.join(", "),
          years_of_experience: expVal,
          online_fee: onlineVal,
          offline_fee: offlineVal,
          emergency_available: emergencyAvailable,
          support_24x7: support24x7,
          weekend_availability: weekendAvailability
        })
        .eq("user_id", user.id);

      if (error) {
        console.error("Error updating services:", error);
        toast.error(`Failed to update details: ${error.message}`);
      } else {
        toast.success("Professional services & details updated successfully!");
        setIsEditing(false);
        fetchData();
      }
    } catch (err) {
      console.error(err);
      toast.error("An unexpected error occurred while saving.");
    } finally {
      setSaving(false);
    }
  };

  const getSpecIcon = (name: string, isSelected: boolean) => {
    const iconClass = `w-5 h-5 shrink-0 transition-colors ${
      isSelected ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-500"
    }`;
    switch (name.toLowerCase()) {
      case "dog": return <Dog className={iconClass} strokeWidth={2.2} />;
      case "cat": return <Cat className={iconClass} strokeWidth={2.2} />;
      case "bird": return <Bird className={iconClass} strokeWidth={2.2} />;
      case "hamster": return <HamsterIcon className={iconClass} strokeWidth={2.2} />;
      default: return <Sparkles className={iconClass} strokeWidth={2.2} />;
    }
  };

  if (showSpinner || guardLoading || loading) {
    return <SplashScreen message="Loading clinical services..." />;
  }

  return (
    <div className="bg-[#F9FAFC] min-h-screen pb-24 font-sans text-slate-900 selection:bg-indigo-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md px-4 py-4 flex items-center justify-between border-b border-slate-100 shadow-sm">
        <button 
          onClick={() => navigate("/vet/profile")}
          className="p-2 text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
          id="back-button"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-bold text-slate-900">My Services</h1>
        
        <div>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
              id="edit-trigger-button-header"
            >
              <Pencil size={12} />
              Edit
            </button>
          ) : (
            <button
              onClick={() => {
                setIsEditing(false);
                fetchData();
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
              id="cancel-trigger-button-header"
            >
              Cancel
            </button>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-6">
        
        {/* Toggle between Edit and Display view */}
        {!isEditing ? (
          /* DISPLAY MODE */
          <div className="space-y-6 animate-fade-in" id="display-mode-container">
            {/* Intro Alert */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-5 border border-indigo-100/60 flex items-start gap-4 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                <Stethoscope size={24} className="stroke-[2.2]" />
              </div>
              <div className="flex-1">
                <h3 className="font-extrabold text-slate-900 text-[15px]">Professional Overview</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed font-medium">
                  These clinical details are synchronized in real-time. Any changes you make will instantly reflect on your public profile seen by pet parents.
                </p>
              </div>
            </div>

            {/* General practice experience info */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-4">
              <h2 className="text-xs sm:text-sm font-extrabold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">Active Practice & Experience</h2>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">{yearsOfExperience || "0"} Years of Experience</p>
                  <p className="text-xs text-slate-400 font-medium">Total active professional veterinary practice</p>
                </div>
              </div>
            </div>

            {/* Consultation Fees */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-4">
              <h2 className="text-xs sm:text-sm font-extrabold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">Consultation Fees</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Clinic visit */}
                <div className={`p-4 rounded-xl border flex flex-col justify-between h-28 ${
                  consultationTypes.includes("Clinic visit") ? "border-indigo-100 bg-indigo-50/25" : "border-slate-100/60 bg-slate-50/30 opacity-50"
                }`}>
                  <div className="flex items-center justify-between">
                    <Briefcase className="w-5 h-5 text-indigo-600" />
                    <span className="text-[9px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">In-Clinic</span>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-semibold">Base Charge</p>
                    <p className="text-lg font-black text-slate-800">₹{onlineFee || "—"}</p>
                  </div>
                </div>

                {/* Home Visit */}
                <div className={`p-4 rounded-xl border flex flex-col justify-between h-28 ${
                  consultationTypes.includes("Home visits") ? "border-indigo-100 bg-indigo-50/25" : "border-slate-100/60 bg-slate-50/30 opacity-50"
                }`}>
                  <div className="flex items-center justify-between">
                    <Home className="w-5 h-5 text-indigo-600" />
                    <span className="text-[9px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full font-sans">Home Visit</span>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-semibold">Base Charge</p>
                    <p className="text-lg font-black text-slate-800">₹{offlineFee || "—"}</p>
                  </div>
                </div>

                {/* Video consultation */}
                <div className={`p-4 rounded-xl border flex flex-col justify-between h-28 ${
                  consultationTypes.includes("Video consultation") ? "border-indigo-100 bg-indigo-50/25" : "border-slate-100/60 bg-slate-50/30 opacity-50"
                }`}>
                  <div className="flex items-center justify-between">
                    <Video className="w-5 h-5 text-indigo-600" />
                    <span className="text-[9px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">Online Video</span>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-semibold">Base Charge</p>
                    <p className="text-lg font-black text-slate-800">₹{onlineFee || "—"}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Emergency and overnight services */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-4">
              <h2 className="text-xs sm:text-sm font-extrabold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">Emergency Care & Overnights</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex flex-col p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Emergency Status</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <div className={`w-2.5 h-2.5 rounded-full ${emergencyAvailable ? "bg-emerald-500" : "bg-rose-500"}`} />
                    <span className="text-xs font-bold text-slate-700">{emergencyAvailable ? "Accepting Emergency" : "Not Accepting"}</span>
                  </div>
                </div>

                <div className="flex flex-col p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">24×7 Support</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Clock className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-bold text-slate-700">{support24x7 === "yes" ? "24/7 Available" : "Standard Hours"}</span>
                  </div>
                </div>

                <div className="flex flex-col p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Weekend Care</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Calendar className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-bold text-slate-700">{weekendAvailability === "yes" ? "Weekend Available" : "Weekdays Only"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* EDIT MODE */
          <div className="space-y-8 animate-fade-in" id="edit-mode-container">
            {/* Warning Info */}
            <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-100/60 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <p className="text-xs text-indigo-900 font-semibold leading-relaxed">
                You are entering edit mode. Verify your changes carefully before saving as they instantly alter the live booking settings and fees.
              </p>
            </div>

            {/* 1. Years of Experience */}
            <div className="bg-white border border-[#F1F5F9] p-5 rounded-3xl shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-50 pb-2">
                <Award className="w-5 h-5 text-indigo-600" />
                <span className="text-slate-800 font-bold text-base font-sans">Years of Active Practice</span>
              </div>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => {
                    const currentVal = parseInt(yearsOfExperience) || 0;
                    if (currentVal > 0) {
                      setYearsOfExperience((currentVal - 1).toString());
                    }
                  }}
                  className="w-10 h-10 rounded-full border border-slate-200 hover:border-indigo-500 flex items-center justify-center font-bold text-slate-600 hover:text-indigo-600 select-none"
                >
                  -
                </button>
                <div className="px-5 py-2 border border-slate-100 rounded-xl bg-slate-50/50 min-w-[70px] text-center">
                  <span className="font-extrabold text-lg text-slate-800">{yearsOfExperience || "0"}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const currentVal = parseInt(yearsOfExperience) || 0;
                    setYearsOfExperience((currentVal + 1).toString());
                  }}
                  className="w-10 h-10 rounded-full border border-slate-200 hover:border-indigo-500 flex items-center justify-center font-bold text-slate-600 hover:text-indigo-600 select-none"
                >
                  +
                </button>
                <span className="text-xs text-slate-400 font-semibold">years of professional practice</span>
              </div>
            </div>

            {/* 5. Consultation Formats */}
            <div className="bg-white border border-[#F1F5F9] p-5 rounded-3xl shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-50 pb-2">
                <Languages className="w-5 h-5 text-indigo-600" />
                <span className="text-slate-800 font-bold text-base font-sans">Consultation Formats</span>
              </div>
              <p className="text-slate-400 text-xs font-semibold">Select the ways you would like to connect with pet parents:</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "Clinic visit", label: "In-clinic", icon: <Briefcase size={16} /> },
                  { id: "Home visits", label: "Home Visit", icon: <Home size={16} /> },
                  { id: "Video consultation", label: "Online Video", icon: <Video size={16} /> }
                ].map(opt => {
                  const isSelected = consultationTypes.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => toggleConsultationType(opt.id)}
                      className={`flex flex-col items-center justify-center text-center p-3 rounded-2xl border transition-all relative select-none cursor-pointer ${
                        isSelected 
                          ? "border-indigo-600 bg-indigo-50/30 text-indigo-700 font-black" 
                          : "border-slate-100 bg-white text-slate-700 hover:border-slate-350"
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mb-1.5 ${
                        isSelected ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-500"
                      }`}>
                        {opt.icon}
                      </div>
                      <span className="text-[10px] font-extrabold tracking-tight block w-full truncate">{opt.label}</span>
                      {isSelected && (
                        <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-sm">
                          <Check className="w-2.5 h-2.5 stroke-[3.5]" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 6. Consultation Fees */}
            <div className="bg-white border border-[#F1F5F9] p-5 rounded-3xl shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-50 pb-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <span className="text-slate-800 font-bold text-base font-sans">Consultation Fees (₹)</span>
              </div>
              <p className="text-slate-400 text-xs font-semibold">Set your consulting prices per session:</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-500 block">In-Clinic / Video Consultation Fee</span>
                  <div className="relative flex items-center h-12 px-4 rounded-xl bg-slate-50 border border-slate-200 focus-within:border-indigo-500 transition-all">
                    <input 
                      type="number" 
                      value={onlineFee} 
                      onChange={e => setOnlineFee(e.target.value)} 
                      placeholder="500"
                      className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-slate-800 font-extrabold text-base [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="text-slate-400 font-extrabold text-base">₹</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-500 block">Home Visit Consultation Fee</span>
                  <div className="relative flex items-center h-12 px-4 rounded-xl bg-slate-50 border border-slate-200 focus-within:border-indigo-500 transition-all">
                    <input 
                      type="number" 
                      value={offlineFee} 
                      onChange={e => setOfflineFee(e.target.value)} 
                      placeholder="800"
                      className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-slate-800 font-extrabold text-base [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="text-slate-400 font-extrabold text-base">₹</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 7. Emergency, Weekend, 24x7 */}
            <div className="bg-white border border-[#F1F5F9] p-5 rounded-3xl shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-50 pb-2">
                <ShieldAlert className="w-5 h-5 text-indigo-600" />
                <span className="text-slate-800 font-bold text-base font-sans">Emergency & Availability Toggles</span>
              </div>
              <div className="space-y-4">
                {/* Emergency Toggle */}
                <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-800">Accept Emergency Requests</span>
                    <span className="text-[10px] text-slate-400">Mark yourself as accepting urgent cases</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={emergencyAvailable}
                    onChange={(e) => setEmergencyAvailable(e.target.checked)}
                    className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
                  />
                </div>

                {/* 24x7 Switch */}
                <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-800">24×7 Emergency Support</span>
                    <span className="text-[10px] text-slate-400">Available all hours for urgent calls</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setSupport24x7("yes")}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                        support24x7 === "yes" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => setSupport24x7("no")}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                        support24x7 === "no" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      No
                    </button>
                  </div>
                </div>

                {/* Weekend Care */}
                <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-800">Weekend Consultation Hours</span>
                    <span className="text-[10px] text-slate-400">Provide support on Saturdays & Sundays</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setWeekendAvailability("yes")}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                        weekendAvailability === "yes" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => setWeekendAvailability("no")}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                        weekendAvailability === "no" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      No
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  fetchData(); // Reset
                }}
                className="flex-1 py-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm flex items-center justify-center gap-2 active:scale-98 transition-all"
                id="cancel-edit-button"
              >
                <Undo2 size={16} />
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all disabled:opacity-50"
                id="save-edit-button"
              >
                <Save size={16} />
                {saving ? "Saving Changes..." : "Save Changes"}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default MyServices;
