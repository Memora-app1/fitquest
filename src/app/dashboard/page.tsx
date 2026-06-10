import type { Metadata } from 'next'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { AppShell } from '@/components/layout/app-shell'
import { XpWidget } from '@/components/dashboard/xp-widget'
import { StreakWidget } from '@/components/dashboard/streak-widget'
import { HabitsToday } from '@/components/dashboard/habits-today'
import { TasksToday } from '@/components/dashboard/tasks-today'
import { FinanceAlerts } from '@/components/dashboard/finance-alerts'
import { QuickActions } from '@/components/dashboard/quick-actions'
import { ActivityFeed } from '@/components/dashboard/activity-feed'
import { WeekProgress } from '@/components/dashboard/week-progress'
import { LifeScore } from '@/components/dashboard/life-score'
import { InsightsWidget } from '@/components/dashboard/insights-widget'
import { MonthlyRecap } from '@/components/dashboard/monthly-recap'
import { WeeklyChallenges } from '@/components/dashboard/weekly-challenges'
import { WeeklyXpBreakdown } from '@/components/dashboard/weekly-xp-breakdown'
import { LifeBalanceRadar } from '@/components/dashboard/life-balance-radar'
import { WorkoutPrsWidget } from '@/components/dashboard/workout-prs-widget'
import { MorningBrief } from '@/components/dashboard/morning-brief'
import { HealthSummaryWidget } from '@/components/dashboard/health-summary-widget'
import { DailyPerformanceCard } from '@/components/dashboard/daily-performance-card'
import { DailyQuest } from '@/components/dashboard/daily-quest'
import { ComebackCard } from '@/components/dashboard/comeback-card'
import { StreakMilestone } from '@/components/dashboard/streak-milestone'
import { WeeklyReport } from '@/components/dashboard/weekly-report'
import { NextAchievementWidget } from '@/components/dashboard/next-achievement-widget'
import { StreakLeaderboard } from '@/components/dashboard/streak-leaderboard'
import { StreakRiskBanner } from '@/components/dashboard/streak-risk-banner'
import { XpToday } from '@/components/dashboard/xp-today'
import { NextAction } from '@/components/dashboard/next-action'
import { LeagueWidget } from '@/components/dashboard/league-widget'
import { LootBoxWidget } from '@/components/dashboard/loot-box-widget'
import { SeasonPassWidget } from '@/components/dashboard/season-pass-widget'
import { getGreeting, todayString } from '@/lib/utils'
import { getXpProgressToNextLevel } from '@/lib/xp'

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Visão geral do seu Life OS — hábitos, tarefas, finanças e XP em um único painel.',
}

export const dynamic = 'force-dynamic'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string; welcome?: string }>
}) {
  const { checkout, welcome } = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const today = todayString()
  const twoDaysAgo = new Date(Date.now() - 48 * 3600000).toISOString()
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]!

  const [
    profileRes,
    habitsRes,
    habitLogsRes,
    weekHabitLogsRes,
    tasksRes,
    transactionsRes,
    xpFeedRes,
    weekXpRes,
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('name, xp_total, level, streak_current, streak_longest, subscription_status, trial_end, perfect_days, streak_freezes')
      .eq('id', user.id)
      .single(),
    supabase
      .from('habits')
      .select('id, name, icon, color, xp_per_completion')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('display_order'),
    supabase
      .from('habit_logs')
      .select('habit_id')
      .eq('user_id', user.id)
      .eq('logged_date', today),
    supabase
      .from('habit_logs')
      .select('habit_id, logged_date')
      .eq('user_id', user.id)
      .gte('logged_date', sevenDaysAgo),
    supabase
      .from('tasks')
      .select('id, title, urgent, important, due_date')
      .eq('user_id', user.id)
      .not('status', 'eq', 'done')
      .not('status', 'eq', 'archived')
      .order('urgent', { ascending: false })
      .order('important', { ascending: false })
      .limit(5),
    supabase
      .from('transactions')
      .select('id, description, amount, transaction_date')
      .eq('user_id', user.id)
      .eq('is_paid', false)
      .gte('transaction_date', today)
      .order('transaction_date')
      .limit(5),
    supabase
      .from('xp_transactions')
      .select('id, amount, reason, source_type, created_at')
      .eq('user_id', user.id)
      .gte('created_at', twoDaysAgo)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('xp_transactions')
      .select('amount, created_at')
      .eq('user_id', user.id)
      .gte('created_at', sevenDaysAgo)
      .order('created_at', { ascending: true }),
  ])

  const profile = profileRes.data
  if (!profile) redirect('/onboarding')

  const trialDaysLeft =
    profile.subscription_status === 'trial' && profile.trial_end
      ? Math.max(0, Math.ceil((new Date(profile.trial_end).getTime() - Date.now()) / 86_400_000))
      : null

  const habits = habitsRes.data ?? []
  const habitLogsToday = new Set(habitLogsRes.data?.map((l) => l.habit_id) ?? [])
  const weekHabitLogs = weekHabitLogsRes.data ?? []
  const activeDays = [...new Set(weekHabitLogs.map((l) => l.logged_date))]
  const tasks = tasksRes.data ?? []
  const hasActivityToday = habitLogsToday.size > 0
  const transactions = transactionsRes.data ?? []
  const xpFeed = xpFeedRes.data ?? []

  // Build daily XP for sparkline
  const xpByDay = new Map<string, number>()
  for (const tx of weekXpRes.data ?? []) {
    const day = tx.created_at.split('T')[0]!
    xpByDay.set(day, (xpByDay.get(day) ?? 0) + (tx.amount ?? 0))
  }
  const weekXpData = Array.from(xpByDay.entries()).map(([date, xp]) => ({ date, xp }))

  // Life Score computation
  const habitsTotal = habits.length
  const habitsCompleted = habitLogsToday.size
  const habitsScore = habitsTotal > 0 ? Math.round((habitsCompleted / habitsTotal) * 100) : 50

  const xpToday = xpFeed
    .filter((t) => t.created_at.startsWith(today))
    .reduce((s, t) => s + (t.amount ?? 0), 0)
  const xpScore = Math.min(Math.round(xpToday / 5), 100) // 500 XP = 100 points

  const streakScore = Math.min(profile.streak_current * 10, 100) // 10 days = 100 points

  const criticalTasks = tasks.filter((t) => t.urgent && t.important).length
  const taskScore = Math.max(0, 100 - criticalTasks * 25) // 4 critical tasks → 0 points

  const totalScore = Math.round(
    habitsScore * 0.40 +
    streakScore * 0.25 +
    xpScore    * 0.20 +
    taskScore  * 0.15
  )

  // Insights widget data
  const xpProgress = getXpProgressToNextLevel(profile.xp_total)
  const xpToNextLevel = xpProgress.needed > 0 ? xpProgress.needed - xpProgress.current : 0

  return (
    <AppShell>
      <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">

        {/* Welcome banner — aparece ao completar onboarding */}
        {welcome === '1' && (
          <div
            className="rounded-2xl p-5 md:p-6 flex items-center gap-4 relative overflow-hidden animate-bounce-in"
            style={{
              background: 'linear-gradient(135deg, rgba(124,58,237,0.18) 0%, rgba(13,24,41,0.98) 55%, rgba(255,77,0,0.10) 100%)',
              border: '1px solid rgba(124,58,237,0.35)',
              boxShadow: '0 8px 32px rgba(124,58,237,0.12)',
            }}
          >
            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full pointer-events-none blur-3xl" style={{ background: 'rgba(124,58,237,0.25)' }} />
            <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full pointer-events-none blur-2xl" style={{ background: 'rgba(255,77,0,0.12)' }} />
            <div className="text-4xl relative z-10 animate-bounce">🚀</div>
            <div className="relative z-10 flex-1 min-w-0">
              <p className="font-black text-white text-lg leading-tight">
                {profile.name.split(' ')[0]}, seja bem-vindo ao Ascendia!
              </p>
              <p className="text-sm text-text-secondary mt-0.5">
                Seus hábitos foram criados. Você começa com{' '}
                <span className="font-bold text-brand-gold">+100 XP</span> de bônus. Vai lá! ⚡
              </p>
            </div>
            <div
              className="relative z-10 shrink-0 px-4 py-2 rounded-xl text-xs font-black hidden sm:block"
              style={{
                background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(255,77,0,0.2))',
                border: '1px solid rgba(124,58,237,0.4)',
                color: '#A78BFA',
              }}
            >
              +100 XP
            </div>
          </div>
        )}

        {/* Checkout success banner */}
        {checkout === 'success' && (
          <div className="bg-brand-green/10 border border-brand-green/30 rounded-xl p-4 flex items-center gap-3">
            <span className="text-2xl">🎉</span>
            <div>
              <p className="font-semibold text-brand-green">Assinatura ativada com sucesso!</p>
              <p className="text-sm text-text-secondary">Bem-vindo ao Ascendia Premium. Curta todos os recursos.</p>
            </div>
          </div>
        )}

        {/* Trial banner — visível para todos os dias de trial */}
        {trialDaysLeft !== null && (
          <div
            className="rounded-xl p-4 flex items-center justify-between gap-4"
            style={{
              background: trialDaysLeft === 0
                ? 'rgba(239,68,68,0.15)'
                : trialDaysLeft <= 2
                ? 'rgba(255,77,0,0.15)'
                : 'rgba(124,58,237,0.10)',
              border: trialDaysLeft === 0
                ? '1px solid rgba(239,68,68,0.40)'
                : trialDaysLeft <= 2
                ? '1px solid rgba(255,77,0,0.40)'
                : '1px solid rgba(124,58,237,0.25)',
            }}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">
                {trialDaysLeft === 0 ? '🚨' : trialDaysLeft <= 2 ? '⏰' : '🎁'}
              </span>
              <div>
                <p className="font-semibold text-white text-sm">
                  {trialDaysLeft === 0
                    ? 'Seu período gratuito encerrou hoje'
                    : trialDaysLeft === 1
                    ? 'Último dia do seu trial gratuito'
                    : `${trialDaysLeft} dias restantes no trial gratuito`}
                </p>
                <p className="text-xs text-text-secondary">
                  {trialDaysLeft === 0
                    ? 'Assine agora para não perder seu progresso'
                    : trialDaysLeft <= 3
                    ? 'Garanta seu acesso antes de perder o progresso'
                    : 'Experimente tudo gratuitamente. Assine quando quiser.'}
                </p>
              </div>
            </div>
            <Link
              href="/planos"
              className="shrink-0 text-sm py-2 px-4 rounded-xl font-bold transition-all hover:scale-105"
              style={{
                background: trialDaysLeft <= 2 ? '#FF4D00' : 'rgba(124,58,237,0.3)',
                color: '#fff',
                border: trialDaysLeft <= 2 ? 'none' : '1px solid rgba(124,58,237,0.5)',
              }}
            >
              {trialDaysLeft <= 2 ? 'Assinar agora →' : 'Ver planos'}
            </Link>
          </div>
        )}

        {/* Greeting Hero — compacto no mobile, card completo no desktop */}
        <header className="md:rounded-2xl md:p-6 md:relative md:overflow-hidden px-1 pt-1 pb-0"
          style={{
            // desktop only
          }}
        >
          {/* Glow decorativo — apenas desktop */}
          <div
            className="hidden md:block absolute -top-8 -right-8 w-40 h-40 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)' }}
          />
          {/* Desktop: card com borda */}
          <div
            className="hidden md:block absolute inset-0 rounded-2xl pointer-events-none"
            style={{
              background: 'linear-gradient(135deg, rgba(124,58,237,0.08) 0%, rgba(13,24,41,0.98) 60%, rgba(255,77,0,0.05) 100%)',
              border: '1px solid rgba(124,58,237,0.2)',
            }}
          />

          <div className="relative z-10 flex items-center justify-between gap-3">
            {/* Nome + saudação */}
            <div className="min-w-0">
              <p className="text-text-muted text-xs md:text-sm">{getGreeting()}</p>
              <h1 className="text-xl md:text-4xl font-bold leading-tight truncate">
                {profile.name.split(' ')[0]} <span className="text-lg md:text-2xl">👋</span>
              </h1>
            </div>

            {/* Badges — level + streak */}
            <div className="flex items-center gap-2 shrink-0">
              <div
                className="px-2.5 py-1 rounded-xl text-xs font-bold"
                style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', color: '#9F5AF7' }}
              >
                Lv {profile.level}
              </div>
              {profile.streak_current > 0 && (
                <div
                  className="px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1"
                  style={{
                    background: profile.streak_current >= 7 ? 'rgba(255,77,0,0.15)' : 'rgba(255,255,255,0.06)',
                    border: `1px solid ${profile.streak_current >= 7 ? 'rgba(255,77,0,0.4)' : 'rgba(255,255,255,0.1)'}`,
                    color: profile.streak_current >= 7 ? '#FF4D00' : '#8899BB',
                  }}
                >
                  🔥 {profile.streak_current}d
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Próxima ação — ação de maior XP disponível agora */}
        <Suspense fallback={null}>
          <NextAction userId={user.id} />
        </Suspense>

        {/* XP earned today — aparece apenas quando há XP no dia */}
        <Suspense fallback={null}>
          <XpToday userId={user.id} />
        </Suspense>

        {/* Streak at risk — aparece após 20:00 local sem atividade */}
        <StreakRiskBanner
          streakCurrent={profile.streak_current}
          hasActivityToday={hasActivityToday}
          freezes={(profile.streak_freezes as number) ?? 0}
        />

        {/* Streak milestone — celebração em marcos especiais */}
        <Suspense fallback={null}>
          <StreakMilestone userId={user.id} />
        </Suspense>

        {/* Comeback card — aparece quando streak foi resetado */}
        <Suspense fallback={null}>
          <ComebackCard userId={user.id} />
        </Suspense>

        {/* Weekly report — resumo semanal às segundas */}
        <Suspense fallback={null}>
          <WeeklyReport userId={user.id} />
        </Suspense>

        {/* Campo de performance do dia — ÓTIMO / BOM / ALERTA com score */}
        <Suspense fallback={<div className="h-28 rounded-2xl animate-pulse" style={{ background: 'rgba(21,34,56,0.5)' }} />}>
          <DailyPerformanceCard userId={user.id} />
        </Suspense>

        {/* Morning brief — prioridades do dia */}
        <Suspense fallback={<div className="h-24 rounded-2xl animate-pulse" style={{ background: 'rgba(21,34,56,0.5)' }} />}>
          <MorningBrief userId={user.id} />
        </Suspense>

        {/* Health summary — água e sono de hoje */}
        <Suspense fallback={<div className="h-24 rounded-2xl animate-pulse" style={{ background: 'rgba(21,34,56,0.5)' }} />}>
          <HealthSummaryWidget userId={user.id} />
        </Suspense>

        {/* Daily quests — missões personalizadas que resetam à meia-noite */}
        <Suspense fallback={<div className="h-40 rounded-2xl animate-pulse" style={{ background: 'rgba(21,34,56,0.5)' }} />}>
          <DailyQuest userId={user.id} />
        </Suspense>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <XpWidget xpTotal={profile.xp_total} level={profile.level} />
          <StreakWidget
            current={profile.streak_current}
            longest={profile.streak_longest}
            activeDays={activeDays}
            freezes={(profile.streak_freezes as number) ?? 0}
          />
        </div>

        {/* Life Score */}
        <LifeScore
          totalScore={totalScore}
          habitsScore={habitsScore}
          streakScore={streakScore}
          xpScore={xpScore}
          taskScore={taskScore}
          streakCurrent={profile.streak_current}
          habitsCompleted={habitsCompleted}
          habitsTotal={habitsTotal}
          xpToday={xpToday}
          criticalTasks={criticalTasks}
        />

        {/* Insights — smart contextual tips based on today's data */}
        <InsightsWidget
          habitsTotal={habitsTotal}
          habitsCompleted={habitsCompleted}
          streakCurrent={profile.streak_current}
          streakLongest={profile.streak_longest}
          xpTotal={profile.xp_total}
          xpToNextLevel={xpToNextLevel}
          level={profile.level}
          criticalTasks={criticalTasks}
          totalTasks={tasks.length}
          xpToday={xpToday}
          upcomingBills={transactions.length}
          perfectDays={profile.perfect_days ?? 0}
        />

        {/* Quick Actions */}
        <QuickActions />

        {/* Main content grid — 3 cols on large screens */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left col: habits + tasks */}
          <div className="lg:col-span-2 space-y-6">
            <HabitsToday habits={habits} loggedToday={habitLogsToday} />
            <TasksToday tasks={tasks} />
            {/* Week progress — show below tasks on mobile, spans both columns */}
            <div className="lg:hidden">
              <WeekProgress
                habits={habits}
                weekLogs={weekHabitLogs}
                weekXp={weekXpData}
                streakCurrent={profile.streak_current}
              />
            </div>
          </div>

          {/* Right col: activity + week progress on desktop */}
          <div className="space-y-6">
            <ActivityFeed transactions={xpFeed} />
            <div className="hidden lg:block">
              <WeekProgress
                habits={habits}
                weekLogs={weekHabitLogs}
                weekXp={weekXpData}
                streakCurrent={profile.streak_current}
              />
            </div>
          </div>
        </div>

        {/* Finance Alerts */}
        {transactions.length > 0 && <FinanceAlerts transactions={transactions} />}

        {/* Leaderboard de streak — social proof de consistência */}
        <Suspense fallback={null}>
          <StreakLeaderboard userId={user.id} />
        </Suspense>

        {/* Próxima conquista — pull effect constante */}
        <Suspense fallback={null}>
          <NextAchievementWidget userId={user.id} />
        </Suspense>

        {/* Liga semanal */}
        <Suspense fallback={<div className="h-40 rounded-2xl shimmer" />}>
          <LeagueWidget userId={user.id} />
        </Suspense>

        {/* Season pass */}
        <Suspense fallback={null}>
          <SeasonPassWidget
            userId={user.id}
            isPaid={profile.subscription_status === 'active' || profile.subscription_status === 'lifetime'}
          />
        </Suspense>

        {/* Heavy analytics — streamed independently for faster initial load */}
        <Suspense fallback={<div className="h-48 rounded-2xl shimmer" />}>
          <WeeklyChallenges userId={user.id} />
        </Suspense>

        <Suspense fallback={<div className="h-64 rounded-2xl shimmer" />}>
          <LifeBalanceRadar userId={user.id} />
        </Suspense>

        <Suspense fallback={<div className="h-40 rounded-2xl shimmer" />}>
          <WorkoutPrsWidget userId={user.id} />
        </Suspense>

        <Suspense fallback={<div className="h-48 rounded-2xl shimmer" />}>
          <WeeklyXpBreakdown userId={user.id} />
        </Suspense>

        <Suspense fallback={<div className="h-64 rounded-2xl shimmer" />}>
          <MonthlyRecap userId={user.id} />
        </Suspense>
      </div>
    </AppShell>
  )
}
