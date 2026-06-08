-- ════════════════════════════════════════════════════════════════
-- ASCENDIA — grant_xp_atomic RPC
-- Concede XP de forma atômica: 1 round-trip, sem race condition.
-- Garante que dois requests simultâneos somam XP corretamente.
-- Execute no Supabase SQL Editor
-- ════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION grant_xp_atomic(
  p_user_id     UUID,
  p_amount      INT,
  p_reason      TEXT,
  p_source_type TEXT,
  p_source_id   UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_xp_before      INT;
  v_xp_after        INT;
  v_level_old       INT;
  v_level_new       INT;
  v_leveled_up      BOOLEAN;
BEGIN
  -- Busca XP atual com lock para evitar race condition
  SELECT xp_total, level
  INTO v_xp_before, v_level_old
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Perfil não encontrado: %', p_user_id;
  END IF;

  v_xp_after := v_xp_before + p_amount;

  -- Calcula novo level
  v_level_new := CASE
    WHEN v_xp_after >= 35000 THEN 8
    WHEN v_xp_after >= 20000 THEN 7
    WHEN v_xp_after >= 12000 THEN 6
    WHEN v_xp_after >= 7000  THEN 5
    WHEN v_xp_after >= 3500  THEN 4
    WHEN v_xp_after >= 1500  THEN 3
    WHEN v_xp_after >= 500   THEN 2
    ELSE 1
  END;

  v_leveled_up := v_level_new > v_level_old;

  -- Atualiza perfil atomicamente
  UPDATE profiles
  SET
    xp_total           = v_xp_after,
    level              = v_level_new,
    last_activity_date = CURRENT_DATE::TEXT
  WHERE id = p_user_id;

  -- Registra no ledger (imutável)
  INSERT INTO xp_transactions (
    user_id, amount, reason, source_type, source_id,
    xp_total_after, level_after
  ) VALUES (
    p_user_id, p_amount, p_reason, p_source_type, p_source_id,
    v_xp_after, v_level_new
  );

  RETURN json_build_object(
    'xp_before',      v_xp_before,
    'xp_total_after', v_xp_after,
    'level_old',      v_level_old,
    'level_new',      v_level_new,
    'leveled_up',     v_leveled_up
  );
END;
$$;

-- Permissão para usuários autenticados chamarem via SDK
GRANT EXECUTE ON FUNCTION grant_xp_atomic TO authenticated, service_role;
