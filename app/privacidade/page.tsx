"use client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
export default function PrivacidadePage() {
  return (
    <main className="container mx-auto max-w-2xl p-4 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Política de privacidade</h1>
        <Button asChild>
          <Link href="/">Voltar para Home</Link>
        </Button>
      </header>
      <section className="prose prose-invert max-w-none text-sm leading-relaxed">
        <p>Coletamos apenas dados necessários ao funcionamento do app, como e-mail para autenticação e dados de uso para melhorar a experiência. Não vendemos informações pessoais.</p>
        <p>Você pode solicitar informações, correção ou exclusão de dados pelo suporte em licitmasa_suporte@proton.me. Para login e pagamentos, utilizamos provedores como Google e Play Store, sujeitos às políticas desses serviços.</p>
      </section>
    </main>
  );
}
