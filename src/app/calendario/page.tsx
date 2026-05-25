import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components/layout/app-shell'
import { CalendarClient } from '@/components/calendario/calendar-client'

export const metadata: Metadata = {
  title: 'Calendário',
  description: 'Visualize seus eventos, tarefas com prazo e compromissos em um único calendário.',
}

export const dynamic = 'force-dynamic'

export default async function CalendarioPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  const start = new Date(year, month - 1, 1).toISOString()
  const end = new Date(year, month, 0, 23, 59, 59).toISOString()

  const [eventsRes, tasksRes, integrationRes] = await Promise.all([
    supabase
      .from('calendar_events')
      .select('id, title, start_at, end_at, source, color')
      .eq('user_id', user.id)
      .gte('start_at', start)
      .lte('start_at', end)
      .order('start_at'),
    supabase
      .from('tasks')
      .select('id, title, due_date, urgent, important, status')
      .eq('user_id', user.id)
      .not('due_date', 'is', null)
      .gte('due_date', start)
      .lte('due_date', end)
      .neq('status', 'archived')
      .order('due_date'),
    supabase
      .from('calendar_integrations')
      .select('provider, is_active')
      .eq('user_id', user.id)
      .maybeSingle(),
  ])

  const hasIntegration = integrationRes.data?.is_active === true

  return (
    <AppShell>
      <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="heading-display text-4xl">Calendário</h1>
            <p className="text-text-secondary">
              Tarefas com prazo e eventos em uma visão mensal.
            </p>
          </div>
          {!hasIntegration && (
            <button className="btn-ghost text-sm opacity-50 cursor-not-allowed" disabled>
              🔗 Conectar Google Agenda (em breve)
            </button>
          )}
        </div>

        {/* Calendar grid */}
        <CalendarClient
          initialYear={year}
          initialMonth={month}
          initialEvents={eventsRes.data ?? []}
          initialTasks={tasksRes.data ?? []}
        />
      </div>
    </AppShell>
  )
}
