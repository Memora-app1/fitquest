import { createClient } from '@/lib/supabase/server'
import { TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-react'
import Link from 'next/link'

function formatBRL(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

export async function FinanceCategoryTrend({ userId }: { userId: string }) {
  const supabase = await createClient()

  const now = new Date()
  const fourMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1)
  const fourMonthsAgoStr = fourMonthsAgo.toISOString().split('T')[0]!

  const [txRes, catsRes] = await Promise.all([
    supabase
      .from('transactions')
      .select('amount, category_id, transaction_date')
      .eq('user_id', userId)
      .eq('type', 'expense')
      .eq('is_paid', true)
      .gte('transaction_date', fourMonthsAgoStr),
    supabase
      .from('finance_categories')
      .select('id, name, icon, color')
      .or(`user_id.eq.${userId},is_global.eq.true`),
  ])

  const transactions = txRes.data ?? []
  if (transactions.length === 0) return null

  const catMap = new Map((catsRes.data ?? []).map(c => [c.id, c]))

  // Build 4-month labels
  const months: { key: string; label: string }[] = []
  for (let i = 3; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '').toUpperCase()
    months.push({ key, label })
  }

  // Aggregate spending per category per month
  const spendMatrix = new Map<string, Map<string, number>>()
  for (const tx of transactions) {
    const catId = tx.category_id ?? '__none__'
    const monthKey = tx.transaction_date.slice(0, 7)
    if (!spendMatrix.has(catId)) spendMatrix.set(catId, new Map())
    const m = spendMatrix.get(catId)!
    m.set(monthKey, (m.get(monthKey) ?? 0) + Number(tx.amount))
  }

  // Top 5 categories by total spend across 4 months
  const catEntries = Array.from(spendMatrix.entries()).map(([catId, monthMap]) => ({
    catId,
    total: Array.from(monthMap.values()).reduce((s, v) => s + v, 0),
    monthMap,
    cat: catMap.get(catId),
  }))
  .sort((a, b) => b.total - a.total)
  .slice(0, 5)

  if (catEntries.length === 0) return null

  const currentKey = months[3]!.key
  const prevKey = months[2]!.key

  // Max spend in any single month (for bar scaling)
  const maxBarValue = Math.max(
    ...catEntries.flatMap(e => months.map(m => e.monthMap.get(m.key) ?? 0))
  )

  return (
    <div
      className="rounded-2xl p-5 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(124,58,237,0.06) 0%, rgba(13,24,41,0.98) 100%)',
        border: '1px solid rgba(124,58,237,0.14)',
      }}
    >
      <div
        className="absolute -top-6 -right-6 w-28 h-28 rounded-full pointer-events-none blur-3xl"
        style={{ background: 'rgba(124,58,237,0.08)' }}
      />

      <div className="relative z-10 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)' }}
            >
              <BarChart3 size={12} style={{ color: '#7C3AED' }} />
            </div>
            <div>
              <div className="text-sm font-black">Tendência por categoria</div>
              <div className="text-[10px] text-text-muted">Gastos dos últimos 4 meses</div>
            </div>
          </div>
          <Link
            href="/financas/transacoes"
            className="text-[10px] text-text-muted hover:text-brand-purple transition-colors"
          >
            Ver tudo →
          </Link>
        </div>

        {/* Month column headers */}
        <div className="grid gap-x-2" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 60px' }}>
          <div />
          {months.map(m => (
            <div key={m.key} className="text-[9px] text-text-muted text-center font-bold uppercase">
              {m.label}
            </div>
          ))}
          <div className="text-[9px] text-text-muted text-right">Tendência</div>
        </div>

        {/* Category rows */}
        <div className="space-y-3">
          {catEntries.map(entry => {
            const cat = entry.cat
            const color = cat?.color ?? '#8899BB'
            const icon = cat?.icon ?? '💸'
            const name = cat?.name ?? 'Outros'

            const current = entry.monthMap.get(currentKey) ?? 0
            const prev = entry.monthMap.get(prevKey) ?? 0
            const diff = prev > 0 ? ((current - prev) / prev) * 100 : 0
            const isUp = diff > 5
            const isDown = diff < -5

            return (
              <div key={entry.catId} className="space-y-2">
                {/* Category label */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">{icon}</span>
                    <span className="text-xs font-semibold" style={{ color }}>
                      {name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {isUp ? (
                      <TrendingUp size={10} className="text-brand-red" />
                    ) : isDown ? (
                      <TrendingDown size={10} className="text-brand-green" />
                    ) : (
                      <Minus size={10} className="text-text-muted" />
                    )}
                    <span
                      className="text-[10px] font-bold"
                      style={{ color: isUp ? '#EF4444' : isDown ? '#00FF88' : '#8899BB' }}
                    >
                      {Math.abs(Math.round(diff))}%
                    </span>
                  </div>
                </div>

                {/* Monthly bars */}
                <div className="grid gap-x-2 items-end" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 60px' }}>
                  <div className="text-[9px] text-text-muted text-right pr-1">
                    {formatBRL(current)}
                  </div>
                  {months.map(m => {
                    const val = entry.monthMap.get(m.key) ?? 0
                    const barPct = maxBarValue > 0 ? (val / maxBarValue) * 100 : 0
                    const isCurrent = m.key === currentKey
                    return (
                      <div key={m.key} className="flex flex-col items-center gap-1">
                        <div
                          className="w-full rounded-t-[3px]"
                          style={{
                            height: '32px',
                            display: 'flex',
                            alignItems: 'flex-end',
                          }}
                        >
                          <div
                            className="w-full rounded-t-[3px] transition-all"
                            style={{
                              height: `${Math.max(3, barPct)}%`,
                              background: isCurrent
                                ? color
                                : `${color}50`,
                              boxShadow: isCurrent ? `0 0 6px ${color}40` : 'none',
                            }}
                          />
                        </div>
                      </div>
                    )
                  })}
                  {/* Sparkline placeholder - use the diff badge */}
                  <div className="flex items-center justify-end">
                    <span
                      className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{
                        background: isUp
                          ? 'rgba(239,68,68,0.12)'
                          : isDown
                          ? 'rgba(0,255,136,0.12)'
                          : 'rgba(255,255,255,0.06)',
                        color: isUp ? '#EF4444' : isDown ? '#00FF88' : '#8899BB',
                      }}
                    >
                      {isUp ? '↑' : isDown ? '↓' : '='} {Math.abs(Math.round(diff))}%
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-[10px] text-text-muted pt-1 border-t border-white/5">
          <span className="flex items-center gap-1">
            <TrendingDown size={9} className="text-brand-green" />
            Caindo = positivo
          </span>
          <span className="flex items-center gap-1">
            <TrendingUp size={9} className="text-brand-red" />
            Subindo = atenção
          </span>
          <span className="ml-auto">barras mais escuras = mês atual</span>
        </div>
      </div>
    </div>
  )
}
