import { useState, useEffect } from "react";
import { ArrowLeft, Heart, ShoppingCart, Search, Plus, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useWishlist } from "@/hooks/useWishlist";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { PET_NAMES } from "@/lib/shopData";

import shopDogsImg from "@/assets/shop-dogs.png";
import shopCatsImg from "@/assets/shop-cats.png";
import shopBirdsImg from "@/assets/shop-birds.png";
import shopFishImg from "@/assets/shop-fish.png";
import shopRabbitsImg from "@/assets/shop-rabbits.png";
import shopMouseImg from "@/assets/shop-mouse.png";
import shopHamstersImg from "@/assets/shop-hamsters.png";
import shopGuineapigsImg from "@/assets/shop-guineapigs.png";
import shopTurtleImg from "@/assets/shop-turtle.png";

const SHOP_IMAGES: Record<string, string> = {
  dog: shopDogsImg, cat: shopCatsImg, birds: shopBirdsImg, fish: shopFishImg,
  rabbit: shopRabbitsImg, "white-mouse": shopMouseImg, hamster: shopHamstersImg,
  "guinea-pig": shopGuineapigsImg, turtle: shopTurtleImg,
};

const DOG_BREED_NAMES = ["Golden Retriever", "Labrador Retriever", "German Shepherd", "Beagle", "Pug", "Shih Tzu", "Rottweiler", "Cocker Spaniel"];
const CAT_BREED_NAMES = ["Persian", "British Shorthair", "Maine Coon", "Siamese", "Bengal", "Ragdoll", "Himalayan", "Domestic Shorthair"];
const BIRD_BREED_NAMES = ["Parrots", "Budgies", "Cockatiels", "Love Birds", "Finches", "Canaries", "Pigeons", "Doves"];
const FISH_BREED_NAMES = ["Goldfish", "Betta", "Tropical Fish", "Koi", "Shrimp", "Catfish", "Arowana", "Discus Fish"];

const RABBIT_CATEGORY_NAMES = [{ name: "Food", categoryId: "food" }, { name: "Treats", categoryId: "hay" }, { name: "Pharmacy", categoryId: "pharmacy" }, { name: "Toys", categoryId: "toys" }, { name: "Hutches", categoryId: "hutches" }, { name: "Grooming", categoryId: "grooming" }];
const MOUSE_CATEGORY_NAMES = [{ name: "Food", categoryId: "food" }, { name: "Treats", categoryId: "treats" }, { name: "Health Care", categoryId: "pharmacy" }, { name: "Toys", categoryId: "toys" }, { name: "Habitat", categoryId: "cages" }, { name: "Accessories", categoryId: "feeders" }];
const HAMSTER_CATEGORY_NAMES = [{ name: "Food", categoryId: "food" }, { name: "Treats", categoryId: "treats" }, { name: "Health Care", categoryId: "pharmacy" }, { name: "Toys", categoryId: "toys" }, { name: "Habitat", categoryId: "tanks" }, { name: "Accessories", categoryId: "cleaning" }];
const GUINEA_PIG_CATEGORY_NAMES = [{ name: "Food", categoryId: "food" }, { name: "Treats", categoryId: "hay" }, { name: "Pharmacy", categoryId: "pharmacy" }, { name: "Toys", categoryId: "toys" }, { name: "Bedding & Care", categoryId: "bedding" }, { name: "Grooming", categoryId: "grooming" }];
const TURTLE_CATEGORY_NAMES = [{ name: "Food", categoryId: "food" }, { name: "Habitat", categoryId: "tanks" }, { name: "Health Care", categoryId: "pharmacy" }, { name: "Tank Decor", categoryId: "decor" }, { name: "Basking Platforms & Docks", categoryId: "basking" }, { name: "Cleaning & Maintenance", categoryId: "cleaning" }];

interface PetShopScreenProps {
  petType: string;
  onBack: () => void;
  onViewAllProducts: (breed?: string) => void;
  onViewAllProductsWithCategory?: (category: string) => void;
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
}

const PetShopScreen = ({ petType, onBack, onViewAllProducts, onViewAllProductsWithCategory, onAddToCart, onSearch }: PetShopScreenProps) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const petName = PET_NAMES[petType] || "Pet";
  const shopImage = SHOP_IMAGES[petType] || shopDogsImg;
  const { toggleProductWishlist, isProductInWishlist, totalWishlistCount } = useWishlist();
  const { cartCount } = useCart();
  const [featuredProducts, setFeaturedProducts] = useState<ShopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [isHeroLoaded, setIsHeroLoaded] = useState(false);

  useEffect(() => {
    setIsHeroLoaded(false);
    const heroImage = new Image();
    heroImage.src = shopImage;

    const markLoaded = () => setIsHeroLoaded(true);

    if (heroImage.complete) {
      markLoaded();
      return;
    }

    heroImage.addEventListener("load", markLoaded);
    heroImage.addEventListener("error", markLoaded);

    return () => {
      heroImage.removeEventListener("load", markLoaded);
      heroImage.removeEventListener("error", markLoaded);
    };
  }, [shopImage]);

  // Task I: Fetch real products for this pet type
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("shop_products")
        .select("id, name, price, original_price, discount, images")
        .eq("is_active", true)
        .eq("verification_status", "verified")
        .eq("pet_type", petType)
        .order("total_sold", { ascending: false })
        .limit(4);
      setFeaturedProducts(data || []);
      setLoading(false);
    };
    fetchProducts();
  }, [petType]);

  const handleToggleWishlist = async (product: ShopProduct) => {
    await toggleProductWishlist({
      id: product.id, name: product.name, price: product.price,
      image: product.images?.[0] || "", petType,
    });
  };

  const isBreedPet = ["dog", "cat", "birds", "fish"].includes(petType);
  const isCategoryPet = ["rabbit", "white-mouse", "hamster", "guinea-pig", "turtle"].includes(petType);

  const getBreedNames = () => {
    switch (petType) {
      case "dog": return DOG_BREED_NAMES;
      case "cat": return CAT_BREED_NAMES;
      case "birds": return BIRD_BREED_NAMES;
      case "fish": return FISH_BREED_NAMES;
      default: return [];
    }
  };

  const getCategoryNames = () => {
    switch (petType) {
      case "rabbit": return RABBIT_CATEGORY_NAMES;
      case "white-mouse": return MOUSE_CATEGORY_NAMES;
      case "hamster": return HAMSTER_CATEGORY_NAMES;
      case "guinea-pig": return GUINEA_PIG_CATEGORY_NAMES;
      case "turtle": return TURTLE_CATEGORY_NAMES;
      default: return [];
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-card border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="rounded-full" onClick={onBack}><ArrowLeft className="w-5 h-5" /></Button>
            <h1 className="text-lg font-bold text-foreground">{petName} Shop</h1>
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
          </div>
        </div>
      </header>

      <div className="px-4 py-3">
        {isSearchOpen ? (
          <div className="flex items-center gap-2 bg-muted rounded-xl px-4 py-1.5">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && searchQuery.trim() && onSearch) onSearch(searchQuery.trim()); }}
              placeholder={`Search ${petName.toLowerCase()} products...`}
              className="flex-1 bg-transparent text-sm outline-none text-foreground placeholder:text-muted-foreground" autoFocus />
            <button onClick={() => { setIsSearchOpen(false); setSearchQuery(""); }}><X className="w-4 h-4 text-muted-foreground" /></button>
          </div>
        ) : (
          <button className="flex items-center gap-2 bg-muted rounded-xl px-4 py-2.5 w-full" onClick={() => setIsSearchOpen(true)}>
            <Search className="w-4 h-4 text-muted-foreground" /><span className="text-sm text-muted-foreground">Search {petName.toLowerCase()} products...</span>
          </button>
        )}
      </div>

      {/* Image with overlay */}
      <div className="px-4 pb-4">
        <div className="relative rounded-2xl overflow-hidden bg-muted min-h-[360px]">
          {!isHeroLoaded && <div className="absolute inset-0 animate-pulse bg-muted" aria-hidden />}
          <img
            src={shopImage}
            alt={`Shop for ${petName}s`}
            loading="eager"
            fetchPriority="high"
            decoding="sync"
            className={`w-full rounded-2xl block transition-opacity duration-150 ${isHeroLoaded ? "opacity-100" : "opacity-0"}`}
          />
          {isHeroLoaded && isBreedPet && (
            <div className="absolute bottom-0 left-0 right-0" style={{ height: "60%" }}>
              <div className="grid grid-cols-4 grid-rows-2 w-full h-full">
                {getBreedNames().map((breed, i) => (
                  <button key={i} className="w-full h-full hover:bg-black/5 active:bg-black/10 transition-all" onClick={() => onViewAllProducts(breed)} aria-label={breed} />
                ))}
              </div>
            </div>
          )}
          {isHeroLoaded && isCategoryPet && (
            <div className="absolute bottom-0 left-0 right-0" style={{ height: "55%" }}>
              <div className="grid grid-cols-3 grid-rows-2 w-full h-full">
                {getCategoryNames().map((cat, i) => (
                  <button key={i} className="w-full h-full hover:bg-black/5 active:bg-black/10 transition-all" onClick={() => onViewAllProductsWithCategory?.(cat.categoryId)} aria-label={cat.name} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {isHeroLoaded && (
        <div className="px-4 pb-24">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-foreground">Featured Products</h2>
            <button className="flex items-center gap-0.5 text-sm font-medium" style={{ color: '#7c3aed' }} onClick={() => onViewAllProducts()}>
              View All <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 gap-3">
              {[1,2].map(i => (
                <div key={i} className="bg-card rounded-2xl overflow-hidden shadow-sm border border-border animate-pulse">
                  <div className="aspect-square bg-muted" /><div className="p-3 space-y-2"><div className="h-4 bg-muted rounded" /></div>
                </div>
              ))}
            </div>
          ) : featuredProducts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No products available for {petName} yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {featuredProducts.map((product) => {
                const imgUrl = product.images?.[0] || "";
                return (
                  <div key={product.id} className="bg-card rounded-2xl overflow-hidden shadow-sm border border-border cursor-pointer" onClick={() => navigate(`/product/${product.id}`)}>
                    <div className="relative aspect-square bg-muted" style={{ backgroundColor: '#fce7f3' }}>
                      {imgUrl ? <img src={imgUrl} alt={product.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-4xl">🛒</div>}
                      {product.discount && product.discount > 0 && (
                        <span className="absolute top-2 left-2 text-white text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#ec4899' }}>{product.discount}% OFF</span>
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
      )}
    </div>
  );
};

export default PetShopScreen;
