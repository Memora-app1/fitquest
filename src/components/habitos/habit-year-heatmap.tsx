import { createClient } from '@/lib/supabase/server';
import { CalendarDays } from 'lucide-react';

interface LogRow {
  habit_id: string;
  logged_date: string;
}

interface HabitRow {
  id: string;
}

function toISO(d: Date): string {
  return d.toISOString().split('T')[0]!;
}

const MONTH_LABELS = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
];
const DOW_LABELS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

export async function HabitYearHeatmap({ userId }: { userId: string }) {
  const supabase = await createClient();

  const now = new Date();
  const todayStr = toISO(now);

  // 365 days back from today
  const yearAgo = new Date(now.getTime() - 364 * 86400000);
  const yearAgoStr = toISO(yearAgo);

  const [habitsRes, logsRes] = await Promise.all([
    supabase.from('habits').select('id').eq('user_id', userId).eq('is_active', true),
    supabase
      .from('habit_logs')
      .select('habit_id, logged_date')
      .eq('user_id', userId)
      .gte('logged_date', yearAgoStr)
      .lte('logged_date', todayStr),
  ]);

  const habits = (habitsRes.data ?? []) as HabitRow[];
  const logs = (logsRes.data ?? []) as LogRow[];

  if (habits.length === 0) return null;

  const totalHabits = habits.length;

  // Group logs by date → count unique habit_ids done
  const logsByDate = new Map<string, Set<string>>();
  for (const l of logs) {
    if (!logsByDate.has(l.logged_date)) logsByDate.set(l.logged_date, new Set());
    logsByDate.get(l.logged_date)!.add(l.habit_id);
  }

  // Build the 365-day grid starting from the Sunday that contains yearAgo
  // We want a 52+ week grid, starting on Sunday
  const gridStart = new Date(yearAgo);
  const startDow = gridStart.getDay(); // 0=Sun
  gridStart.setDate(gridStart.getDate() - startDow); // go back to Sunday

  // Build weeks array
  interface DayCell {
    dateStr: string;
    count: number;
    total: number;
    pct: number; // 0-100
    isFuture: boolean;
    isToday: boolean;
    inRange: boolean; // within yearAgo..today
  }

  const weeks: DayCell[][] = [];
  const cursor = new Date(gridStart);

  // Month label positions: [weekIndex, monthLabel]
  const monthMarkers: { weekIdx: number; label: string }[] = [];
  let lastMonth = -1;

  while (cursor <= now) {
    const week: DayCell[] = [];
    for (let d = 0; d < 7; d++) {
      const dateStr = toISO(cursor);
      const isFuture = dateStr > todayStr;
      const isToday = dateStr === todayStr;
      const inRange = dateStr >= yearAgoStr && dateStr <= todayStr;
      const done = logsByDate.get(dateStr)?.size ?? 0;
      const pct = inRange && !isFuture ? Math.round((done / totalHabits) * 100) : 0;

      week.push({
        dateStr,
        count: done,
        total: totalHabits,
        pct,
        isFuture,
        isToday,
        inRange,
      });

      // Month label when month changes
      if (d === 0 && !isFuture && inRange) {
        const m = cursor.getMonth();
        if (m !== lastMonth) {
          monthMarkers.push({ weekIdx: weeks.length, label: MONTH_LABELS[m]! });
          lastMonth = m;
        }
      }

      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }

  // Stats
  const activeDays = Array.from(logsByDate.entries()).filter(
    ([d]) => d >= yearAgoStr && d <= todayStr && logsByDate.get(d)!.size > 0
  ).length;

  const perfectDays = Array.from(logsByDate.entries()).filter(
    ([d]) => d >= yearAgoStr && d <= todayStr && logsByDate.get(d)!.size >= totalHabits
  ).length;

  const totalLogs = logs.filter(
    (l) => l.logged_date >= yearAgoStr && l.logged_date <= todayStr
  ).length;

  // Current streak (days back from today with at least 1 log)
  let currentStreak = 0;
  const streakCursor = new Date(now);
  while (true) {
    const ds = toISO(streakCursor);
    if (ds < yearAgoStr) break;
    const done = logsByDate.get(ds)?.size ?? 0;
    if (done === 0) break;
    currentStreak++;
    streakCursor.setDate(streakCursor.getDate() - 1);
  }

  // Longest streak in the year
  let longestStreak = 0;
  let tempStreak = 0;
  const d = new Date(yearAgo);
  while (toISO(d) <= todayStr) {
    const ds = toISO(d);
    const done = logsByDate.get(ds)?.size ?? 0;
    if (done > 0) {
      tempStreak++;
      if (tempStreak > longestStreak) longestStreak = tempStreak;
    } else {
      tempStreak = 0;
    }
    d.setDate(d.getDate() + 1);
  }

  // Color based on pct
  function cellColor(cell: DayCell): string {
    if (!cell.inRange || cell.isFuture) return 'rgba(255,255,255,0.04)';
    if (cell.pct === 0) return 'rgba(255,255,255,0.06)';
    if (cell.pct <= 25) return 'rgba(0,255,136,0.15)';
    if (cell.pct <= 50) return 'rgba(0,255,136,0.30)';
    if (cell.pct <= 75) return 'rgba(0,255,136,0.55)';
    return '#00FF88';
  }

  function cellBorder(cell: DayCell): string {
    if (cell.isToday) return '1px solid rgba(245,200,66,0.8)';
    if (!cell.inRange || cell.isFuture) return '1px solid transparent';
    if (cell.pct >= 100) return '1px solid rgba(0,255,136,0.4)';
    return '1px solid transparent';
  }

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-5 md:p-6"
      style={{
        background:
          'linear-gradient(135deg, rgba(0,255,136,0.05) 0%, rgba(13,24,41,0.98) 60%, rgba(124,58,237,0.04) 100%)',
        border: '1px solid rgba(0,255,136,0.12)',
      }}
    >
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full blur-3xl"
        style={{ background: 'rgba(0,255,136,0.06)' }}
      />

      <div className="relative z-10 space-y-5">
        {/* ── Header ────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <div
                className="flex h-6 w-6 items-center justify-center rounded-lg"
                style={{
                  background: 'rgba(0,255,136,0.12)',
                  border: '1px solid rgba(0,255,136,0.22)',
                }}
              >
                <CalendarDays size={12} style={{ color: '#00FF88' }} />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-text-muted">
                Consistência — 365 dias
              </span>
            </div>
            <h2 className="text-xl font-black leading-tight">Mapa Anual de Hábitos</h2>
            <p className="mt-0.5 text-sm text-text-muted">
              {totalHabits} hábito{totalHabits !== 1 ? 's' : ''} ativos · {activeDays} dia
              {activeDays !== 1 ? 's' : ''} com registros
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="text-right">
              <div className="text-2xl font-black" style={{ color: '#00FF88' }}>
                {currentStreak}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-text-muted">
                streak atual
              </div>
            </div>
            <div
              className="h-8 w-px rounded-full"
              style={{ background: 'rgba(255,255,255,0.1)' }}
            />
            <div className="text-right">
              <div className="text-2xl font-black text-white">{longestStreak}</div>
              <div className="text-[10px] uppercase tracking-wider text-text-muted">recorde</div>
            </div>
          </div>
        </div>

        {/* ── Heatmap Grid ──────────────────────────────────────────────── */}
        <div className="overflow-x-auto pb-1">
          <div style={{ minWidth: `${weeks.length * 13}px` }}>
            {/* Month labels */}
            <div className="mb-1 flex" style={{ paddingLeft: '20px' }}>
              {weeks.map((_, wi) => {
                const marker = monthMarkers.find((m) => m.weekIdx === wi);
                return (
                  <div
                    key={wi}
                    className="text-[9px] text-text-muted"
                    style={{ width: '13px', flexShrink: 0 }}
                  >
                    {marker ? marker.label : ''}
                  </div>
                );
              })}
            </div>

            {/* Grid: 7 rows (DOW) × N weeks */}
            <div className="flex gap-0">
              {/* DOW labels */}
              <div className="mr-1 flex flex-col gap-[2px]">
                {DOW_LABELS.map((label, i) => (
                  <div
                    key={i}
                    className="flex items-center text-[9px] text-text-muted"
                    style={{ height: '11px', width: '16px' }}
                  >
                    {i % 2 === 1 ? label : ''}
                  </div>
                ))}
              </div>

              {/* Week columns */}
              <div className="flex gap-[2px]">
                {weeks.map((week, wi) => (
                  <div key={wi} className="flex flex-col gap-[2px]">
                    {week.map((cell, di) => (
                      <div
                        key={di}
                        title={
                          cell.inRange && !cell.isFuture
                            ? `${cell.dateStr}: ${cell.count}/${cell.total} hábitos (${cell.pct}%)`
                            : cell.dateStr
                        }
                        className="cursor-default rounded-[2px] transition-transform hover:scale-125"
                        style={{
                          width: '11px',
                          height: '11px',
                          background: cellColor(cell),
                          border: cellBorder(cell),
                          flexShrink: 0,
                        }}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="mt-2 flex items-center gap-2 pl-5">
              <span className="text-[9px] text-text-muted">Menos</span>
              {[0, 25, 50, 75, 100].map((pct) => (
                <div
                  key={pct}
                  className="rounded-[2px]"
                  style={{
                    width: '11px',
                    height: '11px',
                    background:
                      pct === 0
                        ? 'rgba(255,255,255,0.06)'
                        : pct <= 25
                          ? 'rgba(0,255,136,0.15)'
                          : pct <= 50
                            ? 'rgba(0,255,136,0.30)'
                            : pct <= 75
                              ? 'rgba(0,255,136,0.55)'
                              : '#00FF88',
                  }}
                />
              ))}
              <span className="text-[9px] text-text-muted">Mais</span>
            </div>
          </div>
        </div>

        {/* ── Stats Row ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div
            className="rounded-xl p-3 text-center"
            style={{ background: 'rgba(0,255,136,0.06)', border: '1px solid rgba(0,255,136,0.12)' }}
          >
            <div className="text-2xl font-black" style={{ color: '#00FF88' }}>
              {currentStreak}
            </div>
            <div className="mt-0.5 text-[10px] uppercase tracking-wider text-text-muted">
              Streak atual
            </div>
          </div>
          <div
            className="rounded-xl p-3 text-center"
            style={{
              background: 'rgba(245,200,66,0.06)',
              border: '1px solid rgba(245,200,66,0.12)',
            }}
          >
            <div className="text-2xl font-black" style={{ color: '#F5C842' }}>
              {longestStreak}
            </div>
            <div className="mt-0.5 text-[10px] uppercase tracking-wider text-text-muted">
              Recorde de streak
            </div>
          </div>
          <div
            className="rounded-xl p-3 text-center"
            style={{
              background: 'rgba(124,58,237,0.06)',
              border: '1px solid rgba(124,58,237,0.12)',
            }}
          >
            <div className="text-2xl font-black text-brand-purple">{perfectDays}</div>
            <div className="mt-0.5 text-[10px] uppercase tracking-wider text-text-muted">
              Dias perfeitos
            </div>
          </div>
          <div
            className="rounded-xl p-3 text-center"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            <div className="text-2xl font-black text-white">{totalLogs}</div>
            <div className="mt-0.5 text-[10px] uppercase tracking-wider text-text-muted">
              Registros totais
            </div>
          </div>
        </div>

        {/* ── Insight Footer ───────────────────────────────────────────── */}
        <div
          className="flex items-center gap-3 rounded-xl px-4 py-3"
          style={{
            background: 'rgba(0,255,136,0.04)',
            border: '1px solid rgba(0,255,136,0.1)',
          }}
        >
          <span className="shrink-0 text-lg">
            {currentStreak >= 30
              ? '🔥'
              : currentStreak >= 7
                ? '💪'
                : perfectDays >= 50
                  ? '⭐'
                  : '🌱'}
          </span>
          <div>
            <p className="text-sm font-semibold leading-snug">
              {currentStreak >= 30
                ? `${currentStreak} dias consecutivos — você está imparável!`
                : currentStreak >= 7
                  ? `${currentStreak} dias seguidos. Continue para bater seu recorde de ${longestStreak}!`
                  : perfectDays >= 50
                    ? `${perfectDays} dias perfeitos no ano — consistência impressionante.`
                    : activeDays > 0
                      ? `${activeDays} dia${activeDays !== 1 ? 's' : ''} com registro no último ano.`
                      : 'Comece hoje para construir sua consistência!'}
            </p>
            <p className="mt-0.5 text-[11px] text-text-muted">
              {totalHabits} hábito{totalHabits !== 1 ? 's' : ''} ativos ·{' '}
              {activeDays > 0
                ? `${Math.round((activeDays / 365) * 100)}% de consistência anual`
                : 'Registre seu primeiro hábito'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
