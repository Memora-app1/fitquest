# Handoff: Web Research & Improvements
**Data:** 2026-06-16
**Status geral:** EM ANDAMENTO

## ✅ O que foi feito

### Banco / Segurança
- `supabase/migrations/011-rls-v2-optimization.sql` — criado: atualiza RLS de 5 tabelas V2 (`daily_loot`, `guilds`, `guild_members`, `season_progress`, `user_cosmetics`) de `auth.uid()` para `(SELECT auth.uid())` (per-statement caching); adiciona 6 índices novos incluindo `idx_profiles_league_xp` para o ranking

### Componentes Novos
- `src/components/dashboard/streak-nudge-banner.tsx` — criado: banner que aparece quando o próximo dia do usuário bate um marco de XP (D6→7, D29→30, D89→90); Server Component puro; exibe XP bonus, progress bar e CTA para `/habitos`
- `src/components/dashboard/xp-velocity-banner.tsx` — criado: banner que compara XP desta semana vs. média das últimas 4 semanas (proporcional aos dias corridos); só aparece se diferença ≥ 10%; verde quando acima, vermelho quando abaixo

### Componentes Modificados
- `src/components/dashboard/xp-widget.tsx` — adicionado `viewTransitionName: 'xp-level-title'` e `viewTransitionName: 'xp-total-counter'` para shared element morph animations ao navegar entre `/dashboard` e `/score`
- `src/components/dashboard/next-achievement-widget.tsx` — corrigido bug: `first_habit` agora usa `totalHabits` (hábitos criados) em vez de `totalHabitLogs`; adicionados slugs `habit_logs_10`, `habit_logs_50`, `streak_90`, `streak_180`, `tasks_200`, `perfect_week`; adicionada query paralela para contar hábitos ativos
- `src/app/ranking/page.tsx` — corrigido `sizes` prop em imagens de avatar: 48px no pódio, 36px na lista (evita download de imagem viewport-width para círculo de 36px)

### Layout / Globals
- `src/app/globals.css` — adicionado CSS para named view transitions: `::view-transition-old/new(xp-total-counter)` e `(xp-level-title)` com animações blur+scale (`vtNamedOut`/`vtNamedIn`)
- `src/app/layout.tsx` — adicionado `<link rel="preconnect">` e `<link rel="dns-prefetch">` dinâmicos apontando para o host do Supabase (reduz ~100-200ms de DNS lookup)

### Dashboard Page
- `src/app/dashboard/page.tsx` — integrado `StreakNudgeBanner` e `XpVelocityBanner` (em `<Suspense fallback={null}>`) na página

### Build
- Build passou com 76 rotas, zero erros TypeScript, após reverter `cacheComponents: true`

---

## ⏳ Pendências

### 🔴 CRÍTICO
- **Nenhuma pendência crítica identificada.** O build está limpo e o app funcional.

### 🟡 IMPORTANTE
- **React Compiler** — pesquisa identificou que `reactCompiler: true` em `next.config.ts` é suportado no Next.js 16 e elimina necessidade de `useMemo`/`useCallback` manuais. Requer instalar `babel-plugin-react-compiler`. Foi **deliberadamente pulado** por risco de regressão de build time sem teste prévio. Próximo passo: `npm install babel-plugin-react-compiler --save-dev` e testar build isolado
- **Bottom nav prefetch no touchstart** — pesquisa identificou que fazer `router.prefetch()` no evento `touchstart` (antes do `click`) reduz latência percebida em mobile. Os 5 itens do bottom nav (`/dashboard`, `/tarefas`, `/fitness`, `/financas`, `/coach`) deveriam ter `onTouchStart={() => router.prefetch(href)}` — não implementado
- **Migração 011 não aplicada ao banco** — o arquivo SQL foi criado mas NÃO foi executado no Supabase. O próximo agente deve rodar via Supabase Dashboard → SQL Editor ou `supabase db push`

### 🟢 MELHORIA
- **Mais named view transitions** — os elementos de avatar no header e os contadores de ranking/season poderiam ter `viewTransitionName` únicos para morphs suaves. Baixo impacto em performance, mas visual premium
- **XpVelocityBanner expandido** — atualmente compara só XP total. Poderia ter variantes para "hábitos esta semana" e "treinos esta semana" como cards secundários
- **`loading.tsx` do dashboard** — existe em `src/app/dashboard/loading.tsx` mas não foi verificado se tem conteúdo. Verificar se exibe skeleton adequado ou está vazio
- **Push notifications com timing otimizado** — pesquisa identificou que notificações às 17h30-19h têm 3x mais abertura que manhã. O cron de notificações em `/api/cron/streaks` deveria agendar lembretes nessa janela
- **AI daily challenges personalizados** — feature identificada na pesquisa: gerar 3 desafios diários personalizados usando o Coach IA com base nos hábitos e histórico do usuário. Feature inteira ainda não existe
- **`"use cache"` directive migration** — a arquitetura ideal para Next.js 16 usa `"use cache"` em vez de `unstable_cache`. Mas migrar exige remover `export const dynamic = 'force-dynamic'` de 51 arquivos — decisão consciente de adiar. Não é urgente

---

## 🧠 Contexto para o próximo agente

Esta sessão foi de **pesquisa contínua na web + implementação de melhorias** — o usuário pediu para buscar best practices de 2026 em React 19, Next.js 16, gamificação e performance, e aplicar sem parar. O foco resultou em melhorias de gamificação (banners de nudge), performance (RLS, DNS prefetch, image sizes), e UX (view transitions).

O app está **funcionando e buildando limpo** (76 rotas, zero TypeScript errors). Não há nada quebrado.

A decisão mais importante e não-óbvia foi **rejeitar `cacheComponents: true`**: o Next.js 16 `"use cache"` directive é incompatível com `export const dynamic = 'force-dynamic'`, que está em 51 arquivos do projeto. Tentar migrar isso em uma sessão quebraria o build inteiro. A estratégia correta é migrar arquivo por arquivo ao longo de semanas.

A **migração 011** (RLS V2 + indexes) foi escrita mas não executada no banco. Esse é o único item pendente que tem impacto em produção — deve ser aplicado via Supabase Dashboard antes do deploy.

---

## 📁 Arquivos tocados nessa sessão

- `supabase/migrations/011-rls-v2-optimization.sql` — CRIADO: RLS otimizado + 6 índices para tabelas V2
- `src/components/dashboard/streak-nudge-banner.tsx` — CRIADO: banner de antecipação de milestone
- `src/components/dashboard/xp-velocity-banner.tsx` — CRIADO: banner de ritmo semanal de XP
- `src/components/dashboard/xp-widget.tsx` — MODIFICADO: adicionado viewTransitionName nos counters
- `src/components/dashboard/next-achievement-widget.tsx` — MODIFICADO: bug fix first_habit + novos slugs + query habits
- `src/app/ranking/page.tsx` — MODIFICADO: sizes prop nas imagens de avatar
- `src/app/globals.css` — MODIFICADO: CSS de named view transitions (blur+scale morph)
- `src/app/layout.tsx` — MODIFICADO: preconnect/dns-prefetch dinâmico para Supabase
- `src/app/dashboard/page.tsx` — MODIFICADO: integração dos dois novos banners

---

## ⚠️ Armadilhas / Decisões não-óbvias

1. **`cacheComponents: true` quebra o build** — Next.js 16.2 não permite `"use cache"` directive e `export const dynamic = 'force-dynamic'` no mesmo arquivo. Não adicione `cacheComponents: true` ao `next.config.ts` sem primeiro migrar todos os 51 arquivos afetados
2. **Migração 011 não foi aplicada** — está só no disco, não no banco. O Supabase não aplica migrations automaticamente em dev; precisa de `supabase db push` ou execução manual
3. **React Compiler precisa do package** — `reactCompiler: true` em next.config sem instalar `babel-plugin-react-compiler` vai quebrar o build com erro de módulo não encontrado
4. **viewTransitionName deve ser único por página** — se dois elementos na mesma rota tiverem o mesmo `viewTransitionName`, a View Transition API aborta silenciosamente. Sempre use nomes únicos globalmente
5. **`(SELECT auth.uid())` vs `auth.uid()`** — a versão com `SELECT` envolve em subquery, o que faz o Postgres avaliar uma única vez por statement em vez de uma vez por linha. Em tabelas com muitas linhas isso é significativo. Já aplicado nas tabelas V2, mas as tabelas originais (habits, tasks, etc.) ainda usam a forma antiga

---

## 🎯 Primeiro passo sugerido ao retomar

**Aplicar a migração 011 no banco:**
1. Abrir Supabase Dashboard → SQL Editor
2. Colar o conteúdo de `supabase/migrations/011-rls-v2-optimization.sql`
3. Executar e confirmar que não há erros de permissão
4. Em seguida, considerar instalar React Compiler: `npm install babel-plugin-react-compiler --save-dev` e adicionar `reactCompiler: true` ao `next.config.ts`, rodando `npm run build` para verificar

Se o objetivo for continuar a pesquisa e melhorias: o próximo foco mais impactante é **bottom nav prefetch no touchstart** (melhora responsividade percebida em mobile, ~1-2h de trabalho) e **AI daily challenges** (feature de retenção significativa, ~1 dia de trabalho).
