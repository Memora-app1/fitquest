-- ════════════════════════════════════════════════════════════════
-- ASCENDIA — Backend Hardening v1
-- Race conditions, escalabilidade do cron, RLS de saúde, índices
-- Execute no Supabase SQL Editor após 007-storage-buckets.sql
-- ════════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────────
-- 1. grant_xp_atomic
--    Atualiza xp_total + level e insere no ledger em uma única
--    transação com FOR UPDATE no profile row.
--    Parâmetros OUT → Supabase retorna objeto único, não array.
-- ────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION grant_xp_atomic(
  p_user_id     UUID,
  p_amount      INTEGER,
  p_reason      TEXT    DEFAULT '',
  p_source_type TEXT    DEFAULT NULL,
  p_source_id   UUID    DEFAULT NULL,
  OUT xp_before      INTEGER,
  OUT xp_total_after INTEGER,
  OUT level_old      INTEGER,
  OUT level_new      INTEGER,
  OUT leveled_up     BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- FOR UPDATE serializa acessos concorrentes ao mesmo profile
  SELECT profiles.xp_total, profiles.level
  INTO xp_before, level_old
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'grant_xp_atomic: profile não encontrado: %', p_user_id;
  END IF;

  xp_total_after := GREATEST(0, xp_before + p_amount);
  level_new      := calculate_level(xp_total_after);
  leveled_up     := level_new > level_old;

  UPDATE profiles
  SET
    xp_total           = xp_total_after,
    level              = level_new,
    last_activity_date = CURRENT_DATE,
    updated_at         = NOW()
  WHERE id = p_user_id;

  -- Ledger: insere apenas quando reason informado (evita registros vazios)
  IF p_reason IS NOT NULL AND p_reason != '' THEN
    INSERT INTO xp_transactions (
      user_id, amount, reason, source_type, source_id,
      xp_total_after, level_after
    ) VALUES (
      p_user_id, p_amount, p_reason, p_source_type, p_source_id,
      xp_total_after, level_new
    );
  END IF;
END;
$$;

-- ────────────────────────────────────────────────────────────────
-- 2. maybe_grant_perfect_day
--    Concede o bônus de Dia Perfeito de forma atômica e idempotente.
--    Retorna (granted, perfect_days) para que o caller decida sobre
--    conquistas de perfect_week sem query adicional.
-- ────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION maybe_grant_perfect_day(
  p_user_id UUID,
  OUT granted      BOOLEAN,
  OUT perfect_days INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today        DATE    := CURRENT_DATE;
  v_new_xp       INTEGER;
  v_new_level    INTEGER;
  v_new_pd       INTEGER;
BEGIN
  -- Trava o profile — previne execução concorrente para o mesmo usuário
  PERFORM 1 FROM profiles WHERE id = p_user_id FOR UPDATE;

  -- Idempotente: já concedeu hoje?
  IF EXISTS (
    SELECT 1 FROM xp_transactions
    WHERE user_id     = p_user_id
      AND source_type = 'bonus'
      AND reason      = 'Dia Perfeito'
      AND created_at::date = v_today
  ) THEN
    SELECT profiles.perfect_days INTO perfect_days FROM profiles WHERE id = p_user_id;
    granted := FALSE;
    RETURN;
  END IF;

  -- XP + perfect_days em uma única instrução
  UPDATE profiles
  SET
    xp_total           = GREATEST(0, xp_total + 200),
    level              = calculate_level(GREATEST(0, xp_total + 200)),
    perfect_days       = perfect_days + 1,
    last_activity_date = v_today,
    updated_at         = NOW()
  WHERE id = p_user_id
  RETURNING xp_total, level, profiles.perfect_days
  INTO v_new_xp, v_new_level, v_new_pd;

  INSERT INTO xp_transactions (user_id, amount, reason, source_type, xp_total_after, level_after)
  VALUES (p_user_id, 200, 'Dia Perfeito', 'bonus', v_new_xp, v_new_level);

  granted      := TRUE;
  perfect_days := v_new_pd;
END;
$$;

-- ────────────────────────────────────────────────────────────────
-- 3. increment_referral_count — incremento atômico
-- ────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION increment_referral_count(p_user_id UUID)
RETURNS VOID
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE profiles
  SET referral_count = referral_count + 1
  WHERE id = p_user_id;
$$;

-- ────────────────────────────────────────────────────────────────
-- 4. batch_process_streaks
--    Processa todos os streaks ativos em uma única query SQL.
--    Substitui o loop N × 8 queries no cron TypeScript.
--    Retorna somente usuários cujo streak foi alterado.
-- ────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION batch_process_streaks(
  p_cutoff_date DATE DEFAULT CURRENT_DATE - 60
)
RETURNS TABLE(
  user_id     UUID,
  old_streak  INTEGER,
  new_streak  INTEGER,
  used_freeze BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_yesterday DATE := CURRENT_DATE - 1;
  v_today     DATE := CURRENT_DATE;
BEGIN
  RETURN QUERY
  WITH active_users AS (
    SELECT
      id,
      streak_current,
      streak_longest,
      COALESCE(streak_freezes, 0) AS streak_freezes
    FROM profiles
    WHERE last_activity_date >= p_cutoff_date
       OR streak_current > 0
  ),
  -- Une as 3 fontes de atividade em pares (user_id, date) distintos
  raw_activity AS (
    SELECT user_id, logged_date AS act_date
    FROM habit_logs
    WHERE logged_date IN (v_yesterday, v_today)
      AND user_id IN (SELECT id FROM active_users)

    UNION

    SELECT user_id, finished_at::DATE AS act_date
    FROM workouts
    WHERE finished_at::DATE IN (v_yesterday, v_today)
      AND user_id IN (SELECT id FROM active_users)

    UNION

    SELECT user_id, completed_at::DATE AS act_date
    FROM tasks
    WHERE status = 'done'
      AND completed_at::DATE IN (v_yesterday, v_today)
      AND user_id IN (SELECT id FROM active_users)
  ),
  -- Agrega atividade por usuário
  user_activity AS (
    SELECT
      u.id,
      u.streak_current,
      u.streak_freezes,
      COALESCE(BOOL_OR(a.act_date = v_today),     FALSE) AS had_today,
      COALESCE(BOOL_OR(a.act_date = v_yesterday), FALSE) AS had_yesterday
    FROM active_users u
    LEFT JOIN raw_activity a ON a.user_id = u.id
    GROUP BY u.id, u.streak_current, u.streak_freezes
  ),
  -- Calcula novo streak por regra de negócio
  computed AS (
    SELECT
      id,
      streak_current,
      streak_freezes,
      CASE
        WHEN had_today AND (had_yesterday OR streak_current = 0) THEN streak_current + 1
        WHEN had_today AND NOT had_yesterday                     THEN 1
        WHEN NOT had_today AND NOT had_yesterday
          AND streak_current > 0 AND streak_freezes > 0         THEN streak_current
        WHEN NOT had_today AND NOT had_yesterday                 THEN 0
        ELSE streak_current
      END AS new_streak,
      (
        NOT had_today
        AND NOT had_yesterday
        AND streak_current > 0
        AND streak_freezes > 0
      )::BOOLEAN AS freeze_used
    FROM user_activity
  ),
  -- Aplica UPDATE apenas onde houve mudança real
  upd AS (
    UPDATE profiles p
    SET
      streak_current = c.new_streak,
      streak_longest = GREATEST(p.streak_longest, c.new_streak),
      streak_freezes = CASE WHEN c.freeze_used
        THEN GREATEST(0, COALESCE(p.streak_freezes, 0) - 1)
        ELSE COALESCE(p.streak_freezes, 0)
      END,
      updated_at = NOW()
    FROM computed c
    WHERE p.id = c.id
      AND (
        c.new_streak IS DISTINCT FROM c.streak_current
        OR c.freeze_used
      )
    RETURNING p.id, c.streak_current AS old_streak, c.new_streak, c.freeze_used
  )
  SELECT u.id, u.old_streak, u.new_streak, u.freeze_used FROM upd u;
END;
$$;

-- ────────────────────────────────────────────────────────────────
-- 5. sync_account_balance
--    Trigger que recalcula current_balance após qualquer mutação
--    em transactions. Elimina drift entre saldo armazenado e real.
-- ────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION sync_account_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP IN ('INSERT', 'UPDATE') THEN
    UPDATE finance_accounts
    SET current_balance = (
      SELECT COALESCE(SUM(
        CASE type WHEN 'income' THEN amount ELSE -amount END
      ), 0)
      FROM transactions
      WHERE account_id = NEW.account_id
        AND is_paid    = TRUE
        AND type      != 'transfer'
    )
    WHERE id = NEW.account_id;
  END IF;

  IF TG_OP = 'DELETE'
  OR (TG_OP = 'UPDATE' AND OLD.account_id IS DISTINCT FROM NEW.account_id) THEN
    UPDATE finance_accounts
    SET current_balance = (
      SELECT COALESCE(SUM(
        CASE type WHEN 'income' THEN amount ELSE -amount END
      ), 0)
      FROM transactions
      WHERE account_id = OLD.account_id
        AND is_paid    = TRUE
        AND type      != 'transfer'
    )
    WHERE id = OLD.account_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_account_balance ON transactions;
CREATE TRIGGER trg_sync_account_balance
  AFTER INSERT OR UPDATE OR DELETE ON transactions
  FOR EACH ROW EXECUTE FUNCTION sync_account_balance();

-- ────────────────────────────────────────────────────────────────
-- 6. RLS corrigido para tabelas de saúde
--    Migration 004 aplicou (select auth.uid()) nas tabelas principais.
--    As tabelas de saúde foram criadas depois com a versão antiga.
-- ────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "sleep_logs_user_policy" ON sleep_logs;
CREATE POLICY "sleep_logs_user_policy" ON sleep_logs
  FOR ALL TO authenticated
  USING  (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "water_logs_user_policy" ON water_logs;
CREATE POLICY "water_logs_user_policy" ON water_logs
  FOR ALL TO authenticated
  USING  (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'mood_logs') THEN
    DROP POLICY IF EXISTS "users_own_mood_logs" ON mood_logs;
    EXECUTE $p$
      CREATE POLICY "users_own_mood_logs" ON mood_logs
        FOR ALL TO authenticated
        USING  (user_id = (SELECT auth.uid()))
        WITH CHECK (user_id = (SELECT auth.uid()))
    $p$;
  END IF;
END $$;

-- ────────────────────────────────────────────────────────────────
-- 7. Índices adicionais de performance
-- ────────────────────────────────────────────────────────────────

-- Cobre o padrão de dedup do cron task-reminders:
-- .eq('type', 'task_reminder').gte('sent_at', today)
CREATE INDEX IF NOT EXISTS idx_notifications_type_sent
  ON notifications(type, sent_at)
  WHERE sent_at IS NOT NULL;

-- GIN para buscas textuais via pg_trgm (extensão já habilitada no schema.sql)
CREATE INDEX IF NOT EXISTS idx_habits_name_trgm
  ON habits USING gin(name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_tasks_title_trgm
  ON tasks USING gin(title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_exercises_name_trgm
  ON exercises USING gin(name gin_trgm_ops);

-- ════════════════════════════════════════════════════════════════
-- ✅ Execute no Supabase SQL Editor.
-- ════════════════════════════════════════════════════════════════
