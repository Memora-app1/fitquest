'use client'

interface CategorySpend {
  name: string
  icon: string
  amount: number
  color: string
}

function formatBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function SpendingChart({ data }: { data: CategorySpend[] }) {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-text-muted text-sm">
        Nenhuma despesa categorizada este mês
      </div>
    )
  }

  const total = data.reduce((sum, d) => sum + d.amount, 0)
  const max = data[0]?.amount ?? 1

  return (
    <div className="space-y-3">
      {data.map((item, i) => {
        const pct = total > 0 ? Math.round((item.amount / total) * 100) : 0
        const barWidth = Math.round((item.amount / max) * 100)

        return (
          <div key={i} className="group">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-base">{item.icon}</span>
                <span className="text-sm font-medium text-white">{item.name}</span>
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ backgroundColor: `${item.color}22`, color: item.color }}
                >
                  {pct}%
                </span>
              </div>
              <span className="text-sm font-bold text-white">{formatBRL(item.amount)}</span>
            </div>
            <div className="h-2.5 bg-bg-elevated rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${barWidth}%`, backgroundColor: item.color, opacity: 0.85 }}
              />
            </div>
          </div>
        )
      })}

      <div className="pt-2 border-t border-border flex items-center justify-between text-sm">
        <span className="text-text-muted">Total gasto em {data.length} categoria{data.length !== 1 ? 's' : ''}</span>
        <span className="font-bold text-brand-red">{formatBRL(total)}</span>
      </div>
    </div>
  )
}
