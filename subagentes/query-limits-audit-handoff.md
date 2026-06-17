---
# Handoff: Query Limits Audit
**Data:** 2026-06-14
**Status geral:** CONCLUÍDO (com 3 pendências que requerem migrations)

## ✅ O que foi feito

### Objetivo da sessão
Adicionar `.limit()` em TODAS as queries SELECT sem limite por todo o codebase Ascendia para prevenir OOM, degradação de performance e fetches ilimitados em escala.

### Páginas corrigidas (`src/app/**/page.tsx`)
- `src/app/habitos/page.tsx` — 5 queries: habits(50), habit_logs×4(50/500/2000/2000)
- `src/app/dashboard/page.tsx` — 3 queries: habits(50), habit_logs×2(50/500)
- `src/app/tarefas/page.tsx` — 3 queries: tasks(2000), xp_transactions(500), task_lists(50)
- `src/app/financas/page.tsx` — 5 queries: accounts(50), transactions×3(5000), categories(500)
- `src/app/saude/page.tsx` — 2 queries: water_logs×2(100/500)
- `src/app/conquistas/page.tsx` — 2 queries: achievements(500), user_achievements(200)
- `src/app/metas/page.tsx` — 1 query: goals(100)
- `src/app/treinos/page.tsx` — 1 query: workouts(2000)
- `src/app/coach/page.tsx` — 1 query: ai_messages(200)
- `src/app/tarefas/eisenhower/page.tsx` — 1 query: tasks(2000)
- `src/app/notificacoes/page.tsx` — 1 query: push_subscriptions(50)
- `src/app/guilds/page.tsx` — 1 query: guild_members(5000)
- `src/app/guilds/[id]/page.tsx` — 2 queries: guild_members(200), profiles(200)
- `src/app/financas/transacoes/page.tsx` — 2 queries: accounts(50), categories(500)
- `src/app/financas/contas/page.tsx` — 1 query: finance_accounts(50)
- `src/app/financas/metas/page.tsx` — 1 query: finance_goals(100)

### Admin pages corrigidas (`src/app/admin/**/page.tsx`)
- `src/app/admin/page.tsx` — 1 query: xp_transactions(100000)
- `src/app/admin/analytics/page.tsx` — 2 queries: metrics_daily(30), profiles(100000)
- `src/app/admin/analytics/crescimento/page.tsx` — 1 query: metrics_daily(90)
- `src/app/admin/analytics/engajamento/page.tsx` — 1 query: metrics_daily(30)
- `src/app/admin/analytics/receita/page.tsx` — 2 queries: profiles(100000), metrics_daily(30)
- `src/app/admin/analytics/retencao/page.tsx` — 4 queries: habit_logs×3(100k/500k/2M), profiles(100000)
- `src/app/admin/gamificacao/conquistas/page.tsx` — 1 query: achievements(500)
- `src/app/admin/gamificacao/temporadas/page.tsx` — 1 query: seasons(100)
- `src/app/admin/operacoes/banners/page.tsx` — 1 query: app_banners(100)
- `src/app/admin/operacoes/feature-flags/page.tsx` — 1 query: feature_flags(200)
- `src/app/admin/seguranca/denuncias/page.tsx` — 1 query: profiles(100)
- `src/app/admin/usuarios/[id]/page.tsx` — 2 queries: habits(50), user_admin_notes(50)

### Componentes corrigidos (`src/components/**/*.tsx`)
- `src/components/financas/finance-category-trend.tsx` — 1 query: categories(500)
- `src/components/financas/finance-goals-overview.tsx` — 2 queries: finance_goals(100), transactions(5000)
- `src/components/financas/finance-income-analysis.tsx` — 1 query: categories(500)
- `src/components/habitos/habit-heatmap.tsx` — 1 query: habit_logs(5000)
- `src/components/habitos/habit-streak-records.tsx` — 2 queries: habits(50), habit_logs(5000)
- `src/components/treinos/workout-heatmap.tsx` — 1 query: workouts(365)
- `src/components/treinos/workout-trends.tsx` — 1 query: workouts(200)
- `src/components/saude/health-rings.tsx` — 4 queries: water_logs×2(100), workouts(20), sleep_logs(7)
- `src/components/saude/recovery-score.tsx` — 3 queries: water_logs(100), workouts(20), sleep_logs(7)
- `src/components/dashboard/life-balance-radar.tsx` — 2 queries: water_logs(500), sleep_logs(7)
- `src/components/dashboard/guild-widget.tsx` — 1 query: profiles(10)
- `src/components/perfil/cosmetics-loader.tsx` — 1 query: user_cosmetics(100)
- `src/components/perfil/rpg-character.tsx` — 1 query: xp_transactions(2000)
- `src/components/metas/goals-overview.tsx` — 1 query: goals(100)
- `src/components/tarefas/task-due-timeline.tsx` — 1 query: tasks(500)
- `src/components/tarefas/task-list-progress-rings.tsx` — 2 queries: task_lists(50), tasks(2000)

### API cron routes corrigidas (`src/app/api/cron/**/*.ts`)
- `src/app/api/cron/habit-reminders/route.ts` — 3 queries: habit_logs(10000), notifications(10000), push_subscriptions(10000)
- `src/app/api/cron/notifications/route.ts` — 1 query: push_subscriptions(50000)
- `src/app/api/cron/streak-alerts/route.ts` — 2 queries: notifications(50000), push_subscriptions(50000)
- `src/app/api/cron/streaks/route.ts` — 1 query: push_subscriptions(50000)
- `src/app/api/cron/task-reminders/route.ts` — 2 queries: notifications(10000), push_subscriptions(10000)

### Verificação final
- `npx tsc --noEmit` → ✅ 0 erros após todas as mudanças
- Scan estático (Node.js inline script) → ✅ ALL CLEAR — nenhum SELECT unbounded restante
- Memory checkpoint atualizado: `~/.claude/projects/.../memory/checkpoint_jun2026.md`

---

## ⏳ Pendências

### 🔴 CRÍTICO

- **TOCTOU race condition em `src/app/api/daily-reward/route.ts`**
  - Problema: 2 requests simultâneos passam pelo check `last_login_date !== today` ao mesmo tempo → XP duplo concedido
  - Solução: migration com constraint UNIQUE em `(user_id, logged_date)` ou RPC atômica `claim_daily_reward_atomic`
  - Requer: aprovação explícita do usuário antes de rodar migration (regra do projeto)

- **TOCTOU race condition em `src/app/api/login-checkin/route.ts`**
  - Mesmo padrão que daily-reward: SELECT → check → INSERT/UPDATE sem atomicidade
  - Solução: mesma abordagem (RPC atômica ou unique constraint)

- **TOCTOU race condition em `src/app/api/referral/route.ts`**
  - `referred_by` pode ser setado 2x se dois requests chegam simultaneamente antes do primeiro commitar
  - `increment_referral_count` pode ser chamado 2x para o mesmo referral
  - Solução: unique constraint em `referred_by` (só pode ser setado uma vez) + RPC atômica

### 🟡 IMPORTANTE

- **Migration 007 não rodada ainda** (`supabase/migrations/007-grant-xp-atomic.sql`)
  - Ativa o `grant_xp_atomic` RPC — sem ela, XP usa fallback não-atômico
  - Rodar no Supabase SQL Editor → Settings → Database

- **`CRON_SECRET` no Vercel** não confirmado como configurado
  - Sem ele: subscription cache HMAC não funciona, cookie não é assinado corretamente

- **Supabase Realtime na tabela `profiles`** não ativado
  - Sem ele: XP ao vivo (bump animado em tempo real) não funciona

### 🟢 MELHORIA

- **N+1 residual no `daily-recap` cron** — ainda existe latência se >1000 usuários
  - Já foi melhorado de O(4N) para O(6) na sessão anterior, mas pode ser otimizado mais com batch inserts via `unnest()` no PostgreSQL

- **`u/[username]/page.tsx`** — `.ilike()` pode 500 se dois usuários têm o mesmo username
  - Trocar `.ilike()` por `.eq()` e garantir unique constraint no banco

- **`habit-packs.tsx`** — insert client-side bypassa validação server-side
  - Criar server action ou API route para instalar packs (RLS protege, mas é inconsistente com o padrão do projeto)

---

## 🧠 Contexto para o próximo agente

Este chat foi 100% focado em uma auditoria de segurança/performance: adicionar `.limit()` em todas as queries SELECT sem limite para prevenir OOM e fetches ilimitados em escala. A auditoria foi feita sistematicamente com um script Node.js inline que varre todos os `.tsx` e `.ts` do projeto identificando queries unbounded. 

O trabalho está **100% concluído** para o objetivo de `.limit()`. O projeto compila sem erros, o scan estático está limpo. O estado atual é saudável.

As 3 race conditions (TOCTOU) nos endpoints `daily-reward`, `login-checkin` e `referral` foram identificadas mas **intencionalmente não corrigidas** — por regra do projeto (`CLAUDE.md`), o schema não pode ser alterado sem confirmação explícita do usuário. O próximo agente deve perguntar ao usuário se quer corrigir essas 3 antes de tocar em qualquer migration.

O projeto tem um arquivo `supabase/migrations/012-race-condition-fixes.sql` listado como untracked no git status — verificar se já foi criado em sessão anterior e está pronto para rodar.

---

## 📁 Arquivos tocados nessa sessão

### App pages
- `src/app/habitos/page.tsx` — `.limit()` em 5 queries
- `src/app/dashboard/page.tsx` — `.limit()` em 3 queries
- `src/app/tarefas/page.tsx` — `.limit()` em 3 queries
- `src/app/financas/page.tsx` — `.limit()` em 5 queries
- `src/app/saude/page.tsx` — `.limit()` em 2 queries
- `src/app/conquistas/page.tsx` — `.limit()` em 2 queries
- `src/app/metas/page.tsx` — `.limit()` em 1 query
- `src/app/treinos/page.tsx` — `.limit()` em 1 query
- `src/app/coach/page.tsx` — `.limit()` em 1 query
- `src/app/tarefas/eisenhower/page.tsx` — `.limit()` em 1 query
- `src/app/notificacoes/page.tsx` — `.limit()` em 1 query
- `src/app/guilds/page.tsx` — `.limit()` em 1 query
- `src/app/guilds/[id]/page.tsx` — `.limit()` em 2 queries
- `src/app/financas/transacoes/page.tsx` — `.limit()` em 2 queries
- `src/app/financas/contas/page.tsx` — `.limit()` em 1 query
- `src/app/financas/metas/page.tsx` — `.limit()` em 1 query

### Admin pages
- `src/app/admin/page.tsx`
- `src/app/admin/analytics/page.tsx`
- `src/app/admin/analytics/crescimento/page.tsx`
- `src/app/admin/analytics/engajamento/page.tsx`
- `src/app/admin/analytics/receita/page.tsx`
- `src/app/admin/analytics/retencao/page.tsx`
- `src/app/admin/gamificacao/conquistas/page.tsx`
- `src/app/admin/gamificacao/temporadas/page.tsx`
- `src/app/admin/operacoes/banners/page.tsx`
- `src/app/admin/operacoes/feature-flags/page.tsx`
- `src/app/admin/seguranca/denuncias/page.tsx`
- `src/app/admin/usuarios/[id]/page.tsx`

### Componentes
- `src/components/financas/finance-category-trend.tsx`
- `src/components/financas/finance-goals-overview.tsx`
- `src/components/financas/finance-income-analysis.tsx`
- `src/components/habitos/habit-heatmap.tsx`
- `src/components/habitos/habit-streak-records.tsx`
- `src/components/treinos/workout-heatmap.tsx`
- `src/components/treinos/workout-trends.tsx`
- `src/components/saude/health-rings.tsx`
- `src/components/saude/recovery-score.tsx`
- `src/components/dashboard/life-balance-radar.tsx`
- `src/components/dashboard/guild-widget.tsx`
- `src/components/perfil/cosmetics-loader.tsx`
- `src/components/perfil/rpg-character.tsx`
- `src/components/metas/goals-overview.tsx`
- `src/components/tarefas/task-due-timeline.tsx`
- `src/components/tarefas/task-list-progress-rings.tsx`

### Cron routes
- `src/app/api/cron/habit-reminders/route.ts`
- `src/app/api/cron/notifications/route.ts`
- `src/app/api/cron/streak-alerts/route.ts`
- `src/app/api/cron/streaks/route.ts`
- `src/app/api/cron/task-reminders/route.ts`

### Memória
- `~/.claude/projects/.../memory/checkpoint_jun2026.md` — sessão registrada

---

## ⚠️ Armadilhas / Decisões não-óbvias

1. **`broadcasts/[id]/send/route.ts` é FALSO POSITIVO** — não adicionar `.limit()` extra nele. Usa query builder pattern: `let profileQuery = db.from('profiles')...` e `.limit()` é adicionado ao `await` final. Verificar o arquivo se o scan sinalizar.

2. **Limites para crons são intencionalmente grandes** (10k–2M). São queries de serviço que processam todos os usuários — não reduzir esses valores.

3. **Queries com `.single()` ou `.maybeSingle()` não precisam de `.limit()`** — retornam max 1 row por design do PostgREST.

4. **Queries `{ count: 'exact', head: true }` não precisam de `.limit()`** — são apenas contagens, não retornam dados.

5. **As race conditions TOCTOU identificadas estão em arquivos já listados no git status como modificados** (`src/app/api/daily-reward/route.ts`, `src/app/api/login-checkin/route.ts`, `src/app/api/referral/route.ts`). Existe também `supabase/migrations/012-race-condition-fixes.sql` como untracked — verificar o conteúdo antes de assumir que está vazio.

6. **Regra crítica do projeto:** nunca alterar schema sem confirmação explícita do usuário. Qualquer migration deve ser apresentada antes de executar.

---

## 🎯 Primeiro passo sugerido ao retomar

Verificar o arquivo `supabase/migrations/012-race-condition-fixes.sql` (já existe como untracked):
```bash
cat supabase/migrations/012-race-condition-fixes.sql
```

Se contiver SQL válido para os 3 TOCTOU, apresentar ao usuário e pedir aprovação para rodar no Supabase SQL Editor. Se estiver vazio ou incompleto, criar o SQL das 3 correções e apresentar para aprovação antes de qualquer execução.
