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
      const isAdminApproved = profile?.is_admin_approved ?? (vetStatus === 'approved');

      if (vetStatus === 'not_submitted' && requiredStatus !== 'onboarding') {
        navigate("/vet/onboarding", { replace: true });
      } else if (vetStatus === 'pending_verification' && requiredStatus !== 'pending') {
        navigate("/vet-pending-approval", { replace: true });
      } else if (vetStatus === 'approved' && requiredStatus !== 'approved' && (requiredStatus === 'onboarding' || requiredStatus === 'pending')) {
        navigate("/vet/home", { replace: true });
      } else if (vetStatus === 'rejected' && requiredStatus === 'onboarding') {
        // If rejected, they can be at onboarding to fix issues
        return; 
      }
    }
  }, [authReady, user, profile, navigate, requiredStatus]);

  if (!authReady || (user && profile?.role === 'vet' && profile?.is_onboarding_complete === undefined)) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-teal-600" /></div>;
  }

  return <>{children}</>;
};
