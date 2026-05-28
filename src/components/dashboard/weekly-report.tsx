/**
 * Weekly Report — card que aparece às segundas-feiras com o resumo da semana anterior.
 * Mostra XP ganho, hábitos completados, treinos, tarefas e progresso financeiro.
 * Só renderiza se hoje é segunda-feira (day 1).
 */

import { createClient } from '@/lib/supabase/server'
import { todayString } from '@/lib/utils'
import { Trophy, Zap, Target, Dumbbell, CheckSquare, TrendingUp, TrendingDown } from 'lucide-react'

function getLastWeekRange() {
  const now = new Date()
  // Domingo anterior (início da semana anterior)
  const dayOfWeek = now.getDay() // 0=Dom, 1=Seg, ..., 6=Sab
  const daysToLastMonday = dayOfWeek === 0 ? 13 : dayOfWeek + 6
  const daysToLastSunday = dayOfWeek === 0 ? 6 : dayOfWeek - 1

  const lastMonday = new Date(now)
  lastMonday.setDate(now.getDate() - daysToLastMonday)
  const lastSunday = new Date(now)
  lastSunday.setDate(now.getDate() - daysToLastSunday)

  return {
    start: lastMonday.toISOString().split('T')[0]!,
    end: lastSunday.toISOString().split('T')[0]!,
  }
}

export async function WeeklyReport({ userId }: { userId: string }) {
  // Só mostra às segundas-feiras
  const dayOfWeek = new Date().getDay()
  if (dayOfWeek !== 1) return null

  const supabase = await createClient()
  const { start, end } = getLastWeekRange()
  const endDateTime = `${end}T23:59:59`
  const startDateTime = `${start}T00:00:00`

  // Busca semana atual (para comparação) — últimos 7 dias
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]!
  const today = todayString()

  const [
    profileRes,
    habitsRes,
    habitLogsLastWeekRes,
    workoutsLastWeekRes,
    xpLastWeekRes,
    tasksLastWeekRes,
    financialLastWeekRes,
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('name, level, xp_total')
      .eq('id', userId)
      .single(),
    supabase
      .from('habits')
      .select('id')
      .eq('user_id', userId)
      .eq('is_active', true),
    supabase
      .from('habit_logs')
      .select('habit_id, logged_date')
      .eq('user_id', userId)
      .gte('logged_date', start)
      .lte('logged_date', end),
    supabase
      .from('workouts')
      .select('id, started_at')
      .eq('user_id', userId)
      .gte('started_at', startDateTime)
      .lte('started_at', endDateTime),
    supabase
      .from('xp_transactions')
      .select('amount')
      .eq('user_id', userId)
      .gte('created_at', startDateTime)
      .lte('created_at', endDateTime),
    supabase
      .from('tasks')
      .select('id, completed_at')
      .eq('user_id', userId)
      .eq('status', 'done')
      .gte('completed_at', startDateTime)
      .lte('completed_at', endDateTime),
    supabase
      .from('transactions')
      .select('amount, type')
      .eq('user_id', userId)
      .gte('transaction_date', start)
      .lte('transaction_date', end),
  ])

  const profile = profileRes.data
  if (!profile) return null

  const totalHabits = (habitsRes.data ?? []).length
  const habitLogs = habitLogsLastWeekRes.data ?? []
  const uniqueHabitDays = new Set(habitLogs.map(l => l.logged_date)).size
  const habitCompletionRate = totalHabits > 0
    ? Math.round((uniqueHabitDays / 7) * 100)
    : 0

  const workoutsCount = (workoutsLastWeekRes.data ?? []).length
  const xpEarned = (xpLastWeekRes.data ?? []).reduce((s, t) => s + (t.amount ?? 0), 0)
  const tasksCompleted = (tasksLastWeekRes.data ?? []).length

  const transactions = financialLastWeekRes.data ?? []
  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((s, t) => s + Math.abs(t.amount as number), 0)

  // Performance rating
  let rating: 'excellent' | 'good' | 'average' | 'low'
  const scorePoints =
    (habitCompletionRate >= 70 ? 25 : habitCompletionRate >= 40 ? 15 : 5) +
    (workoutsCount >= 3 ? 25 : workoutsCount >= 1 ? 15 : 0) +
    (xpEarned >= 500 ? 25 : xpEarned >= 200 ? 15 : 5) +
    (tasksCompleted >= 5 ? 25 : tasksCompleted >= 2 ? 15 : 5)

  if (scorePoints >= 85) rating = 'excellent'
  else if (scorePoints >= 60) rating = 'good'
  else if (scorePoints >= 35) rating = 'average'
  else rating = 'low'

  const ratingConfig = {
    excellent: { label: 'Semana Épica!',    emoji: '🏆', color: '#F5C842', rgb: '245,200,66', msg: 'Você arrasei em tudo. Continue essa energia!' },
    good:      { label: 'Boa Semana!',      emoji: '⚡', color: '#00FF88', rgb: '0,255,136', msg: 'Progresso sólido. Uma semana bem executada.' },
    average:   { label: 'Semana Regular',   emoji: '📈', color: '#00D9FF', rgb: '0,217,255', msg: 'Há espaço para crescer. Essa semana pode ser melhor.' },
    low:       { label: 'Pode Mais!',       emoji: '💡', color: '#FF4D00', rgb: '255,77,0', msg: 'Toda jornada tem tropeços. A virada começa hoje.' },
  }

  const rc = ratingConfig[rating]
  const firstName = (profile.name ?? '').split(' ')[0] ?? 'você'

  const stats = [
    {
      icon: Target,
      label: 'Hábitos',
      value: `${habitCompletionRate}%`,
      sub: `${uniqueHabitDays}/7 dias ativos`,
      color: '#FF4D00',
      rgb: '255,77,0',
      good: habitCompletionRate >= 70,
    },
    {
      icon: Dumbbell,
      label: 'Treinos',
      value: workoutsCount.toString(),
      sub: workoutsCount === 1 ? 'sessão' : 'sessões',
      color: '#00FF88',
      rgb: '0,255,136',
      good: workoutsCount >= 3,
    },
    {
      icon: Zap,
      label: 'XP Ganho',
      value: xpEarned.toLocaleString('pt-BR'),
      sub: 'pontos de XP',
      color: '#F5C842',
      rgb: '245,200,66',
      good: xpEarned >= 300,
    },
    {
      icon: CheckSquare,
      label: 'Tarefas',
      value: tasksCompleted.toString(),
      sub: tasksCompleted === 1 ? 'concluída' : 'concluídas',
      color: '#7C3AED',
      rgb: '124,58,237',
      good: tasksCompleted >= 3,
    },
  ]

  return (
    <div
      className="rounded-2xl p-5 md:p-6 relative overflow-hidden animate-fade-in"
      style={{
        background: `linear-gradient(135deg, rgba(${rc.rgb},0.08) 0%, rgba(13,24,41,0.98) 55%, rgba(124,58,237,0.05) 100%)`,
        border: `1px solid rgba(${rc.rgb},0.25)`,
      }}
    >
      {/* Glow */}
      <div
        className="absolute -top-10 -right-10 w-48 h-48 rounded-full pointer-events-none blur-3xl"
        style={{ background: `rgba(${rc.rgb},0.07)` }}
      />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center"
                style={{ background: `rgba(${rc.rgb},0.15)`, border: `1px solid rgba(${rc.rgb},0.3)` }}
              >
                <Trophy size={12} style={{ color: rc.color }} />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-text-muted">
                Relatório Semanal
              </span>
            </div>
            <h2 className="text-xl font-black">{rc.label}</h2>
            <p className="text-sm text-text-secondary mt-0.5">
              {firstName}, semana de {new Date(start + 'T12:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })} a {new Date(end + 'T12:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
            </p>
          </div>

          {/* Rating emoji */}
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0 animate-bounce-in"
            style={{
              background: `rgba(${rc.rgb},0.1)`,
              border: `1px solid rgba(${rc.rgb},0.2)`,
            }}
          >
            {rc.emoji}
          </div>
        </div>

        {/* Message */}
        <div
          className="rounded-xl px-4 py-3 mb-4 flex items-center gap-3"
          style={{ background: `rgba(${rc.rgb},0.06)`, border: `1px solid rgba(${rc.rgb},0.12)` }}
        >
          <span className="text-sm" style={{ color: rc.color }}>
            {rc.msg}
          </span>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-4">
          {stats.map(stat => {
            const Icon = stat.icon
            return (
              <div
                key={stat.label}
                className="rounded-xl p-3 relative overflow-hidden"
                style={{
                  background: stat.good ? `rgba(${stat.rgb},0.08)` : 'rgba(255,255,255,0.025)',
                  border: stat.good ? `1px solid rgba(${stat.rgb},0.2)` : '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Icon size={11} style={{ color: stat.good ? stat.color : '#556677' }} />
                  <span className="text-[9px] text-text-muted uppercase tracking-wider">{stat.label}</span>
                </div>
                <div
                  className="heading-display text-xl leading-none"
                  style={{ color: stat.good ? stat.color : '#778899' }}
                >
                  {stat.value}
                </div>
                <div className="text-[9px] text-text-muted mt-0.5">{stat.sub}</div>
              </div>
            )
          })}
        </div>

        {/* Financial summary if has data */}
        {totalExpenses > 0 && (
          <div
            className="flex items-center gap-3 rounded-xl px-4 py-3"
            style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)' }}
          >
            <TrendingDown size={14} style={{ color: '#FF4D00' }} className="shrink-0" />
            <div>
              <span className="text-xs text-text-secondary">Gastos na semana: </span>
              <span className="text-sm font-black" style={{ color: '#FF4D00' }}>
                R$ {totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
