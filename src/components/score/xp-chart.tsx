'use client';

import { useEffect, useRef, useState } from 'react';
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

export interface DayXP {
  day: string;
  xp: number;
}

interface TooltipPayload {
  value: number;
}

interface TooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}

function rgbFor(hex: string): string {
  if (hex === '#F5C842') return '245,200,66';
  if (hex === '#FF4D00') return '255,77,0';
  if (hex === '#00FF88') return '0,255,136';
  return '124,58,237';
}

export function XpChart({ data }: { data: DayXP[] }) {
  const [animated, setAnimated] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Trigger bar animation once the chart scrolls into view
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          // Small delay so the element has actually painted
          setTimeout(() => setAnimated(true), 80);
          obs.disconnect();
        }
      },
      { threshold: 0.25 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  if (!data.length) return null;

  const totalXp = data.reduce((s, d) => s + d.xp, 0);
  const maxXp = Math.max(...data.map((d) => d.xp), 0);
  const avgXp = data.length > 0 ? Math.round(totalXp / data.length) : 0;
  const todayLabel = data[data.length - 1]?.day ?? '';
  const bestDay = data.reduce<DayXP | null>(
    (best, d) => (!best || d.xp > best.xp ? d : best),
    null
  );

  // Inline tooltip component has closure over todayLabel
  function TooltipContent({ active, payload, label }: TooltipProps) {
    if (!active || !payload?.length) return null;
    const isToday = label === todayLabel;
    const xp = payload[0]?.value ?? 0;
    return (
      <div
        className="pointer-events-none rounded-xl px-3 py-2.5 text-sm"
        style={{
          background: 'rgba(13,24,41,0.98)',
          border: isToday ? '1px solid rgba(255,77,0,0.45)' : '1px solid rgba(124,58,237,0.3)',
          boxShadow: isToday ? '0 8px 24px rgba(255,77,0,0.2)' : '0 8px 24px rgba(0,0,0,0.45)',
        }}
      >
        <div
          className="flex items-baseline gap-1 font-black"
          style={{ color: isToday ? '#FF4D00' : '#F5C842' }}
        >
          +{xp.toLocaleString('pt-BR')}
          <span className="text-xs font-normal opacity-60">XP</span>
        </div>
        <div className="mt-0.5 text-xs" style={{ color: '#8899BB' }}>
          {isToday ? 'Hoje' : label}
        </div>
      </div>
    );
  }

  const stats: Array<{ label: string; value: string; unit: string; color: string }> = [
    {
      label: 'Total semana',
      value: totalXp.toLocaleString('pt-BR'),
      unit: 'XP',
      color: '#F5C842',
    },
    {
      label: 'Melhor dia',
      value: maxXp.toLocaleString('pt-BR'),
      unit: 'XP',
      color: '#FF4D00',
    },
    {
      label: 'Média diária',
      value: avgXp.toLocaleString('pt-BR'),
      unit: 'XP',
      color: '#00FF88',
    },
  ];

  return (
    <div ref={containerRef} className="space-y-4">
      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-2">
        {stats.map(({ label, value, unit, color }) => (
          <div
            key={label}
            className="rounded-xl p-3 text-center"
            style={{
              background: `linear-gradient(135deg, rgba(${rgbFor(color)},0.06) 0%, rgba(13,24,41,0.98) 100%)`,
              border: `1px solid rgba(${rgbFor(color)},0.16)`,
            }}
          >
            <div className="text-sm font-black leading-none" style={{ color }}>
              {value}
              <span className="ml-0.5 text-[10px] font-normal opacity-55">{unit}</span>
            </div>
            <div className="mt-1 text-[10px] leading-none" style={{ color: '#8899BB' }}>
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <ResponsiveContainer width="100%" height={170}>
        <BarChart
          data={data}
          margin={{ top: 10, right: 6, left: -20, bottom: 0 }}
          barCategoryGap="26%"
        >
          <defs>
            {/* Regular bars: purple gradient */}
            <linearGradient id="xpGradRegular" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(124,58,237,0.85)" />
              <stop offset="100%" stopColor="rgba(124,58,237,0.35)" />
            </linearGradient>
            {/* Today bar: orange gradient */}
            <linearGradient id="xpGradToday" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FF4D00" />
              <stop offset="100%" stopColor="#CC3D00" />
            </linearGradient>
            {/* Best day bar: gold gradient */}
            <linearGradient id="xpGradBest" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F5C842" />
              <stop offset="100%" stopColor="rgba(245,200,66,0.55)" />
            </linearGradient>
            {/* Today glow filter */}
            <filter id="xpTodayGlow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            tick={(props: { x: number; y: number; payload: { value: string } }) => {
              const isToday = props.payload.value === todayLabel;
              return (
                <g transform={`translate(${props.x},${props.y})`}>
                  {isToday && (
                    <rect x={-14} y={4} width={28} height={16} rx={8} fill="rgba(255,77,0,0.14)" />
                  )}
                  <text
                    x={0}
                    y={14}
                    textAnchor="middle"
                    fontSize={isToday ? 11 : 11}
                    fontWeight={isToday ? 700 : 400}
                    fill={isToday ? '#FF4D00' : '#8899BB'}
                  >
                    {isToday ? 'Hoje' : props.payload.value}
                  </text>
                </g>
              );
            }}
          />

          <YAxis
            tick={{ fill: '#8899BB', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={44}
          />

          {/* Average reference line */}
          {avgXp > 0 && (
            <ReferenceLine
              y={avgXp}
              stroke="rgba(255,255,255,0.08)"
              strokeDasharray="3 4"
              label={{
                value: 'méd',
                position: 'insideTopRight',
                fill: 'rgba(136,153,187,0.6)',
                fontSize: 9,
              }}
            />
          )}

          <Tooltip
            content={<TooltipContent />}
            cursor={
              { fill: 'rgba(255,255,255,0.025)', radius: 6 } as { fill: string; radius: number }
            }
          />

          <Bar
            dataKey="xp"
            radius={[6, 6, 2, 2]}
            isAnimationActive={animated}
            animationDuration={700}
            animationEasing="ease-out"
            animationBegin={0}
          >
            {data.map((entry, index) => {
              const isToday = entry.day === todayLabel;
              // Only mark best day gold if it's not today (today is orange and already stands out)
              const isBest = !isToday && entry.xp === maxXp && maxXp > 0;
              let fill = 'url(#xpGradRegular)';
              if (isToday) fill = 'url(#xpGradToday)';
              else if (isBest) fill = 'url(#xpGradBest)';
              return (
                <Cell
                  key={`cell-${index}`}
                  fill={fill}
                  filter={isToday ? 'url(#xpTodayGlow)' : undefined}
                />
              );
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Footer legend */}
      <div className="flex items-center justify-between px-1 text-[10px]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span
              className="inline-block h-2.5 w-2.5 rounded-sm"
              style={{ background: '#FF4D00' }}
            />
            <span style={{ color: '#8899BB' }}>Hoje</span>
          </div>
          {bestDay && bestDay.day !== todayLabel && (
            <div className="flex items-center gap-1">
              <span
                className="inline-block h-2.5 w-2.5 rounded-sm"
                style={{ background: '#F5C842' }}
              />
              <span style={{ color: '#8899BB' }}>Melhor dia</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <span
              className="inline-block h-2.5 w-2.5 rounded-sm"
              style={{ background: 'rgba(124,58,237,0.7)' }}
            />
            <span style={{ color: '#8899BB' }}>Demais dias</span>
          </div>
        </div>
        {bestDay && (
          <div style={{ color: '#8899BB' }}>
            Melhor:{' '}
            <span style={{ color: '#F5C842', fontWeight: 700 }}>
              {bestDay.day === todayLabel ? 'Hoje' : bestDay.day} — {maxXp.toLocaleString('pt-BR')}{' '}
              XP
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
