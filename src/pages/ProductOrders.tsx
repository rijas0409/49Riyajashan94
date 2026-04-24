import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ArrowLeft, Loader2, Clock, CheckCircle2, Truck, Package,
  XCircle, ShoppingBag, RotateCcw
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import BottomNavigation from "@/components/BottomNavigation";

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
  pending: { label: "Order Placed", color: "text-amber-700", icon: Clock, bg: "bg-amber-50" },
  confirmed: { label: "Confirmed", color: "text-blue-700", icon: CheckCircle2, bg: "bg-blue-50" },
  processing: { label: "Processing", color: "text-purple-700", icon: Package, bg: "bg-purple-50" },
  shipped: { label: "Shipped", color: "text-orange-700", icon: Truck, bg: "bg-orange-50" },
  delivered: { label: "Delivered", color: "text-green-700", icon: CheckCircle2, bg: "bg-green-50" },
  cancelled: { label: "Cancelled", color: "text-red-600", icon: XCircle, bg: "bg-red-50" },
  returned: { label: "Returned", color: "text-muted-foreground", icon: RotateCcw, bg: "bg-muted" },
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] pb-24">
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">My Orders</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-lg space-y-4">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
              <ShoppingBag className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold mb-2 text-foreground">No orders yet</h2>
            <p className="text-muted-foreground text-sm mb-6">Your product orders will appear here</p>
            <Button onClick={() => navigate("/shop")} className="rounded-2xl">
              Browse Shop
            </Button>
          </div>
        ) : (
          orders.map((order) => {
            const config = statusConfig[order.status] || statusConfig.pending;
            const StatusIcon = config.icon;
            const currentStep = getStepIndex(order.status);
            const isCancelled = order.status === "cancelled";
            const isReturned = order.status === "returned";
            const isDelivered = order.status === "delivered";

            return (
              <Card
                key={order.id}
                className="rounded-2xl border-0 shadow-sm overflow-hidden cursor-pointer active:scale-[0.99] transition-transform"
                onClick={() => navigate(`/product/${order.product_id}`)}
              >
                <div className="p-4 flex gap-3">
                  <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-muted">
                    <img
                      src={order.product_image || "/placeholder.svg"}
                      alt={order.product_name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <h3 className="font-bold text-[15px] text-foreground truncate pr-2">
                        {order.product_name}
                      </h3>
                      <p className="font-bold text-primary text-sm flex-shrink-0">
                        ₹{order.total_amount.toLocaleString("en-IN")}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Qty: {order.quantity} × ₹{order.product_price.toLocaleString("en-IN")}
                    </p>

                    <div className="flex items-center justify-between mt-2">
                      <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${config.bg}`}>
                        <StatusIcon className={`w-3 h-3 ${config.color}`} />
                        <span className={`text-[11px] font-semibold ${config.color}`}>{config.label}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">{formatDate(order.created_at)}</span>
                    </div>
                  </div>
                </div>

                {/* Progress tracker */}
                {!isCancelled && !isReturned && (
                  <div className="px-4 pb-4">
                    <div className="flex items-center gap-1">
                      {statusSteps.map((_, i) => (
                        <div key={i} className="flex-1">
                          <div
                            className={`h-1.5 w-full rounded-full transition-colors ${
                              i <= currentStep
                                ? isDelivered ? "bg-green-500" : "bg-primary"
                                : "bg-muted"
                            }`}
                          />
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between mt-1.5">
                      <span className="text-[9px] text-muted-foreground">Ordered</span>
                      <span className="text-[9px] text-muted-foreground">Delivered</span>
                    </div>
                  </div>
                )}
              </Card>
            );
          })
        )}
      </main>
      <BottomNavigation variant="buyer" />
    </div>
  );
};

export default ProductOrders;
