'use client'

import { useState } from 'react'
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
import { Plus, X, AlertCircle, GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Task, TaskStatus } from '@/lib/supabase/types'

const COLUMNS: { id: TaskStatus; title: string; color: string }[] = [
  { id: 'todo', title: 'A Fazer', color: 'border-text-muted' },
  { id: 'doing', title: 'Fazendo', color: 'border-brand-purple' },
  { id: 'done', title: 'Feito', color: 'border-brand-green' },
]

export function KanbanBoard({ initialTasks }: { initialTasks: Task[] }) {
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [showNew, setShowNew] = useState<TaskStatus | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  function handleDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id))
  }

  async function handleDragEnd(e: DragEndEvent) {
    setActiveId(null)
    const { active, over } = e
    if (!over) return

    const activeTask = tasks.find((t) => t.id === active.id)
    if (!activeTask) return

    // Determinar nova coluna
    const overId = String(over.id)
    const newStatus = COLUMNS.find((c) => c.id === overId)?.id
      ?? tasks.find((t) => t.id === overId)?.status

    if (!newStatus || newStatus === activeTask.status) return

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) =>
        t.id === active.id
          ? { ...t, status: newStatus, completed_at: newStatus === 'done' ? new Date().toISOString() : null }
          : t
      )
    )

    // Persist
    const res = await fetch('/api/tasks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: active.id, status: newStatus }),
    })

    if (!res.ok) {
      // Rollback
      setTasks(initialTasks)
      return
    }

    router.refresh()
  }

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) : null

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.id)
          return (
            <div key={col.id} className={cn('card p-4 border-t-4', col.color)}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-lg">
                  {col.title} <span className="text-text-muted text-sm font-normal">({colTasks.length})</span>
                </h3>
                <button
                  onClick={() => setShowNew(col.id)}
                  className="text-text-muted hover:text-brand-orange transition-colors"
                  title="Adicionar tarefa"
                >
                  <Plus size={18} />
                </button>
              </div>

              <SortableContext id={col.id} items={colTasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2 min-h-[100px]" id={col.id}>
                  {colTasks.length === 0 && (
                    <div className="text-text-muted text-sm text-center py-8">Vazio</div>
                  )}
                  {colTasks.map((t) => (
                    <SortableTask key={t.id} task={t} />
                  ))}
                </div>
              </SortableContext>
            </div>
          )
        })}
      </div>

      <DragOverlay>{activeTask && <TaskCard task={activeTask} isDragging />}</DragOverlay>

      {showNew && <NewTaskModal status={showNew} onClose={() => setShowNew(null)} />}
    </DndContext>
  )
}

function SortableTask({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.3 : 1 }}
      {...attributes}
      {...listeners}
    >
      <TaskCard task={task} />
    </div>
  )
}

function TaskCard({ task, isDragging }: { task: Task; isDragging?: boolean }) {
  return (
    <div
      className={cn(
        'p-3 bg-bg-elevated border border-border rounded-xl cursor-grab active:cursor-grabbing',
        isDragging && 'shadow-2xl shadow-brand-orange/30 rotate-3'
      )}
    >
      <div className="flex items-start gap-2">
        <GripVertical size={14} className="text-text-muted mt-1 shrink-0" />
        <div className="flex-1">
          <div className={cn('font-medium', task.status === 'done' && 'line-through text-text-muted')}>
            {task.title}
          </div>
          <div className="flex items-center gap-2 mt-1">
            {task.urgent && task.important && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 bg-brand-red/20 text-brand-red rounded">
                URGENTE
              </span>
            )}
            {!task.urgent && task.important && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 bg-brand-green/20 text-brand-green rounded">
                IMPORTANTE
              </span>
            )}
            <span className="text-xs text-brand-gold">+{task.xp_reward} XP</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function NewTaskModal({ status, onClose }: { status: TaskStatus; onClose: () => void }) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [urgent, setUrgent] = useState(false)
  const [important, setImportant] = useState(false)
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, urgent, important, status }),
    })
    router.refresh()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end md:items-center justify-center p-4">
      <div className="card-glow w-full max-w-md p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Nova tarefa</h2>
          <button onClick={onClose}><X size={20} /></button>
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
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setUrgent(!urgent)}
              className={cn(
                'flex-1 p-3 rounded-xl border text-sm font-medium transition-all',
                urgent ? 'bg-brand-red/20 border-brand-red text-brand-red' : 'bg-bg-elevated border-border'
              )}
            >
              <AlertCircle size={14} className="inline mr-1" /> Urgente
            </button>
            <button
              type="button"
              onClick={() => setImportant(!important)}
              className={cn(
                'flex-1 p-3 rounded-xl border text-sm font-medium transition-all',
                important ? 'bg-brand-green/20 border-brand-green text-brand-green' : 'bg-bg-elevated border-border'
              )}
            >
              ⭐ Importante
            </button>
          </div>
          <div className="text-xs text-text-muted">
            {urgent && important ? '+50 XP (quadrante crítico)' : '+30 XP'}
          </div>
          <button type="submit" disabled={loading || !title} className="btn-primary w-full">
            {loading ? 'Criando...' : 'Criar tarefa'}
          </button>
        </form>
      </div>
    </div>
  )
}
