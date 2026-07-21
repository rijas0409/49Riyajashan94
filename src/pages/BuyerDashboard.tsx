/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useCallback, useMemo } from "react";
import { MOCK_PETS, MOCK_BREEDERS } from "@/constants/mockData";
import { SRUVO_LOGO_URL } from "@/constants/branding";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "@/contexts/LocationContext";
import { Heart, Search, ShoppingCart, MapPin, ShieldCheck, SlidersHorizontal, Plus, ChevronRight, Star, ChevronDown, Check, X } from "lucide-react";
import { toast } from "sonner";
import BottomNavigation from "@/components/BottomNavigation";
import HeaderProfileDropdown from "@/components/HeaderProfileDropdown";
import PetCard from "@/components/PetCard";
import { useWishlist } from "@/hooks/useWishlist";
import { useCart } from "@/contexts/CartContext";
import { InlineBanners } from "@/components/DynamicBannerRenderer";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import SplashScreen from "@/components/SplashScreen";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// ─── Banner Carousel ───
const FALLBACK_BANNERS = [
  {
    gradient: "linear-gradient(135deg, #e8a0bf, #b88cc4, #9b7dd4)",
    title: "Verified\nGolden Puppies",
    subtitle: "KCI Registered & Health Certified",
    cta: "View Collection",
    badge: "PREMIUM",
    image: "https://images.unsplash.com/photo-1601979031925-424e53b6caaa?w=400",
  },
  {
    gradient: "linear-gradient(135deg, #0ea5e9, #6366f1, #8b5cf6)",
    title: "Exotic\nPersian Cats",
    subtitle: "Purebred & Vaccinated",
    cta: "Explore Now",
    badge: "NEW",
    image: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400",
  },
  {
    gradient: "linear-gradient(135deg, #f59e0b, #ef4444, #ec4899)",
    title: "Rare Bird\nCollection",
    subtitle: "Hand-raised & Tamed",
    cta: "Browse",
    badge: "HOT",
    image: "https://images.unsplash.com/photo-1452570053594-1b985d6ea890?w=400",
  },
];

const normalizeLocationText = (value?: string | null) =>
  (value || "")
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const matchesSelectedCity = (pet: any, selectedCity: string) => {
  const selected = normalizeLocationText(selectedCity);
  if (!selected) return true;

  const haystack = [pet.city, pet.location, pet.state]
    .map(normalizeLocationText)
    .filter(Boolean)
    .join(" ");

  return haystack.includes(selected);
};

const mergeOwnerProfiles = async (ownerIds: string[]) => {
  const ownersMap: Record<string, any> = {};
  if (ownerIds.length === 0) return ownersMap;

  const { data: owners, error } = await supabase
    .from("profiles")
    .select("id, name, rating, profile_photo, is_breeder_verified")
    .in("id", ownerIds);

  if (!error) {
    (owners || []).forEach((owner: any) => {
      ownersMap[owner.id] = owner;
    });
  }

  const missingOwnerIds = ownerIds.filter((ownerId) => !ownersMap[ownerId]);
  if (missingOwnerIds.length === 0) return ownersMap;

  const sellerResults = await Promise.all(
    missingOwnerIds.map(async (ownerId) => {
      const { data } = await supabase.rpc("get_public_seller_info", { _seller_id: ownerId });
      return data?.[0] || null;
    })
  );

  sellerResults.forEach((seller) => {
    if (seller?.id) {
      ownersMap[seller.id] = seller;
    }
  });

  return ownersMap;
};

const HeroBannerCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [slides, setSlides] = useState<any[]>([]);
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true },
    [Autoplay({ delay: 4000, stopOnInteraction: false })]
  );

  useEffect(() => {
    const fetchBanners = async () => {
      const { data } = await supabase
        .from("banners")
        .select("*")
        .eq("location", "buyer_home")
        .eq("is_active", true)
        .order("position");
      if (data && data.length > 0) {
        setSlides(data.map((b: any) => ({
          gradient: b.gradient || FALLBACK_BANNERS[0].gradient,
          title: b.title,
          subtitle: b.subtitle,
          cta: b.cta_text || "View",
          badge: "PREMIUM",
          image: b.image_url,
        })));
      } else {
        setSlides(FALLBACK_BANNERS);
      }
    };
    fetchBanners();
  }, []);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCurrentIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    onSelect();
  }, [emblaApi, onSelect]);

  if (slides.length === 0) return null;

  return (
    <div>
      <div className="relative overflow-hidden rounded-2xl" ref={emblaRef}>
        <div className="flex">
          {slides.map((slide, index) => (
            <div key={index} className="flex-[0_0_100%] min-w-0">
              <div className="relative rounded-2xl overflow-hidden h-44" style={{ background: slide.gradient }}>
                <div className="flex items-center h-full">
                  <div className="flex-1 p-5 z-10">
                    {slide.badge && (
                      <span className="inline-block text-[10px] font-bold text-white bg-white/20 backdrop-blur-sm px-2.5 py-0.5 rounded-full mb-2">
                        {slide.badge}
                      </span>
                    )}
                    <h3 className="text-white text-xl font-bold leading-tight whitespace-pre-line">{slide.title}</h3>
                    <p className="text-white/80 text-xs mt-1">{slide.subtitle}</p>
                    <button className="mt-3 bg-white text-foreground text-xs font-semibold px-4 py-1.5 rounded-full hover:bg-white/90 transition-colors">
                      {slide.cta}
                    </button>
                  </div>
                  {slide.image && (
                    <div className="w-40 h-full flex-shrink-0">
                      <img src={slide.image} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-center gap-1.5 mt-2.5">
        {slides.map((_, index) => (
          <button key={index} onClick={() => emblaApi?.scrollTo(index)}
            className={`h-1.5 rounded-full transition-all ${index === currentIndex ? "w-5 bg-primary" : "w-1.5 bg-muted-foreground/30"}`} />
        ))}
      </div>
    </div>
  );
};

// ─── Category Chips ───
const CATEGORIES = [
  { id: null, name: "All", emoji: "✨" },
  { id: "dog", name: "Dogs", emoji: "🐕" },
  { id: "cat", name: "Cats", emoji: "🐱" },
  { id: "bird", name: "Birds", emoji: "🦜" },
  { id: "rabbit", name: "Rabbits", emoji: "🐰" },
  { id: "other", name: "Other", emoji: "🐾" },
];

// ─── Main Component ───
const BuyerDashboard = () => {
  const navigate = useNavigate();
  const { authReady, session, profile } = useAuth();
  const { city: selectedCity, setCity, cities: locationCities } = useLocation();
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [searchCity, setSearchCity] = useState("");
  const [pets, setPets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { totalWishlistCount, togglePetWishlist, isPetInWishlist } = useWishlist();
  const { cartCount } = useCart();

  const filteredCities = useMemo(() => {
    return locationCities.filter(city =>
      city.name.toLowerCase().includes(searchCity.toLowerCase()) ||
      city.state.toLowerCase().includes(searchCity.toLowerCase())
    );
  }, [locationCities, searchCity]);

  useEffect(() => {
    if (!authReady) return;

    if (!session) {
      navigate("/auth/buyer");
      return;
    }

    if (profile) {
      const role = profile.role;
      if (role === "seller") { navigate("/seller-dashboard"); return; }
      if (role === "admin") { navigate("/admin"); return; }
      if (role === "delivery_partner") { navigate("/delivery"); return; }
      if (role === "product_seller") { navigate("/products-dashboard"); return; }
      if (role === "vet") { navigate("/vet/home"); return; }
      
      fetchPets();
    }
  }, [authReady, session, profile, navigate]);

  const fetchPets = async () => {
    try {
      const { data: petsData, error } = await supabase
        .from("pets")
        .select("*")
        .eq("is_available", true)
        .eq("verification_status", "verified")
        .order("created_at", { ascending: false });

      if (error) {
        if (error.code === "42P01" || error.code === "PGRST205") {
          console.warn("Pets table not yet created in Supabase database schema.");
          setPets([]);
          return;
        }
        throw error;
      }

      const rows = petsData || [];
      const ownerIds = Array.from(new Set(rows.map((pet: any) => pet.owner_id).filter(Boolean)));
      const ownersMap = await mergeOwnerProfiles(ownerIds);

      const enrichedPets = rows.map((pet: any) => ({
        ...pet,
        profiles: ownersMap[pet.owner_id] || null,
      }));

      setPets(enrichedPets);
    } catch (e: any) {
      console.warn("fetchPets warning/error:", e);
      // Fail silently or with log rather than disruptive toast to end user
    } finally {
      setLoading(false);
    }
  };

  const filteredPets = useMemo(() => {
    const base = selectedCategory ? pets.filter((p) => p.category === selectedCategory) : pets;
    if (base.length === 0 && !loading) {
      return selectedCategory ? MOCK_PETS.filter(p => p.category === selectedCategory) : MOCK_PETS;
    }
    return base;
  }, [pets, selectedCategory, loading]);

  const trendingPets = useMemo(() => {
    const localPets = pets.filter((pet) => matchesSelectedCity(pet, selectedCity));
    const pool = localPets.length > 0 ? localPets : (pets.length > 0 ? pets : MOCK_PETS);
    const sorted = [...pool].sort((a, b) => (b.views || 0) - (a.views || 0));
    return sorted.slice(0, 8);
  }, [pets, selectedCity]);

  const nearbyBreeders = useMemo(() => {
    const locationMatches = new Map<string, any>();
    const allListedBreeders = new Map<string, any>();

    pets.forEach((pet) => {
      const owner = pet.profiles;
      if (!owner?.id) return;

      const breederCard = {
        id: owner.id,
        name: owner.name || "Verified Breeder",
        profile_photo: owner.profile_photo,
        rating: Number(owner.rating) || 4.8,
        is_breeder_verified: owner.is_breeder_verified,
        city: pet.city,
        coverImage: pet.images?.[0] || null,
        petCount: 1,
      };

      const upsertBreeder = (map: Map<string, any>) => {
        const existing = map.get(owner.id);
        if (existing) {
          existing.petCount += 1;
          if (!existing.coverImage && breederCard.coverImage) existing.coverImage = breederCard.coverImage;
          if (!existing.city && breederCard.city) existing.city = breederCard.city;
          return;
        }
        map.set(owner.id, breederCard);
      };

      upsertBreeder(allListedBreeders);
      if (matchesSelectedCity(pet, selectedCity)) {
        upsertBreeder(locationMatches);
      }
    });

    const preferred = Array.from(locationMatches.values());
    const fallback = Array.from(allListedBreeders.values());
    
    let result = preferred.length > 0 ? preferred : (fallback.length > 0 ? fallback : MOCK_BREEDERS);
    
    // Ensure we have enough breeders for a good UI
    if (result.length < 3 && fallback.length === 0) {
      result = [...result, ...MOCK_BREEDERS.filter(mb => !result.find(r => r.id === mb.id))];
    }

    return result.slice(0, 10);
  }, [pets, selectedCity]);

  const formatAge = (months: number) => {
    if (months < 12) return `${months} months`;
    const y = Math.floor(months / 12);
    const m = months % 12;
    return m > 0 ? `${y}y ${m}m` : `${y} years`;
  };

  // Show splash while auth is loading - using consistent SplashScreen
  if (!authReady || !profile) {
    return <SplashScreen message="Initializing Buyer Dashboard..." />;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <img src={SRUVO_LOGO_URL} alt="Sruvo" className="w-12 h-12 object-contain" referrerPolicy="no-referrer" />
            <div>
              <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent block -mb-0.5">Sruvo</span>
              <button 
                onClick={() => setLocationModalOpen(true)} 
                className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                <MapPin className="w-3 h-3" />
                <span>{selectedCity}</span>
                <ChevronDown className="w-3 h-3" />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="w-9 h-9 rounded-full bg-muted flex items-center justify-center relative" onClick={() => navigate("/wishlist")}>
              <Heart className="w-5 h-5" />
              {totalWishlistCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] rounded-full flex items-center justify-center">{totalWishlistCount}</span>}
            </button>
            <button className="w-9 h-9 rounded-full bg-muted flex items-center justify-center relative" onClick={() => navigate("/cart")}>
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] rounded-full flex items-center justify-center">{cartCount}</span>}
            </button>
            <HeaderProfileDropdown />
          </div>
        </div>
      </header>

      <InlineBanners placement="top" />

      {/* Hero */}
      <section className="px-4 pt-6 pb-4">
        <h1 className="text-3xl font-bold text-center leading-tight">
          Find Your Perfect
          <br />
          <span className="bg-gradient-primary bg-clip-text text-transparent">Companion</span>
        </h1>
        <p className="text-sm text-muted-foreground text-center mt-2">
          Browse thousands of verified pets from trusted sellers across India
        </p>

        {/* Search Bar */}
        <div className="relative mt-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by breed, location, or category..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-card border border-border shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </section>

      {/* Banner Carousel */}
      <div className="px-4 pb-4">
        <HeroBannerCarousel />
      </div>

      {/* Category Chips */}
      <div className="px-4 pb-4">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id || "all"}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium flex-shrink-0 transition-all ${
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-card border border-border text-foreground hover:bg-muted"
                }`}
              >
                <span>{cat.emoji}</span>
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Featured Pets - Trending Near You */}
      <section className="px-5 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[20px] font-extrabold text-[#151B32] tracking-tight">Trending Near You</h2>
          <button 
            onClick={() => navigate("/trending")}
            className="text-[12px] font-bold text-primary flex items-center gap-1 bg-primary/10 px-3 py-1.5 rounded-full"
          >
            SEE ALL <span className="text-[10px] opacity-70">({trendingPets.length})</span>
          </button>
        </div>
        <div className="overflow-x-auto scrollbar-hide pb-6 pt-2 snap-x snap-mandatory">
          <div className="flex gap-4 px-5">
            {trendingPets.length > 0 ? trendingPets.map((pet) => (
              <div key={pet.id} className="min-w-[175px] max-w-[175px] snap-start">
                <PetCard pet={pet as any} />
              </div>
            )) : (
              [1, 2, 3].map(i => (
                <div key={i} className="min-w-[175px] h-[220px] bg-muted animate-pulse rounded-2xl" />
              ))
            )}
          </div>
        </div>
      </section>

      {/* Verified Breeders Section - Premium Cards */}
      <section className="pb-8">
        <div className="px-5 flex items-center justify-between mb-4">
          <div>
            <h2 className="text-[20px] font-extrabold text-[#151B32] tracking-tight">Verified Breeder Nearby</h2>
            <p className="text-[13px] text-muted-foreground mt-0.5">Expert breeders in your location</p>
          </div>
          <button 
            onClick={() => navigate("/sellers")}
            className="text-[12px] font-bold text-primary flex items-center gap-1 bg-primary/10 px-3 py-1.5 rounded-full"
          >
            VIEW ALL <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="overflow-x-auto scrollbar-hide pb-10 pt-2 snap-x snap-mandatory min-h-[250px]">
          <div className="flex gap-5 px-5">
            {nearbyBreeders.length > 0 ? nearbyBreeders.map((breeder) => {
              const displayImage = breeder.coverImage || breeder.profile_photo;
              return (
                <div
                  key={breeder.id}
                  className="flex-shrink-0 bg-card overflow-hidden active:scale-[0.98] transition-all duration-300 snap-start shadow-sm"
                  style={{
                    width: '260px',
                    borderRadius: '28px',
                    border: '1px solid rgba(0,0,0,0.05)'
                  }}
                  onClick={() => navigate(`/buyer/home/breeder/${breeder.id}`)}
                >
                  {/* Top Banner Image */}
                  <div className="relative h-40 bg-muted">
                    {displayImage ? (
                      <img src={displayImage} alt={breeder.name} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full bg-secondary/50 flex items-center justify-center text-primary/30 text-4xl font-bold">
                        {breeder.name?.[0]}
                      </div>
                    )}
                    <div className="absolute top-3 right-3 bg-[#10b981] text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                      <ShieldCheck className="w-3 h-3" /> VERIFIED
                    </div>
                  </div>

                  {/* Floating Profile Info */}
                  <div className="relative -mt-10 mx-3 mb-3 bg-background rounded-[20px] p-4 shadow-xl border border-border/40 hover:shadow-2xl transition-shadow duration-300">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0 pr-2">
                        <h3 className="text-[15px] font-bold text-[#151B32] truncate">{breeder.name}</h3>
                        <div className="flex items-center gap-1.5 mt-1">
                          <Star className="w-3.5 h-3.5 fill-[#FBBF24] text-[#FBBF24]" />
                          <span className="text-[12px] font-bold text-foreground">{breeder.rating?.toFixed(1) || "4.8"}</span>
                          <span className="text-[12px] text-muted-foreground">•</span>
                          <span className="text-[12px] text-muted-foreground">{breeder.petCount}+ Pets</span>
                        </div>
                      </div>
                      <div className="w-10 h-10 rounded-full border-2 border-white shadow-sm overflow-hidden bg-muted shrink-0">
                        <img src={breeder.profile_photo || ""} alt={breeder.name} className="w-full h-full object-cover" loading="lazy" />
                      </div>
                    </div>
                    <button className="mt-3 w-full py-2 bg-primary text-white text-[13px] font-bold rounded-xl shadow-soft hover:opacity-90 transition-opacity">
                      View Profile
                    </button>
                  </div>
                </div>
              );
            }) : (
              [1, 2].map(i => (
                <div key={i} className="flex-shrink-0 w-[260px] h-[300px] bg-muted animate-pulse rounded-[28px]" />
              ))
            )}
          </div>
        </div>
      </section>

      {/* All Pets Grid */}
      <section className="px-5 mb-10">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[20px] font-extrabold text-[#151B32] tracking-tight">All Pets</h2>
          <button 
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#E5E7EB] text-[12px] font-bold text-[#4B5563] hover:bg-gray-50 transition-colors"
            onClick={() => toast.info("Filter functionality coming soon!")}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-primary" />
            FILTER
          </button>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-48 rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : filteredPets.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No pets found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filteredPets.map((pet) => (
              <PetCard key={pet.id} pet={pet as any} />
            ))}
          </div>
        )}
      </section>

      <InlineBanners placement="bottom" />
      <BottomNavigation variant="buyer" />

      {/* Location Selector Modal */}
      <Dialog open={locationModalOpen} onOpenChange={setLocationModalOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="text-lg font-bold">Select Your City</DialogTitle>
          </DialogHeader>
          <div className="p-4 pt-2">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="text" placeholder="Search city..." value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-muted text-sm outline-none" />
            </div>
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {filteredCities.map((c) => (
                <button key={c.id}
                  onClick={() => { setCity(c.name); setLocationModalOpen(false); setSearchCity(""); toast.success(`Location set to ${c.name}`); }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-sm flex items-center justify-between ${selectedCity === c.name ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted"}`}>
                  <div><p className="font-medium">{c.name}</p><p className="text-[11px] text-muted-foreground">{c.state}</p></div>
                  {selectedCity === c.name && <Check className="w-4 h-4 text-primary" />}
                </button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BuyerDashboard;
