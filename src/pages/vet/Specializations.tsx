import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Stethoscope, 
  Sparkles, 
  Check, 
  Pencil, 
  Award, 
  HeartPulse,
  AlertCircle,
  Save,
  Undo2,
  Dog,
  Cat,
  Bird,
  ShieldCheck,
  CheckSquare,
  Square
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

const FREQUENT_CONDITIONS = [
  { name: "Vomiting", species: ["Dog", "Cat"] },
  { name: "Diarrhea", species: ["Dog", "Cat", "Hamster"] },
  { name: "Loss of Appetite", species: ["Dog", "Cat", "Bird", "Hamster"] },
  { name: "Itching / Skin Issues", species: ["Dog", "Cat"] },
  { name: "Eye Problems", species: ["Dog", "Cat", "Bird", "Hamster"] },
  { name: "Ear Problems", species: ["Dog", "Cat"] },
  { name: "Coughing / Breathing Issues", species: ["Dog", "Cat"] },
  { name: "Injury / Wound", species: ["Dog", "Cat", "Bird", "Hamster"] },
  { name: "Mobility Issues", species: ["Dog", "Cat", "Bird", "Hamster"] },
  { name: "Behavior Changes", species: ["Dog", "Cat", "Bird", "Hamster"] },
  { name: "Urinary / Litter Box Issues", species: ["Cat"] },
  { name: "Regurgitation / Crop Issue", species: ["Bird"] },
  { name: "Droppings Change", species: ["Bird"] },
  { name: "Feather Plucking / Skin Issues", species: ["Bird"] },
  { name: "Lethargy / Fluffed Up", species: ["Bird"] },
  { name: "Breathing Issues / Wheezing", species: ["Bird"] },
  { name: "Scent Gland / Skin Issues", species: ["Hamster"] },
  { name: "Overgrown Teeth", species: ["Hamster"] },
  { name: "Wet Tail / Diarrhea", species: ["Hamster"] },
  { name: "Lumps / Tumors", species: ["Hamster"] }
];

const Specializations = () => {
  const navigate = useNavigate();
  const { user, isLoading: guardLoading, showSpinner } = useRoleGuard(["vet"], "/auth/vet", true);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Core Form / Display states
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [clinicalExpertise, setClinicalExpertise] = useState<string[]>([]);
  const [medicalSpecializations, setMedicalSpecializations] = useState<Record<string, { primary: string; secondary: string[] }>>({});
  const [conditionsManaged, setConditionsManaged] = useState<string[]>([]);

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("vet_profiles")
        .select(`
          specializations,
          clinical_expertise,
          medical_specializations
        `)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching vet specializations:", error);
        toast.error("Failed to load specializations");
      } else if (data) {
        setSpecializations(data.specializations || []);
        
        const rawExpertise = data.clinical_expertise || [];
        
        // Filter condition names vs clinical expertise tags
        const allConditionNames = FREQUENT_CONDITIONS.map(c => c.name);
        const conds = rawExpertise.filter((item: string) => allConditionNames.includes(item));
        const tags = rawExpertise.filter((item: string) => !allConditionNames.includes(item));
        
        setConditionsManaged(conds);
        setClinicalExpertise(tags);
        
        const medSpecs = (data.medical_specializations as Record<string, { primary: string; secondary: string[] }>) || {};
        setMedicalSpecializations(medSpecs);
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

    // Filter conditions managed for species that are no longer selected
    const allowedConditions = FREQUENT_CONDITIONS.filter(cond => 
      cond.species.some(s => updated.includes(s))
    ).map(c => c.name);
    setConditionsManaged(prev => prev.filter(c => allowedConditions.includes(c)));

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

  const toggleConditionManaged = (condName: string) => {
    setConditionsManaged(prev => {
      if (prev.includes(condName)) {
        return prev.filter(c => c !== condName);
      } else {
        return [...prev, condName];
      }
    });
  };

  const handleSave = async () => {
    if (specializations.length === 0) {
      toast.error("Please select at least one pet specialization (e.g. Dog, Cat).");
      return;
    }

    // Validate that each selected species has a Primary specialization
    for (const spec of specializations) {
      const med = medicalSpecializations[spec];
      if (!med || !med.primary) {
        toast.error(`Please specify a Primary Medical Specialization for ${spec}`);
        return;
      }
    }

    setSaving(true);
    try {
      // Merge clinical expertise tags and frequently managed conditions into clinical_expertise database array
      const mergedExpertise = [...new Set([...clinicalExpertise, ...conditionsManaged])];

      const { error } = await supabase
        .from("vet_profiles")
        .update({
          specializations,
          clinical_expertise: mergedExpertise,
          medical_specializations: medicalSpecializations
        })
        .eq("user_id", user.id);

      if (error) {
        console.error("Error updating specializations:", error);
        toast.error(`Failed to update details: ${error.message}`);
      } else {
        toast.success("Specializations & managed conditions updated successfully!");
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
    return <SplashScreen message="Loading specializations..." />;
  }

  // Filter conditions based on currently active pet specializations
  const activeConditions = FREQUENT_CONDITIONS.filter(cond => 
    cond.species.some(s => specializations.includes(s))
  );

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
        <h1 className="text-lg font-bold text-slate-900">Specializations</h1>
        
        <div>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
              id="edit-specializations-button"
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
              id="cancel-specializations-button"
            >
              Cancel
            </button>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-6">
        
        {!isEditing ? (
          /* DISPLAY MODE */
          <div className="space-y-6 animate-fade-in" id="display-mode-container">
            {/* Intro Alert */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-5 border border-indigo-100/60 flex items-start gap-4 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                <ShieldCheck size={24} className="stroke-[2.2]" />
              </div>
              <div className="flex-1">
                <h3 className="font-extrabold text-slate-900 text-[15px] flex items-center gap-2">
                  Smart Match Specializations
                  <span className="bg-indigo-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">Smart Match</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed font-medium">
                  These specializations and frequently managed conditions directly connect with the <strong>Smart Match AI engine</strong> on the buyer panel. Providing accurate details increases your visibility to matching pet parents.
                </p>
              </div>
            </div>

            {/* Pet Species Specializations */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-4">
              <h2 className="text-xs sm:text-sm font-extrabold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">Pet Species Specializations</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {specializations.length === 0 ? (
                  <p className="text-xs font-medium text-slate-400 italic col-span-full">No pet types selected yet</p>
                ) : (
                  specializations.map(spec => (
                    <div key={spec} className="flex items-center gap-2 bg-indigo-50/30 border border-indigo-150 rounded-xl px-3.5 py-2.5">
                      {getSpecIcon(spec, true)}
                      <span className="text-xs font-bold text-slate-800">{spec}s</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Medical Specializations */}
            {specializations.length > 0 && (
              <div className="bg-white rounded-2xl p-5 border border-slate-100/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-4">
                <h2 className="text-xs sm:text-sm font-extrabold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">Medical Specialties</h2>
                <div className="space-y-4 divide-y divide-slate-100">
                  {specializations.map((spec, index) => {
                    const med = medicalSpecializations[spec] || { primary: "", secondary: [] };
                    return (
                      <div key={spec} className={`space-y-2.5 ${index > 0 ? "pt-4" : ""}`}>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-wider">{spec}</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-1">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wide">Primary Specialty</span>
                            <span className="text-sm font-bold text-slate-800">{med.primary || "None selected"}</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wide">Secondary Specialties</span>
                            {med.secondary && med.secondary.length > 0 ? (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {med.secondary.map(sec => (
                                  <span key={sec} className="bg-slate-100 text-slate-700 text-[11px] font-bold px-2 py-0.5 rounded-md">{sec}</span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400 italic font-medium">None selected</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Clinical Expertise */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-4">
              <h2 className="text-xs sm:text-sm font-extrabold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">Clinical Expertise & Focus</h2>
              {clinicalExpertise.length === 0 ? (
                <p className="text-xs text-slate-400 font-medium italic">No clinical expertise tags added yet</p>
              ) : (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {clinicalExpertise.map(tag => (
                    <span key={tag} className="bg-indigo-50/50 text-indigo-700 border border-indigo-100/80 text-[11px] font-bold px-3 py-1 rounded-full shadow-2xs">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Condition Frequently Managed */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-4">
              <h2 className="text-xs sm:text-sm font-extrabold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">Condition Frequently Managed</h2>
              {conditionsManaged.length === 0 ? (
                <p className="text-xs text-slate-400 font-medium italic">No managed conditions selected yet</p>
              ) : (
                <div className="flex flex-wrap gap-2 pt-1">
                  {conditionsManaged.map(cond => (
                    <span key={cond} className="bg-teal-50 text-teal-700 border border-teal-100 text-xs font-bold px-3 py-1.5 rounded-xl shadow-2xs">
                      {cond}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* EDIT MODE */
          <div className="space-y-8 animate-fade-in" id="edit-mode-container">
            <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-100/60 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <p className="text-xs text-indigo-900 font-semibold leading-relaxed">
                Update your credentials, areas of clinical focus, and specific symptoms/conditions you manage. This is utilized by buyers using Smart Match.
              </p>
            </div>

            {/* 1. Pet Specializations (Species) */}
            <div className="bg-white border border-[#F1F5F9] p-5 rounded-3xl shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-50 pb-2">
                <Stethoscope className="w-5 h-5 text-indigo-600" />
                <span className="text-slate-800 font-bold text-base font-sans">Pet Specializations</span>
              </div>
              <p className="text-slate-400 text-xs font-semibold">Select the animal species you are qualified to treat:</p>
              <div className="grid grid-cols-2 gap-3.5 pt-1">
                {SPECIALIZATION_OPTIONS.map(spec => {
                  const isSelected = specializations.includes(spec);
                  return (
                    <button
                      key={spec}
                      type="button"
                      onClick={() => toggleSpecialization(spec)}
                      className={`flex items-center justify-center gap-2 rounded-2xl py-3 px-4 border text-xs sm:text-sm font-bold transition-all relative select-none cursor-pointer ${
                        isSelected 
                          ? "border-indigo-600 bg-indigo-50/50 text-indigo-700 font-black shadow-sm" 
                          : "border-slate-200 bg-white text-[#1E293B] hover:shadow-xs hover:border-slate-300"
                      }`}
                    >
                      {getSpecIcon(spec, isSelected)}
                      <span>{spec}</span>
                      {isSelected && (
                        <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center border-2 border-white shadow-sm shrink-0">
                          <Check className="w-2.5 h-2.5 stroke-[3.5]" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Medical Specializations (Shown per species) */}
            {specializations.length > 0 && (
              <div className="bg-white border border-[#F1F5F9] p-5 rounded-3xl shadow-sm space-y-6">
                <div className="flex items-center gap-2 border-b border-slate-50 pb-2">
                  <HeartPulse className="w-5 h-5 text-indigo-600" />
                  <span className="text-slate-800 font-bold text-base font-sans">Medical Specializations</span>
                </div>
                <div className="space-y-6 divide-y divide-slate-100">
                  {specializations.map((spec, sIdx) => {
                    const med = medicalSpecializations[spec] || { primary: "", secondary: [] };
                    const primaryVal = med.primary;
                    const secondaryVals = med.secondary || [];

                    const availableOptions = MEDICAL_SPEC_OPTIONS[spec] || [];

                    return (
                      <div key={spec} className={`space-y-4 ${sIdx > 0 ? "pt-5" : ""}`}>
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-wider">{spec} Specialty</span>
                        </div>

                        {/* Primary Selection */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-extrabold text-slate-700 block">Choose 1 Primary Specialization</label>
                          <select
                            value={primaryVal}
                            onChange={(e) => setPrimarySpec(spec, e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm"
                          >
                            <option value="">-- Select Primary Specialty --</option>
                            {availableOptions.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </div>

                        {/* Secondary Selection */}
                        <div className="space-y-2">
                          <label className="text-xs font-extrabold text-slate-700 block">Select Up To 3 Secondary Specializations</label>
                          <div className="flex flex-wrap gap-2">
                            {availableOptions.map(opt => {
                              if (opt === primaryVal) return null;
                              const isSecSelected = secondaryVals.includes(opt);
                              return (
                                <button
                                  key={opt}
                                  type="button"
                                  onClick={() => toggleSecondarySpec(spec, opt)}
                                  className={`text-[11px] px-3 py-1.5 rounded-full border font-semibold select-none transition-all ${
                                    isSecSelected 
                                      ? "bg-indigo-600 border-indigo-600 text-white font-bold" 
                                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                                  }`}
                                >
                                  {opt}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3. Clinical Expertise */}
            {specializations.length > 0 && (
              <div className="bg-white border border-[#F1F5F9] p-5 rounded-3xl shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-50 pb-2">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                  <span className="text-slate-800 font-bold text-base font-sans">Clinical Expertise Tags</span>
                </div>
                <p className="text-slate-400 text-xs font-semibold">Select all focused treatment areas that apply:</p>
                <div className="space-y-4">
                  {specializations.map(spec => {
                    const tagOptions = spec === "Dog" ? EXPERTISE_DOG : spec === "Cat" ? EXPERTISE_CAT : spec === "Bird" ? EXPERTISE_BIRD : EXPERTISE_HAMSTER;
                    return (
                      <div key={spec} className="space-y-2">
                        <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">{spec} Care Focus Areas</span>
                        <div className="flex flex-wrap gap-1.5">
                          {tagOptions.map(tag => {
                            const isSelected = clinicalExpertise.includes(tag);
                            return (
                              <button
                                key={tag}
                                type="button"
                                onClick={() => toggleClinicalExpertise(tag)}
                                className={`text-[11px] px-3 py-1.5 rounded-full border transition-all select-none font-bold ${
                                  isSelected 
                                    ? "bg-indigo-600 border-indigo-600 text-white" 
                                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                                }`}
                              >
                                {tag}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 4. Condition Frequently Managed */}
            {specializations.length > 0 && (
              <div className="bg-white border border-[#F1F5F9] p-5 rounded-3xl shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-50 pb-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-600" />
                  <span className="text-slate-800 font-bold text-base font-sans">Condition Frequently Managed</span>
                </div>
                <p className="text-slate-400 text-xs font-semibold">Select symptoms and conditions you frequently handle (only showing conditions applicable to your selected pet species):</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                  {activeConditions.map(cond => {
                    const isSelected = conditionsManaged.includes(cond.name);
                    return (
                      <button
                        key={cond.name}
                        type="button"
                        onClick={() => toggleConditionManaged(cond.name)}
                        className={`flex items-start gap-3 p-3 rounded-2xl border text-left transition-all ${
                          isSelected 
                            ? "border-teal-500 bg-teal-50/40 text-teal-950 font-semibold" 
                            : "border-slate-100 bg-slate-50/50 text-slate-700 hover:border-slate-200"
                        }`}
                      >
                        <div className={`mt-0.5 shrink-0 ${isSelected ? "text-teal-600" : "text-slate-400"}`}>
                          {isSelected ? (
                            <CheckSquare className="w-5 h-5" />
                          ) : (
                            <Square className="w-5 h-5" />
                          )}
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <div className="text-xs font-bold leading-tight">{cond.name}</div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {cond.species.map(s => {
                              const isPetSelected = specializations.includes(s);
                              return (
                                <span 
                                  key={s} 
                                  className={`text-[9px] px-1 py-0.5 rounded font-black uppercase ${
                                    isPetSelected 
                                      ? "bg-indigo-100 text-indigo-800 border border-indigo-150" 
                                      : "bg-slate-100 text-slate-400"
                                  }`}
                                >
                                  {s}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  fetchData(); // Reset
                }}
                className="flex-1 py-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm flex items-center justify-center gap-2 active:scale-98 transition-all"
                id="cancel-edit-specializations"
              >
                <Undo2 size={16} />
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all disabled:opacity-50"
                id="save-edit-specializations"
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

export default Specializations;
