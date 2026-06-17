import { createClient } from '@/lib/supabase/server';
import { Zap, TrendingUp, TrendingDown, Target } from 'lucide-react';

interface TaskRow {
  id: string;
  status: string;
  urgent: boolean;
  important: boolean;
  created_at: string;
  completed_at: string | null;
  xp_reward: number;
}

interface DayStats {
  date: string;
  created: number;
  completed: number;
  net: number; // completed - created (positive = shrinking backlog)
  xpEarned: number;
}

interface WeekStats {
  label: string;
  completed: number;
  created: number;
  xpEarned: number;
  completionRate: number;
  avgCycleTime: number | null;
}

function toISO(d: Date): string {
  return d.toISOString().split('T')[0]!;
}

const DOW_LABELS_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export async function TaskProductivityScore({ userId }: { userId: string }) {
  const supabase = await createClient();

  const now = new Date();
  const todayStr = toISO(now);
  const fourWeeksAgo = toISO(new Date(now.getTime() - 28 * 86400000));

  const [createdRes, completedRes] = await Promise.all([
    // Tasks created in last 28 days
    supabase
      .from('tasks')
      .select('id, status, urgent, important, created_at, completed_at, xp_reward')
      .eq('user_id', userId)
      .gte('created_at', fourWeeksAgo + 'T00:00:00')
      .order('created_at', { ascending: true })
      .limit(500),
    // Tasks completed in last 28 days
    supabase
      .from('tasks')
      .select('id, status, urgent, important, created_at, completed_at, xp_reward')
      .eq('user_id', userId)
      .eq('status', 'done')
      .gte('completed_at', fourWeeksAgo + 'T00:00:00')
      .order('completed_at', { ascending: true })
      .limit(500),
  ]);

  const createdTasks = (createdRes.data ?? []) as TaskRow[];
  const completedTasks = (completedRes.data ?? []) as TaskRow[];

  if (createdTasks.length === 0 && completedTasks.length === 0) return null;

  // Build day-level stats for last 28 days
  const dayStatsMap = new Map<string, DayStats>();
  for (let i = 0; i < 28; i++) {
    const d = new Date(now.getTime() - (27 - i) * 86400000);
    const dateStr = toISO(d);
    dayStatsMap.set(dateStr, { date: dateStr, created: 0, completed: 0, net: 0, xpEarned: 0 });
  }

  for (const t of createdTasks) {
    const d = t.created_at.split('T')[0]!;
    if (dayStatsMap.has(d)) dayStatsMap.get(d)!.created++;
  }

  for (const t of completedTasks) {
    const d = t.completed_at?.split('T')[0];
    if (d && dayStatsMap.has(d)) {
      dayStatsMap.get(d)!.completed++;
      dayStatsMap.get(d)!.xpEarned += t.xp_reward ?? 0;
    }
  }

  for (const s of dayStatsMap.values()) {
    s.net = s.completed - s.created;
  }

  const dayStats = [...dayStatsMap.values()].sort((a, b) => a.date.localeCompare(b.date));

  // Day-of-week productivity
  const dowStats: Record<
    number,
    { completed: number; created: number; xp: number; count: number }
  > = {};
  for (let d = 0; d < 7; d++) dowStats[d] = { completed: 0, created: 0, xp: 0, count: 0 };

  for (const t of completedTasks) {
    if (!t.completed_at) continue;
    const dow = new Date(t.completed_at).getDay();
    dowStats[dow]!.completed++;
    dowStats[dow]!.xp += t.xp_reward ?? 0;
  }

  for (const t of createdTasks) {
    const dow = new Date(t.created_at).getDay();
    dowStats[dow]!.created++;
    dowStats[dow]!.count++;
  }

  const maxDowCompleted = Math.max(...Object.values(dowStats).map((d) => d.completed), 1);
  const bestDow = Object.entries(dowStats).sort(([, a], [, b]) => b.completed - a.completed)[0];
  const bestDowLabel = bestDow ? DOW_LABELS_SHORT[Number(bestDow[0])] : null;

  // Cycle time: avg days between created_at and completed_at
  const cycleTimes = completedTasks
    .filter((t) => t.completed_at && t.created_at)
    .map((t) => {
      const created = new Date(t.created_at).getTime();
      const completed = new Date(t.completed_at!).getTime();
      return Math.max(0, (completed - created) / 86400000);
    });
  const avgCycleTime =
    cycleTimes.length > 0
      ? Math.round(cycleTimes.reduce((s, v) => s + v, 0) / cycleTimes.length)
      : null;

  // Split into Q1 (urgent+important) cycle time vs others
  const q1CycleTimes = completedTasks
    .filter((t) => t.urgent && t.important && t.completed_at)
    .map((t) =>
      Math.max(
        0,
        (new Date(t.completed_at!).getTime() - new Date(t.created_at).getTime()) / 86400000
      )
    );
  const avgQ1CycleTime =
    q1CycleTimes.length > 0
      ? Math.round(q1CycleTimes.reduce((s, v) => s + v, 0) / q1CycleTimes.length)
      : null;

  // Weekly stats (4 weeks)
  const weekStats: WeekStats[] = [];
  for (let w = 3; w >= 0; w--) {
    const weekStart = toISO(new Date(now.getTime() - (w + 1) * 7 * 86400000));
    const weekEnd = toISO(new Date(now.getTime() - w * 7 * 86400000));

    const wCreated = createdTasks.filter((t) => {
      const d = t.created_at.split('T')[0]!;
      return d >= weekStart && d < weekEnd;
    }).length;

    const wCompleted = completedTasks.filter((t) => {
      const d = t.completed_at?.split('T')[0];
      return d && d >= weekStart && d < weekEnd;
    });

    const wXp = wCompleted.reduce((s, t) => s + (t.xp_reward ?? 0), 0);

    // Cycle times for this week
    const wCycleTimes = wCompleted
      .filter((t) => t.completed_at)
      .map((t) =>
        Math.max(
          0,
          (new Date(t.completed_at!).getTime() - new Date(t.created_at).getTime()) / 86400000
        )
      );
    const wAvgCycle =
      wCycleTimes.length > 0
        ? Math.round(wCycleTimes.reduce((s, v) => s + v, 0) / wCycleTimes.length)
        : null;

    const label = w === 0 ? 'Esta semana' : w === 1 ? 'Sem. passada' : `−${w + 1} sem.`;

    weekStats.push({
      label,
      completed: wCompleted.length,
      created: wCreated,
      xpEarned: wXp,
      completionRate:
        wCreated > 0
          ? Math.round((wCompleted.length / (wCompleted.length + wCreated)) * 100)
          : wCompleted.length > 0
            ? 100
            : 0,
      avgCycleTime: wAvgCycle,
    });
  }

  const maxWeekCompleted = Math.max(...weekStats.map((w) => w.completed), 1);

  // Productivity Score (0-100):
  const thisWeek = weekStats[3]!;
  const lastWeek = weekStats[2]!;

  const velocityScore = Math.min(100, thisWeek.completed * 10); // 10 tasks/week = 100
  const trendScore =
    lastWeek.completed > 0
      ? Math.min(
          100,
          Math.max(0, 50 + ((thisWeek.completed - lastWeek.completed) / lastWeek.completed) * 50)
        )
      : 50;
  const cycleScore =
    avgCycleTime !== null
      ? Math.max(0, 100 - avgCycleTime * 5) // 0 days = 100, 20+ days = 0
      : 50;
  const prodScore = Math.round(velocityScore * 0.4 + trendScore * 0.3 + cycleScore * 0.3);

  const prodColor =
    prodScore >= 80
      ? '#00FF88'
      : prodScore >= 60
        ? '#F5C842'
        : prodScore >= 40
          ? '#FF4D00'
          : '#EF4444';
  const prodLabel =
    prodScore >= 80
      ? 'Alta produtividade'
      : prodScore >= 60
        ? 'Boa cadência'
        : prodScore >= 40
          ? 'Pode melhorar'
          : 'Ritmo baixo';

  // Trend vs last week
  const weekTrend =
    lastWeek.completed > 0
      ? Math.round(((thisWeek.completed - lastWeek.completed) / lastWeek.completed) * 100)
      : null;

  // Backlog trend (running net across 28 days)
  let runningNet = 0;
  const netData = dayStats.map((d) => {
    runningNet += d.net;
    return runningNet;
  });
  const netMin = Math.min(...netData);
  const netMax = Math.max(...netData);
  const netRange = Math.max(Math.abs(netMin), Math.abs(netMax), 1);

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-5 md:p-6"
      style={{
        background:
          'linear-gradient(135deg, rgba(124,58,237,0.06) 0%, rgba(13,24,41,0.98) 60%, rgba(0,255,136,0.04) 100%)',
        border: '1px solid rgba(124,58,237,0.14)',
      }}
    >
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full blur-3xl"
        style={{ background: 'rgba(124,58,237,0.06)' }}
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
                <Zap size={12} style={{ color: '#7C3AED' }} />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-text-muted">
                Produtividade — 28 dias
              </span>
            </div>
            <h2 className="text-xl font-black leading-tight">Score de Produtividade</h2>
            <p className="mt-0.5 text-sm text-text-muted">
              {completedTasks.length} concluídas · {createdTasks.length} criadas
              {avgCycleTime !== null && ` · ciclo médio ${avgCycleTime}d`}
            </p>
          </div>

          {/* Prod score */}
          <div className="text-right">
            <div className="text-3xl font-black" style={{ color: prodColor }}>
              {prodScore}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-text-muted">
              score produtividade
            </div>
            <div className="mt-0.5 flex items-center justify-end gap-1">
              {weekTrend !== null && weekTrend !== 0 && (
                <>
                  {weekTrend > 0 ? (
                    <TrendingUp size={9} style={{ color: '#00FF88' }} />
                  ) : (
                    <TrendingDown size={9} style={{ color: '#EF4444' }} />
                  )}
                  <span
                    className="text-[10px] font-bold"
                    style={{ color: weekTrend > 0 ? '#00FF88' : '#EF4444' }}
                  >
                    {weekTrend > 0 ? '+' : ''}
                    {weekTrend}% vs semana passada
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Stats strip ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
          {[
            {
              label: 'Esta semana',
              value: String(thisWeek.completed),
              sub: `+${thisWeek.xpEarned} XP`,
              color: '#7C3AED',
              rgb: '124,58,237',
            },
            {
              label: 'Ciclo médio',
              value: avgCycleTime !== null ? `${avgCycleTime}d` : '–',
              sub: avgQ1CycleTime !== null ? `Q1: ${avgQ1CycleTime}d` : 'sem dados',
              color: avgCycleTime !== null && avgCycleTime <= 3 ? '#00FF88' : '#F5C842',
              rgb: avgCycleTime !== null && avgCycleTime <= 3 ? '0,255,136' : '245,200,66',
            },
            {
              label: 'Melhor dia',
              value: bestDowLabel ?? '–',
              sub: bestDow ? `${bestDow[1].completed} concluídas` : '',
              color: '#FF4D00',
              rgb: '255,77,0',
            },
            {
              label: prodLabel,
              value: `${prodScore}/100`,
              sub: '',
              color: prodColor,
              rgb: prodScore >= 80 ? '0,255,136' : prodScore >= 60 ? '245,200,66' : '255,77,0',
            },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl p-3"
              style={{
                background: `linear-gradient(135deg, rgba(${s.rgb},0.07) 0%, rgba(13,24,41,0.98) 100%)`,
                border: `1px solid rgba(${s.rgb},0.14)`,
              }}
            >
              <div className="mb-1 text-[9px] uppercase tracking-wider text-text-muted">
                {s.label}
              </div>
              <div className="text-sm font-black leading-none" style={{ color: s.color }}>
                {s.value}
              </div>
              {s.sub && <div className="mt-0.5 text-[9px] text-text-muted">{s.sub}</div>}
            </div>
          ))}
        </div>

        {/* ── Weekly completion bars ───────────────────────────────────── */}
        <div className="space-y-2">
          <div className="text-[10px] uppercase tracking-wider text-text-muted">
            Concluídas por Semana
          </div>
          <div className="flex h-20 items-end gap-3">
            {weekStats.map((w, i) => {
              const h = Math.round((w.completed / maxWeekCompleted) * 56);
              const isThisWeek = i === weekStats.length - 1;

              return (
                <div key={i} className="flex flex-1 flex-col items-center gap-1">
                  {w.completed > 0 && (
                    <span
                      className="text-[8px] font-bold"
                      style={{ color: isThisWeek ? '#7C3AED' : '#5A6B8A' }}
                    >
                      {w.completed}
                    </span>
                  )}
                  <div
                    className="w-full rounded-t-sm"
                    style={{
                      height: `${Math.max(3, h)}px`,
                      background: isThisWeek
                        ? 'linear-gradient(180deg, #7C3AED, #9F5AF7)'
                        : 'rgba(124,58,237,0.35)',
                    }}
                  />
                  <span
                    className="text-center text-[8px] leading-tight"
                    style={{ color: isThisWeek ? '#7C3AED' : '#5A6B8A' }}
                  >
                    {w.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── DOW heatmap strip ───────────────────────────────────────── */}
        <div className="space-y-1.5">
          <div className="text-[10px] uppercase tracking-wider text-text-muted">
            Conclusões por Dia da Semana
          </div>
          <div className="flex gap-1.5">
            {[0, 1, 2, 3, 4, 5, 6].map((dow) => {
              const stats = dowStats[dow]!;
              const pct = Math.round((stats.completed / maxDowCompleted) * 100);
              return (
                <div key={dow} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className="w-full rounded-md"
                    style={{
                      height: '32px',
                      background:
                        pct === 0
                          ? 'rgba(255,255,255,0.03)'
                          : `rgba(124,58,237,${0.1 + (pct / 100) * 0.7})`,
                      border: `1px solid rgba(124,58,237,${0.1 + (pct / 100) * 0.3})`,
                    }}
                  />
                  <span className="text-[8px] text-text-muted">{DOW_LABELS_SHORT[dow]}</span>
                  {stats.completed > 0 && (
                    <span className="text-[8px] font-bold" style={{ color: '#7C3AED' }}>
                      {stats.completed}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Insight footer ───────────────────────────────────────────── */}
        <div
          className="flex items-center gap-3 rounded-xl px-4 py-3"
          style={{
            background: prodScore >= 60 ? 'rgba(124,58,237,0.06)' : 'rgba(255,77,0,0.05)',
            border:
              prodScore >= 60 ? '1px solid rgba(124,58,237,0.12)' : '1px solid rgba(255,77,0,0.1)',
          }}
        >
          <span className="shrink-0 text-lg">
            {prodScore >= 80 ? '🏆' : prodScore >= 60 ? '⚡' : prodScore >= 40 ? '💪' : '⚠️'}
          </span>
          <div>
            <p className="text-sm font-semibold leading-snug">{prodLabel}</p>
            <p className="mt-0.5 text-[11px] text-text-muted">
              {bestDowLabel && `${bestDowLabel} é seu dia mais produtivo. `}
              {avgCycleTime !== null
                ? `Tempo médio para concluir: ${avgCycleTime} dia${avgCycleTime !== 1 ? 's' : ''}.`
                : 'Conclua tarefas para medir seu ciclo médio.'}
              {weekTrend !== null &&
                weekTrend > 0 &&
                ` +${weekTrend}% vs semana passada — ótimo ritmo!`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
