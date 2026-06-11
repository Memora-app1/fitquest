-- ════════════════════════════════════════════════════════════════
-- 011-rls-v2-optimization.sql
-- Aplica otimização (SELECT auth.uid()) nas tables do Gamification V2
-- que foram criadas em 009-gamification-v2.sql usando auth.uid() direto.
--
-- A chamada (SELECT auth.uid()) é avaliada UMA VEZ por statement
-- em vez de uma vez por linha — pode reduzir overhead em até 100x
-- em tabelas com muitas linhas.
-- Fonte: Supabase docs + pg optimizer behavior.
-- ════════════════════════════════════════════════════════════════

-- ── DAILY LOOT ────────────────────────────────────────────────────
DROP POLICY IF EXISTS "daily_loot_own" ON daily_loot;

CREATE POLICY "daily_loot_own" ON daily_loot
  FOR ALL TO authenticated
  USING  (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- ── GUILDS ────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "guilds_read"   ON guilds;
DROP POLICY IF EXISTS "guilds_insert" ON guilds;
DROP POLICY IF EXISTS "guilds_update" ON guilds;
DROP POLICY IF EXISTS "guilds_delete" ON guilds;

CREATE POLICY "guilds_read"   ON guilds FOR SELECT TO authenticated USING (true);
CREATE POLICY "guilds_insert" ON guilds FOR INSERT TO authenticated WITH CHECK (created_by = (SELECT auth.uid()));
CREATE POLICY "guilds_update" ON guilds FOR UPDATE TO authenticated USING (created_by = (SELECT auth.uid()));
CREATE POLICY "guilds_delete" ON guilds FOR DELETE TO authenticated USING (created_by = (SELECT auth.uid()));

-- ── GUILD MEMBERS ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "guild_members_read" ON guild_members;
DROP POLICY IF EXISTS "guild_members_own"  ON guild_members;

CREATE POLICY "guild_members_read" ON guild_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "guild_members_own"  ON guild_members
  FOR ALL TO authenticated
  USING  (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- ── SEASON PROGRESS ───────────────────────────────────────────────
DROP POLICY IF EXISTS "season_progress_own" ON season_progress;

CREATE POLICY "season_progress_own" ON season_progress
  FOR ALL TO authenticated
  USING  (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- ── USER COSMETICS ────────────────────────────────────────────────
DROP POLICY IF EXISTS "user_cosmetics_own" ON user_cosmetics;

CREATE POLICY "user_cosmetics_own" ON user_cosmetics
  FOR ALL TO authenticated
  USING  (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- ── INDEXES para colunas de RLS USING (melhora seq scan → index scan) ──

-- profiles.id já é PK, coberto

-- daily_loot: filtros por user_id são frequentes
CREATE INDEX IF NOT EXISTS idx_daily_loot_user_id    ON daily_loot(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_loot_user_date  ON daily_loot(user_id, date DESC);

-- guild_members: leituras por guild e por usuário
CREATE INDEX IF NOT EXISTS idx_guild_members_user_id  ON guild_members(user_id);
CREATE INDEX IF NOT EXISTS idx_guild_members_guild_id ON guild_members(guild_id);

-- season_progress: filtros por usuário
CREATE INDEX IF NOT EXISTS idx_season_progress_user_id ON season_progress(user_id);

-- user_cosmetics: filtros por usuário
CREATE INDEX IF NOT EXISTS idx_user_cosmetics_user_id ON user_cosmetics(user_id);

-- profiles: league ranking semanal
CREATE INDEX IF NOT EXISTS idx_profiles_league_xp ON profiles(league_xp_this_week DESC)
  WHERE subscription_status IN ('trial', 'active', 'lifetime');
