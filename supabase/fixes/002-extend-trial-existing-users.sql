-- ════════════════════════════════════════════════════════════════
-- FIX 002 — Estender trial de todos os usuários existentes
-- Data: 2026-06-16
-- Problema: Usuários criados antes do launch têm trial_end expirado
--            e são redirecionados para /planos ao tentar logar.
--
-- Como aplicar:
--   1. Supabase Dashboard → SQL Editor → New query
--   2. Colar e executar
-- ════════════════════════════════════════════════════════════════

-- Extende trial_end para 365 dias a partir de hoje para TODOS
-- os usuários que ainda estão em status 'trial'
UPDATE public.profiles
SET
  trial_end = NOW() + INTERVAL '365 days',
  updated_at = NOW()
WHERE
  subscription_status = 'trial'
  AND (trial_end IS NULL OR trial_end < NOW() + INTERVAL '1 day');

-- Confirma quantos foram atualizados
DO $$
DECLARE
  v_count INT;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM public.profiles
  WHERE subscription_status = 'trial'
    AND trial_end > NOW();

  RAISE NOTICE '✅ % usuários agora têm trial ativo (trial_end no futuro)', v_count;
END $$;
