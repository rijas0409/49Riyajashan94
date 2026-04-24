import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export interface VaccineEntry {
  vaccineType: string;
  doseNumber: string;
  dateAdministered: Date;
  nextDueDate: Date | null;
  certificateFile: File | null;
  certificateName: string;
}

interface AddVaccineModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (entry: VaccineEntry) => void;
}

const VACCINE_TYPES = [
  "DHPP",
  "Rabies",
  "Bordetella",
  "Canine Influenza",
  "Leptospirosis",
  "Lyme Disease",
  "FVRCP",
  "FeLV",
  "Parvovirus",
  "Distemper",
  "Hepatitis",
  "Parainfluenza",
  "Other",
];

const DOSE_OPTIONS = ["1st Dose", "2nd Dose", "3rd Dose", "Booster", "Annual"];

const AddVaccineModal = ({ open, onOpenChange, onAdd }: AddVaccineModalProps) => {
  const [vaccineType, setVaccineType] = useState("");
  const [doseNumber, setDoseNumber] = useState("");
  const [dateAdministered, setDateAdministered] = useState<Date | undefined>();
  const [nextDueDate, setNextDueDate] = useState<Date | undefined>();
  const [certificateFile, setCertificateFile] = useState<File | null>(null);

  const resetForm = () => {
    setVaccineType("");
    setDoseNumber("");
    setDateAdministered(undefined);
    setNextDueDate(undefined);
    setCertificateFile(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
    if (!validTypes.includes(file.type)) {
      toast.error("Only PDF, JPG, PNG files are allowed");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be under 5MB");
      return;
    }
    setCertificateFile(file);
  };

  const handleAdd = () => {
    if (!vaccineType) { toast.error("Please select vaccine type"); return; }
    if (!doseNumber) { toast.error("Please select dose number"); return; }
    if (!dateAdministered) { toast.error("Please select date administered"); return; }
    if (!nextDueDate) { toast.error("Please select next due date"); return; }
    if (!certificateFile) { toast.error("Please upload a certificate"); return; }

    onAdd({
      vaccineType,
      doseNumber,
      dateAdministered,
      nextDueDate,
      certificateFile,
      certificateName: certificateFile.name,
    });
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-[550px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Add Vaccine</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Row: Vaccine Type & Dose Number */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Vaccine Type <span className="text-destructive">*</span></Label>
              <Select value={vaccineType} onValueChange={setVaccineType}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select Vaccine" />
                </SelectTrigger>
                <SelectContent>
                  {VACCINE_TYPES.map((v) => (
                    <SelectItem key={v} value={v}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Dose Number <span className="text-destructive">*</span></Label>
              <Select value={doseNumber} onValueChange={setDoseNumber}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select Dose" />
                </SelectTrigger>
                <SelectContent>
                  {DOSE_OPTIONS.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row: Date Administered & Next Due Date */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Date Administered <span className="text-destructive">*</span></Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal rounded-xl", !dateAdministered && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateAdministered ? format(dateAdministered, "PP") : "Select Date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dateAdministered} onSelect={setDateAdministered} disabled={(d) => d > new Date()} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Next Due Date <span className="text-destructive">*</span></Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal rounded-xl", !nextDueDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {nextDueDate ? format(nextDueDate, "PP") : "Select Date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={nextDueDate} onSelect={setNextDueDate} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Certificate Upload */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Upload Certificate <span className="text-destructive">*</span></Label>
            <div className="border-2 border-dashed border-border rounded-2xl p-6 text-center">
              <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileUpload} className="hidden" id="vaccine-cert-upload" />
              {certificateFile ? (
                <div className="flex items-center justify-center gap-2">
                  <span className="text-sm font-medium truncate max-w-[200px]">{certificateFile.name}</span>
                  <button type="button" onClick={() => setCertificateFile(null)} className="w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <label htmlFor="vaccine-cert-upload" className="cursor-pointer">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm font-medium text-muted-foreground">Upload Certificate</p>
                  <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG (Max 5MB)</p>
                </label>
              )}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" className="rounded-xl px-6" onClick={() => { resetForm(); onOpenChange(false); }}>Cancel</Button>
            <Button className="rounded-xl px-6 bg-gradient-to-r from-[#A855F7] to-[#EC4899] hover:opacity-90 text-white" onClick={handleAdd}>Add</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddVaccineModal;
