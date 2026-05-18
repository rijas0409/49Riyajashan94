import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, MapPin, BadgeCheck, Stethoscope } from "lucide-react";

const ClinicDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // In a real app, you would fetch this from Supabase.
  // For now, since the IDs are from the demo, we replicate the data source.
  const ALL_CLINICS = [
    { id: "clinic-1", name: "Pawprints Clinic", location: "Bandra West, Mumbai", doctorsCount: 3, distance: 3.5, verified: true },
    { id: "clinic-2", name: "Happy Paws Clinic", location: "Juhu, Mumbai", doctorsCount: 1, distance: 6.2, verified: true },
    { id: "clinic-3", name: "Pet Health Centre", location: "Andheri East, Mumbai", doctorsCount: 4, distance: 12.0, verified: true },
    { id: "clinic-4", name: "City Veterinary Hospital", location: "Powai, Mumbai", doctorsCount: 6, distance: 18.5, verified: true },
    { id: "clinic-5", name: "Animal Care Clinic", location: "Mulund West, Mumbai", doctorsCount: 2, distance: 25.0, verified: true },
    { id: "clinic-6", name: "Modern Pet Hospital", location: "Thane West, Thane", doctorsCount: 5, distance: 32.0, verified: true }
  ];

  const clinic = ALL_CLINICS.find(c => c.id === id);

  if (!clinic) {
    return (
      <div className="p-4 text-center">
        <h1 className="text-xl font-bold">Clinic not found</h1>
        <button onClick={() => navigate(-1)} className="mt-4 text-blue-500">Go back</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB] pb-10">
      <div className="bg-white px-4 py-6 sticky top-0 z-50">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-medium">
          <ArrowLeft className="w-5 h-5" /> Back
        </button>
      </div>

      <div className="px-4 py-6">
        <div className="bg-white rounded-[28px] p-6 shadow-sm">
          <div className="w-20 h-20 rounded-full bg-[#FFF0F5] flex items-center justify-center mb-4">
            <Stethoscope className="w-10 h-10 text-[#D674A3]" />
          </div>
          <h1 className="text-2xl font-bold">{clinic.name}</h1>
          <div className="flex items-center gap-1 text-muted-foreground mt-2">
            <MapPin className="w-4 h-4" />
            <span>{clinic.location}</span>
          </div>
          {clinic.verified && (
             <div className="flex items-center gap-1 mt-2 bg-[#ECFDF5] px-2 py-1 rounded inline-flex border border-[#D1FAE5]">
               <BadgeCheck className="w-4 h-4 text-[#10B981]" />
               <span className="text-xs font-bold text-[#10B981] uppercase tracking-wider">VERIFIED CLINIC</span>
             </div>
          )}
          <p className="mt-4 text-sm">This clinic has {clinic.doctorsCount} specialized doctors available.</p>
        </div>
      </div>
    </div>
  );
};

export default ClinicDetails;
