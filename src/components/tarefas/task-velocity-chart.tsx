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
  CartesianGrid,
} from 'recharts'

export interface TaskWeekData {
  week: string
  completed: number
  xp: number
  isCurrent: boolean
  weekStart: string
}

interface TooltipProps {
  active?: boolean
  payload?: Array<{ value: number; payload: TaskWeekData }>
  label?: string
}

function ChartTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null
  const row = payload[0]?.payload
  if (!row) return null
  return (
    <div
      className="rounded-xl px-3.5 py-3 text-sm pointer-events-none min-w-[150px]"
      style={{
        background: 'rgba(13,24,41,0.98)',
        border: '1px solid rgba(124,58,237,0.35)',
        boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
      }}
    >
      <div className="font-bold text-[10px] uppercase tracking-widest text-text-muted mb-2">{label}</div>
      <div className="font-black text-base" style={{ color: '#7C3AED' }}>
        {row.completed} {row.completed === 1 ? 'tarefa' : 'tarefas'}
      </div>
      <div className="text-[10px] text-text-muted mt-0.5">concluídas na semana</div>
      {row.xp > 0 && (
        <div className="mt-2 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <span className="text-[10px] font-bold" style={{ color: '#F5C842' }}>
            +{row.xp.toLocaleString('pt-BR')} XP
          </span>
          <span className="text-[10px] text-text-muted ml-1">ganhos</span>
        </div>
      )}
    </div>
  )
}

export function TaskVelocityChart({ data }: { data: TaskWeekData[] }) {
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

  const maxCompleted = Math.max(...data.map(d => d.completed), 1)
  const totalCompleted = data.reduce((s, d) => s + d.completed, 0)
  const totalXP = data.reduce((s, d) => s + d.xp, 0)
  const weeksWithData = data.filter(d => d.completed > 0)
  const avgCompleted = weeksWithData.length > 0
    ? totalCompleted / weeksWithData.length
    : 0
  const currentWeek = data.find(d => d.isCurrent)
  const bestWeek = [...data].sort((a, b) => b.completed - a.completed)[0]
  const activeWeeks = weeksWithData.length

  // Weekly XP strip bar heights (relative to max XP in week)
  const maxXP = Math.max(...data.map(d => d.xp), 1)

  return (
    <div ref={containerRef} className="space-y-5">

      {/* ── Summary strip ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-2.5">
        {(
          [
            {
              label: 'Concluídas (8s)',
              value: String(totalCompleted),
              color: '#7C3AED',
              rgb: '124,58,237',
            },
            {
              label: 'XP total',
              value: totalXP >= 1000
                ? `+${(totalXP / 1000).toFixed(1)}k`
                : `+${totalXP}`,
              color: '#F5C842',
              rgb: '245,200,66',
            },
            {
              label: 'Semana atual',
              value: currentWeek ? String(currentWeek.completed) : '–',
              color: currentWeek && currentWeek.completed >= avgCompleted && avgCompleted > 0
                ? '#00FF88'
                : '#8899BB',
              rgb: currentWeek && currentWeek.completed >= avgCompleted && avgCompleted > 0
                ? '0,255,136'
                : '136,153,187',
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
            <linearGradient id="taskGradNormal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(124,58,237,0.75)" />
              <stop offset="100%" stopColor="rgba(124,58,237,0.3)" />
            </linearGradient>
            <linearGradient id="taskGradCurrent" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7C3AED" />
              <stop offset="100%" stopColor="#5A25B8" />
            </linearGradient>
            <linearGradient id="taskGradBest" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F5C842" />
              <stop offset="100%" stopColor="rgba(245,200,66,0.5)" />
            </linearGradient>
            <filter id="taskGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.03)" />

          <XAxis
            dataKey="week"
            axisLine={false}
            tickLine={false}
            tick={(props: { x: number; y: number; payload: { value: string } }) => {
              const item = data.find(d => d.week === props.payload.value)
              const isCurrent = item?.isCurrent ?? false
              const isBest =
                item?.completed === maxCompleted && maxCompleted > 0 && !isCurrent
              return (
                <g transform={`translate(${props.x},${props.y})`}>
                  {isCurrent && (
                    <rect x={-15} y={4} width={30} height={16} rx={8} fill="rgba(124,58,237,0.15)" />
                  )}
                  <text
                    x={0}
                    y={14}
                    textAnchor="middle"
                    fontSize={10}
                    fontWeight={isCurrent || isBest ? 700 : 400}
                    fill={isCurrent ? '#7C3AED' : isBest ? '#F5C842' : '#5A6B8A'}
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
            allowDecimals={false}
            width={28}
          />

          {avgCompleted > 0 && (
            <ReferenceLine
              y={Math.round(avgCompleted * 10) / 10}
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
            dataKey="completed"
            radius={[6, 6, 2, 2]}
            isAnimationActive={animated}
            animationDuration={700}
            animationEasing="ease-out"
            animationBegin={0}
          >
            {data.map((entry, i) => {
              const isBest =
                entry.completed === maxCompleted && maxCompleted > 0 && !entry.isCurrent
              let fill = entry.completed > 0 ? 'url(#taskGradNormal)' : 'rgba(255,255,255,0.03)'
              if (entry.isCurrent) fill = 'url(#taskGradCurrent)'
              else if (isBest) fill = 'url(#taskGradBest)'
              return (
                <Cell
                  key={`task-${i}`}
                  fill={fill}
                  filter={entry.isCurrent ? 'url(#taskGlow)' : undefined}
                />
              )
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* ── Per-week XP strip ────────────────────────────────────────────── */}
      <div className="space-y-1.5">
        <div className="text-[10px] text-text-muted text-center uppercase tracking-wider">XP ganho por semana</div>
        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${data.length}, 1fr)` }}>
          {data.map((w, i) => {
            const barH = w.xp > 0 ? Math.max(3, Math.round((w.xp / maxXP) * 28)) : 2
            return (
              <div key={i} className="flex flex-col items-center gap-1">
                <div
                  className="rounded-full w-full"
                  style={{
                    height: barH,
                    maxWidth: 24,
                    margin: '0 auto',
                    backgroundColor: w.isCurrent
                      ? '#F5C842'
                      : w.xp === maxXP && maxXP > 0
                      ? 'rgba(245,200,66,0.7)'
                      : w.xp > 0
                      ? 'rgba(245,200,66,0.3)'
                      : 'rgba(255,255,255,0.06)',
                  }}
                />
                <div className="text-[9px] text-text-muted leading-none text-center">
                  {w.xp > 0
                    ? w.xp >= 1000
                      ? `${(w.xp / 1000).toFixed(1)}k`
                      : `${w.xp}`
                    : ''}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Footer legend + record ───────────────────────────────────────── */}
      <div
        className="rounded-xl p-3.5 flex items-center justify-between gap-4"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="flex items-center gap-4 text-[11px]">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: '#7C3AED' }} />
            <span className="text-text-muted">Semana atual</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: '#F5C842' }} />
            <span className="text-text-muted">Melhor semana</span>
          </div>
        </div>
        {bestWeek && bestWeek.completed > 0 && (
          <div className="text-[11px] text-text-muted text-right shrink-0">
            Recorde:{' '}
            <span className="font-bold" style={{ color: '#F5C842' }}>
              {bestWeek.week} — {bestWeek.completed} tarefa{bestWeek.completed !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* ── Consistency insight ─────────────────────────────────────────── */}
      {totalCompleted > 0 && (
        <div
          className="rounded-xl p-3.5 flex items-center gap-3"
          style={{
            background: 'rgba(124,58,237,0.04)',
            border: '1px solid rgba(124,58,237,0.1)',
          }}
        >
          <span className="text-lg shrink-0">
            {activeWeeks >= 7 ? '🔥' : activeWeeks >= 5 ? '💪' : activeWeeks >= 3 ? '⚡' : '🌱'}
          </span>
          <div>
            <p className="text-sm font-semibold leading-snug">
              {activeWeeks >= 7
                ? 'Consistência elite — produtivo em quase todas as semanas!'
                : activeWeeks >= 5
                ? `${activeWeeks}/8 semanas produtivas — ótima constância.`
                : activeWeeks >= 3
                ? `${activeWeeks}/8 semanas ativas — a regularidade é chave.`
                : `${activeWeeks}/8 semanas ativas — cada tarefa concluída conta!`}
            </p>
            {currentWeek && avgCompleted > 0 && currentWeek.completed > 0 && (
              <p className="text-[11px] text-text-muted mt-0.5">
                Esta semana:{' '}
                <span
                  style={{
                    color: currentWeek.completed >= avgCompleted ? '#00FF88' : '#FF4D00',
                    fontWeight: 600,
                  }}
                >
                  {currentWeek.completed >= avgCompleted ? '⬆ acima' : '⬇ abaixo'} da média
                </span>
                {' '}({Math.abs(currentWeek.completed - Math.round(avgCompleted))} tarefa
                {Math.abs(currentWeek.completed - Math.round(avgCompleted)) !== 1 ? 's' : ''} de diferença)
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
