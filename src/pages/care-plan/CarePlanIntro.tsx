import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import carePlanHero from "@/assets/care-plan-hero.jpg";

const features = [
  { title: "Lifestyle compatibility score", desc: "Matches based on your activity levels" },
  { title: "Monthly cost estimate", desc: "Food, grooming, and insurance breakdown" },
  { title: "Custom care routine", desc: "Suggested daily schedule for your new friend" },
];

const CarePlanIntro = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const petData = location.state?.petData;
  const flowType = location.state?.flowType || "quick";

  if (!petData) {
    navigate(-1);
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col">
      {/* Header */}
      <div className="flex items-center px-4 pt-4 pb-2">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2">
          <ArrowLeft className="w-5 h-5 text-[#151B32]" />
        </button>
        <h1 className="flex-1 text-center font-bold text-[17px] text-[#151B32] pr-7">
          Personalised Care Plan
        </h1>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 pt-4 pb-6 flex flex-col">
        <h2 className="text-[26px] font-extrabold text-[#151B32] text-center leading-tight mb-5">
          See if this pet fits your lifestyle
        </h2>

        <div className="rounded-2xl overflow-hidden mb-6 mx-auto max-w-[340px]">
          <img
            src={petData.image || carePlanHero}
            alt={petData.breed}
            className="w-full h-[220px] object-cover"
          />
        </div>

        <div className="space-y-3 mb-8">
          {features.map((f, i) => (
            <div key={i} className="bg-white rounded-2xl px-5 py-4 flex items-start gap-3.5 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
              <div className="w-8 h-8 rounded-full bg-[#FFF0F3] flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle2 className="w-4.5 h-4.5 text-[#EC4899]" />
              </div>
              <div>
                <p className="font-bold text-[15px] text-[#151B32]">{f.title}</p>
                <p className="text-[13px] text-[#6B7280] mt-0.5">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="px-6 pb-8 pt-2">
        <button
          onClick={() => navigate("/care-plan/form", { state: { petData, flowType } })}
          className="w-full py-4 rounded-2xl font-bold text-[16px] text-white"
          style={{ background: "linear-gradient(135deg, #EC4899, #8B5CF6)" }}
        >
          Start Personalisation
        </button>
        <p className="text-center text-[12px] text-[#9CA3AF] mt-3">Takes about 2 minutes to complete</p>
      </div>
    </div>
  );
};

export default CarePlanIntro;
