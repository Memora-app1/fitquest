import type { Metadata } from 'next'
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
import { getGreeting, todayString } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Visão geral do seu Life OS — hábitos, tarefas, finanças e XP em um único painel.',
}

export const dynamic = 'force-dynamic'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>
}) {
  const { checkout } = await searchParams
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
      .select('name, xp_total, level, streak_current, streak_longest, subscription_status, trial_end')
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
  const transactions = transactionsRes.data ?? []
  const xpFeed = xpFeedRes.data ?? []

  // Build daily XP for sparkline
  const xpByDay = new Map<string, number>()
  for (const tx of weekXpRes.data ?? []) {
    const day = tx.created_at.split('T')[0]!
    xpByDay.set(day, (xpByDay.get(day) ?? 0) + (tx.amount ?? 0))
  }
  const weekXpData = Array.from(xpByDay.entries()).map(([date, xp]) => ({ date, xp }))

  return (
    <AppShell>
      <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">

        {/* Checkout success banner */}
        {checkout === 'success' && (
          <div className="bg-brand-green/10 border border-brand-green/30 rounded-xl p-4 flex items-center gap-3">
            <span className="text-2xl">🎉</span>
            <div>
              <p className="font-semibold text-brand-green">Assinatura ativada com sucesso!</p>
              <p className="text-sm text-text-secondary">Bem-vindo ao FitQuest Premium. Curta todos os recursos.</p>
            </div>
          </div>
        )}

        {/* Trial banner */}
        {trialDaysLeft !== null && trialDaysLeft <= 3 && (
          <div
            className={`rounded-xl p-4 flex items-center justify-between gap-4 ${
              trialDaysLeft === 0
                ? 'bg-red-500/20 border border-red-500/40'
                : 'bg-brand-orange/15 border border-brand-orange/40'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{trialDaysLeft === 0 ? '🚨' : '⏰'}</span>
              <div>
                <p className="font-semibold text-white text-sm">
                  {trialDaysLeft === 0
                    ? 'Seu período gratuito encerrou hoje'
                    : `Seu trial termina em ${trialDaysLeft} dia${trialDaysLeft === 1 ? '' : 's'}`}
                </p>
                <p className="text-xs text-text-secondary">
                  {trialDaysLeft === 0
                    ? 'Assine agora para não perder seu progresso'
                    : 'Garanta seu acesso antes de perder o progresso'}
                </p>
              </div>
            </div>
            <Link href="/planos" className="btn-primary shrink-0 text-sm py-2 px-4">
              Ver planos →
            </Link>
          </div>
        )}

        {/* Greeting Hero */}
        <header
          className="rounded-2xl p-6 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(124,58,237,0.08) 0%, rgba(13,24,41,0.98) 60%, rgba(255,77,0,0.05) 100%)',
            border: '1px solid rgba(124,58,237,0.2)',
          }}
        >
          <div
            className="absolute -top-8 -right-8 w-40 h-40 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)' }}
          />
          <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-text-secondary text-sm">{getGreeting()},</p>
              <h1 className="text-3xl md:text-4xl font-bold mt-0.5">
                {profile.name} <span className="text-2xl">👋</span>
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <div
                className="px-3 py-1.5 rounded-xl text-xs font-bold"
                style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', color: '#9F5AF7' }}
              >
                Lv {profile.level}
              </div>
              {profile.streak_current > 0 && (
                <div
                  className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1"
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

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <XpWidget xpTotal={profile.xp_total} level={profile.level} />
          <StreakWidget current={profile.streak_current} longest={profile.streak_longest} activeDays={activeDays} />
        </div>

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
      </div>
    </AppShell>
  )
}
