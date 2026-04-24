// Sruvo Delivery Dashboard for Delivery Partners
import sruvoLogo from "@/assets/sruvo-logo.png";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Package,
  MapPin,
  Truck,
  CheckCircle2,
  Clock,
  Phone,
  User,
  LogOut,
  Home,
  Navigation,
  IndianRupee,
} from "lucide-react";

interface TransportRequest {
  id: string;
  order_id: string;
  pet_id: string;
  seller_id: string;
  buyer_id: string;
  pickup_address: string;
  delivery_address: string;
  distance_km: number | null;
  fee: number;
  status: string;
  created_at: string;
  pet?: {
    name: string;
    breed: string;
    images: string[];
  };
  seller?: {
    name: string;
    phone: string;
  };
  buyer?: {
    name: string;
    phone: string;
  };
}

const DeliveryDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [deliveries, setDeliveries] = useState<TransportRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("assigned");

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchDeliveries();
      setupRealtimeSubscription();
    }
  }, [user]);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data: userRole } = await supabase.rpc('get_user_role', { _user_id: session.user.id });
    
    if (userRole !== 'delivery_partner' && userRole !== 'admin') {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this dashboard.",
        variant: "destructive",
      });
      navigate("/");
      return;
    }

    setUser(session.user);
  };

  const fetchDeliveries = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("transport_requests")
      .select(`
        *,
        pet:pets(name, breed, images),
        seller:profiles!transport_requests_seller_id_fkey(name, phone),
        buyer:profiles!transport_requests_buyer_id_fkey(name, phone)
      `)
      .eq("assigned_partner_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching deliveries:", error);
      toast({
        title: "Error",
        description: "Failed to load deliveries",
        variant: "destructive",
      });
    } else {
      setDeliveries(data || []);
    }
    setLoading(false);
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('delivery-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transport_requests',
          filter: `assigned_partner_id=eq.${user.id}`
        },
        () => {
          fetchDeliveries();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const updateStatus = async (requestId: string, newStatus: "requested" | "assigned" | "picked" | "delivered" | "completed" | "cancelled") => {
    const { error } = await supabase
      .from("transport_requests")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", requestId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Status Updated",
        description: `Delivery marked as ${newStatus}`,
      });
      fetchDeliveries();
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; label: string }> = {
      requested: { color: "bg-yellow-100 text-yellow-800", label: "Requested" },
      assigned: { color: "bg-blue-100 text-blue-800", label: "Assigned" },
      picked: { color: "bg-purple-100 text-purple-800", label: "Picked Up" },
      delivered: { color: "bg-green-100 text-green-800", label: "Delivered" },
      completed: { color: "bg-emerald-100 text-emerald-800", label: "Completed" },
      cancelled: { color: "bg-red-100 text-red-800", label: "Cancelled" },
    };
    const config = statusConfig[status] || statusConfig.requested;
    return <Badge className={`${config.color} border-0`}>{config.label}</Badge>;
  };

  const filterDeliveries = (status: string): TransportRequest[] => {
    if (status === "all") return deliveries;
    if (status === "active") return deliveries.filter(d => ["assigned", "picked"].includes(d.status));
    return deliveries.filter(d => d.status === status);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-soft flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-soft pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <img src={sruvoLogo} alt="Sruvo" className="w-12 h-12 object-contain" />
              <div>
                <h1 className="font-bold text-lg">Sruvo Delivery</h1>
                <p className="text-xs text-muted-foreground">Partner Dashboard</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="rounded-2xl shadow-card border-0">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{filterDeliveries("assigned").length}</p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="rounded-2xl shadow-card border-0">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Package className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{filterDeliveries("picked").length}</p>
                  <p className="text-xs text-muted-foreground">In Transit</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="rounded-2xl shadow-card border-0">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{filterDeliveries("delivered").length}</p>
                  <p className="text-xs text-muted-foreground">Delivered</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="rounded-2xl shadow-card border-0">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <IndianRupee className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {formatPrice(deliveries.filter(d => d.status === "delivered" || d.status === "completed").reduce((sum, d) => sum + (d.fee || 0), 0))}
                  </p>
                  <p className="text-xs text-muted-foreground">Earned</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Deliveries Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full bg-muted/50 rounded-2xl p-1 mb-6">
            <TabsTrigger value="assigned" className="flex-1 rounded-xl">Pending</TabsTrigger>
            <TabsTrigger value="picked" className="flex-1 rounded-xl">In Transit</TabsTrigger>
            <TabsTrigger value="delivered" className="flex-1 rounded-xl">Completed</TabsTrigger>
          </TabsList>

          {["assigned", "picked", "delivered"].map((tab) => (
            <TabsContent key={tab} value={tab} className="space-y-4">
              {filterDeliveries(tab).length === 0 ? (
                <Card className="rounded-2xl shadow-card border-0">
                  <CardContent className="p-8 text-center">
                    <Truck className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">No {tab} deliveries</p>
                  </CardContent>
                </Card>
              ) : (
                filterDeliveries(tab).map((delivery) => (
                  <Card key={delivery.id} className="rounded-2xl shadow-card border-0 overflow-hidden">
                    <CardContent className="p-0">
                      {/* Pet Info Header */}
                      <div className="flex items-center gap-4 p-4 bg-muted/30">
                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted">
                          {delivery.pet?.images?.[0] ? (
                            <img
                              src={delivery.pet.images[0]}
                              alt={delivery.pet.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-6 h-6 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold">{delivery.pet?.name || "Pet"}</h3>
                            {getStatusBadge(delivery.status)}
                          </div>
                          <p className="text-sm text-muted-foreground">{delivery.pet?.breed}</p>
                          <p className="text-sm font-medium text-primary">{formatPrice(delivery.fee)}</p>
                        </div>
                      </div>

                      {/* Addresses */}
                      <div className="p-4 space-y-4">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <MapPin className="w-4 h-4 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">Pickup</p>
                            <p className="text-sm font-medium">{delivery.seller?.name}</p>
                            <p className="text-sm text-muted-foreground">{delivery.pickup_address}</p>
                            {delivery.seller?.phone && (
                              <a href={`tel:${delivery.seller.phone}`} className="inline-flex items-center gap-1 text-xs text-primary mt-1">
                                <Phone className="w-3 h-3" /> {delivery.seller.phone}
                              </a>
                            )}
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Navigation className="w-4 h-4 text-primary" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">Delivery</p>
                            <p className="text-sm font-medium">{delivery.buyer?.name}</p>
                            <p className="text-sm text-muted-foreground">{delivery.delivery_address}</p>
                            {delivery.buyer?.phone && (
                              <a href={`tel:${delivery.buyer.phone}`} className="inline-flex items-center gap-1 text-xs text-primary mt-1">
                                <Phone className="w-3 h-3" /> {delivery.buyer.phone}
                              </a>
                            )}
                          </div>
                        </div>

                        {delivery.distance_km && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-xl px-3 py-2">
                            <Truck className="w-4 h-4" />
                            <span>Distance: {delivery.distance_km} km</span>
                          </div>
                        )}

                        {/* Action Buttons */}
                        {delivery.status === "assigned" && (
                          <Button
                            className="w-full bg-gradient-primary rounded-xl"
                            onClick={() => updateStatus(delivery.id, "picked")}
                          >
                            <Package className="w-4 h-4 mr-2" />
                            Mark as Picked Up
                          </Button>
                        )}
                        {delivery.status === "picked" && (
                          <Button
                            className="w-full bg-green-500 hover:bg-green-600 rounded-xl"
                            onClick={() => updateStatus(delivery.id, "delivered")}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Mark as Delivered
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border z-50">
        <div className="flex items-center justify-around py-3">
          <button className="flex flex-col items-center gap-1 text-primary">
            <Truck className="w-6 h-6" />
            <span className="text-xs font-medium">Deliveries</span>
          </button>
          <button 
            className="flex flex-col items-center gap-1 text-muted-foreground"
            onClick={() => navigate("/")}
          >
            <Home className="w-6 h-6" />
            <span className="text-xs">Home</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-muted-foreground">
            <User className="w-6 h-6" />
            <span className="text-xs">Profile</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default DeliveryDashboard;