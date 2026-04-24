import { Sparkles, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";

interface RecommendedProductsProps {
  category: string;
  breed?: string;
  ageMonths?: number;
  size?: string;
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
  total_sold: number | null;
  views: number | null;
}

const mapCategoryToPetType = (category: string): string[] => {
  const map: Record<string, string[]> = {
    dog: ["dog"],
    cat: ["cat"],
    bird: ["birds", "bird"],
    rabbit: ["rabbit"],
    other: ["guinea-pig", "turtle", "hamster", "white-mouse", "other"],
  };
  return map[category] || [category];
};

const CATEGORY_DIVERSITY_ORDER = ["food", "toys", "pharmacy", "grooming", "treats", "bedding", "walking", "clothing", "accessories"];

const RecommendedProducts = ({ category, breed, ageMonths, size }: RecommendedProductsProps) => {
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecommendations();
  }, [category, breed, ageMonths]);

  const fetchRecommendations = async () => {
    try {
      const petTypes = mapCategoryToPetType(category);

      // Fetch all verified active products for this pet type
      let query = supabase
        .from("shop_products")
        .select("id, name, price, original_price, discount, brand, category, pet_type, images, total_sold, views")
        .eq("is_active", true)
        .eq("verification_status", "verified")
        .in("pet_type", petTypes)
        .limit(50);

      const { data, error } = await query;
      if (error) throw error;

      if (!data || data.length === 0) {
        // Fallback: get any popular products
        const { data: fallback } = await supabase
          .from("shop_products")
          .select("id, name, price, original_price, discount, brand, category, pet_type, images, total_sold, views")
          .eq("is_active", true)
          .eq("verification_status", "verified")
          .order("total_sold", { ascending: false })
          .limit(5);
        setProducts(fallback || []);
        setLoading(false);
        return;
      }

      // Score and rank products
      const scored = data.map((product) => {
        let score = 0;

        // Popularity boost
        score += (product.total_sold || 0) * 3;
        score += (product.views || 0) * 0.5;

        // Discount boost
        if (product.discount && product.discount > 10) score += product.discount * 0.5;

        // Life stage matching
        const lifeStage = (ageMonths || 12) < 6 ? "puppy" : (ageMonths || 12) < 24 ? "adult" : "senior";
        const nameLower = product.name.toLowerCase();
        if (lifeStage === "puppy" && (nameLower.includes("puppy") || nameLower.includes("kitten") || nameLower.includes("starter"))) {
          score += 20;
        }
        if (lifeStage === "senior" && (nameLower.includes("senior") || nameLower.includes("joint") || nameLower.includes("supplement"))) {
          score += 20;
        }

        // Size matching
        if (size) {
          const sizeLower = size.toLowerCase();
          if (nameLower.includes(sizeLower)) score += 15;
          if (sizeLower === "large" || sizeLower === "extra large") {
            if (nameLower.includes("large") || nameLower.includes("durable") || nameLower.includes("heavy")) score += 10;
          }
        }

        // Food category priority for nutrition
        if (product.category === "food") score += 10;

        return { ...product, score };
      });

      // Sort by score
      scored.sort((a, b) => b.score - a.score);

      // Ensure category diversity - pick from different categories
      const selected: ShopProduct[] = [];
      const usedCategories = new Set<string>();

      // First pass: pick best from each diverse category
      for (const cat of CATEGORY_DIVERSITY_ORDER) {
        if (selected.length >= 5) break;
        const match = scored.find((p) => p.category === cat && !usedCategories.has(p.category));
        if (match) {
          selected.push(match);
          usedCategories.add(match.category);
        }
      }

      // Fill remaining slots with top scored
      for (const p of scored) {
        if (selected.length >= 5) break;
        if (!selected.find((s) => s.id === p.id)) {
          selected.push(p);
        }
      }

      // Ensure minimum 4
      if (selected.length < 4) {
        for (const p of scored) {
          if (selected.length >= 4) break;
          if (!selected.find((s) => s.id === p.id)) selected.push(p);
        }
      }

      setProducts(selected.slice(0, 5));
    } catch (err) {
      console.error("Error fetching recommendations:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (p: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(p);

  if (loading) {
    return (
      <div className="px-5 py-4">
        <div className="flex items-center gap-1.5 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-[#A855F7]" />
          <span className="text-[9px] font-bold text-[#999] uppercase tracking-widest">AI CURATED</span>
        </div>
        <h3 className="font-bold text-[17px] text-[#151B32] mb-3">Recommended for this Pet</h3>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-5 px-5 scrollbar-hide">
          {[1, 2, 3].map((i) => (
            <div key={i} className="min-w-[140px] max-w-[140px] bg-white rounded-2xl border border-[#ECECEC] overflow-hidden shadow-sm flex-shrink-0 animate-pulse">
              <div className="aspect-square bg-[#F5F5F7]" />
              <div className="p-2.5 space-y-2">
                <div className="h-3 bg-[#F5F5F7] rounded w-full" />
                <div className="h-4 bg-[#F5F5F7] rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="px-5 py-4">
        <div className="flex items-center gap-1.5 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-[#A855F7]" />
          <span className="text-[9px] font-bold text-[#999] uppercase tracking-widest">AI CURATED</span>
        </div>
        <h3 className="font-bold text-[17px] text-[#151B32] mb-3">Recommended for this Pet</h3>
        <div className="rounded-2xl border border-[#ECECEC] bg-[#F9FAFB] p-6 text-center">
          <p className="text-sm text-[#999]">No product recommendations available yet.</p>
          <p className="text-xs text-[#BBB] mt-1">Products from the shop will appear here once listed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 py-4">
      <div className="flex items-center gap-1.5 mb-2">
        <Sparkles className="w-3.5 h-3.5 text-[#A855F7]" />
        <span className="text-[9px] font-bold text-[#999] uppercase tracking-widest">AI CURATED</span>
      </div>
      <h3 className="font-bold text-[17px] text-[#151B32] mb-3">Recommended for this Pet</h3>

      <div className="flex gap-3 overflow-x-auto pb-2 -mx-5 px-5 scrollbar-hide">
        {products.map((p) => {
          const imgUrl = p.images && p.images.length > 0 ? p.images[0] : null;
          return (
            <div key={p.id} className="min-w-[140px] max-w-[140px] bg-white rounded-2xl border border-[#ECECEC] overflow-hidden shadow-sm flex-shrink-0">
              <div className="aspect-square bg-[#F5F5F7] flex items-center justify-center text-4xl relative overflow-hidden">
                {imgUrl ? (
                  <img src={imgUrl} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl">🛒</span>
                )}
                {p.discount && p.discount > 0 && (
                  <span className="absolute top-1.5 left-1.5 bg-[#10B981] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                    -{p.discount}%
                  </span>
                )}
                <button className="absolute bottom-2 right-2 w-7 h-7 rounded-full bg-[#A855F7] flex items-center justify-center shadow">
                  <Plus className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
              <div className="p-2.5">
                <p className="text-[11px] font-semibold text-[#151B32] line-clamp-2 leading-tight">{p.name}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <p className="text-[13px] font-bold text-[#F472D0]">{formatPrice(p.price)}</p>
                  {p.original_price && p.original_price > p.price && (
                    <p className="text-[10px] text-[#999] line-through">{formatPrice(p.original_price)}</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecommendedProducts;
