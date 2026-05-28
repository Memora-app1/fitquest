-- ══════════════════════════════════════════════════════════════
-- Health Tracking — Sono e Hidratação
-- Rodar no Supabase SQL Editor
-- ══════════════════════════════════════════════════════════════

-- Registros de sono (1 por dia por usuário)
CREATE TABLE IF NOT EXISTS sleep_logs (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date            DATE        NOT NULL,
  bed_time        TIME,
  wake_time       TIME,
  duration_hours  NUMERIC(4,2),
  quality         SMALLINT    CHECK (quality BETWEEN 1 AND 5),
  notes           TEXT,
  xp_earned       INTEGER     NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

ALTER TABLE sleep_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sleep_logs_user_policy" ON sleep_logs
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS sleep_logs_user_date_idx ON sleep_logs(user_id, date DESC);

-- Registros de água (múltiplos por dia por usuário)
CREATE TABLE IF NOT EXISTS water_logs (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date        DATE        NOT NULL,
  amount_ml   INTEGER     NOT NULL CHECK (amount_ml > 0 AND amount_ml <= 5000),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE water_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "water_logs_user_policy" ON water_logs
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS water_logs_user_date_idx ON water_logs(user_id, date DESC);
