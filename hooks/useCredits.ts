import { useCallback, useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { useAuth } from "@/components/auth/AuthProvider";
import { tsInfo, tsError } from "@/lib/troubleshoot";
import { FLAGS, creditsCacheKey } from "@/lib/featureFlags";

/**
 * Hook central de leitura, sincronização e débito de créditos do usuário.
 *
 * Comportamento:
 * - Fonte primária: tabela `user_credits` no Supabase.
 * - Cache auxiliar: `localStorage`, habilitado por feature flag.
 * - Inicialização: cria saldo inicial de 2 créditos quando necessário.
 *
 * Observação:
 * - Este hook é a implementação principal usada pela UI atual.
 * - O módulo `lib/credits.ts` existe, mas representa uma camada mais simples/legado.
 *
 * @param emailParam E-mail opcional. Se omitido, usa o e-mail do `AuthProvider`.
 * @returns Estado e operações de crédito para a sessão atual.
 */
export function useCredits(emailParam?: string | null) {
  const { email: ctxEmail } = useAuth();
  const email = emailParam ?? ctxEmail;
  const supabase = getSupabaseClient();
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

  /**
   * Garante que o usuário possua um registro válido em `user_credits`.
   *
   * Efeitos colaterais:
   * - Pode atualizar o estado `balance`.
   * - Pode gravar cache local de créditos.
   *
   * @returns `void`
   */
  const ensureRecord = useCallback(async () => {
    if (!email || !supabase) return;
    const db = supabase as any;
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
      const { data, error } = await db
        .from("user_credits")
        .select("credits")
        .eq("email", email)
        .single();

      if (!error && data) {
        const row = data as { credits?: number | null };
        tsInfo("useCredits", "select_ok", { credits: row.credits });
        // Se o registro existe mas a coluna 'credits' está nula/indefinida, inicializa com 2
        if (row.credits === null || typeof row.credits === "undefined") {
          const init = await db
            .from("user_credits")
            .upsert({ email, credits: 2 }, { onConflict: "email" })
            .select("credits")
            .single();
          const initial = (init.data as { credits?: number | null } | null)?.credits ?? 2;
          setBalance(initial);
          if (FLAGS.creditsLocalCache && typeof window !== "undefined") {
            window.localStorage.setItem(creditsCacheKey(email), String(initial));
          }
          return;
        }
        const next = row.credits ?? 0;
        setBalance(next);
        if (FLAGS.creditsLocalCache && typeof window !== "undefined") {
          window.localStorage.setItem(creditsCacheKey(email), String(next));
        }
        return;
      }

      tsError("useCredits", "select_failed", { error });
      const insertedTry = await db
        .from("user_credits")
        .insert({ email, credits: 2 })
        .select("credits")
        .single();
      if (!insertedTry.error && insertedTry.data) {
        const inserted = insertedTry.data as { credits?: number | null };
        tsInfo("useCredits", "insert_ok", { credits: inserted.credits });
        const next = inserted.credits ?? 2;
        setBalance(next);
        if (FLAGS.creditsLocalCache && typeof window !== "undefined") {
          window.localStorage.setItem(creditsCacheKey(email), String(next));
        }
        return;
      }

      tsError("useCredits", "insert_failed", { error: insertedTry.error });
      const { data: again } = await db
        .from("user_credits")
        .select("credits")
        .eq("email", email)
        .single();
      const reselected = again as { credits?: number | null } | null;
      tsInfo("useCredits", "reselect_after_insert", { credits: reselected?.credits });
      const next = reselected?.credits ?? balance;
      setBalance(next);
      if (FLAGS.creditsLocalCache && typeof window !== "undefined") {
        window.localStorage.setItem(creditsCacheKey(email), String(next));
      }
    } finally {
      setLoading(false);
    }
  }, [balance, email, supabase]);

  /**
   * Reconsulta o saldo no Supabase e atualiza o estado local.
   *
   * @returns `void`
   */
  const refresh = useCallback(async () => {
    if (!email || !supabase) return;
    const db = supabase as any;
    setLoading(true);
    try {
      tsInfo("useCredits", "refresh_start", { email });
      const { data } = await db
        .from("user_credits")
        .select("credits")
        .eq("email", email)
        .single();
      const row = data as { credits?: number | null } | null;
      tsInfo("useCredits", "refresh_ok", { credits: row?.credits });
      const next = row?.credits ?? 0;
      setBalance(next);
      if (FLAGS.creditsLocalCache && typeof window !== "undefined") {
        window.localStorage.setItem(creditsCacheKey(email), String(next));
      }
    } finally {
      setLoading(false);
    }
  }, [email, supabase]);

  /**
   * Consome um crédito do usuário atual.
   *
   * Regras:
   * - Se não houver e-mail ou cliente Supabase, retorna `false`.
   * - Se o saldo local atual for `<= 0`, retorna `false`.
   * - Em caso de sucesso, persiste o novo saldo no Supabase e no cache local.
   *
   * @returns `true` em caso de débito bem-sucedido, `false` caso contrário.
   */
  const consumeCredit = useCallback(async () => {
    if (!email || !supabase) return false;
    if (balance <= 0) return false;
    const db = supabase as any;
    setLoading(true);
    try {
      const next = Math.max(0, balance - 1);
      tsInfo("useCredits", "consume_start", { current: balance, next });
      const { data, error } = await db
        .from("user_credits")
        .upsert({ email, credits: next }, { onConflict: "email" })
        .select("credits")
        .single();
      if (error) {
        tsError("useCredits", "consume_failed", { error });
        return false;
      }
      const row = data as { credits?: number | null } | null;
      tsInfo("useCredits", "consume_ok", { credits: row?.credits });
      const final = row?.credits ?? next;
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

  /**
   * Ajusta o saldo em um delta arbitrário.
   *
   * Uso típico:
   * - adicionar créditos após compra
   * - corrigir saldo operacionalmente
   *
   * @param delta Quantidade a somar/subtrair do saldo atual.
   * @returns Saldo final persistido.
   */
  const updateCredits = useCallback(
    async (delta: number) => {
      if (!email || !supabase) return 0;
      const db = supabase as any;
      setLoading(true);
      try {
        const next = Math.max(0, (balance ?? 0) + (delta ?? 0));
        tsInfo("useCredits", "update_start", { current: balance, delta, next });
        const { data, error } = await db
          .from("user_credits")
          .upsert({ email, credits: next }, { onConflict: "email" })
          .select("credits")
          .single();
        if (error) {
          tsError("useCredits", "update_failed", { error });
          return balance ?? 0;
        }
        const row = data as { credits?: number | null } | null;
        const final = row?.credits ?? next;
        setBalance(final);
        if (FLAGS.creditsLocalCache && typeof window !== "undefined") {
          window.localStorage.setItem(creditsCacheKey(email), String(final));
        }
        tsInfo("useCredits", "update_ok", { credits: final });
        return final;
      } finally {
        setLoading(false);
      }
    },
    [email, supabase, balance]
  );

  const syncBalance = refresh;
  return { balance, loading, refresh, consumeCredit, syncBalance, updateCredits };
}
