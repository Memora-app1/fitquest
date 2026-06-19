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

---

# 📚 Base de Conhecimento — Boas Práticas 2026

> Pesquisa web consolidada (jun/2026) das melhores práticas atuais aplicadas à stack do Ascendia. Use como referência ao implementar, revisar ou otimizar. Versão expandida no Obsidian: `Ascendia/📚 Base de Conhecimento Dev.md`.

## ⚛️ Next.js 16 + React Server Components

- **Server Components por padrão.** Só marque `"use client"` quando precisar de `useState`/`useEffect`/event handlers/APIs do browser. Erro comum: client component grande demais — empurra ~70% de JS extra pro cliente.
- **Mantenha a fronteira `"use client"` na folha da árvore.** Busque dados no server e passe como props pro client component (não suba o `"use client"` pra layouts inteiros).
- **`params` e `searchParams` são `Promise`** no Next 15/16 — sempre `await`. Habilita streaming e fetch paralelo.
- **Turbopack é o bundler padrão** no 16. Dados em paralelo com `Promise.all`, nunca em waterfall.
- **Streaming com `<Suspense>`** para partes lentas da página — o resto renderiza na hora.
- Checklist oficial de produção: cache, imagens, fontes, bundle. Rodar antes de cada launch.
- Fontes: [Next.js production checklist](https://nextjs.org/docs/app/guides/production-checklist) · [Server/Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components)

## 🗄️ Supabase RLS — Performance & Segurança

- **Indexe TODA coluna usada em `USING`/`WITH CHECK`.** É o ganho #1 de performance em RLS. (Já fizemos isso nas migrations 013-015.)
- **Envolva chamadas de função em `select`:** `(select auth.uid())` em vez de `auth.uid()` direto — o Postgres avalia 1x por query em vez de 1x por linha (`auth_rls_initplan`). Feito nas 36 policies da migration 014.
- **Sempre adicione `to authenticated`** nas policies — não confie só em `auth.uid()` pra barrar o role `anon`.
- **Funções `SECURITY DEFINER`** que o cliente não deve chamar: `REVOKE EXECUTE FROM public, anon, authenticated` + `GRANT TO service_role`. Lição da brecha do `grant_xp_atomic` (migrations 013→015). EXECUTE no role `PUBLIC` é herdado por anon/authenticated.
- **Evite subqueries correlacionadas por linha** dentro de policies — prefira join ou `security definer function` indexada.
- **Valide com `EXPLAIN ANALYZE`** com e sem RLS pra medir o custo real da policy.
- Fontes: [Supabase RLS performance](https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv) · [MakerKit RLS patterns](https://makerkit.dev/blog/tutorials/supabase-rls-best-practices)

## 📊 Core Web Vitals (mobile-first — 90% do público)

| Métrica | Meta | Foco |
|---|---|---|
| **LCP** (carregamento) | ≤ 2,5s | maior fix de impacto |
| **INP** (responsividade) | ≤ 200ms | métrica mais reprovada em 2026 |
| **CLS** (estabilidade) | ≤ 0,1 | reservar espaço |

- **LCP:** preload da imagem LCP com `fetchpriority="high"`, CSS crítico inline, preload de fontes com `display: swap`, formatos WebP/AVIF, SSR. Usar `next/image` com `priority` no above-the-fold.
- **INP:** quebrar tarefas longas de JS, `useTransition`/`startTransition` para updates não urgentes, debounce em handlers pesados, evitar re-renders (memo/useCallback). É hoje sinal de ranking igual a LCP.
- **CLS:** `width`/`height` explícitos em toda imagem/vídeo/iframe, `font-display: swap`, espaço reservado pra conteúdo dinâmico (skeletons com mesma altura).
- **Sempre teste com throttling de rede/CPU** — mobile real é muito mais lento. Métrica oficial = p75 do campo (CrUX), não lab.
- Só ~48% dos sites mobile passam nos 3 CWV — passar já é vantagem competitiva.
- Fontes: [Core Web Vitals 2026](https://www.corewebvitals.io/core-web-vitals) · [digitalapplied CWV 2026](https://www.digitalapplied.com/blog/core-web-vitals-2026-inp-lcp-cls-optimization-guide)

## 💳 Stripe — Subscriptions & Webhooks

- **Webhook é a fonte da verdade**, NUNCA a página de sucesso do front. Sincronize subscription no banco via webhook.
- **Idempotência obrigatória:** guarde cada `event.id` numa tabela com `UNIQUE` e dê short-circuit se já processado (evita dupla cobrança/email em retries). Use idempotency keys em toda escrita na API Stripe.
- **Verifique a assinatura** do webhook, responda **200 rápido**; se o processamento for lento, enfileire e processe async.
- **Eventos fora de ordem:** cheque o `created` timestamp.
- Stack Next.js + Supabase + Stripe é o padrão de SaaS em 2026 — Checkout Session em Route Handler, sync via webhook.
- ⚠️ Ao integrar: apagar env vars `MERCADO_PAGO_*` e usar chaves live + webhook configurado.
- Fontes: [Stripe idempotent requests](https://docs.stripe.com/api/idempotent_requests) · [Stripe webhooks 2026](https://www.hooklistener.com/learn/stripe-webhooks-implementation)

## 📱 PWA (app instalável + offline)

- **3 pilares:** `manifest.json` (name, icons 192+512, start_url, display), service worker (stale-while-revalidate p/ HTML, cache-first p/ assets hasheados) e página offline de fallback.
- Service worker **na raiz** (o scope é definido pela localização do arquivo). HTTPS obrigatório.
- **Install prompt:** capture `beforeinstallprompt` e dispare manualmente no momento certo (ex: depois do 1º hábito logado).
- iOS/Safari tem limitações (push restrito) — testar separado. Meta de load < 3s.
- Fontes: [PWA 2026 guide](https://www.iloveblogs.blog/post/progressive-web-apps-complete-guide-2026) · [PWA iOS limits](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide)

## 🎮 Gamificação & Retenção (o coração do Ascendia)

- **Streak + milestone juntos** = +40-60% DAU vs. só um deles. Streaks sozinhos = +22% engajamento diário.
- **Loss aversion** (medo de perder o streak) = +35% DAU vs. só pontos. Usuário com streak 7+ dias = 2,3x mais propenso a voltar diariamente (dado Duolingo).
- **"Meaningful play":** cada ação reforça uma meta do usuário, não só acumula pontos. Combine recompensa extrínseca (XP) com motivador intrínseco (sensação de domínio/progresso).
- **Hiper-personalização > blast genérico:** desafios contextuais por domínio (fitness/finanças/tarefas) batem notificação genérica.
- Aplicar: lembrete de streak em risco, celebração de milestone, "freeze"/proteção de streak como recompensa.
- Fontes: [Streaks gamification (Plotline)](https://www.plotline.so/blog/streaks-for-gamification-in-mobile-apps) · [Duolingo gamification](https://www.strivecloud.io/blog/gamification-examples-boost-user-retention-duolingo)

## 💰 Conversão — Landing & Pricing (Meta Ads → trial → pago)

- **3 tiers** é o ponto ótimo (98% dos SaaS usam). Temos monthly/annual/lifetime — ok.
- **Default no anual** com equivalente mensal exibido ("R$ 25,55/mês") — planos anuais geram +25-30% de receita e churnam menos. Já fazemos R$ 306,60/ano = R$ 25,55/mês.
- **Plano "herói"** destacado combate paralisia de decisão.
- **Prova social** (depoimentos +34% performance; notificações de social proof até +98% conversão). Considerar contador de usuários/conquistas reais.
- Benchmark: landing SaaS mediana ~3,8%; top performers 10-15%.
- Demos interativos convertem 2x mais que screenshot estático.
- Evitar: homepage entulhada de features, tabela de preço que esconde custo real, CTA único forçado.
- Fontes: [SaaS pricing 2026](https://fungies.io/saas-pricing-page-best-practices-2026/) · [SaaS CRO 2026](https://www.thethunderclap.com/blog/saas-cro-best-practices-for-conversions)

## ♿ Acessibilidade (WCAG 2.2 — quick wins)

- **Touch targets ≥ 24×24px CSS** (ideal 44×44 mobile) ou espaçamento suficiente. (Já aumentamos alvos em sessão anterior.)
- **Foco de teclado sempre visível** — não escondido atrás de header/sticky/modal.
- **`aria-label` em botões icon-only** (X de modais, FAB, nav). Já cobrimos boa parte.
- **Não force re-digitar** dado que o device pode autofill (`autocomplete`, `inputMode` correto). Já aplicamos `inputMode` nos forms.
- **Ajuda/contato em posição consistente** entre telas.
- Meta legal: WCAG 2.1 AA (deadline abr/2026) + fixes fáceis do 2.2.
- Fontes: [WCAG 2.2 checklist 2026](https://line25.com/articles/web-accessibility-checklist-2026/) · [WCAG 2.2 guide](https://www.allaccessible.org/blog/wcag-22-complete-guide-2025)

## 📲 Criação de Apps Mobile (caminho futuro do Ascendia)

### Qual abordagem escolher
- **PWA (onde estamos):** 1 codebase, mais barato/rápido, instalável, offline via service worker. Limite: hardware/push restrito no iOS. Browsers modernos já expõem muitas APIs antes nativas — PWA virou alternativa real, não só "gambiarra". **Melhor 1º passo pro Ascendia** (já é web Next.js).
- **React Native / Expo:** experiência mais nativa, acesso total a hardware, push confiável no iOS. Expo empurra updates na hora (OTA), builda binários e distribui preview sem Xcode/Android Studio. **Recomendado pra MVP mobile** quando a PWA não bastar (ex: push iOS, widgets, performance de animação).
- **Estratégia pragmática:** lançar PWA agora → medir retenção → migrar/duplicar pra Expo se o push iOS e a presença nas lojas virarem gargalo de crescimento.
- Fontes: [PWA vs Native 2026](https://topflightapps.com/ideas/native-vs-progressive-web-app/) · [PWA vs React Native](https://mediusware.com/blog/progressive-webapp-vs-react-native-app)

### Onboarding (1ª experiência define retenção)
- **Guest mode / value-first:** deixe o usuário sentir o valor antes de exigir conta. Pro Ascendia: deixar logar o 1º hábito / criar 1ª tarefa antes do paywall.
- **Onboarding ≤ 3 telas.** Progressive profiling: peça o mínimo pra começar, colete o resto conforme usa.
- **Peça permissão em contexto, NUNCA no 1º launch.** Push: pedir só depois que o usuário viu valor (ex: após 1º streak). Aumenta muito o opt-in.
- Fontes: [Mobile onboarding 2026 (VWO)](https://vwo.com/blog/mobile-app-onboarding-guide/) · [Appcues onboarding](https://www.appcues.com/blog/mobile-onboarding-best-practices)

### Push Notifications (retenção)
- **Push é produto, não spam:** "se o usuário não agradeceria por receber, não envie."
- **Triggered, segmentado:** usuário que não ativou uma feature 3-5 dias pós-install recebe push com *benefício específico*, não descrição de feature.
- Pro Ascendia: lembrete de streak em risco, celebração de level up, recap semanal de XP. Sempre com benefício claro e respeitando frequência.
- Fontes: [Push best practices 2026 (Pushwoosh)](https://www.pushwoosh.com/blog/push-notification-best-practices/) · [Reteno push 2026](https://reteno.com/blog/push-notification-best-practices-ultimate-guide-for-2026)

### Publicar nas lojas (quando for nativo) — prazos 2026
- **iOS:** submissões precisam do **SDK iOS 26+ a partir de 28/abr/2026**. Review 24-48h (1ª pode levar 1 semana). Rejeições comuns: falta de privacy policy, `PrivacyInfo.xcprivacy` ausente, credenciais de demo faltando, crash no review, "minimal functionality".
- **Android:** a partir de **31/ago/2026, `targetSdkVersion` 36 (Android 16)+** obrigatório. Tem **closed testing obrigatório** que pega indie de surpresa. Review 1-3h.
- **ASO:** nome iOS ≤ 30 chars / Google ≤ 50; keyword primária no nome+subtítulo (não enterrada na descrição); 3-5 screenshots, as 2 primeiras convertem o install.
- **Cronograma típico:** 5 fases em ~5 semanas (metadata → TestFlight/closed beta → submit com buffer de 2 semanas pra rejeição).
- Fontes: [App launch checklist 2026](https://getlaunchlist.com/checklists/app-launch) · [Submission guide 2026](https://primocys.com/blog/submit-app-to-app-store-google-play/)

> **Como usar esta base:** ao criar/revisar código, cheque a seção relevante. Ao otimizar, comece pelos quick wins de maior impacto (CWV mobile, RLS indexada, streak/retenção). Mantenha atualizada conforme a stack evoluir.
