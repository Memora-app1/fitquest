import { createClient } from '@/lib/supabase/server';
import { Activity } from 'lucide-react';

interface DayActivity {
  date: string;
  habits: boolean;
  tasks: boolean;
  workout: boolean;
  xp: number;
  score: number; // 0-3: domains active
}

function toISO(d: Date): string {
  return d.toISOString().split('T')[0]!;
}

function cellColor(score: number, xp: number): string {
  if (score === 0) return 'rgba(255,255,255,0.04)';
  if (score === 3) return xp >= 100 ? '#00FF88' : 'rgba(0,255,136,0.7)';
  if (score === 2) return 'rgba(245,200,66,0.7)';
  return 'rgba(255,77,0,0.5)';
}

function cellBorder(score: number, isToday: boolean): string {
  if (isToday) return 'rgba(245,200,66,0.8)';
  if (score === 3) return 'rgba(0,255,136,0.5)';
  if (score === 2) return 'rgba(245,200,66,0.4)';
  if (score === 1) return 'rgba(255,77,0,0.3)';
  return 'rgba(255,255,255,0.04)';
}

const DOW_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

export async function DailyActivityMap({ userId }: { userId: string }) {
  const supabase = await createClient();

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const todayStr = toISO(now);

  // Go back 60 days
  const startDate = new Date(now.getTime() - 59 * 86400000);
  const startStr = toISO(startDate);

  const [habLogsRes, taskDoneRes, workoutsRes, xpRes] = await Promise.all([
    // Habit logs (just dates)
    supabase
      .from('habit_logs')
      .select('logged_date')
      .eq('user_id', userId)
      .gte('logged_date', startStr)
      .limit(3000),
    // Tasks completed
    supabase
      .from('tasks')
      .select('completed_at')
      .eq('user_id', userId)
      .eq('status', 'done')
      .gte('completed_at', startStr + 'T00:00:00')
      .not('completed_at', 'is', null),
    // Workouts
    supabase
      .from('workouts')
      .select('started_at')
      .eq('user_id', userId)
      .gte('started_at', startStr + 'T00:00:00'),
    // XP per day
    supabase
      .from('xp_transactions')
      .select('amount, created_at')
      .eq('user_id', userId)
      .gte('created_at', startStr + 'T00:00:00')
      .limit(3000),
  ]);

  // Build per-day sets
  const habitDays = new Set((habLogsRes.data ?? []).map((r) => r.logged_date as string));
  const taskDays = new Set(
    (taskDoneRes.data ?? []).map((r) => (r.completed_at as string).split('T')[0])
  );
  const workoutDays = new Set(
    (workoutsRes.data ?? []).map((r) => (r.started_at as string).split('T')[0])
  );

  // XP per day
  const xpByDay = new Map<string, number>();
  for (const r of xpRes.data ?? []) {
    const d = (r.created_at as string).split('T')[0]!;
    xpByDay.set(d, (xpByDay.get(d) ?? 0) + (r.amount as number));
  }

  // Build day activities for last 60 days
  const days: DayActivity[] = [];
  for (let offset = 0; offset < 60; offset++) {
    const d = new Date(startDate.getTime() + offset * 86400000);
    const date = toISO(d);
    const h = habitDays.has(date);
    const t = taskDays.has(date);
    const w = workoutDays.has(date);
    const xp = xpByDay.get(date) ?? 0;
    const score = (h ? 1 : 0) + (t ? 1 : 0) + (w ? 1 : 0);
    days.push({ date, habits: h, tasks: t, workout: w, xp, score });
  }

  const activeDays = days.filter((d) => d.score > 0).length;
  const perfectDays = days.filter((d) => d.score === 3).length;
  const totalXp60 = days.reduce((s, d) => s + d.xp, 0);
  const avgDailyXp = activeDays > 0 ? Math.round(totalXp60 / activeDays) : 0;

  // Streak of consecutive days with any activity
  let currentStreak = 0;
  const cursor = new Date();
  for (let offset = 0; offset <= 60; offset++) {
    cursor.setDate(new Date().getDate() - offset);
    const ds = toISO(cursor);
    const day = days.find((d) => d.date === ds);
    if (day && day.score > 0) {
      currentStreak++;
    } else if (offset > 0) {
      break;
    }
  }

  // Build heatmap grid (Mon=0, Sun=6)
  const firstDayOfWeek = (startDate.getDay() + 6) % 7;
  const numWeeks = Math.ceil((60 + firstDayOfWeek) / 7);

  const grid: Array<Array<{ day: DayActivity; isToday: boolean; isFuture: boolean } | null>> = [];
  for (let w = 0; w < numWeeks; w++) {
    const week: Array<{ day: DayActivity; isToday: boolean; isFuture: boolean } | null> = [];
    for (let d = 0; d < 7; d++) {
      const cellIdx = w * 7 + d;
      const offset = cellIdx - firstDayOfWeek;
      if (offset < 0 || offset >= 60) {
        week.push(null);
      } else {
        const dayData = days[offset] ?? null;
        if (!dayData) {
          week.push(null);
        } else {
          week.push({
            day: dayData,
            isToday: dayData.date === todayStr,
            isFuture: dayData.date > todayStr,
          });
        }
      }
    }
    grid.push(week);
  }

  if (activeDays === 0) return null;

  // Week labels (first date of each week)
  const weekLabels = grid.map((week) => {
    const first = week.find((c) => c !== null);
    if (!first) return null;
    const d = new Date(first.day.date + 'T12:00:00');
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  });
  const sparseLabels = weekLabels.map((l, i) => (i % 2 === 0 ? l : null));

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-5 md:p-6"
      style={{
        background:
          'linear-gradient(135deg, rgba(0,255,136,0.05) 0%, rgba(13,24,41,0.98) 60%, rgba(245,200,66,0.03) 100%)',
        border: '1px solid rgba(0,255,136,0.1)',
      }}
    >
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full blur-3xl"
        style={{ background: 'rgba(0,255,136,0.05)' }}
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
                <Activity size={12} style={{ color: '#00FF88' }} />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-text-muted">
                Mapa de Atividade — 60 dias
              </span>
            </div>
            <h2 className="text-xl font-black leading-tight">Consistência Geral</h2>
            <p className="mt-0.5 text-sm text-text-muted">
              {activeDays} dias ativos · {perfectDays} dia{perfectDays !== 1 ? 's' : ''} perfeito
              {perfectDays !== 1 ? 's' : ''}
            </p>
          </div>
          {currentStreak > 0 && (
            <div
              className="flex shrink-0 items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold"
              style={{
                background: 'rgba(0,255,136,0.1)',
                border: '1px solid rgba(0,255,136,0.2)',
                color: '#00FF88',
              }}
            >
              🔥 {currentStreak} dia{currentStreak !== 1 ? 's' : ''} seguido
              {currentStreak !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* ── Summary strip ───────────────────────────────────────────── */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Dias ativos', value: String(activeDays), color: '#00FF88', rgb: '0,255,136' },
            {
              label: 'Dias perfeitos',
              value: String(perfectDays),
              color: '#F5C842',
              rgb: '245,200,66',
            },
            {
              label: 'XP (60d)',
              value: totalXp60 >= 1000 ? `${(totalXp60 / 1000).toFixed(1)}k` : String(totalXp60),
              color: '#F5C842',
              rgb: '245,200,66',
            },
            {
              label: 'XP/dia ativo',
              value: String(avgDailyXp),
              color: '#7C3AED',
              rgb: '124,58,237',
            },
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

        {/* ── Heatmap grid ────────────────────────────────────────────── */}
        <div className="space-y-1.5">
          {/* Week labels */}
          <div className="flex gap-1">
            <div className="w-7 shrink-0" />
            <div
              className="grid flex-1 gap-1"
              style={{ gridTemplateColumns: `repeat(${numWeeks}, 1fr)` }}
            >
              {sparseLabels.map((label, i) => (
                <div key={i} className="truncate text-center text-[7px] text-text-muted">
                  {label ?? ''}
                </div>
              ))}
            </div>
          </div>

          {/* Day rows */}
          {DOW_LABELS.map((dayLabel, dayIdx) => (
            <div key={dayLabel} className="flex items-center gap-1">
              <div className="w-7 shrink-0 pr-1 text-right text-[9px] text-text-muted">
                {dayIdx % 2 === 0 ? dayLabel : ''}
              </div>
              <div
                className="grid flex-1 gap-1"
                style={{ gridTemplateColumns: `repeat(${numWeeks}, 1fr)` }}
              >
                {grid.map((week, weekIdx) => {
                  const cell = week[dayIdx];
                  if (!cell) {
                    return (
                      <div
                        key={weekIdx}
                        className="rounded-sm"
                        style={{ paddingBottom: '100%', background: 'transparent' }}
                      />
                    );
                  }
                  const { day, isToday, isFuture } = cell;
                  const domainDots = [
                    { active: day.habits, color: '#00FF88', label: 'H' },
                    { active: day.tasks, color: '#7C3AED', label: 'T' },
                    { active: day.workout, color: '#FF4D00', label: 'W' },
                  ];
                  return (
                    <div
                      key={weekIdx}
                      title={[
                        day.date,
                        day.habits ? '✅ Hábitos' : '',
                        day.tasks ? '✅ Tarefas' : '',
                        day.workout ? '✅ Treino' : '',
                        day.xp > 0 ? `+${day.xp} XP` : '',
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                      className="relative rounded-sm"
                      style={{
                        paddingBottom: '100%',
                        background: isFuture ? 'transparent' : cellColor(day.score, day.xp),
                        border: `1px solid ${isFuture ? 'transparent' : cellBorder(day.score, isToday)}`,
                        boxShadow: isToday
                          ? '0 0 6px rgba(245,200,66,0.5)'
                          : day.score === 3
                            ? '0 0 4px rgba(0,255,136,0.3)'
                            : 'none',
                      }}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* ── Color legend ────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-4 text-[9px] text-text-muted">
          <div className="flex items-center gap-1.5">
            <div
              className="h-3 w-3 rounded-sm"
              style={{ background: 'rgba(255,77,0,0.5)', border: '1px solid rgba(255,77,0,0.3)' }}
            />
            <span>1 domínio</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div
              className="h-3 w-3 rounded-sm"
              style={{
                background: 'rgba(245,200,66,0.7)',
                border: '1px solid rgba(245,200,66,0.4)',
              }}
            />
            <span>2 domínios</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div
              className="h-3 w-3 rounded-sm"
              style={{ background: '#00FF88', border: '1px solid rgba(0,255,136,0.5)' }}
            />
            <span>3 domínios (dia perfeito)</span>
          </div>
        </div>

        {/* ── Domain activity stats ────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-2">
          {[
            {
              label: 'Hábitos',
              count: days.filter((d) => d.habits).length,
              color: '#00FF88',
              rgb: '0,255,136',
              emoji: '🔥',
            },
            {
              label: 'Tarefas',
              count: days.filter((d) => d.tasks).length,
              color: '#7C3AED',
              rgb: '124,58,237',
              emoji: '✅',
            },
            {
              label: 'Treinos',
              count: days.filter((d) => d.workout).length,
              color: '#FF4D00',
              rgb: '255,77,0',
              emoji: '💪',
            },
          ].map((s) => {
            const pct = Math.round((s.count / 60) * 100);
            return (
              <div
                key={s.label}
                className="rounded-xl p-3"
                style={{
                  background: `rgba(${s.rgb},0.07)`,
                  border: `1px solid rgba(${s.rgb},0.14)`,
                }}
              >
                <div className="mb-1.5 flex items-center gap-1">
                  <span className="text-base">{s.emoji}</span>
                  <span className="text-[10px] text-text-muted">{s.label}</span>
                </div>
                <div className="text-xl font-black leading-none" style={{ color: s.color }}>
                  {pct}%
                </div>
                <div className="mt-0.5 text-[9px] text-text-muted">{s.count} de 60 dias</div>
                <div
                  className="mt-2 h-1 overflow-hidden rounded-full"
                  style={{ background: 'rgba(255,255,255,0.06)' }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct}%`, background: s.color, opacity: 0.75 }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
