import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Heart, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import BottomNavigation from "@/components/BottomNavigation";

interface WishlistPet {
  id: string;
  pet_id: string;
  created_at: string;
  pet?: {
    id: string;
    name: string;
    breed: string;
    price: number;
    images: string[];
    category: string;
  };
}

interface WishlistProduct {
  id: string;
  product_id: string;
  product_name: string;
  product_image: string | null;
  product_price: number | null;
  pet_type: string;
  created_at: string;
}

const Wishlist = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"pets" | "products">("pets");
  const [wishlistPets, setWishlistPets] = useState<WishlistPet[]>([]);
  const [wishlistProducts, setWishlistProducts] = useState<WishlistProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      const [petsRes, productsRes] = await Promise.all([
        supabase
          .from("wishlist_pets")
          .select(`*, pet:pet_id(id, name, breed, price, images, category)`)
          .eq("user_id", session.user.id),
        supabase
          .from("wishlist_products")
          .select("*")
          .eq("user_id", session.user.id)
      ]);

      if (petsRes.error) throw petsRes.error;
      if (productsRes.error) throw productsRes.error;

      setWishlistPets(petsRes.data || []);
      setWishlistProducts(productsRes.data || []);
    } catch (error) {
      toast.error("Failed to load wishlist");
    } finally {
      setLoading(false);
    }
  };

  const removePetFromWishlist = async (id: string) => {
    try {
      const { error } = await supabase
        .from("wishlist_pets")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
      setWishlistPets(prev => prev.filter(w => w.id !== id));
      toast.success("Removed from wishlist");
    } catch (error) {
      toast.error("Failed to remove from wishlist");
    }
  };

  const removeProductFromWishlist = async (id: string) => {
    try {
      const { error } = await supabase
        .from("wishlist_products")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
      setWishlistProducts(prev => prev.filter(w => w.id !== id));
      toast.success("Removed from wishlist");
    } catch (error) {
      toast.error("Failed to remove from wishlist");
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="flex items-center gap-3 px-4 py-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Heart className="w-5 h-5 text-destructive fill-destructive" />
            My Wishlist
          </h1>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab("pets")}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === "pets"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground"
            }`}
          >
            Pets ({wishlistPets.length})
          </button>
          <button
            onClick={() => setActiveTab("products")}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === "products"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground"
            }`}
          >
            Products ({wishlistProducts.length})
          </button>
        </div>
      </header>

      <div className="p-4">
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-48 bg-muted rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : activeTab === "pets" ? (
          wishlistPets.length === 0 ? (
            <div className="text-center py-12">
              <Heart className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">No pets in your wishlist</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => navigate("/buyer-dashboard")}
              >
                Browse Pets
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {wishlistPets.map((item) => (
                <div
                  key={item.id}
                  className="bg-card rounded-2xl overflow-hidden shadow-sm border border-border"
                >
                  <div className="relative aspect-square">
                    <img
                      src={item.pet?.images?.[0] || "/placeholder.svg"}
                      alt={item.pet?.name || "Pet"}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => removePetFromWishlist(item.id)}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </button>
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-sm truncate">{item.pet?.name}</h3>
                    <p className="text-xs text-muted-foreground">{item.pet?.breed}</p>
                    <p className="text-sm font-bold text-primary mt-1">
                      ₹{item.pet?.price?.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : wishlistProducts.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">No products in your wishlist</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => navigate("/shop")}
            >
              Browse Shop
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {wishlistProducts.map((item) => (
              <div
                key={item.id}
                className="bg-card rounded-2xl overflow-hidden shadow-sm border border-border"
              >
                <div className="relative aspect-square">
                  <img
                    src={item.product_image || "/placeholder.svg"}
                    alt={item.product_name}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => removeProductFromWishlist(item.id)}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </button>
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-sm truncate">{item.product_name}</h3>
                  <p className="text-xs text-muted-foreground capitalize">{item.pet_type}</p>
                  {item.product_price && (
                    <p className="text-sm font-bold text-primary mt-1">
                      ₹{item.product_price.toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNavigation variant="buyer" />
    </div>
  );
};

export default Wishlist;
