import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useLocation as useGlobalLocation } from "@/contexts/LocationContext";
import { MapPin, Star, GraduationCap, ChevronLeft, Search, ArrowLeft, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

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
  vpCity?: string | null;
  pCity?: string | null;
  clinicAddress?: string | null;
  weekly_availability?: unknown;
  availability?: string;
  upcoming_slots?: string[];
};

interface VetProfileDB {
  id: string;
  user_id: string;
  specializations: string[] | null;
  years_of_experience: number;
  online_fee: number;
  average_rating: number;
  profile_photo: string | null;
  verification_status: string;
  city: string | null;
  consultation_type: string | null;
  weekly_availability: unknown;
  clinic_address: string | null;
}

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
          verification_status,
          city,
          consultation_type,
          weekly_availability
        `)
        .in("verification_status", ["verified", "approved"])
        .eq("is_active", true); // explicitly check for active

      if (vetError) {
        console.error("Error fetching vets:", vetError);
        return;
      }

      const { data: appointmentData } = await supabase
        .from("vet_appointments")
        .select("id, vet_id, appointment_date, appointment_time, status")
        .neq("status", "cancelled");

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

        const parsedVets: VetRecord[] = (vetData as unknown as VetProfileDB[])
          .filter((vp: VetProfileDB) => {
            const profile = profilesMap.get(vp.user_id);
            if (profile && profile.is_admin_approved === false) return false;
            return true;
          })
          .map((vp: VetProfileDB) => {
            const profile = profilesMap.get(vp.user_id);
            
            let photo = vp.profile_photo || profile?.profile_photo;
            if (photo && !photo.startsWith("http")) {
              photo = supabase.storage.from("vet-documents").getPublicUrl(photo).data.publicUrl;
            }

            const rawName = profile?.full_name || profile?.name || "Veterinarian";
            const specs = vp.specializations || [];
            
            // Generate a chunked search string
            const addressStr = `${vp.clinic_address || ""} ${profile?.address || ""} ${profile?.city || ""}`.trim();

            const availInfo = calculateAvailabilityOfVet(vp.weekly_availability, appointmentData || [], vp.user_id);

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
              clinicAddress: vp.clinic_address,
              weekly_availability: vp.weekly_availability,
              availability: availInfo.availabilityText,
              upcoming_slots: availInfo.upcoming_slots
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

    const pollInterval = setInterval(fetchVets, 20000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, [authReady, selectedCity]);

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

  // Robust location matching & search query
  const filteredVets = vets.filter((vet) => {
    // 1. Filter by location
    const matchesCity = matchCity(vet.vpCity || null, vet.pCity || null, vet.clinicAddress || null, selectedCity);

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
              <span>Searching in {selectedCity && selectedCity.toLowerCase() !== "all" ? selectedCity : "All locations"}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text"
              placeholder="Search by name or specialty..."
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
            <h3 className="text-xl font-bold text-neutral-900 mb-2">No Specialists Found</h3>
            <p className="text-sm text-neutral-500 max-w-[250px] mb-6">
              No vets available in this city yet.
            </p>
            <Button 
              onClick={() => navigate("/buyer/vet")}
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
                  <p className="text-muted-foreground font-semibold text-sm mt-1 flex items-center gap-1">
                    <MapPin className="w-4 h-4 shrink-0 text-[#D674A3]" />
                    <span className="truncate">
                      {getDisplayLocation(doctor.clinicAddress, doctor.vpCity || doctor.pCity || "")}
                    </span>
                  </p>
                </div>

                <div className="mt-2 text-xs font-medium">
                  <div className="mb-1">
                    <AlternatingAvailability availability={doctor.availability} upcomingSlots={doctor.upcoming_slots} />
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

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

const calculateAvailabilityOfVet = (
  weeklyAvailability: unknown,
  appointmentsData: Record<string, unknown>[],
  vetUserId: string
) => {
  const now = new Date();
  const currentMins = now.getHours() * 60 + now.getMinutes();

  // Parse time helper
  const parseTimeToMinsL = (str: string) => {
    const clean = str.trim().toUpperCase();
    const match = clean.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/);
    if (!match) return 0;
    let hours = Number(match[1]);
    const minutes = match[2] ? Number(match[2]) : 0;
    const modifier = match[3];
    if (modifier === "PM" && hours !== 12) hours += 12;
    if (modifier === "AM" && hours === 12) hours = 0;
    return hours * 60 + minutes;
  };

  const formatMinsToTimeL = (mins: number) => {
    let h = Math.floor(mins / 60);
    const m = mins % 60;
    const modifier = h >= 12 ? "PM" : "AM";
    h = h % 12;
    if (h === 0) h = 12;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")} ${modifier}`;
  };

  // Extract raw slots
  const getSlotsForDateL = (date: Date, availObj: unknown) => {
    if (!availObj) return [];
    let parsedAvail = availObj;
    if (typeof parsedAvail === "string") {
      try {
        parsedAvail = JSON.parse(parsedAvail);
      } catch {
        return [];
      }
    }
    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dayName = daysOfWeek[date.getDay()];
    const dayData = (parsedAvail as Record<string, unknown>)?.[dayName] as Record<string, unknown> | undefined;
    if (!dayData) return [];

    const results: string[] = [];
    const periods = ["morning", "afternoon", "evening", "night"] as const;
    periods.forEach(p => {
      const period = dayData[p] as { enabled?: boolean; slots?: (string | { time?: string })[] } | undefined;
      if (period && period.enabled && period.slots) {
        period.slots.forEach((s) => {
          if (!s) return;
          const timeValue = typeof s === "string" ? s : s.time;
          if (!timeValue) return;
          const parts = timeValue.split(/\s*(?:–|—|-)\s*/);
          if (parts.length === 2) {
            let start = parseTimeToMinsL(parts[0]);
            const end = parseTimeToMinsL(parts[1]);
            while (start < end) {
              results.push(formatMinsToTimeL(start));
              start += 30;
            }
          } else {
            const mins = parseTimeToMinsL(timeValue);
            results.push(formatMinsToTimeL(mins));
          }
        });
      }
    });

    const seen = new Set<string>();
    const unique: string[] = [];
    results.forEach(s => {
      if (!seen.has(s)) {
        seen.add(s);
        unique.push(s);
      }
    });
    return unique.sort((a, b) => parseTimeToMinsL(a) - parseTimeToMinsL(b));
  };

  // Group doctor's specific non-cancelled appointments
  const bookedSlots = new Set<string>();
  (appointmentsData || []).forEach(app => {
    if (app.vet_id === vetUserId && app.status !== "cancelled" && app.appointment_date && app.appointment_time) {
      const dStr = app.appointment_date.split('T')[0];
      const mins = parseTimeToMinsL(app.appointment_time);
      const normalizedTime = formatMinsToTimeL(mins);
      bookedSlots.add(`${dStr}_${normalizedTime}`);
    }
  });

  const formatDateStr = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const upcomingSlots: { dateStr: string; time: string; mins: number }[] = [];
  const daysToCheck = 4;

  for (let i = 0; i < daysToCheck; i++) {
    const targetDate = new Date();
    targetDate.setDate(now.getDate() + i);
    const dStr = formatDateStr(targetDate);
    const slots = getSlotsForDateL(targetDate, weeklyAvailability);

    slots.forEach(slot => {
      const slotKey = `${dStr}_${slot}`;
      if (bookedSlots.has(slotKey)) {
        return; // Exclude booked
      }

      const slotMins = parseTimeToMinsL(slot);
      if (i === 0 && slotMins <= currentMins) {
        return; // Exclude past today
      }

      upcomingSlots.push({
        dateStr: dStr,
        time: slot,
        mins: slotMins,
      });
    });
  }

  // Determine availability
  let isAvailableNow = false;
  let nextAvailableText = "";

  if (upcomingSlots.length > 0) {
    const firstSlot = upcomingSlots[0];
    const firstSlotDate = firstSlot.dateStr;
    const todayStr = formatDateStr(now);

    if (firstSlotDate === todayStr) {
      // If there's an unbooked slot starting within the next 30 mins
      const diff = firstSlot.mins - currentMins;
      if (diff > 0 && diff <= 30) {
        isAvailableNow = true;
      }
    }
  }

  // Get Next Slot Text
  if (upcomingSlots.length > 0) {
    nextAvailableText = `NEXT: ${upcomingSlots[0].time}`;
  } else {
    nextAvailableText = "No Slots Available";
  }

  return {
    isAvailableNow,
    availabilityText: isAvailableNow ? "AVAILABLE NOW" : nextAvailableText,
    upcoming_slots: upcomingSlots.map(s => s.time).slice(0, 4), // Next 4 slots formatted cleanly in 12-hour format e.g. "04:00 PM"
  };
};

const AlternatingAvailability = ({ 
  availability, 
  upcomingSlots 
}: { 
  availability?: string; 
  upcomingSlots?: string[]; 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const displaySequence: { text: string; success: boolean }[] = [];

  if (availability?.includes("AVAILABLE")) {
    displaySequence.push({ text: "AVAILABLE NOW", success: true });
  }

  if (upcomingSlots && upcomingSlots.length > 0) {
    upcomingSlots.slice(0, 4).forEach((slot) => {
      displaySequence.push({ text: `NEXT: ${slot}`, success: false });
    });
  } else if (!availability?.includes("AVAILABLE")) {
     displaySequence.push({ text: availability || "NO SLOTS", success: false });
  }

  useEffect(() => {
    if (displaySequence.length <= 1) {
      return;
    }

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % displaySequence.length);
    }, 1500);

    return () => clearInterval(interval);
  }, [displaySequence.length]);

  if (displaySequence.length === 0) return null;

  const currentItem = displaySequence[currentIndex % displaySequence.length] || displaySequence[0];

  return (
    <span
      className={cn(
        "text-[10px] font-black uppercase tracking-wider transition-opacity duration-300",
        currentItem.success ? "text-[#34D399]" : "text-amber-500"
      )}
    >
      {currentItem.text}
    </span>
  );
};
