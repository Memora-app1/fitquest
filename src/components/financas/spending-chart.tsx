'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from 'recharts'

interface CategorySpend {
  name: string
  icon: string
  amount: number
  color: string
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ value: number; payload: CategorySpend }>
}

function formatBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  const item = payload[0]!
  return (
    <div className="bg-bg-card border border-border rounded-xl px-3 py-2 text-sm">
      <p className="font-bold text-white">{item.payload.icon} {item.payload.name}</p>
      <p className="text-brand-red">{formatBRL(item.value)}</p>
    </div>
  )
}

export function SpendingChart({ data }: { data: CategorySpend[] }) {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-text-muted text-sm">
        Nenhuma despesa categorizada este mês
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={Math.max(120, data.length * 36)}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
      >
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="name"
          tick={({ x, y, payload }) => {
            const item = data.find((d) => d.name === payload.value)
            return (
              <text x={x} y={y} fill="#8899BB" fontSize={12} textAnchor="end" dominantBaseline="middle">
                {item?.icon} {payload.value}
              </text>
            )
          }}
          width={100}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,77,0,0.06)' }} />
        <Bar dataKey="amount" radius={[0, 6, 6, 0]}>
          {data.map((entry, i) => (
            <Cell
              key={i}
              fill={entry.color || '#FF4D00'}
              fillOpacity={0.85}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
