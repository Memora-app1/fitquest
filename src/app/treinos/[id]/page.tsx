import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { AppShell } from '@/components/layout/app-shell'
import Link from 'next/link'
import { formatDateBR } from '@/lib/utils'
import { ArrowLeft, Dumbbell, Zap, Trophy, Clock, BarChart2 } from 'lucide-react'
import { WorkoutDetailActions } from '@/components/treinos/workout-detail-actions'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('workouts')
    .select('title')
    .eq('id', id)
    .single()
  return { title: data?.title ?? 'Treino' }
}

type SetWithExercise = {
  id: string
  set_number: number
  reps: number | null
  weight_kg: number | null
  is_personal_record: boolean
  exercises: { name: string }[] | null
}

type ExerciseGroup = {
  name: string
  sets: SetWithExercise[]
  totalVolume: number
  maxWeight: number
}

export default async function WorkoutDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [workoutRes, setsRes, prevWorkoutRes] = await Promise.all([
    supabase
      .from('workouts')
      .select(
        'id, title, started_at, finished_at, duration_minutes, total_volume_kg, total_sets, total_reps, xp_earned, is_personal_record_session'
      )
      .eq('id', id)
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('workout_sets')
      .select('id, set_number, reps, weight_kg, is_personal_record, exercises(name)')
      .eq('workout_id', id)
      .order('set_number', { ascending: true }),
    // Get previous workout for comparison
    supabase
      .from('workouts')
      .select('id, total_volume_kg, started_at')
      .eq('user_id', user.id)
      .lt('started_at', new Date().toISOString())
      .neq('id', id)
      .order('started_at', { ascending: false })
      .limit(1),
  ])

  if (!workoutRes.data) notFound()

  const workout = workoutRes.data
  const rawSets = setsRes.data ?? []
  const sets: SetWithExercise[] = rawSets.map((s) => ({
    ...s,
    exercises: Array.isArray(s.exercises) ? s.exercises : s.exercises ? [s.exercises] : null,
  }))

  // Duration
  let durationDisplay = ''
  let durationMinutes = 0
  if (workout.started_at && workout.finished_at) {
    const ms = new Date(workout.finished_at).getTime() - new Date(workout.started_at).getTime()
    durationMinutes = Math.floor(ms / 60000)
    durationDisplay = durationMinutes > 1 ? `${durationMinutes} min` : 'Registro rápido'
  }

  // Group sets by exercise name with volume stats
  const groupMap = new Map<string, ExerciseGroup>()
  for (const set of sets) {
    const name = set.exercises?.[0]?.name ?? 'Exercício'
    if (!groupMap.has(name)) {
      groupMap.set(name, { name, sets: [], totalVolume: 0, maxWeight: 0 })
    }
    const grp = groupMap.get(name)!
    grp.sets.push(set)
    if (set.weight_kg && set.reps) {
      grp.totalVolume += set.weight_kg * set.reps
    }
    if (set.weight_kg && set.weight_kg > grp.maxWeight) {
      grp.maxWeight = set.weight_kg
    }
  }
  const exerciseGroups = [...groupMap.values()]

  const prCount = sets.filter((s) => s.is_personal_record).length
  const prevVolume = prevWorkoutRes.data?.[0]?.total_volume_kg ?? null
  const volumeDiff = prevVolume !== null ? workout.total_volume_kg - prevVolume : null

  // Build "do again" exercises list
  const doAgainExercises = exerciseGroups.map((g) => ({
    exercise_name: g.name,
    weight_kg: String(g.maxWeight || ''),
    reps: String(g.sets[0]?.reps || ''),
    sets: String(g.sets.length),
  }))

  return (
    <AppShell>
      <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-6">
        <Link
          href="/treinos"
          className="flex items-center gap-2 text-text-secondary hover:text-white transition-colors w-fit"
        >
          <ArrowLeft size={18} />
          Voltar para treinos
        </Link>

        {/* Header card */}
        <div
          className="rounded-2xl p-6 space-y-5 relative overflow-hidden"
          style={{
            background: workout.is_personal_record_session
              ? 'linear-gradient(135deg, rgba(245,200,66,0.1) 0%, rgba(13,24,41,0.98) 100%)'
              : 'linear-gradient(135deg, rgba(255,77,0,0.07) 0%, rgba(13,24,41,0.98) 100%)',
            border: workout.is_personal_record_session
              ? '1px solid rgba(245,200,66,0.3)'
              : '1px solid rgba(255,77,0,0.2)',
          }}
        >
          <div
            className="absolute -top-10 -right-10 w-48 h-48 rounded-full pointer-events-none"
            style={{
              background: workout.is_personal_record_session
                ? 'radial-gradient(circle, rgba(245,200,66,0.12) 0%, transparent 70%)'
                : 'radial-gradient(circle, rgba(255,77,0,0.1) 0%, transparent 70%)',
            }}
          />
          <div className="relative z-10">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="heading-display text-3xl md:text-4xl leading-tight">{workout.title}</h1>
                <p className="text-text-secondary mt-1">{formatDateBR(workout.started_at)}</p>
              </div>
              {workout.is_personal_record_session && (
                <div
                  className="flex items-center gap-1.5 rounded-xl px-3 py-2 font-bold whitespace-nowrap text-sm shrink-0"
                  style={{ background: 'rgba(245,200,66,0.15)', border: '1px solid rgba(245,200,66,0.4)', color: '#F5C842' }}
                >
                  <Trophy size={15} />
                  PR Session!
                </div>
              )}
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
              <div
                className="rounded-xl p-3 text-center"
                style={{ background: 'rgba(255,77,0,0.08)', border: '1px solid rgba(255,77,0,0.15)' }}
              >
                <div className="heading-display text-2xl text-brand-orange">{workout.total_sets}</div>
                <div className="text-xs text-text-muted mt-0.5">sets</div>
              </div>
              <div
                className="rounded-xl p-3 text-center"
                style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.15)' }}
              >
                <div className="heading-display text-2xl text-brand-purple">
                  {workout.total_volume_kg > 1000
                    ? `${(workout.total_volume_kg / 1000).toFixed(1)}t`
                    : `${workout.total_volume_kg}kg`}
                </div>
                <div className="text-xs text-text-muted mt-0.5">volume</div>
                {volumeDiff !== null && (
                  <div className={`text-[10px] mt-0.5 ${volumeDiff >= 0 ? 'text-brand-green' : 'text-brand-red'}`}>
                    {volumeDiff >= 0 ? '+' : ''}{Math.round(volumeDiff)}kg vs anterior
                  </div>
                )}
              </div>
              <div
                className="rounded-xl p-3 text-center"
                style={{ background: 'rgba(245,200,66,0.08)', border: '1px solid rgba(245,200,66,0.15)' }}
              >
                <div className="heading-display text-2xl text-brand-gold flex items-center justify-center gap-1">
                  <Zap size={18} fill="currentColor" />
                  {workout.xp_earned}
                </div>
                <div className="text-xs text-text-muted mt-0.5">XP</div>
              </div>
              <div
                className="rounded-xl p-3 text-center"
                style={{ background: 'rgba(0,255,136,0.07)', border: '1px solid rgba(0,255,136,0.15)' }}
              >
                <div className="heading-display text-2xl text-brand-green">
                  {exerciseGroups.length}
                </div>
                <div className="text-xs text-text-muted mt-0.5">exercícios</div>
              </div>
            </div>

            {/* Extra stats */}
            <div className="flex flex-wrap gap-4 text-sm text-text-secondary mt-4">
              {durationDisplay && (
                <span className="flex items-center gap-1.5">
                  <Clock size={14} className="text-text-muted" />
                  {durationDisplay}
                  {durationMinutes > 0 && workout.total_volume_kg > 0 && (
                    <span className="text-text-muted text-xs ml-1">
                      ({Math.round(workout.total_volume_kg / durationMinutes)} kg/min)
                    </span>
                  )}
                </span>
              )}
              {workout.total_reps > 0 && (
                <span className="flex items-center gap-1.5">
                  <BarChart2 size={14} className="text-text-muted" />
                  {workout.total_reps} reps totais
                </span>
              )}
              {prCount > 0 && (
                <span className="flex items-center gap-1.5 text-brand-gold">
                  <Trophy size={14} />
                  {prCount} {prCount === 1 ? 'record pessoal' : 'records pessoais'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Exercise groups */}
        {exerciseGroups.length === 0 ? (
          <div
            className="rounded-2xl p-10 text-center"
            style={{ background: 'rgba(13,24,41,0.7)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <Dumbbell size={36} className="mx-auto mb-3 opacity-30" />
            <p className="text-text-muted">Nenhuma série registrada</p>
          </div>
        ) : (
          <div className="space-y-4">
            {exerciseGroups.map((group) => (
              <div
                key={group.name}
                className="rounded-2xl p-5 space-y-4 relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,77,0,0.05) 0%, rgba(13,24,41,0.98) 100%)',
                  border: '1px solid rgba(255,77,0,0.15)',
                }}
              >
                <div
                  className="absolute -top-3 -right-3 w-12 h-12 rounded-full pointer-events-none blur-xl"
                  style={{ background: 'rgba(255,77,0,0.12)' }}
                />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: 'rgba(255,77,0,0.15)', border: '1px solid rgba(255,77,0,0.3)' }}
                    >
                      <Dumbbell size={16} style={{ color: '#FF4D00' }} />
                    </div>
                    <h3 className="font-bold text-base flex-1">{group.name}</h3>
                    <div className="flex items-center gap-2 text-xs flex-shrink-0">
                      {group.maxWeight > 0 && (
                        <span
                          className="font-semibold px-2 py-1 rounded-lg"
                          style={{ background: 'rgba(124,58,237,0.12)', color: '#7C3AED' }}
                        >
                          max {group.maxWeight}kg
                        </span>
                      )}
                      {group.totalVolume > 0 && (
                        <span className="text-text-muted">
                          {Math.round(group.totalVolume)}kg vol
                        </span>
                      )}
                      <span
                        className="px-2 py-1 rounded-lg text-text-muted"
                        style={{ background: 'rgba(255,255,255,0.06)' }}
                      >
                        {group.sets.length} sets
                      </span>
                    </div>
                  </div>

                  {/* Sets table header */}
                  <div
                    className="grid grid-cols-4 text-xs text-text-muted px-3 pb-2 mb-1"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <span>Set</span>
                    <span className="text-center">Peso</span>
                    <span className="text-center">Reps</span>
                    <span className="text-right">Vol</span>
                  </div>

                  <div className="space-y-1.5">
                    {group.sets.map((set) => {
                      const setVolume =
                        set.weight_kg && set.reps ? Math.round(set.weight_kg * set.reps) : null
                      return (
                        <div
                          key={set.id}
                          className="grid grid-cols-4 items-center rounded-xl px-3 py-2.5 text-sm"
                          style={
                            set.is_personal_record
                              ? { background: 'rgba(245,200,66,0.08)', border: '1px solid rgba(245,200,66,0.2)' }
                              : { background: 'rgba(255,255,255,0.03)' }
                          }
                        >
                          <span className="text-text-muted flex items-center gap-1.5">
                            {set.set_number}
                            {set.is_personal_record && (
                              <Trophy size={11} className="text-brand-gold" />
                            )}
                          </span>
                          <span className="text-center font-semibold">
                            {set.weight_kg !== null ? `${set.weight_kg}kg` : '—'}
                          </span>
                          <span className="text-center text-text-secondary">
                            {set.reps !== null ? `× ${set.reps}` : '—'}
                          </span>
                          <span className="text-right text-text-muted text-xs">
                            {setVolume ? `${setVolume}kg` : '—'}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Actions: Repetir treino + Apagar */}
        <WorkoutDetailActions
          workoutId={workout.id}
          workoutTitle={workout.title}
          exercises={doAgainExercises}
        />
      </div>
    </AppShell>
  )
}
