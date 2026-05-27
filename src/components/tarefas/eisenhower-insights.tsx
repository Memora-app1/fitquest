import { createClient } from '@/lib/supabase/server'
import { Target, TrendingUp, AlertTriangle, Zap } from 'lucide-react'

interface TaskRow {
  id: string
  urgent: boolean
  important: boolean
  status: string
  completed_at: string | null
  created_at: string
  xp_reward: number
}

interface QuadrantData {
  key: string
  label: string
  fullLabel: string
  emoji: string
  color: string
  rgb: string
  advice: string
  active: number
  doneMonth: number
  doneTotal: number
  completionRate: number | null
  avgDaysToComplete: number | null
}

interface WeeklyBucket {
  label: string
  q1: number
  q2: number
  q3: number
  q4: number
}

function toISO(d: Date): string {
  return d.toISOString().split('T')[0]!
}

function quadrantKey(urgent: boolean, important: boolean): string {
  if (urgent && important) return 'Q1'
  if (!urgent && important) return 'Q2'
  if (urgent && !important) return 'Q3'
  return 'Q4'
}

export async function EisenhowerInsights({ userId }: { userId: string }) {
  const supabase = await createClient()

  const now = new Date()
  const thirtyDaysAgo = toISO(new Date(now.getTime() - 30 * 86400000))
  const todayStr = toISO(now)

  const [activeRes, doneMonthRes, doneTotalRes] = await Promise.all([
    // All non-archived, non-done tasks
    supabase
      .from('tasks')
      .select('id, urgent, important, status, completed_at, created_at, xp_reward')
      .eq('user_id', userId)
      .not('status', 'eq', 'archived')
      .not('status', 'eq', 'done'),
    // Done tasks from last 30 days
    supabase
      .from('tasks')
      .select('id, urgent, important, status, completed_at, created_at, xp_reward')
      .eq('user_id', userId)
      .eq('status', 'done')
      .gte('completed_at', thirtyDaysAgo + 'T00:00:00'),
    // All done tasks (for totals)
    supabase
      .from('tasks')
      .select('id, urgent, important, status, completed_at, created_at, xp_reward')
      .eq('user_id', userId)
      .eq('status', 'done'),
  ])

  const activeTasks = (activeRes.data ?? []) as TaskRow[]
  const doneMonth = (doneMonthRes.data ?? []) as TaskRow[]
  const doneAll = (doneTotalRes.data ?? []) as TaskRow[]

  if (activeTasks.length === 0 && doneAll.length === 0) return null

  // Count active tasks per quadrant
  const activeByQ: Record<string, number> = { Q1: 0, Q2: 0, Q3: 0, Q4: 0 }
  for (const t of activeTasks) {
    activeByQ[quadrantKey(t.urgent, t.important)]!++
  }

  // Count done-this-month per quadrant
  const doneMonthByQ: Record<string, number> = { Q1: 0, Q2: 0, Q3: 0, Q4: 0 }
  for (const t of doneMonth) {
    doneMonthByQ[quadrantKey(t.urgent, t.important)]!++
  }

  // Count done-all-time per quadrant
  const doneTotalByQ: Record<string, number> = { Q1: 0, Q2: 0, Q3: 0, Q4: 0 }
  for (const t of doneAll) {
    doneTotalByQ[quadrantKey(t.urgent, t.important)]!++
  }

  // Average days to complete (done tasks with both created_at and completed_at)
  const avgDaysByQ: Record<string, number | null> = { Q1: null, Q2: null, Q3: null, Q4: null }
  for (const qKey of ['Q1', 'Q2', 'Q3', 'Q4'] as const) {
    const tasksWithDates = doneAll.filter(t => {
      return quadrantKey(t.urgent, t.important) === qKey && t.completed_at && t.created_at
    })
    if (tasksWithDates.length > 0) {
      const totalDays = tasksWithDates.reduce((s, t) => {
        const created = new Date(t.created_at).getTime()
        const completed = new Date(t.completed_at!).getTime()
        return s + Math.max(0, (completed - created) / 86400000)
      }, 0)
      avgDaysByQ[qKey] = Math.round(totalDays / tasksWithDates.length)
    }
  }

  // Completion rate per quadrant = done / (active + done)
  const quadrants: QuadrantData[] = [
    {
      key: 'Q1',
      label: 'Fazer Agora',
      fullLabel: 'Urgente + Importante',
      emoji: '🔴',
      color: '#EF4444',
      rgb: '239,68,68',
      advice: 'Crises e prazos. Minimize por planejamento.',
      active: activeByQ.Q1!,
      doneMonth: doneMonthByQ.Q1!,
      doneTotal: doneTotalByQ.Q1!,
      completionRate: (activeByQ.Q1! + doneTotalByQ.Q1!) > 0
        ? Math.round((doneTotalByQ.Q1! / (activeByQ.Q1! + doneTotalByQ.Q1!)) * 100)
        : null,
      avgDaysToComplete: avgDaysByQ.Q1!,
    },
    {
      key: 'Q2',
      label: 'Agendar',
      fullLabel: 'Importante, não urgente',
      emoji: '🟢',
      color: '#00FF88',
      rgb: '0,255,136',
      advice: 'Planejamento, crescimento. Priorize este quadrante.',
      active: activeByQ.Q2!,
      doneMonth: doneMonthByQ.Q2!,
      doneTotal: doneTotalByQ.Q2!,
      completionRate: (activeByQ.Q2! + doneTotalByQ.Q2!) > 0
        ? Math.round((doneTotalByQ.Q2! / (activeByQ.Q2! + doneTotalByQ.Q2!)) * 100)
        : null,
      avgDaysToComplete: avgDaysByQ.Q2!,
    },
    {
      key: 'Q3',
      label: 'Delegar',
      fullLabel: 'Urgente, não importante',
      emoji: '🟡',
      color: '#F5C842',
      rgb: '245,200,66',
      advice: 'Interrupções. Delegue sempre que possível.',
      active: activeByQ.Q3!,
      doneMonth: doneMonthByQ.Q3!,
      doneTotal: doneTotalByQ.Q3!,
      completionRate: (activeByQ.Q3! + doneTotalByQ.Q3!) > 0
        ? Math.round((doneTotalByQ.Q3! / (activeByQ.Q3! + doneTotalByQ.Q3!)) * 100)
        : null,
      avgDaysToComplete: avgDaysByQ.Q3!,
    },
    {
      key: 'Q4',
      label: 'Eliminar',
      fullLabel: 'Nem urgente, nem importante',
      emoji: '⚪',
      color: '#5A6B8A',
      rgb: '90,107,138',
      advice: 'Distrações. Elimine ou reduza drasticamente.',
      active: activeByQ.Q4!,
      doneMonth: doneMonthByQ.Q4!,
      doneTotal: doneTotalByQ.Q4!,
      completionRate: (activeByQ.Q4! + doneTotalByQ.Q4!) > 0
        ? Math.round((doneTotalByQ.Q4! / (activeByQ.Q4! + doneTotalByQ.Q4!)) * 100)
        : null,
      avgDaysToComplete: avgDaysByQ.Q4!,
    },
  ]

  const totalActive = activeTasks.length
  const totalDoneMonth = doneMonth.length

  // Focus Score: percentage of active tasks in Q2 (ideal state)
  const focusScore = totalActive > 0
    ? Math.round((activeByQ.Q2! / totalActive) * 100)
    : null

  // Crisis Rate: percentage of active tasks in Q1
  const crisisRate = totalActive > 0
    ? Math.round((activeByQ.Q1! / totalActive) * 100)
    : null

  // Delegation rate: Q3 / total
  const delegateRate = totalActive > 0
    ? Math.round((activeByQ.Q3! / totalActive) * 100)
    : null

  // Waste Rate: Q4 / total
  const wasteRate = totalActive > 0
    ? Math.round((activeByQ.Q4! / totalActive) * 100)
    : null

  // Weekly completion breakdown — last 4 weeks
  const weeklyBuckets: WeeklyBucket[] = []
  for (let w = 3; w >= 0; w--) {
    const weekStart = new Date(now.getTime() - (w + 1) * 7 * 86400000)
    const weekEnd   = new Date(now.getTime() - w * 7 * 86400000)
    const weekStartStr = toISO(weekStart)
    const weekEndStr   = toISO(weekEnd)

    const weekTasks = doneAll.filter(t => {
      if (!t.completed_at) return false
      const d = t.completed_at.split('T')[0]!
      return d >= weekStartStr && d < weekEndStr
    })

    const q1 = weekTasks.filter(t => t.urgent && t.important).length
    const q2 = weekTasks.filter(t => !t.urgent && t.important).length
    const q3 = weekTasks.filter(t => t.urgent && !t.important).length
    const q4 = weekTasks.filter(t => !t.urgent && !t.important).length

    const weekLabel = weekStart.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
    weeklyBuckets.push({ label: weekLabel, q1, q2, q3, q4 })
  }

  const maxWeeklyDone = Math.max(...weeklyBuckets.map(w => w.q1 + w.q2 + w.q3 + w.q4), 1)

  // Stacked distribution bar for active tasks
  const maxActiveQ = Math.max(...quadrants.map(q => q.active), 1)

  // Prioritization health score (0-100):
  // +40 for low Q1 rate (< 20%)
  // +40 for high Q2 rate (> 40%)
  // +20 for low Q4 rate (< 20%)
  let healthScore = 0
  if (crisisRate !== null) {
    healthScore += crisisRate < 10 ? 40 : crisisRate < 20 ? 28 : crisisRate < 30 ? 15 : 5
  }
  if (focusScore !== null) {
    healthScore += focusScore > 60 ? 40 : focusScore > 40 ? 28 : focusScore > 20 ? 15 : 5
  }
  if (wasteRate !== null) {
    healthScore += wasteRate < 10 ? 20 : wasteRate < 20 ? 14 : wasteRate < 30 ? 7 : 2
  }

  const healthColor = healthScore >= 80 ? '#00FF88' : healthScore >= 60 ? '#F5C842' : healthScore >= 40 ? '#FF4D00' : '#EF4444'
  const healthLabel = healthScore >= 80 ? 'Excelente foco' : healthScore >= 60 ? 'Boa priorização' : healthScore >= 40 ? 'Precisa melhorar' : 'Alto nível de crises'

  if (totalActive === 0 && doneAll.length === 0) return null

  return (
    <div
      className="rounded-2xl p-5 md:p-6 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(255,77,0,0.05) 0%, rgba(13,24,41,0.98) 60%, rgba(0,255,136,0.04) 100%)',
        border: '1px solid rgba(255,77,0,0.12)',
      }}
    >
      <div
        className="absolute -top-8 -right-8 w-40 h-40 rounded-full pointer-events-none blur-3xl"
        style={{ background: 'rgba(255,77,0,0.06)' }}
      />

      <div className="relative z-10 space-y-5">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(255,77,0,0.12)', border: '1px solid rgba(255,77,0,0.22)' }}
              >
                <Target size={12} style={{ color: '#FF4D00' }} />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-text-muted">
                Insights de Priorização
              </span>
            </div>
            <h2 className="text-xl font-black leading-tight">Análise Eisenhower</h2>
            <p className="text-sm text-text-muted mt-0.5">
              {totalActive} tarefas ativas · {totalDoneMonth} concluídas este mês
            </p>
          </div>

          {/* Health score */}
          {totalActive > 0 && (
            <div className="text-right">
              <div className="text-3xl font-black" style={{ color: healthColor }}>
                {healthScore}
              </div>
              <div className="text-[10px] text-text-muted uppercase tracking-wider">score de foco</div>
              <div className="text-[10px] font-bold mt-0.5" style={{ color: healthColor }}>
                {healthLabel}
              </div>
            </div>
          )}
        </div>

        {/* ── Key metrics strip ────────────────────────────────────────── */}
        {totalActive > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
            {[
              {
                label: 'Taxa de crise',
                value: crisisRate !== null ? `${crisisRate}%` : '–',
                subtext: 'no Q1',
                color: crisisRate !== null && crisisRate > 30 ? '#EF4444' : crisisRate !== null && crisisRate > 15 ? '#FF4D00' : '#00FF88',
                rgb: crisisRate !== null && crisisRate > 30 ? '239,68,68' : crisisRate !== null && crisisRate > 15 ? '255,77,0' : '0,255,136',
                good: crisisRate !== null && crisisRate <= 15,
              },
              {
                label: 'Foco estratégico',
                value: focusScore !== null ? `${focusScore}%` : '–',
                subtext: 'no Q2',
                color: focusScore !== null && focusScore >= 40 ? '#00FF88' : focusScore !== null && focusScore >= 20 ? '#F5C842' : '#FF4D00',
                rgb: focusScore !== null && focusScore >= 40 ? '0,255,136' : focusScore !== null && focusScore >= 20 ? '245,200,66' : '255,77,0',
                good: focusScore !== null && focusScore >= 40,
              },
              {
                label: 'Taxa delegação',
                value: delegateRate !== null ? `${delegateRate}%` : '–',
                subtext: 'no Q3',
                color: '#F5C842',
                rgb: '245,200,66',
                good: null,
              },
              {
                label: 'Taxa desperdício',
                value: wasteRate !== null ? `${wasteRate}%` : '–',
                subtext: 'no Q4',
                color: wasteRate !== null && wasteRate > 20 ? '#EF4444' : '#5A6B8A',
                rgb: wasteRate !== null && wasteRate > 20 ? '239,68,68' : '90,107,138',
                good: wasteRate !== null && wasteRate <= 10,
              },
            ].map(s => (
              <div
                key={s.label}
                className="rounded-xl p-3"
                style={{
                  background: `linear-gradient(135deg, rgba(${s.rgb},0.07) 0%, rgba(13,24,41,0.98) 100%)`,
                  border: `1px solid rgba(${s.rgb},0.14)`,
                }}
              >
                <div className="text-[9px] text-text-muted uppercase tracking-wider mb-1">{s.label}</div>
                <div className="font-black text-sm leading-none" style={{ color: s.color }}>{s.value}</div>
                <div className="text-[9px] text-text-muted mt-0.5">{s.subtext}</div>
              </div>
            ))}
          </div>
        )}

        {/* ── Quadrant breakdown ───────────────────────────────────────── */}
        <div className="space-y-2">
          <div className="text-[10px] text-text-muted uppercase tracking-wider">Distribuição por Quadrante</div>
          <div className="space-y-2.5">
            {quadrants.map(q => {
              const activePct = totalActive > 0 ? Math.round((q.active / totalActive) * 100) : 0

              return (
                <div key={q.key} className="space-y-1">
                  {/* Header row */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm shrink-0">{q.emoji}</span>
                    <span className="text-xs font-bold w-24 shrink-0">{q.label}</span>
                    <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${activePct}%`,
                          background: q.color,
                          opacity: 0.8,
                        }}
                      />
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-bold w-10 text-right" style={{ color: q.color }}>
                        {q.active}
                      </span>
                      <span className="text-[9px] text-text-muted w-6 text-right">{activePct}%</span>
                    </div>
                  </div>

                  {/* Sub-info */}
                  <div className="flex items-center gap-3 pl-7 text-[9px] text-text-muted">
                    <span>{q.fullLabel}</span>
                    {q.completionRate !== null && (
                      <span>· {q.completionRate}% concluídas</span>
                    )}
                    {q.avgDaysToComplete !== null && (
                      <span>· avg {q.avgDaysToComplete}d</span>
                    )}
                    {q.doneMonth > 0 && (
                      <span style={{ color: '#00FF88' }}>· +{q.doneMonth} este mês</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── 4-week completion history per quadrant ───────────────────── */}
        {doneAll.length > 0 && (
          <div className="space-y-2">
            <div className="text-[10px] text-text-muted uppercase tracking-wider">Conclusões por Semana</div>
            <div className="flex items-end gap-2 h-20">
              {weeklyBuckets.map((w, i) => {
                const total = w.q1 + w.q2 + w.q3 + w.q4
                const totalH = Math.round((total / maxWeeklyDone) * 56)

                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    {total > 0 && (
                      <span className="text-[8px] text-text-muted">{total}</span>
                    )}
                    {/* Stacked bar */}
                    <div
                      className="w-full flex flex-col-reverse rounded-t-sm overflow-hidden"
                      style={{ height: `${Math.max(4, totalH)}px` }}
                    >
                      {/* Q4 bottom */}
                      {w.q4 > 0 && (
                        <div
                          style={{
                            height: `${Math.round((w.q4 / Math.max(total, 1)) * Math.max(4, totalH))}px`,
                            background: 'rgba(90,107,138,0.6)',
                          }}
                        />
                      )}
                      {/* Q3 */}
                      {w.q3 > 0 && (
                        <div
                          style={{
                            height: `${Math.round((w.q3 / Math.max(total, 1)) * Math.max(4, totalH))}px`,
                            background: 'rgba(245,200,66,0.7)',
                          }}
                        />
                      )}
                      {/* Q2 */}
                      {w.q2 > 0 && (
                        <div
                          style={{
                            height: `${Math.round((w.q2 / Math.max(total, 1)) * Math.max(4, totalH))}px`,
                            background: 'rgba(0,255,136,0.7)',
                          }}
                        />
                      )}
                      {/* Q1 top */}
                      {w.q1 > 0 && (
                        <div
                          style={{
                            height: `${Math.round((w.q1 / Math.max(total, 1)) * Math.max(4, totalH))}px`,
                            background: 'rgba(239,68,68,0.8)',
                          }}
                        />
                      )}
                    </div>

                    <span className="text-[8px] text-text-muted capitalize">
                      {w.label}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Week legend */}
            <div className="flex items-center gap-4 text-[9px] text-text-muted flex-wrap">
              {[
                { color: 'rgba(239,68,68,0.8)', label: 'Q1 Crise' },
                { color: 'rgba(0,255,136,0.7)', label: 'Q2 Foco' },
                { color: 'rgba(245,200,66,0.7)', label: 'Q3 Delegar' },
                { color: 'rgba(90,107,138,0.6)', label: 'Q4 Eliminar' },
              ].map(l => (
                <div key={l.label} className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-sm" style={{ background: l.color }} />
                  <span>{l.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Insight footer ───────────────────────────────────────────── */}
        <div
          className="rounded-xl px-4 py-3 flex items-center gap-3"
          style={{
            background: crisisRate !== null && crisisRate > 30
              ? 'rgba(239,68,68,0.05)'
              : focusScore !== null && focusScore >= 40
              ? 'rgba(0,255,136,0.04)'
              : 'rgba(255,77,0,0.04)',
            border: crisisRate !== null && crisisRate > 30
              ? '1px solid rgba(239,68,68,0.1)'
              : focusScore !== null && focusScore >= 40
              ? '1px solid rgba(0,255,136,0.1)'
              : '1px solid rgba(255,77,0,0.1)',
          }}
        >
          <span className="text-lg shrink-0">
            {healthScore >= 80 ? '🏆' : healthScore >= 60 ? '💚' : healthScore >= 40 ? '⚡' : '🚨'}
          </span>
          <div>
            <p className="text-sm font-semibold leading-snug">{healthLabel}</p>
            <p className="text-[11px] text-text-muted mt-0.5">
              {crisisRate !== null && crisisRate > 30
                ? `${crisisRate}% das tarefas estão em crise (Q1). Planeje mais para reduzir urgências.`
                : focusScore !== null && focusScore >= 40
                ? `${focusScore}% das tarefas estão em Q2 — você está priorizando o que importa de verdade.`
                : wasteRate !== null && wasteRate > 25
                ? `${wasteRate}% das tarefas são Q4. Considere eliminar ou arquivar essas tarefas.`
                : 'Meta: mover tarefas de Q1 para Q2 com planejamento antecipado. Q2 = crescimento real.'}
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}
