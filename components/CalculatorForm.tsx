import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { CalcOptions } from "@/lib/calc";

type Props = {
  balance: number;
  onSubmit: (opts: CalcOptions) => Promise<boolean>;
};

function useBRL(initial = "") {
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
    const num = cents / 100;
    setVal(fmt.format(num));
  };
  const setNumber = (n: number) => setVal(fmt.format(n));
  return { val, setVal: onChange, number, setNumber, fmt };
}

export default function CalculatorForm({ balance, onSubmit }: Props) {
  const preco = useBRL("R$\u00A00,00");
  const custo = useBRL("R$\u00A00,00");
  const [mei, setMei] = useState(false);
  const [frete, setFrete] = useState(false);

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="grid grid-cols-1 gap-3">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-sm">Preço de venda</label>
              <HelpPopover />
            </div>
            <Input
              value={preco.val}
              onChange={(e) => preco.setVal(e.target.value)}
              inputMode="decimal"
              pattern="[0-9.,]*"
              enterKeyHint="done"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm">Custo pago</label>
            <Input
              value={custo.val}
              onChange={(e) => custo.setVal(e.target.value)}
              inputMode="decimal"
              pattern="[0-9.,]*"
              enterKeyHint="done"
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Incluir imposto MEI (6%)</span>
            <Switch checked={mei} onCheckedChange={setMei} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Frete por conta do vendedor (+R$25)</span>
            <Switch checked={frete} onCheckedChange={setFrete} />
          </div>
        </div>
        <Button
          disabled={balance <= 0}
          onClick={async () => {
            if (balance <= 0) {
              toast("Créditos esgotados. Adquira mais para continuar");
              return;
            }
            const ok = await onSubmit({
              precoVenda: preco.number,
              custoPago: custo.number,
              incluiImpostoMEI: mei,
              freteVendedor: frete,
            });
            if (ok) toast("Cálculo registrado e crédito consumido");
            else toast("Não foi possível calcular");
          }}
        >
          Calcular Lucro
        </Button>
      </CardContent>
    </Card>
  );
}

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Info } from "lucide-react";

function HelpPopover() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label="Ajuda sobre preço de venda"
          className="rounded-full p-1 text-gray-400 hover:text-gray-200"
        >
          <Info className="h-5 w-5" />
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Como definir o preço de venda</DialogTitle>
          <DialogDescription>
            Pesquise o preço praticado nas plataformas (Mercado Livre, Amazon, Shopee e outras)
            para posicionar sua oferta de forma competitiva. Valores muito acima da média reduzem
            significativamente a probabilidade de venda. Considere custos, taxas e o preço dos concorrentes
            para definir um valor atrativo com margem sustentável.
            <br />
            <br />
            A margem exibida no LucraJá corresponde a <strong>Lucro real ÷ Custo pago × 100</strong>.
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
