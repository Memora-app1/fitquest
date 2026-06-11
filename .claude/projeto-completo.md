# Ascendia — Documentação Completa do Projeto
> Atualizado em 2026-06-11. Gerado por leitura linha a linha de todos os arquivos.
> Use como contexto base para criação de novas Claude Skills.

---

## 1. VISÃO GERAL

**Ascendia** é um SaaS brasileiro de Life OS gamificado para brasileiros 22-38 anos.
Unifica fitness, produtividade e finanças com um sistema de XP/Level/Streak.
90% do público é mobile. Vem de Meta Ads. Monetizado via assinatura mensal/anual/lifetime.

---

## 2. STACK TÉCNICA COMPLETA

```
Framework:     Next.js 16.2.6 (App Router, experimental.viewTransitions)
React:         19.2.7
TypeScript:    strict, noUncheckedIndexedAccess
Tailwind CSS:  v4 (sem tailwind.config.js — config via globals.css)
Banco:         Supabase (PostgreSQL + RLS)
Auth:          Supabase Auth (email/password)
Pagamento:     Mercado Pago
IA:            Anthropic SDK 0.104.1 (claude-sonnet-4-6 com prompt caching)
Hosting:       Vercel (Edge + Cron Jobs)
Push:          web-push (Web Push API)
ORM:           nenhum — Supabase JS v2 direto
Validação:     Zod
DnD:           @dnd-kit
UI extras:     @radix-ui/react-dialog, @radix-ui/react-tooltip
Ícones:        lucide-react
Datas:         date-fns
```

---

## 3. ESTRUTURA DE ARQUIVOS

```
src/
├── app/
│   ├── page.tsx                  # Landing / redirect
│   ├── layout.tsx                # Root layout
│   ├── globals.css               # Design system completo (Tailwind v4)
│   ├── dashboard/page.tsx        # Dashboard principal (38+ widgets)
│   ├── habitos/page.tsx
│   ├── treinos/
│   │   ├── page.tsx
│   │   ├── novo/page.tsx
│   │   └── [id]/page.tsx
│   ├── tarefas/
│   │   ├── page.tsx
│   │   └── eisenhower/page.tsx
│   ├── financas/
│   │   ├── page.tsx
│   │   ├── contas/page.tsx
│   │   ├── metas/page.tsx
│   │   └── transacoes/page.tsx
│   ├── coach/page.tsx
│   ├── score/page.tsx
│   ├── ranking/page.tsx
│   ├── conquistas/page.tsx
│   ├── perfil/page.tsx
│   ├── guilds/
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   ├── seasons/page.tsx
│   ├── saude/page.tsx
│   ├── metas/page.tsx
│   ├── calendario/page.tsx
│   ├── planos/page.tsx
│   ├── onboarding/page.tsx
│   ├── login/page.tsx
│   ├── signup/page.tsx
│   ├── u/[username]/page.tsx     # Perfil público
│   ├── offline/page.tsx
│   ├── termos/page.tsx
│   ├── privacidade/page.tsx
│   ├── admin/
│   │   ├── page.tsx
│   │   ├── usuarios/ (page.tsx + [id]/page.tsx)
│   │   ├── analytics/ (page + crescimento + engajamento + receita + retencao)
│   │   ├── gamificacao/ (page + conquistas + guilds + temporadas + xp)
│   │   ├── operacoes/ (page + banners + feature-flags + notificacoes)
│   │   ├── seguranca/ (page + audit-log + denuncias + suspensoes)
│   │   └── sistema/ (page + crons + saude)
│   └── api/
│       ├── habits/route.ts + habits/log/route.ts
│       ├── treinos/route.ts
│       ├── tasks/route.ts + subtasks/route.ts + task-lists/route.ts
│       ├── transactions/route.ts
│       ├── finance-accounts/route.ts + finance-categories/route.ts + finance-goals/route.ts
│       ├── goals/route.ts
│       ├── coach/route.ts + coach/conversations/route.ts
│       ├── health/ (water + sleep + mood)
│       ├── guilds/ (route + [id]/route + [id]/join/route)
│       ├── seasons/route.ts
│       ├── shop/route.ts + loot/route.ts
│       ├── ranking/route.ts + referral/route.ts + search/route.ts
│       ├── streak-freeze/route.ts + recovery-mode/route.ts
│       ├── login-checkin/route.ts + daily-reward/route.ts
│       ├── push/route.ts + notifications/route.ts
│       ├── perfil/route.ts + onboarding/route.ts + calendario/route.ts
│       ├── checkout/route.ts + billing-portal/route.ts
│       ├── auth/logout/route.ts + webhook/stripe/route.ts
│       ├── admin/ (broadcasts, banners, feature-flags, seasons, xp-grant, debug,
│       │          reports, sistema/trigger-cron, users/export, users/[id]/actions+note)
│       └── cron/ (streaks, habit-reminders, task-reminders, weekly-digest,
│                  streak-alerts, perfect-day-reminder, league-reset, notifications,
│                  daily-recap, memories, goal-reminders, weekly-challenges,
│                  trial-emails, calendar-sync, metrics-snapshot)
├── components/
│   ├── layout/
│   │   ├── app-shell.tsx          # Server Component — wrapper de TODAS as páginas autenticadas
│   │   ├── sidebar.tsx            # Desktop sidebar 240px
│   │   ├── bottom-nav.tsx         # Mobile bottom nav (5 tabs + "Mais" sheet)
│   │   ├── mobile-header.tsx
│   │   ├── mini-coach-fab.tsx     # FAB Coach IA
│   │   └── mobile-fab.tsx
│   ├── dashboard/                 # ~38 widgets do dashboard
│   ├── guilds/
│   │   ├── guilds-client.tsx      # Lista + criar + entrar/sair
│   │   └── guild-detail-client.tsx # Detalhe da guild + ranking semanal
│   ├── seasons/
│   │   └── seasons-client.tsx     # Battle Pass / Season
│   ├── achievement-toast.tsx
│   ├── level-up-celebration.tsx
│   ├── perfect-day-overlay.tsx
│   ├── daily-login-reward.tsx
│   ├── push-prompt.tsx
│   ├── pwa-install-prompt.tsx
│   ├── pull-to-refresh.tsx
│   └── scroll-restoration.tsx
├── lib/
│   ├── xp.ts           # Constantes + helpers puros (client-safe)
│   ├── xp-server.ts    # grantXP, tryUnlockAchievement, createDailyLoot, grantStreakFreeze
│   ├── streak.ts       # updateUserStreak
│   ├── admin.ts        # getAdminSession
│   ├── email.ts        # Resend
│   ├── webpush.ts      # Web Push
│   ├── cron-auth.ts    # isCronAuthorized, cronUnauthorized
│   ├── utils.ts        # cn(), todayString()
│   ├── constants.ts    # constantes de negócio
│   └── supabase/
│       ├── client.ts   # Browser client
│       ├── server.ts   # createClient() + createServiceClient()
│       └── types.ts    # Todos os tipos TypeScript do banco (534 linhas)
├── hooks/
│   └── use-realtime-context.tsx   # AppShellRealtimeProvider
└── proxy.ts            # Auth + subscription guard (antigo middleware.ts)
```

---

## 4. BANCO DE DADOS — SCHEMA COMPLETO

### Identidade & Gamificação

**`profiles`**
```
id                    uuid PK (= auth.users.id)
email / name / username / avatar_url / bio
primary_goal          text   -- 'fitness'|'produtividade'|'financas'
xp_total              int default 0
level                 int default 1
xp_all_time           int default 0
prestige_level        int default 0
streak_current        int default 0
streak_longest        int default 0
streak_freezes        int default 0
perfect_days          int default 0
equipped_title        text | null
league_division       text default 'Bronze'
league_xp_this_week   int default 0
recovery_mode         boolean default false
recovery_ends_at      timestamptz | null
login_streak_count    int default 0
last_login_date       date | null
season_xp             int default 0
subscription_status   text   -- trial|active|cancelled|expired|lifetime
subscription_plan     text | null  -- monthly|annual|lifetime
trial_end             timestamptz | null
subscription_end      timestamptz | null
onboarding_completed  boolean default false
last_activity_date    date | null
```

**`xp_transactions`** — ledger imutável
```
id, user_id, amount, reason, source_type, source_id, xp_total_after, level_after, created_at
source_type: habit|workout|task|transaction|goal|achievement|streak|bonus|health|login|loot|season
```

**`achievements`** — catálogo
```
id, slug (unique), name, description, category, xp_reward, icon_emoji, rarity, is_active
category: fitness|produtividade|financas|streak|social|especial
rarity: common|rare|epic|legendary
```

**`user_achievements`** — PK composta (user_id, achievement_id), unlocked_at

### Fitness

**`habits`**
```
id, user_id, name, description, category, color, icon_emoji
frequency (daily|weekly|custom), frequency_days (int[])
target_value, unit, xp_per_completion (default 50), is_active, order_index
```

**`habit_logs`**
```
id, habit_id, user_id, logged_date (date), value, note, xp_earned
UNIQUE(habit_id, user_id, logged_date)
```

**`workouts`**
```
id, user_id, title, started_at, finished_at, duration_min
total_sets, total_reps, total_volume_kg, xp_earned, notes
```

**`exercises`**
```
id, user_id (null = global), name, category, muscle_group, is_global
```

**`workout_sets`**
```
id, workout_id, exercise_id, set_number, reps, weight_kg, duration_s, is_pr, notes
```

**`goals`** — metas pessoais
```
id, user_id, title, description, category, target_value, current_value, unit
deadline, status (active|completed|archived), xp_on_complete (default 200)
```

### Produtividade

**`task_lists`** — id, user_id, name, color, icon_emoji, order_idx

**`tasks`**
```
id, user_id, task_list_id, title, description
status: todo|in_progress|done|archived
urgent (bool), important (bool)
due_date, completed_at, xp_earned, order_idx
```

**`subtasks`** — id, task_id, title, is_completed, order_idx

### Finanças

**`finance_accounts`** — id, user_id, name, type, bank, balance, color, icon_emoji, is_default

**`finance_categories`** — id, user_id (null=global), name, type, color, icon_emoji, is_global

**`transactions`**
```
id, user_id, account_id, category_id, title, amount, type (income|expense)
transaction_date, due_date, is_paid, is_recurring, recurrence_months
parent_transaction_id, notes, xp_earned
```

**`finance_goals`** — id, user_id, title, description, target_amount, current_amount, deadline, status, color, icon_emoji

### Saúde

**`water_logs`** — id, user_id, date, amount_ml
**`sleep_logs`** — id, user_id, date, duration_hours, quality (1-5), notes
**`mood_logs`** — id, user_id, date, mood (1-5), energy (1-5), stress (1-5), notes

### Gamificação

**`guilds`**
```
id, name, tag (3-5 chars), motto, avatar_emoji
xp_total, weekly_xp, max_members (default 20)
invite_code (unique), is_public, created_by
```

**`guild_members`** — PK(guild_id, user_id), role (owner|moderator|member), weekly_xp, last_week_xp, joined_at

**`seasons`** — id, name, theme_emoji, tagline, start_date, end_date, is_active

**`season_tiers`**
```
id, season_id, tier (int), label, emoji
type: xp|streak_freeze|title|frame|badge
season_xp_required, reward_value, reward_meta, free (bool)
```

**`season_progress`** — PK(user_id, season_id), season_xp, current_tier, claimed_tiers (int[])

**`daily_loot`**
```
id, user_id, date, rarity (common|rare|epic|legendary)
reward_type (xp|streak_freeze|cosmetic), reward_value, reward_meta
source (perfect_day|login_streak|login_day7), claimed, claimed_at
UNIQUE(user_id, date)
```

**`cosmetics`** — id, slug (unique), name, type (title|frame|badge), source, rarity, preview_data

**`user_cosmetics`** — PK(user_id, cosmetic_id), obtained_at

### Notificações

**`notifications`** — id, user_id, type, title, body, action_url, read_at, scheduled_for, sent_at

**`push_subscriptions`** — id, user_id, endpoint, keys_p256dh, keys_auth

### IA

**`ai_conversations`** — id, user_id, title, last_message_at
**`ai_messages`** — id, conversation_id, user_id, role (user|assistant), content, tokens_used

### Admin

**`admin_users`**, **`audit_logs`**, **`feature_flags`**, **`broadcast_messages`**,
**`app_banners`**, **`user_reports`**, **`user_suspensions`**, **`referral_codes`**, **`metrics_snapshots`**

### Calendário

**`calendar_integrations`**, **`calendar_events`**

### RPCs (Funções PostgreSQL)

```sql
-- Atômico: xp + level + ledger em 1 round trip
grant_xp_atomic(p_user_id, p_amount, p_reason, p_source_type, p_source_id)
  → {xp_total_after, xp_before, level_new, level_old, leveled_up}

-- Idempotente: só concede se não concedeu hoje
maybe_grant_perfect_day(p_user_id)
  → {granted, perfect_days}

-- Processa TODOS os usuários em 1 query (sem N+1)
batch_process_streaks(p_cutoff_date)
  → [{user_id, old_streak, new_streak, used_freeze}]

-- Atualiza league_xp_this_week + xp_all_time + season_xp
increment_weekly_stats(p_user_id, p_xp)

-- Recalcula saldo da conta financeira
sync_account_balance(p_account_id)
```

**IMPORTANTE:** Migration `supabase/migrations/008-backend-fixes.sql` contém estas RPCs.
Precisa ser executada manualmente no Supabase SQL Editor antes do deploy.

---

## 5. SEGURANÇA

- RLS habilitado em **TODAS** as tabelas: `USING (user_id = auth.uid())`
- `exercises` e `finance_categories` com `is_global = true` permitem SELECT sem auth
- Service role key: APENAS em API routes server-side, Cron jobs, Webhooks
- Cookie HMAC-SHA256 `asc-sub-v1` (5min TTL) reduz queries ao banco em ~95%
- `ADMIN_BYPASS_EMAILS` env var: admins têm acesso total sem checar subscription
- Cron jobs: validados via `Authorization: Bearer CRON_SECRET`
- Admin: `getAdminSession()` usa service role para checar role no banco

---

## 6. SISTEMA DE XP

**`src/lib/xp.ts`** — client-safe (constantes + cálculos puros)
**`src/lib/xp-server.ts`** — server-only (grantXP, tryUnlockAchievement, createDailyLoot)

### Valores de XP por Ação
```
HABIT_COMPLETED:        50    PERFECT_DAY:           200
WORKOUT_COMPLETED:     100    WORKOUT_SET_BONUS:       5 (max+200)
PERSONAL_RECORD:       150    TASK_COMPLETED:          30
TASK_URGENT_IMPORTANT:  50    TRANSACTION_LOGGED:       5
BILL_PAID_ON_TIME:      20    FINANCE_GOAL_HIT:       500
FINANCE_STREAK_7:      150    FINANCE_STREAK_30:      500
STREAK_3_DAYS:         100    STREAK_7_DAYS:           300
STREAK_30_DAYS:       1000    STREAK_90_DAYS:         3000
LOGIN_DAY_1..7:    20/30/50/75/100/150/300
GOAL_COMPLETED:        200    ONBOARDING_COMPLETED:   100
SEASON_HABIT:           10    SEASON_PERFECT_DAY:      50
SEASON_WORKOUT:         20    SEASON_TASK:              5
SEASON_TRANSACTION:      2
```

### Levels
```
1 Iniciante       0–500 XP        🌱
2 Dedicado      500–1,500 XP      🥉
3 Consistente  1,500–3,500 XP     🥈
4 Atleta       3,500–7,000 XP     🥇
5 Guerreiro    7,000–12,000 XP    ⚔️
6 Elite       12,000–20,000 XP    🛡️
7 Lendário    20,000–35,000 XP    🏛️
8 Ascendia Master  35,000+ XP     👑
```

### Prestige (XP all-time)
```
P1  Ascendido       35,000  ⭐    P6  Imortal II    500,000  🔥
P2  Ascendido II    70,000  ⭐    P7  Imortal III   750,000  🔥
P3  Diamante       120,000  💎    P8  Lendário    1,000,000  👑
P4  Diamante II    200,000  💎    P9  Lendário II 1,500,000  👑
P5  Imortal        350,000  🔥   P10  Lendário Eterno 2,500,000 👑
```

### Ligas
```
Diamante  Top 3%   #00D9FF  💎    Ouro    Top 25%  #F5C842  🥇
Platina  Top 10%   #7C3AED  🏆    Prata   Top 50%  #8899BB  🥈
                                  Bronze    0%+    #CD7F32  🥉
```
Reset semanal via cron `league-reset`.

### Fluxo Completo de Concessão de XP
```
POST /api/habits/log
  ↓ valida com Zod
  ↓ verifica dono do hábito (RLS)
  ↓ insere habit_log (unique → 409 se já logado hoje)
  ↓ grantXP(userId, xp, 'habit', habitId)
      → supabase.rpc('grant_xp_atomic') [fallback manual se RPC não existe]
      → void supabase.rpc('increment_weekly_stats')
      → calculatePrestige → se subiu: UPDATE profiles + INSERT notification
      → XP milestones (1k,5k,10k,25k,50k,100k) → push notification
  ↓ tryUnlockAchievement (first_habit, habits_100, habits_500, habits_1000)
  ↓ maybe_grant_perfect_day() se todos os hábitos logados hoje
      → se granted: perfectDayBonus=200, loot box, conquistas
  ↓ updateUserStreak()
  ↓ return { xpEarned, leveledUp, newLevel, perfectDay, achievementsUnlocked }
```

---

## 7. SISTEMA DE STREAK

- Calculado server-side via `GET /api/cron/streaks` às **03:00 UTC** diário
- RPC `batch_process_streaks` processa todos os usuários em 1 query SQL
- Streak reset se não logou nenhum hábito no dia anterior
- `streak_freezes` protege contra reset (máx 10 freezes)
- Milestones: 3, 7, 30, 90, 180, 365 dias → XP + conquistas + streak freezes
- Recovery Mode: `POST /api/recovery-mode` — modo especial para reengajamento

---

## 8. SISTEMA DE SUBSCRIPTION

### Estados
```
trial     → 7 dias grátis (default ao criar conta)
active    → plano vigente, acesso total
cancelled → cancelou, acesso até subscription_end
expired   → sem acesso, redireciona para /planos
lifetime  → acesso vitalício
```

### Planos
```
monthly  → R$ 37,00/mês
annual   → R$ 306,60/ano (R$ 25,55/mês)
lifetime → R$ 597,00 único
```

### Verificação no proxy.ts
Roda em CADA request para rotas app.
Cache cookie HMAC-SHA256 `asc-sub-v1` por 5 minutos.
Graça de 7 dias para contas recém-criadas.
`lifetime → active → trial(+trial_end) → cancelled(+sub_end) → grace_period`

---

## 9. LOOT BOX SYSTEM

`createDailyLoot()` em `xp-server.ts`. Triggers: Dia Perfeito + Login Day 7.
UNIQUE(user_id, date) — 1 loot por dia.

### Raridades
```
60% Common    → +50 XP
25% Rare      → +150 XP
12% Epic      → +1 Streak Freeze
 3% Legendary → cosmético aleatório da tabela cosmetics (fallback: +300 XP)
```

---

## 10. COACH IA

### Configuração
- Modelo: `claude-sonnet-4-6`
- Rate limit: 50 mensagens/usuário/dia
- maxDuration: 60s (Edge)
- Endpoint: `POST /api/coach`

### Prompt Caching
- System prompt estático → `cache_control: { type: 'ephemeral' }` → ~70% economia
- Contexto dinâmico do usuário → bloco separado SEM cache

### Contexto Enviado ao Claude (14 queries em paralelo)
```
profiles: name, level, xp_total, xp_this_week, streak_current, streak_longest,
          streak_freezes, primary_goal, perfect_days
habits_today: total, completed, missing (nomes)
health: water_today_ml, sleep_last_night (hours+quality), mood_today (mood+energy+stress)
last_workout: title, started_at, total_sets, total_volume_kg
pending_tasks (max 10): title, priority (CRÍTICO/URGENTE/IMPORTANTE/NORMAL), due_date
finances_this_month: income, expense, net
active_goals: title, progress, deadline, pct
recent_achievements (3): name, xp, date
finance_goals (3): title, saved, target, pct, deadline
```

### Personalidade
- Mix: personal trainer + terapeuta financeiro + coach de produtividade + amigo
- Tom: direto, brasileiro, sem clichês corporativos
- Sempre fecha com 1 ação específica e imediata
- Usa números reais do contexto, nunca genéricos

---

## 11. NAVEGAÇÃO

### Mobile (Bottom Nav — `src/components/layout/bottom-nav.tsx`)

Tabs fixas (5 colunas):
| Tab | Rota | Badge |
|-----|------|-------|
| 🏠 Home | `/dashboard` | — |
| ✅ Tarefas | `/tarefas` | tarefas urgente+importante pendentes |
| 💪 Fitness | `/treinos` | — |
| 🤖 Coach | `/coach` | — |
| ··· Mais | (sheet) | — |

Sheet "Mais" (4 colunas, grid de 10 itens):
`/score` `/conquistas` `/ranking` `/guilds` `/seasons` `/saude` `/financas` `/habitos` `/metas` `/calendario`

Haptic feedback via `navigator.vibrate()`.
Sheet fecha ao navegar ou clicar fora.

### Desktop (Sidebar — `src/components/layout/sidebar.tsx`)
240px, mesmos destinos + sublinks financas.

---

## 12. APP SHELL (`src/components/layout/app-shell.tsx`)

Server Component que wrappa TODAS as páginas autenticadas.

### Queries em paralelo
```typescript
Promise.all([
  profiles: id, name, xp_total, level, streak_current, onboarding_completed, perfect_days
  notifications: count de não lidas
  tasks: count de críticas (urgent=true AND important=true AND status NOT done/archived)
])
```

### Verificações
- `!user` → redirect `/login`
- `!profile` → redirect `/onboarding`
- `!profile.onboarding_completed` → redirect `/onboarding`

### Componentes Montados no Shell
`Sidebar` + `MobileHeader` + `BottomNav` + `MobileFab` + `PushPrompt` + `PwaInstallPrompt`
+ `MiniCoachFab` + `LevelUpCelebration` + `PerfectDayOverlay` + `AchievementToast`
+ `DailyLoginReward` + `ScrollRestoration` + `PullToRefresh`
+ `AppShellRealtimeProvider` (XP/level/streak em tempo real)

---

## 13. DESIGN SYSTEM

### Tema "Cyber Electric" (dark only)
```css
--bg:           #050914   /* Background principal */
--bg-card:      #0D1829   /* Cards */
--brand-orange: #FF4D00   /* Primária */
--brand-purple: #7C3AED   /* Secundária */
--brand-green:  #00FF88   /* Sucesso */
--brand-cyan:   #00D9FF   /* Accent */
--xp-gold:      #F5C842   /* XP, ouro */
--text:         #FFFFFF   /* Texto principal */
--text-muted:   #8899BB   /* Texto secundário */
```

### Borda Padrão de Cards
```css
border: 1px solid rgba(124,58,237,0.3)  /* roxo */
/* ou gradient */
border: 1px solid rgba(255,77,0,0.3)    /* laranja */
```

### Classes CSS Principais (globals.css)
```css
.card           /* bg-card + borda padrão */
.card-glow      /* card com glow */
.btn-primary    /* botão laranja */
.btn-ghost      /* botão ghost */
.input          /* input padrão */
.shimmer        /* skeleton loader */
.glass          /* glassmorphism rgba(13,24,41,0.7) blur(12px) */
.hover-lift     /* translate-y -0.5 ao hover */
.xp-pill        /* badge XP dourado */
.gradient-text  /* text gradiente brand */
.heading-display /* Bebas Neue + uppercase */
.glow-text-orange/green/gold/cyan /* glow pulsante animado */
.perf-great/.perf-good/.perf-alert /* cards de performance (verde/ouro/laranja) */
.habit-ring-progress /* anel SVG animado */
```

### Fontes
- Display (XP, stats, números): **Bebas Neue** (var `--font-bebas`)
- Interface (corpo, botões): **DM Sans**

### View Transitions API
```css
@view-transition { navigation: auto; }
/* Desktop: vtOut (fade + scale) / vtIn */
/* Mobile: vtOutMobile / vtInMobile (slide vertical) */
```

### OLED Optimization
```css
@media (prefers-color-scheme: dark) and (dynamic-range: high) { ... }
```

---

## 14. PADRÕES DE CÓDIGO

### API Route Padrão
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

export const maxDuration = 30

const bodySchema = z.object({ ... })

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const parsed = bodySchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input', issues: parsed.error.issues }, { status: 400 })

  const { field1, field2 } = parsed.data
  // lógica...
  return NextResponse.json({ success: true })
}
```

### Server Component com AppShell
```typescript
import { AppShell } from '@/components/layout/app-shell'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function Page() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [res1, res2] = await Promise.all([
    supabase.from('table1').select('col1, col2').eq('user_id', user.id),
    supabase.from('table2').select('col1').eq('user_id', user.id),
  ])

  return (
    <AppShell>
      <ClientComponent data={res1.data ?? []} />
    </AppShell>
  )
}
```

### Client Component Padrão
```typescript
'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

export function MyClient({ initialData }: { initialData: SomeType[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  function handleAction() {
    setError('')
    startTransition(async () => {
      const res = await fetch('/api/resource', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ... }),
      })
      const d = await res.json() as { ok?: boolean; error?: string; message?: string }
      if (!res.ok) { setError(d.message ?? d.error ?? 'Erro'); return }
      router.refresh()
    })
  }

  return <div>...</div>
}
```

### Cron Job Padrão
```typescript
import { isCronAuthorized, cronUnauthorized } from '@/lib/cron-auth'
import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export const maxDuration = 60

export async function GET() {
  if (!await isCronAuthorized()) return cronUnauthorized()
  const supabase = createServiceClient()
  // lógica...
  return NextResponse.json({ ok: true, processed: 0 })
}
```

### Admin Route Padrão
```typescript
import { getAdminSession } from '@/lib/admin'
import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  // session.userId, session.role
  const supabase = createServiceClient()
  // ...
}
```

---

## 15. VARIÁVEIS DE AMBIENTE

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# App
NEXT_PUBLIC_APP_URL=https://seuapp.vercel.app

# Security
CRON_SECRET=                     # Também key HMAC do cookie de subscription
ADMIN_BYPASS_EMAILS=admin@x.com

# IA
ANTHROPIC_API_KEY=

# Pagamento
NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY=
MERCADO_PAGO_ACCESS_TOKEN=
MERCADO_PAGO_WEBHOOK_SECRET=

# Push Notifications
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:admin@app.com

# Email
RESEND_API_KEY=

# Calendário (opcional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

---

## 16. CRON JOBS

| Rota | Horário | Função |
|------|---------|--------|
| `/api/cron/streaks` | 03:00 UTC diário | batch_process_streaks para todos |
| `/api/cron/habit-reminders` | Manhã | Lembretes de hábitos não logados |
| `/api/cron/task-reminders` | Manhã | Lembretes de tarefas com due_date hoje |
| `/api/cron/weekly-digest` | Domingo | Email resumo semanal |
| `/api/cron/streak-alerts` | Tarde | Alertas streak em risco |
| `/api/cron/perfect-day-reminder` | Noite | Lembrete para completar dia perfeito |
| `/api/cron/league-reset` | Segunda 03:00 UTC | Reset semanal de ligas |
| `/api/cron/notifications` | Frequente | Envia notificações agendadas |
| `/api/cron/daily-recap` | Noite | Recap diário push |
| `/api/cron/memories` | Manhã | "1 ano atrás" memories |
| `/api/cron/goal-reminders` | Semanal | Metas próximas do prazo |
| `/api/cron/weekly-challenges` | Segunda | Gerar desafios semanais |
| `/api/cron/trial-emails` | Diário | Emails de trial expirando |
| `/api/cron/calendar-sync` | Frequente | Sync Google Calendar |
| `/api/cron/metrics-snapshot` | Diário | Snapshot de métricas admin |

Autenticação: `Authorization: Bearer ${CRON_SECRET}` em TODOS os cron jobs.

---

## 17. TYPESCRIPT — REGRAS CRÍTICAS

O projeto usa `noUncheckedIndexedAccess: true`.

```typescript
// ERRADO — TypeScript erro
const obj: Record<string, T> = {}
obj['key'].property  // T | undefined

// CORRETO — non-null assertion
obj['key']!.property

// CORRETO — default tipado
const DEFAULT: T = { label: 'X', color: '#fff', icon: SomeIcon }
const MAP: Record<string, T> = { x: DEFAULT }
(MAP['key'] ?? MAP['x'])!.property
```

Para casts de tipos Supabase (join retorna `{ name: any }[]` mas código espera `{ name: string } | null`):
```typescript
// ERRADO
(row.profiles as { name: string } | null)

// CORRETO — double cast via unknown
(row.profiles as unknown as { name: string } | null)
```

Para tipo de objeto nullable em type position:
```typescript
// ERRADO
typeof guildData.guild  // guildData pode ser null

// CORRETO
NonNullable<typeof guildData>['guild']
```

---

## 18. PWA / MOBILE

- `PwaInstallPrompt` — prompt de instalação
- `PullToRefresh` — pull-to-refresh
- `ScrollRestoration` — restaura posição de scroll
- `.safe-area-pt/pb/pl/pr` — suporte notch/home indicator via `env(safe-area-inset-*)`
- Bottom nav: `paddingBottom: 'env(safe-area-inset-bottom, 0px)'`
- Haptic feedback: `navigator.vibrate(8)` nos taps da bottom nav
- OLED optimization media query

---

## 19. FEATURES IMPLEMENTADAS

### Core
- [x] Auth (signup/login/recuperar/nova-senha)
- [x] Onboarding
- [x] Dashboard (38+ widgets, queries paralelas)
- [x] XP system atomic (RPC + fallback)
- [x] Levels 1-8 + Prestige 1-10
- [x] Streak system (batch cron)
- [x] Streak freeze (proteção)
- [x] Recovery Mode
- [x] Loot Box (daily, 4 raridades)
- [x] Login reward diário (ciclo 7 dias)
- [x] Achievements (catálogo + desbloqueio automático)
- [x] Guilds (criar/entrar/sair/ranking semanal)
- [x] Seasons / Battle Pass (tiers free + PRO)
- [x] Leagues (reset semanal, 5 divisões)
- [x] Ranking global/semanal
- [x] Perfil público `/u/[username]`
- [x] Shop de cosméticos
- [x] Web Push notifications
- [x] PWA

### Fitness
- [x] Hábitos (CRUD, log diário, per-habit XP)
- [x] Dia Perfeito (todos hábitos + bônus 200 XP + loot)
- [x] Treinos (sessões, sets, reps, volume_kg)
- [x] Personal Records (detecção automática)
- [x] Metas pessoais (com progresso %)

### Produtividade
- [x] Tarefas (Kanban + Eisenhower urgente/importante)
- [x] Subtarefas
- [x] Listas de tarefas
- [x] Calendário
- [x] Badge de críticas na bottom nav

### Finanças
- [x] Transações (receita/gasto/parcelado/recorrente)
- [x] Contas (saldo automático via RPC)
- [x] Categorias (globais + personalizadas)
- [x] Metas financeiras
- [x] XP por transações registradas

### Saúde
- [x] Água (meta 2000ml/dia)
- [x] Sono (duração + qualidade 1-5)
- [x] Humor/Energia/Estresse (escala 1-5)

### Social
- [x] Guilds com ranking semanal
- [x] Referral system
- [x] Coach IA contextualizado (14 fontes de dados)

### Admin
- [x] Dashboard analytics (crescimento, engajamento, receita, retenção)
- [x] Gestão de usuários (suspend, lift, XP manual, note)
- [x] Broadcasts (notificações em massa)
- [x] Banners no app
- [x] Feature flags
- [x] Temporadas (criar/editar)
- [x] Conquistas (gestão)
- [x] Audit log
- [x] Denúncias
- [x] System health
- [x] Trigger manual de cron jobs

### Pendente / Em Progresso
- [ ] Mercado Pago — integração completa (checkout + webhook ativo)
- [ ] Deploy Vercel
- [ ] Google Calendar sync
- [ ] **Migration 008-backend-fixes.sql — EXECUTAR no Supabase SQL Editor**

---

## 20. SKILLS EXISTENTES

Instaladas em `.claude/skills/`:

| Skill | Uso |
|-------|-----|
| `arquiteto` | Análise arquitetural e escalabilidade |
| `ascendia-architect` | **Criar features** (usa este arquivo como contexto) |
| `ascendia-doctor` | **Diagnosticar e corrigir bugs** |
| `ascendia-shipper` | **Deploy e infraestrutura** |
| `auditoria` | Revisão completa do projeto |
| `banco` | Banco de dados / queries / RLS |
| `debug` | Resolver erros |
| `deploy` | Deploy para produção |
| `feature` | Planejar e criar features |
| `performance` | Otimização de performance |
| `prompt-mestre` | Otimização de prompts |
| `refactor` | Refatoração de código |

---

## 21. DEPENDÊNCIAS PRINCIPAIS

```json
"next":                  "16.2.6"
"react":                 "19.2.7"
"@anthropic-ai/sdk":     "0.104.1"
"@supabase/supabase-js": "^2"
"@supabase/ssr":         "0.5.2"
"zod":                   "^3"
"@dnd-kit/core":         "^6"
"@dnd-kit/sortable":     "^8"
"@radix-ui/react-dialog":"^1"
"@radix-ui/react-tooltip":"^1"
"lucide-react":          "^0"
"date-fns":              "^4"
"web-push":              "^3"
"resend":                "^4"
```

---

## 22. REGRAS INVIOLÁVEIS

1. **NUNCA** rode XP ou streak no client — sempre server
2. **NUNCA** confie em `is_paid` ou status enviados do client
3. **NUNCA** use `select('*')` em tabelas grandes sem justificativa
4. **SEMPRE** use `Promise.all()` para queries independentes
5. **SEMPRE** registre erros via `console.error` (Vercel captura)
6. **NUNCA** altere schema sem confirmação explícita do usuário
7. **NUNCA** entregue código parcial — arquivo completo ou nada
8. **NUNCA** use `any` — use `unknown` + narrowing
9. **NUNCA** use `// @ts-ignore` como solução
10. **SEMPRE** rode `npx tsc --noEmit` após alterações
11. **NUNCA** remova funcionalidades existentes
12. **SEMPRE** preserve 100% do design visual (Cyber Electric dark)
