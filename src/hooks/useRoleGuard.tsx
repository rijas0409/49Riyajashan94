import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

type AllowedRole = "buyer" | "seller" | "admin" | "delivery_partner" | "product_seller" | "vet";

interface RoleGuardResult {
  isLoading: boolean;
  user: any;
  profile: any;
  error: string | null;
}

export const useRoleGuard = (allowedRoles: AllowedRole[], redirectPath?: string): RoleGuardResult => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // IMPORTANT: callers often pass array literals like ["product_seller"].
  // Using the array directly in the dependency list causes the effect to re-run on every render
  // (new array identity) -> repeated redirects/loading loops.
  const rolesKey = (allowedRoles || []).slice().sort().join("|");

  useEffect(() => {
    let cancelled = false;

    const safeNavigate = (to: string) => {
      // Avoid repeated navigation to the same path which can look like "refresh loops"
      if (window.location.pathname === to) return;
      navigate(to, { replace: true });
    };

    const checkAccess = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          if (!cancelled) {
            setIsLoading(false);
            safeNavigate(redirectPath || "/auth");
          }
          return;
        }

        const meta = session.user.user_metadata as any;
        const metaRole = meta?.role as AllowedRole | undefined;
        const expectedRole = metaRole || allowedRoles?.[0];
        const userName = meta?.name || meta?.full_name || "User";

        // Self-heal: ensure user_roles + profiles rows exist (even if metadata role is missing)
        if (expectedRole) {
          const initRes = await supabase.rpc("ensure_user_initialized" as any, {
            _role: expectedRole,
            _name: userName,
            _email: session.user.email || "",
          });
          if (initRes.error) throw new Error(initRes.error.message);
        }

        // Get role (retry once after init)
        let roleData: AllowedRole | null = null;
        const roleRpc1 = await supabase.rpc("get_user_role", { _user_id: session.user.id });
        roleData = (roleRpc1.data as any) ?? null;

        if (!roleData && expectedRole) {
          await supabase.rpc("ensure_user_initialized" as any, {
            _role: expectedRole,
            _name: userName,
            _email: session.user.email || "",
          });

          const roleRpc2 = await supabase.rpc("get_user_role", { _user_id: session.user.id });
          roleData = (roleRpc2.data as any) ?? null;
        }

        if (!roleData) {
          // Last-resort direct read
          const roleRes = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", session.user.id)
            .maybeSingle();
          roleData = (roleRes.data as any)?.role ?? null;
        }

        if (cancelled) return;

        if (!roleData || !allowedRoles.includes(roleData as AllowedRole)) {
          switch (roleData) {
            case "buyer": safeNavigate("/buyer-dashboard"); break;
            case "seller": safeNavigate("/seller-dashboard"); break;
            case "admin": safeNavigate("/admin"); break;
            case "delivery_partner": safeNavigate("/delivery"); break;
            case "product_seller": safeNavigate("/products-dashboard"); break;
            case "vet": safeNavigate("/vet-dashboard"); break;
            default: safeNavigate(redirectPath || "/auth");
          }
          setIsLoading(false);
          return;
        }

        // Fetch profile
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .maybeSingle();

        if (profileError) throw new Error(profileError.message);
        if (cancelled) return;

        setUser(session.user);
        setProfile(profileData || {
          id: session.user.id,
          name: userName,
          email: session.user.email,
          role: roleData,
          is_onboarding_complete: false,
          is_admin_approved: false,
        });
      } catch (err: any) {
        console.error("useRoleGuard error:", err);
        if (!cancelled) setError(err?.message || "Authentication check failed");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    checkAccess();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, redirectPath, rolesKey]);

  return { isLoading, user, profile, error };
};
