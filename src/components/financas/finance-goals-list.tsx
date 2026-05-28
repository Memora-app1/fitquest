'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, Trash2, PlusCircle, Trophy, TrendingUp, Calendar } from 'lucide-react'
import { formatBRL, calcPercentage } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { useXpToast, XpToastContainer } from '@/components/xp-toast'

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
  const { toasts, showXp } = useXpToast()

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
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} />
          Nova meta
        </button>
      </div>

      {goals.length === 0 ? (
        <div
          className="rounded-2xl p-12 text-center relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(245,200,66,0.05) 0%, rgba(13,24,41,0.98) 100%)',
            border: '1px solid rgba(245,200,66,0.15)',
          }}
        >
          <div
            className="absolute -top-8 -right-8 w-32 h-32 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(245,200,66,0.1) 0%, transparent 70%)' }}
          />
          <div className="text-5xl mb-4 relative z-10">🎯</div>
          <h3 className="text-xl font-bold mb-2 relative z-10">Nenhuma meta criada</h3>
          <p className="text-text-secondary mb-6 max-w-xs mx-auto relative z-10">
            Defina objetivos: viagem, reserva de emergência, comprar algo grande...
          </p>
          <button onClick={() => setShowCreate(true)} className="btn-primary relative z-10">
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
              <div className="flex items-center gap-2 mb-3">
                <Trophy size={16} className="text-brand-green" />
                <h2 className="text-lg font-bold text-brand-green">Metas Concluídas</h2>
              </div>
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
          onUpdate={(updated, xpEarned, leveledUp, newLevel) => {
            setGoals((prev) => prev.map((g) => (g.id === updated.id ? updated : g)))
            setShowContribute(null)
            if (xpEarned) {
              showXp(xpEarned, { leveledUp: leveledUp ? newLevel : undefined })
              if (leveledUp && newLevel) {
                window.dispatchEvent(new CustomEvent('ascendia:levelup', { detail: { level: newLevel } }))
              }
            }
            router.refresh()
          }}
        />
      )}
      <XpToastContainer toasts={toasts} />
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
  const isCompleted = goal.status === 'completed' || pct >= 100
  const accentColor = isCompleted ? '#00FF88' : pct >= 75 ? '#F5C842' : goal.color

  // Months remaining until deadline
  let monthsLeft: number | null = null
  if (goal.deadline) {
    const deadlineDate = new Date(goal.deadline + 'T00:00:00')
    const now = new Date()
    const diffMs = deadlineDate.getTime() - now.getTime()
    monthsLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24 * 30))
  }

  const remaining = Math.max(0, Number(goal.target_amount) - Number(goal.current_amount))
  const monthlyNeeded = monthsLeft && monthsLeft > 0 ? remaining / monthsLeft : null

  return (
    <div
      className="rounded-2xl p-5 relative overflow-hidden transition-all duration-200 hover:scale-[1.01]"
      style={{
        background: `linear-gradient(135deg, ${accentColor}0D 0%, rgba(13,24,41,0.98) 60%, rgba(13,24,41,0.98) 100%)`,
        border: `1px solid ${accentColor}30`,
        boxShadow: `0 4px 20px ${accentColor}08`,
      }}
    >
      {/* Corner glow */}
      <div
        className="absolute -top-6 -right-6 w-24 h-24 rounded-full pointer-events-none blur-xl"
        style={{ backgroundColor: accentColor, opacity: 0.08 }}
      />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
            style={{
              background: `${accentColor}15`,
              border: `1px solid ${accentColor}30`,
            }}
          >
            {goal.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold truncate">{goal.title}</h3>
              {isCompleted && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-bold flex items-center gap-1"
                  style={{ background: '#00FF8820', border: '1px solid #00FF8840', color: '#00FF88' }}
                >
                  <Trophy size={10} /> Concluída!
                </span>
              )}
              {!isCompleted && pct >= 75 && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-bold"
                  style={{ background: '#F5C84220', border: '1px solid #F5C84240', color: '#F5C842' }}
                >
                  Quase lá!
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-0.5 text-xs text-text-muted flex-wrap">
              {goal.deadline && (
                <span className="flex items-center gap-1">
                  <Calendar size={10} />
                  {new Date(goal.deadline + 'T00:00:00').toLocaleDateString('pt-BR')}
                  {monthsLeft !== null && monthsLeft > 0 && (
                    <span className="text-text-muted">({monthsLeft}m)</span>
                  )}
                  {monthsLeft !== null && monthsLeft <= 0 && (
                    <span className="text-brand-red">(venceu)</span>
                  )}
                </span>
              )}
              {goal.monthly_target && (
                <span className="flex items-center gap-1 text-brand-orange">
                  <TrendingUp size={10} />
                  {formatBRL(Number(goal.monthly_target))}/mês planejado
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {onContribute && goal.status === 'active' && (
              <button
                onClick={onContribute}
                className="p-2 rounded-lg transition-colors"
                style={{ color: accentColor }}
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

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium" style={{ color: accentColor }}>
              {formatBRL(Number(goal.current_amount))}
            </span>
            <span className="text-text-secondary">de {formatBRL(Number(goal.target_amount))}</span>
          </div>

          <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.min(100, pct)}%`,
                background: isCompleted
                  ? 'linear-gradient(90deg, #00FF88, #00CC6A)'
                  : pct >= 75
                  ? 'linear-gradient(90deg, #F5C842, #FF9500)'
                  : `linear-gradient(90deg, ${goal.color}, ${goal.color}CC)`,
              }}
            />
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="font-bold" style={{ color: accentColor }}>
              {pct}%
              {pct >= 100 && ' 🎉'}
            </span>
            {!isCompleted && remaining > 0 && (
              <span className="text-text-muted">
                falta {formatBRL(remaining)}
                {monthlyNeeded && monthlyNeeded > 0 && (
                  <span className="text-text-muted ml-1">
                    · {formatBRL(monthlyNeeded)}/mês necessário
                  </span>
                )}
              </span>
            )}
          </div>
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
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4 overflow-y-auto">
      <div
        className="w-full max-w-md p-6 space-y-4 my-8 animate-slide-up rounded-2xl relative overflow-hidden"
        style={{
          background: 'rgba(13,24,41,0.98)',
          border: '1px solid rgba(245,200,66,0.2)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
        }}
      >
        <div
          className="absolute -top-8 -right-8 w-32 h-32 rounded-full pointer-events-none blur-xl"
          style={{ background: 'rgba(245,200,66,0.08)' }}
        />
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-bold">Nova meta financeira</h2>
            <button onClick={onClose} className="text-text-muted hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors">
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
                    className="w-10 h-10 rounded-xl transition-all"
                    style={{
                      backgroundColor: c,
                      transform: color === c ? 'scale(1.15)' : 'scale(1)',
                      boxShadow: color === c ? `0 0 0 3px rgba(255,255,255,0.9), 0 0 12px ${c}60` : 'none',
                    }}
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
              <div className="text-brand-red text-sm bg-brand-red/10 border border-brand-red/20 rounded-xl p-3">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading || !title} className="btn-primary w-full">
              {loading ? 'Criando...' : '+ Criar meta'}
            </button>
          </form>
        </div>
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
  onUpdate: (updated: FinanceGoal, xpEarned?: number, leveledUp?: boolean, newLevel?: number) => void
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

    const data = await res.json() as { goal?: FinanceGoal; xpEarned?: number; leveledUp?: boolean; newLevel?: number }
    setLoading(false)
    if (res.ok && data.goal) onUpdate(data.goal, data.xpEarned, data.leveledUp, data.newLevel)
  }

  const remaining = Math.max(0, Number(goal.target_amount) - Number(goal.current_amount))
  const pct = calcPercentage(Number(goal.current_amount), Number(goal.target_amount))

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        className="w-full max-w-sm p-6 space-y-4 animate-slide-up rounded-2xl relative overflow-hidden"
        style={{
          background: 'rgba(13,24,41,0.98)',
          border: `1px solid ${goal.color}40`,
          boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
        }}
      >
        <div
          className="absolute -top-6 -right-6 w-24 h-24 rounded-full pointer-events-none blur-xl"
          style={{ backgroundColor: goal.color, opacity: 0.12 }}
        />
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span>{goal.icon}</span>
              <span>{goal.title}</span>
            </h2>
            <button onClick={onClose} className="text-text-muted hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors">
              <X size={20} />
            </button>
          </div>

          <div
            className="rounded-xl p-4 mb-4 text-center"
            style={{
              background: `${goal.color}10`,
              border: `1px solid ${goal.color}25`,
            }}
          >
            <div className="text-xs text-text-muted mb-1">Falta atingir</div>
            <div className="heading-display text-3xl" style={{ color: goal.color }}>{formatBRL(remaining)}</div>
            <div className="mt-2 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(100, pct)}%`,
                  backgroundColor: goal.color,
                }}
              />
            </div>
            <div className="text-xs text-text-muted mt-1.5">{pct}% guardado</div>
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
    </div>
  )
}
