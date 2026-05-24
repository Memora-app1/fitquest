/**
 * Dashboard — Life OS Overview
 *
 * Server Component que agrega:
 * - Saudação personalizada + streak
 * - XP/Level widget
 * - Hábitos de hoje (com botão de check)
 * - Tarefas prioritárias (top 3 da Eisenhower)
 * - Contas a pagar próximas
 * - Quick actions
 */

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
import { getGreeting, todayString } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const today = todayString()

  // Buscar tudo em paralelo
  const [profileRes, habitsRes, habitLogsRes, tasksRes, transactionsRes] = await Promise.all([
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
      .from('tasks')
      .select('id, title, urgent, important, due_date')
      .eq('user_id', user.id)
      .not('status', 'eq', 'done')
      .not('status', 'eq', 'archived')
      .order('urgent', { ascending: false })
      .order('important', { ascending: false })
      .limit(3),
    supabase
      .from('transactions')
      .select('id, description, amount, transaction_date')
      .eq('user_id', user.id)
      .eq('is_paid', false)
      .gte('transaction_date', today)
      .order('transaction_date')
      .limit(5),
  ])

  const profile = profileRes.data
  if (!profile) redirect('/onboarding')

  // Calcular dias restantes do trial
  const trialDaysLeft =
    profile.subscription_status === 'trial' && profile.trial_end
      ? Math.max(0, Math.ceil((new Date(profile.trial_end).getTime() - Date.now()) / 86_400_000))
      : null

  const habits = habitsRes.data ?? []
  const habitLogsToday = new Set(habitLogsRes.data?.map((l) => l.habit_id) ?? [])
  const tasks = tasksRes.data ?? []
  const transactions = transactionsRes.data ?? []

  return (
    <AppShell>
      <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">

        {/* Trial banner — aparece quando ≤ 3 dias restantes */}
        {trialDaysLeft !== null && trialDaysLeft <= 3 && (
          <div className={`rounded-xl p-4 flex items-center justify-between gap-4 ${
            trialDaysLeft === 0
              ? 'bg-red-500/20 border border-red-500/40'
              : 'bg-brand-orange/15 border border-brand-orange/40'
          }`}>
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

        {/* Greeting */}
        <header className="space-y-1">
          <p className="text-text-secondary">{getGreeting()},</p>
          <h1 className="text-3xl md:text-4xl font-bold">
            {profile.name} <span className="text-2xl">👋</span>
          </h1>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <XpWidget xpTotal={profile.xp_total} level={profile.level} />
          <StreakWidget
            current={profile.streak_current}
            longest={profile.streak_longest}
          />
        </div>

        {/* Quick Actions */}
        <QuickActions />

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <HabitsToday habits={habits} loggedToday={habitLogsToday} />
          <TasksToday tasks={tasks} />
        </div>

        {/* Finance Alerts */}
        {transactions.length > 0 && <FinanceAlerts transactions={transactions} />}
      </div>
    </AppShell>
  )
}
