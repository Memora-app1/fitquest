import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { AppShell } from '@/components/layout/app-shell'
import Link from 'next/link'
import { formatDateBR } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Detalhe do Treino',
}
import { ArrowLeft, Dumbbell, Zap, Trophy } from 'lucide-react'

export const dynamic = 'force-dynamic'

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

  const [workoutRes, setsRes] = await Promise.all([
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
  if (workout.started_at && workout.finished_at) {
    const ms = new Date(workout.finished_at).getTime() - new Date(workout.started_at).getTime()
    const minutes = Math.floor(ms / 60000)
    durationDisplay = minutes > 1 ? `${minutes} min` : 'Registro rápido'
  }

  // Group sets by exercise name
  const groupMap = new Map<string, ExerciseGroup>()
  for (const set of sets) {
    const name = set.exercises?.[0]?.name ?? 'Exercício'
    if (!groupMap.has(name)) groupMap.set(name, { name, sets: [] })
    groupMap.get(name)!.sets.push(set)
  }
  const exerciseGroups = [...groupMap.values()]

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
                PR!
              </div>
            )}
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-bg rounded-xl p-3 text-center">
              <div className="heading-display text-2xl text-brand-orange">{workout.total_sets}</div>
              <div className="text-xs text-text-muted mt-0.5">sets</div>
            </div>
            <div className="bg-bg rounded-xl p-3 text-center">
              <div className="heading-display text-2xl text-brand-purple">{workout.total_volume_kg}kg</div>
              <div className="text-xs text-text-muted mt-0.5">volume</div>
            </div>
            <div className="bg-bg rounded-xl p-3 text-center">
              <div className="heading-display text-2xl text-brand-gold flex items-center justify-center gap-1">
                <Zap size={18} />
                {workout.xp_earned}
              </div>
              <div className="text-xs text-text-muted mt-0.5">XP</div>
            </div>
          </div>

          {durationDisplay && (
            <p className="text-sm text-text-secondary">⏱ {durationDisplay}</p>
          )}
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
                  <span className="text-text-muted text-sm ml-auto">{group.sets.length} sets</span>
                </div>

                {/* Sets table header */}
                <div className="grid grid-cols-4 text-xs text-text-muted px-3 pb-1 border-b border-white/5">
                  <span>Set</span>
                  <span className="text-center">Peso</span>
                  <span className="text-center">Reps</span>
                  <span className="text-right">Record</span>
                </div>

                <div className="space-y-1.5">
                  {group.sets.map((set) => (
                    <div
                      key={set.id}
                      className="grid grid-cols-4 items-center bg-bg rounded-lg px-3 py-2 text-sm"
                    >
                      <span className="text-text-muted">{set.set_number}</span>
                      <span className="text-center font-medium">
                        {set.weight_kg !== null ? `${set.weight_kg}kg` : '—'}
                      </span>
                      <span className="text-center text-text-secondary">
                        {set.reps !== null ? `× ${set.reps}` : '—'}
                      </span>
                      <span className="text-right">
                        {set.is_personal_record ? (
                          <span className="text-brand-gold text-xs font-bold">🏆 PR</span>
                        ) : (
                          <span className="text-text-muted text-xs">—</span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
