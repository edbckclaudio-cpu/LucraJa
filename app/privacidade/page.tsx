"use client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
export default function PrivacidadePage() {
  return (
    <main className="container mx-auto max-w-3xl p-6 space-y-8">
      <header className="flex items-center justify-between border-b border-primary/10 pb-4">
        <h1 className="text-3xl font-extrabold tracking-tight">Política de Privacidade – LucraJá</h1>
        <Button asChild>
          <Link href="/">Voltar para Home</Link>
        </Button>
      </header>
      <section className="prose prose-invert max-w-none text-base leading-relaxed">
        <h2 className="text-xl font-bold">Coleta de Dados</h2>
        <p>
          Coletamos apenas o mínimo necessário para o funcionamento do aplicativo, incluindo
          <strong> e-mail</strong> para autenticação e <strong>dados de uso</strong> essenciais para
          melhorar a experiência. <strong>Não vendemos informações pessoais</strong>.
        </p>

        <h2 className="text-xl font-bold mt-6">Uso e Compartilhamento</h2>
        <p>
          Os dados são utilizados para operar o LucraJá, oferecer suporte e aprimorar funcionalidades.
          O compartilhamento é restrito a provedores necessários à operação (por exemplo, autenticação e
          processamento de pagamentos) e segue as políticas desses serviços.
        </p>

        <h2 className="text-xl font-bold mt-6">Seus Direitos</h2>
        <p>
          Você pode solicitar <strong>informações</strong>, <strong>correção</strong> ou
          <strong> exclusão</strong> dos seus dados pelo suporte:
          <a href="mailto:licitmasa_suporte@proton.me"> licitmasa_suporte@proton.me</a>.
        </p>

        <h2 className="text-xl font-bold mt-6">Provedores e Políticas</h2>
        <p>
          Para login e pagamentos, utilizamos provedores como <strong>Google</strong> e
          <strong> Play Store</strong>, sujeitos às políticas e termos desses serviços.
        </p>
      </section>
    </main>
  );
}
