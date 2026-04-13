# Release Notes

Resumo executivo das entregas recentes do LucraJá.

Objetivo: registrar, em formato rápido de consulta, o que entrou nas últimas evoluções funcionais e documentais do projeto.

## Release Atual

### Identificação

- App: `LucraJá`
- Versão Android de referência: `50`
- Branches atualizadas:
  - `main`
  - `feature/atualizacao-taxas-enjoei-olx-2026`

## Resumo Executivo

Esta release consolidou dois blocos principais:

- evolução funcional do simulador, com foco em `ML2026`, créditos e sincronização entre telas
- criação de documentação técnica de ponta a ponta para manutenção futura sem ajuda externa

## Mudanças Funcionais Recentes

### Home + ML2026

- criação da rota dedicada `/ml2026`
- separação entre motor antigo da Home e motor novo do Mercado Livre 2026
- sincronização de `custoPago` e `precoVenda` entre Home e `ML2026`
- sincronização de resultado processado entre as duas telas
- reaproveitamento de cálculo já pago, evitando novo consumo de crédito para mesma base

### Créditos

- proteção contra cliques repetidos durante cálculo
- regra de "base já processada" para evitar cobrança duplicada
- sincronização entre cálculo pago e exibição automática de resultados na Home

### Compartilhamento

- payload unificado para WhatsApp e e-mail
- inclusão de resultados da Home e da `ML2026`
- resumo geral em modal comparando líquido por plataforma

### UX

- popups informativos nos cards de `ML Clássico` e `ML Premium`
- aviso contextual abaixo dos cards da `ML2026`
- ajustes de texto no card de frete

## Documentação Criada / Atualizada

### Base de onboarding

- [README.md](file:///c:/Lucra_Ja/lucraja/README.md)

### Regras de negócio

- [BUSINESS_LOGIC.md](file:///c:/Lucra_Ja/lucraja/BUSINESS_LOGIC.md)

### Auditoria técnica

- [DOCUMENTATION_AUDIT.md](file:///c:/Lucra_Ja/lucraja/DOCUMENTATION_AUDIT.md)

### Schema e persistência

- [DATABASE_SCHEMA.md](file:///c:/Lucra_Ja/lucraja/DATABASE_SCHEMA.md)
- [STORAGE_CONTRACTS.md](file:///c:/Lucra_Ja/lucraja/STORAGE_CONTRACTS.md)

### Navegação da documentação

- [INDEX.md](file:///c:/Lucra_Ja/lucraja/docs/INDEX.md)

## JSDoc Adicionado

Módulos que receberam documentação interna:

- [calc.ts](file:///c:/Lucra_Ja/lucraja/lib/calc.ts)
- [credits.ts](file:///c:/Lucra_Ja/lucraja/lib/credits.ts)
- [useCredits.ts](file:///c:/Lucra_Ja/lucraja/hooks/useCredits.ts)
- [supabase.ts](file:///c:/Lucra_Ja/lucraja/lib/supabase.ts)
- [supabaseClient.ts](file:///c:/Lucra_Ja/lucraja/lib/supabaseClient.ts)
- [featureFlags.ts](file:///c:/Lucra_Ja/lucraja/lib/featureFlags.ts)
- [AuthProvider.tsx](file:///c:/Lucra_Ja/lucraja/components/auth/AuthProvider.tsx)
- [useRevenueCat.ts](file:///c:/Lucra_Ja/lucraja/hooks/useRevenueCat.ts)

## Artefatos De Release

### Android

- AAB assinado gerado para versão `50`
- caminho esperado:
  - `android/app/build/outputs/bundle/release/app-release.aab`

## Estado Técnico Atual

### Validado

- typecheck
- build web
- sincronização de assets Android
- lint dos arquivos alterados/documentados

### Atenção futura

Pontos já registrados em auditoria:

- motor `ML2026` ainda muito grande dentro de uma única página
- sincronização Home <-> `ML2026` baseada em `localStorage`
- débito de créditos ainda dependente do cliente
- coexistência de fluxo principal e legado de créditos

## Próximos Passos Recomendados

- extrair o motor `ML2026` para `lib/`
- centralizar helpers de persistência local
- mover débito de créditos para operação atômica no backend
- criar documentação formal de migrações e estratégia de testes

## Leitura Recomendada Para Continuar

Se um Builder retomar o projeto a partir daqui, a ordem ideal é:

1. [INDEX.md](file:///c:/Lucra_Ja/lucraja/docs/INDEX.md)
2. [README.md](file:///c:/Lucra_Ja/lucraja/README.md)
3. [BUSINESS_LOGIC.md](file:///c:/Lucra_Ja/lucraja/BUSINESS_LOGIC.md)
4. [DOCUMENTATION_AUDIT.md](file:///c:/Lucra_Ja/lucraja/DOCUMENTATION_AUDIT.md)
