import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { CalendarClient } from '@/components/calendario/calendar-client';
import { CalendarDays } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Calendário',
  description: 'Visualize seus eventos, tarefas com prazo e compromissos em um único calendário.',
};

export const dynamic = 'force-dynamic';

export default async function CalendarioPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const start = new Date(year, month - 1, 1).toISOString();
  const end = new Date(year, month, 0, 23, 59, 59).toISOString();

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
  ]);

  const hasIntegration = integrationRes.data?.is_active === true;

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
        {/* Header */}
        <div
          className="relative overflow-hidden rounded-2xl p-6"
          style={{
            background:
              'linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(13,24,41,0.98) 60%, rgba(124,58,237,0.05) 100%)',
            border: '1px solid rgba(59,130,246,0.2)',
          }}
        >
          <div
            className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)',
            }}
          />
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="heading-display flex items-center gap-3 text-4xl md:text-5xl">
                <CalendarDays size={36} className="text-blue-400" />
                Calendário
              </h1>
              <p className="mt-1 text-text-secondary">
                {(eventsRes.data?.length ?? 0) + (tasksRes.data?.length ?? 0) > 0
                  ? `${tasksRes.data?.length ?? 0} tarefa${(tasksRes.data?.length ?? 0) !== 1 ? 's' : ''} com prazo este mês`
                  : 'Tarefas com prazo e eventos em uma visão mensal.'}
              </p>
            </div>
            {!hasIntegration && (
              <button className="btn-ghost cursor-not-allowed text-sm opacity-50" disabled>
                🔗 Google Agenda (em breve)
              </button>
            )}
          </div>
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
  );
}
