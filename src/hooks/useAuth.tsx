import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  isEventAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  managedEventIds: string[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEventAdmin, setIsEventAdmin] = useState(false);
  const [managedEventIds, setManagedEventIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRolesAndManaged = async (userId: string) => {
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    const admin = roles?.some((r) => r.role === "admin") ?? false;
    const eventAdmin = roles?.some((r) => r.role === "event_admin") ?? false;
    setIsAdmin(admin);
    setIsEventAdmin(eventAdmin);

    if (eventAdmin && !admin) {
      const { data: managed } = await supabase
        .from("event_managers")
        .select("event_id")
        .eq("user_id", userId);
      setManagedEventIds(managed?.map((m) => m.event_id) ?? []);
    } else {
      setManagedEventIds([]);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setTimeout(() => fetchRolesAndManaged(session.user.id), 0);
        } else {
          setIsAdmin(false);
          setIsEventAdmin(false);
          setManagedEventIds([]);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchRolesAndManaged(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{ user, session, isAdmin, isEventAdmin, loading, signIn, signOut, managedEventIds }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
