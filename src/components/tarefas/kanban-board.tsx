'use client'

import { useState, useCallback } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useRouter } from 'next/navigation'
import {
  Plus, X, AlertCircle, GripVertical, Check, Trash2, Zap, Calendar,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Task, TaskStatus } from '@/lib/supabase/types'

const COLUMNS: { id: TaskStatus; title: string; color: string; bg: string }[] = [
  { id: 'todo', title: 'A Fazer', color: 'border-t-text-muted', bg: 'bg-bg-elevated/30' },
  { id: 'doing', title: 'Fazendo', color: 'border-t-brand-purple', bg: 'bg-brand-purple/5' },
  { id: 'done', title: 'Feito', color: 'border-t-brand-green', bg: 'bg-brand-green/5' },
]

interface XpToast {
  id: string
  amount: number
}

export function KanbanBoard({ initialTasks }: { initialTasks: Task[] }) {
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [showNew, setShowNew] = useState<TaskStatus | null>(null)
  const [toasts, setToasts] = useState<XpToast[]>([])
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set())

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  function setTaskLoading(id: string, loading: boolean) {
    setLoadingIds((prev) => {
      const next = new Set(prev)
      loading ? next.add(id) : next.delete(id)
      return next
    })
  }

  function addToast(amount: number) {
    const id = crypto.randomUUID()
    setToasts((prev) => [...prev, { id, amount }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 2500)
  }

  function handleDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id))
  }

  async function handleDragEnd(e: DragEndEvent) {
    setActiveId(null)
    const { active, over } = e
    if (!over) return

    const activeTask = tasks.find((t) => t.id === active.id)
    if (!activeTask) return

    const overId = String(over.id)
    const newStatus = COLUMNS.find((c) => c.id === overId)?.id
      ?? tasks.find((t) => t.id === overId)?.status

    if (!newStatus || newStatus === activeTask.status) return

    const wasNotDone = activeTask.status !== 'done'
    const isCompletingNow = newStatus === 'done' && wasNotDone

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) =>
        t.id === active.id
          ? { ...t, status: newStatus, completed_at: newStatus === 'done' ? new Date().toISOString() : null }
          : t
      )
    )

    const res = await fetch('/api/tasks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: active.id, status: newStatus }),
    })

    if (!res.ok) {
      setTasks(initialTasks)
    } else if (isCompletingNow) {
      const data = await res.json() as { xpEarned?: number }
      if (data.xpEarned) addToast(data.xpEarned)
      router.refresh()
    }
  }

  const quickComplete = useCallback(async (task: Task) => {
    if (task.status === 'done' || loadingIds.has(task.id)) return
    setTaskLoading(task.id, true)

    setTasks((prev) =>
      prev.map((t) => t.id === task.id ? { ...t, status: 'done', completed_at: new Date().toISOString() } : t)
    )

    const res = await fetch('/api/tasks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: task.id, status: 'done' }),
    })

    if (res.ok) {
      const data = await res.json() as { xpEarned?: number }
      if (data.xpEarned) addToast(data.xpEarned)
      router.refresh()
    } else {
      setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, status: task.status, completed_at: task.completed_at } : t))
    }
    setTaskLoading(task.id, false)
  }, [loadingIds, router])

  const deleteTask = useCallback(async (id: string) => {
    if (loadingIds.has(id)) return
    setTaskLoading(id, true)
    setTasks((prev) => prev.filter((t) => t.id !== id))

    const res = await fetch(`/api/tasks?id=${id}`, { method: 'DELETE' })
    if (!res.ok) {
      setTasks(initialTasks)
    }
    setTaskLoading(id, false)
  }, [loadingIds, initialTasks])

  const onCreated = useCallback((task: Task) => {
    setTasks((prev) => [...prev, task])
    setShowNew(null)
    router.refresh()
  }, [router])

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) : null

  const totalDone = tasks.filter((t) => t.status === 'done').length
  const totalActive = tasks.filter((t) => t.status !== 'done').length

  return (
    <div className="space-y-4">
      {/* XP Toasts */}
      <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="flex items-center gap-2 bg-brand-gold text-black font-bold px-4 py-2 rounded-xl shadow-lg animate-[slide-up_0.3s_ease]"
          >
            <Zap size={16} />+{t.amount} XP
          </div>
        ))}
      </div>

      {/* Summary bar */}
      {tasks.length > 0 && (
        <div className="flex items-center gap-4 text-sm text-text-secondary">
          <span>{totalActive} ativas</span>
          <span>·</span>
          <span className="text-brand-green">{totalDone} concluídas</span>
          {totalDone > 0 && totalActive + totalDone > 0 && (
            <>
              <span>·</span>
              <span>{Math.round((totalDone / (totalActive + totalDone)) * 100)}% feito</span>
            </>
          )}
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {COLUMNS.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.id)
            return (
              <div key={col.id} className={cn('card p-4 border-t-4', col.color, col.bg)}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-base">
                    {col.title}
                    <span className="text-text-muted text-sm font-normal ml-1.5">
                      ({colTasks.length})
                    </span>
                  </h3>
                  <button
                    onClick={() => setShowNew(col.id)}
                    className="text-text-muted hover:text-brand-orange transition-colors"
                    title="Adicionar tarefa"
                  >
                    <Plus size={18} />
                  </button>
                </div>

                <SortableContext
                  id={col.id}
                  items={colTasks.map((t) => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2 min-h-[100px]" id={col.id}>
                    {colTasks.length === 0 && (
                      <div className="text-text-muted text-sm text-center py-8 opacity-60">
                        {col.id === 'todo' ? 'Sem tarefas — ótimo!' : col.id === 'doing' ? 'Nada em andamento' : 'Nada concluído ainda'}
                      </div>
                    )}
                    {colTasks.map((t) => (
                      <SortableTask
                        key={t.id}
                        task={t}
                        isLoading={loadingIds.has(t.id)}
                        onComplete={() => quickComplete(t)}
                        onDelete={() => deleteTask(t.id)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </div>
            )
          })}
        </div>

        <DragOverlay>{activeTask && <TaskCard task={activeTask} isDragging />}</DragOverlay>
      </DndContext>

      {showNew && (
        <NewTaskModal
          status={showNew}
          onClose={() => setShowNew(null)}
          onCreated={onCreated}
        />
      )}
    </div>
  )
}

function SortableTask({
  task,
  isLoading,
  onComplete,
  onDelete,
}: {
  task: Task
  isLoading: boolean
  onComplete: () => void
  onDelete: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.3 : 1 }}
    >
      <TaskCard
        task={task}
        isLoading={isLoading}
        onComplete={onComplete}
        onDelete={onDelete}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  )
}

function TaskCard({
  task,
  isDragging,
  isLoading,
  onComplete,
  onDelete,
  dragHandleProps,
}: {
  task: Task
  isDragging?: boolean
  isLoading?: boolean
  onComplete?: () => void
  onDelete?: () => void
  dragHandleProps?: Record<string, unknown>
}) {
  const isDone = task.status === 'done'

  const dueDateDisplay = task.due_date
    ? new Date(task.due_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
    : null

  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && !isDone

  return (
    <div
      className={cn(
        'p-3 bg-bg-card border border-border rounded-xl group transition-all relative',
        isDragging && 'shadow-2xl shadow-brand-orange/30 rotate-2 scale-105',
        isDone && 'opacity-50',
        isLoading && 'opacity-60 pointer-events-none'
      )}
    >
      <div className="flex items-start gap-2">
        {/* Drag handle */}
        {dragHandleProps && (
          <div
            {...dragHandleProps}
            className="text-text-muted mt-0.5 shrink-0 cursor-grab active:cursor-grabbing"
          >
            <GripVertical size={14} />
          </div>
        )}

        {/* Complete button */}
        {onComplete && (
          <button
            onClick={(e) => { e.stopPropagation(); onComplete() }}
            className={cn(
              'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all',
              isDone
                ? 'bg-brand-green border-brand-green'
                : 'border-border hover:border-brand-green hover:bg-brand-green/20'
            )}
          >
            {isDone && <Check size={10} className="text-black" />}
          </button>
        )}

        <div className="flex-1 min-w-0">
          <div className={cn('font-medium text-sm leading-snug', isDone && 'line-through text-text-muted')}>
            {task.title}
          </div>

          {/* Badges row */}
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            {task.urgent && task.important && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 bg-brand-red/20 text-brand-red rounded">
                CRÍTICO
              </span>
            )}
            {!task.urgent && task.important && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 bg-brand-green/20 text-brand-green rounded">
                IMPORTANTE
              </span>
            )}
            {task.urgent && !task.important && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 bg-brand-gold/20 text-brand-gold rounded">
                URGENTE
              </span>
            )}
            {dueDateDisplay && (
              <span className={cn(
                'text-[10px] px-1.5 py-0.5 rounded flex items-center gap-0.5',
                isOverdue ? 'bg-brand-red/20 text-brand-red' : 'bg-white/5 text-text-muted'
              )}>
                <Calendar size={9} />
                {dueDateDisplay}
              </span>
            )}
            <span className="text-[10px] text-brand-gold ml-auto">+{task.xp_reward} XP</span>
          </div>
        </div>

        {/* Delete */}
        {onDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete() }}
            className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-brand-red transition-all shrink-0"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>
    </div>
  )
}

function NewTaskModal({
  status,
  onClose,
  onCreated,
}: {
  status: TaskStatus
  onClose: () => void
  onCreated: (task: Task) => void
}) {
  const [title, setTitle] = useState('')
  const [urgent, setUrgent] = useState(false)
  const [important, setImportant] = useState(status === 'todo' ? false : false)
  const [dueDate, setDueDate] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  const xpPreview = urgent && important ? 50 : 30

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || loading) return
    setLoading(true)

    const body: Record<string, unknown> = {
      title: title.trim(),
      urgent,
      important,
      status,
    }
    if (description.trim()) body.description = description.trim()
    if (dueDate) body.due_date = new Date(dueDate).toISOString()

    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (res.ok) {
      const data = await res.json() as { task: Task }
      onCreated(data.task)
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end md:items-center justify-center p-4">
      <div className="card-glow w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Nova tarefa</h2>
          <button onClick={onClose} className="text-text-muted hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <input
            autoFocus
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="O que precisa ser feito?"
            className="input w-full"
          />

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detalhes (opcional)"
            rows={2}
            className="input w-full resize-none text-sm"
          />

          {/* Urgente / Importante */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setUrgent(!urgent)}
              className={cn(
                'flex-1 p-3 rounded-xl border text-sm font-medium transition-all flex items-center justify-center gap-1.5',
                urgent
                  ? 'bg-brand-red/20 border-brand-red text-brand-red'
                  : 'bg-bg-elevated border-border text-text-secondary hover:border-brand-red/50'
              )}
            >
              <AlertCircle size={14} /> Urgente
            </button>
            <button
              type="button"
              onClick={() => setImportant(!important)}
              className={cn(
                'flex-1 p-3 rounded-xl border text-sm font-medium transition-all flex items-center justify-center gap-1.5',
                important
                  ? 'bg-brand-green/20 border-brand-green text-brand-green'
                  : 'bg-bg-elevated border-border text-text-secondary hover:border-brand-green/50'
              )}
            >
              ⭐ Importante
            </button>
          </div>

          {/* Prazo */}
          <div className="space-y-1.5">
            <label className="text-xs text-text-muted uppercase tracking-wider flex items-center gap-1">
              <Calendar size={11} /> Prazo (opcional)
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="input w-full text-sm"
            />
          </div>

          <div className="flex items-center justify-between text-xs text-text-muted bg-bg-elevated rounded-lg px-3 py-2">
            <span>Recompensa ao concluir</span>
            <span className="text-brand-gold font-bold flex items-center gap-1">
              <Zap size={11} /> +{xpPreview} XP
            </span>
          </div>

          <button type="submit" disabled={loading || !title.trim()} className="btn-primary w-full flex items-center justify-center gap-2">
            {loading ? 'Criando...' : (
              <>Criar tarefa <ChevronRight size={16} /></>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
