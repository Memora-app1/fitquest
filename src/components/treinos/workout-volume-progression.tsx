import { createClient } from '@/lib/supabase/server'
import { BarChart3, TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface SetRow {
  weight_kg: number | null
  reps: number | null
  is_warmup: boolean
  created_at: string
  exercises: {
    muscle_group: string
  } | null
}

interface WorkoutRow {
  started_at: string | null
  created_at: string
}

const MUSCLE_META: Record<string, { label: string; color: string; rgb: string }> = {
  chest:     { label: 'Peito',      color: '#FF4D00', rgb: '255,77,0' },
  back:      { label: 'Costas',     color: '#7C3AED', rgb: '124,58,237' },
  legs:      { label: 'Pernas',     color: '#00FF88', rgb: '0,255,136' },
  shoulders: { label: 'Ombros',     color: '#F5C842', rgb: '245,200,66' },
  arms:      { label: 'Braços',     color: '#3B82F6', rgb: '59,130,246' },
  core:      { label: 'Core',       color: '#EC4899', rgb: '236,72,153' },
  cardio:    { label: 'Cardio',     color: '#00D9FF', rgb: '0,217,255' },
  full_body: { label: 'Corpo todo', color: '#8B5CF6', rgb: '139,92,246' },
}

function toISO(d: Date): string {
  return d.toISOString().split('T')[0]!
}

function weekLabel(weekStart: Date): string {
  return weekStart.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

// Monday-start week number (0 = current week)
function getMondayOf(d: Date): Date {
  const dow = (d.getDay() + 6) % 7 // Mon=0 … Sun=6
  const monday = new Date(d)
  monday.setDate(d.getDate() - dow)
  monday.setHours(0, 0, 0, 0)
  return monday
}

export async function WorkoutVolumeProgression({ userId }: { userId: string }) {
  const supabase = await createClient()

  const now = new Date()
  const twelveWeeksAgo = toISO(new Date(now.getTime() - 84 * 86400000))

  const [setsRes, workoutsRes] = await Promise.all([
    supabase
      .from('workout_sets')
      .select('weight_kg, reps, is_warmup, created_at, exercises(muscle_group)')
      .eq('user_id', userId)
      .eq('is_warmup', false)
      .gt('weight_kg', 0)
      .gt('reps', 0)
      .gte('created_at', twelveWeeksAgo + 'T00:00:00')
      .order('created_at', { ascending: true }),
    supabase
      .from('workouts')
      .select('started_at, created_at')
      .eq('user_id', userId)
      .gte('created_at', twelveWeeksAgo + 'T00:00:00'),
  ])

  const rows = (setsRes.data ?? []) as unknown as SetRow[]
  const workouts = (workoutsRes.data ?? []) as WorkoutRow[]

  if (rows.length === 0) return null

  // Build 12 weeks array (Mon–Sun buckets)
  const thisMonday = getMondayOf(now)
  const weeks: {
    start: Date
    end: Date
    label: string
    volume: number
    sessions: number
    byMuscle: Record<string, number>
  }[] = []

  for (let w = 11; w >= 0; w--) {
    const start = new Date(thisMonday.getTime() - w * 7 * 86400000)
    const end = new Date(start.getTime() + 6 * 86400000)
    weeks.push({ start, end, label: weekLabel(start), volume: 0, sessions: 0, byMuscle: {} })
  }

  // Distribute sets into weeks
  for (const r of rows) {
    const rowDate = new Date(r.created_at)
    const monday = getMondayOf(rowDate)
    const weekIdx = weeks.findIndex(w => toISO(w.start) === toISO(monday))
    if (weekIdx === -1) continue

    const vol = Number(r.weight_kg ?? 0) * Number(r.reps ?? 0)
    const muscle = r.exercises?.muscle_group ?? 'full_body'

    weeks[weekIdx]!.volume += vol
    if (!weeks[weekIdx]!.byMuscle[muscle]) weeks[weekIdx]!.byMuscle[muscle] = 0
    weeks[weekIdx]!.byMuscle[muscle] += vol
  }

  // Distribute workouts into weeks
  for (const w of workouts) {
    const d = new Date(w.started_at ?? w.created_at)
    const monday = getMondayOf(d)
    const weekIdx = weeks.findIndex(wk => toISO(wk.start) === toISO(monday))
    if (weekIdx === -1) continue
    weeks[weekIdx]!.sessions++
  }

  const maxVolume = Math.max(...weeks.map(w => w.volume), 1)
  const totalVolume = weeks.reduce((s, w) => s + w.volume, 0)
  const avgVolumePerWeek = Math.round(totalVolume / 12)

  // Recent vs previous 4-week comparison
  const recent4 = weeks.slice(8)
  const prev4 = weeks.slice(4, 8)
  const recent4Vol = recent4.reduce((s, w) => s + w.volume, 0)
  const prev4Vol = prev4.reduce((s, w) => s + w.volume, 0)
  const volTrend = prev4Vol > 0 ? Math.round(((recent4Vol - prev4Vol) / prev4Vol) * 100) : null

  const recent4Sessions = recent4.reduce((s, w) => s + w.sessions, 0)
  const prev4Sessions = prev4.reduce((s, w) => s + w.sessions, 0)
  const sessionTrend = prev4Sessions > 0 ? Math.round(((recent4Sessions - prev4Sessions) / prev4Sessions) * 100) : null

  // Best week
  const bestWeek = weeks.reduce((best, w) => w.volume > best.volume ? w : best, weeks[0]!)

  // Top muscle groups by total volume
  const allMuscles = new Map<string, number>()
  for (const w of weeks) {
    for (const [m, vol] of Object.entries(w.byMuscle)) {
      allMuscles.set(m, (allMuscles.get(m) ?? 0) + vol)
    }
  }
  const topMuscles = Array.from(allMuscles.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  const totalMuscleVol = topMuscles.reduce((s, [, v]) => s + v, 0)

  function formatVol(v: number): string {
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
    if (v >= 1000) return `${(v / 1000).toFixed(0)}k`
    return String(Math.round(v))
  }

  return (
    <div
      className="rounded-2xl p-5 md:p-6 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(124,58,237,0.06) 0%, rgba(13,24,41,0.98) 60%, rgba(255,77,0,0.04) 100%)',
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
                <BarChart3 size={12} style={{ color: '#7C3AED' }} />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-text-muted">
                Volume de treino — 12 semanas
              </span>
            </div>
            <h2 className="text-xl font-black leading-tight">Progressão de Volume</h2>
            <p className="text-sm text-text-muted mt-0.5">
              {formatVol(totalVolume)} kg · média {formatVol(avgVolumePerWeek)} kg/semana
            </p>
          </div>

          {/* Trend badge */}
          {volTrend !== null && (
            <div className="text-right">
              <div
                className="text-2xl font-black flex items-center gap-1 justify-end"
                style={{ color: volTrend >= 0 ? '#00FF88' : '#EF4444' }}
              >
                {volTrend >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                {volTrend >= 0 ? '+' : ''}{volTrend}%
              </div>
              <div className="text-[10px] text-text-muted uppercase tracking-wider">
                vs 4 semanas anteriores
              </div>
            </div>
          )}
        </div>

        {/* ── Bar Chart ─────────────────────────────────────────────────── */}
        <div>
          {/* Bars */}
          <div className="flex items-end gap-1 h-32">
            {weeks.map((w, i) => {
              const heightPct = maxVolume > 0 ? (w.volume / maxVolume) * 100 : 0
              const isCurrentWeek = i === weeks.length - 1
              const isBestWeek = w.volume === bestWeek.volume && w.volume > 0
              const isRecent = i >= 8

              return (
                <div
                  key={i}
                  className="flex-1 flex flex-col items-center justify-end gap-0.5"
                  title={`${w.label}: ${formatVol(w.volume)} kg · ${w.sessions} sessão(ões)`}
                >
                  <div
                    className="w-full rounded-t-sm transition-all duration-500 relative group"
                    style={{
                      height: `${Math.max(heightPct, w.volume > 0 ? 2 : 0)}%`,
                      background: isCurrentWeek
                        ? 'linear-gradient(180deg, #F5C842 0%, rgba(245,200,66,0.6) 100%)'
                        : isBestWeek
                        ? 'linear-gradient(180deg, #00FF88 0%, rgba(0,255,136,0.5) 100%)'
                        : isRecent
                        ? 'linear-gradient(180deg, rgba(124,58,237,0.9) 0%, rgba(124,58,237,0.4) 100%)'
                        : 'linear-gradient(180deg, rgba(124,58,237,0.5) 0%, rgba(124,58,237,0.2) 100%)',
                      minHeight: w.volume > 0 ? '3px' : '0px',
                    }}
                  />
                  {w.sessions > 0 && (
                    <div
                      className="text-[7px] font-bold text-center"
                      style={{
                        color: isCurrentWeek ? '#F5C842' : isBestWeek ? '#00FF88' : '#5A6B8A',
                      }}
                    >
                      {w.sessions}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Week labels */}
          <div className="flex gap-1 mt-1">
            {weeks.map((w, i) => {
              const isCurrentWeek = i === weeks.length - 1
              const showLabel = i % 3 === 0 || isCurrentWeek
              return (
                <div
                  key={i}
                  className="flex-1 text-center"
                  style={{
                    fontSize: '8px',
                    color: isCurrentWeek ? '#F5C842' : '#4A5568',
                  }}
                >
                  {showLabel ? w.label : ''}
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm" style={{ background: 'rgba(124,58,237,0.5)' }} />
              <span className="text-[10px] text-text-muted">Volume (kg×reps)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm" style={{ background: '#00FF88' }} />
              <span className="text-[10px] text-text-muted">Melhor semana</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm" style={{ background: '#F5C842' }} />
              <span className="text-[10px] text-text-muted">Semana atual</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-text-muted">Números = sessões</span>
            </div>
          </div>
        </div>

        {/* ── Summary Cards ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div
            className="rounded-xl p-3"
            style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.15)' }}
          >
            <div className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Volume total</div>
            <div className="text-xl font-black text-brand-purple">{formatVol(totalVolume)} kg</div>
            <div className="text-[10px] text-text-muted mt-0.5">12 semanas</div>
          </div>
          <div
            className="rounded-xl p-3"
            style={{ background: 'rgba(245,200,66,0.06)', border: '1px solid rgba(245,200,66,0.12)' }}
          >
            <div className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Média semanal</div>
            <div className="text-xl font-black text-brand-gold">{formatVol(avgVolumePerWeek)} kg</div>
            <div className="text-[10px] text-text-muted mt-0.5">por semana</div>
          </div>
          <div
            className="rounded-xl p-3"
            style={{ background: 'rgba(0,255,136,0.06)', border: '1px solid rgba(0,255,136,0.12)' }}
          >
            <div className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Melhor semana</div>
            <div className="text-xl font-black text-brand-green">{formatVol(bestWeek.volume)} kg</div>
            <div className="text-[10px] text-text-muted mt-0.5">{bestWeek.label}</div>
          </div>
          <div
            className="rounded-xl p-3"
            style={{
              background: sessionTrend !== null && sessionTrend >= 0
                ? 'rgba(0,255,136,0.06)'
                : 'rgba(239,68,68,0.06)',
              border: sessionTrend !== null && sessionTrend >= 0
                ? '1px solid rgba(0,255,136,0.12)'
                : '1px solid rgba(239,68,68,0.12)',
            }}
          >
            <div className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Sessões (4sem)</div>
            <div
              className="text-xl font-black flex items-center gap-1"
              style={{ color: sessionTrend !== null && sessionTrend >= 0 ? '#00FF88' : '#EF4444' }}
            >
              {recent4Sessions}
              {sessionTrend !== null && (
                <span className="text-xs">
                  {sessionTrend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                </span>
              )}
            </div>
            {sessionTrend !== null && (
              <div className="text-[10px] text-text-muted mt-0.5">
                {sessionTrend >= 0 ? '+' : ''}{sessionTrend}% vs período anterior
              </div>
            )}
          </div>
        </div>

        {/* ── Top Muscles by Volume ──────────────────────────────────────── */}
        {topMuscles.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-bold text-text-muted uppercase tracking-wider">
              Volume por grupo muscular (12 semanas)
            </div>
            {topMuscles.map(([muscle, vol]) => {
              const meta = MUSCLE_META[muscle] ?? { label: muscle, color: '#8899BB', rgb: '136,153,187' }
              const pct = totalMuscleVol > 0 ? Math.round((vol / totalMuscleVol) * 100) : 0
              return (
                <div key={muscle} className="flex items-center gap-3">
                  <div
                    className="text-xs font-semibold shrink-0"
                    style={{ width: '64px', color: meta.color }}
                  >
                    {meta.label}
                  </div>
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${pct}%`,
                        background: `linear-gradient(90deg, rgba(${meta.rgb},0.9), rgba(${meta.rgb},0.5))`,
                      }}
                    />
                  </div>
                  <div
                    className="text-xs font-bold shrink-0 text-right"
                    style={{ width: '44px', color: meta.color }}
                  >
                    {formatVol(vol)} kg
                  </div>
                  <div className="text-[10px] text-text-muted shrink-0" style={{ width: '28px' }}>
                    {pct}%
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── Insight Footer ───────────────────────────────────────────── */}
        <div
          className="rounded-xl px-4 py-3 flex items-center gap-3"
          style={{
            background: 'rgba(124,58,237,0.05)',
            border: '1px solid rgba(124,58,237,0.12)',
          }}
        >
          <span className="text-lg shrink-0">
            {volTrend !== null && volTrend >= 20 ? '🚀' : volTrend !== null && volTrend >= 0 ? '💪' : '📉'}
          </span>
          <div>
            <p className="text-sm font-semibold leading-snug">
              {volTrend !== null && volTrend >= 10
                ? `Volume cresceu ${volTrend}% nas últimas 4 semanas — ótima progressão!`
                : volTrend !== null && volTrend >= 0
                ? `Volume estável. Tente aumentar o peso ou as repetições gradualmente.`
                : volTrend !== null
                ? `Volume caiu ${Math.abs(volTrend)}%. Verifique consistência nos treinos.`
                : 'Continue registrando treinos para acompanhar a progressão.'}
            </p>
            <p className="text-[11px] text-text-muted mt-0.5">
              {topMuscles.length > 0
                ? `Foco principal: ${(MUSCLE_META[topMuscles[0]![0]] ?? { label: topMuscles[0]![0] }).label} (${totalMuscleVol > 0 ? Math.round((topMuscles[0]![1] / totalMuscleVol) * 100) : 0}% do volume total)`
                : 'Registre seus treinos com exercícios para ver detalhes por grupo muscular.'}
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}
