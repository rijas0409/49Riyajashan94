import { useEffect, useState } from "react";
import sruvoLogo from "@/assets/sruvo-logo.png";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Package, ShoppingBag, MessageCircle, Truck, DollarSign, Heart, Eye, Edit, Trash2, Megaphone, Clock, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";
import HeaderProfileDropdown from "@/components/HeaderProfileDropdown";
import PromotionModal from "@/components/PromotionModal";

type Pet = Database["public"]["Tables"]["pets"]["Row"];

const SellerDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPromotionModalOpen, setIsPromotionModalOpen] = useState(false);
  const [stats, setStats] = useState({
    totalListings: 0,
    activeOrders: 0,
    totalEarnings: 0,
    pendingPayouts: 0,
  });

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    // Check role from authoritative user_roles table
    const { data: roleData } = await supabase.rpc("get_user_role", { _user_id: session.user.id });

    if (roleData === "buyer") {
      navigate("/buyer-dashboard");
      return;
    }
    if (roleData === "admin") {
      navigate("/admin");
      return;
    }
    if (roleData === "delivery_partner") {
      navigate("/delivery");
      return;
    }
    if (roleData === "product_seller") {
      navigate("/products-dashboard");
      return;
    }
    if (roleData === "vet") {
      navigate("/vet-dashboard");
      return;
    }
    if (roleData !== "seller") {
      navigate("/auth");
      return;
    }

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    if (!profileData?.is_onboarding_complete) {
      navigate("/seller-onboarding");
      return;
    }

    if (!profileData?.is_admin_approved) {
      navigate("/seller-pending-approval");
      return;
    }

    setUser(session.user);
    setProfile(profileData);
    fetchData(session.user.id);
  };

  const fetchData = async (userId: string) => {
    setIsLoading(true);
    try {
      const { data: petsData, error: petsError } = await supabase
        .from("pets")
        .select("*")
        .eq("owner_id", userId)
        .order("created_at", { ascending: false });

      if (petsError) throw petsError;
      setPets(petsData || []);

      const [ordersResult, earningsResult] = await Promise.all([
        supabase
          .from("orders")
          .select("id", { count: "exact" })
          .eq("seller_id", userId)
          .in("status", ["pending", "accepted", "preparing", "ready", "picked"]),
        supabase
          .from("seller_earnings")
          .select("amount, net_amount, payout_status")
          .eq("seller_id", userId),
      ]);

      const totalEarnings = earningsResult.data?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
      const pendingPayouts = earningsResult.data
        ?.filter((e) => e.payout_status === "pending")
        .reduce((sum, e) => sum + Number(e.net_amount), 0) || 0;

      setStats({
        totalListings: petsData?.length || 0,
        activeOrders: ordersResult.count || 0,
        totalEarnings,
        pendingPayouts,
      });
    } catch (error: any) {
      toast.error("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePet = async (petId: string) => {
    if (!confirm("Are you sure you want to delete this listing?")) return;

    try {
      const { error } = await supabase
        .from("pets")
        .delete()
        .eq("id", petId);

      if (error) throw error;

      setPets(prev => prev.filter(p => p.id !== petId));
      toast.success("Listing deleted");
    } catch (error: any) {
      toast.error("Failed to delete listing");
    }
  };

  const getVerificationBadge = (status: string | null) => {
    switch (status) {
      case "verified":
        return <Badge className="bg-success/20 text-success">Verified</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const promotionPets = pets.map(p => ({
    id: p.id,
    name: p.name,
    breed: p.breed,
    image: p.images?.[0],
  }));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <img src={sruvoLogo} alt="Sruvo" className="w-12 h-12 object-contain" />
            <div>
              <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Sruvo
              </span>
              <p className="text-xs text-muted-foreground">Partner Panel</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
              onClick={() => navigate("/cart")}
            >
              <ShoppingCart className="w-5 h-5" />
            </button>
            <HeaderProfileDropdown />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-card">
            <CardHeader className="pb-3">
              <CardDescription>Total Listings</CardDescription>
              <CardTitle className="text-3xl">{stats.totalListings}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-success">
                <Package className="w-4 h-4" />
                <span>Active pets</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-card">
            <CardHeader className="pb-3">
              <CardDescription>Active Orders</CardDescription>
              <CardTitle className="text-3xl">{stats.activeOrders}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-primary">
                <ShoppingBag className="w-4 h-4" />
                <span>In progress</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-card">
            <CardHeader className="pb-3">
              <CardDescription>Total Earnings</CardDescription>
              <CardTitle className="text-3xl">₹{stats.totalEarnings.toFixed(0)}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-success">
                <DollarSign className="w-4 h-4" />
                <span>All time</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-card">
            <CardHeader className="pb-3">
              <CardDescription>Pending Payouts</CardDescription>
              <CardTitle className="text-3xl">₹{stats.pendingPayouts.toFixed(0)}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Truck className="w-4 h-4" />
                <span>Processing</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Button */}
        <div className="mb-8">
          <Button
            size="lg"
            className="w-full md:w-auto bg-gradient-primary hover:opacity-90 rounded-2xl shadow-float"
            onClick={() => navigate("/add-pet")}
          >
            <Plus className="w-5 h-5 mr-2" />
            Add New Pet
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="listings" className="space-y-6">
          <TabsList className="bg-muted/50 p-1 rounded-2xl flex-wrap h-auto">
            <TabsTrigger value="listings" className="rounded-xl">
              <Package className="w-4 h-4 mr-2" />
              Listings
            </TabsTrigger>
            <TabsTrigger value="orders" className="rounded-xl">
              <ShoppingBag className="w-4 h-4 mr-2" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="chats" className="rounded-xl">
              <MessageCircle className="w-4 h-4 mr-2" />
              Chats
            </TabsTrigger>
            <TabsTrigger value="transport" className="rounded-xl">
              <Truck className="w-4 h-4 mr-2" />
              Transport
            </TabsTrigger>
            <TabsTrigger value="promotions" className="rounded-xl">
              <Megaphone className="w-4 h-4 mr-2" />
              Promotions
            </TabsTrigger>
            <TabsTrigger value="earnings" className="rounded-xl">
              <DollarSign className="w-4 h-4 mr-2" />
              Earnings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="listings">
            <Card className="border-0 shadow-card">
              <CardHeader>
                <CardTitle>My Pet Listings</CardTitle>
                <CardDescription>Manage your active and pending listings</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-12 text-muted-foreground">Loading...</div>
                ) : pets.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    No listings yet. Click "Add New Pet" to get started.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {pets.map((pet) => (
                      <div
                        key={pet.id}
                        className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-card transition-shadow"
                      >
                        <div className="aspect-video relative">
                          {pet.images && pet.images[0] ? (
                            <img src={pet.images[0]} alt={pet.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-muted flex items-center justify-center">
                              <Package className="w-8 h-8 text-muted-foreground" />
                            </div>
                          )}
                          <div className="absolute top-2 right-2">
                            {getVerificationBadge(pet.verification_status)}
                          </div>
                          {pet.verification_status === "pending" && (
                            <div className="absolute bottom-2 left-2 right-2">
                              <p className="text-xs bg-black/70 text-white px-2 py-1 rounded-lg">
                                Verification takes 24-48 hours
                              </p>
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-semibold">{pet.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                {pet.breed} • {pet.age_months} months
                              </p>
                            </div>
                            <p className="font-bold text-primary">{formatPrice(Number(pet.price))}</p>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                            <Eye className="w-3 h-3" />
                            <span>{pet.views || 0} views</span>
                            <span>•</span>
                            <span>{pet.city}, {pet.state}</span>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 rounded-xl"
                              onClick={() => navigate(`/edit-pet/${pet.id}`)}
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-xl text-destructive hover:text-destructive"
                              onClick={() => handleDeletePet(pet.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders">
            <Card className="border-0 shadow-card">
              <CardHeader>
                <CardTitle>Order Management</CardTitle>
                <CardDescription>Track and manage your customer orders</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  No orders yet. Orders will appear here once customers buy your pets.
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chats">
            <Card className="border-0 shadow-card">
              <CardHeader>
                <CardTitle>Customer Chats</CardTitle>
                <CardDescription>Respond to buyer inquiries</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  No active chats. Messages from buyers will appear here.
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transport">
            <Card className="border-0 shadow-card">
              <CardHeader>
                <CardTitle>Transport Requests</CardTitle>
                <CardDescription>Manage pet delivery and transport</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  No transport requests yet.
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="promotions">
            <Card className="border-0 shadow-card">
              <CardHeader>
                <CardTitle>Promotions & Campaigns</CardTitle>
                <CardDescription>Boost your pet listings visibility</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Megaphone className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Promote Your Pets</h3>
                  <p className="text-muted-foreground mb-6">
                    Get more visibility for your pet listings with our promotion options
                  </p>
                  <Button 
                    className="rounded-2xl bg-gradient-primary"
                    onClick={() => setIsPromotionModalOpen(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Campaign
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="earnings">
            <Card className="border-0 shadow-card">
              <CardHeader>
                <CardTitle>Earnings & Payouts</CardTitle>
                <CardDescription>View your earnings history and pending payouts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  No earnings yet. Complete orders to start earning.
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Promotion Modal */}
      <PromotionModal
        isOpen={isPromotionModalOpen}
        onClose={() => setIsPromotionModalOpen(false)}
        pets={promotionPets}
        walletBalance={0}
        onLaunchCampaign={(data) => {
          toast.success("Campaign launched successfully!");
          setIsPromotionModalOpen(false);
        }}
      />
    </div>
  );
};

export default SellerDashboard;
