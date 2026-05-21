'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Habit {
  id: string
  name: string
  icon: string
  color: string
  xp_per_completion: number
}

export function HabitsToday({
  habits,
  loggedToday,
}: {
  habits: Habit[]
  loggedToday: Set<string>
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [optimisticLogged, setOptimisticLogged] = useState(loggedToday)

  async function toggleHabit(habitId: string) {
    if (optimisticLogged.has(habitId)) return // não permite desfazer

    // Optimistic update
    const next = new Set(optimisticLogged)
    next.add(habitId)
    setOptimisticLogged(next)

    startTransition(async () => {
      const res = await fetch('/api/habits/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ habitId }),
      })

      if (!res.ok) {
        // Rollback se erro
        next.delete(habitId)
        setOptimisticLogged(new Set(next))
      } else {
        router.refresh()
      }
    })
  }

  const completedCount = optimisticLogged.size
  const total = habits.length
  const allDone = total > 0 && completedCount === total

  if (total === 0) {
    return (
      <div className="card p-6">
        <h2 className="font-bold text-lg mb-2">Hábitos de Hoje</h2>
        <p className="text-text-secondary text-sm">
          Você ainda não criou nenhum hábito.
        </p>
        <a
          href="/habitos"
          className="text-brand-orange hover:underline text-sm font-medium mt-2 inline-block"
        >
          Criar primeiro hábito →
        </a>
      </div>
    )
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-lg">Hábitos de Hoje</h2>
        <span
          className={cn(
            'text-sm font-medium',
            allDone ? 'text-brand-green' : 'text-text-secondary'
          )}
        >
          {completedCount}/{total} {allDone && '⭐'}
        </span>
      </div>

      <div className="space-y-2">
        {habits.map((habit) => {
          const done = optimisticLogged.has(habit.id)
          return (
            <button
              key={habit.id}
              onClick={() => toggleHabit(habit.id)}
              disabled={done || isPending}
              className={cn(
                'w-full flex items-center gap-3 p-3 rounded-xl border transition-all',
                done
                  ? 'bg-brand-green/10 border-brand-green/30'
                  : 'bg-bg-elevated border-border hover:border-brand-orange/40'
              )}
            >
              <div
                className="text-2xl w-10 h-10 flex items-center justify-center rounded-lg shrink-0"
                style={{ backgroundColor: `${habit.color}20` }}
              >
                {habit.icon}
              </div>
              <div className="flex-1 text-left">
                <div className={cn('font-medium', done && 'line-through text-text-muted')}>
                  {habit.name}
                </div>
                <div className="text-xs text-text-muted">+{habit.xp_per_completion} XP</div>
              </div>
              <div
                className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center transition-all',
                  done
                    ? 'bg-brand-green text-bg'
                    : 'border-2 border-border'
                )}
              >
                {done && <Check size={14} strokeWidth={3} />}
              </div>
            </button>
          )
        })}
      </div>

      {allDone && (
        <div className="mt-4 p-3 bg-brand-green/10 border border-brand-green/30 rounded-xl text-center text-sm">
          ⭐ <strong>Dia Perfeito!</strong> +200 XP bônus
        </div>
      )}
    </div>
  )
}
