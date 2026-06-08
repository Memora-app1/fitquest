'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Check, Trash2, Plus, AlertCircle, X, Clock, ChevronRight, CheckSquare } from 'lucide-react'
import { useXpToast, XpToastContainer } from '@/components/xp-toast'
import { EmptyState } from '@/components/empty-state'

interface Task {
  id: string
  title: string
  urgent: boolean
  important: boolean
  due_date: string | null
}

function getPriorityStyle(urgent: boolean, important: boolean) {
  if (urgent && important)
    return { label: 'CRÍTICO', bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.35)', color: '#EF4444' }
  if (important)
    return { label: 'IMPORTANTE', bg: 'rgba(0,255,136,0.12)', border: 'rgba(0,255,136,0.3)', color: '#00FF88' }
  if (urgent)
    return { label: 'URGENTE', bg: 'rgba(245,200,66,0.12)', border: 'rgba(245,200,66,0.3)', color: '#F5C842' }
  return null
}

function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false
  return new Date(dueDate) < new Date()
}

function formatDueDate(dueDate: string): string {
  const d        = new Date(dueDate)
  const today    = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  if (d.toDateString() === today.toDateString())    return 'Hoje'
  if (d.toDateString() === tomorrow.toDateString()) return 'Amanhã'
  return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
}

// ── Item individual com swipe ────────────────────────────────────────────────

function TaskItem({
  task,
  isCompleting,
  onComplete,
  onDelete,
}: {
  task: Task
  isCompleting: boolean
  onComplete: () => void
  onDelete: () => void
}) {
  const [deltaX, setDeltaX] = useState(0)
  const startXRef = useRef(0)
  const startYRef = useRef(0)
  const dirRef    = useRef<'h' | 'v' | null>(null)
  const THRESHOLD = 72

  function onTouchStart(e: React.TouchEvent) {
    if (isCompleting) return
    startXRef.current = e.touches[0]!.clientX
    startYRef.current = e.touches[0]!.clientY
    dirRef.current    = null
  }

  function onTouchMove(e: React.TouchEvent) {
    if (isCompleting) return
    const dx = e.touches[0]!.clientX - startXRef.current
    const dy = e.touches[0]!.clientY - startYRef.current

    if (!dirRef.current) {
      if (Math.abs(dy) > Math.abs(dx) + 5) dirRef.current = 'v'
      else if (Math.abs(dx) > 8)           dirRef.current = 'h'
    }

    if (dirRef.current === 'h' && dx > 0) {
      setDeltaX(Math.min(THRESHOLD * 1.3, dx))
    }
  }

  function onTouchEnd() {
    if (deltaX >= THRESHOLD && !isCompleting) {
      setDeltaX(0)
      if (navigator.vibrate) navigator.vibrate([20, 10, 40])
      onComplete()
    } else {
      setDeltaX(0)
    }
    dirRef.current = null
  }

  const swipeProgress = Math.min(1, deltaX / THRESHOLD)
  const badge         = getPriorityStyle(task.urgent, task.important)
  const overdue       = isOverdue(task.due_date)

  return (
    <div
      className="relative rounded-xl overflow-hidden"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{ touchAction: 'pan-y' }}
    >
      {/* Fundo verde de completar */}
      <div
        className="absolute inset-0 flex items-center pl-4 rounded-xl pointer-events-none"
        style={{
          background: `rgba(0,255,136,${0.06 + swipeProgress * 0.14})`,
          opacity: swipeProgress > 0.08 ? 1 : 0,
          transition: swipeProgress === 0 ? 'opacity 0.2s ease' : 'none',
        }}
      >
        <Check
          size={18}
          strokeWidth={3}
          style={{
            color:     '#00FF88',
            opacity:   swipeProgress,
            transform: `scale(${0.4 + swipeProgress * 0.6})`,
          }}
        />
        <span
          className="ml-2 text-xs font-bold"
          style={{ color: '#00FF88', opacity: Math.max(0, swipeProgress - 0.5) * 2 }}
        >
          Concluída
        </span>
      </div>

      {/* Row principal */}
      <div
        className="group flex items-center gap-2.5 p-3 rounded-xl"
        style={{
          minHeight:      52,
          background:     overdue ? 'rgba(239,68,68,0.06)' : 'rgba(255,255,255,0.03)',
          border:         overdue ? '1px solid rgba(239,68,68,0.2)' : '1px solid rgba(255,255,255,0.07)',
          opacity:        isCompleting ? 0.5 : 1,
          pointerEvents:  isCompleting ? 'none' : 'auto',
          transform:      `translateX(${deltaX}px)`,
          transition:     deltaX > 0
            ? 'none'
            : 'transform 0.3s cubic-bezier(0.34, 1.4, 0.64, 1), opacity 0.3s ease',
          willChange: 'transform',
        }}
      >
        {/* Botão de completar — tap target 32px */}
        <button
          onClick={onComplete}
          disabled={isCompleting}
          className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center transition-all active:scale-90"
          style={
            isCompleting
              ? { background: 'rgba(0,255,136,0.2)', border: '2px solid #00FF88' }
              : { border: '2px solid rgba(255,255,255,0.18)' }
          }
          aria-label="Concluir tarefa"
        >
          {isCompleting && (
            <Check size={12} strokeWidth={3} style={{ color: '#00FF88' }} />
          )}
        </button>

        {/* Conteúdo */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-medium text-sm leading-tight">{task.title}</span>
            {badge && (
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded-md leading-none"
                style={{ background: badge.bg, border: `1px solid ${badge.border}`, color: badge.color }}
              >
                {badge.label}
              </span>
            )}
          </div>
          {task.due_date && (
            <div
              className="flex items-center gap-1 text-xs mt-0.5"
              style={{ color: overdue ? '#EF4444' : '#8899BB' }}
            >
              <Clock size={10} />
              {overdue && 'Atrasada · '}
              {formatDueDate(task.due_date)}
            </div>
          )}
        </div>

        {task.urgent && !task.important && (
          <AlertCircle size={14} className="text-brand-gold shrink-0" />
        )}

        <button
          onClick={onDelete}
          className="opacity-0 group-hover:opacity-100 p-1 text-text-muted hover:text-red-400 transition-all shrink-0"
          title="Excluir tarefa"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  )
}

// ── Container principal ──────────────────────────────────────────────────────

export function TasksToday({ tasks: initialTasks }: { tasks: Task[] }) {
  const router   = useRouter()
  const [items, setItems]         = useState<Task[]>(initialTasks)
  const [completing, setCompleting] = useState<Set<string>>(new Set())
  const [showAdd, setShowAdd]     = useState(false)
  const [newTitle, setNewTitle]   = useState('')
  const [addLoading, setAddLoading] = useState(false)
  const { toasts, showXp } = useXpToast()

  async function quickComplete(taskId: string) {
    if (completing.has(taskId)) return
    if (navigator.vibrate) navigator.vibrate([10, 5, 25])
    setCompleting((prev) => new Set(prev).add(taskId))
    try {
      const res = await fetch('/api/tasks', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ id: taskId, status: 'done' }),
      })
      const data = await res.json() as {
        xpEarned?: number
        leveledUp?: boolean
        newLevel?: number
        achievementsUnlocked?: string[]
      }
      if (res.ok) {
        setItems((prev) => prev.filter((t) => t.id !== taskId))
        showXp(data.xpEarned ?? 0, { leveledUp: data.leveledUp ? data.newLevel : undefined })
        if (data.leveledUp && data.newLevel) {
          window.dispatchEvent(new CustomEvent('ascendia:levelup', { detail: { level: data.newLevel } }))
        }
        for (const slug of (data.achievementsUnlocked ?? [])) {
          window.dispatchEvent(new CustomEvent('ascendia:achievement', { detail: { slug } }))
        }
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
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ title, urgent: false, important: false }),
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
  const overdueCount  = items.filter((t) => isOverdue(t.due_date)).length

  const cardStyle = criticalCount > 0
    ? { bg: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', glow: 'rgba(239,68,68,0.15)', accent: '#EF4444' }
    : overdueCount > 0
    ? { bg: 'rgba(245,200,66,0.06)', border: '1px solid rgba(245,200,66,0.2)', glow: 'rgba(245,200,66,0.15)', accent: '#F5C842' }
    : { bg: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.2)', glow: 'rgba(124,58,237,0.15)', accent: '#7C3AED' }

  if (items.length === 0 && !showAdd) {
    return (
      <>
        <XpToastContainer toasts={toasts} />
        <EmptyState
          emoji="✅"
          title="Nenhuma tarefa pendente"
          description="Organize seu dia com o Kanban ou a Matriz Eisenhower. Tarefas urgentes+importantes valem +50 XP."
          ctaLabel="+ Adicionar tarefa"
          onCtaClick={() => setShowAdd(true)}
          tip="Tarefa concluída = +30 XP. Urgente + Importante = +50 XP."
          socialProof="Quem fecha 3+ tarefas por dia tem 4x mais chance de manter o streak."
        />
      </>
    )
  }

  return (
    <>
      <XpToastContainer toasts={toasts} />
      <div
        className="rounded-2xl p-6 relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${cardStyle.bg} 0%, rgba(13,24,41,0.98) 100%)`,
          border: cardStyle.border,
        }}
      >
        {/* Corner glow */}
        <div
          className="absolute -top-4 -right-4 w-20 h-20 rounded-full pointer-events-none blur-xl"
          style={{ background: cardStyle.glow }}
        />

        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CheckSquare size={16} style={{ color: cardStyle.accent }} />
              <h2 className="font-bold text-lg">Tarefas Pra Hoje</h2>
              {items.length > 0 && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-bold"
                  style={{ background: 'rgba(255,77,0,0.15)', color: '#FF4D00', border: '1px solid rgba(255,77,0,0.3)' }}
                >
                  {items.length}
                </span>
              )}
              {overdueCount > 0 && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-bold"
                  style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)' }}
                >
                  {overdueCount} atrasada{overdueCount > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => { setShowAdd(!showAdd); if (!showAdd) setNewTitle('') }}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-all active:scale-90"
                style={
                  showAdd
                    ? { background: 'rgba(255,77,0,0.15)', border: '1px solid rgba(255,77,0,0.4)', color: '#FF4D00' }
                    : { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#8899BB' }
                }
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

          {/* Lista de tarefas */}
          <div className="space-y-2">
            {items.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                isCompleting={completing.has(task.id)}
                onComplete={() => quickComplete(task.id)}
                onDelete={() => deleteTask(task.id)}
              />
            ))}
          </div>

          {/* Inline add */}
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

          {/* Footer */}
          <div className="mt-3 flex items-center justify-between text-xs text-text-muted">
            <span>
              {criticalCount > 0 && (
                <span className="font-medium" style={{ color: '#EF4444' }}>
                  {criticalCount} crítica{criticalCount > 1 ? 's' : ''} ·{' '}
                </span>
              )}
              {items.length} pendente{items.length !== 1 ? 's' : ''} · deslize → para concluir
            </span>
            <Link href="/tarefas/eisenhower" className="hover:text-brand-orange transition-colors">
              Eisenhower →
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
