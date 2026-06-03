import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useLocation as useGlobalLocation } from "@/contexts/LocationContext";
import { MapPin, Star, GraduationCap, ChevronLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

type VetRecord = {
  id: string;
  name: string;
  specialty: string;
  experience: number;
  rating: number;
  onlineFee: number;
  image: string;
  city: string; // Combined string
  verification_status: string;
  user_id: string;
};

export default function VetsNearYou() {
  const { authReady } = useAuth();
  const { city: selectedCity } = useGlobalLocation();
  const navigate = useNavigate();

  const [vets, setVets] = useState<VetRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchVets = async () => {
    try {
      console.log("Fetching approved vets (Near You)...");
      const { data: vetData, error: vetError } = await supabase
        .from("vet_profiles")
        .select(`
          id,
          user_id,
          specializations,
          years_of_experience,
          average_rating,
          online_fee,
          offline_fee,
          clinic_address,
          profile_photo,
          verification_status
        `)
        .in("verification_status", ["verified", "approved"])
        .eq("is_active", true); // explicitly check for active

      if (vetError) {
        console.error("Error fetching vets:", vetError);
        return;
      }

      if (vetData && vetData.length > 0) {
        // Find corresponding user profiles (JS Join fallback for missing FK)
        const userIds = vetData.map((v) => v.user_id).filter(Boolean);
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, name, full_name, address, city, profile_photo, is_admin_approved")
          .in("id", userIds);

        const profilesMap = new Map();
        if (profilesData) {
          profilesData.forEach((p) => profilesMap.set(p.id, p));
        }

        const parsedVets: VetRecord[] = vetData
          .filter((vp: any) => {
            const profile = profilesMap.get(vp.user_id);
            if (profile && profile.is_admin_approved === false) return false;
            return true;
          })
          .map((vp: any) => {
            const profile = profilesMap.get(vp.user_id);
            
            let photo = vp.profile_photo || profile?.profile_photo;
            if (photo && !photo.startsWith("http")) {
              photo = supabase.storage.from("vet-documents").getPublicUrl(photo).data.publicUrl;
            }

            const rawName = profile?.full_name || profile?.name || "Veterinarian";
            const specs = vp.specializations || [];
            
            // Generate a chunked search string
            const addressStr = `${vp.clinic_address || ""} ${profile?.address || ""} ${profile?.city || ""}`.trim();

            return {
              id: vp.id,
              user_id: vp.user_id,
              name: `Dr. ${rawName}`,
              specialty: specs.length > 0 ? specs[0] : "General Veterinarian",
              experience: vp.years_of_experience || 0,
              rating: vp.average_rating || 0,
              onlineFee: vp.online_fee || 0,
              image: photo || "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=800&h=1200&fit=crop",
              city: addressStr,
              verification_status: vp.verification_status,
            };
          });

        setVets(parsedVets);
      } else {
        setVets([]);
      }
    } catch (err) {
      console.error("Unexpected error fetching vets:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authReady) return;

    fetchVets();

    const handleRealtimeChange = () => {
      setTimeout(fetchVets, 300);
    };

    const channel = supabase
      .channel("realtime-vet-profiles-vats_nearby")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "vet_profiles" },
        handleRealtimeChange
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        handleRealtimeChange
      )
      .subscribe();

    const pollInterval = setInterval(fetchVets, 2000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, [authReady]);

  // Robust location matching & search query
  const filteredVets = vets.filter((vet) => {
    // 1. Filter by location
    let matchesCity = true;
    const sCity = selectedCity.trim().toLowerCase();
    
    if (sCity && sCity !== "all" && sCity !== "any") {
      const vCity = (vet.city || "").trim().toLowerCase();
      if (vCity) {
        matchesCity = vCity.includes(sCity) || sCity.includes(vCity);
      } else {
        matchesCity = false; // Strictly filtering only docs with this city
      }
    }

    // 2. Filter by search query
    let matchesSearch = true;
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      matchesSearch = vet.name.toLowerCase().includes(q) || vet.specialty.toLowerCase().includes(q);
    }

    return matchesCity && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-24">
      {/* Header */}
      <div className="bg-white px-4 pt-12 pb-4 shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-neutral-100 transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-neutral-700" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-black text-[#151B32]">Vets Near You</h1>
            {selectedCity && selectedCity.toLowerCase() !== "all" && (
              <p className="text-sm font-medium text-[#7D8494] capitalize">
                in {selectedCity}
              </p>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-4 relative">
          <Search className="w-5 h-5 text-[#8F9BB3] absolute left-4 top-1/2 -translate-y-1/2" />
          <Input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or specialty..."
            className="pl-12 bg-[#F8F9FA] border-transparent rounded-2xl h-14"
          />
        </div>
      </div>

      <div className="p-4 space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-3xl p-4 flex gap-4 h-32">
                <Skeleton className="w-[100px] h-full rounded-2xl" />
                <div className="flex-1 py-1 flex flex-col justify-between">
                  <div>
                    <Skeleton className="h-5 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredVets.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center p-8 bg-white rounded-3xl border border-neutral-100 shadow-sm mt-8">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <MapPin className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-neutral-900 mb-2">No Specialists Nearby</h3>
            <p className="text-sm text-neutral-500 max-w-[250px] mb-6">
              We couldn't find any verified specialists match your criteria right now.
            </p>
            <Button 
              onClick={() => navigate("/vet")}
              variant="outline"
              className="rounded-full px-8 py-3"
            >
              Change Location
            </Button>
          </div>
        ) : (
          filteredVets.map((doctor) => (
            <div 
              key={doctor.id}
              onClick={() => navigate(`/vet/doctor/${doctor.id}`)}
              className="bg-white rounded-3xl p-4 shadow-sm border border-neutral-100 flex gap-4 cursor-pointer hover:shadow-md transition-all active:scale-[0.99] group"
            >
              <div className="relative w-[100px] h-[100px] shrink-0">
                <img 
                  src={doctor.image} 
                  alt={doctor.name}
                  className="w-full h-full object-cover rounded-2xl"
                />
                <div className="absolute -bottom-2 -left-2 bg-white px-2 py-0.5 rounded-full shadow border border-neutral-100 flex items-center gap-1">
                  <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                  <span className="text-xs font-bold">{doctor.rating.toFixed(1)}</span>
                </div>
              </div>

              <div className="flex-1 flex flex-col justify-between min-w-0 py-1">
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-bold text-[#151B32] text-lg leading-tight truncate">{doctor.name}</h3>
                  </div>
                  <p className="text-primary font-semibold text-sm mt-0.5 truncate">{doctor.specialty}</p>
                </div>

                <div className="flex items-center gap-3 mt-2 text-[#7D8494] text-xs font-medium">
                  <span className="flex items-center gap-1 truncate">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate max-w-[120px]">{doctor.city || "Available"}</span>
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
