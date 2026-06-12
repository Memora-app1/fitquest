import { createClient } from '@/lib/supabase/server';
import { Flame } from 'lucide-react';

const DAY_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const DAY_LONG = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

function toISO(date: Date): string {
  return date.toISOString().split('T')[0]!;
}

function cellColor(count: number): string {
  if (count === 0) return 'rgba(255,255,255,0.04)';
  if (count === 1) return 'rgba(255,77,0,0.35)';
  return '#FF4D00';
}

function cellBorder(count: number): string {
  if (count === 0) return 'rgba(255,255,255,0.04)';
  if (count === 1) return 'rgba(255,77,0,0.4)';
  return 'rgba(255,77,0,0.7)';
}

export async function WorkoutHeatmap({ userId }: { userId: string }) {
  const supabase = await createClient();

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const todayStr = toISO(now);

  // Go back 90 days
  const startDate = new Date(now.getTime() - 89 * 86400000);
  startDate.setHours(0, 0, 0, 0);
  const startStr = toISO(startDate);

  const { data: raw } = await supabase
    .from('workouts')
    .select('started_at, total_volume_kg, total_sets')
    .eq('user_id', userId)
    .gte('started_at', startStr + 'T00:00:00')
    .order('started_at', { ascending: true });

  if (!raw || raw.length === 0) return null;

  // Build day → count map
  const dayMap = new Map<string, number>();
  for (const w of raw) {
    const day = w.started_at.split('T')[0]!;
    dayMap.set(day, (dayMap.get(day) ?? 0) + 1);
  }

  // Build 13-week grid: Mon=0 ... Sun=6
  const firstDayOfWeek = (startDate.getDay() + 6) % 7; // convert Sun=0 to Mon=0
  const numWeeks = Math.ceil((90 + firstDayOfWeek) / 7);

  // grid[weekIdx][dayIdx (0=Mon, 6=Sun)] = {date, count}
  const grid: Array<
    Array<{ date: string; count: number; isToday: boolean; isFuture: boolean } | null>
  > = [];
  for (let w = 0; w < numWeeks; w++) {
    const week: Array<{ date: string; count: number; isToday: boolean; isFuture: boolean } | null> =
      [];
    for (let d = 0; d < 7; d++) {
      const cellIdx = w * 7 + d;
      const offset = cellIdx - firstDayOfWeek;
      if (offset < 0 || offset >= 90) {
        week.push(null);
      } else {
        const date = new Date(startDate.getTime() + offset * 86400000);
        const dateStr = toISO(date);
        const isToday = dateStr === todayStr;
        const isFuture = dateStr > todayStr;
        const count = dayMap.get(dateStr) ?? 0;
        week.push({ date: dateStr, count, isToday, isFuture });
      }
    }
    grid.push(week);
  }

  // Stats
  const totalWorkouts = raw.length;
  const activeDays = dayMap.size;
  const maxInDay = Math.max(...dayMap.values(), 1);

  // Per-day-of-week breakdown (0=Mon, 6=Sun)
  const dowCount = [0, 0, 0, 0, 0, 0, 0];
  for (const [dateStr, cnt] of dayMap.entries()) {
    const dow = (new Date(dateStr + 'T12:00:00').getDay() + 6) % 7;
    dowCount[dow] = (dowCount[dow] ?? 0) + cnt;
  }
  const maxDow = Math.max(...dowCount, 1);
  const favoriteDow = dowCount.indexOf(Math.max(...dowCount));

  // Streak calculation
  let currentStreak = 0;
  const checkDate = new Date(now);
  while (dayMap.has(toISO(checkDate))) {
    currentStreak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  // Week labels: show first day of each week (Mon), abbreviated
  const weekLabels: (string | null)[] = grid.map((_, w) => {
    const firstCell = grid[w]?.find((c) => c !== null);
    if (!firstCell) return null;
    const d = new Date(firstCell.date + 'T12:00:00');
    // Show month label when month changes
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  });
  // Only show every 2nd label to avoid crowding
  const sparseLabels = weekLabels.map((l, i) => (i % 2 === 0 ? l : null));

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-5 md:p-6"
      style={{
        background:
          'linear-gradient(135deg, rgba(255,77,0,0.06) 0%, rgba(13,24,41,0.98) 60%, rgba(245,200,66,0.03) 100%)',
        border: '1px solid rgba(255,77,0,0.14)',
      }}
    >
      {/* Corner glow */}
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full blur-3xl"
        style={{ background: 'rgba(255,77,0,0.07)' }}
      />

      <div className="relative z-10 space-y-5">
        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <div
                className="flex h-6 w-6 items-center justify-center rounded-lg"
                style={{
                  background: 'rgba(255,77,0,0.12)',
                  border: '1px solid rgba(255,77,0,0.22)',
                }}
              >
                <Flame size={12} style={{ color: '#FF4D00' }} />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-text-muted">
                Frequência de Treinos
              </span>
            </div>
            <h2 className="text-xl font-black leading-tight">Últimos 90 dias</h2>
            <p className="mt-0.5 text-sm text-text-muted">
              {totalWorkouts} sessão{totalWorkouts !== 1 ? 'ões' : ''} em {activeDays} dia
              {activeDays !== 1 ? 's' : ''}
            </p>
          </div>

          {currentStreak > 0 && (
            <div
              className="flex shrink-0 items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold"
              style={{
                background: 'rgba(255,77,0,0.1)',
                border: '1px solid rgba(255,77,0,0.2)',
                color: '#FF4D00',
              }}
            >
              🔥 {currentStreak} dia{currentStreak !== 1 ? 's' : ''} seguido
              {currentStreak !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* ── Summary strip ───────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-2.5">
          {[
            {
              label: 'Treinos (90d)',
              value: String(totalWorkouts),
              color: '#FF4D00',
              rgb: '255,77,0',
            },
            {
              label: 'Dias ativos',
              value: String(activeDays),
              color: '#F5C842',
              rgb: '245,200,66',
            },
            {
              label: 'Dia favorito',
              value: DAY_LABELS[favoriteDow] ?? '–',
              color: '#00FF88',
              rgb: '0,255,136',
            },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl p-3 text-center"
              style={{
                background: `linear-gradient(135deg, rgba(${s.rgb},0.07) 0%, rgba(13,24,41,0.98) 100%)`,
                border: `1px solid rgba(${s.rgb},0.16)`,
              }}
            >
              <div className="mb-1.5 text-[10px] uppercase leading-none tracking-wider text-text-muted">
                {s.label}
              </div>
              <div className="text-sm font-black leading-none" style={{ color: s.color }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>

        {/* ── Heatmap grid ────────────────────────────────────────────── */}
        <div className="space-y-2">
          {/* Week labels row */}
          <div className="mb-1 flex gap-1">
            <div className="w-7 shrink-0" />
            <div
              className="grid flex-1 gap-1"
              style={{ gridTemplateColumns: `repeat(${numWeeks}, 1fr)` }}
            >
              {sparseLabels.map((label, i) => (
                <div key={i} className="truncate text-center text-[8px] text-text-muted">
                  {label ?? ''}
                </div>
              ))}
            </div>
          </div>

          {/* Day rows */}
          {DAY_LABELS.map((dayLabel, dayIdx) => (
            <div key={dayLabel} className="flex items-center gap-1">
              {/* Day label */}
              <div className="w-7 shrink-0 pr-1 text-right text-[9px] text-text-muted">
                {dayIdx % 2 === 0 ? dayLabel : ''}
              </div>
              {/* Cells */}
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
                  return (
                    <div
                      key={weekIdx}
                      title={`${cell.date}: ${cell.count} treino${cell.count !== 1 ? 's' : ''}`}
                      className="rounded-sm transition-all"
                      style={{
                        paddingBottom: '100%',
                        background: cell.isFuture
                          ? 'transparent'
                          : cell.isToday
                            ? cell.count > 0
                              ? '#FF4D00'
                              : 'rgba(255,77,0,0.15)'
                            : cellColor(cell.count),
                        border: `1px solid ${cell.isFuture ? 'transparent' : cell.isToday ? 'rgba(255,77,0,0.8)' : cellBorder(cell.count)}`,
                        boxShadow:
                          cell.isToday && cell.count > 0 ? '0 0 6px rgba(255,77,0,0.5)' : 'none',
                      }}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* ── Color legend ────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 text-[10px] text-text-muted">
          <span>Menos</span>
          {[0, 1, 2].map((c) => (
            <div
              key={c}
              className="h-3 w-3 rounded-sm"
              style={{ background: cellColor(c), border: `1px solid ${cellBorder(c)}` }}
            />
          ))}
          <span>Mais</span>
        </div>

        {/* ── Day-of-week frequency bars ───────────────────────────────── */}
        <div className="space-y-2">
          <div className="text-[10px] uppercase tracking-wider text-text-muted">Padrão semanal</div>
          <div className="grid gap-1.5">
            {DAY_LONG.map((day, i) => {
              const count = dowCount[i] ?? 0;
              const barPct = Math.round((count / maxDow) * 100);
              return (
                <div key={day} className="flex items-center gap-2">
                  <span className="w-12 shrink-0 text-[10px] text-text-muted">{day}</span>
                  <div
                    className="h-2 flex-1 overflow-hidden rounded-full"
                    style={{ background: 'rgba(255,255,255,0.04)' }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${barPct}%`,
                        background: i === favoriteDow ? '#FF4D00' : 'rgba(255,77,0,0.4)',
                      }}
                    />
                  </div>
                  <span
                    className="w-6 text-right text-[10px] font-bold"
                    style={{ color: i === favoriteDow ? '#FF4D00' : '#5A6B8A' }}
                  >
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Insight footer ───────────────────────────────────────────── */}
        <div
          className="flex items-center gap-3 rounded-xl px-4 py-3"
          style={{ background: 'rgba(255,77,0,0.04)', border: '1px solid rgba(255,77,0,0.1)' }}
        >
          <span className="shrink-0 text-xl">
            {activeDays >= 60 ? '🔥' : activeDays >= 30 ? '💪' : activeDays >= 15 ? '⚡' : '🌱'}
          </span>
          <div>
            <p className="text-sm font-semibold leading-snug">
              {activeDays >= 60
                ? `${activeDays}/90 dias de treino — dedicação de alto nível!`
                : activeDays >= 30
                  ? `${activeDays}/90 dias de treino — ótima consistência.`
                  : activeDays >= 15
                    ? `${activeDays}/90 dias de treino — bom ritmo, continue!`
                    : `${activeDays}/90 dias de treino — cada sessão conta!`}
            </p>
            {favoriteDow >= 0 && (dowCount[favoriteDow] ?? 0) > 0 && (
              <p className="mt-0.5 text-[11px] text-text-muted">
                Você treina mais às{' '}
                <span className="font-bold" style={{ color: '#FF4D00' }}>
                  {DAY_LONG[favoriteDow]}s
                </span>{' '}
                — {dowCount[favoriteDow]} sessão{(dowCount[favoriteDow] ?? 0) !== 1 ? 'ões' : ''} em
                90 dias
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
