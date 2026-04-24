import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Utensils, Activity, Heart, HeartPulse, Brain, Sparkles, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import rjStar from "@/assets/rj-star.png";

interface AIInsightsCardProps {
  breed: string;
  category: string;
  ageMonths: number;
  gender?: string;
  petId?: string;
  petImage?: string;
}

interface InsightsData {
  quick: {
    nutrition: { title: string; text: string };
    activity: { title: string; text: string };
    lifespan: { title: string; text: string };
  };
  deep: {
    health: { title: string; text: string };
    training: { title: string; text: string };
    grooming: { title: string; text: string };
  };
}

const AIInsightsCard = ({ breed, category, ageMonths, gender = "unknown", petId, petImage }: AIInsightsCardProps) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"quick" | "deep">("quick");
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInsights = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke("pet-ai-insights", {
          body: { breed, category, ageMonths, gender },
        });
        if (error) throw error;
        setInsights(data);
      } catch (e) {
        console.error("Failed to fetch AI insights:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchInsights();
  }, [breed, category, ageMonths, gender]);

  const quickFacts = insights
    ? [
        {
          icon: Utensils,
          title: insights.quick.nutrition.title,
          desc: insights.quick.nutrition.text,
          bgColor: "#F3EEFF",
          iconColor: "#7C3AED",
        },
        {
          icon: Activity,
          title: insights.quick.activity.title,
          desc: insights.quick.activity.text,
          bgColor: "#EEF4FF",
          iconColor: "#3B82F6",
        },
        {
          icon: Heart,
          title: insights.quick.lifespan.title,
          desc: insights.quick.lifespan.text,
          bgColor: "#FFF1F2",
          iconColor: "#F43F5E",
        },
      ]
    : [];

  const deepDive = insights
    ? [
        {
          icon: HeartPulse,
          title: insights.deep.health.title,
          desc: insights.deep.health.text,
          bgColor: "#F0FDF4",
          iconColor: "#3B82F6",
        },
        {
          icon: Brain,
          title: insights.deep.training.title,
          desc: insights.deep.training.text,
          bgColor: "#EEF4FF",
          iconColor: "#3B82F6",
        },
        {
          icon: Sparkles,
          title: insights.deep.grooming.title,
          desc: insights.deep.grooming.text,
          bgColor: "#FFF1F2",
          iconColor: "#F472B6",
        },
      ]
    : [];

  const items = activeTab === "quick" ? quickFacts : deepDive;

  return (
    <div
      className="mx-4 rounded-3xl bg-[#F9FAFB] overflow-hidden"
      style={{
        border: "1.5px solid transparent",
        backgroundImage:
          "linear-gradient(#F9FAFB, #F9FAFB), linear-gradient(135deg, #C4B5FD, #F9A8D4, #C4B5FD)",
        backgroundOrigin: "border-box",
        backgroundClip: "padding-box, border-box",
        boxShadow: "0 4px 24px -4px rgba(139,92,246,0.08)",
      }}
    >
      {/* Header Row */}
      <div className="flex items-center justify-between px-5 sm:px-6 pt-7 sm:pt-6 pb-4">
        <div className="flex items-center gap-1.5">
          <div className="relative flex-shrink-0 flex items-start">
            <img
              src={rjStar}
              alt=""
              className="w-[49px] h-[49px] object-contain drop-shadow-[0_0_8px_rgba(139,92,246,0.35)]"
              style={{
                filter: "drop-shadow(0 0 6px rgba(236,72,153,0.2))",
              }}
            />
          </div>
          <div className="flex flex-col leading-snug">
            <span className="font-semibold text-[#151B32] text-[18px] sm:text-[20px] tracking-tight">
              Sruvo AI
            </span>
            <span className="font-extrabold text-[#151B32] text-[20px] sm:text-[21px] tracking-tight -mt-0.5">
              Insights
            </span>
          </div>
        </div>
        <div className="flex bg-[#F3F4F6] rounded-full p-1">
          <button
            onClick={() => setActiveTab("quick")}
            className={`px-4 py-2 text-[12px] font-semibold rounded-full transition-all duration-300 ${
              activeTab === "quick"
                ? "bg-white text-[#151B32] shadow-sm"
                : "text-[#9CA3AF]"
            }`}
          >
            Quick<br />Facts
          </button>
          <button
            onClick={() => setActiveTab("deep")}
            className={`px-4 py-2 text-[12px] font-semibold rounded-full transition-all duration-300 ${
              activeTab === "deep"
                ? "bg-white text-[#151B32] shadow-sm"
                : "text-[#9CA3AF]"
            }`}
          >
            Deep<br />Dive
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 pb-2">
        {loading ? (
          <div className="space-y-5 py-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4 animate-pulse">
                <div className="w-12 h-12 rounded-full bg-[#E5E7EB] flex-shrink-0" />
                <div className="flex-1 space-y-2 pt-1">
                  <div className="h-4 bg-[#E5E7EB] rounded w-1/3" />
                  <div className="h-3 bg-[#E5E7EB] rounded w-full" />
                  <div className="h-3 bg-[#E5E7EB] rounded w-4/5" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            key={activeTab}
            className="space-y-5 py-2"
            style={{ animation: "fadeIn 0.3s ease-in-out" }}
          >
            {items.map((item, i) => (
              <div key={i} className="flex gap-4">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: item.bgColor }}
                >
                  <item.icon className="w-5 h-5" style={{ color: item.iconColor }} />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-[15px] text-[#151B32] mb-1">{item.title}</p>
                  <p className="text-[13px] text-[#6B7280] leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="px-6 pb-6 pt-3">
        <button
          onClick={() => navigate("/care-plan/intro", { state: { petData: { id: petId, breed, category, ageMonths, gender, image: petImage }, flowType: activeTab } })}
          className="w-full py-3.5 rounded-2xl bg-[#EDE9FE] text-[#7C3AED] font-bold text-[15px] flex items-center justify-center gap-2 hover:bg-[#DDD6FE] transition-colors"
        >
          Get Personalised Care Plan
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default AIInsightsCard;
