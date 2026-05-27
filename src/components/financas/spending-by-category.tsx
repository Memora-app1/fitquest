import { createClient } from '@/lib/supabase/server'
import { PieChart, TrendingDown, TrendingUp, Calendar } from 'lucide-react'

interface TxRow {
  amount: number
  type: string
  transaction_date: string
  category_id: string | null
  finance_categories: { name: string; icon: string | null; color: string | null } | null
}

interface CategoryStat {
  id: string
  name: string
  icon: string
  color: string
  rgb: string
  total: number
  count: number
  prevTotal: number
  pct: number
  barPct: number
}

const DOW_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const DOW_LONG   = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

function hexToRgb(hex: string | null): string {
  if (!hex) return '255,77,0'
  const clean = hex.replace('#', '')
  if (clean.length !== 6) return '255,77,0'
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  return `${r},${g},${b}`
}

function formatBRL(v: number): string {
  const abs = Math.abs(v)
  const prefix = v < 0 ? '-' : ''
  if (abs >= 1000000) return `${prefix}R$${(abs / 1000000).toFixed(1)}M`
  if (abs >= 1000) return `${prefix}R$${(abs / 1000).toFixed(1)}k`
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatPct(v: number): string {
  return `${v >= 0 ? '+' : ''}${v.toFixed(0)}%`
}

export async function SpendingByCategory({ userId }: { userId: string }) {
  const supabase = await createClient()

  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]!
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0]!
  const prevMonthEnd   = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0]!

  // Fetch this month + previous month side by side
  const { data: raw } = await supabase
    .from('transactions')
    .select('amount, type, transaction_date, category_id, finance_categories(name, icon, color)')
    .eq('user_id', userId)
    .gte('transaction_date', prevMonthStart)
    .lte('transaction_date', now.toISOString().split('T')[0]!)
    .order('transaction_date', { ascending: false })

  const rows = (raw ?? []) as unknown as TxRow[]
  if (rows.length === 0) return null

  const thisMonth = rows.filter(r => r.transaction_date >= thisMonthStart!)
  const prevMonth = rows.filter(r => r.transaction_date >= prevMonthStart && r.transaction_date <= prevMonthEnd)

  const expenses     = thisMonth.filter(r => r.type === 'expense')
  const incomes      = thisMonth.filter(r => r.type === 'income')
  const prevExpenses = prevMonth.filter(r => r.type === 'expense')

  const totalExpense     = expenses.reduce((s, r) => s + Number(r.amount), 0)
  const totalIncome      = incomes.reduce((s, r) => s + Number(r.amount), 0)
  const prevTotalExpense = prevExpenses.reduce((s, r) => s + Number(r.amount), 0)

  if (totalExpense === 0 && totalIncome === 0) return null

  const daysInMonth = now.getDate()
  const avgPerDay   = daysInMonth > 0 ? totalExpense / daysInMonth : 0
  const expenseChg  = prevTotalExpense > 0 ? ((totalExpense - prevTotalExpense) / prevTotalExpense) * 100 : null
  const savingsRate = totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : null

  // ── Build expense category map ────────────────────────────────────
  const expCatMap = new Map<string, { name: string; icon: string; color: string; total: number; count: number }>()
  for (const r of expenses) {
    const key  = r.category_id ?? '__none__'
    const cat  = r.finance_categories
    const name = cat?.name ?? 'Sem categoria'
    const icon = cat?.icon ?? '📦'
    const color = cat?.color ?? '#FF4D00'
    const existing = expCatMap.get(key)
    if (!existing) {
      expCatMap.set(key, { name, icon, color, total: Number(r.amount), count: 1 })
    } else {
      existing.total += Number(r.amount)
      existing.count++
    }
  }

  // Previous month category totals
  const prevExpCatMap = new Map<string, number>()
  for (const r of prevExpenses) {
    const key = r.category_id ?? '__none__'
    prevExpCatMap.set(key, (prevExpCatMap.get(key) ?? 0) + Number(r.amount))
  }

  // Build income category map
  const incCatMap = new Map<string, { name: string; icon: string; color: string; total: number; count: number }>()
  for (const r of incomes) {
    const key  = r.category_id ?? '__none__'
    const cat  = r.finance_categories
    const name = cat?.name ?? 'Sem categoria'
    const icon = cat?.icon ?? '💰'
    const color = cat?.color ?? '#00FF88'
    const existing = incCatMap.get(key)
    if (!existing) {
      incCatMap.set(key, { name, icon, color, total: Number(r.amount), count: 1 })
    } else {
      existing.total += Number(r.amount)
      existing.count++
    }
  }

  // Sort expense categories descending, take top 8
  const sortedExpCats: CategoryStat[] = Array.from(expCatMap.entries())
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 8)
    .map(([id, cat]) => ({
      id,
      name:      cat.name,
      icon:      cat.icon,
      color:     cat.color,
      rgb:       hexToRgb(cat.color),
      total:     cat.total,
      count:     cat.count,
      prevTotal: prevExpCatMap.get(id) ?? 0,
      pct:       totalExpense > 0 ? Math.round((cat.total / totalExpense) * 100) : 0,
      barPct:    0, // set below
    }))

  const maxExpCat = sortedExpCats[0]?.total ?? 1
  for (const c of sortedExpCats) c.barPct = Math.round((c.total / maxExpCat) * 100)

  // Sort income categories descending, take top 5
  const sortedIncCats: CategoryStat[] = Array.from(incCatMap.entries())
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 5)
    .map(([id, cat]) => ({
      id,
      name:      cat.name,
      icon:      cat.icon,
      color:     cat.color,
      rgb:       hexToRgb(cat.color),
      total:     cat.total,
      count:     cat.count,
      prevTotal: 0,
      pct:       totalIncome > 0 ? Math.round((cat.total / totalIncome) * 100) : 0,
      barPct:    0,
    }))
  const maxIncCat = sortedIncCats[0]?.total ?? 1
  for (const c of sortedIncCats) c.barPct = Math.round((c.total / maxIncCat) * 100)

  // ── Day-of-week spending (this month expenses) ─────────────────────
  const dowTotals  = [0, 0, 0, 0, 0, 0, 0]
  const dowCounts  = [0, 0, 0, 0, 0, 0, 0]
  for (const r of expenses) {
    const dow = new Date(r.transaction_date + 'T12:00:00').getDay()
    dowTotals[dow] = (dowTotals[dow] ?? 0) + Number(r.amount)
    dowCounts[dow] = (dowCounts[dow] ?? 0) + 1
  }
  const dowAvgs = dowTotals.map((t, i) => (dowCounts[i]! > 0 ? t / dowCounts[i]! : 0))
  const maxDowAvg = Math.max(...dowAvgs, 1)
  const heaviestDow = dowAvgs.indexOf(Math.max(...dowAvgs))

  return (
    <div className="space-y-4">

      {/* ── Monthly overview strip ────────────────────────────────────── */}
      <div
        className="rounded-2xl p-5 md:p-6 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(239,68,68,0.07) 0%, rgba(13,24,41,0.98) 60%, rgba(124,58,237,0.04) 100%)',
          border: '1px solid rgba(239,68,68,0.14)',
        }}
      >
        <div
          className="absolute -top-8 -right-8 w-40 h-40 rounded-full pointer-events-none blur-3xl"
          style={{ background: 'rgba(239,68,68,0.06)' }}
        />

        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <div
              className="w-6 h-6 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.22)' }}
            >
              <PieChart size={12} style={{ color: '#EF4444' }} />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-text-muted">
              Gastos por Categoria
            </span>
            <span className="ml-auto text-xs text-text-muted">
              {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </span>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
            {[
              {
                label: 'Total gastos',
                value: formatBRL(totalExpense),
                sub: expenseChg !== null
                  ? `${formatPct(expenseChg)} vs mês passado`
                  : `${daysInMonth} dias registrados`,
                color: '#EF4444',
                rgb: '239,68,68',
              },
              {
                label: 'Média/dia',
                value: formatBRL(avgPerDay),
                sub: `${expenses.length} transações`,
                color: '#FF4D00',
                rgb: '255,77,0',
              },
              {
                label: 'Receitas',
                value: formatBRL(totalIncome),
                sub: `${incomes.length} entradas`,
                color: '#00FF88',
                rgb: '0,255,136',
              },
              {
                label: 'Taxa poupança',
                value: savingsRate !== null ? `${Math.max(0, savingsRate)}%` : '–',
                sub: savingsRate !== null && savingsRate > 0 ? 'do que entrou' : 'sem dados',
                color: '#F5C842',
                rgb: '245,200,66',
              },
            ].map(s => (
              <div
                key={s.label}
                className="rounded-xl p-3"
                style={{
                  background: `linear-gradient(135deg, rgba(${s.rgb},0.07) 0%, rgba(13,24,41,0.98) 100%)`,
                  border: `1px solid rgba(${s.rgb},0.15)`,
                }}
              >
                <div className="text-[10px] text-text-muted uppercase tracking-wider mb-1">{s.label}</div>
                <div className="font-black text-sm leading-none" style={{ color: s.color }}>{s.value}</div>
                <div className="text-[10px] text-text-muted mt-1 leading-tight">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Expense categories ───────────────────────────────────────── */}
      {sortedExpCats.length > 0 && (
        <div
          className="rounded-2xl p-5 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(239,68,68,0.05) 0%, rgba(13,24,41,0.98) 100%)',
            border: '1px solid rgba(239,68,68,0.12)',
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <div
              className="w-6 h-6 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.2)' }}
            >
              <TrendingDown size={12} style={{ color: '#EF4444' }} />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-text-muted">Onde saiu o dinheiro</span>
            <span className="ml-auto text-xs text-text-muted">{sortedExpCats.length} categorias</span>
          </div>

          <div className="space-y-3">
            {sortedExpCats.map((cat, i) => {
              const catChg = cat.prevTotal > 0
                ? ((cat.total - cat.prevTotal) / cat.prevTotal) * 100
                : null
              return (
                <div key={cat.id} className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    {/* Rank + icon */}
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0"
                      style={{
                        background: `rgba(${cat.rgb},0.12)`,
                        border: `1px solid rgba(${cat.rgb},0.2)`,
                      }}
                    >
                      {cat.icon}
                    </div>

                    {/* Name + bar */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold truncate">{cat.name}</span>
                          {i === 0 && (
                            <span
                              className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                              style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444' }}
                            >
                              MAIOR
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {catChg !== null && (
                            <span
                              className="text-[10px] font-bold"
                              style={{ color: catChg > 0 ? '#EF4444' : '#00FF88' }}
                            >
                              {formatPct(catChg)}
                            </span>
                          )}
                          <span className="text-xs font-bold" style={{ color: cat.color }}>
                            {formatBRL(cat.total)}
                          </span>
                          <span className="text-[10px] text-text-muted w-6 text-right">{cat.pct}%</span>
                        </div>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${cat.barPct}%`,
                            background: `rgba(${cat.rgb},0.8)`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Expense category mini breakdown pct bars */}
          <div className="mt-4 flex gap-0.5 h-2 rounded-full overflow-hidden">
            {sortedExpCats.map(cat => (
              <div
                key={cat.id}
                title={`${cat.name}: ${cat.pct}%`}
                style={{ width: `${cat.pct}%`, background: cat.color, opacity: 0.8 }}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {sortedExpCats.map(cat => (
              <div key={cat.id} className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: cat.color }} />
                <span className="text-[9px] text-text-muted">{cat.name} {cat.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Income categories ────────────────────────────────────────── */}
      {sortedIncCats.length > 0 && (
        <div
          className="rounded-2xl p-5 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(0,255,136,0.05) 0%, rgba(13,24,41,0.98) 100%)',
            border: '1px solid rgba(0,255,136,0.12)',
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <div
              className="w-6 h-6 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(0,255,136,0.12)', border: '1px solid rgba(0,255,136,0.2)' }}
            >
              <TrendingUp size={12} style={{ color: '#00FF88' }} />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-text-muted">De onde veio o dinheiro</span>
          </div>

          <div className="space-y-2.5">
            {sortedIncCats.map((cat, i) => (
              <div key={cat.id} className="flex items-center gap-2.5">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0"
                  style={{
                    background: `rgba(${cat.rgb},0.1)`,
                    border: `1px solid rgba(${cat.rgb},0.2)`,
                  }}
                >
                  {cat.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="text-xs font-medium truncate">{cat.name}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] text-text-muted">{cat.pct}%</span>
                      <span className="text-xs font-bold" style={{ color: '#00FF88' }}>
                        {formatBRL(cat.total)}
                      </span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${cat.barPct}%`,
                        background: i === 0 ? '#00FF88' : 'rgba(0,255,136,0.5)',
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Day-of-week spending pattern ─────────────────────────────── */}
      {expenses.length > 0 && (
        <div
          className="rounded-2xl p-5 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(124,58,237,0.05) 0%, rgba(13,24,41,0.98) 100%)',
            border: '1px solid rgba(124,58,237,0.12)',
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <div
              className="w-6 h-6 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.22)' }}
            >
              <Calendar size={12} style={{ color: '#7C3AED' }} />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-text-muted">
              Padrão de gastos por dia
            </span>
            {heaviestDow >= 0 && dowAvgs[heaviestDow]! > 0 && (
              <span
                className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444' }}
              >
                mais gasta: {DOW_LABELS[heaviestDow]}
              </span>
            )}
          </div>

          <div className="space-y-2">
            {DOW_LONG.map((dayLong, dow) => {
              const avg = dowAvgs[dow] ?? 0
              const barPct = Math.round((avg / maxDowAvg) * 100)
              const isHeaviest = dow === heaviestDow && avg > 0
              return (
                <div key={dayLong} className="flex items-center gap-2">
                  <span className="text-[10px] text-text-muted w-14 shrink-0">{dayLong}</span>
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${barPct}%`,
                        background: isHeaviest ? '#EF4444' : 'rgba(239,68,68,0.4)',
                      }}
                    />
                  </div>
                  <span
                    className="text-[10px] font-bold w-14 text-right shrink-0"
                    style={{ color: isHeaviest ? '#EF4444' : '#5A6B8A' }}
                  >
                    {avg > 0 ? formatBRL(avg) : '–'}
                  </span>
                </div>
              )
            })}
          </div>

          {heaviestDow >= 0 && dowAvgs[heaviestDow]! > 0 && (
            <div
              className="mt-4 rounded-xl px-4 py-3 flex items-center gap-3"
              style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.1)' }}
            >
              <span className="text-lg shrink-0">💸</span>
              <p className="text-xs text-text-muted">
                Você gasta mais às{' '}
                <span className="font-bold text-white">{DOW_LONG[heaviestDow]}s</span>
                {' '}— média de{' '}
                <span className="font-bold" style={{ color: '#EF4444' }}>
                  {formatBRL(dowAvgs[heaviestDow]!)}
                </span>
                {' '}por transação.{' '}
                {dowAvgs[heaviestDow]! > avgPerDay * 1.5
                  ? 'Bem acima da sua média diária.'
                  : 'Dentro do esperado.'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
