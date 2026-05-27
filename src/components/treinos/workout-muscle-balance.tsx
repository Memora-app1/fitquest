import { createClient } from '@/lib/supabase/server'
import { Dumbbell, AlertTriangle, TrendingUp } from 'lucide-react'

interface SetRow {
  weight_kg: number | null
  reps: number | null
  is_warmup: boolean
  created_at: string
  exercises: {
    name: string
    muscle_group: string
  } | null
}

interface MuscleGroupData {
  group: string
  label: string
  emoji: string
  color: string
  rgb: string
  sets: number
  volume: number       // kg × reps
  sessions: number     // distinct workout dates
  lastTrained: string | null
  daysSince: number | null
  weeklyAvg: number    // avg sets per week over 8 weeks
}

const MUSCLE_META: Record<string, { label: string; emoji: string; color: string; rgb: string }> = {
  chest:      { label: 'Peito',       emoji: '💪', color: '#FF4D00', rgb: '255,77,0'   },
  back:       { label: 'Costas',      emoji: '🔙', color: '#7C3AED', rgb: '124,58,237' },
  legs:       { label: 'Pernas',      emoji: '🦵', color: '#00FF88', rgb: '0,255,136'  },
  shoulders:  { label: 'Ombros',      emoji: '🎯', color: '#F5C842', rgb: '245,200,66' },
  arms:       { label: 'Braços',      emoji: '💪', color: '#3B82F6', rgb: '59,130,246' },
  core:       { label: 'Core',        emoji: '⚡', color: '#EC4899', rgb: '236,72,153' },
  cardio:     { label: 'Cardio',      emoji: '🏃', color: '#00D9FF', rgb: '0,217,255'  },
  full_body:  { label: 'Corpo todo',  emoji: '🏋️', color: '#8B5CF6', rgb: '139,92,246' },
}

function toISO(d: Date): string {
  return d.toISOString().split('T')[0]!
}

export async function WorkoutMuscleBalance({ userId }: { userId: string }) {
  const supabase = await createClient()

  const now = new Date()
  const eightWeeksAgo = toISO(new Date(now.getTime() - 56 * 86400000))

  const { data: raw } = await supabase
    .from('workout_sets')
    .select('weight_kg, reps, is_warmup, created_at, exercises(name, muscle_group)')
    .eq('user_id', userId)
    .gte('created_at', eightWeeksAgo + 'T00:00:00')
    .order('created_at', { ascending: false })

  const rows = (raw ?? []) as unknown as SetRow[]
  if (rows.length === 0) return null

  const todayStr = toISO(now)

  // Aggregate per muscle group
  const groupMap = new Map<string, {
    sets: number
    volume: number
    sessions: Set<string>
    lastDate: string | null
  }>()

  for (const r of rows) {
    const mg = r.exercises?.muscle_group
    if (!mg || r.is_warmup) continue

    const dateStr = r.created_at.split('T')[0]!
    if (!groupMap.has(mg)) groupMap.set(mg, { sets: 0, volume: 0, sessions: new Set(), lastDate: null })

    const g = groupMap.get(mg)!
    g.sets++
    g.volume += (Number(r.weight_kg ?? 0)) * (Number(r.reps ?? 0))
    g.sessions.add(dateStr)
    if (!g.lastDate || dateStr > g.lastDate) g.lastDate = dateStr
  }

  if (groupMap.size === 0) return null

  // Build MuscleGroupData[]
  const groups: MuscleGroupData[] = []
  for (const [mg, data] of groupMap.entries()) {
    const meta = MUSCLE_META[mg] ?? { label: mg, emoji: '💪', color: '#8899BB', rgb: '136,153,187' }

    const daysSince = data.lastDate
      ? Math.round((new Date(todayStr).getTime() - new Date(data.lastDate).getTime()) / 86400000)
      : null

    // Weekly avg: total sets over 8 weeks → divide by 8
    const weeklyAvg = data.sets / 8

    groups.push({
      group: mg,
      label: meta.label,
      emoji: meta.emoji,
      color: meta.color,
      rgb: meta.rgb,
      sets: data.sets,
      volume: data.volume,
      sessions: data.sessions.size,
      lastTrained: data.lastDate,
      daysSince,
      weeklyAvg,
    })
  }

  // Sort by sets descending
  groups.sort((a, b) => b.sets - a.sets)

  const maxSets   = Math.max(...groups.map(g => g.sets), 1)
  const maxVolume = Math.max(...groups.map(g => g.volume), 1)

  const totalSets   = groups.reduce((s, g) => s + g.sets, 0)
  const totalVolume = groups.reduce((s, g) => s + g.volume, 0)

  // Balance score: evenness of distribution
  // Perfect distribution = all groups equal, score 100
  // Highly concentrated = score near 0
  const expectedShare = 1 / groups.length
  const actualShares  = groups.map(g => g.sets / totalSets)
  const deviation     = actualShares.reduce((s, share) => s + Math.abs(share - expectedShare), 0)
  const maxDeviation  = 2 * (1 - expectedShare) // worst case: all in one group
  const balanceScore  = Math.round((1 - deviation / maxDeviation) * 100)

  // Neglected muscle groups (trained fewer than once per 2 weeks in 8W period)
  const neglected = groups.filter(g => g.weeklyAvg < 0.5)
  const overdone  = groups.filter(g => {
    const share = g.sets / totalSets
    return share > 0.35 && groups.length > 2
  })

  // Format volume
  function formatVol(v: number): string {
    if (v >= 1000) return `${(v / 1000).toFixed(1)}k kg`
    return `${Math.round(v)} kg`
  }

  const balanceColor = balanceScore >= 75 ? '#00FF88' : balanceScore >= 50 ? '#F5C842' : '#FF4D00'
  const balanceLabel = balanceScore >= 75 ? 'Bem equilibrado' : balanceScore >= 50 ? 'Atenção ao equilíbrio' : 'Desequilíbrio muscular'

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
        style={{ background: 'rgba(124,58,237,0.06)' }}
      />

      <div className="relative z-10 space-y-5">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.22)' }}
              >
                <Dumbbell size={12} style={{ color: '#7C3AED' }} />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-text-muted">
                Equilíbrio Muscular — 8 semanas
              </span>
            </div>
            <h2 className="text-xl font-black leading-tight">Distribuição de Treino</h2>
            <p className="text-sm text-text-muted mt-0.5">
              {totalSets} séries · {groups.length} grupos musculares · {formatVol(totalVolume)} total
            </p>
          </div>

          {/* Balance score */}
          <div className="text-right">
            <div className="text-3xl font-black" style={{ color: balanceColor }}>
              {balanceScore}
            </div>
            <div className="text-[10px] text-text-muted uppercase tracking-wider">score equilíbrio</div>
            <div className="text-[10px] font-bold mt-0.5" style={{ color: balanceColor }}>
              {balanceLabel}
            </div>
          </div>
        </div>

        {/* ── Muscle group ranked bars ─────────────────────────────────── */}
        <div className="space-y-2.5">
          {groups.map((g, i) => {
            const setsPct   = Math.round((g.sets / maxSets) * 100)
            const sharePct  = Math.round((g.sets / totalSets) * 100)
            const isNeglect = g.weeklyAvg < 0.5
            const isOverdo  = (g.sets / totalSets) > 0.35 && groups.length > 2

            return (
              <div key={g.group} className="space-y-1">
                <div className="flex items-center gap-2">
                  {/* Rank */}
                  <span
                    className="text-[10px] font-black w-4 shrink-0 text-center"
                    style={{ color: i === 0 ? '#F5C842' : '#5A6B8A' }}
                  >
                    {i + 1}
                  </span>
                  {/* Emoji */}
                  <span className="text-sm shrink-0 w-5">{g.emoji}</span>
                  {/* Label */}
                  <span className="text-xs font-semibold w-20 shrink-0">{g.label}</span>

                  {/* Bar */}
                  <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${setsPct}%`,
                        background: g.color,
                        opacity: isOverdo ? 1 : 0.75,
                      }}
                    />
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-bold w-8 text-right" style={{ color: g.color }}>
                      {g.sets}
                    </span>
                    <span className="text-[9px] text-text-muted w-8 text-right">{sharePct}%</span>
                  </div>

                  {/* Flags */}
                  {isOverdo && (
                    <span
                      className="text-[8px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                      style={{ background: 'rgba(255,77,0,0.15)', color: '#FF4D00' }}
                    >
                      ↑↑
                    </span>
                  )}
                  {isNeglect && (
                    <span
                      className="text-[8px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                      style={{ background: 'rgba(239,68,68,0.12)', color: '#EF4444' }}
                    >
                      ⚠
                    </span>
                  )}
                </div>

                {/* Sub info */}
                <div className="flex items-center gap-3 pl-11 text-[9px] text-text-muted">
                  <span>{g.sessions} sessão{g.sessions !== 1 ? 'ões' : ''}</span>
                  {g.volume > 0 && <span>· {formatVol(g.volume)}</span>}
                  <span>· {g.weeklyAvg.toFixed(1)}×/sem</span>
                  {g.daysSince !== null && (
                    <span
                      style={{ color: g.daysSince > 14 ? '#EF4444' : g.daysSince > 7 ? '#F5C842' : '#8899BB' }}
                    >
                      · {g.daysSince === 0 ? 'hoje' : g.daysSince === 1 ? 'ontem' : `há ${g.daysSince}d`}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* ── Volume distribution bar ─────────────────────────────────── */}
        <div className="space-y-2">
          <div className="text-[10px] text-text-muted uppercase tracking-wider">Volume por grupo (últimas 8 semanas)</div>
          <div className="h-4 rounded-full overflow-hidden flex gap-0.5">
            {groups.filter(g => g.volume > 0).map(g => {
              const pct = Math.round((g.volume / totalVolume) * 100)
              if (pct === 0) return null
              return (
                <div
                  key={g.group}
                  title={`${g.label}: ${pct}%`}
                  style={{
                    width: `${pct}%`,
                    background: g.color,
                    opacity: 0.8,
                  }}
                />
              )
            })}
          </div>
          {/* Legend */}
          <div className="flex flex-wrap gap-2">
            {groups.filter(g => g.volume > 0).map(g => {
              const pct = Math.round((g.volume / totalVolume) * 100)
              return (
                <div key={g.group} className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-sm" style={{ background: g.color, opacity: 0.8 }} />
                  <span className="text-[9px] text-text-muted">{g.label} {pct}%</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Alerts ──────────────────────────────────────────────────── */}
        {(neglected.length > 0 || overdone.length > 0) && (
          <div className="space-y-2">
            {overdone.map(g => (
              <div
                key={`over-${g.group}`}
                className="rounded-xl px-3 py-2 flex items-center gap-2"
                style={{ background: 'rgba(255,77,0,0.06)', border: '1px solid rgba(255,77,0,0.14)' }}
              >
                <TrendingUp size={12} style={{ color: '#FF4D00' }} className="shrink-0" />
                <p className="text-[11px] text-text-muted">
                  <span className="font-semibold" style={{ color: '#FF4D00' }}>{g.label}</span>
                  {' '}representa {Math.round((g.sets / totalSets) * 100)}% do treino — considere diversificar.
                </p>
              </div>
            ))}
            {neglected.slice(0, 3).map(g => (
              <div
                key={`neg-${g.group}`}
                className="rounded-xl px-3 py-2 flex items-center gap-2"
                style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.12)' }}
              >
                <AlertTriangle size={12} style={{ color: '#EF4444' }} className="shrink-0" />
                <p className="text-[11px] text-text-muted">
                  <span className="font-semibold" style={{ color: '#EF4444' }}>{g.label}</span>
                  {' '}: apenas {g.weeklyAvg.toFixed(1)}×/sem nas últimas 8 semanas.
                  {g.daysSince !== null && g.daysSince > 14 && (
                    <> Último treino há {g.daysSince} dias.</>
                  )}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* ── Insight footer ───────────────────────────────────────────── */}
        <div
          className="rounded-xl px-4 py-3 flex items-center gap-3"
          style={{
            background: balanceScore >= 75 ? 'rgba(0,255,136,0.04)' : 'rgba(255,77,0,0.04)',
            border: balanceScore >= 75 ? '1px solid rgba(0,255,136,0.1)' : '1px solid rgba(255,77,0,0.1)',
          }}
        >
          <span className="text-lg shrink-0">
            {balanceScore >= 75 ? '🏆' : balanceScore >= 50 ? '⚡' : '⚠️'}
          </span>
          <div>
            <p className="text-sm font-semibold leading-snug">{balanceLabel}</p>
            <p className="text-[11px] text-text-muted mt-0.5">
              {neglected.length > 0
                ? `${neglected.map(g => g.label).join(', ')} estão sendo sub-treinados. Adicione séries para equilibrar.`
                : overdone.length > 0
                ? `Atenção ao volume excessivo em ${overdone.map(g => g.label).join(', ')}. Risco de desequilíbrio e lesão.`
                : 'Excelente distribuição de treino! Continue priorizando todos os grupos musculares.'}
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}
