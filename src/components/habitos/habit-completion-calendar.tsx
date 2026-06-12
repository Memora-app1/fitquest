import { createClient } from '@/lib/supabase/server';
import { Calendar } from 'lucide-react';

interface HabitRow {
  id: string;
  name: string;
  icon: string;
  color: string;
  xp_per_completion: number;
}

interface LogRow {
  habit_id: string;
  logged_date: string;
}

function toISO(d: Date): string {
  return d.toISOString().split('T')[0]!;
}

export async function HabitCompletionCalendar({ userId }: { userId: string }) {
  const supabase = await createClient();

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = toISO(now);

  const firstDay = toISO(new Date(year, month, 1));
  const lastDay = toISO(new Date(year, month + 1, 0));

  const [habitsRes, logsRes] = await Promise.all([
    supabase
      .from('habits')
      .select('id, name, icon, color, xp_per_completion')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('display_order'),
    supabase
      .from('habit_logs')
      .select('habit_id, logged_date')
      .eq('user_id', userId)
      .gte('logged_date', firstDay)
      .lte('logged_date', lastDay),
  ]);

  const habits = (habitsRes.data ?? []) as HabitRow[];
  const logs = (logsRes.data ?? []) as LogRow[];

  if (habits.length === 0 || logs.length === 0) return null;

  // Build set: "habitId::date" for O(1) lookup
  const logSet = new Set(logs.map((l) => `${l.habit_id}::${l.logged_date}`));

  // Build date-level completion summary
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const dayOfMonth = now.getDate();

  interface DayData {
    date: string;
    dayNum: number;
    isPast: boolean;
    isToday: boolean;
    isFuture: boolean;
    completedCount: number;
    totalHabits: number;
    completedHabitIds: Set<string>;
  }

  const dayData: DayData[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const isPast = dateStr < today;
    const isToday = dateStr === today;
    const isFuture = dateStr > today;

    const completedHabitIds = new Set(
      habits.filter((h) => logSet.has(`${h.id}::${dateStr}`)).map((h) => h.id)
    );

    dayData.push({
      date: dateStr,
      dayNum: d,
      isPast,
      isToday,
      isFuture,
      completedCount: completedHabitIds.size,
      totalHabits: habits.length,
      completedHabitIds,
    });
  }

  // Calendar grid: Monday = first column (index 0)
  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7; // 0=Mon

  // Stats
  const pastDays = dayData.filter((d) => d.isPast || d.isToday);
  const perfectDaysMonth = pastDays.filter(
    (d) => d.completedCount === d.totalHabits && d.totalHabits > 0
  ).length;
  const activeDaysMonth = pastDays.filter((d) => d.completedCount > 0).length;
  const totalLogsMonth = logs.length;
  const avgPerDay =
    activeDaysMonth > 0 ? (totalLogsMonth / Math.max(pastDays.length, 1)).toFixed(1) : '0';

  // Best streak so far this month
  let currentStreak = 0;
  let bestStreak = 0;
  let running = 0;
  for (const d of [...dayData].reverse()) {
    if (d.isFuture) continue;
    if (d.completedCount > 0) {
      running++;
      if (d.isToday) currentStreak = running;
    } else if (!d.isFuture) {
      bestStreak = Math.max(bestStreak, running);
      running = 0;
    }
  }
  bestStreak = Math.max(bestStreak, running);

  // Per-habit completion this month
  const habitStats = habits
    .map((h) => {
      const doneDays = dayData.filter((d) => !d.isFuture && d.completedHabitIds.has(h.id)).length;
      const eligibleDays = pastDays.length;
      const rate = eligibleDays > 0 ? Math.round((doneDays / eligibleDays) * 100) : 0;
      return { ...h, doneDays, rate };
    })
    .sort((a, b) => b.rate - a.rate);

  const monthName = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const DOW_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

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
        {/* ── Header ──────────────────────────────────────────────────── */}
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
                <Calendar size={12} style={{ color: '#00FF88' }} />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-text-muted">
                Calendário de Hábitos
              </span>
            </div>
            <h2 className="text-xl font-black capitalize leading-tight">{monthName}</h2>
            <p className="mt-0.5 text-sm text-text-muted">
              {activeDaysMonth} dias ativos · {perfectDaysMonth} dia
              {perfectDaysMonth !== 1 ? 's' : ''} perfeito{perfectDaysMonth !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Best streak badge */}
          {(currentStreak > 0 || bestStreak > 0) && (
            <div
              className="flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold"
              style={{
                background: 'rgba(255,77,0,0.1)',
                border: '1px solid rgba(255,77,0,0.2)',
                color: '#FF4D00',
              }}
            >
              🔥 {currentStreak > 0 ? `${currentStreak}d seguidos` : `melhor: ${bestStreak}d`}
            </div>
          )}
        </div>

        {/* ── Summary strip ─────────────────────────────────────────── */}
        <div className="grid grid-cols-4 gap-2">
          {[
            {
              label: 'Dias ativos',
              value: String(activeDaysMonth),
              color: '#00FF88',
              rgb: '0,255,136',
            },
            {
              label: 'Dias perfeitos',
              value: String(perfectDaysMonth),
              color: '#F5C842',
              rgb: '245,200,66',
            },
            {
              label: 'Registros',
              value: String(totalLogsMonth),
              color: '#7C3AED',
              rgb: '124,58,237',
            },
            { label: 'Média/dia', value: avgPerDay, color: '#FF4D00', rgb: '255,77,0' },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl p-2.5 text-center"
              style={{
                background: `rgba(${s.rgb},0.07)`,
                border: `1px solid rgba(${s.rgb},0.14)`,
              }}
            >
              <div className="mb-1 text-[9px] uppercase leading-tight tracking-wider text-text-muted">
                {s.label}
              </div>
              <div className="text-sm font-black leading-none" style={{ color: s.color }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>

        {/* ── Calendar grid ───────────────────────────────────────────── */}
        <div className="space-y-1.5">
          {/* DOW headers */}
          <div className="grid grid-cols-7 gap-1">
            {DOW_LABELS.map((l) => (
              <div key={l} className="text-center text-[9px] font-medium text-text-muted">
                {l}
              </div>
            ))}
          </div>

          {/* Day cells */}
          {(() => {
            // Pad start with empty cells
            const cells: (DayData | null)[] = [...Array(firstDow).fill(null), ...dayData];
            // Pad end to complete last row
            while (cells.length % 7 !== 0) cells.push(null);
            const rows: (DayData | null)[][] = [];
            for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));

            return rows.map((row, ri) => (
              <div key={ri} className="grid grid-cols-7 gap-1">
                {row.map((day, di) => {
                  if (!day) {
                    return <div key={di} />;
                  }

                  const isPerfect =
                    day.completedCount === day.totalHabits && day.totalHabits > 0 && !day.isFuture;
                  const isEmpty = day.completedCount === 0 && !day.isFuture;
                  const partial = !isPerfect && !isEmpty && !day.isFuture;
                  const completionPct =
                    day.totalHabits > 0
                      ? Math.round((day.completedCount / day.totalHabits) * 100)
                      : 0;

                  const bgColor = day.isFuture
                    ? 'transparent'
                    : isPerfect
                      ? 'rgba(0,255,136,0.18)'
                      : partial
                        ? `rgba(245,200,66,${0.05 + (completionPct / 100) * 0.1})`
                        : 'rgba(255,255,255,0.025)';

                  const borderColor = day.isToday
                    ? 'rgba(245,200,66,0.8)'
                    : isPerfect
                      ? 'rgba(0,255,136,0.4)'
                      : partial
                        ? 'rgba(245,200,66,0.2)'
                        : 'rgba(255,255,255,0.04)';

                  return (
                    <div
                      key={di}
                      title={`${day.date}: ${day.completedCount}/${day.totalHabits} hábitos`}
                      className="flex flex-col items-center gap-0.5 rounded-lg py-1"
                      style={{
                        background: bgColor,
                        border: `1px solid ${borderColor}`,
                        boxShadow: day.isToday ? '0 0 6px rgba(245,200,66,0.4)' : 'none',
                        minHeight: '42px',
                      }}
                    >
                      {/* Day number */}
                      <span
                        className="text-[9px] font-bold leading-none"
                        style={{
                          color: day.isFuture
                            ? 'rgba(136,153,187,0.3)'
                            : day.isToday
                              ? '#F5C842'
                              : isPerfect
                                ? '#00FF88'
                                : partial
                                  ? '#8899BB'
                                  : 'rgba(136,153,187,0.4)',
                        }}
                      >
                        {day.dayNum}
                      </span>

                      {/* Habit dots */}
                      {!day.isFuture && day.totalHabits > 0 && (
                        <div className="flex flex-wrap justify-center gap-px px-0.5">
                          {habits.slice(0, 6).map((h) => (
                            <div
                              key={h.id}
                              className="rounded-full"
                              style={{
                                width: '4px',
                                height: '4px',
                                background: day.completedHabitIds.has(h.id)
                                  ? h.color
                                  : 'rgba(255,255,255,0.08)',
                              }}
                            />
                          ))}
                          {habits.length > 6 && day.completedCount > 6 && (
                            <div
                              className="rounded-full"
                              style={{
                                width: '4px',
                                height: '4px',
                                background: 'rgba(0,255,136,0.5)',
                              }}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ));
          })()}
        </div>

        {/* ── Per-habit this month ─────────────────────────────────────── */}
        <div className="space-y-2">
          <div className="text-[10px] uppercase tracking-wider text-text-muted">
            Consistência por hábito em {now.toLocaleDateString('pt-BR', { month: 'long' })}
          </div>
          <div className="space-y-1.5">
            {habitStats.map((h, i) => (
              <div key={h.id} className="flex items-center gap-2">
                <span className="w-5 shrink-0 text-sm">{h.icon}</span>
                <span className="w-28 shrink-0 truncate text-xs text-text-muted">{h.name}</span>
                <div
                  className="h-2 flex-1 overflow-hidden rounded-full"
                  style={{ background: 'rgba(255,255,255,0.05)' }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${h.rate}%`,
                      background: h.color,
                      opacity: i === 0 ? 0.9 : 0.65,
                    }}
                  />
                </div>
                <span
                  className="w-8 shrink-0 text-right text-[10px] font-bold"
                  style={{ color: h.rate >= 80 ? '#00FF88' : h.rate >= 50 ? '#F5C842' : '#8899BB' }}
                >
                  {h.rate}%
                </span>
                <span className="w-12 shrink-0 text-right text-[9px] text-text-muted">
                  {h.doneDays}/{pastDays.length}d
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Color legend ─────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-4 text-[9px] text-text-muted">
          <div className="flex items-center gap-1.5">
            <div
              className="h-3 w-3 rounded-sm"
              style={{
                background: 'rgba(0,255,136,0.18)',
                border: '1px solid rgba(0,255,136,0.4)',
              }}
            />
            <span>Todos os hábitos</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div
              className="h-3 w-3 rounded-sm"
              style={{
                background: 'rgba(245,200,66,0.1)',
                border: '1px solid rgba(245,200,66,0.2)',
              }}
            />
            <span>Parcial</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-sm" style={{ background: 'rgba(245,200,66,0.8)' }} />
            <span>Hoje</span>
          </div>
        </div>
      </div>
    </div>
  );
}
