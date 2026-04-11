import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { CalcOptions, Resultado, calcularParaMarketplace } from "@/lib/calc";
import { useState } from "react";
import { Info } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type Props = {
  results: Resultado[] | null;
  opts?: CalcOptions | null;
};

export default function ResultsCarousel({ results, opts }: Props) {
  if (!results || results.length === 0) return null;
  const f = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  const p = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });
  const fmtBRL = (n: number) => f.format(n);

  const composeMessage = () => {
    const lines: string[] = [];
    const now = new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date());
    lines.push(`*LucraJá* • ${now}`);
    if (opts) {
      lines.push("");
      lines.push(`*Valores Base*`);
      lines.push(`• Preço de venda: ${fmtBRL(opts.precoVenda)}`);
      lines.push(`• Custo pago: ${fmtBRL(opts.custoPago)}`);
      lines.push(`• Imposto MEI (6%): ${opts.incluiImpostoMEI ? "Sim" : "Não"}`);
      lines.push(`• Frete por conta do vendedor (+R$25): ${opts.freteVendedor ? "Sim" : "Não"}`);
    }
    lines.push("");
    lines.push(`*Resultados da Home*`);
    const base = results.filter(
      (r) => r.marketplace.id !== "enjoei" && r.marketplace.id !== "olx_pay"
    );
    for (const r of base) {
      const title =
        r.marketplace.id === "ml_premium"
          ? "ML Premium Antigo"
          : r.marketplace.nome;
      lines.push("");
      lines.push(`📌 *${title}*`);
      lines.push(`- Você recebe: ${fmtBRL(r.voceRecebe)}`);
      lines.push(`- Lucro real: ${fmtBRL(r.lucroReal)}`);
      lines.push(`- Margem: ${p.format(r.margem)}%`);
    }
    if (opts) {
      const enjoeiClassicoMsg = calcularParaMarketplace(
        { id: "enjoei_classic", nome: "Enjoei Clássico", comissao: 0.12, taxaFixa: 5.0, freteGratis: 0, obs: "" },
        opts
      );
      const enjoeiTurbinadoMsg = calcularParaMarketplace(
        { id: "enjoei_turbinado", nome: "Enjoei Turbinado", comissao: 0.18, taxaFixa: 5.0, freteGratis: 0, obs: "" },
        opts
      );
      const olxPadraoMsg = calcularParaMarketplace(
        { id: "olx_padrao", nome: "OLX Padrão", comissao: 0.0, taxaFixa: 0.0, freteGratis: 0, obs: "" },
        opts
      );
      const olxGarantiaMsg = calcularParaMarketplace(
        { id: "olx_garantia", nome: "OLX Pay / Garantia", comissao: 0.10, taxaFixa: 0.0, freteGratis: 0, obs: "" },
        opts
      );
      const extras = [
        enjoeiClassicoMsg,
        enjoeiTurbinadoMsg,
        olxPadraoMsg,
        olxGarantiaMsg,
      ];
      for (const r of extras) {
        lines.push("");
        lines.push(`📌 *${r.marketplace.nome}*`);
        lines.push(`- Você recebe: ${fmtBRL(r.voceRecebe)}`);
        lines.push(`- Lucro real: ${fmtBRL(r.lucroReal)}`);
        lines.push(`- Margem: ${p.format(r.margem)}%`);
      }
      try {
        const ml2026Raw = window.localStorage.getItem("lucraja-ml2026-state");
        if (ml2026Raw) {
          const parsed = JSON.parse(ml2026Raw) as {
            results?: Array<{
              titulo: string;
              impostoMEI: number;
              comissao: number;
              taxaEnvio: number;
              taxasTotais: number;
              valorReceber: number;
              lucroReal: number;
              margem: number;
            }> | null;
          };
          if (parsed.results?.length) {
            lines.push("");
            lines.push(`*Resultados ML 2026*`);
            for (const item of parsed.results) {
              const title = item.titulo === "ML Clássico" ? "ML 2026 (Clássico)" : "ML 2026 (Premium)";
              const emoji = item.titulo === "ML Clássico" ? "🆕" : "🚀";
              lines.push("");
              lines.push(`${emoji} *${title}*`);
              lines.push(`- Imposto MEI: ${fmtBRL(item.impostoMEI)}`);
              lines.push(`- Comissão: ${fmtBRL(item.comissao)}`);
              lines.push(`- Taxa fixa / frete: ${fmtBRL(item.taxaEnvio)}`);
              lines.push(`- Taxas totais: ${fmtBRL(item.taxasTotais)}`);
              lines.push(`- Valor a receber: ${fmtBRL(item.valorReceber)}`);
              lines.push(`- Lucro real: ${fmtBRL(item.lucroReal)}`);
              lines.push(`- Margem: ${p.format(item.margem)}%`);
            }
          }
        }
      } catch {}
      lines.push("");
      lines.push(`Gerado com LucraJá`);
      return lines.join("\n");
    }
    try {
      const ml2026Raw = window.localStorage.getItem("lucraja-ml2026-state");
      if (ml2026Raw) {
        const parsed = JSON.parse(ml2026Raw) as {
          results?: Array<{
            titulo: string;
            impostoMEI: number;
            comissao: number;
            taxaEnvio: number;
            taxasTotais: number;
            valorReceber: number;
            lucroReal: number;
            margem: number;
          }> | null;
        };
        if (parsed.results?.length) {
          lines.push("");
          lines.push(`*Resultados ML 2026*`);
          for (const item of parsed.results) {
            const title = item.titulo === "ML Clássico" ? "ML 2026 (Clássico)" : "ML 2026 (Premium)";
            const emoji = item.titulo === "ML Clássico" ? "🆕" : "🚀";
            lines.push("");
            lines.push(`${emoji} *${title}*`);
            lines.push(`- Imposto MEI: ${fmtBRL(item.impostoMEI)}`);
            lines.push(`- Comissão: ${fmtBRL(item.comissao)}`);
            lines.push(`- Taxa fixa / frete: ${fmtBRL(item.taxaEnvio)}`);
            lines.push(`- Taxas totais: ${fmtBRL(item.taxasTotais)}`);
            lines.push(`- Valor a receber: ${fmtBRL(item.valorReceber)}`);
            lines.push(`- Lucro real: ${fmtBRL(item.lucroReal)}`);
            lines.push(`- Margem: ${p.format(item.margem)}%`);
          }
        }
      }
    } catch {}
    lines.push("");
    lines.push(`Gerado com LucraJá`);
    return lines.join("\n");
  };

  const shareWhatsApp = () => {
    const text = composeMessage();
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  const shareEmail = () => {
    const text = composeMessage();
    const subject = "LucraJá – Resultado do cálculo";
    const url = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
    window.location.href = url;
  };

  const InfoPin = ({ text }: { text: string }) => {
    const [open, setOpen] = useState(false);
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label="Informação"
            className="rounded-full p-1 text-gray-400 hover:text-gray-200"
            onPointerDown={() => setOpen(true)}
            onPointerUp={() => setOpen(false)}
            onPointerLeave={() => setOpen(false)}
            onTouchStart={() => setOpen(true)}
            onTouchEnd={() => setOpen(false)}
          >
            <Info className="h-4 w-4" />
          </button>
        </PopoverTrigger>
        <PopoverContent side="top" align="center" className="max-w-xs">
          {text}
        </PopoverContent>
      </Popover>
    );
  };

  const ResultCard = ({
    title,
    infoText,
    r,
  }: {
    title: string;
    infoText?: string;
    r: Resultado;
  }) => (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>{title}</CardTitle>
        {infoText ? <InfoPin text={infoText} /> : null}
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-2 text-sm">
        <div>Imposto MEI: {fmtBRL(r.impostoMEI)}</div>
        <div>Comissão: {fmtBRL(r.comissao)}</div>
        <div>Taxa fixa: {fmtBRL(r.taxaFixa)}</div>
        <div>Taxas totais: {fmtBRL(r.taxasTotais)}</div>
        <div>Você recebe: {fmtBRL(r.voceRecebe)}</div>
        <div>Lucro real: {fmtBRL(r.lucroReal)}</div>
        <div className="col-span-2 font-semibold">
          Margem sobre custo pago: {p.format(r.margem)}%
        </div>
      </CardContent>
    </Card>
  );

  let enjoeiClassico: Resultado | null = null;
  let enjoeiTurbinado: Resultado | null = null;
  let olxPadrao: Resultado | null = null;
  let olxGarantia: Resultado | null = null;
  if (opts) {
    enjoeiClassico = calcularParaMarketplace(
      { id: "enjoei_classic", nome: "Enjoei Clássico", comissao: 0.12, taxaFixa: 5.0, freteGratis: 0, obs: "" },
      opts
    );
    enjoeiTurbinado = calcularParaMarketplace(
      { id: "enjoei_turbinado", nome: "Enjoei Turbinado", comissao: 0.18, taxaFixa: 5.0, freteGratis: 0, obs: "" },
      opts
    );
    olxPadrao = calcularParaMarketplace(
      { id: "olx_padrao", nome: "OLX Padrão", comissao: 0.0, taxaFixa: 0.0, freteGratis: 0, obs: "" },
      opts
    );
    olxGarantia = calcularParaMarketplace(
      { id: "olx_garantia", nome: "OLX Pay / Garantia", comissao: 0.10, taxaFixa: 0.0, freteGratis: 0, obs: "" },
      opts
    );
  }

  const filtered = results.filter(
    (r) => r.marketplace.id !== "enjoei" && r.marketplace.id !== "olx_pay"
  );

  return (
    <div className="space-y-3">
      {filtered.map((r) => (
        <Card key={r.marketplace.id}>
          <CardHeader>
            <CardTitle>
              {r.marketplace.id === "ml_premium"
                ? "Mercado Livre (Valores antigos - Referência)"
                : r.marketplace.nome}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2 text-sm">
            <div>Imposto MEI: {fmtBRL(r.impostoMEI)}</div>
            <div>Comissão: {fmtBRL(r.comissao)}</div>
            <div>Taxa fixa: {fmtBRL(r.taxaFixa)}</div>
            <div>Taxas totais: {fmtBRL(r.taxasTotais)}</div>
            <div>Você recebe: {fmtBRL(r.voceRecebe)}</div>
            <div>Lucro real: {fmtBRL(r.lucroReal)}</div>
            <div className="col-span-2 font-semibold">
              Margem sobre custo pago: {p.format(r.margem)}%
            </div>
          </CardContent>
        </Card>
      ))}
      {opts && enjoeiClassico && (
        <ResultCard
          title="Enjoei Clássico"
          infoText="Modo padrão do Enjoei. Comissão mais baixa (12%). Ideal para quem quer pagar menos taxa."
          r={enjoeiClassico}
        />
      )}
      {opts && enjoeiTurbinado && (
        <ResultCard
          title="Enjoei Turbinado"
          infoText="Modo com maior visibilidade. Comissão de 18%. O anúncio fica mais destacado na plataforma."
          r={enjoeiTurbinado}
        />
      )}
      {opts && olxPadrao && <ResultCard title="OLX Padrão" r={olxPadrao} />}
      {opts && olxGarantia && (
        <ResultCard
          title="OLX Pay / Garantia"
          infoText="Modalidade OLX Pay/Garantia oferece proteção ao comprador e maior segurança na entrega. Comissão de até 10% (pior caso). Vantagem: maior confiança do comprador e possibilidade de vendas mais rápidas."
          r={olxGarantia}
        />
      )}
      <Card>
        <CardHeader>
          <CardTitle>Compartilhar resultados</CardTitle>
        </CardHeader>
        <CardFooter className="gap-2">
          <Button onClick={shareWhatsApp}>Enviar por WhatsApp</Button>
          <Button variant="secondary" onClick={shareEmail}>Enviar por Email</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
