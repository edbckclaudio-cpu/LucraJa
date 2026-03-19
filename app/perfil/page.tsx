"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useCredits } from "@/hooks/useCredits";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Purchases, LOG_LEVEL } from "@revenuecat/purchases-capacitor";
import Link from "next/link";
import { tsGet, tsReport, tsClear } from "@/lib/troubleshoot";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Copy, Pin } from "lucide-react";

export default function PerfilPage() {
  const [session, setSession] = useState<any>(null);
  const { balance, syncBalance } = useCredits();
  const [ready, setReady] = useState(false);
  const [pack, setPack] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });
  }, []);

  useEffect(() => {
    const email = session?.user?.email as string | undefined;
    const apiKey = process.env.NEXT_PUBLIC_REVENUECAT_ANDROID_API_KEY;
    if (!apiKey || !email) return;
    (async () => {
      try {
        await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
        await Purchases.configure({ apiKey, appUserID: email });
        const offerings: any = await Purchases.getOfferings();
        const off = offerings?.all?.default10 ?? offerings?.current ?? null;
        const pk = off?.availablePackages?.find((p: any) => p?.identifier === "credito10") ?? null;
        setPack(pk);
        setReady(true);
      } catch {
        setReady(true);
      }
    })();
  }, [session]);

  const buy = async () => {
    if (!pack) return;
    try {
      const result: any = await Purchases.purchasePackage({ aPackage: pack });
      const purchaserInfo = result?.customerInfo;
      if (purchaserInfo) {
        const email = session?.user?.email as string | undefined;
        if (!email) return;
        const next = (balance ?? 0) + 10;
        await supabase.from("user_credits").upsert({ email, credits: next }, { onConflict: "email" });
        await syncBalance();
      }
    } catch {}
  };

  const premiumAtivo = (balance ?? 0) > 0;
  const [pinCount, setPinCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [report, setReport] = useState("");
  const handlePin = async () => {
    const c = pinCount + 1;
    setPinCount(c);
    if (c >= 6) {
      const sessionNow = await supabase.auth.getSession();
      const emailNow = sessionNow.data.session?.user?.email ?? null;
      const r = tsReport({
        email: emailNow,
        balance,
        logsCount: tsGet().length,
      });
      setReport(r);
      setOpen(true);
      setPinCount(0);
    }
  };
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(report);
    } catch {}
  };

  return (
    <main className="container mx-auto max-w-2xl p-4 space-y-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">Perfil</h1>
          <button onClick={handlePin} aria-label="debug pin" className="rounded p-1 text-gray-400 hover:text-gray-200">
            <Pin className="h-4 w-4" />
          </button>
        </div>
        <Button asChild>
          <Link href="/">Voltar para Home</Link>
        </Button>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Conta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm">Email: {session?.user?.email ?? "—"}</div>
          {premiumAtivo ? (
            <div className="rounded bg-green-600 px-3 py-2 text-white font-semibold inline-block">
              Premium ativo
            </div>
          ) : (
            <Button disabled={!ready || !pack} onClick={buy}>
              Assinar (comprar 10 créditos)
            </Button>
          )}
        </CardContent>
      </Card>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Relatório de diagnóstico</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <textarea readOnly value={report} className="w-full h-64 rounded bg-muted p-2 text-xs" />
            <div className="flex gap-2">
              <Button onClick={handleCopy}>
                <Copy className="mr-2 h-4 w-4" />
                Copiar
              </Button>
              <Button asChild variant="secondary" onClick={() => setOpen(false)}>
                <Link href="/">Voltar ao menu</Link>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
