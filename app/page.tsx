"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase"; // Ajuste o caminho conforme seu projeto
import { useCredits } from "@/hooks/useCredits";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GoogleIcon } from "@/components/icons/GoogleIcon"; // Ícone opcional
import CalculatorForm from "@/components/CalculatorForm"; // Seu formulário existente
import ResultsCarousel from "@/components/ResultsCarousel"; // Seus resultados existentes

export default function Page() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { balance, consumeCredit, syncBalance } = useCredits();

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

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
// Se estiver no Android (Capacitor), usamos o scheme. 
      // Se estiver no PC, usamos o origin normal.
      redirectTo: window.location.origin.includes('localhost') 
        ? window.location.origin 
        : 'com.lucraja.app://login-callback',      },
    });
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
        <h1 className="text-2xl font-bold">LucraJá</h1>
        <div className="text-right">
          <p className="text-xs text-gray-500">{session.user.email}</p>
          <span className="text-sm font-semibold text-primary">
            Créditos: {balance ?? "..."}
          </span>
        </div>
      </header>

      {/* Seu formulário e lógica de cálculo abaixo */}
      <CalculatorForm 
        balance={balance} 
        onCalculate={consumeCredit} 
      />
      
      {/* Restante dos componentes do seu app... */}
    </main>
  );
}
