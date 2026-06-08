-- ════════════════════════════════════════════════════════════════════════════
-- 009-gamification-v2.sql
-- Gamification V2: Login Streak, Loot Box, Prestige, Guilds, Season Pass,
--                  Leagues, Cosmetics, Recovery Mode, Finance Streak
-- ════════════════════════════════════════════════════════════════════════════

-- ════════ NOVOS CAMPOS EM PROFILES ════════

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS login_streak              int          NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_login_date           date,
  ADD COLUMN IF NOT EXISTS prestige_level            int          NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS xp_all_time               bigint       NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS recovery_week_active      boolean      NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS recovery_week_used_month  int,
  ADD COLUMN IF NOT EXISTS league_xp_this_week       int          NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS season_xp                 int          NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS equipped_title            text,
  ADD COLUMN IF NOT EXISTS equipped_frame            text,
  ADD COLUMN IF NOT EXISTS finance_streak            int          NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_finance_date         date;

-- Inicializa xp_all_time com xp_total atual (não zera)
UPDATE profiles SET xp_all_time = xp_total WHERE xp_all_time = 0;

-- ════════ DAILY LOOT ════════

CREATE TABLE IF NOT EXISTS daily_loot (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date         date        NOT NULL,
  rarity       text        NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  reward_type  text        NOT NULL CHECK (reward_type IN ('xp', 'streak_freeze', 'cosmetic', 'multiplier')),
  reward_value int         NOT NULL DEFAULT 0,
  reward_meta  text,
  source       text        NOT NULL DEFAULT 'perfect_day',
  opened_at    timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);

ALTER TABLE daily_loot ENABLE ROW LEVEL SECURITY;
CREATE POLICY "daily_loot_own" ON daily_loot
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ════════ GUILDS ════════

CREATE TABLE IF NOT EXISTS guilds (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text        NOT NULL,
  tag          text        NOT NULL CHECK (char_length(tag) BETWEEN 2 AND 6),
  motto        text,
  avatar_emoji text        NOT NULL DEFAULT '⚡',
  xp_total     bigint      NOT NULL DEFAULT 0,
  weekly_xp    int         NOT NULL DEFAULT 0,
  created_by   uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  max_members  int         NOT NULL DEFAULT 20,
  invite_code  text        NOT NULL UNIQUE DEFAULT upper(substring(gen_random_uuid()::text, 1, 6)),
  is_public    boolean     NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (name)
);

CREATE TABLE IF NOT EXISTS guild_members (
  guild_id      uuid        NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
  user_id       uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role          text        NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at     timestamptz NOT NULL DEFAULT now(),
  weekly_xp     int         NOT NULL DEFAULT 0,
  last_week_xp  int         NOT NULL DEFAULT 0,
  PRIMARY KEY (guild_id, user_id)
);

ALTER TABLE guilds ENABLE ROW LEVEL SECURITY;
ALTER TABLE guild_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "guilds_read"   ON guilds FOR SELECT TO authenticated USING (true);
CREATE POLICY "guilds_insert" ON guilds FOR INSERT WITH CHECK (created_by = auth.uid());
CREATE POLICY "guilds_update" ON guilds FOR UPDATE USING (created_by = auth.uid());
CREATE POLICY "guilds_delete" ON guilds FOR DELETE USING (created_by = auth.uid());

CREATE POLICY "guild_members_read" ON guild_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "guild_members_own"  ON guild_members FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ════════ SEASONS ════════

CREATE TABLE IF NOT EXISTS seasons (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL,
  theme_emoji text        NOT NULL DEFAULT '⚡',
  tagline     text,
  start_date  date        NOT NULL,
  end_date    date        NOT NULL,
  is_active   boolean     NOT NULL DEFAULT false,
  tiers       jsonb       NOT NULL DEFAULT '[]'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS season_progress (
  user_id        uuid    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  season_id      uuid    NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  season_xp      int     NOT NULL DEFAULT 0,
  current_tier   int     NOT NULL DEFAULT 0,
  claimed_tiers  jsonb   NOT NULL DEFAULT '[]'::jsonb,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, season_id)
);

ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE season_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "seasons_read"        ON seasons FOR SELECT TO authenticated USING (true);
CREATE POLICY "season_progress_own" ON season_progress
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ════════ COSMETICS ════════

CREATE TABLE IF NOT EXISTS cosmetics (
  id          uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text    NOT NULL UNIQUE,
  name        text    NOT NULL,
  description text,
  type        text    NOT NULL CHECK (type IN ('title', 'frame', 'badge', 'theme')),
  rarity      text    NOT NULL DEFAULT 'common'
                      CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  source      text    NOT NULL
                      CHECK (source IN ('season', 'prestige', 'achievement', 'shop', 'event', 'loot')),
  preview     text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_cosmetics (
  user_id      uuid    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cosmetic_id  uuid    NOT NULL REFERENCES cosmetics(id) ON DELETE CASCADE,
  acquired_at  timestamptz NOT NULL DEFAULT now(),
  equipped     boolean NOT NULL DEFAULT false,
  PRIMARY KEY (user_id, cosmetic_id)
);

ALTER TABLE cosmetics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_cosmetics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cosmetics_read"     ON cosmetics FOR SELECT TO authenticated USING (true);
CREATE POLICY "user_cosmetics_own" ON user_cosmetics
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ════════ SEED: TEMPORADA 1 ════════

INSERT INTO seasons (name, theme_emoji, tagline, start_date, end_date, is_active, tiers)
VALUES (
  'A Ascensão do Guerreiro',
  '⚔️',
  'Forje sua disciplina. Escreva sua lenda.',
  '2026-06-01',
  '2026-08-31',
  true,
  '[
    {"tier": 1,  "season_xp_required": 100,  "free": true,  "label": "Guerreiro em Formação",    "type": "title",         "value": "Guerreiro em Formação",   "slug": "title_guerreiro_formacao", "emoji": "⚔️"},
    {"tier": 2,  "season_xp_required": 250,  "free": true,  "label": "+150 XP Bônus",            "type": "xp",            "value": 150,                        "slug": null,                       "emoji": "⚡"},
    {"tier": 3,  "season_xp_required": 500,  "free": true,  "label": "Badge Chama Inicial",       "type": "badge",         "value": 0,                          "slug": "badge_chama_inicial",      "emoji": "🔥"},
    {"tier": 4,  "season_xp_required": 800,  "free": false, "label": "+300 XP Bônus",            "type": "xp",            "value": 300,                        "slug": null,                       "emoji": "⚡"},
    {"tier": 5,  "season_xp_required": 1200, "free": false, "label": "Streak Freeze x2",         "type": "streak_freeze", "value": 2,                          "slug": null,                       "emoji": "🛡️"},
    {"tier": 6,  "season_xp_required": 1800, "free": false, "label": "Título Elite do Guerreiro", "type": "title",         "value": "Elite do Guerreiro",       "slug": "title_elite_guerreiro",    "emoji": "🛡️"},
    {"tier": 7,  "season_xp_required": 2500, "free": false, "label": "+500 XP Bônus",            "type": "xp",            "value": 500,                        "slug": null,                       "emoji": "⚡"},
    {"tier": 8,  "season_xp_required": 3500, "free": false, "label": "Frame Chama Dourada",      "type": "frame",         "value": 0,                          "slug": "frame_flame_gold",         "emoji": "🌟"},
    {"tier": 9,  "season_xp_required": 5000, "free": false, "label": "Streak Freeze x3",         "type": "streak_freeze", "value": 3,                          "slug": null,                       "emoji": "🛡️"},
    {"tier": 10, "season_xp_required": 7000, "free": false, "label": "Título Guerreiro Lendário", "type": "title",         "value": "Guerreiro Lendário",       "slug": "title_guerreiro_lendario", "emoji": "🏛️"}
  ]'::jsonb
)
ON CONFLICT DO NOTHING;

-- ════════ SEED: COSMÉTICOS ════════

INSERT INTO cosmetics (slug, name, description, type, rarity, source, preview) VALUES
  ('title_guerreiro_formacao',  'Guerreiro em Formação', 'Season 1 · Tier 1',  'title', 'rare',      'season',   '⚔️'),
  ('title_elite_guerreiro',     'Elite do Guerreiro',    'Season 1 · Tier 6',  'title', 'epic',      'season',   '🛡️'),
  ('title_guerreiro_lendario',  'Guerreiro Lendário',    'Season 1 · Tier 10', 'title', 'legendary', 'season',   '🏛️'),
  ('badge_chama_inicial',       'Chama Inicial',         'Season 1 · Tier 3',  'badge', 'rare',      'season',   '🔥'),
  ('frame_flame_gold',          'Chama Dourada',         'Season 1 · Tier 8',  'frame', 'legendary', 'season',   '✨'),
  ('title_ascendido',           'Ascendido',             'Prestige 1',         'title', 'rare',      'prestige', '⭐'),
  ('title_diamante',            'Diamante',              'Prestige 3',         'title', 'epic',      'prestige', '💎'),
  ('title_imortal',             'Imortal',               'Prestige 5',         'title', 'legendary', 'prestige', '🔥'),
  ('title_lendario_eterno',     'Lendário Eterno',       'Prestige 10',        'title', 'legendary', 'prestige', '👑'),
  ('title_mestre_habitos',      'Mestre dos Hábitos',    'Loot lendário',      'title', 'legendary', 'loot',     '🎯'),
  ('title_guerreiro_oculto',    'Guerreiro Oculto',      'Loot lendário',      'title', 'legendary', 'loot',     '🌑')
ON CONFLICT (slug) DO NOTHING;

-- ════════ ÍNDICES ════════

CREATE INDEX IF NOT EXISTS idx_daily_loot_user_date   ON daily_loot (user_id, date);
CREATE INDEX IF NOT EXISTS idx_daily_loot_pending     ON daily_loot (user_id) WHERE opened_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_guild_members_guild    ON guild_members (guild_id);
CREATE INDEX IF NOT EXISTS idx_guild_members_user     ON guild_members (user_id);
CREATE INDEX IF NOT EXISTS idx_guild_members_weekly   ON guild_members (guild_id, weekly_xp DESC);
CREATE INDEX IF NOT EXISTS idx_guilds_weekly_xp       ON guilds (weekly_xp DESC);
CREATE INDEX IF NOT EXISTS idx_season_progress_season ON season_progress (season_id, season_xp DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_league_xp     ON profiles (league_xp_this_week DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_prestige      ON profiles (prestige_level DESC, xp_all_time DESC);

-- ════════ RPC: INCREMENTAR LEAGUE XP E SEASON XP ════════

CREATE OR REPLACE FUNCTION increment_weekly_stats(
  p_user_id uuid,
  p_xp      int
) RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET
    league_xp_this_week = league_xp_this_week + p_xp,
    xp_all_time         = xp_all_time + p_xp
  WHERE id = p_user_id;

  -- Atualiza season_xp do usuário na temporada ativa (1 season XP a cada 5 XP)
  UPDATE season_progress sp
  SET
    season_xp  = sp.season_xp + GREATEST(1, p_xp / 5),
    updated_at = now()
  FROM seasons s
  WHERE sp.season_id = s.id
    AND s.is_active = true
    AND sp.user_id = p_user_id;

  -- Se não tem season_progress ainda, cria
  INSERT INTO season_progress (user_id, season_id, season_xp)
  SELECT p_user_id, s.id, GREATEST(1, p_xp / 5)
  FROM seasons s
  WHERE s.is_active = true
  ON CONFLICT (user_id, season_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ════════ RPC: RESET SEMANAL DO LEAGUE XP ════════

CREATE OR REPLACE FUNCTION reset_weekly_league_xp() RETURNS void AS $$
BEGIN
  -- Salva o weekly_xp anterior nos guild_members antes de resetar
  UPDATE guild_members gm
  SET last_week_xp = gm.weekly_xp,
      weekly_xp    = 0;

  UPDATE guilds
  SET weekly_xp = 0;

  -- Reseta league_xp de todos os profiles
  UPDATE profiles
  SET league_xp_this_week = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
