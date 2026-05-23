import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components/layout/app-shell'
import { AccountsManager } from '@/components/financas/accounts-manager'

export const dynamic = 'force-dynamic'

export default async function ContasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: accounts } = await supabase
    .from('finance_accounts')
    .select('id, user_id, name, type, icon, color, current_balance, credit_limit, closing_day, due_day, is_active, created_at')
    .eq('user_id', user.id)
    .order('created_at')

  return (
    <AppShell>
      <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="heading-display text-4xl">Contas</h1>
          <p className="text-text-secondary">Seus bancos, cartões e carteiras.</p>
        </div>
        <AccountsManager initialAccounts={accounts ?? []} />
      </div>
    </AppShell>
  )
}
