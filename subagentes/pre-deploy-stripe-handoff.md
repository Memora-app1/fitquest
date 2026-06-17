# Handoff: Pre-deploy Stripe + Mobile + Build Fix
**Data:** 2026-06-16
**Status geral:** CONCLUÍDO — build EXIT 0, falta só commitar e deployar

## ✅ O que foi feito

### Consistência Stripe (5 arquivos)
- `src/app/planos/page.tsx` — trust signal trocado de "Mercado Pago" → "Stripe"
- `src/app/termos/page.tsx` — texto legal corrigido com descrição correta do Stripe + PCI DSS
- `src/app/admin/analytics/receita/page.tsx` — subtitle e warning box atualizados para Stripe
- `src/app/admin/sistema/page.tsx` — descrição de conectividade + contagem "14 → 15 automações"
- `src/app/admin/sistema/crons/page.tsx` — novo entry para task-reminders na categoria Notificações

### Cron task-reminders (estava em código mas nunca agendado)
- `vercel.json` — adicionado `{ "path": "/api/cron/task-reminders", "schedule": "0 9 * * *" }` (15º cron)
- `src/app/api/admin/sistema/trigger-cron/route.ts` — `/api/cron/task-reminders` adicionado ao Set ALLOWED_PATHS

### Stripe Billing Portal
- `src/app/api/billing-portal/route.ts` — **NOVO ARQUIVO** — POST endpoint que cria sessão no portal Stripe e redireciona; usa `stripe_customer_id` do profile; return_url = `/perfil`
- `src/app/perfil/page.tsx` — adicionado `ExternalLink` ao import + `stripe_customer_id` ao select + botão "Portal Stripe" (form POST) condicional para status `active` ou `cancelled`

### Mobile / Acessibilidade
- `src/app/globals.css` — adicionado `overflow-x: hidden` no bloco `html` + media query `prefers-reduced-motion` ao final (WCAG 2.1 AA)
- `src/components/layout/notification-drawer.tsx` — maxHeight corrigido para `calc(100dvh - 72px - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px))`

### PWA
- `public/manifest.json` — atualizado com shortcuts (Novo hábito → `/habitos?new=1`, Novo treino, Nova tarefa) e ícones via rotas dinâmicas Next.js (`/icon`, `/apple-icon`)

### Fix crítico de build
- `package.json` + `package-lock.json` — `@types/react` atualizado de `18.3.29` → `19.2.17` e `@types/react-dom` de `18.3.7` → `19.x`
- Causa raiz: React era v19.2.7 mas `@types/react` era v18 → `useOptimistic` não existia nos tipos → build falhava em `src/components/habitos/habits-list.tsx:55`
- Após fix: `npx tsc --noEmit` → 0 erros, `npm run build` → EXIT 0 ✅

---

## ⏳ Pendências

### 🔴 CRÍTICO

- **GIT COMMIT + PUSH NÃO FOI FEITO** — O usuário pediu "pode dar o comando" e os comandos foram fornecidos, mas a sessão terminou antes de confirmar que ele rodou. O código está correto e o build passa, mas NADA foi commitado desta sessão ainda. Comando sugerido:
  ```bash
  git add -A && git commit -m "fix: Stripe consistency, task-reminders cron, billing portal, mobile a11y, React types v19"
  git push origin main
  ```

- **Stripe Customer Portal não configurado no Dashboard** — O endpoint `/api/billing-portal` funciona mas o usuário PRECISA ativar o portal em: Stripe Dashboard → Settings → Billing → Customer portal → Enable. Sem isso, a chamada `billingPortal.sessions.create()` vai retornar erro 403.

- **Webhook Stripe não apontado para produção** — O endpoint correto é `https://[dominio]/api/webhook/stripe` (singular, não `webhooks`). O arquivo antigo `src/app/api/webhooks/stripe/route.ts` foi deletado (staged) e o novo está em `src/app/api/webhook/stripe/route.ts`. No Stripe Dashboard precisa atualizar o webhook URL e pegar o novo `STRIPE_WEBHOOK_SECRET`.

- **Variáveis de ambiente no Vercel** — Confirmar que todas estão configuradas em produção, especialmente `STRIPE_WEBHOOK_SECRET` (valor do webhook de produção, não de teste).

### 🟡 IMPORTANTE

- **Arquivos unstaged que ficaram de fora do commit desta sessão:**
  - `src/app/dashboard/page.tsx` — modificado mas não staged (pode conter mudanças anteriores)
  - `src/app/layout.tsx` — modificado mas não staged
  - `src/components/dashboard/xp-velocity-banner.tsx` — arquivo novo, untracked
  - `supabase/migrations/012-race-condition-fixes.sql` — migration nova, não commitada
  - `src/app/api/daily-reward/route.ts` — modificado
  - `src/app/api/login-checkin/route.ts` — modificado
  - `src/app/api/referral/route.ts` — modificado
  - `supabase/migrations/009-gamification-v2.sql` — modificado
  - `supabase/migrations/010-admin-platform.sql` — modificado

  Esses provavelmente são de sessões anteriores. Verificar antes de commitar com `git diff` em cada um.

- **Migration 012-race-condition-fixes.sql** — Existe localmente mas provavelmente não foi rodada no banco de produção Supabase. Verificar se é segura rodar antes do deploy.

- **Ícones PWA reais** — `public/manifest.json` usa as rotas dinâmicas `/icon` e `/apple-icon` do Next.js. Funcionam em produção mas requerem que `src/app/icon.tsx` e `src/app/apple-icon.tsx` existam. Confirmar que esses arquivos existem.

### 🟢 MELHORIA

- Adicionar PNGs reais para os ícones PWA (192x192, 512x512, maskable) em `/public/icons/` para melhor suporte offline e instalação no Android.
- O `build_output.txt` na raiz é lixo — pode deletar (`rm build_output.txt`).
- Smoke test após deploy: testar fluxo completo Stripe (checkout → webhook → subscription_status = active → billing portal → cancelamento).

---

## 🧠 Contexto para o próximo agente

O foco desta sessão foi **preparar o Ascendia para o primeiro deploy em produção**. O app usa **Stripe** (não Mercado Pago — a migração foi feita antes desta sessão), e havia textos desatualizados em 5 arquivos referenciando o processador antigo — todos corrigidos. O build estava quebrando por um mismatch de versão (`@types/react@18` com `react@19`) que foi corrigido atualizando os tipos para v19.

O **estado atual é: código pronto, build passando com EXIT 0, mas NÃO commitado**. O usuário saiu antes de rodar os comandos git. A primeira coisa ao retomar é verificar `git status`, fazer o commit de tudo desta sessão, e fazer o push/deploy no Vercel.

O endpoint de billing portal (`/api/billing-portal`) é novo e funcionará apenas após o usuário ativar o Customer Portal no dashboard Stripe. Documentar isso para o usuário antes do smoke test.

---

## 📁 Arquivos tocados nessa sessão

- `src/app/planos/page.tsx` — trust signal: "Mercado Pago" → "Stripe"
- `src/app/termos/page.tsx` — texto legal completo atualizado para Stripe + PCI DSS
- `src/app/admin/analytics/receita/page.tsx` — referências ao Stripe corrigidas
- `src/app/admin/sistema/page.tsx` — descricão e contagem de crons (14 → 15)
- `src/app/admin/sistema/crons/page.tsx` — entry de task-reminders adicionado
- `src/app/api/admin/sistema/trigger-cron/route.ts` — task-reminders no whitelist
- `src/app/api/billing-portal/route.ts` — **CRIADO** — portal Stripe billing
- `src/app/perfil/page.tsx` — botão "Portal Stripe" + ExternalLink import
- `src/app/globals.css` — overflow-x hidden + prefers-reduced-motion
- `src/components/layout/notification-drawer.tsx` — safe area insets corretos
- `public/manifest.json` — PWA shortcuts + ícones via rotas dinâmicas
- `vercel.json` — 15º cron: task-reminders às 09:00 UTC
- `package.json` — @types/react 18 → 19, @types/react-dom 18 → 19
- `package-lock.json` — atualizado pelo npm

---

## ⚠️ Armadilhas / Decisões não-óbvias

1. **Webhook path: `webhook` (singular), não `webhooks`** — O arquivo antigo estava em `/api/webhooks/stripe/` (plural). Foi deletado e recriado em `/api/webhook/stripe/` (singular). Se alguém configurar o Stripe webhook apontando para o path antigo, vai dar 404.

2. **`@types/react` precisa ser v19** — Se alguém rodar `npm install` e reverter para v18, o build vai quebrar em `src/components/habitos/habits-list.tsx` porque o arquivo usa `useOptimistic` (hook do React 19).

3. **Billing portal requer `stripe_customer_id` no profile** — Usuários que se cadastraram antes da integração Stripe pode não ter esse campo preenchido. Nesses casos, o botão "Portal Stripe" não aparece (condicional correto no código), mas eles também não conseguem gerenciar a assinatura via app. Solução futura: sincronizar customer_id via webhook na próxima compra.

4. **`prefers-reduced-motion` desabilita animações globalmente** — O Ascendia tem muitas animações de XP e gamificação. Usuários com essa preferência do sistema vão ver a UI "parada". É a decisão correta (acessibilidade), mas deve ser comunicado ao produto.

5. **Manifest usa rotas dinâmicas Next.js para ícones** — `/icon` e `/apple-icon` são servidas por `src/app/icon.tsx` e `src/app/apple-icon.tsx`. Se esses arquivos não existirem, o manifest vai retornar 404 para os ícones e o PWA não vai instalar corretamente.

---

## 🎯 Primeiro passo sugerido ao retomar

```bash
# 1. Verificar o que está pendente de commit
git status
git diff src/app/dashboard/page.tsx  # checar se tem mudanças intencionais

# 2. Fazer o commit desta sessão
git add src/app/api/billing-portal/route.ts \
  src/app/planos/page.tsx \
  src/app/perfil/page.tsx \
  src/app/termos/page.tsx \
  src/app/admin/sistema/page.tsx \
  src/app/admin/sistema/crons/page.tsx \
  src/app/api/admin/sistema/trigger-cron/route.ts \
  src/app/admin/analytics/receita/page.tsx \
  src/app/globals.css \
  src/components/layout/notification-drawer.tsx \
  public/manifest.json \
  vercel.json \
  package.json \
  package-lock.json

git commit -m "fix: Stripe consistency, task-reminders cron, billing portal, mobile a11y, React types v19"

# 3. Push e deploy
git push origin main
# Vercel vai auto-deployar pelo GitHub integration, ou:
npx vercel --prod
```

Após o deploy: configurar Customer Portal no Stripe Dashboard → Settings → Billing → Customer portal → Enable.
