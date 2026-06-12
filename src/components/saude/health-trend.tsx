'use client';

/**
 * HealthTrend — gráfico de barras dos últimos 7 dias para água e sono.
 * Client component necessário para Recharts.
 */

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';

import { WATER_GOAL_ML, SLEEP_GOAL_H } from '@/lib/constants';

const DAY_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

interface WaterDay {
  date: string;
  total: number;
}
interface SleepDay {
  date: string;
  hours: number | null;
  quality: number | null;
}

interface RechartsTooltipProps {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}

interface Props {
  waterDays: WaterDay[];
  sleepDays: SleepDay[];
}

function dayLabel(dateStr: string) {
  const d = new Date(dateStr + 'T12:00:00');
  return DAY_SHORT[d.getDay()] ?? '';
}

function waterColor(ml: number) {
  if (ml >= WATER_GOAL_ML) return '#00D9FF';
  if (ml >= WATER_GOAL_ML * 0.6) return '#3B82F6';
  return '#1F2D45';
}

function sleepColor(h: number | null) {
  if (!h) return '#1F2D45';
  if (h >= 8) return '#00FF88';
  if (h >= 7) return '#F5C842';
  if (h >= 6) return '#FF4D00';
  return '#EF4444';
}

function WaterTooltip({ active, payload, label }: RechartsTooltipProps) {
  if (!active || !payload?.length) return null;
  const ml = payload[0]?.value as number;
  return (
    <div
      className="rounded-xl px-3 py-2 text-xs font-semibold shadow-xl"
      style={{ background: '#0D1829', border: '1px solid rgba(0,217,255,0.3)' }}
    >
      <div className="mb-0.5 text-text-muted">{label}</div>
      <div style={{ color: '#00D9FF' }}>
        {ml >= 1000 ? `${(ml / 1000).toFixed(1)}L` : `${ml}ml`}
      </div>
      {ml >= WATER_GOAL_ML && (
        <div className="text-[10px]" style={{ color: '#00FF88' }}>
          ✓ meta
        </div>
      )}
    </div>
  );
}

function SleepTooltip({ active, payload, label }: RechartsTooltipProps) {
  if (!active || !payload?.length) return null;
  const h = payload[0]?.value as number;
  const hours = Math.floor(h);
  const mins = Math.round((h - hours) * 60);
  const str = mins === 0 ? `${hours}h` : `${hours}h${mins}m`;
  return (
    <div
      className="rounded-xl px-3 py-2 text-xs font-semibold shadow-xl"
      style={{ background: '#0D1829', border: '1px solid rgba(124,58,237,0.3)' }}
    >
      <div className="mb-0.5 text-text-muted">{label}</div>
      <div style={{ color: '#7C3AED' }}>{h > 0 ? str : '—'}</div>
      {h >= SLEEP_GOAL_H && (
        <div className="text-[10px]" style={{ color: '#00FF88' }}>
          ✓ meta
        </div>
      )}
    </div>
  );
}

export function HealthTrend({ waterDays, sleepDays }: Props) {
  // Garantir 7 dias mesmo sem dados
  const today = new Date();
  const days7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    return d.toISOString().split('T')[0]!;
  });

  const waterData = days7.map((date) => {
    const found = waterDays.find((w) => w.date === date);
    return { date, label: dayLabel(date), total: found?.total ?? 0 };
  });

  const sleepData = days7.map((date) => {
    const found = sleepDays.find((s) => s.date === date);
    return { date, label: dayLabel(date), hours: found?.hours ?? 0 };
  });

  const hasWaterData = waterData.some((d) => d.total > 0);
  const hasSleepData = sleepData.some((d) => (d.hours ?? 0) > 0);

  return (
    <div
      className="animate-fade-in rounded-2xl p-5 md:p-6"
      style={{
        background:
          'linear-gradient(135deg, rgba(0,217,255,0.05) 0%, rgba(13,24,41,0.98) 55%, rgba(124,58,237,0.04) 100%)',
        border: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {/* Header */}
      <div className="mb-5 flex items-center gap-2">
        <div
          className="flex h-6 w-6 items-center justify-center rounded-lg"
          style={{ background: 'rgba(0,217,255,0.12)', border: '1px solid rgba(0,217,255,0.25)' }}
        >
          <span className="text-[10px]">📈</span>
        </div>
        <span className="text-xs font-bold uppercase tracking-widest text-text-muted">
          Tendência — 7 dias
        </span>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Água */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-sm">💧</span>
              <span className="text-sm font-bold">Hidratação</span>
            </div>
            <span className="text-[10px] text-text-muted">meta 2L</span>
          </div>

          {!hasWaterData ? (
            <div className="flex h-[100px] items-center justify-center">
              <p className="text-xs text-text-muted">Nenhum registro ainda</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={100}>
              <BarChart data={waterData} barCategoryGap="20%">
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#5A6B85', fontSize: 9 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  hide
                  domain={[0, Math.max(WATER_GOAL_ML * 1.2, ...waterData.map((d) => d.total))]}
                />
                <Tooltip content={<WaterTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <ReferenceLine
                  y={WATER_GOAL_ML}
                  stroke="rgba(0,217,255,0.25)"
                  strokeDasharray="3 3"
                />
                <Bar dataKey="total" radius={[4, 4, 0, 0]} maxBarSize={28}>
                  {waterData.map((entry) => (
                    <Cell key={entry.date} fill={waterColor(entry.total)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Sono */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-sm">🌙</span>
              <span className="text-sm font-bold">Sono</span>
            </div>
            <span className="text-[10px] text-text-muted">meta 7h</span>
          </div>

          {!hasSleepData ? (
            <div className="flex h-[100px] items-center justify-center">
              <p className="text-xs text-text-muted">Nenhum registro ainda</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={100}>
              <BarChart data={sleepData} barCategoryGap="20%">
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#5A6B85', fontSize: 9 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide domain={[0, 12]} />
                <Tooltip content={<SleepTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <ReferenceLine
                  y={SLEEP_GOAL_H}
                  stroke="rgba(124,58,237,0.3)"
                  strokeDasharray="3 3"
                />
                <Bar dataKey="hours" radius={[4, 4, 0, 0]} maxBarSize={28}>
                  {sleepData.map((entry) => (
                    <Cell key={entry.date} fill={sleepColor(entry.hours)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Legenda */}
      <div
        className="mt-4 flex flex-wrap gap-3 pt-4"
        style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
      >
        {[
          { color: '#00D9FF', label: 'Meta atingida (água)' },
          { color: '#00FF88', label: 'Sono ideal (8h+)' },
          { color: '#F5C842', label: 'Sono ok (7–8h)' },
          { color: '#FF4D00', label: 'Sono baixo (6–7h)' },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: l.color }} />
            <span className="text-[10px] text-text-muted">{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
