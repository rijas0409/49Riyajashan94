import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Minus, Plus, Trash2, ShoppingBag, Loader2 } from "lucide-react";
import BottomNavigation from "@/components/BottomNavigation";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Cart = () => {
  const navigate = useNavigate();
  const { cartItems, updateQuantity, removeItem, clearCart } = useCart();
  const [checkingOut, setCheckingOut] = useState(false);

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = cartItems.length > 0 ? 49 : 0;
  const total = subtotal + deliveryFee;

  const handleCheckout = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      toast.info("Please login to checkout");
      navigate("/auth");
      return;
    }

    setCheckingOut(true);
    try {
      let hasPetOrders = false;
      let hasProductOrders = false;

      const orderPromises = cartItems.map(async (item) => {
        // Check if this is a pet
        const { data: pet } = await supabase
          .from("pets")
          .select("id, owner_id, price")
          .eq("id", item.id)
          .single();

        if (pet) {
          hasPetOrders = true;
          return supabase.from("orders").insert({
            pet_id: pet.id,
            buyer_id: session.user.id,
            seller_id: pet.owner_id,
            amount: pet.price * item.quantity,
            status: "pending" as const,
          });
        }

        // Check if this is a product
        const { data: product } = await supabase
          .from("shop_products")
          .select("id, name, images, price")
          .eq("id", item.id)
          .single();

        if (product) {
          hasProductOrders = true;
          return supabase.from("product_orders").insert({
            buyer_id: session.user.id,
            product_id: product.id,
            product_name: product.name,
            product_image: product.images?.[0] || null,
            product_price: product.price,
            quantity: item.quantity,
            total_amount: product.price * item.quantity,
            status: "pending",
          });
        }

        return null;
      });

      await Promise.all(orderPromises);
      clearCart();
      toast.success("Order placed successfully!");
      // Navigate to product orders if only products, otherwise bookings
      navigate(hasProductOrders && !hasPetOrders ? "/profile/orders" : "/profile/bookings");
    } catch {
      toast.error("Failed to checkout. Please try again.");
    } finally {
      setCheckingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">My Cart</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-lg">
        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
              <ShoppingBag className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground mb-6">Browse our shop and add items to your cart</p>
            <Button onClick={() => navigate("/shop")} className="rounded-2xl">
              Browse Shop
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {cartItems.map((item) => (
              <Card key={item.id} className="p-4 rounded-2xl border-0 shadow-sm">
                <div className="flex gap-4">
                  <div className="w-20 h-20 bg-muted rounded-xl overflow-hidden flex-shrink-0">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{item.name}</h3>
                    <p className="text-primary font-bold mt-1">₹{item.price.toLocaleString("en-IN")}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center"
                      >
                        <Plus className="w-4 h-4 text-primary" />
                      </button>
                    </div>
                  </div>
                  <button onClick={() => removeItem(item.id)} className="text-destructive self-start">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </Card>
            ))}

            <Card className="p-4 rounded-2xl border-0 shadow-sm space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>₹{subtotal.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Delivery Fee</span>
                <span>₹{deliveryFee}</span>
              </div>
              <div className="border-t border-border pt-3 flex justify-between font-bold">
                <span>Total</span>
                <span className="text-primary">₹{total.toLocaleString("en-IN")}</span>
              </div>
            </Card>

            <Button
              className="w-full rounded-2xl h-12 text-base font-semibold"
              onClick={handleCheckout}
              disabled={checkingOut}
            >
              {checkingOut ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Placing Order...</>
              ) : (
                "Proceed to Checkout"
              )}
            </Button>
          </div>
        )}
      </main>
      <BottomNavigation />
    </div>
  );
};

export default Cart;
