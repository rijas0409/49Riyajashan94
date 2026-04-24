import { format } from "date-fns";
import { FileText, Syringe } from "lucide-react";
import type { VaccineEntry } from "./AddVaccineModal";

interface VaccinationTableProps {
  entries: VaccineEntry[];
  onAddClick: () => void;
}

const VaccinationTable = ({ entries, onAddClick }: VaccinationTableProps) => {
  return (
    <div className="space-y-2 animate-fade-in">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm font-medium">
          <Syringe className="w-4 h-4 text-primary" />
          Vaccination Documents *
        </label>
        <button
          type="button"
          onClick={onAddClick}
          className="text-sm font-semibold text-[#A855F7] border border-[#A855F7] rounded-xl px-3 py-1.5 hover:bg-[#A855F7]/10 transition-colors"
        >
          + Add Vaccine
        </button>
      </div>

      <div className="rounded-2xl overflow-hidden border border-[#F3E8FF] bg-[#FDF8FF]">
        {/* Table Header */}
        <div className="grid grid-cols-5 gap-1 bg-[#F9F0FF] px-4 py-2.5 text-xs font-semibold text-[#6B21A8]">
          <span>Vaccine</span>
          <span>Dose</span>
          <span>Date Given</span>
          <span>Next Due</span>
          <span>Certificate</span>
        </div>

        {/* Table Body */}
        {entries.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-muted-foreground">
            No vaccinations added yet
          </div>
        ) : (
          entries.map((entry, i) => (
            <div key={i} className="grid grid-cols-5 gap-1 px-4 py-3 text-xs border-t border-[#F3E8FF] items-center">
              <span className="font-medium text-[#151B32]">{entry.vaccineType}</span>
              <span className="text-muted-foreground">{entry.doseNumber}</span>
              <span className="text-muted-foreground">{format(entry.dateAdministered, "dd MMM yyyy")}</span>
              <span className="text-muted-foreground">
                {entry.nextDueDate ? format(entry.nextDueDate, "dd MMM yyyy") : "—"}
              </span>
              <span className="flex items-center gap-1 text-[#A855F7]">
                <FileText className="w-3 h-3" />
                <span className="truncate max-w-[80px]">{entry.certificateName || "—"}</span>
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default VaccinationTable;
