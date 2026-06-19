# CLAUDE.md — Contexto do Projeto Ascendia

> Este arquivo serve como referência para qualquer LLM (Claude, GPT, etc.) que for trabalhar no código do Ascendia. Mantenha atualizado.

---

## 🎯 O Que É

**Ascendia** é um SaaS brasileiro de **Life OS gamificado** que unifica:
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
| Framework | Next.js 16 (App Router, Server Components) |
| Linguagem | TypeScript strict |
| Estilo | Tailwind CSS + custom design system |
| Banco | Supabase (PostgreSQL + RLS) |
| Auth | Supabase Auth (email/password) |
| Pagamento | Stripe (Subscriptions + Checkout) |
| IA | Anthropic API (claude-opus-4-8) |
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

Toda concessão de XP passa por `lib/xp-server.ts → grantXP(userId, amount, reason, sourceType, sourceId)`. Essa função:

1. Chama a RPC PostgreSQL `grant_xp_atomic` (migration 007) — 1 round trip atômico
2. Incrementa `profiles.xp_total` com delta (sem race condition)
3. Recalcula `profiles.level` e atualiza se necessário
4. Insere no ledger `xp_transactions`
5. Retorna `{ xpEarned, newLevel, leveledUp, achievementsUnlocked }`

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
| 8 | 35000+ | Ascendia Master |

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

Proxy (`src/proxy.ts`) verifica acesso em rotas `/(app)/*`. Subscription status é cacheado em cookie HMAC-signed por 5 min — reduz queries ao banco ~95%. (Next.js 16 renomeou middleware → proxy)

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
6. **Server Actions** preferidas para mutações simples (Next 16+).
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

## 🧠 Skills Disponíveis (Modos de Trabalho)

O projeto tem 3 skills instaladas em `.claude/skills/`. Use a ferramenta `Skill` para ativá-las.

### `/arquiteto` — Análise Arquitetural e Escalabilidade
Use para: "o que você acha do projeto", "vai escalar?", "onde está o gargalo", "o que falta para 10k usuários", "como organizar melhor".
CTO + Arquiteto + Product Strategist. Lê TUDO antes de opinar. Cada proposta tem arquivo, linha e impacto real.

### `/banco` — Banco de Dados e PostgreSQL
Use para: queries, índices, RLS, migrations, N+1, "tá lento no banco", "RLS não funciona", "dados de outro usuário aparece".
DBA sênior PostgreSQL + Supabase. Mapeia TODAS as queries, entrega SQL 100% pronto para executar.

### `/deploy` — Deploy e Infraestrutura
Use para: Vercel, produção, .env, "colocar no ar", "build falhou no Vercel", domínio, DNS, webhook, cron, headers de segurança.
DevOps 12 anos. Entrega comandos exatos, configs prontas e plano de rollback.

### `/debug` — Corrigir Erros (95% na 1ª tentativa)
Use para: erros, stack trace, tela branca, "não funciona", "deu erro", hydration error, TypeScript error, redirect infinito.
Vai direto à causa raiz. Especialidade em auth, Next.js App Router e Supabase.

### `/performance` — Otimização de Performance
Use para: Lighthouse, Core Web Vitals, LCP/INP/CLS, bundle size, re-renders, "tá lento", "carrega devagar".
Mobile-first. Foca em impacto real e mensurável.

### `/refactor` — Refatoração de Código
Use para: "refatora", "limpa o código", "componente gigante", "código duplicado", "dívida técnica", "tá bagunçado".
Nunca perde funcionalidade. Nunca entrega parcial. Nunca refatora sem ler o arquivo completo.

### `/auditoria` — Revisão Completa do Projeto
Use para: "revisa tudo", "audita o projeto", "o que está errado", "tem bug crítico?", "o projeto está seguro?", pré-lançamento.
Arquiteto + DBA + segurança + qualidade. Entrega roadmap priorizado.

### `/feature` — Criar Feature Nova (planejamento + código)
Use para: criar algo que não existe — nova página, funcionalidade, fluxo, integração.
Não começa a codar na 1ª mensagem — entende → planeja → executa. Código 100% completo.

### `/prompt-mestre` — Criar e Otimizar Prompts
Use para: "cria um prompt para", "melhora esse prompt", system prompt, prompts de imagem, "como peço para a IA fazer X".
Domina Claude, GPT-4o, Gemini, Midjourney, DALL-E, Flux.

---

### `/ascendia-architect` — Criar Features
Use para: criar página, componente, API route, tabela no banco, integração, qualquer implementação nova.
Palavras-chave: "cria", "implementa", "adiciona", "faz", "monta", "quero", "preciso de".
**Lê obrigatoriamente antes de codar:** CLAUDE.md → types.ts → xp.ts → middleware.ts → globals.css → tailwind.config.ts

Contém:
- Schema completo de 20+ tabelas com campos detalhados
- Tabela XP completa (14 ações com valores e condições)
- 8 levels com faixas de XP e títulos
- Design system completo (cores, classes, animações, fontes)
- Padrões de código prontos (API Route, Page, Client Component, Modal, SQL Migration)
- Workflow de 6 etapas para implementação: Análise → Schema → API → Componentes → Página → Integração
- Navegação completa (sidebar + bottom nav + todas as rotas)
- 18 instruções negativas invioláveis

### `/ascendia-doctor` — Diagnosticar e Corrigir
Use para: erro, bug, tela branca, dados não aparecendo, build quebrando, warning TypeScript, "não funciona", "deu erro", health check, performance, segurança, validação pré-deploy.
**Nunca tente corrigir sem usar esta skill — diagnóstico primeiro.**

Contém:
- Protocolo de 5 passos: Evidências → Classificação → Diagnóstico → Correção → Verificação
- 10 classes de problema (BUILD_TS, BUILD_NEXT, RUNTIME_SERVER, RUNTIME_CLIENT, DATA_EMPTY, DATA_WRONG, AUTH_FLOW, STYLE_BREAK, PERF, DEPLOY)
- Flowcharts de diagnóstico para auth, dados, performance
- Health Check completo v2.0 (10 categorias, 65+ verificações)
- 8 erros conhecidos do Ascendia com soluções prontas
- Formato padronizado de relatório de correção
- 12 instruções negativas

### `/ascendia-shipper` — Deploy e Infraestrutura
Use para: setup inicial, npm run dev, deploy, Vercel, variáveis de ambiente, domínio, webhook, cron, Mercado Pago, migração de banco, lançamento.
**Esta skill cuida de TUDO entre "tenho código" e "usuários pagando".**

Contém:
- Fase 1: Setup do zero (7 passos detalhados)
- Fase 2: Troubleshooting de 15 problemas comuns com soluções
- Fase 3: Pré-deploy checklist completo (6 seções, 30+ verificações)
- Fase 4: Deploy no Vercel passo a passo (domínio, env vars, webhook MP)
- Fase 5: Smoke test de produção (8 seções, 30+ checks)
- Fase 6: Otimizações pré-launch (SEO, performance targets, monitoramento)
- Targets: Lighthouse Mobile > 80, LCP < 2.5s, Bundle < 200KB
- 12 instruções negativas de deploy

---

## 🚨 Coisas Críticas para Lembrar

- ❌ **NUNCA** rode `xp` ou `streak` no client — sempre server
- ❌ **NUNCA** confie em `is_paid` enviado do client
- ❌ **NUNCA** use `select('*')` em tabelas grandes
- ✅ **SEMPRE** valide `subscription_status` no middleware
- ✅ **SEMPRE** use `Promise.all()` para queries paralelas
- ✅ **SEMPRE** registre erros via `console.error` (Vercel captura)
- ✅ **SEMPRE** retorne tipos explícitos em funções públicas
