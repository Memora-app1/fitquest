import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components/layout/app-shell'
import Link from 'next/link'
import { formatRelativeDate } from '@/lib/utils'
import { Plus, Dumbbell } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function TreinosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: workouts } = await supabase
    .from('workouts')
    .select('id, title, started_at, finished_at, total_volume_kg, total_sets, xp_earned, is_personal_record_session')
    .eq('user_id', user.id)
    .order('started_at', { ascending: false })
    .limit(30)

  return (
    <AppShell>
      <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="heading-display text-4xl">Treinos</h1>
            <p className="text-text-secondary">Volume é progresso. Progresso é XP.</p>
          </div>
          <Link href="/treinos/novo" className="btn-primary">
            <Plus size={18} className="inline mr-1" /> Novo treino
          </Link>
        </div>

        {!workouts || workouts.length === 0 ? (
          <div className="card p-12 text-center">
            <Dumbbell size={48} className="mx-auto mb-4 text-text-muted" />
            <h3 className="text-xl font-bold mb-1">Nenhum treino ainda</h3>
            <p className="text-text-secondary mb-4">Comece registrando sua primeira sessão</p>
            <Link href="/treinos/novo" className="btn-primary inline-block">
              Começar treino
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {workouts.map((w) => (
              <Link
                key={w.id}
                href={`/treinos/${w.id}`}
                className="card p-4 block hover:border-brand-orange/40 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-lg">{w.title}</h3>
                    <div className="text-sm text-text-secondary">
                      {formatRelativeDate(w.started_at)}
                      {w.is_personal_record_session && (
                        <span className="ml-2 text-brand-gold">🏆 PR!</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-brand-gold font-bold">+{w.xp_earned} XP</div>
                  </div>
                </div>
                <div className="flex gap-4 mt-3 text-sm text-text-secondary">
                  <span>{w.total_sets} sets</span>
                  <span>{w.total_volume_kg}kg volume</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
