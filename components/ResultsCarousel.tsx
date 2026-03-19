import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { CalcOptions, Resultado } from "@/lib/calc";

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
    lines.push(`*LucraJá – Resultado do cálculo*`);
    if (opts) {
      lines.push("");
      lines.push(`*Parâmetros*`);
      lines.push(`• Preço de venda: ${fmtBRL(opts.precoVenda)}`);
      lines.push(`• Custo pago: ${fmtBRL(opts.custoPago)}`);
      lines.push(`• Imposto MEI (6%): ${opts.incluiImpostoMEI ? "Sim" : "Não"}`);
      lines.push(`• Frete por conta do vendedor (+R$25): ${opts.freteVendedor ? "Sim" : "Não"}`);
    }
    lines.push("");
    lines.push(`*Resultados por marketplace*`);
    for (const r of results) {
      lines.push("");
      lines.push(`*${r.marketplace.nome}*`);
      lines.push(`- Imposto MEI: ${fmtBRL(r.impostoMEI)}`);
      lines.push(`- Comissão: ${fmtBRL(r.comissao)}`);
      lines.push(`- Taxa fixa: ${fmtBRL(r.taxaFixa)}`);
      lines.push(`- Taxas totais: ${fmtBRL(r.taxasTotais)}`);
      lines.push(`- Você recebe: ${fmtBRL(r.voceRecebe)}`);
      lines.push(`- Lucro real: ${fmtBRL(r.lucroReal)}`);
      lines.push(`- Margem: ${p.format(r.margem)}%`);
    }
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

  return (
    <div className="space-y-3">
      {results.map((r) => (
        <Card key={r.marketplace.id}>
          <CardHeader>
            <CardTitle>{r.marketplace.nome}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2 text-sm">
            <div>Imposto MEI: {fmtBRL(r.impostoMEI)}</div>
            <div>Comissão: {fmtBRL(r.comissao)}</div>
            <div>Taxa fixa: {fmtBRL(r.taxaFixa)}</div>
            <div>Taxas totais: {fmtBRL(r.taxasTotais)}</div>
            <div>Você recebe: {fmtBRL(r.voceRecebe)}</div>
            <div>Lucro real: {fmtBRL(r.lucroReal)}</div>
            <div className="col-span-2 font-semibold">
              Margem: {p.format(r.margem)}%
            </div>
          </CardContent>
        </Card>
      ))}
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
