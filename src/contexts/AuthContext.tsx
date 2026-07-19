import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface UserProfile {
  name: string;
  full_name: string | null;
  email: string;
  photo: string | null;
  role: string | null;
  vetStatus?: string | null;
  is_onboarding_complete?: boolean;
  is_admin_approved?: boolean;
}

interface AuthContextType {
  authReady: boolean;
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  authReady: false,
  session: null,
  user: null,
  profile: null,
  refreshProfile: async () => {},
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authReady, setAuthReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    try {
      const cached = localStorage.getItem("sruvo_user_profile");
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  const updateProfile = (newProfile: UserProfile | null) => {
    setProfile(newProfile);
    if (newProfile) {
      try {
        localStorage.setItem("sruvo_user_profile", JSON.stringify(newProfile));
      } catch (e) {
        console.error("Error setting sruvo_user_profile:", e);
      }
    } else {
      localStorage.removeItem("sruvo_user_profile");
    }
  };

  const fetchProfile = async (userId: string, userEmail: string, metaName: string, metaRole?: string | null) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("name, full_name, email, profile_photo, role, is_onboarding_complete, is_admin_approved")
        .eq("id", userId)
        .maybeSingle();

      console.log("AuthContext: Fresh profile fetch for", userEmail, ":", data);
      if (error) console.error("AuthContext: Profile fetch error:", error);

      let vetStatus: string | null = null;
      if (data?.role === 'vet' || metaRole === 'vet') {
        const { data: vetData } = await supabase
          .from("vet_profiles")
          .select("verification_status")
          .eq("user_id", userId)
          .maybeSingle();
        vetStatus = vetData?.verification_status || 'not_submitted';
        
        // Map common alternative statuses to standard ones if needed
        if (vetStatus === 'pending') vetStatus = 'pending_verification';
        if (vetStatus === 'verified') vetStatus = 'approved';
        if (vetStatus === 'failed') vetStatus = 'rejected';
        
        // Gucci bypass
        if (userEmail === 'gucci@123.com' || userEmail === 'rijas@lv.com') {
           vetStatus = 'approved';
         }
      }

      if (data) {
        let photoUrl = data.profile_photo || "";
        if (photoUrl && !photoUrl.startsWith("http") && !photoUrl.startsWith("/") && !photoUrl.startsWith("data:") && !photoUrl.startsWith("blob:") && !photoUrl.includes("/assets/")) {
          const { data: pubData } = supabase.storage.from("seller-documents").getPublicUrl(photoUrl);
          photoUrl = pubData?.publicUrl || "";
        }
        updateProfile({
          name: data.name || metaName || "User",
          full_name: data.full_name || "",
          email: data.email || userEmail || "",
          photo: photoUrl || null,
          role: data.role || metaRole || null,
          vetStatus,
          is_onboarding_complete: data.is_onboarding_complete ?? false,
          is_admin_approved: data.is_admin_approved ?? false,
        });
        if (data.role) localStorage.setItem("sruvo_user_role", data.role);
        else if (metaRole) localStorage.setItem("sruvo_user_role", metaRole);
        localStorage.setItem("sruvo_admin_approved", String(!!data.is_admin_approved));
      } else {
        updateProfile({
          name: metaName || "User",
          full_name: "",
          email: userEmail || "",
          photo: null,
          role: metaRole || null,
          vetStatus,
          is_onboarding_complete: false,
          is_admin_approved: false,
        });
        if (metaRole) localStorage.setItem("sruvo_user_role", metaRole);
      }
    } catch {
      updateProfile({
        name: metaName || "User",
        full_name: "",
        email: userEmail || "",
        photo: null,
        role: metaRole || null,
      });
    }
  };

  const refreshProfile = async () => {
    if (!user) return;
    const meta = user.user_metadata as Record<string, any>;
    await fetchProfile(user.id, user.email || "", meta?.name || meta?.full_name || "", meta?.role);
  };

  useEffect(() => {
    let mounted = true;

    // Listen for auth state changes - this is the PRIMARY mechanism
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, currentSession) => {
        try {
          if (!mounted) return;

          setSession(currentSession);
          setUser(currentSession?.user ?? null);

          if (currentSession?.user) {
            const meta = currentSession.user.user_metadata as Record<string, any>;
            const metaName = meta?.name || meta?.full_name || "";
            const metaRole = meta?.role || null;

            // Set immediate profile from metadata to avoid "U" flash, but don't overwrite richer cached attributes with null
            setProfile(prev => {
              const updated = {
                name: prev?.name || metaName || "User",
                full_name: prev?.full_name || "",
                email: prev?.email || currentSession.user.email || "",
                photo: prev?.photo || null,
                role: prev?.role || metaRole,
                vetStatus: prev?.vetStatus || null,
                is_onboarding_complete: prev?.is_onboarding_complete,
                is_admin_approved: prev?.is_admin_approved,
              };
              try {
                localStorage.setItem("sruvo_user_profile", JSON.stringify(updated));
              } catch (e) {}
              return updated;
            });

            // Then fetch full profile from DB (deferred to avoid deadlock with Supabase auth)
            setTimeout(() => {
              if (mounted) {
                fetchProfile(currentSession.user.id, currentSession.user.email || "", metaName, metaRole).catch(e => console.error("Deferred profile fetch error:", e));
              }
            }, 0);
          } else {
            updateProfile(null);
          }

          if (!authReady) {
            setAuthReady(true);
          }
        } catch (err) {
          console.error("AuthContext: AuthStateChange handler error:", err);
          setAuthReady(true);
        }
      }
    );

    // Also do an initial check in case onAuthStateChange is delayed
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (!mounted) return;
      if (!authReady) {
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
        if (initialSession?.user) {
          const meta = initialSession.user.user_metadata as Record<string, any>;
          const metaName = meta?.name || meta?.full_name || "";
          const metaRole = meta?.role || null;

          const cached = localStorage.getItem("sruvo_user_profile");
          if (!cached) {
            updateProfile({
              name: metaName || "User",
              full_name: "",
              email: initialSession.user.email || "",
              photo: null,
              role: metaRole,
            });
          }
          fetchProfile(initialSession.user.id, initialSession.user.email || "", metaName, metaRole);
        }
        setAuthReady(true);
      }
    }).catch(err => {
      console.error("AuthContext: Initial session check failed:", err);
      setAuthReady(true);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Real-time listener for profile updates
  useEffect(() => {
    if (!user) return;
    
    // Subscribe to changes on the user's profile and vet_profile
    const channel = supabase.channel(`auth_profile_${user.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` }, () => {
        refreshProfile();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'vet_profiles', filter: `user_id=eq.${user.id}` }, () => {
        refreshProfile();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("AuthContext: SignOut error:", err);
    } finally {
      localStorage.removeItem("sruvo_user_role");
      localStorage.removeItem("sruvo_admin_approved");
      setSession(null);
      setUser(null);
      setProfile(null);
    }
  };

  return (
    <AuthContext.Provider value={{ authReady, session, user, profile, refreshProfile, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
