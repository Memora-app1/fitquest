import { createClient } from '@/lib/supabase/server'
import { TrendingUp, TrendingDown, CalendarDays, Zap } from 'lucide-react'

interface TxRow {
  amount: number
  type: string
  transaction_date: string
  is_paid: boolean
  description: string
}

interface DayForecast {
  date: string
  label: string
  dayNum: number
  isPast: boolean
  isToday: boolean
  isFuture: boolean
  income: number
  expense: number
  net: number
  runningBalance: number
  hasTx: boolean
}

interface WeekSummary {
  label: string
  income: number
  expense: number
  net: number
  txCount: number
}

function formatBRL(v: number): string {
  const abs = Math.abs(v)
  if (abs >= 1000000) return `${v < 0 ? '-' : ''}R$${(abs / 1000000).toFixed(1)}M`
  if (abs >= 1000) return `${v < 0 ? '-' : ''}R$${(abs / 1000).toFixed(1)}k`
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function toISO(d: Date): string {
  return d.toISOString().split('T')[0]!
}

export async function CashFlowForecast({ userId }: { userId: string }) {
  const supabase = await createClient()

  const now = new Date()
  const todayStr = toISO(now)

  // Current month window
  const year  = now.getFullYear()
  const month = now.getMonth()
  const firstDay = toISO(new Date(year, month, 1))
  const lastDay  = toISO(new Date(year, month + 1, 0))

  // Also fetch next 30 days of scheduled (unpaid) transactions for forecast
  const thirtyDaysOut = toISO(new Date(now.getTime() + 30 * 86400000))

  const [paidRes, scheduledRes] = await Promise.all([
    // Already paid this month (actuals)
    supabase
      .from('transactions')
      .select('amount, type, transaction_date, is_paid, description')
      .eq('user_id', userId)
      .gte('transaction_date', firstDay)
      .lte('transaction_date', lastDay)
      .eq('is_paid', true),
    // Unpaid/scheduled (future obligations)
    supabase
      .from('transactions')
      .select('amount, type, transaction_date, is_paid, description')
      .eq('user_id', userId)
      .gte('transaction_date', todayStr)
      .lte('transaction_date', thirtyDaysOut)
      .eq('is_paid', false),
  ])

  const paidTxns = (paidRes.data ?? []) as TxRow[]
  const scheduledTxns = (scheduledRes.data ?? []) as TxRow[]

  if (paidTxns.length === 0 && scheduledTxns.length === 0) return null

  // Build day-level maps
  const paidByDay = new Map<string, { income: number; expense: number; count: number }>()
  for (const t of paidTxns) {
    const d = t.transaction_date
    if (!paidByDay.has(d)) paidByDay.set(d, { income: 0, expense: 0, count: 0 })
    const entry = paidByDay.get(d)!
    if (t.type === 'income') entry.income += Number(t.amount)
    else entry.expense += Number(t.amount)
    entry.count++
  }

  const scheduledByDay = new Map<string, { income: number; expense: number; count: number }>()
  for (const t of scheduledTxns) {
    const d = t.transaction_date
    if (!scheduledByDay.has(d)) scheduledByDay.set(d, { income: 0, expense: 0, count: 0 })
    const entry = scheduledByDay.get(d)!
    if (t.type === 'income') entry.income += Number(t.amount)
    else entry.expense += Number(t.amount)
    entry.count++
  }

  // Actuals so far this month
  const actualIncome  = paidTxns.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
  const actualExpense = paidTxns.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
  const actualNet     = actualIncome - actualExpense

  // Scheduled obligations
  const scheduledIncome  = scheduledTxns.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
  const scheduledExpense = scheduledTxns.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)

  // Projected month-end net
  const projectedNet = actualNet + (scheduledIncome - scheduledExpense)

  // Build 35-day forecast (today + 34 days ahead, capped at end of current month + next week)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const days: DayForecast[] = []
  let runningBalance = actualNet

  for (let offset = -(now.getDate() - 1); offset <= Math.min(34, daysInMonth - now.getDate() + 7); offset++) {
    const d = new Date(year, month, now.getDate() + offset)
    const dateStr = toISO(d)
    if (d.getFullYear() !== year || d.getMonth() !== month) {
      if (offset <= 0) continue
    }

    const isPast   = dateStr < todayStr
    const isToday  = dateStr === todayStr
    const isFuture = dateStr > todayStr

    const paid      = paidByDay.get(dateStr)
    const scheduled = scheduledByDay.get(dateStr)

    const income  = (paid?.income ?? 0) + (isFuture ? (scheduled?.income ?? 0) : 0)
    const expense = (paid?.expense ?? 0) + (isFuture ? (scheduled?.expense ?? 0) : 0)
    const net     = income - expense

    if (!isPast) runningBalance += net
    else if (isPast && paid) {
      // already counted in actualNet, don't double-add
    }

    days.push({
      date: dateStr,
      label: d.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric' }),
      dayNum: d.getDate(),
      isPast,
      isToday,
      isFuture,
      income,
      expense,
      net,
      runningBalance: isPast ? 0 : runningBalance,
      hasTx: income > 0 || expense > 0,
    })
  }

  // Recalculate running balance properly
  let balance = actualNet
  const futureAndToday = days.filter(d => !d.isPast)
  for (const day of futureAndToday) {
    balance += day.net
    day.runningBalance = balance
  }

  // Weekly summaries for remaining weeks
  const weeks: WeekSummary[] = []
  for (let w = 0; w < 4; w++) {
    const weekStart = new Date(now.getTime() + w * 7 * 86400000)
    const weekEnd   = new Date(now.getTime() + (w + 1) * 7 * 86400000)
    const startStr  = toISO(weekStart)
    const endStr    = toISO(weekEnd)

    const weekPaid = paidTxns.filter(t => t.transaction_date >= startStr && t.transaction_date < endStr)
    const weekSched = scheduledTxns.filter(t => t.transaction_date >= startStr && t.transaction_date < endStr)
    const allWeekTx = [...weekPaid, ...weekSched]

    const wIncome  = allWeekTx.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
    const wExpense = allWeekTx.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)

    const label = w === 0 ? 'Esta semana'
      : w === 1 ? 'Próx. semana'
      : `+${w * 7}–${(w + 1) * 7}d`

    weeks.push({
      label,
      income: wIncome,
      expense: wExpense,
      net: wIncome - wExpense,
      txCount: allWeekTx.length,
    })
  }

  const maxWeekAbs = Math.max(...weeks.map(w => Math.max(w.income, w.expense)), 1)

  // Upcoming obligations (scheduled expenses, next 14 days)
  const upcomingObligs = scheduledTxns
    .filter(t => t.type === 'expense')
    .sort((a, b) => a.transaction_date.localeCompare(b.transaction_date))
    .slice(0, 5)

  // Days with highest expense burden ahead
  const highExpenseDays = days
    .filter(d => d.isFuture && d.expense > 0)
    .sort((a, b) => b.expense - a.expense)
    .slice(0, 3)

  // Current month progress
  const dayOfMonth   = now.getDate()
  const monthProgress = Math.round((dayOfMonth / daysInMonth) * 100)

  return (
    <div
      className="rounded-2xl p-5 md:p-6 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(124,58,237,0.06) 0%, rgba(13,24,41,0.98) 60%, rgba(0,255,136,0.04) 100%)',
        border: '1px solid rgba(124,58,237,0.14)',
      }}
    >
      <div
        className="absolute -top-8 -right-8 w-40 h-40 rounded-full pointer-events-none blur-3xl"
        style={{ background: 'rgba(124,58,237,0.06)' }}
      />

      <div className="relative z-10 space-y-5">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.22)' }}
              >
                <CalendarDays size={12} style={{ color: '#7C3AED' }} />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-text-muted">
                Fluxo de Caixa
              </span>
            </div>
            <h2 className="text-xl font-black leading-tight">Projeção do Mês</h2>
            <p className="text-sm text-text-muted mt-0.5">
              {monthProgress}% do mês concluído · {scheduledTxns.length} obrigações agendadas
            </p>
          </div>

          {/* Projected net */}
          <div className="text-right">
            <div
              className="text-3xl font-black"
              style={{ color: projectedNet >= 0 ? '#00FF88' : '#EF4444' }}
            >
              {projectedNet >= 0 ? '+' : ''}{formatBRL(projectedNet)}
            </div>
            <div className="text-[10px] text-text-muted uppercase tracking-wider">saldo projetado</div>
          </div>
        </div>

        {/* ── Stats strip ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          {[
            {
              label: 'Pago até hoje',
              value: formatBRL(actualExpense),
              color: '#FF4D00',
              rgb: '255,77,0',
            },
            {
              label: 'Receita até hoje',
              value: formatBRL(actualIncome),
              color: '#00FF88',
              rgb: '0,255,136',
            },
            {
              label: 'Obrigações futuras',
              value: formatBRL(scheduledExpense),
              color: '#F5C842',
              rgb: '245,200,66',
            },
            {
              label: 'Receita esperada',
              value: formatBRL(scheduledIncome),
              color: '#7C3AED',
              rgb: '124,58,237',
            },
          ].map(s => (
            <div
              key={s.label}
              className="rounded-xl p-3"
              style={{
                background: `linear-gradient(135deg, rgba(${s.rgb},0.07) 0%, rgba(13,24,41,0.98) 100%)`,
                border: `1px solid rgba(${s.rgb},0.14)`,
              }}
            >
              <div className="text-[9px] text-text-muted uppercase tracking-wider mb-1">{s.label}</div>
              <div className="font-black text-sm leading-none" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* ── Weekly bar chart ─────────────────────────────────────────── */}
        <div className="space-y-2">
          <div className="text-[10px] text-text-muted uppercase tracking-wider">Receita vs Despesa por Semana</div>
          <div className="flex items-end gap-3 h-24">
            {weeks.map((w, i) => {
              const incomeH  = Math.round((w.income / maxWeekAbs) * 64)
              const expenseH = Math.round((w.expense / maxWeekAbs) * 64)
              const isCurrentWeek = i === 0

              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  {/* Net label */}
                  {(w.income > 0 || w.expense > 0) && (
                    <span
                      className="text-[8px] font-bold"
                      style={{ color: w.net >= 0 ? '#00FF88' : '#EF4444' }}
                    >
                      {w.net >= 0 ? '+' : ''}{formatBRL(w.net)}
                    </span>
                  )}

                  {/* Side-by-side bars */}
                  <div className="w-full flex gap-0.5 items-end" style={{ height: '64px' }}>
                    <div
                      className="flex-1 rounded-t-sm"
                      style={{
                        height: `${Math.max(2, incomeH)}px`,
                        background: isCurrentWeek ? '#00FF88' : 'rgba(0,255,136,0.35)',
                      }}
                    />
                    <div
                      className="flex-1 rounded-t-sm"
                      style={{
                        height: `${Math.max(2, expenseH)}px`,
                        background: isCurrentWeek ? '#FF4D00' : 'rgba(255,77,0,0.35)',
                      }}
                    />
                  </div>

                  <span
                    className="text-[9px] text-center leading-tight"
                    style={{ color: isCurrentWeek ? '#7C3AED' : '#5A6B8A' }}
                  >
                    {w.label}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-[9px] text-text-muted">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-sm" style={{ background: 'rgba(0,255,136,0.6)' }} />
              <span>Receita</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-sm" style={{ background: 'rgba(255,77,0,0.5)' }} />
              <span>Despesa</span>
            </div>
          </div>
        </div>

        {/* ── Upcoming obligations ─────────────────────────────────────── */}
        {upcomingObligs.length > 0 && (
          <div className="space-y-2">
            <div className="text-[10px] text-text-muted uppercase tracking-wider">Próximas Obrigações</div>
            <div className="space-y-1.5">
              {upcomingObligs.map((t, i) => {
                const daysAway = Math.ceil((new Date(t.transaction_date).getTime() - now.getTime()) / 86400000)
                const isUrgent = daysAway <= 3
                const isToday  = daysAway === 0

                return (
                  <div
                    key={i}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2"
                    style={{
                      background: isUrgent
                        ? 'rgba(239,68,68,0.06)'
                        : 'rgba(255,255,255,0.025)',
                      border: `1px solid ${isUrgent ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.05)'}`,
                    }}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                      style={{
                        background: isUrgent ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.05)',
                        color: isUrgent ? '#EF4444' : '#8899BB',
                      }}
                    >
                      {isToday ? '!' : daysAway}
                    </div>
                    <span className="text-sm flex-1 truncate">{t.description}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{
                          background: isUrgent ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.04)',
                          color: isUrgent ? '#EF4444' : '#8899BB',
                        }}
                      >
                        {isToday ? 'hoje' : `em ${daysAway}d`}
                      </span>
                      <span className="text-sm font-bold" style={{ color: '#FF4D00' }}>
                        {formatBRL(Number(t.amount))}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── High expense days ahead ──────────────────────────────────── */}
        {highExpenseDays.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-[10px] text-text-muted uppercase tracking-wider">Dias de Alta Despesa Previstos</div>
            <div className="flex gap-2 flex-wrap">
              {highExpenseDays.map((d, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
                  style={{
                    background: 'rgba(255,77,0,0.07)',
                    border: '1px solid rgba(255,77,0,0.15)',
                  }}
                >
                  <span className="text-[9px] text-text-muted">
                    {new Date(d.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </span>
                  <span className="text-[10px] font-bold" style={{ color: '#FF4D00' }}>
                    {formatBRL(d.expense)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Insight footer ───────────────────────────────────────────── */}
        <div
          className="rounded-xl px-4 py-3 flex items-center gap-3"
          style={{
            background: projectedNet >= 0 ? 'rgba(0,255,136,0.04)' : 'rgba(239,68,68,0.05)',
            border: projectedNet >= 0 ? '1px solid rgba(0,255,136,0.1)' : '1px solid rgba(239,68,68,0.1)',
          }}
        >
          <span className="text-lg shrink-0">
            {projectedNet > actualNet * 0.2 ? '📈' : projectedNet >= 0 ? '✅' : '⚠️'}
          </span>
          <div>
            <p className="text-sm font-semibold leading-snug">
              {projectedNet >= 0
                ? `Você vai fechar o mês no positivo com ${formatBRL(projectedNet)}`
                : `Atenção: projeção de déficit de ${formatBRL(Math.abs(projectedNet))}`}
            </p>
            <p className="text-[11px] text-text-muted mt-0.5">
              {scheduledTxns.length > 0
                ? `${scheduledTxns.length} transação${scheduledTxns.length !== 1 ? 'ões' : ''} agendada${scheduledTxns.length !== 1 ? 's' : ''} (${formatBRL(scheduledExpense)} em despesas).`
                : 'Nenhuma obrigação pendente agendada para os próximos dias.'}
              {projectedNet < 0 && ' Revise seus gastos para equilibrar o mês.'}
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}
