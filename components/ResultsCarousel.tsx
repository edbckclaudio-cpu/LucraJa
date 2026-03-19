import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Resultado } from "@/lib/calc";

type Props = {
  results: Resultado[] | null;
};

export default function ResultsCarousel({ results }: Props) {
  if (!results || results.length === 0) return null;
  const f = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  const p = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });
  return (
    <div className="space-y-3">
      {results.map((r) => (
        <Card key={r.marketplace.id}>
          <CardHeader>
            <CardTitle>{r.marketplace.nome}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2 text-sm">
            <div>Imposto MEI: {f.format(r.impostoMEI)}</div>
            <div>Comissão: {f.format(r.comissao)}</div>
            <div>Taxa fixa: {f.format(r.taxaFixa)}</div>
            <div>Taxas totais: {f.format(r.taxasTotais)}</div>
            <div>Você recebe: {f.format(r.voceRecebe)}</div>
            <div>Lucro real: {f.format(r.lucroReal)}</div>
            <div className="col-span-2 font-semibold">
              Margem: {p.format(r.margem)}%
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
