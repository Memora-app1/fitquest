import { createClient } from '@/lib/supabase/server'
import { Flame, Trophy } from 'lucide-react'

export async function HabitStreakRecords({ userId }: { userId: string }) {
  const supabase = await createClient()

  const ninetyDaysAgo = new Date(Date.now() - 90 * 86400000).toISOString().split('T')[0]!

  const [habitsRes, logsRes] = await Promise.all([
    supabase
      .from('habits')
      .select('id, name, icon, color')
      .eq('user_id', userId)
      .eq('is_active', true),
    supabase
      .from('habit_logs')
      .select('habit_id, logged_date')
      .eq('user_id', userId)
      .gte('logged_date', ninetyDaysAgo)
      .order('logged_date', { ascending: true }),
  ])

  const habits = habitsRes.data ?? []
  if (habits.length === 0) return null

  const logs = logsRes.data ?? []
  if (logs.length === 0) return null

  // Build per-habit date sets
  const habitDates = new Map<string, Set<string>>()
  for (const l of logs) {
    if (!habitDates.has(l.habit_id)) habitDates.set(l.habit_id, new Set())
    habitDates.get(l.habit_id)!.add(l.logged_date)
  }

  // Compute current and best streak per habit
  const today = new Date().toISOString().split('T')[0]!

  function computeStreaks(dateSet: Set<string>): { current: number; best: number; total: number } {
    if (dateSet.size === 0) return { current: 0, best: 0, total: 0 }

    // Sort dates
    const sorted = Array.from(dateSet).sort()
    let current = 0
    let best = 0
    let streak = 1

    // Current streak from today backwards
    let checkDate = new Date(today)
    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0]!
      if (dateSet.has(dateStr)) {
        current++
        checkDate.setDate(checkDate.getDate() - 1)
      } else {
        break
      }
    }

    // Best streak in last 90 days
    for (let i = 1; i < sorted.length; i++) {
      const prev = new Date(sorted[i - 1]! + 'T12:00:00')
      const curr = new Date(sorted[i]! + 'T12:00:00')
      const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86400000)
      if (diffDays === 1) {
        streak++
        best = Math.max(best, streak)
      } else {
        streak = 1
      }
    }
    best = Math.max(best, streak, current)

    return { current, best, total: dateSet.size }
  }

  type HabitRecord = {
    id: string
    name: string
    icon: string
    color: string
    current: number
    best: number
    total: number
    consistency: number
  }

  const records: HabitRecord[] = habits
    .map(h => {
      const dates = habitDates.get(h.id) ?? new Set<string>()
      const { current, best, total } = computeStreaks(dates)
      const consistency = Math.round((total / 90) * 100)
      return { ...h, current, best, total, consistency }
    })
    .filter(r => r.total > 0)
    .sort((a, b) => b.current - a.current || b.best - a.best)

  if (records.length === 0) return null

  const maxStreak = Math.max(...records.map(r => r.best), 1)
  const champion = records[0]!

  return (
    <div
      className="rounded-2xl p-5 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(255,77,0,0.07) 0%, rgba(13,24,41,0.98) 100%)',
        border: '1px solid rgba(255,77,0,0.15)',
      }}
    >
      <div
        className="absolute -top-6 -right-6 w-28 h-28 rounded-full pointer-events-none blur-3xl"
        style={{ background: 'rgba(255,77,0,0.1)' }}
      />

      <div className="relative z-10 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(255,77,0,0.15)', border: '1px solid rgba(255,77,0,0.3)' }}
            >
              <Flame size={12} style={{ color: '#FF4D00' }} fill="currentColor" />
            </div>
            <div>
              <div className="text-sm font-black">Recordes de hábitos</div>
              <div className="text-[10px] text-text-muted">Streak atual e melhor nos últimos 90 dias</div>
            </div>
          </div>
          {champion.current > 0 && (
            <div
              className="flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-xl"
              style={{ background: 'rgba(255,77,0,0.12)', border: '1px solid rgba(255,77,0,0.3)', color: '#FF4D00' }}
            >
              <Flame size={12} fill="currentColor" />
              {champion.current}d em sequência
            </div>
          )}
        </div>

        {/* Habits list */}
        <div className="space-y-2.5">
          {records.map((r, i) => {
            const isFirst = i === 0
            const streakBarPct = maxStreak > 0 ? (r.best / maxStreak) * 100 : 0
            const currentBarPct = r.best > 0 ? (r.current / r.best) * 100 : 0

            return (
              <div
                key={r.id}
                className="rounded-xl p-3 relative overflow-hidden"
                style={{
                  background: isFirst ? `${r.color}08` : 'rgba(255,255,255,0.025)',
                  border: isFirst ? `1px solid ${r.color}25` : '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <div className="flex items-start gap-3">
                  {/* Rank / icon */}
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0"
                    style={{
                      background: isFirst ? `${r.color}20` : 'rgba(255,255,255,0.05)',
                    }}
                  >
                    {isFirst ? <Trophy size={14} style={{ color: r.color }} /> : <span>{r.icon}</span>}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1.5">
                    {/* Name row */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold truncate">{r.name}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] text-text-muted">{r.consistency}% consistência</span>
                        {r.current > 0 && (
                          <span
                            className="text-[10px] font-black flex items-center gap-0.5 px-1.5 py-0.5 rounded-full"
                            style={{ background: 'rgba(255,77,0,0.12)', color: '#FF4D00' }}
                          >
                            <Flame size={8} fill="currentColor" />
                            {r.current}d
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Best streak bar */}
                    <div className="space-y-0.5">
                      <div className="flex items-center justify-between text-[9px] text-text-muted">
                        <span>Melhor: {r.best}d</span>
                        <span>Atual: {r.current}d</span>
                      </div>
                      <div
                        className="h-2 rounded-full overflow-hidden relative"
                        style={{ background: 'rgba(255,255,255,0.05)' }}
                      >
                        {/* Best streak bar */}
                        <div
                          className="absolute inset-y-0 left-0 rounded-full"
                          style={{
                            width: `${streakBarPct}%`,
                            background: `${r.color}40`,
                          }}
                        />
                        {/* Current streak bar on top */}
                        <div
                          className="absolute inset-y-0 left-0 rounded-full"
                          style={{
                            width: `${(streakBarPct * currentBarPct) / 100}%`,
                            background: r.color,
                            boxShadow: r.current > 0 ? `0 0 6px ${r.color}60` : 'none',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="text-[10px] text-text-muted text-center">
          Barra clara = melhor streak · Barra colorida = streak atual
        </div>
      </div>
    </div>
  )
}
