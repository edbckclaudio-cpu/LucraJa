"use client";

import Link from "next/link";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowLeft, CheckCircle2, ExternalLink, Info, Pin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  DialogClose,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useCredits } from "@/hooks/useCredits";
import { CalcOptions, Resultado, calcularParaMarketplace, calcularTodos } from "@/lib/calc";
import { toast } from "sonner";

type Reputation = "verde" | "amarela";

type Ml2026Draft = {
  custoPago: number;
  precoVenda: number;
  pesoKg: number;
  incluiImpostoMEI: boolean;
  reputacao: Reputation;
};

type Ml2026Result = {
  titulo: string;
  impostoMEI: number;
  comissao: number;
  taxaEnvio: number;
  taxasTotais: number;
  valorReceber: number;
  lucroReal: number;
  margem: number;
};

type Ml2026State = {
  draft: Ml2026Draft;
  results: Ml2026Result[] | null;
};

type UnifiedResultItem = {
  emoji: string;
  title: string;
  impostoMEI: number;
  comissao: number;
  taxa: number;
  taxasTotais: number;
  valorReceber: number;
  lucroReal: number;
  margem: number;
};

type RateRow = {
  label: string;
  maxKg: number;
  ate18: number;
  ate48: number;
  ate78: number;
  ate99: number;
  ate119: number;
  ate149: number;
  ate199: number;
  acima200: number;
};

const storageKey = "lucraja-ml2026-state";
const homeStorageKey = "lucraja-home-state";
const processedBaseKey = "lucraja-last-processed-base";
const defaultMl2026State: Ml2026State = {
  draft: {
    custoPago: 0,
    precoVenda: 79,
    pesoKg: 0.3,
    incluiImpostoMEI: false,
    reputacao: "verde",
  },
  results: null,
};

const ml2026Rates: RateRow[] = [
  { label: "Até 0,3 kg", maxKg: 0.3, ate18: 5.65, ate48: 6.55, ate78: 7.75, ate99: 12.35, ate119: 14.35, ate149: 16.45, ate199: 18.45, acima200: 20.95 },
  { label: "De 0,3 a 0,5 kg", maxKg: 0.5, ate18: 5.95, ate48: 6.65, ate78: 7.85, ate99: 13.25, ate119: 15.45, ate149: 17.65, ate199: 19.85, acima200: 22.55 },
  { label: "De 0,5 a 1 kg", maxKg: 1, ate18: 6.05, ate48: 6.75, ate78: 7.95, ate99: 13.85, ate119: 16.15, ate149: 18.45, ate199: 20.75, acima200: 23.65 },
  { label: "De 1 a 1,5 kg", maxKg: 1.5, ate18: 6.15, ate48: 6.85, ate78: 8.05, ate99: 14.15, ate119: 16.45, ate149: 18.85, ate199: 21.15, acima200: 24.65 },
  { label: "De 1,5 a 2 kg", maxKg: 2, ate18: 6.25, ate48: 6.95, ate78: 8.15, ate99: 14.45, ate119: 16.85, ate149: 19.25, ate199: 21.65, acima200: 24.65 },
  { label: "De 2 a 3 kg", maxKg: 3, ate18: 6.35, ate48: 7.95, ate78: 8.55, ate99: 15.75, ate119: 18.35, ate149: 21.05, ate199: 23.65, acima200: 26.25 },
  { label: "De 3 a 4 kg", maxKg: 4, ate18: 6.45, ate48: 8.15, ate78: 8.95, ate99: 17.05, ate119: 19.85, ate149: 22.65, ate199: 25.55, acima200: 28.35 },
  { label: "De 4 a 5 kg", maxKg: 5, ate18: 6.55, ate48: 8.35, ate78: 9.75, ate99: 18.45, ate119: 21.55, ate149: 24.65, ate199: 27.75, acima200: 30.75 },
  { label: "De 5 a 6 kg", maxKg: 6, ate18: 6.65, ate48: 8.55, ate78: 9.95, ate99: 25.45, ate119: 28.55, ate149: 32.65, ate199: 35.75, acima200: 39.75 },
  { label: "De 6 a 7 kg", maxKg: 7, ate18: 6.75, ate48: 8.75, ate78: 10.15, ate99: 27.05, ate119: 31.05, ate149: 36.05, ate199: 40.05, acima200: 44.05 },
  { label: "De 7 a 8 kg", maxKg: 8, ate18: 6.85, ate48: 8.95, ate78: 10.35, ate99: 28.85, ate119: 33.65, ate149: 38.45, ate199: 43.25, acima200: 48.05 },
  { label: "De 8 a 9 kg", maxKg: 9, ate18: 6.95, ate48: 9.15, ate78: 10.55, ate99: 29.65, ate119: 34.55, ate149: 39.55, ate199: 44.45, acima200: 49.35 },
  { label: "De 9 a 11 kg", maxKg: 11, ate18: 7.05, ate48: 9.55, ate78: 10.95, ate99: 41.25, ate119: 48.05, ate149: 54.95, ate199: 61.75, acima200: 68.65 },
  { label: "De 11 a 13 kg", maxKg: 13, ate18: 7.15, ate48: 9.95, ate78: 11.35, ate99: 42.15, ate119: 49.25, ate149: 56.25, ate199: 63.25, acima200: 70.25 },
  { label: "De 13 a 15 kg", maxKg: 15, ate18: 7.25, ate48: 10.15, ate78: 11.55, ate99: 45.05, ate119: 52.45, ate149: 59.95, ate199: 67.45, acima200: 74.95 },
  { label: "De 15 a 17 kg", maxKg: 17, ate18: 7.35, ate48: 10.35, ate78: 11.75, ate99: 48.55, ate119: 56.05, ate149: 63.55, ate199: 70.75, acima200: 78.65 },
  { label: "De 17 a 20 kg", maxKg: 20, ate18: 7.45, ate48: 10.55, ate78: 11.95, ate99: 54.75, ate119: 63.85, ate149: 72.95, ate199: 82.05, acima200: 91.15 },
  { label: "De 20 a 25 kg", maxKg: 25, ate18: 7.65, ate48: 10.95, ate78: 12.15, ate99: 64.05, ate119: 75.05, ate149: 84.75, ate199: 95.35, acima200: 105.95 },
  { label: "De 25 a 30 kg", maxKg: 30, ate18: 7.75, ate48: 11.15, ate78: 12.35, ate99: 65.95, ate119: 75.45, ate149: 85.55, ate199: 96.25, acima200: 106.95 },
  { label: "De 30 a 40 kg", maxKg: 40, ate18: 7.85, ate48: 11.35, ate78: 12.55, ate99: 67.75, ate119: 78.95, ate149: 88.95, ate199: 99.15, acima200: 107.05 },
  { label: "De 40 a 50 kg", maxKg: 50, ate18: 7.95, ate48: 11.55, ate78: 12.75, ate99: 70.25, ate119: 81.05, ate149: 92.05, ate199: 102.55, acima200: 110.75 },
  { label: "De 50 a 60 kg", maxKg: 60, ate18: 8.05, ate48: 11.75, ate78: 12.95, ate99: 74.95, ate119: 86.45, ate149: 98.15, ate199: 109.35, acima200: 118.15 },
  { label: "De 60 a 70 kg", maxKg: 70, ate18: 8.15, ate48: 11.95, ate78: 13.15, ate99: 80.25, ate119: 92.95, ate149: 105.05, ate199: 117.15, acima200: 126.55 },
  { label: "De 70 a 80 kg", maxKg: 80, ate18: 8.25, ate48: 12.15, ate78: 13.35, ate99: 83.95, ate119: 97.05, ate149: 109.85, ate199: 122.45, acima200: 132.25 },
  { label: "De 80 a 90 kg", maxKg: 90, ate18: 8.35, ate48: 12.35, ate78: 13.55, ate99: 93.25, ate119: 107.45, ate149: 122.05, ate199: 136.05, acima200: 146.95 },
  { label: "De 90 a 100 kg", maxKg: 100, ate18: 8.45, ate48: 12.55, ate78: 13.75, ate99: 106.55, ate119: 123.95, ate149: 139.55, ate199: 155.55, acima200: 167.95 },
  { label: "De 100 a 125 kg", maxKg: 125, ate18: 8.55, ate48: 12.75, ate78: 13.95, ate99: 119.25, ate119: 138.05, ate149: 156.05, ate199: 173.95, acima200: 187.95 },
  { label: "De 125 a 150 kg", maxKg: 150, ate18: 8.65, ate48: 12.75, ate78: 14.15, ate99: 126.55, ate119: 146.15, ate149: 165.65, ate199: 184.65, acima200: 199.45 },
  { label: "Mais de 150 kg", maxKg: Number.POSITIVE_INFINITY, ate18: 8.75, ate48: 12.95, ate78: 14.35, ate99: 166.15, ate119: 192.45, ate149: 217.55, ate199: 242.55, acima200: 261.95 },
];

function useBRL(initial = "R$\u00A00,00") {
  const [val, setVal] = useState(initial);
  const number = useMemo(() => {
    const digits = val.replace(/\D/g, "");
    if (!digits) return 0;
    return parseInt(digits, 10) / 100;
  }, [val]);
  const fmt = useMemo(
    () => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }),
    []
  );
  const onChange = (s: string) => {
    const digits = s.replace(/\D/g, "");
    const cents = digits ? parseInt(digits, 10) : 0;
    setVal(fmt.format(cents / 100));
  };
  const setNumber = (n: number) => setVal(fmt.format(n));
  return { val, setVal: onChange, number, setNumber, fmt };
}

function getWeightRow(weightKg: number) {
  return ml2026Rates.find((row) => weightKg <= row.maxKg) ?? ml2026Rates[ml2026Rates.length - 1];
}

function getBaseShippingCost(price: number, weightKg: number) {
  const row = getWeightRow(weightKg);
  if (price <= 18.99) return row.ate18;
  if (price <= 48.99) return row.ate48;
  if (price <= 78.99) return row.ate78;
  if (price <= 99.99) return row.ate99;
  if (price <= 119.99) return row.ate119;
  if (price <= 149.99) return row.ate149;
  if (price <= 199.99) return row.ate199;
  return row.acima200;
}

function calculateMl2026Result(
  title: string,
  commissionRate: number,
  draft: Ml2026Draft
): Ml2026Result {
  const impostoMEI = draft.incluiImpostoMEI ? draft.precoVenda * 0.06 : 0;
  const comissao = draft.precoVenda * commissionRate;
  const baseShipping = getBaseShippingCost(draft.precoVenda, draft.pesoKg);
  const taxaEnvio =
    draft.precoVenda >= 79 && draft.reputacao === "amarela"
      ? Number((baseShipping * 1.2).toFixed(2))
      : baseShipping;
  const taxasTotais = impostoMEI + comissao + taxaEnvio;
  const valorReceber = draft.precoVenda - taxasTotais;
  const lucroReal = valorReceber - draft.custoPago;
  const margem = draft.custoPago > 0 ? (lucroReal / draft.custoPago) * 100 : 0;
  return {
    titulo: title,
    impostoMEI,
    comissao,
    taxaEnvio,
    taxasTotais,
    valorReceber,
    lucroReal,
    margem,
  };
}

function getHomeCalcOptions(base?: { precoVenda: number; custoPago: number }): CalcOptions {
  let source: Partial<CalcOptions> | null = null;
  try {
    const raw = window.localStorage.getItem(homeStorageKey);
    if (raw) {
      const parsed = JSON.parse(raw) as {
        draftOpts?: CalcOptions | null;
        lastOpts?: CalcOptions | null;
      };
      source = parsed.draftOpts ?? parsed.lastOpts ?? null;
    }
  } catch {}

  return {
    precoVenda: base?.precoVenda ?? source?.precoVenda ?? 0,
    custoPago: base?.custoPago ?? source?.custoPago ?? 0,
    incluiImpostoMEI: source?.incluiImpostoMEI ?? false,
    freteVendedor: source?.freteVendedor ?? false,
  };
}

function toUnifiedFromResultado(emoji: string, title: string, result: Resultado): UnifiedResultItem {
  return {
    emoji,
    title,
    impostoMEI: result.impostoMEI,
    comissao: result.comissao,
    taxa: result.taxaFixa,
    taxasTotais: result.taxasTotais,
    valorReceber: result.voceRecebe,
    lucroReal: result.lucroReal,
    margem: result.margem,
  };
}

function toUnifiedFromMl2026(emoji: string, title: string, result: Ml2026Result): UnifiedResultItem {
  return {
    emoji,
    title,
    impostoMEI: result.impostoMEI,
    comissao: result.comissao,
    taxa: result.taxaEnvio,
    taxasTotais: result.taxasTotais,
    valorReceber: result.valorReceber,
    lucroReal: result.lucroReal,
    margem: result.margem,
  };
}

function buildHomeUnifiedItems(base: { precoVenda: number; custoPago: number }) {
  const opts = getHomeCalcOptions(base);
  const baseResults = calcularTodos(opts);
  const shopee = baseResults.find((item) => item.marketplace.id === "shopee");
  const amazon = baseResults.find((item) => item.marketplace.id === "amazon");
  const mlAntigo = baseResults.find((item) => item.marketplace.id === "ml_premium");
  const enjoeiClassico = calcularParaMarketplace(
    { id: "enjoei_classic", nome: "Enjoei Clássico", comissao: 0.12, taxaFixa: 5, freteGratis: 0, obs: "" },
    opts
  );
  const enjoeiTurbinado = calcularParaMarketplace(
    { id: "enjoei_turbinado", nome: "Enjoei Turbinado", comissao: 0.18, taxaFixa: 5, freteGratis: 0, obs: "" },
    opts
  );
  const olxPadrao = calcularParaMarketplace(
    { id: "olx_padrao", nome: "OLX Padrão", comissao: 0, taxaFixa: 0, freteGratis: 0, obs: "" },
    opts
  );
  const olxGarantia = calcularParaMarketplace(
    { id: "olx_garantia", nome: "OLX Pay / Garantia", comissao: 0.1, taxaFixa: 0, freteGratis: 0, obs: "" },
    opts
  );

  return [
    shopee ? toUnifiedFromResultado("🛍️", "Shopee", shopee) : null,
    amazon ? toUnifiedFromResultado("📦", "Amazon", amazon) : null,
    mlAntigo ? toUnifiedFromResultado("📘", "ML Premium Antigo", mlAntigo) : null,
    toUnifiedFromResultado("👕", "Enjoei Clássico", enjoeiClassico),
    toUnifiedFromResultado("✨", "Enjoei Turbinado", enjoeiTurbinado),
    toUnifiedFromResultado("🤝", "OLX Padrão", olxPadrao),
    toUnifiedFromResultado("🛡️", "OLX Pay / Garantia", olxGarantia),
  ].filter((item): item is UnifiedResultItem => item !== null);
}

function ResultCard({
  result,
  infoText,
}: {
  result: Ml2026Result;
  infoText: string;
}) {
  const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  const percent = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });
  return (
    <Card className="border-zinc-800 bg-zinc-900 text-zinc-100">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-lg">{result.titulo}</CardTitle>
        <ModalPin title={`Informações sobre ${result.titulo}`}>
          <div className="whitespace-pre-line text-zinc-200">{infoText}</div>
        </ModalPin>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-2 text-sm">
        <div>Imposto MEI: {money.format(result.impostoMEI)}</div>
        <div>Comissão: {money.format(result.comissao)}</div>
        <div>Taxa fixa / frete: {money.format(result.taxaEnvio)}</div>
        <div>Taxas totais: {money.format(result.taxasTotais)}</div>
        <div>Valor a receber: {money.format(result.valorReceber)}</div>
        <div>Lucro real: {money.format(result.lucroReal)}</div>
        <div className="col-span-2 font-semibold">
          Margem sobre custo pago: {percent.format(result.margem)}%
        </div>
      </CardContent>
    </Card>
  );
}

function ModalPin({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="rounded-full p-1 text-zinc-400 transition hover:text-zinc-100"
          aria-label={title}
        >
          <Info className="h-4 w-4" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-hidden border-zinc-800 bg-zinc-950 text-zinc-100 ring-zinc-800 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="text-xs text-zinc-400">
            Feche no X para voltar ao cálculo.
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto pr-1 text-xs text-zinc-200">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Ml2026Client({ initialState }: { initialState: Ml2026State }) {
  const { balance, consumeCredit } = useCredits();
  const money = useMemo(
    () => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }),
    []
  );
  const percent = useMemo(
    () => new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }),
    []
  );
  const preco = useBRL(money.format(initialState.draft.precoVenda));
  const custo = useBRL(money.format(initialState.draft.custoPago));
  const [pesoKgInput, setPesoKgInput] = useState(String(initialState.draft.pesoKg).replace(".", ","));
  const [incluiImpostoMEI, setIncluiImpostoMEI] = useState(initialState.draft.incluiImpostoMEI);
  const [reputacao, setReputacao] = useState<Reputation>(initialState.draft.reputacao);
  const [results, setResults] = useState<Ml2026Result[] | null>(initialState.results);
  const [calculating, setCalculating] = useState(false);
  const pesoKg = Number(pesoKgInput.replace(",", ".")) || 0;
  const draft = useMemo<Ml2026Draft>(
    () => ({
      custoPago: custo.number,
      precoVenda: preco.number,
      pesoKg,
      incluiImpostoMEI,
      reputacao,
    }),
    [custo.number, incluiImpostoMEI, pesoKg, preco.number, reputacao]
  );
  const currentRow = getWeightRow(Math.max(pesoKg, 0.01));
  const currentBaseCost = getBaseShippingCost(preco.number, Math.max(pesoKg, 0.01));
  const isFreteGratis = preco.number >= 79;

  useEffect(() => {
    try {
      window.localStorage.setItem(
        storageKey,
        JSON.stringify({
          draft,
          results,
        } satisfies Ml2026State)
      );
    } catch {}
  }, [draft, results]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(homeStorageKey);
      const parsed = raw
        ? (JSON.parse(raw) as {
            draftOpts?: CalcOptions | null;
            lastOpts?: CalcOptions | null;
            results?: Resultado[] | null;
          })
        : {};
      const previousBase = parsed.draftOpts ?? parsed.lastOpts ?? null;
      const baseChanged =
        previousBase?.custoPago !== draft.custoPago || previousBase?.precoVenda !== draft.precoVenda;
      const nextDraft: CalcOptions = {
        precoVenda: draft.precoVenda,
        custoPago: draft.custoPago,
        incluiImpostoMEI: draft.incluiImpostoMEI,
        freteVendedor: parsed.draftOpts?.freteVendedor ?? parsed.lastOpts?.freteVendedor ?? false,
      };
      const syncedResults = calcularTodos(nextDraft);
      window.localStorage.setItem(
        homeStorageKey,
        JSON.stringify({
          ...parsed,
          draftOpts: nextDraft,
          lastOpts: baseChanged ? null : nextDraft,
          results: baseChanged ? null : syncedResults,
        })
      );
    } catch {}
  }, [draft.custoPago, draft.incluiImpostoMEI, draft.precoVenda]);

  const homeUnifiedItems = useMemo(
    () => buildHomeUnifiedItems({ precoVenda: draft.precoVenda, custoPago: draft.custoPago }),
    [draft.custoPago, draft.precoVenda]
  );

  const ml2026UnifiedItems = useMemo(
    () =>
      (results ?? []).map((result) =>
        toUnifiedFromMl2026(
          result.titulo === "ML Clássico" ? "🆕" : "🚀",
          result.titulo === "ML Clássico" ? "ML 2026 (Clássico)" : "ML 2026 (Premium)",
          result
        )
      ),
    [results]
  );

  const handleCalculate = async () => {
    if (calculating) return;

    let shouldConsumeCredit = true;
    try {
      const processedRaw = window.localStorage.getItem(processedBaseKey);
      if (processedRaw) {
        const processed = JSON.parse(processedRaw) as {
          precoVenda?: number;
          custoPago?: number;
        };
        shouldConsumeCredit =
          processed.precoVenda !== draft.precoVenda || processed.custoPago !== draft.custoPago;
      }
    } catch {}

    if (shouldConsumeCredit && balance <= 0) {
      toast("Créditos esgotados. Adquira mais para continuar");
      return;
    }

    setCalculating(true);
    try {
      if (shouldConsumeCredit) {
        const ok = await consumeCredit();
        if (!ok) {
          toast("Não foi possível registrar o cálculo");
          return;
        }
        try {
          window.localStorage.setItem(
            processedBaseKey,
            JSON.stringify({
              precoVenda: draft.precoVenda,
              custoPago: draft.custoPago,
              updatedAt: new Date().toISOString(),
            })
          );
        } catch {}
      }

      const nextResults = [
        calculateMl2026Result("ML Clássico", 0.14, draft),
        calculateMl2026Result("ML Premium", 0.19, draft),
      ];
      const nextHomeDraft: CalcOptions = {
        precoVenda: draft.precoVenda,
        custoPago: draft.custoPago,
        incluiImpostoMEI: draft.incluiImpostoMEI,
        freteVendedor: getHomeCalcOptions({
          precoVenda: draft.precoVenda,
          custoPago: draft.custoPago,
        }).freteVendedor,
      };
      setResults(nextResults);
      try {
        window.localStorage.setItem(
          homeStorageKey,
          JSON.stringify({
            draftOpts: nextHomeDraft,
            lastOpts: nextHomeDraft,
            results: calcularTodos(nextHomeDraft),
            updatedAt: new Date().toISOString(),
          })
        );
      } catch {}
      toast(
        shouldConsumeCredit
          ? "Cálculo registrado e crédito consumido"
          : "Mesmo custo e venda da Home. Resultado recalculado sem consumir crédito"
      );
    } finally {
      setCalculating(false);
    }
  };

  const composeShare = () => {
    const lines: string[] = [];
    const now = new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date());
    lines.push(`*LucraJá* • ${now}`);
    lines.push("");
    lines.push("*Valores Base*");
    lines.push(`• Custo pago: ${money.format(draft.custoPago)}`);
    lines.push(`• Preço de venda: ${money.format(draft.precoVenda)}`);
    lines.push(`• Peso: ${percent.format(draft.pesoKg)} kg`);
    lines.push(`• Imposto MEI (6%): ${draft.incluiImpostoMEI ? "Sim" : "Não"}`);
    lines.push(`• Reputação: ${draft.reputacao === "verde" ? "Verde / sem reputação" : "Amarela / sem cor"}`);
    lines.push("");
    lines.push("*Resultados da Home*");
    for (const item of homeUnifiedItems) {
      lines.push("");
      lines.push(`${item.emoji} *${item.title}*`);
      lines.push(`- Você recebe: ${money.format(item.valorReceber)}`);
      lines.push(`- Lucro real: ${money.format(item.lucroReal)}`);
      lines.push(`- Margem: ${percent.format(item.margem)}%`);
    }
    lines.push("");
    lines.push("*Resultados ML 2026*");
    for (const item of ml2026UnifiedItems) {
      lines.push("");
      lines.push(`${item.emoji} *${item.title}*`);
      lines.push(`- Imposto MEI: ${money.format(item.impostoMEI)}`);
      lines.push(`- Comissão: ${money.format(item.comissao)}`);
      lines.push(`- Taxa fixa / frete: ${money.format(item.taxa)}`);
      lines.push(`- Taxas totais: ${money.format(item.taxasTotais)}`);
      lines.push(`- Valor a receber: ${money.format(item.valorReceber)}`);
      lines.push(`- Lucro real: ${money.format(item.lucroReal)}`);
      lines.push(`- Margem: ${percent.format(item.margem)}%`);
    }
    return lines.join("\n");
  };

  const shareWhatsApp = () => {
    const text = composeShare();
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const shareEmail = () => {
    const text = composeShare();
    window.location.href = `mailto:?subject=${encodeURIComponent(
      "LucraJá – Mercado Livre 2026"
    )}&body=${encodeURIComponent(text)}`;
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="container mx-auto max-w-3xl space-y-6 p-6">
        <header className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold tracking-tight">ML 2026</h1>
            <p className="text-sm text-zinc-400">
              Novo simulador em pior caso para acompanhar as mudanças de comissão, custo operacional e frete.
            </p>
          </div>
          <Button asChild variant="outline" className="border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-zinc-800">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Home
            </Link>
          </Button>
        </header>

        <Card className="border-zinc-800 bg-zinc-900 text-zinc-100">
          <CardContent className="space-y-4 p-4">
            <p className="text-sm text-zinc-300">
              O Mercado Livre mudou a estrutura de tarifas e frete. Esta calculadora usa comissões em pior caso
              para Clássico e Premium e aplica a referência oficial por peso e faixa de preço.
            </p>
            <a
              href="https://www.mercadolivre.com.br/ajuda/quanto-custa-vender-um-produto_1338"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm text-sky-400 underline underline-offset-4"
            >
              <Pin className="h-4 w-4" />
              Clique aqui para ver a tabela oficial no site do Mercado Livre
              <ExternalLink className="h-4 w-4" />
            </a>
            <div className="text-sm font-semibold text-primary">Créditos: {balance ?? "..."}</div>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900 text-zinc-100">
          <CardHeader>
            <CardTitle>Novo motor ML 2026</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-sm">Custo pago</label>
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                </div>
                <Input
                  value={custo.val}
                  onChange={(e) => custo.setVal(e.target.value)}
                  inputMode="decimal"
                  className="border-zinc-700 bg-zinc-950 text-zinc-100"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-sm">Preço de venda</label>
                  <div className="flex items-center gap-2">
                    <ModalPin title="Tabela de referência das novas taxas 2026">
                      <div className="space-y-3">
                        <p className="text-zinc-300">
                          Referência oficial por peso e faixa de preço usada no cálculo base do ML 2026.
                        </p>
                        <div className="overflow-x-auto">
                          <table className="min-w-[720px] text-left text-[11px]">
                            <thead className="text-zinc-400">
                              <tr>
                                <th className="px-2 py-2">Peso</th>
                                <th className="px-2 py-2">0–18,99</th>
                                <th className="px-2 py-2">19–48,99</th>
                                <th className="px-2 py-2">49–78,99</th>
                                <th className="px-2 py-2">79–99,99</th>
                                <th className="px-2 py-2">100–119,99</th>
                                <th className="px-2 py-2">120–149,99</th>
                                <th className="px-2 py-2">150–199,99</th>
                                <th className="px-2 py-2">200+</th>
                              </tr>
                            </thead>
                            <tbody>
                              {ml2026Rates.map((row) => (
                                <tr key={row.label} className="border-t border-zinc-800">
                                  <td className="px-2 py-2">{row.label}</td>
                                  <td className="px-2 py-2">{money.format(row.ate18)}</td>
                                  <td className="px-2 py-2">{money.format(row.ate48)}</td>
                                  <td className="px-2 py-2">{money.format(row.ate78)}</td>
                                  <td className="px-2 py-2">{money.format(row.ate99)}</td>
                                  <td className="px-2 py-2">{money.format(row.ate119)}</td>
                                  <td className="px-2 py-2">{money.format(row.ate149)}</td>
                                  <td className="px-2 py-2">{money.format(row.ate199)}</td>
                                  <td className="px-2 py-2">{money.format(row.acima200)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <p className="text-zinc-400">
                          Para reputação amarela ou sem cor em anúncios com frete grátis, o simulador soma 20% sobre o frete base.
                        </p>
                      </div>
                    </ModalPin>
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  </div>
                </div>
                <Input
                  value={preco.val}
                  onChange={(e) => preco.setVal(e.target.value)}
                  inputMode="decimal"
                  className="border-zinc-700 bg-zinc-950 text-zinc-100"
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950 p-3">
                <span className="text-sm">Incluir imposto MEI (6%)</span>
                <Switch checked={incluiImpostoMEI} onCheckedChange={setIncluiImpostoMEI} />
              </div>
            </div>

            <Card className="border-zinc-800 bg-zinc-950 text-zinc-100">
              <CardHeader>
                <CardTitle className="text-base">
                  {isFreteGratis ? "Frete" : "Taxa Operacional por Peso"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-sm">Peso (kg)</label>
                    {pesoKg > 2 ? (
                      <ModalPin title="Regra do peso cubado">
                        <div className="space-y-3 text-zinc-200">
                          <p>Quando a embalagem ocupa muito espaço, o Mercado Livre pode considerar o maior valor entre o peso físico e o peso cubado.</p>
                          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3 text-center text-sm font-semibold">
                            (C × L × A) / 6.000
                          </div>
                          <p className="text-zinc-400">
                            C = comprimento, L = largura, A = altura em centímetros.
                          </p>
                        </div>
                      </ModalPin>
                    ) : null}
                  </div>
                  <Input
                    value={pesoKgInput}
                    onChange={(e) => setPesoKgInput(e.target.value)}
                    inputMode="decimal"
                    placeholder="Ex.: 2,50"
                    className="border-zinc-700 bg-zinc-950 text-zinc-100"
                  />
                </div>

                {isFreteGratis ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <label className="text-sm">Reputação do vendedor</label>
                      <ModalPin title="Reputação e custo de frete">
                        <div className="space-y-2 text-zinc-200">
                          <p>Verde ou sem reputação usa o frete base da tabela de referência.</p>
                          <p>Amarelo ou sem cor paga 20% a mais sobre o frete base no pior caso.</p>
                        </div>
                      </ModalPin>
                    </div>
                    <select
                      value={reputacao}
                      onChange={(e) => setReputacao(e.target.value as Reputation)}
                      className="h-10 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none"
                    >
                      <option value="verde">Verde / sem reputação</option>
                      <option value="amarela">Amarela / sem cor</option>
                    </select>
                  </div>
                ) : null}

                <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3 text-sm text-zinc-300">
                  <div>Faixa de peso atual: <span className="font-semibold text-zinc-100">{currentRow.label}</span></div>
                  <div>{isFreteGratis ? "Frete base atual" : "Taxa operacional atual"}: <span className="font-semibold text-zinc-100">{money.format(currentBaseCost)}</span></div>
                  {isFreteGratis && reputacao === "amarela" ? (
                    <div>Frete em pior caso (amarela / sem cor): <span className="font-semibold text-zinc-100">{money.format(currentBaseCost * 1.2)}</span></div>
                  ) : null}
                </div>
              </CardContent>
            </Card>

            <Button className="w-full" onClick={handleCalculate} disabled={calculating}>
              Calcular Lucro
            </Button>
          </CardContent>
        </Card>

        {results ? (
          <div className="space-y-4">
            {results.map((result) => (
              <ResultCard
                key={result.titulo}
                result={result}
                infoText={
                  result.titulo === "ML Clássico"
                    ? "Comissão menor (média 10-14%).\nExposição média.\nParcelamento com juros para o comprador."
                    : "Comissão maior (média 15-19%).\nExposição máxima.\nParcelamento sem juros para o comprador (o vendedor paga por esse benefício)."
                }
              />
            ))}
            <Card className="border-amber-900/40 bg-amber-950/30 text-amber-100">
              <CardContent className="flex gap-3 p-4 text-sm">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
                <div>
                  <div className="font-semibold">Aviso Importante para o Usuário</div>
                  <div className="text-amber-100/90">
                    Os valores acima são baseados nas tabelas oficiais de 2026 e podem variar de acordo com a categoria específica do produto
                    (ex: Joias possuem taxas diferentes de Eletrodomésticos). Verifique sempre o simulador oficial antes de precificar.
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-zinc-800 bg-zinc-900 text-zinc-100">
              <CardHeader>
                <CardTitle>Compartilhar resultados</CardTitle>
              </CardHeader>
              <CardFooter className="gap-2">
                <Button onClick={shareWhatsApp}>Enviar por WhatsApp</Button>
                <Button variant="secondary" onClick={shareEmail}>
                  Enviar por Email
                </Button>
              </CardFooter>
              <CardContent className="pt-0">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="w-full">Visualizar Resumo Geral</Button>
                  </DialogTrigger>
                  <DialogContent className="border-zinc-800 bg-zinc-950 text-zinc-100 sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Resumo Geral</DialogTitle>
                      <DialogDescription className="text-zinc-400">
                        Comparação direta do valor líquido por plataforma.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 text-sm">
                      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
                        <div><span className="text-zinc-400">Custo Pago:</span> {money.format(draft.custoPago)}</div>
                        <div><span className="text-zinc-400">Preço de Venda:</span> {money.format(draft.precoVenda)}</div>
                      </div>
                      <div className="space-y-2">
                        {[...homeUnifiedItems, ...ml2026UnifiedItems].map((item) => (
                          <div
                            key={item.title}
                            className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2"
                          >
                            <span className="pr-3 text-zinc-200">{item.title}</span>
                            <span className="shrink-0 font-semibold text-zinc-100">
                              {money.format(item.valorReceber)}
                            </span>
                          </div>
                        ))}
                      </div>
                      <DialogClose asChild>
                        <Button variant="secondary" className="w-full">
                          Fechar
                        </Button>
                      </DialogClose>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </div>
    </main>
  );
}

export default function Ml2026Page() {
  if (typeof window === "undefined") {
    return (
      <main className="min-h-screen bg-zinc-950 text-zinc-100">
        <div className="container mx-auto max-w-3xl p-6">
          <Card className="border-zinc-800 bg-zinc-900 text-zinc-100">
            <CardContent className="p-4 text-sm text-zinc-400">A carregar ML 2026...</CardContent>
          </Card>
        </div>
      </main>
    );
  }

  let initialState = defaultMl2026State;
  try {
    const saved = window.localStorage.getItem(storageKey);
    if (saved) {
      initialState = JSON.parse(saved) as Ml2026State;
    }
    const homeSaved = window.localStorage.getItem(homeStorageKey);
    if (homeSaved) {
      const parsedHome = JSON.parse(homeSaved) as {
        draftOpts?: { custoPago: number; precoVenda: number } | null;
        lastOpts?: { custoPago: number; precoVenda: number } | null;
      };
      const homeOpts = parsedHome.draftOpts ?? parsedHome.lastOpts;
      if (homeOpts) {
        const homeChanged =
          initialState.draft.custoPago !== homeOpts.custoPago ||
          initialState.draft.precoVenda !== homeOpts.precoVenda;
        initialState = {
          draft: {
            ...initialState.draft,
            custoPago: homeOpts.custoPago,
            precoVenda: homeOpts.precoVenda,
          },
          results: homeChanged ? null : initialState.results,
        };
      }
    }
  } catch {}

  return <Ml2026Client initialState={initialState} />;
}
