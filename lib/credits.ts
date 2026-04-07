import { getSupabaseClient } from "./supabaseClient";

export async function ensureInitialCredits(email: string) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    if (typeof window !== "undefined") {
      const key = `credits:${email}`;
      const stored = window.localStorage.getItem(key);
      if (stored === null) {
        window.localStorage.setItem(key, "2");
        return 2;
      }
      return Number(stored) || 0;
    }
    return 0;
  }
  const { data, error } = await supabase
    .from("credits")
    .select("credits")
    .eq("email", email)
    .single();
  if (error && error.code !== "PGRST116") {
    return 0;
  }
  if (!data) {
    const { data: inserted } = await supabase
      .from("credits")
      .insert({ email, credits: 2 })
      .select("credits")
      .single();
    return inserted?.credits ?? 0;
  }
  return data.credits ?? 0;
}

export async function getCredits(email: string) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    if (typeof window !== "undefined") {
      const key = `credits:${email}`;
      return Number(window.localStorage.getItem(key) ?? "0");
    }
    return 0;
  }
  const { data } = await supabase
    .from("credits")
    .select("credits")
    .eq("email", email)
    .single();
  return data?.credits ?? 0;
}

export async function consumeCredit(email: string) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    if (typeof window !== "undefined") {
      const key = `credits:${email}`;
      const current = Number(window.localStorage.getItem(key) ?? "0");
      const next = Math.max(0, current - 1);
      window.localStorage.setItem(key, String(next));
      return next;
    }
    return 0;
  }
  const { data } = await supabase
    .from("credits")
    .select("credits")
    .eq("email", email)
    .single();
  const current = data?.credits ?? 0;
  const next = Math.max(0, current - 1);
  const { data: updated } = await supabase
    .from("credits")
    .upsert({ email, credits: next }, { onConflict: "email" })
    .select("credits")
    .single();
  return updated?.credits ?? next;
}
