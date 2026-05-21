import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components/layout/app-shell'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

const QUADRANTS = [
  {
    id: 'do',
    title: 'FAZER AGORA',
    subtitle: 'Urgente + Importante',
    urgent: true,
    important: true,
    color: 'border-brand-red',
    bg: 'bg-brand-red/5',
    text: 'text-brand-red',
  },
  {
    id: 'schedule',
    title: 'AGENDAR',
    subtitle: 'Importante, não urgente',
    urgent: false,
    important: true,
    color: 'border-brand-green',
    bg: 'bg-brand-green/5',
    text: 'text-brand-green',
  },
  {
    id: 'delegate',
    title: 'DELEGAR',
    subtitle: 'Urgente, não importante',
    urgent: true,
    important: false,
    color: 'border-brand-gold',
    bg: 'bg-brand-gold/5',
    text: 'text-brand-gold',
  },
  {
    id: 'eliminate',
    title: 'ELIMINAR',
    subtitle: 'Nem urgente nem importante',
    urgent: false,
    important: false,
    color: 'border-text-muted',
    bg: 'bg-bg-elevated',
    text: 'text-text-muted',
  },
] as const

export default async function EisenhowerPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: tasks } = await supabase
    .from('tasks')
    .select('id, title, urgent, important, status, xp_reward')
    .eq('user_id', user.id)
    .not('status', 'eq', 'done')
    .not('status', 'eq', 'archived')

  function getTasksFor(urgent: boolean, important: boolean) {
    return (tasks ?? []).filter((t) => t.urgent === urgent && t.important === important)
  }

  return (
    <AppShell>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="heading-display text-4xl">Matriz Eisenhower</h1>
            <p className="text-text-secondary">Separe o urgente do que realmente importa.</p>
          </div>
          <div className="flex gap-2">
            <Link href="/tarefas" className="btn-ghost text-sm">Kanban</Link>
            <Link href="/tarefas/eisenhower" className="btn-ghost text-sm bg-brand-orange/20 text-brand-orange">
              Eisenhower
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {QUADRANTS.map((q) => {
            const qTasks = getTasksFor(q.urgent, q.important)
            return (
              <div key={q.id} className={cn('card p-5 border-t-4', q.color, q.bg)}>
                <div className="mb-4">
                  <div className={cn('font-bold text-lg', q.text)}>{q.title}</div>
                  <div className="text-xs text-text-muted">{q.subtitle}</div>
                  <div className="text-sm text-text-secondary mt-1">{qTasks.length} tarefas</div>
                </div>

                {qTasks.length === 0 ? (
                  <div className="text-text-muted text-sm text-center py-8">Vazio</div>
                ) : (
                  <div className="space-y-2">
                    {qTasks.map((t) => (
                      <div key={t.id} className="p-3 bg-bg-card border border-border rounded-xl">
                        <div className="font-medium">{t.title}</div>
                        <div className="text-xs text-brand-gold mt-1">+{t.xp_reward} XP</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="card p-4 text-sm text-text-secondary">
          💡 <strong className="text-white">Como usar:</strong> classifique cada tarefa como urgente
          (precisa ser feita agora) ou importante (alinhada com seus objetivos). Foque no quadrante
          verde — é onde sua vida muda.
        </div>
      </div>
    </AppShell>
  )
}
