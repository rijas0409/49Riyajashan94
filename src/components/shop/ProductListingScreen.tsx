import { useState, useMemo, useEffect } from "react";
import { ArrowLeft, Search, ChevronDown, Plus, Heart, X, ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { toast } from "sonner";
import { useWishlist } from "@/hooks/useWishlist";
import { supabase } from "@/integrations/supabase/client";
import { PET_CATEGORIES, PET_NAMES, SORT_OPTIONS, QUICK_FILTERS } from "@/lib/shopData";

interface ProductListingScreenProps {
  petType: string;
  initialBreed?: string;
  initialSearch?: string;
  initialCategory?: string;
  onBack: () => void;
  onAddToCart: (product: { id: string; name: string; price: number; image: string }) => void;
}

interface ShopProduct {
  id: string;
  name: string;
  price: number;
  original_price: number | null;
  discount: number | null;
  brand: string;
  category: string;
  pet_type: string;
  images: string[] | null;
}

const ProductListingScreen = ({ petType, initialBreed, initialSearch, initialCategory, onBack, onAddToCart }: ProductListingScreenProps) => {
  const navigate = useNavigate();
  const categories = PET_CATEGORIES[petType] || PET_CATEGORIES.dog;
  const petName = PET_NAMES[petType] || "Pet";
  const { cartCount } = useCart();
  
  const [selectedCategory, setSelectedCategory] = useState(initialCategory || categories[0]?.id || "food");
  const [sortBy, setSortBy] = useState("relevance");
  const [priceRange, setPriceRange] = useState([0, 50000]);
  const [activeQuickFilters, setActiveQuickFilters] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState(initialSearch || "");
  const [isSearchOpen, setIsSearchOpen] = useState(!!initialSearch);
  const [isPriceFilterOpen, setIsPriceFilterOpen] = useState(false);
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { toggleProductWishlist, isProductInWishlist, totalWishlistCount } = useWishlist();

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      let query = supabase
        .from("shop_products")
        .select("id, name, price, original_price, discount, brand, category, pet_type, images")
        .eq("is_active", true)
        .eq("verification_status", "verified")
        .eq("pet_type", petType);

      if (selectedCategory) {
        query = query.eq("category", selectedCategory);
      }

      const { data } = await query.order("created_at", { ascending: false }).limit(50);
      setProducts(data || []);
      setLoading(false);
    };
    fetchProducts();
  }, [petType, selectedCategory]);

  const filteredProducts = useMemo(() => {
    let result = [...products];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q));
    }
    result = result.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);
    if (activeQuickFilters.includes("price-drop")) result = result.filter(p => (p.discount || 0) >= 20);
    if (activeQuickFilters.includes("best-seller")) result = result.slice(0, 6);

    switch (sortBy) {
      case "price-low": result.sort((a, b) => a.price - b.price); break;
      case "price-high": result.sort((a, b) => b.price - a.price); break;
      case "discount": result.sort((a, b) => (b.discount || 0) - (a.discount || 0)); break;
    }
    return result;
  }, [products, searchQuery, priceRange, activeQuickFilters, sortBy]);

  const toggleQuickFilter = (id: string) => {
    setActiveQuickFilters(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  const handleAddToCart = (e: React.MouseEvent, product: ShopProduct) => {
    e.stopPropagation();
    onAddToCart({ id: product.id, name: product.name, price: product.price, image: product.images?.[0] || "" });
    toast.success(`${product.name} added to cart!`);
  };

  const handleToggleWishlist = async (e: React.MouseEvent, product: ShopProduct) => {
    e.stopPropagation();
    await toggleProductWishlist({
      id: product.id, name: product.name, price: product.price,
      image: product.images?.[0] || "", petType,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-card border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="rounded-full" onClick={onBack}><ArrowLeft className="w-5 h-5" /></Button>
            {isSearchOpen ? (
              <div className="flex items-center gap-2 flex-1">
                <Input type="text" placeholder="Search products..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 rounded-full h-9" autoFocus />
                <Button variant="ghost" size="icon" className="rounded-full" onClick={() => { setIsSearchOpen(false); setSearchQuery(""); }}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <h1 className="text-lg font-bold text-foreground">{petName} Shop</h1>
            )}
          </div>
          {!isSearchOpen && (
            <div className="flex items-center gap-2">
              <button className="w-9 h-9 rounded-full bg-muted flex items-center justify-center" onClick={() => setIsSearchOpen(true)}><Search className="w-5 h-5" /></button>
              <button className="w-9 h-9 rounded-full bg-muted flex items-center justify-center relative" onClick={() => navigate("/wishlist")}>
                <Heart className="w-5 h-5" />
                {totalWishlistCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] rounded-full flex items-center justify-center">{totalWishlistCount}</span>}
              </button>
              <button className="w-9 h-9 rounded-full bg-muted flex items-center justify-center relative" onClick={() => navigate("/cart")}>
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] rounded-full flex items-center justify-center">{cartCount}</span>}
              </button>
            </div>
          )}
        </div>
        <div className="px-4 py-2 border-t border-border space-y-2">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="rounded-full whitespace-nowrap flex items-center gap-1">Sort By <ChevronDown className="w-3 h-3" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="rounded-xl">
                {SORT_OPTIONS.map(o => (
                  <DropdownMenuItem key={o.id} onClick={() => setSortBy(o.id)} className={sortBy === o.id ? "bg-primary/10" : ""}>{o.name}</DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="rounded-full whitespace-nowrap flex items-center gap-1">Type <ChevronDown className="w-3 h-3" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="rounded-xl max-h-60 overflow-y-auto">
                {categories.map(cat => (
                  <DropdownMenuItem key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={selectedCategory === cat.id ? "bg-primary/10" : ""}>
                    {cat.icon} {cat.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Sheet open={isPriceFilterOpen} onOpenChange={setIsPriceFilterOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="rounded-full whitespace-nowrap flex items-center gap-1">Price <ChevronDown className="w-3 h-3" /></Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="rounded-t-3xl">
                <SheetHeader><SheetTitle>Price Range</SheetTitle></SheetHeader>
                <div className="py-6 space-y-6">
                  <div className="flex justify-between text-sm"><span>₹{priceRange[0]}</span><span>₹{priceRange[1]}</span></div>
                  <Slider value={priceRange} onValueChange={setPriceRange} max={50000} min={0} step={100} className="w-full" />
                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setPriceRange([0, 50000])}>Reset</Button>
                    <Button className="flex-1 rounded-xl" onClick={() => setIsPriceFilterOpen(false)}>Apply</Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {QUICK_FILTERS.map(filter => (
              <Button key={filter.id} variant={activeQuickFilters.includes(filter.id) ? "default" : "outline"}
                size="sm" className="rounded-full whitespace-nowrap text-xs" onClick={() => toggleQuickFilter(filter.id)}>
                {filter.icon} {filter.name}
              </Button>
            ))}
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className="w-20 min-h-screen bg-card border-r border-border py-2 flex-shrink-0 overflow-y-auto">
          {categories.map(cat => (
            <button key={cat.id} onClick={() => setSelectedCategory(cat.id)}
              className={`w-full flex flex-col items-center py-3 px-1 transition-colors ${selectedCategory === cat.id ? "bg-primary/10 border-l-2 border-primary" : "hover:bg-muted"}`}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${selectedCategory === cat.id ? "bg-primary/20" : "bg-muted"}`}>{cat.icon}</div>
              <span className="text-[10px] text-center mt-1 text-muted-foreground line-clamp-2 px-1">{cat.name}</span>
            </button>
          ))}
        </aside>

        <main className="flex-1 p-2 pb-24">
          {loading ? (
            <div className="grid grid-cols-2 gap-2">
              {[1,2,3,4].map(i => (
                <div key={i} className="bg-card rounded-xl overflow-hidden shadow-sm border border-border animate-pulse">
                  <div className="aspect-square bg-muted" /><div className="p-2 space-y-2"><div className="h-3 bg-muted rounded" /></div>
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Search className="w-12 h-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No products found</p>
              <p className="text-sm text-muted-foreground/70">Products from seller panel will appear here</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {filteredProducts.map(product => {
                const imgUrl = product.images?.[0] || "";
                return (
                  <div key={product.id}
                    className="bg-card rounded-xl overflow-hidden shadow-sm border border-border cursor-pointer flex flex-col"
                    onClick={() => navigate(`/product/${product.id}`)}>
                    {/* Fixed aspect ratio image container */}
                    <div className="relative aspect-square bg-muted flex-shrink-0">
                      {imgUrl ? <img src={imgUrl} alt={product.name} className="w-full h-full object-cover" loading="lazy" /> : <div className="w-full h-full flex items-center justify-center text-3xl">🛒</div>}
                      {product.discount && product.discount > 0 && (
                        <span className="absolute top-1.5 left-1.5 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: '#ec4899' }}>{product.discount}% OFF</span>
                      )}
                      <button
                        className={`absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-white/80 shadow-sm flex items-center justify-center ${isProductInWishlist(product.id) ? "text-red-500" : "text-muted-foreground"}`}
                        onClick={(e) => handleToggleWishlist(e, product)}>
                        <Heart className={`w-3.5 h-3.5 ${isProductInWishlist(product.id) ? "fill-current" : ""}`} />
                      </button>
                    </div>
                    {/* Fixed height text container */}
                    <div className="p-2 flex flex-col flex-1">
                      <h3 className="text-[12px] font-medium text-foreground line-clamp-2 leading-tight min-h-[32px]">{product.name}</h3>
                      <div className="flex items-center justify-between mt-auto pt-1.5">
                        <div className="flex items-baseline gap-1 min-w-0 flex-1">
                          <span className="text-[13px] font-bold text-foreground">₹{product.price}</span>
                          {product.original_price && product.original_price > product.price && (
                            <span className="text-[10px] text-muted-foreground line-through truncate">₹{product.original_price}</span>
                          )}
                        </div>
                        <button
                          className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ml-1"
                          style={{ backgroundColor: '#ec4899' }}
                          onClick={(e) => handleAddToCart(e, product)}>
                          <Plus className="w-3.5 h-3.5 text-white" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ProductListingScreen;
