import { useEffect, useState } from "react";
import sruvoLogo from "@/assets/sruvo-logo.png";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Clock, Stethoscope, ShieldCheck, LogOut } from "lucide-react";

const VetPendingApproval = () => {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const check = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { navigate("/auth-vet"); return; }

        await supabase.rpc("ensure_user_initialized" as any, {
          _role: "vet",
          _name: (session.user.user_metadata as any)?.name || "User",
          _email: session.user.email || "",
        });

        const { data: roleData } = await supabase.rpc("get_user_role", { _user_id: session.user.id });
        if (roleData !== "vet") { navigate("/auth-vet"); return; }

        const { data: profile } = await supabase
          .from("profiles")
          .select("is_admin_approved, is_onboarding_complete")
          .eq("id", session.user.id)
          .maybeSingle();

        if (!profile?.is_onboarding_complete) { navigate("/vet-onboarding"); return; }
        if (profile?.is_admin_approved) { navigate("/vet-dashboard"); return; }

        setIsChecking(false);
      } catch {
        // Keep user on this screen; stop infinite spinner
        setIsChecking(false);
      }
    };
    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, [navigate]);

  const handleLogout = async () => { await supabase.auth.signOut(); navigate("/auth-vet"); };

  if (isChecking) return (
    <div className="min-h-screen bg-gradient-soft flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-soft flex flex-col">
      <header className="bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <img src={sruvoLogo} alt="Sruvo" className="w-12 h-12 object-contain" />
            <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">Sruvo</span>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout}><LogOut className="w-5 h-5" /></Button>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <Card className="w-full max-w-md border-0 shadow-card animate-fade-in text-center">
          <CardHeader className="space-y-4">
            <div className="w-20 h-20 mx-auto bg-teal-100 rounded-full flex items-center justify-center animate-pulse">
              <Stethoscope className="w-10 h-10 text-teal-600" />
            </div>
            <CardTitle className="text-2xl">Account Under Review</CardTitle>
            <CardDescription className="text-base">
              Your veterinary profile is being reviewed by our admin team. This usually takes 24-48 hours.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-teal-50 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-teal-600" />
                <div className="text-left">
                  <p className="font-medium text-sm">Verification In Progress</p>
                  <p className="text-xs text-muted-foreground">We're verifying your credentials and documents</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-teal-600" />
                <div className="text-left">
                  <p className="font-medium text-sm">Document Check</p>
                  <p className="text-xs text-muted-foreground">Degree, registration & ID verification</p>
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">This page auto-refreshes every 30 seconds</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default VetPendingApproval;
