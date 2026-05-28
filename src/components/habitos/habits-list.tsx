'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { Check, Plus, X, Trash2, MoreVertical, Pencil, Flame, Zap } from 'lucide-react'
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
      weekLogs.filter((l) => l.habit_id === habitId).map((l) => l.logged_date),
    )
    for (let i = 29; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      out.push(logsByDate.has(d.toISOString().split('T')[0]!))
    }
    return out
  }

  // Compute consecutive streak from today backwards
  function getCurrentStreak(habitId: string): number {
    const logsByDate = new Set(
      weekLogs.filter((l) => l.habit_id === habitId).map((l) => l.logged_date),
    )
    let streak = 0
    const d = new Date()
    while (true) {
      const key = d.toISOString().split('T')[0]!
      if (!logsByDate.has(key)) break
      streak++
      d.setDate(d.getDate() - 1)
    }
    return streak
  }

  if (habits.length === 0) {
    return (
      <>
        <div
          className="rounded-2xl p-8 text-center relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(124,58,237,0.07) 0%, rgba(13,24,41,0.98) 100%)',
            border: '1px solid rgba(124,58,237,0.2)',
          }}
        >
          <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full pointer-events-none blur-xl" style={{ background: 'rgba(124,58,237,0.2)' }} />
          <div className="relative z-10">
            <div className="text-5xl mb-3">🎯</div>
            <h3 className="text-xl font-bold mb-1">Nenhum hábito ainda</h3>
            <p className="text-text-secondary mb-4">Crie seu primeiro hábito pra começar a ganhar XP</p>
            <button onClick={() => setShowCreate(true)} className="btn-primary">
              <Plus size={18} className="inline mr-1" /> Criar primeiro hábito
            </button>
          </div>
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
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Novo hábito
        </button>
      </div>

      <div className="space-y-3">
        {habits.map((h) => {
          const done = optimistic.has(h.id)
          const last30 = getLast30Days(h.id)
          const total30 = last30.filter(Boolean).length
          const currentStreak = getCurrentStreak(h.id)
          const isDeleting = deletingId === h.id
          const pct30 = Math.round((total30 / 30) * 100)

          return (
            <div
              key={h.id}
              className={cn(
                'rounded-2xl p-5 relative overflow-hidden transition-all',
                done && 'opacity-90',
                isDeleting && 'opacity-40',
              )}
              style={{
                background: done
                  ? `linear-gradient(135deg, ${h.color}10 0%, rgba(13,24,41,0.98) 100%)`
                  : 'rgba(13,24,41,0.8)',
                border: `1px solid ${done ? h.color + '40' : 'rgba(255,255,255,0.06)'}`,
                boxShadow: done ? `0 0 20px ${h.color}15` : 'none',
              }}
            >
              {/* Color glow top-right */}
              <div
                className="absolute -top-6 -right-6 w-24 h-24 rounded-full pointer-events-none blur-xl transition-opacity"
                style={{ backgroundColor: h.color, opacity: done ? 0.15 : 0.06 }}
              />

              <div className="relative z-10">
                {/* Top row: icon + name + actions */}
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="text-2xl w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all"
                    style={{
                      backgroundColor: done ? `${h.color}25` : `${h.color}15`,
                      border: `1px solid ${h.color}30`,
                    }}
                  >
                    {h.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold truncate flex items-center gap-2">
                      {h.name}
                      {done && (
                        <span
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider"
                          style={{ background: `${h.color}20`, color: h.color }}
                        >
                          ✓ Feito hoje
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-text-muted flex items-center gap-2 mt-0.5">
                      <span>{h.frequency_per_week}x/semana</span>
                      <span>·</span>
                      <span className="flex items-center gap-0.5 text-brand-gold">
                        <Zap size={10} fill="currentColor" />
                        +{h.xp_per_completion} XP
                      </span>
                      {currentStreak > 0 && (
                        <>
                          <span>·</span>
                          <span className="flex items-center gap-0.5 text-brand-orange">
                            <Flame size={10} />
                            {currentStreak} dias
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => toggle(h.id)}
                      disabled={done || isDeleting}
                      className={cn(
                        'px-3 py-1.5 rounded-xl font-semibold transition-all text-sm flex items-center gap-1.5',
                        done
                          ? 'cursor-default'
                          : 'hover:opacity-90 active:scale-95',
                      )}
                      style={
                        done
                          ? { background: `${h.color}20`, color: h.color }
                          : { background: h.color, color: '#050914' }
                      }
                    >
                      {done ? (
                        <>
                          <Check size={14} /> Feito
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
                            onClick={() => {
                              setEditHabit(h)
                              setOpenMenu(null)
                            }}
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

                {/* Contribution graph + stats */}
                <div className="space-y-1.5">
                  <div className="flex gap-0.5">
                    {last30.map((d, i) => (
                      <div
                        key={i}
                        className="flex-1 h-3 rounded-sm transition-all"
                        style={{
                          backgroundColor: d ? h.color : '#152238',
                          opacity: d ? (i > 24 ? 1 : i > 14 ? 0.85 : 0.7) : 1,
                        }}
                        title={d ? 'Feito' : 'Não feito'}
                      />
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-xs text-text-muted">
                    <span>30 dias atrás</span>
                    <div className="flex items-center gap-3">
                      <span>
                        <span style={{ color: h.color }} className="font-bold">{total30}</span>
                        /30 dias ·{' '}
                        <span
                          className="font-semibold"
                          style={{ color: pct30 >= 80 ? '#00FF88' : pct30 >= 50 ? '#F5C842' : '#FF4D00' }}
                        >
                          {pct30}%
                        </span>
                      </span>
                    </div>
                    <span>Hoje</span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Backdrop para fechar menus */}
      {openMenu && (
        <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />
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
            setHabits((prev) => prev.map((h) => (h.id === updated.id ? updated : h)))
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
  const [reminderTime, setReminderTime] = useState('')

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
        reminder_time: reminderTime ? reminderTime + ':00' : null,
      })
      .select('id, name, icon, color, category, xp_per_completion, frequency_per_week')
      .single()

    if (data) onCreated(data)
    router.refresh()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4">
      <div
        className="w-full max-w-md p-6 space-y-4 animate-slide-up rounded-2xl relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(255,77,0,0.08) 0%, rgba(13,24,41,0.99) 100%)',
          border: '1px solid rgba(255,77,0,0.25)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
        }}
      >
        <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full pointer-events-none blur-xl" style={{ background: 'rgba(255,77,0,0.15)' }} />
        <div className="flex items-center justify-between relative z-10">
          <h2 className="text-xl font-bold">Novo hábito</h2>
          <button onClick={onClose} className="text-text-muted hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-5">
          <div>
            <label className="text-sm text-text-secondary block mb-2">Nome do hábito</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Treinar, Beber água, Meditar..."
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
                    icon === i
                      ? 'ring-2 scale-110'
                      : 'bg-bg-elevated hover:bg-border',
                  )}
                  style={
                    icon === i
                      ? { background: `${color}20`, boxShadow: `0 0 0 2px ${color}` }
                      : {}
                  }
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
                  className="w-10 h-10 rounded-lg transition-all"
                  style={{
                    backgroundColor: c,
                    boxShadow: color === c ? `0 0 0 3px rgba(255,255,255,0.9), 0 0 12px ${c}60` : 'none',
                    transform: color === c ? 'scale(1.15)' : 'scale(1)',
                  }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm text-text-secondary block mb-2">
              Frequência:{' '}
              <span className="text-white font-bold">
                {freq === 7 ? 'Todo dia' : `${freq}x/semana`}
              </span>
            </label>
            <input
              type="range"
              min={1}
              max={7}
              value={freq}
              onChange={(e) => setFreq(Number(e.target.value))}
              className="w-full accent-brand-orange"
            />
            <div className="flex justify-between text-xs text-text-muted mt-1">
              <span>1x/sem</span>
              <span>Todo dia</span>
            </div>
          </div>

          {/* Reminder time (optional) */}
          <div>
            <label className="text-sm text-text-secondary block mb-2">
              Lembrete (opcional)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="input flex-1"
                style={{ colorScheme: 'dark' }}
              />
              {reminderTime && (
                <button
                  type="button"
                  onClick={() => setReminderTime('')}
                  className="text-text-muted hover:text-white transition-colors text-xs"
                >
                  Remover
                </button>
              )}
            </div>
            {reminderTime && (
              <p className="text-[11px] text-text-muted mt-1">
                🔔 Push às {reminderTime} se não logado ainda
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !name}
            className="btn-primary w-full"
          >
            {loading ? 'Criando...' : '+ Criar hábito'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── Edit Modal ──────────────────────────────────────────────────────────────

interface HabitWithReminder extends Habit {
  reminder_time?: string | null
}

function EditHabitModal({
  habit,
  onClose,
  onSaved,
}: {
  habit: HabitWithReminder
  onClose: () => void
  onSaved: (habit: HabitWithReminder) => void
}) {
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState(habit.name)
  const [icon, setIcon] = useState(habit.icon)
  const [color, setColor] = useState(habit.color)
  const [freq, setFreq] = useState(habit.frequency_per_week)
  // Converte 'HH:MM:00' → 'HH:MM' para o input type="time"
  const [reminderTime, setReminderTime] = useState(
    habit.reminder_time ? habit.reminder_time.slice(0, 5) : ''
  )

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const res = await fetch('/api/habits', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: habit.id,
        name,
        icon,
        color,
        frequency_per_week: freq,
        reminder_time: reminderTime || null,
      }),
    })

    setLoading(false)
    if (res.ok) {
      onSaved({ ...habit, name, icon, color, frequency_per_week: freq, reminder_time: reminderTime || null })
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4">
      <div
        className="w-full max-w-md p-6 space-y-4 animate-slide-up rounded-2xl relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(124,58,237,0.08) 0%, rgba(13,24,41,0.99) 100%)',
          border: '1px solid rgba(124,58,237,0.25)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
        }}
      >
        <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full pointer-events-none blur-xl" style={{ background: 'rgba(124,58,237,0.15)' }} />
        <div className="flex items-center justify-between relative z-10">
          <h2 className="text-xl font-bold">Editar hábito</h2>
          <button onClick={onClose} className="text-text-muted hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-5">
          <div>
            <label className="text-sm text-text-secondary block mb-2">Nome do hábito</label>
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
                    icon === i ? 'scale-110' : 'bg-bg-elevated hover:bg-border',
                  )}
                  style={
                    icon === i
                      ? { background: `${color}20`, boxShadow: `0 0 0 2px ${color}` }
                      : {}
                  }
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
                  className="w-10 h-10 rounded-lg transition-all"
                  style={{
                    backgroundColor: c,
                    boxShadow: color === c ? `0 0 0 3px rgba(255,255,255,0.9), 0 0 12px ${c}60` : 'none',
                    transform: color === c ? 'scale(1.15)' : 'scale(1)',
                  }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm text-text-secondary block mb-2">
              Frequência:{' '}
              <span className="text-white font-bold">
                {freq === 7 ? 'Todo dia' : `${freq}x/semana`}
              </span>
            </label>
            <input
              type="range"
              min={1}
              max={7}
              value={freq}
              onChange={(e) => setFreq(Number(e.target.value))}
              className="w-full accent-brand-orange"
            />
            <div className="flex justify-between text-xs text-text-muted mt-1">
              <span>1x/sem</span>
              <span>Todo dia</span>
            </div>
          </div>

          {/* Reminder time (optional) */}
          <div>
            <label className="text-sm text-text-secondary block mb-2">
              Lembrete (opcional)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="input flex-1"
                style={{ colorScheme: 'dark' }}
              />
              {reminderTime && (
                <button
                  type="button"
                  onClick={() => setReminderTime('')}
                  className="text-text-muted hover:text-white transition-colors text-xs"
                >
                  Remover
                </button>
              )}
            </div>
            {reminderTime && (
              <p className="text-[11px] text-text-muted mt-1">
                🔔 Push às {reminderTime} se não logado ainda
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">
              Cancelar
            </button>
            <button type="submit" disabled={loading || !name} className="btn-primary flex-1">
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
