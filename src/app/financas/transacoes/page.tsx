import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components/layout/app-shell'
import { TransactionsView } from '@/components/financas/transactions-view'

export const dynamic = 'force-dynamic'

export default async function TransacoesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [txRes, accRes, catRes] = await Promise.all([
    supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('transaction_date', { ascending: false })
      .limit(100),
    supabase
      .from('finance_accounts')
      .select('id, name, icon, color')
      .eq('user_id', user.id)
      .eq('is_active', true),
    supabase
      .from('finance_categories')
      .select('id, name, icon, color, type, is_global')
      .or(`user_id.eq.${user.id},is_global.eq.true`),
  ])

  return (
    <AppShell>
      <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="heading-display text-4xl">Transações</h1>
          <p className="text-text-secondary">Todas as suas movimentações em um só lugar.</p>
        </div>

        <TransactionsView
          transactions={txRes.data ?? []}
          accounts={accRes.data ?? []}
          categories={catRes.data ?? []}
        />
      </div>
    </AppShell>
  )
}
