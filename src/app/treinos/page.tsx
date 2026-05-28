import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components/layout/app-shell'
import Link from 'next/link'
import { formatRelativeDate } from '@/lib/utils'
import { Plus, Dumbbell, Zap, TrendingUp, Trophy, Flame } from 'lucide-react'
import { WorkoutTrends } from '@/components/treinos/workout-trends'
import { PrProgress } from '@/components/treinos/pr-progress'
import { WorkoutHeatmap } from '@/components/treinos/workout-heatmap'
import { WorkoutMuscleBalance } from '@/components/treinos/workout-muscle-balance'
import { ExercisePrTracker } from '@/components/treinos/exercise-pr-tracker'
import { WorkoutVolumeProgression } from '@/components/treinos/workout-volume-progression'
import { WorkoutRestDayAdvisor } from '@/components/treinos/workout-rest-day-advisor'
import { WorkoutDayOfWeekAnalysis } from '@/components/treinos/workout-day-of-week-analysis'

export const metadata: Metadata = {
  title: 'Treinos',
  description: 'Registre seus treinos, acompanhe séries, repetições e bata recordes pessoais.',
}

export const dynamic = 'force-dynamic'

export default async function TreinosPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString()

  const [workoutsRes, statsRes, prRes] = await Promise.all([
    supabase
      .from('workouts')
      .select('id, title, started_at, finished_at, total_volume_kg, total_sets, xp_earned, is_personal_record_session')
      .eq('user_id', user.id)
      .order('started_at', { ascending: false })
      .limit(30),
    supabase
      .from('workouts')
      .select('id, xp_earned, total_volume_kg, is_personal_record_session, started_at')
      .eq('user_id', user.id),
    supabase
      .from('workout_sets')
      .select('exercise_id, weight_kg, exercises(name)')
      .eq('user_id', user.id)
      .gt('weight_kg', 0)
      .order('weight_kg', { ascending: false })
      .limit(200),
  ])

  const workouts = workoutsRes.data ?? []
  const allWorkouts = statsRes.data ?? []
  const recentWorkouts = allWorkouts.filter((w) => w.started_at >= thirtyDaysAgo)

  type PrRow = { exercise_id: string; weight_kg: number; exercises: { name: string } | null }
  const rawPrs = (prRes.data ?? []) as unknown as PrRow[]
  const prMap = new Map<string, { name: string; weight: number }>()
  for (const row of rawPrs) {
    if (!row.exercises?.name) continue
    const existing = prMap.get(row.exercise_id)
    if (!existing || row.weight_kg > existing.weight) {
      prMap.set(row.exercise_id, { name: row.exercises.name, weight: Number(row.weight_kg) })
    }
  }
  const topPrs = [...prMap.values()].sort((a, b) => b.weight - a.weight).slice(0, 6)

  const totalWorkouts = allWorkouts.length
  const totalXp = allWorkouts.reduce((sum, w) => sum + (w.xp_earned ?? 0), 0)
  const totalVolume = allWorkouts.reduce((sum, w) => sum + (w.total_volume_kg ?? 0), 0)
  const prCount = allWorkouts.filter((w) => w.is_personal_record_session).length
  const workoutsThisMonth = recentWorkouts.length

  // Weekly activity (last 7 days)
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().split('T')[0]!
  })
  const workoutDatesSet = new Set(workouts.map((w) => w.started_at.split('T')[0]))
  const weekActivity = weekDays.map((day) => workoutDatesSet.has(day))
  const weekWorkoutCount = weekActivity.filter(Boolean).length

  const dayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]!

  return (
    <AppShell>
      <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">

        {/* ── Hero Header ─────────────────────────────────────────────── */}
        <div
          className="rounded-2xl p-6 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(255,77,0,0.08) 0%, rgba(13,24,41,0.98) 60%, rgba(245,200,66,0.05) 100%)',
            border: '1px solid rgba(255,77,0,0.2)',
          }}
        >
          <div
            className="absolute -top-8 -right-8 w-40 h-40 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(255,77,0,0.12) 0%, transparent 70%)' }}
          />
          <div
            className="absolute -bottom-6 -left-6 w-28 h-28 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(245,200,66,0.08) 0%, transparent 70%)' }}
          />
          <div className="relative z-10 flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="heading-display text-4xl md:text-5xl">Treinos</h1>
              <p className="text-text-secondary mt-1">
                {totalWorkouts > 0
                  ? `${totalWorkouts} sessões · ${workoutsThisMonth} este mês`
                  : 'Volume é progresso. Progresso é XP.'}
              </p>
            </div>
            <Link href="/treinos/novo" className="btn-primary flex items-center gap-2">
              <Plus size={18} /> Novo treino
            </Link>
          </div>
        </div>

        {/* ── Stats ───────────────────────────────────────────────────── */}
        {totalWorkouts > 0 && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {/* Total workouts */}
              <div
                className="rounded-2xl p-4 relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,77,0,0.08) 0%, rgba(13,24,41,0.98) 100%)',
                  border: '1px solid rgba(255,77,0,0.2)',
                }}
              >
                <div
                  className="absolute -top-4 -right-4 w-16 h-16 rounded-full pointer-events-none blur-xl"
                  style={{ background: 'rgba(255,77,0,0.2)' }}
                />
                <div className="relative z-10">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Dumbbell size={13} className="text-brand-orange" />
                    <span className="text-xs text-text-muted uppercase tracking-wider">Treinos</span>
                  </div>
                  <div className="heading-display text-3xl text-brand-orange">{totalWorkouts}</div>
                  <div className="text-xs text-text-muted mt-1">{workoutsThisMonth} este mês</div>
                </div>
              </div>

              {/* XP */}
              <div
                className="rounded-2xl p-4 relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, rgba(245,200,66,0.08) 0%, rgba(13,24,41,0.98) 100%)',
                  border: '1px solid rgba(245,200,66,0.2)',
                }}
              >
                <div
                  className="absolute -top-4 -right-4 w-16 h-16 rounded-full pointer-events-none blur-xl"
                  style={{ background: 'rgba(245,200,66,0.2)' }}
                />
                <div className="relative z-10">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Zap size={13} className="text-brand-gold" fill="currentColor" />
                    <span className="text-xs text-text-muted uppercase tracking-wider">XP ganho</span>
                  </div>
                  <div className="heading-display text-3xl text-brand-gold">
                    {totalXp.toLocaleString('pt-BR')}
                  </div>
                  <div className="text-xs text-text-muted mt-1">em treinos</div>
                </div>
              </div>

              {/* Volume */}
              <div
                className="rounded-2xl p-4 relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, rgba(0,255,136,0.07) 0%, rgba(13,24,41,0.98) 100%)',
                  border: '1px solid rgba(0,255,136,0.2)',
                }}
              >
                <div
                  className="absolute -top-4 -right-4 w-16 h-16 rounded-full pointer-events-none blur-xl"
                  style={{ background: 'rgba(0,255,136,0.2)' }}
                />
                <div className="relative z-10">
                  <div className="flex items-center gap-1.5 mb-2">
                    <TrendingUp size={13} className="text-brand-green" />
                    <span className="text-xs text-text-muted uppercase tracking-wider">Volume</span>
                  </div>
                  <div className="heading-display text-3xl text-brand-green">
                    {totalVolume > 1000
                      ? `${(totalVolume / 1000).toFixed(1)}t`
                      : `${Math.round(totalVolume)}kg`}
                  </div>
                  <div className="text-xs text-text-muted mt-1">total levantado</div>
                </div>
              </div>

              {/* PRs */}
              <div
                className="rounded-2xl p-4 relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, rgba(245,200,66,0.07) 0%, rgba(13,24,41,0.98) 100%)',
                  border: '1px solid rgba(245,200,66,0.18)',
                }}
              >
                <div
                  className="absolute -top-4 -right-4 w-16 h-16 rounded-full pointer-events-none blur-xl"
                  style={{ background: 'rgba(245,200,66,0.15)' }}
                />
                <div className="relative z-10">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Trophy size={13} className="text-brand-gold" />
                    <span className="text-xs text-text-muted uppercase tracking-wider">Recordes</span>
                  </div>
                  <div className="heading-display text-3xl text-brand-gold">{prCount}</div>
                  <div className="text-xs text-text-muted mt-1">sessões com PR</div>
                </div>
              </div>
            </div>

            {/* Weekly activity */}
            <div
              className="rounded-2xl p-5"
              style={{ background: 'rgba(13,24,41,0.7)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-semibold text-text-secondary flex items-center gap-2">
                  <Flame size={14} className={weekWorkoutCount >= 4 ? 'text-brand-orange' : 'text-text-muted'} />
                  Atividade — últimos 7 dias
                </div>
                <span
                  className="text-xs font-bold px-3 py-1 rounded-full"
                  style={
                    weekWorkoutCount >= 4
                      ? { background: 'rgba(255,77,0,0.15)', color: '#FF4D00' }
                      : { background: 'rgba(255,255,255,0.06)', color: '#8899BB' }
                  }
                >
                  {weekWorkoutCount}/7 dias
                </span>
              </div>
              <div className="flex gap-2">
                {weekDays.map((day, i) => {
                  const d = new Date(day + 'T12:00:00')
                  const isToday = day === todayStr
                  const hasWorkout = weekActivity[i]
                  return (
                    <div key={day} className="flex-1 flex flex-col items-center gap-1.5">
                      <div
                        className="w-full h-12 rounded-xl flex items-center justify-center transition-all"
                        style={{
                          background: hasWorkout
                            ? 'linear-gradient(135deg, rgba(255,77,0,0.3) 0%, rgba(255,77,0,0.15) 100%)'
                            : 'rgba(21,34,56,0.6)',
                          border: isToday
                            ? '2px solid rgba(255,77,0,0.8)'
                            : hasWorkout
                            ? '1px solid rgba(255,77,0,0.4)'
                            : '1px solid rgba(255,255,255,0.04)',
                          boxShadow: hasWorkout ? '0 0 12px rgba(255,77,0,0.2)' : 'none',
                        }}
                      >
                        {hasWorkout ? (
                          <Dumbbell size={16} className="text-brand-orange" />
                        ) : (
                          <div
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ background: isToday ? '#FF4D00' : 'rgba(255,255,255,0.15)' }}
                          />
                        )}
                      </div>
                      <span
                        className="text-[11px] font-medium"
                        style={{ color: isToday ? '#FF4D00' : hasWorkout ? '#8899BB' : 'rgba(136,153,187,0.5)' }}
                      >
                        {dayLabels[d.getDay()]}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}

        {/* ── 8-week volume trend chart ─────────────────────────────────── */}
        <WorkoutTrends userId={user.id} />

        {/* ── 90-day PR progression sparklines ───────────────────────────── */}
        <PrProgress userId={user.id} />

        {/* ── 90-day workout frequency heatmap ────────────────────────────── */}
        <WorkoutHeatmap userId={user.id} />

        {/* ── Smart recovery advisor: which muscles are ready to train ── */}
        <WorkoutRestDayAdvisor userId={user.id} />

        {/* ── 8-week muscle group balance + volume distribution ───────── */}
        <WorkoutMuscleBalance userId={user.id} />

        {/* ── 12-week volume progression per muscle group ─────────────── */}
        <WorkoutVolumeProgression userId={user.id} />

        {/* ── 12-week exercise PR tracker with mini sparklines ────────── */}
        <ExercisePrTracker userId={user.id} />

        {/* ── Workout frequency by day of week (90 days) ──────────────── */}
        <WorkoutDayOfWeekAnalysis userId={user.id} />

        {/* ── Best PRs ────────────────────────────────────────────────── */}
        {topPrs.length > 0 && (
          <div
            className="rounded-2xl p-5"
            style={{
              background: 'linear-gradient(135deg, rgba(245,200,66,0.06) 0%, rgba(13,24,41,0.98) 100%)',
              border: '1px solid rgba(245,200,66,0.2)',
            }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Trophy size={18} className="text-brand-gold" />
              <span className="font-bold">Melhores Recordes Pessoais</span>
              <span className="ml-auto text-xs text-text-muted">{topPrs.length} exercícios</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {topPrs.map((pr, i) => (
                <div
                  key={pr.name}
                  className="rounded-xl p-3 flex items-center justify-between gap-2"
                  style={{
                    background: 'rgba(21,34,56,0.6)',
                    border: i === 0 ? '1px solid rgba(245,200,66,0.4)' : '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  <span className="text-sm truncate text-text-secondary">{pr.name}</span>
                  <span
                    className="font-bold shrink-0 text-sm"
                    style={{ color: i === 0 ? '#F5C842' : '#8899BB' }}
                  >
                    {pr.weight}kg
                    {i === 0 && <span className="ml-1">🏆</span>}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Workout list ─────────────────────────────────────────────── */}
        {workouts.length === 0 ? (
          <div
            className="rounded-2xl p-12 text-center"
            style={{ background: 'rgba(13,24,41,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <Dumbbell size={48} className="mx-auto mb-4 text-text-muted" />
            <h3 className="text-xl font-bold mb-1">Nenhum treino ainda</h3>
            <p className="text-text-secondary mb-4">Comece registrando sua primeira sessão</p>
            <Link href="/treinos/novo" className="btn-primary inline-flex items-center gap-2">
              <Plus size={18} /> Começar primeiro treino
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Histórico recente</h2>
              {workouts.length === 30 && (
                <span className="text-xs text-text-muted">Mostrando os 30 mais recentes</span>
              )}
            </div>
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
              {workouts.map((w, i) => {
                const isLast = i === workouts.length - 1
                return (
                  <Link
                    key={w.id}
                    href={`/treinos/${w.id}`}
                    className="flex items-center gap-3 px-4 py-4 hover:bg-white/[0.03] transition-colors group"
                    style={{
                      background: i === 0 ? 'rgba(13,24,41,0.8)' : undefined,
                      borderBottom: !isLast ? '1px solid rgba(255,255,255,0.04)' : 'none',
                    }}
                  >
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all"
                      style={
                        w.is_personal_record_session
                          ? { background: 'rgba(245,200,66,0.15)', color: '#F5C842' }
                          : {
                              background: 'rgba(21,34,56,0.8)',
                              color: '#8899BB',
                            }
                      }
                    >
                      {w.is_personal_record_session ? <Trophy size={20} /> : <Dumbbell size={20} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold truncate flex items-center gap-2">
                        {w.title}
                        {w.is_personal_record_session && (
                          <span className="text-[10px] font-semibold bg-brand-gold/15 text-brand-gold px-1.5 py-0.5 rounded-full shrink-0">
                            🏆 PR
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-text-muted flex gap-2 mt-0.5">
                        <span>{formatRelativeDate(w.started_at)}</span>
                        <span>·</span>
                        <span>{w.total_sets} sets</span>
                        <span>·</span>
                        <span>{w.total_volume_kg}kg</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-brand-gold font-bold text-sm shrink-0">
                      <Zap size={12} fill="currentColor" />
                      +{w.xp_earned}
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
