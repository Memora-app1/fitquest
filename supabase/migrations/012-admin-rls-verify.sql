-- ════════════════════════════════════════════════════════════════════
-- 012-admin-rls-verify.sql
-- Verifica e reforça o isolamento RLS das tabelas administrativas.
-- Execute no Supabase SQL Editor para confirmar estado de produção.
-- ════════════════════════════════════════════════════════════════════

-- ── 1. Garante que admin_roles NÃO seja acessível por usuários normais ────────
-- A política USING (false) bloqueia TODOS os acessos de usuários autenticados.
-- Apenas o service role key (server-side) ignora RLS e consegue ler/escrever.

DROP POLICY IF EXISTS "admin_roles_service_only" ON admin_roles;
CREATE POLICY "admin_roles_service_only" ON admin_roles
  FOR ALL USING (false);

-- ── 2. audit_logs — mesma proteção ──────────────────────────────────────────
DROP POLICY IF EXISTS "audit_logs_service_only" ON audit_logs;
CREATE POLICY "audit_logs_service_only" ON audit_logs
  FOR ALL USING (false);

-- ── 3. Verifica RLS habilitado em tabelas críticas ───────────────────────────
-- Resultado esperado: rowsecurity = true para todas as linhas abaixo
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'admin_roles', 'audit_logs', 'feature_flags',
    'profiles', 'xp_transactions', 'daily_loot'
  )
ORDER BY tablename;

-- ── 4. Confirma política de admin_roles está bloqueando ──────────────────────
SELECT policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'admin_roles';
-- Esperado: "admin_roles_service_only" com qual = 'false'

-- ── 5. Verifica indexes críticos ─────────────────────────────────────────────
SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('admin_roles', 'audit_logs')
ORDER BY tablename;
