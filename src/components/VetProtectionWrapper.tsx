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

      // Check onboarding status specifically for vets using vetStatus
      const vetStatus = profile?.vetStatus || 'not_submitted';
      const currentPath = window.location.pathname;

      if (vetStatus === 'not_submitted' && requiredStatus !== 'onboarding') {
        navigate("/vet/onboarding", { replace: true });
      } else if (vetStatus === 'pending_verification') {
        // Allow pending vets to access onboarding if they want to edit, or pending page if required.
        // Only redirect if they are trying to access regular vet home/schedule etc.
        if (requiredStatus !== 'pending' && currentPath !== "/vet/onboarding") {
          navigate("/vet/account-review", { replace: true });
        }
      } else if (vetStatus === 'approved' && requiredStatus !== 'approved' && (requiredStatus === 'onboarding' || requiredStatus === 'pending')) {
        navigate("/vet/home", { replace: true });
      } else if (vetStatus === 'rejected') {
        // If rejected, we allow both onboarding (to edit) and pending (to view reasons).
        if (requiredStatus !== 'onboarding' && requiredStatus !== 'pending') {
          navigate("/vet/account-review", { replace: true });
        }
      }
    }
  }, [authReady, user, profile, navigate, requiredStatus]);

  if (!authReady || (user && profile?.role === 'vet' && (profile?.is_onboarding_complete === undefined || profile?.vetStatus === null))) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-teal-600" /></div>;
  }

  return <>{children}</>;
};
