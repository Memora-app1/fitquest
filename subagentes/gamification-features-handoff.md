# Handoff: Gamification Features
**Data:** 2026-06-16
**Status geral:** EM ANDAMENTO

---

## ✅ O que foi feito

### Esta sessão
- **`src/app/loja/page.tsx`** — Criada página `/loja` (XP Shop) — Server Component que busca `xp_total` e `streak_freezes` do profile e renderiza `<ShopClient />`
- **`src/components/loja/shop-client.tsx`** — Client Component com saldo XP, grid de itens por categoria, modal de confirmação de compra, toast de feedback, `router.refresh()` pós-compra
- **`src/app/desafios/page.tsx`** — Criada página `/desafios` (Desafios Semanais) — Server Component que: busca todos os dados da semana em `Promise.all` (9 queries), computa todos os 7 desafios (vs 4 no widget do dashboard), busca histórico de XP de desafios das últimas semanas via `xp_transactions WHERE source_id ILIKE 'wc_%'`
- **`src/proxy.ts`** — Expandido `isAppRoute` para incluir `/ranking`, `/guilds`, `/seasons`, `/notificacoes`, `/loja`, `/desafios` — agora protegidos por subscription check
- **`src/components/layout/sidebar.tsx`** — Adicionado "Desafios" com ícone `Swords` na seção Principal (entre Temporada e Loja XP)
- **`src/components/layout/bottom-nav.tsx`** — Adicionado "Desafios" com ícone `Swords` e cor `#FF4D00` no `MORE_ITEMS` array
- **`supabase/migrations/011-rls-v2-optimization.sql`** — Migração de otimização RLS: `auth.uid()` → `(SELECT auth.uid())` para reduzir overhead em tabelas grandes
- **`src/components/ui/upsell-banner.tsx`** — Componente reutilizável de upsell com variants: `trial`, `expired`, `default`; modo compacto e completo
- **`src/components/dashboard/streak-nudge-banner.tsx`** — Banner que aparece quando usuário está a 1 dia de milestone de streak (7/30/90 dias)
- **`src/components/dashboard/xp-velocity-banner.tsx`** — Banner motivacional que compara XP desta semana vs média das últimas 4 semanas

### Sessões anteriores (contexto)
- Admin panel completo (analytics/crescimento, engajamento, receita, retenção, gamificação, sistema, segurança)
- Stripe webhook v22 corrigido (`current_period_end` agora em `SubscriptionItem`, `invoice.parent?.subscription_details?.subscription`)
- Cron `/api/cron/league-reset` e `/api/cron/metrics-snapshot` adicionados ao `vercel.json`
- Performance: queries da loot box integradas ao `Promise.all` do dashboard

---

## ⏳ Pendências

### 🔴 CRÍTICO
- **XP 2x Boost não funciona de verdade**: O shop vende `xp_boost_2x` (800 XP) mas a função `grantXP` em `xp-server.ts` não verifica nenhum multiplicador ativo. O handler na shop apenas envia uma notificação e faz `void expiresAt`. Para implementar corretamente, precisaria de coluna `xp_boost_expires_at` no banco — **aguarda confirmação do usuário para migration**. Sem isso, usuários pagam 800 XP e não recebem nenhum benefício real.

### 🟡 IMPORTANTE
- **Colunas ausentes no banco**: O tipo `Profile` em `src/lib/supabase/types.ts` provavelmente está desatualizado em relação ao banco real. Verificar se `recovery_week_active`, `recovery_week_used_month`, `finance_streak`, `last_finance_date`, `xp_all_time` etc. realmente existem no Supabase. Rodar `npx supabase gen types typescript` ao ter acesso ao projeto Supabase.
- **`xp_all_time` vs `xp_total`**: O campo `xp_all_time` está no tipo Profile mas pode não ser atualizado corretamente. A função `grantXP` usa `xp_total` (que sobe e desce com compras da loja). O `xp_all_time` (apenas sobe) seria necessário para prestige correto — verificar se está sendo mantido.
- **Deploy não feito**: O projeto ainda não foi publicado no Vercel. Há um `build_output.txt` no diretório raiz que pode ter output de tentativa anterior de build.
- **Migrations não executadas**: Arquivo `supabase/migrations/011-rls-v2-optimization.sql` criado mas pode não ter sido executado no banco de produção.
- **Stripe não configurado em produção**: Webhook, price IDs, customer portal — tudo precisa ser configurado para o ambiente de produção.

### 🟢 MELHORIA
- **`/desafios` no command palette**: O `src/components/command-palette.tsx` tem `QUICK_NAV` hardcoded — `/desafios` não está lá ainda. Adicionar na lista de navegação rápida.
- **Prestige page**: Existe `PRESTIGE_INFO` e `calculatePrestige()` em `xp.ts`, prestige_level em `profiles`, mas não há página dedicada de prestige. Mostrar roadmap de prestige no `/score` ou criar `/prestige`.
- **XP 2x boost UI**: Quando o boost está ativo (após implementação real), mostrar um badge visual no dashboard e nos botões de ação que geram XP.
- **`/ranking`, `/guilds`, `/seasons` no sidebar**: Estão no bottom-nav "Mais" e no sidebar, mas poderiam ter destaques visuais para usuários que ainda não exploraram.
- **Testes E2E**: Nenhum teste automatizado existe. Para pre-launch, pelo menos smoke tests dos fluxos críticos (signup → onboarding → habit log → XP granted).

---

## 🧠 Contexto para o próximo agente

Este chat estava fazendo build contínuo de features de gamificação e polimento do Ascendia — um Life OS SaaS gamificado brasileiro. O projeto está em estado **pré-launch**: código completo e TypeScript-limpo, mas sem deploy no Vercel ainda.

A stack é Next.js 16 App Router + Supabase + Stripe v22 + Anthropic API. **Ponto crítico**: o Stripe webhook deve estar em `/api/webhook/stripe` (singular, não plural) — já está correto, não mudar.

O projeto tem ~60 páginas, 80+ componentes, 50+ API routes. TypeScript está 100% limpo (verificado com `node --max-old-space-size=4096 node_modules\typescript\bin\tsc --noEmit`). NÃO usar `npx tsc` diretamente — OOM no projeto grande.

A maior pendência funcional é o **XP 2x boost** vendido na `/loja` que não funciona porque `grantXP` não checa multiplicador. Resolver isso requer migration no banco (`xp_boost_expires_at timestamptz` em profiles) — pedir confirmação antes de executar.

Primeiro passo ao retomar: perguntar ao usuário se quer fazer o deploy (Vercel) ou resolver o XP 2x boost primeiro.

---

## 📁 Arquivos tocados nessa sessão

- `src/app/loja/page.tsx` — criado (XP Shop page)
- `src/components/loja/shop-client.tsx` — criado (client component da loja)
- `src/app/desafios/page.tsx` — criado (standalone challenges page)
- `src/proxy.ts` — expandido isAppRoute com 6 novas rotas
- `src/components/layout/sidebar.tsx` — adicionado Desafios + Loja XP na nav
- `src/components/layout/bottom-nav.tsx` — adicionado Desafios + Loja XP no MORE_ITEMS
- `src/components/ui/upsell-banner.tsx` — criado (componente reutilizável)
- `src/components/dashboard/streak-nudge-banner.tsx` — criado/commitado
- `src/components/dashboard/xp-velocity-banner.tsx` — criado
- `supabase/migrations/011-rls-v2-optimization.sql` — criado (RLS optimization)
- `src/app/api/shop/route.ts` — revisado (não modificado; já estava correto)
- `src/app/api/webhook/stripe/route.ts` — corrigido para Stripe v22 API (sessões anteriores)
- `vercel.json` — adicionados crons `league-reset` e `metrics-snapshot` (sessões anteriores)

---

## ⚠️ Armadilhas / Decisões não-óbvias

1. **Stripe v22 breaking changes**: `subscription.current_period_end` não existe mais em `Subscription` — está em `sub.items.data[0]?.current_period_end`. E `invoice.subscription` foi para `invoice.parent?.subscription_details?.subscription`. Já corrigido.
2. **Webhook path singular**: O Stripe está configurado para `/api/webhook/stripe` (singular). Existe também `/api/webhooks/stripe` (plural) como stub — **não ativar o plural**, só o singular está implementado.
3. **TypeScript OOM**: `npx tsc --noEmit` falha com exit 255 por falta de memória. Sempre usar `node --max-old-space-size=4096 node_modules\typescript\bin\tsc --noEmit`.
4. **XP Shop source_id**: O padrão de idempotência para desafios semanais é `wc_{year}w{week}_{challengeId}`. Nunca mudar esse padrão sem migration que corrija histórico.
5. **Loja duplicação**: Existe `src/components/score/xp-shop.tsx` (mini widget embedded na página /score) E a nova `src/app/loja/page.tsx` (página completa). Ambas são intencionais — diferentes contextos.
6. **Proxy é `proxy.ts`, não `middleware.ts`**: Next.js 16 renomeou. O `config.matcher` está no final do `proxy.ts` e funciona normalmente.
7. **Admin bypass**: Em `proxy.ts`, emails em `ADMIN_BYPASS_EMAILS` env var pulam a verificação de subscription. Configurar em produção.

---

## 🎯 Primeiro passo sugerido ao retomar

Perguntar ao usuário: **"Quer fazer o deploy no Vercel agora, ou priorizo corrigir o XP 2x boost (precisa de migration no banco)?"** — são as duas maiores pendências e têm impacto diferente. Se escolher deploy, usar a skill `/ascendia-shipper`. Se escolher o boost, precisamos da confirmação para executar `ALTER TABLE profiles ADD COLUMN xp_boost_expires_at TIMESTAMPTZ`.
