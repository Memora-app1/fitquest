'use client'

import { useEffect, useRef, useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts'

export interface WeekData {
  week: string
  volume: number
  workouts: number
  isCurrent: boolean
  weekStart: string
}

function formatVolume(v: number): string {
  if (v >= 1000) return `${(v / 1000).toFixed(1)}t`
  return `${Math.round(v)}kg`
}

interface TooltipProps {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
}

function ChartTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null
  const volume = payload[0]?.value ?? 0
  return (
    <div
      className="rounded-xl px-3.5 py-3 text-sm pointer-events-none min-w-[140px]"
      style={{
        background: 'rgba(13,24,41,0.98)',
        border: '1px solid rgba(255,77,0,0.3)',
        boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
      }}
    >
      <div className="font-bold text-[10px] uppercase tracking-widest text-text-muted mb-2">{label}</div>
      <div className="font-black text-base" style={{ color: '#FF4D00' }}>
        {formatVolume(volume)}
      </div>
      <div className="text-[10px] text-text-muted mt-0.5">volume total</div>
    </div>
  )
}

export function VolumeChart({ data }: { data: WeekData[] }) {
  const [animated, setAnimated] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setTimeout(() => setAnimated(true), 80)
          obs.disconnect()
        }
      },
      { threshold: 0.2 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  if (!data.length) return null

  const maxVolume = Math.max(...data.map(d => d.volume), 1)
  const avgVolume = data.filter(d => d.volume > 0).reduce((s, d) => s + d.volume, 0) / Math.max(1, data.filter(d => d.volume > 0).length)
  const totalWorkouts = data.reduce((s, d) => s + d.workouts, 0)
  const currentWeek = data.find(d => d.isCurrent)
  const bestWeek = [...data].sort((a, b) => b.volume - a.volume)[0]
  const activeWeeks = data.filter(d => d.volume > 0).length

  return (
    <div ref={containerRef} className="space-y-5">

      {/* ── Summary strip ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-2.5">
        {(
          [
            {
              label: 'Treinos (8 sem)',
              value: String(totalWorkouts),
              color: '#FF4D00',
              rgb: '255,77,0',
            },
            {
              label: 'Volume total',
              value: formatVolume(data.reduce((s, d) => s + d.volume, 0)),
              color: '#F5C842',
              rgb: '245,200,66',
            },
            {
              label: 'Semana atual',
              value: currentWeek ? formatVolume(currentWeek.volume) : '–',
              color: currentWeek && currentWeek.volume > avgVolume ? '#00FF88' : '#8899BB',
              rgb: currentWeek && currentWeek.volume > avgVolume ? '0,255,136' : '136,153,187',
            },
          ] as const
        ).map((s) => (
          <div
            key={s.label}
            className="rounded-xl p-3 text-center"
            style={{
              background: `linear-gradient(135deg, rgba(${s.rgb},0.07) 0%, rgba(13,24,41,0.98) 100%)`,
              border: `1px solid rgba(${s.rgb},0.16)`,
            }}
          >
            <div className="text-[10px] text-text-muted uppercase tracking-wider mb-1.5 leading-none">{s.label}</div>
            <div className="font-black text-sm leading-none" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── Bar chart ──────────────────────────────────────────────────── */}
      <ResponsiveContainer width="100%" height={185}>
        <BarChart
          data={data}
          margin={{ top: 10, right: 4, left: -20, bottom: 0 }}
          barCategoryGap="30%"
        >
          <defs>
            <linearGradient id="volGradNormal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(255,77,0,0.75)" />
              <stop offset="100%" stopColor="rgba(255,77,0,0.3)" />
            </linearGradient>
            <linearGradient id="volGradCurrent" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FF4D00" />
              <stop offset="100%" stopColor="#CC3A00" />
            </linearGradient>
            <linearGradient id="volGradBest" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F5C842" />
              <stop offset="100%" stopColor="rgba(245,200,66,0.5)" />
            </linearGradient>
            <filter id="volGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <XAxis
            dataKey="week"
            axisLine={false}
            tickLine={false}
            tick={(props: { x: number; y: number; payload: { value: string } }) => {
              const item = data.find(d => d.week === props.payload.value)
              const isCurrent = item?.isCurrent ?? false
              const isBest = item?.volume === maxVolume && maxVolume > 0 && !isCurrent
              return (
                <g transform={`translate(${props.x},${props.y})`}>
                  {isCurrent && (
                    <rect x={-15} y={4} width={30} height={16} rx={8} fill="rgba(255,77,0,0.12)" />
                  )}
                  <text
                    x={0}
                    y={14}
                    textAnchor="middle"
                    fontSize={10}
                    fontWeight={isCurrent || isBest ? 700 : 400}
                    fill={isCurrent ? '#FF4D00' : isBest ? '#F5C842' : '#5A6B8A'}
                  >
                    {props.payload.value}
                  </text>
                </g>
              )
            }}
          />

          <YAxis
            tick={{ fill: '#5A6B8A', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => formatVolume(v)}
            width={44}
          />

          {avgVolume > 0 && (
            <ReferenceLine
              y={Math.round(avgVolume)}
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
            cursor={{ fill: 'rgba(255,255,255,0.025)', radius: 5 } as { fill: string; radius: number }}
          />

          <Bar
            dataKey="volume"
            radius={[6, 6, 2, 2]}
            isAnimationActive={animated}
            animationDuration={700}
            animationEasing="ease-out"
            animationBegin={0}
          >
            {data.map((entry, i) => {
              const isBest = entry.volume === maxVolume && maxVolume > 0 && !entry.isCurrent
              let fill = entry.volume > 0 ? 'url(#volGradNormal)' : 'rgba(255,255,255,0.03)'
              if (entry.isCurrent) fill = 'url(#volGradCurrent)'
              else if (isBest) fill = 'url(#volGradBest)'
              return (
                <Cell
                  key={`vol-${i}`}
                  fill={fill}
                  filter={entry.isCurrent ? 'url(#volGlow)' : undefined}
                />
              )
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* ── Per-week workout dots ────────────────────────────────────────── */}
      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${data.length}, 1fr)` }}>
        {data.map((w, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div className="flex gap-0.5 justify-center">
              {[...Array(Math.min(w.workouts, 5))].map((_, j) => (
                <div
                  key={j}
                  className="rounded-full"
                  style={{
                    width: 5,
                    height: 5,
                    backgroundColor: w.isCurrent ? '#FF4D00' : w.volume === maxVolume && maxVolume > 0 ? '#F5C842' : 'rgba(255,77,0,0.5)',
                  }}
                />
              ))}
              {w.workouts === 0 && (
                <div className="rounded-full" style={{ width: 5, height: 5, backgroundColor: 'rgba(255,255,255,0.08)' }} />
              )}
            </div>
            <div className="text-[9px] text-text-muted leading-none">
              {w.workouts > 0 ? `${w.workouts}×` : ''}
            </div>
          </div>
        ))}
      </div>
      <div className="text-[10px] text-text-muted text-center -mt-2">sessões por semana</div>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <div
        className="rounded-xl p-3.5 flex items-center justify-between gap-4"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="flex items-center gap-4 text-[11px]">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: '#FF4D00' }} />
            <span className="text-text-muted">Semana atual</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: '#F5C842' }} />
            <span className="text-text-muted">Melhor semana</span>
          </div>
        </div>
        {bestWeek && bestWeek.volume > 0 && (
          <div className="text-[11px] text-text-muted text-right shrink-0">
            Recorde:{' '}
            <span className="font-bold" style={{ color: '#F5C842' }}>
              {bestWeek.week} — {formatVolume(bestWeek.volume)}
            </span>
          </div>
        )}
      </div>

      {/* ── Consistency insight ─────────────────────────────────────────── */}
      {totalWorkouts > 0 && (
        <div
          className="rounded-xl p-3.5 flex items-center gap-3"
          style={{
            background: 'rgba(255,77,0,0.04)',
            border: '1px solid rgba(255,77,0,0.1)',
          }}
        >
          <span className="text-lg shrink-0">
            {activeWeeks >= 7 ? '🔥' : activeWeeks >= 5 ? '💪' : activeWeeks >= 3 ? '⚡' : '🌱'}
          </span>
          <div>
            <p className="text-sm font-semibold leading-snug">
              {activeWeeks >= 7
                ? 'Consistência elite — treino na maioria das semanas!'
                : activeWeeks >= 5
                ? `${activeWeeks}/8 semanas ativas — ótima consistência.`
                : activeWeeks >= 3
                ? `${activeWeeks}/8 semanas ativas — a consistência é chave.`
                : `${activeWeeks}/8 semanas ativas — cada treino conta!`}
            </p>
            {currentWeek && avgVolume > 0 && currentWeek.volume > 0 && (
              <p className="text-[11px] text-text-muted mt-0.5">
                Esta semana:{' '}
                <span
                  style={{
                    color: currentWeek.volume >= avgVolume ? '#00FF88' : '#FF4D00',
                    fontWeight: 600,
                  }}
                >
                  {currentWeek.volume >= avgVolume ? '⬆ acima' : '⬇ abaixo'} da média
                </span>
                {' '}({formatVolume(Math.abs(currentWeek.volume - Math.round(avgVolume)))} de diferença)
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
