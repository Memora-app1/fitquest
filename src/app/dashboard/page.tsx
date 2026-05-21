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
      .select('name, xp_total, level, streak_current, streak_longest')
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

  const habits = habitsRes.data ?? []
  const habitLogsToday = new Set(habitLogsRes.data?.map((l) => l.habit_id) ?? [])
  const tasks = tasksRes.data ?? []
  const transactions = transactionsRes.data ?? []

  return (
    <AppShell>
      <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
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
