import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface UserProfile {
  name: string;
  email: string;
  photo: string | null;
  role: string | null;
}

interface AuthContextType {
  authReady: boolean;
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  authReady: false,
  session: null,
  user: null,
  profile: null,
  refreshProfile: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authReady, setAuthReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const fetchProfile = async (userId: string, userEmail: string, metaName: string) => {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("name, email, profile_photo, role")
        .eq("id", userId)
        .maybeSingle();

      if (data) {
        setProfile({
          name: data.name || metaName || "User",
          email: data.email || userEmail || "",
          photo: data.profile_photo,
          role: data.role,
        });
      } else {
        setProfile({
          name: metaName || "User",
          email: userEmail || "",
          photo: null,
          role: null,
        });
      }
    } catch {
      setProfile({
        name: metaName || "User",
        email: userEmail || "",
        photo: null,
        role: null,
      });
    }
  };

  const refreshProfile = async () => {
    if (!user) return;
    const meta = user.user_metadata as any;
    await fetchProfile(user.id, user.email || "", meta?.name || meta?.full_name || "");
  };

  useEffect(() => {
    let mounted = true;

    // Listen for auth state changes - this is the PRIMARY mechanism
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!mounted) return;

        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          const meta = currentSession.user.user_metadata as any;
          const metaName = meta?.name || meta?.full_name || "";

          // Set immediate profile from metadata to avoid "U" flash
          setProfile(prev => ({
            name: prev?.name || metaName || "User",
            email: prev?.email || currentSession.user.email || "",
            photo: prev?.photo || null,
            role: prev?.role || null,
          }));

          // Then fetch full profile from DB (deferred to avoid deadlock with Supabase auth)
          setTimeout(() => {
            if (mounted) {
              fetchProfile(currentSession.user.id, currentSession.user.email || "", metaName);
            }
          }, 0);
        } else {
          setProfile(null);
        }

        if (!authReady) {
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
          const meta = initialSession.user.user_metadata as any;
          const metaName = meta?.name || meta?.full_name || "";
          setProfile({
            name: metaName || "User",
            email: initialSession.user.email || "",
            photo: null,
            role: null,
          });
          fetchProfile(initialSession.user.id, initialSession.user.email || "", metaName);
        }
        setAuthReady(true);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AuthContext.Provider value={{ authReady, session, user, profile, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
