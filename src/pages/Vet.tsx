import { useState, useEffect } from "react";
import sruvoLogo from "@/assets/sruvo-logo.png";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { 
  Search, SlidersHorizontal, MapPin, ChevronDown, Star, 
  MessageCircle, Stethoscope, Syringe, Sparkles, Heart, ShoppingCart,
  ChevronRight, Play, BadgeCheck, X, Check, Video
} from "lucide-react";
import vetDoctorBanner from "@/assets/vet-doctor-banner.png";
import { cn } from "@/lib/utils";
import BottomNavigation from "@/components/BottomNavigation";
import HeaderProfileDropdown from "@/components/HeaderProfileDropdown";
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
  { id: "gurgaon", name: "Gurgaon", state: "Haryana" },
  { id: "mumbai", name: "Mumbai", state: "Maharashtra" },
  { id: "bangalore", name: "Bangalore", state: "Karnataka" },
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
}

const Vet = () => {
  const { authReady } = useAuth();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { city: location, setCity: setLocation, cities: locationCities } = useLocation();
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [searchCity, setSearchCity] = useState("");
  const { totalWishlistCount } = useWishlist();
  const [realVets, setRealVets] = useState<RealVet[]>([]);

  useEffect(() => {
    if (!authReady) return;
    const fetchVets = async () => {
      const { data: vetProfiles } = await supabase
        .from("vet_profiles")
        .select("id, user_id, specializations, years_of_experience, online_fee, average_rating, verification_status, is_active, profile_photo")
        .eq("verification_status", "verified")
        .eq("is_active", true);

      if (!vetProfiles || vetProfiles.length === 0) {
        setRealVets([]);
        return;
      }

      const userIds = vetProfiles.map((v) => v.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name, full_name, profile_photo")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

      const vets: RealVet[] = vetProfiles.map((vp) => {
        const profile = profileMap.get(vp.user_id);
        const name = profile?.full_name || profile?.name || "Doctor";
        const specs = vp.specializations || [];
        return {
          id: vp.id,
          name: `Dr. ${name}`,
          specialty: specs[0] || "General Veterinarian",
          experience: `${vp.years_of_experience || 0} yrs exp.`,
          rating: vp.average_rating || 0,
          price: vp.online_fee || 500,
          image: vp.profile_photo || profile?.profile_photo || "",
          verified: vp.verification_status === "verified",
          isActive: vp.is_active ?? true,
        };
      });

      setRealVets(vets);
    };

    fetchVets();
  }, [authReady]);

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
            <img src={sruvoLogo} alt="Sruvo" className="w-12 h-12 object-contain" />
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-foreground">Expert Specialties</h2>
            <button className="text-sm font-medium text-pink-500">See All</button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {specialties.slice(0, 3).map((specialty) => (
              <button
                key={specialty.id}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-2xl transition-all",
                  specialty.bgColor
                )}
              >
                <span className="text-2xl">{specialty.icon}</span>
                <span className="text-xs font-medium text-foreground">{specialty.name}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Vets Near You */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-foreground">Vets Near You</h2>
            {realVets.length > 0 && <button className="text-sm font-medium text-pink-500">See All</button>}
          </div>
          {realVets.length === 0 ? (
            <div className="bg-card rounded-2xl p-6 border border-border text-center">
              <Stethoscope className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No verified vets available yet</p>
              <p className="text-xs text-muted-foreground mt-1">Check back soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {realVets.slice(0, 4).map((vet) => (
                <div key={vet.id} onClick={() => navigate(`/vet/doctor/${vet.id}`)} className="bg-card rounded-2xl overflow-hidden shadow-sm border border-border cursor-pointer">
                  <div className="relative h-32 bg-muted">
                    {vet.image ? (
                      <img src={vet.image} alt={vet.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Stethoscope className="w-10 h-10 text-muted-foreground" />
                      </div>
                    )}
                    {vet.rating > 0 && (
                      <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs font-semibold">{vet.rating}</span>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-sm text-foreground">{vet.name}</h3>
                    <p className="text-xs text-muted-foreground">{vet.specialty} • {vet.experience}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs font-semibold text-green-500">AVAILABLE</span>
                      <span className="text-sm font-bold text-pink-500">₹{vet.price}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* All Specialized Doctors */}
        {realVets.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-lg font-bold text-foreground">All Specialized Doctors</h2>
              <span className="bg-gradient-to-r from-pink-500 to-purple-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">ELITE</span>
            </div>
            {realVets.filter(v => v.rating >= 4).map((doctor) => (
              <div key={doctor.id} onClick={() => navigate(`/vet/doctor/${doctor.id}`)} className="bg-gradient-to-br from-white to-pink-50 rounded-3xl p-5 shadow-lg border border-pink-100 cursor-pointer mb-4">
                <div className="flex items-start gap-4">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden bg-muted">
                      {doctor.image ? (
                        <img src={doctor.image} alt={doctor.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Stethoscope className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    {doctor.verified && (
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white">
                        <BadgeCheck className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-foreground">{doctor.name}</h3>
                      {doctor.rating > 0 && (
                        <div className="flex items-center gap-1 bg-green-100 px-2 py-0.5 rounded-full">
                          <Star className="w-3 h-3 fill-green-500 text-green-500" />
                          <span className="text-xs font-semibold text-green-600">{doctor.rating}</span>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-pink-500 font-medium mt-0.5">{doctor.specialty}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">{doctor.experience}</span>
                      <span className="text-lg font-bold text-pink-500">₹{doctor.price}<span className="text-xs font-normal">/session</span></span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-4">
                  <button className="flex-1 bg-gradient-to-r from-pink-500 to-pink-400 text-white py-3 rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl transition-shadow">
                    Book Now
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); toast.info("Chat with doctor coming soon"); }}
                    className="w-12 h-12 bg-white rounded-xl shadow-md flex items-center justify-center border border-pink-100 hover:bg-pink-50 transition-colors"
                  >
                    <MessageCircle className="w-5 h-5 text-pink-500" />
                  </button>
                </div>
              </div>
            ))}
          </section>
        )}

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
