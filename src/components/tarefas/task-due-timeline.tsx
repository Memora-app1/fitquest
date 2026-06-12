import { createClient } from '@/lib/supabase/server';
import { CalendarClock, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

interface TaskRow {
  id: string;
  title: string;
  status: string;
  urgent: boolean;
  important: boolean;
  due_date: string;
  xp_reward: number;
}

interface TimelineBucket {
  key: string;
  label: string;
  tasks: TaskRow[];
  isOverdue: boolean;
  isToday: boolean;
  isTomorrow: boolean;
}

function daysUntil(dateStr: string, todayStr: string): number {
  const ms = new Date(dateStr + 'T12:00:00').getTime() - new Date(todayStr + 'T12:00:00').getTime();
  return Math.round(ms / 86400000);
}

function urgencyColor(
  days: number,
  isOverdue: boolean
): { color: string; bg: string; border: string } {
  if (isOverdue)
    return { color: '#EF4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)' };
  if (days === 0)
    return { color: '#F5C842', bg: 'rgba(245,200,66,0.08)', border: 'rgba(245,200,66,0.2)' };
  if (days <= 3)
    return { color: '#FF4D00', bg: 'rgba(255,77,0,0.07)', border: 'rgba(255,77,0,0.18)' };
  if (days <= 7)
    return { color: '#7C3AED', bg: 'rgba(124,58,237,0.07)', border: 'rgba(124,58,237,0.16)' };
  return { color: '#5A6B8A', bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.07)' };
}

export async function TaskDueTimeline({ userId }: { userId: string }) {
  const supabase = await createClient();

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0]!;

  // Fetch tasks with due dates (past 7 days overdue + next 30 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]!;
  const thirtyDaysOut = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]!;

  const { data: raw } = await supabase
    .from('tasks')
    .select('id, title, status, urgent, important, due_date, xp_reward')
    .eq('user_id', userId)
    .not('status', 'eq', 'archived')
    .not('status', 'eq', 'done')
    .not('due_date', 'is', null)
    .gte('due_date', sevenDaysAgo)
    .lte('due_date', thirtyDaysOut)
    .order('due_date', { ascending: true });

  const tasks = (raw ?? []) as TaskRow[];
  if (tasks.length === 0) return null;

  // Group tasks into timeline buckets
  const buckets = new Map<string, TimelineBucket>();

  for (const task of tasks) {
    const days = daysUntil(task.due_date, todayStr);
    const isOverdue = days < 0;
    const isToday = days === 0;
    const isTomorrow = days === 1;

    let key: string;
    let label: string;

    if (isOverdue) {
      key = '__overdue__';
      label = 'Atrasadas';
    } else if (isToday) {
      key = '__today__';
      label = 'Hoje';
    } else if (isTomorrow) {
      key = '__tomorrow__';
      label = 'Amanhã';
    } else if (days <= 7) {
      key = `week_${days}`;
      const d = new Date(task.due_date + 'T12:00:00');
      label = d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' });
    } else {
      // Group by week for distant dates
      const weekKey = Math.floor(days / 7);
      key = `future_${weekKey}`;
      const startDays = weekKey * 7;
      const endDays = Math.min((weekKey + 1) * 7 - 1, 30);
      label = `Em ${startDays}–${endDays} dias`;
    }

    if (!buckets.has(key)) {
      buckets.set(key, {
        key,
        label,
        tasks: [],
        isOverdue: key === '__overdue__',
        isToday: key === '__today__',
        isTomorrow: key === '__tomorrow__',
      });
    }
    buckets.get(key)!.tasks.push(task);
  }

  // Order buckets: overdue first, then today, tomorrow, then by day
  const orderedBuckets = Array.from(buckets.values()).sort((a, b) => {
    const order: Record<string, number> = { __overdue__: -1, __today__: 0, __tomorrow__: 1 };
    const ao = order[a.key] ?? parseInt(a.key.replace(/\D/g, '') || '99');
    const bo = order[b.key] ?? parseInt(b.key.replace(/\D/g, '') || '99');
    return ao - bo;
  });

  const overdueCount = orderedBuckets.find((b) => b.isOverdue)?.tasks.length ?? 0;
  const todayCount = orderedBuckets.find((b) => b.isToday)?.tasks.length ?? 0;
  const totalUpcoming = tasks.length;

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-5 md:p-6"
      style={{
        background:
          'linear-gradient(135deg, rgba(245,200,66,0.05) 0%, rgba(13,24,41,0.98) 60%, rgba(124,58,237,0.04) 100%)',
        border: '1px solid rgba(245,200,66,0.12)',
      }}
    >
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full blur-3xl"
        style={{ background: 'rgba(245,200,66,0.05)' }}
      />

      <div className="relative z-10 space-y-5">
        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <div
                className="flex h-6 w-6 items-center justify-center rounded-lg"
                style={{
                  background: 'rgba(245,200,66,0.12)',
                  border: '1px solid rgba(245,200,66,0.22)',
                }}
              >
                <CalendarClock size={12} style={{ color: '#F5C842' }} />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-text-muted">
                Próximos Prazos
              </span>
            </div>
            <h2 className="text-xl font-black leading-tight">Timeline — 30 dias</h2>
            <p className="mt-0.5 text-sm text-text-muted">
              {totalUpcoming} tarefa{totalUpcoming !== 1 ? 's' : ''} com prazo
              {overdueCount > 0 && ` · ${overdueCount} atrasada${overdueCount !== 1 ? 's' : ''}`}
            </p>
          </div>

          {/* Alert badges */}
          <div className="flex flex-col items-end gap-1">
            {overdueCount > 0 && (
              <div
                className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold"
                style={{
                  background: 'rgba(239,68,68,0.12)',
                  border: '1px solid rgba(239,68,68,0.25)',
                  color: '#EF4444',
                }}
              >
                <AlertTriangle size={11} />
                {overdueCount} atrasada{overdueCount !== 1 ? 's' : ''}
              </div>
            )}
            {todayCount > 0 && (
              <div
                className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold"
                style={{
                  background: 'rgba(245,200,66,0.12)',
                  border: '1px solid rgba(245,200,66,0.25)',
                  color: '#F5C842',
                }}
              >
                <Clock size={11} />
                {todayCount} hoje
              </div>
            )}
          </div>
        </div>

        {/* ── Timeline ────────────────────────────────────────────────── */}
        <div className="space-y-4">
          {orderedBuckets.map((bucket, bi) => {
            // Use first task's due_date to compute days
            const sampleDate = bucket.tasks[0]?.due_date ?? todayStr;
            const days = daysUntil(sampleDate, todayStr);
            const urg = urgencyColor(
              bucket.isOverdue ? -1 : bucket.isToday ? 0 : bucket.isTomorrow ? 1 : days,
              bucket.isOverdue
            );

            return (
              <div key={bucket.key} className="space-y-2">
                {/* Bucket header */}
                <div className="flex items-center gap-2">
                  <div className="h-px flex-1" style={{ background: urg.border }} />
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                    style={{
                      background: urg.bg,
                      color: urg.color,
                      border: `1px solid ${urg.border}`,
                    }}
                  >
                    {bucket.label}
                    {bucket.tasks.length > 1 && ` (${bucket.tasks.length})`}
                  </span>
                  <div className="h-px flex-1" style={{ background: urg.border }} />
                </div>

                {/* Tasks in this bucket */}
                <div className="space-y-1.5">
                  {bucket.tasks.map((task) => {
                    const taskDays = daysUntil(task.due_date, todayStr);
                    const taskUrg = urgencyColor(
                      bucket.isOverdue ? -1 : taskDays,
                      bucket.isOverdue
                    );
                    const isUrgImportant = task.urgent && task.important;

                    return (
                      <div
                        key={task.id}
                        className="flex items-center gap-2.5 rounded-xl px-3 py-2.5"
                        style={{
                          background: taskUrg.bg,
                          border: `1px solid ${taskUrg.border}`,
                        }}
                      >
                        {/* Status indicator */}
                        <div className="shrink-0">
                          {isUrgImportant ? (
                            <AlertTriangle size={12} style={{ color: taskUrg.color }} />
                          ) : (
                            <CheckCircle2 size={12} style={{ color: 'rgba(136,153,187,0.4)' }} />
                          )}
                        </div>

                        {/* Task name */}
                        <span className="flex-1 truncate text-sm font-medium">{task.title}</span>

                        {/* Badges */}
                        <div className="flex shrink-0 items-center gap-1.5">
                          {isUrgImportant && (
                            <span
                              className="rounded-full px-1.5 py-0.5 text-[9px] font-bold"
                              style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444' }}
                            >
                              🚨 Q1
                            </span>
                          )}
                          {task.urgent && !task.important && (
                            <span
                              className="rounded-full px-1.5 py-0.5 text-[9px] font-bold"
                              style={{ background: 'rgba(255,77,0,0.15)', color: '#FF4D00' }}
                            >
                              ⚡ Urgente
                            </span>
                          )}
                          {!task.urgent && task.important && (
                            <span
                              className="rounded-full px-1.5 py-0.5 text-[9px] font-bold"
                              style={{ background: 'rgba(0,255,136,0.12)', color: '#00FF88' }}
                            >
                              🎯 Importante
                            </span>
                          )}
                          {task.xp_reward > 0 && (
                            <span className="text-[9px] font-bold" style={{ color: '#F5C842' }}>
                              +{task.xp_reward}xp
                            </span>
                          )}
                          {bucket.isOverdue && (
                            <span className="text-[9px] font-bold" style={{ color: '#EF4444' }}>
                              {Math.abs(taskDays)}d atrás
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Insight footer ───────────────────────────────────────────── */}
        <div
          className="flex items-center gap-3 rounded-xl px-4 py-3"
          style={{
            background: overdueCount > 0 ? 'rgba(239,68,68,0.05)' : 'rgba(245,200,66,0.04)',
            border:
              overdueCount > 0 ? '1px solid rgba(239,68,68,0.1)' : '1px solid rgba(245,200,66,0.1)',
          }}
        >
          <span className="shrink-0 text-lg">
            {overdueCount > 3 ? '🚨' : overdueCount > 0 ? '⚠️' : todayCount > 0 ? '📅' : '✅'}
          </span>
          <p className="text-xs text-text-muted">
            {overdueCount > 3
              ? `${overdueCount} tarefas atrasadas precisam de atenção imediata.`
              : overdueCount > 0
                ? `${overdueCount} tarefa${overdueCount !== 1 ? 's' : ''} atrasada${overdueCount !== 1 ? 's' : ''}. Conclua primeiro para limpar o backlog.`
                : todayCount > 0
                  ? `${todayCount} tarefa${todayCount !== 1 ? 's' : ''} vencem hoje. Foque nelas primeiro!`
                  : `Nenhuma tarefa atrasada. ${totalUpcoming} tarefas agendadas nos próximos dias.`}
          </p>
        </div>
      </div>
    </div>
  );
}
