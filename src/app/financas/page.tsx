import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components/layout/app-shell'
import { formatBRL } from '@/lib/utils'
import Link from 'next/link'
import { Plus, TrendingUp, TrendingDown, Wallet } from 'lucide-react'
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
  const firstDay = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const lastDay = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-31`

  const [accountsRes, monthTxRes, recentTxRes, upcomingTxRes, catTxRes, catsRes] = await Promise.all([
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
      .select('id, description, amount, type, transaction_date')
      .eq('user_id', user.id)
      .order('transaction_date', { ascending: false })
      .limit(5),
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
  ])

  const accounts = accountsRes.data ?? []
  const totalBalance = accounts.reduce((s, a) => s + Number(a.current_balance), 0)

  const monthTx = monthTxRes.data ?? []
  const income = monthTx.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
  const expense = monthTx.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
  const net = income - expense

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

  return (
    <AppShell>
      <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="heading-display text-4xl">Finanças</h1>
            <p className="text-text-secondary">Controle total, de verdade.</p>
          </div>
          <div className="flex gap-2">
            <Link href="/financas/transacoes?new=1" className="btn-primary">
              <Plus size={18} className="inline mr-1" /> Transação
            </Link>
          </div>
        </div>

        {/* Cards principais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card-glow p-6">
            <div className="text-text-secondary text-sm flex items-center gap-2 mb-2">
              <Wallet size={14} /> SALDO TOTAL
            </div>
            <div className="heading-display text-4xl">{formatBRL(totalBalance)}</div>
            <div className="text-xs text-text-muted mt-1">{accounts.length} contas</div>
          </div>

          <div className="card p-6">
            <div className="text-text-secondary text-sm flex items-center gap-2 mb-2">
              <TrendingUp size={14} className="text-brand-green" /> RECEITAS DO MÊS
            </div>
            <div className="heading-display text-3xl text-brand-green">{formatBRL(income)}</div>
          </div>

          <div className="card p-6">
            <div className="text-text-secondary text-sm flex items-center gap-2 mb-2">
              <TrendingDown size={14} className="text-brand-red" /> GASTOS DO MÊS
            </div>
            <div className="heading-display text-3xl text-brand-red">{formatBRL(expense)}</div>
            <div className={`text-xs mt-1 ${net >= 0 ? 'text-brand-green' : 'text-brand-red'}`}>
              Saldo do mês: {formatBRL(net)}
            </div>
          </div>
        </div>

        {/* Gastos por categoria */}
        <section className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Gastos por categoria</h2>
            <span className="text-xs text-text-muted">Este mês</span>
          </div>
          <SpendingChart data={categorySpend} />
        </section>

        {/* Contas */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold">Suas Contas</h2>
            <Link href="/financas/contas" className="text-sm text-text-secondary hover:text-brand-orange">
              Ver todas →
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
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                      style={{ backgroundColor: `${a.color}20` }}
                    >
                      {a.icon}
                    </div>
                    <div className="flex-1">
                      <div className="text-xs text-text-muted">{a.type}</div>
                      <div className="font-bold">{a.name}</div>
                    </div>
                  </div>
                  <div className="text-2xl font-bold mt-3">{formatBRL(Number(a.current_balance))}</div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Próximos vencimentos */}
        {upcomingTxRes.data && upcomingTxRes.data.length > 0 && (
          <section>
            <h2 className="text-xl font-bold mb-3">Próximos vencimentos</h2>
            <div className="space-y-2">
              {upcomingTxRes.data.map((tx) => (
                <div key={tx.id} className="card p-4 flex items-center justify-between">
                  <div>
                    <div className="font-medium">{tx.description}</div>
                    <div className="text-xs text-text-muted">
                      Vence em {new Date(tx.transaction_date).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                  <div className="text-brand-red font-bold">{formatBRL(Number(tx.amount))}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Últimas transações */}
        {recentTxRes.data && recentTxRes.data.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-bold">Últimas movimentações</h2>
              <Link href="/financas/transacoes" className="text-sm text-text-secondary hover:text-brand-orange">
                Ver todas →
              </Link>
            </div>
            <div className="space-y-2">
              {recentTxRes.data.map((tx) => (
                <div key={tx.id} className="card p-4 flex items-center justify-between">
                  <div>
                    <div className="font-medium">{tx.description}</div>
                    <div className="text-xs text-text-muted">
                      {new Date(tx.transaction_date).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                  <div className={`font-bold ${tx.type === 'income' ? 'text-brand-green' : 'text-brand-red'}`}>
                    {tx.type === 'income' ? '+' : '-'}{formatBRL(Number(tx.amount))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </AppShell>
  )
}
