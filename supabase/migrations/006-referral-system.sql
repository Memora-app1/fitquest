-- Migration: Sistema de referral com XP
-- Execute no Supabase SQL Editor antes de ativar o sistema de referral

-- Adiciona campos de referral na tabela profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by   TEXT REFERENCES profiles(referral_code),
  ADD COLUMN IF NOT EXISTS referral_count INT NOT NULL DEFAULT 0;

-- Gera códigos únicos de 8 caracteres para todos os usuários existentes
UPDATE profiles
SET referral_code = UPPER(SUBSTR(MD5(id::TEXT || 'asc24'), 1, 8))
WHERE referral_code IS NULL;

-- Índice para lookup rápido por código
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_referral_code ON profiles(referral_code);

-- Trigger para gerar código automaticamente ao criar novo perfil
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := UPPER(SUBSTR(MD5(NEW.id::TEXT || 'asc24'), 1, 8));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_generate_referral_code ON profiles;
CREATE TRIGGER trg_generate_referral_code
  BEFORE INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION generate_referral_code();
