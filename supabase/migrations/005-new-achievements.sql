-- ════════════════════════════════════════════════════════════════
-- ASCENDIA — Novas Conquistas (v2)
-- Execute no Supabase SQL Editor
-- ════════════════════════════════════════════════════════════════

-- Conquistas de hábitos acumulados
INSERT INTO achievements (slug, name, description, icon, category, xp_reward, rarity, trigger_type, trigger_value)
VALUES
  ('habits_100',  'Centenário',       '100 registros de hábitos no total',     '💯', 'fitness', 300,  'rare',      'count', 100),
  ('habits_500',  'Meio Milhar',      '500 registros de hábitos no total',     '🌿', 'fitness', 800,  'epic',      'count', 500),
  ('habits_1000', 'Mestre dos Hábitos', '1000 registros de hábitos',           '🔮', 'fitness', 2000, 'legendary', 'count', 1000)
ON CONFLICT (slug) DO NOTHING;

-- Conquistas de subtarefas
INSERT INTO achievements (slug, name, description, icon, category, xp_reward, rarity, trigger_type, trigger_value)
VALUES
  ('first_subtask', 'Dividir para Conquistar', 'Completou sua primeira subtarefa', '📋', 'productivity', 50, 'common', 'first', 1),
  ('subtasks_50',   'Detalhista',              '50 subtarefas concluídas',         '🔩', 'productivity', 200, 'common', 'count', 50)
ON CONFLICT (slug) DO NOTHING;

-- Conquistas de saúde
INSERT INTO achievements (slug, name, description, icon, category, xp_reward, rarity, trigger_type, trigger_value)
VALUES
  ('first_water_goal',  'Hidratado',       'Atingiu a meta de água pela 1ª vez',   '💧', 'fitness', 50,  'common', 'first', 1),
  ('water_goal_7',      'Fonte Natural',   'Meta de água por 7 dias seguidos',     '🌊', 'fitness', 300, 'rare',   'count', 7),
  ('first_sleep_log',   'Sono Consciente', 'Registrou seu sono pela 1ª vez',       '😴', 'fitness', 50,  'common', 'first', 1),
  ('first_mood_checkin','Autoconhecimento','Fez seu primeiro check-in de humor',   '🧠', 'fitness', 30,  'common', 'first', 1)
ON CONFLICT (slug) DO NOTHING;

-- Conquistas de metas pessoais
INSERT INTO achievements (slug, name, description, icon, category, xp_reward, rarity, trigger_type, trigger_value)
VALUES
  ('first_goal', 'Visionário', 'Criou sua primeira meta pessoal', '🎯', 'productivity', 100, 'common', 'first', 1),
  ('goals_5',    'Ambicioso',  '5 metas pessoais concluídas',    '🏅', 'productivity', 400, 'rare',   'count', 5)
ON CONFLICT (slug) DO NOTHING;

-- Conquistas financeiras extras
INSERT INTO achievements (slug, name, description, icon, category, xp_reward, rarity, trigger_type, trigger_value)
VALUES
  ('transactions_50',  'Organizado',        '50 transações registradas',        '📊', 'finance', 200, 'common', 'count', 50),
  ('transactions_200', 'Controle Total',    '200 transações registradas',       '💼', 'finance', 600, 'rare',   'count', 200),
  ('finance_goals_3',  'Poupador Dedicado', '3 metas financeiras concluídas',   '🏦', 'finance', 800, 'rare',   'count', 3)
ON CONFLICT (slug) DO NOTHING;

-- Conquistas de treinos extras
INSERT INTO achievements (slug, name, description, icon, category, xp_reward, rarity, trigger_type, trigger_value)
VALUES
  ('workouts_200', 'Elite Fitness', '200 treinos completados', '🦅', 'fitness', 2000, 'epic', 'count', 200),
  ('workouts_500', 'Lenda do Treino', '500 treinos completados', '⚡', 'fitness', 5000, 'legendary', 'count', 500)
ON CONFLICT (slug) DO NOTHING;
