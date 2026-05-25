'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { Check, Plus, X, Trash2, MoreVertical, Pencil } from 'lucide-react'
import { useXpToast, XpToastContainer } from '@/components/xp-toast'

interface Habit {
  id: string
  name: string
  icon: string
  color: string
  category: string
  xp_per_completion: number
  frequency_per_week: number
}

interface HabitLog {
  habit_id: string
  logged_date: string
}

const ICONS = ['💪', '🏃', '🧘', '💧', '📖', '🍎', '😴', '🎯', '⚡', '🔥', '✨', '🧠']
const COLORS = ['#FF4D00', '#7C3AED', '#00FF88', '#F5C842', '#3B82F6', '#EC4899']

export function HabitsList({
  habits: initialHabits,
  loggedToday,
  weekLogs,
  initialShowCreate = false,
}: {
  habits: Habit[]
  loggedToday: Set<string>
  weekLogs: HabitLog[]
  initialShowCreate?: boolean
}) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [habits, setHabits] = useState<Habit[]>(initialHabits)
  const [showCreate, setShowCreate] = useState(initialShowCreate)
  const [editHabit, setEditHabit] = useState<Habit | null>(null)
  const [optimistic, setOptimistic] = useState(loggedToday)
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const { toasts, showXp } = useXpToast()

  async function toggle(id: string) {
    if (optimistic.has(id)) return
    const next = new Set(optimistic)
    next.add(id)
    setOptimistic(next)

    startTransition(async () => {
      const res = await fetch('/api/habits/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ habitId: id }),
      })
      if (!res.ok) {
        next.delete(id)
        setOptimistic(new Set(next))
      } else {
        const data = await res.json()
        showXp(data.xpEarned ?? 0, {
          perfectDay: data.perfectDay,
          leveledUp: data.leveledUp ? data.newLevel : undefined,
        })
        router.refresh()
      }
    })
  }

  async function deleteHabit(id: string) {
    if (!confirm('Remover este hábito? O histórico de logs será mantido.')) return
    setDeletingId(id)
    setOpenMenu(null)
    const res = await fetch(`/api/habits?id=${id}`, { method: 'DELETE' })
    setDeletingId(null)
    if (res.ok) {
      setHabits((prev) => prev.filter((h) => h.id !== id))
    }
  }

  function getLast30Days(habitId: string): boolean[] {
    const out: boolean[] = []
    const logsByDate = new Set(
      weekLogs.filter((l) => l.habit_id === habitId).map((l) => l.logged_date)
    )
    for (let i = 29; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      out.push(logsByDate.has(d.toISOString().split('T')[0]!))
    }
    return out
  }

  if (habits.length === 0) {
    return (
      <>
        <div className="card p-8 text-center">
          <div className="text-4xl mb-3">🎯</div>
          <h3 className="text-xl font-bold mb-1">Nenhum hábito ainda</h3>
          <p className="text-text-secondary mb-4">Crie seu primeiro hábito pra começar a ganhar XP</p>
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            <Plus size={18} className="inline mr-1" /> Criar primeiro hábito
          </button>
        </div>
        {showCreate && (
          <CreateHabitModal
            onClose={() => setShowCreate(false)}
            onCreated={(h) => setHabits((prev) => [...prev, h])}
          />
        )}
      </>
    )
  }

  return (
    <>
      <XpToastContainer toasts={toasts} />
      <div className="flex justify-end">
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          <Plus size={18} className="inline mr-1" /> Novo hábito
        </button>
      </div>

      <div className="space-y-3">
        {habits.map((h) => {
          const done = optimistic.has(h.id)
          const last30 = getLast30Days(h.id)
          const streak30 = last30.filter(Boolean).length
          const isDeleting = deletingId === h.id

          return (
            <div key={h.id} className={cn('card p-4 transition-opacity', isDeleting && 'opacity-40')}>
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="text-2xl w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${h.color}20` }}
                >
                  {h.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold truncate">{h.name}</div>
                  <div className="text-xs text-text-muted flex items-center gap-2">
                    <span>{h.frequency_per_week}x/semana · +{h.xp_per_completion} XP</span>
                    {streak30 > 0 && (
                      <span className="text-brand-orange">🔥 {streak30}/30</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggle(h.id)}
                    disabled={done || isDeleting}
                    className={cn(
                      'px-3 py-1.5 rounded-xl font-medium transition-all text-sm',
                      done
                        ? 'bg-brand-green/20 text-brand-green'
                        : 'bg-gradient-brand text-white hover:opacity-90'
                    )}
                  >
                    {done ? (
                      <>
                        <Check size={14} className="inline" /> Feito
                      </>
                    ) : (
                      '+ Registrar'
                    )}
                  </button>

                  {/* More menu */}
                  <div className="relative">
                    <button
                      onClick={() => setOpenMenu(openMenu === h.id ? null : h.id)}
                      className="w-8 h-8 rounded-lg bg-bg-elevated flex items-center justify-center text-text-muted hover:text-white hover:bg-border transition-colors"
                    >
                      <MoreVertical size={14} />
                    </button>

                    {openMenu === h.id && (
                      <div className="absolute right-0 top-10 bg-bg-card border border-border rounded-xl shadow-xl z-20 w-40 overflow-hidden">
                        <button
                          onClick={() => { setEditHabit(h); setOpenMenu(null) }}
                          className="flex items-center gap-2 w-full px-4 py-3 text-sm hover:bg-bg-elevated transition-colors"
                        >
                          <Pencil size={14} className="text-brand-orange" />
                          Editar
                        </button>
                        <button
                          onClick={() => deleteHabit(h.id)}
                          className="flex items-center gap-2 w-full px-4 py-3 text-sm text-brand-red hover:bg-brand-red/10 transition-colors"
                        >
                          <Trash2 size={14} />
                          Remover
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Contribution graph dos últimos 30 dias */}
              <div className="flex gap-0.5">
                {last30.map((d, i) => (
                  <div
                    key={i}
                    className="flex-1 h-3 rounded-sm"
                    style={{ backgroundColor: d ? h.color : '#152238' }}
                    title={d ? 'Feito' : 'Não feito'}
                  />
                ))}
              </div>
              <div className="text-xs text-text-muted mt-1">Últimos 30 dias · {streak30} completados</div>
            </div>
          )
        })}
      </div>

      {/* Backdrop para fechar menus */}
      {openMenu && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setOpenMenu(null)}
        />
      )}

      {showCreate && (
        <CreateHabitModal
          onClose={() => setShowCreate(false)}
          onCreated={(h) => setHabits((prev) => [...prev, h])}
        />
      )}

      {editHabit && (
        <EditHabitModal
          habit={editHabit}
          onClose={() => setEditHabit(null)}
          onSaved={(updated) => {
            setHabits((prev) => prev.map((h) => h.id === updated.id ? updated : h))
            setEditHabit(null)
          }}
        />
      )}
    </>
  )
}

// ─── Create Modal ───────────────────────────────────────────────────────────

function CreateHabitModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: (habit: Habit) => void
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('💪')
  const [color, setColor] = useState('#FF4D00')
  const [freq, setFreq] = useState(4)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('habits')
      .insert({
        user_id: user.id,
        name,
        icon,
        color,
        category: 'custom',
        target_type: 'count',
        target_value: freq,
        target_period: 'week',
        target_unit: 'vez',
        frequency_per_week: freq,
        xp_per_completion: 50,
      })
      .select('id, name, icon, color, category, xp_per_completion, frequency_per_week')
      .single()

    if (data) onCreated(data)
    router.refresh()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end md:items-center justify-center p-4">
      <div className="card-glow w-full max-w-md p-6 space-y-4 animate-slide-up">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Novo hábito</h2>
          <button onClick={onClose} className="text-text-muted hover:text-white">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-sm text-text-secondary block mb-2">Nome</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Treinar, Beber água..."
              className="input w-full"
              maxLength={100}
            />
          </div>

          <div>
            <label className="text-sm text-text-secondary block mb-2">Ícone</label>
            <div className="flex gap-2 flex-wrap">
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

          <div>
            <label className="text-sm text-text-secondary block mb-2">
              Frequência: {freq}x/semana
            </label>
            <input
              type="range"
              min={1}
              max={7}
              value={freq}
              onChange={(e) => setFreq(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <button type="submit" disabled={loading || !name} className="btn-primary w-full">
            {loading ? 'Criando...' : 'Criar hábito'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── Edit Modal ──────────────────────────────────────────────────────────────

function EditHabitModal({
  habit,
  onClose,
  onSaved,
}: {
  habit: Habit
  onClose: () => void
  onSaved: (habit: Habit) => void
}) {
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState(habit.name)
  const [icon, setIcon] = useState(habit.icon)
  const [color, setColor] = useState(habit.color)
  const [freq, setFreq] = useState(habit.frequency_per_week)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const res = await fetch('/api/habits', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: habit.id, name, icon, color, frequency_per_week: freq }),
    })

    setLoading(false)
    if (res.ok) {
      onSaved({ ...habit, name, icon, color, frequency_per_week: freq })
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end md:items-center justify-center p-4">
      <div className="card-glow w-full max-w-md p-6 space-y-4 animate-slide-up">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Editar hábito</h2>
          <button onClick={onClose} className="text-text-muted hover:text-white">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-sm text-text-secondary block mb-2">Nome</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input w-full"
              maxLength={100}
            />
          </div>

          <div>
            <label className="text-sm text-text-secondary block mb-2">Ícone</label>
            <div className="flex gap-2 flex-wrap">
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

          <div>
            <label className="text-sm text-text-secondary block mb-2">
              Frequência: {freq}x/semana
            </label>
            <input
              type="range"
              min={1}
              max={7}
              value={freq}
              onChange={(e) => setFreq(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">
              Cancelar
            </button>
            <button type="submit" disabled={loading || !name} className="btn-primary flex-1">
              {loading ? 'Salvando...' : 'Salvar alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
