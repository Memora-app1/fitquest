import { createClient } from '@/lib/supabase/server'
import { Trophy } from 'lucide-react'

type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'

interface AchievementRow {
  slug: string
  name: string
  description: string
  icon: string
  category: string
  xp_reward: number
  rarity: Rarity
  unlocked_at: string
}

const RARITY_META: Record<Rarity, { label: string; color: string; rgb: string; glow: string }> = {
  common:    { label: 'Comum',     color: '#8899BB', rgb: '136,153,187', glow: '136,153,187' },
  uncommon:  { label: 'Incomum',   color: '#00FF88', rgb: '0,255,136',   glow: '0,255,136' },
  rare:      { label: 'Raro',      color: '#3B82F6', rgb: '59,130,246',  glow: '59,130,246' },
  epic:      { label: 'Épico',     color: '#7C3AED', rgb: '124,58,237',  glow: '124,58,237' },
  legendary: { label: 'Lendário',  color: '#F5C842', rgb: '245,200,66',  glow: '245,200,66' },
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: '2-digit' })
}

export async function AchievementsShowcase({ userId }: { userId: string }) {
  const supabase = await createClient()

  const { data, count } = await supabase
    .from('user_achievements')
    .select(`
      unlocked_at,
      achievements!inner(slug, name, description, icon, category, xp_reward, rarity)
    `, { count: 'exact' })
    .eq('user_id', userId)
    .order('unlocked_at', { ascending: false })
    .limit(9)

  if (!data || data.length === 0) return null

  const achievements: AchievementRow[] = data.map(row => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const a = (row as any).achievements as {
      slug: string; name: string; description: string; icon: string
      category: string; xp_reward: number; rarity: Rarity
    }
    return { ...a, unlocked_at: row.unlocked_at }
  })

  const totalAchievements = count ?? achievements.length

  // Most recently unlocked first (already ordered)
  // Get rarity distribution
  const rarityDist = achievements.reduce<Record<string, number>>((acc, a) => {
    acc[a.rarity] = (acc[a.rarity] ?? 0) + 1
    return acc
  }, {})

  const topRarity = (Object.entries(rarityDist)
    .sort((a, b) => {
      const order: Record<string, number> = { legendary: 0, epic: 1, rare: 2, uncommon: 3, common: 4 }
      return (order[a[0]] ?? 5) - (order[b[0]] ?? 5)
    })[0]?.[0] ?? 'common') as Rarity

  return (
    <div
      className="rounded-2xl p-5 md:p-6 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(245,200,66,0.06) 0%, rgba(13,24,41,0.98) 60%, rgba(124,58,237,0.04) 100%)',
        border: '1px solid rgba(245,200,66,0.14)',
      }}
    >
      {/* Corner glow */}
      <div
        className="absolute -top-8 -right-8 w-40 h-40 rounded-full pointer-events-none blur-3xl"
        style={{ background: 'rgba(245,200,66,0.07)' }}
      />

      <div className="relative z-10 space-y-5">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(245,200,66,0.12)', border: '1px solid rgba(245,200,66,0.22)' }}
              >
                <Trophy size={12} style={{ color: '#F5C842' }} />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-text-muted">
                Conquistas
              </span>
            </div>
            <h2 className="text-xl font-black leading-tight">
              {totalAchievements} conquista{totalAchievements !== 1 ? 's' : ''} desbloqueada{totalAchievements !== 1 ? 's' : ''}
            </h2>
          </div>

          {/* Top rarity badge */}
          <div
            className="px-3 py-1.5 rounded-xl text-xs font-bold shrink-0"
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {achievements.map((achievement) => {
            const rarity = RARITY_META[achievement.rarity] ?? RARITY_META.common
            return (
              <div
                key={achievement.slug}
                className="rounded-xl p-3.5 flex items-start gap-3 relative overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, rgba(${rarity.rgb},0.06) 0%, rgba(13,24,41,0.98) 100%)`,
                  border: `1px solid rgba(${rarity.rgb},0.18)`,
                }}
              >
                {/* Glow */}
                <div
                  className="absolute -top-3 -right-3 w-10 h-10 rounded-full pointer-events-none blur-lg"
                  style={{ background: rarity.color, opacity: 0.12 }}
                />

                {/* Icon */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                  style={{
                    background: `rgba(${rarity.rgb},0.12)`,
                    border: `1px solid rgba(${rarity.rgb},0.22)`,
                  }}
                >
                  {achievement.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 relative z-10">
                  <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                    <span className="text-sm font-bold leading-snug">{achievement.name}</span>
                    <span
                      className="text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                      style={{ background: `rgba(${rarity.rgb},0.15)`, color: rarity.color }}
                    >
                      {rarity.label}
                    </span>
                  </div>
                  <p className="text-[10px] text-text-muted leading-snug line-clamp-2">{achievement.description}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] font-bold" style={{ color: '#F5C842' }}>
                      +{achievement.xp_reward} XP
                    </span>
                    <span className="text-[9px] text-text-muted">
                      {formatDate(achievement.unlocked_at)}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* ── Rarity breakdown ─────────────────────────────────────────── */}
        <div
          className="rounded-xl px-4 py-3 flex items-center gap-4 flex-wrap"
          style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)' }}
        >
          <span className="text-[10px] text-text-muted uppercase tracking-wider shrink-0">Raridade</span>
          <div className="flex gap-3 flex-wrap">
            {(['legendary', 'epic', 'rare', 'uncommon', 'common'] as Rarity[]).map(r => {
              const cnt = rarityDist[r] ?? 0
              if (cnt === 0) return null
              const meta = RARITY_META[r]
              return (
                <div key={r} className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ background: meta.color }} />
                  <span className="text-[10px] text-text-muted">{meta.label}</span>
                  <span className="text-[10px] font-bold" style={{ color: meta.color }}>{cnt}</span>
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  )
}
