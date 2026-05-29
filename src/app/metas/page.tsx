import type { Metadata } from 'next'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components/layout/app-shell'
import { GoalsList } from '@/components/metas/goals-list'
import { GoalsOverview } from '@/components/metas/goals-overview'
import { Target, CheckCircle2, TrendingUp } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Metas',
  description: 'Defina e acompanhe suas metas pessoais no Ascendia.',
}

export const dynamic = 'force-dynamic'

export default async function MetasPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: goals } = await supabase
    .from('goals')
    .select(
      'id, title, description, icon, category, target_value, current_value, unit, deadline, status, completed_at, created_at',
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const activeCount = (goals ?? []).filter((g) => g.status === 'active').length
  const completedCount = (goals ?? []).filter((g) => g.status === 'completed').length
  const validGoals = (goals ?? []).filter((g) => g.status !== 'cancelled')
  const avgProgress =
    validGoals.length > 0
      ? Math.round(
          validGoals.reduce(
            (sum, g) => sum + Math.min(100, (g.current_value / g.target_value) * 100),
            0,
          ) / validGoals.length,
        )
      : 0

  return (
    <AppShell>
      <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">

        {/* ── Hero Header ─────────────────────────────────────────────── */}
        <div
          className="rounded-2xl p-6 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(0,255,136,0.07) 0%, rgba(13,24,41,0.98) 60%, rgba(245,200,66,0.05) 100%)',
            border: '1px solid rgba(0,255,136,0.18)',
          }}
        >
          <div
            className="absolute -top-8 -right-8 w-40 h-40 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(0,255,136,0.1) 0%, transparent 70%)' }}
          />
          <div className="relative z-10">
            <h1 className="heading-display text-4xl md:text-5xl">Metas</h1>
            <p className="text-text-secondary mt-1">
              {activeCount > 0
                ? `${activeCount} meta${activeCount > 1 ? 's' : ''} ativa${activeCount > 1 ? 's' : ''} · ${completedCount} concluída${completedCount !== 1 ? 's' : ''}`
                : 'Defina onde quer chegar e acompanhe seu progresso.'}
            </p>
          </div>
        </div>

        {/* ── Stats ───────────────────────────────────────────────────── */}
        {(goals ?? []).length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {/* Active */}
            <div
              className="rounded-2xl p-4 relative overflow-hidden text-center"
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
                <div className="flex items-center justify-center gap-1.5 mb-1.5">
                  <Target size={13} className="text-brand-orange" />
                  <span className="text-xs text-text-muted uppercase tracking-wider">Ativas</span>
                </div>
                <div className="heading-display text-3xl text-brand-orange">{activeCount}</div>
              </div>
            </div>

            {/* Completed */}
            <div
              className="rounded-2xl p-4 relative overflow-hidden text-center"
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
                <div className="flex items-center justify-center gap-1.5 mb-1.5">
                  <CheckCircle2 size={13} className="text-brand-green" />
                  <span className="text-xs text-text-muted uppercase tracking-wider">Concluídas</span>
                </div>
                <div className="heading-display text-3xl text-brand-green">{completedCount}</div>
              </div>
            </div>

            {/* Average progress */}
            <div
              className="rounded-2xl p-4 relative overflow-hidden text-center"
              style={{
                background:
                  avgProgress >= 75
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
                <div className="flex items-center justify-center gap-1.5 mb-1.5">
                  <TrendingUp size={13} className="text-brand-gold" />
                  <span className="text-xs text-text-muted uppercase tracking-wider">Progresso</span>
                </div>
                <div className="heading-display text-3xl text-brand-gold">{avgProgress}%</div>
              </div>
            </div>
          </div>
        )}

        {/* ── Goals analytics overview ─────────────────────────────────── */}
        <Suspense fallback={<div className="h-48 rounded-2xl shimmer" />}>
          <GoalsOverview userId={user.id} />
        </Suspense>

        <GoalsList initialGoals={goals ?? []} />
      </div>
    </AppShell>
  )
}
