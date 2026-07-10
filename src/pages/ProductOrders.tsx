import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ArrowLeft, Loader2, Clock, CheckCircle2, Truck, Package,
  XCircle, ShoppingBag, RotateCcw, ShieldCheck, Sparkles
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ProductOrder {
  id: string;
  product_id: string;
  product_name: string;
  product_image: string | null;
  product_price: number;
  quantity: number;
  total_amount: number;
  status: string;
  created_at: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: any; bg: string }> = {
  pending: { label: "Order Placed", color: "text-amber-700 bg-amber-50/80 border-amber-100", icon: Clock, bg: "bg-amber-50" },
  confirmed: { label: "Confirmed", color: "text-blue-700 bg-blue-50/80 border-blue-100", icon: CheckCircle2, bg: "bg-blue-50" },
  processing: { label: "Processing", color: "text-purple-700 bg-purple-50/80 border-purple-100", icon: Package, bg: "bg-purple-50" },
  shipped: { label: "Shipped", color: "text-orange-700 bg-orange-50/80 border-orange-100", icon: Truck, bg: "bg-orange-50" },
  delivered: { label: "Delivered", color: "text-emerald-700 bg-emerald-50/80 border-emerald-100", icon: CheckCircle2, bg: "bg-emerald-50" },
  cancelled: { label: "Cancelled", color: "text-red-600 bg-red-50/80 border-red-100", icon: XCircle, bg: "bg-red-50" },
  returned: { label: "Returned", color: "text-muted-foreground bg-muted border-gray-200", icon: RotateCcw, bg: "bg-muted" },
};

const statusSteps = ["pending", "confirmed", "processing", "shipped", "delivered"];

const ProductOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<ProductOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { navigate("/auth"); return; }

      const { data, error } = await supabase
        .from("product_orders")
        .select("*")
        .eq("buyer_id", session.user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders((data as unknown as ProductOrder[]) || []);
    } catch {
      console.error("Failed to fetch product orders");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  const getStepIndex = (status: string) => {
    const idx = statusSteps.indexOf(status);
    return idx >= 0 ? idx : 0;
  };

  return (
    <div className="min-h-screen bg-[#faf8fc] pb-12 relative overflow-x-hidden">
      {/* Decorative Blur Blobs */}
      <div className="absolute top-0 right-0 w-[350px] h-[350px] bg-primary/5 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute top-40 left-0 w-[250px] h-[250px] bg-indigo-500/5 rounded-full blur-[60px] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-purple-100/60 shadow-[0_2px_15px_-3px_rgba(155,81,224,0.03)]">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between max-w-4xl">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full hover:bg-purple-50 transition-colors" 
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </Button>
            <div>
              <h1 className="text-lg font-bold bg-gradient-primary bg-clip-text text-transparent">My Product Orders</h1>
              <p className="text-[10px] text-muted-foreground font-medium">Track your premium pet essentials & accessories</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-lg space-y-5 relative">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center bg-white rounded-3xl border border-purple-100/60 p-6 shadow-sm">
            <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mb-4 border border-purple-100/40">
              <ShoppingBag className="w-7 h-7 text-primary" />
            </div>
            <h2 className="text-base font-bold text-gray-800">No orders placed yet</h2>
            <p className="text-xs text-muted-foreground mt-1.5 mb-6 max-w-xs">
              Explore our premium marketplace to find organic kibble, comfortable bedding, and elite toys for your pet.
            </p>
            <Button 
              onClick={() => navigate("/buyer/shop")} 
              className="rounded-full bg-gradient-primary hover:opacity-95 text-white text-xs font-bold px-6 shadow-md shadow-primary/20 h-10"
            >
              Browse Sruvo Shop
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const config = statusConfig[order.status] || statusConfig.pending;
              const StatusIcon = config.icon;
              const currentStep = getStepIndex(order.status);
              const isCancelled = order.status === "cancelled";
              const isReturned = order.status === "returned";
              const isDelivered = order.status === "delivered";

              return (
                <Card
                  key={order.id}
                  className="rounded-[24px] border border-purple-50 bg-white shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden cursor-pointer active:scale-[0.99]"
                  onClick={() => navigate(`/buyer/shop/product/${order.product_id}`)}
                >
                  <div className="p-4 flex gap-4">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 bg-purple-50 border border-purple-100/50">
                      <img
                        src={order.product_image || "/placeholder.svg"}
                        alt={order.product_name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-sm text-gray-800 truncate pr-1">
                          {order.product_name}
                        </h3>
                        <p className="font-extrabold text-primary text-sm flex-shrink-0 leading-none">
                          ₹{order.total_amount.toLocaleString("en-IN")}
                        </p>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1 font-semibold">
                        Qty: {order.quantity} × ₹{order.product_price.toLocaleString("en-IN")}
                      </p>

                      <div className="flex items-center justify-between mt-3">
                        <div className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full border ${config.color.includes("emerald") ? "border-emerald-100" : "border-purple-100/60"} ${config.bg}`}>
                          <StatusIcon className={`w-3.5 h-3.5 ${tx => tx.color}`} />
                          <span className={`text-[10px] font-bold ${config.color.split(" ")[0]}`}>{config.label}</span>
                        </div>
                        <span className="text-[10px] text-gray-400 font-semibold">{formatDate(order.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Elegant step tracker */}
                  {!isCancelled && !isReturned && (
                    <div className="px-4 pb-4 pt-1">
                      <div className="flex items-center gap-1.5">
                        {statusSteps.map((_, i) => (
                          <div key={i} className="flex-1">
                            <div
                              className={`h-1.5 w-full rounded-full transition-all duration-300 ${
                                i <= currentStep
                                  ? isDelivered ? "bg-emerald-500" : "bg-primary"
                                  : "bg-purple-100/50"
                              }`}
                            />
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between mt-1.5 px-0.5">
                        <span className="text-[9px] text-gray-400 font-semibold">Placed</span>
                        <span className="text-[9px] text-gray-400 font-semibold">Delivered</span>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}

        {/* Support note */}
        <div className="text-center pt-2">
          <p className="text-[11px] text-muted-foreground font-semibold flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            All Sruvo orders are fully tracked and support hassle-free returns.
          </p>
        </div>
      </main>
    </div>
  );
};

export default ProductOrders;
