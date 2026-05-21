-- ════════════════════════════════════════════════════════════════
-- FITQUEST — SCHEMA COMPLETO
-- Execute este arquivo PRIMEIRO no SQL Editor do Supabase
-- ════════════════════════════════════════════════════════════════

-- Extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- para search por texto

-- ════════════════════════════════════════════════════════════════
-- 1. PROFILES (perfil do usuário + gamificação + assinatura)
-- ════════════════════════════════════════════════════════════════

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  timezone TEXT DEFAULT 'America/Sao_Paulo',
  
  -- Gamificação
  xp_total INTEGER DEFAULT 0 NOT NULL,
  level INTEGER DEFAULT 1 NOT NULL,
  streak_current INTEGER DEFAULT 0 NOT NULL,
  streak_longest INTEGER DEFAULT 0 NOT NULL,
  perfect_days INTEGER DEFAULT 0 NOT NULL,
  last_activity_date DATE,
  
  -- Assinatura
  subscription_status TEXT DEFAULT 'trial' NOT NULL,
    -- trial | active | cancelled | expired | lifetime
  subscription_plan TEXT, -- monthly | annual | lifetime
  subscription_started_at TIMESTAMPTZ,
  subscription_end TIMESTAMPTZ,
  trial_end TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  mp_subscription_id TEXT,
  mp_customer_id TEXT,
  
  -- Onboarding
  onboarding_completed BOOLEAN DEFAULT FALSE,
  primary_goal TEXT, -- lose_weight | gain_muscle | consistency | health | productivity
  weekly_target INTEGER DEFAULT 4, -- dias/semana que quer ser ativo
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ════════════════════════════════════════════════════════════════
-- 2. SISTEMA DE XP (ledger imutável)
-- ════════════════════════════════════════════════════════════════

CREATE TABLE xp_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  source_type TEXT, -- habit | workout | task | transaction | goal | achievement | streak
  source_id UUID,
  xp_total_after INTEGER NOT NULL,
  level_after INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ════════════════════════════════════════════════════════════════
-- 3. CONQUISTAS
-- ════════════════════════════════════════════════════════════════

CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT NOT NULL, -- fitness | productivity | finance | streak | level
  xp_reward INTEGER DEFAULT 0,
  rarity TEXT DEFAULT 'common', -- common | rare | epic | legendary
  trigger_type TEXT NOT NULL, -- streak | count | milestone | first
  trigger_value INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_achievements (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES achievements(id),
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, achievement_id)
);

-- ════════════════════════════════════════════════════════════════
-- 4. HÁBITOS
-- ════════════════════════════════════════════════════════════════

CREATE TABLE habits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL DEFAULT '✓',
  color TEXT NOT NULL DEFAULT '#FF4D00',
  category TEXT NOT NULL DEFAULT 'custom',
    -- strength | cardio | flexibility | nutrition | sleep | mindfulness | custom
  
  -- Meta
  target_type TEXT NOT NULL DEFAULT 'count', -- count | km | minutes | custom
  target_value NUMERIC NOT NULL DEFAULT 1,
  target_period TEXT NOT NULL DEFAULT 'year', -- year | month | week | day
  target_unit TEXT, -- "treinos", "km", "minutos"
  
  -- Frequência desejada
  frequency_per_week INTEGER DEFAULT 7, -- quantas vezes/semana
  reminder_time TIME, -- horário do lembrete diário
  
  xp_per_completion INTEGER DEFAULT 50,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE habit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  logged_date DATE NOT NULL DEFAULT CURRENT_DATE,
  value NUMERIC DEFAULT 1,
  note TEXT,
  xp_earned INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(habit_id, logged_date)
);

-- ════════════════════════════════════════════════════════════════
-- 5. TREINOS
-- ════════════════════════════════════════════════════════════════

CREATE TABLE exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  muscle_group TEXT NOT NULL,
    -- chest | back | legs | shoulders | arms | core | cardio | full_body
  equipment TEXT, -- barbell | dumbbell | machine | bodyweight | cable | kettlebell
  instructions TEXT,
  video_url TEXT,
  is_global BOOLEAN DEFAULT FALSE, -- TRUE = catálogo padrão
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE workouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  title TEXT NOT NULL,
  notes TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  
  total_volume_kg NUMERIC DEFAULT 0,
  total_sets INTEGER DEFAULT 0,
  total_reps INTEGER DEFAULT 0,
  
  xp_earned INTEGER DEFAULT 0,
  is_personal_record_session BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE workout_sets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_id UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  set_number INTEGER NOT NULL,
  reps INTEGER,
  weight_kg NUMERIC,
  duration_seconds INTEGER,
  distance_km NUMERIC,
  rpe INTEGER CHECK (rpe BETWEEN 1 AND 10),
  
  is_personal_record BOOLEAN DEFAULT FALSE,
  is_warmup BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ════════════════════════════════════════════════════════════════
-- 6. METAS (fitness/produtividade — financeiras tem tabela própria)
-- ════════════════════════════════════════════════════════════════

CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  category TEXT DEFAULT 'fitness', -- fitness | productivity | personal | health
  
  target_value NUMERIC NOT NULL,
  current_value NUMERIC DEFAULT 0,
  unit TEXT NOT NULL,
  
  deadline DATE,
  status TEXT DEFAULT 'active', -- active | completed | cancelled | paused
  completed_at TIMESTAMPTZ,
  
  linked_habit_id UUID REFERENCES habits(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ════════════════════════════════════════════════════════════════
-- 7. TAREFAS (Kanban + Eisenhower)
-- ════════════════════════════════════════════════════════════════

CREATE TABLE task_lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#7C3AED',
  icon TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  list_id UUID REFERENCES task_lists(id) ON DELETE SET NULL,
  
  title TEXT NOT NULL,
  description TEXT,
  
  -- Kanban
  status TEXT NOT NULL DEFAULT 'todo',
    -- todo | doing | done | archived
  display_order INTEGER DEFAULT 0,
  
  -- Matriz Eisenhower
  urgent BOOLEAN DEFAULT FALSE,
  important BOOLEAN DEFAULT FALSE,
  
  -- Tempo
  due_date TIMESTAMPTZ,
  reminder_at TIMESTAMPTZ,
  estimated_minutes INTEGER,
  completed_at TIMESTAMPTZ,
  
  -- Integração externa
  google_event_id TEXT,
  
  -- Recorrência
  recurrence_rule TEXT, -- iCal RRULE
  parent_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  
  -- Gamificação
  xp_reward INTEGER DEFAULT 30,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE subtasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ════════════════════════════════════════════════════════════════
-- 8. FINANÇAS
-- ════════════════════════════════════════════════════════════════

CREATE TABLE finance_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- checking | savings | credit_card | cash | investment
  icon TEXT DEFAULT '🏦',
  color TEXT DEFAULT '#7C3AED',
  current_balance NUMERIC DEFAULT 0,
  credit_limit NUMERIC,
  closing_day INTEGER, -- dia fechamento fatura (cartão)
  due_day INTEGER, -- dia vencimento fatura (cartão)
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE finance_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- expense | income
  icon TEXT,
  color TEXT,
  is_global BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES finance_accounts(id) ON DELETE CASCADE,
  category_id UUID REFERENCES finance_categories(id) ON DELETE SET NULL,
  
  amount NUMERIC NOT NULL,
  type TEXT NOT NULL, -- expense | income | transfer
  description TEXT NOT NULL,
  notes TEXT,
  
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Parcelamento
  is_installment BOOLEAN DEFAULT FALSE,
  installment_current INTEGER,
  installment_total INTEGER,
  installment_group_id UUID,
  
  -- Recorrência
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_rule TEXT,
  parent_transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  
  -- Status
  is_paid BOOLEAN DEFAULT TRUE,
  paid_at TIMESTAMPTZ,
  
  -- Para transferências
  transfer_to_account_id UUID REFERENCES finance_accounts(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE finance_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  icon TEXT DEFAULT '🎯',
  color TEXT DEFAULT '#00FF88',
  target_amount NUMERIC NOT NULL,
  current_amount NUMERIC DEFAULT 0,
  deadline DATE,
  monthly_target NUMERIC,
  status TEXT DEFAULT 'active', -- active | completed | cancelled
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ════════════════════════════════════════════════════════════════
-- 9. CALENDÁRIO (eventos + integração Google)
-- ════════════════════════════════════════════════════════════════

CREATE TABLE calendar_integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL, -- google | outlook | apple
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ,
  scope TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE calendar_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  all_day BOOLEAN DEFAULT FALSE,
  
  source TEXT DEFAULT 'fitquest', -- fitquest | google | outlook
  external_id TEXT,
  integration_id UUID REFERENCES calendar_integrations(id) ON DELETE CASCADE,
  
  color TEXT DEFAULT '#7C3AED',
  is_read_only BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ════════════════════════════════════════════════════════════════
-- 10. NOTIFICAÇÕES (Web Push)
-- ════════════════════════════════════════════════════════════════

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  icon TEXT,
  
  type TEXT NOT NULL,
    -- task_reminder | habit_reminder | streak_alert | xp_milestone 
    -- | finance_due | coach_insight | achievement
  source_id UUID,
  
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  
  action_url TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint TEXT UNIQUE NOT NULL,
  keys_p256dh TEXT NOT NULL,
  keys_auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ════════════════════════════════════════════════════════════════
-- 11. COACH IA
-- ════════════════════════════════════════════════════════════════

CREATE TABLE ai_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ai_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  
  context_snapshot JSONB,
  tokens_used INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ════════════════════════════════════════════════════════════════
-- 12. ÍNDICES DE PERFORMANCE
-- ════════════════════════════════════════════════════════════════

CREATE INDEX idx_profiles_subscription ON profiles(subscription_status);
CREATE INDEX idx_xp_transactions_user ON xp_transactions(user_id, created_at DESC);
CREATE INDEX idx_habits_user_active ON habits(user_id, is_active, display_order);
CREATE INDEX idx_habit_logs_user_date ON habit_logs(user_id, logged_date DESC);
CREATE INDEX idx_habit_logs_habit ON habit_logs(habit_id, logged_date DESC);
CREATE INDEX idx_workouts_user ON workouts(user_id, started_at DESC);
CREATE INDEX idx_workout_sets_workout ON workout_sets(workout_id);
CREATE INDEX idx_workout_sets_pr ON workout_sets(user_id, exercise_id, weight_kg DESC) 
  WHERE is_personal_record = TRUE;
CREATE INDEX idx_goals_user_status ON goals(user_id, status);
CREATE INDEX idx_tasks_user_status ON tasks(user_id, status, display_order);
CREATE INDEX idx_tasks_user_due ON tasks(user_id, due_date) 
  WHERE completed_at IS NULL;
CREATE INDEX idx_tasks_eisenhower ON tasks(user_id, urgent, important) 
  WHERE completed_at IS NULL;
CREATE INDEX idx_subtasks_task ON subtasks(task_id, display_order);
CREATE INDEX idx_transactions_user_date ON transactions(user_id, transaction_date DESC);
CREATE INDEX idx_transactions_unpaid ON transactions(user_id, transaction_date) 
  WHERE is_paid = FALSE;
CREATE INDEX idx_transactions_installment ON transactions(installment_group_id) 
  WHERE installment_group_id IS NOT NULL;
CREATE INDEX idx_finance_accounts_user ON finance_accounts(user_id, is_active);
CREATE INDEX idx_finance_goals_user ON finance_goals(user_id, status);
CREATE INDEX idx_calendar_events_user_range ON calendar_events(user_id, start_at, end_at);
CREATE INDEX idx_notifications_pending ON notifications(scheduled_for) 
  WHERE sent_at IS NULL;
CREATE INDEX idx_notifications_user ON notifications(user_id, scheduled_for DESC);
CREATE INDEX idx_ai_messages_conv ON ai_messages(conversation_id, created_at ASC);
CREATE INDEX idx_ai_conversations_user ON ai_conversations(user_id, last_message_at DESC);
CREATE INDEX idx_exercises_global ON exercises(is_global) WHERE is_global = TRUE;
CREATE INDEX idx_exercises_user ON exercises(user_id) WHERE user_id IS NOT NULL;

-- ════════════════════════════════════════════════════════════════
-- 13. FUNCTIONS & TRIGGERS
-- ════════════════════════════════════════════════════════════════

-- Trigger para updated_at automático
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_habits_updated_at BEFORE UPDATE ON habits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_goals_updated_at BEFORE UPDATE ON goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_transactions_updated_at BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_calendar_events_updated_at BEFORE UPDATE ON calendar_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger: criar profile automaticamente ao criar auth.user
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function: calcula level a partir do XP total
CREATE OR REPLACE FUNCTION calculate_level(xp INTEGER)
RETURNS INTEGER AS $$
BEGIN
  IF xp >= 35000 THEN RETURN 8;
  ELSIF xp >= 20000 THEN RETURN 7;
  ELSIF xp >= 12000 THEN RETURN 6;
  ELSIF xp >= 7000 THEN RETURN 5;
  ELSIF xp >= 3500 THEN RETURN 4;
  ELSIF xp >= 1500 THEN RETURN 3;
  ELSIF xp >= 500 THEN RETURN 2;
  ELSE RETURN 1;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ════════════════════════════════════════════════════════════════
-- ✅ Schema completo. Execute agora rls.sql e depois seed.sql
-- ════════════════════════════════════════════════════════════════
