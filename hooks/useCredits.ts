import { useCallback, useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { useAuth } from "@/components/auth/AuthProvider";

export function useCredits(emailParam?: string | null) {
  const { email: ctxEmail } = useAuth();
  const email = emailParam ?? ctxEmail;
  const supabase = getSupabaseClient();
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

  const ensureRecord = useCallback(async () => {
    if (!email || !supabase) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("user_credits")
        .select("credits")
        .eq("email", email)
        .single();

      if (error && error.code !== "PGRST116") {
        setBalance(0);
      } else if (!data) {
        const { data: inserted } = await supabase
          .from("user_credits")
          .insert({ email, credits: 2 })
          .select("credits")
          .single();
        setBalance(inserted?.credits ?? 2);
      } else {
        setBalance(data.credits ?? 0);
      }
    } finally {
      setLoading(false);
    }
  }, [email, supabase]);

  const refresh = useCallback(async () => {
    if (!email || !supabase) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from("user_credits")
        .select("credits")
        .eq("email", email)
        .single();
      setBalance(data?.credits ?? 0);
    } finally {
      setLoading(false);
    }
  }, [email, supabase]);

  const consumeCredit = useCallback(async () => {
    if (!email || !supabase) return false;
    if (balance <= 0) return false;
    setLoading(true);
    try {
      const next = Math.max(0, balance - 1);
      const { data, error } = await supabase
        .from("user_credits")
        .upsert({ email, credits: next }, { onConflict: "email" })
        .select("credits")
        .single();
      if (error) return false;
      setBalance(data?.credits ?? next);
      return true;
    } finally {
      setLoading(false);
    }
  }, [email, supabase, balance]);

  useEffect(() => {
    if (email) {
      ensureRecord();
    } else {
      setBalance(0);
    }
  }, [email, ensureRecord]);

  const syncBalance = refresh;
  return { balance, loading, refresh, consumeCredit, syncBalance };
}
