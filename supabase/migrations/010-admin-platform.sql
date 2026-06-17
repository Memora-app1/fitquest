-- ════════════════════════════════════════════════════════════════════════════
-- 010-admin-platform.sql
-- Admin Platform: roles, audit log, feature flags, banners, broadcasts,
--                 user notes, suspensions, reports, metrics snapshots
-- Execute no Supabase SQL Editor
-- ════════════════════════════════════════════════════════════════════════════

-- ════════ 1. PAPÉIS ADMINISTRATIVOS ════════

CREATE TABLE IF NOT EXISTS admin_roles (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       text        NOT NULL CHECK (role IN ('super_admin','admin','moderator','support','analyst')),
  granted_by uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  granted_at timestamptz NOT NULL DEFAULT now(),
  notes      text,
  UNIQUE (user_id)
);

ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_roles_service_only" ON admin_roles;
CREATE POLICY "admin_roles_service_only" ON admin_roles
  FOR ALL USING (false);

CREATE INDEX IF NOT EXISTS idx_admin_roles_user ON admin_roles(user_id);

-- ════════ 2. AUDIT LOG ════════

CREATE TABLE IF NOT EXISTS audit_logs (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_role  text        NOT NULL,
  action      text        NOT NULL,
  -- Exemplos: user.suspend, user.xp_grant, user.ban, feature_flag.toggle,
  --           season.create, achievement.edit, broadcast.send, banner.create
  target_type text,        -- user | guild | season | achievement | feature_flag | broadcast
  target_id   text,        -- UUID ou slug do alvo
  payload     jsonb,       -- dados antes/depois da ação
  ip_address  inet,
  user_agent  text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "audit_logs_service_only" ON audit_logs;
CREATE POLICY "audit_logs_service_only" ON audit_logs FOR ALL USING (false);

CREATE INDEX IF NOT EXISTS idx_audit_logs_admin    ON audit_logs(admin_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action   ON audit_logs(action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target   ON audit_logs(target_type, target_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_time     ON audit_logs(created_at DESC);

-- ════════ 3. FEATURE FLAGS ════════

CREATE TABLE IF NOT EXISTS feature_flags (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         text        NOT NULL UNIQUE,
  name         text        NOT NULL,
  description  text,
  enabled      boolean     NOT NULL DEFAULT false,
  -- Rollout gradual: null = todos, 0-100 = percentual de usuários
  rollout_pct  integer     CHECK (rollout_pct BETWEEN 0 AND 100),
  -- Segmentação: null = todos
  segment      text,       -- trial | active | lifetime | level_gte_3 | etc.
  created_by   uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by   uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "feature_flags_read"  ON feature_flags;
DROP POLICY IF EXISTS "feature_flags_admin" ON feature_flags;
CREATE POLICY "feature_flags_read" ON feature_flags FOR SELECT TO authenticated USING (true);
CREATE POLICY "feature_flags_admin" ON feature_flags FOR ALL USING (false);

INSERT INTO feature_flags (slug, name, description, enabled) VALUES
  ('coach_v3',        'Coach IA v3',                'Nova versão do coach com contexto expandido',   false),
  ('social_feed',     'Feed Social',                'Feed de atividades entre amigos',               false),
  ('challenges_v2',   'Desafios V2',                'Sistema de desafios em grupo',                  false),
  ('finance_import',  'Importar Extrato',           'Upload de CSV bancário',                        false),
  ('workout_ai',      'Sugestão de Treino por IA',  'IA sugere treino baseado no histórico',         false)
ON CONFLICT (slug) DO NOTHING;

-- ════════ 4. BANNERS IN-APP ════════

CREATE TABLE IF NOT EXISTS app_banners (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title        text        NOT NULL,
  body         text        NOT NULL,
  cta_label    text,
  cta_url      text,
  -- Segmentação
  target_plan  text[],     -- ['trial','active','lifetime'] ou null para todos
  target_level integer,    -- nível mínimo ou null
  -- Visual
  color_from   text        NOT NULL DEFAULT '#FF4D00',
  color_to     text        NOT NULL DEFAULT '#7C3AED',
  emoji        text        NOT NULL DEFAULT '📣',
  -- Controle
  is_active    boolean     NOT NULL DEFAULT false,
  priority     integer     NOT NULL DEFAULT 0,
  starts_at    timestamptz,
  ends_at      timestamptz,
  -- Quem dispensou (para não mostrar novamente)
  dismissible  boolean     NOT NULL DEFAULT true,
  created_by   uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS banner_dismissals (
  banner_id uuid NOT NULL REFERENCES app_banners(id) ON DELETE CASCADE,
  user_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dismissed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (banner_id, user_id)
);

ALTER TABLE app_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE banner_dismissals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "banners_read_active"   ON app_banners;
DROP POLICY IF EXISTS "banners_admin"          ON app_banners;
DROP POLICY IF EXISTS "banner_dismissals_own"  ON banner_dismissals;
CREATE POLICY "banners_read_active" ON app_banners FOR SELECT TO authenticated
  USING (is_active = true AND (starts_at IS NULL OR starts_at <= now()) AND (ends_at IS NULL OR ends_at >= now()));
CREATE POLICY "banners_admin" ON app_banners FOR ALL USING (false);
CREATE POLICY "banner_dismissals_own" ON banner_dismissals
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_banners_active ON app_banners(is_active, priority DESC) WHERE is_active = true;

-- ════════ 5. BROADCAST DE NOTIFICAÇÕES ════════

CREATE TABLE IF NOT EXISTS broadcast_campaigns (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title           text        NOT NULL,
  push_title      text        NOT NULL,
  push_body       text        NOT NULL,
  push_icon       text,
  push_url        text,
  -- Segmentação
  target_segment  text        NOT NULL DEFAULT 'all',
  -- all | trial | active | lifetime | level_gte_N | streak_active | at_risk
  target_count    integer,    -- quantos usuários atingidos (calculado ao enviar)
  -- Status
  status          text        NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','scheduled','sending','sent','failed')),
  scheduled_for   timestamptz,
  sent_at         timestamptz,
  sent_count      integer     NOT NULL DEFAULT 0,
  failed_count    integer     NOT NULL DEFAULT 0,
  -- Tracking
  created_by      uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE broadcast_campaigns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "broadcast_service_only" ON broadcast_campaigns;
CREATE POLICY "broadcast_service_only" ON broadcast_campaigns FOR ALL USING (false);

CREATE INDEX IF NOT EXISTS idx_broadcast_status ON broadcast_campaigns(status, scheduled_for);

-- ════════ 6. NOTAS ADMIN SOBRE USUÁRIOS ════════

CREATE TABLE IF NOT EXISTS user_admin_notes (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  admin_id   uuid        NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  note       text        NOT NULL,
  is_pinned  boolean     NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE user_admin_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_admin_notes_service_only" ON user_admin_notes;
CREATE POLICY "user_admin_notes_service_only" ON user_admin_notes FOR ALL USING (false);

CREATE INDEX IF NOT EXISTS idx_admin_notes_user ON user_admin_notes(user_id, created_at DESC);

-- ════════ 7. SUSPENSÕES DE USUÁRIOS ════════

CREATE TABLE IF NOT EXISTS user_suspensions (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  admin_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  reason      text        NOT NULL,
  type        text        NOT NULL CHECK (type IN ('temporary','permanent')),
  starts_at   timestamptz NOT NULL DEFAULT now(),
  ends_at     timestamptz,          -- null = permanente
  lifted_at   timestamptz,          -- quando foi levantada manualmente
  lifted_by   uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE user_suspensions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "suspensions_service_only" ON user_suspensions;
CREATE POLICY "suspensions_service_only" ON user_suspensions FOR ALL USING (false);

-- Campo na tabela profiles para suspension_status rápido
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_suspended       boolean     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS suspended_until    timestamptz,
  ADD COLUMN IF NOT EXISTS suspension_reason  text;

CREATE INDEX IF NOT EXISTS idx_suspensions_user ON user_suspensions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_suspended ON profiles(is_suspended) WHERE is_suspended = true;

-- ════════ 8. DENÚNCIAS / REPORTS ════════

CREATE TABLE IF NOT EXISTS user_reports (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason          text        NOT NULL CHECK (reason IN (
    'spam','harassment','inappropriate_content','fake_account','cheating','other'
  )),
  description     text,
  status          text        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','reviewing','resolved','dismissed')),
  -- Resolução
  resolved_by     uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  resolution_note text,
  resolved_at     timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE user_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reports_insert"   ON user_reports;
DROP POLICY IF EXISTS "reports_read_own" ON user_reports;
DROP POLICY IF EXISTS "reports_service"  ON user_reports;
CREATE POLICY "reports_insert" ON user_reports FOR INSERT TO authenticated
  WITH CHECK (reporter_id = auth.uid());
CREATE POLICY "reports_read_own" ON user_reports FOR SELECT TO authenticated
  USING (reporter_id = auth.uid());
CREATE POLICY "reports_service" ON user_reports FOR ALL USING (false);

CREATE INDEX IF NOT EXISTS idx_reports_status    ON user_reports(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_reported  ON user_reports(reported_id);

-- ════════ 9. SNAPSHOTS DIÁRIOS DE MÉTRICAS ════════

CREATE TABLE IF NOT EXISTS metrics_daily (
  id              uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  date            date    NOT NULL UNIQUE,
  -- Usuários
  total_users     integer NOT NULL DEFAULT 0,
  new_users       integer NOT NULL DEFAULT 0,
  dau             integer NOT NULL DEFAULT 0,    -- distinct users with habit_log today
  trial_users     integer NOT NULL DEFAULT 0,
  active_users    integer NOT NULL DEFAULT 0,    -- subscription = active
  expired_users   integer NOT NULL DEFAULT 0,
  -- Engajamento
  habits_logged   integer NOT NULL DEFAULT 0,
  workouts_done   integer NOT NULL DEFAULT 0,
  tasks_completed integer NOT NULL DEFAULT 0,
  xp_granted      bigint  NOT NULL DEFAULT 0,
  -- Gamificação
  streak_freezes_used  integer NOT NULL DEFAULT 0,
  achievements_earned  integer NOT NULL DEFAULT 0,
  loot_boxes_opened    integer NOT NULL DEFAULT 0,
  -- Receita (estimada — Stripe é a fonte de verdade)
  mrr_cents       bigint  NOT NULL DEFAULT 0,
  new_subs        integer NOT NULL DEFAULT 0,
  churned_subs    integer NOT NULL DEFAULT 0,
  -- Referral
  referrals_made  integer NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE metrics_daily ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "metrics_service_only" ON metrics_daily;
CREATE POLICY "metrics_service_only" ON metrics_daily FOR ALL USING (false);

CREATE INDEX IF NOT EXISTS idx_metrics_date ON metrics_daily(date DESC);

-- ════════ 10. XP MANUAL / AJUSTES ADMIN ════════
-- (reutiliza xp_transactions, mas com source_type = 'admin_grant' / 'admin_deduct')

-- ════════ 11. ÍNDICES EXTRAS EM PROFILES PARA ADMIN QUERIES ════════

CREATE INDEX IF NOT EXISTS idx_profiles_created_at  ON profiles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_level        ON profiles(level DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_xp           ON profiles(xp_total DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_streak       ON profiles(streak_current DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_trial_end    ON profiles(trial_end) WHERE subscription_status = 'trial';

-- ════════ 12. RPC: SNAPSHOT DIÁRIO DE MÉTRICAS ════════

CREATE OR REPLACE FUNCTION snapshot_daily_metrics(p_date date DEFAULT CURRENT_DATE - 1)
RETURNS void AS $$
DECLARE
  v_total_users     integer;
  v_new_users       integer;
  v_dau             integer;
  v_trial_users     integer;
  v_active_users    integer;
  v_expired_users   integer;
  v_habits_logged   integer;
  v_workouts_done   integer;
  v_tasks_completed integer;
  v_xp_granted      bigint;
  v_achievements    integer;
  v_loot_opened     integer;
BEGIN
  SELECT COUNT(*) INTO v_total_users FROM profiles WHERE created_at::date <= p_date;
  SELECT COUNT(*) INTO v_new_users   FROM profiles WHERE created_at::date = p_date;
  SELECT COUNT(*) INTO v_trial_users FROM profiles WHERE subscription_status = 'trial';
  SELECT COUNT(*) INTO v_active_users FROM profiles WHERE subscription_status IN ('active','lifetime');
  SELECT COUNT(*) INTO v_expired_users FROM profiles WHERE subscription_status = 'expired';

  SELECT COUNT(DISTINCT user_id) INTO v_dau
  FROM habit_logs WHERE logged_date = p_date;

  SELECT COUNT(*) INTO v_habits_logged
  FROM habit_logs WHERE logged_date = p_date;

  SELECT COUNT(*) INTO v_workouts_done
  FROM workouts WHERE started_at::date = p_date;

  SELECT COUNT(*) INTO v_tasks_completed
  FROM tasks WHERE completed_at::date = p_date;

  SELECT COALESCE(SUM(amount), 0) INTO v_xp_granted
  FROM xp_transactions WHERE created_at::date = p_date;

  SELECT COUNT(*) INTO v_achievements
  FROM user_achievements WHERE unlocked_at::date = p_date;

  SELECT COUNT(*) INTO v_loot_opened
  FROM daily_loot WHERE opened_at::date = p_date;

  INSERT INTO metrics_daily (
    date, total_users, new_users, dau,
    trial_users, active_users, expired_users,
    habits_logged, workouts_done, tasks_completed,
    xp_granted, achievements_earned, loot_boxes_opened
  ) VALUES (
    p_date, v_total_users, v_new_users, v_dau,
    v_trial_users, v_active_users, v_expired_users,
    v_habits_logged, v_workouts_done, v_tasks_completed,
    v_xp_granted, v_achievements, v_loot_opened
  )
  ON CONFLICT (date) DO UPDATE SET
    total_users          = EXCLUDED.total_users,
    new_users            = EXCLUDED.new_users,
    dau                  = EXCLUDED.dau,
    trial_users          = EXCLUDED.trial_users,
    active_users         = EXCLUDED.active_users,
    expired_users        = EXCLUDED.expired_users,
    habits_logged        = EXCLUDED.habits_logged,
    workouts_done        = EXCLUDED.workouts_done,
    tasks_completed      = EXCLUDED.tasks_completed,
    xp_granted           = EXCLUDED.xp_granted,
    achievements_earned  = EXCLUDED.achievements_earned,
    loot_boxes_opened    = EXCLUDED.loot_boxes_opened;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ════════ FIM — execute agora src/app/admin/ ════════
