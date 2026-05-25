import { Flame } from 'lucide-react'
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
    <div className="card-glow p-6 space-y-4">
      {/* Top row: current streak + record */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-text-secondary text-sm mb-1">
            <Flame size={14} />
            STREAK ATUAL
          </div>
          <div className="heading-display text-5xl text-brand-orange flex items-baseline gap-2">
            🔥 {current}
          </div>
          <div className="text-text-secondary text-sm mt-0.5">
            {current === 1 ? 'dia consecutivo' : 'dias consecutivos'}
          </div>
        </div>
        <div className="text-right">
          <div className="heading-display text-2xl text-text-secondary">{longest}</div>
          <div className="text-xs text-text-muted uppercase tracking-wide">Recorde</div>
          {activeThisWeek > 0 && (
            <div className="text-xs text-brand-green mt-1">{activeThisWeek}/7 essa sem.</div>
          )}
        </div>
      </div>

      {/* 7-day dot chart */}
      <div className="flex justify-between gap-1">
        {last7.map((day) => {
          const active = activeSet.has(day)
          const isToday = day === todayStr
          // parse dayOfWeek safely using noon time to avoid DST edge cases
          const dayOfWeek = new Date(`${day}T12:00:00`).getDay()
          return (
            <div key={day} className="flex flex-col items-center gap-1 flex-1">
              <div
                className={cn(
                  'w-full aspect-square max-w-[36px] rounded-full flex items-center justify-center text-xs font-bold transition-all',
                  active
                    ? 'bg-brand-orange text-white shadow-[0_0_10px_rgba(255,77,0,0.35)]'
                    : isToday
                    ? 'bg-bg-elevated border-2 border-brand-orange/60 text-brand-orange'
                    : 'bg-bg-elevated border border-border text-text-muted'
                )}
                title={day}
              >
                {active ? '✓' : isToday ? '·' : ''}
              </div>
              <span
                className={cn(
                  'text-[10px] leading-none',
                  isToday ? 'text-brand-orange font-semibold' : 'text-text-muted'
                )}
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
              🎯 {milestoneName} <span className="text-text-muted">em {nextMilestone - current} dia{nextMilestone - current !== 1 ? 's' : ''}</span>
            </span>
            <span className="text-text-muted">{current}/{nextMilestone}</span>
          </div>
          <div className="h-1.5 bg-bg-elevated rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-orange to-brand-gold rounded-full transition-all duration-700"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {current >= 365 && (
        <div className="text-sm text-brand-green font-bold text-center animate-pulse">
          ⚡ Um ano épico. Você é uma lenda.
        </div>
      )}

      {current === 0 && (
        <p className="text-xs text-text-muted">
          Registre 1 hábito hoje pra começar uma nova sequência 💪
        </p>
      )}
    </div>
  )
}
