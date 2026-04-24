import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ShieldCheck, Loader2 } from "lucide-react";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const signupSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  adminCode: z.string().min(1, "Admin code is required"),
});

const AuthAdmin = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    adminCode: "",
  });

  useEffect(() => {
    checkExistingAdmin();
  }, []);

  const checkExistingAdmin = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data: userRole } = await supabase.rpc('get_user_role', { _user_id: session.user.id });
      if (userRole === 'admin') {
        navigate("/admin");
      }
    }
  };

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

        // Verify user is admin
        const { data: userRole } = await supabase.rpc('get_user_role', { _user_id: data.user.id });

        if (userRole !== 'admin') {
          await supabase.auth.signOut();
          throw new Error("Access denied. Admin privileges required.");
        }

        toast.success("Welcome, Admin!");
        navigate("/admin");
      } else {
        // Verify admin code (simple check - in production use secure method)
        if (formData.adminCode !== "8349153416") {
          throw new Error("Invalid admin code");
        }

        const { data, error } = await supabase.auth.signUp({
          email: formData.email.trim(),
          password: formData.password,
          options: {
            emailRedirectTo: `${window.location.origin}/admin`,
            data: {
              name: formData.name.trim(),
              role: "admin",
            },
          },
        });

        if (error) throw error;

        toast.success("Admin account created! You can now sign in.");
        setIsLogin(true);
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-soft flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 animate-fade-in">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-3xl shadow-float mb-4">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Admin Portal
          </h1>
          <p className="text-muted-foreground">Sruvo Administration Access</p>
        </div>

        <Card className="border-0 shadow-card">
          <CardHeader>
            <CardTitle>{isLogin ? "Admin Sign In" : "Create Admin Account"}</CardTitle>
            <CardDescription>
              {isLogin
                ? "Sign in with your admin credentials"
                : "Create a new admin account (requires admin code)"}
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
                      placeholder="Admin Name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required={!isLogin}
                      className={`rounded-2xl ${errors.name ? 'border-destructive' : ''}`}
                    />
                    {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="adminCode">Admin Access Code</Label>
                    <Input
                      id="adminCode"
                      type="password"
                      placeholder="Enter admin code"
                      value={formData.adminCode}
                      onChange={(e) => setFormData({ ...formData, adminCode: e.target.value })}
                      required={!isLogin}
                      className={`rounded-2xl ${errors.adminCode ? 'border-destructive' : ''}`}
                    />
                    {errors.adminCode && <p className="text-xs text-destructive">{errors.adminCode}</p>}
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@sruvo.com"
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
                className="w-full rounded-2xl bg-gradient-primary hover:opacity-90"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Please wait...
                  </>
                ) : (
                  <>{isLogin ? "Sign In" : "Create Admin Account"}</>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary hover:underline"
              >
                {isLogin
                  ? "Need an admin account? Sign up"
                  : "Already have an account? Sign in"}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthAdmin;
