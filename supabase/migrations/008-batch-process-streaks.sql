-- ════════════════════════════════════════════════════════════════
-- MIGRATION 008 — batch_process_streaks
--
-- PROBLEMA: cron de streaks fazia 8 queries por usuário (sequencial).
-- Com 500 usuários → 4000 queries → timeout em 60s.
--
-- SOLUÇÃO: única função SQL que processa todos os usuários em paralelo
-- usando JOINs e CTEs. Complexidade: O(1) queries em vez de O(N).
--
-- Retorna os usuários cujo streak mudou, para que o Node.js processe
-- somente os milestones (evento raro — não precisa de batch SQL).
-- ════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION batch_process_streaks(
  p_cutoff_date DATE DEFAULT (CURRENT_DATE - INTERVAL '60 days')
)
RETURNS TABLE (
  user_id    UUID,
  old_streak INTEGER,
  new_streak INTEGER,
  used_freeze BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today     DATE := CURRENT_DATE;
  v_yesterday DATE := CURRENT_DATE - INTERVAL '1 day';
BEGIN
  -- ── Etapa 1: quais usuários tiveram atividade ontem? ────────────────────────
  -- Combina habit_logs + workouts + tasks em um único passe
  CREATE TEMP TABLE tmp_activity_yesterday ON COMMIT DROP AS
  SELECT DISTINCT user_id FROM (
    SELECT user_id FROM habit_logs
      WHERE logged_date = v_yesterday
    UNION ALL
    SELECT user_id FROM workouts
      WHERE finished_at::date = v_yesterday
        AND finished_at IS NOT NULL
    UNION ALL
    SELECT user_id FROM tasks
      WHERE status = 'done'
        AND completed_at::date = v_yesterday
        AND completed_at IS NOT NULL
  ) a;

  -- ── Etapa 2: quais usuários tiveram atividade hoje? ─────────────────────────
  CREATE TEMP TABLE tmp_activity_today ON COMMIT DROP AS
  SELECT DISTINCT user_id FROM (
    SELECT user_id FROM habit_logs
      WHERE logged_date = v_today
    UNION ALL
    SELECT user_id FROM workouts
      WHERE finished_at::date = v_today
        AND finished_at IS NOT NULL
    UNION ALL
    SELECT user_id FROM tasks
      WHERE status = 'done'
        AND completed_at::date = v_today
        AND completed_at IS NOT NULL
  ) a;

  -- ── Etapa 3: calcular novo streak para cada usuário ativo ───────────────────
  RETURN QUERY
  WITH active_users AS (
    -- Usuários que merecem processamento (tiveram atividade nos últimos 60 dias
    -- ou ainda têm streak ativo)
    SELECT
      p.id,
      p.streak_current                    AS old_streak,
      p.streak_longest,
      COALESCE(p.streak_freezes, 0)       AS freezes,
      (ay.user_id IS NOT NULL)            AS had_yesterday,
      (at_.user_id IS NOT NULL)           AS had_today
    FROM profiles p
    LEFT JOIN tmp_activity_yesterday ay ON ay.user_id = p.id
    LEFT JOIN tmp_activity_today     at_ ON at_.user_id = p.id
    WHERE p.last_activity_date >= p_cutoff_date
       OR p.streak_current > 0
  ),
  computed AS (
    SELECT
      id,
      old_streak,
      streak_longest,
      freezes,
      had_yesterday,
      had_today,
      -- Lógica de novo streak
      CASE
        WHEN had_today AND (had_yesterday OR old_streak = 0)
          THEN old_streak + 1
        WHEN had_today AND NOT had_yesterday
          THEN 1                                        -- pulou ontem, reinicia
        WHEN NOT had_yesterday AND NOT had_today
          AND old_streak > 0 AND freezes > 0
          THEN old_streak                               -- usa freeze
        WHEN NOT had_yesterday AND NOT had_today
          THEN 0                                        -- reseta
        ELSE old_streak                                 -- logou ontem, aguarda hoje
      END AS new_streak,
      -- Freeze foi usado?
      (NOT had_yesterday AND NOT had_today AND old_streak > 0 AND freezes > 0) AS freeze_used
    FROM active_users
  ),
  updated AS (
    UPDATE profiles p
    SET
      streak_current  = c.new_streak,
      streak_longest  = GREATEST(p.streak_longest, c.new_streak),
      streak_freezes  = CASE
                          WHEN c.freeze_used THEN GREATEST(0, COALESCE(p.streak_freezes, 0) - 1)
                          ELSE p.streak_freezes
                        END
    FROM computed c
    WHERE p.id = c.id
      AND (
        c.new_streak  != p.streak_current OR
        c.freeze_used = TRUE
      )
    RETURNING
      p.id          AS user_id,
      c.old_streak,
      c.new_streak,
      c.freeze_used AS used_freeze
  )
  SELECT * FROM updated;
END;
$$;

-- Somente service_role pode chamar esta função
REVOKE ALL ON FUNCTION batch_process_streaks FROM PUBLIC;
GRANT EXECUTE ON FUNCTION batch_process_streaks TO service_role;
