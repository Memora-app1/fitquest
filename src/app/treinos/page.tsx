import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components/layout/app-shell'
import Link from 'next/link'
import { formatRelativeDate } from '@/lib/utils'
import { Plus, Dumbbell, Zap, TrendingUp, Trophy } from 'lucide-react'

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

  // Calcular PRs por exercício: peso máximo por exercício
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
  const topPrs = [...prMap.values()]
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 6)

  const totalWorkouts = allWorkouts.length
  const totalXp = allWorkouts.reduce((sum, w) => sum + (w.xp_earned ?? 0), 0)
  const totalVolume = allWorkouts.reduce((sum, w) => sum + (w.total_volume_kg ?? 0), 0)
  const prCount = allWorkouts.filter((w) => w.is_personal_record_session).length
  const workoutsThisMonth = recentWorkouts.length

  // Agrupar por semana para frequência
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().split('T')[0]!
  })

  const workoutDatesSet = new Set(workouts.map((w) => w.started_at.split('T')[0]))
  const weekActivity = weekDays.map((day) => workoutDatesSet.has(day))

  const dayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  const today = new Date()

  return (
    <AppShell>
      <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="heading-display text-4xl">Treinos</h1>
            <p className="text-text-secondary">
              {totalWorkouts > 0
                ? `${totalWorkouts} sessões · ${workoutsThisMonth} este mês`
                : 'Volume é progresso. Progresso é XP.'}
            </p>
          </div>
          <Link href="/treinos/novo" className="btn-primary flex items-center gap-2">
            <Plus size={18} /> Novo treino
          </Link>
        </div>

        {/* Stats cards — só exibe se tiver histórico */}
        {totalWorkouts > 0 && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="card p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Dumbbell size={16} className="text-brand-orange" />
                  <span className="text-xs text-text-muted uppercase">Treinos</span>
                </div>
                <div className="heading-display text-3xl">{totalWorkouts}</div>
                <div className="text-xs text-text-secondary mt-0.5">{workoutsThisMonth} este mês</div>
              </div>

              <div className="card p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Zap size={16} className="text-brand-gold" />
                  <span className="text-xs text-text-muted uppercase">XP ganho</span>
                </div>
                <div className="heading-display text-3xl">{totalXp.toLocaleString('pt-BR')}</div>
                <div className="text-xs text-text-secondary mt-0.5">em treinos</div>
              </div>

              <div className="card p-4">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp size={16} className="text-brand-green" />
                  <span className="text-xs text-text-muted uppercase">Volume</span>
                </div>
                <div className="heading-display text-3xl">
                  {totalVolume > 1000
                    ? `${(totalVolume / 1000).toFixed(1)}t`
                    : `${Math.round(totalVolume)}kg`}
                </div>
                <div className="text-xs text-text-secondary mt-0.5">total levantado</div>
              </div>

              <div className="card p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Trophy size={16} className="text-brand-gold" />
                  <span className="text-xs text-text-muted uppercase">Recordes</span>
                </div>
                <div className="heading-display text-3xl">{prCount}</div>
                <div className="text-xs text-text-secondary mt-0.5">sessões com PR</div>
              </div>
            </div>

            {/* Semana atual */}
            <div className="card p-4">
              <div className="text-sm font-medium mb-3 text-text-secondary">Atividade — últimos 7 dias</div>
              <div className="flex gap-2">
                {weekDays.map((day, i) => {
                  const d = new Date(day + 'T12:00:00')
                  const isToday = day === today.toISOString().split('T')[0]
                  const hasWorkout = weekActivity[i]
                  return (
                    <div key={day} className="flex-1 flex flex-col items-center gap-1.5">
                      <div
                        className={`w-full h-10 rounded-lg flex items-center justify-center transition-all ${
                          hasWorkout
                            ? 'bg-brand-orange/30 border border-brand-orange/50'
                            : 'bg-bg-elevated border border-border'
                        } ${isToday ? 'ring-2 ring-brand-orange' : ''}`}
                      >
                        {hasWorkout ? <Dumbbell size={16} className="text-brand-orange" /> : null}
                      </div>
                      <span className={`text-[11px] font-medium ${isToday ? 'text-brand-orange' : 'text-text-muted'}`}>
                        {dayLabels[d.getDay()]}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}

        {/* Best lifts / PRs */}
        {topPrs.length > 0 && (
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Trophy size={16} className="text-brand-gold" />
              <span className="font-semibold text-sm">Melhores Recordes Pessoais</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {topPrs.map((pr) => (
                <div
                  key={pr.name}
                  className="bg-bg-elevated border border-border rounded-xl p-3 flex items-center justify-between gap-2"
                >
                  <span className="text-sm truncate text-text-secondary">{pr.name}</span>
                  <span className="font-bold text-brand-gold shrink-0 text-sm">{pr.weight}kg</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Workout list */}
        {workouts.length === 0 ? (
          <div className="card p-12 text-center">
            <Dumbbell size={48} className="mx-auto mb-4 text-text-muted" />
            <h3 className="text-xl font-bold mb-1">Nenhum treino ainda</h3>
            <p className="text-text-secondary mb-4">Comece registrando sua primeira sessão</p>
            <Link href="/treinos/novo" className="btn-primary inline-block">
              Começar primeiro treino
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            <h2 className="text-lg font-bold">Histórico recente</h2>
            {workouts.map((w) => (
              <Link
                key={w.id}
                href={`/treinos/${w.id}`}
                className="card p-4 block hover:border-brand-orange/40 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                      w.is_personal_record_session
                        ? 'bg-brand-gold/20 text-brand-gold'
                        : 'bg-bg-elevated text-text-muted group-hover:text-brand-orange'
                    }`}
                  >
                    {w.is_personal_record_session ? <Trophy size={20} /> : <Dumbbell size={20} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold truncate">
                      {w.title}
                      {w.is_personal_record_session && (
                        <span className="ml-2 text-xs bg-brand-gold/20 text-brand-gold px-1.5 py-0.5 rounded-full font-normal">
                          🏆 PR
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-text-muted flex gap-3 mt-0.5">
                      <span>{formatRelativeDate(w.started_at)}</span>
                      <span>·</span>
                      <span>{w.total_sets} sets</span>
                      <span>·</span>
                      <span>{w.total_volume_kg}kg</span>
                    </div>
                  </div>
                  <div className="text-brand-gold font-bold text-sm shrink-0">
                    +{w.xp_earned} XP
                  </div>
                </div>
              </Link>
            ))}

            {workouts.length === 30 && (
              <p className="text-center text-sm text-text-muted py-2">
                Mostrando os 30 treinos mais recentes
              </p>
            )}
          </div>
        )}
      </div>
    </AppShell>
  )
}
