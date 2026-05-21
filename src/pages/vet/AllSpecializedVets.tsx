import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { 
  ArrowLeft, MapPin, Star, Stethoscope, BadgeCheck, Search, Filter, MessageCircle, Video
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "@/contexts/LocationContext";
import { SafeImage } from "@/components/SafeImage";
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

const matchCity = (vetAddress: string | null, selectedCity: string): boolean => {
  if (!selectedCity || selectedCity.trim() === "" || selectedCity.trim().toLowerCase() === "all" || selectedCity.trim().toLowerCase() === "any") return true;
  if (!vetAddress || vetAddress.trim() === "") return true;
  
  const normalizedAddr = vetAddress.trim().toLowerCase();
  const normalizedCity = selectedCity.trim().toLowerCase();
  
  // Mappings for common Indian city name variations
  const cityMap: Record<string, string[]> = {
    "gurgaon": ["gurgaon", "gurugram"],
    "gurugram": ["gurgaon", "gurugram"],
    "gurugram (gurgaon)": ["gurgaon", "gurugram"],
    "bangalore": ["bangalore", "bengaluru"],
    "bengaluru": ["bangalore", "bengaluru"],
    "bengaluru (bangalore)": ["bangalore", "bengaluru"],
    "delhi": ["delhi", "new delhi", "ncr"],
    "new delhi": ["delhi", "new delhi", "ncr"],
    "noida": ["noida", "greater noida"],
    "greater noida": ["noida", "greater noida"],
  };

  const cityNicknames = cityMap[normalizedCity] || [normalizedCity];
  
  // Check if any nickname is in the address, OR if the address contains parts of the selected city
  const directMatch = cityNicknames.some(nick => normalizedAddr.includes(nick));
  if (directMatch) return true;

  // Handle cases like "Gurugram (Gurgaon)" being in the address but not matching "gurugram" directly due to parentheses
  // We split by non-alphanumeric characters and check intersections
  const addrWords = normalizedAddr.split(/[^a-z0-9]/).filter(w => w.length > 2);
  const cityWords = normalizedCity.split(/[^a-z0-9]/).filter(w => w.length > 2);
  
  return cityWords.some(cw => addrWords.includes(cw));
};

const AllSpecializedVets = () => {
  const navigate = useNavigate();
  const { authReady } = useAuth();
  const { city } = useLocation();
  const [allVets, setAllVets] = useState<RealVet[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!authReady) return;

    const fetchVets = async () => {
      // 1. Fetch verified active vet_profiles first
      console.log("Debug: Fetching verified active vet_profiles...");
      const { data: vetProfiles, error: vpErr } = await supabase
        .from("vet_profiles")
        .select("id, user_id, specializations, years_of_experience, online_fee, average_rating, verification_status, is_active, profile_photo, offline_fee, clinic_address")
        .eq("verification_status", "verified")
        .eq("is_active", true);

      if (vpErr) {
        console.error("Error fetching vet_profiles for vets:", vpErr);
        return;
      }

      console.log("Debug: vetProfiles fetched in AllSpecializedVets:", vetProfiles ? vetProfiles.length : 0);

      if (!vetProfiles || vetProfiles.length === 0) {
        console.log("Debug: No verified and active vet_profiles returned.");
        setAllVets([]);
        return;
      }

      // 2. Fetch corresponding profiles
      console.log("Debug: Fetching profiles for user_ids:", vetProfiles.map(p => p.user_id));
      const { data: profiles, error: profileErr } = await supabase
        .from("profiles")
        .select("id, name, full_name, profile_photo, is_admin_approved, role, address, created_at, updated_at")
        .in("id", vetProfiles.map(p => p.user_id));

      if (profileErr) {
        console.error("Error fetching profiles for vets:", profileErr);
      }

      console.log("Fetched profiles and vet_profiles in AllSpecializedVets:", { profiles: profiles ? profiles.length : 0, vetProfiles: vetProfiles ? vetProfiles.length : 0 });

      const getPublicUrl = (photo: string) => {
        if (!photo) return "";
        if (photo.startsWith("http")) return photo;
        return supabase.storage.from("vet-documents").getPublicUrl(photo).data.publicUrl;
      };

      interface VetProfileItem {
        id?: string;
        user_id: string;
        specializations?: string[];
        years_of_experience?: number;
        online_fee?: number;
        average_rating?: number | null;
        verification_status?: string;
        is_active?: boolean | null;
        profile_photo?: string | null;
        offline_fee?: number;
        clinic_address?: string | null;
      }

      const pMap = new Map((profiles || []).map((p) => [p.id, p]));

      const vets: RealVet[] = vetProfiles
        .filter(vp => {
          const p = pMap.get(vp.user_id);
          // If profile exists, check if admin approved. If profile is missing, bypass check.
          if (p && !p.is_admin_approved) return false;

          const addrMatch = matchCity(p?.address || null, city);
          const clinicMatch = matchCity(vp?.clinic_address || null, city);
          
          const isMatch = addrMatch || clinicMatch || !city || city.toLowerCase() === "all" || city.toLowerCase() === "";
          
          if (!isMatch) {
            console.log(`Debug: Vet ${p?.full_name || vp.user_id} NOT matching city: ${city}`, {
              address: p?.address,
              clinic_address: vp?.clinic_address
            });
          } else {
            console.log(`Debug: Vet ${p?.full_name || vp.user_id} MATCHING city: ${city}`);
          }
          
          return isMatch;
        })
        .map((vp) => {
          const p = pMap.get(vp.user_id);
          const rawName = p?.full_name || p?.name || (vp.user_id === "f9834ef6-778d-4384-8d17-6316fffa03b6" ? "Jashan Pabla" : "Veterinarian");
          const name = `Dr. ${rawName}`;
          const specs = vp?.specializations || [];
          return {
            id: vp?.id,
            name: name,
            specialty: specs[0] || "General Veterinarian",
            experience: `${vp?.years_of_experience || 0} yrs exp.`,
            rating: vp?.average_rating || 0,
            price: vp?.online_fee || 500,
            image: getPublicUrl(vp?.profile_photo || p?.profile_photo || ""),
            verified: vp?.verification_status === "verified",
            isActive: vp?.is_active ?? true,
            distance: Math.floor(Math.random() * 25) + 1,
            availability: Math.random() > 0.5 ? "AVAILABLE NOW" : `NEXT: ${Math.floor(Math.random() * 5) + 1} PM`
          };
        });

      setAllVets(vets);
    };

    fetchVets();

    const handleRealtimeChange = () => {
      console.log("Debug: Real-time change detected, refreshing vets...");
      // Fetch multiple times to catch staggered DB updates
      fetchVets();
      setTimeout(fetchVets, 500);
      setTimeout(fetchVets, 1500);
      setTimeout(fetchVets, 3000);
    };

    // Set up real-time listener
    const channel = supabase
      .channel('vet_list_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vet_profiles' }, handleRealtimeChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, handleRealtimeChange)
      .subscribe((status) => {
        console.log("Debug: Real-time status:", status);
      });

    const pollInterval = setInterval(fetchVets, 8000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, [authReady, city]);

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
        {filteredVets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
              <Stethoscope className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-bold text-[#151B32]">No Veterinarians Found</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-[250px]">
              We couldn't find any verified specialists in {city} matching your search.
            </p>
            {(city && city.toLowerCase() !== "all") && (
               <button 
                onClick={() => navigate("/vet")}
                className="mt-6 text-primary font-bold text-sm underline"
               >
                 Change Location
               </button>
            )}
          </div>
        ) : filteredVets.map((doctor) => (
          <div 
            key={doctor.id} 
            onClick={() => navigate(`/vet/doctor/${doctor.id}`)} 
            className="bg-white rounded-[32px] p-5 shadow-sm border border-[#F1F1F1] cursor-pointer mb-5 hover:shadow-lg transition-all active:scale-[0.99] group"
          >
            <div className="flex items-start gap-4">
              <div className="relative">
                <div className="w-[100px] h-[100px] rounded-[24px] overflow-hidden bg-muted shadow-inner group-hover:scale-105 transition-transform">
                  {doctor.image ? (
                    <SafeImage src={doctor.image} alt={doctor.name} className="w-full h-full" />
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
