import { useEffect, useState, useCallback, useMemo } from "react";
import sruvoLogo from "@/assets/sruvo-logo.png";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "@/contexts/LocationContext";
import { Heart, Search, ShoppingCart, MapPin, ShieldCheck, SlidersHorizontal, Plus, ChevronRight, Star } from "lucide-react";
import { toast } from "sonner";
import BottomNavigation from "@/components/BottomNavigation";
import HeaderProfileDropdown from "@/components/HeaderProfileDropdown";
import { useWishlist } from "@/hooks/useWishlist";
import { useCart } from "@/contexts/CartContext";
import { InlineBanners } from "@/components/DynamicBannerRenderer";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";

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
  const { authReady, session } = useAuth();
  const { city: selectedCity } = useLocation();
  const [pets, setPets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { totalWishlistCount, togglePetWishlist, isPetInWishlist } = useWishlist();
  const { cartCount } = useCart();

  useEffect(() => {
    if (!authReady) return;

    if (!session) {
      navigate("/auth");
      return;
    }

    let cancelled = false;

    const init = async () => {
      const { data: roleData } = await supabase.rpc("get_user_role", { _user_id: session.user.id });
      if (cancelled) return;

      if (roleData === "seller") { navigate("/seller-dashboard"); return; }
      if (roleData === "admin") { navigate("/admin"); return; }
      if (roleData === "delivery_partner") { navigate("/delivery"); return; }
      if (roleData === "product_seller") { navigate("/products-dashboard"); return; }
      if (roleData === "vet") { navigate("/vet-dashboard"); return; }

      fetchPets();
    };

    init();
    return () => { cancelled = true; };
  }, [authReady, session, navigate]);

  const fetchPets = async () => {
    try {
      const { data: petsData, error } = await supabase
        .from("pets")
        .select("*")
        .eq("is_available", true)
        .eq("verification_status", "verified")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const rows = petsData || [];
      const ownerIds = Array.from(new Set(rows.map((pet: any) => pet.owner_id).filter(Boolean)));
      const ownersMap = await mergeOwnerProfiles(ownerIds);

      const enrichedPets = rows.map((pet: any) => ({
        ...pet,
        profiles: ownersMap[pet.owner_id] || null,
      }));

      setPets(enrichedPets);
    } catch (e) {
      console.error("fetchPets error:", e);
      toast.error("Failed to load pets");
    } finally {
      setLoading(false);
    }
  };

  const filteredPets = useMemo(() =>
    selectedCategory ? pets.filter((p) => p.category === selectedCategory) : pets
  , [pets, selectedCategory]);

  const trendingPets = useMemo(() => {
    const source = pets.filter((pet) => matchesSelectedCity(pet, selectedCity));
    const sorted = [...(source.length > 0 ? source : pets)].sort((a, b) => (b.views || 0) - (a.views || 0));
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

    return (preferred.length > 0 ? preferred : fallback).slice(0, 10);
  }, [pets, selectedCity]);

  const formatAge = (months: number) => {
    if (months < 12) return `${months} months`;
    const y = Math.floor(months / 12);
    const m = months % 12;
    return m > 0 ? `${y}y ${m}m` : `${y} years`;
  };

  // Show splash while auth is loading
  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <img src={sruvoLogo} alt="Sruvo" className="w-16 h-16 animate-pulse" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <img src={sruvoLogo} alt="Sruvo" className="w-12 h-12 object-contain" />
            <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">Sruvo</span>
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

      {/* Trending Near You */}
      {trendingPets.length > 0 && (
        <section className="pb-6">
          <div className="px-4 flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-foreground">Trending Near You</h2>
            <span className="text-sm font-medium text-primary">View All</span>
          </div>
          <div className="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide">
            {trendingPets.map((pet, idx) => (
              <div
                key={pet.id}
                className="flex-shrink-0 w-44 rounded-2xl overflow-hidden bg-card border border-border shadow-sm cursor-pointer active:scale-[0.97] transition-transform"
                onClick={() => navigate(`/pet/${pet.id}`)}
              >
                <div className="relative aspect-[4/3] bg-muted">
                  <img src={pet.images?.[0] || "/placeholder.svg"} alt={pet.breed} className="w-full h-full object-cover" />
                  <span className={`absolute top-2 left-2 text-[10px] font-bold text-white px-2 py-0.5 rounded-full ${
                    idx % 3 === 0 ? "bg-destructive" : idx % 3 === 1 ? "bg-primary" : "bg-accent text-accent-foreground"
                  }`}>
                    {idx % 3 === 0 ? "HOT DEAL" : idx % 3 === 1 ? "TRENDING" : "NEW"}
                  </span>
                </div>
                <div className="p-2.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-foreground line-clamp-1">{pet.breed}</h3>
                    <span className="text-sm font-bold text-primary">₹{(pet.price / 1000).toFixed(0)}k</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {pet.city} • {formatAge(pet.age_months)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Verified Breeders Nearby - Premium Cards */}
      {nearbyBreeders.length > 0 && (
        <section className="pb-6">
          <div className="px-4 flex items-center justify-between mb-3">
            <div>
              <h2 className="text-[20px] font-semibold text-foreground" style={{ fontFamily: 'Inter, SF Pro Display, sans-serif' }}>Verified Breeders Nearby</h2>
              <p className="text-[13px] text-muted-foreground mt-0.5">Connect with {nearbyBreeders.length} top-rated experts in your area</p>
            </div>
            <button className="text-[12px] font-medium px-3 py-1.5 rounded-full flex items-center gap-0.5 bg-accent text-primary">
              SEE MAP <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="flex gap-4 overflow-x-auto px-4 pt-1 pb-3 scrollbar-hide">
            {nearbyBreeders.map((breeder) => {
              const displayImage = breeder.coverImage || breeder.profile_photo;
              return (
                <div
                  key={breeder.id}
                  className="flex-shrink-0 bg-card overflow-hidden active:scale-[0.97] transition-transform"
                  style={{
                    width: '260px',
                    borderRadius: '24px',
                    boxShadow: '0px 10px 30px rgba(0,0,0,0.08)',
                  }}
                >
                  {/* Top Image */}
                  <div className="relative" style={{ height: '160px' }}>
                    {displayImage ? (
                      <img src={displayImage} alt={breeder.name} className="w-full h-full object-cover" style={{ borderRadius: '24px 24px 0 0' }} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-secondary" style={{ borderRadius: '24px 24px 0 0' }}>
                        <span className="text-5xl font-bold text-primary/40">{breeder.name?.[0]?.toUpperCase()}</span>
                      </div>
                    )}
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 50%)', borderRadius: '24px 24px 0 0' }} />
                    <span className="absolute top-3 right-3 flex items-center gap-1 text-white text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: '#166534' }}>
                      <ShieldCheck className="w-3 h-3" /> VERIFIED
                    </span>
                  </div>

                  {/* Floating Info Panel */}
                  <div className="relative -mt-5 mx-3 mb-3 p-4 bg-muted/50" style={{ borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                    <h3 className="text-[16px] font-semibold text-foreground line-clamp-1">{breeder.name}</h3>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <Star className="w-3.5 h-3.5 fill-[#FBBF24] text-[#FBBF24]" />
                      <span className="text-[12px] font-semibold text-foreground">{breeder.rating?.toFixed(1) || "4.8"}</span>
                      <span className="text-[12px] text-muted-foreground">•</span>
                      <span className="text-[12px] text-muted-foreground">{breeder.petCount}+ Pets Listed</span>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/seller/${breeder.id}`); }}
                      className="mt-3 w-full py-2.5 text-[14px] font-medium text-primary-foreground rounded-xl active:scale-[0.97] transition-all bg-gradient-primary shadow-soft"
                    >
                      View Profile
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* All Pets Grid */}
      <section className="px-4 pb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-foreground">All Pets</h2>
          <button className="flex items-center gap-1 text-sm text-muted-foreground border border-border rounded-lg px-3 py-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5" /> Filter
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-2xl overflow-hidden bg-card border border-border animate-pulse">
                <div className="aspect-square bg-muted" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredPets.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No verified pets found in this category</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredPets.map((pet) => {
              const isFav = isPetInWishlist(pet.id);
              return (
                <div
                  key={pet.id}
                  className="rounded-2xl overflow-hidden bg-card border border-border shadow-sm cursor-pointer active:scale-[0.97] transition-transform"
                  onClick={() => navigate(`/pet/${pet.id}`)}
                >
                  <div className="relative aspect-square bg-muted">
                    <img src={pet.images?.[0] || "/placeholder.svg"} alt={pet.breed} className="w-full h-full object-cover" />
                    {pet.verification_status === "verified" && (
                      <span className="absolute top-2 left-2 bg-success text-white text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                        <ShieldCheck className="w-2.5 h-2.5" /> VERIFIED
                      </span>
                    )}
                    <button
                      className={`absolute top-2 right-2 w-7 h-7 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center ${isFav ? "text-destructive" : "text-muted-foreground"}`}
                      onClick={(e) => { e.stopPropagation(); togglePetWishlist(pet.id); }}
                    >
                      <Heart className="w-4 h-4" fill={isFav ? "currentColor" : "none"} />
                    </button>
                    <span className="absolute bottom-2 left-2 bg-black/50 text-white text-[10px] font-medium px-2 py-0.5 rounded-full backdrop-blur-sm">
                      {formatAge(pet.age_months)}
                    </span>
                  </div>
                  <div className="p-2.5">
                    <h3 className="text-sm font-semibold text-foreground line-clamp-1">{pet.breed}</h3>
                    <div className="flex items-center gap-1 mt-0.5 text-[11px] text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      <span className="line-clamp-1">{pet.city}, {pet.state}</span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-base font-bold text-foreground">₹{pet.price.toLocaleString()}</span>
                      <button
                        className="w-7 h-7 rounded-full bg-primary flex items-center justify-center"
                        onClick={(e) => { e.stopPropagation(); navigate(`/pet/${pet.id}`); }}
                      >
                        <Plus className="w-4 h-4 text-primary-foreground" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <InlineBanners placement="bottom" />
      <BottomNavigation variant="buyer" />
    </div>
  );
};

export default BuyerDashboard;
