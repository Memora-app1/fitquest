import { createClient } from '@/lib/supabase/server'
import { Trophy, Zap, Flame, CheckSquare, Dumbbell, Target, TrendingUp, Clock } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

const WATER_GOAL_ML = 2000

interface Challenge {
  id: string
  icon: string
  label: string
  description: string
  target: number
  current: number
  xpReward: number
  type: 'habit' | 'workout' | 'task' | 'xp' | 'streak' | 'transaction' | 'health'
  color: string
  rgb: string
  completed: boolean
}

// ── Helper: get ISO week number ────────────────────────────────────────────────

function getISOWeek(date: Date): number {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 4 - (d.getDay() || 7))
  const yearStart = new Date(d.getFullYear(), 0, 1)
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

function getWeekStart(date: Date): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // adjust to Monday
  d.setDate(diff)
  return d.toISOString().split('T')[0]!
}

function getWeekEnd(date: Date): string {
  const start = new Date(getWeekStart(date) + 'T00:00:00')
  start.setDate(start.getDate() + 6)
  return start.toISOString().split('T')[0]!
}

// Days remaining in the week
function getDaysLeft(date: Date): number {
  const end = new Date(getWeekEnd(date) + 'T23:59:59')
  const diff = end.getTime() - date.getTime()
  return Math.max(1, Math.ceil(diff / 86400000))
}

// ── Component ─────────────────────────────────────────────────────────────────

interface WeeklyChallengesProps {
  userId: string
}

export async function WeeklyChallenges({ userId }: WeeklyChallengesProps) {
  const supabase = await createClient()
  const now = new Date()

  const weekStart = getWeekStart(now)
  const weekEnd = getWeekEnd(now)
  const weekNum = getISOWeek(now)
  const daysLeft = getDaysLeft(now)

  // Fetch week activity in parallel
  const [
    habitLogsRes,
    habitsRes,
    workoutsRes,
    tasksDoneRes,
    tasksAllRes,
    xpRes,
    transactionsRes,
    profileRes,
    waterLogsRes,
  ] = await Promise.all([
    supabase
      .from('habit_logs')
      .select('habit_id, logged_date')
      .eq('user_id', userId)
      .gte('logged_date', weekStart)
      .lte('logged_date', weekEnd),

    supabase
      .from('habits')
      .select('id')
      .eq('user_id', userId)
      .eq('is_active', true),

    supabase
      .from('workouts')
      .select('id')
      .eq('user_id', userId)
      .gte('created_at', weekStart + 'T00:00:00')
      .lte('created_at', weekEnd + 'T23:59:59'),

    supabase
      .from('tasks')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'done')
      .gte('updated_at', weekStart + 'T00:00:00')
      .lte('updated_at', weekEnd + 'T23:59:59'),

    supabase
      .from('tasks')
      .select('id')
      .eq('user_id', userId)
      .neq('status', 'archived'),

    supabase
      .from('xp_transactions')
      .select('amount')
      .eq('user_id', userId)
      .gte('created_at', weekStart + 'T00:00:00')
      .lte('created_at', weekEnd + 'T23:59:59'),

    supabase
      .from('transactions')
      .select('id')
      .eq('user_id', userId)
      .gte('transaction_date', weekStart)
      .lte('transaction_date', weekEnd),

    supabase
      .from('profiles')
      .select('streak_current, level')
      .eq('id', userId)
      .single(),

    supabase
      .from('water_logs')
      .select('date, amount_ml')
      .eq('user_id', userId)
      .gte('date', weekStart)
      .lte('date', weekEnd),
  ])

  // ── Compute current values ─────────────────────────────────────────────────

  // Water goal days this week
  const waterByDay: Record<string, number> = {}
  for (const row of waterLogsRes.data ?? []) {
    const d = row.date as string
    waterByDay[d] = (waterByDay[d] ?? 0) + (row.amount_ml as number ?? 0)
  }
  const waterGoalDaysThisWeek = Object.values(waterByDay).filter(v => v >= WATER_GOAL_ML).length

  const habitsCount = habitsRes.data?.length ?? 0
  const habitLogsCount = habitLogsRes.data?.length ?? 0
  const workoutsCount = workoutsRes.data?.length ?? 0
  const tasksDoneCount = tasksDoneRes.data?.length ?? 0
  const totalTasksCount = tasksAllRes.data?.length ?? 0
  const weekXp = (xpRes.data ?? []).reduce((s, t) => s + (t.amount ?? 0), 0)
  const transactionsCount = transactionsRes.data?.length ?? 0
  const streakCurrent = profileRes.data?.streak_current ?? 0
  const level = profileRes.data?.level ?? 1

  // ── Generate challenges scaled to user level ────────────────────────────────
  // Uses seeded determinism: challenges rotate each week but are consistent within a week.
  // Seed = week number + year so challenges are unique but predictable.
  const seed = weekNum + now.getFullYear() * 100

  function pickTarget(base: number, variance: number): number {
    // Pseudo-random but deterministic per week
    const v = ((seed * 7919) % variance) + 1
    return base + v
  }

  // Scale targets based on user level (higher level = harder challenges)
  const levelMult = 1 + (level - 1) * 0.2

  // Build challenge pool
  const allChallenges: Challenge[] = []

  // 1. Habit challenge
  if (habitsCount > 0) {
    const target = Math.max(3, Math.round(habitsCount * 4 * levelMult))
    const xpReward = Math.round(150 * levelMult)
    allChallenges.push({
      id: 'habits',
      icon: '🎯',
      label: 'Mestre dos Hábitos',
      description: `Registre ${target} hábitos esta semana`,
      target,
      current: Math.min(habitLogsCount, target),
      xpReward,
      type: 'habit',
      color: '#FF4D00',
      rgb: '255,77,0',
      completed: habitLogsCount >= target,
    })
  }

  // 2. Workout challenge
  {
    const baseTarget = level <= 2 ? 1 : level <= 4 ? 2 : 3
    const target = Math.max(1, Math.round(baseTarget * levelMult))
    const xpReward = Math.round(200 * levelMult)
    allChallenges.push({
      id: 'workouts',
      icon: '💪',
      label: 'Guerreiro Fitness',
      description: `Complete ${target} treino${target > 1 ? 's' : ''} esta semana`,
      target,
      current: Math.min(workoutsCount, target),
      xpReward,
      type: 'workout',
      color: '#00FF88',
      rgb: '0,255,136',
      completed: workoutsCount >= target,
    })
  }

  // 3. Tasks challenge
  if (totalTasksCount > 0) {
    const baseTarget = level <= 2 ? 3 : level <= 4 ? 5 : 7
    const target = Math.round(baseTarget * levelMult)
    const xpReward = Math.round(120 * levelMult)
    allChallenges.push({
      id: 'tasks',
      icon: '✅',
      label: 'Executor Elite',
      description: `Conclua ${target} tarefa${target > 1 ? 's' : ''} esta semana`,
      target,
      current: Math.min(tasksDoneCount, target),
      xpReward,
      type: 'task',
      color: '#7C3AED',
      rgb: '124,58,237',
      completed: tasksDoneCount >= target,
    })
  }

  // 4. XP challenge
  {
    const baseXpTarget = level <= 2 ? 200 : level <= 4 ? 500 : level <= 6 ? 1000 : 2000
    const xpVariance = Math.round(baseXpTarget * 0.2)
    const target = Math.round((baseXpTarget + ((seed * 3571) % xpVariance)) * levelMult)
    const xpReward = Math.round(250 * levelMult)
    allChallenges.push({
      id: 'xp',
      icon: '⚡',
      label: 'Caçador de XP',
      description: `Acumule ${target.toLocaleString('pt-BR')} XP esta semana`,
      target,
      current: Math.min(weekXp, target),
      xpReward,
      type: 'xp',
      color: '#F5C842',
      rgb: '245,200,66',
      completed: weekXp >= target,
    })
  }

  // 5. Streak challenge
  {
    const streakTarget = level <= 2 ? 3 : level <= 4 ? 5 : 7
    const xpReward = Math.round(300 * levelMult)
    allChallenges.push({
      id: 'streak',
      icon: '🔥',
      label: 'Sequência Implacável',
      description: `Mantenha sequência de ${streakTarget} dias`,
      target: streakTarget,
      current: Math.min(streakCurrent, streakTarget),
      xpReward,
      type: 'streak',
      color: '#FF4D00',
      rgb: '255,77,0',
      completed: streakCurrent >= streakTarget,
    })
  }

  // 6. Health challenge — water goal days
  {
    const target = 5
    const xpReward = Math.round(130 * levelMult)
    allChallenges.push({
      id: 'health',
      icon: '💧',
      label: 'Hidratação Plena',
      description: `Atingir a meta de 2L em ${target} dias desta semana`,
      target,
      current: Math.min(waterGoalDaysThisWeek, target),
      xpReward,
      type: 'health',
      color: '#00D9FF',
      rgb: '0,217,255',
      completed: waterGoalDaysThisWeek >= target,
    })
  }

  // 7. Finance challenge (if seed is even — rotates every other week)
  if (seed % 2 === 0 || transactionsCount > 0) {
    const target = level <= 2 ? 3 : level <= 4 ? 5 : 8
    const xpReward = Math.round(100 * levelMult)
    allChallenges.push({
      id: 'finance',
      icon: '💰',
      label: 'Controle Financeiro',
      description: `Registre ${target} transações esta semana`,
      target,
      current: Math.min(transactionsCount, target),
      xpReward,
      type: 'transaction',
      color: '#3B82F6',
      rgb: '59,130,246',
      completed: transactionsCount >= target,
    })
  }

  // Pick top 4 challenges by priority (incomplete first, then higher XP reward)
  const sorted = allChallenges
    .sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1
      return b.xpReward - a.xpReward
    })
    .slice(0, 4)

  const completedCount = sorted.filter((c) => c.completed).length
  const totalXpAvailable = sorted.reduce((s, c) => s + c.xpReward, 0)
  const totalXpEarned = sorted.filter((c) => c.completed).reduce((s, c) => s + c.xpReward, 0)
  const allCompleted = completedCount === sorted.length

  return (
    <div
      className="rounded-2xl relative overflow-hidden"
      style={{
        background: allCompleted
          ? 'linear-gradient(135deg, rgba(245,200,66,0.1) 0%, rgba(13,24,41,0.98) 100%)'
          : 'linear-gradient(135deg, rgba(124,58,237,0.07) 0%, rgba(13,24,41,0.98) 100%)',
        border: allCompleted
          ? '1px solid rgba(245,200,66,0.3)'
          : '1px solid rgba(124,58,237,0.18)',
      }}
    >
      {/* Corner glow */}
      <div
        className="absolute -top-8 -right-8 w-40 h-40 rounded-full pointer-events-none blur-3xl"
        style={{ background: allCompleted ? 'rgba(245,200,66,0.15)' : 'rgba(124,58,237,0.12)' }}
      />

      <div className="relative z-10 p-5 md:p-6 space-y-4">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
              style={{
                background: allCompleted ? 'rgba(245,200,66,0.15)' : 'rgba(124,58,237,0.15)',
                border: allCompleted ? '1px solid rgba(245,200,66,0.3)' : '1px solid rgba(124,58,237,0.3)',
              }}
            >
              <Trophy size={16} style={{ color: allCompleted ? '#F5C842' : '#7C3AED' }} />
            </div>
            <div>
              <h2 className="font-bold text-base leading-tight">
                {allCompleted ? '🏆 Desafios da Semana — Completos!' : 'Desafios da Semana'}
              </h2>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="text-xs text-text-muted">
                  {completedCount}/{sorted.length} concluído{completedCount !== 1 ? 's' : ''}
                </span>
                <span className="text-text-muted">·</span>
                <div className="flex items-center gap-1 text-xs" style={{ color: '#F5C842' }}>
                  <Zap size={10} fill="currentColor" />
                  <span className="font-bold">
                    {totalXpEarned.toLocaleString('pt-BR')}/{totalXpAvailable.toLocaleString('pt-BR')} XP
                  </span>
                </div>
                <span className="text-text-muted">·</span>
                <div className="flex items-center gap-1 text-xs text-text-muted">
                  <Clock size={10} />
                  {daysLeft} dia{daysLeft !== 1 ? 's' : ''} restante{daysLeft !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          </div>

          {/* Week tag */}
          <div
            className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0"
            style={{
              background: 'rgba(255,255,255,0.06)',
              color: '#8899BB',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            Semana {weekNum}
          </div>
        </div>

        {/* ── Overall progress bar ─────────────────────────────────────────── */}
        <div className="space-y-1.5">
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.round((completedCount / sorted.length) * 100)}%`,
                background: allCompleted
                  ? 'linear-gradient(90deg, #F5C842, #FF4D00)'
                  : 'linear-gradient(90deg, #7C3AED, #FF4D00)',
                boxShadow: allCompleted ? '0 0 8px rgba(245,200,66,0.5)' : '0 0 8px rgba(124,58,237,0.4)',
              }}
            />
          </div>
        </div>

        {/* ── Challenge cards ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {sorted.map((challenge) => {
            const pct = Math.min(100, Math.round((challenge.current / challenge.target) * 100))
            const progressColor = challenge.completed
              ? '#00FF88'
              : pct >= 60 ? challenge.color : 'rgba(255,255,255,0.3)'

            return (
              <div
                key={challenge.id}
                className="rounded-xl p-4 relative overflow-hidden transition-all"
                style={{
                  background: challenge.completed
                    ? `linear-gradient(135deg, rgba(0,255,136,0.08) 0%, rgba(13,24,41,0.98) 100%)`
                    : `linear-gradient(135deg, rgba(${challenge.rgb},0.06) 0%, rgba(13,24,41,0.98) 100%)`,
                  border: challenge.completed
                    ? '1px solid rgba(0,255,136,0.25)'
                    : `1px solid rgba(${challenge.rgb},0.18)`,
                }}
              >
                {/* Glow */}
                <div
                  className="absolute -top-3 -right-3 w-12 h-12 rounded-full pointer-events-none blur-lg"
                  style={{
                    background: challenge.completed
                      ? 'rgba(0,255,136,0.2)'
                      : `rgba(${challenge.rgb},0.2)`,
                  }}
                />

                <div className="relative z-10 space-y-2.5">
                  {/* Icon + label + XP */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{challenge.icon}</span>
                      <div>
                        <div className="text-xs font-bold leading-tight">
                          {challenge.label}
                        </div>
                        <div className="text-[10px] text-text-muted mt-0.5 leading-snug">
                          {challenge.description}
                        </div>
                      </div>
                    </div>
                    <div
                      className="flex items-center gap-0.5 text-[10px] font-black px-2 py-0.5 rounded-lg shrink-0"
                      style={{
                        background: challenge.completed
                          ? 'rgba(0,255,136,0.12)'
                          : `rgba(${challenge.rgb},0.1)`,
                        color: challenge.completed ? '#00FF88' : challenge.color,
                        border: challenge.completed
                          ? '1px solid rgba(0,255,136,0.2)'
                          : `1px solid rgba(${challenge.rgb},0.2)`,
                      }}
                    >
                      <Zap size={9} fill="currentColor" />
                      +{challenge.xpReward.toLocaleString('pt-BR')}
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-text-muted">
                        {challenge.current.toLocaleString('pt-BR')} / {challenge.target.toLocaleString('pt-BR')}
                      </span>
                      <span
                        className="text-[10px] font-bold"
                        style={{ color: challenge.completed ? '#00FF88' : challenge.color }}
                      >
                        {challenge.completed ? '✓ Completo' : `${pct}%`}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${pct}%`,
                          background: challenge.completed
                            ? 'linear-gradient(90deg, #00FF88, rgba(0,255,136,0.6))'
                            : `linear-gradient(90deg, ${challenge.color}, rgba(${challenge.rgb},0.5))`,
                          boxShadow: pct > 0
                            ? `0 0 6px rgba(${challenge.rgb},0.4)`
                            : 'none',
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* ── Completion banner ────────────────────────────────────────────── */}
        {allCompleted && (
          <div
            className="rounded-xl p-4 flex items-center gap-3"
            style={{
              background: 'linear-gradient(135deg, rgba(245,200,66,0.12) 0%, rgba(0,255,136,0.06) 100%)',
              border: '1px solid rgba(245,200,66,0.25)',
            }}
          >
            <span className="text-2xl">🎉</span>
            <div>
              <p className="font-bold text-sm" style={{ color: '#F5C842' }}>
                Todos os desafios concluídos!
              </p>
              <p className="text-xs text-text-muted mt-0.5">
                +{totalXpEarned.toLocaleString('pt-BR')} XP ganhos com os desafios. Semana perfeita! 🏆
              </p>
            </div>
          </div>
        )}

        {/* ── Motivational footer ──────────────────────────────────────────── */}
        {!allCompleted && daysLeft <= 2 && (
          <div
            className="rounded-xl p-3 flex items-center gap-2.5"
            style={{ background: 'rgba(255,77,0,0.08)', border: '1px solid rgba(255,77,0,0.2)' }}
          >
            <Flame size={14} className="text-brand-orange shrink-0" />
            <p className="text-xs text-text-secondary">
              <span className="font-bold text-brand-orange">Últimas {daysLeft === 1 ? 'horas' : '2 dias'}</span>{' '}
              para concluir os desafios. Não deixe o XP escapar!
            </p>
          </div>
        )}

      </div>
    </div>
  )
}
