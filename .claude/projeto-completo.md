# ASCENDIA — Documentação Completa do Projeto

> Gerado em 2026-06-10. Use como contexto base para skills do Claude Code.
> Fonte de verdade: leitura direta de todos os arquivos do projeto.

---

## 1. VISÃO GERAL

**Ascendia** é um SaaS brasileiro de **Life OS gamificado** para o público 22-38 anos, 90% mobile, vindo de Meta Ads. Unifica fitness, produtividade, finanças e coaching por IA num único sistema de progressão por XP/Level/Streak.

### Stack Técnica

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 16 (App Router, Server Components) |
| Linguagem | TypeScript strict |
| Estilos | Tailwind CSS 3 + sistema de design customizado (tailwind.config.ts) |
| Banco | Supabase (PostgreSQL + RLS em todas as tabelas de usuário) |
| Auth | Supabase Auth (email/password) |
| Pagamento | Stripe (Subscriptions + Checkout Pro) — `src/lib/stripe.ts` |
| IA | Anthropic API (`claude-sonnet-4-6`, max_tokens 1024, prompt caching ativo) |
| Hosting | Vercel (Edge runtime + Cron jobs via `vercel.json`) |
| Realtime | Supabase Realtime (profiles — XP/level/streak ao vivo) |
| Email | Resend (`noreply@ascendia.app`) |
| Push | Web Push (VAPID, `web-push` lib) |
| Animações | Tailwind Animate + CSS keyframes customizados |
| Gráficos | Recharts |
| Drag & Drop | @dnd-kit/core + @dnd-kit/sortable |
| UI Components | Radix UI (Dialog, DropdownMenu, Label, Slot, Tabs, Toast) |
| Validação | Zod |
| Datas | date-fns |
| Icons | lucide-react |

### URL de Produção
`https://ascendia-app1.vercel.app` (configurada em `NEXT_PUBLIC_APP_URL`)

---

### Subscription States

| `subscription_status` | Acesso | Observação |
|---|---|---|
| `trial` | Total por 7 dias | Default ao criar conta |
| `active` | Total | Plano vigente |
| `cancelled` | Total até `subscription_end` | Cancelou mas não expirou |
| `expired` | Só `/planos` | Sem acesso ao app |
| `lifetime` | Total permanente | Pagamento único |

### Planos e Preços

| `subscription_plan` | Preço |
|---|---|
| `monthly` | R$ 37,00/mês |
| `annual` | R$ 306,60/ano (R$ 25,55/mês) |
| `lifetime` | R$ 597,00 único |

### Grace Period
Conta criada há menos de 7 dias tem acesso mesmo com status expirado (verificado no proxy via `created_at`).

---

### Sistema de XP/Level

**Concessão sempre via `grantXP()` em `src/lib/xp-server.ts`** — nunca no client.

```
grantXP(userId, amount, reason, sourceType, sourceId?)
→ RPC grant_xp_atomic (PostgreSQL) — 1 round-trip atômico
→ increment_weekly_stats (fire-and-forget) — atualiza league_xp_this_week + season_xp
→ verifica prestige
→ verifica conquistas de level-up
→ push notification se cruza XP milestone (1k, 5k, 10k, 25k, 50k, 100k)
→ retorna GrantXpResult
```

### XP por Ação (src/lib/xp.ts — XP_REWARDS)

| Ação | XP |
|---|---|
| Hábito completado (`HABIT_COMPLETED`) | 50 |
| Dia Perfeito — todos hábitos do dia (`PERFECT_DAY`) | +200 |
| Treino finalizado (`WORKOUT_COMPLETED`) | 100 |
| Por set no treino (`WORKOUT_SET_BONUS`) | +5/set (máx +200) |
| Personal Record (`PERSONAL_RECORD`) | 150 |
| Tarefa concluída (`TASK_COMPLETED`) | 30 |
| Tarefa urgente + importante (`TASK_URGENT_IMPORTANT`) | 50 |
| Transação registrada (`TRANSACTION_LOGGED`) | 5 |
| Conta paga em dia (`BILL_PAID_ON_TIME`) | 20 |
| Meta financeira atingida (`FINANCE_GOAL_HIT`) | 500 |
| Finance streak 7 dias (`FINANCE_STREAK_7`) | 150 |
| Finance streak 30 dias (`FINANCE_STREAK_30`) | 500 |
| Streak 3 dias (`STREAK_3_DAYS`) | 100 |
| Streak 7 dias (`STREAK_7_DAYS`) | 300 |
| Streak 30 dias (`STREAK_30_DAYS`) | 1000 |
| Streak 90 dias (`STREAK_90_DAYS`) | 3000 |
| Login diário Dia 1 | 20 |
| Login diário Dia 2 | 30 |
| Login diário Dia 3 | 50 |
| Login diário Dia 4 | 75 |
| Login diário Dia 5 | 100 |
| Login diário Dia 6 | 150 |
| Login diário Dia 7 | 300 (+loot box) |
| Meta pessoal completada (`GOAL_COMPLETED`) | 200 |
| Onboarding concluído (`ONBOARDING_COMPLETED`) | 100 |
| First-time bonus (`FIRST_TIME_BONUS`) | 100 |
| Season XP (não conta para XP normal) | habit:10, perfect_day:50, workout:20, task:5, transaction:2 |

### Tabela de Levels

| Level | Faixa XP | Título | Emoji |
|---|---|---|---|
| 1 | 0–500 | Iniciante | 🌱 |
| 2 | 500–1500 | Dedicado | 🥉 |
| 3 | 1500–3500 | Consistente | 🥈 |
| 4 | 3500–7000 | Atleta | 🥇 |
| 5 | 7000–12000 | Guerreiro | ⚔️ |
| 6 | 12000–20000 | Elite | 🛡️ |
| 7 | 20000–35000 | Lendário | 🏛️ |
| 8 | 35000+ | Ascendia Master | 👑 |

---

## 2. BANCO DE DADOS — TODAS AS TABELAS

> RLS habilitado em **todas** as tabelas com dados de usuário. Padrão: `USING (user_id = auth.uid())`.

### `profiles` — perfil e gamificação do usuário
```
id                        uuid PK (= auth.users.id)
name                      text
avatar_url                text | null
bio                       text | null
timezone                  text (default: 'America/Sao_Paulo')
xp_total                  int  (current XP for level calculation)
xp_all_time               bigint (nunca decresce — usado para prestige)
level                     int (1-8)
streak_current            int
streak_longest            int
perfect_days              int
last_activity_date        text | null (YYYY-MM-DD)
streak_freezes            int (0-10)
subscription_status       text (trial/active/cancelled/expired/lifetime)
subscription_plan         text | null (monthly/annual/lifetime)
subscription_started_at   timestamptz | null
subscription_end          timestamptz | null
trial_end                 timestamptz | null
stripe_subscription_id    text | null
stripe_customer_id        text | null
onboarding_completed      boolean
primary_goal              text | null
weekly_target             int
referral_code             text | null
referral_count            int
referred_by               text | null
-- Gamification V2 (migration 009)
login_streak              int (ciclo de 7 dias)
last_login_date           date | null
prestige_level            int (0-10)
recovery_week_active      boolean
recovery_week_used_month  int | null (número do mês 1-12)
league_xp_this_week       int (resetado toda segunda via RPC)
season_xp                 int
equipped_title            text | null
equipped_frame            text | null
finance_streak            int
last_finance_date         date | null
-- Admin (migration 010)
is_suspended              boolean
suspended_until           timestamptz | null
suspension_reason         text | null
created_at                timestamptz
updated_at                timestamptz
```

### `xp_transactions` — ledger imutável de XP
```
id             uuid PK
user_id        uuid FK auth.users
amount         int
reason         text
source_type    text (habit/workout/task/transaction/goal/achievement/streak/onboarding/bonus/health/login/loot/season/admin_grant/admin_deduct)
source_id      uuid | null
xp_total_after int
level_after    int
created_at     timestamptz
```
RLS: user_id = auth.uid()

### `achievements` — catálogo de conquistas (leitura pública para autenticados)
```
id             uuid PK
slug           text UNIQUE (ex: 'first_habit', 'streak_7', 'habits_100', 'level_2', 'perfect_day')
name           text
description    text
icon           text (emoji ou URL)
category       text
xp_reward      int
rarity         text (common/rare/epic/legendary)
trigger_type   text
trigger_value  int | null
created_at     timestamptz
```
RLS: SELECT para authenticated, resto via service role.

### `user_achievements` — conquistas desbloqueadas
```
user_id        uuid FK auth.users  PK composta (race-safe)
achievement_id uuid FK achievements PK composta
unlocked_at    timestamptz
```
RLS: user_id = auth.uid()

### `habits` — definição dos hábitos
```
id                  uuid PK
user_id             uuid FK auth.users
name                text
description         text | null
icon                text (emoji)
color               text (hex)
category            text (strength/cardio/flexibility/nutrition/sleep/mindfulness/custom)
target_type         text (count/km/minutes/custom)
target_value        int
target_period       text (year/month/week/day)
target_unit         text | null
frequency_per_week  int
reminder_time       text | null (HH:MM:SS — usado pelo cron de lembretes)
xp_per_completion   int (padrão: XP_REWARDS.HABIT_COMPLETED = 50)
display_order       int
is_active           boolean
created_at          timestamptz
updated_at          timestamptz
```
Limite: MAX_ACTIVE_HABITS = 10 por usuário.

### `habit_logs` — registros diários de hábitos
```
id           uuid PK
habit_id     uuid FK habits
user_id      uuid FK auth.users
logged_date  date  (UNIQUE com habit_id — 1 log por dia por hábito)
value        int
note         text | null
xp_earned    int
created_at   timestamptz
```
RLS: user_id = auth.uid()

### `workouts` — sessões de treino
```
id                          uuid PK
user_id                     uuid FK auth.users
title                       text
notes                       text | null
started_at                  timestamptz
finished_at                 timestamptz | null (null = em andamento)
duration_minutes            int | null
total_volume_kg             numeric
total_sets                  int
total_reps                  int
xp_earned                   int
is_personal_record_session  boolean
created_at                  timestamptz
```

### `exercises` — biblioteca de exercícios
```
id           uuid PK
user_id      uuid | null (null = global)
name         text
muscle_group text (chest/back/legs/shoulders/arms/core/cardio/full_body)
equipment    text | null
instructions text | null
video_url    text | null
is_global    boolean
created_at   timestamptz
```
RLS especial: SELECT permite `is_global = true` para todos os autenticados.

### `workout_sets` — séries individuais
```
id                 uuid PK
workout_id         uuid FK workouts
exercise_id        uuid FK exercises
user_id            uuid FK auth.users
set_number         int
reps               int | null
weight_kg          numeric | null
duration_seconds   int | null
distance_km        numeric | null
rpe                int | null (1-10)
is_personal_record boolean
is_warmup          boolean
created_at         timestamptz
```

### `goals` — metas pessoais
```
id              uuid PK
user_id         uuid FK auth.users
title           text
description     text | null
icon            text | null
category        text
target_value    numeric
current_value   numeric
unit            text
deadline        date | null
status          text (active/completed/cancelled/paused)
completed_at    timestamptz | null
linked_habit_id uuid | null FK habits
created_at      timestamptz
updated_at      timestamptz
```

### `task_lists` — listas/projetos de tarefas
```
id            uuid PK
user_id       uuid FK auth.users
name          text
color         text (hex)
icon          text | null
display_order int
created_at    timestamptz
```

### `tasks` — tarefas individuais
```
id                  uuid PK
user_id             uuid FK auth.users
list_id             uuid | null FK task_lists
title               text
description         text | null
status              text (todo/doing/done/archived) — Kanban
display_order       int
urgent              boolean  — Eisenhower
important           boolean  — Eisenhower
due_date            timestamptz | null
reminder_at         timestamptz | null
estimated_minutes   int | null
completed_at        timestamptz | null
google_event_id     text | null
recurrence_rule     text | null
parent_task_id      uuid | null FK tasks
xp_reward           int (padrão: TASK_COMPLETED=30, TASK_URGENT_IMPORTANT=50)
created_at          timestamptz
updated_at          timestamptz
```

### `subtasks` — checklist dentro de tarefa
```
id            uuid PK
task_id       uuid FK tasks
user_id       uuid FK auth.users
title         text
is_completed  boolean
display_order int
completed_at  timestamptz | null
created_at    timestamptz
```

### `finance_accounts` — contas bancárias/cartões
```
id              uuid PK
user_id         uuid FK auth.users
name            text
type            text (checking/savings/credit_card/cash/investment)
icon            text (emoji)
color           text (hex)
current_balance numeric
credit_limit    numeric | null
closing_day     int | null (cartão: dia do fechamento)
due_day         int | null (cartão: dia do vencimento)
is_active       boolean
created_at      timestamptz
```

### `finance_categories` — categorias de gastos/receitas
```
id         uuid PK
user_id    uuid | null (null = global, compartilhada)
name       text
type       text (expense/income)
icon       text | null
color      text | null
is_global  boolean
created_at timestamptz
```

### `transactions` — transações financeiras
```
id                      uuid PK
user_id                 uuid FK auth.users
account_id              uuid FK finance_accounts
category_id             uuid | null FK finance_categories
amount                  numeric
type                    text (expense/income/transfer)
description             text
notes                   text | null
transaction_date        date
is_installment          boolean
installment_current     int | null
installment_total       int | null
installment_group_id    uuid | null (agrupa parcelas)
is_recurring            boolean
recurrence_rule         text | null
parent_transaction_id   uuid | null
is_paid                 boolean
paid_at                 timestamptz | null
transfer_to_account_id  uuid | null FK finance_accounts
created_at              timestamptz
updated_at              timestamptz
```

### `finance_goals` — metas financeiras
```
id              uuid PK
user_id         uuid FK auth.users
title           text
icon            text (emoji)
color           text (hex)
target_amount   numeric
current_amount  numeric
deadline        date | null
monthly_target  numeric | null
status          text (active/completed/cancelled/paused)
completed_at    timestamptz | null
created_at      timestamptz
```

### `ai_conversations` — histórico do Coach
```
id               uuid PK
user_id          uuid FK auth.users
title            text | null (auto-gerado da 1ª mensagem, máx 60 chars)
last_message_at  timestamptz
created_at       timestamptz
```

### `ai_messages` — mensagens individuais
```
id                uuid PK
conversation_id   uuid FK ai_conversations
user_id           uuid FK auth.users
role              text (user/assistant/system)
content           text
context_snapshot  jsonb | null
tokens_used       int | null
created_at        timestamptz
```
Rate limit: DAILY_COACH_MESSAGE_LIMIT = 50 mensagens/usuário/dia.

### `calendar_integrations` — OAuth Google Calendar
```
id            uuid PK
user_id       uuid FK auth.users
provider      text
access_token  text
refresh_token text
expires_at    timestamptz | null
scope         text | null
is_active     boolean
last_synced_at timestamptz | null
created_at    timestamptz
```

### `calendar_events` — eventos de calendário
```
id             uuid PK
user_id        uuid FK auth.users
title          text
description    text | null
location       text | null
start_at       timestamptz
end_at         timestamptz
all_day        boolean
source         text (google/internal)
external_id    text | null
integration_id uuid | null FK calendar_integrations
color          text
is_read_only   boolean
created_at     timestamptz
updated_at     timestamptz
```

### `notifications` — fila de notificações in-app
```
id             uuid PK
user_id        uuid FK auth.users
title          text
body           text
icon           text | null
type           text (task_reminder/habit_reminder/streak_alert/xp_milestone/finance_due/coach_insight/achievement/daily_login_reward/loot_box/perfect_day_reminder/league_update/guild_activity/streak_record/prestige/season_tier/daily_recap)
source_id      uuid | null
scheduled_for  timestamptz
sent_at        timestamptz | null
read_at        timestamptz | null
action_url     text | null
created_at     timestamptz
```

### `push_subscriptions` — dispositivos para Web Push
```
id           uuid PK
user_id      uuid FK auth.users
endpoint     text UNIQUE
keys_p256dh  text
keys_auth    text
created_at   timestamptz
```
Push automático via `sendPushNotification()` em `src/lib/webpush.ts`. Subscriptions expiradas (gone=true) são deletadas automaticamente.

### `water_logs` — registro de hidratação
```
id         uuid PK
user_id    uuid FK auth.users
date       date
amount_ml  int
created_at timestamptz
```
Meta diária: WATER_GOAL_ML = 2000ml.

### `sleep_logs` — registro de sono
```
id              uuid PK
user_id         uuid FK auth.users
date            date
bed_time        timestamptz | null
wake_time       timestamptz | null
duration_hours  numeric | null
quality         int | null (1-5)
xp_earned       int
created_at      timestamptz
```
Meta diária: SLEEP_GOAL_H = 8h.

### `mood_logs` — registro de humor/energia/estresse
```
id         uuid PK
user_id    uuid FK auth.users
date       date
mood       int (1-5)
energy     int (1-5)
stress     int (1-5)
note       text | null
xp_earned  int
created_at timestamptz
updated_at timestamptz
```

### `daily_loot` — caixas de recompensa
```
id           uuid PK
user_id      uuid FK auth.users
date         date
rarity       text (common/rare/epic/legendary)
reward_type  text (xp/streak_freeze/cosmetic/multiplier)
reward_value int
reward_meta  text | null (JSON: { cosmetic_id, slug, name } para cosméticos)
source       text (perfect_day/login_streak/login_day7/shop)
opened_at    timestamptz | null (null = pendente)
created_at   timestamptz
UNIQUE (user_id, date)
```
Raridade: 60% comum (50 XP), 25% raro (150 XP), 12% épico (1 freeze), 3% lendário (cosmético).

### `guilds` — grupos de jogadores
```
id           uuid PK
name         text UNIQUE
tag          text (2-6 chars, uppercase)
motto        text | null
avatar_emoji text (default '⚡')
xp_total     bigint
weekly_xp    int (resetado toda segunda)
created_by   uuid FK auth.users
max_members  int (default 20)
invite_code  text UNIQUE (6 chars uppercase, auto-gerado)
is_public    boolean
created_at   timestamptz
```
RLS: leitura pública para autenticados; criação/edição só pelo criador.

### `guild_members` — membros das guilds
```
guild_id      uuid FK guilds  PK composta
user_id       uuid FK auth.users PK composta
role          text (owner/admin/member)
joined_at     timestamptz
weekly_xp     int
last_week_xp  int
```

### `seasons` — temporadas (Season Pass / Battle Pass)
```
id          uuid PK
name        text
theme_emoji text
tagline     text | null
start_date  date
end_date    date
is_active   boolean (só 1 ativa por vez)
tiers       jsonb (array de SeasonTier)
created_at  timestamptz
```
SeasonTier: `{ tier, season_xp_required, free, label, type, value, slug, emoji }`
Tipos de recompensa: 'title' | 'xp' | 'streak_freeze' | 'badge' | 'frame'

### `season_progress` — progresso do usuário na temporada
```
user_id        uuid FK auth.users  PK composta
season_id      uuid FK seasons     PK composta
season_xp      int
current_tier   int
claimed_tiers  int[] (tiers já reivindicados)
created_at     timestamptz
updated_at     timestamptz
```

### `cosmetics` — catálogo de cosméticos
```
id          uuid PK
slug        text UNIQUE
name        text
description text | null
type        text (title/frame/badge/theme)
rarity      text (common/rare/epic/legendary)
source      text (season/prestige/achievement/shop/event/loot)
preview     text | null
created_at  timestamptz
```

### `user_cosmetics` — cosméticos do usuário
```
user_id     uuid FK auth.users   PK composta
cosmetic_id uuid FK cosmetics    PK composta
acquired_at timestamptz
equipped    boolean
```

### Tabelas Admin (migration 010)

**`admin_roles`** — roles administrativos
```
id         uuid PK
user_id    uuid UNIQUE FK auth.users
role       text (super_admin/admin/moderator/support/analyst)
granted_by uuid | null FK auth.users
granted_at timestamptz
notes      text | null
```
RLS: `USING (false)` — só via service role.

**`audit_logs`** — log de ações admin
```
id          uuid PK
admin_id    uuid FK auth.users
admin_role  text
action      text (ex: user.suspend, user.xp_grant, feature_flag.toggle)
target_type text | null
target_id   text | null
payload     jsonb | null
ip_address  inet | null
user_agent  text | null
created_at  timestamptz
```

**`feature_flags`** — flags de feature para rollout gradual
```
id           uuid PK
slug         text UNIQUE
name         text
description  text | null
enabled      boolean
rollout_pct  int | null (0-100)
segment      text | null (trial/active/lifetime/level_gte_3/etc.)
created_by   uuid | null FK auth.users
updated_by   uuid | null FK auth.users
created_at   timestamptz
updated_at   timestamptz
```
Flags pré-cadastradas: `coach_v3`, `social_feed`, `challenges_v2`, `finance_import`, `workout_ai`.

**`app_banners`** — banners in-app
```
id           uuid PK
title        text
body         text
cta_label    text | null
cta_url      text | null
target_plan  text[] | null (segmentação por plano)
target_level int | null (nível mínimo)
color_from   text (hex, default '#FF4D00')
color_to     text (hex, default '#7C3AED')
emoji        text
is_active    boolean
priority     int
starts_at    timestamptz | null
ends_at      timestamptz | null
dismissible  boolean
created_by   uuid | null
created_at   timestamptz
updated_at   timestamptz
```

**`banner_dismissals`** — registro de banners dispensados por usuário
```
banner_id    uuid FK app_banners  PK composta
user_id      uuid FK auth.users  PK composta
dismissed_at timestamptz
```

**`broadcast_campaigns`** — campanhas de push em massa
```
id              uuid PK
title           text
push_title      text
push_body       text
push_icon       text | null
push_url        text | null
target_segment  text (all/trial/active/lifetime/streak_active/at_risk)
target_count    int | null
status          text (draft/scheduled/sending/sent/failed)
scheduled_for   timestamptz | null
sent_at         timestamptz | null
sent_count      int
failed_count    int
created_by      uuid | null
created_at      timestamptz
updated_at      timestamptz
```

**`user_admin_notes`** — notas admin sobre usuários
```
id         uuid PK
user_id    uuid FK auth.users
admin_id   uuid FK auth.users
note       text
is_pinned  boolean
created_at timestamptz
```

**`user_suspensions`** — suspensões de usuários
```
id         uuid PK
user_id    uuid FK auth.users
admin_id   uuid FK auth.users
reason     text
type       text (temporary/permanent)
starts_at  timestamptz
ends_at    timestamptz | null
lifted_at  timestamptz | null
lifted_by  uuid | null FK auth.users
created_at timestamptz
```

**`user_reports`** — denúncias entre usuários
```
id         uuid PK
status     text (pending/resolved/dismissed)
...
```

**`metrics_daily`** — snapshots diários de métricas (para analytics)
Populado via RPC `snapshot_daily_metrics(p_date)` — cron às 01:00 UTC.

---

## 3. PÁGINAS — ÁREA DO USUÁRIO

Todas as páginas da área logada usam `AppShell` como wrapper (layout com sidebar + bottom nav + overlays).

### `/` (src/app/page.tsx)
Landing page ou redirect. Usuário logado → `/dashboard`.

### `/dashboard` (src/app/dashboard/page.tsx)
Painel principal. `force-dynamic`. Dados buscados em `Promise.all`:
- `profiles`: name, xp_total, level, streak_current, streak_longest, subscription_status, trial_end, perfect_days, streak_freezes, login_streak, last_login_date, recovery_week_active, recovery_week_used_month
- `habits`: ativos, ordenados por display_order
- `habit_logs` (hoje)
- `habit_logs` (últimos 7 dias)
- `tasks`: não concluídas/arquivadas, ordenadas urgent+important, limit 5
- `transactions`: is_paid=false, transaction_date >= hoje, limit 5
- `xp_transactions`: últimos 2 dias, limit 10 (feed de atividade)
- `xp_transactions`: últimos 7 dias (sparkline)
- `daily_loot`: pendente (opened_at is null), limit 1

**Componentes renderizados:**
XpWidget, StreakWidget, HabitsToday, TasksToday, FinanceAlerts, QuickActions, ActivityFeed, WeekProgress, LifeScore, InsightsWidget, MonthlyRecap, WeeklyChallenges, WeeklyXpBreakdown, LifeBalanceRadar, WorkoutPrsWidget, MorningBrief, HealthSummaryWidget, DailyPerformanceCard, DailyQuest, ComebackCard, StreakMilestone, WeeklyReport, NextAchievementWidget, StreakLeaderboard, StreakRiskBanner, XpToday, NextAction, LeagueWidget, LootBoxWidget, SeasonPassWidget, GuildWidget, RecoveryModeWidget

**Life Score** (calculado no servidor):
- habitsScore × 0.40 + streakScore × 0.25 + xpScore × 0.20 + taskScore × 0.15
- 500 XP/dia = 100 pontos de XP; 10 dias streak = 100 pontos; 4 critical tasks = 0 pontos de task

### `/habitos` (src/app/habitos/page.tsx)
Gestão de hábitos. `force-dynamic`.
Dados: habits completos, habit_logs (hoje + 7d + 30d), xp de hábitos nos últimos 30d, profile streak + perfect_days.
Componentes: HabitsList (CRUD + toggle de conclusão), HabitHeatmap, HabitStatsBreakdown, HabitCompletionCalendar, HabitYearHeatmap, HabitCorrelationMatrix, HabitTimeOfDayHeatmap, HabitStreakRecords.
Query param `?new=1` abre modal de criação.

### `/treinos` (src/app/treinos/page.tsx)
Lista de treinos + histórico.
Sub-rotas: `/treinos/novo` (novo treino), `/treinos/[id]` (detalhes do treino).
Componentes: VolumeChart, WorkoutTrends, WorkoutHeatmap, WorkoutDetail.

### `/treinos/[id]` (src/app/treinos/[id]/page.tsx)
Detalhes de um treino específico, sets, exercícios, volume total, PRs.

### `/tarefas` (src/app/tarefas/page.tsx)
Kanban com status todo/doing/done/archived + Eisenhower (urgent × important).
Sub-rota: `/tarefas/eisenhower` (matriz Eisenhower).
Componentes: KanbanBoard, TaskVelocityChart, TaskListsBreakdown, TaskDueTimeline, EisenhowerInsights, TaskDueDateHeatmap, TaskProductivityScore, TaskListProgressRings.

### `/financas` (src/app/financas/page.tsx)
Visão geral financeira.
Sub-rotas: `/financas/transacoes`, `/financas/contas`, `/financas/metas`.
Componentes: TransactionsView, AccountsManager, SpendingChart, MonthlyTrends, FinanceTrends, SpendingByCategory, NetWorthSummary, FinanceGoalsMilestones, FinanceMonthCalendar, FinanceRecurringAnalysis, SavingsRateTracker, CashFlowForecast, SpendingDowHeatmap, FinanceIncomeAnalysis, FinanceCategoryTrend.

### `/coach` (src/app/coach/page.tsx)
Chat com IA Coach (Anthropic). Cria conversas, histórico de 20 mensagens.
Componentes: CoachChat.

### `/score` (src/app/score/page.tsx)
Pontuação geral: XP total, level, histórico de XP, prestige, XP por fonte.
Componentes: XpChart, XpSourceBreakdown, XpLevelJourney.

### `/ranking` (src/app/ranking/page.tsx)
Ranking semanal por league_xp_this_week. Top 100.
Divisões: Bronze, Prata, Ouro, Platina, Diamante (baseado em percentil).
Dados via `/api/ranking` (cache 5 min).

### `/conquistas` (src/app/conquistas/page.tsx)
Lista de conquistas (desbloqueadas e bloqueadas).
Componentes: AchievementsShowcase.

### `/perfil` (src/app/perfil/page.tsx)
Edição de perfil, avatar, nome, bio. XP history chart. Daily activity map.
Componentes: PerfilForm, XpHistoryChart, XpHistory, DailyActivityMap.

### `/guilds` (src/app/guilds/page.tsx)
Lista guilds públicas, busca, entrar, criar (requer level 3+).
Componentes: GuildsClient.

### `/seasons` (src/app/seasons/page.tsx)
Season Pass / Battle Pass. Tiers free + premium.
Componentes: SeasonsClient.

### `/saude` (src/app/saude/page.tsx)
Tracking de saúde: água, sono, humor/energia/stress, recovery score.
APIs: `/api/health/water`, `/api/health/sleep`, `/api/health/mood`.

### `/metas` (src/app/metas/page.tsx)
Metas pessoais (não financeiras). CRUD de goals com progresso.
Componentes: GoalsOverview.

### `/calendario` (src/app/calendario/page.tsx)
Calendário de eventos. Integração Google Calendar.
Componentes: CalendarClient.

### `/planos` (src/app/planos/page.tsx)
Página de planos e preços. Exibida a usuários sem acesso (`subscription_status = 'expired'`). Checkout via Stripe.

### `/onboarding` (src/app/onboarding/page.tsx)
Fluxo de boas-vindas após cadastro. Define `primary_goal`, `weekly_target`. Concede 100 XP ao completar.

### `/login` (src/app/login/page.tsx)
Autenticação. Email/senha via Supabase Auth.

### `/auth/callback` (src/app/auth/callback/route.ts)
Callback OAuth do Supabase. Troca code por sessão.

---

## 4. PÁGINAS — ÁREA ADMIN

Acesso protegido por `getAdminSession()`. Rota base: `/admin`. Verificação de role em cada page/API.

### `/admin` — Overview (src/app/admin/page.tsx)
Requer: qualquer role admin.
Exibe: Total usuários, DAU, assinantes ativos, em trial, hábitos hoje, XP gerado hoje, expirados, novos (30d), funil de subscription, top 5 usuários por XP, denúncias pendentes.
Dados: 12 queries paralelas via service role.

### `/admin/usuarios` — Lista de Usuários (src/app/admin/usuarios/page.tsx)
Requer: role `support` ou superior.
Exibe: listagem paginada (25/pág), busca por nome, filtro por status. Exportação CSV.
Cada usuário: nome, level, XP total, streak, status de subscription, data de criação, is_suspended.

### `/admin/usuarios/[id]` — Perfil Detalhado do Usuário
Ações disponíveis: grant_xp, suspend, unsuspend, reset_streak, extend_trial, reset_password, change_plan.
Exibe notas admin, histórico de ações do audit log.

### `/admin/gamificacao` — Painel de Gamificação (src/app/admin/gamificacao/page.tsx)
Gestão de conquistas, temporadas (criar/editar seasons com tiers), cosméticos.

### `/admin/analytics` — Analytics (src/app/admin/analytics/page.tsx)
Gráficos de métricas diárias (metrics_daily), DAU, retenção, XP gerado, conversão trial→paid.

### `/admin/operacoes` — Operações (src/app/admin/operacoes/page.tsx)
Feature flags (toggle/rollout), banners in-app (criar/ativar), broadcasts de push notification.
Sub-rota: `/admin/operacoes/feature-flags`.

### `/admin/seguranca` — Segurança (src/app/admin/seguranca/page.tsx)
Audit log, denúncias de usuários, suspensões ativas.

### `/admin/sistema` — Sistema (src/app/admin/sistema/page.tsx - se existir)
Trigger manual de cron jobs via `/api/admin/sistema/trigger-cron`.

---

## 5. API ROUTES — TODAS

### Auth
- `GET /api/auth/logout` — logout via Supabase

### Hábitos
- `GET /api/habits` — lista hábitos ativos do usuário
- `POST /api/habits` — cria hábito (valida max 10 ativos)
- `PUT /api/habits/[id]` — edita hábito
- `DELETE /api/habits/[id]` — desativa hábito (is_active=false)
- `POST /api/habits/log` — registra conclusão de hábito hoje. Fluxo: insere log → grantXP → verifica achievements (first_habit, habits_100/500/1000) → verifica Dia Perfeito via RPC maybe_grant_perfect_day → cria loot box → updateUserStreak. Retorna xpEarned, leveledUp, perfectDay, achievementsUnlocked.

### Treinos
- `GET /api/treinos` — lista workouts do usuário
- `POST /api/treinos` — cria workout (inicia sessão)
- `PUT /api/treinos/[id]` — finaliza treino (finished_at, total_volume_kg, total_sets, etc.)
- `DELETE /api/treinos/[id]` — deleta treino

### Tarefas
- `GET /api/tasks` — lista tarefas (filtros: status, list_id, urgent, important)
- `POST /api/tasks` — cria tarefa com Zod validation
- `PUT /api/tasks/[id]` — atualiza tarefa, concede XP se mudar para done
- `DELETE /api/tasks/[id]` — deleta tarefa (soft delete via archived)
- `GET /api/task-lists` — lista listas/projetos
- `POST /api/task-lists` — cria lista
- `PUT /api/task-lists/[id]` — edita lista
- `DELETE /api/task-lists/[id]` — deleta lista
- `GET /api/subtasks?task_id=` — lista subtarefas
- `POST /api/subtasks` — cria subtarefa
- `PUT /api/subtasks/[id]` — toggle subtarefa
- `DELETE /api/subtasks/[id]` — deleta subtarefa

### Finanças
- `GET /api/transactions` — lista transações (filtros: account_id, type, date range, is_paid)
- `POST /api/transactions` — cria transação. Suporta parcelamento (1-60x). Atualiza saldo da conta. Concede XP. Atualiza finance_streak.
- `PUT /api/transactions/[id]` — atualiza transação
- `DELETE /api/transactions/[id]` — deleta transação (e parcelas do grupo se installment_group_id)
- `GET /api/finance-accounts` — lista contas
- `POST /api/finance-accounts` — cria conta
- `PUT /api/finance-accounts/[id]` — edita conta
- `DELETE /api/finance-accounts/[id]` — deleta conta
- `GET /api/finance-categories` — lista categorias (globais + do usuário)
- `POST /api/finance-categories` — cria categoria
- `GET /api/finance-goals` — lista metas financeiras
- `POST /api/finance-goals` — cria meta
- `PUT /api/finance-goals/[id]` — atualiza progresso/status da meta

### Metas Pessoais
- `GET /api/goals` — lista goals
- `POST /api/goals` — cria goal, valida com Zod
- `PUT /api/goals/[id]` — atualiza goal (current_value, status), concede XP ao completar (GOAL_COMPLETED=200)
- `DELETE /api/goals/[id]` — cancela goal

### Saúde
- `GET /api/health/water` — water_logs do dia
- `POST /api/health/water` — registra consumo de água
- `GET /api/health/sleep` — sleep_logs (7 dias)
- `POST /api/health/sleep` — registra sono, concede XP
- `GET /api/health/mood` — mood_logs recentes
- `POST /api/health/mood` — registra humor/energia/stress, concede XP

### Gamificação
- `GET /api/login-checkin` — estado do check-in de hoje (loginStreak, dayInCycle, nextXpReward)
- `POST /api/login-checkin` — registra check-in diário. Calcula dia no ciclo 1-7. Concede XP. Dia 7 gera loot box. Idempotente (retorna alreadyDone se já fez hoje).
- `GET /api/daily-reward` — alias/similar ao login-checkin GET
- `POST /api/daily-reward` — alias/similar ao login-checkin POST
- `GET /api/loot` — retorna loot box pendente (não aberta) mais recente
- `POST /api/loot` — abre loot box: aplica recompensa (XP, streak_freeze ou cosmético), insere notificação
- `GET /api/ranking` — ranking semanal top 100. Cache 5min. Retorna leaderboard com divisões, myPosition, myDivision, totalPlayers.
- `GET /api/seasons` — temporada ativa + progresso do usuário (season_xp, current_tier, claimed_tiers, claimable_tiers, days_left)
- `POST /api/seasons` — reivindica tier { tier: number }. Valida XP suficiente + tier não reivindicado + plano ativo se tier premium. Aplica recompensa (XP/streak_freeze/title/frame).
- `POST /api/recovery-mode` — ativa (action: 'activate') ou desativa (action: 'deactivate') Modo Silêncio. Limite: 1x/mês. Desativar dá +200 XP de bônus.
- `GET /api/recovery-mode` — estado atual + disponibilidade do mês
- `POST /api/streak-freeze` — usa (action: 'use') ou concede (action: 'grant', amount) streak freeze
- `GET /api/shop` — lista itens da XP Shop + XP do usuário + inventário
- `POST /api/shop` — compra item { item: ShopItemId }. Itens: streak_freeze (500 XP), loot_box (300 XP), xp_boost_2x (800 XP), streak_recovery (1200 XP)

### Guilds
- `GET /api/guilds` — lista guilds públicas (ordenadas por weekly_xp), inclui contagem de membros, myGuild
- `POST /api/guilds` — cria guild (requer level 3+, não estar em outra guild)
- `GET /api/guilds/[id]` — detalhes da guild
- `PUT /api/guilds/[id]` — edita guild (só owner)
- `DELETE /api/guilds/[id]` — deleta guild (só owner)
- `POST /api/guilds/[id]/join` — entra na guild (por invite_code ou id se pública)

### Coach IA
- `GET /api/coach/conversations` — lista conversas do usuário
- `POST /api/coach/conversations` — cria nova conversa
- `POST /api/coach` — envia mensagem. Rate limit: 50/dia. Busca contexto completo do usuário (14 queries paralelas). Usa `claude-sonnet-4-6` com prompt caching (STATIC_COACH_PROMPT cacheado). Salva mensagens no banco. Auto-título na 1ª resposta.

### Calendário
- `GET /api/calendario` — eventos do período
- `POST /api/calendario` — cria evento

### Notificações
- `GET /api/notifications` — lista notificações do usuário (paginadas, 20/página)
- `PUT /api/notifications` — marca como lido (ids[] ou all=true)

### Perfil
- `GET /api/perfil` — dados do perfil
- `PUT /api/perfil` — atualiza nome, bio, avatar_url, primary_goal, weekly_target, timezone

### Push Notifications
- `POST /api/push` — registra subscription de Web Push

### Onboarding
- `POST /api/onboarding` — completa onboarding (onboarding_completed=true, concede 100 XP)

### Busca
- `GET /api/search?q=` — busca global em habits, tasks, transactions

### Referral
- `GET /api/referral` — código de referral do usuário
- `POST /api/referral` — aplica código de referral

### Billing
- `POST /api/checkout` — cria sessão de checkout Stripe
- `POST /api/billing-portal` — cria sessão do portal do cliente Stripe
- `POST /api/webhook/stripe` — webhook Stripe (checkout.session.completed, customer.subscription.*)

### Admin APIs
- `POST /api/admin/users/[id]/actions` — ações sobre usuário (grant_xp, suspend, unsuspend, reset_streak, extend_trial, reset_password, change_plan). Auditado em audit_logs.
- `POST /api/admin/users/[id]/note` — adiciona nota admin sobre usuário
- `GET /api/admin/users/export` — exporta CSV de usuários (requer admin role)
- `POST /api/admin/xp-grant` — concede XP em massa para segmento
- `POST /api/admin/feature-flags` — cria feature flag
- `PATCH /api/admin/feature-flags` — toggle/atualiza feature flag
- `GET /api/admin/banners` — lista banners ativos
- `POST /api/admin/banners` — cria banner
- `POST /api/admin/banners/[id]/toggle` — ativa/desativa banner
- `POST /api/admin/broadcasts` — cria campanha de broadcast
- `POST /api/admin/broadcasts/[id]/send` — envia broadcast para segmento (até 10k subs via webpush)
- `POST /api/admin/seasons` — cria ou atualiza temporada
- `GET /api/admin/reports/[id]` — detalhes de denúncia
- `PUT /api/admin/reports/[id]` — resolve/rejeita denúncia
- `GET /api/admin/debug` — informações de debug do sistema
- `POST /api/admin/sistema/trigger-cron` — dispara cron manualmente

---

## 6. CRON JOBS

Todos autenticados via `Bearer ${CRON_SECRET}` (verificado em `isCronAuthorized()` de `src/lib/cron-auth.ts`).
`maxDuration` configurado por rota (30-120s).

| Cron | Horário (UTC) | Horário Brasília | O que faz |
|---|---|---|---|
| `streak-alerts` | 23:00 | 20:00 | Push para usuários com streak ativo que não tiveram atividade hoje. Lógica batch: 6 queries para TODOS (antes: 5 queries por usuário = O(5N)). |
| `streaks` | 03:00 | 00:00 | Atualiza streak de todos os usuários via RPC `batch_process_streaks()`. Processa milestones (3/7/30/90/180/365 dias) só para quem cruzou. Notifica recordes pessoais nos thresholds: 10,15,20,25,50,75,100,150,200,250,300 dias. |
| `league-reset` | 03:30 (seg) | 00:30 | Reseta `league_xp_this_week` de todos os profiles e `weekly_xp` de todas as guilds via RPC `reset_weekly_league_xp()`. |
| `habit-reminders` | Horário variável | Horário do hábito | Push para hábitos com `reminder_time` na hora atual que ainda não foram logados hoje. Batch: 4 queries para TODOS (antes: O(2N)). |
| `task-reminders` | 09:00 | 06:00 | Push para tarefas com due_date = hoje ainda não concluídas. Agrupa por usuário. |
| `perfect-day-reminder` | 01:00 | 22:00 | Push "Quase lá!" para usuários com hábitos parcialmente feitos hoje (>0 feito, <total). Pula usuários em recovery mode. |
| `daily-recap` | 00:00 | 21:00 | Push de resumo do dia para usuários com atividade. Mensagem contextual (épico/excelente/razoável). |
| `trial-emails` | 10:00 | 07:00 | Emails automáticos via Resend: D1 (boas-vindas), D5 (trial acaba em 2 dias), D6 (acaba amanhã). |
| `weekly-digest` | 09:00 (seg) | 06:00 | Email semanal com stats. Batch: 4 queries para TODOS (antes: O(4N)). |
| `weekly-challenges` | ? | ? | Gera desafios semanais |
| `goal-reminders` | ? | ? | Lembretes de metas próximas do prazo |
| `calendar-sync` | ? | ? | Sincroniza eventos do Google Calendar |
| `memories` | ? | ? | Gera "1 ano atrás" / memórias para o feed |
| `notifications` | ? | ? | Processa fila de notificações agendadas |
| `metrics-snapshot` | 01:00 | 22:00 | Snapshot diário de métricas via RPC `snapshot_daily_metrics(p_date)` para analytics |

---

## 7. COMPONENTES — POR ÁREA

### Layout (`src/components/layout/`)

**`AppShell`** — wrapper de toda área logada. Busca profile + notifs não lidas + tarefas críticas. Renderiza: Sidebar, MobileHeader, BottomNav, MobileFab, PushPrompt, PwaInstallPrompt, MiniCoachFab, LevelUpCelebration, PerfectDayOverlay, AchievementToast, DailyLoginReward, ScrollRestoration. Provê `AppShellRealtimeProvider` (contexto realtime de XP/level/streak).

**`Sidebar`** — navegação desktop (240px). Itens: Dashboard, Hábitos, Treinos, Tarefas, Finanças, Coach, Score, Ranking, Conquistas, Saúde, Metas, Calendário, Guilds, Seasons, Perfil. Badge de notificações não lidas.

**`BottomNav`** — navegação mobile (bottom bar). 5 abas: Dashboard, Tarefas (com badge de tarefas críticas), Fitness, Finanças, Coach. Animação `navIconBounce` ao selecionar.

**`MobileHeader`** — header mobile com nome, level, XP total, streak, badge de notificações.

**`MiniCoachFab`** — FAB flutuante para abrir chat com o Coach IA (todas as páginas).

**`MobileFab`** — FAB de ação rápida contextual por rota (ex: "+" em hábitos, treinos, tarefas, finanças).

### Dashboard (`src/components/dashboard/`)

Componentes principais:
- **`XpWidget`** — XP total, level, barra de progresso para próximo nível
- **`StreakWidget`** — streak atual com animação de fogo, streak_longest
- **`HabitsToday`** — hábitos do dia com toggle de conclusão
- **`TasksToday`** — tarefas pendentes (urgentes primeiro)
- **`FinanceAlerts`** — contas a pagar hoje (transações is_paid=false)
- **`QuickActions`** — atalhos para ações frequentes
- **`ActivityFeed`** — feed de XP ganho nas últimas 48h
- **`WeekProgress`** — progresso semanal de hábitos (7 dias)
- **`LifeScore`** — score calculado de 0-100
- **`InsightsWidget`** — dica baseada nos dados (XP para próximo nível, streak risco, etc.)
- **`LeagueWidget`** — posição no ranking semanal e divisão
- **`LootBoxWidget`** — loot box pendente com animação de abertura
- **`SeasonPassWidget`** — progresso na temporada atual
- **`GuildWidget`** — XP da guild esta semana
- **`RecoveryModeWidget`** — toggle de Modo Silêncio
- **`DailyLoginReward`** — modal de check-in diário (ciclo 7 dias)
- **`StreakRiskBanner`** — banner pulsante quando streak > 0 e sem atividade hoje
- **`StreakMilestone`** — celebração ao cruzar milestone
- **`ComebackCard`** — card motivacional quando streak = 0

### Hábitos (`src/components/habitos/`)
- **`HabitsList`** — CRUD completo de hábitos + toggle de conclusão com animação `checkPulse`. PATCH `/api/habits/log` ao marcar. Modal de criação/edição.
- **`HabitHeatmap`** — heatmap dos últimos 30 dias
- **`HabitStatsBreakdown`** — estatísticas por categoria
- **`HabitCompletionCalendar`** — calendário de completions
- **`HabitYearHeatmap`** — heatmap do ano inteiro (GitHub-style)
- **`HabitCorrelationMatrix`** — correlação entre hábitos
- **`HabitTimeOfDayHeatmap`** — horário preferido de completar
- **`HabitStreakRecords`** — recordes de streak por hábito

### Tarefas (`src/components/tarefas/`)
- **`KanbanBoard`** — board drag & drop (dnd-kit) com colunas todo/doing/done
- **`TaskVelocityChart`** — velocidade de conclusão ao longo do tempo
- **`TaskListsBreakdown`** — distribuição por lista/projeto
- **`EisenhowerInsights`** — análise da matriz 2×2
- **`TaskDueTimeline`** — linha do tempo de prazos
- **`TaskDueDateHeatmap`** — heatmap de prazos
- **`TaskProductivityScore`** — score de produtividade
- **`TaskListProgressRings`** — anéis de progresso por lista

### Finanças (`src/components/financas/`)
- **`TransactionsView`** — listagem e filtros de transações
- **`AccountsManager`** — gestão de contas bancárias/cartões
- **`SpendingChart`** — gráfico de gastos (lazy)
- **`MonthlyTrends`** — tendências mensais
- **`SpendingByCategory`** — pizza de gastos por categoria
- **`NetWorthSummary`** — patrimônio líquido
- **`FinanceGoalsMilestones`** — progresso das metas financeiras
- **`FinanceMonthCalendar`** — calendário de transações do mês
- **`SavingsRateTracker`** — taxa de poupança
- **`CashFlowForecast`** — projeção de fluxo de caixa
- **`SpendingDowHeatmap`** — gastos por dia da semana

### Treinos (`src/components/treinos/`)
- **`VolumeChart`** — volume total ao longo do tempo (lazy)
- **`WorkoutTrends`** — tendências de treino
- **`WorkoutHeatmap`** — frequência de treinos
- **`WorkoutDetail`** — detalhe de uma sessão
- **`WorkoutDetailActions`** — ações (editar, deletar)
- **`PrProgress`** — progresso de PRs por exercício
- **`ExercisePrTracker`** — tracker de recordes pessoais
- **`WorkoutMuscleBalance`** — distribuição por grupo muscular
- **`WorkoutVolumeAnalysis`** — análise de volume
- **`WorkoutVolumeProgression`** — progressão de volume
- **`WorkoutDayOfWeekAnalysis`** — análise por dia da semana
- **`WorkoutRestDayAdvisor`** — sugestão de dias de descanso

### Score (`src/components/score/`)
- **`XpChart`** — gráfico de XP ao longo do tempo (lazy, Recharts)
- **`XpSourceBreakdown`** — quebra de XP por fonte
- **`XpLevelJourney`** — jornada de levels

### Coach (`src/components/coach/`)
- **`CoachChat`** — interface de chat com histórico de mensagens, streaming, rate limit exibido

### Perfil (`src/components/perfil/`)
- **`PerfilForm`** — formulário de edição (nome, bio, avatar, goal, weekly_target)
- **`XpHistoryChart`** — histórico de XP (lazy, Recharts)
- **`XpHistory`** — lista de transações de XP
- **`AchievementsShowcase`** — exibição de conquistas desbloqueadas
- **`DailyActivityMap`** — mapa de atividade diária (GitHub contributions-style)
- **`XpLevelJourney`** — jornada visual de levels

### Guilds (`src/components/guilds/`)
- **`GuildsClient`** — listagem, busca, modal de criação, modal de entrada

### Seasons (`src/components/seasons/`)
- **`SeasonsClient`** — progresso na temporada, lista de tiers, botão de claim

### Calendário (`src/components/calendario/`)
- **`CalendarClient`** — visualização de calendário com eventos

### Metas (`src/components/metas/`)
- **`GoalsOverview`** — lista de metas com progresso

### Globais
- **`LevelUpCelebration`** — overlay de confetti ao subir de level (ouve evento realtime)
- **`PerfectDayOverlay`** — celebração de Dia Perfeito
- **`AchievementToast`** — toast de conquista desbloqueada
- **`PushPrompt`** — solicitação de permissão para push notifications
- **`PwaInstallPrompt`** — banner "Instalar no celular"
- **`PullToRefresh`** — pull-to-refresh nativo para mobile
- **`ScrollRestoration`** — restaura posição de scroll entre navegações

---

## 8. SISTEMA DE GAMIFICAÇÃO

### Tabela de Levels
Ver seção 1 (Visão Geral).

### Sistema de Prestige
Após atingir Level 8 (35.000 XP), o usuário pode "prestígiar" acumulando XP all-time.

| Prestige | XP All-Time | Título | Emoji |
|---|---|---|---|
| 0 | — | — | — |
| 1 | 35.000 | Ascendido | ⭐ |
| 2 | 70.000 | Ascendido II | ⭐ |
| 3 | 120.000 | Diamante | 💎 |
| 4 | 200.000 | Diamante II | 💎 |
| 5 | 350.000 | Imortal | 🔥 |
| 6 | 500.000 | Imortal II | 🔥 |
| 7 | 750.000 | Imortal III | 🔥 |
| 8 | 1.000.000 | Lendário | 👑 |
| 9 | 1.500.000 | Lendário II | 👑 |
| 10 | 2.500.000 | Lendário Eterno | 👑 |

`prestige_level` armazenado em `profiles`. Calculado por `calculatePrestige(xpAllTime)`.
Ao subir prestige: notificação in-app + push. Cosméticos de prestige: title_ascendido, title_diamante, title_imortal, title_lendario_eterno.

### Leagues (Divisões Semanais)

| Divisão | Percentil mínimo | Cor | Emoji |
|---|---|---|---|
| Diamante | 97%+ | #00D9FF | 💎 |
| Platina | 90%+ | #7C3AED | 🏆 |
| Ouro | 75%+ | #F5C842 | 🥇 |
| Prata | 50%+ | #8899BB | 🥈 |
| Bronze | 0%+ | #CD7F32 | 🥉 |

Baseado em `league_xp_this_week`. Resetado toda segunda-feira às 03:30 UTC via RPC `reset_weekly_league_xp()`.

### Achievements (Conquistas)
Sistema via `tryUnlockAchievement(userId, slug)` — idempotente (PK composta rejeita duplicatas).
Ao desbloquear: concede `xp_reward` via `grant_xp_atomic`, insere notificação in-app, envia push.

Slugs conhecidos no código:
- `first_habit` — primeiro hábito logado
- `habits_100`, `habits_500`, `habits_1000` — marcos de completions
- `level_2` a `level_8` — ao subir de level
- `streak_3`, `streak_7`, `streak_30`, `streak_90`, `streak_180`, `streak_365`
- `perfect_day` — primeiro dia perfeito
- `perfect_week` — 7 dias perfeitos no mesmo ciclo

### Streak System
- **Critério de atividade:** hábito logado OU treino finalizado OU tarefa concluída no dia
- **Cálculo:** server-side via cron `batch_process_streaks()` às 03:00 UTC
- **Streak Freeze automático:** ao perder dia com freeze disponível, streak é preservado e 1 freeze é descontado
- **Milestones com recompensas:**
  - 3 dias: +100 XP, conquista streak_3
  - 7 dias: +300 XP, conquista streak_7, +1 freeze
  - 30 dias: +1000 XP, conquista streak_30, +2 freezes
  - 90 dias: +3000 XP, conquista streak_90, +3 freezes
  - 180 dias: conquista streak_180, +3 freezes
  - 365 dias: conquista streak_365, +5 freezes
- **Notificações de recorde pessoal** para thresholds: 10, 15, 20, 25, 50, 75, 100, 150, 200, 250, 300 dias

### Perfect Day
- Acionado em `POST /api/habits/log` quando todos os hábitos ativos são logados no dia
- Implementado via RPC `maybe_grant_perfect_day(p_user_id)` — atômico, anti-race condition
- Concede: +200 XP bonus + conquista `perfect_day` + a cada 7 perfect_days conquista `perfect_week` + cria loot box
- Cron `perfect-day-reminder` às 22:00 BR envia push para quem está "quase lá"

### Login Streak Rewards (Ciclo 7 dias)
- Registrado via `POST /api/login-checkin`
- Ciclo recomeça após dia 7 (não perde ao quebrar, mas o streak de login reseta se pular um dia)
- Dia 7: +300 XP + loot box automática (source: 'login_day7')
- `DailyLoginReward` componente exibido no AppShell ao entrar no app (modal, dia 1x)

### Loot Boxes
Criadas por: `createDailyLoot(userId, date, source)` em `src/lib/xp-server.ts`.
Fontes: `perfect_day`, `login_streak`, `login_day7`, shop.
Raridade (aleatória server-side):
- 60% comum: +50 XP
- 25% raro: +150 XP
- 12% épico: +1 streak freeze
- 3% lendário: cosmético aleatório da tabela `cosmetics` (type='title', source='loot')
Abertura: `POST /api/loot` — aplica recompensa e marca `opened_at`.

### Season Pass (Battle Pass)
- 1 temporada ativa por vez (`is_active = true` em `seasons`)
- Tiers em JSONB: array de `SeasonTier` com requisito de season_xp e recompensa
- Tiers `free: true` acessíveis a todos; `free: false` requerem plano ativo
- Season XP ganho paralelamente ao XP normal (via `increment_weekly_stats`)
- Claim via `POST /api/seasons` — valida XP, idempotente via claimed_tiers[]
- Recompensas: xp, streak_freeze, title (cosmético + equipped_title), frame (cosmético)

### Recovery Mode (Modo Silêncio)
- Ativa `recovery_week_active = true` no profile
- Protege streak por até 7 dias (cron de streak respeitado por batch_process_streaks)
- Disponível 1x por mês (`recovery_week_used_month` guarda o número do mês)
- Ao desativar: +200 XP de bônus por autocuidado
- Cron `perfect-day-reminder` pula usuários em recovery mode

### Streak Freeze
- Máximo 10 por usuário (`MAX_STREAK_FREEZES = 10`)
- Uso manual: `POST /api/streak-freeze { action: 'use' }`
- Uso automático: cron de streaks usa 1 freeze antes de zerar
- Adquiridos via: milestones de streak, loot box épico, shop (500 XP), season pass, admin

### XP Shop
Items disponíveis (`SHOP_ITEMS` em `/api/shop/route.ts`):
- `streak_freeze`: 500 XP, máx 10
- `loot_box`: 300 XP, sem limite
- `xp_boost_2x`: 800 XP, máx 5 (dobra XP por 1 hora — boost não totalmente implementado ainda)
- `streak_recovery`: 1200 XP, máx 3 (restaura streak — parcialmente implementado)

---

## 9. DESIGN SYSTEM

### Cores (tailwind.config.ts)
```
bg.DEFAULT  = '#050914'  — background da página
bg.card     = '#0D1829'  — background de cards
bg.elevated = '#152238'  — inputs, elementos elevados

border.DEFAULT = '#1F2D45'
border.subtle  = '#152238'

text.primary   = '#FFFFFF'
text.secondary = '#8899BB'
text.muted     = '#5A6B85'

brand.orange = '#FF4D00'  — cor primária, CTAs, gradiente
brand.purple = '#7C3AED'  — cor secundária, gradiente
brand.green  = '#00FF88'  — sucesso, conquistas
brand.gold   = '#F5C842'  — XP, dourado
brand.red    = '#FF4444'  — erro, perigo
brand.blue   = '#3B82F6'  — informação
```

Gradiente principal: `linear-gradient(135deg, #FF4D00 0%, #7C3AED 100%)` — classe `bg-gradient-brand`
Gradiente card: `linear-gradient(135deg, rgba(124,58,237,0.08), rgba(255,77,0,0.08))` — classe `bg-gradient-card`

### Fontes
- Interface/corpo: `DM Sans` — variável `--font-dm-sans` — classe `font-sans`
- Display/títulos: `Bebas Neue` — variável `--font-bebas` — classe `font-display` / `.heading-display`

### Componentes CSS Customizados (globals.css)
```css
.card            — bg-bg-card border border-border rounded-2xl
.card-glow       — card com pseudo-elemento gradiente
.btn-primary     — gradiente laranja→roxo, rounded-xl, shadow laranja
.btn-ghost       — bg-bg-elevated, border, rounded-xl
.input           — bg-bg-elevated, focus ring roxo
.heading-display — Bebas Neue, uppercase, tracking-wider
.shimmer         — loading skeleton animado
.xp-pill         — inline-flex dourado com borda
.glass           — glassmorphism (backdrop-blur 12px)
.perf-great/.perf-good/.perf-alert — estados de performance
.gradient-text   — texto com gradiente laranja→roxo
.hover-lift      — lift on hover (-translate-y-0.5 + shadow)
```

### Animações (tailwind.config.ts)
```
animate-fade-in       — fadeIn 0.4s ease-out
animate-slide-up      — slideUp 0.4s ease-out (entra de baixo)
animate-bounce-in     — bounceIn 0.6s cubic-bezier spring
animate-streak-fire   — streakFire 1.5s (brilho pulsante)
animate-shimmer       — shimmer 2s (loading skeleton)
animate-glow-green/orange/cyan/gold — glow pulsante
animate-level-up      — levelUp 0.8s spring para modal
animate-xp-bump       — xpBump 2.2s floating toast
```

### Keyframes Especiais (globals.css)
```css
@keyframes navIconBounce  — ícone da bottom nav ao selecionar
@keyframes checkPulse     — confirmação ao completar hábito
@keyframes fabSpringIn/Out — FAB ao mudar de rota
@keyframes streakRiskPulse — borda pulsante do streak risk banner
@keyframes confettiFallDeep — confetti de level-up
@keyframes habitRingFill  — animação SVG do ring de hábito
```

### Safe Areas iOS
```css
.safe-area-pt  — padding-top: env(safe-area-inset-top)
.safe-area-pb  — padding-bottom: env(safe-area-inset-bottom)
.mb-safe       — margin-bottom: env(safe-area-inset-bottom)
```

### Padrão de Card
```jsx
<div className="card p-4">  // básico
<div className="card-glow p-4">  // com gradiente overlay
// Card com borda colorida (frequente):
<div style={{ background: 'rgba(R,G,B,0.08)', border: '1px solid rgba(R,G,B,0.2)' }} className="rounded-xl p-4">
```

### Padrão de Botão
```jsx
<button className="btn-primary">Ação principal</button>
<button className="btn-ghost">Ação secundária</button>
// Botão com gradiente inline:
<button style={{ background: 'linear-gradient(135deg,#FF4D00,#7C3AED)' }} className="...rounded-xl font-bold text-white">
```

### View Transitions API
Habilitado em `next.config.ts` (`experimental.viewTransition: true`).
CSS: fade vertical no desktop, slide vertical no mobile (≤767px).

---

## 10. LIBS E UTILITÁRIOS

### `src/lib/xp.ts`
Funções puras seguras para client e server.
Exports principais:
- `XP_REWARDS` — constantes de XP por ação
- `LOGIN_STREAK_REWARDS` — mapa dia → XP
- `getLoginReward(dayInCycle)` — retorna XP do dia no ciclo 7
- `LEVELS` — array de 8 levels com faixas de XP
- `PRESTIGE_THRESHOLDS`, `PRESTIGE_INFO` — prestige system
- `LEAGUE_DIVISIONS` — 5 divisões com percentis
- `calculateLevel(xp)` — retorna level (1-8)
- `getLevelInfo(level)` — retorna dados do level
- `getXpProgressToNextLevel(xp)` — retorna { current, needed, percentage }
- `calculatePrestige(xpAllTime)` — retorna prestige level (0-10)
- `getPrestigeInfo(prestigeLevel)` — retorna dados do prestige
- `getLeagueDivision(position, totalPlayers)` — retorna divisão
- `type XpSourceType` — union type das fontes de XP
- `interface GrantXpResult` — retorno de grantXP

### `src/lib/xp-server.ts`
Server-only. NUNCA importar em Client Components.
Exports:
- `grantXP(userId, amount, reason, sourceType, sourceId?)` — via RPC + fallback + prestige + achievements + push milestones
- `tryUnlockAchievement(userId, slug)` — idempotente, concede XP do achievement, envia notif
- `createDailyLoot(userId, date, source)` — gera loot box aleatória
- `grantStreakFreeze(userId, amount)` — concede freezes (máx 10)
- `getUserStats(userId)` — retorna totalWorkouts, totalTasks, totalTransactions, perfectDays

### `src/lib/supabase/types.ts`
Todos os tipos TypeScript do banco. Exports: Profile, DailyLoot, Guild, GuildMember, Season, SeasonTier, SeasonProgress, Cosmetic, UserCosmetic, Habit, HabitLog, Exercise, Workout, WorkoutSet, Goal, TaskList, Task, Subtask, FinanceAccount, FinanceCategory, Transaction, FinanceGoal, Achievement, UserAchievement, XpTransaction, AiConversation, AiMessage, CalendarIntegration, CalendarEvent, Notification, WaterLog, SleepLog, MoodLog. Também exporta union types: SubscriptionStatus, SubscriptionPlan, HabitCategory, TaskStatus, TransactionType, AccountType, GoalStatus, Rarity, AiRole, NotificationType, LootRarity, LootRewardType, GuildRole, CosmeticType, CosmeticSource.

### `src/lib/supabase/server.ts`
- `createClient()` — cliente Supabase com cookies SSR (para Server Components, API Routes)
- `createServiceClient()` — cliente com service role key (para crons, webhooks, admin APIs)

### `src/lib/supabase/client.ts`
- `createClient()` — cliente Supabase para Client Components

### `src/lib/streak.ts`
- `hadActivityOnDate(userId, date)` — verifica atividade num dia (hábitos OR treinos OR tarefas). 3 queries em paralelo.
- `updateUserStreak(userId)` — atualiza streak. Verifica hoje e ontem. Aplica freeze automático. Processa milestones com XP/conquistas/freezes.

### `src/lib/admin.ts`
- `getAdminSession(supabaseUser)` — verifica role admin via `admin_roles` table. Retorna AdminSession | null.
- `hasMinRole(session, minRole)` — verifica hierarquia de roles (super_admin=5, admin=4, moderator=3, support=2, analyst=1)
- `auditLog(params)` — registra ação em `audit_logs` com IP e user-agent
- `ROLE_HIERARCHY`, `ROLE_LABELS`, `ROLE_COLORS` — mapeamentos de roles

### `src/lib/constants.ts`
- `WATER_GOAL_ML = 2000`
- `SLEEP_GOAL_H = 8`
- `RECOVERY_GOOD_THRESHOLD = 75`, `RECOVERY_OK_THRESHOLD = 50`
- `MS_PER_DAY = 24 * 60 * 60 * 1000`
- `DEFAULT_TIMEZONE = 'America/Sao_Paulo'`
- `DEFAULT_PAGE_SIZE = 50`
- `MAX_ACTIVE_HABITS = 10`
- `DAILY_COACH_MESSAGE_LIMIT = 50`
- `MAX_STREAK_FREEZES = 10`

### `src/lib/email.ts`
Via Resend (`noreply@ascendia.app`).
- `sendTrialEndingEmail(to, name, daysLeft)` — email de urgência de trial
- `sendWeeklyDigest(to, name, stats)` — email semanal com stats completas
- `sendWelcomeEmail(to, name)` — email de boas-vindas

### `src/lib/utils.ts`
- `cn(...inputs)` — merge de classes Tailwind (clsx + tailwind-merge)
- `formatBRL(value)` — formata como R$ BRL
- `formatDateBR(date)` — formata como DD/MM/YYYY
- `formatRelativeDate(date)` — "Hoje", "Ontem", "Há N dias"
- `getGreeting()` — saudação por horário
- `calcPercentage(current, target)` — porcentagem 0-100
- `todayString(timezone?)` — data atual YYYY-MM-DD no timezone (default: America/Sao_Paulo). Usa Intl.DateTimeFormat para evitar bug de data UTC após 21h BR.
- `sleep(ms)` — Promise sleep

### `src/lib/cron-auth.ts`
- `isCronAuthorized()` — verifica `Authorization: Bearer ${CRON_SECRET}` no header
- `cronUnauthorized()` — retorna NextResponse 401

### `src/lib/dates.ts`
- `daysAgoISO(n)` — retorna ISO string de N dias atrás

### `src/lib/webpush.ts`
- `sendPushNotification(endpoint, keys_p256dh, keys_auth, payload)` — envia push. Retorna `{ gone: boolean }` (gone=true quando subscription expirou → deve ser deletada).

### `src/lib/stripe.ts`
- Configuração do cliente Stripe para checkout e billing portal.

### `src/proxy.ts` (anteriormente middleware.ts)
**Responsabilidades:**
1. Renovar sessão Supabase em todas as requests
2. Proteger rotas do app — redirect `/login` se não autenticado
3. Bloquear acesso se subscription expirou — redirect `/planos`

**Rotas públicas:** `/`, `/login`, `/signup`, `/recuperar-senha`, `/nova-senha`, `/sobre`, `/termos`, `/privacidade`, `/planos`, `/api/webhook/*`, `/auth/*`

**Cron protection:** `/api/cron/*` verificado por `Authorization: Bearer ${CRON_SECRET}`

**Cache de subscription:** Cookie HMAC-signed (`asc-sub-v1`) com TTL de 5 minutos. Evita query ao banco em ~95% das requests de rotas do app. Invalidado automaticamente ao expirar ou adulteração.

**Admin bypass:** `ADMIN_BYPASS_EMAILS` env var — emails separados por vírgula que saltam a verificação de subscription.

---

## 11. HOOKS

### `src/hooks/use-realtime-profile.ts`
`useRealtimeProfile(userId, initial)` — assina `postgres_changes` em `profiles` via Supabase Realtime.
- Atualiza XP, level, streak ao vivo sem router.refresh()
- Dispara animação de floating toast "+N XP" quando xp_total aumenta
- Dispara `leveledUp = true` (100ms) quando level sobe
- Returns: `{ profile, xpBump, leveledUp }`

(Existe também `AppShellRealtimeProvider` e `useRealtimeContext` — context que expõe o realtime profile para toda a árvore do AppShell.)

---

## 12. MIGRATIONS SQL

| Arquivo | Conteúdo |
|---|---|
| `002_health_tables.sql` | Tabelas water_logs, sleep_logs |
| `003-mood-logs.sql` | Tabela mood_logs |
| `004-rls-performance.sql` | Índices de performance para RLS e queries frequentes |
| `005-new-achievements.sql` | Achievements adicionais (habit milestones, workout, finance) |
| `006-referral-system.sql` | Sistema de referral (referral_code, referral_count, referred_by em profiles) |
| `007-storage-buckets.sql` | Configuração de buckets Supabase Storage para avatares |
| `008-backend-fixes.sql` | Correções diversas de backend (constraints, defaults) |
| `008-batch-process-streaks.sql` | RPC `batch_process_streaks(p_cutoff_date)` — processa streaks de todos os usuários em 1 query SQL |
| `008-grant-xp-atomic-rpc.sql` | RPC `grant_xp_atomic(p_user_id, p_amount, p_reason, p_source_type, p_source_id)` — XP em 1 round-trip atômico com FOR UPDATE lock |
| `009-gamification-v2.sql` | Login streak, Daily Loot, Guilds, Seasons, Cosmetics, Recovery Mode, Finance Streak, League system. RPCs: `increment_weekly_stats`, `reset_weekly_league_xp`, `maybe_grant_perfect_day` |
| `010-admin-bootstrap.sql` | Setup inicial: insere primeiro admin na tabela admin_roles |
| `010-admin-platform.sql` | Tabelas admin: admin_roles, audit_logs, feature_flags, app_banners, banner_dismissals, broadcast_campaigns, user_admin_notes, user_suspensions. Campos extras em profiles (is_suspended, suspended_until, suspension_reason). |
| `20260527_health_tracking.sql` | Health tracking (mood, water, sleep expandido), recovery score |

### RPCs PostgreSQL Criadas
- `grant_xp_atomic(p_user_id, p_amount, p_reason, p_source_type, p_source_id)` — atômica com FOR UPDATE
- `batch_process_streaks(p_cutoff_date)` — processa todos os streaks em 1 query
- `increment_weekly_stats(p_user_id, p_xp)` — incrementa league_xp_this_week + xp_all_time + season_xp
- `reset_weekly_league_xp()` — reseta league XP de profiles e guilds toda segunda
- `maybe_grant_perfect_day(p_user_id)` — verifica + concede Dia Perfeito atomicamente
- `snapshot_daily_metrics(p_date)` — snapshot de métricas para analytics

---

## 13. FEATURES JÁ IMPLEMENTADAS

### Core App
- [x] Autenticação completa (login, signup, logout, refresh session)
- [x] Onboarding com goal setup e 100 XP de bônus
- [x] Proxy (middleware) com proteção de rotas e cache de subscription
- [x] Grace period de 7 dias para contas novas
- [x] Trial de 7 dias com emails automáticos (D1, D5, D6)

### Gamificação
- [x] Sistema de XP com 14 tipos de fonte
- [x] 8 levels com progressão
- [x] Prestige 0-10 (10 títulos)
- [x] Streak system (hábito OR treino OR tarefa)
- [x] Streak Freeze automático e manual
- [x] Recovery Mode (Modo Silêncio) — 1x/mês
- [x] Achievements com XP e push notification
- [x] Perfect Day (+200 XP + loot box)
- [x] Login streak diário (ciclo 7 dias, 20→300 XP)
- [x] Loot Box (3 raridades + cosmético lendário)
- [x] XP Shop (streak_freeze, loot_box, xp_boost_2x, streak_recovery)
- [x] Leagues/Divisões semanais (5 divisões)
- [x] Ranking semanal top 100
- [x] Season Pass com tiers free e premium
- [x] Guilds (criar/entrar/sair, XP da guild)
- [x] Cosméticos (títulos, frames) via prestige/season/loot
- [x] Realtime XP/level/streak via Supabase Realtime

### Fitness
- [x] Hábitos CRUD completo (max 10 ativos)
- [x] Log de hábitos com XP (50 XP/conclusão)
- [x] Reminder time por hábito
- [x] Heatmap, year heatmap, correlação, time-of-day heatmap
- [x] Treinos com sets/reps/peso
- [x] Biblioteca de exercícios (global + pessoal)
- [x] Personal Records
- [x] Volume tracking e gráficos

### Produtividade
- [x] Tarefas com Kanban (todo/doing/done/archived)
- [x] Matriz Eisenhower (urgent × important)
- [x] Listas/projetos de tarefas
- [x] Subtarefas
- [x] Due dates com reminder
- [x] Drag & drop com @dnd-kit

### Finanças
- [x] Contas bancárias/cartões
- [x] Transações com parcelamento (1-60x)
- [x] Categorias globais + pessoais
- [x] Metas financeiras
- [x] Finance streak (dias consecutivos registrando)
- [x] Gráficos: gastos por categoria, fluxo de caixa, tendências

### Saúde
- [x] Hidratação (water_logs, meta 2L)
- [x] Sono (sleep_logs, meta 8h)
- [x] Humor/Energia/Stress (mood_logs, 1-5)
- [x] Recovery score

### Coach IA
- [x] Chat com Anthropic (`claude-sonnet-4-6`)
- [x] Prompt caching (sistema estático cacheado, contexto dinâmico não cacheado)
- [x] Contexto completo do usuário (14 fontes de dados)
- [x] Rate limit 50 mensagens/dia
- [x] Histórico por conversa
- [x] Auto-título da conversa

### Calendário
- [x] Visualização de eventos
- [x] Integração Google Calendar (estrutura, OAuth)

### Metas
- [x] Metas pessoais com progresso e prazo
- [x] Link com hábito

### Notificações
- [x] Web Push (VAPID)
- [x] Notificações in-app (tabela notifications)
- [x] Push para conquistas, XP milestones, streak alerts, perfect day, login reward
- [x] Limpeza automática de subscriptions expiradas

### Admin Platform
- [x] 5 níveis de role (super_admin, admin, moderator, support, analyst)
- [x] Audit log de todas as ações
- [x] Feature flags com rollout gradual e segmentação
- [x] Banners in-app com targeting por plano/level
- [x] Broadcasts de push para segmentos
- [x] Gestão de usuários (suspend, extend trial, grant XP, change plan, reset streak)
- [x] Notas admin sobre usuários
- [x] Analytics com snapshot diário
- [x] Exportação CSV de usuários

### Infraestrutura
- [x] Cron jobs otimizados (batch, sem N+1)
- [x] RPC atômicos para operações críticas
- [x] Email via Resend (welcome, trial, weekly digest)
- [x] PWA (manifest, push)
- [x] Pull-to-refresh mobile
- [x] View Transitions API
- [x] OLED true black para AMOLED
- [x] Safe areas iOS (notch/home indicator)

---

## 14. CONVENÇÕES DE CÓDIGO

### Arquitetura de Componentes
```typescript
// Server Component (padrão) — busca dados, sem 'use client'
export default async function MinhaPage() {
  const supabase = await createClient()
  const { data } = await supabase.from('table').select('...')
  return <ComponenteClient data={data} />
}

// Client Component — apenas para estado/eventos/hooks
'use client'
export function ComponenteClient({ data }: { data: Tipo[] }) { ... }
```

### Imports
```typescript
import { createClient } from '@/lib/supabase/server'  // server
import { createClient } from '@/lib/supabase/client'  // client
import { createServiceClient } from '@/lib/supabase/server'  // admin/cron
import { grantXP } from '@/lib/xp-server'  // server-only
import { XP_REWARDS, calculateLevel } from '@/lib/xp'  // client+server
import { cn } from '@/lib/utils'
```

### Como Criar API Route
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { grantXP } from '@/lib/xp-server'

const bodySchema = z.object({ /* campos */ })

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const parsed = bodySchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input' }, { status: 400 })

  // ... lógica
  const xpResult = await grantXP(user.id, XP_REWARDS.ALGUMA_ACAO, 'Razão', 'sourceType', optionalId)
  
  return NextResponse.json({ success: true, xpEarned: xpResult.xpEarned })
}
```

### Como Criar Cron Job
```typescript
import { isCronAuthorized, cronUnauthorized } from '@/lib/cron-auth'
import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export const maxDuration = 60  // segundos

export async function GET() {
  if (!await isCronAuthorized()) return cronUnauthorized()
  
  const supabase = createServiceClient()
  // ... processamento batch (NUNCA N+1)
  return NextResponse.json({ ok: true, processed: N })
}
```

### Como Conceder XP
```typescript
// Server-side apenas:
import { grantXP } from '@/lib/xp-server'
import { XP_REWARDS } from '@/lib/xp'

const result = await grantXP(
  userId,
  XP_REWARDS.HABIT_COMPLETED, // ou valor numérico direto
  'Hábito: Nome do Hábito',   // reason legível
  'habit',                     // sourceType
  habitId                      // sourceId (opcional, para dedup)
)
// result: { xpEarned, xpTotalAfter, newLevel, leveledUp, previousLevel, achievementsUnlocked, newPrestige? }
```

### Como Desbloquear Achievement
```typescript
import { tryUnlockAchievement } from '@/lib/xp-server'

const unlocked = await tryUnlockAchievement(userId, 'slug_da_conquista')
// Idempotente: retorna false se já foi desbloqueada
// Se unlocked=true: concedeu XP, criou notificação, enviou push
```

### Como Verificar Acesso Admin
```typescript
// Em Server Component ou API Route:
import { createClient } from '@/lib/supabase/server'
import { getAdminSession, hasMinRole, auditLog } from '@/lib/admin'
import { redirect } from 'next/navigation'

const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
const session = await getAdminSession(user)
if (!session) redirect('/dashboard')  // ou return 403
if (!hasMinRole(session, 'admin')) return NextResponse.json({ error: '...' }, { status: 403 })

// Logar ação:
await auditLog({ adminId: session.userId, adminRole: session.role, action: 'user.action', targetType: 'user', targetId: userId, payload: { ... } })
```

### Como Criar Notificação In-app
```typescript
import { createServiceClient } from '@/lib/supabase/server'

const supabase = createServiceClient()
await supabase.from('notifications').insert({
  user_id:       userId,
  type:          'achievement',  // ou outro NotificationType
  title:         '🏆 Título',
  body:          'Corpo da notificação',
  action_url:    '/conquistas',
  scheduled_for: new Date().toISOString(),
  sent_at:       new Date().toISOString(),
})
```

### Convenções TypeScript
- `snake_case` para campos do banco de dados
- `camelCase` para props de componentes e variáveis JS
- Sem `any` — use `unknown` + narrowing
- Zod para validação de inputs de API
- Sem `// @ts-ignore` ou `as any`
- Comentários em português descrevendo regras de negócio
- Funções públicas com tipos explícitos de retorno

### Otimização de Queries
```typescript
// CORRETO — queries em paralelo
const [result1, result2, result3] = await Promise.all([
  supabase.from('table1').select('...'),
  supabase.from('table2').select('...'),
  supabase.from('table3').select('...'),
])

// ERRADO — queries sequenciais desnecessárias
const r1 = await supabase.from('table1').select('...')
const r2 = await supabase.from('table2').select('...')

// Nunca select('*') em tabelas grandes — selecione apenas os campos necessários
// Nunca loop de queries — use .in() para batch
```

---

## 15. VARIÁVEIS DE AMBIENTE NECESSÁRIAS

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Anthropic
ANTHROPIC_API_KEY=

# Resend
RESEND_API_KEY=

# Web Push (VAPID)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=

# Cron Protection
CRON_SECRET=  # usado no proxy e nos cron jobs

# App
NEXT_PUBLIC_APP_URL=https://ascendia-app1.vercel.app

# Admin bypass (emails separados por vírgula)
ADMIN_BYPASS_EMAILS=admin@email.com
```

---

## 16. GAPS E OPORTUNIDADES (PENDENTE OU INCOMPLETO)

### Funcionalidades Parcialmente Implementadas
1. **XP Boost 2x** — item da shop implementado (`xp_boost_2x` comprado com 800 XP) mas a aplicação real do boost durante transações de XP não está verificada. Tabela de boosts ativos possivelmente ausente.

2. **Streak Recovery da Shop** — item existe (1200 XP, restaura streak) mas a lógica de onde estava o streak antes da quebra pode não estar implementada (seria necessário tabela de streak history).

3. **Google Calendar OAuth** — estrutura de `calendar_integrations` existe, cron `calendar-sync` existe, mas o fluxo OAuth completo (redirect, callback, refresh token) pode estar incompleto.

4. **Calendário** — página existe mas integração real com o Google Calendar pode não estar funcional.

5. **Weekly Challenges** — cron existe mas pode gerar desafios sem tela de visualização completa.

### Tabelas Referenciadas mas Possivelmente Ausentes
- `user_reports` — referenciada no admin (pendingReports), mas migration não vista
- `metrics_daily` — populada por RPC, mas a estrutura não foi vista diretamente
- `referral_codes` ou lógica de referral — existe `/api/referral` mas o schema completo não foi verificado

### UX/Features a Considerar
- Social feed entre amigos (feature flag `social_feed` presente, desabilitada)
- Importação de extrato bancário (feature flag `finance_import`, desabilitada)
- Sugestão de treino por IA (feature flag `workout_ai`, desabilitada)
- Coach v3 com contexto expandido (feature flag `coach_v3`, desabilitada)
- Desafios em grupo v2 (feature flag `challenges_v2`, desabilitada)

### Problemas Técnicos a Monitorar
- **`daily_loot` UNIQUE por (user_id, date)** — se usuário ganhar loot de perfect_day E login_day7 no mesmo dia, apenas 1 é criada. Segunda chamada retorna o código de erro 23505 mas `createDailyLoot` trata como sucesso (`!error || error.code === '23505'`).

- **Cron `perfect-day-reminder`** — ainda faz query individual por usuário (loop com queries dentro), diferente dos outros crons que já foram batchizados. Com 1000+ usuários pode ter timeout.

- **Stripe vs Mercado Pago** — o CLAUDE.md original menciona Mercado Pago, mas o código usa Stripe (`src/lib/stripe.ts`, `src/app/api/webhook/stripe/route.ts`). Migração completa para Stripe.

- **`src/proxy.ts`** — Next.js 16 renomeou middleware.ts para proxy.ts. O `prebuild` script em package.json deleta `src/middleware.ts` automaticamente, portanto o arquivo deve ser mantido como `src/proxy.ts`.

- **`xp_all_time` vs `xp_total`** — ao conceder XP via `grantXP`, o `xp_all_time` é atualizado pelo `increment_weekly_stats` (fire-and-forget). Se esse RPC falhar, `xp_all_time` pode ficar desatualizado. Prestige usa `xp_all_time`.
