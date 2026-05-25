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
        <div className="card p-6 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="heading-display text-3xl md:text-4xl leading-tight">{workout.title}</h1>
              <p className="text-text-secondary mt-1">{formatDateBR(workout.started_at)}</p>
            </div>
            {workout.is_personal_record_session && (
              <div className="flex items-center gap-1.5 bg-brand-gold/10 border border-brand-gold/30 rounded-xl px-3 py-2 text-brand-gold font-bold whitespace-nowrap text-sm">
                <Trophy size={15} />
                PR Session!
              </div>
            )}
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-bg rounded-xl p-3 text-center">
              <div className="heading-display text-2xl text-brand-orange">{workout.total_sets}</div>
              <div className="text-xs text-text-muted mt-0.5">sets</div>
            </div>
            <div className="bg-bg rounded-xl p-3 text-center">
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
            <div className="bg-bg rounded-xl p-3 text-center">
              <div className="heading-display text-2xl text-brand-gold flex items-center justify-center gap-1">
                <Zap size={18} />
                {workout.xp_earned}
              </div>
              <div className="text-xs text-text-muted mt-0.5">XP</div>
            </div>
            <div className="bg-bg rounded-xl p-3 text-center">
              <div className="heading-display text-2xl text-brand-green">
                {exerciseGroups.length}
              </div>
              <div className="text-xs text-text-muted mt-0.5">exercícios</div>
            </div>
          </div>

          {/* Extra stats */}
          <div className="flex flex-wrap gap-4 text-sm text-text-secondary">
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

        {/* Exercise groups */}
        {exerciseGroups.length === 0 ? (
          <div className="card p-8 text-center text-text-muted">
            <Dumbbell size={32} className="mx-auto mb-3 opacity-40" />
            Nenhuma série registrada
          </div>
        ) : (
          <div className="space-y-4">
            {exerciseGroups.map((group) => (
              <div key={group.name} className="card p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Dumbbell size={17} className="text-brand-orange" />
                  <h3 className="font-bold text-base">{group.name}</h3>
                  <div className="ml-auto flex items-center gap-3 text-xs text-text-muted">
                    {group.maxWeight > 0 && (
                      <span className="text-brand-purple font-medium">
                        max {group.maxWeight}kg
                      </span>
                    )}
                    {group.totalVolume > 0 && (
                      <span>
                        vol {Math.round(group.totalVolume)}kg
                      </span>
                    )}
                    <span>{group.sets.length} sets</span>
                  </div>
                </div>

                {/* Sets table header */}
                <div className="grid grid-cols-4 text-xs text-text-muted px-3 pb-1 border-b border-white/5">
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
                        className={`grid grid-cols-4 items-center rounded-lg px-3 py-2 text-sm ${
                          set.is_personal_record
                            ? 'bg-brand-gold/10 border border-brand-gold/20'
                            : 'bg-bg'
                        }`}
                      >
                        <span className="text-text-muted flex items-center gap-1">
                          {set.set_number}
                          {set.is_personal_record && (
                            <Trophy size={11} className="text-brand-gold" />
                          )}
                        </span>
                        <span className="text-center font-medium">
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
