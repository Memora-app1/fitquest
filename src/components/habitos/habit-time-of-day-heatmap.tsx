import { createClient } from '@/lib/supabase/server';
import { Clock } from 'lucide-react';

export async function HabitTimeOfDayHeatmap({ userId }: { userId: string }) {
  const supabase = await createClient();

  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();

  const { data: logs } = await supabase
    .from('habit_logs')
    .select('created_at, habit_id')
    .eq('user_id', userId)
    .gte('created_at', thirtyDaysAgo)
    .limit(2000);

  if (!logs || logs.length < 3) return null;

  // Group by hour of day (0-23) using local time
  const hourCounts = new Array(24).fill(0) as number[];
  for (const log of logs) {
    const hour = new Date(log.created_at).getHours();
    hourCounts[hour] = (hourCounts[hour] ?? 0) + 1;
  }

  const maxCount = Math.max(...hourCounts);
  if (maxCount === 0) return null;

  const peakHour = hourCounts.indexOf(maxCount);
  const totalLogs = logs.length;

  const periods = [
    {
      label: 'Madrugada',
      hours: [0, 1, 2, 3, 4, 5],
      color: '#7C3AED',
      rgb: '124,58,237',
      emoji: '🌙',
    },
    {
      label: 'Manhã',
      hours: [6, 7, 8, 9, 10, 11],
      color: '#F5C842',
      rgb: '245,200,66',
      emoji: '🌅',
    },
    {
      label: 'Tarde',
      hours: [12, 13, 14, 15, 16, 17],
      color: '#FF4D00',
      rgb: '255,77,0',
      emoji: '☀️',
    },
    {
      label: 'Noite',
      hours: [18, 19, 20, 21, 22, 23],
      color: '#00FF88',
      rgb: '0,255,136',
      emoji: '🌆',
    },
  ];

  const periodCounts = periods.map((p) => ({
    ...p,
    count: p.hours.reduce((sum, h) => sum + hourCounts[h]!, 0),
  }));

  const maxPeriodCount = Math.max(...periodCounts.map((p) => p.count));
  const bestPeriod = periodCounts.reduce((best, p) => (p.count > best.count ? p : best));

  function formatHour(h: number): string {
    return `${String(h).padStart(2, '0')}h`;
  }

  function periodForHour(h: number) {
    return periods.find((p) => p.hours.includes(h)) ?? periods[1]!;
  }

  const morningPct = totalLogs > 0 ? Math.round((periodCounts[1]!.count / totalLogs) * 100) : 0;
  const insight =
    bestPeriod.label === 'Manhã'
      ? 'Você é uma pessoa matutina — ótimo para consistência!'
      : bestPeriod.label === 'Tarde'
        ? 'Seu pico é na tarde — bloqueie esse horário para hábitos.'
        : bestPeriod.label === 'Noite'
          ? 'Você fecha o dia registrando hábitos. Consistente!'
          : 'Hábitos na madrugada? Disciplina de outro nível.';

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-5"
      style={{
        background: 'linear-gradient(135deg, rgba(124,58,237,0.07) 0%, rgba(13,24,41,0.98) 100%)',
        border: '1px solid rgba(124,58,237,0.15)',
      }}
    >
      <div
        className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full blur-3xl"
        style={{ background: 'rgba(124,58,237,0.1)' }}
      />

      <div className="relative z-10 space-y-4">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div
              className="flex h-6 w-6 items-center justify-center rounded-lg"
              style={{
                background: 'rgba(124,58,237,0.15)',
                border: '1px solid rgba(124,58,237,0.3)',
              }}
            >
              <Clock size={12} style={{ color: '#7C3AED' }} />
            </div>
            <div>
              <div className="text-sm font-black">Horário dos hábitos</div>
              <div className="text-[10px] text-text-muted">
                {totalLogs} registros nos últimos 30 dias
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-sm font-black" style={{ color: bestPeriod.color }}>
              {bestPeriod.emoji} {bestPeriod.label}
            </div>
            <div className="text-[10px] text-text-muted">pico às {formatHour(peakHour)}</div>
          </div>
        </div>

        {/* 24h bar chart */}
        <div>
          <div className="flex h-16 items-end gap-[2px]">
            {hourCounts.map((count, hour) => {
              const period = periodForHour(hour);
              const height = maxCount > 0 ? Math.max(3, (count / maxCount) * 100) : 3;
              const isPeak = hour === peakHour;
              return (
                <div
                  key={hour}
                  className="flex flex-1 flex-col justify-end"
                  style={{ height: '100%' }}
                >
                  <div
                    className="w-full rounded-t-[2px] transition-all"
                    style={{
                      height: `${height}%`,
                      background:
                        count === 0
                          ? 'rgba(255,255,255,0.04)'
                          : isPeak
                            ? period.color
                            : `rgba(${period.rgb},0.45)`,
                      boxShadow: isPeak ? `0 0 8px ${period.color}50` : 'none',
                    }}
                  />
                </div>
              );
            })}
          </div>

          {/* Hour axis labels */}
          <div className="mt-1 flex">
            {[0, 6, 12, 18].map((h) => (
              <div key={h} className="text-[9px] text-text-muted" style={{ width: '25%' }}>
                {formatHour(h)}
              </div>
            ))}
          </div>
        </div>

        {/* Period breakdown grid */}
        <div className="grid grid-cols-4 gap-2">
          {periodCounts.map((p) => {
            const pct = totalLogs > 0 ? Math.round((p.count / totalLogs) * 100) : 0;
            const isBest = p.label === bestPeriod.label;
            return (
              <div
                key={p.label}
                className="rounded-xl p-2.5 text-center"
                style={{
                  background: isBest ? `rgba(${p.rgb},0.1)` : 'rgba(255,255,255,0.03)',
                  border: isBest
                    ? `1px solid rgba(${p.rgb},0.3)`
                    : '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <div className="mb-0.5 text-base">{p.emoji}</div>
                <div className="text-xs font-black" style={{ color: isBest ? p.color : '#8899BB' }}>
                  {pct}%
                </div>
                <div className="truncate text-[9px] text-text-muted">{p.label}</div>
                <div
                  className="mt-1.5 h-1 overflow-hidden rounded-full"
                  style={{ background: 'rgba(255,255,255,0.06)' }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${maxPeriodCount > 0 ? (p.count / maxPeriodCount) * 100 : 0}%`,
                      background: p.color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Insight footer */}
        <div
          className="flex items-center gap-2 rounded-xl px-3 py-2.5"
          style={{
            background: `rgba(${bestPeriod.rgb},0.05)`,
            border: `1px solid rgba(${bestPeriod.rgb},0.12)`,
          }}
        >
          <span className="shrink-0 text-base">{bestPeriod.emoji}</span>
          <p className="text-[11px] leading-snug text-text-secondary">{insight}</p>
        </div>
      </div>
    </div>
  );
}
