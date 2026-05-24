import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components/layout/app-shell'
import { todayString } from '@/lib/utils'
import { HabitsList } from '@/components/habitos/habits-list'

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

  const [habitsRes, logsRes, weekLogsRes] = await Promise.all([
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
      .gte('logged_date', new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]),
  ])

  return (
    <AppShell>
      <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="heading-display text-4xl">Hábitos</h1>
            <p className="text-text-secondary">Sua rotina vira sua identidade.</p>
          </div>
        </div>

        <HabitsList
          habits={habitsRes.data ?? []}
          loggedToday={new Set((logsRes.data ?? []).map((l) => l.habit_id))}
          weekLogs={weekLogsRes.data ?? []}
          initialShowCreate={openNew === '1'}
        />
      </div>
    </AppShell>
  )
}
