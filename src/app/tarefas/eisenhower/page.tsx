import type { Metadata } from 'next';
import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import Link from 'next/link';
import { EisenhowerBoard } from '@/components/tarefas/eisenhower-board';
import { EisenhowerInsights } from '@/components/tarefas/eisenhower-insights';
import { TaskDueDateHeatmap } from '@/components/tarefas/task-due-date-heatmap';
import { LayoutGrid } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Matriz Eisenhower',
  description: 'Priorize suas tarefas pela Matriz Eisenhower — urgente vs importante.',
};

export const dynamic = 'force-dynamic';

export default async function EisenhowerPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: tasks } = await supabase
    .from('tasks')
    .select('id, title, urgent, important, status, xp_reward, due_date')
    .eq('user_id', user.id)
    .not('status', 'eq', 'archived')
    .order('created_at', { ascending: false });

  const activeTasks = (tasks ?? []).filter((t) => t.status !== 'done');
  const doneTasks = (tasks ?? []).filter((t) => t.status === 'done');

  const urgentImportant = activeTasks.filter((t) => t.urgent && t.important).length;
  const importantOnly = activeTasks.filter((t) => !t.urgent && t.important).length;
  const urgentOnly = activeTasks.filter((t) => t.urgent && !t.important).length;
  const neither = activeTasks.filter((t) => !t.urgent && !t.important).length;

  const quadrants: {
    count: number;
    label: string;
    sublabel: string;
    color: string;
    glow: string;
    border: string;
    action: string;
  }[] = [
    {
      count: urgentImportant,
      label: 'Fazer agora',
      sublabel: 'Urgente + Importante',
      action: '🔴 Faça você mesmo',
      color: '#EF4444',
      glow: 'rgba(239,68,68,0.15)',
      border: 'rgba(239,68,68,0.3)',
    },
    {
      count: importantOnly,
      label: 'Agendar',
      sublabel: 'Importante, não urgente',
      action: '🟢 Agende para depois',
      color: '#00FF88',
      glow: 'rgba(0,255,136,0.12)',
      border: 'rgba(0,255,136,0.3)',
    },
    {
      count: urgentOnly,
      label: 'Delegar',
      sublabel: 'Urgente, não importante',
      action: '🟡 Delegue se possível',
      color: '#F5C842',
      glow: 'rgba(245,200,66,0.15)',
      border: 'rgba(245,200,66,0.3)',
    },
    {
      count: neither,
      label: 'Eliminar',
      sublabel: 'Nem urgente, nem importante',
      action: '⚪ Considere eliminar',
      color: '#8899BB',
      glow: 'rgba(136,153,187,0.1)',
      border: 'rgba(136,153,187,0.2)',
    },
  ];

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-8">
        {/* ── Header ──────────────────────────────────────────────────── */}
        <div
          className="relative overflow-hidden rounded-2xl p-6"
          style={{
            background:
              'linear-gradient(135deg, rgba(255,77,0,0.07) 0%, rgba(13,24,41,0.98) 60%, rgba(124,58,237,0.05) 100%)',
            border: '1px solid rgba(255,77,0,0.2)',
          }}
        >
          <div
            className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(255,77,0,0.1) 0%, transparent 70%)',
            }}
          />
          <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="heading-display text-4xl md:text-5xl">Matriz Eisenhower</h1>
              <p className="mt-1 text-text-secondary">Separe o urgente do que realmente importa.</p>
            </div>
            <div className="flex gap-2">
              <Link href="/tarefas" className="btn-ghost flex items-center gap-1.5 text-sm">
                <LayoutGrid size={14} /> Kanban
              </Link>
              <Link
                href="/tarefas/eisenhower"
                className="btn-ghost flex items-center gap-1.5 text-sm"
                style={{
                  background: 'rgba(255,77,0,0.15)',
                  color: '#FF4D00',
                  borderColor: 'rgba(255,77,0,0.4)',
                }}
              >
                🎯 Eisenhower
              </Link>
            </div>
          </div>
        </div>

        {/* ── Quadrant stats ──────────────────────────────────────────── */}
        {activeTasks.length > 0 && (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {quadrants.map((q) => (
              <div
                key={q.label}
                className="relative overflow-hidden rounded-2xl p-4"
                style={{
                  background: `linear-gradient(135deg, ${q.glow.replace(')', ', 0.5)').replace('rgba(', 'rgba(')} 0%, rgba(13,24,41,0.98) 100%)`,
                  border: `1px solid ${q.border}`,
                }}
              >
                <div
                  className="pointer-events-none absolute -right-4 -top-4 h-14 w-14 rounded-full blur-lg"
                  style={{ backgroundColor: q.color, opacity: 0.15 }}
                />
                <div className="relative z-10">
                  <div className="heading-display mb-1 text-3xl" style={{ color: q.color }}>
                    {q.count}
                  </div>
                  <div className="text-sm font-semibold">{q.label}</div>
                  <div className="mt-0.5 text-[10px] text-text-muted">{q.sublabel}</div>
                  <div className="mt-2 text-[10px] text-text-muted opacity-70">{q.action}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        <Suspense fallback={<div className="shimmer h-40 rounded-2xl" />}>
          <TaskDueDateHeatmap userId={user.id} />
        </Suspense>
        <Suspense fallback={<div className="shimmer h-48 rounded-2xl" />}>
          <EisenhowerInsights userId={user.id} />
        </Suspense>

        {/* ── Board ───────────────────────────────────────────────────── */}
        <EisenhowerBoard initialTasks={[...activeTasks, ...doneTasks]} />
      </div>
    </AppShell>
  );
}
