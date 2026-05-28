-- ════════════════════════════════════════════════════════════════
-- FIX 001 — Trigger handle_new_user + Colunas Stripe
-- Data: 2026-05-23
-- Problema: "Database error saving new user" no signup
--
-- Causas identificadas:
--   1. Trigger possivelmente não existe em produção (schema.sql nunca rodado)
--   2. Função usava 'profiles' sem schema explícito — search_path pode falhar
--   3. COALESCE não tratava name="" (string vazia) — só trata NULL
--   4. Colunas mp_subscription_id/mp_customer_id precisam virar stripe_*
--
-- Como aplicar:
--   1. Acessar https://supabase.com/dashboard
--   2. Projeto Ascendia → SQL Editor → New query
--   3. Colar TODO este conteúdo e clicar RUN
--   4. Aguardar mensagem "✅ Fix aplicado com sucesso"
-- ════════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────────
-- PASSO 1: Renomear colunas mp_* → stripe_* (safe — checa antes)
-- ────────────────────────────────────────────────────────────────
DO $$
BEGIN
  -- Renomeia mp_subscription_id se ainda existir
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'profiles'
      AND column_name  = 'mp_subscription_id'
  ) THEN
    ALTER TABLE public.profiles RENAME COLUMN mp_subscription_id TO stripe_subscription_id;
    RAISE NOTICE 'OK: mp_subscription_id renomeado para stripe_subscription_id';
  ELSE
    RAISE NOTICE 'SKIP: mp_subscription_id não existe (já renomeado)';
  END IF;

  -- Renomeia mp_customer_id se ainda existir
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'profiles'
      AND column_name  = 'mp_customer_id'
  ) THEN
    ALTER TABLE public.profiles RENAME COLUMN mp_customer_id TO stripe_customer_id;
    RAISE NOTICE 'OK: mp_customer_id renomeado para stripe_customer_id';
  ELSE
    RAISE NOTICE 'SKIP: mp_customer_id não existe (já renomeado)';
  END IF;

  -- Garante que stripe_subscription_id existe (caso nunca teve mp_*)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'profiles'
      AND column_name  = 'stripe_subscription_id'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN stripe_subscription_id TEXT;
    RAISE NOTICE 'OK: stripe_subscription_id criado';
  END IF;

  -- Garante que stripe_customer_id existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'profiles'
      AND column_name  = 'stripe_customer_id'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN stripe_customer_id TEXT;
    RAISE NOTICE 'OK: stripe_customer_id criado';
  END IF;
END $$;

-- ────────────────────────────────────────────────────────────────
-- PASSO 2: Recriar trigger e função com as correções
-- ────────────────────────────────────────────────────────────────

-- Remove versão antiga
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Função corrigida:
--  • public.profiles explícito (evita problema de search_path)
--  • SET search_path = public (segurança para SECURITY DEFINER)
--  • NULLIF(TRIM(...), '') trata string vazia além de NULL
--  • trial_end e subscription_status explícitos (não depende só de DEFAULT)
--  • RAISE EXCEPTION com msg clara para debug em Supabase Logs
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_name TEXT;
BEGIN
  v_name := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'name'), ''),
    split_part(NEW.email, '@', 1),
    'Usuário'
  );

  INSERT INTO public.profiles (
    id,
    name,
    subscription_status,
    trial_end,
    xp_total,
    level,
    streak_current,
    streak_longest,
    perfect_days,
    onboarding_completed,
    weekly_target
  ) VALUES (
    NEW.id,
    v_name,
    'trial',
    NOW() + INTERVAL '7 days',
    0,
    1,
    0,
    0,
    0,
    FALSE,
    4
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'handle_new_user falhou para user %: % (SQLSTATE: %)',
    NEW.id, SQLERRM, SQLSTATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recria o trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ────────────────────────────────────────────────────────────────
-- PASSO 3: Verificação final
-- ────────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_trigger_exists BOOLEAN;
  v_function_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'on_auth_user_created'
  ) INTO v_trigger_exists;

  SELECT EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'handle_new_user'
  ) INTO v_function_exists;

  IF v_trigger_exists AND v_function_exists THEN
    RAISE NOTICE '✅ Fix aplicado com sucesso — trigger e function recriados';
  ELSE
    RAISE EXCEPTION '❌ Algo deu errado — trigger: %, function: %',
      v_trigger_exists, v_function_exists;
  END IF;
END $$;
