import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

type Props = {
  balance: number;
  onCalculate: () => Promise<boolean>;
};

export default function CalculatorForm({ balance, onCalculate }: Props) {
  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="text-sm text-gray-600">
          Simulador simplificado. Preencha os campos no fluxo completo da página principal.
        </div>
        <Button
          disabled={balance <= 0}
          onClick={async () => {
            if (balance <= 0) {
              toast("Créditos esgotados. Adquira mais para continuar");
              return;
            }
            const ok = await onCalculate();
            if (ok) toast("Cálculo registrado e crédito consumido");
            else toast("Não foi possível consumir crédito");
          }}
        >
          Calcular Lucro
        </Button>
      </CardContent>
    </Card>
  );
}
