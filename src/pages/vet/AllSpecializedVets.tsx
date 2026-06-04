import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useLocation as useGlobalLocation } from "@/contexts/LocationContext";
import { MapPin, Star, GraduationCap, ChevronLeft, Award, Clock, ArrowLeft, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";

type VetRecord = {
  id: string;
  name: string;
  specialty: string;
  experience: number;
  rating: number;
  onlineFee: number;
  image: string;
  city: string; // Combined from clinic_address and profile address
  verification_status: string;
  user_id: string;
  vpCity?: string | null;
  pCity?: string | null;
  clinicAddress?: string | null;
};

export default function AllSpecializedVets() {
  const { authReady } = useAuth();
  const { city: selectedCity } = useGlobalLocation();
  const navigate = useNavigate();

  const [vets, setVets] = useState<VetRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchVets = async () => {
    try {
      console.log("Fetching approved vets...");
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
          verification_status,
          city,
          consultation_type
        `)
        .in("verification_status", ["verified", "approved"])
        .eq("is_active", true);

      if (vetError) {
        console.error("Error fetching vets:", vetError);
        return;
      }

      if (vetData && vetData.length > 0) {
        console.log(`[AllSpecializedVets] Fetched ${vetData.length} raw vet_profiles from Supabase.`, vetData);
        // Find corresponding user profiles (JS Join fallback for missing FK)
        const userIds = vetData.map((v) => v.user_id).filter(Boolean);
        const { data: profilesData, error: profErr } = await supabase
          .from("profiles")
          .select("id, name, full_name, address, city, profile_photo, is_admin_approved")
          .in("id", userIds);

        if (profErr) {
          console.error("[AllSpecializedVets] Profiles Fetch Error (Possible RLS restriction):", profErr);
        } else {
          console.log(`[AllSpecializedVets] Fetched ${profilesData?.length || 0} associated profiles.`, profilesData);
        }

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
            
            // Combine address fields string to ensure fuzzy match across everything
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
              vpCity: vp.city,
              pCity: profile?.city,
              clinicAddress: vp.clinic_address
            };
          });

        console.log("[AllSpecializedVets] Parsed Vets (Before location filter):", parsedVets);
        setVets(parsedVets);
      } else {
        console.warn("[AllSpecializedVets] No vet_profiles returned. vetData is empty.");
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
      .channel("realtime-vet-profiles-vats_specialized")
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
  }, [authReady, selectedCity]);

  // ... getDisplayLocation helper function ...
const getDisplayLocation = (clinicAddress: string | null | undefined, city: string) => {
  if (!clinicAddress || clinicAddress.toLowerCase().includes("not provided")) {
    return city || "Location not available";
  }
  
  // Split by comma
  const parts = clinicAddress.split(",").map(p => p.trim());
  
  // Pattern to identify city (usually near the end, but before PIN/State)
  const c = city || parts[parts.length - 2] || parts[parts.length - 1] || "";
  
  // Pattern to identify locality/sector
  const localityIdentifiers = ["sector", "phase", "block", "area", "locality", "colony", "extension", "enclave"];
  let locality = "";
  
  // Search from back to front but skipping city/pin
  for (let i = Math.max(0, parts.length - 2); i >= 0; i--) {
    const part = parts[i];
    const lower = part.toLowerCase();
    if (localityIdentifiers.some(id => lower.includes(id))) {
      locality = part;
      break;
    }
  }
  
  // Fallback for locality if no identifiers found (take middle part)
  if (!locality && parts.length > 2) {
    locality = parts[Math.floor(parts.length / 2)];
  } else if (!locality) {
    locality = parts[0];
  }
  
  // Clean: remove house numbers (digits + slash/hyphen at start)
  locality = locality.replace(new RegExp("^[\\d\\-/\\s,]+"), "").replace(/^[Nn]ear\s+/i, "").trim();

  if (locality && c && locality.toLowerCase() !== c.toLowerCase()) {
    // Check if locality is just a street number, if so use next part
    if (/^\d+$/.test(locality) && parts.length > 1) {
      return `${parts[1]}, ${c}`;
    }
    return `${locality}, ${c}`;
  }
  return c || locality || "Location not available";
};

const matchCity = (vpCity: string | null, pCity: string | null, clinicAddress: string | null, selectedCity: string): boolean => {
    if (!selectedCity) return false;
    const sCity = selectedCity.trim().toLowerCase();
    if (sCity === "" || sCity === "all") return true;

    if (vpCity) {
      const vc = vpCity.trim().toLowerCase();
      if (vc === sCity) return true;
      if ((sCity === "gurugram" || sCity === "gurgaon") && (vc === "gurugram" || vc === "gurgaon")) return true;
      if ((sCity === "bengaluru" || sCity === "bangalore") && (vc === "bengaluru" || vc === "bangalore")) return true;
      if (sCity === "noida" && vc === "greater noida") return false;
      if (sCity === "greater noida" && vc === "noida") return false;
      if (vc.includes(sCity) || sCity.includes(vc)) return true;
    }

    if (pCity) {
      const pc = pCity.trim().toLowerCase();
      if (pc === sCity) return true;
      if ((sCity === "gurugram" || sCity === "gurgaon") && (pc === "gurugram" || pc === "gurgaon")) return true;
      if ((sCity === "bengaluru" || sCity === "bangalore") && (pc === "bengaluru" || pc === "bangalore")) return true;
      if (sCity === "noida" && pc === "greater noida") return false;
      if (sCity === "greater noida" && pc === "noida") return false;
      if (pc.includes(sCity) || sCity.includes(pc)) return true;
    }

    if (clinicAddress) {
      const addr = clinicAddress.trim().toLowerCase();
      if (sCity === "noida") {
        if (addr.includes("greater noida")) return false;
        return addr.includes("noida");
      }
      if (sCity === "greater noida") return addr.includes("greater noida");
      if (sCity === "gurugram" || sCity === "gurgaon") return addr.includes("gurugram") || addr.includes("gurgaon");
      if (sCity === "bengaluru" || sCity === "bangalore") return addr.includes("bengaluru") || addr.includes("bangalore");
      if (addr.includes(sCity)) return true;
    }

    return false;
  };

  // Robust Fuzzy Location Filter matching substrings both ways
  const filteredVets = vets.filter((vet) => {
    const matchesCity = matchCity(vet.vpCity || null, vet.pCity || null, vet.clinicAddress || null, selectedCity);

    let matchesSearch = true;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      matchesSearch = 
        vet.name.toLowerCase().includes(q) || 
        vet.specialty.toLowerCase().includes(q) || 
        (vet.city || "").toLowerCase().includes(q);
    }

    return matchesCity && matchesSearch;
  });

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
            <h1 className="text-xl font-black text-[#151B32]">Specialized Vets</h1>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <MapPin className="w-3 h-3" />
              <span>Searching in {selectedCity && selectedCity.toLowerCase() !== "all" ? selectedCity : "All locations"}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text"
              placeholder="Search by doctor name or specialty"
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

      <div className="px-4 py-6 max-w-3xl mx-auto space-y-4">
        {!loading && (
          <div className="flex items-center justify-between mb-6 px-1">
            <h2 className="text-[17px] font-extrabold text-[#151B32] uppercase tracking-wider">
               Specialists
            </h2>
            <span className="text-xs font-bold text-muted-foreground bg-[#F1F5F9] px-2 py-0.5 rounded-full">
              {filteredVets.length} FOUND
            </span>
          </div>
        )}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-neutral-400">
            <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
            <p className="font-medium animate-pulse">Loading verified specialists...</p>
          </div>
        ) : filteredVets.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center p-8 bg-white rounded-3xl border border-neutral-100 shadow-sm mt-10">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <MapPin className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-neutral-900 mb-2">No Specialists Found</h3>
            <p className="text-neutral-500 max-w-sm">
              No vets available in this city yet.
            </p>
            <Button 
              onClick={() => navigate("/buyer/vet")}
              variant="outline"
              className="mt-6 rounded-full font-bold px-6"
            >
              Change Location
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredVets.map((vet) => (
              <div 
                key={vet.id}
                onClick={() => navigate(`/vet/doctor/${vet.id}`)}
                className="bg-white rounded-2xl p-4 shadow-sm border border-neutral-100 flex gap-4 cursor-pointer hover:shadow-md transition-shadow active:scale-[0.99]"
              >
                <div className="w-24 h-24 rounded-2xl overflow-hidden bg-neutral-100 shrink-0">
                  <img 
                    src={vet.image} 
                    alt={vet.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 flex flex-col justify-center min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-bold text-neutral-900 truncate">{vet.name}</h3>
                    {vet.rating > 0 && (
                      <div className="flex items-center gap-1 bg-amber-50 px-1.5 py-0.5 rounded-full shrink-0">
                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        <span className="text-xs font-bold text-amber-700">{vet.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1.5 text-slate-500 font-medium mt-1">
                    <MapPin className="w-4 h-4 shrink-0 text-primary" />
                    <span className="text-sm font-semibold truncate text-neutral-800">
                      {getDisplayLocation(vet.clinicAddress, vet.vpCity || vet.pCity || "")}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500 font-medium mt-2">
                    <span className="flex items-center gap-1 shrink-0">
                      <Award className="w-3.5 h-3.5" />
                      {vet.experience} Yrs Exp.
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
