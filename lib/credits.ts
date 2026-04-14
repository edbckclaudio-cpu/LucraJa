import { getSupabaseClient } from "./supabaseClient";

/**
 * Garante que um usuário possua um saldo inicial de créditos.
 *
 * Estratégia:
 * - Com Supabase: busca ou cria registro na tabela `credits`.
 * - Sem Supabase: usa `localStorage` com saldo inicial de 2 créditos.
 *
 * Observação:
 * - Este módulo é mais simples/legado do que `hooks/useCredits.ts`.
 * - O fluxo principal do app atual usa `user_credits` via `useCredits`.
 *
 * @param email E-mail do usuário.
 * @returns Saldo atual após garantir a existência do registro.
 */
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
  const db = supabase as any;
  const { data, error } = await db
    .from("credits")
    .select("credits")
    .eq("email", email)
    .single();
  if (error && error.code !== "PGRST116") {
    return 0;
  }
  if (!data) {
    const { data: inserted } = await db
      .from("credits")
      .insert({ email, credits: 2 })
      .select("credits")
      .single();
    return (inserted as { credits?: number | null } | null)?.credits ?? 0;
  }
  return (data as { credits?: number | null }).credits ?? 0;
}

/**
 * Consulta o saldo de créditos do usuário.
 *
 * Estratégia:
 * - Com Supabase: lê da tabela `credits`.
 * - Sem Supabase: lê do `localStorage`.
 *
 * @param email E-mail do usuário.
 * @returns Saldo encontrado. Retorna `0` se não houver registro.
 */
export async function getCredits(email: string) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    if (typeof window !== "undefined") {
      const key = `credits:${email}`;
      return Number(window.localStorage.getItem(key) ?? "0");
    }
    return 0;
  }
  const db = supabase as any;
  const { data } = await db
    .from("credits")
    .select("credits")
    .eq("email", email)
    .single();
  return (data as { credits?: number | null } | null)?.credits ?? 0;
}

/**
 * Consome um crédito do usuário.
 *
 * Estratégia:
 * - Com Supabase: lê o saldo atual e grava o novo saldo com `upsert`.
 * - Sem Supabase: decrementa e persiste em `localStorage`.
 *
 * Observações:
 * - O valor nunca fica negativo.
 * - Esta função não implementa proteção transacional forte; para a regra atual
 *   do produto, o controle de reentrância é feito na camada de UI/hook.
 *
 * @param email E-mail do usuário.
 * @returns Saldo restante após o débito.
 */
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
  const db = supabase as any;
  const { data } = await db
    .from("credits")
    .select("credits")
    .eq("email", email)
    .single();
  const current = (data as { credits?: number | null } | null)?.credits ?? 0;
  const next = Math.max(0, current - 1);
  const { data: updated } = await db
    .from("credits")
    .upsert({ email, credits: next }, { onConflict: "email" })
    .select("credits")
    .single();
  return (updated as { credits?: number | null } | null)?.credits ?? next;
}
