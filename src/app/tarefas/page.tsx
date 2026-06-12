import type { Metadata } from 'next';
import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { KanbanBoard } from '@/components/tarefas/kanban-board';
import { TaskVelocity } from '@/components/tarefas/task-velocity';
import { TaskListsBreakdown } from '@/components/tarefas/task-lists-breakdown';
import { TaskDueTimeline } from '@/components/tarefas/task-due-timeline';
import { TaskProductivityScore } from '@/components/tarefas/task-productivity-score';
import { TaskListProgressRings } from '@/components/tarefas/task-list-progress-rings';
import { EisenhowerInsights } from '@/components/tarefas/eisenhower-insights';
import { TaskDueDateHeatmap } from '@/components/tarefas/task-due-date-heatmap';
import Link from 'next/link';
import { CheckSquare, Clock, AlertCircle, Zap, LayoutGrid, Trophy, Flame } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Tarefas',
  description: 'Organize suas tarefas com Kanban e Matriz Eisenhower. Foque no que importa.',
};

export const dynamic = 'force-dynamic';

export default async function TarefasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const today = new Date().toISOString().split('T')[0]!;

  const [tasksRes, doneWeekRes, xpWeekRes, doneAllTimeRes, listsRes] = await Promise.all([
    supabase
      .from('tasks')
      .select(
        'id, user_id, list_id, title, description, status, display_order, urgent, important, due_date, reminder_at, estimated_minutes, completed_at, google_event_id, recurrence_rule, parent_task_id, xp_reward, created_at, updated_at'
      )
      .eq('user_id', user.id)
      .not('status', 'eq', 'archived')
      .order('display_order')
      .order('created_at', { ascending: false }),
    supabase
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'done')
      .gte('completed_at', sevenDaysAgo),
    supabase
      .from('xp_transactions')
      .select('amount')
      .eq('user_id', user.id)
      .eq('source_type', 'task')
      .gte('created_at', sevenDaysAgo),
    supabase
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'done'),
    supabase
      .from('task_lists')
      .select('id, name, color, icon')
      .eq('user_id', user.id)
      .order('display_order'),
  ]);

  const tasks = tasksRes.data ?? [];
  const taskLists = listsRes.data ?? [];
  const doneThisWeek = doneWeekRes.count ?? 0;
  const doneAllTime = doneAllTimeRes.count ?? 0;
  const xpFromTasksWeek = (xpWeekRes.data ?? []).reduce((sum, t) => sum + (t.amount ?? 0), 0);

  const todo = tasks.filter((t) => t.status === 'todo').length;
  const doing = tasks.filter((t) => t.status === 'doing').length;
  const criticalTasks = tasks.filter((t) => t.urgent && t.important && t.status !== 'done').length;
  const overdue = tasks.filter((t) => {
    if (!t.due_date || t.status === 'done') return false;
    return new Date(t.due_date).toISOString().split('T')[0]! < today;
  }).length;

  const totalActive = todo + doing;
  const completionPct =
    tasks.length > 0 ? Math.round((doneAllTime / (doneAllTime + totalActive)) * 100) : 0;

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-8">
        {/* ── Hero Header ─────────────────────────────────────────────── */}
        <div
          className="relative overflow-hidden rounded-2xl p-6"
          style={{
            background:
              'linear-gradient(135deg, rgba(124,58,237,0.08) 0%, rgba(13,24,41,0.98) 60%, rgba(255,77,0,0.05) 100%)',
            border: '1px solid rgba(124,58,237,0.2)',
          }}
        >
          <div
            className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)',
            }}
          />
          <div
            className="pointer-events-none absolute -bottom-8 -left-8 h-32 w-32 rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(255,77,0,0.08) 0%, transparent 70%)',
            }}
          />

          <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="heading-display text-4xl md:text-5xl">Tarefas</h1>
              <p className="mt-1 text-text-secondary">
                {totalActive > 0
                  ? `${doing} em andamento · ${todo} a fazer`
                  : 'Tudo feito — você é imparável. 🎉'}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/tarefas"
                className="btn-ghost flex items-center gap-1.5 text-sm"
                style={{
                  background: 'rgba(124,58,237,0.15)',
                  color: '#7C3AED',
                  borderColor: 'rgba(124,58,237,0.4)',
                }}
              >
                <LayoutGrid size={14} /> Kanban
              </Link>
              <Link
                href="/tarefas/eisenhower"
                className="btn-ghost flex items-center gap-1.5 text-sm"
              >
                🎯 Eisenhower
              </Link>
            </div>
          </div>
        </div>

        {/* ── Stats ───────────────────────────────────────────────────── */}
        {tasks.length > 0 && (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {/* Done this week */}
            <div
              className="relative overflow-hidden rounded-2xl p-4"
              style={{
                background:
                  'linear-gradient(135deg, rgba(0,255,136,0.08) 0%, rgba(13,24,41,0.98) 100%)',
                border: '1px solid rgba(0,255,136,0.2)',
              }}
            >
              <div
                className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full blur-xl"
                style={{ background: 'rgba(0,255,136,0.2)' }}
              />
              <div className="relative z-10">
                <div className="mb-2 flex items-center gap-2">
                  <CheckSquare size={13} className="text-brand-green" />
                  <span className="text-xs uppercase tracking-wider text-text-muted">
                    Concluídas (7d)
                  </span>
                </div>
                <div className="heading-display text-3xl text-brand-green">{doneThisWeek}</div>
                <div className="mt-1 text-xs text-text-muted">{doneAllTime} total concluídas</div>
              </div>
            </div>

            {/* XP from tasks */}
            <div
              className="relative overflow-hidden rounded-2xl p-4"
              style={{
                background:
                  'linear-gradient(135deg, rgba(245,200,66,0.08) 0%, rgba(13,24,41,0.98) 100%)',
                border: '1px solid rgba(245,200,66,0.2)',
              }}
            >
              <div
                className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full blur-xl"
                style={{ background: 'rgba(245,200,66,0.2)' }}
              />
              <div className="relative z-10">
                <div className="mb-2 flex items-center gap-2">
                  <Zap size={13} className="text-brand-gold" fill="currentColor" />
                  <span className="text-xs uppercase tracking-wider text-text-muted">
                    XP (7 dias)
                  </span>
                </div>
                <div className="heading-display text-3xl text-brand-gold">
                  +{xpFromTasksWeek.toLocaleString('pt-BR')}
                </div>
                <div className="mt-1 text-xs text-text-muted">de tarefas completadas</div>
              </div>
            </div>

            {/* In progress */}
            <div
              className="relative overflow-hidden rounded-2xl p-4"
              style={{
                background:
                  'linear-gradient(135deg, rgba(124,58,237,0.08) 0%, rgba(13,24,41,0.98) 100%)',
                border: '1px solid rgba(124,58,237,0.2)',
              }}
            >
              <div
                className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full blur-xl"
                style={{ background: 'rgba(124,58,237,0.2)' }}
              />
              <div className="relative z-10">
                <div className="mb-2 flex items-center gap-2">
                  <Clock size={13} className="text-brand-purple" />
                  <span className="text-xs uppercase tracking-wider text-text-muted">
                    Em andamento
                  </span>
                </div>
                <div className="heading-display text-3xl text-brand-purple">{doing}</div>
                <div className="mt-1 text-xs text-text-muted">{todo} aguardando</div>
              </div>
            </div>

            {/* Overdue / critical */}
            <div
              className="relative overflow-hidden rounded-2xl p-4"
              style={{
                background:
                  overdue > 0 || criticalTasks > 0
                    ? 'linear-gradient(135deg, rgba(255,77,0,0.08) 0%, rgba(13,24,41,0.98) 100%)'
                    : 'linear-gradient(135deg, rgba(0,255,136,0.05) 0%, rgba(13,24,41,0.98) 100%)',
                border:
                  overdue > 0 || criticalTasks > 0
                    ? '1px solid rgba(255,77,0,0.3)'
                    : '1px solid rgba(0,255,136,0.15)',
              }}
            >
              <div
                className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full blur-xl"
                style={{
                  background:
                    overdue > 0 || criticalTasks > 0 ? 'rgba(255,77,0,0.2)' : 'rgba(0,255,136,0.1)',
                }}
              />
              <div className="relative z-10">
                <div className="mb-2 flex items-center gap-2">
                  <AlertCircle
                    size={13}
                    className={
                      overdue > 0
                        ? 'text-brand-red'
                        : criticalTasks > 0
                          ? 'text-brand-red'
                          : 'text-brand-green'
                    }
                  />
                  <span className="text-xs uppercase tracking-wider text-text-muted">
                    {overdue > 0 ? 'Atrasadas' : criticalTasks > 0 ? 'Críticas' : 'Prioridade'}
                  </span>
                </div>
                <div
                  className={`heading-display text-3xl ${
                    overdue > 0 || criticalTasks > 0 ? 'text-brand-red' : 'text-brand-green'
                  }`}
                >
                  {overdue > 0 ? overdue : criticalTasks > 0 ? criticalTasks : 0}
                </div>
                <div className="mt-1 text-xs text-text-muted">
                  {overdue > 0
                    ? 'com prazo vencido'
                    : criticalTasks > 0
                      ? 'urgente + importante'
                      : '✅ Nenhuma crítica'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Completion progress bar (only if has tasks) ──────────────── */}
        {tasks.length > 0 && (
          <div
            className="flex items-center gap-4 rounded-2xl px-5 py-4"
            style={{
              background: 'rgba(13,24,41,0.6)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div className="flex shrink-0 items-center gap-2">
              <Trophy size={16} className="text-brand-gold" />
              <span className="text-sm font-semibold text-text-secondary">Progresso geral</span>
            </div>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-bg-elevated">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${completionPct}%`,
                  background:
                    completionPct >= 80
                      ? 'linear-gradient(90deg, #00FF88, #00CC6A)'
                      : completionPct >= 50
                        ? 'linear-gradient(90deg, #F5C842, #FF4D00)'
                        : 'linear-gradient(90deg, #7C3AED, #9F5AF7)',
                }}
              />
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              {completionPct >= 80 && <Flame size={14} className="text-brand-green" />}
              <span
                className="heading-display text-lg"
                style={{
                  color:
                    completionPct >= 80 ? '#00FF88' : completionPct >= 50 ? '#F5C842' : '#7C3AED',
                }}
              >
                {completionPct}%
              </span>
            </div>
          </div>
        )}

        {/* Heavy analytics — streamed independently */}
        <Suspense fallback={<div className="shimmer h-40 rounded-2xl" />}>
          <TaskListProgressRings userId={user.id} />
        </Suspense>
        <Suspense fallback={<div className="shimmer h-48 rounded-2xl" />}>
          <TaskProductivityScore userId={user.id} />
        </Suspense>
        <Suspense fallback={<div className="shimmer h-48 rounded-2xl" />}>
          <TaskVelocity userId={user.id} />
        </Suspense>
        <Suspense fallback={<div className="shimmer h-48 rounded-2xl" />}>
          <TaskListsBreakdown userId={user.id} />
        </Suspense>
        <Suspense fallback={<div className="shimmer h-40 rounded-2xl" />}>
          <TaskDueTimeline userId={user.id} />
        </Suspense>
        <Suspense fallback={<div className="shimmer h-48 rounded-2xl" />}>
          <EisenhowerInsights userId={user.id} />
        </Suspense>
        <Suspense fallback={<div className="shimmer h-40 rounded-2xl" />}>
          <TaskDueDateHeatmap userId={user.id} />
        </Suspense>

        <KanbanBoard initialTasks={tasks} initialLists={taskLists} />
      </div>
    </AppShell>
  );
}
