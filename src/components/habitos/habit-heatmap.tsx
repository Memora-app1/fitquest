import { createClient } from '@/lib/supabase/server'
import { Calendar, TrendingUp, Flame, Award } from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────────

interface HabitInfo {
  id: string
  name: string
  icon: string
  color: string
}

interface DayCell {
  date: string
  count: number
  pct: number
  isoDate: string
}

// ── Pure helpers ───────────────────────────────────────────────────────────────

function getCellColor(pct: number): string {
  if (pct <= 0) return 'rgba(255,255,255,0.04)'
  if (pct < 0.26) return 'rgba(0,255,136,0.18)'
  if (pct < 0.51) return 'rgba(0,255,136,0.40)'
  if (pct < 0.76) return 'rgba(0,255,136,0.65)'
  if (pct < 1) return 'rgba(0,255,136,0.85)'
  return '#00FF88'
}

function formatDatePT(isoDate: string): string {
  const d = new Date(isoDate + 'T12:00:00')
  return d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })
}

const DAY_LABELS_PT = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
const MONTH_LABELS_PT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

// ── Server Component ───────────────────────────────────────────────────────────

export async function HabitHeatmap({
  userId,
  habits,
}: {
  userId: string
  habits: HabitInfo[]
}) {
  if (habits.length === 0) return null

  const supabase = await createClient()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const ninetyDaysAgo = new Date(today.getTime() - 89 * 86400000)
  const ninetyDaysAgoStr = ninetyDaysAgo.toISOString().split('T')[0]!

  const { data: rawLogs } = await supabase
    .from('habit_logs')
    .select('habit_id, logged_date')
    .eq('user_id', userId)
    .gte('logged_date', ninetyDaysAgoStr)

  const allLogs = rawLogs ?? []

  // ── Build per-day sets ──────────────────────────────────────────────────────
  // logsPerDay: date → Set of habit_ids logged that day
  const logsPerDay = new Map<string, Set<string>>()
  for (const log of allLogs) {
    if (!logsPerDay.has(log.logged_date)) logsPerDay.set(log.logged_date, new Set())
    logsPerDay.get(log.logged_date)!.add(log.habit_id)
  }

  // ── Build 90-day array (day[0] = 89 days ago, day[89] = today) ─────────────
  const days: DayCell[] = []
  for (let i = 89; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 86400000)
    const isoDate = d.toISOString().split('T')[0]!
    const logged = logsPerDay.get(isoDate)?.size ?? 0
    const pct = habits.length > 0 ? logged / habits.length : 0
    days.push({ date: isoDate, count: logged, pct, isoDate })
  }

  // ── Build GitHub-style grid (columns = weeks Mon-first, rows = Mon–Sun) ─────
  // firstDayOfWeek: Mon=0 … Sun=6
  const startDate = new Date(days[0]!.isoDate + 'T12:00:00')
  const firstDayOfWeek = (startDate.getDay() + 6) % 7
  const numWeeks = Math.ceil((90 + firstDayOfWeek) / 7)

  type GridCell = DayCell | null
  const grid: GridCell[][] = Array.from({ length: numWeeks }, () => Array(7).fill(null) as GridCell[])

  for (let i = 0; i < days.length; i++) {
    const cellIdx = firstDayOfWeek + i
    const weekIdx = Math.floor(cellIdx / 7)
    const dayIdx = cellIdx % 7
    if (grid[weekIdx]) grid[weekIdx]![dayIdx] = days[i]!
  }

  // ── Month labels: first week where each month appears ──────────────────────
  const monthLabels: { label: string; weekIdx: number }[] = []
  let lastMonth = -1
  for (let w = 0; w < numWeeks; w++) {
    const firstCell = grid[w]!.find((c): c is DayCell => c !== null)
    if (firstCell) {
      const month = new Date(firstCell.isoDate + 'T12:00:00').getMonth()
      if (month !== lastMonth) {
        monthLabels.push({ label: MONTH_LABELS_PT[month]!, weekIdx: w })
        lastMonth = month
      }
    }
  }

  // ── Per-habit stats ─────────────────────────────────────────────────────────
  const habitStats = habits.map(h => {
    const habitLogDates = new Set(allLogs.filter(l => l.habit_id === h.id).map(l => l.logged_date))
    const total90 = habitLogDates.size
    const pct90 = Math.round((total90 / 90) * 100)

    // Current streak — consecutive days from today backwards
    let streak = 0
    const streakDate = new Date(today)
    while (true) {
      const key = streakDate.toISOString().split('T')[0]!
      if (!habitLogDates.has(key)) break
      streak++
      streakDate.setDate(streakDate.getDate() - 1)
    }

    // Best 30-day window within the 90-day period
    let bestWindow = 0
    for (let startOffset = 0; startOffset <= 60; startOffset++) {
      let count = 0
      for (let j = 0; j < 30; j++) {
        const dd = new Date(today.getTime() - (startOffset + j) * 86400000)
        if (habitLogDates.has(dd.toISOString().split('T')[0]!)) count++
      }
      if (count > bestWindow) bestWindow = count
    }
    const bestWindowPct = Math.round((bestWindow / 30) * 100)

    // Per-day done array for mini heatmap
    const done90 = days.map(day => habitLogDates.has(day.isoDate))

    return { ...h, total90, pct90, streak, bestWindowPct, done90 }
  }).sort((a, b) => b.pct90 - a.pct90)

  // ── Summary stats ───────────────────────────────────────────────────────────
  const daysWithAnyActivity = logsPerDay.size
  const perfectDays = Array.from(logsPerDay.values()).filter(s => s.size >= habits.length).length
  const overallPct = habits.length > 0
    ? Math.round((allLogs.length / (habits.length * 90)) * 100)
    : 0
  const bestHabit = habitStats[0]
  const worstHabit = habitStats[habitStats.length - 1]

  const overallColor =
    overallPct >= 80 ? '#00FF88' :
    overallPct >= 55 ? '#F5C842' :
    overallPct >= 35 ? '#FF4D00' : '#8899BB'

  const overallRgb =
    overallPct >= 80 ? '0,255,136' :
    overallPct >= 55 ? '245,200,66' :
    overallPct >= 35 ? '255,77,0' : '136,153,187'

  return (
    <div
      className="rounded-2xl relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, rgba(${overallRgb},0.07) 0%, rgba(13,24,41,0.98) 60%, rgba(124,58,237,0.04) 100%)`,
        border: `1px solid rgba(${overallRgb},0.18)`,
      }}
    >
      {/* Corner glow */}
      <div
        className="absolute -top-10 -right-10 w-48 h-48 rounded-full pointer-events-none blur-3xl"
        style={{ background: `rgba(${overallRgb},0.1)` }}
      />

      <div className="relative z-10 p-5 md:p-6 space-y-6">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: `rgba(${overallRgb},0.15)`, border: `1px solid rgba(${overallRgb},0.25)` }}
              >
                <Calendar size={12} style={{ color: overallColor }} />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-text-muted">
                Mapa de Consistência
              </span>
            </div>
            <h2 className="text-xl font-black leading-tight">Últimos 90 dias</h2>
            <p className="text-sm text-text-muted mt-0.5">
              <span style={{ color: overallColor, fontWeight: 700 }}>{overallPct}%</span>
              {' '}de conclusão geral · {daysWithAnyActivity} dias com atividade
            </p>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-1.5 text-xs text-text-muted shrink-0">
            <span className="text-[10px]">Menos</span>
            {[0, 0.25, 0.5, 0.75, 1].map((v, i) => (
              <div
                key={i}
                className="rounded-sm"
                style={{
                  width: 14,
                  height: 14,
                  backgroundColor: getCellColor(v),
                  border: v === 1 ? '1px solid rgba(0,255,136,0.35)' : 'none',
                }}
              />
            ))}
            <span className="text-[10px]">Mais</span>
          </div>
        </div>

        {/* ── Contribution Grid ────────────────────────────────────────── */}
        <div className="overflow-x-auto pb-1 -mx-1 px-1">
          <div style={{ minWidth: numWeeks * 17 + 36 }}>
            <div className="flex gap-1.5">

              {/* Day-of-week labels */}
              <div className="flex flex-col gap-1 shrink-0" style={{ width: 28, paddingTop: 20 }}>
                {DAY_LABELS_PT.map((label, i) => (
                  <div
                    key={i}
                    className="text-[10px] text-text-muted flex items-center"
                    style={{ height: 13, visibility: i % 2 === 0 ? 'visible' : 'hidden' }}
                  >
                    {label}
                  </div>
                ))}
              </div>

              {/* Week columns */}
              <div className="flex gap-1">
                {grid.map((week, wIdx) => {
                  const monthLabel = monthLabels.find(m => m.weekIdx === wIdx)
                  return (
                    <div key={wIdx} className="flex flex-col gap-1">
                      {/* Month label row */}
                      <div
                        className="text-[10px] font-semibold"
                        style={{
                          height: 18,
                          width: 13,
                          color: '#5A6B8A',
                          whiteSpace: 'nowrap',
                          overflow: 'visible',
                        }}
                      >
                        {monthLabel?.label ?? ''}
                      </div>

                      {/* 7 day cells */}
                      {week.map((cell, dIdx) => (
                        <div
                          key={dIdx}
                          className="rounded-sm"
                          style={{
                            width: 13,
                            height: 13,
                            backgroundColor: cell ? getCellColor(cell.pct) : 'transparent',
                            border: cell?.pct === 1 ? '1px solid rgba(0,255,136,0.30)' : 'none',
                            cursor: cell ? 'default' : 'default',
                          }}
                          title={
                            cell
                              ? `${formatDatePT(cell.isoDate)}: ${cell.count}/${habits.length} hábito${habits.length !== 1 ? 's' : ''} (${Math.round(cell.pct * 100)}%)`
                              : ''
                          }
                        />
                      ))}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── Summary strip ────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {(
            [
              {
                label: 'Conclusão geral',
                value: `${overallPct}%`,
                sub: `${allLogs.length} de ${habits.length * 90}`,
                color: overallColor,
                rgb: overallRgb,
              },
              {
                label: 'Dias com atividade',
                value: String(daysWithAnyActivity),
                sub: `de 90 dias totais`,
                color: '#3B82F6',
                rgb: '59,130,246',
              },
              {
                label: 'Dias perfeitos',
                value: String(perfectDays),
                sub: `todos os hábitos feitos`,
                color: '#F5C842',
                rgb: '245,200,66',
              },
              {
                label: 'Melhor hábito',
                value: bestHabit ? `${bestHabit.icon} ${bestHabit.pct90}%` : '–',
                sub: bestHabit?.name ?? '',
                color: bestHabit?.color ?? '#8899BB',
                rgb: '136,153,187',
              },
            ] as const
          ).map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl p-3"
              style={{
                background: `rgba(${stat.rgb},0.05)`,
                border: `1px solid rgba(${stat.rgb},0.12)`,
              }}
            >
              <div className="text-[10px] text-text-muted uppercase tracking-wider mb-1.5 leading-none">
                {stat.label}
              </div>
              <div
                className="heading-display text-xl leading-none"
                style={{ color: stat.color }}
              >
                {stat.value}
              </div>
              <div className="text-[10px] text-text-muted mt-1 leading-tight truncate">
                {stat.sub}
              </div>
            </div>
          ))}
        </div>

        {/* ── Per-habit breakdown ───────────────────────────────────────── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={14} style={{ color: overallColor }} />
            <span className="text-sm font-bold">Desempenho individual</span>
            <span className="text-xs text-text-muted">— ordenado por taxa de conclusão</span>
          </div>

          <div className="space-y-2">
            {habitStats.map((h, idx) => {
              const pctColor =
                h.pct90 >= 80 ? '#00FF88' :
                h.pct90 >= 55 ? '#F5C842' :
                h.pct90 >= 35 ? '#FF4D00' : '#8899BB'

              const rankColor = idx === 0 ? '#F5C842' : idx === 1 ? '#9CA3AF' : idx === 2 ? '#CD7C2F' : '#2D3748'
              const rankBg = idx === 0 ? 'rgba(245,200,66,0.12)' : idx === 1 ? 'rgba(156,163,175,0.08)' : idx === 2 ? 'rgba(205,124,47,0.08)' : 'rgba(255,255,255,0.03)'
              const rankBorder = idx <= 2 ? `rgba(${idx === 0 ? '245,200,66' : idx === 1 ? '156,163,175' : '205,124,47'},0.2)` : 'rgba(255,255,255,0.04)'

              return (
                <div
                  key={h.id}
                  className="rounded-xl p-4 flex items-center gap-3"
                  style={{
                    background: `linear-gradient(135deg, ${h.color}07 0%, rgba(13,24,41,0.98) 100%)`,
                    border: `1px solid ${h.color}18`,
                  }}
                >
                  {/* Rank badge */}
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0"
                    style={{ background: rankBg, color: rankColor, border: `1px solid ${rankBorder}` }}
                  >
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                  </div>

                  {/* Icon */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                    style={{ background: `${h.color}14`, border: `1px solid ${h.color}22` }}
                  >
                    {h.icon}
                  </div>

                  {/* Name + mini heatmap + stats */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-sm font-semibold truncate">{h.name}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        {h.streak > 1 && (
                          <span
                            className="text-[10px] font-bold flex items-center gap-0.5"
                            style={{ color: '#FF4D00' }}
                          >
                            <Flame size={9} fill="#FF4D00" />
                            {h.streak}d
                          </span>
                        )}
                        <span className="text-xs font-black tabular-nums" style={{ color: pctColor }}>
                          {h.pct90}%
                        </span>
                      </div>
                    </div>

                    {/* 90-day mini strip heatmap */}
                    <div
                      className="flex gap-px overflow-hidden"
                      style={{ height: 7, borderRadius: 3 }}
                    >
                      {h.done90.map((done, dayIdx) => (
                        <div
                          key={dayIdx}
                          style={{
                            flex: 1,
                            minWidth: 1,
                            backgroundColor: done ? h.color : 'rgba(255,255,255,0.04)',
                            opacity: done
                              ? dayIdx > 79 ? 1 : dayIdx > 59 ? 0.9 : dayIdx > 39 ? 0.8 : 0.7
                              : 1,
                            borderRadius: 1,
                          }}
                          title={`${days[dayIdx]?.isoDate ?? ''}: ${done ? 'feito' : 'não feito'}`}
                        />
                      ))}
                    </div>

                    {/* Stats row */}
                    <div className="flex items-center gap-3 mt-1.5 text-[10px] text-text-muted">
                      <span>
                        <span style={{ color: h.color, fontWeight: 700 }}>{h.total90}</span>
                        {' '}/90 dias
                      </span>
                      <span>·</span>
                      <span style={{ color: pctColor, fontWeight: 600 }}>
                        {h.pct90 >= 80 ? 'Elite' : h.pct90 >= 65 ? 'Consistente' : h.pct90 >= 45 ? 'Em progresso' : h.pct90 >= 25 ? 'Irregular' : 'Atenção'}
                      </span>
                      {h.bestWindowPct > 0 && (
                        <>
                          <span>·</span>
                          <span>melhor mês <span style={{ color: h.color, fontWeight: 600 }}>{h.bestWindowPct}%</span></span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* SVG progress ring */}
                  <div className="relative w-12 h-12 shrink-0">
                    <svg viewBox="0 0 48 48" className="w-full h-full -rotate-90">
                      <circle
                        cx="24" cy="24" r="19"
                        fill="none"
                        stroke="rgba(255,255,255,0.05)"
                        strokeWidth="3.5"
                      />
                      <circle
                        cx="24" cy="24" r="19"
                        fill="none"
                        stroke={h.color}
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeDasharray={`${(h.pct90 / 100) * 119.4} 119.4`}
                        style={{ filter: `drop-shadow(0 0 3px ${h.color}90)` }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span
                        className="text-[10px] font-black tabular-nums leading-none"
                        style={{ color: h.color }}
                      >
                        {h.pct90}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Insight footer ────────────────────────────────────────────── */}
        <div
          className="rounded-xl p-4 flex items-start gap-3"
          style={{
            background: `rgba(${overallRgb},0.05)`,
            border: `1px solid rgba(${overallRgb},0.12)`,
          }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
            style={{ background: `rgba(${overallRgb},0.12)`, border: `1px solid rgba(${overallRgb},0.2)` }}
          >
            <Award size={15} style={{ color: overallColor }} />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold leading-snug">
              {overallPct >= 85
                ? '🏆 Consistência de elite — você está entre os melhores!'
                : overallPct >= 70
                ? '🔥 Ritmo forte — você está construindo algo sólido.'
                : overallPct >= 50
                ? '💪 Metade do caminho — a consistência se constrói dia a dia.'
                : overallPct >= 30
                ? '⚡ Progresso real — cada check importa na direção certa.'
                : '🌱 O começo é o passo mais corajoso — continue!'}
            </p>
            {worstHabit && worstHabit !== bestHabit && worstHabit.pct90 < 40 && (
              <p className="text-xs text-text-muted">
                Foco em:{' '}
                <span style={{ color: worstHabit.color, fontWeight: 600 }}>
                  {worstHabit.icon} {worstHabit.name}
                </span>
                {' '}— apenas {worstHabit.pct90}% nos últimos 90 dias.
              </p>
            )}
            {perfectDays >= 3 && (
              <p className="text-xs text-text-muted">
                <span style={{ color: '#F5C842', fontWeight: 700 }}>{perfectDays} dias perfeitos</span>
                {' '}nesse período — cada um vale bônus de XP.
              </p>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
