import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Home, Clock, Wallet, Briefcase, ChevronDown, Info, ArrowRight } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

const cityTypes = ["Metro / Major City", "Tier 2 City", "Small Town", "Rural"];
const freeTimeOptions = ["< 1 hour", "1-3 hours", "3-5 hours", "5+ hours"];
const workSchedules = ["Remote", "Hybrid", "Office"];
const travelFrequencies = ["Rarely", "Monthly", "Weekly", "Frequently"];

const CarePlanForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const petData = location.state?.petData;
  const flowType = location.state?.flowType || "quick";

  // --- Quick Facts fields ---
  const [living, setLiving] = useState<"apartment" | "house">("apartment");
  const [hasChildren, setHasChildren] = useState(false);
  const [freeTime, setFreeTime] = useState<"< 1 hr" | "1 – 3 hrs" | "3+ hrs">("< 1 hr");
  const [budgetRange, setBudgetRange] = useState([2000, 8000]);

  // --- Deep Dive Step 1 fields ---
  const [homeType, setHomeType] = useState<"apartment" | "house">("apartment");
  const [cityType, setCityType] = useState("");
  const [hasKids, setHasKids] = useState(false);
  const [otherPets, setOtherPets] = useState(false);
  const [deepFreeTime, setDeepFreeTime] = useState("");
  const [workSchedule, setWorkSchedule] = useState("");
  const [travelFrequency, setTravelFrequency] = useState("");

  const [cityDropdown, setCityDropdown] = useState(false);
  const [freeTimeDropdown, setFreeTimeDropdown] = useState(false);
  const [travelDropdown, setTravelDropdown] = useState(false);

  if (!petData) { navigate(-1); return null; }

  // --- Quick Facts: Generate directly ---
  const handleQuickGenerate = () => {
    navigate("/care-plan/report", {
      state: {
        petData,
        flowType: "quick",
        formData: { living, hasChildren, freeTime, budgetMin: budgetRange[0], budgetMax: budgetRange[1] },
      },
    });
  };

  // --- Deep Dive: Continue to Step 2 ---
  const handleDeepContinue = () => {
    if (!cityType) { toast.error("Please select your City Type"); return; }
    if (!deepFreeTime) { toast.error("Please select your Daily free time"); return; }
    if (!workSchedule) { toast.error("Please select your Work Schedule"); return; }
    if (!travelFrequency) { toast.error("Please select your Travel Frequency"); return; }

    navigate("/care-plan/form-step2", {
      state: {
        petData,
        flowType: "deep",
        step1Data: { homeType, cityType, hasKids, otherPets, freeTime: deepFreeTime, workSchedule, travelFrequency },
      },
    });
  };

  const formatBudget = (v: number) => `₹${v.toLocaleString("en-IN")}`;

  // ===================== QUICK FACTS FORM =====================
  if (flowType === "quick") {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex flex-col">
        <div className="flex items-center px-4 pt-4 pb-2">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2">
            <ArrowLeft className="w-5 h-5 text-[#151B32]" />
          </button>
          <h1 className="flex-1 text-center font-bold text-[17px] text-[#151B32] pr-7">Personalised Care Plan</h1>
        </div>

        <div className="px-6 pt-2 pb-4 flex items-center justify-between">
          <span className="text-[13px] font-bold text-[#EC4899]">Quick Facts</span>
          <span className="text-[12px] text-[#9CA3AF] font-medium">STEP 1 OF 1</span>
        </div>
        <div className="mx-6 h-1 rounded-full bg-[#FDE2EC]">
          <div className="h-full rounded-full bg-[#EC4899] w-full" />
        </div>

        <div className="flex-1 px-6 pt-5 pb-6 space-y-5 overflow-y-auto">
          {/* Living Situation */}
          <div className="bg-white rounded-2xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
            <div className="flex items-center gap-2 mb-3">
              <Home className="w-5 h-5 text-[#151B32]" />
              <span className="font-bold text-[16px] text-[#151B32]">Living Situation</span>
            </div>
            <p className="text-[13px] text-[#6B7280] mb-3">Where do you live?</p>
            <div className="flex gap-2 mb-4">
              {(["apartment", "house"] as const).map((opt) => (
                <button
                  key={opt}
                  onClick={() => setLiving(opt)}
                  className={`flex-1 py-2.5 rounded-full text-[13px] font-semibold border transition-all ${
                    living === opt ? "border-[#EC4899] text-[#EC4899] bg-[#FFF0F6]" : "border-[#E5E7EB] text-[#6B7280] bg-white"
                  }`}
                >
                  {opt === "apartment" ? "Apartment" : "House"}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[14px] text-[#151B32] font-medium">Do you have children?</p>
                <p className="text-[11px] text-[#9CA3AF]">Under 18 living with you</p>
              </div>
              <Switch checked={hasChildren} onCheckedChange={setHasChildren} />
            </div>
          </div>

          {/* Daily Routine */}
          <div className="bg-white rounded-2xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-5 h-5 text-[#EC4899]" />
              <span className="font-bold text-[16px] text-[#151B32]">Daily Routine</span>
            </div>
            <p className="text-[13px] text-[#6B7280] mb-3">How much free time do you have daily?</p>
            <div className="flex gap-2">
              {(["< 1 hr", "1 – 3 hrs", "3+ hrs"] as const).map((opt) => (
                <button
                  key={opt}
                  onClick={() => setFreeTime(opt)}
                  className={`flex-1 py-2.5 rounded-full text-[12px] font-semibold border transition-all ${
                    freeTime === opt ? "border-[#EC4899] text-[#EC4899] bg-[#FFF0F6]" : "border-[#E5E7EB] text-[#6B7280] bg-white"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Monthly Budget */}
          <div className="bg-white rounded-2xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
            <div className="flex items-center gap-2 mb-3">
              <Wallet className="w-5 h-5 text-[#EC4899]" />
              <span className="font-bold text-[16px] text-[#151B32]">Monthly Budget</span>
            </div>
            <div className="flex items-center justify-between mb-4">
              <p className="text-[13px] text-[#6B7280]">Estimated monthly spend</p>
              <span className="font-bold text-[16px] text-[#EC4899]">
                {formatBudget(budgetRange[0])} - {formatBudget(budgetRange[1])}
              </span>
            </div>
            <Slider
              value={budgetRange}
              onValueChange={setBudgetRange}
              min={1000}
              max={25000}
              step={500}
              className="mb-2 [&_[data-radix-slider-track]]:bg-[#FDE2EC] [&_[data-radix-slider-range]]:bg-[#EC4899] [&_[data-radix-slider-thumb]]:border-[#EC4899] [&_[data-radix-slider-thumb]]:bg-white [&_[data-radix-slider-thumb]]:w-5 [&_[data-radix-slider-thumb]]:h-5"
            />
            <div className="flex justify-between text-[11px] text-[#9CA3AF]">
              <span>₹1,000</span>
              <span>₹25,000+</span>
            </div>
            <div className="mt-4 bg-[#F9FAFB] rounded-xl p-3 flex gap-2">
              <Info className="w-4 h-4 text-[#9CA3AF] flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-[#6B7280] leading-relaxed">
                This helps us recommend plans that match your financial comfort zone without compromising care quality.
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 pb-8 pt-2">
          <button
            onClick={handleQuickGenerate}
            className="w-full py-4 rounded-2xl font-bold text-[16px] text-white flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg, #EC4899, #8B5CF6)" }}
          >
            Generate My Care Plan
            <ArrowRight className="w-4 h-4" />
          </button>
          <p className="text-center text-[10px] text-[#9CA3AF] mt-3 tracking-widest uppercase">
            Secure 256-bit encrypted process
          </p>
        </div>
      </div>
    );
  }

  // ===================== DEEP DIVE FORM (Step 1 of 2) =====================
  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col">
      <div className="flex items-center px-4 pt-4 pb-2">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2">
          <ArrowLeft className="w-5 h-5 text-[#151B32]" />
        </button>
        <h1 className="flex-1 text-center font-bold text-[17px] text-[#151B32] pr-7">Personalisation Form</h1>
      </div>

      <div className="px-6 pt-2 pb-4 flex items-center justify-between">
        <span className="text-[13px] font-bold text-[#EC4899]">Deep Dive</span>
        <span className="text-[12px] text-[#9CA3AF] font-medium">STEP 1 OF 2</span>
      </div>
      <div className="mx-6 h-1.5 rounded-full bg-[#FDE2EC]">
        <div className="h-full rounded-full bg-[#EC4899] w-1/2 transition-all" />
      </div>

      <div className="flex-1 px-6 pt-5 pb-6 space-y-5 overflow-y-auto">
        {/* Living Situation */}
        <div className="bg-white rounded-2xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-xl bg-[#FFF0F6] flex items-center justify-center">
              <Home className="w-5 h-5 text-[#EC4899]" />
            </div>
            <span className="font-bold text-[17px] text-[#151B32]">Living Situation</span>
          </div>

          <p className="text-[13px] text-[#6B7280] mb-2">Home Type</p>
          <div className="flex gap-2 mb-4">
            {(["apartment", "house"] as const).map(opt => (
              <button key={opt} onClick={() => setHomeType(opt)}
                className={`flex-1 py-2.5 rounded-full text-[13px] font-semibold border transition-all ${
                  homeType === opt ? "border-[#EC4899] text-[#EC4899] bg-[#FFF0F6]" : "border-[#E5E7EB] text-[#6B7280] bg-white"
                }`}
              >{opt === "apartment" ? "Apartment" : "House"}</button>
            ))}
          </div>

          <p className="text-[13px] text-[#6B7280] mb-2">City Type</p>
          <div className="relative mb-4">
            <button onClick={() => { setCityDropdown(!cityDropdown); setFreeTimeDropdown(false); setTravelDropdown(false); }}
              className="w-full flex items-center justify-between bg-[#F9FAFB] rounded-xl px-4 py-3 text-[14px] border border-[#E5E7EB]">
              <span className={cityType ? "text-[#151B32]" : "text-[#9CA3AF]"}>{cityType || "Select city type"}</span>
              <ChevronDown className="w-4 h-4 text-[#9CA3AF]" />
            </button>
            {cityDropdown && (
              <div className="absolute z-10 mt-1 w-full bg-white rounded-xl shadow-lg border border-[#E5E7EB] overflow-hidden">
                {cityTypes.map(opt => (
                  <button key={opt} onClick={() => { setCityType(opt); setCityDropdown(false); }} className="w-full text-left px-4 py-2.5 text-[13px] hover:bg-[#FFF0F6] text-[#151B32]">{opt}</button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between mb-3">
            <p className="text-[14px] text-[#151B32] font-medium">Do you have kids?</p>
            <Switch checked={hasKids} onCheckedChange={setHasKids} />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-[14px] text-[#151B32] font-medium">Other pets at home?</p>
            <Switch checked={otherPets} onCheckedChange={setOtherPets} />
          </div>
        </div>

        {/* Daily Routine */}
        <div className="bg-white rounded-2xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-xl bg-[#FFF0F6] flex items-center justify-center">
              <Clock className="w-5 h-5 text-[#EC4899]" />
            </div>
            <span className="font-bold text-[17px] text-[#151B32]">Daily Routine</span>
          </div>

          <p className="text-[13px] text-[#6B7280] mb-2">Daily free time</p>
          <div className="relative mb-4">
            <button onClick={() => { setFreeTimeDropdown(!freeTimeDropdown); setCityDropdown(false); setTravelDropdown(false); }}
              className="w-full flex items-center justify-between bg-[#F9FAFB] rounded-xl px-4 py-3 text-[14px] border border-[#E5E7EB]">
              <span className={deepFreeTime ? "text-[#151B32]" : "text-[#9CA3AF]"}>{deepFreeTime || "Select free time"}</span>
              <ChevronDown className="w-4 h-4 text-[#9CA3AF]" />
            </button>
            {freeTimeDropdown && (
              <div className="absolute z-10 mt-1 w-full bg-white rounded-xl shadow-lg border border-[#E5E7EB] overflow-hidden">
                {freeTimeOptions.map(opt => (
                  <button key={opt} onClick={() => { setDeepFreeTime(opt); setFreeTimeDropdown(false); }} className="w-full text-left px-4 py-2.5 text-[13px] hover:bg-[#FFF0F6] text-[#151B32]">{opt}</button>
                ))}
              </div>
            )}
          </div>

          <p className="text-[13px] text-[#6B7280] mb-2">Work Schedule</p>
          <div className="flex gap-2 mb-4">
            {workSchedules.map(opt => (
              <button key={opt} onClick={() => setWorkSchedule(opt)}
                className={`flex-1 py-2.5 rounded-full text-[12px] font-semibold border transition-all ${
                  workSchedule === opt ? "border-[#EC4899] text-white bg-[#EC4899]" : "border-[#E5E7EB] text-[#6B7280] bg-white"
                }`}
              >{opt}</button>
            ))}
          </div>

          <p className="text-[13px] text-[#6B7280] mb-2">Travel Frequency</p>
          <div className="relative">
            <button onClick={() => { setTravelDropdown(!travelDropdown); setCityDropdown(false); setFreeTimeDropdown(false); }}
              className="w-full flex items-center justify-between bg-[#F9FAFB] rounded-xl px-4 py-3 text-[14px] border border-[#E5E7EB]">
              <span className={travelFrequency ? "text-[#151B32]" : "text-[#9CA3AF]"}>{travelFrequency || "Select travel frequency"}</span>
              <ChevronDown className="w-4 h-4 text-[#9CA3AF]" />
            </button>
            {travelDropdown && (
              <div className="absolute z-10 mt-1 w-full bg-white rounded-xl shadow-lg border border-[#E5E7EB] overflow-hidden">
                {travelFrequencies.map(opt => (
                  <button key={opt} onClick={() => { setTravelFrequency(opt); setTravelDropdown(false); }} className="w-full text-left px-4 py-2.5 text-[13px] hover:bg-[#FFF0F6] text-[#151B32]">{opt}</button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-6 pb-8 pt-2">
        <button onClick={handleDeepContinue}
          className="w-full py-4 rounded-2xl font-bold text-[16px] text-white flex items-center justify-center gap-2"
          style={{ background: "linear-gradient(135deg, #EC4899, #8B5CF6)" }}>
          Continue
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default CarePlanForm;
