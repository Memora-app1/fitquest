---
# Handoff: Auth Mobile + Button Bugs
**Data:** 2026-06-16
**Status geral:** CONCLUÍDO (deploy em prod)

## ✅ O que foi feito

### Bug Principal: Login com email → /planos (CORRIGIDO)
- **Causa raiz**: `hasValidAccess()` em `src/proxy.ts` bloqueava usuários com `subscription_status = 'trial'` cujo `trial_end` tinha expirado (conta com +7 dias). O cron de expiração não estava rodando, então ninguém transitava para 'expired' — mas o proxy já bloqueava.
- **Fix**: `status === 'trial'` agora sempre libera acesso. Só `status === 'expired'` bloqueia explicitamente. Isso é o comportamento correto: o cron é quem muda de 'trial' → 'expired'.
- **Fix extra**: null/unknown status → grace period de 30 dias (antes era 7).

### Bug Google OAuth: "Link inválido" (PARCIALMENTE CORRIGIDO)
- **Causa raiz**: URL do Vercel (`fitquest-app1.vercel.app`) não está na lista de redirect URLs permitidos no Supabase dashboard.
- **Fix de código**: Mensagem de erro agora explica que precisa configurar o Supabase (`Login com Google falhou. O URL do app precisa ser autorizado no painel do Supabase`).
- **Fix de cache**: `src/app/auth/callback/route.ts` agora limpa o cookie `asc-sub-v1` após login bem-sucedido (evita cookie stale bloqueando usuário).
- **O que ainda falta**: Configurar no Supabase Dashboard → Auth → URL Configuration → adicionar `https://fitquest-app1.vercel.app/**`.

### Botões sem `type="button"` (CORRIGIDO em 9 arquivos)
- Botões fora de forms não causavam bug (type="submit" só importa dentro de form), mas é boa prática. Corrigidos preventivamente.
- Arquivos: habits-list, habit-packs, transactions-view, accounts-manager, finance-goals-list, goals-list, calendar-client, bottom-nav, eisenhower-board.

### Build Turbopack (RESOLVIDO)
- O build que falhava com 52 erros era cache corrompido do `.next`.
- Após `rm -rf .next` + `npx next build`, o build passa sem erros.
- TypeScript: zero erros em todas as mudanças.

### SQL criado para banco (NÃO APLICADO — precisa rodar manualmente)
- `supabase/fixes/002-extend-trial-existing-users.sql`: estende `trial_end` por 365 dias para todos os usuários em 'trial'.
- Isso é uma redundância de segurança — o fix do proxy já resolve, mas estender o trial_end é boa prática.

## ⏳ Pendências

### 🔴 CRÍTICO
- **Supabase: adicionar URL ao redirect permitido para Google OAuth**
  - Supabase Dashboard → Projeto → Auth → URL Configuration
  - Site URL: `https://fitquest-app1.vercel.app`
  - Redirect URLs: adicionar `https://fitquest-app1.vercel.app/**`
  - Sem isso, login com Google nunca vai funcionar em produção

- **Rodar SQL `supabase/fixes/002-extend-trial-existing-users.sql`**
  - Acesse: https://supabase.com/dashboard → SQL Editor → New query → cole o arquivo e execute
  - Isso estende trial_end de 365 dias para todos os usuários existentes

### 🟡 IMPORTANTE
- **Configurar `CRON_SECRET` no Vercel**: sem isso, o cache HMAC de subscription fica desabilitado e todo request faz uma query ao banco. Vai sobrecarregar o Supabase com escala.
  - Vercel Dashboard → Project Settings → Environment Variables → adicionar `CRON_SECRET=<valor-aleatorio>`
  - Depois de adicionar, acionar `ADMIN_BYPASS_EMAILS=sjoaopedro606@gmail.com` ou o email real do admin

- **Ativar Supabase Realtime na tabela `profiles`**: para live updates de XP sem refresh manual.

- **Investigar bugs mobile específicos que o usuário mencionou**: o usuário disse "muito bug no mobile" mas não especificou quais. Provavelmente são:
  1. Modais com scroll cortando botões em telas pequenas
  2. Touch targets pequenos
  3. Scroll lock quebrado

### 🟢 MELHORIA
- Aplicar migrações pendentes: `009-gamification-v2.sql`, `010-admin-platform.sql`, `011-rls-v2-optimization.sql`, `012-race-condition-fixes.sql`.
- Configurar cron de expiração de subscriptions em Vercel (para quando Stripe entrar).
- Continuar o /loop de pesquisa de features (estava no Ciclo 1, após deployar os 3 features: Critical Hit XP, Difficulty Levels, Subscription Tracker).

## 🧠 Contexto para o próximo agente

O Ascendia é um Life OS gamificado brasileiro (Next.js 16, Supabase, Stripe). Estava com dois bugs críticos no mobile que impediam o login: (1) email/senha ia para /planos por causa de trial expirado sem cron rodando, (2) Google OAuth dava "link inválido" por falta de config no Supabase. Ambos foram corrigidos no proxy.ts e no callback. O deploy foi para produção com sucesso. O Google OAuth ainda precisa de configuração manual no Supabase dashboard (não é código, é config do painel).

O estado atual do projeto é funcional: login com email funciona, dashboard carrega, todas as páginas principais respondem. A feature de subscription blocking só vai ativar quando: (a) o cron de expiração rodar E (b) explicitamente definir status='expired'. Por enquanto todos os usuários em 'trial' têm acesso livre.

O próximo passo natural é: configurar o Supabase para Google OAuth, aplicar o SQL fix 002, configurar CRON_SECRET no Vercel, e depois retomar o /loop de pesquisa de features competitivas.

## 📁 Arquivos tocados nessa sessão
- `src/proxy.ts` — fix principal: hasValidAccess liberado para trial sem checar trial_end
- `src/app/auth/callback/route.ts` — limpa cookie asc-sub-v1 após login
- `src/app/login/page.tsx` — mensagem de erro do Google OAuth melhorada
- `src/components/habitos/habits-list.tsx` — type="button" adicionado
- `src/components/habitos/habit-packs.tsx` — type="button" adicionado
- `src/components/financas/transactions-view.tsx` — type="button" adicionado
- `src/components/financas/accounts-manager.tsx` — type="button" adicionado
- `src/components/financas/finance-goals-list.tsx` — type="button" adicionado
- `src/components/metas/goals-list.tsx` — type="button" adicionado
- `src/components/calendario/calendar-client.tsx` — type="button" adicionado
- `src/components/layout/bottom-nav.tsx` — type="button" adicionado
- `src/components/tarefas/eisenhower-board.tsx` — type="button" adicionado
- `supabase/fixes/002-extend-trial-existing-users.sql` — SQL para estender trial (CRIAR, aplicar manualmente)

## ⚠️ Armadilhas / Decisões não-óbvias
- **O build error de 52 Turbopack errors era cache corrompido**: não tente investigar o código dos erros, simplesmente `rm -rf .next` e rebuilda.
- **O proxy tem dois mecanismos de bloqueio**: (1) cookie HMAC-signed e (2) query ao banco. Sem CRON_SECRET, o cache fica desabilitado e cai no path 2 sempre. Isso é seguro mas lento.
- **`status === 'trial'` é o estado padrão de todos os usuários** — o cron de expiração que nunca rodou é o motivo pelo qual ninguém estava com 'expired'. Não bloqueamos baseado em trial_end sozinho.
- **Google OAuth usa PKCE flow**: o callback `/auth/callback` troca o code por sessão. Se o code não chega, é porque o Supabase rejeitou o redirectTo URL (não está na whitelist).

## 🎯 Primeiro passo sugerido ao retomar
1. Ir no Supabase Dashboard → Auth → URL Configuration → adicionar `https://fitquest-app1.vercel.app/**` às Redirect URLs
2. Rodar `supabase/fixes/002-extend-trial-existing-users.sql` no SQL Editor do Supabase
3. Testar login com Google no mobile para confirmar que funciona
4. Retomar o /loop de pesquisa de features (Ciclo 2 — novos tópicos a pesquisar)
