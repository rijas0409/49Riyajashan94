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

export const useRoleGuard = (allowedRoles: AllowedRole[], redirectPath?: string, requireAdminApproval: boolean = false): RoleGuardResult => {
  const navigate = useNavigate();
  const { user: authUser, profile: authProfile, authReady } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const initialized = useRef(false);

  const allowedRolesString = allowedRoles.join(",");

  useEffect(() => {
    if (!authReady) return;

    if (!authUser) {
      setIsLoading(false);
      navigate(redirectPath || "/auth", { replace: true });
      return;
    }

    const checkAccess = async () => {
      try {
        let currentProfile = authProfile;

        // Force a DB fetch if we require admin approval but authProfile says it's not approved
        // This prevents the race condition when navigate happens before context updates fully
        if (requireAdminApproval && (!authProfile || authProfile.is_admin_approved !== true)) {
           const { data: dbProfile } = await supabase
             .from("profiles")
             .select("*")
             .eq("id", authUser.id)
             .maybeSingle();
           
           if (dbProfile) {
             currentProfile = { ...authProfile, ...dbProfile };
           }
        }

        // Check if admin approval is required and fail fast
        if (requireAdminApproval && currentProfile && currentProfile.is_admin_approved === false) {
           navigate("/vet-pending-approval", { replace: true });
           setIsLoading(false);
           return;
        }

        // Use profile from AuthContext if it already has the role we need
        if (currentProfile && currentProfile.role && allowedRoles.includes(currentProfile.role as AllowedRole)) {
          setUser(authUser);
          setProfile(currentProfile);
          setIsLoading(false);
          return;
        }

        // If AuthContext profile doesn't have it yet, check metadata as fallback
        const metaRole = (authUser.user_metadata as any)?.role;
        if (metaRole && allowedRoles.includes(metaRole as AllowedRole)) {
          setUser(authUser);
          setProfile({ ...authProfile, role: metaRole });
          setIsLoading(false);
          // Don't return, still do the deep check but we are "safe" for now
        }

        const { data: roleData, error: roleError } = await supabase.rpc("get_user_role", { _user_id: authUser.id });
        
        if (roleError) {
           console.error("RPC role check error:", roleError);
           // If we have metadata role, we trust it over a failing RPC
           if (metaRole && allowedRoles.includes(metaRole as AllowedRole)) {
             setIsLoading(false);
             return;
           }
           throw roleError;
        }

        const effectiveRole = roleData || metaRole;

        if (!effectiveRole || !allowedRoles.includes(effectiveRole as AllowedRole)) {
          // Redirect to appropriate dashboard based on actual role
          const role = effectiveRole as AllowedRole;
          switch (role) {
            case "buyer": navigate("/buyer/home", { replace: true }); break;
            case "seller": navigate("/seller-dashboard", { replace: true }); break;
            case "admin": navigate("/admin", { replace: true }); break;
            case "delivery_partner": navigate("/delivery", { replace: true }); break;
            case "product_seller": navigate("/products-dashboard", { replace: true }); break;
            case "vet": navigate("/vet/home", { replace: true }); break;
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

    checkAccess();
  }, [authReady, authUser, authProfile, allowedRolesString, navigate, redirectPath]);

  return { isLoading, user, profile, error };
};
