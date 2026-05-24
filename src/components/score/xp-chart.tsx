'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface DayXP {
  day: string   // "seg", "ter", etc.
  xp: number
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-bg-card border border-border rounded-xl px-3 py-2 text-sm">
      <p className="font-bold text-brand-orange">+{payload[0]!.value} XP</p>
      <p className="text-text-muted">{label}</p>
    </div>
  )
}

export function XpChart({ data }: { data: DayXP[] }) {
  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <XAxis
          dataKey="day"
          tick={{ fill: '#8899BB', fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: '#8899BB', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={44}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,77,0,0.08)' }} />
        <Bar
          dataKey="xp"
          fill="url(#xpGrad)"
          radius={[6, 6, 0, 0]}
        />
        <defs>
          <linearGradient id="xpGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FF4D00" />
            <stop offset="100%" stopColor="#7C3AED" />
          </linearGradient>
        </defs>
      </BarChart>
    </ResponsiveContainer>
  )
}
