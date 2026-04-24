import { useState, useEffect } from "react";
import sruvoLogo from "@/assets/sruvo-logo.png";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Heart, Loader2, ShoppingBag, Shield, Star } from "lucide-react";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signupSchema = loginSchema.extend({
  name: z.string().min(2, "Name must be at least 2 characters"),
});

const AuthBuyer = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();

        if (profile?.role === "buyer") {
          navigate("/buyer-dashboard");
        }
      }
    };
    checkSession();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const schema = isLogin ? loginSchema : signupSchema;
    const result = schema.safeParse(formData);
    
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) throw error;

        // Verify this is a buyer account
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .single();

        if (profile?.role !== "buyer") {
          await supabase.auth.signOut();
          toast.error("This is not a buyer account. Please use the correct login page.");
          return;
        }

        toast.success("Welcome back!");
        navigate("/buyer-dashboard");
      } else {
        const redirectUrl = `${window.location.origin}/`;
        
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              name: formData.name,
              role: "buyer"
            }
          }
        });

        if (error) throw error;

        if (data.user) {
          // Create buyer profile
          const { error: profileError } = await supabase
            .from("profiles")
            .insert({
              id: data.user.id,
              name: formData.name,
              email: formData.email,
              role: "buyer"
            });

          if (profileError && !profileError.message.includes("duplicate")) {
            throw profileError;
          }

          toast.success("Account created successfully!");
          navigate("/buyer-dashboard");
        }
      }
    } catch (error: any) {
      if (error.message.includes("User already registered")) {
        toast.error("This email is already registered. Please login instead.");
      } else if (error.message.includes("Invalid login credentials")) {
        toast.error("Invalid email or password");
      } else {
        toast.error(error.message || "Authentication failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-soft flex flex-col">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-1">
            <img src={sruvoLogo} alt="Sruvo" className="w-12 h-12 object-contain" />
            <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Sruvo
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <Card className="w-full max-w-md border-0 shadow-card animate-fade-in">
          <CardHeader className="text-center space-y-2">
            <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-2">
              <ShoppingBag className="w-8 h-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">
              {isLogin ? "Buyer Login" : "Create Buyer Account"}
            </CardTitle>
            <CardDescription>
              {isLogin
                ? "Sign in to browse and buy pets"
                : "Join PetLink to find your perfect companion"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Features Banner */}
            <div className="bg-blue-50 rounded-2xl p-4 mb-6">
              <div className="flex items-center gap-2 text-sm text-blue-700">
                <Shield className="w-4 h-4" />
                <span>Verified Sellers</span>
                <span className="mx-2">•</span>
                <Star className="w-4 h-4" />
                <span>Safe Transactions</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="rounded-2xl"
                  />
                  {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="buyer@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="rounded-2xl"
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
                  className="rounded-2xl"
                />
                {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
              </div>

              <Button
                type="submit"
                className="w-full rounded-2xl bg-gradient-primary hover:opacity-90"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isLogin ? "Signing in..." : "Creating account..."}
                  </>
                ) : (
                  isLogin ? "Sign In" : "Create Account"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setErrors({});
                }}
                className="text-sm text-primary hover:underline"
              >
                {isLogin
                  ? "Don't have an account? Sign up"
                  : "Already have an account? Sign in"}
              </button>
            </div>

            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground">
                Are you a breeder?{" "}
                <button
                  type="button"
                  onClick={() => navigate("/auth-breeder")}
                  className="text-primary hover:underline"
                >
                  Seller Login
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AuthBuyer;
