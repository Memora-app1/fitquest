import type { Metadata } from 'next'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components/layout/app-shell'
import { formatBRL } from '@/lib/utils'
import Link from 'next/link'
import { EmptyState } from '@/components/empty-state'
import {
  Plus, TrendingUp, TrendingDown, Wallet, PiggyBank,
  AlertCircle, ArrowRight, CreditCard, Building2, Banknote,
  Target, BarChart3, Sparkles,
} from 'lucide-react'
import { SpendingChartLazy as SpendingChart } from '@/components/financas/spending-chart-lazy'
import { FinanceTrends } from '@/components/financas/finance-trends'
import { CashFlowForecast } from '@/components/financas/cash-flow-forecast'
import { FinanceIncomeAnalysis } from '@/components/financas/finance-income-analysis'
import { FinanceCategoryTrend } from '@/components/financas/finance-category-trend'
import { SavingsRateTracker } from '@/components/financas/savings-rate-tracker'
import { SpendingDowHeatmap } from '@/components/financas/spending-dow-heatmap'
import { FinanceRecurringAnalysis } from '@/components/financas/finance-recurring-analysis'
import { NetWorthSummary } from '@/components/financas/net-worth-summary'
import { FinanceGoalsMilestones } from '@/components/financas/finance-goals-milestones'
import { SpendingByCategory } from '@/components/financas/spending-by-category'
import { FinanceMonthCalendar } from '@/components/financas/finance-month-calendar'

export const metadata: Metadata = {
  title: 'Finanças',
  description: 'Controle gastos, receitas e metas financeiras. Saiba exatamente onde seu dinheiro vai.',
}

export const dynamic = 'force-dynamic'

// ─── helpers ────────────────────────────────────────────────────────────────

function accountTypeIcon(type: string) {
  if (type === 'credit_card') return <CreditCard size={18} />
  if (type === 'investment') return <TrendingUp size={18} />
  if (type === 'savings') return <PiggyBank size={18} />
  if (type === 'wallet') return <Banknote size={18} />
  return <Building2 size={18} />
}

function accountTypeLabel(type: string) {
  const map: Record<string, string> = {
    checking: 'Conta Corrente',
    savings: 'Poupança',
    credit_card: 'Cartão de Crédito',
    investment: 'Investimento',
    wallet: 'Carteira',
  }
  return map[type] ?? type.replace('_', ' ')
}

// ─── page ───────────────────────────────────────────────────────────────────

export default async function FinancasPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const firstDay = `${year}-${String(month).padStart(2, '0')}-01`
  const lastDay = new Date(year, month, 0).toISOString().split('T')[0]!

  const daysInMonth = new Date(year, month, 0).getDate()
  const dayOfMonth = now.getDate()
  const monthProgress = Math.round((dayOfMonth / daysInMonth) * 100)

  const [
    accountsRes,
    monthTxRes,
    recentTxRes,
    upcomingTxRes,
    catTxRes,
    catsRes,
    prevMonthTxRes,
  ] = await Promise.all([
    supabase
      .from('finance_accounts')
      .select('id, name, type, icon, color, current_balance')
      .eq('user_id', user.id)
      .eq('is_active', true),
    supabase
      .from('transactions')
      .select('amount, type')
      .eq('user_id', user.id)
      .gte('transaction_date', firstDay)
      .lte('transaction_date', lastDay)
      .eq('is_paid', true),
    supabase
      .from('transactions')
      .select('id, description, amount, type, transaction_date, is_paid, category_id')
      .eq('user_id', user.id)
      .order('transaction_date', { ascending: false })
      .limit(8),
    supabase
      .from('transactions')
      .select('id, description, amount, transaction_date')
      .eq('user_id', user.id)
      .eq('is_paid', false)
      .gte('transaction_date', now.toISOString().split('T')[0]!)
      .order('transaction_date')
      .limit(5),
    supabase
      .from('transactions')
      .select('category_id, amount')
      .eq('user_id', user.id)
      .eq('type', 'expense')
      .eq('is_paid', true)
      .gte('transaction_date', firstDay)
      .lte('transaction_date', lastDay),
    supabase
      .from('finance_categories')
      .select('id, name, icon, color')
      .or(`user_id.eq.${user.id},is_global.eq.true`),
    supabase
      .from('transactions')
      .select('amount, type')
      .eq('user_id', user.id)
      .eq('type', 'expense')
      .eq('is_paid', true)
      .gte(
        'transaction_date',
        `${month === 1 ? year - 1 : year}-${String(month === 1 ? 12 : month - 1).padStart(2, '0')}-01`,
      )
      .lt('transaction_date', firstDay),
  ])

  const accounts = accountsRes.data ?? []
  const totalBalance = accounts.reduce((s, a) => s + Number(a.current_balance), 0)

  const monthTx = monthTxRes.data ?? []
  const income = monthTx.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
  const expense = monthTx.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
  const net = income - expense
  const savingsRate = income > 0 ? Math.round((net / income) * 100) : 0

  const prevExpense = (prevMonthTxRes.data ?? []).reduce((s, t) => s + Number(t.amount), 0)
  const expenseDiff = prevExpense > 0 ? expense - prevExpense : null
  const expenseDiffPct =
    expenseDiff !== null && prevExpense > 0
      ? Math.abs(Math.round((expenseDiff / prevExpense) * 100))
      : null

  const dailyAvg = dayOfMonth > 0 ? expense / dayOfMonth : 0
  const projectedMonth = dailyAvg * daysInMonth

  // Income vs expense ratio for split bar
  const total = income + expense
  const incomeRatio = total > 0 ? Math.round((income / total) * 100) : 50
  const expenseRatio = 100 - incomeRatio

  // Category spending
  const catMap = new Map((catsRes.data ?? []).map((c) => [c.id, c]))
  const spendByCategory = new Map<string, number>()
  for (const tx of catTxRes.data ?? []) {
    if (!tx.category_id) continue
    spendByCategory.set(tx.category_id, (spendByCategory.get(tx.category_id) ?? 0) + Number(tx.amount))
  }
  const categorySpend = Array.from(spendByCategory.entries())
    .map(([id, amount]) => {
      const cat = catMap.get(id)
      return {
        name: cat?.name ?? 'Outro',
        icon: cat?.icon ?? '💸',
        amount,
        color: cat?.color ?? '#FF4D00',
        pct: expense > 0 ? Math.round((amount / expense) * 100) : 0,
      }
    })
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 6)

  const monthName = now.toLocaleDateString('pt-BR', { month: 'long' })
  const monthNameShort = monthName.toUpperCase().slice(0, 3)

  return (
    <AppShell>
      <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">

        {/* ── Hero Header ─────────────────────────────────────────────── */}
        <div
          className="rounded-2xl p-6 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(0,255,136,0.08) 0%, rgba(13,24,41,0.98) 60%, rgba(124,58,237,0.06) 100%)',
            border: '1px solid rgba(0,255,136,0.15)',
          }}
        >
          {/* decorative glows */}
          <div
            className="absolute -top-8 -right-8 w-40 h-40 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(0,255,136,0.12) 0%, transparent 70%)' }}
          />
          <div
            className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 70%)' }}
          />

          <div className="relative z-10 flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles size={14} className="text-brand-green" />
                <span className="text-xs font-semibold text-brand-green uppercase tracking-widest">
                  {monthName.charAt(0).toUpperCase() + monthName.slice(1)} {year}
                </span>
              </div>
              <h1 className="heading-display text-4xl md:text-5xl">Finanças</h1>
              <p className="text-text-secondary mt-1">
                Dia {dayOfMonth} de {daysInMonth} · {monthProgress}% do mês concluído
              </p>
            </div>

            <div className="flex flex-col items-end gap-1">
              <Link
                href="/financas/transacoes?new=1"
                className="btn-primary flex items-center gap-2"
              >
                <Plus size={18} /> Transação
              </Link>
              <div className="text-xs text-text-muted">{accounts.length} conta{accounts.length !== 1 ? 's' : ''} ativas</div>
            </div>
          </div>
        </div>

        {/* ── Balance Hero ──────────────────────────────────────────────── */}
        <div
          className="rounded-2xl p-6 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(13,24,41,0.98) 0%, rgba(5,9,20,1) 100%)',
            border: '1px solid rgba(245,200,66,0.2)',
            boxShadow: '0 0 40px rgba(245,200,66,0.06)',
          }}
        >
          <div
            className="absolute -top-10 -right-10 w-48 h-48 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(245,200,66,0.08) 0%, transparent 70%)' }}
          />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1 text-text-secondary text-sm">
              <Wallet size={14} className="text-brand-gold" />
              <span className="uppercase tracking-wider text-xs font-semibold">Saldo Total</span>
            </div>
            <div
              className={`heading-display text-5xl md:text-6xl mb-3 ${totalBalance < 0 ? 'text-brand-red' : 'text-brand-gold'}`}
            >
              {formatBRL(totalBalance)}
            </div>

            {/* Income / Expense split bar */}
            {(income > 0 || expense > 0) && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-text-muted">
                  <span className="text-brand-green font-medium">↑ {formatBRL(income)} receitas</span>
                  <span className="text-brand-red font-medium">↓ {formatBRL(expense)} gastos</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden flex" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <div
                    className="h-full rounded-l-full transition-all"
                    style={{ width: `${incomeRatio}%`, background: 'linear-gradient(90deg, #00FF88, #00CC6A)' }}
                  />
                  <div
                    className="h-full rounded-r-full transition-all"
                    style={{ width: `${expenseRatio}%`, background: 'linear-gradient(90deg, #FF4D00, #CC3A00)' }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-text-muted">
                  <span>{incomeRatio}% receitas</span>
                  <span>{expenseRatio}% gastos</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Income + Expense Cards ────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Income */}
          <div
            className="rounded-2xl p-6 relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(0,255,136,0.06) 0%, rgba(13,24,41,0.98) 100%)',
              border: '1px solid rgba(0,255,136,0.2)',
            }}
          >
            <div
              className="absolute -top-6 -right-6 w-28 h-28 rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(0,255,136,0.1) 0%, transparent 70%)' }}
            />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2 text-brand-green text-sm font-semibold">
                <TrendingUp size={16} />
                <span className="uppercase tracking-wider text-xs">Receitas em {monthNameShort}</span>
              </div>
              <div className="heading-display text-4xl text-brand-green">{formatBRL(income)}</div>
              <div className="mt-3 h-1.5 bg-bg-elevated rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: income > 0 ? '100%' : '0%', background: 'linear-gradient(90deg, #00FF88, #00CC6A)' }}
                />
              </div>
              <div className="text-xs text-text-muted mt-2">
                {income > 0 ? `${income > expense ? '✅ Acima dos gastos' : '⚠️ Abaixo dos gastos'}` : 'Nenhuma receita registrada'}
              </div>
            </div>
          </div>

          {/* Expense */}
          <div
            className="rounded-2xl p-6 relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(255,77,0,0.06) 0%, rgba(13,24,41,0.98) 100%)',
              border: '1px solid rgba(255,77,0,0.2)',
            }}
          >
            <div
              className="absolute -top-6 -right-6 w-28 h-28 rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(255,77,0,0.1) 0%, transparent 70%)' }}
            />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2 text-brand-orange text-sm font-semibold">
                <TrendingDown size={16} />
                <span className="uppercase tracking-wider text-xs">Gastos em {monthNameShort}</span>
              </div>
              <div className="heading-display text-4xl text-brand-orange">{formatBRL(expense)}</div>
              {income > 0 && (
                <div className="mt-3 h-1.5 bg-bg-elevated rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, (expense / income) * 100)}%`,
                      background: expense > income
                        ? 'linear-gradient(90deg, #FF4D00, #CC3A00)'
                        : 'linear-gradient(90deg, #FF4D00, #F59E0B)',
                    }}
                  />
                </div>
              )}
              {expenseDiff !== null && expenseDiffPct !== null ? (
                <div className={`text-xs mt-2 ${expenseDiff <= 0 ? 'text-brand-green' : 'text-brand-red'}`}>
                  {expenseDiff <= 0 ? '↓ Gastou ' : '↑ Gastou '}
                  {expenseDiffPct}% {expenseDiff <= 0 ? 'menos' : 'mais'} que o mês passado
                </div>
              ) : (
                <div className="text-xs text-text-muted mt-2">
                  {expense > 0 ? `Média diária: ${formatBRL(dailyAvg)}` : 'Nenhum gasto registrado'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Insights Row ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Net balance */}
          <div
            className="rounded-2xl p-4 relative overflow-hidden"
            style={{
              background: net >= 0
                ? 'linear-gradient(135deg, rgba(0,255,136,0.07) 0%, rgba(13,24,41,0.98) 100%)'
                : 'linear-gradient(135deg, rgba(255,77,0,0.07) 0%, rgba(13,24,41,0.98) 100%)',
              border: net >= 0 ? '1px solid rgba(0,255,136,0.2)' : '1px solid rgba(255,77,0,0.2)',
            }}
          >
            <div
              className="absolute -top-4 -right-4 w-16 h-16 rounded-full pointer-events-none blur-xl"
              style={{ background: net >= 0 ? 'rgba(0,255,136,0.15)' : 'rgba(255,77,0,0.15)' }}
            />
            <div className="text-xs text-text-muted uppercase tracking-wider mb-2">Saldo do mês</div>
            <div className={`heading-display text-2xl ${net >= 0 ? 'text-brand-green' : 'text-brand-red'}`}>
              {net >= 0 ? '+' : ''}{formatBRL(net)}
            </div>
            <div className="text-xs text-text-muted mt-1">
              {net >= 0 ? '✅ No positivo' : '❌ No negativo'}
            </div>
          </div>

          {/* Savings rate */}
          <div
            className="rounded-2xl p-4 relative overflow-hidden"
            style={{
              background: savingsRate >= 20
                ? 'linear-gradient(135deg, rgba(0,255,136,0.07) 0%, rgba(13,24,41,0.98) 100%)'
                : savingsRate >= 0
                ? 'linear-gradient(135deg, rgba(245,200,66,0.07) 0%, rgba(13,24,41,0.98) 100%)'
                : 'linear-gradient(135deg, rgba(255,77,0,0.07) 0%, rgba(13,24,41,0.98) 100%)',
              border: savingsRate >= 20
                ? '1px solid rgba(0,255,136,0.2)'
                : savingsRate >= 0
                ? '1px solid rgba(245,200,66,0.2)'
                : '1px solid rgba(255,77,0,0.2)',
            }}
          >
            <div
              className="absolute -top-4 -right-4 w-16 h-16 rounded-full pointer-events-none blur-xl"
              style={{
                background:
                  savingsRate >= 20
                    ? 'rgba(0,255,136,0.12)'
                    : savingsRate >= 0
                    ? 'rgba(245,200,66,0.12)'
                    : 'rgba(255,77,0,0.12)',
              }}
            />
            <div className="flex items-center gap-1 mb-2">
              <PiggyBank size={11} className="text-text-muted" />
              <span className="text-xs text-text-muted uppercase tracking-wider">Poupança</span>
            </div>
            <div
              className={`heading-display text-2xl ${
                savingsRate >= 20 ? 'text-brand-green' : savingsRate >= 0 ? 'text-brand-gold' : 'text-brand-red'
              }`}
            >
              {savingsRate}%
            </div>
            <div className="text-xs text-text-muted mt-1">
              {savingsRate >= 30
                ? '🏆 Excelente'
                : savingsRate >= 20
                ? '✅ Bom'
                : savingsRate >= 0
                ? '⚠️ Melhorar'
                : '❌ Déficit'}
            </div>
          </div>

          {/* Daily average */}
          <div
            className="rounded-2xl p-4 relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(255,77,0,0.06) 0%, rgba(13,24,41,0.98) 100%)',
              border: '1px solid rgba(255,77,0,0.18)',
            }}
          >
            <div
              className="absolute -top-4 -right-4 w-16 h-16 rounded-full pointer-events-none blur-xl"
              style={{ background: 'rgba(255,77,0,0.08)' }}
            />
            <div className="text-xs text-text-muted uppercase tracking-wider mb-2">Média diária</div>
            <div className="heading-display text-2xl text-brand-orange">{formatBRL(dailyAvg)}</div>
            <div className="text-xs text-text-muted mt-1">
              Projeção: {formatBRL(projectedMonth)}
            </div>
          </div>

          {/* Month progress */}
          <div
            className="rounded-2xl p-4 relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(124,58,237,0.06) 0%, rgba(13,24,41,0.98) 100%)',
              border: '1px solid rgba(124,58,237,0.18)',
            }}
          >
            <div
              className="absolute -top-4 -right-4 w-16 h-16 rounded-full pointer-events-none blur-xl"
              style={{ background: 'rgba(124,58,237,0.08)' }}
            />
            <div className="text-xs text-text-muted uppercase tracking-wider mb-2">Mês em andamento</div>
            <div className="heading-display text-2xl text-brand-purple">{monthProgress}%</div>
            <div className="mt-2 h-1.5 bg-bg-elevated rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${monthProgress}%`,
                  background: 'linear-gradient(90deg, #7C3AED, #9F5AF7)',
                }}
              />
            </div>
            <div className="text-xs text-text-muted mt-1">{daysInMonth - dayOfMonth}d restantes</div>
          </div>
        </div>

        {/* ── Spending Chart ───────────────────────────────────────────── */}
        {categorySpend.length > 0 && (
          <section
            className="rounded-2xl p-6 relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(124,58,237,0.05) 0%, rgba(13,24,41,0.98) 100%)',
              border: '1px solid rgba(124,58,237,0.15)',
            }}
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-bold">Gastos por categoria</h2>
                <p className="text-xs text-text-muted mt-0.5">Este mês · top {categorySpend.length} categorias</p>
              </div>
              <span className="text-xs text-text-muted bg-bg-elevated px-3 py-1.5 rounded-full">
                {formatBRL(expense)} total
              </span>
            </div>

            <SpendingChart data={categorySpend} />

            {/* Category breakdown bars */}
            <div className="mt-5 space-y-3">
              {categorySpend.map((cat) => (
                <div key={cat.name} className="flex items-center gap-3">
                  <span className="text-lg w-7 text-center shrink-0">{cat.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium truncate">{cat.name}</span>
                      <span className="text-sm font-bold shrink-0 ml-2" style={{ color: cat.color }}>
                        {formatBRL(cat.amount)}
                      </span>
                    </div>
                    <div className="h-1.5 bg-bg-elevated rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${cat.pct}%`, backgroundColor: cat.color }}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-text-muted w-8 text-right shrink-0">{cat.pct}%</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Heavy analytics — streamed independently */}
        <Suspense fallback={<div className="h-56 rounded-2xl shimmer" />}>
          <FinanceMonthCalendar userId={user.id} />
        </Suspense>
        <Suspense fallback={<div className="h-48 rounded-2xl shimmer" />}>
          <CashFlowForecast userId={user.id} />
        </Suspense>
        <Suspense fallback={<div className="h-48 rounded-2xl shimmer" />}>
          <FinanceIncomeAnalysis userId={user.id} />
        </Suspense>
        <Suspense fallback={<div className="h-48 rounded-2xl shimmer" />}>
          <FinanceTrends userId={user.id} />
        </Suspense>
        <Suspense fallback={<div className="h-48 rounded-2xl shimmer" />}>
          <FinanceCategoryTrend userId={user.id} />
        </Suspense>
        <Suspense fallback={<div className="h-64 rounded-2xl shimmer" />}>
          <SpendingByCategory userId={user.id} />
        </Suspense>
        <Suspense fallback={<div className="h-40 rounded-2xl shimmer" />}>
          <NetWorthSummary userId={user.id} />
        </Suspense>
        <Suspense fallback={<div className="h-40 rounded-2xl shimmer" />}>
          <SavingsRateTracker userId={user.id} />
        </Suspense>
        <Suspense fallback={<div className="h-48 rounded-2xl shimmer" />}>
          <FinanceRecurringAnalysis userId={user.id} />
        </Suspense>
        <Suspense fallback={<div className="h-40 rounded-2xl shimmer" />}>
          <SpendingDowHeatmap userId={user.id} />
        </Suspense>
        <Suspense fallback={<div className="h-48 rounded-2xl shimmer" />}>
          <FinanceGoalsMilestones userId={user.id} />
        </Suspense>

        {/* ── Accounts ─────────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Suas Contas</h2>
            <Link
              href="/financas/contas"
              className="text-sm text-text-secondary hover:text-brand-orange flex items-center gap-1 transition-colors"
            >
              Ver todas <ArrowRight size={13} />
            </Link>
          </div>

          {accounts.length === 0 ? (
            <div
              className="rounded-2xl p-8 text-center relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(124,58,237,0.06) 0%, rgba(13,24,41,0.98) 100%)',
                border: '1px solid rgba(124,58,237,0.15)',
              }}
            >
              <div className="text-4xl mb-3">🏦</div>
              <p className="text-text-secondary mb-4">Você ainda não cadastrou nenhuma conta</p>
              <Link href="/financas/contas" className="btn-primary inline-block">
                Cadastrar conta
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {accounts.slice(0, 3).map((a) => (
                <div
                  key={a.id}
                  className="rounded-2xl p-5 relative overflow-hidden hover:scale-[1.01] transition-transform"
                  style={{
                    background: `linear-gradient(135deg, ${a.color}0D 0%, rgba(13,24,41,0.98) 100%)`,
                    border: `1px solid ${a.color}30`,
                  }}
                >
                  <div
                    className="absolute -top-4 -right-4 w-20 h-20 rounded-full pointer-events-none blur-xl"
                    style={{ backgroundColor: a.color, opacity: 0.1 }}
                  />
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                        style={{ backgroundColor: `${a.color}20`, color: a.color }}
                      >
                        {a.icon ?? accountTypeIcon(a.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-text-muted">{accountTypeLabel(a.type)}</div>
                        <div className="font-bold truncate">{a.name}</div>
                      </div>
                    </div>
                    <div
                      className={`heading-display text-2xl ${Number(a.current_balance) < 0 ? 'text-brand-red' : ''}`}
                      style={{ color: Number(a.current_balance) >= 0 ? a.color : undefined }}
                    >
                      {formatBRL(Number(a.current_balance))}
                    </div>
                  </div>
                </div>
              ))}
              {accounts.length > 3 && (
                <Link
                  href="/financas/contas"
                  className="rounded-2xl p-5 flex items-center justify-center text-text-muted hover:text-brand-orange transition-all gap-2"
                  style={{
                    background: 'rgba(255,77,0,0.04)',
                    border: '1px dashed rgba(255,77,0,0.25)',
                  }}
                >
                  <Plus size={16} />
                  <span>{accounts.length - 3} conta{accounts.length - 3 !== 1 ? 's' : ''} a mais</span>
                </Link>
              )}
            </div>
          )}
        </section>

        {/* ── Upcoming bills ───────────────────────────────────────────── */}
        {upcomingTxRes.data && upcomingTxRes.data.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle size={18} className="text-brand-red" />
              <h2 className="text-xl font-bold">Próximos vencimentos</h2>
              <span className="ml-auto text-xs bg-brand-red/15 text-brand-red px-2 py-1 rounded-full font-semibold">
                {upcomingTxRes.data.length} pendente{upcomingTxRes.data.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="space-y-2">
              {upcomingTxRes.data.map((tx) => {
                const daysUntil = Math.ceil(
                  (new Date(tx.transaction_date).getTime() - Date.now()) / 86400000,
                )
                const isUrgent = daysUntil <= 3
                return (
                  <div
                    key={tx.id}
                    className="rounded-xl p-4 flex items-center justify-between transition-all"
                    style={{
                      background: isUrgent
                        ? 'linear-gradient(135deg, rgba(255,77,0,0.08) 0%, rgba(13,24,41,0.98) 100%)'
                        : 'rgba(13,24,41,0.6)',
                      border: `1px solid ${isUrgent ? 'rgba(255,77,0,0.3)' : 'rgba(255,255,255,0.06)'}`,
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold shrink-0"
                        style={{
                          background: isUrgent ? 'rgba(255,77,0,0.15)' : 'rgba(255,255,255,0.05)',
                          color: isUrgent ? '#FF4D00' : '#8899BB',
                        }}
                      >
                        {daysUntil <= 0 ? '!' : daysUntil}
                      </div>
                      <div>
                        <div className="font-medium">{tx.description}</div>
                        <div className={`text-xs mt-0.5 ${isUrgent ? 'text-brand-red' : 'text-text-muted'}`}>
                          {daysUntil === 0
                            ? '⚠️ Vence hoje'
                            : daysUntil === 1
                            ? '⚠️ Vence amanhã'
                            : daysUntil < 0
                            ? '❌ Atrasado'
                            : `Vence em ${daysUntil} dias`}
                        </div>
                      </div>
                    </div>
                    <div className="text-brand-red font-bold shrink-0">{formatBRL(Number(tx.amount))}</div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* ── Recent transactions ──────────────────────────────────────── */}
        {recentTxRes.data && recentTxRes.data.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Últimas movimentações</h2>
              <Link
                href="/financas/transacoes"
                className="text-sm text-text-secondary hover:text-brand-orange flex items-center gap-1 transition-colors"
              >
                Ver todas <ArrowRight size={13} />
              </Link>
            </div>
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: 'rgba(13,24,41,0.8)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              {recentTxRes.data.map((tx, i) => {
                const cat = catMap.get(tx.category_id ?? '')
                const isLast = i === recentTxRes.data!.length - 1
                return (
                  <div
                    key={tx.id}
                    className={`flex items-center gap-3 px-4 py-3.5 hover:bg-white/[0.03] transition-colors ${
                      !isLast ? 'border-b border-white/5' : ''
                    }`}
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0"
                      style={{
                        background: tx.type === 'income' ? 'rgba(0,255,136,0.12)' : 'rgba(255,77,0,0.12)',
                      }}
                    >
                      {cat?.icon ?? (tx.type === 'income' ? '💰' : '💸')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{tx.description}</div>
                      <div className="text-xs text-text-muted flex items-center gap-2 mt-0.5">
                        {cat && <span style={{ color: cat.color }}>{cat.name}</span>}
                        {cat && <span>·</span>}
                        <span>{new Date(tx.transaction_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
                        {!tx.is_paid && (
                          <>
                            <span>·</span>
                            <span className="text-brand-red font-medium">Pendente</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div
                      className="font-bold shrink-0 text-sm"
                      style={{ color: tx.type === 'income' ? '#00FF88' : '#FF4D00' }}
                    >
                      {tx.type === 'income' ? '+' : '-'}{formatBRL(Number(tx.amount))}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* ── Quick links ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3">
          <Link
            href="/financas/contas"
            className="rounded-xl p-4 text-center transition-all hover:scale-[1.02]"
            style={{
              background: 'linear-gradient(135deg, rgba(245,200,66,0.08) 0%, rgba(13,24,41,0.95) 100%)',
              border: '1px solid rgba(245,200,66,0.2)',
            }}
          >
            <Building2 size={22} className="text-brand-gold mx-auto mb-2" />
            <div className="font-semibold text-sm">Contas</div>
          </Link>
          <Link
            href="/financas/metas"
            className="rounded-xl p-4 text-center transition-all hover:scale-[1.02]"
            style={{
              background: 'linear-gradient(135deg, rgba(0,255,136,0.08) 0%, rgba(13,24,41,0.95) 100%)',
              border: '1px solid rgba(0,255,136,0.2)',
            }}
          >
            <Target size={22} className="text-brand-green mx-auto mb-2" />
            <div className="font-semibold text-sm">Metas</div>
          </Link>
          <Link
            href="/financas/transacoes"
            className="rounded-xl p-4 text-center transition-all hover:scale-[1.02]"
            style={{
              background: 'linear-gradient(135deg, rgba(124,58,237,0.08) 0%, rgba(13,24,41,0.95) 100%)',
              border: '1px solid rgba(124,58,237,0.2)',
            }}
          >
            <BarChart3 size={22} className="text-brand-purple mx-auto mb-2" />
            <div className="font-semibold text-sm">Histórico</div>
          </Link>
        </div>
      </div>
    </AppShell>
  )
}
