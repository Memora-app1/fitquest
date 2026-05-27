import { createClient } from '@/lib/supabase/server'
import { CalendarDays } from 'lucide-react'

interface TxRow {
  amount: number
  type: string
  transaction_date: string
}

interface DayStat {
  date: string
  day: number
  income: number
  expense: number
  net: number
  txCount: number
  isToday: boolean
  isFuture: boolean
}

function formatBRL(v: number): string {
  const abs = Math.abs(v)
  if (abs >= 1000) return `R$${(abs / 1000).toFixed(1)}k`
  return Math.abs(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function cellBg(day: DayStat, maxAbs: number): string {
  if (day.isFuture || day.txCount === 0) return 'rgba(255,255,255,0.03)'
  const intensity = Math.min(Math.abs(day.net) / maxAbs, 1)
  if (day.net < 0) {
    // expense dominant
    const alpha = 0.15 + intensity * 0.55
    return `rgba(239,68,68,${alpha.toFixed(2)})`
  }
  // income dominant or zero
  const alpha = 0.12 + intensity * 0.5
  return `rgba(0,255,136,${alpha.toFixed(2)})`
}

function cellBorder(day: DayStat, maxAbs: number): string {
  if (day.isToday) return 'rgba(245,200,66,0.8)'
  if (day.isFuture || day.txCount === 0) return 'rgba(255,255,255,0.04)'
  const intensity = Math.min(Math.abs(day.net) / maxAbs, 1)
  if (day.net < 0) return `rgba(239,68,68,${(0.2 + intensity * 0.4).toFixed(2)})`
  return `rgba(0,255,136,${(0.2 + intensity * 0.35).toFixed(2)})`
}

const DOW_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export async function FinanceMonthCalendar({ userId }: { userId: string }) {
  const supabase = await createClient()

  const now = new Date()
  const year  = now.getFullYear()
  const month = now.getMonth()

  // Fetch current month transactions
  const firstDay = `${year}-${String(month + 1).padStart(2, '0')}-01`
  const lastDay  = new Date(year, month + 1, 0).toISOString().split('T')[0]!

  const { data: raw } = await supabase
    .from('transactions')
    .select('amount, type, transaction_date')
    .eq('user_id', userId)
    .gte('transaction_date', firstDay)
    .lte('transaction_date', lastDay)

  const rows = (raw ?? []) as TxRow[]
  if (rows.length === 0) return null

  const todayStr = now.toISOString().split('T')[0]!

  // Build day map
  const dayMap = new Map<string, { income: number; expense: number; count: number }>()
  for (const r of rows) {
    if (!dayMap.has(r.transaction_date)) {
      dayMap.set(r.transaction_date, { income: 0, expense: 0, count: 0 })
    }
    const d = dayMap.get(r.transaction_date)!
    d.count++
    if (r.type === 'income') d.income += Number(r.amount)
    else                      d.expense += Number(r.amount)
  }

  // Build ordered list of days in month
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const dayStat: DayStat[] = []
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const data    = dayMap.get(dateStr)
    const income  = data?.income  ?? 0
    const expense = data?.expense ?? 0
    dayStat.push({
      date:     dateStr,
      day:      d,
      income,
      expense,
      net:      income - expense,
      txCount:  data?.count ?? 0,
      isToday:  dateStr === todayStr,
      isFuture: dateStr > todayStr,
    })
  }

  const maxAbs = Math.max(...dayStat.map(d => Math.abs(d.net)), 1)

  // Calendar grid: first day-of-week of month (0=Sun)
  const firstDow = new Date(year, month, 1).getDay()
  // Total cells = leading empty + days in month
  const totalCells = firstDow + daysInMonth
  const numWeeks   = Math.ceil(totalCells / 7)

  // Build grid[row][col] = DayStat | null
  const grid: Array<Array<DayStat | null>> = []
  for (let row = 0; row < numWeeks; row++) {
    const week: Array<DayStat | null> = []
    for (let col = 0; col < 7; col++) {
      const cellIdx = row * 7 + col
      const dayIdx  = cellIdx - firstDow  // 0-based day of month
      if (dayIdx < 0 || dayIdx >= daysInMonth) {
        week.push(null)
      } else {
        week.push(dayStat[dayIdx] ?? null)
      }
    }
    grid.push(week)
  }

  // Summary stats
  const activeDays    = dayStat.filter(d => d.txCount > 0 && !d.isFuture).length
  const totalExpense  = dayStat.reduce((s, d) => s + d.expense, 0)
  const totalIncome   = dayStat.reduce((s, d) => s + d.income, 0)
  const incomedays    = dayStat.filter(d => d.income > d.expense && d.txCount > 0).length
  const expenseDays   = dayStat.filter(d => d.expense > d.income && d.txCount > 0).length

  const worstDay  = [...dayStat].sort((a, b) => a.net - b.net)[0]
  const bestDay   = [...dayStat].sort((a, b) => b.net - a.net)[0]

  const monthName = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  return (
    <div
      className="rounded-2xl p-5 md:p-6 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(245,200,66,0.05) 0%, rgba(13,24,41,0.98) 60%, rgba(0,255,136,0.03) 100%)',
        border: '1px solid rgba(245,200,66,0.12)',
      }}
    >
      <div
        className="absolute -top-8 -right-8 w-40 h-40 rounded-full pointer-events-none blur-3xl"
        style={{ background: 'rgba(245,200,66,0.05)' }}
      />

      <div className="relative z-10 space-y-5">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(245,200,66,0.12)', border: '1px solid rgba(245,200,66,0.22)' }}
              >
                <CalendarDays size={12} style={{ color: '#F5C842' }} />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-text-muted">
                Calendário Financeiro
              </span>
            </div>
            <h2 className="text-xl font-black leading-tight capitalize">{monthName}</h2>
            <p className="text-sm text-text-muted mt-0.5">
              {activeDays} dia{activeDays !== 1 ? 's' : ''} com movimentações · {rows.length} transações
            </p>
          </div>

          {/* Net balance */}
          <div className="text-right">
            <div
              className="text-2xl font-black"
              style={{ color: totalIncome >= totalExpense ? '#00FF88' : '#EF4444' }}
            >
              {totalIncome >= totalExpense ? '+' : ''}{formatBRL(totalIncome - totalExpense)}
            </div>
            <div className="text-[10px] text-text-muted uppercase tracking-wider">saldo do mês</div>
          </div>
        </div>

        {/* ── Summary strip ───────────────────────────────────────────── */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Entradas', value: formatBRL(totalIncome), color: '#00FF88', rgb: '0,255,136' },
            { label: 'Saídas', value: formatBRL(totalExpense), color: '#EF4444', rgb: '239,68,68' },
            { label: 'Dias + receita', value: String(incomedays), color: '#00FF88', rgb: '0,255,136' },
            { label: 'Dias + gasto', value: String(expenseDays), color: '#EF4444', rgb: '239,68,68' },
          ].map(s => (
            <div
              key={s.label}
              className="rounded-xl p-2.5 text-center"
              style={{
                background: `rgba(${s.rgb},0.07)`,
                border: `1px solid rgba(${s.rgb},0.14)`,
              }}
            >
              <div className="text-[9px] text-text-muted uppercase tracking-wider mb-1 leading-tight">{s.label}</div>
              <div className="font-black text-sm leading-none" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* ── Calendar grid ────────────────────────────────────────────── */}
        <div className="space-y-1">
          {/* Day-of-week headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {DOW_LABELS.map(label => (
              <div key={label} className="text-center text-[9px] text-text-muted font-medium py-1">
                {label}
              </div>
            ))}
          </div>

          {/* Calendar rows */}
          {grid.map((week, rowIdx) => (
            <div key={rowIdx} className="grid grid-cols-7 gap-1">
              {week.map((cell, colIdx) => {
                if (!cell) {
                  return (
                    <div
                      key={colIdx}
                      className="rounded-lg"
                      style={{ paddingBottom: '100%', background: 'transparent' }}
                    />
                  )
                }
                return (
                  <div
                    key={colIdx}
                    title={
                      cell.txCount > 0
                        ? `${cell.date}: ${cell.txCount} transação${cell.txCount !== 1 ? 'ões' : ''} · ${cell.net >= 0 ? '+' : ''}${formatBRL(cell.net)}`
                        : cell.isFuture ? cell.date : `${cell.date}: sem transações`
                    }
                    className="rounded-lg relative overflow-hidden transition-all"
                    style={{
                      paddingBottom: '100%',
                      background: cellBg(cell, maxAbs),
                      border: `1px solid ${cellBorder(cell, maxAbs)}`,
                      boxShadow: cell.isToday ? '0 0 8px rgba(245,200,66,0.4)' : 'none',
                    }}
                  >
                    {/* Day number */}
                    <div
                      className="absolute inset-0 flex flex-col items-center justify-center"
                    >
                      <span
                        className="text-[10px] font-bold leading-none"
                        style={{
                          color: cell.isToday
                            ? '#F5C842'
                            : cell.isFuture || cell.txCount === 0
                            ? 'rgba(136,153,187,0.4)'
                            : cell.net < 0
                            ? 'rgba(239,68,68,0.9)'
                            : 'rgba(0,255,136,0.9)',
                        }}
                      >
                        {cell.day}
                      </span>
                      {cell.txCount > 0 && !cell.isFuture && (
                        <span
                          className="text-[7px] leading-none mt-0.5"
                          style={{
                            color: cell.net < 0 ? 'rgba(239,68,68,0.7)' : 'rgba(0,255,136,0.7)',
                          }}
                        >
                          {cell.txCount}tx
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        {/* ── Color legend ────────────────────────────────────────────── */}
        <div className="flex items-center gap-4 text-[9px] text-text-muted flex-wrap">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: 'rgba(0,255,136,0.6)', border: '1px solid rgba(0,255,136,0.3)' }} />
            <span>Receita dominante</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: 'rgba(239,68,68,0.55)', border: '1px solid rgba(239,68,68,0.3)' }} />
            <span>Gasto dominante</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)' }} />
            <span>Sem transações</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: 'transparent', border: '1px solid rgba(245,200,66,0.8)', boxShadow: '0 0 4px rgba(245,200,66,0.3)' }} />
            <span>Hoje</span>
          </div>
        </div>

        {/* ── Best/worst day callouts ──────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-2.5">
          {worstDay && worstDay.net < 0 && (
            <div
              className="rounded-xl p-3"
              style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.12)' }}
            >
              <div className="text-[9px] text-text-muted uppercase tracking-wider mb-1">Dia mais pesado</div>
              <div className="font-black text-sm" style={{ color: '#EF4444' }}>
                {new Date(worstDay.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
              </div>
              <div className="text-[10px] text-text-muted mt-0.5">{formatBRL(worstDay.expense)} saídas</div>
            </div>
          )}
          {bestDay && bestDay.net > 0 && (
            <div
              className="rounded-xl p-3"
              style={{ background: 'rgba(0,255,136,0.05)', border: '1px solid rgba(0,255,136,0.1)' }}
            >
              <div className="text-[9px] text-text-muted uppercase tracking-wider mb-1">Melhor dia</div>
              <div className="font-black text-sm" style={{ color: '#00FF88' }}>
                {new Date(bestDay.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
              </div>
              <div className="text-[10px] text-text-muted mt-0.5">{formatBRL(bestDay.income)} entradas</div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
