import { createClient } from '@/lib/supabase/server';
import { Trophy } from 'lucide-react';

type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

interface AchievementRow {
  slug: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  xp_reward: number;
  rarity: Rarity;
  unlocked_at: string;
}

const RARITY_META: Record<Rarity, { label: string; color: string; rgb: string; glow: string }> = {
  common: { label: 'Comum', color: '#8899BB', rgb: '136,153,187', glow: '136,153,187' },
  uncommon: { label: 'Incomum', color: '#00FF88', rgb: '0,255,136', glow: '0,255,136' },
  rare: { label: 'Raro', color: '#3B82F6', rgb: '59,130,246', glow: '59,130,246' },
  epic: { label: 'Épico', color: '#7C3AED', rgb: '124,58,237', glow: '124,58,237' },
  legendary: { label: 'Lendário', color: '#F5C842', rgb: '245,200,66', glow: '245,200,66' },
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: '2-digit',
  });
}

export async function AchievementsShowcase({ userId }: { userId: string }) {
  const supabase = await createClient();

  const { data, count } = await supabase
    .from('user_achievements')
    .select(
      `
      unlocked_at,
      achievements!inner(slug, name, description, icon, category, xp_reward, rarity)
    `,
      { count: 'exact' }
    )
    .eq('user_id', userId)
    .order('unlocked_at', { ascending: false })
    .limit(9);

  if (!data || data.length === 0) return null;

  type AchievementJoin = {
    slug: string;
    name: string;
    description: string;
    icon: string;
    category: string;
    xp_reward: number;
    rarity: Rarity;
  };
  const achievements: AchievementRow[] = data.map((row) => {
    const raw = row.achievements as unknown as AchievementJoin | AchievementJoin[];
    const a = Array.isArray(raw) ? raw[0] : raw;
    if (!a) throw new Error('achievement join missing');
    return { ...a, unlocked_at: row.unlocked_at };
  });

  const totalAchievements = count ?? achievements.length;

  // Most recently unlocked first (already ordered)
  // Get rarity distribution
  const rarityDist = achievements.reduce<Record<string, number>>((acc, a) => {
    acc[a.rarity] = (acc[a.rarity] ?? 0) + 1;
    return acc;
  }, {});

  const topRarity = (Object.entries(rarityDist).sort((a, b) => {
    const order: Record<string, number> = {
      legendary: 0,
      epic: 1,
      rare: 2,
      uncommon: 3,
      common: 4,
    };
    return (order[a[0]] ?? 5) - (order[b[0]] ?? 5);
  })[0]?.[0] ?? 'common') as Rarity;

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-5 md:p-6"
      style={{
        background:
          'linear-gradient(135deg, rgba(245,200,66,0.06) 0%, rgba(13,24,41,0.98) 60%, rgba(124,58,237,0.04) 100%)',
        border: '1px solid rgba(245,200,66,0.14)',
      }}
    >
      {/* Corner glow */}
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full blur-3xl"
        style={{ background: 'rgba(245,200,66,0.07)' }}
      />

      <div className="relative z-10 space-y-5">
        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <div
                className="flex h-6 w-6 items-center justify-center rounded-lg"
                style={{
                  background: 'rgba(245,200,66,0.12)',
                  border: '1px solid rgba(245,200,66,0.22)',
                }}
              >
                <Trophy size={12} style={{ color: '#F5C842' }} />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-text-muted">
                Conquistas
              </span>
            </div>
            <h2 className="text-xl font-black leading-tight">
              {totalAchievements} conquista{totalAchievements !== 1 ? 's' : ''} desbloqueada
              {totalAchievements !== 1 ? 's' : ''}
            </h2>
          </div>

          {/* Top rarity badge */}
          <div
            className="shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold"
            style={{
              background: `rgba(${RARITY_META[topRarity].rgb},0.12)`,
              border: `1px solid rgba(${RARITY_META[topRarity].rgb},0.25)`,
              color: RARITY_META[topRarity].color,
            }}
          >
            ✨ Mais rara: {RARITY_META[topRarity].label}
          </div>
        </div>

        {/* ── Achievement grid ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {achievements.map((achievement) => {
            const rarity = RARITY_META[achievement.rarity] ?? RARITY_META.common;
            return (
              <div
                key={achievement.slug}
                className="relative flex items-start gap-3 overflow-hidden rounded-xl p-3.5"
                style={{
                  background: `linear-gradient(135deg, rgba(${rarity.rgb},0.06) 0%, rgba(13,24,41,0.98) 100%)`,
                  border: `1px solid rgba(${rarity.rgb},0.18)`,
                }}
              >
                {/* Glow */}
                <div
                  className="pointer-events-none absolute -right-3 -top-3 h-10 w-10 rounded-full blur-lg"
                  style={{ background: rarity.color, opacity: 0.12 }}
                />

                {/* Icon */}
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl"
                  style={{
                    background: `rgba(${rarity.rgb},0.12)`,
                    border: `1px solid rgba(${rarity.rgb},0.22)`,
                  }}
                >
                  {achievement.icon}
                </div>

                {/* Content */}
                <div className="relative z-10 min-w-0 flex-1">
                  <div className="mb-0.5 flex flex-wrap items-center gap-1.5">
                    <span className="text-sm font-bold leading-snug">{achievement.name}</span>
                    <span
                      className="shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold"
                      style={{ background: `rgba(${rarity.rgb},0.15)`, color: rarity.color }}
                    >
                      {rarity.label}
                    </span>
                  </div>
                  <p className="line-clamp-2 text-[10px] leading-snug text-text-muted">
                    {achievement.description}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[10px] font-bold" style={{ color: '#F5C842' }}>
                      +{achievement.xp_reward} XP
                    </span>
                    <span className="text-[9px] text-text-muted">
                      {formatDate(achievement.unlocked_at)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Rarity breakdown ─────────────────────────────────────────── */}
        <div
          className="flex flex-wrap items-center gap-4 rounded-xl px-4 py-3"
          style={{
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          <span className="shrink-0 text-[10px] uppercase tracking-wider text-text-muted">
            Raridade
          </span>
          <div className="flex flex-wrap gap-3">
            {(['legendary', 'epic', 'rare', 'uncommon', 'common'] as Rarity[]).map((r) => {
              const cnt = rarityDist[r] ?? 0;
              if (cnt === 0) return null;
              const meta = RARITY_META[r];
              return (
                <div key={r} className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full" style={{ background: meta.color }} />
                  <span className="text-[10px] text-text-muted">{meta.label}</span>
                  <span className="text-[10px] font-bold" style={{ color: meta.color }}>
                    {cnt}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
