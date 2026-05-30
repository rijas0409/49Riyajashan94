import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type AllowedRole = "buyer" | "seller" | "admin" | "delivery_partner" | "product_seller" | "vet";

interface RoleGuardResult {
  isLoading: boolean;
  showSpinner: boolean;
  user: any;
  profile: any;
  error: string | null;
}

export const useRoleGuard = (allowedRoles: AllowedRole[], redirectPath?: string, requireAdminApproval: boolean = false): RoleGuardResult => {
  const navigate = useNavigate();
  const { user: authUser, profile: authProfile, authReady, refreshProfile } = useAuth();
  
  const cachedRole = localStorage.getItem("sruvo_user_role");
  const cachedApproved = localStorage.getItem("sruvo_admin_approved") === "true";
  const hasCachedAccess = !!(cachedRole && allowedRoles.includes(cachedRole as AllowedRole) && (!requireAdminApproval || cachedApproved));

  const [isLoading, setIsLoading] = useState(!hasCachedAccess);
  const [showSpinner, setShowSpinner] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    let spinnerTimer: NodeJS.Timeout | null = null;
    if (isLoading) {
      spinnerTimer = setTimeout(() => {
        setShowSpinner(true);
      }, 300);
    } else {
      setShowSpinner(false);
    }
    return () => {
      if (spinnerTimer) clearTimeout(spinnerTimer);
    };
  }, [isLoading]);

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
        
        // Instant check using localStorage to avoid any render flash, 
        // BUT we don't return here if requireAdminApproval is true because we need to check the DB for updates
        const isApproved = localStorage.getItem("sruvo_admin_approved") === "true";
        if (requireAdminApproval && !isApproved) {
            // We'll proceed to the DB check below instead of returning immediately
            console.log("Checking approval sync...");
        }

        // Force a DB fetch if we require admin approval and current local state is uncertain 
        // Or if we specifically need to verify approval status
        if (requireAdminApproval && (!authProfile || authProfile.is_admin_approved !== true)) {
           console.log("useRoleGuard: Forcing DB check for", authUser.email, "Current is_admin_approved:", authProfile?.is_admin_approved);
           const { data: dbProfile, error: dbError } = await supabase
             .from("profiles")
             .select("role, is_admin_approved, is_onboarding_complete")
             .eq("id", authUser.id)
             .maybeSingle();
           
           if (dbError) console.error("useRoleGuard: DB check error:", dbError);
           
           if (dbProfile) {
             console.log("useRoleGuard: Fresh DB sync check result:", dbProfile.is_admin_approved);
             currentProfile = { ...authProfile, ...dbProfile };
             // Update localStorage to prevent repetitive flash on next page load
             if (dbProfile.is_admin_approved) {
               localStorage.setItem("sruvo_admin_approved", "true");
             }
           } else {
             console.warn("useRoleGuard: No profile found in DB for forced check");
           }
        }

        console.log("useRoleGuard: Approval status check before routing:", {
          requireAdminApproval,
          isApproved: currentProfile?.is_admin_approved,
          email: authUser.email
        });

        // Final check after potential DB fetch
        const isActuallyApproved = currentProfile?.is_admin_approved === true || localStorage.getItem("sruvo_admin_approved") === "true";
        
        console.log("useRoleGuard: Final approval check result:", {
          isActuallyApproved,
          requireAdminApproval,
          currentPath: window.location.pathname
        });

        // Check onboarding/approval status for vets specifically using vetStatus from AuthContext
        if (currentProfile?.role === "vet") {
           if (currentProfile.vetStatus === null) {
             console.log("useRoleGuard (Vet): vetStatus is null (loading), waiting...");
             return;
           }
           const vetStatus = currentProfile.vetStatus || 'not_submitted';
           const currentPath = window.location.pathname;

           console.log("useRoleGuard (Vet): Status:", vetStatus, "Path:", currentPath);

           if (vetStatus === 'not_submitted') {
             if (currentPath !== "/vet/onboarding") {
               navigate("/vet/onboarding", { replace: true });
               setIsLoading(false);
               return;
             }
             setIsLoading(false);
             return;
           }

           if (vetStatus === 'pending_verification') {
             // If on pending approval or onboarding page, allow to stay!
             if (currentPath !== "/vet/account-review" && currentPath !== "/vet-pending-approval" && currentPath !== "/vet/onboarding") {
               navigate("/vet/account-review", { replace: true });
               setIsLoading(false);
               return;
             }
             setIsLoading(false);
             return;
           }

           if (vetStatus === 'rejected') {
             // In rejection case, they can stay on pending approval or onboarding.
             // If they are on home/dashboard, redirect to pending/rejection screen
             if (currentPath.startsWith("/vet/home") || currentPath.startsWith("/vet/schedule") || currentPath.startsWith("/vet/earnings") || currentPath.startsWith("/vet/profile")) {
               navigate("/vet/account-review", { replace: true });
               setIsLoading(false);
               return;
             }
           }

           if (vetStatus === 'approved') {
             // If approved but on onboarding or pending, go to home
             if (currentPath === "/vet/onboarding" || currentPath === "/vet/account-review" || currentPath === "/vet-pending-approval") {
               navigate("/vet/home", { replace: true });
               setIsLoading(false);
               return;
             }
           }
        }

        if (requireAdminApproval && !isActuallyApproved) {
            // This is a fallback for other roles or if vetStatus wasn't definitive
            const currentPath = window.location.pathname;
            if (currentPath === "/vet/account-review" || currentPath === "/vet-pending-approval" || currentPath === "/vet/onboarding" || currentPath.includes("pending-approval") || currentPath.includes("account-review")) {
               setIsLoading(false);
               return;
            }
            console.log("useRoleGuard: REJECTED - navigating to pending-approval screen");
            
            // Determine correct pending path
            let pendingPath = "/vet/account-review";
            if (currentProfile?.role === "seller") pendingPath = "/seller-pending-approval";
            if (currentProfile?.role === "product_seller") pendingPath = "/products-pending-approval";
            
            navigate(pendingPath, { replace: true });
            setIsLoading(false);
            return;
        }

        // Use profile from AuthContext if it already has the role we need
        if (currentProfile && currentProfile.role && allowedRoles.includes(currentProfile.role as AllowedRole)) {
          console.log("useRoleGuard: Role match found, allowing access");
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

        // Final role resolution
        const effectiveRole = roleData || metaRole;
        
        console.log("useRoleGuard: Final role check:", {
           effectiveRole,
           allowedRoles,
           match: effectiveRole && allowedRoles.includes(effectiveRole as AllowedRole)
        });

        if (!effectiveRole) {
           // If we still don't have a role, wait a bit longer or fail if we've tried enough
           // But let's check profile from context one last time
           if (authProfile?.role) {
              // Role exists in context, logic below will handle it
           } else {
              console.log("useRoleGuard: No role found yet, waiting...");
              // We'll let the effect re-run or wait for next tick
              // However, if we are definitely not logged in, we should have returned earlier
              // If we reach here, we are logged in but role is elusive
              setIsLoading(false); 
              return;
           }
        }

        if (!effectiveRole || !allowedRoles.includes(effectiveRole as AllowedRole)) {
          // Redirect to appropriate dashboard based on actual role
          console.log("useRoleGuard: ROLE MISMATCH - redirecting to correct dashboard for", effectiveRole);
          const role = effectiveRole as AllowedRole;
          switch (role) {
            case "buyer": navigate("/buyer/home", { replace: true }); break;
            case "seller": navigate("/seller-dashboard", { replace: true }); break;
            case "admin": navigate("/admin", { replace: true }); break;
            case "delivery_partner": navigate("/delivery", { replace: true }); break;
            case "product_seller": navigate("/products-dashboard", { replace: true }); break;
            case "vet": 
               // Only redirect to home if we are NOT already on a vet page
               if (!window.location.pathname.startsWith("/vet/")) {
                 navigate("/vet/home", { replace: true }); 
               }
               break;
            default: 
               // Final fallback - only if we are absolutely sure
               if (effectiveRole || initialized.current) {
                 navigate(redirectPath || "/auth", { replace: true });
               }
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
  }, [authReady, authUser, authProfile, allowedRolesString, navigate, redirectPath, requireAdminApproval, refreshProfile]);

  return { isLoading, showSpinner, user, profile, error };
};
