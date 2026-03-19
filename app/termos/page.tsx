"use client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
export default function TermosPage() {
  return (
    <main className="container mx-auto max-w-2xl p-4 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Termos de uso</h1>
        <Button asChild>
          <Link href="/">Voltar para Home</Link>
        </Button>
      </header>
      <section className="prose prose-invert max-w-none text-sm leading-relaxed">
        <p>Ao utilizar o LucraJá, você concorda em fornecer informações verdadeiras, utilizar o aplicativo de forma lícita e respeitar direitos de terceiros. O LucraJá é um simulador e apresenta estimativas baseadas em parâmetros fornecidos por você, sem garantia de resultados financeiros.</p>
        <p>Reservamo-nos o direito de atualizar funcionalidades, interromper serviços ou encerrar contas que violem estes termos. Em caso de dúvidas, contate licitmasa_suporte@proton.me.</p>
      </section>
    </main>
  );
}
