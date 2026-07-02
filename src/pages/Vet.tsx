import { useState, useEffect } from "react";
import { SRUVO_LOGO_URL } from "@/constants/branding";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { 
  Search, SlidersHorizontal, MapPin, ChevronDown, Star, 
  MessageCircle, Stethoscope, Syringe, Sparkles, Heart, ShoppingCart,
  ChevronRight, Play, BadgeCheck, X, Check, Video
} from "lucide-react";
import vetDoctorBanner from "@/assets/vet-doctor-banner-BZtq7iJf.png";
import { cn } from "@/lib/utils";
import BottomNavigation from "@/components/BottomNavigation";
import HeaderProfileDropdown from "@/components/HeaderProfileDropdown";
import { SafeImage } from "@/components/SafeImage";
import { useWishlist } from "@/hooks/useWishlist";
import { useLocation } from "@/contexts/LocationContext";
import { toast } from "sonner";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const cities = [
  { id: "greater-noida", name: "Greater Noida", state: "Uttar Pradesh" },
  { id: "noida", name: "Noida", state: "Uttar Pradesh" },
  { id: "delhi", name: "Delhi", state: "Delhi" },
  { id: "gurgaon", name: "Gurugram", state: "Haryana" },
  { id: "mumbai", name: "Mumbai", state: "Maharashtra" },
  { id: "bangalore", name: "Bengaluru (Bangalore)", state: "Karnataka" },
  { id: "hyderabad", name: "Hyderabad", state: "Telangana" },
  { id: "chennai", name: "Chennai", state: "Tamil Nadu" },
  { id: "pune", name: "Pune", state: "Maharashtra" },
  { id: "kolkata", name: "Kolkata", state: "West Bengal" },
];
const petCategories = [
  { id: "dogs", name: "Dogs", image: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=100&h=100&fit=crop" },
  { id: "cats", name: "Cats", image: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=100&h=100&fit=crop" },
  { id: "birds", name: "Birds", image: "https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=100&h=100&fit=crop" },
  { id: "hamsters", name: "Hamsters", image: "https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=100&h=100&fit=crop" },
  { id: "rabbits", name: "Rabbits", image: "https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=100&h=100&fit=crop" },
  { id: "fish", name: "Fish", image: "https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?w=100&h=100&fit=crop" },
  { id: "guinea-pig", name: "Guinea Pig", image: "https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=100&h=100&fit=crop" },
  { id: "turtle", name: "Turtle", image: "https://images.unsplash.com/photo-1437622368342-7a3d73a34c8f?w=100&h=100&fit=crop" },
];

const specialties = [
  { id: "surgery", name: "Surgery", icon: "➕", bgColor: "bg-blue-100", iconColor: "text-blue-500" },
  { id: "vaccination", name: "Vaccination", icon: "💉", bgColor: "bg-pink-100", iconColor: "text-pink-500" },
  { id: "skin-care", name: "Skin Care", icon: "🌿", bgColor: "bg-green-100", iconColor: "text-green-500" },
  { id: "dental", name: "Dental", icon: "🦷", bgColor: "bg-purple-100", iconColor: "text-purple-500" },
  { id: "nutrition", name: "Nutrition", icon: "🥗", bgColor: "bg-orange-100", iconColor: "text-orange-500" },
  { id: "checkup", name: "Checkup", icon: "🩺", bgColor: "bg-teal-100", iconColor: "text-teal-500" },
];

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
  address_combined?: string;
  vpCity?: string | null;
  pCity?: string | null;
  clinicAddress?: string | null;
  user_id?: string;
  weekly_availability?: Record<string, unknown> | null;
  upcoming_slots?: string[];
  isAd?: boolean;
}

interface Clinic {
  id: string;
  name: string;
  location: string;
  doctorsCount: number;
  distance: number;
  verified: boolean;
  doctorImages?: string[];
}

const matchCity = (vpCity: string | null, pCity: string | null, clinicAddress: string | null, selectedCity: string): boolean => {
  if (!selectedCity) return false;
  const sCity = selectedCity.trim().toLowerCase();
  if (sCity === "" || sCity === "all") return true;

  // 1. Direct comparison on vpCity (from vet_profiles)
  if (vpCity) {
    const vc = vpCity.trim().toLowerCase();
    // direct exact match
    if (vc === sCity) return true;
    
    // Equivalent cities:
    // Gurugram / Gurgaon
    if ((sCity === "gurugram" || sCity === "gurgaon") && (vc === "gurugram" || vc === "gurgaon")) {
      return true;
    }
    // Bengaluru / Bangalore
    if ((sCity === "bengaluru" || sCity === "bangalore") && (vc === "bengaluru" || vc === "bangalore")) {
      return true;
    }
    // Noida / Greater Noida (Noida shouldn't match Greater Noida directly if sCity is Noida but vc is Greater Noida)
    if (sCity === "noida" && vc === "greater noida") return false;
    if (sCity === "greater noida" && vc === "noida") return false;
    
    // Fuzzy matching fallback
    if (vc.includes(sCity) || sCity.includes(vc)) {
      return true;
    }
  }

  // 2. Direct comparison on pCity (from profiles)
  if (pCity) {
    const pc = pCity.trim().toLowerCase();
    // direct exact match
    if (pc === sCity) return true;

    // Equivalent cities:
    if ((sCity === "gurugram" || sCity === "gurgaon") && (pc === "gurugram" || pc === "gurgaon")) {
      return true;
    }
    if ((sCity === "bengaluru" || sCity === "bangalore") && (pc === "bengaluru" || pc === "bangalore")) {
      return true;
    }
    if (sCity === "noida" && pc === "greater noida") return false;
    if (sCity === "greater noida" && pc === "noida") return false;

    // Fuzzy matching fallback
    if (pc.includes(sCity) || sCity.includes(pc)) {
      return true;
    }
  }

  // 3. Fallback on clinicAddress (fuzzy substring check with Noida exception)
  if (clinicAddress) {
    const addr = clinicAddress.trim().toLowerCase();
    if (sCity === "noida") {
      if (addr.includes("greater noida")) return false;
      return addr.includes("noida");
    }
    if (sCity === "greater noida") {
      return addr.includes("greater noida");
    }
    if (sCity === "gurugram" || sCity === "gurgaon") {
      return addr.includes("gurugram") || addr.includes("gurgaon");
    }
    if (sCity === "bengaluru" || sCity === "bangalore") {
      return addr.includes("bengaluru") || addr.includes("bangalore");
    }
    if (addr.includes(sCity)) return true;
  }

  return false;
};

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
    // Dual digit formatting is already handled by formatMinsToTimeL
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

const Vet = () => {
  const { authReady } = useAuth();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { city: location, setCity: setLocation, cities: locationCities } = useLocation();
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [searchCity, setSearchCity] = useState("");
  const { totalWishlistCount } = useWishlist();
  const [realVets, setRealVets] = useState<RealVet[]>([]);
  const [displayVets, setDisplayVets] = useState<RealVet[]>([]);
  const [allSpecializedVets, setAllSpecializedVets] = useState<RealVet[]>([]);

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
    }
  ];

  useEffect(() => {
    if (!authReady) return;
    const fetchVets = async () => {
      // 1. Fetch verified active vet_profiles first
      const { data: vetProfiles, error: vpErr } = await supabase
        .from("vet_profiles")
        .select("id, user_id, specializations, years_of_experience, online_fee, average_rating, verification_status, is_active, profile_photo, offline_fee, clinic_address, consultation_type, weekly_availability")
        .in("verification_status", ["verified", "approved"])
        .eq("is_active", true);

      if (vpErr) {
        console.error("Error fetching vet_profiles for vets:", vpErr);
        return;
      }

      console.log(`[Vet.tsx] Fetched ${vetProfiles?.length || 0} active & verified vet_profiles:`, vetProfiles);

      if (!vetProfiles || vetProfiles.length === 0) {
        console.warn("[Vet.tsx] No verified and active vet_profiles returned. RLS or empty table?");
        setRealVets([]);
        setDisplayVets([]);
        setAllSpecializedVets([]);
        return;
      }

      // Fetch appointments
      const { data: appointmentData, error: apptErr } = await supabase
        .from("vet_appointments")
        .select("id, vet_id, appointment_date, appointment_time, status")
        .neq("status", "cancelled");

      if (apptErr) {
        console.error("Error fetching vet_appointments for vets:", apptErr);
      }

      // 2. Fetch corresponding profiles
      const { data: profiles, error: profileErr } = await supabase
        .from("profiles")
        .select("id, name, full_name, profile_photo, is_admin_approved, role, address, city")
        .in("id", vetProfiles.map(p => p.user_id));

      if (profileErr) {
        console.error("[Vet.tsx] Error fetching profiles for vets (RLS likely blocking buyers):", profileErr);
      } else {
        console.log(`[Vet.tsx] Fetched ${profiles?.length || 0} associated profiles:`, profiles);
      }

      const { data: adsData } = await supabase
        .from("user_advertisements")
        .select("user_id")
        .eq("ad_type", "profile_promotion")
        .eq("status", "active");
        
      const promotedVetIds = new Set((adsData || []).map(ad => ad.user_id));

      const pMap = new Map((profiles || []).map((p) => [p.id, p]));

      const getPublicUrl = (photo: string) => {
        if (!photo) return "";
        if (photo.startsWith("http")) return photo;
        return supabase.storage.from("vet-documents").getPublicUrl(photo).data.publicUrl;
      };

      // Raw array of all verified vets
      const rawVetsArr: RealVet[] = vetProfiles
        .filter(vp => {
          const p = pMap.get(vp.user_id);
          // If profile exists, check if admin approved. If profile is missing, bypass check.
          if (p && p.is_admin_approved === false) return false;
          return true;
        })
        .map((vp) => {
          const p = pMap.get(vp.user_id);
          const rawName = p?.full_name || p?.name || (vp.user_id === "f9834ef6-778d-4384-8d17-6316fffa03b6" ? "Jashan Pabla" : "Veterinarian");
          const name = `Dr. ${rawName}`;
          const specs = vp?.specializations || [];
          
          const availInfo = calculateAvailabilityOfVet(vp?.weekly_availability, appointmentData || [], vp.user_id);

          return {
            id: vp?.id,
            user_id: vp?.user_id,
            name: name,
            specialty: specs[0] || "General Veterinarian",
            experience: `${vp?.years_of_experience || 0} yrs exp.`,
            rating: vp?.average_rating || 0,
            price: vp?.online_fee || 500,
            image: getPublicUrl(vp?.profile_photo || p?.profile_photo || ""),
            verified: vp?.verification_status === "verified",
            isActive: vp?.is_active ?? true,
            distance: Math.floor(Math.random() * 20) + 1,
            availability: availInfo.availabilityText,
            upcoming_slots: availInfo.upcoming_slots,
            address_combined: `${vp?.clinic_address || ""} ${p?.address || ""} ${p?.city || ""}`.trim(),
            vpCity: undefined,
            pCity: p?.city,
            clinicAddress: vp?.clinic_address,
            isAd: promotedVetIds.has(vp.user_id)
          };
        });

      // Sort by isAd (promoted first) and then normally
      rawVetsArr.sort((a, b) => {
        if (a.isAd && !b.isAd) return -1;
        if (!a.isAd && b.isAd) return 1;
        return 0; 
      });

      // Filtered by city for "Near You" and "All Specialized Vets"
      const filteredVets = rawVetsArr.filter(vet => {
        return matchCity(vet.vpCity, vet.pCity, vet.clinicAddress, location);
      });

      setRealVets(rawVetsArr);
      setDisplayVets(filteredVets);
      setAllSpecializedVets(filteredVets);
    };

    fetchVets();

    const handleRealtimeChange = () => {
      // Delay fetching slightly to allow DB sequential updates to settle
      setTimeout(fetchVets, 300);
    };

    // Real-time listener for vet profiles and profiles
    const channel = supabase
      .channel('vet_profiles_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vet_profiles' }, handleRealtimeChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, handleRealtimeChange)
      .subscribe();

    // Polling fallback gently every 20 seconds
    const pollInterval = setInterval(() => {
      fetchVets();
    }, 20000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, [authReady, location]);

  const filteredCities = locationCities.filter(city =>
    city.name.toLowerCase().includes(searchCity.toLowerCase()) ||
    city.state.toLowerCase().includes(searchCity.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header - Same as Home page with Location Selector */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <img src={SRUVO_LOGO_URL} alt="Sruvo" className="w-12 h-12 object-contain" referrerPolicy="no-referrer" />
            <div>
              <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Sruvo
              </span>
              <button 
                onClick={() => setLocationModalOpen(true)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <MapPin className="w-3 h-3" />
                <span>{location}</span>
                <ChevronDown className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Wishlist Button */}
            <button 
              className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors relative"
              onClick={() => navigate("/wishlist")}
            >
              <Heart className="w-5 h-5" />
              {totalWishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] rounded-full flex items-center justify-center">
                  {totalWishlistCount}
                </span>
              )}
            </button>
            {/* Cart Button */}
            <button 
              className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
              onClick={() => navigate("/cart")}
            >
              <ShoppingCart className="w-5 h-5" />
            </button>
            <HeaderProfileDropdown />
          </div>
        </div>
      </header>

      {/* Location Selector Modal */}
      <Dialog open={locationModalOpen} onOpenChange={setLocationModalOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="text-lg font-bold">Select Your Location</DialogTitle>
          </DialogHeader>
          <div className="p-4 space-y-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search city..."
                value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* City List */}
            <div className="max-h-64 overflow-y-auto space-y-1">
              {filteredCities.map((city) => (
                <button
                  key={city.id}
                  onClick={() => {
                    setLocation(city.name);
                    setLocationModalOpen(false);
                    setSearchCity("");
                    toast.success(`Location set to ${city.name}`);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between p-3 rounded-xl transition-colors text-left",
                    location === city.name 
                      ? "bg-pink-50 border border-pink-200" 
                      : "hover:bg-muted"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center",
                      location === city.name ? "bg-pink-100" : "bg-muted"
                    )}>
                      <MapPin className={cn(
                        "w-4 h-4",
                        location === city.name ? "text-pink-500" : "text-muted-foreground"
                      )} />
                    </div>
                    <div>
                      <p className={cn(
                        "font-medium text-sm",
                        location === city.name ? "text-pink-600" : "text-foreground"
                      )}>
                        {city.name}
                      </p>
                      <p className="text-xs text-muted-foreground">{city.state}</p>
                    </div>
                  </div>
                  {location === city.name && (
                    <Check className="w-5 h-5 text-pink-500" />
                  )}
                </button>
              ))}
              {filteredCities.length === 0 && (
                <p className="text-center text-muted-foreground text-sm py-4">
                  No cities found
                </p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="px-4 py-4 space-y-6">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search vets by specialty or clinic"
            className="w-full pl-12 pr-12 py-3 bg-muted/50 border border-border rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <button className="absolute right-4 top-1/2 -translate-y-1/2">
            <SlidersHorizontal className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Pet Categories */}
        <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
          <div className="flex gap-4">
            {petCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className="flex flex-col items-center gap-2 min-w-[60px]"
              >
                <div className={cn(
                  "w-14 h-14 rounded-full overflow-hidden border-2 transition-all",
                  selectedCategory === category.id 
                    ? "border-pink-500 ring-2 ring-pink-200" 
                    : "border-pink-200"
                )}>
                  <img 
                    src={category.image} 
                    alt={category.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className={cn(
                  "text-xs font-medium",
                  selectedCategory === category.id ? "text-pink-500" : "text-muted-foreground"
                )}>
                  {category.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Instant Video Call Banner - Split Layout */}
        <div className="rounded-[22px] overflow-hidden flex min-h-[130px]" style={{ maxHeight: '150px' }}>
          {/* Left Section - Pastel Pink */}
          <div className="flex-1 flex flex-col justify-center px-4 py-3" style={{ backgroundColor: '#FDE7EC' }}>
            <p className="text-[10px] font-bold tracking-widest uppercase mb-0.5" style={{ color: '#FF4D6D' }}>
              AVAILABLE NOW
            </p>
            <h3 className="text-lg font-bold text-foreground leading-tight mb-0.5">
              Instant Video Call
            </h3>
            <p className="text-xs text-muted-foreground mb-2">
              Medical advice in 60 seconds
            </p>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => navigate("/vet/consultation-plan")}
                className="bg-white px-4 py-2 rounded-full text-xs font-bold shadow-md hover:shadow-lg transition-all"
                style={{ color: '#FF4D6D' }}
              >
                Call Now
              </button>
              <button className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#FFD6DE' }}>
                <Play className="w-3.5 h-3.5 fill-current" style={{ color: '#FF4D6D' }} />
              </button>
            </div>
          </div>
          {/* Right Section - Teal with Doctor */}
          <div className="w-[42%] relative" style={{ backgroundColor: '#6FB7B1' }}>
            <img 
              src={vetDoctorBanner}
              alt="Doctor"
              className="w-full h-full object-cover object-top"
              loading="eager"
            />
          </div>
        </div>

        {/* Smart Match Card */}
        <div 
          onClick={() => navigate("/buyer/care-match")}
          className="bg-card rounded-[18px] px-3 py-2.5 shadow-md border border-border flex items-center gap-2.5 cursor-pointer hover:shadow-lg transition-shadow"
        >
          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#F2EAFE' }}>
            <Sparkles className="w-4 h-4" style={{ color: '#8B5CF6' }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[9px] font-bold tracking-widest uppercase leading-none mb-0.5" style={{ color: '#8B5CF6' }}>
              SMART MATCH
            </p>
            <h4 className="font-bold text-foreground text-xs leading-snug">Not sure which vet to choose?</h4>
            <p className="text-[11px] text-muted-foreground leading-tight">Let our AI find the perfect specialist</p>
          </div>
          <button className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#1F2937' }}>
            <ChevronRight className="w-3.5 h-3.5 text-white" />
          </button>
        </div>

        {/* Expert Specialties */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[19px] font-extrabold text-[#151B32] tracking-tight">Expert Specialties</h2>
            <button className="text-[16px] font-medium text-[#D674A3] hover:opacity-80 transition-opacity">
              See All
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-4 pt-1 -mx-4 px-4 scrollbar-hide snap-x">
            {specialties.map((specialty) => (
              <button
                key={specialty.id}
                className={cn(
                  "flex flex-col items-center justify-center gap-1.5 py-2.5 px-8 min-w-[150px] rounded-[28px] shadow-sm border border-transparent hover:border-black/5 transition-all group snap-center",
                  specialty.bgColor
                )}
              >
                <div className="w-12 h-12 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                  {specialty.icon}
                </div>
                <span className="text-[13px] font-bold text-[#151B32]">{specialty.name}</span>
              </button>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[19px] font-extrabold text-[#151B32] tracking-tight">Vets Near You</h2>
            <button 
              onClick={() => navigate("/vet/near-you")}
              className="text-[16px] font-medium text-[#D674A3] hover:opacity-80 transition-opacity"
            >
              See All
            </button>
          </div>
          {displayVets.length === 0 ? (
            <div className="bg-card rounded-2xl p-6 border border-border text-center">
              <Stethoscope className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground font-semibold">No vets available in this city yet.</p>
              <p className="text-xs text-muted-foreground mt-1">Please try choosing another city or search again!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {[...displayVets]
                .sort((a, b) => {
                  if (a.isAd && !b.isAd) return -1;
                  if (!a.isAd && b.isAd) return 1;
                  return (a.distance || 0) - (b.distance || 0);
                })
                .slice(0, 2)
                .map((vet) => (
                <div 
                  key={vet.id} 
                  onClick={() => navigate(`/vet/doctor/${vet.id}`)} 
                  className="bg-white rounded-[28px] overflow-hidden shadow-sm border border-[#F1F1F1] cursor-pointer hover:shadow-md transition-all active:scale-[0.98] flex flex-col"
                >
                  <div className="relative h-40 bg-muted">
                    {vet.image ? (
                      <img src={vet.image} alt={vet.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Stethoscope className="w-10 h-10 text-muted-foreground" />
                      </div>
                    )}
                    {vet.isAd && (
                      <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-[10px] font-extrabold px-2 py-0.5 rounded-bl-lg shadow-sm uppercase tracking-wider z-10">
                        Ad
                      </div>
                    )}
                    {vet.rating > 0 && (
                      <div className="absolute top-2.5 left-2.5 bg-white px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                        <Star className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />
                        <span className="text-[11px] font-bold text-[#151B32]">{vet.rating}</span>
                      </div>
                    )}
                  </div>
                  <div className="p-3.5 flex flex-col flex-1">
                    <h3 className="font-bold text-[15px] text-[#151B32] line-clamp-1">{vet.name}</h3>
                    <p className="text-[13px] text-muted-foreground mt-0.5 line-clamp-1">
                      {getDisplayLocation(vet.clinicAddress, vet.vpCity || vet.pCity || "")} • {vet.experience}
                    </p>
                    <div className="flex items-center justify-between mt-auto pt-3">
                      <AlternatingAvailability availability={vet.availability} upcomingSlots={vet.upcoming_slots} />
                      <span className="text-[16px] font-black text-[#D674A3]">₹{vet.price}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Verified Clinic Nearby */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-[19px] font-extrabold text-[#151B32] tracking-tight whitespace-nowrap">Verified Clinics Nearby</h2>
              <span className="bg-[#EEF2FF] text-[#4F46E5] text-[11px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">18 found</span>
            </div>
            <button 
              onClick={() => navigate("/vet/clinics-nearby")}
              className="text-[16px] font-medium text-[#D674A3] hover:opacity-80 transition-opacity"
            >
              See All
            </button>
          </div>
          
          <div className="space-y-4">
            {DEMO_CLINICS.filter(c => c.distance <= 10).slice(0, 2).map((clinic) => (
              <div 
                key={clinic.id} 
                onClick={() => navigate(`/vet/clinic/${clinic.id}`)}
                className="bg-white rounded-[28px] p-4 flex items-center gap-4 shadow-sm border border-[#F1F1F1] active:scale-[0.98] transition-all cursor-pointer group"
              >
                {/* Clinic Icon Box */}
                <div className="w-[60px] h-[60px] rounded-[18px] bg-[#FFF0F5] flex items-center justify-center shrink-0">
                  <Stethoscope className="w-7 h-7 text-[#D674A3]" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-bold text-[17px] text-[#151B32] truncate">{clinic.name}</h3>
                    {clinic.verified && (
                      <div className="flex items-center gap-1 bg-[#ECFDF5] px-2 py-0.5 rounded-full border border-[#D1FAE5]">
                        <BadgeCheck className="w-3 h-3 text-[#10B981]" />
                        <span className="text-[9px] font-black text-[#10B981] uppercase tracking-wider">VERIFIED</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1 text-muted-foreground mt-0.5">
                    <MapPin className="w-3 h-3" />
                    <span className="text-[13px] font-medium truncate">{clinic.location}</span>
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
                    <span className="text-[12px] font-bold text-[#A1A1A1]">+{clinic.doctorsCount} Doctors</span>
                  </div>
                </div>
                
                <ChevronRight className="w-5 h-5 text-[#A1A1A1] group-hover:translate-x-1 transition-transform" />
              </div>
            ))}
          </div>
        </section>

        {/* All Specialized Vets */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[19px] font-extrabold text-[#151B32] tracking-tight">All Specialized Vets</h2>
            <button 
              onClick={() => navigate("/vet/all-specialists")}
              className="text-[16px] font-medium text-[#D674A3] hover:opacity-80 transition-opacity"
            >
              See All
            </button>
          </div>
          {allSpecializedVets.length === 0 ? (
            <div className="bg-card rounded-2xl p-6 border border-border text-center">
              <p className="text-sm text-muted-foreground font-semibold">No vets available in this city yet.</p>
            </div>
          ) : (
            allSpecializedVets.slice(0, 4).map((doctor) => (
              <div 
                key={doctor.id} 
                onClick={() => navigate(`/vet/doctor/${doctor.id}`)} 
                className="bg-white rounded-[32px] p-5 shadow-sm border border-[#F1F1F1] cursor-pointer mb-5 hover:shadow-md transition-all active:scale-[0.99] group"
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
                      <VerifiedBadge className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white border-2 border-white shadow-sm" />
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
                    <p className="text-[14px] text-muted-foreground font-semibold mt-0.5 leading-tight flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 shrink-0 text-[#D674A3]" />
                      <span>{getDisplayLocation(doctor.clinicAddress, doctor.vpCity || doctor.pCity || "")}</span>
                    </p>
                    <div className="flex items-center justify-between mt-3">
                       <span className="text-[13px] font-medium text-muted-foreground">{doctor.experience}</span>
                       <div className="flex items-baseline gap-0.5">
                          <span className="text-[16px] font-black text-[#D674A3]">₹{doctor.price}</span>
                          <span className="text-[10px] font-bold text-muted-foreground uppercase">/session</span>
                       </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-5">
                  <button className="flex-1 bg-gradient-to-r from-[#D674A3] to-[#FF4D6D] text-white py-4 rounded-2xl font-bold text-[14px] shadow-sm hover:opacity-90 transition-all">
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
            ))
          )}
        </section>

        {/* Vet's Daily Tip */}
        <section className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-3xl p-5 border border-pink-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-pink-500" />
            </div>
            <h3 className="font-bold text-foreground">Vet's Daily Tip</h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Hydration is key! Always ensure your pet has access to fresh water, especially during summer months in India. Adding ice cubes to their bowl can make drinking more fun.
          </p>
        </section>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default Vet;
