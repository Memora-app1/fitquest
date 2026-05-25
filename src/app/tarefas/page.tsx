import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components/layout/app-shell'
import { KanbanBoard } from '@/components/tarefas/kanban-board'
import Link from 'next/link'
import { CheckSquare, Clock, AlertCircle, Zap, LayoutGrid } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Tarefas',
  description: 'Organize suas tarefas com Kanban e Matriz Eisenhower. Foque no que importa.',
}

export const dynamic = 'force-dynamic'

export default async function TarefasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString()
  const today = new Date().toISOString().split('T')[0]!

  const [tasksRes, doneWeekRes, xpWeekRes] = await Promise.all([
    supabase
      .from('tasks')
      .select('id, user_id, list_id, title, description, status, display_order, urgent, important, due_date, reminder_at, estimated_minutes, completed_at, google_event_id, recurrence_rule, parent_task_id, xp_reward, created_at, updated_at')
      .eq('user_id', user.id)
      .not('status', 'eq', 'archived')
      .order('display_order')
      .order('created_at', { ascending: false }),
    supabase
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'done')
      .gte('completed_at', sevenDaysAgo),
    supabase
      .from('xp_transactions')
      .select('amount')
      .eq('user_id', user.id)
      .eq('source_type', 'task')
      .gte('created_at', sevenDaysAgo),
  ])

  const tasks = tasksRes.data ?? []
  const doneThisWeek = doneWeekRes.count ?? 0
  const xpFromTasksWeek = (xpWeekRes.data ?? []).reduce((sum, t) => sum + (t.amount ?? 0), 0)

  const todo = tasks.filter((t) => t.status === 'todo').length
  const doing = tasks.filter((t) => t.status === 'doing').length
  const criticalTasks = tasks.filter((t) => t.urgent && t.important && t.status !== 'done').length
  const overdue = tasks.filter((t) => {
    if (!t.due_date || t.status === 'done') return false
    return new Date(t.due_date).toISOString().split('T')[0]! < today
  }).length

  return (
    <AppShell>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="heading-display text-4xl">Tarefas</h1>
            <p className="text-text-secondary">
              {todo + doing > 0
                ? `${doing} em andamento · ${todo} a fazer`
                : 'Tudo feito — você é imparável.'}
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/tarefas"
              className="btn-ghost text-sm bg-brand-orange/20 text-brand-orange border-brand-orange/40 flex items-center gap-1.5"
            >
              <LayoutGrid size={14} /> Kanban
            </Link>
            <Link href="/tarefas/eisenhower" className="btn-ghost text-sm flex items-center gap-1.5">
              🎯 Eisenhower
            </Link>
          </div>
        </div>

        {/* Stats */}
        {tasks.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-1">
                <CheckSquare size={14} className="text-brand-green" />
                <span className="text-xs text-text-muted uppercase">Concluídas (7d)</span>
              </div>
              <div className="heading-display text-3xl text-brand-green">{doneThisWeek}</div>
            </div>

            <div className="card p-4">
              <div className="flex items-center gap-2 mb-1">
                <Zap size={14} className="text-brand-gold" />
                <span className="text-xs text-text-muted uppercase">XP (7d)</span>
              </div>
              <div className="heading-display text-3xl text-brand-gold">
                +{xpFromTasksWeek.toLocaleString('pt-BR')}
              </div>
            </div>

            <div className="card p-4">
              <div className="flex items-center gap-2 mb-1">
                <Clock size={14} className="text-brand-purple" />
                <span className="text-xs text-text-muted uppercase">Em andamento</span>
              </div>
              <div className="heading-display text-3xl text-brand-purple">{doing}</div>
              <div className="text-xs text-text-secondary mt-0.5">{todo} a fazer</div>
            </div>

            <div className="card p-4">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle size={14} className={overdue > 0 ? 'text-brand-red' : criticalTasks > 0 ? 'text-brand-red' : 'text-text-muted'} />
                <span className="text-xs text-text-muted uppercase">
                  {overdue > 0 ? 'Atrasadas' : 'Críticas'}
                </span>
              </div>
              <div className={`heading-display text-3xl ${overdue > 0 || criticalTasks > 0 ? 'text-brand-red' : 'text-brand-green'}`}>
                {overdue > 0 ? overdue : criticalTasks}
              </div>
              <div className="text-xs text-text-secondary mt-0.5">
                {overdue > 0 ? 'com prazo vencido' : criticalTasks > 0 ? 'urgente + importante' : 'nenhuma crítica'}
              </div>
            </div>
          </div>
        )}

        <KanbanBoard initialTasks={tasks} />
      </div>
    </AppShell>
  )
}
