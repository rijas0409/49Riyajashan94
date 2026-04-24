import { useState, useCallback, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import sruvoLogo from "@/assets/sruvo-logo.png";
import { Heart, ShoppingCart, Search, MapPin, ChevronDown, ChevronRight, Plus, X, Check, Flame, Clock, Percent, TrendingUp, TrendingDown, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useWishlist } from "@/hooks/useWishlist";
import { useCart } from "@/contexts/CartContext";
import { useLocation } from "@/contexts/LocationContext";
import { supabase } from "@/integrations/supabase/client";
import HeaderProfileDropdown from "@/components/HeaderProfileDropdown";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import shopPromoBanner from "@/assets/shop-promo-banner.png";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

const FALLBACK_SLIDES = [
  {
    gradient: "linear-gradient(135deg, #7c3aed, #a855f7, #ec4899)",
    title: "Summer Pet\nCare Deals",
    subtitle: "Up to 40% off sunscreens &\nhydration kits",
    cta: "Shop Now",
    image: shopPromoBanner,
  },
  {
    gradient: "linear-gradient(135deg, #0ea5e9, #6366f1, #8b5cf6)",
    title: "Premium\nPet Food",
    subtitle: "Top brands at best prices\nFree delivery above ₹499",
    cta: "Explore",
    image: "https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?w=400",
  },
  {
    gradient: "linear-gradient(135deg, #f59e0b, #ef4444, #ec4899)",
    title: "New Arrivals\nToys & Treats",
    subtitle: "Exciting toys for your\nfurry friends",
    cta: "Browse",
    image: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400",
  },
  {
    gradient: "linear-gradient(135deg, #10b981, #14b8a6, #0ea5e9)",
    title: "Pet Health\nEssentials",
    subtitle: "Vitamins, supplements &\nmore at 30% off",
    cta: "Shop Now",
    image: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400",
  },
];

const PET_OPTIONS = [
  { id: "dog", name: "Dogs", image: "https://images.unsplash.com/photo-1552053831-71594a27632d?w=200" },
  { id: "cat", name: "Cats", image: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=200" },
  { id: "birds", name: "Birds", image: "https://images.unsplash.com/photo-1452570053594-1b985d6ea890?w=200" },
  { id: "fish", name: "Fish", image: "https://images.unsplash.com/photo-1524704654690-b56c05c78a00?w=200" },
  { id: "rabbit", name: "Rabbits", image: "https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=200" },
  { id: "hamster", name: "Hamsters", image: "https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=200" },
  { id: "guinea-pig", name: "Guinea Pig", image: "https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=200" },
  { id: "turtle", name: "Turtle", image: "https://images.unsplash.com/photo-1437622368342-7a3d73a34c8f?w=200" },
  { id: "white-mouse", name: "Mouse", image: "https://images.unsplash.com/photo-1548802673-380ab8ebc7b7?w=200" },
];

// Promo Carousel Component
const PromoCarousel = () => {
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
        .eq("location", "shop_home")
        .eq("is_active", true)
        .order("position");
      if (data && data.length > 0) {
        setSlides(data.map((b: any) => ({
          gradient: b.gradient, title: b.title, subtitle: b.subtitle,
          cta: b.cta_text, image: b.image_url,
        })));
      } else {
        setSlides(FALLBACK_SLIDES);
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
              <div className="relative rounded-2xl overflow-hidden" style={{ background: slide.gradient }}>
                <div className="flex items-center">
                  <div className="flex-1 p-5">
                    <h3 className="text-white text-xl font-bold leading-tight whitespace-pre-line">{slide.title}</h3>
                    <p className="text-white/80 text-xs mt-1 whitespace-pre-line">{slide.subtitle}</p>
                    <button className="mt-3 bg-white text-foreground text-xs font-semibold px-4 py-1.5 rounded-full">{slide.cta}</button>
                  </div>
                  {slide.image && (
                    <div className="w-36 h-32 flex-shrink-0">
                      <img src={slide.image} alt={slide.title} className="w-full h-full object-cover" />
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

interface ShopHomeScreenProps {
  onSelectPet: (petId: string) => void;
  onAddToCart: (product: { id: string; name: string; price: number; image: string }) => void;
  onSearch?: (query: string) => void;
}

interface ShopProduct {
  id: string;
  name: string;
  price: number;
  original_price: number | null;
  discount: number | null;
  images: string[] | null;
  pet_type: string;
  category: string;
}

const ShopHomeScreen = ({ onSelectPet, onAddToCart, onSearch }: ShopHomeScreenProps) => {
  const { authReady } = useAuth();
  const navigate = useNavigate();
  const { toggleProductWishlist, isProductInWishlist, totalWishlistCount } = useWishlist();
  const { cartCount } = useCart();
  const { city, setCity, cities } = useLocation();
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [searchCity, setSearchCity] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [bestSellers, setBestSellers] = useState<ShopProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const [sortOption, setSortOption] = useState("popularity");
  const [showSortMenu, setShowSortMenu] = useState(false);

  const BEST_SELLER_SORT_OPTIONS = [
    { id: "popularity", name: "Popularity", icon: Flame },
    { id: "latest", name: "Latest", icon: Clock },
    { id: "discount", name: "Discount", icon: Percent },
    { id: "price-high", name: "Price: High to Low", icon: TrendingUp },
    { id: "price-low", name: "Price: Low to High", icon: TrendingDown },
    { id: "rating", name: "Customer Rating", icon: Star },
  ];

  // Fetch real products from database - wait for auth to be ready
  useEffect(() => {
    if (!authReady) return;
    const fetchProducts = async () => {
      setLoadingProducts(true);
      const { data } = await supabase
        .from("shop_products")
        .select("id, name, price, original_price, discount, images, pet_type, category")
        .eq("is_active", true)
        .eq("verification_status", "verified")
        .order("total_sold", { ascending: false })
        .limit(8);
      setBestSellers(data || []);
      setLoadingProducts(false);
    };
    fetchProducts();
  }, [authReady]);

  // Apply sorting
  const sortedBestSellers = useMemo(() => {
    const items = [...bestSellers];
    switch (sortOption) {
      case "price-low": return items.sort((a, b) => a.price - b.price);
      case "price-high": return items.sort((a, b) => b.price - a.price);
      case "discount": return items.sort((a, b) => (b.discount || 0) - (a.discount || 0));
      case "latest": return items.sort((a, b) => b.id.localeCompare(a.id));
      default: return items;
    }
  }, [bestSellers, sortOption]);

  const handleToggleWishlist = async (product: ShopProduct) => {
    const img = product.images?.[0] || "";
    await toggleProductWishlist({
      id: product.id,
      name: product.name,
      price: product.price,
      image: img,
      petType: product.pet_type || "dog",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <img src={sruvoLogo} alt="Sruvo" className="w-12 h-12 object-contain" />
            <div>
              <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">Sruvo</span>
              <button onClick={() => setLocationModalOpen(true)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <MapPin className="w-3 h-3" /><span>{city}</span><ChevronDown className="w-3 h-3" />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors relative" onClick={() => navigate("/wishlist")}>
              <Heart className="w-5 h-5" />
              {totalWishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] rounded-full flex items-center justify-center">{totalWishlistCount}</span>
              )}
            </button>
            <button className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors relative" onClick={() => navigate("/cart")}>
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] rounded-full flex items-center justify-center">{cartCount}</span>
              )}
            </button>
            <HeaderProfileDropdown />
          </div>
        </div>
      </header>

      {/* Search Bar */}
      <div className="px-4 py-3">
        {isSearchOpen ? (
          <div className="flex items-center gap-2 bg-muted rounded-xl px-4 py-1.5">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && searchQuery.trim() && onSearch) onSearch(searchQuery.trim()); }}
              placeholder="Search food, toys, meds…" className="flex-1 bg-transparent text-sm outline-none text-foreground placeholder:text-muted-foreground" autoFocus />
            <button onClick={() => { setIsSearchOpen(false); setSearchQuery(""); }}><X className="w-4 h-4 text-muted-foreground" /></button>
          </div>
        ) : (
          <button className="flex items-center gap-2 bg-muted rounded-xl px-4 py-2.5 w-full" onClick={() => setIsSearchOpen(true)}>
            <Search className="w-4 h-4 text-muted-foreground" /><span className="text-sm text-muted-foreground">Search food, toys, meds…</span>
          </button>
        )}
      </div>

      {/* Promo Carousel */}
      <div className="px-4 pb-4"><PromoCarousel /></div>

      {/* Who are you shopping for? */}
      <div className="px-4 pb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-foreground">Who are you shopping for?</h2>
          <span className="text-sm font-medium" style={{ color: '#7c3aed' }}>View All</span>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {PET_OPTIONS.map((pet) => (
            <button key={pet.id} onClick={() => onSelectPet(pet.id)} className="flex flex-col items-center gap-1.5 flex-shrink-0">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-border bg-muted">
                <img src={pet.image} alt={pet.name} className="w-full h-full object-cover" />
              </div>
              <span className="text-xs text-foreground font-medium">{pet.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Best Sellers - Real products only */}
      <div className="px-4 pb-24">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-foreground">Best Sellers</h2>
          <div className="relative">
            <button className="flex items-center gap-1 text-sm text-muted-foreground" onClick={() => setShowSortMenu(!showSortMenu)}>
              Sort by <ChevronDown className="w-3 h-3" />
            </button>
            {showSortMenu && (
              <div className="absolute right-0 top-8 z-50 bg-card border border-border rounded-xl shadow-lg py-1 w-48">
                {BEST_SELLER_SORT_OPTIONS.map((opt) => (
                  <button key={opt.id}
                    className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 ${sortOption === opt.id ? "text-primary font-medium bg-primary/5" : "text-foreground"}`}
                    onClick={() => { setSortOption(opt.id); setShowSortMenu(false); }}>
                    <opt.icon className="w-4 h-4 flex-shrink-0" />
                    <span className="flex-1">{opt.name}</span>
                    {sortOption === opt.id && <Check className="w-4 h-4 text-primary flex-shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        {loadingProducts ? (
          <div className="grid grid-cols-2 gap-3">
            {[1,2,3,4].map(i => (
              <div key={i} className="bg-card rounded-2xl overflow-hidden shadow-sm border border-border animate-pulse">
                <div className="aspect-square bg-muted" />
                <div className="p-3 space-y-2"><div className="h-4 bg-muted rounded" /><div className="h-4 bg-muted rounded w-1/2" /></div>
              </div>
            ))}
          </div>
        ) : sortedBestSellers.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No products available yet.</p>
            <p className="text-sm mt-1">Products listed from the seller panel will appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {sortedBestSellers.map((product) => {
              const imgUrl = product.images?.[0] || "";
              return (
                <div key={product.id} className="bg-card rounded-2xl overflow-hidden shadow-sm border border-border cursor-pointer" onClick={() => navigate(`/product/${product.id}`)}>
                  <div className="relative aspect-square bg-muted" style={{ backgroundColor: '#fce7f3' }}>
                    {imgUrl ? (
                      <img src={imgUrl} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">🛒</div>
                    )}
                    {product.discount && product.discount > 0 && (
                      <span className="absolute top-2 left-2 text-white text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#ec4899' }}>
                        {product.discount}% OFF
                      </span>
                    )}
                    <Button size="icon" variant="ghost"
                      className={`absolute top-2 right-2 w-7 h-7 rounded-full bg-white/80 shadow-sm ${isProductInWishlist(product.id) ? "text-red-500" : "text-muted-foreground"}`}
                      onClick={() => handleToggleWishlist(product)}>
                      <Heart className={`w-4 h-4 ${isProductInWishlist(product.id) ? "fill-current" : ""}`} />
                    </Button>
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-medium text-foreground line-clamp-2">{product.name}</h3>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-base font-bold text-foreground">₹{product.price}</span>
                      {product.original_price && product.original_price > product.price && (
                        <span className="text-xs text-muted-foreground line-through">₹{product.original_price}</span>
                      )}
                      <Button size="icon" className="w-7 h-7 rounded-full ml-auto" style={{ backgroundColor: '#ec4899' }}
                        onClick={() => onAddToCart({ id: product.id, name: product.name, price: product.price, image: imgUrl })}>
                        <Plus className="w-4 h-4 text-white" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

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
              {cities.filter(c => c.name.toLowerCase().includes(searchCity.toLowerCase())).map((c) => (
                <button key={c.id}
                  onClick={() => { setCity(c.name); setLocationModalOpen(false); setSearchCity(""); toast.success(`Location set to ${c.name}`); }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-sm flex items-center justify-between ${city === c.name ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted"}`}>
                  <div><p className="font-medium">{c.name}</p><p className="text-[11px] text-muted-foreground">{c.state}</p></div>
                  {city === c.name && <Check className="w-4 h-4 text-primary" />}
                </button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ShopHomeScreen;
