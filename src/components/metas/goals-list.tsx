'use client'

import { useState } from 'react'
import { Plus, X, Trash2, CheckCircle2, Pause, ChevronUp, ChevronDown, Flag } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Goal {
  id: string
  title: string
  description: string | null
  icon: string | null
  category: string
  target_value: number
  current_value: number
  unit: string
  deadline: string | null
  status: string
  completed_at: string | null
  created_at: string
}

const GOAL_ICONS = ['🎯', '💪', '🏃', '📚', '💰', '🏠', '✈️', '🎓', '🧘', '🏆', '🌱', '❤️', '⚡', '🎮', '🎨', '🧠']
const GOAL_CATEGORIES = [
  { value: 'fitness', label: '💪 Fitness' },
  { value: 'saude', label: '❤️ Saúde' },
  { value: 'financeiro', label: '💰 Financeiro' },
  { value: 'carreira', label: '🎓 Carreira' },
  { value: 'educacao', label: '📚 Educação' },
  { value: 'habitos', label: '🎯 Hábitos' },
  { value: 'pessoal', label: '🌱 Pessoal' },
  { value: 'custom', label: '⚡ Outro' },
]

function calcProgress(current: number, target: number): number {
  if (target <= 0) return 0
  return Math.min(100, Math.round((current / target) * 100))
}

function formatDeadline(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const diff = d.getTime() - now.getTime()
  const days = Math.ceil(diff / 86400000)
  if (days < 0) return `${Math.abs(days)}d atrasado`
  if (days === 0) return 'Vence hoje'
  if (days === 1) return 'Vence amanhã'
  if (days <= 30) return `${days} dias restantes`
  return d.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
}

export function GoalsList({ initialGoals }: { initialGoals: Goal[] }) {
  const [goals, setGoals] = useState<Goal[]>(initialGoals)
  const [showCreate, setShowCreate] = useState(false)
  const [updateGoal, setUpdateGoal] = useState<Goal | null>(null)
  const [filter, setFilter] = useState<'active' | 'completed' | 'all'>('active')

  async function handleDelete(id: string) {
    if (!confirm('Remover esta meta?')) return
    const res = await fetch(`/api/goals?id=${id}`, { method: 'DELETE' })
    if (res.ok) setGoals((prev) => prev.filter((g) => g.id !== id))
  }

  async function handleComplete(goal: Goal) {
    const res = await fetch('/api/goals', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: goal.id,
        status: 'completed',
        current_value: goal.target_value,
      }),
    })
    if (res.ok) {
      const data = await res.json() as { goal: Goal }
      setGoals((prev) => prev.map((g) => (g.id === goal.id ? data.goal : g)))
    }
  }

  async function handleTogglePause(goal: Goal) {
    const newStatus = goal.status === 'paused' ? 'active' : 'paused'
    const res = await fetch('/api/goals', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: goal.id, status: newStatus }),
    })
    if (res.ok) {
      const data = await res.json() as { goal: Goal }
      setGoals((prev) => prev.map((g) => (g.id === goal.id ? data.goal : g)))
    }
  }

  const filtered = goals.filter((g) => {
    if (filter === 'active') return g.status === 'active' || g.status === 'paused'
    if (filter === 'completed') return g.status === 'completed'
    return true
  })

  const activeCount = goals.filter((g) => g.status === 'active').length
  const completedCount = goals.filter((g) => g.status === 'completed').length

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex gap-2">
          {(['active', 'completed', 'all'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
                filter === f
                  ? 'bg-brand-orange text-white'
                  : 'bg-bg-elevated text-text-secondary hover:text-white'
              )}
            >
              {f === 'active' && `Ativas (${activeCount})`}
              {f === 'completed' && `Concluídas (${completedCount})`}
              {f === 'all' && 'Todas'}
            </button>
          ))}
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          <Plus size={18} className="inline mr-1" /> Nova meta
        </button>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="card p-12 text-center">
          <div className="text-5xl mb-4">🎯</div>
          <h3 className="text-xl font-bold mb-2">
            {filter === 'active' ? 'Nenhuma meta ativa' : 'Nenhuma meta aqui'}
          </h3>
          <p className="text-text-secondary mb-4">
            {filter === 'active'
              ? 'Crie sua primeira meta para começar a acompanhar seu progresso'
              : 'Nada aqui ainda'}
          </p>
          {filter === 'active' && (
            <button onClick={() => setShowCreate(true)} className="btn-primary">
              Criar primeira meta
            </button>
          )}
        </div>
      )}

      {/* Goals grid */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((goal) => {
            const progress = calcProgress(goal.current_value, goal.target_value)
            const isCompleted = goal.status === 'completed'
            const isPaused = goal.status === 'paused'
            const isOverdue = goal.deadline && new Date(goal.deadline) < new Date() && !isCompleted

            return (
              <div
                key={goal.id}
                className={cn(
                  'card p-5 space-y-4',
                  isCompleted && 'opacity-80',
                  isPaused && 'opacity-60'
                )}
              >
                {/* Header */}
                <div className="flex items-start gap-3">
                  <div className="text-3xl w-12 h-12 bg-bg-elevated rounded-xl flex items-center justify-center shrink-0">
                    {goal.icon ?? '🎯'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className={cn('font-bold truncate', isCompleted && 'line-through text-text-muted')}>
                        {goal.title}
                      </h3>
                      {isCompleted && <CheckCircle2 size={16} className="text-brand-green shrink-0" />}
                      {isPaused && <Pause size={14} className="text-text-muted shrink-0" />}
                    </div>
                    {goal.description && (
                      <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">{goal.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs bg-bg-elevated px-2 py-0.5 rounded-full text-text-muted capitalize">
                        {GOAL_CATEGORIES.find((c) => c.value === goal.category)?.label ?? goal.category}
                      </span>
                      {goal.deadline && (
                        <span className={cn(
                          'text-xs px-2 py-0.5 rounded-full',
                          isOverdue
                            ? 'bg-brand-red/20 text-brand-red'
                            : 'bg-bg-elevated text-text-muted'
                        )}>
                          <Flag size={10} className="inline mr-0.5" />
                          {formatDeadline(goal.deadline)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Menu actions */}
                  {!isCompleted && (
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => setUpdateGoal(goal)}
                        title="Atualizar progresso"
                        className="w-8 h-8 bg-bg-elevated rounded-lg flex items-center justify-center text-text-muted hover:text-brand-gold transition-colors"
                      >
                        {isPaused ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    </div>
                  )}
                </div>

                {/* Progress bar */}
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-text-muted">
                      {goal.current_value.toLocaleString('pt-BR')} / {goal.target_value.toLocaleString('pt-BR')} {goal.unit}
                    </span>
                    <span className={cn(
                      'font-bold',
                      isCompleted ? 'text-brand-green' : 'text-text-secondary'
                    )}>
                      {progress}%
                    </span>
                  </div>
                  <div className="h-2.5 bg-bg-elevated rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-500',
                        isCompleted ? 'bg-brand-green' : 'bg-gradient-brand'
                      )}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Actions row */}
                {!isCompleted && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setUpdateGoal(goal)}
                      className="btn-primary flex-1 text-sm py-2"
                    >
                      Atualizar progresso
                    </button>
                    <button
                      onClick={() => handleComplete(goal)}
                      title="Marcar como concluída"
                      className="px-3 py-2 bg-brand-green/20 text-brand-green rounded-xl hover:bg-brand-green/30 transition-colors text-sm"
                    >
                      ✓ Concluir
                    </button>
                    <button
                      onClick={() => handleTogglePause(goal)}
                      title={isPaused ? 'Retomar' : 'Pausar'}
                      className="px-3 py-2 bg-bg-elevated text-text-muted rounded-xl hover:bg-border transition-colors"
                    >
                      {isPaused ? <ChevronUp size={14} /> : <Pause size={14} />}
                    </button>
                    <button
                      onClick={() => handleDelete(goal.id)}
                      title="Remover"
                      className="px-3 py-2 bg-bg-elevated text-text-muted rounded-xl hover:text-brand-red hover:bg-brand-red/10 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}

                {isCompleted && goal.completed_at && (
                  <div className="text-xs text-brand-green flex items-center gap-1">
                    <CheckCircle2 size={12} />
                    Concluída em {new Date(goal.completed_at).toLocaleDateString('pt-BR')}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <CreateGoalModal
          onClose={() => setShowCreate(false)}
          onCreated={(g) => setGoals((prev) => [g, ...prev])}
        />
      )}

      {/* Update Progress Modal */}
      {updateGoal && (
        <UpdateProgressModal
          goal={updateGoal}
          onClose={() => setUpdateGoal(null)}
          onUpdated={(g) => {
            setGoals((prev) => prev.map((x) => (x.id === g.id ? g : x)))
            setUpdateGoal(null)
          }}
        />
      )}
    </>
  )
}

// ─── Create Modal ────────────────────────────────────────────────────────────

function CreateGoalModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: (goal: Goal) => void
}) {
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [icon, setIcon] = useState('🎯')
  const [category, setCategory] = useState('custom')
  const [targetValue, setTargetValue] = useState('')
  const [unit, setUnit] = useState('')
  const [deadline, setDeadline] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const res = await fetch('/api/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        description: description || undefined,
        icon,
        category,
        target_value: parseFloat(targetValue),
        unit,
        deadline: deadline ? new Date(deadline).toISOString() : null,
      }),
    })

    setLoading(false)

    if (res.ok) {
      const data = await res.json() as { goal: Goal }
      onCreated(data.goal)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end md:items-center justify-center p-4">
      <div className="card-glow w-full max-w-lg p-6 space-y-4 animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Nova meta</h2>
          <button onClick={onClose} className="text-text-muted hover:text-white">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {/* Icon picker */}
          <div>
            <label className="text-sm text-text-secondary block mb-2">Ícone</label>
            <div className="flex gap-2 flex-wrap">
              {GOAL_ICONS.map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIcon(i)}
                  className={cn(
                    'w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all',
                    icon === i ? 'bg-brand-orange/30 ring-2 ring-brand-orange' : 'bg-bg-elevated'
                  )}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-sm text-text-secondary block mb-2">Título da meta *</label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input w-full"
              placeholder="Ex: Correr 100km no mês"
              maxLength={200}
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-sm text-text-secondary block mb-2">Descrição (opcional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input w-full resize-none h-16 text-sm"
              placeholder="Por que esta meta é importante?"
              maxLength={500}
            />
          </div>

          {/* Category */}
          <div>
            <label className="text-sm text-text-secondary block mb-2">Categoria</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="input w-full"
            >
              {GOAL_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* Target + unit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-text-secondary block mb-2">Valor alvo *</label>
              <input
                required
                type="number"
                min="0.1"
                step="0.1"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                className="input w-full"
                placeholder="100"
              />
            </div>
            <div>
              <label className="text-sm text-text-secondary block mb-2">Unidade *</label>
              <input
                required
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="input w-full"
                placeholder="km, livros, kg..."
                maxLength={50}
              />
            </div>
          </div>

          {/* Deadline */}
          <div>
            <label className="text-sm text-text-secondary block mb-2">
              Prazo <span className="text-text-muted">(opcional)</span>
            </label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="input w-full"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <button type="submit" disabled={loading || !title || !targetValue || !unit} className="btn-primary w-full">
            {loading ? 'Criando...' : 'Criar meta'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── Update Progress Modal ───────────────────────────────────────────────────

function UpdateProgressModal({
  goal,
  onClose,
  onUpdated,
}: {
  goal: Goal
  onClose: () => void
  onUpdated: (goal: Goal) => void
}) {
  const [loading, setLoading] = useState(false)
  const [value, setValue] = useState(String(goal.current_value))
  const progress = calcProgress(parseFloat(value) || 0, goal.target_value)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const newValue = parseFloat(value) || 0
    const newStatus = newValue >= goal.target_value ? 'completed' : 'active'

    const res = await fetch('/api/goals', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: goal.id, current_value: newValue, status: newStatus }),
    })

    setLoading(false)
    if (res.ok) {
      const data = await res.json() as { goal: Goal }
      onUpdated(data.goal)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="card-glow w-full max-w-sm p-6 space-y-4 animate-slide-up">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Atualizar progresso</h2>
          <button onClick={onClose} className="text-text-muted hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="text-center">
          <div className="text-4xl mb-1">{goal.icon ?? '🎯'}</div>
          <div className="font-bold">{goal.title}</div>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-sm text-text-secondary block mb-2">
              Progresso atual ({goal.unit})
            </label>
            <input
              type="number"
              min="0"
              max={goal.target_value * 2}
              step="0.1"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="input w-full text-center text-2xl font-bold"
              autoFocus
            />
            <div className="text-center text-sm text-text-muted mt-1">
              de {goal.target_value} {goal.unit}
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-text-muted">Progresso</span>
              <span className="font-bold">{progress}%</span>
            </div>
            <div className="h-3 bg-bg-elevated rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-brand transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {progress >= 100 && (
            <div className="p-3 bg-brand-green/10 border border-brand-green/30 rounded-xl text-center text-sm text-brand-green">
              🎉 Meta alcançada! Será marcada como concluída.
            </div>
          )}

          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
