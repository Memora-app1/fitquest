import { createClient } from '@/lib/supabase/server'
import { TrendingUp } from 'lucide-react'
import { MonthlyTrendsLazy } from './monthly-trends-lazy'
import type { MonthData } from './monthly-trends'

const MONTHS_PT_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

export async function FinanceTrends({ userId }: { userId: string }) {
  const supabase = await createClient()

  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() // 0-based

  // Build an array of the 6 most recent months (including current)
  const months: { year: number; month: number; firstDay: string; lastDay: string }[] = []
  for (let i = 5; i >= 0; i--) {
    let m = currentMonth - i
    let y = currentYear
    if (m < 0) { m += 12; y -= 1 }
    const firstDay = `${y}-${String(m + 1).padStart(2, '0')}-01`
    const lastDay = new Date(y, m + 1, 0).toISOString().split('T')[0]!
    months.push({ year: y, month: m, firstDay, lastDay })
  }

  const oldest = months[0]!
  const newest = months[months.length - 1]!

  // Fetch all transactions for the 6-month window in one query
  const { data: rawTx } = await supabase
    .from('transactions')
    .select('amount, transaction_date, type')
    .eq('user_id', userId)
    .eq('is_paid', true)
    .gte('transaction_date', oldest.firstDay)
    .lte('transaction_date', newest.lastDay)

  const tx = rawTx ?? []

  // Group by month
  const incomeByMonth = new Map<string, number>()
  const expenseByMonth = new Map<string, number>()

  for (const t of tx) {
    const [yearStr, monthStr] = t.transaction_date.split('-')
    if (!yearStr || !monthStr) continue
    const key = `${yearStr}-${monthStr}`
    const amount = Math.abs(Number(t.amount))
    if (t.type === 'income') {
      incomeByMonth.set(key, (incomeByMonth.get(key) ?? 0) + amount)
    } else if (t.type === 'expense') {
      expenseByMonth.set(key, (expenseByMonth.get(key) ?? 0) + amount)
    }
  }

  // Build data array for chart
  const chartData: MonthData[] = months.map(({ year, month }) => {
    const key = `${year}-${String(month + 1).padStart(2, '0')}`
    const income = Math.round(incomeByMonth.get(key) ?? 0)
    const expense = Math.round(expenseByMonth.get(key) ?? 0)
    const net = income - expense
    const savingsRate = income > 0 ? Math.round((net / income) * 100) : 0
    const isCurrent = year === currentYear && month === currentMonth
    return {
      month: MONTHS_PT_SHORT[month]!,
      income,
      expense,
      net,
      savingsRate,
      isCurrent,
    }
  })

  // Only show if there's actual data
  const hasAnyData = chartData.some(d => d.income > 0 || d.expense > 0)
  if (!hasAnyData) return null

  // Compute 6-month trend
  const validMonths = chartData.filter(d => d.income > 0 || d.expense > 0)
  const firstHalf = validMonths.slice(0, Math.floor(validMonths.length / 2))
  const secondHalf = validMonths.slice(Math.floor(validMonths.length / 2))
  const firstHalfExpense = firstHalf.reduce((s, d) => s + d.expense, 0) / Math.max(1, firstHalf.length)
  const secondHalfExpense = secondHalf.reduce((s, d) => s + d.expense, 0) / Math.max(1, secondHalf.length)
  const trend = firstHalfExpense > 0 ? Math.round(((secondHalfExpense - firstHalfExpense) / firstHalfExpense) * 100) : null

  return (
    <div
      className="rounded-2xl p-5 md:p-6 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(0,255,136,0.05) 0%, rgba(13,24,41,0.98) 60%, rgba(59,130,246,0.04) 100%)',
        border: '1px solid rgba(0,255,136,0.14)',
      }}
    >
      {/* Corner glow */}
      <div
        className="absolute -top-8 -right-8 w-40 h-40 rounded-full pointer-events-none blur-3xl"
        style={{ background: 'rgba(0,255,136,0.07)' }}
      />

      <div className="relative z-10 space-y-5">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(0,255,136,0.12)', border: '1px solid rgba(0,255,136,0.2)' }}
              >
                <TrendingUp size={12} style={{ color: '#00FF88' }} />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-text-muted">
                Tendência Financeira
              </span>
            </div>
            <h2 className="text-xl font-black leading-tight">Últimos 6 meses</h2>
            <p className="text-sm text-text-muted mt-0.5">
              Receitas · Gastos · Taxa de poupança por mês
            </p>
          </div>

          {/* Trend indicator */}
          {trend !== null && (
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold shrink-0"
              style={{
                background: trend <= 0 ? 'rgba(0,255,136,0.1)' : 'rgba(255,77,0,0.1)',
                border: `1px solid ${trend <= 0 ? 'rgba(0,255,136,0.2)' : 'rgba(255,77,0,0.2)'}`,
                color: trend <= 0 ? '#00FF88' : '#FF4D00',
              }}
            >
              {trend <= 0 ? '📉' : '📈'}
              <span>
                Gastos {trend <= 0 ? 'caindo' : 'subindo'}{' '}
                <span className="font-black">{Math.abs(trend)}%</span>
              </span>
            </div>
          )}
        </div>

        {/* ── Chart ───────────────────────────────────────────────────── */}
        <MonthlyTrendsLazy data={chartData} />

      </div>
    </div>
  )
}
