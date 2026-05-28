-- Registros de humor/energia/estresse diários
CREATE TABLE IF NOT EXISTS mood_logs (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date         DATE NOT NULL,
  mood         SMALLINT NOT NULL CHECK (mood BETWEEN 1 AND 5),
  energy       SMALLINT NOT NULL CHECK (energy BETWEEN 1 AND 5),
  stress       SMALLINT NOT NULL CHECK (stress BETWEEN 1 AND 5),
  note         TEXT,
  xp_earned    SMALLINT NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, date)
);

ALTER TABLE mood_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_mood_logs" ON mood_logs
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_mood_logs_user_date
  ON mood_logs(user_id, date DESC);

CREATE TRIGGER set_mood_logs_updated_at
  BEFORE UPDATE ON mood_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
