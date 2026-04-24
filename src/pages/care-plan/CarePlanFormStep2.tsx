import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Settings, Wallet, Sparkles, ArrowRight } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";

const CarePlanFormStep2 = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const petData = location.state?.petData;
  const step1Data = location.state?.step1Data;

  const [firstTimePetParent, setFirstTimePetParent] = useState(false);
  const [budgetRange, setBudgetRange] = useState([250]);
  const [emergencyFund, setEmergencyFund] = useState(false);

  if (!petData || !step1Data) { navigate(-1); return null; }

  const handleGenerate = () => {
    navigate("/care-plan/report", {
      state: {
        petData,
        flowType: "deep",
        formData: {
          ...step1Data,
          firstTimePetParent,
          budgetMin: budgetRange[0],
          budgetMax: budgetRange[0],
          emergencyFund,
        },
      },
    });
  };

  const formatBudget = (v: number) => `₹${(v * 80).toLocaleString("en-IN")}`;

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
        <span className="text-[12px] text-[#9CA3AF] font-medium">STEP 2 OF 2</span>
      </div>
      <div className="mx-6 h-1.5 rounded-full bg-[#FDE2EC]">
        <div className="h-full rounded-full bg-[#EC4899] w-full transition-all" />
      </div>

      <div className="flex-1 px-6 pt-5 pb-6 space-y-5 overflow-y-auto">
        {/* Experience */}
        <div className="bg-white rounded-2xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-xl bg-[#FFF0F6] flex items-center justify-center">
              <Settings className="w-5 h-5 text-[#EC4899]" />
            </div>
            <span className="font-bold text-[17px] text-[#151B32]">Experience</span>
          </div>
          <div className="bg-[#F9FAFB] rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="font-bold text-[14px] text-[#151B32]">First time pet parent?</p>
              <p className="text-[12px] text-[#9CA3AF] mt-0.5">Let us know if you're new to pet care</p>
            </div>
            <Switch checked={firstTimePetParent} onCheckedChange={setFirstTimePetParent} />
          </div>
        </div>

        {/* Budget & Readiness */}
        <div className="bg-white rounded-2xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-xl bg-[#FFF0F6] flex items-center justify-center">
              <Wallet className="w-5 h-5 text-[#EC4899]" />
            </div>
            <span className="font-bold text-[17px] text-[#151B32]">Budget & Readiness</span>
          </div>
          <div className="bg-[#F9FAFB] rounded-2xl p-4 mb-4">
            <div className="flex items-center justify-between mb-4">
              <p className="font-bold text-[14px] text-[#151B32]">Monthly Budget Range</p>
              <span className="font-bold text-[18px] text-[#EC4899]">{formatBudget(budgetRange[0])}</span>
            </div>
            <Slider
              value={budgetRange}
              onValueChange={setBudgetRange}
              min={50}
              max={1000}
              step={10}
              className="mb-2 [&_[data-radix-slider-track]]:bg-[#FDE2EC] [&_[data-radix-slider-range]]:bg-[#EC4899] [&_[data-radix-slider-thumb]]:border-[#EC4899] [&_[data-radix-slider-thumb]]:bg-white [&_[data-radix-slider-thumb]]:w-5 [&_[data-radix-slider-thumb]]:h-5"
            />
            <div className="flex justify-between text-[11px] text-[#9CA3AF]">
              <span>₹4,000</span>
              <span>₹80,000+</span>
            </div>
          </div>
          <div className="bg-[#F9FAFB] rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="font-bold text-[14px] text-[#151B32]">Emergency Fund</p>
              <p className="text-[12px] text-[#9CA3AF] mt-0.5">Ready for unexpected vet bills</p>
            </div>
            <Switch checked={emergencyFund} onCheckedChange={setEmergencyFund} />
          </div>
        </div>

        {/* AI Insights Ready Banner */}
        <div className="rounded-2xl p-4 flex gap-3 border border-dashed border-[#F9A8D4] bg-[#FFF0F6]">
          <div className="w-10 h-10 rounded-xl bg-[#EC4899]/10 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-[#EC4899]" />
          </div>
          <div>
            <p className="font-bold text-[14px] text-[#151B32]">AI Insights Ready</p>
            <p className="text-[12px] text-[#6B7280] mt-0.5 leading-relaxed">
              Based on your input, we're ready to tailor a specific nutritional and activity schedule for your pet.
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 pb-8 pt-2">
        <button onClick={handleGenerate}
          className="w-full py-4 rounded-2xl font-bold text-[16px] text-white flex items-center justify-center gap-2"
          style={{ background: "linear-gradient(135deg, #EC4899, #8B5CF6)" }}>
          Generate My Care Plan
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default CarePlanFormStep2;
