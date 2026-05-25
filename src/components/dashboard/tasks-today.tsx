'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Check, Trash2, Plus, AlertCircle, X, Clock, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useXpToast, XpToastContainer } from '@/components/xp-toast'

interface Task {
  id: string
  title: string
  urgent: boolean
  important: boolean
  due_date: string | null
}

function getPriorityBadge(urgent: boolean, important: boolean) {
  if (urgent && important)
    return { label: 'CRÍTICO', cls: 'bg-brand-red/20 text-brand-red border-brand-red/40' }
  if (important)
    return { label: 'IMPORTANTE', cls: 'bg-brand-green/20 text-brand-green border-brand-green/40' }
  if (urgent)
    return { label: 'URGENTE', cls: 'bg-brand-gold/20 text-brand-gold border-brand-gold/40' }
  return null
}

function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false
  return new Date(dueDate) < new Date()
}

function formatDueDate(dueDate: string): string {
  const d = new Date(dueDate)
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  if (d.toDateString() === today.toDateString()) return 'Hoje'
  if (d.toDateString() === tomorrow.toDateString()) return 'Amanhã'
  return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
}

export function TasksToday({ tasks: initialTasks }: { tasks: Task[] }) {
  const router = useRouter()
  const [items, setItems] = useState<Task[]>(initialTasks)
  const [completing, setCompleting] = useState<Set<string>>(new Set())
  const [showAdd, setShowAdd] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [addLoading, setAddLoading] = useState(false)
  const { toasts, showXp } = useXpToast()

  async function quickComplete(taskId: string) {
    if (completing.has(taskId)) return
    setCompleting((prev) => new Set(prev).add(taskId))
    try {
      const res = await fetch('/api/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: taskId, status: 'done' }),
      })
      const data = await res.json() as { xpEarned?: number; leveledUp?: boolean; newLevel?: number }
      if (res.ok) {
        setItems((prev) => prev.filter((t) => t.id !== taskId))
        showXp(data.xpEarned ?? 0, { leveledUp: data.leveledUp ? data.newLevel : undefined })
        router.refresh()
      }
    } finally {
      setCompleting((prev) => {
        const n = new Set(prev)
        n.delete(taskId)
        return n
      })
    }
  }

  async function deleteTask(taskId: string) {
    setItems((prev) => prev.filter((t) => t.id !== taskId))
    await fetch(`/api/tasks?id=${taskId}`, { method: 'DELETE' })
    router.refresh()
  }

  async function addTask() {
    if (!newTitle.trim() || addLoading) return
    setAddLoading(true)
    const title = newTitle.trim()
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, urgent: false, important: false }),
      })
      const data = await res.json() as { task?: Task }
      if (res.ok && data.task) {
        setItems((prev) => [...prev, data.task!])
        setNewTitle('')
        setShowAdd(false)
        router.refresh()
      }
    } finally {
      setAddLoading(false)
    }
  }

  const criticalCount = items.filter((t) => t.urgent && t.important).length
  const overdueCount = items.filter((t) => isOverdue(t.due_date)).length

  if (items.length === 0 && !showAdd) {
    return (
      <>
        <XpToastContainer toasts={toasts} />
        <div className="card p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-lg">Tarefas Pra Hoje</h2>
            <button
              onClick={() => setShowAdd(true)}
              className="w-7 h-7 rounded-lg bg-bg-elevated border border-border hover:border-brand-orange/40 flex items-center justify-center transition-all"
            >
              <Plus size={14} />
            </button>
          </div>
          <p className="text-text-secondary text-sm mb-3">Nenhuma tarefa pendente. ✨</p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAdd(true)}
              className="text-brand-orange hover:underline text-sm font-medium"
            >
              + Adicionar tarefa
            </button>
            <span className="text-text-muted text-xs">·</span>
            <Link href="/tarefas" className="text-sm text-text-secondary hover:text-brand-orange transition-colors">
              Ver todas →
            </Link>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <XpToastContainer toasts={toasts} />
      <div className="card p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-lg">Tarefas Pra Hoje</h2>
            {items.length > 0 && (
              <span className="text-xs bg-brand-orange/20 text-brand-orange border border-brand-orange/30 px-2 py-0.5 rounded-full font-bold">
                {items.length}
              </span>
            )}
            {overdueCount > 0 && (
              <span className="text-xs bg-brand-red/20 text-brand-red border border-brand-red/30 px-2 py-0.5 rounded-full font-bold">
                {overdueCount} atrasada{overdueCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => { setShowAdd(!showAdd); if (!showAdd) setNewTitle('') }}
              className={cn(
                'w-7 h-7 rounded-lg border flex items-center justify-center transition-all',
                showAdd
                  ? 'bg-brand-orange/20 border-brand-orange/50 text-brand-orange'
                  : 'bg-bg-elevated border-border hover:border-brand-orange/40'
              )}
              title={showAdd ? 'Cancelar' : 'Adicionar tarefa'}
            >
              {showAdd ? <X size={12} /> : <Plus size={14} />}
            </button>
            <Link
              href="/tarefas"
              className="text-sm text-text-secondary hover:text-brand-orange transition-colors flex items-center gap-0.5"
            >
              Ver todas <ChevronRight size={14} />
            </Link>
          </div>
        </div>

        {/* Task list */}
        <div className="space-y-2">
          {items.map((task) => {
            const badge = getPriorityBadge(task.urgent, task.important)
            const overdue = isOverdue(task.due_date)
            const isCompleting = completing.has(task.id)

            return (
              <div
                key={task.id}
                className={cn(
                  'group flex items-center gap-2.5 p-3 rounded-xl border transition-all',
                  'bg-bg-elevated border-border hover:border-brand-orange/30',
                  isCompleting && 'opacity-50 pointer-events-none'
                )}
              >
                {/* Complete button */}
                <button
                  onClick={() => quickComplete(task.id)}
                  disabled={isCompleting}
                  className={cn(
                    'w-6 h-6 rounded-full border-2 shrink-0 flex items-center justify-center transition-all',
                    isCompleting
                      ? 'border-brand-green bg-brand-green/20 scale-110'
                      : 'border-border hover:border-brand-orange hover:bg-brand-orange/10 hover:scale-110'
                  )}
                >
                  {isCompleting && <Check size={11} strokeWidth={3} className="text-brand-green" />}
                </button>

                {/* Task content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-medium text-sm leading-tight">{task.title}</span>
                    {badge && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border leading-none ${badge.cls}`}>
                        {badge.label}
                      </span>
                    )}
                  </div>
                  {task.due_date && (
                    <div className={cn(
                      'flex items-center gap-1 text-xs mt-0.5',
                      overdue ? 'text-brand-red' : 'text-text-muted'
                    )}>
                      <Clock size={10} />
                      {overdue && 'Atrasada · '}
                      {formatDueDate(task.due_date)}
                    </div>
                  )}
                </div>

                {/* Urgent alert icon */}
                {task.urgent && !task.important && (
                  <AlertCircle size={14} className="text-brand-gold shrink-0" />
                )}

                {/* Delete — visible on hover */}
                <button
                  onClick={() => deleteTask(task.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-text-muted hover:text-brand-red transition-all shrink-0"
                  title="Excluir tarefa"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            )
          })}
        </div>

        {/* Inline add form */}
        {showAdd && (
          <div className="mt-2 flex gap-2">
            <input
              autoFocus
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') addTask()
                if (e.key === 'Escape') { setShowAdd(false); setNewTitle('') }
              }}
              placeholder="Nova tarefa... (Enter para salvar)"
              className="input flex-1 text-sm py-2"
            />
            <button
              onClick={addTask}
              disabled={!newTitle.trim() || addLoading}
              className="btn-primary text-sm py-2 px-3 disabled:opacity-40"
            >
              {addLoading ? '…' : <Plus size={16} />}
            </button>
          </div>
        )}

        {/* Footer summary */}
        <div className="mt-3 flex items-center justify-between text-xs text-text-muted">
          <span>
            {criticalCount > 0 && (
              <span className="text-brand-red font-medium">{criticalCount} crítica{criticalCount > 1 ? 's' : ''} · </span>
            )}
            {items.length} pendente{items.length !== 1 ? 's' : ''}
          </span>
          <Link href="/tarefas/eisenhower" className="hover:text-brand-orange transition-colors">
            Eisenhower →
          </Link>
        </div>
      </div>
    </>
  )
}
