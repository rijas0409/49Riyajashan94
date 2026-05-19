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
  const { profile, user, refreshProfile } = useAuth();
  const [isChecking, setIsChecking] = useState(true);
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.is_admin_approved === true) {
      navigate("/vet/home");
    }
  }, [profile?.is_admin_approved, navigate]);

  useEffect(() => {
    let channel: any = null;
    let pollInterval: NodeJS.Timeout | null = null;
    
    const check = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { navigate("/auth-vet"); return; }
 
        const { data: vetProfile } = await supabase
          .from("vet_profiles")
          .select("*")
          .eq("user_id", session.user.id)
          .maybeSingle();
 
        setRejectionReason(vetProfile?.verification_status === "failed" ? (vetProfile.rejection_reason || "Your application was not approved. Please review your details and try again.") : null);
 
        const { data: currentProfile } = await supabase.from("profiles").select("is_admin_approved, is_onboarding_complete").eq("id", session.user.id).single();
        if (currentProfile?.is_admin_approved) {
           await refreshProfile();
           navigate("/vet/home");
           return;
        }

        if (currentProfile?.is_onboarding_complete === false) { navigate("/vet-onboarding"); return; }
        
        setIsChecking(false);

        // Setup real-time listener only when we have a valid session id
        if (!channel) {
          channel = supabase.channel('vet_approval_check_' + session.user.id)
            .on('postgres_changes', { 
              event: '*', 
              schema: 'public', 
              table: 'profiles',
              filter: `id=eq.${session.user.id}`
            }, async () => {
              console.log("Profile change detected in Pending Approval page - profiles");
              await refreshProfile();
              check(); 
            })
            .on('postgres_changes', {
              event: '*',
              schema: 'public',
              table: 'vet_profiles',
              filter: `user_id=eq.${session.user.id}`
            }, async () => {
              console.log("Profile change detected in Pending Approval page - vet_profiles");
              await refreshProfile();
              check();
            })
            .subscribe();
        }

        // Add robust polling fallback in case Realtime publication is not enabled on tables
        if (!pollInterval) {
           pollInterval = setInterval(() => {
              check();
           }, 3000);
        }
      } catch (err) {
        console.error("Check error:", err);
        setIsChecking(false);
      }
    };
    check();
 
    return () => { 
      if (channel) supabase.removeChannel(channel); 
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [navigate]);

  const handleLogout = async () => { await supabase.auth.signOut(); navigate("/auth-vet"); };

  if (isChecking) return (
    <div className="min-h-screen bg-gradient-soft flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-soft flex flex-col">
      <header className="bg-card/80 backdrop-blur-lg border-b border-border text-foreground">
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
      <AccountReviewScreen 
        onLogout={handleLogout} 
        rejectionReason={rejectionReason}
        onEditProfile={() => navigate("/vet-onboarding")}
      />
    </div>
  );
};

export default VetPendingApproval;
