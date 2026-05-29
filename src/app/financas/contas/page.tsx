import type { Metadata } from 'next'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components/layout/app-shell'
import { AccountsManager } from '@/components/financas/accounts-manager'
import { NetWorthSummary } from '@/components/financas/net-worth-summary'
import { SavingsRateTracker } from '@/components/financas/savings-rate-tracker'

export const metadata: Metadata = {
  title: 'Contas',
  description: 'Gerencie suas contas bancárias e cartões no Ascendia.',
}

export const dynamic = 'force-dynamic'

export default async function ContasPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: accounts } = await supabase
    .from('finance_accounts')
    .select(
      'id, user_id, name, type, icon, color, current_balance, credit_limit, closing_day, due_day, is_active, created_at',
    )
    .eq('user_id', user.id)
    .order('created_at')

  return (
    <AppShell>
      <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
        {/* Hero header */}
        <div
          className="rounded-2xl p-6 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(245,200,66,0.07) 0%, rgba(13,24,41,0.98) 60%, rgba(255,77,0,0.04) 100%)',
            border: '1px solid rgba(245,200,66,0.18)',
          }}
        >
          <div
            className="absolute -top-8 -right-8 w-40 h-40 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(245,200,66,0.1) 0%, transparent 70%)' }}
          />
          <div className="relative z-10">
            <h1 className="heading-display text-4xl md:text-5xl">Contas</h1>
            <p className="text-text-secondary mt-1">
              {accounts && accounts.length > 0
                ? `${accounts.filter((a) => a.is_active).length} conta${accounts.filter((a) => a.is_active).length !== 1 ? 's' : ''} ativa${accounts.filter((a) => a.is_active).length !== 1 ? 's' : ''}`
                : 'Seus bancos, cartões e carteiras.'}
            </p>
          </div>
        </div>

        <Suspense fallback={<div className="h-40 rounded-2xl shimmer" />}>
          <NetWorthSummary userId={user.id} />
        </Suspense>
        <Suspense fallback={<div className="h-40 rounded-2xl shimmer" />}>
          <SavingsRateTracker userId={user.id} />
        </Suspense>

        <AccountsManager initialAccounts={accounts ?? []} />
      </div>
    </AppShell>
  )
}
