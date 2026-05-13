import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, MapPin, Stethoscope, BadgeCheck, Search, Filter, ChevronRight
} from "lucide-react";
import { useLocation } from "@/contexts/LocationContext";

interface Clinic {
  id: string;
  name: string;
  location: string;
  doctorsCount: number;
  distance: number;
  verified: boolean;
  doctorImages?: string[];
}

const ClinicsNearby = () => {
  const navigate = useNavigate();
  const { city } = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  const DEMO_CLINICS: Clinic[] = [
    {
      id: "clinic-1",
      name: "Pawprints Clinic",
      location: "Bandra West, Mumbai",
      doctorsCount: 3,
      distance: 3.5,
      verified: true,
      doctorImages: [
        "https://images.unsplash.com/photo-1559839734-2b71f1536783?w=100&h=100&fit=crop",
        "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=100&h=100&fit=crop",
        "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=100&h=100&fit=crop"
      ]
    },
    {
      id: "clinic-2",
      name: "Happy Paws Clinic",
      location: "Juhu, Mumbai",
      doctorsCount: 1,
      distance: 6.2,
      verified: true,
      doctorImages: [
        "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=100&h=100&fit=crop"
      ]
    },
    {
      id: "clinic-3",
      name: "Pet Health Centre",
      location: "Andheri East, Mumbai",
      doctorsCount: 4,
      distance: 12.0,
      verified: true,
      doctorImages: [
        "https://images.unsplash.com/photo-1550831107-1553da8c8464?w=100&h=100&fit=crop",
        "https://images.unsplash.com/photo-1527613426441-4da17471b66d?w=100&h=100&fit=crop",
        "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=100&h=100&fit=crop"
      ]
    },
    {
      id: "clinic-4",
      name: "City Veterinary Hospital",
      location: "Powai, Mumbai",
      doctorsCount: 6,
      distance: 18.5,
      verified: true,
      doctorImages: [
        "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=100&h=100&fit=crop",
        "https://images.unsplash.com/photo-1581091221741-2b27d0577f76?w=100&h=100&fit=crop",
        "https://images.unsplash.com/photo-1581091222184-adb839cc3158?w=100&h=100&fit=crop"
      ]
    },
    {
      id: "clinic-5",
      name: "Animal Care Clinic",
      location: "Mulund West, Mumbai",
      doctorsCount: 2,
      distance: 25.0,
      verified: true,
      doctorImages: [
        "https://images.unsplash.com/photo-1576091160550-217359f4ecf8?w=100&h=100&fit=crop",
        "https://images.unsplash.com/photo-1576091160241-2651622250ce?w=100&h=100&fit=crop"
      ]
    },
    {
      id: "clinic-6",
      name: "Modern Pet Hospital",
      location: "Thane West, Thane",
      doctorsCount: 5,
      distance: 32.0,
      verified: true,
      doctorImages: [
        "https://images.unsplash.com/photo-1579152276503-f15a96c0a82e?w=100&h=100&fit=crop",
        "https://images.unsplash.com/photo-1579152276501-92b19f074d75?w=100&h=100&fit=crop",
        "https://images.unsplash.com/photo-1579152276502-d7b6b2b1a80b?w=100&h=100&fit=crop"
      ]
    }
  ];

  const filteredClinics = DEMO_CLINICS
    .filter(clinic => 
      clinic.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      clinic.location.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => a.distance - b.distance);

  return (
    <div className="min-h-screen bg-[#F8F9FB] pb-10">
      {/* Header */}
      <div className="bg-white px-4 py-6 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-4 mb-6">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-[#F1F1F1] flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-[#151B32]" />
          </button>
          <div>
            <h1 className="text-xl font-black text-[#151B32]">Clinics Nearby</h1>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <MapPin className="w-3 h-3" />
              <span>Searching in {city}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text"
              placeholder="Search by clinic name or area"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-[#F1F5F9] rounded-2xl text-sm focus:outline-none border-none"
            />
          </div>
          <button className="w-12 h-12 bg-[#F1F5F9] rounded-2xl flex items-center justify-center">
            <Filter className="w-4 h-4 text-[#151B32]" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6">
        <div className="flex items-center justify-between mb-6 px-1">
          <h2 className="text-[17px] font-extrabold text-[#151B32] uppercase tracking-wider">
            Verified Clinics
          </h2>
          <span className="text-xs font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {filteredClinics.length} FOUND
          </span>
        </div>
        
        <div className="space-y-4">
          {filteredClinics.map((clinic) => (
            <div 
              key={clinic.id}
              onClick={() => navigate(`/vet/clinic/${clinic.id}`)}
              className="bg-white rounded-[28px] p-4 flex items-center gap-4 shadow-sm border border-[#F1F1F1] active:scale-[0.98] transition-all cursor-pointer group"
            >
              <div className="w-[60px] h-[60px] rounded-[18px] bg-[#FFF0F5] flex items-center justify-center shrink-0">
                <Stethoscope className="w-7 h-7 text-[#D674A3]" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-bold text-base text-[#151B32] truncate">{clinic.name}</h3>
                  {clinic.verified && (
                    <div className="flex items-center gap-1 bg-[#ECFDF5] px-2 py-0.5 rounded-full border border-[#D1FAE5]">
                      <BadgeCheck className="w-3 h-3 text-[#10B981]" />
                      <span className="text-[8px] font-black text-[#10B981] uppercase tracking-wider">VERIFIED</span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-1 text-muted-foreground mt-0.5">
                  <MapPin className="w-3 h-3 text-[#4F46E5]" />
                  <span className="text-[12px] font-medium truncate">{clinic.location}</span>
                  <span className="text-[10px] font-bold text-[#4F46E5] ml-1">({clinic.distance} km)</span>
                </div>
                
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex -space-x-2">
                    {(clinic.doctorImages || []).slice(0, 3).map((img, i) => (
                      <div key={i} className="w-6 h-6 rounded-full border-2 border-white overflow-hidden bg-muted">
                        <img src={img} alt="Doctor" className="w-full h-full object-cover" />
                      </div>
                    ))}
                    {clinic.doctorsCount > 3 && (
                      <div className="w-6 h-6 rounded-full bg-[#FFE4E9] border-2 border-white flex items-center justify-center text-[8px] font-bold text-[#D674A3]">
                        +{clinic.doctorsCount - 3}
                      </div>
                    )}
                  </div>
                  <span className="text-[11px] font-bold text-[#A1A1A1]">+{clinic.doctorsCount} Doctors</span>
                </div>
              </div>
              
              <ChevronRight className="w-4 h-4 text-[#A1A1A1] group-hover:translate-x-1 transition-transform" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ClinicsNearby;
