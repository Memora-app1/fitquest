import { createClient } from '@/lib/supabase/server'
import { BarChart2, Flame, Star, Calendar } from 'lucide-react'

interface HabitRow {
  id: string
  name: string
  icon: string | null
  color: string | null
  xp_per_completion: number
}

interface LogRow {
  habit_id: string
  logged_date: string
}

interface HabitStat {
  id: string
  name: string
  icon: string
  color: string
  rgb: string
  completions30d: number
  rate30d: number      // %
  currentStreak: number
  bestStreak: number
  favDow: number       // 0=Sun..6=Sat
  xpEarned: number
  barPct: number
}

const DOW_SHORT = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

function hexToRgb(hex: string | null): string {
  if (!hex) return '255,77,0'
  const clean = hex.replace('#', '')
  if (clean.length !== 6) return '255,77,0'
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  return `${r},${g},${b}`
}

function toISO(d: Date): string {
  return d.toISOString().split('T')[0]!
}

export async function HabitStatsBreakdown({ userId }: { userId: string }) {
  const supabase = await createClient()

  const thirtyDaysAgo = toISO(new Date(Date.now() - 30 * 86400000))
  const today = toISO(new Date())

  const [habitsRes, logsRes] = await Promise.all([
    supabase
      .from('habits')
      .select('id, name, icon, color, xp_per_completion')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('display_order'),
    supabase
      .from('habit_logs')
      .select('habit_id, logged_date')
      .eq('user_id', userId)
      .gte('logged_date', thirtyDaysAgo)
      .order('logged_date', { ascending: false }),
  ])

  const habits = (habitsRes.data ?? []) as HabitRow[]
  const logs   = (logsRes.data ?? []) as LogRow[]

  if (habits.length === 0 || logs.length === 0) return null

  // Build per-habit → Set of logged dates (last 30 days)
  const logsByHabit = new Map<string, Set<string>>()
  for (const log of logs) {
    if (!logsByHabit.has(log.habit_id)) logsByHabit.set(log.habit_id, new Set())
    logsByHabit.get(log.habit_id)!.add(log.logged_date)
  }

  const stats: HabitStat[] = habits.map(h => {
    const datesSet = logsByHabit.get(h.id) ?? new Set<string>()
    const completions30d = datesSet.size

    // Rate: completions in last 30 days / 30 days
    const rate30d = Math.round((completions30d / 30) * 100)

    // Current streak (back from today)
    let currentStreak = 0
    const cursor = new Date()
    while (datesSet.has(toISO(cursor))) {
      currentStreak++
      cursor.setDate(cursor.getDate() - 1)
    }

    // Best streak (sliding window in last 30 days)
    let bestStreak = 0
    let runStreak  = 0
    for (let offset = 0; offset < 30; offset++) {
      const d = new Date(Date.now() - offset * 86400000)
      if (datesSet.has(toISO(d))) {
        runStreak++
        if (runStreak > bestStreak) bestStreak = runStreak
      } else {
        runStreak = 0
      }
    }
    if (currentStreak > bestStreak) bestStreak = currentStreak

    // Favorite day-of-week (0=Sun..6=Sat)
    const dowCount = [0, 0, 0, 0, 0, 0, 0]
    for (const dateStr of datesSet) {
      const dow = new Date(dateStr + 'T12:00:00').getDay()
      dowCount[dow] = (dowCount[dow] ?? 0) + 1
    }
    const favDow = dowCount.indexOf(Math.max(...dowCount))

    const xpEarned = completions30d * (h.xp_per_completion ?? 0)

    return {
      id:           h.id,
      name:         h.name,
      icon:         h.icon ?? '⚡',
      color:        h.color ?? '#FF4D00',
      rgb:          hexToRgb(h.color),
      completions30d,
      rate30d,
      currentStreak,
      bestStreak,
      favDow,
      xpEarned,
      barPct:       0, // set below
    }
  })

  if (stats.every(s => s.completions30d === 0)) return null

  // Sort by rate30d desc
  stats.sort((a, b) => b.rate30d - a.rate30d)

  const maxRate = stats[0]?.rate30d ?? 1
  for (const s of stats) s.barPct = Math.round((s.rate30d / Math.max(maxRate, 1)) * 100)

  const avgRate        = Math.round(stats.reduce((sum, s) => sum + s.rate30d, 0) / stats.length)
  const totalXp        = stats.reduce((sum, s) => sum + s.xpEarned, 0)
  const perfectHabits  = stats.filter(s => s.rate30d === 100).length
  const bestHabit      = stats[0]!
  const highStreakCount = stats.filter(s => s.currentStreak >= 7).length

  // Build 30-day day-by-day completion grid (how many habits logged per day)
  const dayTotals = new Map<string, number>()
  for (let offset = 0; offset < 30; offset++) {
    const d = toISO(new Date(Date.now() - offset * 86400000))
    dayTotals.set(d, 0)
  }
  for (const log of logs) {
    if (dayTotals.has(log.logged_date)) {
      dayTotals.set(log.logged_date, (dayTotals.get(log.logged_date) ?? 0) + 1)
    }
  }
  const perfectDays30 = Array.from(dayTotals.values()).filter(count => count === habits.length).length

  return (
    <div
      className="rounded-2xl p-5 md:p-6 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(0,255,136,0.05) 0%, rgba(13,24,41,0.98) 60%, rgba(124,58,237,0.03) 100%)',
        border: '1px solid rgba(0,255,136,0.12)',
      }}
    >
      <div
        className="absolute -top-8 -right-8 w-40 h-40 rounded-full pointer-events-none blur-3xl"
        style={{ background: 'rgba(0,255,136,0.05)' }}
      />

      <div className="relative z-10 space-y-5">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(0,255,136,0.12)', border: '1px solid rgba(0,255,136,0.22)' }}
              >
                <BarChart2 size={12} style={{ color: '#00FF88' }} />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-text-muted">
                Por Hábito — Últimos 30 dias
              </span>
            </div>
            <h2 className="text-xl font-black leading-tight">Análise Individual</h2>
            <p className="text-sm text-text-muted mt-0.5">
              {habits.length} hábito{habits.length !== 1 ? 's' : ''} · {perfectDays30} dia{perfectDays30 !== 1 ? 's' : ''} perfeito{perfectDays30 !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="text-right">
            <div
              className="text-3xl font-black"
              style={{ color: avgRate >= 70 ? '#00FF88' : avgRate >= 40 ? '#F5C842' : '#FF4D00' }}
            >
              {avgRate}%
            </div>
            <div className="text-[10px] text-text-muted uppercase tracking-wider">média geral</div>
          </div>
        </div>

        {/* ── Summary strip ───────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-2.5">
          {[
            {
              label: 'XP dos hábitos',
              value: `+${totalXp.toLocaleString('pt-BR')}`,
              sub: 'em 30 dias',
              color: '#F5C842',
              rgb: '245,200,66',
            },
            {
              label: 'Hábitos 100%',
              value: String(perfectHabits),
              sub: perfectHabits > 0 ? 'taxa perfeita' : 'nenhum ainda',
              color: '#00FF88',
              rgb: '0,255,136',
            },
            {
              label: 'Streak ≥7d',
              value: String(highStreakCount),
              sub: `de ${habits.length} hábitos`,
              color: '#FF4D00',
              rgb: '255,77,0',
            },
          ].map(s => (
            <div
              key={s.label}
              className="rounded-xl p-3 text-center"
              style={{
                background: `linear-gradient(135deg, rgba(${s.rgb},0.07) 0%, rgba(13,24,41,0.98) 100%)`,
                border: `1px solid rgba(${s.rgb},0.15)`,
              }}
            >
              <div className="text-[10px] text-text-muted uppercase tracking-wider mb-1 leading-tight">{s.label}</div>
              <div className="font-black text-base leading-none" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[9px] text-text-muted mt-0.5">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* ── Per-habit rows ───────────────────────────────────────────── */}
        <div className="space-y-4">
          {stats.map((s, i) => (
            <div key={s.id}>
              <div className="flex items-start gap-2.5">
                {/* Icon + rank */}
                <div className="relative shrink-0">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-base"
                    style={{
                      background: `rgba(${s.rgb},0.12)`,
                      border: `1px solid rgba(${s.rgb},0.2)`,
                    }}
                  >
                    {s.icon}
                  </div>
                  {i === 0 && (
                    <span
                      className="absolute -top-1 -right-1 text-[9px] font-bold px-1 rounded-full leading-none"
                      style={{ background: '#F5C842', color: '#050914' }}
                    >
                      #1
                    </span>
                  )}
                </div>

                {/* Main content */}
                <div className="flex-1 min-w-0">
                  {/* Name row */}
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold truncate">{s.name}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      {s.currentStreak >= 3 && (
                        <span
                          className="text-[9px] font-bold flex items-center gap-0.5"
                          style={{ color: '#FF4D00' }}
                        >
                          <Flame size={9} fill="currentColor" />
                          {s.currentStreak}d
                        </span>
                      )}
                      <span
                        className="text-xs font-black"
                        style={{ color: s.rate30d >= 70 ? '#00FF88' : s.rate30d >= 40 ? '#F5C842' : '#EF4444' }}
                      >
                        {s.rate30d}%
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="h-1.5 rounded-full overflow-hidden mb-1.5" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${s.rate30d}%`,
                        background: s.rate30d === 100
                          ? 'linear-gradient(90deg, #00FF88, #00CC6A)'
                          : s.rate30d >= 70
                          ? `rgba(${s.rgb},0.85)`
                          : s.rate30d >= 40
                          ? `rgba(${s.rgb},0.65)`
                          : `rgba(${s.rgb},0.4)`,
                      }}
                    />
                  </div>

                  {/* Sub-row: completions + streak + xp + fav day */}
                  <div className="flex items-center gap-3 text-[9px] text-text-muted flex-wrap">
                    <span>{s.completions30d} registros</span>
                    {s.bestStreak > 0 && (
                      <span className="flex items-center gap-0.5">
                        <Star size={8} style={{ color: '#F5C842' }} />
                        melhor: {s.bestStreak}d
                      </span>
                    )}
                    {s.xpEarned > 0 && (
                      <span style={{ color: '#F5C842' }}>+{s.xpEarned} XP</span>
                    )}
                    <span className="ml-auto flex items-center gap-0.5">
                      <Calendar size={8} />
                      {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][s.favDow]}
                    </span>
                  </div>

                  {/* DOW mini dots */}
                  <div className="flex gap-0.5 mt-1.5">
                    {DOW_SHORT.map((label, dow) => {
                      const datesSet = logsByHabit.get(s.id) ?? new Set<string>()
                      // Check how many times this DOW was logged in last 30 days
                      let logged = 0
                      let total  = 0
                      for (let offset = 0; offset < 30; offset++) {
                        const d = new Date(Date.now() - offset * 86400000)
                        if (d.getDay() === dow) {
                          total++
                          if (datesSet.has(toISO(d))) logged++
                        }
                      }
                      const pct = total > 0 ? logged / total : 0
                      return (
                        <div
                          key={dow}
                          title={`${['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'][dow]}: ${logged}/${total}`}
                          className="flex-1 h-5 rounded-sm flex items-center justify-center"
                          style={{
                            background: pct === 1
                              ? `rgba(${s.rgb},0.8)`
                              : pct >= 0.5
                              ? `rgba(${s.rgb},0.4)`
                              : pct > 0
                              ? `rgba(${s.rgb},0.15)`
                              : 'rgba(255,255,255,0.04)',
                          }}
                        >
                          <span
                            className="text-[8px] font-bold"
                            style={{ color: pct >= 0.5 ? s.color : 'rgba(136,153,187,0.5)' }}
                          >
                            {label}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {i < stats.length - 1 && (
                <div className="mt-4 h-px" style={{ background: 'rgba(255,255,255,0.04)' }} />
              )}
            </div>
          ))}
        </div>

        {/* ── Insight footer ───────────────────────────────────────────── */}
        <div
          className="rounded-xl px-4 py-3 flex items-center gap-3"
          style={{ background: 'rgba(0,255,136,0.04)', border: '1px solid rgba(0,255,136,0.1)' }}
        >
          <span className="text-lg shrink-0">
            {avgRate >= 80 ? '🔥' : avgRate >= 60 ? '💪' : avgRate >= 40 ? '⚡' : '🌱'}
          </span>
          <div>
            <p className="text-sm font-semibold leading-snug">
              Seu hábito mais consistente é{' '}
              <span className="font-black" style={{ color: bestHabit.color }}>
                {bestHabit.icon} {bestHabit.name}
              </span>{' '}
              com {bestHabit.rate30d}% de taxa em 30 dias.
            </p>
            {bestHabit.currentStreak > 0 && (
              <p className="text-[11px] text-text-muted mt-0.5">
                Streak atual:{' '}
                <span className="font-bold" style={{ color: '#FF4D00' }}>
                  {bestHabit.currentStreak} dia{bestHabit.currentStreak !== 1 ? 's' : ''}
                </span>{' '}
                seguido{bestHabit.currentStreak !== 1 ? 's' : ''}. Continue!
              </p>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}

