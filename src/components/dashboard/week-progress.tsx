import { TrendingUp, Flame, Star } from 'lucide-react'

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
  // Build 7-day window
  const days: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().split('T')[0]!)
  }

  const today = new Date().toISOString().split('T')[0]!

  // Build per-habit log sets
  const habitData: HabitWeekData[] = habits.map((h) => ({
    habitId: h.id,
    habitName: h.name,
    habitIcon: h.icon,
    habitColor: h.color,
    loggedDays: new Set(
      weekLogs.filter((l) => l.habit_id === h.id).map((l) => l.logged_date)
    ),
  }))

  // Build XP per day map
  const xpByDay = new Map(weekXp.map((d) => [d.date, d.xp]))
  const maxXp = Math.max(...weekXp.map((d) => d.xp), 1)
  const totalWeekXp = weekXp.reduce((s, d) => s + d.xp, 0)

  // Count perfect days in the week (all habits logged)
  const perfectDays = habits.length > 0
    ? days.filter((day) =>
        habits.every((h) => habitData.find((hd) => hd.habitId === h.id)?.loggedDays.has(day))
      ).length
    : 0

  // Overall completion rate
  const totalSlots = habits.length * 7
  const totalLogged = weekLogs.filter((l) => days.includes(l.logged_date)).length
  const completionRate = totalSlots > 0 ? Math.round((totalLogged / totalSlots) * 100) : 0

  if (habits.length === 0) return null

  return (
    <div className="card p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-lg flex items-center gap-2">
          <TrendingUp size={18} className="text-brand-orange" />
          Progresso da Semana
        </h2>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-text-muted">{completionRate}% completo</span>
          {perfectDays > 0 && (
            <span className="flex items-center gap-1 text-brand-gold font-medium">
              <Star size={13} fill="currentColor" /> {perfectDays} {perfectDays === 1 ? 'perfeito' : 'perfeitos'}
            </span>
          )}
        </div>
      </div>

      {/* XP Sparkline */}
      <div className="space-y-2">
        <div className="text-xs text-text-muted uppercase tracking-wider flex items-center justify-between">
          <span>XP esta semana</span>
          <span className="text-brand-gold font-bold">+{totalWeekXp.toLocaleString('pt-BR')}</span>
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
                    className={`w-full rounded-t-sm transition-all ${
                      isToday
                        ? 'bg-brand-orange'
                        : xp > 0
                        ? 'bg-brand-orange/40'
                        : 'bg-bg-elevated'
                    }`}
                    style={{ height }}
                    title={`${label}: +${xp} XP`}
                  />
                </div>
                <span className={`text-[10px] ${isToday ? 'text-brand-orange font-bold' : 'text-text-muted'}`}>
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
          <div className="space-y-1.5">
            {habitData.map((hd) => {
              const weekCount = days.filter((d) => hd.loggedDays.has(d)).length
              return (
                <div key={hd.habitId} className="flex items-center gap-2">
                  <span className="text-base w-6 text-center shrink-0">{hd.habitIcon}</span>
                  <span className="text-xs text-text-secondary flex-1 truncate min-w-0">{hd.habitName}</span>
                  <div className="flex gap-1 shrink-0">
                    {days.map((day) => {
                      const done = hd.loggedDays.has(day)
                      const isToday = day === today
                      return (
                        <div
                          key={day}
                          className={`w-4 h-4 rounded-sm transition-all ${
                            done
                              ? 'opacity-100'
                              : 'bg-bg-elevated opacity-60'
                          } ${isToday && !done ? 'ring-1 ring-brand-orange/50' : ''}`}
                          style={done ? { backgroundColor: hd.habitColor } : {}}
                          title={`${DAY_LABELS[new Date(day + 'T12:00:00').getDay()!]}: ${done ? '✓' : '✗'}`}
                        />
                      )
                    })}
                  </div>
                  <span className="text-[10px] text-text-muted w-8 text-right shrink-0">
                    {weekCount}/7
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Streak bar */}
      {streakCurrent >= 3 && (
        <div className="flex items-center gap-2 p-3 bg-brand-orange/10 border border-brand-orange/20 rounded-xl">
          <Flame size={16} className="text-brand-orange" />
          <span className="text-sm font-medium">
            🔥 Você está em sequência de <strong className="text-brand-orange">{streakCurrent} dias</strong>!
          </span>
        </div>
      )}
    </div>
  )
}
