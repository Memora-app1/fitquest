import { createClient } from '@/lib/supabase/server'
import { Calendar } from 'lucide-react'

const DOW_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const DOW_LABELS_FULL = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

const MUSCLE_COLORS: Record<string, string> = {
  chest: '#FF4D00', back: '#7C3AED', legs: '#00FF88', shoulders: '#F5C842',
  arms: '#3B82F6', core: '#EC4899', cardio: '#00D9FF', full_body: '#8B5CF6',
}

const MUSCLE_LABELS: Record<string, string> = {
  chest: 'Peito', back: 'Costas', legs: 'Pernas', shoulders: 'Ombros',
  arms: 'Braços', core: 'Core', cardio: 'Cardio', full_body: 'Corpo todo',
}

export async function WorkoutDayOfWeekAnalysis({ userId }: { userId: string }) {
  const supabase = await createClient()

  const ninetyDaysAgo = new Date(Date.now() - 90 * 86400000).toISOString()

  const [workoutsRes, setsRes] = await Promise.all([
    supabase
      .from('workouts')
      .select('id, started_at, total_volume_kg')
      .eq('user_id', userId)
      .gte('started_at', ninetyDaysAgo)
      .order('started_at', { ascending: false }),
    supabase
      .from('workout_sets')
      .select('workout_id, exercises(muscle_group)')
      .eq('user_id', userId)
      .gte('created_at', ninetyDaysAgo)
      .eq('is_warmup', false),
  ])

  const workouts = workoutsRes.data ?? []
  if (workouts.length < 3) return null

  type SetRow = { workout_id: string; exercises: { muscle_group: string } | null }
  const rawSets = (setsRes.data ?? []) as unknown as SetRow[]

  // Map workout_id → muscle_groups trained
  const workoutMuscles = new Map<string, Set<string>>()
  for (const s of rawSets) {
    const mg = s.exercises?.muscle_group
    if (!mg) continue
    if (!workoutMuscles.has(s.workout_id)) workoutMuscles.set(s.workout_id, new Set())
    workoutMuscles.get(s.workout_id)!.add(mg)
  }

  // Count workouts per DOW + volume per DOW + muscles per DOW
  const dowCount = new Array(7).fill(0) as number[]
  const dowVolume = new Array(7).fill(0) as number[]
  const dowMuscles = Array.from({ length: 7 }, () => new Map<string, number>())

  for (const w of workouts) {
    const dow = new Date(w.started_at).getDay() // 0=Sun
    dowCount[dow] = (dowCount[dow] ?? 0) + 1
    dowVolume[dow] = (dowVolume[dow] ?? 0) + (w.total_volume_kg ?? 0)

    const muscles = workoutMuscles.get(w.id)
    if (muscles) {
      const dm = dowMuscles[dow]!
      for (const mg of muscles) {
        dm.set(mg, (dm.get(mg) ?? 0) + 1)
      }
    }
  }

  const maxCount = Math.max(...dowCount, 1)
  const maxVolume = Math.max(...dowVolume, 1)

  const mostFreqDow = dowCount.indexOf(Math.max(...dowCount))
  const leastFreqDow = dowCount.indexOf(Math.min(...dowCount.filter(c => c > 0)))

  // Top muscle per DOW
  function topMuscle(dow: number): { muscle: string; color: string; label: string } | null {
    const dm = dowMuscles[dow]!
    if (dm.size === 0) return null
    const top = Array.from(dm.entries()).sort((a, b) => b[1] - a[1])[0]!
    return {
      muscle: top[0],
      color: MUSCLE_COLORS[top[0]] ?? '#8899BB',
      label: MUSCLE_LABELS[top[0]] ?? top[0],
    }
  }

  const restDays = dowCount.filter(c => c === 0).length
  const avgWorkoutsPerWeek = (workouts.length / 90) * 7

  return (
    <div
      className="rounded-2xl p-5 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(0,255,136,0.06) 0%, rgba(13,24,41,0.98) 100%)',
        border: '1px solid rgba(0,255,136,0.13)',
      }}
    >
      <div
        className="absolute -top-6 -right-6 w-28 h-28 rounded-full pointer-events-none blur-3xl"
        style={{ background: 'rgba(0,255,136,0.08)' }}
      />

      <div className="relative z-10 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(0,255,136,0.15)', border: '1px solid rgba(0,255,136,0.3)' }}
            >
              <Calendar size={12} style={{ color: '#00FF88' }} />
            </div>
            <div>
              <div className="text-sm font-black">Frequência por dia da semana</div>
              <div className="text-[10px] text-text-muted">{workouts.length} treinos nos últimos 90 dias</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-black text-brand-green">
              {avgWorkoutsPerWeek.toFixed(1)}×/sem
            </div>
            <div className="text-[10px] text-text-muted">média semanal</div>
          </div>
        </div>

        {/* DOW bar chart */}
        <div className="flex items-end gap-2">
          {DOW_LABELS.map((label, dow) => {
            const count = dowCount[dow]!
            const volume = dowVolume[dow]!
            const barH = maxCount > 0 ? Math.max(count > 0 ? 8 : 0, (count / maxCount) * 100) : 0
            const top = topMuscle(dow)
            const isBest = dow === mostFreqDow && count > 0
            const isRest = count === 0

            return (
              <div key={dow} className="flex-1 flex flex-col items-center gap-1.5">
                {/* Volume label */}
                <div className="text-[9px] text-text-muted h-4 flex items-end">
                  {volume > 0 ? (volume > 1000 ? `${(volume / 1000).toFixed(1)}t` : `${Math.round(volume)}kg`) : ''}
                </div>

                {/* Bar */}
                <div className="w-full flex flex-col justify-end" style={{ height: '80px' }}>
                  <div
                    className="w-full rounded-t-lg transition-all relative overflow-hidden"
                    style={{
                      height: `${Math.max(isRest ? 3 : 8, barH)}%`,
                      background: isRest
                        ? 'rgba(255,255,255,0.04)'
                        : top
                        ? isBest
                          ? top.color
                          : `${top.color}70`
                        : isBest
                        ? '#00FF88'
                        : 'rgba(0,255,136,0.4)',
                      boxShadow: isBest && !isRest ? `0 0 10px ${top?.color ?? '#00FF88'}50` : 'none',
                      border: isBest && !isRest ? `1px solid ${top?.color ?? '#00FF88'}60` : 'none',
                    }}
                  >
                    {/* count badge inside bar if tall enough */}
                    {count >= 2 && barH > 30 && (
                      <div className="absolute top-1 left-0 right-0 flex justify-center">
                        <span className="text-[9px] font-black text-white/80">{count}×</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Count badge */}
                {count > 0 && barH <= 30 && (
                  <div
                    className="text-[9px] font-bold"
                    style={{ color: top?.color ?? '#00FF88' }}
                  >
                    {count}×
                  </div>
                )}

                {/* DOW label */}
                <span
                  className="text-[10px] font-semibold"
                  style={{
                    color: isBest ? '#00FF88' : isRest ? 'rgba(136,153,187,0.35)' : '#8899BB',
                  }}
                >
                  {label}
                </span>

                {/* Top muscle chip */}
                {top && (
                  <div
                    className="text-[8px] px-1.5 py-0.5 rounded-full font-bold text-center w-full truncate"
                    style={{ background: `${top.color}18`, color: top.color }}
                  >
                    {top.label}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2">
          <div
            className="rounded-xl p-3 text-center"
            style={{ background: 'rgba(0,255,136,0.06)', border: '1px solid rgba(0,255,136,0.12)' }}
          >
            <div className="text-sm font-black text-brand-green">{DOW_LABELS_FULL[mostFreqDow]}</div>
            <div className="text-[9px] text-text-muted mt-0.5">dia mais ativo</div>
          </div>
          <div
            className="rounded-xl p-3 text-center"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="text-sm font-black">{restDays}</div>
            <div className="text-[9px] text-text-muted mt-0.5">dias de descanso</div>
          </div>
          <div
            className="rounded-xl p-3 text-center"
            style={{ background: 'rgba(245,200,66,0.06)', border: '1px solid rgba(245,200,66,0.12)' }}
          >
            <div className="text-sm font-black text-brand-gold">
              {Math.round(workouts.reduce((s, w) => s + (w.total_volume_kg ?? 0), 0) / workouts.length)}kg
            </div>
            <div className="text-[9px] text-text-muted mt-0.5">volume médio/treino</div>
          </div>
        </div>

        {/* Insight */}
        <div
          className="rounded-xl px-3 py-2.5"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <p className="text-[11px] text-text-secondary leading-snug">
            {dowCount[mostFreqDow]! > dowCount[(mostFreqDow + 1) % 7]! * 1.5
              ? `Você concentra muito treino em ${DOW_LABELS_FULL[mostFreqDow]}. Distribuir ao longo da semana pode melhorar a recuperação.`
              : restDays >= 5
              ? `Com ${7 - restDays} dias de treino, você tem bastante recuperação — considere aumentar a frequência para ${7 - restDays + 1}–${7 - restDays + 2}x/semana.`
              : `Boa distribuição! Você treina ${7 - restDays} dias por semana com ${restDays} de descanso.`}
          </p>
        </div>
      </div>
    </div>
  )
}
