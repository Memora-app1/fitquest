import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components/layout/app-shell'
import { KanbanBoard } from '@/components/tarefas/kanban-board'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Tarefas',
  description: 'Organize suas tarefas com Kanban e Matriz Eisenhower. Foque no que importa.',
}

export const dynamic = 'force-dynamic'

export default async function TarefasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: tasks } = await supabase
    .from('tasks')
    .select('id, user_id, list_id, title, description, status, display_order, urgent, important, due_date, reminder_at, estimated_minutes, completed_at, google_event_id, recurrence_rule, parent_task_id, xp_reward, created_at, updated_at')
    .eq('user_id', user.id)
    .not('status', 'eq', 'archived')
    .order('display_order')
    .order('created_at', { ascending: false })

  return (
    <AppShell>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="heading-display text-4xl">Tarefas</h1>
            <p className="text-text-secondary">Arraste, organize, conquiste XP.</p>
          </div>
          <div className="flex gap-2">
            <Link href="/tarefas" className="btn-ghost text-sm bg-brand-orange/20 text-brand-orange">
              Kanban
            </Link>
            <Link href="/tarefas/eisenhower" className="btn-ghost text-sm">
              Eisenhower
            </Link>
          </div>
        </div>

        <KanbanBoard initialTasks={tasks ?? []} />
      </div>
    </AppShell>
  )
}
