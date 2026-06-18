-- ============================================================================
-- 013 — Hardening de segurança e índices (pré-launch)
-- ============================================================================
-- Gerado a partir da varredura dos advisors do Supabase (18/jun/2026).
-- Rodar no SQL Editor do Supabase. Idempotente e NÃO quebra o app:
--   o service_role (usado pelo servidor) ignora RLS e mantém EXECUTE.
--
-- Cobre 3 itens:
--   1. 🔴 Revoga EXECUTE das RPCs SECURITY DEFINER de anon/authenticated
--      (impede usuário de chamar grant_xp_atomic & cia direto pela REST e
--       se dar XP infinito / burlar a economia de gamificação)
--   2. 🟡 Fixa search_path das funções (function_search_path_mutable)
--   3. 🟡 Remove índices duplicados (duplicate_index)
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- 1. 🔴 CRÍTICO — Tranca as RPCs server-only contra chamada direta via REST
-- ----------------------------------------------------------------------------
-- ⚠️ ESTE BLOCO NÃO BASTOU: o EXECUTE estava em PUBLIC, e anon/authenticated
--    herdam dele. Corrigido na migration 015 (revoke from PUBLIC + grant a
--    service_role). Mantido aqui só como registro histórico.
-- Estas funções só devem ser chamadas pelo backend (service_role) ou por
-- triggers. Revogar de anon/authenticated bloqueia POST /rest/v1/rpc/<fn>.
revoke execute on function public.grant_xp_atomic(p_user_id uuid, p_amount integer, p_reason text, p_source_type text, p_source_id uuid) from anon, authenticated;
revoke execute on function public.claim_login_atomic(p_user_id uuid, p_today date, p_yesterday date) from anon, authenticated;
revoke execute on function public.increment_weekly_stats(p_user_id uuid, p_xp integer) from anon, authenticated;
revoke execute on function public.use_referral_code_atomic(p_user_id uuid, p_code text, p_referrer_id uuid) from anon, authenticated;
revoke execute on function public.reset_weekly_league_xp() from anon, authenticated;
revoke execute on function public.snapshot_daily_metrics(p_date date) from anon, authenticated;
revoke execute on function public.rls_auto_enable() from anon, authenticated;
revoke execute on function public.handle_new_user() from anon, authenticated;

-- ----------------------------------------------------------------------------
-- 2. 🟡 search_path explícito (resolve function_search_path_mutable)
-- ----------------------------------------------------------------------------
-- public = tabelas do app; extensions = funções de extensão (gen_random etc).
alter function public.update_updated_at_column()              set search_path = public, extensions;
alter function public.calculate_level(xp integer)             set search_path = public, extensions;
alter function public.generate_referral_code()                set search_path = public, extensions;
alter function public.snapshot_daily_metrics(p_date date)     set search_path = public, extensions;
alter function public.increment_weekly_stats(p_user_id uuid, p_xp integer)                       set search_path = public, extensions;
alter function public.reset_weekly_league_xp()                set search_path = public, extensions;
alter function public.grant_xp_atomic(p_user_id uuid, p_amount integer, p_reason text, p_source_type text, p_source_id uuid) set search_path = public, extensions;
alter function public.claim_login_atomic(p_user_id uuid, p_today date, p_yesterday date)         set search_path = public, extensions;
alter function public.use_referral_code_atomic(p_user_id uuid, p_code text, p_referrer_id uuid)  set search_path = public, extensions;

-- ----------------------------------------------------------------------------
-- 3. 🟡 Índices duplicados (mantém 1 de cada par)
-- ----------------------------------------------------------------------------
drop index if exists public.idx_guild_members_guild_id;   -- duplicado de idx_guild_members_guild
drop index if exists public.idx_guild_members_user_id;    -- duplicado de idx_guild_members_user
drop index if exists public.idx_profiles_subscription_status; -- duplicado de idx_profiles_subscription
drop index if exists public.idx_profiles_referral_code;   -- duplicado do UNIQUE profiles_referral_code_key

commit;

-- ============================================================================
-- Itens que NÃO dá pra fazer por SQL (resolver no Dashboard):
--   • Leaked password protection → Auth > Policies > ativar HaveIBeenPwned
--   • extension pg_trgm no schema public → opcional mover p/ schema extensions
-- ============================================================================
