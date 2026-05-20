import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { 
  ArrowLeft, MapPin, Star, Stethoscope, BadgeCheck, Search, Filter
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "@/contexts/LocationContext";

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
  if (!vetAddress) return false;
  if (!selectedCity) return true;
  
  const normalizedAddr = vetAddress.trim().toLowerCase();
  const normalizedCity = selectedCity.trim().toLowerCase();
  
  if (normalizedCity === "all" || normalizedCity === "") return true;

  // Split address by commas or spaces and try to find the city
  if (normalizedCity === "noida") {
    if (normalizedAddr.includes("greater noida")) {
      return false;
    }
    return normalizedAddr.includes("noida");
  }

  if (normalizedCity === "greater noida") {
    return normalizedAddr.includes("greater noida");
  }

  // Handle Gurugram vs Gurgaon
  if (normalizedCity === "gurgaon" || normalizedCity === "gurugram") {
    return normalizedAddr.includes("gurgaon") || normalizedAddr.includes("gurugram");
  }

  // Handle Bangalore vs Bengaluru
  if (normalizedCity === "bangalore" || normalizedCity === "bengaluru") {
    return normalizedAddr.includes("bangalore") || normalizedAddr.includes("bengaluru");
  }
  
  return normalizedAddr.includes(normalizedCity);
};

const VetsNearYou = () => {
  const navigate = useNavigate();
  const { authReady } = useAuth();
  const { city } = useLocation();
  const [allVets, setAllVets] = useState<RealVet[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // No Demo Vets anymore
  useEffect(() => {
    if (!authReady) return;

    const fetchVets = async () => {
      const { data: profilesWithVets, error: vetError } = await supabase
        .from("profiles")
        .select(`
          id,
          name,
          full_name,
          profile_photo,
          is_admin_approved,
          role,
          address,
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
        .eq("is_admin_approved", true);

      if (vetError) {
        console.error("Error fetching vets:", vetError);
        return;
      }

      let vets: RealVet[] = [];

      if (profilesWithVets && profilesWithVets.length > 0) {
        const getPublicUrl = (photo: string) => {
          if (!photo) return "";
          if (photo.startsWith("http")) return photo;
          return supabase.storage.from("vet-documents").getPublicUrl(photo).data.publicUrl;
        };

        interface VetProfileItem {
          id?: string;
          specializations?: string[];
          years_of_experience?: number;
          online_fee?: number;
          average_rating?: number | null;
          verification_status?: string;
          is_active?: boolean | null;
          profile_photo?: string | null;
          offline_fee?: number;
        }

        vets = profilesWithVets
          .filter(p => {
            const vpList = Array.isArray(p.vet_profiles) ? p.vet_profiles : [p.vet_profiles];
            const vp = vpList[0] as unknown as VetProfileItem;
            
            if (!vp || !p.is_admin_approved) return false;
            
            // Filter by city selection
            return matchCity(p.address, city);
          })
          .map((p) => {
            const vpList = Array.isArray(p.vet_profiles) ? p.vet_profiles : [p.vet_profiles];
            const vp = vpList[0] as unknown as VetProfileItem;
            const name = p.full_name || p.name || "Doctor";
            const specs = vp?.specializations || [];
            return {
              id: vp?.id || p.id,
              name: `Dr. ${name}`,
              specialty: specs[0] || "General Veterinarian",
              experience: `${vp?.years_of_experience || 0} yrs exp.`,
              rating: vp?.average_rating || 0,
              price: vp?.online_fee || 500,
              image: getPublicUrl(vp?.profile_photo || p.profile_photo || ""),
              verified: vp?.verification_status === "verified" && p.is_admin_approved,
              isActive: vp?.is_active ?? true,
              distance: Math.floor(Math.random() * 25) + 1,
              availability: Math.random() > 0.5 ? "AVAILABLE NOW" : `NEXT: ${Math.floor(Math.random() * 5) + 1} PM`
            };
          });
      }

      setAllVets(vets.sort((a, b) => (a.distance || 0) - (b.distance || 0)));
    };

    fetchVets();

    const handleRealtimeChange = () => {
      setTimeout(fetchVets, 500);
    };

    const channel = supabase
      .channel('vet_profiles_nearby')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vet_profiles' }, handleRealtimeChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, handleRealtimeChange)
      .subscribe();

    const pollInterval = setInterval(() => {
      fetchVets();
    }, 10000);

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
            <h1 className="text-xl font-black text-[#151B32]">Vets Near You</h1>
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
              placeholder="Search by name or specialty"
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
            Verified Vets
          </h2>
          <span className="text-xs font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {filteredVets.length} FOUND
          </span>
        </div>
        
        <div className="space-y-4">
          {filteredVets.map((vet) => (
            <div 
              key={vet.id}
              onClick={() => navigate(`/vet/doctor/${vet.id}`)}
              className="bg-white rounded-[28px] p-4 shadow-sm border border-[#F1F1F1] flex gap-4 active:scale-[0.98] transition-all"
            >
              <div className="relative">
                <div className="w-24 h-24 rounded-[20px] overflow-hidden bg-muted">
                  <img 
                    src={vet.image || "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&h=200&fit=crop"} 
                    alt={vet.name} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                {vet.verified && (
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white">
                    <BadgeCheck className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-[#151B32] text-base truncate">{vet.name}</h3>
                  <div className="flex items-center gap-1 bg-[#FFFBEB] px-2 py-0.5 rounded-full border border-yellow-100">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-[11px] font-bold text-yellow-700">{vet.rating}</span>
                  </div>
                </div>
                
                <p className="text-[13px] text-muted-foreground mt-0.5 font-medium">
                  {vet.specialty} • {vet.experience}
                </p>

                <div className="flex items-center gap-3 mt-3">
                    <div className="flex items-center gap-1.5 bg-green-50 px-2 py-1 rounded-lg">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-[10px] font-black text-green-600">ONLINE</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      <span className="text-[11px] font-bold">{vet.distance} km</span>
                    </div>
                </div>

                <div className="flex items-center justify-between mt-3">
                  <span className="text-[10px] font-black text-pink-500 uppercase tracking-widest bg-pink-50 px-2 py-1 rounded-md">
                    {vet.availability}
                  </span>
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-lg font-black text-[#151B32]">₹{vet.price}</span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">/session</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VetsNearYou;
