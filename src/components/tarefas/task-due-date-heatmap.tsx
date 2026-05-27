import { createClient } from '@/lib/supabase/server'
import { Calendar, AlertTriangle, CheckCircle2, Clock } from 'lucide-react'

interface TaskRow {
  id: string
  title: string
  status: string
  due_date: string | null
  urgent: boolean
  important: boolean
}

const DOW_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
const PT_MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

function getMondayOf(d: Date): Date {
  const dow = (d.getDay() + 6) % 7
  const monday = new Date(d)
  monday.setDate(d.getDate() - dow)
  monday.setHours(0, 0, 0, 0)
  return monday
}

function toISO(d: Date): string {
  return d.toISOString().split('T')[0]!
}

export async function TaskDueDateHeatmap({ userId }: { userId: string }) {
  const supabase = await createClient()

  const now = new Date()
  const todayStr = toISO(now)

  // All non-done, non-archived tasks with due dates (next 8 weeks + overdue)
  const eightWeeksAhead = new Date(now.getTime() + 56 * 86400000)
  const eightWeeksAheadStr = toISO(eightWeeksAhead)

  // Also go back 30 days to catch overdue tasks
  const thirtyDaysBack = new Date(now.getTime() - 30 * 86400000)
  const thirtyDaysBackStr = toISO(thirtyDaysBack)

  const { data: raw } = await supabase
    .from('tasks')
    .select('id, title, status, due_date, urgent, important')
    .eq('user_id', userId)
    .not('status', 'in', '(done,archived)')
    .not('due_date', 'is', null)
    .gte('due_date', thirtyDaysBackStr)
    .lte('due_date', eightWeeksAheadStr)
    .order('due_date')

  const tasks = (raw ?? []) as TaskRow[]
  if (tasks.length === 0) return null

  // Separate overdue vs upcoming
  const overdueTasks = tasks.filter(t => t.due_date! < todayStr)
  const upcomingTasks = tasks.filter(t => t.due_date! >= todayStr)

  if (upcomingTasks.length === 0 && overdueTasks.length === 0) return null

  // Build 6-week calendar grid (Mon-Sun rows) starting from this week's Monday
  const weekStart = getMondayOf(now)
  const weeksCount = 6

  interface DayData {
    dateStr: string
    tasks: TaskRow[]
    isToday: boolean
    isPast: boolean
    isCurrentMonth: boolean
    dayNum: number
    monthLabel: string | null
  }

  const weeks: DayData[][] = []
  let prevMonth = -1

  for (let w = 0; w < weeksCount; w++) {
    const week: DayData[] = []
    for (let d = 0; d < 7; d++) {
      const cellDate = new Date(weekStart.getTime() + (w * 7 + d) * 86400000)
      const dateStr = toISO(cellDate)
      const dayTasks = upcomingTasks.filter(t => t.due_date === dateStr)
      const m = cellDate.getMonth()

      let monthLabel: string | null = null
      if (d === 0 && m !== prevMonth) {
        monthLabel = PT_MONTHS[m] ?? ''
        prevMonth = m
      }

      week.push({
        dateStr,
        tasks: dayTasks,
        isToday: dateStr === todayStr,
        isPast: dateStr < todayStr,
        isCurrentMonth: m === now.getMonth(),
        dayNum: cellDate.getDate(),
        monthLabel,
      })
    }
    weeks.push(week)
  }

  // Max tasks per day (for heat scaling)
  const maxTasksPerDay = Math.max(...weeks.flat().map(d => d.tasks.length), 1)

  function cellBg(day: DayData): string {
    if (day.isToday) return 'rgba(245,200,66,0.15)'
    if (day.isPast) return 'rgba(255,255,255,0.02)'
    const count = day.tasks.length
    if (count === 0) return 'rgba(255,255,255,0.03)'
    const hasCritical = day.tasks.some(t => t.urgent && t.important)
    const hasUrgent = day.tasks.some(t => t.urgent)
    if (hasCritical) return 'rgba(239,68,68,0.18)'
    if (hasUrgent) return 'rgba(255,77,0,0.12)'
    const intensity = count / maxTasksPerDay
    return `rgba(124,58,237,${0.06 + intensity * 0.18})`
  }

  function cellBorder(day: DayData): string {
    if (day.isToday) return '1px solid rgba(245,200,66,0.5)'
    const hasCritical = day.tasks.some(t => t.urgent && t.important)
    const hasUrgent = day.tasks.some(t => t.urgent)
    if (hasCritical && day.tasks.length > 0) return '1px solid rgba(239,68,68,0.35)'
    if (hasUrgent && day.tasks.length > 0) return '1px solid rgba(255,77,0,0.2)'
    if (day.tasks.length >= 3) return '1px solid rgba(124,58,237,0.3)'
    if (day.tasks.length > 0) return '1px solid rgba(124,58,237,0.15)'
    return '1px solid transparent'
  }

  // Find busiest day ahead
  const busiest = upcomingTasks.reduce<{ date: string; count: number } | null>((best, _, __, arr) => {
    const counts = new Map<string, number>()
    for (const t of arr) {
      counts.set(t.due_date!, (counts.get(t.due_date!) ?? 0) + 1)
    }
    const entries = Array.from(counts.entries())
    if (entries.length === 0) return null
    const top = entries.reduce((m, e) => e[1] > m[1] ? e : m)
    return { date: top[0], count: top[1] }
  }, null)

  // Stats
  const criticalCount = upcomingTasks.filter(t => t.urgent && t.important).length
  const urgentCount = upcomingTasks.filter(t => t.urgent && !t.important).length
  const normalCount = upcomingTasks.filter(t => !t.urgent).length

  // Next 7 days summary
  const next7Str = toISO(new Date(now.getTime() + 7 * 86400000))
  const tasksNext7 = upcomingTasks.filter(t => t.due_date! <= next7Str)

  return (
    <div
      className="rounded-2xl p-5 md:p-6 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(124,58,237,0.06) 0%, rgba(13,24,41,0.98) 60%, rgba(239,68,68,0.04) 100%)',
        border: '1px solid rgba(124,58,237,0.14)',
      }}
    >
      <div
        className="absolute -top-8 -right-8 w-40 h-40 rounded-full pointer-events-none blur-3xl"
        style={{ background: 'rgba(124,58,237,0.07)' }}
      />

      <div className="relative z-10 space-y-5">

        {/* ── Header ────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(124,58,237,0.14)', border: '1px solid rgba(124,58,237,0.26)' }}
              >
                <Calendar size={12} style={{ color: '#7C3AED' }} />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-text-muted">
                Calendário de prazos — 6 semanas
              </span>
            </div>
            <h2 className="text-xl font-black leading-tight">Mapa de Vencimentos</h2>
            <p className="text-sm text-text-muted mt-0.5">
              {upcomingTasks.length} tarefa{upcomingTasks.length !== 1 ? 's' : ''} com prazo
              {overdueTasks.length > 0 ? ` · ${overdueTasks.length} atrasada${overdueTasks.length !== 1 ? 's' : ''}` : ''}
            </p>
          </div>

          {tasksNext7.length > 0 && (
            <div
              className="px-3 py-2 rounded-xl text-right"
              style={{
                background: criticalCount > 0 ? 'rgba(239,68,68,0.08)' : 'rgba(124,58,237,0.08)',
                border: criticalCount > 0 ? '1px solid rgba(239,68,68,0.2)' : '1px solid rgba(124,58,237,0.2)',
              }}
            >
              <div className="text-[10px] text-text-muted uppercase tracking-wider">Próximos 7 dias</div>
              <div
                className="text-2xl font-black"
                style={{ color: criticalCount > 0 ? '#EF4444' : '#7C3AED' }}
              >
                {tasksNext7.length}
              </div>
              <div className="text-[9px] text-text-muted">tarefas vencendo</div>
            </div>
          )}
        </div>

        {/* ── Overdue alert ─────────────────────────────────────────────── */}
        {overdueTasks.length > 0 && (
          <div
            className="rounded-xl px-4 py-3 flex items-center gap-3"
            style={{
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.25)',
            }}
          >
            <AlertTriangle size={16} style={{ color: '#EF4444', flexShrink: 0 }} />
            <div>
              <p className="text-sm font-bold" style={{ color: '#EF4444' }}>
                {overdueTasks.length} tarefa{overdueTasks.length !== 1 ? 's' : ''} com prazo vencido
              </p>
              <p className="text-xs text-text-muted mt-0.5 truncate">
                {overdueTasks.slice(0, 3).map(t => t.title).join(' · ')}
                {overdueTasks.length > 3 ? ` +${overdueTasks.length - 3}` : ''}
              </p>
            </div>
          </div>
        )}

        {/* ── Calendar Grid ─────────────────────────────────────────────── */}
        <div>
          {/* DOW headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {DOW_LABELS.map(label => (
              <div key={label} className="text-center text-[9px] text-text-muted font-medium py-1">
                {label}
              </div>
            ))}
          </div>

          {/* Week rows */}
          <div className="space-y-1">
            {weeks.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7 gap-1">
                {week.map((day, di) => (
                  <div
                    key={di}
                    className="rounded-lg p-1.5 relative transition-all duration-150 cursor-default hover:scale-105"
                    style={{
                      minHeight: '52px',
                      background: cellBg(day),
                      border: cellBorder(day),
                    }}
                    title={
                      day.tasks.length > 0
                        ? day.tasks.map(t => t.title).join('\n')
                        : day.dateStr
                    }
                  >
                    {/* Month label (only on first day of month) */}
                    {day.monthLabel && (
                      <div className="text-[7px] font-bold text-text-muted uppercase absolute top-0.5 left-1">
                        {day.monthLabel}
                      </div>
                    )}

                    {/* Day number */}
                    <div
                      className="text-[10px] font-bold text-center mt-1"
                      style={{
                        color: day.isToday ? '#F5C842'
                          : day.isPast ? 'rgba(255,255,255,0.25)'
                          : day.isCurrentMonth ? 'rgba(255,255,255,0.7)'
                          : 'rgba(255,255,255,0.3)',
                      }}
                    >
                      {day.dayNum}
                    </div>

                    {/* Task dots */}
                    {day.tasks.length > 0 && (
                      <div className="flex flex-wrap gap-0.5 mt-1 justify-center">
                        {day.tasks.slice(0, 5).map((t, ti) => {
                          const isCrit = t.urgent && t.important
                          const isUrg = t.urgent && !t.important
                          return (
                            <div
                              key={ti}
                              className="rounded-full"
                              style={{
                                width: '5px',
                                height: '5px',
                                background: isCrit ? '#EF4444' : isUrg ? '#FF4D00' : '#7C3AED',
                              }}
                            />
                          )
                        })}
                        {day.tasks.length > 5 && (
                          <div className="text-[7px] text-text-muted font-bold">
                            +{day.tasks.length - 5}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Task count badge for 3+ */}
                    {day.tasks.length >= 3 && (
                      <div
                        className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-black"
                        style={{
                          background: day.tasks.some(t => t.urgent) ? '#EF4444' : '#7C3AED',
                          color: 'white',
                        }}
                      >
                        {day.tasks.length}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* ── Legend ───────────────────────────────────────────────────── */}
        <div className="flex items-center gap-4 flex-wrap text-[9px] text-text-muted">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm" style={{ background: 'rgba(239,68,68,0.18)', border: '1px solid rgba(239,68,68,0.35)' }} />
            <span>Crítico (urgente+importante)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm" style={{ background: 'rgba(255,77,0,0.12)', border: '1px solid rgba(255,77,0,0.2)' }} />
            <span>Urgente</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm" style={{ background: 'rgba(124,58,237,0.18)', border: '1px solid rgba(124,58,237,0.3)' }} />
            <span>Normal</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm" style={{ background: 'rgba(245,200,66,0.15)', border: '1px solid rgba(245,200,66,0.5)' }} />
            <span>Hoje</span>
          </div>
        </div>

        {/* ── Stats ────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3">
          <div
            className="rounded-xl p-3 text-center"
            style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.14)' }}
          >
            <div className="text-xl font-black" style={{ color: '#EF4444' }}>{criticalCount}</div>
            <div className="text-[9px] text-text-muted mt-0.5">Críticas</div>
          </div>
          <div
            className="rounded-xl p-3 text-center"
            style={{ background: 'rgba(255,77,0,0.07)', border: '1px solid rgba(255,77,0,0.14)' }}
          >
            <div className="text-xl font-black text-brand-orange">{urgentCount}</div>
            <div className="text-[9px] text-text-muted mt-0.5">Urgentes</div>
          </div>
          <div
            className="rounded-xl p-3 text-center"
            style={{ background: 'rgba(124,58,237,0.07)', border: '1px solid rgba(124,58,237,0.14)' }}
          >
            <div className="text-xl font-black text-brand-purple">{normalCount}</div>
            <div className="text-[9px] text-text-muted mt-0.5">Normais</div>
          </div>
        </div>

        {/* ── Busiest day insight ───────────────────────────────────────── */}
        {busiest && busiest.count >= 3 && (
          <div
            className="rounded-xl px-4 py-3 flex items-center gap-3"
            style={{
              background: 'rgba(124,58,237,0.05)',
              border: '1px solid rgba(124,58,237,0.12)',
            }}
          >
            <span className="text-lg shrink-0">⚠️</span>
            <div>
              <p className="text-sm font-semibold leading-snug">
                {new Date(busiest.date + 'T12:00:00').toLocaleDateString('pt-BR', {
                  weekday: 'long', day: 'numeric', month: 'long'
                })} tem {busiest.count} tarefas vencendo.
              </p>
              <p className="text-[11px] text-text-muted mt-0.5">
                Considere redistribuir prazos para evitar sobrecarga.
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
