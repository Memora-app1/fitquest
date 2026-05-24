import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components/layout/app-shell'

export const metadata: Metadata = {
  title: 'Calendário',
  description: 'Visualize seus eventos, tarefas com prazo e compromissos em um único calendário.',
}

export const dynamic = 'force-dynamic'

export default async function CalendarioPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const today = new Date()
  const next30 = new Date()
  next30.setDate(today.getDate() + 30)

  const [eventsRes, tasksRes, integrationRes] = await Promise.all([
    supabase
      .from('calendar_events')
      .select('id, title, start_at, end_at, source, color')
      .eq('user_id', user.id)
      .gte('start_at', today.toISOString())
      .lte('start_at', next30.toISOString())
      .order('start_at'),
    supabase
      .from('tasks')
      .select('id, title, due_date, urgent, important')
      .eq('user_id', user.id)
      .not('due_date', 'is', null)
      .gte('due_date', today.toISOString())
      .lte('due_date', next30.toISOString())
      .order('due_date'),
    supabase.from('calendar_integrations').select('provider, is_active').eq('user_id', user.id).maybeSingle(),
  ])

  const events = eventsRes.data ?? []
  const tasks = tasksRes.data ?? []

  // Combinar e ordenar
  type Item = { type: 'event' | 'task'; date: string; title: string; meta?: string }
  const items: Item[] = [
    ...events.map((e) => ({ type: 'event' as const, date: e.start_at, title: e.title, meta: e.source })),
    ...tasks.map((t) => ({ type: 'task' as const, date: t.due_date!, title: t.title })),
  ].sort((a, b) => a.date.localeCompare(b.date))

  // Agrupar por dia
  const byDay = items.reduce((acc, item) => {
    const day = item.date.split('T')[0]!
    if (!acc[day]) acc[day] = []
    acc[day]!.push(item)
    return acc
  }, {} as Record<string, Item[]>)

  return (
    <AppShell>
      <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="heading-display text-4xl">Calendário</h1>
            <p className="text-text-secondary">Tarefas, treinos e compromissos em um só lugar.</p>
          </div>
          {!integrationRes.data?.is_active && (
            <button className="btn-ghost text-sm" disabled>
              🔗 Conectar Google Agenda (em breve)
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="text-4xl mb-3">📅</div>
            <h3 className="text-xl font-bold mb-1">Nada agendado</h3>
            <p className="text-text-secondary">
              Crie tarefas com data ou conecte sua agenda do Google
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(byDay).map(([day, dayItems]) => (
              <div key={day} className="card p-4">
                <div className="text-sm text-text-muted uppercase mb-3">
                  {new Date(day + 'T00:00:00').toLocaleDateString('pt-BR', {
                    weekday: 'long',
                    day: '2-digit',
                    month: 'long',
                  })}
                </div>
                <div className="space-y-2">
                  {dayItems.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3 bg-bg-elevated rounded-xl border border-border"
                    >
                      <div className="text-xl">{item.type === 'event' ? '📅' : '✅'}</div>
                      <div className="flex-1">
                        <div className="font-medium">{item.title}</div>
                        <div className="text-xs text-text-muted">
                          {new Date(item.date).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                          {item.meta && ` · ${item.meta}`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
