import { useEffect, useState, useCallback } from "react";
import { useCart } from "@/contexts/CartContext";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWishlist } from "@/hooks/useWishlist";
import useBuyerActivityTracker from "@/hooks/useBuyerActivityTracker";
import PetImageHeader from "@/components/pet-details/PetImageHeader";
import PetInfoSection from "@/components/pet-details/PetInfoSection";
import AIInsightsCard from "@/components/pet-details/AIInsightsCard";
import KeyDetailsSection from "@/components/pet-details/KeyDetailsSection";
import HealthSafetySection from "@/components/pet-details/HealthSafetySection";
import RecommendedProducts from "@/components/pet-details/RecommendedProducts";
import DeliveryDetailsCard from "@/components/pet-details/DeliveryDetailsCard";
import PoliciesSection from "@/components/pet-details/PoliciesSection";
import SellerInfoCard from "@/components/pet-details/SellerInfoCard";
import BottomCTA from "@/components/pet-details/BottomCTA";
import BottomNavigation from "@/components/BottomNavigation";

interface Pet {
  id: string;
  name: string;
  breed: string;
  category: string;
  gender: string;
  age_months: number;
  price: number;
  original_price?: number | null;
  description: string | null;
  images: string[] | null;
  videos: string[] | null;
  city: string;
  state: string;
  location: string;
  vaccinated: boolean;
  microchip: string | null;
  medical_history: string | null;
  verification_status: string;
  color: string | null;
  is_featured: boolean;
  views: number;
  created_at: string;
  owner_id: string;
  bloodline?: string | null;
  registered_with?: string | null;
  birth_date?: string | null;
  age_type?: string | null;
  size?: string | null;
  weight_kg?: number | null;
  profiles?: {
    id: string;
    name: string;
    profile_photo: string | null;
    rating: number;
    is_breeder_verified: boolean;
  };
}

const PetDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [pet, setPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const { togglePetWishlist, isPetInWishlist } = useWishlist();
  const { addToCart } = useCart();

  const isInWishlist = isPetInWishlist(id || "");

  useBuyerActivityTracker({
    entityType: "pet",
    entityId: id,
    entityName: pet ? `${pet.name} (${pet.breed})` : undefined,
    entityImage: pet?.images?.[0] || undefined,
  });
  useEffect(() => {
    fetchPet();
    checkUser();
  }, [id]);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user || null);
  };

  const fetchPet = async () => {
    if (!id) return;
    try {
      const { data, error } = await supabase
        .from("pets")
        .select(`*, profiles:owner_id (id, name, profile_photo, rating, is_breeder_verified)`)
        .eq("id", id)
        .single();
      if (error) throw error;
      
      let petData = data;
      if (!data.profiles && data.owner_id) {
        const { data: sellerData } = await supabase.rpc("get_public_seller_info", { _seller_id: data.owner_id });
        if (sellerData && sellerData.length > 0) {
          petData = { ...data, profiles: sellerData[0] };
        }
      }
      
      setPet(petData as unknown as Pet);
      await supabase.from("pets").update({ views: (data.views || 0) + 1 }).eq("id", id);
    } catch {
      toast.error("Failed to load pet details");
      navigate("/buyer-dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({ title: `${pet?.breed} for sale`, text: `Check out this ${pet?.breed}!`, url: window.location.href });
    } catch {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied!");
    }
  };

  const handleWishlistToggle = () => {
    if (!user) { toast.info("Please login to add to wishlist"); navigate("/auth"); return; }
    if (pet) togglePetWishlist(pet.id);
  };

  const handleBuyNow = async () => {
    if (!user) { toast.info("Please login to purchase"); navigate("/auth"); return; }
    if (!pet) return;
    try {
      const { error } = await supabase.from("orders").insert({
        pet_id: pet.id,
        buyer_id: user.id,
        seller_id: pet.owner_id,
        amount: pet.price,
        status: "pending" as const,
      });
      if (error) throw error;
      toast.success("Order placed successfully!");
      navigate("/profile/bookings");
    } catch {
      toast.error("Failed to place order. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <p className="text-muted-foreground mb-4">Pet not found</p>
        <Button onClick={() => navigate("/buyer-dashboard")}>Go Back</Button>
      </div>
    );
  }

  const images = (pet.images || []).filter((url): url is string => typeof url === "string" && url.trim().length > 0);
  const videos = (pet.videos || []).filter((url): url is string => typeof url === "string" && url.trim().length > 0);

  // Ordered media: first image, first video, remaining videos, remaining images.
  const orderedMedia: { type: "image" | "video"; url: string }[] = [];

  if (images.length === 0) {
    videos.forEach((videoUrl) => orderedMedia.push({ type: "video", url: videoUrl }));
  } else {
    orderedMedia.push({ type: "image", url: images[0] });

    if (videos.length > 0) {
      orderedMedia.push({ type: "video", url: videos[0] });
      videos.slice(1).forEach((videoUrl) => orderedMedia.push({ type: "video", url: videoUrl }));
    }

    images.slice(1).forEach((imageUrl) => orderedMedia.push({ type: "image", url: imageUrl }));
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] pb-36">
      <PetImageHeader
        media={orderedMedia}
        isInWishlist={isInWishlist}
        onBack={() => navigate(-1)}
        onShare={handleShare}
        onWishlistToggle={handleWishlistToggle}
      />

      <PetInfoSection
        breed={pet.breed}
        name={pet.name}
        price={pet.price}
        originalPrice={pet.original_price ?? undefined}
        ageMonths={pet.age_months}
        gender={pet.gender}
        color={pet.color}
        vaccinated={pet.vaccinated}
        verificationStatus={pet.verification_status}
        isFeatured={pet.is_featured}
        bloodline={pet.bloodline || undefined}
        registeredWith={pet.registered_with || undefined}
        birthDate={pet.birth_date}
        ageType={pet.age_type}
        size={pet.size}
        createdAt={pet.created_at}
      />

      <div className="bg-white">
        <div className="py-3">
          <AIInsightsCard breed={pet.breed} category={pet.category} ageMonths={pet.age_months} gender={pet.gender} petId={pet.id} petImage={images[0]} />
        </div>

        <KeyDetailsSection vaccinated={pet.vaccinated} city={pet.city} state={pet.state} isVerified={pet.verification_status === "verified"} />

        <HealthSafetySection petId={pet.id} vaccinated={pet.vaccinated} />

        <RecommendedProducts category={pet.category} breed={pet.breed} ageMonths={pet.age_months} size={pet.size || undefined} />

        <DeliveryDetailsCard city={pet.city} state={pet.state} />

        <PoliciesSection />

        <SellerInfoCard seller={pet.profiles || null} />
      </div>

      <BottomCTA price={pet.price} onBuyNow={handleBuyNow} onAddToCart={() => {
        addToCart({
          id: pet.id,
          name: `${pet.name} (${pet.breed})`,
          price: pet.price,
          image: pet.images?.[0] || '/placeholder.svg',
        });
      }} />
      <BottomNavigation variant="buyer" />
    </div>
  );
};

export default PetDetails;
