'use client'

import { useState, useEffect, useRef } from 'react'
import { TrendingDown } from 'lucide-react'

interface CategorySpend {
  name: string
  icon: string
  amount: number
  color: string
}

function formatBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// Animated bar that grows from 0 on mount
function AnimatedBar({
  width,
  color,
  delay,
}: {
  width: number
  color: string
  delay: number
}) {
  const [animated, setAnimated] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => setAnimated(width), 80 + delay)
    return () => clearTimeout(t)
  }, [width, delay])

  return (
    <div className="h-2.5 rounded-full overflow-hidden relative" style={{ background: 'rgba(255,255,255,0.06)' }}>
      {/* Glow layer */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          width: `${animated}%`,
          background: `${color}30`,
          filter: 'blur(4px)',
          transition: `width 0.8s cubic-bezier(0.34,1.56,0.64,1)`,
        }}
      />
      {/* Main bar */}
      <div
        className="h-full rounded-full relative"
        style={{
          width: `${animated}%`,
          background: `linear-gradient(90deg, ${color}CC, ${color})`,
          boxShadow: `0 0 8px ${color}50`,
          transition: `width 0.8s cubic-bezier(0.34,1.56,0.64,1)`,
        }}
      />
    </div>
  )
}

// Segmented stacked bar showing all categories
function StackedBar({ data, total }: { data: CategorySpend[]; total: number }) {
  const [animated, setAnimated] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 200)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="relative h-3 rounded-full overflow-hidden flex" style={{ background: 'rgba(255,255,255,0.06)' }}>
      {data.map((item, i) => {
        const pct = total > 0 ? (item.amount / total) * 100 : 0
        return (
          <div
            key={i}
            title={`${item.name}: ${formatBRL(item.amount)}`}
            className="h-full transition-all"
            style={{
              width: animated ? `${pct}%` : '0%',
              background: item.color,
              opacity: 0.85,
              transition: `width 0.9s cubic-bezier(0.34,1.56,0.64,1) ${i * 60}ms`,
              borderRight: i < data.length - 1 ? '2px solid rgba(0,0,0,0.3)' : 'none',
            }}
          />
        )
      })}
    </div>
  )
}

// Individual category row with animated bar
function CategoryRow({
  item,
  index,
  max,
  total,
}: {
  item: CategorySpend
  index: number
  max: number
  total: number
}) {
  const [hovered, setHovered] = useState(false)
  const pct = total > 0 ? Math.round((item.amount / total) * 100) : 0
  const barWidth = max > 0 ? Math.round((item.amount / max) * 100) : 0

  return (
    <div
      className="group transition-all duration-200 rounded-xl p-2.5 -mx-2.5 cursor-default"
      style={{
        background: hovered ? `${item.color}08` : 'transparent',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2.5">
          {/* Rank badge */}
          <div
            className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black shrink-0"
            style={{
              background: `${item.color}18`,
              color: item.color,
              border: `1px solid ${item.color}25`,
            }}
          >
            {index + 1}
          </div>

          {/* Icon */}
          <span className="text-lg leading-none">{item.icon}</span>

          {/* Name */}
          <span className="text-sm font-semibold">{item.name}</span>

          {/* Percentage pill */}
          <div
            className="text-[10px] font-bold px-1.5 py-0.5 rounded-full transition-all"
            style={{
              background: `${item.color}${hovered ? '25' : '16'}`,
              color: item.color,
              border: `1px solid ${item.color}${hovered ? '35' : '20'}`,
            }}
          >
            {pct}%
          </div>
        </div>

        {/* Amount */}
        <div className="text-right">
          <span
            className="text-sm font-bold transition-colors"
            style={{ color: hovered ? item.color : 'white' }}
          >
            {formatBRL(item.amount)}
          </span>
        </div>
      </div>

      {/* Animated bar */}
      <AnimatedBar width={barWidth} color={item.color} delay={index * 80} />
    </div>
  )
}

export function SpendingChart({ data }: { data: CategorySpend[] }) {
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry?.isIntersecting) { setVisible(true); observer.disconnect() } },
      { threshold: 0.2 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  if (data.length === 0) {
    return (
      <div className="text-center py-10 space-y-3">
        <div
          className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <TrendingDown size={24} className="text-text-muted" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-text-secondary">Nenhuma despesa categorizada</p>
          <p className="text-xs text-text-muted">Adicione transações de despesa com categoria para ver o breakdown aqui.</p>
        </div>
      </div>
    )
  }

  const total = data.reduce((sum, d) => sum + d.amount, 0)
  const max = data[0]?.amount ?? 1
  const top3 = data.slice(0, 3)

  return (
    <div ref={ref} className="space-y-5">
      {/* Stacked overview bar */}
      {visible && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-text-muted mb-1">
            <span className="font-medium">Distribuição total</span>
            <span className="font-bold text-white">{formatBRL(total)}</span>
          </div>
          <StackedBar data={data} total={total} />
          {/* Legend chips */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {data.map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full"
                style={{
                  background: `${item.color}12`,
                  border: `1px solid ${item.color}20`,
                }}
              >
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: item.color }} />
                <span className="text-text-muted">{item.icon} {item.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Divider */}
      <div style={{ height: 1, background: 'rgba(255,255,255,0.05)' }} />

      {/* Category rows */}
      <div className="space-y-0.5">
        {visible && data.map((item, i) => (
          <CategoryRow key={i} item={item} index={i} max={max} total={total} />
        ))}
        {!visible && data.map((_, i) => (
          <div key={i} className="h-12 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.03)' }} />
        ))}
      </div>

      {/* Summary footer */}
      <div
        className="rounded-xl p-3.5 flex items-center justify-between"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="space-y-0.5">
          <div className="text-xs text-text-muted">
            {data.length} categoria{data.length !== 1 ? 's' : ''} este mês
          </div>
          {top3.length > 0 && (
            <div className="text-xs text-text-secondary">
              Top: {top3.map((d) => `${d.icon} ${d.name}`).join(' · ')}
            </div>
          )}
        </div>
        <div className="text-right">
          <div className="text-xs text-text-muted">Total gasto</div>
          <div className="font-black text-base" style={{ color: '#EF4444' }}>
            {formatBRL(total)}
          </div>
        </div>
      </div>
    </div>
  )
}
