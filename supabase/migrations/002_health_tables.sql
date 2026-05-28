-- ════════════════════════════════════════════════════════════════
-- MIGRAÇÃO 002 — Tabelas de Saúde (water_logs + sleep_logs)
-- Execute no SQL Editor do Supabase
-- ════════════════════════════════════════════════════════════════

-- ── 1. Água ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS water_logs (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date         DATE NOT NULL DEFAULT CURRENT_DATE,
  amount_ml    INTEGER NOT NULL CHECK (amount_ml > 0),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS water_logs_user_date ON water_logs (user_id, date DESC);

-- RLS
ALTER TABLE water_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "water_logs: user owns rows" ON water_logs
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ── 2. Sono ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sleep_logs (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date           DATE NOT NULL DEFAULT CURRENT_DATE, -- dia de referência (dia acordando)
  bed_time       TIME,                               -- hora que foi dormir (pode ser dia anterior)
  wake_time      TIME,                               -- hora que acordou
  duration_hours NUMERIC(4,2),                       -- horas totais de sono
  quality        INTEGER CHECK (quality >= 1 AND quality <= 5), -- 1=péssimo, 5=ótimo
  xp_earned      INTEGER DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, date)                             -- 1 registro por dia por usuário
);

-- Índices
CREATE INDEX IF NOT EXISTS sleep_logs_user_date ON sleep_logs (user_id, date DESC);

-- RLS
ALTER TABLE sleep_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sleep_logs: user owns rows" ON sleep_logs
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
