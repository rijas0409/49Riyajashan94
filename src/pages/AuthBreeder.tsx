import { useState, useEffect } from "react";
import sruvoLogo from "@/assets/sruvo-logo.png";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Heart, Loader2, Store, Shield, Award } from "lucide-react";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signupSchema = loginSchema.extend({
  name: z.string().min(2, "Name must be at least 2 characters"),
});

const AuthBreeder = () => {
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
          .select("role, is_onboarding_complete, is_admin_approved")
          .eq("id", session.user.id)
          .single();

        if (profile?.role === "seller") {
          if (!profile.is_onboarding_complete) {
            navigate("/seller-onboarding");
          } else if (!profile.is_admin_approved) {
            navigate("/seller-pending-approval");
          } else {
            navigate("/seller-dashboard");
          }
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

        // Verify this is a seller account
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, is_onboarding_complete, is_admin_approved")
          .eq("id", data.user.id)
          .single();

        if (profile?.role !== "seller") {
          await supabase.auth.signOut();
          toast.error("This is not a seller account. Please use the correct login page.");
          return;
        }

        toast.success("Welcome back!");
        
        if (!profile.is_onboarding_complete) {
          navigate("/seller-onboarding");
        } else if (!profile.is_admin_approved) {
          navigate("/seller-pending-approval");
        } else {
          navigate("/seller-dashboard");
        }
      } else {
        const redirectUrl = `${window.location.origin}/`;
        
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              name: formData.name,
              role: "seller"
            }
          }
        });

        if (error) throw error;

        if (data.user) {
          // Create seller profile
          const { error: profileError } = await supabase
            .from("profiles")
            .insert({
              id: data.user.id,
              name: formData.name,
              email: formData.email,
              role: "seller",
              is_onboarding_complete: false,
              is_admin_approved: false
            });

          if (profileError && !profileError.message.includes("duplicate")) {
            throw profileError;
          }

          toast.success("Account created! Please complete your seller profile.");
          navigate("/seller-onboarding");
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
            <div className="w-16 h-16 mx-auto bg-amber-100 rounded-full flex items-center justify-center mb-2">
              <Store className="w-8 h-8 text-amber-600" />
            </div>
            <CardTitle className="text-2xl">
              {isLogin ? "Breeder/Seller Login" : "Become a Seller"}
            </CardTitle>
            <CardDescription>
              {isLogin
                ? "Sign in to manage your pet listings"
                : "Join PetLink and start selling pets"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Features Banner */}
            <div className="bg-amber-50 rounded-2xl p-4 mb-6">
              <div className="flex items-center gap-2 text-sm text-amber-700">
                <Shield className="w-4 h-4" />
                <span>Verified Badge</span>
                <span className="mx-2">•</span>
                <Award className="w-4 h-4" />
                <span>Priority Listings</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="name">Business/Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your name or business name"
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
                  placeholder="seller@example.com"
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
                  isLogin ? "Sign In" : "Create Seller Account"
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
                Looking to buy pets?{" "}
                <button
                  type="button"
                  onClick={() => navigate("/auth-buyer")}
                  className="text-primary hover:underline"
                >
                  Buyer Login
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AuthBreeder;
