import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { 
  ArrowLeft, MapPin, Star, Stethoscope, BadgeCheck, Search, Filter, MessageCircle, Video
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "@/contexts/LocationContext";
import { toast } from "sonner";

interface RealVet {
  id: string;
  name: string;
  specialty: string;
  experience: string;
  rating: number;
  price: number;
  image: string;
  verified: boolean;
  isActive: boolean;
  distance?: number;
  availability?: string;
}

const AllSpecializedVets = () => {
  const navigate = useNavigate();
  const { authReady } = useAuth();
  const { city } = useLocation();
  const [allVets, setAllVets] = useState<RealVet[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!authReady) return;

    const fetchVets = async () => {
      // Fetch vets that are both verified in vet_profiles AND approved in profiles
      const { data: profilesWithVets, error } = await supabase
        .from("profiles")
        .select(`
          id,
          name,
          full_name,
          profile_photo,
          is_admin_approved,
          vet_profiles!vet_profiles_user_id_fkey(
            id,
            specializations,
            years_of_experience,
            online_fee,
            average_rating,
            verification_status,
            is_active,
            profile_photo,
            offline_fee
          )
        `)
        .eq("role", "vet")
        .eq("is_admin_approved", true)
        .not("vet_profiles", "is", null);

      if (error) {
        console.error("Error fetching vets:", error);
        return;
      }

      if (!profilesWithVets) {
        setAllVets([]);
        return;
      }

      const vets: RealVet[] = profilesWithVets
        .filter(p => {
          const vp = Array.isArray(p.vet_profiles) ? p.vet_profiles[0] : (p.vet_profiles as any);
          return vp && vp.verification_status === "verified" && vp.is_active;
        })
        .map((p) => {
          const vp = Array.isArray(p.vet_profiles) ? p.vet_profiles[0] : (p.vet_profiles as any);
          const name = p.full_name || p.name || "Doctor";
          const specs = vp.specializations || [];
          return {
            id: vp.id,
            name: `Dr. ${name}`,
            specialty: specs[0] || "General Veterinarian",
            experience: `${vp.years_of_experience || 0} yrs exp.`,
            rating: vp.average_rating || 0,
            price: vp.online_fee || 500,
            image: vp.profile_photo || p.profile_photo || "",
            verified: vp.verification_status === "verified",
            isActive: vp.is_active ?? true,
            distance: Math.floor(Math.random() * 25) + 1,
            availability: Math.random() > 0.5 ? "AVAILABLE NOW" : `NEXT: ${Math.floor(Math.random() * 5) + 1} PM`
          };
        });

      setAllVets(vets);
    };

    fetchVets();

    // Set up real-time listener
    const channel = supabase
      .channel('vet_profiles_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vet_profiles' }, fetchVets)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [authReady]);

  const filteredVets = allVets.filter(vet => 
    vet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vet.specialty.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#FDF8FA] pb-10">
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
            <h1 className="text-xl font-black text-[#151B32]">All Specialized Vets</h1>
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
              placeholder="Search specialists"
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
      <div className="px-4 py-6 space-y-6">
        {filteredVets.map((doctor) => (
          <div 
            key={doctor.id} 
            onClick={() => navigate(`/vet/doctor/${doctor.id}`)} 
            className="bg-white rounded-[32px] p-5 shadow-sm border border-[#F1F1F1] cursor-pointer mb-5 hover:shadow-lg transition-all active:scale-[0.99] group"
          >
            <div className="flex items-start gap-4">
              <div className="relative">
                <div className="w-[100px] h-[100px] rounded-[24px] overflow-hidden bg-muted shadow-inner group-hover:scale-105 transition-transform">
                  {doctor.image ? (
                    <img src={doctor.image} alt={doctor.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <Stethoscope className="w-10 h-10" />
                    </div>
                  )}
                </div>
                {doctor.verified && (
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-[#4F86FF] rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                    <BadgeCheck className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-[#151B32] text-[17px] truncate">{doctor.name}</h3>
                  {doctor.rating > 0 && (
                    <div className="flex items-center gap-1 bg-[#ECFDF5] px-2 py-0.5 rounded-full border border-[#D1FAE5]">
                      <Star className="w-3 h-3 fill-[#10B981] text-[#10B981]" />
                      <span className="text-[12px] font-bold text-[#10B981]">{doctor.rating}</span>
                    </div>
                  )}
                </div>
                <p className="text-[14px] text-[#D674A3] font-bold mt-0.5 leading-tight">{doctor.specialty}</p>
                <div className="flex items-center justify-between mt-3">
                   <span className="text-[13px] font-medium text-muted-foreground">{doctor.experience}</span>
                   <div className="flex items-baseline gap-0.5">
                      <span className="text-[18px] font-black text-[#D674A3]">₹{doctor.price}</span>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">/session</span>
                   </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-5">
              <button className="flex-1 bg-gradient-to-r from-[#D674A3] to-[#FF4D6D] text-white py-4 rounded-2xl font-bold text-[14px] shadow-sm hover:opacity-90 transition-all flex items-center justify-center gap-2">
                Book Now
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); toast.info("Chat coming soon"); }}
                className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center border border-[#F1F1F1] hover:bg-muted/30 transition-colors"
              >
                <MessageCircle className="w-6 h-6 text-[#D674A3]" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AllSpecializedVets;
