"use client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
export default function TermosPage() {
  return (
    <main className="container mx-auto max-w-3xl p-6 space-y-8">
      <header className="flex items-center justify-between border-b border-primary/10 pb-4">
        <h1 className="text-3xl font-extrabold tracking-tight">Termos de Uso – LucraJá</h1>
        <Button asChild>
          <Link href="/">Voltar para Home</Link>
        </Button>
      </header>
      <section className="prose prose-invert max-w-none text-base leading-relaxed">
        <h2 className="text-xl font-bold">Natureza do Serviço</h2>
        <p>
          O LucraJá é um simulador de margens e apresenta estimativas baseadas em parâmetros
          fornecidos por você. Os valores de impostos, taxas fixas e comissões exibidos são
          baseados em informações públicas fornecidas pelas próprias plataformas de marketplace.
        </p>

        <h2 className="text-xl font-bold mt-6">Estimativas de Frete</h2>
        <p>
          O valor sugerido de <strong>R$ 25,00</strong> para frete por conta do vendedor é uma mera
          estimativa de mercado. O custo real pode variar de forma significativa em função de
          <strong> peso</strong>, <strong>dimensões</strong>, <strong>distância</strong> (origem/destino)
          e da <strong>transportadora</strong> escolhida. Ajuste esse valor conforme a sua realidade
          operacional.
        </p>

        <h2 className="text-xl font-bold mt-6">Responsabilidade</h2>
        <p>
          O LucraJá <strong>não garante resultados financeiros</strong>. As estimativas são apenas
          referenciais e não substituem sua avaliação de custos, tributos e estratégia comercial.
          A decisão final de precificação é de total responsabilidade do vendedor.
        </p>

        <h2 className="text-xl font-bold mt-6">Suporte</h2>
        <p>
          Para dúvidas, contate: <a href="mailto:licitmasa_suporte@proton.me">licitmasa_suporte@proton.me</a>.
        </p>
      </section>
    </main>
  );
}
