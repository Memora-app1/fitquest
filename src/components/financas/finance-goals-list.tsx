'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, Trash2, PlusCircle } from 'lucide-react'
import { formatBRL, calcPercentage } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface FinanceGoal {
  id: string
  title: string
  icon: string
  color: string
  target_amount: number
  current_amount: number
  deadline: string | null
  monthly_target: number | null
  status: string
}

const ICONS = ['🎯', '✈️', '🏠', '🚗', '💍', '📱', '🏋️', '💰', '🎓', '🛟', '🌴', '🎮']
const COLORS = ['#00FF88', '#FF4D00', '#7C3AED', '#F5C842', '#3B82F6', '#EC4899']

export function FinanceGoalsList({ initialGoals }: { initialGoals: FinanceGoal[] }) {
  const router = useRouter()
  const [goals, setGoals] = useState<FinanceGoal[]>(initialGoals)
  const [showCreate, setShowCreate] = useState(false)
  const [showContribute, setShowContribute] = useState<FinanceGoal | null>(null)

  async function handleDelete(id: string) {
    if (!confirm('Remover esta meta?')) return
    const res = await fetch(`/api/finance-goals?id=${id}`, { method: 'DELETE' })
    if (res.ok) {
      setGoals((prev) => prev.filter((g) => g.id !== id))
    }
  }

  const activeGoals = goals.filter((g) => g.status === 'active')
  const completedGoals = goals.filter((g) => g.status === 'completed')

  return (
    <>
      <div className="flex justify-end">
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          <Plus size={18} className="inline mr-1" /> Nova meta
        </button>
      </div>

      {goals.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-4xl mb-3">🎯</div>
          <h3 className="text-xl font-bold mb-1">Nenhuma meta criada</h3>
          <p className="text-text-secondary mb-4">
            Defina objetivos: viagem, reserva de emergência, comprar algo grande...
          </p>
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            + Criar primeira meta
          </button>
        </div>
      ) : (
        <>
          {activeGoals.length > 0 && (
            <section className="space-y-3">
              {activeGoals.map((g) => (
                <GoalCard
                  key={g.id}
                  goal={g}
                  onContribute={() => setShowContribute(g)}
                  onDelete={() => handleDelete(g.id)}
                />
              ))}
            </section>
          )}

          {completedGoals.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-brand-green mb-3">✅ Metas Concluídas</h2>
              <div className="space-y-3 opacity-70">
                {completedGoals.map((g) => (
                  <GoalCard
                    key={g.id}
                    goal={g}
                    onDelete={() => handleDelete(g.id)}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {showCreate && (
        <CreateGoalModal
          onClose={() => setShowCreate(false)}
          onCreate={(newGoal) => {
            setGoals((prev) => [newGoal, ...prev])
            setShowCreate(false)
          }}
        />
      )}

      {showContribute && (
        <ContributeModal
          goal={showContribute}
          onClose={() => setShowContribute(null)}
          onUpdate={(updated) => {
            setGoals((prev) => prev.map((g) => (g.id === updated.id ? updated : g)))
            setShowContribute(null)
            router.refresh()
          }}
        />
      )}
    </>
  )
}

function GoalCard({
  goal,
  onContribute,
  onDelete,
}: {
  goal: FinanceGoal
  onContribute?: () => void
  onDelete: () => void
}) {
  const pct = calcPercentage(Number(goal.current_amount), Number(goal.target_amount))

  return (
    <div className="card p-5">
      <div className="flex items-start gap-3 mb-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
          style={{ backgroundColor: `${goal.color}20` }}
        >
          {goal.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold truncate">{goal.title}</h3>
          {goal.deadline && (
            <div className="text-xs text-text-muted">
              Prazo: {new Date(goal.deadline + 'T00:00:00').toLocaleDateString('pt-BR')}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {onContribute && goal.status === 'active' && (
            <button
              onClick={onContribute}
              className="p-2 rounded-lg text-brand-green hover:bg-brand-green/10 transition-colors"
              title="Adicionar valor"
            >
              <PlusCircle size={18} />
            </button>
          )}
          <button
            onClick={onDelete}
            className="p-2 rounded-lg text-text-muted hover:text-brand-red hover:bg-brand-red/10 transition-colors"
            title="Remover meta"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-text-secondary font-medium">{formatBRL(Number(goal.current_amount))}</span>
          <span className="font-bold">{formatBRL(Number(goal.target_amount))}</span>
        </div>
        <div className="h-3 bg-bg-elevated rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, backgroundColor: goal.color }}
          />
        </div>
        <div className="flex justify-between text-xs">
          <span className={cn('font-medium', pct >= 100 ? 'text-brand-green' : 'text-text-muted')}>
            {pct}% {pct >= 100 && '🎉'}
          </span>
          {goal.monthly_target && (
            <span className="text-brand-orange">
              {formatBRL(Number(goal.monthly_target))}/mês
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function CreateGoalModal({
  onClose,
  onCreate,
}: {
  onClose: () => void
  onCreate: (goal: FinanceGoal) => void
}) {
  const [title, setTitle] = useState('')
  const [icon, setIcon] = useState('🎯')
  const [color, setColor] = useState('#00FF88')
  const [targetAmount, setTargetAmount] = useState('')
  const [currentAmount, setCurrentAmount] = useState('')
  const [deadline, setDeadline] = useState('')
  const [monthlyTarget, setMonthlyTarget] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const target = parseFloat(targetAmount)
    if (!target || target <= 0) {
      setError('Informe um valor alvo válido.')
      return
    }

    setLoading(true)
    const res = await fetch('/api/finance-goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: title.trim(),
        icon,
        color,
        target_amount: target,
        current_amount: parseFloat(currentAmount) || 0,
        deadline: deadline || null,
        monthly_target: parseFloat(monthlyTarget) || null,
      }),
    })

    const data = await res.json() as { goal?: FinanceGoal; error?: string }
    setLoading(false)

    if (!res.ok || !data.goal) {
      setError('Erro ao criar meta. Tente novamente.')
      return
    }

    onCreate(data.goal)
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end md:items-center justify-center p-4 overflow-y-auto">
      <div className="card-glow w-full max-w-md p-6 space-y-4 my-8 animate-slide-up">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Nova meta financeira</h2>
          <button onClick={onClose} className="text-text-muted hover:text-white">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-sm text-text-secondary block mb-2">Título</label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Viagem para Europa, Reserva de emergência..."
              className="input w-full"
            />
          </div>

          <div>
            <label className="text-sm text-text-secondary block mb-2">Ícone</label>
            <div className="flex flex-wrap gap-2">
              {ICONS.map((i) => (
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

          <div>
            <label className="text-sm text-text-secondary block mb-2">Cor</label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    'w-10 h-10 rounded-lg transition-all',
                    color === c && 'ring-2 ring-white scale-110'
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-text-secondary block mb-2">Valor alvo (R$) *</label>
              <input
                required
                type="number"
                step="0.01"
                min="1"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                placeholder="0,00"
                className="input w-full"
              />
            </div>
            <div>
              <label className="text-sm text-text-secondary block mb-2">Já tenho (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={currentAmount}
                onChange={(e) => setCurrentAmount(e.target.value)}
                placeholder="0,00"
                className="input w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-text-secondary block mb-2">Prazo</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="input w-full"
              />
            </div>
            <div>
              <label className="text-sm text-text-secondary block mb-2">Meta mensal (R$)</label>
              <input
                type="number"
                step="0.01"
                min="1"
                value={monthlyTarget}
                onChange={(e) => setMonthlyTarget(e.target.value)}
                placeholder="0,00"
                className="input w-full"
              />
            </div>
          </div>

          {error && (
            <div className="text-brand-red text-sm bg-brand-red/10 border border-brand-red/20 rounded-lg p-3">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading || !title} className="btn-primary w-full">
            {loading ? 'Criando...' : '+ Criar meta'}
          </button>
        </form>
      </div>
    </div>
  )
}

function ContributeModal({
  goal,
  onClose,
  onUpdate,
}: {
  goal: FinanceGoal
  onClose: () => void
  onUpdate: (updated: FinanceGoal) => void
}) {
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const add = parseFloat(amount)
    if (!add || add <= 0) return

    setLoading(true)
    const newAmount = Number(goal.current_amount) + add

    const res = await fetch('/api/finance-goals', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: goal.id, current_amount: newAmount }),
    })

    const data = await res.json() as { goal?: FinanceGoal }
    setLoading(false)
    if (res.ok && data.goal) onUpdate(data.goal)
  }

  const remaining = Math.max(0, Number(goal.target_amount) - Number(goal.current_amount))

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="card-glow w-full max-w-sm p-6 space-y-4 animate-slide-up">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">
            {goal.icon} {goal.title}
          </h2>
          <button onClick={onClose} className="text-text-muted hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="card p-3 text-center">
          <div className="text-xs text-text-muted mb-1">Falta atingir</div>
          <div className="heading-display text-3xl text-brand-green">{formatBRL(remaining)}</div>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="text-sm text-text-secondary block mb-2">Quanto você guardou agora? (R$)</label>
            <input
              required
              autoFocus
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
              className="input w-full text-xl heading-display text-center"
            />
          </div>
          <button type="submit" disabled={loading || !amount} className="btn-primary w-full">
            {loading ? 'Salvando...' : '💰 Adicionar ao progresso'}
          </button>
        </form>
      </div>
    </div>
  )
}
