import { Badge } from "@/components/ui/badge";

interface PetInfoSectionProps {
  breed: string;
  name: string;
  price: number;
  originalPrice?: number;
  ageMonths: number;
  gender: string;
  color: string | null;
  vaccinated: boolean;
  verificationStatus: string;
  isFeatured: boolean;
  bloodline?: string;
  registeredWith?: string;
  birthDate?: string | null;
  ageType?: string | null;
  size?: string | null;
  createdAt?: string | null;
}

/**
 * Calculate dynamic age from birth_date or from age_months + created_at.
 * - If birthDate (exact age): compute real age from birth date to today.
 * - If approximate: age_months was set at created_at, so add elapsed months.
 */
const computeCurrentAgeMonths = (
  ageMonths: number,
  ageType?: string | null,
  birthDate?: string | null,
  createdAt?: string | null,
): number => {
  if (ageType === "exact" && birthDate) {
    const birth = new Date(birthDate);
    const now = new Date();
    return (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  }
  if (ageType === "approximate" && createdAt) {
    const created = new Date(createdAt);
    const now = new Date();
    const elapsedMonths = (now.getFullYear() - created.getFullYear()) * 12 + (now.getMonth() - created.getMonth());
    return ageMonths + elapsedMonths;
  }
  return ageMonths;
};

const formatAge = (months: number) => {
  if (months < 0) months = 0;
  const weeks = Math.round(months * 4.33);
  // Less than 6 months → show weeks
  if (months < 6) return `${weeks} Weeks`;
  // 6–11 months → show months
  if (months < 12) return `${months} Months`;
  // 12+ → years + months
  const years = Math.floor(months / 12);
  const rem = months % 12;
  if (rem === 0) return `${years}y`;
  return `${years}y ${rem}m`;
};

const PetInfoSection = ({ breed, name, price, originalPrice, ageMonths, gender, color, vaccinated, verificationStatus, isFeatured, bloodline, registeredWith, birthDate, ageType, size, createdAt }: PetInfoSectionProps) => {
  const formatPrice = (p: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(p);

  const currentAge = computeCurrentAgeMonths(ageMonths, ageType, birthDate, createdAt);
  const sizeLabel = size || (currentAge < 6 ? "Small" : currentAge < 18 ? "Medium" : "Large");
  const displayBloodline = bloodline || (isFeatured ? "CHAMPION BLOODLINE" : "");
  const displayRegistration = registeredWith || "";

  return (
    <div className="bg-white rounded-t-3xl -mt-6 relative z-10 px-5 pt-5 pb-3">
      {/* Bloodline badge + Price */}
      <div className="flex items-start justify-between mb-1">
        <div>
          {displayBloodline && (
            <span className="inline-block px-3 py-1 rounded-full border border-[#10B981] text-[#10B981] text-[10px] font-bold uppercase tracking-wider mb-2">
              {displayBloodline}
            </span>
          )}
        </div>
        <div className="text-right">
          <p className="text-[24px] font-bold text-[#F472D0]">{formatPrice(price)}</p>
          {typeof originalPrice === "number" && originalPrice > 0 && originalPrice !== price && (
            <p className="text-[15px] font-medium text-[#999] line-through -mt-1">{formatPrice(originalPrice)}</p>
          )}
        </div>
      </div>

      {/* Pet name */}
      <h1 className="text-[26px] font-extrabold leading-tight text-[#151B32] mb-0.5">{name}</h1>
      <p className="text-[16px] font-semibold text-[#888] mb-1">{breed}</p>

      {/* Status badges */}
      <div className="flex flex-wrap gap-2 mt-2 mb-4">
        {vaccinated && (
          <span className="px-2.5 py-1 rounded-md border border-[#10B981] text-[#10B981] text-[10px] font-bold uppercase">VACCINATED</span>
        )}
        {displayRegistration && displayRegistration !== "Not Registered" && (
          <span className="px-2.5 py-1 rounded-md border border-[#60A5FA] text-[#60A5FA] text-[10px] font-bold uppercase">
            {displayRegistration}
          </span>
        )}
        {!displayRegistration && verificationStatus === "verified" && (
          <span className="px-2.5 py-1 rounded-md border border-[#60A5FA] text-[#60A5FA] text-[10px] font-bold uppercase">KCI REGISTERED</span>
        )}
      </div>

      {/* Age / Gender / Size pills */}
      <div className="grid grid-cols-3 gap-2.5">
        {[
          { label: "AGE", value: formatAge(currentAge) },
          { label: "GENDER", value: gender },
          { label: "SIZE", value: sizeLabel },
        ].map((item) => (
          <div key={item.label} className="bg-[#F5F5F7] rounded-xl py-2.5 px-3 text-center border border-[#ECECEC]">
            <p className="text-[9px] font-medium text-[#999] tracking-widest uppercase">{item.label}</p>
            <p className="text-[13px] font-semibold text-[#151B32] capitalize mt-0.5">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PetInfoSection;
