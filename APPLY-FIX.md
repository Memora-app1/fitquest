# 🔥 Correção Urgente — Signup Quebrado + Colunas Stripe

## O que estava acontecendo

O signup retornava "Database error saving new user" por uma das causas:
1. O trigger `handle_new_user` nunca foi aplicado no Supabase de produção
2. A função não usava `public.profiles` explícito (problema de search_path)
3. Colunas `mp_subscription_id`/`mp_customer_id` precisavam ser renomeadas para `stripe_*`

---

## Como corrigir (PASSO A PASSO)

### Passo 1 — Aplicar fix no Supabase

1. Abrir [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecionar o projeto **FitQuest** (puqlapfpxzktrroihwie)
3. Menu lateral → **SQL Editor** → **New query**
4. Abrir o arquivo `supabase/fixes/001-fix-handle-new-user.sql`
5. Copiar **TODO** o conteúdo e colar no SQL Editor
6. Clicar **RUN** (ou Ctrl+Enter)
7. Confirmar nas mensagens: `✅ Fix aplicado com sucesso — trigger e function recriados`

> ⚠️ Se aparecer erro, copie a mensagem de erro e abra uma issue.

---

### Passo 2 — Adicionar variáveis Stripe no Vercel (se ainda não fez)

No Vercel → **aplicativo fitquest1** → Settings → Environment Variables → Add:

| Variável | Onde pegar |
|---|---|
| `STRIPE_SECRET_KEY` | dashboard.stripe.com → Developers → API keys |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | dashboard.stripe.com → Developers → API keys |
| `STRIPE_WEBHOOK_SECRET` | Após criar o endpoint de webhook |
| `STRIPE_PRICE_MONTHLY` | Stripe → Products → criar plano mensal R$37 |
| `STRIPE_PRICE_ANNUAL` | Stripe → Products → criar plano anual R$306,60 |
| `STRIPE_PRICE_LIFETIME` | Stripe → Products → criar produto vitalício R$597 |

---

### Passo 3 — Remover variáveis do Mercado Pago no Vercel

No Vercel → Environment Variables, remova:
- `MERCADO_PAGO_ACCESS_TOKEN`
- `MERCADO_PAGO_PUBLIC_KEY`
- `MERCADO_PAGO_WEBHOOK_SECRET`

---

### Passo 4 — Configurar Webhook no Stripe

1. Acessar [dashboard.stripe.com/webhooks](https://dashboard.stripe.com/webhooks)
2. Clicar **Add endpoint**
3. URL: `https://fitquest-app1.vercel.app/api/webhook/stripe`
4. Selecionar eventos:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
5. Copiar o **Signing secret** → adicionar como `STRIPE_WEBHOOK_SECRET` no Vercel

---

### Passo 5 — Deploy e validação

O código já foi commitado e enviado ao GitHub. O Vercel vai buildar automaticamente.

Após o deploy terminar:

**Checklist de validação em produção:**
- [ ] Acessar `https://fitquest-app1.vercel.app/signup`
- [ ] Criar conta com email real
- [ ] Confirmar que não aparece "Database error saving new user"
- [ ] Confirmar redirecionamento para `/onboarding`
- [ ] Verificar no Supabase → Table Editor → profiles que o perfil foi criado
- [ ] Acessar `/termos` — página deve carregar
- [ ] Acessar `/privacidade` — página deve carregar
- [ ] Testar com email já cadastrado → deve mostrar "Este email já tem uma conta"

---

## Em caso de erro persistente

Verifique os logs no Supabase:
1. Dashboard → **Logs** → **Postgres** → filtrar por `handle_new_user`
2. O erro aparecerá com a mensagem exata

Verifique os logs no Vercel:
1. Dashboard → **Logs** → filtrar por `/api/`
