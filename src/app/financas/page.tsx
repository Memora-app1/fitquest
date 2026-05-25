import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components/layout/app-shell'
import { formatBRL } from '@/lib/utils'
import Link from 'next/link'
import { Plus, TrendingUp, TrendingDown, Wallet, PiggyBank, AlertCircle, ArrowRight } from 'lucide-react'
import { SpendingChartLazy as SpendingChart } from '@/components/financas/spending-chart-lazy'

export const metadata: Metadata = {
  title: 'Finanças',
  description: 'Controle gastos, receitas e metas financeiras. Saiba exatamente onde seu dinheiro vai.',
}

export const dynamic = 'force-dynamic'

export default async function FinancasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const firstDay = `${year}-${String(month).padStart(2, '0')}-01`
  // Use last day of month correctly
  const lastDay = new Date(year, month, 0).toISOString().split('T')[0]!

  // Day of month progress
  const daysInMonth = new Date(year, month, 0).getDate()
  const dayOfMonth = now.getDate()
  const monthProgress = Math.round((dayOfMonth / daysInMonth) * 100)

  const [accountsRes, monthTxRes, recentTxRes, upcomingTxRes, catTxRes, catsRes, prevMonthTxRes] = await Promise.all([
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
    // Gastos por categoria no mês
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
    // Previous month for comparison
    supabase
      .from('transactions')
      .select('amount, type')
      .eq('user_id', user.id)
      .eq('type', 'expense')
      .eq('is_paid', true)
      .gte('transaction_date', `${month === 1 ? year - 1 : year}-${String(month === 1 ? 12 : month - 1).padStart(2, '0')}-01`)
      .lt('transaction_date', firstDay),
  ])

  const accounts = accountsRes.data ?? []
  const totalBalance = accounts.reduce((s, a) => s + Number(a.current_balance), 0)

  const monthTx = monthTxRes.data ?? []
  const income = monthTx.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
  const expense = monthTx.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
  const net = income - expense
  const savingsRate = income > 0 ? Math.round((net / income) * 100) : 0

  // Prev month comparison
  const prevExpense = (prevMonthTxRes.data ?? []).reduce((s, t) => s + Number(t.amount), 0)
  const expenseDiff = prevExpense > 0 ? expense - prevExpense : null

  // Daily average
  const dailyAvg = dayOfMonth > 0 ? expense / dayOfMonth : 0
  const projectedMonth = dailyAvg * daysInMonth

  // Agrupar gastos por categoria
  const catMap = new Map((catsRes.data ?? []).map((c) => [c.id, c]))
  const spendByCategory = new Map<string, number>()
  for (const tx of catTxRes.data ?? []) {
    if (!tx.category_id) continue
    spendByCategory.set(tx.category_id, (spendByCategory.get(tx.category_id) ?? 0) + Number(tx.amount))
  }
  const categorySpend = Array.from(spendByCategory.entries())
    .map(([id, amount]) => {
      const cat = catMap.get(id)
      return { name: cat?.name ?? 'Outro', icon: cat?.icon ?? '💸', amount, color: cat?.color ?? '#FF4D00' }
    })
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 6)

  const monthName = now.toLocaleDateString('pt-BR', { month: 'long' })

  return (
    <AppShell>
      <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="heading-display text-4xl">Finanças</h1>
            <p className="text-text-secondary">
              {monthName.charAt(0).toUpperCase() + monthName.slice(1)} · dia {dayOfMonth}/{daysInMonth}
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/financas/transacoes?new=1" className="btn-primary flex items-center gap-2">
              <Plus size={18} /> Transação
            </Link>
          </div>
        </div>

        {/* Main cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Balance */}
          <div className="card-glow p-6">
            <div className="text-text-secondary text-sm flex items-center gap-2 mb-2">
              <Wallet size={14} /> SALDO TOTAL
            </div>
            <div className="heading-display text-4xl">{formatBRL(totalBalance)}</div>
            <div className="text-xs text-text-muted mt-1">{accounts.length} conta{accounts.length !== 1 ? 's' : ''}</div>
          </div>

          {/* Income */}
          <div className="card p-6">
            <div className="text-text-secondary text-sm flex items-center gap-2 mb-2">
              <TrendingUp size={14} className="text-brand-green" /> RECEITAS EM {monthName.toUpperCase().slice(0, 3)}
            </div>
            <div className="heading-display text-3xl text-brand-green">{formatBRL(income)}</div>
            {income > 0 && (
              <div className="mt-2 h-1.5 bg-bg-elevated rounded-full overflow-hidden">
                <div className="h-full bg-brand-green" style={{ width: '100%' }} />
              </div>
            )}
          </div>

          {/* Expense */}
          <div className="card p-6">
            <div className="text-text-secondary text-sm flex items-center gap-2 mb-2">
              <TrendingDown size={14} className="text-brand-red" /> GASTOS EM {monthName.toUpperCase().slice(0, 3)}
            </div>
            <div className="heading-display text-3xl text-brand-red">{formatBRL(expense)}</div>
            {expenseDiff !== null && (
              <div className={`text-xs mt-1 ${expenseDiff <= 0 ? 'text-brand-green' : 'text-brand-red'}`}>
                {expenseDiff <= 0 ? '↓' : '↑'} {formatBRL(Math.abs(expenseDiff))} vs mês anterior
              </div>
            )}
            {income > 0 && (
              <div className="mt-2 h-1.5 bg-bg-elevated rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-red transition-all"
                  style={{ width: `${Math.min(100, (expense / income) * 100)}%` }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Financial insights row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Net balance */}
          <div className="card p-4">
            <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Saldo do mês</div>
            <div className={`heading-display text-2xl ${net >= 0 ? 'text-brand-green' : 'text-brand-red'}`}>
              {net >= 0 ? '+' : ''}{formatBRL(net)}
            </div>
          </div>

          {/* Savings rate */}
          <div className="card p-4">
            <div className="text-xs text-text-muted uppercase tracking-wider flex items-center gap-1 mb-1">
              <PiggyBank size={11} /> Taxa de poupança
            </div>
            <div className={`heading-display text-2xl ${savingsRate >= 20 ? 'text-brand-green' : savingsRate >= 0 ? 'text-brand-gold' : 'text-brand-red'}`}>
              {savingsRate}%
            </div>
            <div className="text-xs text-text-muted mt-1">
              {savingsRate >= 30 ? '🏆 Excelente' : savingsRate >= 20 ? '✅ Bom' : savingsRate >= 0 ? '⚠️ Melhorar' : '❌ Déficit'}
            </div>
          </div>

          {/* Daily average */}
          <div className="card p-4">
            <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Média diária</div>
            <div className="heading-display text-2xl text-brand-orange">{formatBRL(dailyAvg)}</div>
            <div className="text-xs text-text-muted mt-1">Projeção: {formatBRL(projectedMonth)}</div>
          </div>

          {/* Month progress */}
          <div className="card p-4">
            <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Mês em andamento</div>
            <div className="heading-display text-2xl">{monthProgress}%</div>
            <div className="mt-2 h-1.5 bg-bg-elevated rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-purple transition-all"
                style={{ width: `${monthProgress}%` }}
              />
            </div>
            <div className="text-xs text-text-muted mt-1">{daysInMonth - dayOfMonth}d restantes</div>
          </div>
        </div>

        {/* Spending chart */}
        {categorySpend.length > 0 && (
          <section className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Gastos por categoria</h2>
              <span className="text-xs text-text-muted">Este mês</span>
            </div>
            <SpendingChart data={categorySpend} />
          </section>
        )}

        {/* Contas */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold">Suas Contas</h2>
            <Link href="/financas/contas" className="text-sm text-text-secondary hover:text-brand-orange flex items-center gap-1">
              Ver todas <ArrowRight size={13} />
            </Link>
          </div>
          {accounts.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-text-secondary mb-3">Você ainda não cadastrou nenhuma conta</p>
              <Link href="/financas/contas" className="btn-primary inline-block">Cadastrar conta</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {accounts.slice(0, 3).map((a) => (
                <div key={a.id} className="card p-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0"
                      style={{ backgroundColor: `${a.color}20` }}
                    >
                      {a.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-text-muted capitalize">{a.type.replace('_', ' ')}</div>
                      <div className="font-bold truncate">{a.name}</div>
                    </div>
                  </div>
                  <div className={`text-2xl font-bold mt-3 ${Number(a.current_balance) < 0 ? 'text-brand-red' : ''}`}>
                    {formatBRL(Number(a.current_balance))}
                  </div>
                </div>
              ))}
              {accounts.length > 3 && (
                <Link href="/financas/contas" className="card p-4 flex items-center justify-center text-text-muted hover:text-brand-orange transition-colors border-dashed">
                  +{accounts.length - 3} contas →
                </Link>
              )}
            </div>
          )}
        </section>

        {/* Upcoming bills */}
        {upcomingTxRes.data && upcomingTxRes.data.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle size={18} className="text-brand-red" />
              <h2 className="text-xl font-bold">Próximos vencimentos</h2>
            </div>
            <div className="space-y-2">
              {upcomingTxRes.data.map((tx) => {
                const daysUntil = Math.ceil(
                  (new Date(tx.transaction_date).getTime() - Date.now()) / 86400000
                )
                return (
                  <div key={tx.id} className="card p-4 flex items-center justify-between">
                    <div>
                      <div className="font-medium">{tx.description}</div>
                      <div className={`text-xs mt-0.5 ${daysUntil <= 3 ? 'text-brand-red' : 'text-text-muted'}`}>
                        {daysUntil === 0 ? '⚠️ Vence hoje' : daysUntil === 1 ? '⚠️ Vence amanhã' : `${daysUntil} dias`}
                      </div>
                    </div>
                    <div className="text-brand-red font-bold">{formatBRL(Number(tx.amount))}</div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Recent transactions */}
        {recentTxRes.data && recentTxRes.data.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-bold">Últimas movimentações</h2>
              <Link href="/financas/transacoes" className="text-sm text-text-secondary hover:text-brand-orange flex items-center gap-1">
                Ver todas <ArrowRight size={13} />
              </Link>
            </div>
            <div className="space-y-2">
              {recentTxRes.data.map((tx) => {
                const cat = catMap.get(tx.category_id ?? '')
                return (
                  <div key={tx.id} className="card p-4 flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-base shrink-0 bg-bg-elevated"
                    >
                      {cat?.icon ?? (tx.type === 'income' ? '💰' : '💸')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{tx.description}</div>
                      <div className="text-xs text-text-muted flex items-center gap-2">
                        <span>{new Date(tx.transaction_date).toLocaleDateString('pt-BR')}</span>
                        {!tx.is_paid && <span className="text-brand-red">⚠ Pendente</span>}
                      </div>
                    </div>
                    <div className={`font-bold shrink-0 ${tx.type === 'income' ? 'text-brand-green' : 'text-brand-red'}`}>
                      {tx.type === 'income' ? '+' : '-'}{formatBRL(Number(tx.amount))}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Quick links */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Link href="/financas/contas" className="card p-4 hover:border-brand-orange/40 transition-all text-center">
            <div className="text-2xl mb-1">🏦</div>
            <div className="font-medium text-sm">Gerenciar Contas</div>
          </Link>
          <Link href="/financas/metas" className="card p-4 hover:border-brand-orange/40 transition-all text-center">
            <div className="text-2xl mb-1">🎯</div>
            <div className="font-medium text-sm">Metas Financeiras</div>
          </Link>
          <Link href="/financas/transacoes" className="card p-4 hover:border-brand-orange/40 transition-all text-center">
            <div className="text-2xl mb-1">📊</div>
            <div className="font-medium text-sm">Todas as Transações</div>
          </Link>
        </div>
      </div>
    </AppShell>
  )
}
