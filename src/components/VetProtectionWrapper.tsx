import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

export const VetProtectionWrapper = ({ children, requiredStatus }: { children: React.ReactNode, requiredStatus?: 'onboarding' | 'pending' | 'approved' }) => {
  const { authReady, user, profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (authReady) {
      if (!user || profile?.role !== 'vet') {
        navigate("/auth-vet", { replace: true });
        return;
      }

      // Check onboarding status
      const isOnboardingComplete = profile?.is_onboarding_complete ?? false;
      const isAdminApproved = profile?.is_admin_approved ?? false;

      if (!isOnboardingComplete && requiredStatus !== 'onboarding') {
        navigate("/vet/onboarding", { replace: true });
      } else if (isOnboardingComplete && !isAdminApproved && requiredStatus !== 'pending') {
        navigate("/vet-pending-approval", { replace: true });
      } else if (isOnboardingComplete && isAdminApproved && requiredStatus === 'pending') {
        navigate("/vet/home", { replace: true });
      }
    }
  }, [authReady, user, profile, navigate, requiredStatus]);

  if (!authReady) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return <>{children}</>;
};
