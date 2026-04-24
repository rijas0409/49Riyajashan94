import { useState, useEffect } from "react";
import { ShieldCheck, FileText, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import HealthCertificatePreview from "./HealthCertificatePreview";

interface HealthSafetySectionProps {
  petId: string;
  vaccinated: boolean;
}

interface VaccinationRecord {
  id: string;
  vaccine_type: string;
  dose_number: string;
  date_administered: string;
  next_due_date: string | null;
  certificate_url: string | null;
  certificate_name: string | null;
}

const HealthSafetySection = ({ petId, vaccinated }: HealthSafetySectionProps) => {
  const [vaccinations, setVaccinations] = useState<VaccinationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    const fetchVaccinations = async () => {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from("pet_vaccinations")
        .select("*")
        .eq("pet_id", petId)
        .order("date_administered", { ascending: false });

      if (!error && data) {
        setVaccinations(data);
      }
      setLoading(false);
    };
    fetchVaccinations();
  }, [petId]);

  if (!vaccinated || (!loading && vaccinations.length === 0)) {
    return null;
  }

  if (loading) {
    return (
      <div className="px-5 py-4">
        <h3 className="font-bold text-[17px] text-[#151B32] mb-3">Health & Safety</h3>
        <div className="animate-pulse space-y-3">
          <div className="h-16 bg-[#E5E7EB] rounded-2xl" />
          <div className="h-10 bg-[#E5E7EB] rounded-xl" />
          <div className="h-10 bg-[#E5E7EB] rounded-xl" />
        </div>
      </div>
    );
  }

  const latestVaccination = vaccinations[0];
  const lastVaccDate = new Date(latestVaccination.date_administered);
  const isOverdue = latestVaccination.next_due_date
    ? new Date(latestVaccination.next_due_date) < new Date()
    : false;

  // Find the latest vaccination record that has a certificate uploaded
  const latestCertRecord = vaccinations.find(v => v.certificate_url && v.certificate_url.trim().length > 0);

  return (
    <>
      <div className="px-5 py-4">
        <h3 className="font-bold text-[17px] text-[#151B32] mb-3">Health & Safety</h3>

        {/* Last vaccinated card */}
        <div className={`flex items-center justify-between rounded-2xl px-4 py-3 mb-4 border ${
          isOverdue 
            ? "bg-[#FFF7ED] border-[#FDBA74]" 
            : "bg-[#ECFDF5] border-[#A7F3D0]"
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
              isOverdue ? "bg-[#F97316]" : "bg-[#10B981]"
            }`}>
              {isOverdue 
                ? <AlertTriangle className="w-4 h-4 text-white" />
                : <ShieldCheck className="w-4 h-4 text-white" />
              }
            </div>
            <div>
              <p className="text-[9px] font-bold text-[#6B7280] uppercase tracking-wider">LAST VACCINATED</p>
              <p className="text-[13px] font-bold text-[#151B32]">
                {format(lastVaccDate, "MMMM d, yyyy")}
              </p>
            </div>
          </div>
          <span className={`px-2.5 py-1 rounded-full border text-[9px] font-bold uppercase ${
            isOverdue
              ? "border-[#F97316] text-[#F97316]"
              : "border-[#10B981] text-[#10B981]"
          }`}>
            {isOverdue ? "OVERDUE" : "UP TO DATE"}
          </span>
        </div>

        {/* Vaccination Timeline */}
        <p className="text-[14px] font-bold text-[#151B32] mb-3">Vaccination Timeline</p>
        <div className="space-y-0 relative ml-1">
          {vaccinations.map((item, i) => {
            const isPast = new Date(item.date_administered) <= new Date();
            return (
              <div key={item.id} className="flex gap-3 relative pb-4">
                {i < vaccinations.length - 1 && (
                  <div
                    className="absolute left-[7px] top-4 w-0.5 h-full"
                    style={{ backgroundColor: isPast ? "#A855F7" : "#E5E7EB" }}
                  />
                )}
                <div className="relative z-10 mt-1 flex-shrink-0">
                  <div
                    className="w-[15px] h-[15px] rounded-full border-2 flex items-center justify-center"
                    style={{
                      borderColor: isPast ? "#A855F7" : "#D1D5DB",
                      backgroundColor: isPast ? "#A855F7" : "transparent",
                    }}
                  >
                    {isPast && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>
                <div>
                  <p className="text-[13px] font-bold text-[#151B32]">
                    {item.vaccine_type} ({item.dose_number})
                  </p>
                  <p className="text-[11px] text-[#888]">
                    {format(new Date(item.date_administered), "dd MMM yyyy")}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Preview button - uses latest certificate across all records */}
        <button
          onClick={() => latestCertRecord && setShowPreview(true)}
          disabled={!latestCertRecord}
          className={`w-full mt-2 py-3 rounded-xl border flex items-center justify-center gap-2 text-[13px] font-bold transition-colors ${
            latestCertRecord
              ? "border-[#D8B4FE] text-[#A855F7] bg-[#FAF5FF] hover:bg-[#F3E8FF]"
              : "border-[#E5E7EB] text-[#9CA3AF] bg-[#F9FAFB] cursor-not-allowed"
          }`}
        >
          <FileText className="w-4 h-4" />
          Preview Health Certificate
        </button>
      </div>

      {/* Certificate Preview Screen */}
      {showPreview && latestCertRecord?.certificate_url && (
        <HealthCertificatePreview
          certificateUrl={latestCertRecord.certificate_url}
          certificateName={latestCertRecord.certificate_name}
          onBack={() => setShowPreview(false)}
        />
      )}
    </>
  );
};

export default HealthSafetySection;
