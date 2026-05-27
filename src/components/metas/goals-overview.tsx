import { createClient } from '@/lib/supabase/server'
import { Target, Flag, Zap, AlertTriangle, CheckCircle2, Trophy } from 'lucide-react'

interface GoalRow {
  id: string
  title: string
  icon: string | null
  category: string
  target_value: number
  current_value: number
  unit: string
  deadline: string | null
  status: string
  completed_at: string | null
  created_at: string
}

const CATEGORY_META: Record<string, { label: string; emoji: string; color: string; rgb: string }> = {
  fitness:     { label: 'Fitness',    emoji: '💪', color: '#FF4D00', rgb: '255,77,0' },
  saude:       { label: 'Saúde',      emoji: '❤️', color: '#EF4444', rgb: '239,68,68' },
  financeiro:  { label: 'Financeiro', emoji: '💰', color: '#F5C842', rgb: '245,200,66' },
  carreira:    { label: 'Carreira',   emoji: '🎓', color: '#7C3AED', rgb: '124,58,237' },
  educacao:    { label: 'Educação',   emoji: '📚', color: '#3B82F6', rgb: '59,130,246' },
  habitos:     { label: 'Hábitos',    emoji: '🎯', color: '#00FF88', rgb: '0,255,136' },
  pessoal:     { label: 'Pessoal',    emoji: '🌱', color: '#10B981', rgb: '16,185,129' },
  custom:      { label: 'Outro',      emoji: '⚡', color: '#8899BB', rgb: '136,153,187' },
}

function calcPct(current: number, target: number): number {
  if (target <= 0) return 0
  return Math.min(100, Math.round((current / target) * 100))
}

function daysUntil(dateStr: string): number {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const d = new Date(dateStr)
  d.setHours(0, 0, 0, 0)
  return Math.ceil((d.getTime() - now.getTime()) / 86400000)
}

function urgencyColor(days: number): string {
  if (days < 0) return '#EF4444'
  if (days <= 7) return '#FF4D00'
  if (days <= 30) return '#F5C842'
  return '#00FF88'
}

function urgencyLabel(days: number): string {
  if (days < 0) return `${Math.abs(days)}d atrasado`
  if (days === 0) return 'Vence hoje'
  if (days === 1) return 'Amanhã'
  if (days <= 7) return `${days}d restantes`
  if (days <= 30) return `${days}d restantes`
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
}

export async function GoalsOverview({ userId }: { userId: string }) {
  const supabase = await createClient()

  const { data: raw } = await supabase
    .from('goals')
    .select('id, title, icon, category, target_value, current_value, unit, deadline, status, completed_at, created_at')
    .eq('user_id', userId)
    .not('status', 'eq', 'cancelled')
    .order('created_at', { ascending: false })

  const goals: GoalRow[] = raw ?? []

  if (goals.length === 0) return null

  const activeGoals = goals.filter(g => g.status === 'active')
  const completedGoals = goals.filter(g => g.status === 'completed')
  const pausedGoals = goals.filter(g => g.status === 'paused')

  // ── Category breakdown ───────────────────────────────────────────────
  const categoryMap = new Map<string, { goals: GoalRow[]; totalPct: number }>()
  for (const g of goals) {
    const cat = g.category in CATEGORY_META ? g.category : 'custom'
    const existing = categoryMap.get(cat) ?? { goals: [], totalPct: 0 }
    existing.goals.push(g)
    existing.totalPct += calcPct(g.current_value, g.target_value)
    categoryMap.set(cat, existing)
  }

  const categoryBreakdown = Array.from(categoryMap.entries())
    .map(([cat, { goals: catGoals, totalPct }]) => ({
      cat,
      meta: CATEGORY_META[cat] ?? CATEGORY_META.custom!,
      total: catGoals.length,
      active: catGoals.filter(g => g.status === 'active').length,
      completed: catGoals.filter(g => g.status === 'completed').length,
      avgPct: Math.round(totalPct / catGoals.length),
    }))
    .sort((a, b) => b.total - a.total)

  // ── Deadline urgency (only active goals with deadline) ───────────────
  const goalsWithDeadline = activeGoals
    .filter(g => g.deadline)
    .map(g => ({
      ...g,
      days: daysUntil(g.deadline!),
      pct: calcPct(g.current_value, g.target_value),
    }))
    .sort((a, b) => a.days - b.days)
    .slice(0, 6)

  // ── Smart Insights ───────────────────────────────────────────────────
  const almostDone = activeGoals
    .map(g => ({ ...g, pct: calcPct(g.current_value, g.target_value) }))
    .filter(g => g.pct >= 70 && g.pct < 100)
    .sort((a, b) => b.pct - a.pct)[0]

  const atRisk = activeGoals
    .filter(g => g.deadline)
    .map(g => ({
      ...g,
      pct: calcPct(g.current_value, g.target_value),
      days: daysUntil(g.deadline!),
    }))
    .filter(g => g.days <= 14 && g.pct < 80)
    .sort((a, b) => a.days - b.days)[0]

  const overallAvgPct =
    goals.length > 0
      ? Math.round(goals.reduce((s, g) => s + calcPct(g.current_value, g.target_value), 0) / goals.length)
      : 0

  // SVG progress ring parameters (r=28, circumference=175.93)
  const ringCirc = 175.93
  const ringOffset = ringCirc - (overallAvgPct / 100) * ringCirc

  return (
    <div className="space-y-4">

      {/* ── Overall progress ring + quick stats ─────────────────────────── */}
      <div
        className="rounded-2xl p-5 md:p-6 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(0,255,136,0.06) 0%, rgba(13,24,41,0.98) 60%, rgba(245,200,66,0.04) 100%)',
          border: '1px solid rgba(0,255,136,0.14)',
        }}
      >
        <div
          className="absolute -top-8 -right-8 w-40 h-40 rounded-full pointer-events-none blur-3xl"
          style={{ background: 'rgba(0,255,136,0.07)' }}
        />

        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">

          {/* Progress ring */}
          <div className="shrink-0 relative">
            <svg width={88} height={88} viewBox="0 0 88 88">
              {/* Track */}
              <circle
                cx={44} cy={44} r={28}
                fill="none"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth={8}
              />
              {/* Progress arc */}
              <circle
                cx={44} cy={44} r={28}
                fill="none"
                stroke={overallAvgPct >= 75 ? '#00FF88' : overallAvgPct >= 40 ? '#F5C842' : '#FF4D00'}
                strokeWidth={8}
                strokeLinecap="round"
                strokeDasharray={ringCirc}
                strokeDashoffset={ringOffset}
                transform="rotate(-90 44 44)"
                style={{ transition: 'stroke-dashoffset 1s ease-out' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span
                className="font-black text-lg leading-none"
                style={{ color: overallAvgPct >= 75 ? '#00FF88' : overallAvgPct >= 40 ? '#F5C842' : '#FF4D00' }}
              >
                {overallAvgPct}%
              </span>
              <span className="text-[9px] text-text-muted leading-none mt-0.5">geral</span>
            </div>
          </div>

          {/* Stats */}
          <div className="flex-1 space-y-3 w-full">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(0,255,136,0.12)', border: '1px solid rgba(0,255,136,0.22)' }}
                >
                  <Target size={12} style={{ color: '#00FF88' }} />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-text-muted">
                  Visão Geral das Metas
                </span>
              </div>
              <h2 className="text-xl font-black leading-tight">
                {activeGoals.length} ativa{activeGoals.length !== 1 ? 's' : ''} · {completedGoals.length} concluída{completedGoals.length !== 1 ? 's' : ''}
              </h2>
            </div>

            {/* Mini status bar */}
            <div className="space-y-1.5">
              {[
                { label: 'Ativas', count: activeGoals.length, total: goals.length, color: '#FF4D00', rgb: '255,77,0' },
                { label: 'Concluídas', count: completedGoals.length, total: goals.length, color: '#00FF88', rgb: '0,255,136' },
                { label: 'Pausadas', count: pausedGoals.length, total: goals.length, color: '#8899BB', rgb: '136,153,187' },
              ].filter(s => s.count > 0).map(s => (
                <div key={s.label} className="flex items-center gap-2">
                  <span className="text-[10px] text-text-muted w-16 shrink-0">{s.label}</span>
                  <div className="flex-1 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.round((s.count / s.total) * 100)}%`,
                        background: `rgba(${s.rgb},0.8)`,
                      }}
                    />
                  </div>
                  <span className="text-[10px] font-bold w-4 text-right" style={{ color: s.color }}>
                    {s.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Category breakdown ───────────────────────────────────────────── */}
      {categoryBreakdown.length > 0 && (
        <div
          className="rounded-2xl p-5 md:p-6 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(124,58,237,0.06) 0%, rgba(13,24,41,0.98) 100%)',
            border: '1px solid rgba(124,58,237,0.14)',
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <div
              className="w-6 h-6 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.22)' }}
            >
              <Zap size={12} style={{ color: '#7C3AED' }} />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-text-muted">Por Categoria</span>
          </div>

          <div className="space-y-3">
            {categoryBreakdown.map(({ cat, meta, total, active, completed, avgPct }) => (
              <div key={cat} className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-base">{meta.emoji}</span>
                  <span className="text-sm font-semibold flex-1">{meta.label}</span>
                  <span className="text-[11px] text-text-muted">{total} meta{total !== 1 ? 's' : ''}</span>
                  <span
                    className="text-[11px] font-bold w-9 text-right"
                    style={{ color: avgPct >= 75 ? '#00FF88' : avgPct >= 40 ? '#F5C842' : meta.color }}
                  >
                    {avgPct}%
                  </span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${avgPct}%`,
                      background: `linear-gradient(90deg, rgba(${meta.rgb},0.9), rgba(${meta.rgb},0.5))`,
                    }}
                  />
                </div>
                {/* Status pills */}
                <div className="flex gap-1.5 flex-wrap">
                  {active > 0 && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: `rgba(${meta.rgb},0.12)`, color: meta.color }}>
                      {active} ativa{active !== 1 ? 's' : ''}
                    </span>
                  )}
                  {completed > 0 && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(0,255,136,0.1)', color: '#00FF88' }}>
                      {completed} concluída{completed !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Deadline urgency ─────────────────────────────────────────────── */}
      {goalsWithDeadline.length > 0 && (
        <div
          className="rounded-2xl p-5 md:p-6 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(245,200,66,0.05) 0%, rgba(13,24,41,0.98) 100%)',
            border: '1px solid rgba(245,200,66,0.12)',
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <div
              className="w-6 h-6 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(245,200,66,0.12)', border: '1px solid rgba(245,200,66,0.22)' }}
            >
              <Flag size={12} style={{ color: '#F5C842' }} />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-text-muted">Prazos</span>
          </div>

          <div className="space-y-2">
            {goalsWithDeadline.map(goal => {
              const col = urgencyColor(goal.days)
              const catMeta = CATEGORY_META[goal.category] ?? CATEGORY_META.custom!
              return (
                <div
                  key={goal.id}
                  className="flex items-center gap-3 rounded-xl p-3"
                  style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)' }}
                >
                  {/* Icon */}
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
                    style={{ background: `${catMeta.color}15`, border: `1px solid ${catMeta.color}25` }}
                  >
                    {goal.icon ?? catMeta.emoji}
                  </div>

                  {/* Title + progress */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="text-sm font-semibold leading-none truncate">{goal.title}</div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${goal.pct}%`,
                          background: goal.pct >= 75
                            ? 'linear-gradient(90deg, #00FF88, #00CC6A)'
                            : 'linear-gradient(90deg, #FF4D00, #7C3AED)',
                        }}
                      />
                    </div>
                  </div>

                  {/* Pct */}
                  <div className="text-[11px] font-bold w-8 text-right" style={{ color: goal.pct >= 75 ? '#00FF88' : '#8899BB' }}>
                    {goal.pct}%
                  </div>

                  {/* Deadline badge */}
                  <div
                    className="text-[10px] font-bold px-2 py-1 rounded-lg shrink-0"
                    style={{ background: `${col}18`, color: col, border: `1px solid ${col}30` }}
                  >
                    {urgencyLabel(goal.days)}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Urgency legend */}
          <div className="flex items-center gap-4 mt-4 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            {[
              { color: '#EF4444', label: 'Atrasada' },
              { color: '#FF4D00', label: '≤7 dias' },
              { color: '#F5C842', label: '≤30 dias' },
              { color: '#00FF88', label: '>30 dias' },
            ].map(l => (
              <div key={l.color} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ background: l.color }} />
                <span className="text-[10px] text-text-muted">{l.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Smart insights ───────────────────────────────────────────────── */}
      {(almostDone ?? atRisk) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {almostDone && (
            <div
              className="rounded-2xl p-4 flex items-start gap-3"
              style={{
                background: 'linear-gradient(135deg, rgba(0,255,136,0.07) 0%, rgba(13,24,41,0.98) 100%)',
                border: '1px solid rgba(0,255,136,0.18)',
              }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(0,255,136,0.12)', border: '1px solid rgba(0,255,136,0.22)' }}
              >
                <Trophy size={16} style={{ color: '#00FF88' }} />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] text-text-muted uppercase tracking-widest mb-0.5">Quase lá!</div>
                <div className="font-bold text-sm leading-snug truncate">{almostDone.title}</div>
                <div className="text-[11px] mt-1" style={{ color: '#00FF88' }}>
                  {almostDone.pct}% concluído — só falta{' '}
                  {(almostDone.target_value - almostDone.current_value).toLocaleString('pt-BR')}{' '}
                  {almostDone.unit}
                </div>
              </div>
            </div>
          )}

          {atRisk && (
            <div
              className="rounded-2xl p-4 flex items-start gap-3"
              style={{
                background: 'linear-gradient(135deg, rgba(255,77,0,0.07) 0%, rgba(13,24,41,0.98) 100%)',
                border: '1px solid rgba(255,77,0,0.18)',
              }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(255,77,0,0.12)', border: '1px solid rgba(255,77,0,0.22)' }}
              >
                <AlertTriangle size={16} style={{ color: '#FF4D00' }} />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] text-text-muted uppercase tracking-widest mb-0.5">Atenção!</div>
                <div className="font-bold text-sm leading-snug truncate">{atRisk.title}</div>
                <div className="text-[11px] mt-1" style={{ color: '#FF4D00' }}>
                  {atRisk.days < 0
                    ? `${Math.abs(atRisk.days)}d atrasado`
                    : `${atRisk.days}d restantes`}{' '}
                  com apenas {atRisk.pct}% concluído
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Completed goals highlight ────────────────────────────────────── */}
      {completedGoals.length > 0 && (
        <div
          className="rounded-xl px-4 py-3.5 flex items-center gap-3"
          style={{ background: 'rgba(0,255,136,0.04)', border: '1px solid rgba(0,255,136,0.1)' }}
        >
          <span className="text-xl shrink-0">
            {completedGoals.length >= 10 ? '🏆' : completedGoals.length >= 5 ? '🥇' : '🎉'}
          </span>
          <div>
            <p className="text-sm font-semibold leading-snug">
              {completedGoals.length >= 10
                ? `${completedGoals.length} metas concluídas — resultado extraordinário!`
                : completedGoals.length >= 5
                ? `${completedGoals.length} metas concluídas — continue assim!`
                : `${completedGoals.length} meta${completedGoals.length !== 1 ? 's' : ''} concluída${completedGoals.length !== 1 ? 's' : ''} — ótimo começo!`}
            </p>
            {completedGoals[0] && (
              <p className="text-[11px] text-text-muted mt-0.5">
                Última concluída:{' '}
                <span className="text-white font-medium">{completedGoals[0].title}</span>
                {completedGoals[0].completed_at && (
                  <> em {new Date(completedGoals[0].completed_at).toLocaleDateString('pt-BR')}</>
                )}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
