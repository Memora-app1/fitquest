import { TrendingUp, Flame, Star, Zap } from 'lucide-react'

interface HabitWeekData {
  habitId: string
  habitName: string
  habitIcon: string
  habitColor: string
  loggedDays: Set<string>
}

interface DayXp {
  date: string
  xp: number
}

interface WeekProgressProps {
  habits: { id: string; name: string; icon: string; color: string }[]
  weekLogs: { habit_id: string; logged_date: string }[]
  weekXp: DayXp[]
  streakCurrent: number
}

const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export function WeekProgress({ habits, weekLogs, weekXp, streakCurrent }: WeekProgressProps) {
  const days: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().split('T')[0]!)
  }

  const today = new Date().toISOString().split('T')[0]!

  const habitData: HabitWeekData[] = habits.map((h) => ({
    habitId: h.id,
    habitName: h.name,
    habitIcon: h.icon,
    habitColor: h.color,
    loggedDays: new Set(
      weekLogs.filter((l) => l.habit_id === h.id).map((l) => l.logged_date)
    ),
  }))

  const xpByDay = new Map(weekXp.map((d) => [d.date, d.xp]))
  const maxXp = Math.max(...weekXp.map((d) => d.xp), 1)
  const totalWeekXp = weekXp.reduce((s, d) => s + d.xp, 0)

  const perfectDays = habits.length > 0
    ? days.filter((day) =>
        habits.every((h) => habitData.find((hd) => hd.habitId === h.id)?.loggedDays.has(day))
      ).length
    : 0

  const totalSlots = habits.length * 7
  const totalLogged = weekLogs.filter((l) => days.includes(l.logged_date)).length
  const completionRate = totalSlots > 0 ? Math.round((totalLogged / totalSlots) * 100) : 0

  const completionColor = completionRate >= 80 ? '#00FF88' : completionRate >= 50 ? '#F5C842' : '#FF4D00'

  if (habits.length === 0) return null

  return (
    <div
      className="rounded-2xl p-6 space-y-5"
      style={{
        background: 'linear-gradient(135deg, rgba(124,58,237,0.07) 0%, rgba(13,24,41,0.98) 100%)',
        border: '1px solid rgba(124,58,237,0.18)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-base flex items-center gap-2">
          <TrendingUp size={16} className="text-brand-purple" />
          Semana
        </h2>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold" style={{ color: completionColor }}>{completionRate}%</span>
          {perfectDays > 0 && (
            <span className="flex items-center gap-1 text-brand-gold font-medium text-xs">
              <Star size={11} fill="currentColor" /> {perfectDays}d perfeito{perfectDays > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* XP Sparkline */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-text-muted uppercase tracking-wider">XP esta semana</span>
          <span className="text-brand-gold font-bold flex items-center gap-1">
            <Zap size={10} fill="currentColor" />
            +{totalWeekXp.toLocaleString('pt-BR')}
          </span>
        </div>
        <div className="flex items-end gap-1 h-12">
          {days.map((day) => {
            const xp = xpByDay.get(day) ?? 0
            const height = maxXp > 0 ? Math.max(4, Math.round((xp / maxXp) * 48)) : 4
            const isToday = day === today
            const label = DAY_LABELS[new Date(day + 'T12:00:00').getDay()]!
            return (
              <div key={day} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex items-end justify-center" style={{ height: 48 }}>
                  <div
                    className="w-full rounded-t transition-all"
                    style={{
                      height,
                      background: isToday
                        ? 'linear-gradient(180deg, #FF4D00, #FF4D00AA)'
                        : xp > 0
                        ? 'linear-gradient(180deg, rgba(255,77,0,0.5), rgba(255,77,0,0.2))'
                        : 'rgba(255,255,255,0.04)',
                      boxShadow: isToday ? '0 0 8px rgba(255,77,0,0.4)' : 'none',
                    }}
                    title={`${label}: +${xp} XP`}
                  />
                </div>
                <span
                  className="text-[10px]"
                  style={{ color: isToday ? '#FF4D00' : '#8899BB', fontWeight: isToday ? 700 : 400 }}
                >
                  {label}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Habit heatmap */}
      {habitData.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs text-text-muted uppercase tracking-wider">Hábitos</div>
          <div className="space-y-2">
            {habitData.map((hd) => {
              const weekCount = days.filter((d) => hd.loggedDays.has(d)).length
              const habitPct = Math.round((weekCount / 7) * 100)
              return (
                <div key={hd.habitId} className="flex items-center gap-2">
                  <span className="text-sm w-6 text-center shrink-0">{hd.habitIcon}</span>
                  <span className="text-xs text-text-secondary flex-1 truncate min-w-0">{hd.habitName}</span>
                  <div className="flex gap-0.5 shrink-0">
                    {days.map((day) => {
                      const done = hd.loggedDays.has(day)
                      const isToday = day === today
                      return (
                        <div
                          key={day}
                          className="w-4 h-4 rounded-sm transition-all"
                          style={{
                            backgroundColor: done ? hd.habitColor : 'rgba(255,255,255,0.04)',
                            opacity: done ? 1 : 0.5,
                            outline: isToday && !done ? `1px solid ${hd.habitColor}50` : 'none',
                            boxShadow: done && isToday ? `0 0 6px ${hd.habitColor}50` : 'none',
                          }}
                          title={`${DAY_LABELS[new Date(day + 'T12:00:00').getDay()!]}: ${done ? '✓' : '✗'}`}
                        />
                      )
                    })}
                  </div>
                  <span
                    className="text-[10px] w-8 text-right shrink-0 font-medium"
                    style={{ color: habitPct >= 80 ? '#00FF88' : habitPct >= 40 ? '#F5C842' : '#8899BB' }}
                  >
                    {weekCount}/7
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Streak highlight */}
      {streakCurrent >= 3 && (
        <div
          className="flex items-center gap-2 p-3 rounded-xl"
          style={{
            background: 'rgba(255,77,0,0.08)',
            border: '1px solid rgba(255,77,0,0.2)',
          }}
        >
          <Flame size={15} className="text-brand-orange shrink-0" />
          <span className="text-sm">
            🔥 Sequência de <strong className="text-brand-orange">{streakCurrent} dias</strong>!
          </span>
        </div>
      )}
    </div>
  )
}
