'use client';

import { useEffect, useRef, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';

export interface DayXP {
  date: string; // YYYY-MM-DD
  label: string; // 'Hoje', '23/05', etc.
  total: number;
  habit: number;
  task: number;
  workout: number;
  other: number;
  isToday: boolean;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload: DayXP }>;
  label?: string;
}

function ChartTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  if (!row) return null;

  const sources = [
    { key: 'habit', label: 'Hábitos', color: '#00FF88' },
    { key: 'task', label: 'Tarefas', color: '#7C3AED' },
    { key: 'workout', label: 'Treinos', color: '#FF4D00' },
    { key: 'other', label: 'Outros', color: '#8899BB' },
  ] as const;

  return (
    <div
      className="pointer-events-none min-w-[155px] rounded-xl px-3.5 py-3 text-sm"
      style={{
        background: 'rgba(13,24,41,0.98)',
        border: '1px solid rgba(245,200,66,0.3)',
        boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
      }}
    >
      <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-text-muted">
        {label}
      </div>
      <div className="text-base font-black" style={{ color: '#F5C842' }}>
        +{row.total.toLocaleString('pt-BR')} XP
      </div>
      {row.total > 0 && (
        <div
          className="mt-2 space-y-1 pt-2"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
        >
          {sources.map((s) => {
            const val = row[s.key];
            if (val === 0) return null;
            return (
              <div key={s.key} className="flex items-center justify-between">
                <span className="text-[10px] text-text-muted">{s.label}</span>
                <span className="text-[10px] font-bold" style={{ color: s.color }}>
                  +{val}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function formatXP(v: number): string {
  if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
  return String(Math.round(v));
}

export function XpHistoryChart({ data }: { data: DayXP[] }) {
  const [animated, setAnimated] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setTimeout(() => setAnimated(true), 100);
          obs.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  if (!data.length) return null;

  const totalXP = data.reduce((s, d) => s + d.total, 0);
  const activeDays = data.filter((d) => d.total > 0);
  const avgXP = activeDays.length > 0 ? Math.round(totalXP / activeDays.length) : 0;
  const bestDay = [...data].sort((a, b) => b.total - a.total)[0];
  const today = data.find((d) => d.isToday);

  // Source breakdown totals
  const srcHabit = data.reduce((s, d) => s + d.habit, 0);
  const srcTask = data.reduce((s, d) => s + d.task, 0);
  const srcWorkout = data.reduce((s, d) => s + d.workout, 0);
  const srcOther = data.reduce((s, d) => s + d.other, 0);
  const srcTotal = srcHabit + srcTask + srcWorkout + srcOther;

  const sources = [
    { label: 'Hábitos', value: srcHabit, color: '#00FF88' },
    { label: 'Tarefas', value: srcTask, color: '#7C3AED' },
    { label: 'Treinos', value: srcWorkout, color: '#FF4D00' },
    { label: 'Outros', value: srcOther, color: '#8899BB' },
  ]
    .filter((s) => s.value > 0)
    .sort((a, b) => b.value - a.value);

  return (
    <div ref={containerRef} className="space-y-5">
      {/* ── Summary strip ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-2.5">
        {[
          {
            label: 'XP (30 dias)',
            value: `+${totalXP >= 1000 ? `${(totalXP / 1000).toFixed(1)}k` : totalXP}`,
            color: '#F5C842',
            rgb: '245,200,66',
          },
          { label: 'Média diária', value: `+${avgXP}`, color: '#FF4D00', rgb: '255,77,0' },
          {
            label: 'Hoje',
            value: today ? `+${today.total}` : '–',
            color: today && today.total > avgXP ? '#00FF88' : '#8899BB',
            rgb: today && today.total > avgXP ? '0,255,136' : '136,153,187',
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

      {/* ── Area chart ─────────────────────────────────────────────────── */}
      <ResponsiveContainer width="100%" height={185}>
        <AreaChart data={data} margin={{ top: 10, right: 4, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="xpGradFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F5C842" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#F5C842" stopOpacity={0.02} />
            </linearGradient>
          </defs>

          <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.03)" />

          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={(props: { x: number; y: number; payload: { value: string }; index: number }) => {
              const item = data[props.index];
              const isToday = item?.isToday ?? false;
              const isBest =
                item?.total === bestDay?.total && (bestDay?.total ?? 0) > 0 && !isToday;
              // Only show every 5th label to avoid crowding (30 days)
              const showLabel = props.index % 5 === 0 || isToday || isBest;
              if (!showLabel) return <g />;
              return (
                <g transform={`translate(${props.x},${props.y})`}>
                  {isToday && (
                    <rect
                      x={-12}
                      y={4}
                      width={24}
                      height={14}
                      rx={7}
                      fill="rgba(245,200,66,0.15)"
                    />
                  )}
                  <text
                    x={0}
                    y={13}
                    textAnchor="middle"
                    fontSize={9}
                    fontWeight={isToday || isBest ? 700 : 400}
                    fill={isToday ? '#F5C842' : isBest ? '#FF4D00' : '#5A6B8A'}
                  >
                    {isToday ? 'Hoje' : props.payload.value}
                  </text>
                </g>
              );
            }}
          />

          <YAxis
            tick={{ fill: '#5A6B8A', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={formatXP}
            width={36}
          />

          {avgXP > 0 && (
            <ReferenceLine
              y={avgXP}
              stroke="rgba(255,255,255,0.07)"
              strokeDasharray="3 4"
              label={{
                value: 'méd',
                position: 'insideTopRight',
                fill: 'rgba(136,153,187,0.5)',
                fontSize: 9,
              }}
            />
          )}

          <Tooltip
            content={<ChartTooltip />}
            cursor={{ stroke: 'rgba(245,200,66,0.3)', strokeWidth: 1 }}
          />

          <Area
            type="monotone"
            dataKey="total"
            stroke="#F5C842"
            strokeWidth={2}
            fill="url(#xpGradFill)"
            dot={false}
            activeDot={{ r: 4, fill: '#F5C842', stroke: '#050914', strokeWidth: 2 }}
            isAnimationActive={animated}
            animationDuration={800}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* ── Source breakdown ────────────────────────────────────────────── */}
      {srcTotal > 0 && sources.length > 0 && (
        <div className="space-y-2">
          <div className="text-[10px] uppercase tracking-wider text-text-muted">
            Origem do XP (30 dias)
          </div>
          {sources.map((s) => (
            <div key={s.label} className="flex items-center gap-2">
              <span className="w-14 shrink-0 text-[11px] text-text-muted">{s.label}</span>
              <div
                className="h-2 flex-1 overflow-hidden rounded-full"
                style={{ background: 'rgba(255,255,255,0.05)' }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.round((s.value / srcTotal) * 100)}%`,
                    background: s.color,
                    opacity: 0.8,
                  }}
                />
              </div>
              <span className="w-14 text-right text-[11px] font-bold" style={{ color: s.color }}>
                +{s.value >= 1000 ? `${(s.value / 1000).toFixed(1)}k` : s.value}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ── Record insight ──────────────────────────────────────────────── */}
      {bestDay && bestDay.total > 0 && (
        <div
          className="flex items-center gap-3 rounded-xl px-4 py-3"
          style={{ background: 'rgba(245,200,66,0.04)', border: '1px solid rgba(245,200,66,0.1)' }}
        >
          <span className="shrink-0 text-xl">
            {activeDays.length >= 25 ? '🔥' : activeDays.length >= 15 ? '⚡' : '🌱'}
          </span>
          <div>
            <p className="text-sm font-semibold leading-snug">
              {activeDays.length >= 25
                ? `${activeDays.length}/30 dias com XP — consistência elite!`
                : activeDays.length >= 15
                  ? `${activeDays.length}/30 dias com XP — ótima regularidade.`
                  : `${activeDays.length}/30 dias com XP — cada dia conta!`}
            </p>
            <p className="mt-0.5 text-[11px] text-text-muted">
              Melhor dia:{' '}
              <span className="font-bold" style={{ color: '#F5C842' }}>
                {bestDay.label} — +{bestDay.total.toLocaleString('pt-BR')} XP
              </span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
