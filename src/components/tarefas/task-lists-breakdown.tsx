import { createClient } from '@/lib/supabase/server';
import { Layers, CheckCircle2, Clock, AlertTriangle, Target } from 'lucide-react';

interface ListRow {
  id: string;
  name: string;
  color: string;
  icon: string | null;
}
interface TaskRow {
  id: string;
  list_id: string | null;
  status: string;
  urgent: boolean;
  important: boolean;
  due_date: string | null;
  completed_at: string | null;
  xp_reward: number;
}

interface ListStat {
  id: string;
  name: string;
  color: string;
  rgb: string;
  icon: string;
  total: number;
  done: number;
  inProgress: number;
  todo: number;
  overdue: number;
  dueToday: number;
  completionRate: number;
  xpEarned: number;
}

function hexToRgb(hex: string): string {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return '255,77,0';
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `${r},${g},${b}`;
}

export async function TaskListsBreakdown({ userId }: { userId: string }) {
  const supabase = await createClient();

  const todayStr = new Date().toISOString().split('T')[0]!;

  const [listsRes, tasksRes] = await Promise.all([
    supabase
      .from('task_lists')
      .select('id, name, color, icon')
      .eq('user_id', userId)
      .order('display_order'),
    supabase
      .from('tasks')
      .select('id, list_id, status, urgent, important, due_date, completed_at, xp_reward')
      .eq('user_id', userId)
      .not('status', 'eq', 'archived')
      .limit(2000),
  ]);

  const lists = (listsRes.data ?? []) as ListRow[];
  const tasks = (tasksRes.data ?? []) as TaskRow[];

  if (lists.length === 0 || tasks.length === 0) return null;

  // Build per-list stats
  const statsMap = new Map<string, ListStat>();

  // Initialize with all lists
  for (const list of lists) {
    statsMap.set(list.id, {
      id: list.id,
      name: list.name,
      color: list.color,
      rgb: hexToRgb(list.color),
      icon: list.icon ?? '📋',
      total: 0,
      done: 0,
      inProgress: 0,
      todo: 0,
      overdue: 0,
      dueToday: 0,
      completionRate: 0,
      xpEarned: 0,
    });
  }

  // Count no-list tasks separately
  const noListId = '__no_list__';
  const hasNoList = tasks.some((t) => !t.list_id);
  if (hasNoList) {
    statsMap.set(noListId, {
      id: noListId,
      name: 'Sem lista',
      color: '#5A6B8A',
      rgb: '90,107,138',
      icon: '📦',
      total: 0,
      done: 0,
      inProgress: 0,
      todo: 0,
      overdue: 0,
      dueToday: 0,
      completionRate: 0,
      xpEarned: 0,
    });
  }

  // Aggregate tasks into list stats
  for (const task of tasks) {
    const key = task.list_id ?? noListId;
    const stat = statsMap.get(key);
    if (!stat) continue;

    stat.total++;

    if (task.status === 'done') {
      stat.done++;
      stat.xpEarned += task.xp_reward ?? 0;
    } else if (task.status === 'in_progress') {
      stat.inProgress++;
    } else {
      stat.todo++;
    }

    if (task.due_date && task.status !== 'done') {
      if (task.due_date < todayStr) stat.overdue++;
      else if (task.due_date === todayStr) stat.dueToday++;
    }
  }

  // Compute completion rates
  for (const stat of statsMap.values()) {
    stat.completionRate = stat.total > 0 ? Math.round((stat.done / stat.total) * 100) : 0;
  }

  // Sort by total tasks desc, filter out empty
  const sortedStats = Array.from(statsMap.values())
    .filter((s) => s.total > 0)
    .sort((a, b) => b.total - a.total);

  if (sortedStats.length === 0) return null;

  const totalTasks = tasks.length;
  const totalDone = tasks.filter((t) => t.status === 'done').length;
  const totalOverdue = tasks.filter(
    (t) => t.due_date && t.due_date < todayStr && t.status !== 'done'
  ).length;
  const totalDueToday = tasks.filter((t) => t.due_date === todayStr && t.status !== 'done').length;
  const totalInProgress = tasks.filter((t) => t.status === 'in_progress').length;
  const overallRate = totalTasks > 0 ? Math.round((totalDone / totalTasks) * 100) : 0;
  const totalXpEarned = tasks
    .filter((t) => t.status === 'done')
    .reduce((s, t) => s + (t.xp_reward ?? 0), 0);

  // Urgent+Important count
  const criticalCount = tasks.filter((t) => t.urgent && t.important && t.status !== 'done').length;

  const maxTotal = sortedStats[0]?.total ?? 1;

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-5 md:p-6"
      style={{
        background:
          'linear-gradient(135deg, rgba(124,58,237,0.06) 0%, rgba(13,24,41,0.98) 60%, rgba(255,77,0,0.03) 100%)',
        border: '1px solid rgba(124,58,237,0.14)',
      }}
    >
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full blur-3xl"
        style={{ background: 'rgba(124,58,237,0.07)' }}
      />

      <div className="relative z-10 space-y-5">
        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <div
                className="flex h-6 w-6 items-center justify-center rounded-lg"
                style={{
                  background: 'rgba(124,58,237,0.12)',
                  border: '1px solid rgba(124,58,237,0.22)',
                }}
              >
                <Layers size={12} style={{ color: '#7C3AED' }} />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-text-muted">
                Por Lista
              </span>
            </div>
            <h2 className="text-xl font-black leading-tight">Visão por Lista</h2>
            <p className="mt-0.5 text-sm text-text-muted">
              {sortedStats.length} lista{sortedStats.length !== 1 ? 's' : ''} · {totalTasks} tarefa
              {totalTasks !== 1 ? 's' : ''} no total
            </p>
          </div>

          <div className="text-right">
            <div
              className="text-3xl font-black"
              style={{
                color: overallRate >= 70 ? '#00FF88' : overallRate >= 40 ? '#F5C842' : '#FF4D00',
              }}
            >
              {overallRate}%
            </div>
            <div className="text-[10px] uppercase tracking-wider text-text-muted">concluído</div>
          </div>
        </div>

        {/* ── Summary strip ───────────────────────────────────────────── */}
        <div className="grid grid-cols-4 gap-2">
          {[
            {
              icon: <CheckCircle2 size={11} />,
              label: 'Feitas',
              value: totalDone,
              color: '#00FF88',
              rgb: '0,255,136',
            },
            {
              icon: <Clock size={11} />,
              label: 'Em andamento',
              value: totalInProgress,
              color: '#7C3AED',
              rgb: '124,58,237',
            },
            {
              icon: <AlertTriangle size={11} />,
              label: 'Atrasadas',
              value: totalOverdue,
              color: '#EF4444',
              rgb: '239,68,68',
            },
            {
              icon: <Target size={11} />,
              label: 'Hoje',
              value: totalDueToday,
              color: '#F5C842',
              rgb: '245,200,66',
            },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl p-2.5 text-center"
              style={{
                background: `rgba(${s.rgb},0.07)`,
                border: `1px solid rgba(${s.rgb},0.15)`,
              }}
            >
              <div
                className="mb-1 flex items-center justify-center gap-1 text-[9px] uppercase tracking-wider text-text-muted"
                style={{ color: s.color, opacity: 0.7 }}
              >
                {s.icon}
              </div>
              <div className="text-base font-black leading-none" style={{ color: s.color }}>
                {s.value}
              </div>
              <div className="mt-0.5 text-[9px] leading-tight text-text-muted">{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Per-list bars ────────────────────────────────────────────── */}
        <div className="space-y-3">
          {sortedStats.map((stat, i) => {
            const doneBarPct = stat.total > 0 ? (stat.done / stat.total) * 100 : 0;
            const progBarPct = stat.total > 0 ? (stat.inProgress / stat.total) * 100 : 0;
            const todoBarPct = stat.total > 0 ? (stat.todo / stat.total) * 100 : 0;
            return (
              <div key={stat.id}>
                <div className="mb-1.5 flex items-center gap-2.5">
                  {/* Icon */}
                  <div
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-sm"
                    style={{
                      background: `rgba(${stat.rgb},0.12)`,
                      border: `1px solid rgba(${stat.rgb},0.2)`,
                    }}
                  >
                    {stat.icon}
                  </div>

                  {/* Name + meta */}
                  <div className="min-w-0 flex-1">
                    <div className="mb-0.5 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-sm font-semibold">{stat.name}</span>
                        {stat.overdue > 0 && (
                          <span
                            className="rounded-full px-1.5 py-0.5 text-[9px] font-bold"
                            style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444' }}
                          >
                            {stat.overdue} atrasada{stat.overdue !== 1 ? 's' : ''}
                          </span>
                        )}
                        {stat.dueToday > 0 && (
                          <span
                            className="rounded-full px-1.5 py-0.5 text-[9px] font-bold"
                            style={{ background: 'rgba(245,200,66,0.15)', color: '#F5C842' }}
                          >
                            {stat.dueToday} hoje
                          </span>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="text-[10px] text-text-muted">
                          {stat.done}/{stat.total}
                        </span>
                        <span
                          className="text-xs font-bold"
                          style={{
                            color:
                              stat.completionRate >= 70
                                ? '#00FF88'
                                : stat.completionRate >= 40
                                  ? '#F5C842'
                                  : stat.color,
                          }}
                        >
                          {stat.completionRate}%
                        </span>
                      </div>
                    </div>

                    {/* Stacked progress bar: done (green) | in_progress (purple) | todo (dim) */}
                    <div
                      className="flex h-2 overflow-hidden rounded-full"
                      style={{ background: 'rgba(255,255,255,0.05)' }}
                    >
                      <div
                        className="h-full"
                        style={{ width: `${doneBarPct}%`, background: '#00FF88', opacity: 0.8 }}
                      />
                      <div
                        className="h-full"
                        style={{ width: `${progBarPct}%`, background: '#7C3AED', opacity: 0.7 }}
                      />
                      <div
                        className="h-full"
                        style={{ width: `${todoBarPct}%`, background: `rgba(${stat.rgb},0.3)` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Sub-row: todo / in-progress / done counts */}
                <div className="ml-9.5 flex gap-3 text-[9px] text-text-muted">
                  <span>{stat.todo} a fazer</span>
                  {stat.inProgress > 0 && (
                    <span className="text-brand-purple">{stat.inProgress} em andamento</span>
                  )}
                  <span className="text-brand-green">{stat.done} concluídas</span>
                  {stat.xpEarned > 0 && (
                    <span className="ml-auto text-brand-gold">+{stat.xpEarned} XP</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Alerts ──────────────────────────────────────────────────── */}
        <div className="space-y-2">
          {criticalCount > 0 && (
            <div
              className="flex items-center gap-3 rounded-xl px-4 py-3"
              style={{
                background: 'rgba(239,68,68,0.06)',
                border: '1px solid rgba(239,68,68,0.15)',
              }}
            >
              <span className="shrink-0 text-lg">🚨</span>
              <p className="text-xs text-text-muted">
                <span className="font-bold text-white">
                  {criticalCount} tarefa{criticalCount !== 1 ? 's' : ''}
                </span>{' '}
                urgente{criticalCount !== 1 ? 's' : ''} e importante{criticalCount !== 1 ? 's' : ''}{' '}
                ainda pendente{criticalCount !== 1 ? 's' : ''}.{' '}
                <span style={{ color: '#EF4444' }}>Faça agora.</span>
              </p>
            </div>
          )}

          {totalDueToday > 0 && (
            <div
              className="flex items-center gap-3 rounded-xl px-4 py-3"
              style={{
                background: 'rgba(245,200,66,0.05)',
                border: '1px solid rgba(245,200,66,0.15)',
              }}
            >
              <span className="shrink-0 text-lg">📅</span>
              <p className="text-xs text-text-muted">
                <span className="font-bold" style={{ color: '#F5C842' }}>
                  {totalDueToday} tarefa{totalDueToday !== 1 ? 's' : ''} vencem hoje.
                </span>{' '}
                Bom momento para focar nelas.
              </p>
            </div>
          )}

          {totalOverdue === 0 && totalDueToday === 0 && totalDone > 0 && (
            <div
              className="flex items-center gap-3 rounded-xl px-4 py-3"
              style={{
                background: 'rgba(0,255,136,0.05)',
                border: '1px solid rgba(0,255,136,0.12)',
              }}
            >
              <span className="shrink-0 text-lg">✅</span>
              <p className="text-xs text-text-muted">
                Sem atrasos e nenhuma tarefa vencendo hoje. +{totalXpEarned.toLocaleString('pt-BR')}{' '}
                XP conquistados.
              </p>
            </div>
          )}
        </div>

        {/* ── Legend ──────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-4 text-[9px] text-text-muted">
          <div className="flex items-center gap-1">
            <div
              className="h-2.5 w-2.5 rounded-sm"
              style={{ background: '#00FF88', opacity: 0.8 }}
            />
            <span>Concluído</span>
          </div>
          <div className="flex items-center gap-1">
            <div
              className="h-2.5 w-2.5 rounded-sm"
              style={{ background: '#7C3AED', opacity: 0.7 }}
            />
            <span>Em andamento</span>
          </div>
          <div className="flex items-center gap-1">
            <div
              className="h-2.5 w-2.5 rounded-sm"
              style={{ background: 'rgba(255,255,255,0.12)' }}
            />
            <span>A fazer</span>
          </div>
        </div>
      </div>
    </div>
  );
}
