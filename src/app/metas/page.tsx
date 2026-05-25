import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components/layout/app-shell'
import { GoalsList } from '@/components/metas/goals-list'

export const metadata: Metadata = {
  title: 'Metas',
  description: 'Defina e acompanhe suas metas pessoais no FitQuest.',
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
    .select('id, title, description, icon, category, target_value, current_value, unit, deadline, status, completed_at, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const activeCount = (goals ?? []).filter((g) => g.status === 'active').length
  const completedCount = (goals ?? []).filter((g) => g.status === 'completed').length

  return (
    <AppShell>
      <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="heading-display text-4xl">Metas</h1>
            <p className="text-text-secondary">
              {activeCount > 0
                ? `${activeCount} meta${activeCount > 1 ? 's' : ''} ativa${activeCount > 1 ? 's' : ''} · ${completedCount} concluída${completedCount !== 1 ? 's' : ''}`
                : 'Defina onde quer chegar e acompanhe seu progresso.'}
            </p>
          </div>
        </div>

        {/* Stats cards */}
        {(goals ?? []).length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            <div className="card p-4 text-center">
              <div className="heading-display text-3xl text-brand-orange">{activeCount}</div>
              <div className="text-xs text-text-muted uppercase mt-1">Ativas</div>
            </div>
            <div className="card p-4 text-center">
              <div className="heading-display text-3xl text-brand-green">{completedCount}</div>
              <div className="text-xs text-text-muted uppercase mt-1">Concluídas</div>
            </div>
            <div className="card p-4 text-center">
              <div className="heading-display text-3xl text-brand-gold">
                {(goals ?? []).length > 0
                  ? Math.round(
                      ((goals ?? [])
                        .filter((g) => g.status !== 'cancelled')
                        .reduce((sum, g) => sum + Math.min(100, (g.current_value / g.target_value) * 100), 0)) /
                        Math.max(1, (goals ?? []).filter((g) => g.status !== 'cancelled').length)
                    )
                  : 0}
                %
              </div>
              <div className="text-xs text-text-muted uppercase mt-1">Progresso médio</div>
            </div>
          </div>
        )}

        {/* Goals list */}
        <GoalsList initialGoals={goals ?? []} />
      </div>
    </AppShell>
  )
}
