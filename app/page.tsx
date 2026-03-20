"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase"; // Ajuste o caminho conforme seu projeto
import { useCredits } from "@/hooks/useCredits";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GoogleIcon } from "@/components/icons/GoogleIcon"; // Ícone opcional
import CalculatorForm from "@/components/CalculatorForm";
import ResultsCarousel from "@/components/ResultsCarousel";
import HamburgerMenu from "@/components/HamburgerMenu";
import { Purchases, LOG_LEVEL } from "@revenuecat/purchases-capacitor";
import { Capacitor } from "@capacitor/core";
import { App as CapacitorApp } from "@capacitor/app";
import { calcularTodos, CalcOptions, Resultado } from "@/lib/calc";
import { toast } from "sonner";
import { tsError, tsInfo } from "@/lib/troubleshoot";

export default function Page() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { balance, consumeCredit, syncBalance, updateCredits } = useCredits();
  const [rcReady, setRcReady] = useState(false);
  const [defaultOffering, setDefaultOffering] = useState<any>(null);
  const [credito10Package, setCredito10Package] = useState<any>(null);
  const [results, setResults] = useState<Resultado[] | null>(null);
  const [lastOpts, setLastOpts] = useState<CalcOptions | null>(null);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    // 1. Verificar sessão atual
    supabase.auth.getSession().then(({ data: { session } }: any) => {
      setSession(session);
      setLoading(false);
    });

    // 2. Ouvir mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const init = async () => {
      const email = session?.user?.email as string | undefined;
      const apiKey = process.env.NEXT_PUBLIC_REVENUECAT_ANDROID_API_KEY;
      if (!apiKey || !email) {
        tsError("revenuecat", "config_missing", { hasApiKey: !!apiKey, hasEmail: !!email });
        return;
      }
      try {
        await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
        tsInfo("revenuecat", "configure_start", { email });
        await Purchases.configure({ apiKey, appUserID: email });
        try {
          await Purchases.syncPurchases();
          tsInfo("revenuecat", "sync_purchases_after_config", { ok: true });
        } catch (e: any) {
          tsError("revenuecat", "sync_purchases_after_config_error", { message: e?.message ?? String(e) });
        }
        setRcReady(true);
        const loadOfferings = async () => {
          const offerings: any = await Purchases.getOfferings();
          const all = offerings?.all ?? {};
          let foundPackage: any = null;
          let chosenOffering: any = null;
          for (const k of Object.keys(all)) {
            const off = all[k];
            const candidate =
              off?.availablePackages?.find((p: any) => p?.identifier === "credito10") ?? null;
            if (candidate) {
              foundPackage = candidate;
              chosenOffering = off;
              break;
            }
          }
          if (!foundPackage) {
            const cur = offerings?.current ?? null;
            chosenOffering = cur;
            foundPackage =
              cur?.availablePackages?.find((p: any) => p?.identifier === "credito10") ??
              cur?.availablePackages?.[0] ??
              null;
          }
          // Fallback extra: pega o primeiro pacote disponível de qualquer offering
          if (!foundPackage) {
            for (const k of Object.keys(all)) {
              const off = all[k];
              const first = off?.availablePackages?.[0] ?? null;
              if (first) {
                foundPackage = first;
                chosenOffering = off;
                break;
              }
            }
          }
          setDefaultOffering(chosenOffering);
          setCredito10Package(foundPackage);
          return Boolean(foundPackage);
        };
        await loadOfferings();
      } catch {
        setRcReady(false);
      }
    };
    init();
  }, [session]);

  // Captura deep link de retorno do Supabase (Android - Capacitor)
  useEffect(() => {
    const sub = CapacitorApp.addListener("appUrlOpen", async (data: any) => {
      const url = data?.url as string | undefined;
      if (url && url.startsWith("com.lucraja.app://login-callback")) {
        try {
          // Fallback 1: se vier access_token/refresh_token na URL, setar sessão manualmente
          const parseParams = (u: string) => {
            const parts = u.split("#");
            const hash = parts[1] ?? "";
            const q = parts[0].split("?")[1] ?? "";
            const toSearch = new URLSearchParams(hash || q);
            return {
              access_token: toSearch.get("access_token"),
              refresh_token: toSearch.get("refresh_token"),
            };
          };
          const { access_token, refresh_token } = parseParams(url);
          if (access_token && refresh_token) {
            const { data: res, error } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            } as any);
            if (!error && res?.session) {
              setSession(res.session as any);
              return;
            }
          }
          // Fallback 2: fluxo PKCE padrão
          try {
            const { data: res, error } = await supabase.auth.exchangeCodeForSession(url);
            if (!error && res?.session) {
              setSession(res.session as any);
              return;
            }
          } catch {}
        } catch {
        }
      }
    });
    return () => {
      // @ts-ignore
      sub?.remove?.();
    };
  }, []);

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        // Em ambiente nativo (Capacitor), usamos o esquema do app; no navegador/PC, usamos o origin.
        redirectTo: Capacitor.isNativePlatform()
          ? "com.lucraja.app://login-callback"
          : window.location.origin,
      },
    });
  };

  const handleBuyCredito10 = async () => {
    if (purchasing) return;
    setPurchasing(true);
    try {
      // Garante configuração mesmo se rcReady ainda não marcou true
      if (!rcReady) {
        const emailNow = (await supabase.auth.getSession()).data.session?.user?.email as
          | string
          | undefined;
        const apiKeyNow = process.env.NEXT_PUBLIC_REVENUECAT_ANDROID_API_KEY;
        if (apiKeyNow && emailNow) {
          tsInfo("revenuecat", "configure_start", { email: emailNow });
          tsInfo("revenuecat", "app_user_id_prepare", { email: emailNow });
          await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
          await Purchases.configure({ apiKey: apiKeyNow, appUserID: emailNow });
          tsInfo("revenuecat", "app_user_id_configured", { email: emailNow });
          setRcReady(true);
        } else {
          tsError("revenuecat", "config_missing", {
            hasApiKey: !!apiKeyNow,
            hasEmail: !!emailNow,
          });
        }
      }
      // Checagem extra do appUserID imediatamente antes da compra
      const emailCheck = (await supabase.auth.getSession()).data.session?.user?.email ?? null;
      tsInfo("revenuecat", "app_user_id_check", { email: emailCheck });
      try {
        await Purchases.syncPurchases();
        tsInfo("revenuecat", "sync_purchases_before_purchase", { ok: true });
      } catch (e: any) {
        tsError("revenuecat", "sync_purchases_before_purchase_error", { message: e?.message ?? String(e) });
      }
      tsInfo("revenuecat", "purchase_click", { want: "creditos_10" });
      let aPackage = credito10Package;
      if (!aPackage) {
        // tentativa de recarregar ofertas antes de falhar
        try {
          const offerings: any = await Purchases.getOfferings();
          const all = offerings?.all ?? {};
          for (const k of Object.keys(all)) {
            const off = all[k];
            const cand =
              off?.availablePackages?.find((p: any) => p?.identifier === "creditos_10") ?? null;
            if (cand) {
              aPackage = cand;
              setDefaultOffering(off);
              setCredito10Package(cand);
              break;
            }
          }
          if (!aPackage) {
            const cur = offerings?.current ?? null;
            const cand =
              cur?.availablePackages?.find((p: any) => p?.identifier === "creditos_10") ??
              cur?.availablePackages?.[0] ??
              null;
            if (cand) {
              aPackage = cand;
              setDefaultOffering(cur);
              setCredito10Package(cand);
            }
          }
          // Fallback extra: primeiro pacote disponível em qualquer offering
          if (!aPackage) {
            for (const k of Object.keys(all)) {
              const off = all[k];
              const first = off?.availablePackages?.[0] ?? null;
              if (first) {
                aPackage = first;
                setDefaultOffering(off);
                setCredito10Package(first);
                break;
              }
            }
          }
        } catch {}
      }
      if (!aPackage) {
        tsError("revenuecat", "offerings_empty");
        try {
          // Fallback: tentar buscar produto por ID e comprar via purchaseStoreProduct
          const anyPurchases: any = Purchases as any;
          let storeProduct: any | null = null;
          if (typeof anyPurchases.getProducts === "function") {
            tsInfo("revenuecat", "products_fetch_start", { ids: ["creditos_10"] });
            try {
              let prods =
                (await anyPurchases.getProducts({ productIdentifiers: ["creditos_10"] })) ?? null;
              if (!prods) {
                prods = await anyPurchases.getProducts({ productIds: ["creditos_10"] });
              }
              const list = Array.isArray(prods) ? prods : prods?.products ?? [];
              storeProduct = list?.[0] ?? null;
            } catch (e: any) {
              tsError("revenuecat", "products_fetch_error", { message: String(e) });
            }
          } else if (typeof anyPurchases.getStoreProducts === "function") {
            tsInfo("revenuecat", "store_products_fetch_start", { ids: ["creditos_10"] });
            try {
              let prods =
                (await anyPurchases.getStoreProducts({
                  productIdentifiers: ["creditos_10"],
                })) ?? null;
              if (!prods) {
                prods = await anyPurchases.getStoreProducts({ productIds: ["creditos_10"] });
              }
              const list = Array.isArray(prods) ? prods : prods?.products ?? [];
              storeProduct = list?.[0] ?? null;
            } catch (e: any) {
              tsError("revenuecat", "store_products_fetch_error", { message: String(e) });
            }
          }
          if (storeProduct) {
            tsInfo("revenuecat", "purchase_product_meta", {
              id: storeProduct?.identifier ?? storeProduct?.id ?? "unknown",
              productCategory: storeProduct?.productCategory ?? storeProduct?.category ?? null,
              type: storeProduct?.type ?? null,
              isConsumable: storeProduct?.isConsumable ?? null,
            });
            tsInfo("revenuecat", "purchase_store_product_start", {
              identifier: storeProduct?.identifier ?? "unknown",
            });
            let result: any = null;
            if (typeof anyPurchases.purchaseStoreProduct === "function") {
              result = await anyPurchases.purchaseStoreProduct({ product: storeProduct });
            } else if (typeof anyPurchases.purchaseProduct === "function") {
              // Degrau de compatibilidade
              result = await anyPurchases.purchaseProduct({
                productIdentifier: "creditos_10",
              });
            } else {
              tsError("revenuecat", "purchase_method_missing");
            }
            const purchaserInfo = result?.customerInfo;
            if (purchaserInfo) {
              tsInfo("revenuecat", "purchase_balance_before", { before: balance ?? 0, add: 10 });
              const final = await updateCredits(10);
              tsInfo("revenuecat", "purchase_balance_after", { after: final });
              await syncBalance();
              toast.success("Sucesso! 10 créditos adicionados");
              return;
            }
          } else {
            tsError("revenuecat", "store_product_not_found", { id: "creditos_10" });
          }
        } catch (e) {
          tsError("revenuecat", "purchase_store_product_error", { message: String(e) });
        }
        toast.error("Pacote de 10 créditos indisponível no momento");
        return;
      }
      // Loga metadados do produto/pacote para inferir se é consumível
      const spMeta: any = (aPackage as any)?.storeProduct ?? (aPackage as any)?.product ?? null;
      if (spMeta) {
        tsInfo("revenuecat", "purchase_product_meta", {
          id: spMeta?.identifier ?? spMeta?.id ?? "unknown",
          productCategory: spMeta?.productCategory ?? spMeta?.category ?? null,
          type: spMeta?.type ?? null,
          isConsumable: spMeta?.isConsumable ?? null,
        });
      }
      tsInfo("revenuecat", "purchase_start", {
        identifier: aPackage?.identifier ?? "unknown",
      });
      const result: any = await Purchases.purchasePackage({ aPackage });
      const purchaserInfo = result?.customerInfo;
      if (purchaserInfo) {
        tsInfo("revenuecat", "purchase_balance_before", { before: balance ?? 0, add: 10 });
        const final = await updateCredits(10);
        tsInfo("revenuecat", "purchase_balance_after", { after: final });
        await syncBalance();
        toast.success("Sucesso! 10 créditos adicionados");
      }
    } catch (e: any) {
      const billingResponseCode =
        e?.billingResponseCode ??
        e?.googlePlayErrorCode ??
        e?.googleErrorCode ??
        e?.responseCode ??
        (typeof e?.code === "number" ? e?.code : undefined) ??
        (typeof e?.code === "string" ? parseInt(e?.code, 10) : undefined) ??
        null;
      tsError("revenuecat", "purchase_error", {
        message: e?.message ?? String(e),
        code: e?.code ?? null,
        readableErrorCode: e?.readableErrorCode ?? null,
        billingResponseCode: Number.isFinite(billingResponseCode) ? billingResponseCode : null,
      });
      // opcionalmente podemos exibir um erro amigável
      toast.error("Pagamento não concluído");
    } finally {
      setPurchasing(false);
    }
  };

  const handleCalculate = async (opts: CalcOptions) => {
    try {
      const r = calcularTodos(opts);
      setResults(r);
      setLastOpts(opts);
      const ok = await consumeCredit();
      return ok;
    } catch {
      return false;
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="animate-pulse text-gray-500">A carregar LucraJá...</p>
      </div>
    );
  }

  // TELA DE LOGIN OBRIGATÓRIO
  if (!session) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6 text-center">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary">LucraJá</h1>
          <p className="mt-2 text-gray-600">
            A ferramenta definitiva para calcular a sua margem nos marketplaces.
          </p>
        </div>
        
        <Card className="w-full max-w-md border-2 border-primary/10 shadow-xl">
          <CardHeader>
            <CardTitle>Bem-vindo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-500">
              Para garantir a segurança dos seus dados e gerir os seus créditos, o acesso é feito exclusivamente via Google.
            </p>
            <Button 
              onClick={handleLogin} 
              className="w-full gap-2 py-6 text-lg"
            >
              <GoogleIcon className="w-5 h-5" />
              Entrar com Google
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // TELA PRINCIPAL DO APP (SÓ ACESSÍVEL SE LOGADO)
  return (
    <main className="container mx-auto max-w-2xl p-4 space-y-6">
      <header className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <HamburgerMenu />
          <h1 className="text-2xl font-bold">LucraJá</h1>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">{session.user.email}</p>
          <span className="text-sm font-semibold text-primary">
            Créditos: {balance ?? "..."}
          </span>
        </div>
      </header>

      <div className="flex gap-3">
        <Button disabled={!Capacitor.isNativePlatform() || purchasing} onClick={handleBuyCredito10}>
          Comprar 10 créditos
        </Button>
      </div>

      <CalculatorForm balance={balance} onSubmit={handleCalculate} />
      <ResultsCarousel results={results} opts={lastOpts} />
    </main>
  );
}
