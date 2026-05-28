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
  Plus, X, AlertCircle, GripVertical, Check, Trash2, Calendar,
  ChevronRight, ListTodo, Loader2, CheckCircle2, Zap, ChevronDown, ListChecks,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Task, TaskStatus } from '@/lib/supabase/types'
import { useXpToast, XpToastContainer } from '@/components/xp-toast'

const COLUMNS: { id: TaskStatus; title: string; rgb: string; emptyIcon: typeof ListTodo; emptyMsg: string }[] = [
  { id: 'todo',  title: 'A Fazer',  rgb: '136,153,187', emptyIcon: ListTodo,     emptyMsg: 'Sem tarefas — tudo limpo!' },
  { id: 'doing', title: 'Fazendo',  rgb: '124,58,237',  emptyIcon: Loader2,      emptyMsg: 'Nada em andamento' },
  { id: 'done',  title: 'Feito',    rgb: '0,255,136',   emptyIcon: CheckCircle2, emptyMsg: 'Nada concluído ainda' },
]

export function KanbanBoard({ initialTasks }: { initialTasks: Task[] }) {
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [showNew, setShowNew] = useState<TaskStatus | null>(null)
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set())
  const { toasts, showXp } = useXpToast()

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  function setTaskLoading(id: string, loading: boolean) {
    setLoadingIds((prev) => {
      const next = new Set(prev)
      loading ? next.add(id) : next.delete(id)
      return next
    })
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
      const data = await res.json() as { xpEarned?: number; leveledUp?: boolean; newLevel?: number }
      if (data.xpEarned) showXp(data.xpEarned, { leveledUp: data.leveledUp ? data.newLevel : undefined })
      if (data.leveledUp && data.newLevel) {
        window.dispatchEvent(new CustomEvent('ascendia:levelup', { detail: { level: data.newLevel } }))
      }
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
      const data = await res.json() as { xpEarned?: number; leveledUp?: boolean; newLevel?: number }
      if (data.xpEarned) showXp(data.xpEarned, { leveledUp: data.leveledUp ? data.newLevel : undefined })
      if (data.leveledUp && data.newLevel) {
        window.dispatchEvent(new CustomEvent('ascendia:levelup', { detail: { level: data.newLevel } }))
      }
      router.refresh()
    } else {
      setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, status: task.status, completed_at: task.completed_at } : t))
    }
    setTaskLoading(task.id, false)
  }, [loadingIds, router, showXp])

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

  const totalAll = tasks.length
  const completionPct = totalAll > 0 ? Math.round((totalDone / totalAll) * 100) : 0

  return (
    <div className="space-y-4">
      <XpToastContainer toasts={toasts} />

      {/* Summary bar */}
      {tasks.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-4 text-sm text-text-secondary">
            <span>{totalActive} ativas</span>
            <span>·</span>
            <span className="text-brand-green font-medium">{totalDone} concluídas</span>
            {totalDone > 0 && totalAll > 0 && (
              <>
                <span>·</span>
                <span className="font-bold" style={{ color: completionPct >= 80 ? '#00FF88' : completionPct >= 50 ? '#F5C842' : '#8899BB' }}>
                  {completionPct}% feito
                </span>
              </>
            )}
          </div>
          {/* Overall progress bar */}
          {totalDone > 0 && (
            <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${completionPct}%`,
                  background: completionPct >= 80
                    ? 'linear-gradient(90deg, #00FF88, #00CC6A)'
                    : completionPct >= 50
                    ? 'linear-gradient(90deg, #F5C842, #FF9500)'
                    : 'linear-gradient(90deg, #7C3AED, #9F5AF7)',
                }}
              />
            </div>
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
            const EmptyIcon = col.emptyIcon
            return (
              <div
                key={col.id}
                className="rounded-2xl p-4 relative overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, rgba(${col.rgb},0.07) 0%, rgba(13,24,41,0.98) 100%)`,
                  border: `1px solid rgba(${col.rgb},0.2)`,
                }}
              >
                {/* Colored top border */}
                <div
                  className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl"
                  style={{ background: `rgba(${col.rgb},0.7)` }}
                />

                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base">{col.title}</h3>
                    {colTasks.length > 0 && (
                      <span
                        className="text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[22px] text-center"
                        style={{ background: `rgba(${col.rgb},0.15)`, color: `rgb(${col.rgb})` }}
                      >
                        {colTasks.length}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setShowNew(col.id)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-white transition-colors"
                    style={{}}
                    onMouseEnter={(e) => { e.currentTarget.style.background = `rgba(${col.rgb},0.15)`; e.currentTarget.style.color = `rgb(${col.rgb})` }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = ''; e.currentTarget.style.color = '' }}
                    title="Adicionar tarefa"
                  >
                    <Plus size={15} />
                  </button>
                </div>

                <SortableContext
                  id={col.id}
                  items={colTasks.map((t) => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2 min-h-[100px]" id={col.id}>
                    {colTasks.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-10 gap-2 opacity-40">
                        <EmptyIcon size={20} style={{ color: `rgb(${col.rgb})` }} />
                        <span className="text-text-muted text-xs">{col.emptyMsg}</span>
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

      {/* Subtasks panel (only on non-dragging cards) */}
      {!isDragging && <SubtaskPanel taskId={task.id} isDone={task.status === 'done'} />}
    </div>
  )
}

// ── SubtaskPanel ─────────────────────────────────────────────────────────────

interface Subtask {
  id: string
  title: string
  is_completed: boolean
  completed_at: string | null
}

function SubtaskPanel({ taskId, isDone }: { taskId: string; isDone: boolean }) {
  const [open, setOpen] = useState(false)
  const [subtasks, setSubtasks] = useState<Subtask[]>([])
  const [loaded, setLoaded] = useState(false)
  const [adding, setAdding] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [savingNew, setSavingNew] = useState(false)

  async function load() {
    if (loaded) return
    const res = await fetch(`/api/subtasks?taskId=${taskId}`)
    if (res.ok) {
      const data = await res.json() as { subtasks: Subtask[] }
      setSubtasks(data.subtasks)
    }
    setLoaded(true)
  }

  function toggle() {
    if (!open) load()
    setOpen(v => !v)
  }

  async function toggleSubtask(s: Subtask) {
    const updated = { ...s, is_completed: !s.is_completed }
    setSubtasks(prev => prev.map(x => x.id === s.id ? updated : x))
    await fetch('/api/subtasks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: s.id, is_completed: updated.is_completed }),
    })
  }

  async function addSubtask() {
    if (!newTitle.trim() || savingNew) return
    setSavingNew(true)
    const res = await fetch('/api/subtasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task_id: taskId, title: newTitle.trim() }),
    })
    if (res.ok) {
      const data = await res.json() as { subtask: Subtask }
      setSubtasks(prev => [...prev, data.subtask])
      setNewTitle('')
      setAdding(false)
    }
    setSavingNew(false)
  }

  async function deleteSubtask(id: string) {
    setSubtasks(prev => prev.filter(s => s.id !== id))
    await fetch(`/api/subtasks?id=${id}`, { method: 'DELETE' })
  }

  const completedCount = subtasks.filter(s => s.is_completed).length
  const totalCount = subtasks.length

  return (
    <div className="mt-2 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
      <button
        onClick={(e) => { e.stopPropagation(); toggle() }}
        className="flex items-center gap-1.5 text-[10px] text-text-muted hover:text-text-secondary transition-colors"
      >
        <ListChecks size={11} />
        {loaded && totalCount > 0
          ? `${completedCount}/${totalCount} subtarefas`
          : 'Subtarefas'}
        <ChevronDown size={10} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="mt-2 space-y-1.5">
          {subtasks.map(s => (
            <div key={s.id} className="flex items-center gap-2 group/sub">
              <button
                onClick={() => toggleSubtask(s)}
                className={cn(
                  'w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all',
                  s.is_completed
                    ? 'bg-brand-green/80 border-brand-green'
                    : 'border-border hover:border-brand-green/60'
                )}
              >
                {s.is_completed && <Check size={8} className="text-black" />}
              </button>
              <span className={cn('text-xs flex-1', s.is_completed && 'line-through text-text-muted')}>
                {s.title}
              </span>
              <button
                onClick={() => deleteSubtask(s.id)}
                className="opacity-0 group-hover/sub:opacity-100 text-text-muted hover:text-brand-red transition-all shrink-0"
              >
                <X size={10} />
              </button>
            </div>
          ))}

          {adding ? (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addSubtask(); if (e.key === 'Escape') { setAdding(false); setNewTitle('') } }}
                placeholder="Nome da subtarefa..."
                className="flex-1 text-xs bg-bg-elevated border border-border rounded-lg px-2 py-1 outline-none focus:border-brand-purple"
                maxLength={200}
              />
              <button onClick={addSubtask} disabled={savingNew || !newTitle.trim()} className="text-brand-purple hover:text-white transition-colors disabled:opacity-40">
                <Check size={12} />
              </button>
              <button onClick={() => { setAdding(false); setNewTitle('') }} className="text-text-muted hover:text-white transition-colors">
                <X size={12} />
              </button>
            </div>
          ) : (
            !isDone && (
              <button
                onClick={() => setAdding(true)}
                className="flex items-center gap-1 text-[10px] text-text-muted hover:text-brand-purple transition-colors"
              >
                <Plus size={10} />
                Adicionar subtarefa
              </button>
            )
          )}
        </div>
      )}
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
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end md:items-center justify-center p-4" style={{ backdropFilter: 'blur(4px)' }}>
      <div
        className="w-full max-w-md p-6 space-y-4 rounded-2xl relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(255,77,0,0.08) 0%, rgba(13,24,41,0.99) 100%)',
          border: '1px solid rgba(255,77,0,0.25)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
        }}
      >
        <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full pointer-events-none blur-xl" style={{ background: 'rgba(255,77,0,0.12)' }} />
        <div className="flex items-center justify-between relative z-10">
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
