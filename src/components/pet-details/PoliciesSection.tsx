import { ShieldCheck, FileText } from "lucide-react";

const PoliciesSection = () => {
  return (
    <div className="px-5 py-4">
      <h3 className="font-bold text-[17px] text-[#151B32] mb-3">Policies</h3>
      <div className="space-y-3.5">
        <div className="flex gap-3">
          <div className="w-9 h-9 rounded-full bg-[#D1FAE5] flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-4 h-4 text-[#10B981]" />
          </div>
          <div>
            <p className="text-[13px] font-bold text-[#151B32]">48-hour Health Guarantee</p>
            <p className="text-[11px] text-[#888]">Initial wellness check coverage upon arrival</p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="w-9 h-9 rounded-full bg-[#E0E7FF] flex items-center justify-center flex-shrink-0">
            <FileText className="w-4 h-4 text-[#818CF8]" />
          </div>
          <div>
            <p className="text-[13px] font-bold text-[#151B32]">Replacement Policy Terms</p>
            <p className="text-[11px] text-[#888]">Standard protection for unforeseen conditions</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PoliciesSection;
