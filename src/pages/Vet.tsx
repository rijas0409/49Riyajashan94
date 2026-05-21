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
  { id: "gurgaon", name: "Gurugram (Gurgaon)", state: "Haryana" },
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

const matchCity = (vetAddress: string | null, selectedCity: string): boolean => {
  if (!selectedCity) return true;
  const normalizedCity = selectedCity.trim().toLowerCase();
  if (normalizedCity === "all" || normalizedCity === "") return true;

  if (!vetAddress || vetAddress.trim() === "") return true;
  
  const normalizedAddr = vetAddress.trim().toLowerCase();
  
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
  if (normalizedCity.includes("gurgaon") || normalizedCity.includes("gurugram")) {
    return normalizedAddr.includes("gurgaon") || normalizedAddr.includes("gurugram");
  }

  // Handle Bangalore vs Bengaluru
  if (normalizedCity.includes("bangalore") || normalizedCity.includes("bengaluru")) {
    return normalizedAddr.includes("bangalore") || normalizedAddr.includes("bengaluru");
  }
  
  return normalizedAddr.includes(normalizedCity);
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
        .select("id, user_id, specializations, years_of_experience, online_fee, average_rating, verification_status, is_active, profile_photo, offline_fee, clinic_address")
        .eq("verification_status", "verified")
        .eq("is_active", true);

      if (vpErr) {
        console.error("Error fetching vet_profiles for vets:", vpErr);
        return;
      }

      console.log("Debug: vetProfiles fetched in Vet:", vetProfiles);

      if (!vetProfiles || vetProfiles.length === 0) {
        console.log("Debug: No verified and active vet_profiles returned in Vet.");
        setRealVets([]);
        setDisplayVets([]);
        return;
      }

      // 2. Fetch corresponding profiles
      const { data: profiles, error: profileErr } = await supabase
        .from("profiles")
        .select("id, name, full_name, profile_photo, is_admin_approved, role, address")
        .in("id", vetProfiles.map(p => p.user_id));

      if (profileErr) {
        console.error("Error fetching profiles for vets:", profileErr);
      }

      console.log("Fetched profiles and vet_profiles in Vet:", { profiles, vetProfiles });

      let vetsArr: RealVet[] = [];

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

      vetsArr = vetProfiles
        .filter(vp => {
          const p = pMap.get(vp.user_id);
          // If profile exists, check if admin approved. If profile is missing, bypass check.
          if (p && !p.is_admin_approved) return false;

          const addrMatch = matchCity(p?.address || null, location);
          const clinicMatch = matchCity(vp?.clinic_address || null, location);
          
          return addrMatch || clinicMatch || !location || location.toLowerCase() === "all" || location.toLowerCase() === "";
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
            distance: Math.floor(Math.random() * 20) + 1,
            availability: Math.random() > 0.5 ? "AVAILABLE NOW" : `NEXT: ${Math.floor(Math.random() * 5) + 1} PM`
          };
        });

      setRealVets(vetsArr);
      setDisplayVets(vetsArr);
    };

    fetchVets();

    const handleRealtimeChange = () => {
      // Delay fetching slightly to allow DB sequential updates to settle
      setTimeout(fetchVets, 500);
    };

    // Real-time listener for vet profiles and profiles
    const channel = supabase
      .channel('vet_profiles_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vet_profiles' }, handleRealtimeChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, handleRealtimeChange)
      .subscribe();

    // Polling fallback every 10 seconds just in case Realtime isn't configured for these tables
    const pollInterval = setInterval(() => {
      fetchVets();
    }, 10000);

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
          onClick={() => navigate("/vet/ai-assistant")}
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
              <p className="text-sm text-muted-foreground">No verified vets available yet</p>
              <p className="text-xs text-muted-foreground mt-1">Check back soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {[...displayVets]
                .sort((a, b) => (a.distance || 0) - (b.distance || 0))
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
                      {vet.specialty} • {vet.experience}
                    </p>
                    <div className="flex items-center justify-between mt-auto pt-3">
                      <span className={cn(
                        "text-[10px] font-black uppercase tracking-wider",
                        vet.availability?.includes("AVAILABLE") ? "text-[#34D399]" : "text-muted-foreground"
                      )}>
                        {vet.availability}
                      </span>
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
          {displayVets.length === 0 ? (
            <div className="bg-card rounded-2xl p-6 border border-border text-center">
              <p className="text-sm text-muted-foreground">No specialized vets available yet</p>
            </div>
          ) : (
            displayVets.slice(0, 4).map((doctor) => (
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
