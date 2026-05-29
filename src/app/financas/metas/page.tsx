import type { Metadata } from 'next'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components/layout/app-shell'
import { FinanceGoalsList } from '@/components/financas/finance-goals-list'
import { FinanceGoalsOverview } from '@/components/financas/finance-goals-overview'
import { FinanceGoalsMilestones } from '@/components/financas/finance-goals-milestones'
import { Target, TrendingUp, CheckCircle2, DollarSign } from 'lucide-react'
import { formatBRL } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Metas Financeiras',
  description: 'Defina e acompanhe suas metas financeiras no Ascendia.',
}

export const dynamic = 'force-dynamic'

export default async function MetasFinanceirasPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: goals } = await supabase
    .from('finance_goals')
    .select('id, user_id, title, icon, color, target_amount, current_amount, deadline, monthly_target, status, completed_at, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const allGoals = goals ?? []
  const activeGoals = allGoals.filter((g) => g.status === 'active')
  const completedGoals = allGoals.filter((g) => g.status === 'completed')

  const totalTarget = activeGoals.reduce((s, g) => s + Number(g.target_amount), 0)
  const totalSaved = activeGoals.reduce((s, g) => s + Number(g.current_amount), 0)
  const overallPct = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0

  return (
    <AppShell>
      <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">

        {/* ── Hero Header ─────────────────────────────────────────────── */}
        <div
          className="rounded-2xl p-6 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(245,200,66,0.08) 0%, rgba(13,24,41,0.98) 60%, rgba(0,255,136,0.05) 100%)',
            border: '1px solid rgba(245,200,66,0.2)',
          }}
        >
          <div
            className="absolute -top-8 -right-8 w-40 h-40 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(245,200,66,0.12) 0%, transparent 70%)' }}
          />
          <div className="relative z-10">
            <h1 className="heading-display text-4xl md:text-5xl">Metas Financeiras</h1>
            <p className="text-text-secondary mt-1">
              {activeGoals.length > 0
                ? `${activeGoals.length} meta${activeGoals.length !== 1 ? 's' : ''} ativa${activeGoals.length !== 1 ? 's' : ''} · ${overallPct}% do total guardado`
                : 'Onde você quer chegar com seu dinheiro.'}
            </p>
          </div>
        </div>

        {/* ── Stats ───────────────────────────────────────────────────── */}
        {allGoals.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

            {/* Ativas */}
            <div
              className="rounded-2xl p-4 relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(255,77,0,0.08) 0%, rgba(13,24,41,0.98) 100%)',
                border: '1px solid rgba(255,77,0,0.2)',
              }}
            >
              <div
                className="absolute -top-4 -right-4 w-14 h-14 rounded-full pointer-events-none blur-xl"
                style={{ background: 'rgba(255,77,0,0.2)' }}
              />
              <div className="relative z-10">
                <div className="flex items-center gap-1.5 mb-2">
                  <Target size={13} className="text-brand-orange" />
                  <span className="text-xs text-text-muted uppercase tracking-wider">Ativas</span>
                </div>
                <div className="heading-display text-3xl text-brand-orange">{activeGoals.length}</div>
              </div>
            </div>

            {/* Concluídas */}
            <div
              className="rounded-2xl p-4 relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(0,255,136,0.08) 0%, rgba(13,24,41,0.98) 100%)',
                border: '1px solid rgba(0,255,136,0.2)',
              }}
            >
              <div
                className="absolute -top-4 -right-4 w-14 h-14 rounded-full pointer-events-none blur-xl"
                style={{ background: 'rgba(0,255,136,0.2)' }}
              />
              <div className="relative z-10">
                <div className="flex items-center gap-1.5 mb-2">
                  <CheckCircle2 size={13} className="text-brand-green" />
                  <span className="text-xs text-text-muted uppercase tracking-wider">Concluídas</span>
                </div>
                <div className="heading-display text-3xl text-brand-green">{completedGoals.length}</div>
              </div>
            </div>

            {/* Total guardado */}
            <div
              className="rounded-2xl p-4 relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(124,58,237,0.08) 0%, rgba(13,24,41,0.98) 100%)',
                border: '1px solid rgba(124,58,237,0.2)',
              }}
            >
              <div
                className="absolute -top-4 -right-4 w-14 h-14 rounded-full pointer-events-none blur-xl"
                style={{ background: 'rgba(124,58,237,0.2)' }}
              />
              <div className="relative z-10">
                <div className="flex items-center gap-1.5 mb-2">
                  <DollarSign size={13} className="text-brand-purple" />
                  <span className="text-xs text-text-muted uppercase tracking-wider">Guardado</span>
                </div>
                <div className="heading-display text-2xl text-brand-purple">
                  {totalSaved >= 1000
                    ? `R$${(totalSaved / 1000).toFixed(1)}k`
                    : formatBRL(totalSaved)}
                </div>
              </div>
            </div>

            {/* Progresso geral */}
            <div
              className="rounded-2xl p-4 relative overflow-hidden"
              style={{
                background:
                  overallPct >= 75
                    ? 'linear-gradient(135deg, rgba(245,200,66,0.1) 0%, rgba(13,24,41,0.98) 100%)'
                    : 'linear-gradient(135deg, rgba(245,200,66,0.06) 0%, rgba(13,24,41,0.98) 100%)',
                border: '1px solid rgba(245,200,66,0.2)',
              }}
            >
              <div
                className="absolute -top-4 -right-4 w-14 h-14 rounded-full pointer-events-none blur-xl"
                style={{ background: 'rgba(245,200,66,0.2)' }}
              />
              <div className="relative z-10">
                <div className="flex items-center gap-1.5 mb-2">
                  <TrendingUp size={13} className="text-brand-gold" />
                  <span className="text-xs text-text-muted uppercase tracking-wider">Progresso</span>
                </div>
                <div className="heading-display text-3xl text-brand-gold">{overallPct}%</div>
                <div className="mt-1.5 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.min(100, overallPct)}%`,
                      background: overallPct >= 75
                        ? 'linear-gradient(90deg, #F5C842, #00FF88)'
                        : 'linear-gradient(90deg, #F5C842, #FF9500)',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <Suspense fallback={<div className="h-48 rounded-2xl shimmer" />}>
          <FinanceGoalsOverview userId={user.id} />
        </Suspense>
        <Suspense fallback={<div className="h-48 rounded-2xl shimmer" />}>
          <FinanceGoalsMilestones userId={user.id} />
        </Suspense>

        <FinanceGoalsList initialGoals={allGoals} />
      </div>
    </AppShell>
  )
}
