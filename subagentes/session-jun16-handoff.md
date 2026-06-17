# Handoff: Sessão Jun 16 — Race Conditions, Loja XP, Desafios
**Data:** 2026-06-16
**Status geral:** EM ANDAMENTO

---

## ✅ O que foi feito

### Commits entregues nesta sessão (e sessões anteriores dentro do mesmo contexto):
- **scroll lock universal** — `useScrollLock` adicionado em todos os modais/overlays do app (10 componentes)
- **Stripe webhook v22** — corrigido path (singular `/webhook/stripe`), TypeScript errors com `sub.items.data[0]?.current_period_end` e `invoice.parent?.subscription_details?.subscription`
- **XpVelocityBanner** — Server Component comparando XP desta semana vs média 4 semanas; integrado no dashboard
- **StreakNudgeBanner** — banner quando usuário está 1 dia antes de milestone de streak (7/30/90 dias)
- **Loot box query no Promise.all** — eliminada query sequencial no dashboard
- **Preconnect Supabase** — no layout.tsx para reduzir latência DNS
- **CSS optimizations** — `content-visibility: auto`, `will-change`, `contain: strict` em globals.css
- **Admin panel completo** — `/admin` com analytics, gamificação, segurança (commit da560c9)
- **Linting pass** — 521 LOC melhorados em 117 arquivos (commit 5076be3)
- **Loja XP** (`/loja`) — troca XP por: Streak Freeze, Loot Box, XP 2x, Streak Recovery (commit 079efca)
- **Página /desafios** — todos os 7 desafios semanais com histórico 4 semanas, barras de progresso, XP total (commit ed468ab)
- **Proxy expandido** — agora protege `/ranking`, `/guilds`, `/seasons`, `/notificacoes`, `/loja`, `/desafios`
- **Sidebar e bottom-nav** — links para /loja e /desafios adicionados
- **Race conditions identificadas e corrigidas** — `claim_login_atomic` e `use_referral_code_atomic` como RPCs PostgreSQL atômicas (TOCTOU fix)

---

## ⏳ Pendências

### 🔴 CRÍTICO

- **18 arquivos modificados NÃO COMMITADOS** — incluem as correções de race condition e outras mudanças. O branch está 1 commit à frente do origin e NÃO pushou ainda. Primeiro passo obrigatório: revisar e commitar tudo.
  - Arquivos afetados: `src/app/api/daily-reward/route.ts`, `src/app/api/login-checkin/route.ts`, `src/app/api/referral/route.ts`, `src/app/auth/callback/route.ts`, `src/app/login/page.tsx`, `src/components/calendario/calendar-client.tsx`, `src/components/financas/accounts-manager.tsx`, `src/components/financas/finance-goals-list.tsx`, `src/components/financas/transactions-view.tsx`, `src/components/habitos/habit-packs.tsx`, `src/components/habitos/habits-list.tsx`, `src/components/layout/bottom-nav.tsx`, `src/components/metas/goals-list.tsx`, `src/components/tarefas/eisenhower-board.tsx`, `src/proxy.ts`, `supabase/migrations/009-gamification-v2.sql`, `supabase/migrations/010-admin-platform.sql`

- **Migration 012 NÃO APLICADA no Supabase** — o arquivo `supabase/migrations/012-race-condition-fixes.sql` existe localmente mas NÃO foi executado no banco ainda. Sem isso, as RPCs `claim_login_atomic` e `use_referral_code_atomic` não existem e as rotas `daily-reward` e `referral` vão quebrar com erro 500 em produção.
  - **Ação:** Abrir Supabase Dashboard → SQL Editor → executar o conteúdo de `supabase/migrations/012-race-condition-fixes.sql`

- **Fix 002 NÃO APLICADO** — `supabase/fixes/002-extend-trial-existing-users.sql` extende trial de usuários existentes para 365 dias. Sem isso, usuários beta/teste são bloqueados em `/planos`. Aplicar via SQL Editor antes de qualquer teste com usuários reais.

- **Branch não pushado** — `ed468ab` (feat: /desafios) é o HEAD local mas NÃO foi para o `origin/main`. Fazer `git push` antes de qualquer deploy.

### 🟡 IMPORTANTE

- **UpsellBanner não integrado** — o componente `src/components/ui/upsell-banner.tsx` existe com variantes `trial`, `expired`, `default` mas não está sendo renderizado em nenhuma página. Deveria aparecer no dashboard para usuários em trial/expirado.

- **Testar fluxo Stripe completo** — webhook está correto mas não foi testado end-to-end com cartão real (apenas lógica corrigida para Stripe v22). Testar: checkout → pagamento → webhook → `subscription_status = 'active'`.

- **`src/components/ui/upsell-banner.tsx`** — verificar se o arquivo realmente existe (foi criado em sessão anterior mas não confirmado no git log).

### 🟢 MELHORIA

- **Keyboard shortcuts guide** — modal com `?` para desktop mostrando todos os atalhos disponíveis (identificado mas não implementado)
- **Layout 2 colunas no /habitos** — em desktop (≥768px), seções de analytics poderiam ser 2-column grid
- **Conquistas no perfil** — página `/conquistas` está funcional mas sem animação de desbloqueio quando achievement é unlocked em tempo real
- **`UpsellBanner` nas páginas protegidas** — mostrar aviso de trial expirando também em `/fitness`, `/financas`, `/tarefas`

---

## 🧠 Contexto para o próximo agente

Este chat resolveu a maioria das tarefas de polish e robustez: scroll lock universal em todos os modais, correção do Stripe v22, banners de velocity/streak, performance de queries, Loja XP funcional e página /Desafios completa. **O estado atual é funcional mas há trabalho não commitado que precisa ser staged/commitado antes de qualquer outra coisa.**

O foco da última parte da sessão foi corrigir race conditions em `daily-reward` e `referral` — foi criada a migration 012 com RPCs atômicas em PostgreSQL, e as routes foram refatoradas para usar `rpc()` em vez de read-then-write. **Esta migration ainda NÃO está no banco Supabase** — é o desbloqueador crítico. Sem ela, essas rotas retornam 500.

O projeto está em estado muito avançado: gamificação V2 completa, admin panel, Loja XP, /desafios, streaks, loot boxes, seasons, leagues, coach IA com streaming. Falta principalmente: integração UpsellBanner, push do branch, aplicação das migrations pendentes, e testes end-to-end Stripe.

---

## 📁 Arquivos tocados nessa sessão

### Commitados:
- `src/app/desafios/page.tsx` — nova página /desafios (736 linhas, criada do zero)
- `src/app/loja/page.tsx` — wrapper Server Component da loja
- `src/components/loja/shop-client.tsx` — UI client da Loja XP (291 linhas)
- `src/components/layout/sidebar.tsx` — links /loja e /desafios adicionados
- `src/components/layout/bottom-nav.tsx` — links /loja e /desafios no "Mais"
- `src/proxy.ts` — proteção de /ranking, /guilds, /seasons, /notificacoes, /loja, /desafios

### NÃO commitados (modificados):
- `src/app/api/daily-reward/route.ts` — refatorado para usar `claim_login_atomic` RPC
- `src/app/api/login-checkin/route.ts` — race condition fix (similar)
- `src/app/api/referral/route.ts` — refatorado para usar `use_referral_code_atomic` RPC
- `src/app/auth/callback/route.ts` — mudança menor (verificar o diff)
- `src/app/login/page.tsx` — mudança menor (verificar o diff)
- `src/components/calendario/calendar-client.tsx` — mudança menor
- `src/components/financas/accounts-manager.tsx` — mudança menor
- `src/components/financas/finance-goals-list.tsx` — mudança menor
- `src/components/financas/transactions-view.tsx` — mudança menor
- `src/components/habitos/habit-packs.tsx` — mudança menor
- `src/components/habitos/habits-list.tsx` — mudança menor
- `src/components/layout/bottom-nav.tsx` — mudança menor (além do já commitado)
- `src/components/metas/goals-list.tsx` — mudança menor
- `src/components/tarefas/eisenhower-board.tsx` — mudança menor
- `src/proxy.ts` — ajustes adicionais além do commitado
- `supabase/migrations/009-gamification-v2.sql` — atualizado (11 linhas)
- `supabase/migrations/010-admin-platform.sql` — atualizado (20 linhas)

### Não rastreados (novos):
- `supabase/migrations/012-race-condition-fixes.sql` — RPCs `claim_login_atomic` + `use_referral_code_atomic`
- `supabase/fixes/002-extend-trial-existing-users.sql` — extende trial de usuários existentes

---

## ⚠️ Armadilhas / Decisões não-óbvias

- **Stripe v22 breaking changes:** `Subscription.current_period_end` foi movido para `sub.items.data[0]?.current_period_end`. `Invoice.subscription` virou `invoice.parent?.subscription_details?.subscription`. Qualquer código novo que toque Stripe precisa seguir esses padrões.
- **Webhook path é SINGULAR:** `/api/webhook/stripe` (sem 's'). Já teve bug de um arquivo plural duplicado que foi removido via `git rm`.
- **`src/proxy.ts` não `src/middleware.ts`** — o projeto usa Next.js 16 que renomeou middleware. O arquivo é `proxy.ts`. Não criar `middleware.ts` acidentalmente.
- **Migration 012 usa `SECURITY DEFINER`** — as RPCs atômicas são `SECURITY DEFINER` para poder fazer `FOR UPDATE` sem depender de RLS. Isso é intencional — o lock de transação precisa ser mais amplo que RLS permite.
- **`daily-reward` vs `login-checkin`** — existem DOIS endpoints separados para login reward; `login-checkin` é o mais recente e o que tem a lógica de streak semanal de login. Verificar qual está sendo chamado pelo client.
- **XP do `grantXP` é server-only** — nunca chamar no client. Toda concessão de XP passa pela função em `src/lib/xp-server.ts` via API route ou Server Action.

---

## 🎯 Primeiro passo ao retomar

```bash
# 1. Aplicar migration 012 no Supabase (OBRIGATÓRIO antes de tudo)
# → Supabase Dashboard → SQL Editor → colar conteúdo de supabase/migrations/012-race-condition-fixes.sql

# 2. Aplicar fix 002 (se houver usuários beta)
# → Supabase Dashboard → SQL Editor → colar conteúdo de supabase/fixes/002-extend-trial-existing-users.sql

# 3. Commitar e pushar tudo pendente
git add src/app/api/daily-reward/route.ts src/app/api/login-checkin/route.ts src/app/api/referral/route.ts \
        src/app/auth/callback/route.ts src/app/login/page.tsx \
        src/components/calendario/calendar-client.tsx \
        src/components/financas/accounts-manager.tsx src/components/financas/finance-goals-list.tsx \
        src/components/financas/transactions-view.tsx \
        src/components/habitos/habit-packs.tsx src/components/habitos/habits-list.tsx \
        src/components/layout/bottom-nav.tsx src/components/metas/goals-list.tsx \
        src/components/tarefas/eisenhower-board.tsx src/proxy.ts \
        supabase/migrations/009-gamification-v2.sql supabase/migrations/010-admin-platform.sql \
        supabase/migrations/012-race-condition-fixes.sql \
        supabase/fixes/002-extend-trial-existing-users.sql
git commit -m "fix: race conditions atômicas em login-daily-reward e referral (migration 012)"
git push

# 4. Próxima feature sugerida: integrar UpsellBanner no dashboard para trial/expirado
```
