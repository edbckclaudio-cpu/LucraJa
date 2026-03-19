import { useCallback, useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { useAuth } from "@/components/auth/AuthProvider";
import { tsInfo, tsError } from "@/lib/troubleshoot";
import { FLAGS, creditsCacheKey } from "@/lib/featureFlags";

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
      // Carrega cache local como fallback inicial
      if (FLAGS.creditsLocalCache && typeof window !== "undefined") {
        const cached = window.localStorage.getItem(creditsCacheKey(email));
        if (cached !== null) {
          const n = Number(cached) || 0;
          setBalance(n);
        }
      }
      tsInfo("useCredits", "select_start", { email });
      const { data, error } = await supabase
        .from("user_credits")
        .select("credits")
        .eq("email", email)
        .single();

      if (!error && data) {
        tsInfo("useCredits", "select_ok", { credits: data.credits });
        const next = data.credits ?? 0;
        setBalance(next);
        if (FLAGS.creditsLocalCache && typeof window !== "undefined") {
          window.localStorage.setItem(creditsCacheKey(email), String(next));
        }
        return;
      }

      tsError("useCredits", "select_failed", { error });
      const insertedTry = await supabase
        .from("user_credits")
        .insert({ email, credits: 2 })
        .select("credits")
        .single();
      if (!insertedTry.error && insertedTry.data) {
        tsInfo("useCredits", "insert_ok", { credits: insertedTry.data.credits });
        const next = insertedTry.data.credits ?? 2;
        setBalance(next);
        if (FLAGS.creditsLocalCache && typeof window !== "undefined") {
          window.localStorage.setItem(creditsCacheKey(email), String(next));
        }
        return;
      }

      tsError("useCredits", "insert_failed", { error: insertedTry.error });
      const { data: again } = await supabase
        .from("user_credits")
        .select("credits")
        .eq("email", email)
        .single();
      tsInfo("useCredits", "reselect_after_insert", { credits: again?.credits });
      const next = again?.credits ?? balance;
      setBalance(next);
      if (FLAGS.creditsLocalCache && typeof window !== "undefined") {
        window.localStorage.setItem(creditsCacheKey(email), String(next));
      }
    } finally {
      setLoading(false);
    }
  }, [email, supabase]);

  const refresh = useCallback(async () => {
    if (!email || !supabase) return;
    setLoading(true);
    try {
      tsInfo("useCredits", "refresh_start", { email });
      const { data } = await supabase
        .from("user_credits")
        .select("credits")
        .eq("email", email)
        .single();
      tsInfo("useCredits", "refresh_ok", { credits: data?.credits });
      const next = data?.credits ?? 0;
      setBalance(next);
      if (FLAGS.creditsLocalCache && typeof window !== "undefined") {
        window.localStorage.setItem(creditsCacheKey(email), String(next));
      }
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
      tsInfo("useCredits", "consume_start", { current: balance, next });
      const { data, error } = await supabase
        .from("user_credits")
        .upsert({ email, credits: next }, { onConflict: "email" })
        .select("credits")
        .single();
      if (error) {
        tsError("useCredits", "consume_failed", { error });
        return false;
      }
      tsInfo("useCredits", "consume_ok", { credits: data?.credits });
      const final = data?.credits ?? next;
      setBalance(final);
      if (FLAGS.creditsLocalCache && typeof window !== "undefined") {
        window.localStorage.setItem(creditsCacheKey(email), String(final));
      }
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
