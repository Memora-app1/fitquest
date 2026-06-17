-- ════════════════════════════════════════════════════════════════
-- 012-race-condition-fixes.sql
-- RPCs atômicas para corrigir TOCTOU em login checkin e referral.
-- Sem estas funções, 2 requests simultâneos podem:
--   • Conceder XP duplo de login no mesmo dia
--   • Aplicar 2 referrals ao mesmo usuário
-- Execute no Supabase SQL Editor
-- ════════════════════════════════════════════════════════════════

-- ════════ 1. CLAIM_LOGIN_ATOMIC ════════
-- Lê + atualiza last_login_date e login_streak em 1 round-trip atômico.
-- FOR UPDATE garante que 2 requests simultâneos não passem ambos pela
-- checagem "já reivindicou hoje?".

CREATE OR REPLACE FUNCTION claim_login_atomic(
  p_user_id   UUID,
  p_today     DATE,
  p_yesterday DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_last_login     DATE;
  v_current_streak INT;
  v_new_streak     INT;
  v_day_in_cycle   INT;
BEGIN
  SELECT last_login_date, login_streak
  INTO v_last_login, v_current_streak
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'profile_not_found';
  END IF;

  -- Já reivindicou hoje → retorna sem alterar
  IF v_last_login = p_today THEN
    RETURN jsonb_build_object(
      'already_claimed', true,
      'login_streak',    v_current_streak,
      'day_in_cycle',    ((GREATEST(v_current_streak, 1) - 1) % 7) + 1
    );
  END IF;

  -- Calcula novo streak
  v_new_streak := CASE
    WHEN v_last_login = p_yesterday THEN v_current_streak + 1
    ELSE 1
  END;

  v_day_in_cycle := ((v_new_streak - 1) % 7) + 1;

  -- Atualiza atomicamente
  UPDATE profiles
  SET last_login_date = p_today,
      login_streak    = v_new_streak
  WHERE id = p_user_id;

  RETURN jsonb_build_object(
    'already_claimed',  false,
    'login_streak',     v_new_streak,
    'day_in_cycle',     v_day_in_cycle,
    'is_week_complete', v_day_in_cycle = 7
  );
END;
$$;

GRANT EXECUTE ON FUNCTION claim_login_atomic TO authenticated, service_role;


-- ════════ 2. USE_REFERRAL_CODE_ATOMIC ════════
-- Lê + atualiza referred_by em 1 round-trip atômico.
-- FOR UPDATE garante que 2 requests simultâneos não consigam
-- ambos setar referred_by no mesmo usuário.

CREATE OR REPLACE FUNCTION use_referral_code_atomic(
  p_user_id     UUID,
  p_code        TEXT,
  p_referrer_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_referred_by TEXT;
  v_own_code    TEXT;
BEGIN
  SELECT referred_by, referral_code
  INTO v_referred_by, v_own_code
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'profile_not_found';
  END IF;

  IF v_referred_by IS NOT NULL THEN
    RETURN jsonb_build_object('error', 'already_referred');
  END IF;

  IF v_own_code = p_code THEN
    RETURN jsonb_build_object('error', 'own_code');
  END IF;

  UPDATE profiles
  SET referred_by = p_code
  WHERE id = p_user_id;

  RETURN jsonb_build_object('ok', true);
END;
$$;

GRANT EXECUTE ON FUNCTION use_referral_code_atomic TO authenticated, service_role;
