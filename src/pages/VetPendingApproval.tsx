import { useEffect, useState } from "react";
import { SRUVO_LOGO_URL } from "@/constants/branding";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { AccountReviewScreen } from "@/components/AccountReviewScreen";
import { useAuth } from "@/contexts/AuthContext";

const VetPendingApproval = () => {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
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
        const metaRole = (session.user.user_metadata as any)?.role;
        const effectiveRole = roleData || metaRole;

        if (effectiveRole !== "vet") { navigate("/auth-vet"); return; }

        const { data: profile } = await supabase
          .from("profiles")
          .select("is_admin_approved, is_onboarding_complete")
          .eq("id", session.user.id)
          .maybeSingle();

        if (profile?.is_onboarding_complete === false) { navigate("/vet-onboarding"); return; }
        if (profile?.is_admin_approved === true) { 
          await refreshProfile();
          navigate("/vet/home"); 
          return; 
        }

        setIsChecking(false);
      } catch {
        // Keep user on this screen; stop infinite spinner
        setIsChecking(false);
      }
    };
    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, [navigate, refreshProfile]);

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
      <AccountReviewScreen onLogout={handleLogout} />
    </div>
  );
};

export default VetPendingApproval;
