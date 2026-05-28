import { createClient } from '@/lib/supabase/server'
import { Zap } from 'lucide-react'

const SOURCE_META: Record<string, { label: string; emoji: string; color: string; rgb: string }> = {
  habit:       { label: 'Hábitos',      emoji: '🎯', color: '#FF4D00', rgb: '255,77,0' },
  task:        { label: 'Tarefas',      emoji: '✅', color: '#7C3AED', rgb: '124,58,237' },
  workout:     { label: 'Treinos',      emoji: '💪', color: '#00FF88', rgb: '0,255,136' },
  finance:     { label: 'Finanças',     emoji: '💰', color: '#F5C842', rgb: '245,200,66' },
  achievement: { label: 'Conquistas',   emoji: '🏆', color: '#F5C842', rgb: '245,200,66' },
  streak:      { label: 'Streak',       emoji: '🔥', color: '#FF4D00', rgb: '255,77,0' },
  level_up:    { label: 'Level Up',     emoji: '⬆️', color: '#00FF88', rgb: '0,255,136' },
  goal:        { label: 'Metas',        emoji: '🎯', color: '#3B82F6', rgb: '59,130,246' },
  manual:      { label: 'Manual',       emoji: '⚡', color: '#8899BB', rgb: '136,153,187' },
}

export async function XpSourceBreakdown({ userId }: { userId: string }) {
  const supabase = await createClient()

  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString()
  const ninetyDaysAgo = new Date(Date.now() - 90 * 86400000).toISOString()

  const [recentRes, allTimeRes] = await Promise.all([
    supabase
      .from('xp_transactions')
      .select('amount, source_type, created_at')
      .eq('user_id', userId)
      .gte('created_at', thirtyDaysAgo),
    supabase
      .from('xp_transactions')
      .select('amount, source_type')
      .eq('user_id', userId)
      .gte('created_at', ninetyDaysAgo),
  ])

  const recentTx = recentRes.data ?? []
  const allTx = allTimeRes.data ?? []

  if (allTx.length === 0) return null

  // Build source breakdown — last 30 days
  const bySource30 = new Map<string, number>()
  for (const tx of recentTx) {
    const s = tx.source_type ?? 'manual'
    bySource30.set(s, (bySource30.get(s) ?? 0) + (tx.amount ?? 0))
  }

  // Build source breakdown — last 90 days (all-time proxy)
  const bySource90 = new Map<string, number>()
  for (const tx of allTx) {
    const s = tx.source_type ?? 'manual'
    bySource90.set(s, (bySource90.get(s) ?? 0) + (tx.amount ?? 0))
  }

  const total30 = Array.from(bySource30.values()).reduce((s, v) => s + v, 0)
  const total90 = Array.from(bySource90.values()).reduce((s, v) => s + v, 0)

  if (total90 === 0) return null

  // Ranked list by 90-day total
  const sources = Array.from(bySource90.entries())
    .map(([type, xp90]) => ({
      type,
      xp90,
      xp30: bySource30.get(type) ?? 0,
      pct90: Math.round((xp90 / total90) * 100),
      pct30: total30 > 0 ? Math.round(((bySource30.get(type) ?? 0) / total30) * 100) : 0,
      meta: SOURCE_META[type] ?? { label: type, emoji: '⚡', color: '#8899BB', rgb: '136,153,187' },
    }))
    .sort((a, b) => b.xp90 - a.xp90)
    .slice(0, 6)

  const topSource = sources[0]!

  // Build daily XP for mini trend — last 30 days
  const dailyMap = new Map<string, number>()
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000).toISOString().split('T')[0]!
    dailyMap.set(d, 0)
  }
  for (const tx of recentTx) {
    const day = tx.created_at.split('T')[0]!
    if (dailyMap.has(day)) {
      dailyMap.set(day, dailyMap.get(day)! + (tx.amount ?? 0))
    }
  }
  const dailyValues = Array.from(dailyMap.values())
  const maxDaily = Math.max(...dailyValues, 1)

  return (
    <div
      className="rounded-2xl p-5 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(245,200,66,0.07) 0%, rgba(13,24,41,0.98) 100%)',
        border: '1px solid rgba(245,200,66,0.15)',
      }}
    >
      <div
        className="absolute -top-6 -right-6 w-28 h-28 rounded-full pointer-events-none blur-3xl"
        style={{ background: 'rgba(245,200,66,0.08)' }}
      />

      <div className="relative z-10 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(245,200,66,0.15)', border: '1px solid rgba(245,200,66,0.3)' }}
            >
              <Zap size={12} style={{ color: '#F5C842' }} fill="currentColor" />
            </div>
            <div>
              <div className="text-sm font-black">Fontes de XP</div>
              <div className="text-[10px] text-text-muted">Distribuição dos últimos 90 dias</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xl font-black text-brand-gold">
              +{total30.toLocaleString('pt-BR')}
            </div>
            <div className="text-[10px] text-text-muted">XP nos últimos 30d</div>
          </div>
        </div>

        {/* 30-day daily XP sparkline */}
        <div>
          <div className="text-[10px] text-text-muted mb-1.5">Atividade diária (30d)</div>
          <div className="flex items-end gap-[2px] h-10">
            {dailyValues.map((val, i) => {
              const h = Math.max(3, (val / maxDaily) * 100)
              const isToday = i === dailyValues.length - 1
              return (
                <div key={i} className="flex-1 flex flex-col justify-end" style={{ height: '100%' }}>
                  <div
                    className="w-full rounded-t-[2px]"
                    style={{
                      height: `${h}%`,
                      background: val === 0
                        ? 'rgba(255,255,255,0.04)'
                        : isToday
                        ? '#F5C842'
                        : val === maxDaily
                        ? 'rgba(245,200,66,0.9)'
                        : 'rgba(245,200,66,0.35)',
                    }}
                  />
                </div>
              )
            })}
          </div>
        </div>

        {/* Source breakdown bars */}
        <div className="space-y-2.5">
          {sources.map(s => (
            <div key={s.type}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">{s.meta.emoji}</span>
                  <span className="text-xs font-semibold" style={{ color: s.meta.color }}>
                    {s.meta.label}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-text-muted">
                    +{s.xp30.toLocaleString('pt-BR')} (30d)
                  </span>
                  <span className="text-xs font-black" style={{ color: s.meta.color }}>
                    {s.pct90}%
                  </span>
                </div>
              </div>
              <div
                className="h-2 rounded-full overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.06)' }}
              >
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${s.pct90}%`,
                    background: `linear-gradient(90deg, rgba(${s.meta.rgb},0.9), rgba(${s.meta.rgb},0.5))`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Insight */}
        <div
          className="rounded-xl px-3 py-2.5 flex items-center gap-2"
          style={{
            background: `rgba(${topSource.meta.rgb},0.06)`,
            border: `1px solid rgba(${topSource.meta.rgb},0.15)`,
          }}
        >
          <span className="text-base shrink-0">{topSource.meta.emoji}</span>
          <p className="text-[11px] text-text-secondary leading-snug">
            Sua maior fonte de XP é <strong style={{ color: topSource.meta.color }}>{topSource.meta.label}</strong> com {topSource.pct90}% do total.{' '}
            {topSource.pct90 > 70
              ? 'Diversifique suas fontes para subir de nível mais rápido!'
              : 'Boa distribuição — continue explorando todos os módulos.'}
          </p>
        </div>
      </div>
    </div>
  )
}
