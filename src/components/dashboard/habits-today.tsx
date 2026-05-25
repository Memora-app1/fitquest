'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Zap } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useXpToast, XpToastContainer } from '@/components/xp-toast'

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
  const [xpGainedToday, setXpGainedToday] = useState(0)
  const { toasts, showXp } = useXpToast()

  async function toggleHabit(habitId: string) {
    if (optimisticLogged.has(habitId) || isPending) return

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
        next.delete(habitId)
        setOptimisticLogged(new Set(next))
      } else {
        const data = await res.json() as {
          xpEarned?: number
          perfectDay?: boolean
          leveledUp?: boolean
          newLevel?: number
        }
        const earned = data.xpEarned ?? 0
        setXpGainedToday((prev) => prev + earned)
        showXp(earned, {
          perfectDay: data.perfectDay,
          leveledUp: data.leveledUp ? data.newLevel : undefined,
        })
        router.refresh()
      }
    })
  }

  const completedCount = optimisticLogged.size
  const total = habits.length
  const allDone = total > 0 && completedCount === total
  const progressPct = total > 0 ? Math.round((completedCount / total) * 100) : 0

  if (total === 0) {
    return (
      <div className="card p-6">
        <h2 className="font-bold text-lg mb-2">Hábitos de Hoje</h2>
        <p className="text-text-secondary text-sm mb-3">
          Você ainda não criou nenhum hábito.
        </p>
        <Link href="/habitos" className="text-brand-orange hover:underline text-sm font-medium">
          Criar primeiro hábito →
        </Link>
      </div>
    )
  }

  return (
    <>
      <XpToastContainer toasts={toasts} />
      <div className="card p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-lg">Hábitos de Hoje</h2>
          <div className="flex items-center gap-3">
            {xpGainedToday > 0 && (
              <span className="text-xs font-bold text-brand-gold flex items-center gap-1">
                <Zap size={11} /> +{xpGainedToday} XP
              </span>
            )}
            <span className={cn('text-sm font-medium', allDone ? 'text-brand-green' : 'text-text-secondary')}>
              {completedCount}/{total} {allDone && '⭐'}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="h-2 bg-bg-elevated rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                allDone ? 'bg-brand-green' : 'bg-gradient-brand'
              )}
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-text-muted">{progressPct}% completo</span>
            {!allDone && (
              <span className="text-xs text-text-muted">
                {total - completedCount} restante{total - completedCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
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
                  'w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left',
                  done
                    ? 'bg-brand-green/8 border-brand-green/25'
                    : 'bg-bg-elevated border-border hover:border-brand-orange/40 active:scale-[0.99]'
                )}
              >
                <div
                  className="text-xl w-10 h-10 flex items-center justify-center rounded-xl shrink-0 transition-all"
                  style={{ backgroundColor: `${habit.color}${done ? '30' : '18'}` }}
                >
                  {habit.icon}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className={cn('font-medium text-sm truncate', done && 'line-through text-text-muted')}>
                    {habit.name}
                  </div>
                  <div className="text-xs text-text-muted flex items-center gap-1">
                    <Zap size={9} /> +{habit.xp_per_completion} XP
                  </div>
                </div>
                <div
                  className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center transition-all shrink-0',
                    done
                      ? 'bg-brand-green text-bg scale-110'
                      : 'border-2 border-border hover:border-brand-green'
                  )}
                >
                  {done && <Check size={13} strokeWidth={3} />}
                </div>
              </button>
            )
          })}
        </div>

        {allDone && (
          <div className="mt-4 p-3 bg-brand-green/10 border border-brand-green/30 rounded-xl text-center">
            <div className="font-bold text-brand-green text-sm">⭐ Dia Perfeito!</div>
            <div className="text-xs text-text-secondary mt-0.5">+200 XP bônus creditado</div>
          </div>
        )}

        <Link
          href="/habitos"
          className="block text-center text-xs text-text-muted hover:text-brand-orange mt-3 transition-colors"
        >
          Gerenciar hábitos →
        </Link>
      </div>
    </>
  )
}
