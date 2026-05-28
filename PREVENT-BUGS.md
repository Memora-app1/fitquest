# Prevenção de Bugs — Ascendia

## Bug do Signup (resolvido em 2026-05-23)

### Causa
Trigger `handle_new_user` não existia em produção OU usava `profiles` sem `public.` explícito.

### Prevenção
- Sempre rodar `supabase/fixes/` após qualquer mudança de schema em produção
- Ao adicionar coluna NOT NULL em `profiles` sem DEFAULT, atualizar `handle_new_user` também
- Testar signup após qualquer mudança no schema da tabela `profiles`

### Regra de ouro
> Qualquer ALTER TABLE em `profiles` exige verificar se `handle_new_user` ainda funciona.

---

## Checklist após mudança de schema

Antes de qualquer deploy que altere o banco:

- [ ] A mudança quebra `handle_new_user`? (novos campos NOT NULL sem DEFAULT)
- [ ] Tem script em `supabase/fixes/` para aplicar em produção?
- [ ] Rodou o script no Supabase de staging/produção?
- [ ] Testou o signup após a mudança?

---

## Monitoramento sugerido

### Vercel Logs
- Verificar `/api/` logs após cada deploy
- Configurar alerta no Vercel se build falhar

### Supabase Logs  
- Postgres Logs → filtrar por `handle_new_user` para ver erros de trigger
- Auth Logs → ver tentativas de signup com falha

### Stripe Webhook
- Verificar dashboard.stripe.com/webhooks para eventos com falha
- Reprocessar webhooks falhos manualmente se necessário
