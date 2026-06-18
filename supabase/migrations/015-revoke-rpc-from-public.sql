-- ============================================================================
-- 015 — Correção do revoke das RPCs (o 013 não bastou)
-- ============================================================================
-- O 013 fez REVOKE de anon/authenticated, mas o EXECUTE estava concedido ao
-- role PUBLIC (padrão do Postgres p/ toda função). anon/authenticated herdam
-- de PUBLIC → continuavam podendo chamar grant_xp_atomic & cia via REST.
--
-- Correção: revogar de PUBLIC (+ anon/authenticated por garantia) e conceder
-- EXECUTE explicitamente ao service_role, que é quem o backend usa. Assim o
-- app NÃO quebra e a porta fecha para o cliente.
--
-- Verificado antes via has_function_privilege: public_exec=true em todas.
-- Rodar no SQL Editor.
-- ============================================================================

begin;

-- grant_xp_atomic -------------------------------------------------------------
revoke execute on function public.grant_xp_atomic(p_user_id uuid, p_amount integer, p_reason text, p_source_type text, p_source_id uuid) from public, anon, authenticated;
grant  execute on function public.grant_xp_atomic(p_user_id uuid, p_amount integer, p_reason text, p_source_type text, p_source_id uuid) to service_role;

-- claim_login_atomic ----------------------------------------------------------
revoke execute on function public.claim_login_atomic(p_user_id uuid, p_today date, p_yesterday date) from public, anon, authenticated;
grant  execute on function public.claim_login_atomic(p_user_id uuid, p_today date, p_yesterday date) to service_role;

-- increment_weekly_stats ------------------------------------------------------
revoke execute on function public.increment_weekly_stats(p_user_id uuid, p_xp integer) from public, anon, authenticated;
grant  execute on function public.increment_weekly_stats(p_user_id uuid, p_xp integer) to service_role;

-- use_referral_code_atomic ----------------------------------------------------
revoke execute on function public.use_referral_code_atomic(p_user_id uuid, p_code text, p_referrer_id uuid) from public, anon, authenticated;
grant  execute on function public.use_referral_code_atomic(p_user_id uuid, p_code text, p_referrer_id uuid) to service_role;

-- reset_weekly_league_xp ------------------------------------------------------
revoke execute on function public.reset_weekly_league_xp() from public, anon, authenticated;
grant  execute on function public.reset_weekly_league_xp() to service_role;

-- snapshot_daily_metrics ------------------------------------------------------
revoke execute on function public.snapshot_daily_metrics(p_date date) from public, anon, authenticated;
grant  execute on function public.snapshot_daily_metrics(p_date date) to service_role;

-- rls_auto_enable -------------------------------------------------------------
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
grant  execute on function public.rls_auto_enable() to service_role;

-- handle_new_user (trigger em auth.users) -------------------------------------
-- Triggers não checam EXECUTE ao disparar, então revogar de public NÃO quebra
-- o signup. Não precisa conceder a service_role.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

commit;

-- ============================================================================
-- Conferir depois (deve dar public_exec=false, service_exec=true):
--   select p.proname,
--          has_function_privilege('public', p.oid, 'EXECUTE')       as public_exec,
--          has_function_privilege('authenticated', p.oid,'EXECUTE') as auth_exec,
--          has_function_privilege('service_role', p.oid,'EXECUTE')  as service_exec
--   from pg_proc p join pg_namespace n on n.oid=p.pronamespace
--   where n.nspname='public' and p.proname='grant_xp_atomic';
-- ============================================================================
