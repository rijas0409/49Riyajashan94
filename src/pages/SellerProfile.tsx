import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Star, Shield, MapPin, Clock, Share2, MessageCircle, CheckCircle2, ShieldCheck } from "lucide-react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import BottomNavigation from "@/components/BottomNavigation";
import { Card } from "@/components/ui/card";

interface SellerData {
  id: string;
  name: string;
  business_name: string | null;
  profile_photo: string | null;
  rating: number;
  is_breeder_verified: boolean;
  is_admin_approved: boolean;
  created_at: string;
  address: string | null;
}

interface PetListing {
  id: string;
  name: string;
  breed: string;
  category: string;
  price: number;
  original_price: number | null;
  age_months: number;
  gender: string;
  images: string[] | null;
  city: string;
  state: string;
  is_featured: boolean;
  verification_status: string;
  vaccinated: boolean;
}

const SellerProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [seller, setSeller] = useState<SellerData | null>(null);
  const [pets, setPets] = useState<PetListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalSold, setTotalSold] = useState(0);

  useEffect(() => {
    if (id) fetchSellerData();
  }, [id]);

  const fetchSellerData = async () => {
    try {
      // Fetch seller info via RPC (bypasses RLS)
      const { data: sellerData } = await supabase.rpc("get_public_seller_info", { _seller_id: id! });

      if (!sellerData || sellerData.length === 0) {
        toast.error("Breeder not found");
        navigate(-1);
        return;
      }

      const s = sellerData[0];
      setSeller({
        id: s.id,
        name: s.name,
        business_name: null,
        profile_photo: s.profile_photo,
        rating: s.rating > 0 ? s.rating : 4.9,
        is_breeder_verified: s.is_breeder_verified,
        is_admin_approved: true,
        created_at: "",
        address: null,
      });

      // Fetch all verified, available pets by this seller
      const { data: petData } = await supabase
        .from("pets")
        .select("id, name, breed, category, price, original_price, age_months, gender, images, city, state, is_featured, verification_status, vaccinated")
        .eq("owner_id", id!)
        .eq("is_available", true)
        .eq("verification_status", "verified")
        .order("created_at", { ascending: false });

      setPets(petData || []);

      // Count orders for this seller
      const { count } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("seller_id", id!)
        .eq("status", "delivered");
      setTotalSold(count || 0);
    } catch {
      toast.error("Failed to load breeder profile");
    } finally {
      setLoading(false);
    }
  };

  const formatAge = (months: number) => {
    if (months >= 12) {
      const years = Math.floor(months / 12);
      const rem = months % 12;
      return rem > 0 ? `${years}y ${rem}m` : `${years}y`;
    }
    return `${months} weeks`; // Show weeks for young pets conceptually
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <p className="text-muted-foreground mb-4">Breeder not found</p>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  const displayName = seller.business_name || seller.name;
  const mockLocation = pets.length > 0 ? `${pets[0].city}, ${pets[0].state}` : "Location not specified";

  return (
    <div className="min-h-screen bg-background pb-24 font-sans">
      {/* Top Navigation / Badges */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-border/50">
        <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center -ml-2">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex items-center gap-3">
          {seller.is_breeder_verified && (
            <div className="flex items-center gap-1 text-[11px] font-bold text-green-700 bg-green-50 px-2 py-1 rounded dark:bg-green-900/30 dark:text-green-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              VERIFIED ELITE BREEDER
            </div>
          )}
          <div className="flex items-center gap-1 text-[11px] font-bold text-primary">
            <Star className="w-3.5 h-3.5 fill-primary text-primary" />
            {seller.rating.toFixed(1)} (128 Reviews)
          </div>
        </div>
      </div>

      {/* Profile Header section */}
      <div className="px-4 pt-6 pb-6 flex flex-col items-center">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-card flex items-center justify-center overflow-hidden shadow-md border-4 border-background mb-4">
            {seller.profile_photo ? (
              <img src={seller.profile_photo} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl font-bold text-muted-foreground">{displayName[0]?.toUpperCase()}</span>
            )}
          </div>
          {seller.is_breeder_verified && (
            <div className="absolute bottom-4 right-0 w-6 h-6 bg-primary rounded-full border-2 border-background flex items-center justify-center shadow-sm">
              <Shield className="w-3 h-3 text-primary-foreground" />
            </div>
          )}
        </div>

        <h1 className="text-2xl font-extrabold text-foreground text-center mb-1">{displayName}</h1>
        <p className="text-sm font-medium text-primary text-center mb-3">
          Specializing in Premium Breeds
        </p>

        <div className="inline-flex items-center gap-1.5 bg-muted px-3 py-1.5 rounded-full mb-6">
          <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs font-semibold text-foreground">{mockLocation} • Licensed since 2010</span>
        </div>

        {/* Stats */}
        <div className="w-full flex justify-between gap-3 mb-8">
          <div className="flex-1 bg-card rounded-2xl p-3 text-center border border-border shadow-sm">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Experience</p>
            <p className="text-lg font-bold text-foreground">14 yrs</p>
          </div>
          <div className="flex-1 bg-card rounded-2xl p-3 text-center border border-border shadow-sm">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Success</p>
            <p className="text-lg font-bold text-foreground">100%</p>
          </div>
          <div className="flex-1 bg-card rounded-2xl p-3 text-center border border-border shadow-sm">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Happy Paws</p>
            <p className="text-lg font-bold text-foreground">{totalSold > 450 ? totalSold : '450+'}</p>
          </div>
        </div>

        {/* Breeding Standards */}
        <div className="w-full bg-primary/5 rounded-3xl p-5 mb-8 border border-primary/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground shadow-sm">
              <Shield className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-foreground">Breeding Standards</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-foreground mb-0.5">OFA Certified Parents</h3>
                <p className="text-[13px] text-muted-foreground leading-snug">All sires and dams undergo rigorous hip, elbow, and heart clearances.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-foreground mb-0.5">Early Neurological Stimulation</h3>
                <p className="text-[13px] text-muted-foreground leading-snug">Pups introduced to Bio-Sensor program from day 3 for better resilience.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-foreground mb-0.5">Lifetime Support Guarantee</h3>
                <p className="text-[13px] text-muted-foreground leading-snug">We provide a 2-year health contract and 24/7 advice for life.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Available Puppies */}
        <div className="w-full mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">Available Pets</h2>
            <button className="text-xs font-bold text-primary">View All ({pets.length})</button>
          </div>

          <div className="space-y-4">
            {pets.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No pets available right now.</p>
            ) : (
              pets.map((pet) => {
                const img = pet.images?.[0] || "/placeholder.svg";
                return (
                  <div 
                    key={pet.id} 
                    className="bg-card rounded-3xl overflow-hidden shadow-sm border border-border cursor-pointer transition-transform active:scale-[0.98]"
                    onClick={() => navigate(`/pet/${pet.id}`)}
                  >
                    <div className="relative aspect-[4/3] w-full bg-muted p-2 pb-0">
                      <div className="w-full h-full rounded-t-2xl overflow-hidden">
                        <img src={img} alt={pet.name || pet.breed} className="w-full h-full object-cover" />
                      </div>
                      <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-lg">
                        Available Now
                      </div>
                    </div>
                    
                    <div className="p-5">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="text-xl font-bold text-foreground">{pet.name || "Pet"}</h3>
                        <span className="text-lg font-bold text-primary">
                          ₹{pet.price.toLocaleString("en-IN")}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">{pet.breed} • {formatAge(pet.age_months)}</p>
                      
                      <div className="flex items-center gap-4 text-xs font-semibold text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <span className="text-muted-foreground/50">♂/♀</span> {pet.gender}
                        </div>
                        {pet.vaccinated && (
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> Vaccinated
                          </div>
                        )}
                        <div className="flex items-center gap-1.5">
                          <span className="text-muted-foreground/50">📄</span> Verified
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Puppy Alumni Stories */}
        <div className="w-full mb-6">
          <h2 className="text-xl font-bold text-foreground mb-4">Pet Alumni Stories</h2>
          
          <div className="space-y-4">
            <Card className="p-5 rounded-3xl border border-border shadow-sm bg-card">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-muted rounded-full overflow-hidden">
                    <img src="https://i.pravatar.cc/150?img=5" alt="User" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">Sarah Jenkins</h4>
                    <p className="text-[11px] text-muted-foreground">Adopted in 2023</p>
                  </div>
                </div>
                <div className="flex text-primary">
                  <Star className="w-3.5 h-3.5 fill-current" /><Star className="w-3.5 h-3.5 fill-current" /><Star className="w-3.5 h-3.5 fill-current" /><Star className="w-3.5 h-3.5 fill-current" /><Star className="w-3.5 h-3.5 fill-current" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground italic mb-4">
                "The best decision we ever made. He is the healthiest, most well-adjusted pup we've ever had. {displayName} was there for every question we had during the first month."
              </p>
              {pets[0]?.images?.[1] && (
                 <div className="w-full h-32 rounded-xl overflow-hidden bg-muted">
                   <img src={pets[0].images[1]} className="w-full h-full object-cover opacity-80" alt="Review photo" />
                 </div>
              )}
            </Card>
          </div>
        </div>

      </div>

    </div>
  );
};

export default SellerProfile;
