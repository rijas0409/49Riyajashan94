import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Truck, Loader2, MapPin, Package } from "lucide-react";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signupSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  phone: z.string().trim().min(10, "Phone number must be at least 10 digits"),
});

const AuthDelivery = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    phone: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    try {
      const schema = isLogin ? loginSchema : signupSchema;
      const validationResult = schema.safeParse(formData);
      
      if (!validationResult.success) {
        const fieldErrors: Record<string, string> = {};
        validationResult.error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
        setIsLoading(false);
        return;
      }

      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email.trim(),
          password: formData.password,
        });

        if (error) throw error;

        // Check if user is a delivery partner
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.user.id)
          .eq("role", "delivery_partner")
          .single();

        if (!roleData) {
          await supabase.auth.signOut();
          toast.error("This account is not registered as a delivery partner");
          setIsLoading(false);
          return;
        }
        
        toast.success("Welcome back, Delivery Partner!");
        navigate("/delivery");
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: formData.email.trim(),
          password: formData.password,
          options: {
            emailRedirectTo: `${window.location.origin}/delivery`,
            data: {
              name: formData.name.trim(),
              role: "delivery_partner",
              phone: formData.phone,
            },
          },
        });

        if (error) throw error;

        toast.success("Account created! Welcome to Sruvo Delivery");
        navigate("/delivery");
      }
    } catch (error: any) {
      if (error.message?.includes("User already registered")) {
        toast.error("This email is already registered. Please sign in instead.");
      } else {
        toast.error(error.message || "An error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-soft flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 animate-fade-in">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl shadow-float mb-4">
            <Truck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-emerald-600">
            Sruvo Delivery
          </h1>
          <p className="text-muted-foreground">Delivery Partner Portal</p>
        </div>

        {/* Features Banner */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-2xl">
            <MapPin className="w-5 h-5 text-emerald-600" />
            <span className="text-sm text-emerald-800">Live Tracking</span>
          </div>
          <div className="flex items-center gap-2 p-3 bg-teal-50 rounded-2xl">
            <Package className="w-5 h-5 text-teal-600" />
            <span className="text-sm text-teal-800">Pet Delivery</span>
          </div>
        </div>

        <Card className="border-0 shadow-card">
          <CardHeader>
            <CardTitle>{isLogin ? "Partner Login" : "Join as Delivery Partner"}</CardTitle>
            <CardDescription>
              {isLogin
                ? "Sign in to manage your deliveries"
                : "Register to start delivering pets safely"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Your full name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required={!isLogin}
                      className={`rounded-2xl ${errors.name ? 'border-destructive' : ''}`}
                    />
                    {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+91 9876543210"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required={!isLogin}
                      className={`rounded-2xl ${errors.phone ? 'border-destructive' : ''}`}
                    />
                    {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className={`rounded-2xl ${errors.email ? 'border-destructive' : ''}`}
                />
                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  className={`rounded-2xl ${errors.password ? 'border-destructive' : ''}`}
                />
                {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
              </div>

              <Button
                type="submit"
                className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-90 transition-opacity"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Please wait...
                  </>
                ) : (
                  <>{isLogin ? "Sign In" : "Register as Partner"}</>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-emerald-600 hover:underline"
              >
                {isLogin
                  ? "New delivery partner? Register here"
                  : "Already registered? Sign in"}
              </button>
            </div>

            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs text-center text-muted-foreground">
                Looking for buyer/seller login?{" "}
                <button
                  type="button"
                  onClick={() => navigate("/auth-buyer")}
                  className="text-primary hover:underline"
                >
                  Click here
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthDelivery;
