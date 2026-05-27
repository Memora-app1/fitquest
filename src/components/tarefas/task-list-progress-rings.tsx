import { createClient } from '@/lib/supabase/server'
import { Layers, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react'

interface ListRow {
  id: string
  name: string
  icon: string | null
  color: string | null
}

interface TaskRow {
  id: string
  list_id: string | null
  status: string
  due_date: string | null
  completed_at: string | null
  created_at: string
  urgent: boolean
  important: boolean
}

const DEFAULT_COLORS = [
  '#7C3AED', '#FF4D00', '#00FF88', '#F5C842',
  '#3B82F6', '#EC4899', '#00D9FF', '#8B5CF6',
]

export async function TaskListProgressRings({ userId }: { userId: string }) {
  const supabase = await createClient()

  const now = new Date()
  const todayStr = now.toISOString().split('T')[0]!

  const [listsRes, tasksRes] = await Promise.all([
    supabase
      .from('task_lists')
      .select('id, name, icon, color')
      .eq('user_id', userId)
      .order('created_at'),
    supabase
      .from('tasks')
      .select('id, list_id, status, due_date, completed_at, created_at, urgent, important')
      .eq('user_id', userId)
      .not('status', 'eq', 'archived'),
  ])

  const lists = (listsRes.data ?? []) as ListRow[]
  const tasks = (tasksRes.data ?? []) as TaskRow[]

  if (lists.length === 0 || tasks.length === 0) return null

  interface ListStat {
    list: ListRow
    color: string
    total: number
    done: number
    doing: number
    todo: number
    overdue: number
    critical: number   // urgent + important + not done
    pct: number
    avgCycleDays: number | null
  }

  const stats: ListStat[] = lists.map((list, idx) => {
    const listTasks = tasks.filter(t => t.list_id === list.id)
    const color = list.color ?? DEFAULT_COLORS[idx % DEFAULT_COLORS.length]!

    const total = listTasks.length
    const done = listTasks.filter(t => t.status === 'done').length
    const doing = listTasks.filter(t => t.status === 'doing').length
    const todo = listTasks.filter(t => t.status === 'todo').length

    const overdue = listTasks.filter(t => {
      if (!t.due_date || t.status === 'done') return false
      return t.due_date < todayStr
    }).length

    const critical = listTasks.filter(t =>
      t.urgent && t.important && t.status !== 'done'
    ).length

    const pct = total > 0 ? Math.round((done / total) * 100) : 0

    // Avg cycle time for done tasks
    const cycleTimes = listTasks
      .filter(t => t.status === 'done' && t.completed_at)
      .map(t => {
        const created = new Date(t.created_at).getTime()
        const completed = new Date(t.completed_at!).getTime()
        return (completed - created) / 86400000
      })
      .filter(d => d >= 0 && d <= 365)

    const avgCycleDays = cycleTimes.length > 0
      ? Math.round(cycleTimes.reduce((a, b) => a + b, 0) / cycleTimes.length)
      : null

    return { list, color, total, done, doing, todo, overdue, critical, pct, avgCycleDays }
  }).filter(s => s.total > 0)

  if (stats.length === 0) return null

  const totalTasks = stats.reduce((s, l) => s + l.total, 0)
  const totalDone = stats.reduce((s, l) => s + l.done, 0)
  const totalOverdue = stats.reduce((s, l) => s + l.overdue, 0)
  const totalCritical = stats.reduce((s, l) => s + l.critical, 0)
  const overallPct = totalTasks > 0 ? Math.round((totalDone / totalTasks) * 100) : 0

  // Sort: most critical/overdue first, then by pct asc (less complete first)
  stats.sort((a, b) => {
    const scoreA = a.overdue * 3 + a.critical * 2
    const scoreB = b.overdue * 3 + b.critical * 2
    if (scoreB !== scoreA) return scoreB - scoreA
    return a.pct - b.pct
  })

  return (
    <div
      className="rounded-2xl p-5 md:p-6 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(124,58,237,0.06) 0%, rgba(13,24,41,0.98) 60%, rgba(0,255,136,0.04) 100%)',
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
                <Layers size={12} style={{ color: '#7C3AED' }} />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-text-muted">
                Progresso por lista
              </span>
            </div>
            <h2 className="text-xl font-black leading-tight">Visão de Portfolio</h2>
            <p className="text-sm text-text-muted mt-0.5">
              {stats.length} lista{stats.length !== 1 ? 's' : ''} · {totalTasks} tarefa{totalTasks !== 1 ? 's' : ''} · {overallPct}% concluído
            </p>
          </div>

          <div className="flex items-center gap-3">
            {totalOverdue > 0 && (
              <div className="text-right">
                <div className="text-2xl font-black" style={{ color: '#EF4444' }}>{totalOverdue}</div>
                <div className="text-[10px] text-text-muted uppercase tracking-wider">atrasadas</div>
              </div>
            )}
            {totalCritical > 0 && (
              <>
                {totalOverdue > 0 && <div className="w-px h-8 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }} />}
                <div className="text-right">
                  <div className="text-2xl font-black" style={{ color: '#FF4D00' }}>{totalCritical}</div>
                  <div className="text-[10px] text-text-muted uppercase tracking-wider">críticas</div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Progress Rings Grid ───────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {stats.map((s, idx) => {
            const radius = 34
            const circumference = 2 * Math.PI * radius
            const strokeDash = (s.pct / 100) * circumference
            const hasUrgency = s.overdue > 0 || s.critical > 0

            return (
              <div
                key={s.list.id}
                className="rounded-xl p-4 flex flex-col items-center gap-3 relative"
                style={{
                  background: hasUrgency
                    ? 'linear-gradient(135deg, rgba(239,68,68,0.06) 0%, rgba(13,24,41,0.98) 100%)'
                    : s.pct >= 80
                    ? 'linear-gradient(135deg, rgba(0,255,136,0.06) 0%, rgba(13,24,41,0.98) 100%)'
                    : 'rgba(255,255,255,0.025)',
                  border: hasUrgency
                    ? '1px solid rgba(239,68,68,0.2)'
                    : s.pct >= 80
                    ? '1px solid rgba(0,255,136,0.15)'
                    : '1px solid rgba(255,255,255,0.05)',
                }}
              >
                {/* Urgency badge */}
                {(s.overdue > 0 || s.critical > 0) && (
                  <div
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
                    style={{ background: '#EF4444', fontSize: '8px', color: 'white', fontWeight: 'bold' }}
                  >
                    {s.overdue + s.critical}
                  </div>
                )}

                {/* Progress ring */}
                <div className="relative" style={{ width: 76, height: 76 }}>
                  <svg width="76" height="76" style={{ transform: 'rotate(-90deg)' }}>
                    {/* Background track */}
                    <circle
                      cx="38" cy="38" r={radius}
                      fill="none"
                      stroke="rgba(255,255,255,0.06)"
                      strokeWidth="6"
                    />
                    {/* Doing arc (lighter shade) */}
                    {s.doing > 0 && (
                      <circle
                        cx="38" cy="38" r={radius}
                        fill="none"
                        stroke={s.color}
                        strokeWidth="6"
                        strokeDasharray={`${((s.done + s.doing) / s.total) * circumference} ${circumference}`}
                        strokeLinecap="round"
                        opacity={0.3}
                      />
                    )}
                    {/* Done arc */}
                    <circle
                      cx="38" cy="38" r={radius}
                      fill="none"
                      stroke={s.pct >= 100 ? '#00FF88' : s.color}
                      strokeWidth="6"
                      strokeDasharray={`${strokeDash} ${circumference}`}
                      strokeLinecap="round"
                      opacity={0.9}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-sm font-black" style={{ color: s.pct >= 100 ? '#00FF88' : s.color }}>
                      {s.pct}%
                    </span>
                    {s.list.icon && (
                      <span className="text-xs">{s.list.icon}</span>
                    )}
                  </div>
                </div>

                {/* List name */}
                <div className="text-center">
                  <div className="text-xs font-bold truncate max-w-[100px]">{s.list.name}</div>
                  <div className="text-[9px] text-text-muted mt-0.5">
                    {s.done}/{s.total} concluídas
                  </div>
                </div>

                {/* Mini status bars */}
                <div className="w-full space-y-1">
                  {/* Done */}
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 size={8} style={{ color: '#00FF88', flexShrink: 0 }} />
                    <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${s.total > 0 ? (s.done / s.total) * 100 : 0}%`,
                          background: '#00FF88',
                          opacity: 0.7,
                        }}
                      />
                    </div>
                  </div>
                  {/* Doing */}
                  <div className="flex items-center gap-1.5">
                    <Clock size={8} style={{ color: s.color, flexShrink: 0 }} />
                    <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${s.total > 0 ? (s.doing / s.total) * 100 : 0}%`,
                          backgroundColor: s.color,
                          opacity: 0.7,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Alerts row */}
                {(s.overdue > 0 || s.critical > 0 || s.avgCycleDays !== null) && (
                  <div className="w-full flex items-center justify-between gap-1 flex-wrap">
                    {s.overdue > 0 && (
                      <span
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5"
                        style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444' }}
                      >
                        <AlertTriangle size={7} /> {s.overdue}
                      </span>
                    )}
                    {s.critical > 0 && (
                      <span
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{ background: 'rgba(255,77,0,0.15)', color: '#FF4D00' }}
                      >
                        🎯 {s.critical}
                      </span>
                    )}
                    {s.avgCycleDays !== null && s.avgCycleDays > 0 && (
                      <span className="text-[9px] text-text-muted">
                        ~{s.avgCycleDays}d/tarefa
                      </span>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* ── Overall summary strip ─────────────────────────────────────── */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Total', value: totalTasks, color: '#8899BB' },
            { label: 'Concluídas', value: totalDone, color: '#00FF88' },
            { label: 'Atrasadas', value: totalOverdue, color: '#EF4444' },
            { label: 'Críticas', value: totalCritical, color: '#FF4D00' },
          ].map(item => (
            <div
              key={item.label}
              className="rounded-xl p-3 text-center"
              style={{
                background: 'rgba(255,255,255,0.025)',
                border: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              <div className="text-xl font-black" style={{ color: item.color }}>
                {item.value}
              </div>
              <div className="text-[9px] text-text-muted mt-0.5 uppercase tracking-wider">
                {item.label}
              </div>
            </div>
          ))}
        </div>

        {/* ── Insight Footer ───────────────────────────────────────────── */}
        <div
          className="rounded-xl px-4 py-3 flex items-center gap-3"
          style={{
            background: 'rgba(124,58,237,0.05)',
            border: '1px solid rgba(124,58,237,0.12)',
          }}
        >
          <span className="text-lg shrink-0">
            {totalOverdue > 0 ? '⚠️' : overallPct >= 80 ? '🏆' : '💼'}
          </span>
          <div>
            <p className="text-sm font-semibold leading-snug">
              {totalOverdue > 0
                ? `${totalOverdue} tarefa${totalOverdue !== 1 ? 's' : ''} atrasada${totalOverdue !== 1 ? 's' : ''} em ${stats.filter(s => s.overdue > 0).length} lista${stats.filter(s => s.overdue > 0).length !== 1 ? 's' : ''}. Priorize hoje!`
                : overallPct >= 80
                ? `Portfolio em ótimo estado — ${overallPct}% das tarefas concluídas.`
                : `${totalTasks - totalDone} tarefa${(totalTasks - totalDone) !== 1 ? 's' : ''} pendente${(totalTasks - totalDone) !== 1 ? 's' : ''} em ${stats.length} lista${stats.length !== 1 ? 's' : ''}.`}
            </p>
            <p className="text-[11px] text-text-muted mt-0.5">
              {stats[0] !== undefined
                ? `Lista mais urgente: ${stats[0].list.name} (${stats[0].pct}% concluído)`
                : 'Organize suas tarefas por listas para ter esta visão.'}
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}
