import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components/layout/app-shell'
import Link from 'next/link'
import { EisenhowerBoard } from '@/components/tarefas/eisenhower-board'

export const metadata: Metadata = {
  title: 'Matriz Eisenhower',
  description: 'Priorize suas tarefas pela Matriz Eisenhower — urgente vs importante.',
}

export const dynamic = 'force-dynamic'

export default async function EisenhowerPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: tasks } = await supabase
    .from('tasks')
    .select('id, title, urgent, important, status, xp_reward, due_date')
    .eq('user_id', user.id)
    .not('status', 'eq', 'archived')
    .order('created_at', { ascending: false })

  const activeTasks = (tasks ?? []).filter((t) => t.status !== 'done')
  const doneTasks = (tasks ?? []).filter((t) => t.status === 'done')

  // Stats por quadrante
  const urgentImportant = activeTasks.filter((t) => t.urgent && t.important).length
  const importantOnly = activeTasks.filter((t) => !t.urgent && t.important).length
  const urgentOnly = activeTasks.filter((t) => t.urgent && !t.important).length
  const neither = activeTasks.filter((t) => !t.urgent && !t.important).length

  return (
    <AppShell>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="heading-display text-4xl">Matriz Eisenhower</h1>
            <p className="text-text-secondary">Separe o urgente do que realmente importa.</p>
          </div>
          <div className="flex gap-2">
            <Link href="/tarefas" className="btn-ghost text-sm">
              Kanban
            </Link>
            <Link
              href="/tarefas/eisenhower"
              className="btn-ghost text-sm bg-brand-orange/20 text-brand-orange"
            >
              Eisenhower
            </Link>
          </div>
        </div>

        {/* Stats row */}
        {activeTasks.length > 0 && (
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="card p-3">
              <div className="heading-display text-2xl text-brand-red">{urgentImportant}</div>
              <div className="text-[10px] text-text-muted uppercase mt-0.5">Fazer agora</div>
            </div>
            <div className="card p-3">
              <div className="heading-display text-2xl text-brand-green">{importantOnly}</div>
              <div className="text-[10px] text-text-muted uppercase mt-0.5">Agendar</div>
            </div>
            <div className="card p-3">
              <div className="heading-display text-2xl text-brand-gold">{urgentOnly}</div>
              <div className="text-[10px] text-text-muted uppercase mt-0.5">Delegar</div>
            </div>
            <div className="card p-3">
              <div className="heading-display text-2xl text-text-muted">{neither}</div>
              <div className="text-[10px] text-text-muted uppercase mt-0.5">Eliminar</div>
            </div>
          </div>
        )}

        {/* Interactive board */}
        <EisenhowerBoard initialTasks={[...activeTasks, ...doneTasks]} />
      </div>
    </AppShell>
  )
}
