import { createClient } from '@/lib/supabase/server'
import { TrendingUp, TrendingDown, Minus, Flame, Zap, Trophy, Dumbbell, CheckSquare, CreditCard, Star } from 'lucide-react'

// ── Helpers ───────────────────────────────────────────────────────────────────

function getMonthBounds(year: number, month: number) {
  const start = new Date(year, month - 1, 1).toISOString()
  const end = new Date(year, month, 0, 23, 59, 59).toISOString()
  return { start, end }
}

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null
  return Math.round(((current - previous) / previous) * 100)
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface MonthlyRecapProps {
  userId: string
}

// ── Server Component ──────────────────────────────────────────────────────────

export async function MonthlyRecap({ userId }: MonthlyRecapProps) {
  const supabase = await createClient()

  const now = new Date()
  const thisYear = now.getFullYear()
  const thisMonth = now.getMonth() + 1
  const dayOfMonth = now.getDate()

  // Previous month
  const prevYear = thisMonth === 1 ? thisYear - 1 : thisYear
  const prevMonth = thisMonth === 1 ? 12 : thisMonth - 1

  const { start: thisStart, end: thisEnd } = getMonthBounds(thisYear, thisMonth)
  const { start: prevStart, end: prevEnd } = getMonthBounds(prevYear, prevMonth)

  // Month label
  const MONTHS_PT = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ]
  const monthLabel = MONTHS_PT[thisMonth - 1]!

  // ── Fetch all month data in parallel ──────────────────────────────────────
  const [
    thisXpRes,
    prevXpRes,
    thisHabitLogsRes,
    habitsRes,
    thisWorkoutsRes,
    prevWorkoutsRes,
    thisTasksDoneRes,
    prevTasksDoneRes,
    thisTransactionsRes,
    prevTransactionsRes,
    thisAchievementsRes,
    profileRes,
  ] = await Promise.all([
    // XP this month
    supabase
      .from('xp_transactions')
      .select('amount, created_at')
      .eq('user_id', userId)
      .gte('created_at', thisStart)
      .lte('created_at', thisEnd),

    // XP previous month
    supabase
      .from('xp_transactions')
      .select('amount')
      .eq('user_id', userId)
      .gte('created_at', prevStart)
      .lte('created_at', prevEnd),

    // Habit logs this month
    supabase
      .from('habit_logs')
      .select('habit_id, logged_date')
      .eq('user_id', userId)
      .gte('logged_date', thisStart.split('T')[0]!)
      .lte('logged_date', thisEnd.split('T')[0]!),

    // Active habits (to compute rate)
    supabase
      .from('habits')
      .select('id, name, icon, color')
      .eq('user_id', userId)
      .eq('is_active', true),

    // Workouts this month
    supabase
      .from('workouts')
      .select('id, name, created_at')
      .eq('user_id', userId)
      .gte('created_at', thisStart)
      .lte('created_at', thisEnd),

    // Workouts previous month
    supabase
      .from('workouts')
      .select('id')
      .eq('user_id', userId)
      .gte('created_at', prevStart)
      .lte('created_at', prevEnd),

    // Tasks done this month
    supabase
      .from('tasks')
      .select('id, updated_at')
      .eq('user_id', userId)
      .eq('status', 'done')
      .gte('updated_at', thisStart)
      .lte('updated_at', thisEnd),

    // Tasks done previous month
    supabase
      .from('tasks')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'done')
      .gte('updated_at', prevStart)
      .lte('updated_at', prevEnd),

    // Transactions this month (expenses)
    supabase
      .from('transactions')
      .select('amount, transaction_type')
      .eq('user_id', userId)
      .gte('transaction_date', thisStart.split('T')[0]!)
      .lte('transaction_date', thisEnd.split('T')[0]!),

    // Transactions previous month
    supabase
      .from('transactions')
      .select('amount, transaction_type')
      .eq('user_id', userId)
      .gte('transaction_date', prevStart.split('T')[0]!)
      .lte('transaction_date', prevEnd.split('T')[0]!),

    // Achievements unlocked this month
    supabase
      .from('user_achievements')
      .select('achievement_id, unlocked_at, achievements(name, icon, xp_reward)')
      .eq('user_id', userId)
      .gte('unlocked_at', thisStart)
      .lte('unlocked_at', thisEnd)
      .order('unlocked_at', { ascending: false })
      .limit(5),

    // Profile for streak
    supabase
      .from('profiles')
      .select('streak_current, streak_longest, perfect_days, xp_total, level')
      .eq('id', userId)
      .single(),
  ])

  // ── Compute stats ──────────────────────────────────────────────────────────

  // XP
  const thisXpTotal = (thisXpRes.data ?? []).reduce((s, t) => s + (t.amount ?? 0), 0)
  const prevXpTotal = (prevXpRes.data ?? []).reduce((s, t) => s + (t.amount ?? 0), 0)
  const xpChange = pctChange(thisXpTotal, prevXpTotal)

  // Best day XP
  const xpByDay = new Map<string, number>()
  for (const t of thisXpRes.data ?? []) {
    const day = t.created_at.split('T')[0]!
    xpByDay.set(day, (xpByDay.get(day) ?? 0) + (t.amount ?? 0))
  }
  let bestDayXp = 0
  let bestDayDate = ''
  for (const [day, xp] of xpByDay.entries()) {
    if (xp > bestDayXp) { bestDayXp = xp; bestDayDate = day }
  }
  const bestDayLabel = bestDayDate
    ? new Date(bestDayDate + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
    : null

  // Habits
  const habits = habitsRes.data ?? []
  const habitLogs = thisHabitLogsRes.data ?? []
  const daysInMonth = new Date(thisYear, thisMonth, 0).getDate()
  const daysElapsed = Math.min(dayOfMonth, daysInMonth)
  const possibleLogs = habits.length * daysElapsed
  const actualLogs = habitLogs.length
  const habitRate = possibleLogs > 0 ? Math.round((actualLogs / possibleLogs) * 100) : 0

  // Perfect days (all habits completed in a day)
  const logsByDay = new Map<string, Set<string>>()
  for (const log of habitLogs) {
    if (!logsByDay.has(log.logged_date)) logsByDay.set(log.logged_date, new Set())
    logsByDay.get(log.logged_date)!.add(log.habit_id)
  }
  let perfectDaysMonth = 0
  for (const [, completedHabits] of logsByDay.entries()) {
    if (habits.length > 0 && completedHabits.size >= habits.length) {
      perfectDaysMonth++
    }
  }

  // Workouts
  const thisWorkouts = (thisWorkoutsRes.data ?? []).length
  const prevWorkouts = (prevWorkoutsRes.data ?? []).length
  const workoutsChange = pctChange(thisWorkouts, prevWorkouts)

  // Tasks
  const thisTasksDone = (thisTasksDoneRes.data ?? []).length
  const prevTasksDone = (prevTasksDoneRes.data ?? []).length
  const tasksChange = pctChange(thisTasksDone, prevTasksDone)

  // Finance
  const thisExpenses = (thisTransactionsRes.data ?? [])
    .filter((t) => t.transaction_type === 'expense')
    .reduce((s, t) => s + Math.abs(t.amount ?? 0), 0)
  const thisIncome = (thisTransactionsRes.data ?? [])
    .filter((t) => t.transaction_type === 'income')
    .reduce((s, t) => s + Math.abs(t.amount ?? 0), 0)
  const prevExpenses = (prevTransactionsRes.data ?? [])
    .filter((t) => t.transaction_type === 'expense')
    .reduce((s, t) => s + Math.abs(t.amount ?? 0), 0)
  const expensesChange = pctChange(thisExpenses, prevExpenses)
  const savingsRate = thisIncome > 0 ? Math.round(((thisIncome - thisExpenses) / thisIncome) * 100) : null

  // Achievements — Supabase returns joined table as array from the type system but
  // it's actually a single object at runtime for FK joins; cast through unknown.
  type AchievementRow = {
    achievement_id: string
    unlocked_at: string
    achievements: { name: string; icon: string; xp_reward: number } | null
  }
  const achievements = (thisAchievementsRes.data ?? []) as unknown as AchievementRow[]
  const achievementsXp = achievements.reduce((s, a) => s + (a.achievements?.xp_reward ?? 0), 0)

  // Profile
  const profile = profileRes.data

  // ── Score rating ────────────────────────────────────────────────────────────
  const overallScore = Math.round(
    (Math.min(habitRate, 100) * 0.35) +
    (Math.min(thisWorkouts * 10, 100) * 0.25) +
    (Math.min(thisTasksDone * 5, 100) * 0.25) +
    (Math.min(perfectDaysMonth * 10, 100) * 0.15)
  )

  const scoreLabel =
    overallScore >= 85 ? 'Excelente' :
    overallScore >= 70 ? 'Muito Bom' :
    overallScore >= 55 ? 'Bom' :
    overallScore >= 40 ? 'Regular' : 'Em construção'

  const scoreColor =
    overallScore >= 85 ? '#00FF88' :
    overallScore >= 70 ? '#F5C842' :
    overallScore >= 55 ? '#FF4D00' :
    overallScore >= 40 ? '#7C3AED' : '#8899BB'

  const scoreRgb =
    overallScore >= 85 ? '0,255,136' :
    overallScore >= 70 ? '245,200,66' :
    overallScore >= 55 ? '255,77,0' :
    overallScore >= 40 ? '124,58,237' : '136,153,187'

  // ── Trend component helper data ──────────────────────────────────────────────
  // Generate a simple 4-week breakdown of XP for the bar sparkline
  const weeklyXp = [0, 0, 0, 0]
  for (const [day, xp] of xpByDay.entries()) {
    const d = parseInt(day.split('-')[2]!, 10)
    const weekIdx = Math.min(Math.floor((d - 1) / 7), 3)
    weeklyXp[weekIdx] = (weeklyXp[weekIdx] ?? 0) + xp
  }
  const maxWeeklyXp = Math.max(...weeklyXp, 1)

  // Nothing to show if the month just started and there's no data at all
  const hasAnyData = thisXpTotal > 0 || thisWorkouts > 0 || actualLogs > 0 || thisTasksDone > 0

  if (!hasAnyData) return null

  return (
    <div
      className="rounded-2xl relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, rgba(${scoreRgb},0.07) 0%, rgba(13,24,41,0.98) 60%, rgba(124,58,237,0.04) 100%)`,
        border: `1px solid rgba(${scoreRgb},0.2)`,
        boxShadow: `0 0 40px rgba(${scoreRgb},0.04)`,
      }}
    >
      {/* Corner glow */}
      <div
        className="absolute -top-10 -right-10 w-48 h-48 rounded-full pointer-events-none blur-3xl"
        style={{ background: `rgba(${scoreRgb},0.12)` }}
      />

      <div className="relative z-10 p-5 md:p-6 space-y-5">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: `rgba(${scoreRgb},0.15)`, border: `1px solid rgba(${scoreRgb},0.3)` }}
              >
                <Star size={13} style={{ color: scoreColor }} />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-text-muted">
                Resumo — {monthLabel}
              </span>
            </div>
            <h2 className="font-black text-lg leading-tight">
              {scoreLabel} este mês
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              Dias {daysElapsed}/{daysInMonth} registrados
            </p>
          </div>

          {/* Score ring */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="heading-display text-4xl leading-none" style={{ color: scoreColor }}>
                {overallScore}
              </div>
              <div className="text-xs text-text-muted mt-0.5">pontos</div>
            </div>
            {/* Mini SVG ring */}
            <div className="relative w-14 h-14 shrink-0">
              <svg viewBox="0 0 56 56" className="w-full h-full -rotate-90">
                <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
                <circle
                  cx="28" cy="28" r="22" fill="none"
                  stroke={scoreColor}
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={`${(overallScore / 100) * 138.2} 138.2`}
                  style={{ filter: `drop-shadow(0 0 4px ${scoreColor}88)` }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[10px] font-bold" style={{ color: scoreColor }}>{overallScore}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── 4-week XP sparkline ─────────────────────────────────────────── */}
        <div
          className="rounded-xl p-4 space-y-3"
          style={{
            background: 'rgba(245,200,66,0.05)',
            border: '1px solid rgba(245,200,66,0.12)',
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap size={13} style={{ color: '#F5C842' }} fill="#F5C842" />
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#F5C842' }}>
                XP do mês
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="heading-display text-xl" style={{ color: '#F5C842' }}>
                +{thisXpTotal.toLocaleString('pt-BR')}
              </span>
              {xpChange !== null && (
                <TrendBadge value={xpChange} />
              )}
            </div>
          </div>

          {/* Weekly bars */}
          <div className="flex items-end gap-2 h-10">
            {weeklyXp.map((xp, i) => {
              const height = maxWeeklyXp > 0 ? Math.max(3, Math.round((xp / maxWeeklyXp) * 40)) : 3
              const isCurrent = i === Math.floor((dayOfMonth - 1) / 7)
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex items-end justify-center" style={{ height: 40 }}>
                    <div
                      className="w-full rounded-t"
                      style={{
                        height,
                        background: isCurrent
                          ? 'linear-gradient(180deg, #F5C842, rgba(245,200,66,0.4))'
                          : xp > 0
                          ? 'linear-gradient(180deg, rgba(245,200,66,0.55), rgba(245,200,66,0.2))'
                          : 'rgba(255,255,255,0.04)',
                        boxShadow: isCurrent ? '0 0 6px rgba(245,200,66,0.4)' : 'none',
                      }}
                      title={`Sem ${i + 1}: +${xp} XP`}
                    />
                  </div>
                  <span className="text-[9px] text-text-muted">S{i + 1}</span>
                </div>
              )
            })}
          </div>

          {bestDayLabel && (
            <div className="text-xs text-text-muted">
              Melhor dia:{' '}
              <span style={{ color: '#F5C842', fontWeight: 700 }}>
                {bestDayLabel} — +{bestDayXp.toLocaleString('pt-BR')} XP
              </span>
            </div>
          )}
        </div>

        {/* ── Stats grid ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

          {/* Habits */}
          <StatCard
            icon={<Flame size={14} style={{ color: '#FF4D00' }} />}
            label="Hábitos"
            value={`${habitRate}%`}
            subValue={`${actualLogs} de ${possibleLogs}`}
            accentRgb="255,77,0"
            accentHex="#FF4D00"
            trend={null}
            detail={perfectDaysMonth > 0 ? `${perfectDaysMonth}d perfeito${perfectDaysMonth > 1 ? 's' : ''}` : undefined}
          />

          {/* Workouts */}
          <StatCard
            icon={<Dumbbell size={14} style={{ color: '#7C3AED' }} />}
            label="Treinos"
            value={String(thisWorkouts)}
            subValue={`vs ${prevWorkouts} ant.`}
            accentRgb="124,58,237"
            accentHex="#7C3AED"
            trend={workoutsChange}
          />

          {/* Tasks */}
          <StatCard
            icon={<CheckSquare size={14} style={{ color: '#00FF88' }} />}
            label="Tarefas feitas"
            value={String(thisTasksDone)}
            subValue={`vs ${prevTasksDone} ant.`}
            accentRgb="0,255,136"
            accentHex="#00FF88"
            trend={tasksChange}
          />

          {/* Finance */}
          <StatCard
            icon={<CreditCard size={14} style={{ color: '#3B82F6' }} />}
            label="Gastos"
            value={thisExpenses > 0 ? formatCurrency(thisExpenses) : '–'}
            subValue={savingsRate !== null ? `${savingsRate}% poupado` : 'sem receita'}
            accentRgb="59,130,246"
            accentHex="#3B82F6"
            trend={expensesChange !== null ? -expensesChange : null}
            invertTrend
          />
        </div>

        {/* ── Achievements row ─────────────────────────────────────────────── */}
        {achievements.length > 0 && (
          <div
            className="rounded-xl p-4 space-y-3"
            style={{
              background: 'rgba(245,200,66,0.05)',
              border: '1px solid rgba(245,200,66,0.15)',
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy size={13} style={{ color: '#F5C842' }} />
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#F5C842' }}>
                  Conquistas desbloqueadas
                </span>
              </div>
              <span className="text-xs font-bold" style={{ color: '#F5C842' }}>
                +{achievementsXp.toLocaleString('pt-BR')} XP
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {achievements.slice(0, 5).map((a) => (
                <div
                  key={a.achievement_id}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl"
                  style={{
                    background: 'rgba(245,200,66,0.08)',
                    border: '1px solid rgba(245,200,66,0.18)',
                  }}
                  title={a.achievements?.name}
                >
                  <span className="text-base">{a.achievements?.icon ?? '🏆'}</span>
                  <span className="text-xs font-medium text-white truncate max-w-[100px]">
                    {a.achievements?.name ?? 'Conquista'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Streak & motivation footer ──────────────────────────────────── */}
        {profile && (
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3 flex-wrap">
              {profile.streak_current >= 3 && (
                <div
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
                  style={{ background: 'rgba(255,77,0,0.1)', color: '#FF4D00', border: '1px solid rgba(255,77,0,0.2)' }}
                >
                  <Flame size={12} />
                  {profile.streak_current} dias seguidos
                </div>
              )}
              {perfectDaysMonth > 0 && (
                <div
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
                  style={{ background: 'rgba(245,200,66,0.1)', color: '#F5C842', border: '1px solid rgba(245,200,66,0.2)' }}
                >
                  <Star size={12} fill="currentColor" />
                  {perfectDaysMonth} dia{perfectDaysMonth > 1 ? 's' : ''} perfeito{perfectDaysMonth > 1 ? 's' : ''}
                </div>
              )}
            </div>

            {/* Motivational nudge */}
            <div className="text-xs text-text-muted">
              {habitRate >= 80 ? '🔥 Ritmo excelente!' :
               habitRate >= 60 ? '💪 Continue assim!' :
               habitRate >= 40 ? '⚡ Metade do caminho percorrido' :
               '🌱 Cada passo conta!'}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string
  subValue: string
  accentRgb: string
  accentHex: string
  trend: number | null
  detail?: string
  invertTrend?: boolean
}

function StatCard({
  icon,
  label,
  value,
  subValue,
  accentRgb,
  accentHex,
  trend,
  detail,
  invertTrend,
}: StatCardProps) {
  return (
    <div
      className="rounded-xl p-3.5 relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, rgba(${accentRgb},0.07) 0%, rgba(13,24,41,0.98) 100%)`,
        border: `1px solid rgba(${accentRgb},0.18)`,
      }}
    >
      <div
        className="absolute -top-3 -right-3 w-10 h-10 rounded-full pointer-events-none blur-lg"
        style={{ background: `rgba(${accentRgb},0.25)` }}
      />
      <div className="relative z-10 space-y-1.5">
        <div className="flex items-center gap-1.5">
          {icon}
          <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">{label}</span>
        </div>
        <div className="flex items-end justify-between gap-1">
          <div className="heading-display text-xl leading-none" style={{ color: accentHex }}>
            {value}
          </div>
          {trend !== null && <TrendBadge value={invertTrend ? trend : trend} small />}
        </div>
        <div className="text-[10px] text-text-muted">
          {detail ?? subValue}
        </div>
      </div>
    </div>
  )
}

function TrendBadge({ value, small }: { value: number; small?: boolean }) {
  const isPositive = value > 0
  const isNeutral = value === 0

  return (
    <span
      className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full font-bold ${small ? 'text-[9px]' : 'text-xs'}`}
      style={{
        background: isNeutral
          ? 'rgba(136,153,187,0.1)'
          : isPositive
          ? 'rgba(0,255,136,0.1)'
          : 'rgba(239,68,68,0.1)',
        color: isNeutral
          ? '#8899BB'
          : isPositive
          ? '#00FF88'
          : '#EF4444',
        border: isNeutral
          ? '1px solid rgba(136,153,187,0.2)'
          : isPositive
          ? '1px solid rgba(0,255,136,0.2)'
          : '1px solid rgba(239,68,68,0.2)',
      }}
    >
      {isNeutral ? <Minus size={8} /> : isPositive ? <TrendingUp size={8} /> : <TrendingDown size={8} />}
      {isNeutral ? '=' : `${isPositive ? '+' : ''}${value}%`}
    </span>
  )
}
