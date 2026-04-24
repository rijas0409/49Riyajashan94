import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Utensils, Activity, Scissors, Wallet, Heart, HeartPulse, Lightbulb, Download, ShoppingCart, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface QuickReportData {
  compatibilityScore: number;
  tagline: string;
  feeding: string;
  exercise: string;
  grooming: string;
  monthlyCost: string;
  verdict: string;
}

interface DeepReportData extends QuickReportData {
  monthlyCostNote: string;
  healthConsiderations: string;
  beginnerTips: string;
}

const CarePlanReport = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const petData = location.state?.petData;
  const formData = location.state?.formData;
  const flowType = location.state?.flowType || "quick";
  const [report, setReport] = useState<DeepReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!petData || !formData) { navigate(-1); return; }
    generateReport();
  }, []);

  const generateReport = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("care-plan-generate", {
        body: { petData, formData, flowType },
      });
      if (error) throw error;
      setReport(data);
    } catch (e) {
      console.error("Care plan generation failed:", e);
      toast.error("Failed to generate care plan. Please try again.");
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !report) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center gap-4">
        <div className="w-20 h-20 rounded-full border-4 border-[#FDE2EC] border-t-[#EC4899] animate-spin" />
        <p className="text-[15px] font-semibold text-[#151B32]">Generating your care plan...</p>
        <p className="text-[12px] text-[#9CA3AF]">AI is analyzing compatibility</p>
      </div>
    );
  }

  if (!petData) return null;

  const scoreColor = report.compatibilityScore >= 75 ? "#22C55E" : report.compatibilityScore >= 50 ? "#F59E0B" : "#EF4444";
  const ageLabel = petData.ageMonths < 12
    ? `${petData.ageMonths} month old Puppy`
    : `${Math.floor(petData.ageMonths / 12)} year old`;

  // ===================== QUICK FACTS REPORT =====================
  if (flowType === "quick") {
    const items = [
      { icon: Utensils, title: "Feeding Needs", desc: report.feeding, bg: "#EEF4FF", color: "#3B82F6" },
      { icon: Activity, title: "Exercise Needs", desc: report.exercise, bg: "#F0FDF4", color: "#22C55E" },
      { icon: Scissors, title: "Grooming Level", desc: report.grooming, bg: "#FFF7ED", color: "#F59E0B" },
      { icon: Wallet, title: "Monthly Cost", desc: report.monthlyCost, bg: "#FFF0F6", color: "#EC4899" },
    ];

    return (
      <div className="min-h-screen bg-[#F9FAFB] flex flex-col">
        <div className="flex items-center px-4 pt-4 pb-3 border-b border-[#F3F4F6]">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-white shadow-sm flex items-center justify-center">
            <ArrowLeft className="w-4 h-4 text-[#151B32]" />
          </button>
          <h1 className="flex-1 text-center font-bold text-[17px] text-[#151B32] pr-9">Quick Facts</h1>
        </div>

        <div className="flex-1 px-5 pt-4 pb-6 overflow-y-auto">
          {/* Hero Card */}
          <div className="rounded-2xl overflow-hidden bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] mb-5">
            <div className="relative">
              <div className="absolute top-3 left-3 bg-[#EC4899] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">AI Generated</div>
              <img src={petData.image || ""} alt={petData.breed} className="w-full h-[200px] object-cover" />
            </div>
            <div className="p-4 flex items-center justify-between">
              <div>
                <h2 className="font-extrabold text-[22px] text-[#151B32]">{petData.breed}</h2>
                <p className="text-[13px] text-[#EC4899] font-medium">{report.tagline}</p>
              </div>
              <div className="text-center">
                <span className="text-[28px] font-extrabold" style={{ color: scoreColor }}>{report.compatibilityScore}%</span>
                <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">Match</p>
              </div>
            </div>
            <div className="px-4 pb-4">
              <div className="h-2 rounded-full bg-[#F3F4F6] overflow-hidden">
                <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${report.compatibilityScore}%`, background: `linear-gradient(90deg, #EC4899, ${scoreColor})` }} />
              </div>
            </div>
          </div>

          <h3 className="font-bold text-[17px] text-[#151B32] mb-3">Personalised Care Plan</h3>
          <div className="space-y-3 mb-4">
            {items.map((item, i) => (
              <div key={i} className="bg-white rounded-2xl px-4 py-4 flex items-center gap-3.5 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: item.bg }}>
                  <item.icon className="w-5 h-5" style={{ color: item.color }} />
                </div>
                <div>
                  <p className="font-bold text-[14px] text-[#151B32]">{item.title}</p>
                  <p className="text-[12px] text-[#6B7280] mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}

            {/* Verdict */}
            <div className="rounded-2xl px-4 py-4 flex items-center gap-3.5 shadow-[0_1px_4px_rgba(0,0,0,0.04)]" style={{ backgroundColor: "#FFF0F6", border: "1px solid #FBCFE8" }}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-[#EC4899]/10">
                <Heart className="w-5 h-5 text-[#EC4899]" />
              </div>
              <div>
                <p className="font-bold text-[14px] text-[#151B32]">Suitability Verdict</p>
                <p className="text-[12px] text-[#6B7280] mt-0.5">{report.verdict}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 pb-8 pt-2 space-y-2.5">
          <button onClick={() => navigate(`/pet/${petData.id}`)}
            className="w-full py-3.5 rounded-2xl font-bold text-[15px] text-white"
            style={{ background: "linear-gradient(135deg, #EC4899, #8B5CF6)" }}>
            Proceed to Purchase
          </button>
          <button onClick={() => toast.info("Download feature coming soon!")}
            className="w-full py-3.5 rounded-2xl font-bold text-[14px] text-[#6B7280] border border-[#E5E7EB] bg-white flex items-center justify-center gap-2">
            <Download className="w-4 h-4" /> Download Full Report
          </button>
        </div>
      </div>
    );
  }

  // ===================== DEEP DIVE REPORT =====================
  const planItems = [
    { icon: Utensils, title: "Feeding Plan", desc: report.feeding, bg: "#FFF0F6", color: "#EC4899" },
    { icon: Activity, title: "Exercise Needs", desc: report.exercise, bg: "#FFF0F6", color: "#EC4899" },
    { icon: Scissors, title: "Grooming Routine", desc: report.grooming, bg: "#FFF0F6", color: "#EC4899" },
  ];

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col">
      <div className="flex items-center px-4 pt-4 pb-3 border-b border-[#F3F4F6]">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-white shadow-sm flex items-center justify-center">
          <ArrowLeft className="w-4 h-4 text-[#151B32]" />
        </button>
        <h1 className="flex-1 text-center font-bold text-[17px] text-[#151B32] pr-9">AI Care Report</h1>
      </div>

      <div className="flex-1 px-5 pt-4 pb-6 overflow-y-auto">
        {/* Hero Card */}
        <div className="rounded-2xl overflow-hidden bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] mb-5">
          <div className="relative">
            <div className="absolute top-3 left-3 bg-[#EC4899] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> AI GENERATED
            </div>
            <img src={petData.image || ""} alt={petData.breed} className="w-full h-[200px] object-cover" />
          </div>
          <div className="p-4 flex items-center justify-between">
            <div>
              <h2 className="font-extrabold text-[22px] text-[#151B32]">{petData.breed}</h2>
              <p className="text-[13px] text-[#EC4899] font-medium">{ageLabel}</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ borderColor: scoreColor, borderWidth: 3, borderStyle: "solid" }}>
                <span className="text-[16px] font-extrabold" style={{ color: scoreColor }}>{report.compatibilityScore}%</span>
              </div>
              <p className="text-[9px] font-bold text-[#9CA3AF] uppercase tracking-wider mt-1">Match</p>
            </div>
          </div>
        </div>

        <h3 className="font-bold text-[17px] text-[#151B32] mb-3">Plan Breakdown</h3>
        <div className="space-y-3 mb-4">
          {planItems.map((item, i) => (
            <div key={i} className="bg-white rounded-2xl px-4 py-4 flex items-start gap-3.5 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: item.bg }}>
                <item.icon className="w-5 h-5" style={{ color: item.color }} />
              </div>
              <div>
                <p className="font-bold text-[14px] text-[#151B32]">{item.title}</p>
                <p className="text-[12px] text-[#6B7280] mt-0.5 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}

          {/* Monthly Budget highlighted */}
          <div className="rounded-2xl px-4 py-4 shadow-[0_1px_4px_rgba(0,0,0,0.04)]" style={{ backgroundColor: "#FFF0F6" }}>
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="w-5 h-5 text-[#EC4899]" />
              <span className="font-bold text-[14px] text-[#151B32]">Monthly Budget</span>
              <span className="ml-auto bg-[#EC4899] text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">Recommended</span>
            </div>
            <p className="text-[22px] font-extrabold text-[#151B32]">{report.monthlyCost} <span className="text-[13px] font-normal text-[#6B7280]">/ month</span></p>
            {report.monthlyCostNote && <p className="text-[11px] text-[#6B7280] mt-1 italic">{report.monthlyCostNote}</p>}
          </div>

          {/* Health Considerations */}
          {report.healthConsiderations && (
            <div className="bg-white rounded-2xl px-4 py-4 flex items-start gap-3.5 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-[#FFF0F6]">
                <HeartPulse className="w-5 h-5 text-[#EC4899]" />
              </div>
              <div>
                <p className="font-bold text-[14px] text-[#151B32]">Health Considerations</p>
                <p className="text-[12px] text-[#6B7280] mt-0.5 leading-relaxed">{report.healthConsiderations}</p>
              </div>
            </div>
          )}

          {/* Beginner Tips */}
          {report.beginnerTips && (
            <div className="bg-white rounded-2xl px-4 py-4 flex items-start gap-3.5 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-[#FFF7ED]">
                <Lightbulb className="w-5 h-5 text-[#F59E0B]" />
              </div>
              <div>
                <p className="font-bold text-[14px] text-[#151B32]">Beginner Tips</p>
                <p className="text-[12px] text-[#6B7280] mt-0.5 leading-relaxed">{report.beginnerTips}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="px-5 pb-8 pt-2 space-y-2.5">
        <button onClick={() => navigate(`/pet/${petData.id}`)}
          className="w-full py-3.5 rounded-2xl font-bold text-[15px] text-white flex items-center justify-center gap-2"
          style={{ background: "linear-gradient(135deg, #EC4899, #8B5CF6)" }}>
          Proceed to Purchase
          <ShoppingCart className="w-4 h-4" />
        </button>
        <button onClick={() => toast.info("Download feature coming soon!")}
          className="w-full py-3.5 rounded-2xl font-bold text-[14px] text-[#EC4899] border border-[#FBCFE8] bg-white flex items-center justify-center gap-2">
          <Download className="w-4 h-4" /> Download Care Plan
        </button>
      </div>
    </div>
  );
};

export default CarePlanReport;
