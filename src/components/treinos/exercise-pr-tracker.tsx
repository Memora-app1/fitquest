import { createClient } from '@/lib/supabase/server'
import { Trophy, TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface SetRow {
  weight_kg: number | null
  reps: number | null
  is_personal_record: boolean
  is_warmup: boolean
  created_at: string
  exercises: {
    id: string
    name: string
    muscle_group: string
  } | null
}

interface ExercisePR {
  exerciseId: string
  name: string
  muscleGroup: string
  prWeight: number
  prReps: number
  prDate: string
  previousWeight: number | null
  deltaKg: number | null
  deltaPct: number | null
  sessionsCount: number
  lastTrained: string
  daysSince: number
  recentSets: { weight: number; reps: number; date: string }[]
}

const MUSCLE_LABELS: Record<string, string> = {
  chest: 'Peito', back: 'Costas', legs: 'Pernas', shoulders: 'Ombros',
  arms: 'Braços', core: 'Core', cardio: 'Cardio', full_body: 'Corpo todo',
}

function toISO(d: Date): string {
  return d.toISOString().split('T')[0]!
}

export async function ExercisePrTracker({ userId }: { userId: string }) {
  const supabase = await createClient()

  const now = new Date()
  const todayStr = toISO(now)
  const twelveWeeksAgo = toISO(new Date(now.getTime() - 84 * 86400000))

  const { data: raw } = await supabase
    .from('workout_sets')
    .select('weight_kg, reps, is_personal_record, is_warmup, created_at, exercises(id, name, muscle_group)')
    .eq('user_id', userId)
    .gt('weight_kg', 0)
    .eq('is_warmup', false)
    .gte('created_at', twelveWeeksAgo + 'T00:00:00')
    .order('created_at', { ascending: true })

  const rows = (raw ?? []) as unknown as SetRow[]
  if (rows.length === 0) return null

  // Group by exercise
  const exerciseMap = new Map<string, {
    name: string
    muscleGroup: string
    sets: { weight: number; reps: number; date: string; isPR: boolean }[]
  }>()

  for (const r of rows) {
    if (!r.exercises?.id || r.is_warmup) continue
    const id = r.exercises.id

    if (!exerciseMap.has(id)) {
      exerciseMap.set(id, {
        name: r.exercises.name,
        muscleGroup: r.exercises.muscle_group,
        sets: [],
      })
    }
    exerciseMap.get(id)!.sets.push({
      weight: Number(r.weight_kg ?? 0),
      reps: Number(r.reps ?? 0),
      date: r.created_at.split('T')[0]!,
      isPR: r.is_personal_record,
    })
  }

  if (exerciseMap.size === 0) return null

  // Build ExercisePR for each exercise
  const prs: ExercisePR[] = []

  for (const [id, data] of exerciseMap.entries()) {
    if (data.sets.length === 0) continue

    // Sort by date asc
    const sorted = [...data.sets].sort((a, b) => a.date.localeCompare(b.date))

    // Find all-time PR in this 12-week window
    let prWeight = 0
    let prReps = 0
    let prDate = sorted[0]!.date

    for (const s of sorted) {
      if (s.weight > prWeight || (s.weight === prWeight && s.reps > prReps)) {
        prWeight = s.weight
        prReps = s.reps
        prDate = s.date
      }
    }

    // Find previous-best before the PR date
    const beforePR = sorted.filter(s => s.date < prDate)
    const prevWeight = beforePR.length > 0
      ? Math.max(...beforePR.map(s => s.weight))
      : null

    const deltaKg = prevWeight !== null ? prWeight - prevWeight : null
    const deltaPct = prevWeight !== null && prevWeight > 0
      ? Math.round(((prWeight - prevWeight) / prevWeight) * 100)
      : null

    // Count distinct workout sessions
    const sessionDates = new Set(sorted.map(s => s.date))
    const sessionsCount = sessionDates.size

    const lastTrained = sorted[sorted.length - 1]!.date
    const daysSince = Math.round((new Date(todayStr).getTime() - new Date(lastTrained).getTime()) / 86400000)

    // Recent 5 sets (last 5 workouts — latest weight per session)
    const latestPerSession = new Map<string, { weight: number; reps: number; date: string }>()
    for (const s of sorted) {
      const existing = latestPerSession.get(s.date)
      if (!existing || s.weight > existing.weight) {
        latestPerSession.set(s.date, s)
      }
    }
    const recentSets = [...latestPerSession.values()]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5)
      .reverse()

    prs.push({
      exerciseId: id,
      name: data.name,
      muscleGroup: data.muscleGroup,
      prWeight,
      prReps,
      prDate,
      previousWeight: prevWeight,
      deltaKg,
      deltaPct,
      sessionsCount,
      lastTrained,
      daysSince,
      recentSets,
    })
  }

  if (prs.length === 0) return null

  // Sort by delta (most improved first), then by sessions count
  prs.sort((a, b) => {
    const aDelta = a.deltaPct ?? 0
    const bDelta = b.deltaPct ?? 0
    if (bDelta !== aDelta) return bDelta - aDelta
    return b.sessionsCount - a.sessionsCount
  })

  const topPrs = prs.slice(0, 8)

  // Total PRs count (sets flagged as is_personal_record)
  const totalPrCount = rows.filter(r => r.is_personal_record).length

  // Group by muscle group for overview
  const byMuscle = new Map<string, ExercisePR[]>()
  for (const p of topPrs) {
    if (!byMuscle.has(p.muscleGroup)) byMuscle.set(p.muscleGroup, [])
    byMuscle.get(p.muscleGroup)!.push(p)
  }

  return (
    <div
      className="rounded-2xl p-5 md:p-6 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(245,200,66,0.06) 0%, rgba(13,24,41,0.98) 60%, rgba(0,255,136,0.04) 100%)',
        border: '1px solid rgba(245,200,66,0.14)',
      }}
    >
      <div
        className="absolute -top-8 -right-8 w-40 h-40 rounded-full pointer-events-none blur-3xl"
        style={{ background: 'rgba(245,200,66,0.06)' }}
      />

      <div className="relative z-10 space-y-5">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(245,200,66,0.12)', border: '1px solid rgba(245,200,66,0.22)' }}
              >
                <Trophy size={12} style={{ color: '#F5C842' }} />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-text-muted">
                Recordes Pessoais — 12 semanas
              </span>
            </div>
            <h2 className="text-xl font-black leading-tight">Progressão de Força</h2>
            <p className="text-sm text-text-muted mt-0.5">
              {prs.length} exercício{prs.length !== 1 ? 's' : ''} · {totalPrCount} PR{totalPrCount !== 1 ? 's' : ''} batido{totalPrCount !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Most improved badge */}
          {topPrs[0] && topPrs[0].deltaPct !== null && topPrs[0].deltaPct > 0 && (
            <div
              className="text-right flex flex-col items-end gap-0.5"
            >
              <div className="text-2xl font-black" style={{ color: '#00FF88' }}>
                +{topPrs[0].deltaPct}%
              </div>
              <div className="text-[10px] text-text-muted uppercase tracking-wider">
                {topPrs[0].name}
              </div>
            </div>
          )}
        </div>

        {/* ── Exercise PRs ─────────────────────────────────────────────── */}
        <div className="space-y-3">
          {topPrs.map((p, i) => {
            const muscleLabel = MUSCLE_LABELS[p.muscleGroup] ?? p.muscleGroup
            const isStale  = p.daysSince > 21
            const isRecent = p.daysSince <= 7

            // Mini sparkline: max weight in recent sets
            const maxWeight = Math.max(...p.recentSets.map(s => s.weight), 1)

            return (
              <div
                key={p.exerciseId}
                className="rounded-xl p-3"
                style={{
                  background: i === 0
                    ? 'linear-gradient(135deg, rgba(245,200,66,0.08) 0%, rgba(13,24,41,0.98) 100%)'
                    : 'rgba(255,255,255,0.025)',
                  border: i === 0
                    ? '1px solid rgba(245,200,66,0.18)'
                    : '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <div className="flex items-start gap-3">
                  {/* Rank + info */}
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {/* Position */}
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0"
                      style={{
                        background: i === 0 ? 'rgba(245,200,66,0.2)' : 'rgba(255,255,255,0.05)',
                        color: i === 0 ? '#F5C842' : '#5A6B8A',
                      }}
                    >
                      {i === 0 ? '🏆' : i + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-bold truncate">{p.name}</span>
                        <span
                          className="text-[9px] px-1.5 py-0.5 rounded-full shrink-0"
                          style={{ background: 'rgba(255,255,255,0.06)', color: '#8899BB' }}
                        >
                          {muscleLabel}
                        </span>
                        {isStale && (
                          <span className="text-[9px] font-bold" style={{ color: '#EF4444' }}>
                            há {p.daysSince}d
                          </span>
                        )}
                        {isRecent && (
                          <span className="text-[9px] font-bold" style={{ color: '#00FF88' }}>
                            recente
                          </span>
                        )}
                      </div>

                      {/* PR info row */}
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        <span className="font-black text-base" style={{ color: '#F5C842' }}>
                          {p.prWeight}kg × {p.prReps}
                        </span>

                        {p.deltaKg !== null && p.deltaKg !== 0 && (
                          <span
                            className="text-[10px] font-bold flex items-center gap-0.5"
                            style={{ color: p.deltaKg > 0 ? '#00FF88' : '#EF4444' }}
                          >
                            {p.deltaKg > 0
                              ? <TrendingUp size={9} />
                              : p.deltaKg < 0
                              ? <TrendingDown size={9} />
                              : <Minus size={9} />
                            }
                            {p.deltaKg > 0 ? '+' : ''}{p.deltaKg}kg
                            {p.deltaPct !== null && ` (${p.deltaPct > 0 ? '+' : ''}${p.deltaPct}%)`}
                          </span>
                        )}

                        <span className="text-[9px] text-text-muted">
                          {p.sessionsCount} sessão{p.sessionsCount !== 1 ? 'ões' : ''}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Mini sparkline */}
                  {p.recentSets.length > 1 && (
                    <div className="flex items-end gap-0.5 shrink-0" style={{ height: '28px', width: `${p.recentSets.length * 8}px` }}>
                      {p.recentSets.map((s, si) => {
                        const h = Math.max(3, Math.round((s.weight / maxWeight) * 28))
                        const isMax = s.weight === maxWeight
                        return (
                          <div
                            key={si}
                            className="flex-1 rounded-t-sm"
                            style={{
                              height: `${h}px`,
                              background: isMax ? '#F5C842' : 'rgba(245,200,66,0.35)',
                            }}
                          />
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* ── Insight footer ───────────────────────────────────────────── */}
        <div
          className="rounded-xl px-4 py-3 flex items-center gap-3"
          style={{
            background: 'rgba(245,200,66,0.04)',
            border: '1px solid rgba(245,200,66,0.1)',
          }}
        >
          <span className="text-lg shrink-0">
            {totalPrCount >= 10 ? '🏆' : totalPrCount >= 5 ? '💪' : '⚡'}
          </span>
          <div>
            <p className="text-sm font-semibold leading-snug">
              {totalPrCount} recorde{totalPrCount !== 1 ? 's pessoais' : ' pessoal'} nas últimas 12 semanas
            </p>
            <p className="text-[11px] text-text-muted mt-0.5">
              {prs.filter(p => p.daysSince > 21).length > 0
                ? `${prs.filter(p => p.daysSince > 21).length} exercício${prs.filter(p => p.daysSince > 21).length !== 1 ? 's' : ''} sem treino há mais de 3 semanas.`
                : prs.filter(p => p.deltaPct !== null && p.deltaPct > 0).length > 0
                ? `Maior evolução: ${topPrs[0]?.name} com +${topPrs[0]?.deltaPct}% de ganho de força.`
                : 'Continue treinando para registrar novos PRs!'}
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}
