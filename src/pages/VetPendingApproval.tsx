import { useEffect, useState } from "react";
import { SRUVO_LOGO_URL } from "@/constants/branding";
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
            <img src={SRUVO_LOGO_URL} alt="Sruvo" className="w-12 h-12 object-contain" referrerPolicy="no-referrer" />
            <div>
              <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">Sruvo</span>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Vet Portal</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout}><LogOut className="w-5 h-5" /></Button>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <Card className="w-full max-w-md border-0 shadow-card animate-fade-in text-center">
          <CardHeader className="space-y-4">
            <div className="w-24 h-24 mx-auto bg-teal-100 rounded-full flex items-center justify-center animate-pulse relative">
              <Stethoscope className="w-12 h-12 text-teal-600" />
              <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-sm">
                <Clock className="w-5 h-5 text-amber-500 animate-spin-slow" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Account Under Review
            </CardTitle>
            <CardDescription className="text-base text-muted-foreground max-w-sm mx-auto">
              Welcome to the PetLink veterinary network! Our specialists are currently verifying your professional credentials.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted/40 rounded-3xl p-5 space-y-4 border border-border/50">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-success" />
                </div>
                <div className="text-left flex-1">
                  <p className="font-semibold text-sm">Onboarding Complete</p>
                  <p className="text-xs text-muted-foreground">Information & documents received</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-teal-600" />
                </div>
                <div className="text-left flex-1">
                  <p className="font-semibold text-sm">Credential Verification</p>
                  <p className="text-xs text-muted-foreground">Verifying medical registration & degree</p>
                </div>
                <div className="animate-pulse flex space-x-1">
                  <div className="h-1.5 w-1.5 bg-teal-600 rounded-full"></div>
                  <div className="h-1.5 w-1.5 bg-teal-600 rounded-full"></div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-amber-600" />
                </div>
                <div className="text-left flex-1">
                  <p className="font-semibold text-sm">Final Approval</p>
                  <p className="text-xs text-muted-foreground">Admin confirmation & dashboard access</p>
                </div>
              </div>
            </div>

            <div className="px-4 py-3 bg-teal-50/50 rounded-2xl border border-teal-100">
              <p className="text-xs text-teal-800 font-medium leading-relaxed">
                Verification usually takes <strong>24-48 hours</strong>. You will receive an email once your portal is active.
              </p>
            </div>
            
            <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-1.5 italic">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
              </span>
              Auto-refreshing status...
            </p>
          </CardContent>
          <div className="px-6 pb-6 pt-0">
             <Button variant="outline" className="w-full rounded-2xl border-border/50 hover:bg-destructive/5 hover:text-destructive hover:border-destructive/20 transition-all group" onClick={handleLogout}>
               <LogOut className="w-4 h-4 mr-2 group-hover:translate-x-0.5 transition-transform" />
               Sign out
             </Button>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default VetPendingApproval;
