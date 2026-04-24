import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface WishlistProduct {
  id: string;
  product_id: string;
  product_name: string;
  product_image: string | null;
  product_price: number | null;
  pet_type: string;
  created_at: string;
}

interface WishlistPet {
  id: string;
  pet_id: string;
  created_at: string;
}

export const useWishlist = () => {
  const [wishlistPets, setWishlistPets] = useState<WishlistPet[]>([]);
  const [wishlistProducts, setWishlistProducts] = useState<WishlistProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUserId(session.user.id);
        fetchWishlist(session.user.id);
      } else {
        setLoading(false);
      }
    };
    checkUser();
  }, []);

  const fetchWishlist = async (uid: string) => {
    try {
      const [petsRes, productsRes] = await Promise.all([
        supabase.from("wishlist_pets").select("*").eq("user_id", uid),
        supabase.from("wishlist_products").select("*").eq("user_id", uid)
      ]);

      if (petsRes.error) throw petsRes.error;
      if (productsRes.error) throw productsRes.error;

      setWishlistPets(petsRes.data || []);
      setWishlistProducts(productsRes.data || []);
    } catch (error) {
      console.error("Failed to fetch wishlist:", error);
    } finally {
      setLoading(false);
    }
  };

  const isPetInWishlist = useCallback((petId: string) => {
    return wishlistPets.some(w => w.pet_id === petId);
  }, [wishlistPets]);

  const isProductInWishlist = useCallback((productId: string) => {
    return wishlistProducts.some(w => w.product_id === productId);
  }, [wishlistProducts]);

  const togglePetWishlist = async (petId: string) => {
    if (!userId) {
      toast.error("Please login to add to wishlist");
      return;
    }

    // Verify profile exists before attempting wishlist operation
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .single();

    if (!profile) {
      toast.error("Please complete your profile first");
      return;
    }

    const isInWishlist = isPetInWishlist(petId);

    try {
      if (isInWishlist) {
        const { error } = await supabase
          .from("wishlist_pets")
          .delete()
          .eq("user_id", userId)
          .eq("pet_id", petId);
        
        if (error) throw error;
        setWishlistPets(prev => prev.filter(w => w.pet_id !== petId));
        toast.success("Removed from wishlist");
      } else {
        const { data, error } = await supabase
          .from("wishlist_pets")
          .insert({ user_id: userId, pet_id: petId })
          .select()
          .single();
        
        if (error) throw error;
        setWishlistPets(prev => [...prev, data]);
        toast.success("Added to wishlist");
      }
    } catch (error: any) {
      console.error("Wishlist pet error:", error);
      toast.error(error?.message || "Failed to update wishlist");
    }
  };

  const toggleProductWishlist = async (product: {
    id: string;
    name: string;
    image: string;
    price: number;
    petType: string;
  }) => {
    if (!userId) {
      toast.error("Please login to add to wishlist");
      return;
    }

    // Verify profile exists before attempting wishlist operation
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .single();

    if (!profile) {
      toast.error("Please complete your profile first");
      return;
    }

    const isInWishlist = isProductInWishlist(product.id);

    try {
      if (isInWishlist) {
        const { error } = await supabase
          .from("wishlist_products")
          .delete()
          .eq("user_id", userId)
          .eq("product_id", product.id);
        
        if (error) throw error;
        setWishlistProducts(prev => prev.filter(w => w.product_id !== product.id));
        toast.success("Removed from wishlist");
      } else {
        const { data, error } = await supabase
          .from("wishlist_products")
          .insert({
            user_id: userId,
            product_id: product.id,
            product_name: product.name,
            product_image: product.image,
            product_price: product.price,
            pet_type: product.petType
          })
          .select()
          .single();
        
        if (error) throw error;
        setWishlistProducts(prev => [...prev, data]);
        toast.success("Added to wishlist");
      }
    } catch (error: any) {
      console.error("Wishlist product error:", error);
      toast.error(error?.message || "Failed to update wishlist");
    }
  };

  const totalWishlistCount = wishlistPets.length + wishlistProducts.length;

  return {
    wishlistPets,
    wishlistProducts,
    loading,
    isPetInWishlist,
    isProductInWishlist,
    togglePetWishlist,
    toggleProductWishlist,
    totalWishlistCount,
    refetch: () => userId && fetchWishlist(userId)
  };
};
