import { BarChart2, TrendingUp, Zap, Target } from 'lucide-react'

interface SetRow {
  reps: number | null
  weight_kg: number | null
  is_personal_record: boolean
}

interface ExerciseGroup {
  name: string
  sets: SetRow[]
  totalVolume: number
  maxWeight: number
}

function formatVolume(v: number): string {
  if (v >= 1000) return `${(v / 1000).toFixed(1)}t`
  return `${Math.round(v)}kg`
}

function detectSetPattern(sets: SetRow[]): { label: string; emoji: string } {
  const weights = sets.map(s => s.weight_kg ?? 0).filter(w => w > 0)
  if (weights.length < 2) return { label: 'Série única', emoji: '🎯' }

  const ascending  = weights.every((w, i) => i === 0 || w >= weights[i - 1]!)
  const descending = weights.every((w, i) => i === 0 || w <= weights[i - 1]!)
  const allEqual   = weights.every(w => w === weights[0])

  if (allEqual)   return { label: 'Série plana', emoji: '➖' }
  if (ascending)  return { label: 'Pirâmide crescente', emoji: '📈' }
  if (descending) return { label: 'Drop set / pirâmide', emoji: '📉' }
  return { label: 'Variado', emoji: '🔀' }
}

function buildMiniBar(sets: SetRow[], maxWeight: number): Array<{ pct: number; isPR: boolean }> {
  return sets.map(s => ({
    pct: maxWeight > 0 ? Math.round(((s.weight_kg ?? 0) / maxWeight) * 100) : 0,
    isPR: s.is_personal_record,
  }))
}

export function WorkoutVolumeAnalysis({
  exerciseGroups,
  totalVolumePrev,
  durationMinutes,
}: {
  exerciseGroups: ExerciseGroup[]
  totalVolumePrev: number | null
  durationMinutes: number
}) {
  if (exerciseGroups.length === 0) return null

  const totalVolume  = exerciseGroups.reduce((s, g) => s + g.totalVolume, 0)
  const totalSets    = exerciseGroups.reduce((s, g) => s + g.sets.length, 0)
  const totalPRSets  = exerciseGroups.reduce((s, g) => s + g.sets.filter(st => st.is_personal_record).length, 0)
  const maxExVol     = Math.max(...exerciseGroups.map(g => g.totalVolume), 1)

  // Sorted by volume desc
  const sortedGroups = [...exerciseGroups].sort((a, b) => b.totalVolume - a.totalVolume)

  const volumeChg    = totalVolumePrev !== null && totalVolumePrev > 0
    ? Math.round(((totalVolume - totalVolumePrev) / totalVolumePrev) * 100)
    : null

  const efficiency   = durationMinutes > 0 ? Math.round(totalVolume / durationMinutes) : null

  // Exercise distribution for the mini pie strip
  const totalParts   = sortedGroups.reduce((s, g) => s + g.totalVolume, 0) || 1
  const COLORS        = ['#FF4D00', '#7C3AED', '#00FF88', '#F5C842', '#3B82F6', '#EC4899']

  return (
    <div
      className="rounded-2xl p-5 md:p-6 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(124,58,237,0.06) 0%, rgba(13,24,41,0.98) 60%, rgba(255,77,0,0.03) 100%)',
        border: '1px solid rgba(124,58,237,0.14)',
      }}
    >
      <div
        className="absolute -top-8 -right-8 w-40 h-40 rounded-full pointer-events-none blur-3xl"
        style={{ background: 'rgba(124,58,237,0.07)' }}
      />

      <div className="relative z-10 space-y-5">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.22)' }}
          >
            <BarChart2 size={12} style={{ color: '#7C3AED' }} />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-text-muted">
            Análise do Treino
          </span>
        </div>

        {/* ── Stats strip ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          <div
            className="rounded-xl p-3 text-center"
            style={{ background: 'rgba(255,77,0,0.07)', border: '1px solid rgba(255,77,0,0.15)' }}
          >
            <div className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Volume total</div>
            <div className="font-black text-base leading-none" style={{ color: '#FF4D00' }}>
              {formatVolume(totalVolume)}
            </div>
            {volumeChg !== null && (
              <div
                className="text-[9px] font-bold mt-1"
                style={{ color: volumeChg >= 0 ? '#00FF88' : '#EF4444' }}
              >
                {volumeChg >= 0 ? '+' : ''}{volumeChg}% vs anterior
              </div>
            )}
          </div>

          <div
            className="rounded-xl p-3 text-center"
            style={{ background: 'rgba(124,58,237,0.07)', border: '1px solid rgba(124,58,237,0.15)' }}
          >
            <div className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Exercícios</div>
            <div className="font-black text-base leading-none" style={{ color: '#7C3AED' }}>
              {exerciseGroups.length}
            </div>
            <div className="text-[9px] text-text-muted mt-1">{totalSets} séries</div>
          </div>

          {efficiency !== null && (
            <div
              className="rounded-xl p-3 text-center"
              style={{ background: 'rgba(0,255,136,0.07)', border: '1px solid rgba(0,255,136,0.15)' }}
            >
              <div className="text-[10px] text-text-muted uppercase tracking-wider mb-1">Eficiência</div>
              <div className="font-black text-base leading-none" style={{ color: '#00FF88' }}>
                {efficiency}
                <span className="text-xs font-normal ml-0.5">kg/min</span>
              </div>
              <div className="text-[9px] text-text-muted mt-1">{durationMinutes} min totais</div>
            </div>
          )}

          <div
            className="rounded-xl p-3 text-center"
            style={{ background: 'rgba(245,200,66,0.07)', border: '1px solid rgba(245,200,66,0.15)' }}
          >
            <div className="text-[10px] text-text-muted uppercase tracking-wider mb-1">PRs batidos</div>
            <div className="font-black text-base leading-none" style={{ color: '#F5C842' }}>
              {totalPRSets}
            </div>
            <div className="text-[9px] text-text-muted mt-1">
              {totalPRSets > 0 ? '🏆 Novo recorde!' : 'Nenhum desta vez'}
            </div>
          </div>
        </div>

        {/* ── Exercise volume ranking ──────────────────────────────────── */}
        <div className="space-y-3">
          <div className="text-[10px] text-text-muted uppercase tracking-wider">Volume por exercício</div>
          {sortedGroups.map((group, i) => {
            const barPct    = Math.round((group.totalVolume / maxExVol) * 100)
            const color     = COLORS[i % COLORS.length]!
            const pattern   = detectSetPattern(group.sets)
            const miniBars  = buildMiniBar(group.sets, group.maxWeight)

            return (
              <div key={group.name}>
                <div className="flex items-start gap-2.5">
                  {/* Rank badge */}
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5"
                    style={{ background: `rgba(${i === 0 ? '245,200,66' : '255,255,255'},0.08)`, color: i === 0 ? '#F5C842' : '#5A6B8A' }}
                  >
                    {i + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Name row */}
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-sm font-semibold truncate">{group.name}</span>
                        <span
                          className="text-[9px] text-text-muted shrink-0"
                          title={pattern.label}
                        >
                          {pattern.emoji}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {group.maxWeight > 0 && (
                          <span className="text-[10px] text-text-muted">{group.maxWeight}kg max</span>
                        )}
                        <span className="text-xs font-bold" style={{ color }}>
                          {formatVolume(group.totalVolume)}
                        </span>
                      </div>
                    </div>

                    {/* Volume bar */}
                    <div className="h-1.5 rounded-full overflow-hidden mb-1.5" style={{ background: 'rgba(255,255,255,0.05)' }}>
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${barPct}%`, background: color, opacity: 0.8 }}
                      />
                    </div>

                    {/* Mini set bars (weight per set) */}
                    {miniBars.length > 0 && group.maxWeight > 0 && (
                      <div className="flex items-end gap-0.5 h-4">
                        {miniBars.map((bar, si) => (
                          <div
                            key={si}
                            title={`Série ${si + 1}: ${group.sets[si]?.weight_kg ?? 0}kg × ${group.sets[si]?.reps ?? 0} reps${bar.isPR ? ' 🏆 PR' : ''}`}
                            className="flex-1 rounded-sm"
                            style={{
                              height: `${Math.max(20, bar.pct)}%`,
                              background: bar.isPR ? '#F5C842' : `rgba(${i === 0 ? '245,200,66' : '255,255,255'},${0.15 + (bar.pct / 100) * 0.4})`,
                              border: bar.isPR ? '1px solid rgba(245,200,66,0.6)' : 'none',
                            }}
                          />
                        ))}
                      </div>
                    )}

                    {/* Set details */}
                    <div className="text-[9px] text-text-muted mt-1 flex gap-2 flex-wrap">
                      <span>{group.sets.length} séries</span>
                      <span>·</span>
                      <span>{pattern.label}</span>
                      {group.sets.some(s => s.is_personal_record) && (
                        <>
                          <span>·</span>
                          <span style={{ color: '#F5C842' }}>
                            🏆 {group.sets.filter(s => s.is_personal_record).length} PR
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {i < sortedGroups.length - 1 && (
                  <div className="mt-3 h-px" style={{ background: 'rgba(255,255,255,0.04)' }} />
                )}
              </div>
            )
          })}
        </div>

        {/* ── Exercise distribution strip ──────────────────────────────── */}
        <div className="space-y-1.5">
          <div className="text-[10px] text-text-muted uppercase tracking-wider">Distribuição de volume</div>
          <div className="flex gap-0.5 h-2.5 rounded-full overflow-hidden">
            {sortedGroups.map((g, i) => {
              const pct = Math.round((g.totalVolume / totalParts) * 100)
              return (
                <div
                  key={g.name}
                  title={`${g.name}: ${pct}%`}
                  style={{ width: `${pct}%`, background: COLORS[i % COLORS.length], opacity: 0.8 }}
                />
              )
            })}
          </div>
          <div className="flex flex-wrap gap-2 mt-1">
            {sortedGroups.slice(0, 5).map((g, i) => {
              const pct = Math.round((g.totalVolume / totalParts) * 100)
              return (
                <div key={g.name} className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="text-[9px] text-text-muted truncate max-w-16">{g.name}</span>
                  <span className="text-[9px] text-text-muted">{pct}%</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Insight footer ───────────────────────────────────────────── */}
        {sortedGroups[0] && (
          <div
            className="rounded-xl px-4 py-3 flex items-center gap-3"
            style={{ background: 'rgba(124,58,237,0.05)', border: '1px solid rgba(124,58,237,0.1)' }}
          >
            <span className="text-lg shrink-0">
              {totalPRSets > 0 ? '🏆' : volumeChg !== null && volumeChg > 0 ? '📈' : '💪'}
            </span>
            <p className="text-xs text-text-muted">
              {totalPRSets > 0
                ? `Você bateu ${totalPRSets} recorde${totalPRSets !== 1 ? 's' : ''} pessoal${totalPRSets !== 1 ? 'is' : ''} nessa sessão.`
                : volumeChg !== null && volumeChg > 0
                ? `Volume ${volumeChg}% acima do treino anterior — ótima progressão!`
                : volumeChg !== null && volumeChg < 0
                ? `Volume ${Math.abs(volumeChg)}% abaixo do treino anterior — recuperação ou deload?`
                : `Exercício com maior volume: ${sortedGroups[0].name} (${formatVolume(sortedGroups[0].totalVolume)}).`
              }
            </p>
          </div>
        )}

      </div>
    </div>
  )
}
