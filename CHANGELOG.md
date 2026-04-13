# Changelog

Todas as mudanças relevantes deste projeto devem ser registradas aqui.

Este arquivo segue um formato simples, orientado a Builders:

- o que mudou
- por que mudou
- impacto técnico

## [50.0] - 2026-04-13

### Adicionado

- rota dedicada `ML2026` em [ml2026/page.tsx](file:///c:/Lucra_Ja/lucraja/app/ml2026/page.tsx)
- popup informativo nos cards `ML Clássico` e `ML Premium`
- aviso contextual abaixo dos cards da `ML2026`
- botão `Visualizar Resumo Geral` com modal comparativo
- payload unificado de compartilhamento com resultados da Home e da `ML2026`
- documentação técnica completa:
  - [README.md](file:///c:/Lucra_Ja/lucraja/README.md)
  - [BUSINESS_LOGIC.md](file:///c:/Lucra_Ja/lucraja/BUSINESS_LOGIC.md)
  - [DOCUMENTATION_AUDIT.md](file:///c:/Lucra_Ja/lucraja/DOCUMENTATION_AUDIT.md)
  - [DATABASE_SCHEMA.md](file:///c:/Lucra_Ja/lucraja/DATABASE_SCHEMA.md)
  - [STORAGE_CONTRACTS.md](file:///c:/Lucra_Ja/lucraja/STORAGE_CONTRACTS.md)
  - [INDEX.md](file:///c:/Lucra_Ja/lucraja/docs/INDEX.md)
  - [RELEASE_NOTES.md](file:///c:/Lucra_Ja/lucraja/RELEASE_NOTES.md)

### Alterado

- sincronização bidirecional entre Home e `ML2026` para:
  - `custoPago`
  - `precoVenda`
  - `incluiImpostoMEI`
- lógica de crédito para não consumir saldo novamente quando a base já foi processada
- Home passa a recalcular automaticamente quando detecta retorno de uma base já paga na `ML2026`
- compartilhamento da Home passou a incorporar resultados da `ML2026`
- documentação interna com JSDoc nos módulos centrais:
  - [calc.ts](file:///c:/Lucra_Ja/lucraja/lib/calc.ts)
  - [credits.ts](file:///c:/Lucra_Ja/lucraja/lib/credits.ts)
  - [useCredits.ts](file:///c:/Lucra_Ja/lucraja/hooks/useCredits.ts)
  - [supabase.ts](file:///c:/Lucra_Ja/lucraja/lib/supabase.ts)
  - [supabaseClient.ts](file:///c:/Lucra_Ja/lucraja/lib/supabaseClient.ts)
  - [featureFlags.ts](file:///c:/Lucra_Ja/lucraja/lib/featureFlags.ts)
  - [AuthProvider.tsx](file:///c:/Lucra_Ja/lucraja/components/auth/AuthProvider.tsx)
  - [useRevenueCat.ts](file:///c:/Lucra_Ja/lucraja/hooks/useRevenueCat.ts)

### Corrigido

- prevenção de consumo duplicado de crédito por clique repetido
- preenchimento automático da `ML2026` com base da Home
- atualização automática dos resultados da Home após cálculo pago na `ML2026`
- texto do card de frete na `ML2026`

### Android

- versão Android atualizada para `50`
- AAB release assinado gerado para distribuição

### Observações

- O motor antigo da Home foi mantido como referência comparativa.
- O motor `ML2026` continua separado para evitar contaminação da lógica antiga.
- Persistência compartilhada entre telas ainda usa `localStorage`; ver riscos em [DOCUMENTATION_AUDIT.md](file:///c:/Lucra_Ja/lucraja/DOCUMENTATION_AUDIT.md).
