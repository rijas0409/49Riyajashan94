import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Share2, ShoppingCart, Star, Heart, ChevronRight, Plus, Shield, Zap, HeartPulse } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import BottomNavigation from "@/components/BottomNavigation";
import { Loader2 } from "lucide-react";

const BrandProfile = () => {
  const { brandName } = useParams<{ brandName: string }>();
  const navigate = useNavigate();
  const { addToCart, cartCount } = useCart();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All Products");

  const decodedBrand = decodeURIComponent(brandName || "");

  useEffect(() => {
    fetchBrandProducts();
  }, [brandName]);

  const fetchBrandProducts = async () => {
    if (!decodedBrand) return;
    try {
      const { data, error } = await supabase
        .from("shop_products")
        .select("id, name, brand, price, original_price, discount, images, pet_type, category, weight, unit, handling_time, total_sold, stock")
        .ilike("brand", decodedBrand)
        .eq("is_active", true)
        .eq("verification_status", "verified")
        .order("total_sold", { ascending: false });
      if (error) throw error;
      setProducts(data || []);
    } catch {
      toast.error("Failed to load brand products");
    } finally {
      setLoading(false);
    }
  };

  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category));
    return ["All Products", ...Array.from(cats)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (selectedCategory === "All Products") return products;
    return products.filter(p => p.category === selectedCategory);
  }, [products, selectedCategory]);

  const totalProducts = products.length;
  const petTypes = useMemo(() => [...new Set(products.map(p => p.pet_type))], [products]);
  const primaryPetType = petTypes[0] || "dog";

  const brandInitial = decodedBrand.charAt(0).toUpperCase();

  const handleShare = async () => {
    try {
      await navigator.share({ title: `${decodedBrand} - Pet Products`, url: window.location.href });
    } catch {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied!");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F7FC] pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#F0EFF5]">
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-[#F5F3FF] flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-[#111827]" />
          </button>
          <div className="flex items-center gap-3">
            <button onClick={handleShare} className="w-9 h-9 rounded-full bg-[#F5F3FF] flex items-center justify-center">
              <Share2 className="w-4 h-4 text-[#111827]" />
            </button>
            <button onClick={() => navigate("/cart")} className="relative w-9 h-9 rounded-full bg-[#F5F3FF] flex items-center justify-center">
              <ShoppingCart className="w-4 h-4 text-[#111827]" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#FF4D6D] text-white text-[10px] font-bold flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Brand Banner */}
      <div className="mx-4 mt-3 rounded-2xl overflow-hidden" style={{
        background: "linear-gradient(135deg, #1a1145 0%, #2d1b69 40%, #4c1d95 70%, #7c3aed 100%)",
        height: 140,
      }}>
        <div className="h-full flex items-center px-5">
          <div className="flex-1">
            <h1 className="text-white text-[28px] font-extrabold leading-tight">{decodedBrand}</h1>
            <p className="text-white/70 text-[13px] mt-1">Premium Pet Nutrition</p>
          </div>
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <span className="text-white text-[32px] font-black">{brandInitial}</span>
          </div>
        </div>
      </div>

      {/* Brand Info Card */}
      <div className="mx-4 -mt-3 relative z-10 bg-white rounded-2xl shadow-sm border border-[#F0EFF5] p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{
            background: "linear-gradient(135deg, #4c1d95, #7c3aed)",
          }}>
            <span className="text-white text-[20px] font-black">{brandInitial}</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              <h2 className="text-[18px] font-bold text-[#111827]">{decodedBrand}</h2>
              <div className="w-5 h-5 rounded-full bg-[#3B82F6] flex items-center justify-center">
                <span className="text-white text-[10px]">✓</span>
              </div>
            </div>
            <p className="text-[12px] text-[#9CA3AF]">
              <span className="text-[#9333EA] font-medium">Premium</span> {primaryPetType.charAt(0).toUpperCase() + primaryPetType.slice(1)} Nutrition • Vet Recommended
            </p>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#E5E7EB]">
            <Heart className="w-3.5 h-3.5 text-[#6B7280]" />
            <span className="text-[12px] font-medium text-[#6B7280]">Follow</span>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center">
            <div className="flex items-center justify-center gap-0.5">
              <span className="text-[16px] font-bold text-[#111827]">4.6</span>
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            </div>
            <p className="text-[10px] text-[#9CA3AF]">Rating</p>
          </div>
          <div className="text-center">
            <span className="text-[16px] font-bold text-[#111827]">{totalProducts}+</span>
            <p className="text-[10px] text-[#9CA3AF]">Products</p>
          </div>
          <div className="text-center">
            <span className="text-[16px] font-bold text-[#9333EA]">India's</span>
            <p className="text-[10px] text-[#9CA3AF]">#1 Brand</p>
          </div>
          <div className="text-center">
            <span className="text-[16px] font-bold text-[#111827]">Vet</span>
            <p className="text-[10px] text-[#9CA3AF]">Approved</p>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="px-4 mt-4 mb-3">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-[13px] font-semibold transition-all ${
                selectedCategory === cat
                  ? "bg-[#9333EA] text-white shadow-sm"
                  : "bg-white text-[#6B7280] border border-[#E5E7EB]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Products Section */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[16px] font-bold text-[#111827]">
            Explore {decodedBrand} Range
          </h3>
          <span className="text-[12px] text-[#9CA3AF]">{filteredProducts.length} products</span>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-12 text-[#9CA3AF]">
            <p className="text-[14px]">No products in this category yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredProducts.map(p => (
              <div
                key={p.id}
                onClick={() => navigate(`/product/${p.id}`)}
                className="bg-white rounded-2xl border border-[#F0EFF5] overflow-hidden cursor-pointer active:scale-[0.97] transition-transform"
              >
                <div className="relative bg-[#F9FAFB] aspect-square flex items-center justify-center p-3">
                  {p.images?.[0] ? (
                    <img src={p.images[0]} alt={p.name} className="max-w-full max-h-full object-contain" loading="lazy" />
                  ) : (
                    <div className="text-4xl">📦</div>
                  )}
                  <button
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 shadow-sm flex items-center justify-center"
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart({ id: p.id, name: p.name, price: p.price, image: p.images?.[0] || "" });
                      toast.success("Added to cart!");
                    }}
                  >
                    <Plus className="w-3.5 h-3.5 text-[#6B7280]" />
                  </button>
                </div>
                <div className="p-3">
                  <p className="text-[12px] font-medium text-[#111827] line-clamp-2 leading-tight min-h-[32px]">{p.name}</p>
                  <p className="text-[10px] text-[#9CA3AF] mt-0.5">
                    {p.weight || ""}{p.unit ? ` ${p.unit}` : ""} • {p.category}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span className="text-[11px] font-semibold text-[#111827]">4.6</span>
                  </div>
                  {p.discount > 0 && (
                    <span className="inline-block mt-1 text-[10px] font-bold text-[#9333EA] bg-[#F5F3FF] px-1.5 py-0.5 rounded">
                      {p.discount}% OFF
                    </span>
                  )}
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-[15px] font-bold text-[#111827]">₹{p.price}</span>
                    {p.original_price && p.original_price > p.price && (
                      <span className="text-[11px] text-[#9CA3AF] line-through">₹{p.original_price}</span>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart({ id: p.id, name: p.name, price: p.price, image: p.images?.[0] || "" });
                      toast.success("Added to cart!");
                    }}
                    className="w-full mt-2 py-1.5 rounded-xl border border-[#9333EA] text-[#9333EA] text-[12px] font-semibold active:scale-95 transition-transform"
                  >
                    Add
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Trust Banner */}
      <div className="mx-4 mt-6 rounded-2xl overflow-hidden" style={{
        background: "linear-gradient(135deg, #F5F3FF 0%, #FDF2F8 50%, #FFF7ED 100%)",
      }}>
        <div className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#F5F3FF] flex items-center justify-center">
            <Shield className="w-5 h-5 text-[#9333EA]" />
          </div>
          <div>
            <p className="text-[14px] font-bold text-[#111827]">Trusted by Pet Parents</p>
            <p className="text-[12px] text-[#9CA3AF]">Veterinarian Approved • Balanced Nutrition</p>
          </div>
        </div>
      </div>

      {/* Why Choose Brand */}
      <div className="px-4 mt-5 mb-6">
        <h3 className="text-[16px] font-bold text-[#111827] mb-3">Why Choose {decodedBrand}?</h3>
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: <HeartPulse className="w-5 h-5 text-[#EF4444]" />, bg: "#FEF2F2", title: "Quality Ingredients", sub: "High Protein" },
            { icon: <Zap className="w-5 h-5 text-[#F59E0B]" />, bg: "#FFFBEB", title: "Energy & Vitality", sub: "Omega & Zinc" },
            { icon: <Shield className="w-5 h-5 text-[#10B981]" />, bg: "#ECFDF5", title: "Vet Formulated", sub: "Safe & Tested" },
          ].map((item, i) => (
            <div key={i} className="bg-white rounded-xl p-3 border border-[#F0EFF5] text-center">
              <div className="w-9 h-9 rounded-full mx-auto flex items-center justify-center mb-2" style={{ background: item.bg }}>
                {item.icon}
              </div>
              <p className="text-[11px] font-semibold text-[#111827] leading-tight">{item.title}</p>
              <p className="text-[10px] text-[#9CA3AF] mt-0.5">{item.sub}</p>
            </div>
          ))}
        </div>
      </div>

      <BottomNavigation variant="buyer" />
    </div>
  );
};

export default BrandProfile;
