import { ShieldCheck, Syringe, MapPin } from "lucide-react";

interface KeyDetailsSectionProps {
  vaccinated: boolean;
  city: string;
  state: string;
  isVerified: boolean;
}

const KeyDetailsSection = ({ vaccinated, city, state, isVerified }: KeyDetailsSectionProps) => {
  const details = [
    {
      icon: ShieldCheck,
      title: "Health Guaranteed",
      subtitle: "2-year congenital health warranty",
      bgColor: "#D1FAE5",
      iconColor: "#10B981",
    },
    {
      icon: Syringe,
      title: "Up to Date",
      subtitle: "All shots & deworming complete",
      bgColor: "#FFE4EF",
      iconColor: "#F472D0",
    },
    {
      icon: MapPin,
      title: "Origin",
      subtitle: `Certified Breeder in ${city}`,
      bgColor: "#E0E7FF",
      iconColor: "#818CF8",
    },
  ];

  return (
    <div className="px-5 py-4">
      <h3 className="font-bold text-[17px] text-[#151B32] mb-3">Key Details</h3>
      <div className="space-y-3.5">
        {details.map((d, i) => (
          <div key={i} className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: d.bgColor }}
            >
              <d.icon className="w-4 h-4" style={{ color: d.iconColor }} />
            </div>
            <div>
              <p className="text-[13px] font-bold text-[#151B32]">{d.title}</p>
              <p className="text-[11px] text-[#888]">{d.subtitle}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default KeyDetailsSection;
