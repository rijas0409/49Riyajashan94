import { useEffect } from "react";
import sruvoLogo from "@/assets/sruvo-logo.png";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Heart, Sparkles, ShieldCheck, Truck } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data: roleData } = await supabase.rpc("get_user_role", { _user_id: session.user.id });

      switch (roleData) {
        case "seller":
          navigate("/seller-dashboard");
          break;
        case "admin":
          navigate("/admin");
          break;
        case "delivery_partner":
          navigate("/delivery");
          break;
        case "product_seller":
          navigate("/products-dashboard");
          break;
        case "vet":
          navigate("/vet-dashboard");
          break;
        default:
          navigate("/buyer-dashboard");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-soft">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="container mx-auto px-4 py-20 md:py-32">
          <div className="text-center space-y-8 animate-fade-in">
            <img src={sruvoLogo} alt="Sruvo" className="w-28 h-28 object-contain mb-6 mx-auto animate-bounce-subtle" />
            
            <h1 className="text-5xl md:text-7xl font-bold leading-tight">
              Find Your Perfect
              <br />
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Pet Companion
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              India's most trusted pet marketplace connecting buyers with verified sellers
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Button
                size="lg"
                className="bg-gradient-primary hover:opacity-90 rounded-2xl shadow-float text-lg px-8 py-6"
                onClick={() => navigate("/auth")}
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Get Started
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-2xl text-lg px-8 py-6"
                onClick={() => navigate("/auth")}
              >
                Become a Seller
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Choose <span className="text-primary">PetLink</span>?
            </h2>
            <p className="text-muted-foreground text-lg">
              Premium features designed for your pet journey
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center space-y-4 p-6 rounded-3xl bg-card shadow-card hover:shadow-float transition-shadow">
              <div className="w-16 h-16 bg-gradient-secondary rounded-2xl flex items-center justify-center mx-auto">
                <ShieldCheck className="w-8 h-8 text-foreground" />
              </div>
              <h3 className="text-xl font-semibold">Verified Pets</h3>
              <p className="text-muted-foreground">
                Every pet is verified with health certificates and documentation
              </p>
            </div>

            <div className="text-center space-y-4 p-6 rounded-3xl bg-card shadow-card hover:shadow-float transition-shadow">
              <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold">Trusted Sellers</h3>
              <p className="text-muted-foreground">
                Connect with verified breeders and trusted pet sellers
              </p>
            </div>

            <div className="text-center space-y-4 p-6 rounded-3xl bg-card shadow-card hover:shadow-float transition-shadow">
              <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center mx-auto">
                <Truck className="w-8 h-8 text-foreground" />
              </div>
              <h3 className="text-xl font-semibold">Safe Delivery</h3>
              <p className="text-muted-foreground">
                Pet-safe transport options available across India
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="bg-gradient-primary rounded-3xl p-12 text-center text-white shadow-float">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Find Your Perfect Pet?
            </h2>
            <p className="text-lg mb-8 opacity-90">
              Join thousands of happy pet owners and sellers on PetLink
            </p>
            <Button
              size="lg"
              className="bg-white text-primary hover:bg-white/90 rounded-2xl text-lg px-8 py-6"
              onClick={() => navigate("/auth")}
            >
              Start Your Journey
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2025 PetLink. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
