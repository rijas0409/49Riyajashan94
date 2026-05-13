import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type AllowedRole = "buyer" | "seller" | "admin" | "delivery_partner" | "product_seller" | "vet";

interface RoleGuardResult {
  isLoading: boolean;
  user: any;
  profile: any;
  error: string | null;
}

export const useRoleGuard = (allowedRoles: AllowedRole[], redirectPath?: string): RoleGuardResult => {
  const navigate = useNavigate();
  const { user: authUser, profile: authProfile, authReady } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (!authReady) return;

    if (!authUser) {
      setIsLoading(false);
      navigate(redirectPath || "/auth", { replace: true });
      return;
    }

    const checkAccess = async () => {
      try {
        // Use profile from AuthContext if it already has the role we need
        if (authProfile && authProfile.role && allowedRoles.includes(authProfile.role as AllowedRole)) {
          setUser(authUser);
          setProfile(authProfile);
          setIsLoading(false);
          return;
        }

        // If AuthContext profile doesn't have it yet or it's different, do the deep check
        const { data: roleData } = await supabase.rpc("get_user_role", { _user_id: authUser.id });
        
        if (!roleData || !allowedRoles.includes(roleData as AllowedRole)) {
          // Redirect to appropriate dashboard based on actual role
          const role = roleData as AllowedRole;
          switch (role) {
            case "buyer": navigate("/buyer/home", { replace: true }); break;
            case "seller": navigate("/seller-dashboard", { replace: true }); break;
            case "admin": navigate("/admin", { replace: true }); break;
            case "delivery_partner": navigate("/delivery", { replace: true }); break;
            case "product_seller": navigate("/products-dashboard", { replace: true }); break;
            case "vet": navigate("/vet-dashboard", { replace: true }); break;
            default: navigate(redirectPath || "/auth", { replace: true });
          }
          setIsLoading(false);
          return;
        }

        // Fetch full profile if needed
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", authUser.id)
          .maybeSingle();

        setUser(authUser);
        setProfile(profileData || { ...authProfile, role: roleData });
        setIsLoading(false);
      } catch (err: any) {
        console.error("useRoleGuard error:", err);
        setError(err?.message || "Authentication check failed");
        setIsLoading(false);
      }
    };

    if (!initialized.current) {
      checkAccess();
      initialized.current = true;
    }
  }, [authReady, authUser, authProfile, allowedRoles, navigate, redirectPath]);

  return { isLoading, user, profile, error };
};
