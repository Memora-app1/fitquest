import { Flame, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'

function getLast7Days(): string[] {
  const days: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().split('T')[0]!)
  }
  return days
}

const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export function StreakWidget({
  current,
  longest,
  activeDays = [],
}: {
  current: number
  longest: number
  activeDays?: string[]
}) {
  const last7 = getLast7Days()
  const activeSet = new Set(activeDays)
  const todayStr = new Date().toISOString().split('T')[0]!

  const isOnFire = current >= 7
  const accentColor = current === 0 ? '#EF4444' : isOnFire ? '#FF4D00' : '#F59E0B'

  // Calculate next milestone
  let nextMilestone = 7
  let milestoneName = 'Fogo Aceso'
  if (current >= 7) { nextMilestone = 30; milestoneName = 'Mês Implacável' }
  if (current >= 30) { nextMilestone = 100; milestoneName = 'Centenário' }
  if (current >= 100) { nextMilestone = 365; milestoneName = 'Um Ano Épico' }

  const prevMilestone = current >= 100 ? 100 : current >= 30 ? 30 : current >= 7 ? 7 : 0
  const progressPct = current >= 365
    ? 100
    : Math.min(100, Math.round(((current - prevMilestone) / (nextMilestone - prevMilestone)) * 100))

  const activeThisWeek = last7.filter((d) => activeSet.has(d)).length

  return (
    <div
      className="rounded-2xl p-6 relative overflow-hidden"
      style={{
        background: isOnFire
          ? 'linear-gradient(135deg, rgba(255,77,0,0.1) 0%, rgba(13,24,41,0.98) 60%, rgba(245,200,66,0.05) 100%)'
          : current === 0
          ? 'linear-gradient(135deg, rgba(239,68,68,0.06) 0%, rgba(13,24,41,0.98) 100%)'
          : 'linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(13,24,41,0.98) 100%)',
        border: `1px solid ${accentColor}30`,
        boxShadow: `0 4px 24px ${accentColor}08`,
      }}
    >
      {/* Corner glow */}
      <div
        className="absolute -top-6 -right-6 w-32 h-32 rounded-full pointer-events-none blur-2xl"
        style={{ backgroundColor: accentColor, opacity: 0.12 }}
      />

      <div className="relative z-10 space-y-4">
        {/* Top row: current streak + record */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-text-muted text-xs uppercase tracking-wider mb-1.5">
              <Flame size={11} style={{ color: accentColor }} fill="currentColor" />
              Streak Atual
            </div>
            <div className="heading-display text-5xl leading-none flex items-baseline gap-2" style={{ color: accentColor }}>
              {current}
            </div>
            <div className="text-text-secondary text-sm mt-1">
              {current === 0
                ? 'Comece hoje!'
                : current === 1
                ? 'dia consecutivo 🔥'
                : 'dias consecutivos'}
            </div>
          </div>
          <div className="text-right space-y-1">
            <div className="flex items-center gap-1.5 justify-end">
              <Trophy size={13} className="text-brand-gold" />
              <div className="heading-display text-2xl text-brand-gold">{longest}</div>
            </div>
            <div className="text-xs text-text-muted uppercase tracking-wide">Recorde</div>
            {activeThisWeek > 0 && (
              <div className="text-xs font-medium mt-1" style={{ color: '#00FF88' }}>{activeThisWeek}/7 essa sem.</div>
            )}
          </div>
        </div>

        {/* 7-day dot chart */}
        <div className="flex justify-between gap-1">
          {last7.map((day) => {
            const active = activeSet.has(day)
            const isToday = day === todayStr
            const dayOfWeek = new Date(`${day}T12:00:00`).getDay()
            return (
              <div key={day} className="flex flex-col items-center gap-1.5 flex-1">
                <div
                  className="w-full aspect-square max-w-[34px] rounded-xl flex items-center justify-center text-xs font-bold transition-all"
                  style={{
                    background: active
                      ? `linear-gradient(135deg, ${accentColor}, ${accentColor}CC)`
                      : isToday
                      ? `${accentColor}15`
                      : 'rgba(255,255,255,0.04)',
                    border: active
                      ? 'none'
                      : isToday
                      ? `2px solid ${accentColor}50`
                      : '1px solid rgba(255,255,255,0.08)',
                    boxShadow: active ? `0 0 8px ${accentColor}40` : 'none',
                    color: active ? '#fff' : isToday ? accentColor : '#8899BB',
                  }}
                >
                  {active ? '✓' : isToday ? '·' : ''}
                </div>
                <span
                  className="text-[10px] leading-none"
                  style={{ color: isToday ? accentColor : '#8899BB', fontWeight: isToday ? 600 : 400 }}
                >
                  {DAY_LABELS[dayOfWeek]}
                </span>
              </div>
            )
          })}
        </div>

        {/* Progress to next milestone */}
        {current < 365 && (
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-text-secondary">
                🎯 {milestoneName}{' '}
                <span className="text-text-muted">
                  em {nextMilestone - current} dia{nextMilestone - current !== 1 ? 's' : ''}
                </span>
              </span>
              <span className="text-text-muted">{current}/{nextMilestone}</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${progressPct}%`,
                  background: `linear-gradient(90deg, ${accentColor}, ${accentColor}AA)`,
                  boxShadow: `0 0 6px ${accentColor}40`,
                }}
              />
            </div>
          </div>
        )}

        {current >= 365 && (
          <div
            className="text-sm font-bold text-center py-2 rounded-xl"
            style={{ background: 'rgba(255,77,0,0.1)', border: '1px solid rgba(255,77,0,0.2)', color: '#FF4D00' }}
          >
            ⚡ Um ano épico. Você é uma lenda.
          </div>
        )}

        {current === 0 && (
          <p className="text-xs text-text-muted text-center">
            Registre 1 hábito hoje pra começar uma nova sequência 💪
          </p>
        )}
      </div>
    </div>
  )
}
