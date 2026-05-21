# CLAUDE.md — Contexto do Projeto FitQuest

> Este arquivo serve como referência para qualquer LLM (Claude, GPT, etc.) que for trabalhar no código do FitQuest. Mantenha atualizado.

---

## 🎯 O Que É

**FitQuest** é um SaaS brasileiro de **Life OS gamificado** que unifica:
- 💪 **Fitness** — hábitos, treinos, sets/reps, PRs
- ✅ **Produtividade** — tarefas Kanban + Matriz Eisenhower
- 💰 **Finanças** — transações, parcelas, metas financeiras
- 🤖 **Coach IA** — assistente Anthropic contextualizado em todos os domínios

Tudo unificado pelo sistema de **XP/Level/Streak** — cada ação concede XP.

**Público:** brasileiros 22-38 anos, 90% mobile, vindos de Meta Ads.

---

## 🏗️ Stack Técnica

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 15 (App Router, Server Components) |
| Linguagem | TypeScript strict |
| Estilo | Tailwind CSS + custom design system |
| Banco | Supabase (PostgreSQL + RLS) |
| Auth | Supabase Auth (email/password) |
| Pagamento | Mercado Pago (Subscriptions + Checkout Pro) |
| IA | Anthropic API (claude-sonnet-4-20250514) |
| Hosting | Vercel (Edge runtime + Cron) |
| Realtime | Supabase Realtime (futuro: live updates) |

---

## 🗄️ Schema do Banco

### Tabelas de Identidade & Gamificação
- `profiles` — dados do usuário + XP/level/streak + subscription
- `xp_transactions` — ledger imutável de XP (toda concessão registrada)
- `achievements` — catálogo de conquistas
- `user_achievements` — conquistas desbloqueadas por usuário

### Tabelas de Fitness
- `habits` — definição dos hábitos (treinar, correr, etc)
- `habit_logs` — registros diários (1 por hábito por dia)
- `workouts` — sessões de treino
- `exercises` — biblioteca de exercícios
- `workout_sets` — séries individuais
- `goals` — metas pessoais

### Tabelas de Produtividade
- `task_lists` — listas/projetos (Trabalho, Casa, etc)
- `tasks` — tarefas individuais (com Kanban status + Eisenhower flags)
- `subtasks` — checklist dentro da tarefa

### Tabelas de Finanças
- `finance_accounts` — contas bancárias/cartões
- `finance_categories` — categorias de gastos/receitas
- `transactions` — transações financeiras
- `finance_goals` — metas financeiras

### Tabelas de Calendário & Notificações
- `calendar_integrations` — OAuth com Google/etc
- `calendar_events` — eventos importados + internos
- `notifications` — fila de notificações agendadas
- `push_subscriptions` — devices para Web Push

### Tabelas de IA
- `ai_messages` — histórico de chat com o Coach

---

## 🛡️ Segurança

**Row Level Security está habilitado em TODAS as tabelas com dados de usuário.** A policy padrão é:

```sql
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid())
```

Exceção: `exercises` permite SELECT de exercícios globais (`is_global = true`).

**Service role key** só é usada em:
- API routes server-side
- Cron jobs
- Webhooks

**Nunca** prefixe com `NEXT_PUBLIC_` algo que seja sensível.

---

## 🎮 Sistema de XP — Regras de Negócio

Toda concessão de XP passa por `lib/xp.ts → grantXP(userId, amount, reason, sourceType, sourceId)`. Essa função:

1. Insere registro em `xp_transactions`
2. Atualiza `profiles.xp_total`
3. Recalcula `profiles.level`
4. Verifica conquistas desbloqueadas
5. Retorna `{ xpEarned, newLevel, achievementsUnlocked }`

**Tabela de XP por ação:** ver `src/lib/xp.ts` (constantes no topo).

**Levels:**
| Level | Faixa XP | Título |
|---|---|---|
| 1 | 0–500 | Iniciante |
| 2 | 500–1500 | Dedicado |
| 3 | 1500–3500 | Consistente |
| 4 | 3500–7000 | Atleta |
| 5 | 7000–12000 | Guerreiro |
| 6 | 12000–20000 | Elite |
| 7 | 20000–35000 | Lendário |
| 8 | 35000+ | FitQuest Master |

---

## 🔥 Sistema de Streak

- Calculado **server-side** via cron diário (`/api/cron/streaks`)
- Roda às **03:00 UTC** = **00:00 horário Brasília**
- Se usuário NÃO logou nenhum hábito no dia anterior → reseta `streak_current = 0`
- Se logou ao menos 1 → incrementa
- `streak_longest` é atualizado se `streak_current > streak_longest`

---

## 💳 Subscription States

| `subscription_status` | Significado |
|---|---|
| `trial` | 7 dias grátis (default ao criar conta) |
| `active` | Plano vigente, acesso total |
| `cancelled` | Cancelou mas ainda tem acesso até `subscription_end` |
| `expired` | Sem acesso, vê só `/planos` |
| `lifetime` | Pagamento único — acesso vitalício |

| `subscription_plan` | Preço |
|---|---|
| `monthly` | R$ 37,00/mês |
| `annual` | R$ 306,60/ano (R$ 25,55/mês) |
| `lifetime` | R$ 597,00 único |

Middleware (`src/middleware.ts`) verifica em CADA request que entra em `/(app)/*`.

---

## 🎨 Identidade Visual

**Tema dark "Cyber Electric":**
- Background: `#050914`
- Card background: `#0D1829`
- Borda card: gradient `rgba(124,58,237,0.3) → rgba(255,77,0,0.3)`
- Primária laranja: `#FF4D00`
- Secundária roxo: `#7C3AED`
- Sucesso verde: `#00FF88`
- XP dourado: `#F5C842`
- Texto: `#FFFFFF` / `#8899BB` secundário

**Fontes:**
- Display: Bebas Neue (XP, números, stats)
- Interface: DM Sans (corpo, botões)

---

## 📱 Navegação

**Mobile (bottom nav):**
🏠 Dashboard | ✓ Tarefas | 💪 Fitness | 💰 Finanças | 🤖 Coach

**Desktop (sidebar):**
Sidebar 240px à esquerda, com sub-itens quando aplicável.

---

## ⚙️ Convenções de Código

1. **Server Components por padrão** — só use `"use client"` quando precisar de estado/eventos.
2. **Imports absolutos** com `@/` apontando para `src/`.
3. **Comentários em português** descrevendo regras de negócio.
4. **Zod** para validação de inputs de API.
5. **Error states + Empty states + Loading states** em todo componente.
6. **Server Actions** preferidas para mutações simples (Next 15+).
7. **No `any`** — se precisar, use `unknown` + narrowing.

---

## 🔄 Fluxo de Dados — Exemplo: Marcar Hábito

```
[Componente Client]
  ↓ click no botão "Registrar"
[Server Action: logHabit(habitId)]
  ↓ valida com Zod
[supabase.insert habit_logs]
  ↓ se sucesso
[grantXP(userId, 50, "Hábito: " + habitName)]
  ↓ ledger + level check + achievements
[revalidatePath("/dashboard")]
  ↓
[UI atualiza com animação de +50 XP]
```

---

## 🚨 Coisas Críticas para Lembrar

- ❌ **NUNCA** rode `xp` ou `streak` no client — sempre server
- ❌ **NUNCA** confie em `is_paid` enviado do client
- ❌ **NUNCA** use `select('*')` em tabelas grandes
- ✅ **SEMPRE** valide `subscription_status` no middleware
- ✅ **SEMPRE** use `Promise.all()` para queries paralelas
- ✅ **SEMPRE** registre erros via `console.error` (Vercel captura)
- ✅ **SEMPRE** retorne tipos explícitos em funções públicas
