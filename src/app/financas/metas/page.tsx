import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components/layout/app-shell'
import { FinanceGoalsList } from '@/components/financas/finance-goals-list'

export const dynamic = 'force-dynamic'

export default async function MetasFinanceirasPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: goals } = await supabase
    .from('finance_goals')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <AppShell>
      <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="heading-display text-4xl">Metas Financeiras</h1>
          <p className="text-text-secondary">Onde você quer chegar com seu dinheiro.</p>
        </div>

        <FinanceGoalsList initialGoals={goals ?? []} />
      </div>
    </AppShell>
  )
}
