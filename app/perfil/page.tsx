"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useCredits } from "@/hooks/useCredits";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Purchases, LOG_LEVEL } from "@revenuecat/purchases-capacitor";
import { Capacitor } from "@capacitor/core";
import Link from "next/link";
import { tsGet, tsReport, tsClear, tsError, tsInfo } from "@/lib/troubleshoot";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Copy, Pin } from "lucide-react";
import { toast } from "sonner";

export default function PerfilPage() {
  const supabaseClient = supabase;
  const [session, setSession] = useState<any>(null);
  const { balance, syncBalance } = useCredits();
  const [ready, setReady] = useState(false);
  const [pack, setPack] = useState<any>(null);
  const [buying, setBuying] = useState(false);

  useEffect(() => {
    if (!supabaseClient) return;
    supabaseClient.auth.getSession().then((res: any) => {
      setSession(res?.data?.session ?? null);
    });
  }, [supabaseClient]);

  useEffect(() => {
    const email = session?.user?.email as string | undefined;
    const apiKey = process.env.NEXT_PUBLIC_REVENUECAT_ANDROID_API_KEY;
    if (!apiKey || !email) {
      tsError("revenuecat", "config_missing", { hasApiKey: !!apiKey, hasEmail: !!email });
      setReady(true);
      return;
    }
    (async () => {
      try {
        tsInfo("revenuecat", "configure_start", { email });
        tsInfo("revenuecat", "app_user_id_prepare", { email });
        await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
        await Purchases.configure({ apiKey, appUserID: email });
        try {
          await Purchases.syncPurchases();
          tsInfo("revenuecat", "sync_purchases_after_config", { ok: true });
        } catch (e: any) {
          tsError("revenuecat", "sync_purchases_after_config_error", { message: e?.message ?? String(e) });
        }
        tsInfo("revenuecat", "app_user_id_configured", { email });
        const offerings: any = await Purchases.getOfferings();
        const all = offerings?.all ?? {};
        let found: any = null;
        for (const k of Object.keys(all)) {
          const off = all[k];
          const candidate =
            off?.availablePackages?.find((p: any) => p?.identifier === "creditos_10") ?? null;
          if (candidate) {
            found = candidate;
            break;
          }
        }
        if (!found) {
          const cur = offerings?.current ?? null;
          found =
            cur?.availablePackages?.find((p: any) => p?.identifier === "creditos_10") ??
            cur?.availablePackages?.[0] ??
            null;
        }
        if (!found) {
          for (const k of Object.keys(all)) {
            const off = all[k];
            const first = off?.availablePackages?.[0] ?? null;
            if (first) {
              found = first;
              break;
            }
          }
        }
        setPack(found);
        setReady(true);
      } catch {
        setReady(true);
      }
    })();
  }, [session]);

  const buy = async () => {
    if (buying) return;
    setBuying(true);
    if (!supabaseClient) {
      toast.error("Supabase não configurado neste ambiente.");
      setBuying(false);
      return;
    }
    if (!Capacitor.isNativePlatform()) {
      toast.error("Compras só estão disponíveis no app instalado.");
      setBuying(false);
      return;
    }
    try {
      // Garante configuração antes da compra
      const emailNow = (await supabaseClient.auth.getSession()).data.session?.user?.email as
        | string
        | undefined;
      const apiKeyNow = process.env.NEXT_PUBLIC_REVENUECAT_ANDROID_API_KEY;
      if (apiKeyNow && emailNow) {
        tsInfo("revenuecat", "configure_start", { email: emailNow });
        await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
        await Purchases.configure({ apiKey: apiKeyNow, appUserID: emailNow });
      } else {
        tsError("revenuecat", "config_missing", {
          hasApiKey: !!apiKeyNow,
          hasEmail: !!emailNow,
        });
      }
      let aPackage = pack;
      if (!aPackage) {
        try {
          const offerings: any = await Purchases.getOfferings();
          const all = offerings?.all ?? {};
          for (const k of Object.keys(all)) {
            const off = all[k];
            const cand =
              off?.availablePackages?.find((p: any) => p?.identifier === "creditos_10") ?? null;
            if (cand) {
              aPackage = cand;
              break;
            }
          }
          if (!aPackage) {
            const cur = offerings?.current ?? null;
            aPackage =
              cur?.availablePackages?.find((p: any) => p?.identifier === "creditos_10") ??
              cur?.availablePackages?.[0] ??
              null;
          }
          if (!aPackage) {
            for (const k of Object.keys(all)) {
              const off = all[k];
              const first = off?.availablePackages?.[0] ?? null;
              if (first) {
                aPackage = first;
                break;
              }
            }
          }
        } catch {}
      }
      if (!aPackage) {
        tsError("revenuecat", "offerings_empty");
        try {
          // Fallback: buscar produto por ID e comprar via purchaseStoreProduct
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
              result = await anyPurchases.purchaseProduct({
                productIdentifier: "creditos_10",
              });
            } else {
              tsError("revenuecat", "purchase_method_missing");
            }
            const purchaserInfo = result?.customerInfo;
            if (purchaserInfo) {
              const email = session?.user?.email as string | undefined;
              if (!email) return;
              tsInfo("revenuecat", "purchase_balance_before", { before: balance ?? 0, add: 10 });
              const next = (balance ?? 0) + 10;
              await (supabaseClient as any)
                .from("user_credits")
                .upsert({ email, credits: next }, { onConflict: "email" });
              tsInfo("revenuecat", "purchase_balance_after", { after: next });
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
      const emailCheck = (await supabaseClient.auth.getSession()).data.session?.user?.email ?? null;
      tsInfo("revenuecat", "app_user_id_check", { email: emailCheck });
      try {
        await Purchases.syncPurchases();
        tsInfo("revenuecat", "sync_purchases_before_purchase", { ok: true });
      } catch (e: any) {
        tsError("revenuecat", "sync_purchases_before_purchase_error", { message: e?.message ?? String(e) });
      }
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
        const email = session?.user?.email as string | undefined;
        if (!email) return;
        tsInfo("revenuecat", "purchase_balance_before", { before: balance ?? 0, add: 10 });
        const next = (balance ?? 0) + 10;
        await (supabaseClient as any).from("user_credits").upsert({ email, credits: next }, { onConflict: "email" });
        tsInfo("revenuecat", "purchase_balance_after", { after: next });
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
      toast.error("Pagamento não concluído");
    } finally {
      setBuying(false);
    }
  };

  const premiumAtivo = (balance ?? 0) > 0;
  const [pinCount, setPinCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [report, setReport] = useState("");
  const handlePin = async () => {
    const c = pinCount + 1;
    setPinCount(c);
    if (c >= 6) {
      if (!supabaseClient) return;
      const sessionNow = await supabaseClient.auth.getSession();
      const emailNow = sessionNow.data.session?.user?.email ?? null;
      // Constrói um sumário de antes/depois das compras + meta de produto (consumível)
      const raw = tsGet();
      const befores = raw.filter((l: any) => l.source === "revenuecat" && l.event === "purchase_balance_before");
      const afters = raw.filter((l: any) => l.source === "revenuecat" && l.event === "purchase_balance_after");
      const metas = raw.filter((l: any) => l.source === "revenuecat" && l.event === "purchase_product_meta");
      const pairs: any[] = [];
      const n = Math.min(befores.length, afters.length);
      for (let i = 0; i < n; i++) {
        const b = befores[i]?.data?.before ?? null;
        const a = afters[i]?.data?.after ?? null;
        const meta = metas[i]?.data ?? {};
        const isConsumable = typeof meta?.isConsumable !== "undefined" ? meta?.isConsumable : null;
        const productCategory = meta?.productCategory ?? null;
        const type = meta?.type ?? null;
        pairs.push({
          before: b,
          after: a,
          delta: typeof b === "number" && typeof a === "number" ? a - b : null,
          isConsumable,
          productCategory,
          type,
        });
      }
      const r = tsReport({
        email: emailNow,
        balance,
        purchases: pairs,
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
    <main className="container mx-auto max-w-3xl p-6 space-y-8">
      <header className="flex items-center justify-between border-b border-primary/10 pb-4">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-extrabold tracking-tight">Perfil</h1>
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
            <Button disabled={!ready || !Capacitor.isNativePlatform()} onClick={buy}>
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
