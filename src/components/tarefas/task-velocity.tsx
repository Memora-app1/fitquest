import { createClient } from '@/lib/supabase/server';
import { CheckSquare } from 'lucide-react';
import { TaskVelocityChartLazy } from './task-velocity-chart-lazy';
import type { TaskWeekData } from './task-velocity-chart';

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0=Sun, 1=Mon, …
  const diff = day === 0 ? -6 : 1 - day; // shift to Monday
  d.setDate(d.getDate() + diff);
  return d;
}

function toISO(date: Date): string {
  return date.toISOString().split('T')[0]!;
}

export async function TaskVelocity({ userId }: { userId: string }) {
  const supabase = await createClient();

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const currentWeekStart = getWeekStart(now);

  // 8 weeks back from current week start
  const eightWeeksAgo = new Date(currentWeekStart.getTime() - 7 * 7 * 86400000);
  const eightWeeksAgoStr = toISO(eightWeeksAgo);

  // Fetch completed tasks and XP transactions in parallel
  const [tasksRes, xpRes] = await Promise.all([
    supabase
      .from('tasks')
      .select('completed_at')
      .eq('user_id', userId)
      .eq('status', 'done')
      .not('completed_at', 'is', null)
      .gte('completed_at', eightWeeksAgoStr + 'T00:00:00')
      .order('completed_at', { ascending: true })
      .limit(1000),
    supabase
      .from('xp_transactions')
      .select('amount, created_at')
      .eq('user_id', userId)
      .eq('source_type', 'task')
      .gte('created_at', eightWeeksAgoStr + 'T00:00:00')
      .limit(500),
  ]);

  const completedTasks = tasksRes.data ?? [];
  const xpTxns = xpRes.data ?? [];

  if (completedTasks.length === 0) return null;

  // Build 8 weekly buckets (Mon-Sun)
  const weeks: { weekStart: Date; label: string; isCurrent: boolean }[] = [];
  for (let i = 7; i >= 0; i--) {
    const weekStart = new Date(currentWeekStart.getTime() - i * 7 * 86400000);
    const isCurrent = i === 0;
    const label = isCurrent ? 'Esta' : `S-${i}`;
    weeks.push({ weekStart, label, isCurrent });
  }

  // Aggregate into weekly buckets
  const weekData: TaskWeekData[] = weeks.map((w) => {
    const weekStartStr = toISO(w.weekStart);
    const weekEndStr = toISO(new Date(w.weekStart.getTime() + 6 * 86400000));

    const weekTasks = completedTasks.filter((t) => {
      const day = t.completed_at!.split('T')[0]!;
      return day >= weekStartStr && day <= weekEndStr;
    });

    const weekXP = xpTxns
      .filter((x) => {
        const day = x.created_at.split('T')[0]!;
        return day >= weekStartStr && day <= weekEndStr;
      })
      .reduce((s, x) => s + (x.amount ?? 0), 0);

    return {
      week: w.label,
      completed: weekTasks.length,
      xp: Math.round(weekXP),
      isCurrent: w.isCurrent,
      weekStart: weekStartStr,
    };
  });

  // Only render if there's at least 1 week with completed tasks
  const weeksWithData = weekData.filter((w) => w.completed > 0).length;
  if (weeksWithData < 1) return null;

  // Trend: compare avg tasks of weeks 0-3 vs weeks 4-7
  const older = weekData.slice(0, 4);
  const newer = weekData.slice(4);
  const olderAvg =
    older.filter((w) => w.completed > 0).reduce((s, w) => s + w.completed, 0) /
    Math.max(1, older.filter((w) => w.completed > 0).length);
  const newerAvg =
    newer.filter((w) => w.completed > 0).reduce((s, w) => s + w.completed, 0) /
    Math.max(1, newer.filter((w) => w.completed > 0).length);
  const trend = olderAvg > 0 ? Math.round(((newerAvg - olderAvg) / olderAvg) * 100) : null;

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-5 md:p-6"
      style={{
        background:
          'linear-gradient(135deg, rgba(124,58,237,0.07) 0%, rgba(13,24,41,0.98) 60%, rgba(245,200,66,0.04) 100%)',
        border: '1px solid rgba(124,58,237,0.16)',
      }}
    >
      {/* Corner glow */}
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full blur-3xl"
        style={{ background: 'rgba(124,58,237,0.08)' }}
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
                <CheckSquare size={12} style={{ color: '#7C3AED' }} />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-text-muted">
                Velocidade de Tarefas
              </span>
            </div>
            <h2 className="text-xl font-black leading-tight">Últimas 8 semanas</h2>
            <p className="mt-0.5 text-sm text-text-muted">
              Tarefas concluídas e XP ganho por semana
            </p>
          </div>

          {/* Trend badge */}
          {trend !== null && (
            <div
              className="flex shrink-0 items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold"
              style={{
                background: trend >= 0 ? 'rgba(0,255,136,0.1)' : 'rgba(255,77,0,0.1)',
                border: `1px solid ${trend >= 0 ? 'rgba(0,255,136,0.2)' : 'rgba(255,77,0,0.2)'}`,
                color: trend >= 0 ? '#00FF88' : '#FF4D00',
              }}
            >
              {trend >= 0 ? '📈' : '📉'}
              <span>
                Produtividade {trend >= 0 ? 'subindo' : 'caindo'}{' '}
                <span className="font-black">{Math.abs(trend)}%</span>
              </span>
            </div>
          )}
        </div>

        {/* ── Chart ───────────────────────────────────────────────────── */}
        <TaskVelocityChartLazy data={weekData} />
      </div>
    </div>
  );
}
