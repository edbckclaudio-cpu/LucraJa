"use client";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";

type AuthContextType = {
  email: string | null;
  isLoggedIn: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  ready: boolean;
};

const AuthContext = createContext<AuthContextType>({
  email: null,
  isLoggedIn: false,
  login: async () => {},
  logout: async () => {},
  ready: false,
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = getSupabaseClient();
  const [email, setEmail] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    async function init() {
      if (!supabase) {
        setReady(true);
        return;
      }
      const { data } = await supabase.auth.getSession();
      const currentEmail = data.session?.user.email ?? null;
      setEmail(currentEmail);
      const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
        setEmail(session?.user.email ?? null);
      });
      unsub = sub.subscription.unsubscribe;
      setReady(true);
    }
    init();
    return () => unsub?.();
  }, [supabase]);

  const value = useMemo<AuthContextType>(
    () => ({
      email,
      isLoggedIn: !!email,
      ready,
      login: async () => {
        if (!supabase) {
          throw new Error("Configure o Supabase para login com Google.");
        }
        await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: `${window.location.origin}`,
          },
        });
      },
      logout: async () => {
        if (!supabase) return;
        await supabase.auth.signOut();
        setEmail(null);
      },
    }),
    [email, ready, supabase]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
