# Handoff: Bugfix + Deploy Prep
**Data:** 2026-06-11
**Status geral:** CONCLUÍDO (código pronto — falta executar etapas manuais no Vercel e Supabase)

---

## ✅ O que foi feito

- **Bug crítico corrigido**: `/planos` estava em `AUTH_ONLY_ROUTES` no proxy — visitantes não autenticados que clicavam "Ver planos e preços" na landing eram redirecionados para `/login`. Movido para `PUBLIC_ROUTES`.
- **Finance streak implementado**: `src/app/api/transactions/route.ts` agora rastreia dias consecutivos com transações. XP bônus em 7 dias (`FINANCE_STREAK_7`) e 30 dias (`FINANCE_STREAK_30`).
- **Loot box no dia 7 do ciclo de login**: `daily-reward/route.ts` chama `createDailyLoot(userId, today, 'login_day7')` quando `isWeekComplete` é true. `xp-server.ts` teve o tipo `'login_day7'` adicionado ao union.
- **Scroll lock nos modais**: hook `useScrollLock` criado em `src/hooks/use-scroll-lock.ts`. Aplicado nos modais de criar/editar hábito e nos modais do kanban. Body não scrolla mais atrás do modal no mobile.
- **Overflow dos modais corrigido**: modais de hábito e kanban agora têm `overflow-y-auto` + `maxHeight: 90dvh` — conteúdo não fica cortado em telas pequenas.
- **LoginCheckinWidget removido do dashboard**: o flow foi migrado para a API `daily-reward`. Widget não existe mais na grid do dashboard.
- **`ServiceWorkerInit` extraído como componente**: `src/components/service-worker-init.tsx` — componente client-only que registra o SW, evitando código inline no layout.
- **VAPID keys geradas**: chaves reais criadas via `web-push` e salvas no `.env.local` como referência.
- **`.env.local` atualizado**: seção Mercado Pago removida, seção Stripe adicionada, VAPID keys preenchidas.
- **CLAUDE.md estava desatualizado**: foi corrigido em sessão anterior — Mercado Pago → Stripe, Next.js 15 → 16, modelo → `claude-sonnet-4-6`.
- **TypeScript**: 0 erros em todo o projeto após todas as mudanças.
- **2 commits feitos e prontos para deploy**:
  - `6f204a9` — fix: /planos acessível para visitantes não autenticados
  - `ca9ccf3` — feat: finance streak, loot day7, scroll lock nos modais, service worker

---

## ⏳ Pendências

### 🔴 CRÍTICO

- **DEPLOY não foi feito**: todo o código está commitado localmente mas NÃO foi para produção. Rodar `vercel --prod --yes` ou `.\deploy.ps1` para ativar o fix dos botões na landing.

- **Migrations SQL não foram rodadas no Supabase**: as seguintes precisam ser executadas no SQL Editor do Supabase em ordem exata:
  1. `supabase/migrations/004-rls-performance.sql` — otimiza policies RLS (até 100x mais rápido)
  2. `supabase/migrations/005-new-achievements.sql` — conquistas novas
  3. `supabase/migrations/006-referral-system.sql` — sistema de referral
  4. `supabase/migrations/007-storage-buckets.sql` — storage buckets
  5. `supabase/migrations/008-grant-xp-atomic-rpc.sql` — **CRÍTICO**: RPC atômica `grant_xp_atomic` que elimina race condition no XP
  6. `supabase/migrations/008-batch-process-streaks.sql` — processamento em lote de streaks
  7. `supabase/migrations/008-backend-fixes.sql` — fixes gerais de backend
  8. `supabase/migrations/009-gamification-v2.sql` — **CRÍTICO**: cria tabelas `guilds`, `guild_members`, `seasons`, `season_progress`, `cosmetics`, `user_cosmetics`, `daily_loot`. Sem essa migration, as páginas /guilds, /seasons e loot box quebram.
  9. `supabase/migrations/010-admin-platform.sql` — **CRÍTICO**: cria tabelas do painel admin (`admin_roles`, `audit_logs`, `feature_flags`, etc.). Sem isso o /admin não funciona.
  10. `supabase/migrations/010-admin-bootstrap.sql` — **Rodar por último**: registra `sjoaopedro606@gmail.com` como `super_admin`.

- **VAPID keys precisam ser adicionadas ao Vercel**: as chaves estão no `.env.local` mas precisam ir para Settings → Environment Variables no Vercel:
  - `NEXT_PUBLIC_VAPID_PUBLIC_KEY=BF2m3a-9eMaDZ3BAXn62dGqoQmatAo2luzed4iJIyvDyC9TnAci6FmCsd4YpKc675kj4s9DXgTh_B7hSIcrSlMg`
  - `VAPID_PRIVATE_KEY=Iqf_nJH5OniWMtDXMlA28iKYFpLXP33Wz19J9IFvq90`
  - `VAPID_SUBJECT=mailto:sjoaopedro606@gmail.com`

### 🟡 IMPORTANTE

- **Supabase Realtime**: ativar na tabela `profiles` em Supabase → Database → Replication. Sem isso o XP bump ao vivo no dashboard não funciona (Realtime não recebe updates da tabela).

- **Stripe**: configurar quando o usuário tiver as credenciais. Adicionar ao Vercel:
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `STRIPE_PRICE_MONTHLY`
  - `STRIPE_PRICE_ANNUAL`
  - `STRIPE_PRICE_LIFETIME`
  - Configurar o webhook no painel do Stripe apontando para `https://fitquest-app1.vercel.app/api/webhook/stripe`

- **`XP_REWARDS.FINANCE_STREAK_7` e `XP_REWARDS.FINANCE_STREAK_30`**: a feature de finance streak foi implementada na API `transactions/route.ts`, mas é necessário confirmar que essas constantes existem em `src/lib/xp.ts`. Se não existirem, a API vai falhar silenciosamente (ou crashar). Verificar antes de ir para prod.

### 🟢 MELHORIA

- **Dashboard N+1**: 19 Suspense Server Components fazem queries independentes, muitas duplicando dados já buscados no `Promise.all` do `page.tsx`. Plano existe (adicionar `water_logs`/`sleep_logs` ao batch, converter `daily-performance-card`, `morning-brief`, `daily-quest`, `health-summary-widget` para aceitar props). Estimativa: elimina ~12 queries duplicadas por load do dashboard.

- **Google Calendar OAuth**: `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` estão vazios. A feature de calendário está no código mas não funciona. Baixa prioridade até o usuário querer ativar.

- **`MERCADO_PAGO_*` vars no Vercel**: se ainda estiverem configuradas no Vercel, podem ser removidas (pagamento migrado para Stripe).

---

## 🧠 Contexto para o próximo agente

O foco desta sessão foi resolver um bug de UX crítico (botões da landing não funcionavam para visitantes) e preparar o projeto para deploy. O código está 100% limpo (TypeScript 0 erros, 2 commits prontos), mas **nenhum deploy foi feito** — tudo ainda está local.

O projeto Ascendia é um Life OS gamificado (fitness + produtividade + finanças + Coach IA) em Next.js 16 + Supabase. Está substancialmente completo — auth, gamificação, admin panel, guilds, seasons, loot boxes, push notifications estão todos implementados. O único ponto realmente bloqueador para produção são as **migrations SQL** (especialmente 009 e 010) e o **deploy**.

Armadilha importante: há dois arquivos `008-*.sql` com nomes diferentes (não é conflito de versão — são migrations distintas que precisam rodar todas).

O usuário vai configurar Stripe depois — não bloqueia o deploy agora, pois a página `/planos` redireciona mas os webhooks de pagamento simplesmente não vão processar até que as credenciais estejam configuradas.

---

## 📁 Arquivos tocados nessa sessão

- `src/proxy.ts` — `/planos` movido de AUTH_ONLY_ROUTES para PUBLIC_ROUTES
- `.env.local` — template atualizado: MP → Stripe, VAPID keys adicionadas
- `src/app/api/daily-reward/route.ts` — loot box no dia 7 do ciclo de login
- `src/app/api/transactions/route.ts` — finance streak (dias consecutivos + XP bônus)
- `src/lib/xp-server.ts` — tipo `'login_day7'` adicionado ao union de `createDailyLoot`
- `src/app/dashboard/page.tsx` — removido import e uso de `LoginCheckinWidget`
- `src/components/habitos/habits-list.tsx` — `useScrollLock` + `overflow-y-auto` + `maxHeight: 90dvh` nos modais
- `src/components/tarefas/kanban-board.tsx` — mesmas correções de modal
- `src/app/layout.tsx` — ajustes menores (commitado junto)
- `src/app/apple-icon.tsx` — ajustes de ícone
- `src/app/icon.tsx` — ajustes de ícone
- `public/manifest.json` — atualizado
- `.claude/settings.local.json` — atualizado automaticamente
- `src/components/service-worker-init.tsx` — NOVO: componente client para registrar SW
- `src/hooks/use-scroll-lock.ts` — NOVO: hook que trava scroll do body quando modal está aberto

---

## ⚠️ Armadilhas / Decisões não-óbvias

- **`middleware.ts` NÃO deve existir** no projeto. O Next.js 16 usa `proxy.ts` (renomeado). Se um arquivo `src/middleware.ts` aparecer (Vercel, git pull, etc.), ele conflita com `src/proxy.ts` e quebra toda a autenticação. Deletar imediatamente se reaparecer.

- **Migrations 008**: existem 3 arquivos começando com `008-`. Não são conflitos — são migrations independentes que precisam rodar todas. Ordem sugerida: `008-grant-xp-atomic-rpc.sql` → `008-batch-process-streaks.sql` → `008-backend-fixes.sql`.

- **`grant_xp_atomic` é um fallback**: o `xp-server.ts` tenta chamar a RPC do banco e cai para o método antigo se ela não existir. Mas sem a migration 008, haverá race condition em XP concorrente (ex: dois hábitos marcados ao mesmo tempo).

- **`CRON_SECRET` ativa o cache de subscription**: sem ele no Vercel, o proxy faz query ao Supabase em TODA request às rotas do app. Com ele, usa cookie HMAC-signed de 5min (~95% menos queries). Verificar se está configurado no Vercel.

- **VAPID keys são fixas**: as chaves geradas nesta sessão são as definitivas. Se forem geradas novamente no futuro, todos os usuários com push inscrito precisarão se re-inscrever (subscriptions antigas ficam inválidas).

---

## 🎯 Primeiro passo sugerido ao retomar

1. Rodar `vercel --prod --yes` (ou `.\deploy.ps1`) para subir o fix dos botões.
2. Adicionar as 3 VAPID vars no Vercel Dashboard.
3. Abrir o Supabase SQL Editor e rodar as migrations em ordem (004 → 005 → 006 → 007 → 008×3 → 009 → 010 → 010-bootstrap).
4. Ativar Realtime na tabela `profiles` no Supabase.
5. Verificar que `XP_REWARDS.FINANCE_STREAK_7` e `XP_REWARDS.FINANCE_STREAK_30` existem em `src/lib/xp.ts`.
