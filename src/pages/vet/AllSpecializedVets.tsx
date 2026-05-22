import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";
import { MapPin, Star, GraduationCap, ChevronLeft, Award, Clock } from "lucide-react";
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
};

export default function AllSpecializedVets() {
  const { authReady } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  // Safe extraction
  const selectedCity = (location.state?.city as string) || (location.state as any)?.location || "";

  const [vets, setVets] = useState<VetRecord[]>([]);
  const [loading, setLoading] = useState(true);

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
          verification_status
        `)
        .in("verification_status", ["verified", "approved"])
        .eq("is_active", true);

      if (vetError) {
        console.error("Error fetching vets:", vetError);
        return;
      }

      if (vetData && vetData.length > 0) {
        // Find corresponding user profiles (JS Join fallback for missing FK)
        const userIds = vetData.map((v) => v.user_id).filter(Boolean);
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, name, full_name, address, city, profile_photo")
          .in("id", userIds);

        const profilesMap = new Map();
        if (profilesData) {
          profilesData.forEach((p) => profilesMap.set(p.id, p));
        }

        const parsedVets: VetRecord[] = vetData.map((vp: any) => {
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

    const channel = supabase
      .channel("realtime-vet-profiles-vats_specialized")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "vet_profiles" },
        (payload) => {
          console.log("Realtime event on vet_profiles (AllSpecs):", payload);
          fetchVets();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [authReady]);

  // Robust Fuzzy Location Filter matching substrings both ways
  const filteredVets = vets.filter((vet) => {
    const sCity = selectedCity.trim().toLowerCase();
    if (!sCity || sCity === "all" || sCity === "any") return true;

    const vCity = (vet.city || "").trim().toLowerCase();
    
    // If city is completely empty/unknown, decide if we want to show it. For now, let's show it so they aren't hidden by default
    if (!vCity) return true;

    // The core requested fuzzy matching capability
    return vCity.includes(sCity) || sCity.includes(vCity);
  });

  return (
    <div className="min-h-screen bg-neutral-50 pb-20">
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
            <h1 className="text-xl font-bold text-neutral-900">Specialized Vets</h1>
            {selectedCity && selectedCity.toLowerCase() !== "all" && (
              <p className="text-sm text-neutral-500 font-medium capitalize flex items-center gap-1 mt-1">
                <MapPin className="w-3.5 h-3.5" />
                {selectedCity}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 max-w-3xl mx-auto space-y-4">
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
              We couldn't find any specialized vets in <span className="font-semibold capitalize text-neutral-700">{selectedCity}</span> right now.
            </p>
            <Button 
              onClick={() => navigate("/vet")}
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
                onClick={() => navigate(`/vet/${vet.id}`)}
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
                  
                  <div className="flex items-center gap-1.5 text-primary mt-1">
                    <GraduationCap className="w-4 h-4 shrink-0" />
                    <span className="text-sm font-semibold truncate">{vet.specialty}</span>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500 font-medium mt-2">
                    <span className="flex items-center gap-1 shrink-0">
                      <Award className="w-3.5 h-3.5" />
                      {vet.experience} Yrs Exp.
                    </span>
                    <span className="flex items-center gap-1 truncate max-w-[120px]">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{vet.city || "Available"}</span>
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
