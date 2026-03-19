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

export default function Page() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { balance, consumeCredit, syncBalance } = useCredits();
  const [rcReady, setRcReady] = useState(false);
  const [defaultOffering, setDefaultOffering] = useState<any>(null);
  const [credito10Package, setCredito10Package] = useState<any>(null);
  const [results, setResults] = useState<Resultado[] | null>(null);
  const [lastOpts, setLastOpts] = useState<CalcOptions | null>(null);

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
      if (!apiKey || !email) return;
      try {
        await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
        await Purchases.configure({ apiKey, appUserID: email });
        setRcReady(true);
        const offerings: any = await Purchases.getOfferings();
        const off = offerings?.all?.default10 ?? offerings?.current ?? null;
        setDefaultOffering(off);
        const pk = off?.availablePackages?.find((p: any) => p?.identifier === "credito10") ?? null;
        setCredito10Package(pk);
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
    if (!rcReady || !credito10Package) return;
    try {
      const result: any = await Purchases.purchasePackage({ aPackage: credito10Package });
      const purchaserInfo = result?.customerInfo;
      if (purchaserInfo) {
        const email = session?.user?.email as string | undefined;
        if (!email) return;
        const next = (balance ?? 0) + 10;
        await supabase
          .from("user_credits")
          .upsert({ email, credits: next }, { onConflict: "email" });
        await syncBalance();
      }
    } catch {
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
        <Button
          disabled={!rcReady || !credito10Package}
          onClick={handleBuyCredito10}
        >
          Comprar 10 créditos
        </Button>
      </div>

      <CalculatorForm balance={balance} onSubmit={handleCalculate} />
      <ResultsCarousel results={results} opts={lastOpts} />
    </main>
  );
}
