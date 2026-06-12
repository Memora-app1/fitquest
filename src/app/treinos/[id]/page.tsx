import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import Link from 'next/link';
import { formatDateBR } from '@/lib/utils';
import { ArrowLeft, Dumbbell, Zap, Trophy, Clock, BarChart2 } from 'lucide-react';
import { WorkoutDetailActions } from '@/components/treinos/workout-detail-actions';
import { WorkoutVolumeAnalysis } from '@/components/treinos/workout-volume-analysis';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from('workouts').select('title').eq('id', id).single();
  return { title: data?.title ?? 'Treino' };
}

type SetWithExercise = {
  id: string;
  set_number: number;
  reps: number | null;
  weight_kg: number | null;
  is_personal_record: boolean;
  exercises: { name: string }[] | null;
};

type ExerciseGroup = {
  name: string;
  sets: SetWithExercise[];
  totalVolume: number;
  maxWeight: number;
};

export default async function WorkoutDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

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
  ]);

  if (!workoutRes.data) notFound();

  const workout = workoutRes.data;
  const rawSets = setsRes.data ?? [];
  const sets: SetWithExercise[] = rawSets.map((s) => ({
    ...s,
    exercises: Array.isArray(s.exercises) ? s.exercises : s.exercises ? [s.exercises] : null,
  }));

  // Duration
  let durationDisplay = '';
  let durationMinutes = 0;
  if (workout.started_at && workout.finished_at) {
    const ms = new Date(workout.finished_at).getTime() - new Date(workout.started_at).getTime();
    durationMinutes = Math.floor(ms / 60000);
    durationDisplay = durationMinutes > 1 ? `${durationMinutes} min` : 'Registro rápido';
  }

  // Group sets by exercise name with volume stats
  const groupMap = new Map<string, ExerciseGroup>();
  for (const set of sets) {
    const name = set.exercises?.[0]?.name ?? 'Exercício';
    if (!groupMap.has(name)) {
      groupMap.set(name, { name, sets: [], totalVolume: 0, maxWeight: 0 });
    }
    const grp = groupMap.get(name)!;
    grp.sets.push(set);
    if (set.weight_kg && set.reps) {
      grp.totalVolume += set.weight_kg * set.reps;
    }
    if (set.weight_kg && set.weight_kg > grp.maxWeight) {
      grp.maxWeight = set.weight_kg;
    }
  }
  const exerciseGroups = [...groupMap.values()];

  const prCount = sets.filter((s) => s.is_personal_record).length;
  const prevVolume = prevWorkoutRes.data?.[0]?.total_volume_kg ?? null;
  const volumeDiff = prevVolume !== null ? workout.total_volume_kg - prevVolume : null;

  // Build "do again" exercises list
  const doAgainExercises = exerciseGroups.map((g) => ({
    exercise_name: g.name,
    weight_kg: String(g.maxWeight || ''),
    reps: String(g.sets[0]?.reps || ''),
    sets: String(g.sets.length),
  }));

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-8">
        <Link
          href="/treinos"
          className="flex w-fit items-center gap-2 text-text-secondary transition-colors hover:text-white"
        >
          <ArrowLeft size={18} />
          Voltar para treinos
        </Link>

        {/* Header card */}
        <div
          className="relative space-y-5 overflow-hidden rounded-2xl p-6"
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
            className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full"
            style={{
              background: workout.is_personal_record_session
                ? 'radial-gradient(circle, rgba(245,200,66,0.12) 0%, transparent 70%)'
                : 'radial-gradient(circle, rgba(255,77,0,0.1) 0%, transparent 70%)',
            }}
          />
          <div className="relative z-10">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="heading-display text-3xl leading-tight md:text-4xl">
                  {workout.title}
                </h1>
                <p className="mt-1 text-text-secondary">{formatDateBR(workout.started_at)}</p>
              </div>
              {workout.is_personal_record_session && (
                <div
                  className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-bold"
                  style={{
                    background: 'rgba(245,200,66,0.15)',
                    border: '1px solid rgba(245,200,66,0.4)',
                    color: '#F5C842',
                  }}
                >
                  <Trophy size={15} />
                  PR Session!
                </div>
              )}
            </div>

            {/* Stats row */}
            <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
              <div
                className="rounded-xl p-3 text-center"
                style={{
                  background: 'rgba(255,77,0,0.08)',
                  border: '1px solid rgba(255,77,0,0.15)',
                }}
              >
                <div className="heading-display text-2xl text-brand-orange">
                  {workout.total_sets}
                </div>
                <div className="mt-0.5 text-xs text-text-muted">sets</div>
              </div>
              <div
                className="rounded-xl p-3 text-center"
                style={{
                  background: 'rgba(124,58,237,0.08)',
                  border: '1px solid rgba(124,58,237,0.15)',
                }}
              >
                <div className="heading-display text-2xl text-brand-purple">
                  {workout.total_volume_kg > 1000
                    ? `${(workout.total_volume_kg / 1000).toFixed(1)}t`
                    : `${workout.total_volume_kg}kg`}
                </div>
                <div className="mt-0.5 text-xs text-text-muted">volume</div>
                {volumeDiff !== null && (
                  <div
                    className={`mt-0.5 text-[10px] ${volumeDiff >= 0 ? 'text-brand-green' : 'text-brand-red'}`}
                  >
                    {volumeDiff >= 0 ? '+' : ''}
                    {Math.round(volumeDiff)}kg vs anterior
                  </div>
                )}
              </div>
              <div
                className="rounded-xl p-3 text-center"
                style={{
                  background: 'rgba(245,200,66,0.08)',
                  border: '1px solid rgba(245,200,66,0.15)',
                }}
              >
                <div className="heading-display flex items-center justify-center gap-1 text-2xl text-brand-gold">
                  <Zap size={18} fill="currentColor" />
                  {workout.xp_earned}
                </div>
                <div className="mt-0.5 text-xs text-text-muted">XP</div>
              </div>
              <div
                className="rounded-xl p-3 text-center"
                style={{
                  background: 'rgba(0,255,136,0.07)',
                  border: '1px solid rgba(0,255,136,0.15)',
                }}
              >
                <div className="heading-display text-2xl text-brand-green">
                  {exerciseGroups.length}
                </div>
                <div className="mt-0.5 text-xs text-text-muted">exercícios</div>
              </div>
            </div>

            {/* Extra stats */}
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-text-secondary">
              {durationDisplay && (
                <span className="flex items-center gap-1.5">
                  <Clock size={14} className="text-text-muted" />
                  {durationDisplay}
                  {durationMinutes > 0 && workout.total_volume_kg > 0 && (
                    <span className="ml-1 text-xs text-text-muted">
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
                className="relative space-y-4 overflow-hidden rounded-2xl p-5"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(255,77,0,0.05) 0%, rgba(13,24,41,0.98) 100%)',
                  border: '1px solid rgba(255,77,0,0.15)',
                }}
              >
                <div
                  className="pointer-events-none absolute -right-3 -top-3 h-12 w-12 rounded-full blur-xl"
                  style={{ background: 'rgba(255,77,0,0.12)' }}
                />
                <div className="relative z-10">
                  <div className="mb-4 flex items-center gap-2">
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                      style={{
                        background: 'rgba(255,77,0,0.15)',
                        border: '1px solid rgba(255,77,0,0.3)',
                      }}
                    >
                      <Dumbbell size={16} style={{ color: '#FF4D00' }} />
                    </div>
                    <h3 className="flex-1 text-base font-bold">{group.name}</h3>
                    <div className="flex flex-shrink-0 items-center gap-2 text-xs">
                      {group.maxWeight > 0 && (
                        <span
                          className="rounded-lg px-2 py-1 font-semibold"
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
                        className="rounded-lg px-2 py-1 text-text-muted"
                        style={{ background: 'rgba(255,255,255,0.06)' }}
                      >
                        {group.sets.length} sets
                      </span>
                    </div>
                  </div>

                  {/* Sets table header */}
                  <div
                    className="mb-1 grid grid-cols-4 px-3 pb-2 text-xs text-text-muted"
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
                        set.weight_kg && set.reps ? Math.round(set.weight_kg * set.reps) : null;
                      return (
                        <div
                          key={set.id}
                          className="grid grid-cols-4 items-center rounded-xl px-3 py-2.5 text-sm"
                          style={
                            set.is_personal_record
                              ? {
                                  background: 'rgba(245,200,66,0.08)',
                                  border: '1px solid rgba(245,200,66,0.2)',
                                }
                              : { background: 'rgba(255,255,255,0.03)' }
                          }
                        >
                          <span className="flex items-center gap-1.5 text-text-muted">
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
                          <span className="text-right text-xs text-text-muted">
                            {setVolume ? `${setVolume}kg` : '—'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Volume analysis + set pattern breakdown ─────────────────── */}
        <WorkoutVolumeAnalysis
          exerciseGroups={exerciseGroups}
          totalVolumePrev={prevVolume}
          durationMinutes={durationMinutes}
        />

        {/* Actions: Repetir treino + Apagar */}
        <WorkoutDetailActions
          workoutId={workout.id}
          workoutTitle={workout.title}
          exercises={doAgainExercises}
        />
      </div>
    </AppShell>
  );
}
