-- ════════════════════════════════════════════════════════════════
-- ASCENDIA — RLS Performance Upgrade
--
-- Substitui auth.uid() por (select auth.uid()) em todas as policies.
-- O Postgres avalia auth.uid() uma vez por statement em vez de
-- uma vez por linha, reduzindo overhead em até 100x em tabelas grandes.
-- Fonte: Supabase oficial docs + community benchmarks.
-- ════════════════════════════════════════════════════════════════

-- ── PROFILES ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS "users_view_own_profile" ON profiles;
DROP POLICY IF EXISTS "users_update_own_profile" ON profiles;

CREATE POLICY "users_view_own_profile" ON profiles
  FOR SELECT TO authenticated USING (id = (select auth.uid()));

CREATE POLICY "users_update_own_profile" ON profiles
  FOR UPDATE TO authenticated
  USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));

-- ── XP TRANSACTIONS ───────────────────────────────────────────────
DROP POLICY IF EXISTS "users_view_own_xp" ON xp_transactions;

CREATE POLICY "users_view_own_xp" ON xp_transactions
  FOR SELECT TO authenticated USING (user_id = (select auth.uid()));

-- ── USER ACHIEVEMENTS ─────────────────────────────────────────────
DROP POLICY IF EXISTS "users_view_own_user_achievements" ON user_achievements;

CREATE POLICY "users_view_own_user_achievements" ON user_achievements
  FOR SELECT TO authenticated USING (user_id = (select auth.uid()));

-- ── HÁBITOS ───────────────────────────────────────────────────────
DROP POLICY IF EXISTS "users_full_access_own_habits" ON habits;
DROP POLICY IF EXISTS "users_full_access_own_habit_logs" ON habit_logs;

CREATE POLICY "users_full_access_own_habits" ON habits
  FOR ALL TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "users_full_access_own_habit_logs" ON habit_logs
  FOR ALL TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- ── EXERCÍCIOS ────────────────────────────────────────────────────
DROP POLICY IF EXISTS "view_global_or_own_exercises" ON exercises;
DROP POLICY IF EXISTS "users_insert_own_exercises" ON exercises;
DROP POLICY IF EXISTS "users_update_own_exercises" ON exercises;
DROP POLICY IF EXISTS "users_delete_own_exercises" ON exercises;

CREATE POLICY "view_global_or_own_exercises" ON exercises
  FOR SELECT TO authenticated
  USING (is_global = TRUE OR user_id = (select auth.uid()));

CREATE POLICY "users_insert_own_exercises" ON exercises
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid()) AND is_global = FALSE);

CREATE POLICY "users_update_own_exercises" ON exercises
  FOR UPDATE TO authenticated
  USING (user_id = (select auth.uid()) AND is_global = FALSE);

CREATE POLICY "users_delete_own_exercises" ON exercises
  FOR DELETE TO authenticated
  USING (user_id = (select auth.uid()) AND is_global = FALSE);

-- ── TREINOS ───────────────────────────────────────────────────────
DROP POLICY IF EXISTS "users_full_access_own_workouts" ON workouts;
DROP POLICY IF EXISTS "users_full_access_own_workout_sets" ON workout_sets;

CREATE POLICY "users_full_access_own_workouts" ON workouts
  FOR ALL TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "users_full_access_own_workout_sets" ON workout_sets
  FOR ALL TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- ── METAS ─────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "users_full_access_own_goals" ON goals;

CREATE POLICY "users_full_access_own_goals" ON goals
  FOR ALL TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- ── TAREFAS ───────────────────────────────────────────────────────
DROP POLICY IF EXISTS "users_full_access_own_task_lists" ON task_lists;
DROP POLICY IF EXISTS "users_full_access_own_tasks" ON tasks;
DROP POLICY IF EXISTS "users_full_access_own_subtasks" ON subtasks;

CREATE POLICY "users_full_access_own_task_lists" ON task_lists
  FOR ALL TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "users_full_access_own_tasks" ON tasks
  FOR ALL TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "users_full_access_own_subtasks" ON subtasks
  FOR ALL TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- ── FINANÇAS ──────────────────────────────────────────────────────
DROP POLICY IF EXISTS "users_full_access_own_finance_accounts" ON finance_accounts;
DROP POLICY IF EXISTS "view_global_or_own_finance_categories" ON finance_categories;
DROP POLICY IF EXISTS "users_insert_own_finance_categories" ON finance_categories;
DROP POLICY IF EXISTS "users_update_own_finance_categories" ON finance_categories;
DROP POLICY IF EXISTS "users_delete_own_finance_categories" ON finance_categories;
DROP POLICY IF EXISTS "users_full_access_own_transactions" ON transactions;
DROP POLICY IF EXISTS "users_full_access_own_finance_goals" ON finance_goals;

CREATE POLICY "users_full_access_own_finance_accounts" ON finance_accounts
  FOR ALL TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "view_global_or_own_finance_categories" ON finance_categories
  FOR SELECT TO authenticated
  USING (is_global = TRUE OR user_id = (select auth.uid()));

CREATE POLICY "users_insert_own_finance_categories" ON finance_categories
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid()) AND is_global = FALSE);

CREATE POLICY "users_update_own_finance_categories" ON finance_categories
  FOR UPDATE TO authenticated
  USING (user_id = (select auth.uid()) AND is_global = FALSE);

CREATE POLICY "users_delete_own_finance_categories" ON finance_categories
  FOR DELETE TO authenticated
  USING (user_id = (select auth.uid()) AND is_global = FALSE);

CREATE POLICY "users_full_access_own_transactions" ON transactions
  FOR ALL TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "users_full_access_own_finance_goals" ON finance_goals
  FOR ALL TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- ── CALENDÁRIO ────────────────────────────────────────────────────
DROP POLICY IF EXISTS "users_full_access_own_calendar_integrations" ON calendar_integrations;
DROP POLICY IF EXISTS "users_full_access_own_calendar_events" ON calendar_events;

CREATE POLICY "users_full_access_own_calendar_integrations" ON calendar_integrations
  FOR ALL TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "users_full_access_own_calendar_events" ON calendar_events
  FOR ALL TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- ── NOTIFICAÇÕES ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "users_view_own_notifications" ON notifications;
DROP POLICY IF EXISTS "users_update_own_notifications" ON notifications;
DROP POLICY IF EXISTS "users_full_access_own_push_subscriptions" ON push_subscriptions;

CREATE POLICY "users_view_own_notifications" ON notifications
  FOR SELECT TO authenticated USING (user_id = (select auth.uid()));

CREATE POLICY "users_update_own_notifications" ON notifications
  FOR UPDATE TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "users_full_access_own_push_subscriptions" ON push_subscriptions
  FOR ALL TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- ── COACH IA ──────────────────────────────────────────────────────
DROP POLICY IF EXISTS "users_full_access_own_ai_conversations" ON ai_conversations;
DROP POLICY IF EXISTS "users_full_access_own_ai_messages" ON ai_messages;

CREATE POLICY "users_full_access_own_ai_conversations" ON ai_conversations
  FOR ALL TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "users_full_access_own_ai_messages" ON ai_messages
  FOR ALL TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- ── MOOD LOGS (nova tabela) ────────────────────────────────────────
ALTER TABLE IF EXISTS mood_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_own_mood_logs" ON mood_logs;
CREATE POLICY "users_own_mood_logs" ON mood_logs
  FOR ALL TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- ── WATER LOGS & SLEEP LOGS ───────────────────────────────────────
-- Adiciona policies se não existirem ainda
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'water_logs' AND policyname = 'users_own_water_logs'
  ) THEN
    ALTER TABLE water_logs ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "users_own_water_logs" ON water_logs
      FOR ALL TO authenticated
      USING (user_id = (select auth.uid()))
      WITH CHECK (user_id = (select auth.uid()));
  ELSE
    DROP POLICY IF EXISTS "users_own_water_logs" ON water_logs;
    CREATE POLICY "users_own_water_logs" ON water_logs
      FOR ALL TO authenticated
      USING (user_id = (select auth.uid()))
      WITH CHECK (user_id = (select auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'sleep_logs' AND policyname = 'users_own_sleep_logs'
  ) THEN
    ALTER TABLE sleep_logs ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "users_own_sleep_logs" ON sleep_logs
      FOR ALL TO authenticated
      USING (user_id = (select auth.uid()))
      WITH CHECK (user_id = (select auth.uid()));
  ELSE
    DROP POLICY IF EXISTS "users_own_sleep_logs" ON sleep_logs;
    CREATE POLICY "users_own_sleep_logs" ON sleep_logs
      FOR ALL TO authenticated
      USING (user_id = (select auth.uid()))
      WITH CHECK (user_id = (select auth.uid()));
  END IF;
END $$;
