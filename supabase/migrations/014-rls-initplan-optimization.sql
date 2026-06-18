-- ============================================================================
-- 014 — Otimização de RLS (auth_rls_initplan)
-- ============================================================================
-- Troca auth.uid() por (select auth.uid()) nas policies para o Postgres
-- avaliar o uid UMA vez por query em vez de UMA vez por linha.
-- Ganho real em tabelas grandes (escala). Comportamento idêntico.
--
-- As tabelas da gamification V2 (guilds, daily_loot, season_progress,
-- user_cosmetics, guild_members) JÁ foram otimizadas na migration 011 —
-- não aparecem aqui.
--
-- Rodar no SQL Editor. Cada ALTER preserva exatamente a regra original.
-- ============================================================================

begin;

-- Fitness / hábitos -----------------------------------------------------------
alter policy "users_full_access_own_habits"        on public.habits        using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
alter policy "users_full_access_own_habit_logs"    on public.habit_logs    using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
alter policy "users_full_access_own_workouts"      on public.workouts      using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
alter policy "users_full_access_own_workout_sets"  on public.workout_sets  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
alter policy "users_full_access_own_goals"         on public.goals         using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

alter policy "view_global_or_own_exercises" on public.exercises using ((is_global = true) or (user_id = (select auth.uid())));
alter policy "users_insert_own_exercises"   on public.exercises with check ((user_id = (select auth.uid())) and (is_global = false));
alter policy "users_update_own_exercises"   on public.exercises using ((user_id = (select auth.uid())) and (is_global = false));
alter policy "users_delete_own_exercises"   on public.exercises using ((user_id = (select auth.uid())) and (is_global = false));

-- Produtividade ---------------------------------------------------------------
alter policy "users_full_access_own_task_lists" on public.task_lists using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
alter policy "users_full_access_own_tasks"      on public.tasks      using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
alter policy "users_full_access_own_subtasks"   on public.subtasks   using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Finanças --------------------------------------------------------------------
alter policy "users_full_access_own_finance_accounts" on public.finance_accounts using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
alter policy "users_full_access_own_finance_goals"    on public.finance_goals    using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
alter policy "users_full_access_own_transactions"     on public.transactions     using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

alter policy "view_global_or_own_finance_categories" on public.finance_categories using ((is_global = true) or (user_id = (select auth.uid())));
alter policy "users_insert_own_finance_categories"   on public.finance_categories with check ((user_id = (select auth.uid())) and (is_global = false));
alter policy "users_update_own_finance_categories"   on public.finance_categories using ((user_id = (select auth.uid())) and (is_global = false));
alter policy "users_delete_own_finance_categories"   on public.finance_categories using ((user_id = (select auth.uid())) and (is_global = false));

-- Calendário ------------------------------------------------------------------
alter policy "users_full_access_own_calendar_integrations" on public.calendar_integrations using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
alter policy "users_full_access_own_calendar_events"       on public.calendar_events       using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Coach IA --------------------------------------------------------------------
alter policy "users_full_access_own_ai_conversations" on public.ai_conversations using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
alter policy "users_full_access_own_ai_messages"      on public.ai_messages      using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Saúde -----------------------------------------------------------------------
alter policy "users_own_mood_logs" on public.mood_logs using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Gamificação / perfil --------------------------------------------------------
alter policy "users_view_own_profile"   on public.profiles using (id = (select auth.uid()));
alter policy "users_update_own_profile" on public.profiles using (id = (select auth.uid())) with check (id = (select auth.uid()));
alter policy "users_view_own_xp"               on public.xp_transactions   using (user_id = (select auth.uid()));
alter policy "users_view_own_user_achievements" on public.user_achievements using (user_id = (select auth.uid()));

-- Notificações / push ---------------------------------------------------------
alter policy "notifications_self"             on public.notifications using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
alter policy "users_view_own_notifications"   on public.notifications using (user_id = (select auth.uid()));
alter policy "users_update_own_notifications" on public.notifications using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
alter policy "push_subscriptions_self"                on public.push_subscriptions using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
alter policy "users_full_access_own_push_subscriptions" on public.push_subscriptions using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Admin: reports / banner dismissals ------------------------------------------
alter policy "banner_dismissals_own" on public.banner_dismissals using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
alter policy "reports_insert"   on public.user_reports with check (reporter_id = (select auth.uid()));
alter policy "reports_read_own" on public.user_reports using (reporter_id = (select auth.uid()));

commit;

-- ============================================================================
-- OPCIONAL — dedup de policies sobrepostas (multiple_permissive_policies)
-- ----------------------------------------------------------------------------
-- As policies abaixo são IDÊNTICAS a outras na mesma tabela (vieram da
-- migration 012). Dropar a redundante remove overhead e o warn. Comportamento
-- igual. Descomente para aplicar:
--
-- begin;
--   -- notifications: notifications_self (ALL) já cobre SELECT+UPDATE
--   drop policy if exists "users_view_own_notifications"   on public.notifications;
--   drop policy if exists "users_update_own_notifications" on public.notifications;
--   -- push_subscriptions: as duas policies são idênticas
--   drop policy if exists "users_full_access_own_push_subscriptions" on public.push_subscriptions;
-- commit;
-- ============================================================================
