import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components/layout/app-shell'
import { todayString } from '@/lib/utils'
import { HabitsList } from '@/components/habitos/habits-list'
import { Flame, Target, Zap, Calendar } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Hábitos',
  description: 'Acompanhe seus hábitos diários, mantenha sua sequência e ganhe XP a cada dia consistente.',
}

export const dynamic = 'force-dynamic'

export default async function HabitosPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>
}) {
  const { new: openNew } = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const today = todayString()
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]!
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]!

  const [habitsRes, logsRes, weekLogsRes, monthLogsRes, xpFromHabitsRes, profileRes] = await Promise.all([
    supabase
      .from('habits')
      .select('id, user_id, name, description, icon, color, category, target_type, target_value, target_period, target_unit, frequency_per_week, reminder_time, xp_per_completion, display_order, is_active, created_at, updated_at')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('display_order'),
    supabase
      .from('habit_logs')
      .select('habit_id, logged_date')
      .eq('user_id', user.id)
      .eq('logged_date', today),
    supabase
      .from('habit_logs')
      .select('habit_id, logged_date')
      .eq('user_id', user.id)
      .gte('logged_date', sevenDaysAgo),
    supabase
      .from('habit_logs')
      .select('habit_id, logged_date')
      .eq('user_id', user.id)
      .gte('logged_date', thirtyDaysAgo),
    supabase
      .from('xp_transactions')
      .select('amount')
      .eq('user_id', user.id)
      .eq('source_type', 'habit')
      .gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString()),
    supabase
      .from('profiles')
      .select('streak_current, perfect_days')
      .eq('id', user.id)
      .single(),
  ])

  const habits = habitsRes.data ?? []
  const monthLogs = monthLogsRes.data ?? []
  const weekLogs = weekLogsRes.data ?? []

  // Stats
  const loggedTodayCount = (logsRes.data ?? []).length
  const totalHabits = habits.length
  const todayCompletionRate = totalHabits > 0 ? Math.round((loggedTodayCount / totalHabits) * 100) : 0

  // Week completion
  const weekSlots = totalHabits * 7
  const weekLogged = weekLogs.length
  const weekRate = weekSlots > 0 ? Math.round((weekLogged / weekSlots) * 100) : 0

  // Total XP from habits (last 30 days)
  const xpLast30 = (xpFromHabitsRes.data ?? []).reduce((s, t) => s + (t.amount ?? 0), 0)

  // Perfect days count (month)
  const dayMap = new Map<string, Set<string>>()
  for (const log of monthLogs) {
    if (!dayMap.has(log.logged_date)) dayMap.set(log.logged_date, new Set())
    dayMap.get(log.logged_date)!.add(log.habit_id)
  }
  const perfectDaysMonth = totalHabits > 0
    ? Array.from(dayMap.values()).filter((s) => habits.every((h) => s.has(h.id))).length
    : 0

  const profile = profileRes.data

  return (
    <AppShell>
      <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="heading-display text-4xl">Hábitos</h1>
            <p className="text-text-secondary">
              {totalHabits > 0
                ? `${loggedTodayCount}/${totalHabits} completos hoje · ${weekRate}% essa semana`
                : 'Sua rotina vira sua identidade.'}
            </p>
          </div>
        </div>

        {/* Stats cards — só quando tem hábitos */}
        {totalHabits > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-1">
                <Target size={14} className="text-brand-orange" />
                <span className="text-xs text-text-muted uppercase">Hoje</span>
              </div>
              <div className="heading-display text-2xl text-brand-orange">{todayCompletionRate}%</div>
              <div className="text-xs text-text-secondary mt-0.5">
                {loggedTodayCount}/{totalHabits} hábitos
              </div>
              {/* Mini progress bar */}
              <div className="mt-2 h-1.5 bg-bg-elevated rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-orange transition-all"
                  style={{ width: `${todayCompletionRate}%` }}
                />
              </div>
            </div>

            <div className="card p-4">
              <div className="flex items-center gap-2 mb-1">
                <Calendar size={14} className="text-brand-purple" />
                <span className="text-xs text-text-muted uppercase">Semana</span>
              </div>
              <div className="heading-display text-2xl text-brand-purple">{weekRate}%</div>
              <div className="text-xs text-text-secondary mt-0.5">taxa de conclusão</div>
              <div className="mt-2 h-1.5 bg-bg-elevated rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-purple transition-all"
                  style={{ width: `${weekRate}%` }}
                />
              </div>
            </div>

            <div className="card p-4">
              <div className="flex items-center gap-2 mb-1">
                <Flame size={14} className="text-brand-red" />
                <span className="text-xs text-text-muted uppercase">Streak</span>
              </div>
              <div className="heading-display text-2xl text-brand-red">
                {profile?.streak_current ?? 0}
              </div>
              <div className="text-xs text-text-secondary mt-0.5">dias em sequência</div>
            </div>

            <div className="card p-4">
              <div className="flex items-center gap-2 mb-1">
                <Zap size={14} className="text-brand-gold" />
                <span className="text-xs text-text-muted uppercase">XP (30d)</span>
              </div>
              <div className="heading-display text-2xl text-brand-gold">
                +{xpLast30.toLocaleString('pt-BR')}
              </div>
              <div className="text-xs text-text-secondary mt-0.5">
                {perfectDaysMonth} dias perfeitos
              </div>
            </div>
          </div>
        )}

        <HabitsList
          habits={habits}
          loggedToday={new Set((logsRes.data ?? []).map((l) => l.habit_id))}
          weekLogs={monthLogs}
          initialShowCreate={openNew === '1'}
        />
      </div>
    </AppShell>
  )
}
