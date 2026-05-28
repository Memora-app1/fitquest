-- ════════════════════════════════════════════════════════════════
-- ASCENDIA — ROW LEVEL SECURITY
-- Execute DEPOIS do schema.sql
-- ════════════════════════════════════════════════════════════════

-- Habilitar RLS em todas as tabelas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;

-- ════════════════════════════════════════════════════════════════
-- PROFILES — usuário vê e edita só o próprio
-- ════════════════════════════════════════════════════════════════

CREATE POLICY "users_view_own_profile" ON profiles
  FOR SELECT TO authenticated USING (id = auth.uid());

CREATE POLICY "users_update_own_profile" ON profiles
  FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- INSERT é feito via trigger (handle_new_user), não precisa policy

-- ════════════════════════════════════════════════════════════════
-- XP TRANSACTIONS — read-only para o usuário
-- ════════════════════════════════════════════════════════════════

CREATE POLICY "users_view_own_xp" ON xp_transactions
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- INSERT só via service_role (server-side)

-- ════════════════════════════════════════════════════════════════
-- ACHIEVEMENTS — catálogo público
-- ════════════════════════════════════════════════════════════════

CREATE POLICY "everyone_view_achievements" ON achievements
  FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "users_view_own_user_achievements" ON user_achievements
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- ════════════════════════════════════════════════════════════════
-- HÁBITOS
-- ════════════════════════════════════════════════════════════════

CREATE POLICY "users_full_access_own_habits" ON habits
  FOR ALL TO authenticated 
  USING (user_id = auth.uid()) 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_full_access_own_habit_logs" ON habit_logs
  FOR ALL TO authenticated 
  USING (user_id = auth.uid()) 
  WITH CHECK (user_id = auth.uid());

-- ════════════════════════════════════════════════════════════════
-- EXERCÍCIOS — globais visíveis para todos, próprios CRUD livre
-- ════════════════════════════════════════════════════════════════

CREATE POLICY "view_global_or_own_exercises" ON exercises
  FOR SELECT TO authenticated 
  USING (is_global = TRUE OR user_id = auth.uid());

CREATE POLICY "users_insert_own_exercises" ON exercises
  FOR INSERT TO authenticated 
  WITH CHECK (user_id = auth.uid() AND is_global = FALSE);

CREATE POLICY "users_update_own_exercises" ON exercises
  FOR UPDATE TO authenticated 
  USING (user_id = auth.uid() AND is_global = FALSE);

CREATE POLICY "users_delete_own_exercises" ON exercises
  FOR DELETE TO authenticated 
  USING (user_id = auth.uid() AND is_global = FALSE);

-- ════════════════════════════════════════════════════════════════
-- TREINOS
-- ════════════════════════════════════════════════════════════════

CREATE POLICY "users_full_access_own_workouts" ON workouts
  FOR ALL TO authenticated 
  USING (user_id = auth.uid()) 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_full_access_own_workout_sets" ON workout_sets
  FOR ALL TO authenticated 
  USING (user_id = auth.uid()) 
  WITH CHECK (user_id = auth.uid());

-- ════════════════════════════════════════════════════════════════
-- METAS
-- ════════════════════════════════════════════════════════════════

CREATE POLICY "users_full_access_own_goals" ON goals
  FOR ALL TO authenticated 
  USING (user_id = auth.uid()) 
  WITH CHECK (user_id = auth.uid());

-- ════════════════════════════════════════════════════════════════
-- TAREFAS
-- ════════════════════════════════════════════════════════════════

CREATE POLICY "users_full_access_own_task_lists" ON task_lists
  FOR ALL TO authenticated 
  USING (user_id = auth.uid()) 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_full_access_own_tasks" ON tasks
  FOR ALL TO authenticated 
  USING (user_id = auth.uid()) 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_full_access_own_subtasks" ON subtasks
  FOR ALL TO authenticated 
  USING (user_id = auth.uid()) 
  WITH CHECK (user_id = auth.uid());

-- ════════════════════════════════════════════════════════════════
-- FINANÇAS
-- ════════════════════════════════════════════════════════════════

CREATE POLICY "users_full_access_own_finance_accounts" ON finance_accounts
  FOR ALL TO authenticated 
  USING (user_id = auth.uid()) 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "view_global_or_own_finance_categories" ON finance_categories
  FOR SELECT TO authenticated 
  USING (is_global = TRUE OR user_id = auth.uid());

CREATE POLICY "users_insert_own_finance_categories" ON finance_categories
  FOR INSERT TO authenticated 
  WITH CHECK (user_id = auth.uid() AND is_global = FALSE);

CREATE POLICY "users_update_own_finance_categories" ON finance_categories
  FOR UPDATE TO authenticated 
  USING (user_id = auth.uid() AND is_global = FALSE);

CREATE POLICY "users_delete_own_finance_categories" ON finance_categories
  FOR DELETE TO authenticated 
  USING (user_id = auth.uid() AND is_global = FALSE);

CREATE POLICY "users_full_access_own_transactions" ON transactions
  FOR ALL TO authenticated 
  USING (user_id = auth.uid()) 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_full_access_own_finance_goals" ON finance_goals
  FOR ALL TO authenticated 
  USING (user_id = auth.uid()) 
  WITH CHECK (user_id = auth.uid());

-- ════════════════════════════════════════════════════════════════
-- CALENDÁRIO
-- ════════════════════════════════════════════════════════════════

CREATE POLICY "users_full_access_own_calendar_integrations" ON calendar_integrations
  FOR ALL TO authenticated 
  USING (user_id = auth.uid()) 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_full_access_own_calendar_events" ON calendar_events
  FOR ALL TO authenticated 
  USING (user_id = auth.uid()) 
  WITH CHECK (user_id = auth.uid());

-- ════════════════════════════════════════════════════════════════
-- NOTIFICAÇÕES
-- ════════════════════════════════════════════════════════════════

CREATE POLICY "users_view_own_notifications" ON notifications
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "users_update_own_notifications" ON notifications
  FOR UPDATE TO authenticated 
  USING (user_id = auth.uid()) 
  WITH CHECK (user_id = auth.uid());

-- INSERT só via service_role

CREATE POLICY "users_full_access_own_push_subscriptions" ON push_subscriptions
  FOR ALL TO authenticated 
  USING (user_id = auth.uid()) 
  WITH CHECK (user_id = auth.uid());

-- ════════════════════════════════════════════════════════════════
-- COACH IA
-- ════════════════════════════════════════════════════════════════

CREATE POLICY "users_full_access_own_ai_conversations" ON ai_conversations
  FOR ALL TO authenticated 
  USING (user_id = auth.uid()) 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_full_access_own_ai_messages" ON ai_messages
  FOR ALL TO authenticated 
  USING (user_id = auth.uid()) 
  WITH CHECK (user_id = auth.uid());

-- ════════════════════════════════════════════════════════════════
-- ✅ RLS configurado. Execute agora seed.sql
-- ════════════════════════════════════════════════════════════════
