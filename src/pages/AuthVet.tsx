import { useState, useEffect } from "react";
import { SRUVO_LOGO_URL } from "@/constants/branding";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Heart, Loader2, Stethoscope, Shield, Award } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signupSchema = loginSchema.extend({
  name: z.string().min(2, "Name must be at least 2 characters"),
});

const AuthVet = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "", name: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { authReady, user, profile } = useAuth();

  useEffect(() => {
    // Only perform auto-redirect if we are explicitly on the auth page
    if (window.location.pathname !== "/auth/vet") return;

    if (authReady && user && profile?.role === "vet") {
      if (profile.is_onboarding_complete === false) {
        navigate("/vet/onboarding");
      } else if (profile.is_admin_approved === false) {
        navigate("/vet/account-review");
      } else if (profile.is_onboarding_complete === true && profile.is_admin_approved === true) {
        navigate("/vet/home");
      }
    }
  }, [authReady, user, profile, navigate]);

  if (!authReady) {
    return <div className="min-h-screen bg-gradient-soft flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-teal-600" /></div>;
  }

  // If already logged in, but just waiting to be redirected
  if (user && profile?.role === "vet") {
    return <div className="min-h-screen bg-gradient-soft flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-teal-600" /></div>;
  }


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const schema = isLogin ? loginSchema : signupSchema;
    const result = schema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setIsLoading(true);
    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email, password: formData.password,
        });
        if (error) throw error;

        const { data: userProfile } = await supabase
          .from("profiles")
          .select("role, is_onboarding_complete, is_admin_approved")
          .eq("id", data.user.id)
          .maybeSingle();

        if (userProfile?.role !== "vet") {
          await supabase.auth.signOut();
          const roleDisplayName = userProfile?.role === "seller" ? "Breeder" : userProfile?.role?.replace("_", " ") || "different role";
          toast.error(`This email is registered as a ${roleDisplayName}. Please use the correct login page for your role.`);
          return;
        }

        toast.success("Welcome back, Doctor!");
        if (userProfile.is_onboarding_complete === false) {
          navigate("/vet/onboarding");
        } else if (userProfile.is_admin_approved === false) {
          navigate("/vet/account-review");
        } else {
          navigate("/vet/home");
        }
      } else {
        // Pre-signup role check
        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("role")
          .eq("email", formData.email)
          .maybeSingle();

        if (existingProfile) {
          if (existingProfile.role === "vet") {
            toast.error("You are already registered as a Vet. Please Login instead.");
            setIsLogin(true);
          } else {
            const roleName = existingProfile.role === "seller" ? "Breeder" : existingProfile.role?.replace("_", " ") || "different user type";
            toast.error(`This email is already registered as a ${roleName}. Please use a different email or log in at the correct portal.`);
          }
          setIsLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email: formData.email, password: formData.password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { name: formData.name, role: "vet" }
          }
        });
        if (error) throw error;
        if (data.user) {
          toast.success("Account created! Welcome, Doctor!");
          navigate("/vet/onboarding");
        }
      }
    } catch (err) {
      const error = err as Error;
      if (error.message.includes("User already registered")) toast.error("This email is already registered. Please login instead.");
      else if (error.message.includes("Invalid login credentials")) toast.error("Invalid email or password");
      else toast.error(error.message || "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-soft flex flex-col">
      <header className="bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-1">
            <img src={SRUVO_LOGO_URL} alt="Sruvo" className="w-12 h-12 object-contain" referrerPolicy="no-referrer" />
            <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">Sruvo</span>
          </div>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <Card className="w-full max-w-md border-0 shadow-card animate-fade-in">
          <CardHeader className="text-center space-y-2">
            <div className="w-16 h-16 mx-auto bg-teal-100 rounded-full flex items-center justify-center mb-2">
              <Stethoscope className="w-8 h-8 text-teal-600" />
            </div>
            <CardTitle className="text-2xl">
              {isLogin ? "Vet Doctor Login" : "Register as Vet Doctor"}
            </CardTitle>
            <CardDescription>
              {isLogin ? "Sign in to manage your consultations" : "Join PetLink as a veterinary professional"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-teal-50 rounded-2xl p-4 mb-6">
              <div className="flex items-center gap-2 text-sm text-teal-700">
                <Shield className="w-4 h-4" />
                <span>Verified Doctor</span>
                <span className="mx-2">•</span>
                <Award className="w-4 h-4" />
                <span>Online & Offline</span>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name (Dr.)</Label>
                  <Input id="name" placeholder="Dr. Ananya Iyer" value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="rounded-2xl" />
                  {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="doctor@example.com" value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="rounded-2xl" />
                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="••••••••" value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="rounded-2xl" />
                {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
              </div>
              <Button type="submit" className="w-full rounded-2xl bg-gradient-primary hover:opacity-90" disabled={isLoading}>
                {isLoading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />{isLogin ? "Signing in..." : "Creating account..."}</>) :
                  (isLogin ? "Sign In" : "Create Doctor Account")}
              </Button>
            </form>
            <div className="mt-6 text-center">
              <button type="button" onClick={() => { setIsLogin(!isLogin); setErrors({}); }} className="text-sm text-primary hover:underline">
                {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
              </button>
            </div>
            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground">
                Looking to buy pets?{" "}
                <button type="button" onClick={() => navigate("/auth/buyer")} className="text-primary hover:underline">Buyer Login</button>
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AuthVet;
