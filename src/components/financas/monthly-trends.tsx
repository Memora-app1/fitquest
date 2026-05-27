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
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export interface MonthData {
  month: string
  income: number
  expense: number
  net: number
  savingsRate: number
  isCurrent: boolean
}

function formatBRL(v: number) {
  if (v >= 1000) return `R$${(v / 1000).toFixed(1)}k`
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

function formatBRLFull(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

interface TooltipProps {
  active?: boolean
  payload?: Array<{ name: string; value: number; fill?: string }>
  label?: string
}

function ChartTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null
  const income = payload.find(p => p.name === 'income')?.value ?? 0
  const expense = payload.find(p => p.name === 'expense')?.value ?? 0
  const net = income - expense
  return (
    <div
      className="rounded-xl px-4 py-3 text-sm pointer-events-none min-w-[170px]"
      style={{
        background: 'rgba(13,24,41,0.98)',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
      }}
    >
      <div className="font-bold text-white mb-2.5 text-xs uppercase tracking-widest opacity-60">{label}</div>
      <div className="space-y-1.5">
        {income > 0 && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-text-muted">Receitas</span>
            <span className="font-bold text-sm" style={{ color: '#00FF88' }}>{formatBRLFull(income)}</span>
          </div>
        )}
        {expense > 0 && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-text-muted">Gastos</span>
            <span className="font-bold text-sm" style={{ color: '#FF4D00' }}>{formatBRLFull(expense)}</span>
          </div>
        )}
        <div
          className="flex items-center justify-between gap-4 pt-1.5 mt-1.5"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
        >
          <span className="text-xs font-semibold">Saldo</span>
          <span
            className="font-black text-sm"
            style={{ color: net >= 0 ? '#00FF88' : '#FF4D00' }}
          >
            {net >= 0 ? '+' : ''}{formatBRLFull(net)}
          </span>
        </div>
      </div>
    </div>
  )
}

export function MonthlyTrendsChart({ data }: { data: MonthData[] }) {
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

  const totalIncome = data.reduce((s, d) => s + d.income, 0)
  const totalExpense = data.reduce((s, d) => s + d.expense, 0)
  const totalNet = totalIncome - totalExpense
  const avgSavings = data.filter(d => d.income > 0).reduce((s, d) => s + d.savingsRate, 0) / Math.max(1, data.filter(d => d.income > 0).length)
  const bestMonth = [...data].sort((a, b) => b.net - a.net)[0]

  return (
    <div ref={containerRef} className="space-y-5">

      {/* ── Summary strip ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-2.5">
        {(
          [
            { label: 'Receitas (6m)', value: formatBRLFull(totalIncome), color: '#00FF88', rgb: '0,255,136' },
            { label: 'Gastos (6m)', value: formatBRLFull(totalExpense), color: '#FF4D00', rgb: '255,77,0' },
            {
              label: 'Saldo acumulado',
              value: `${totalNet >= 0 ? '+' : ''}${formatBRLFull(totalNet)}`,
              color: totalNet >= 0 ? '#00FF88' : '#FF4D00',
              rgb: totalNet >= 0 ? '0,255,136' : '255,77,0',
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

      {/* ── Grouped bar chart ──────────────────────────────────────────── */}
      <ResponsiveContainer width="100%" height={200}>
        <BarChart
          data={data}
          margin={{ top: 12, right: 4, left: -16, bottom: 0 }}
          barCategoryGap="28%"
          barGap={3}
        >
          <defs>
            <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00FF88" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#00CC6A" stopOpacity={0.55} />
            </linearGradient>
            <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FF4D00" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#CC3A00" stopOpacity={0.55} />
            </linearGradient>
            <linearGradient id="incomeCurrentGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00FF88" />
              <stop offset="100%" stopColor="#00CC6A" />
            </linearGradient>
            <linearGradient id="expenseCurrentGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FF4D00" />
              <stop offset="100%" stopColor="#CC3A00" />
            </linearGradient>
            <filter id="currentGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <CartesianGrid
            vertical={false}
            stroke="rgba(255,255,255,0.04)"
            strokeDasharray="0"
          />

          <XAxis
            dataKey="month"
            axisLine={false}
            tickLine={false}
            tick={(props: { x: number; y: number; payload: { value: string } }) => {
              const item = data.find(d => d.month === props.payload.value)
              const isCurrent = item?.isCurrent ?? false
              return (
                <g transform={`translate(${props.x},${props.y})`}>
                  {isCurrent && (
                    <rect x={-18} y={4} width={36} height={16} rx={8} fill="rgba(0,255,136,0.1)" />
                  )}
                  <text
                    x={0}
                    y={14}
                    textAnchor="middle"
                    fontSize={11}
                    fontWeight={isCurrent ? 700 : 400}
                    fill={isCurrent ? '#00FF88' : '#5A6B8A'}
                  >
                    {isCurrent ? `${props.payload.value}★` : props.payload.value}
                  </text>
                </g>
              )
            }}
          />

          <YAxis
            tick={{ fill: '#5A6B8A', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => formatBRL(v)}
            width={52}
          />

          <Tooltip
            content={<ChartTooltip />}
            cursor={{ fill: 'rgba(255,255,255,0.025)', radius: 4 } as { fill: string; radius: number }}
          />

          {/* Zero reference line */}
          <ReferenceLine y={0} stroke="rgba(255,255,255,0.06)" />

          {/* Income bars */}
          <Bar
            name="income"
            dataKey="income"
            radius={[5, 5, 2, 2]}
            isAnimationActive={animated}
            animationDuration={700}
            animationEasing="ease-out"
            animationBegin={0}
          >
            {data.map((entry, i) => (
              <Cell
                key={`income-${i}`}
                fill={entry.isCurrent ? 'url(#incomeCurrentGrad)' : 'url(#incomeGrad)'}
                filter={entry.isCurrent ? 'url(#currentGlow)' : undefined}
                opacity={entry.income > 0 ? 1 : 0}
              />
            ))}
          </Bar>

          {/* Expense bars */}
          <Bar
            name="expense"
            dataKey="expense"
            radius={[5, 5, 2, 2]}
            isAnimationActive={animated}
            animationDuration={700}
            animationEasing="ease-out"
            animationBegin={120}
          >
            {data.map((entry, i) => (
              <Cell
                key={`expense-${i}`}
                fill={entry.isCurrent ? 'url(#expenseCurrentGrad)' : 'url(#expenseGrad)'}
                filter={entry.isCurrent ? 'url(#currentGlow)' : undefined}
                opacity={entry.expense > 0 ? 1 : 0}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* ── Per-month savings rate strip ───────────────────────────────── */}
      <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${data.length}, 1fr)` }}>
        {data.map((m, i) => {
          const hasData = m.income > 0 || m.expense > 0
          const rate = m.savingsRate
          const rateColor = rate >= 25 ? '#00FF88' : rate >= 10 ? '#F5C842' : rate >= 0 ? '#FF4D00' : '#EF4444'
          return (
            <div
              key={i}
              className="rounded-lg p-2 text-center"
              style={{
                background: m.isCurrent ? 'rgba(0,255,136,0.05)' : 'rgba(255,255,255,0.02)',
                border: m.isCurrent ? '1px solid rgba(0,255,136,0.15)' : '1px solid rgba(255,255,255,0.04)',
              }}
            >
              <div className="text-[9px] text-text-muted mb-1 leading-none truncate">{m.month}</div>
              {hasData ? (
                <div className="text-[11px] font-black leading-none" style={{ color: rateColor }}>
                  {rate >= 0 ? '+' : ''}{rate}%
                </div>
              ) : (
                <div className="text-[11px] text-text-muted leading-none">–</div>
              )}
            </div>
          )
        })}
      </div>
      <div className="text-[10px] text-text-muted text-center -mt-1">% poupado por mês</div>

      {/* ── Footer legend & insight ─────────────────────────────────────── */}
      <div
        className="rounded-xl p-3.5 flex items-center justify-between gap-4"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: '#00FF88' }} />
            <span className="text-[11px] text-text-muted">Receitas</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: '#FF4D00' }} />
            <span className="text-[11px] text-text-muted">Gastos</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: 'rgba(0,255,136,0.3)', border: '1px solid rgba(0,255,136,0.5)' }} />
            <span className="text-[11px] text-text-muted">Mês atual</span>
          </div>
        </div>
        <div className="text-right shrink-0">
          {avgSavings > 0 ? (
            <div className="flex items-center gap-1 justify-end">
              {avgSavings >= 15 ? (
                <TrendingUp size={12} style={{ color: '#00FF88' }} />
              ) : avgSavings >= 0 ? (
                <Minus size={12} style={{ color: '#F5C842' }} />
              ) : (
                <TrendingDown size={12} style={{ color: '#FF4D00' }} />
              )}
              <span className="text-[11px] text-text-muted">
                Média:{' '}
                <span
                  className="font-bold"
                  style={{ color: avgSavings >= 15 ? '#00FF88' : avgSavings >= 0 ? '#F5C842' : '#FF4D00' }}
                >
                  {Math.round(avgSavings)}% poupado
                </span>
              </span>
            </div>
          ) : null}
          {bestMonth && bestMonth.net > 0 && (
            <div className="text-[10px] text-text-muted mt-0.5">
              Melhor:{' '}
              <span className="font-semibold" style={{ color: '#00FF88' }}>
                {bestMonth.month} +{formatBRLFull(bestMonth.net)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
