'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { Check, Plus, X } from 'lucide-react'

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
  habits,
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
  const [showCreate, setShowCreate] = useState(initialShowCreate)
  const [optimistic, setOptimistic] = useState(loggedToday)

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
      } else router.refresh()
    })
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
        {showCreate && <CreateHabitModal onClose={() => setShowCreate(false)} />}
      </>
    )
  }

  return (
    <>
      <div className="flex justify-end">
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          <Plus size={18} className="inline mr-1" /> Novo hábito
        </button>
      </div>

      <div className="space-y-3">
        {habits.map((h) => {
          const done = optimistic.has(h.id)
          const last30 = getLast30Days(h.id)
          return (
            <div key={h.id} className="card p-4">
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="text-2xl w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${h.color}20` }}
                >
                  {h.icon}
                </div>
                <div className="flex-1">
                  <div className="font-bold">{h.name}</div>
                  <div className="text-xs text-text-muted">
                    {h.frequency_per_week}x/semana · +{h.xp_per_completion} XP
                  </div>
                </div>
                <button
                  onClick={() => toggle(h.id)}
                  disabled={done}
                  className={cn(
                    'px-4 py-2 rounded-xl font-medium transition-all',
                    done
                      ? 'bg-brand-green/20 text-brand-green'
                      : 'bg-gradient-brand text-white hover:opacity-90'
                  )}
                >
                  {done ? (
                    <>
                      <Check size={16} className="inline" /> Feito
                    </>
                  ) : (
                    '+ Registrar'
                  )}
                </button>
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
              <div className="text-xs text-text-muted mt-1">Últimos 30 dias</div>
            </div>
          )
        })}
      </div>

      {showCreate && <CreateHabitModal onClose={() => setShowCreate(false)} />}
    </>
  )
}

function CreateHabitModal({ onClose }: { onClose: () => void }) {
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
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('habits').insert({
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
