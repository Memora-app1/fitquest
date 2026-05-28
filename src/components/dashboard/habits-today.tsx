'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Zap, Target } from 'lucide-react'
import Link from 'next/link'
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
        if (data.leveledUp && data.newLevel) {
          window.dispatchEvent(new CustomEvent('fitquest:levelup', { detail: { level: data.newLevel } }))
        }
        router.refresh()
      }
    })
  }

  const completedCount = optimisticLogged.size
  const total = habits.length
  const allDone = total > 0 && completedCount === total
  const progressPct = total > 0 ? Math.round((completedCount / total) * 100) : 0

  const accentColor = allDone ? '#00FF88' : progressPct >= 50 ? '#FF4D00' : '#7C3AED'
  const accentRgb = allDone ? '0,255,136' : progressPct >= 50 ? '255,77,0' : '124,58,237'

  if (total === 0) {
    return (
      <div
        className="rounded-2xl p-6 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(124,58,237,0.07) 0%, rgba(13,24,41,0.98) 100%)',
          border: '1px solid rgba(124,58,237,0.2)',
        }}
      >
        <div
          className="absolute -top-4 -right-4 w-16 h-16 rounded-full pointer-events-none blur-xl"
          style={{ background: 'rgba(124,58,237,0.15)' }}
        />
        <div className="relative z-10">
          <h2 className="font-bold text-lg mb-2">Hábitos de Hoje</h2>
          <p className="text-text-secondary text-sm mb-3">
            Você ainda não criou nenhum hábito.
          </p>
          <Link href="/habitos" className="text-brand-orange hover:underline text-sm font-medium">
            Criar primeiro hábito →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <>
      <XpToastContainer toasts={toasts} />
      <div
        className="rounded-2xl p-6 relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, rgba(${accentRgb},0.07) 0%, rgba(13,24,41,0.98) 100%)`,
          border: `1px solid rgba(${accentRgb},0.2)`,
          transition: 'background 0.5s ease, border-color 0.5s ease',
        }}
      >
        {/* Corner glow */}
        <div
          className="absolute -top-4 -right-4 w-20 h-20 rounded-full pointer-events-none blur-xl"
          style={{ background: `rgba(${accentRgb},0.15)`, transition: 'background 0.5s ease' }}
        />

        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target size={16} style={{ color: accentColor }} />
              <h2 className="font-bold text-lg">Hábitos de Hoje</h2>
            </div>
            <div className="flex items-center gap-3">
              {xpGainedToday > 0 && (
                <span
                  className="text-xs font-bold flex items-center gap-1 px-2 py-1 rounded-lg"
                  style={{ background: 'rgba(245,200,66,0.12)', color: '#F5C842' }}
                >
                  <Zap size={10} fill="currentColor" /> +{xpGainedToday} XP
                </span>
              )}
              <span
                className="text-sm font-bold px-2 py-1 rounded-lg"
                style={{
                  background: `rgba(${accentRgb},0.12)`,
                  color: accentColor,
                }}
              >
                {completedCount}/{total} {allDone && '⭐'}
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mb-4">
            <div
              className="h-2 rounded-full overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.06)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progressPct}%`,
                  background: allDone
                    ? 'linear-gradient(90deg, #00FF88, #00CC6A)'
                    : progressPct >= 50
                    ? 'linear-gradient(90deg, #FF4D00, #F59E0B)'
                    : 'linear-gradient(90deg, #7C3AED, #FF4D00)',
                  boxShadow: progressPct > 0 ? `0 0 8px rgba(${accentRgb},0.5)` : 'none',
                }}
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
                  className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all hover:scale-[1.01]"
                  style={{
                    background: done
                      ? `${habit.color}12`
                      : 'rgba(255,255,255,0.04)',
                    border: done
                      ? `1px solid ${habit.color}35`
                      : '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <div
                    className="text-xl w-10 h-10 flex items-center justify-center rounded-xl shrink-0 transition-all"
                    style={{ backgroundColor: `${habit.color}${done ? '30' : '18'}` }}
                  >
                    {habit.icon}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div
                      className="font-medium text-sm truncate"
                      style={{
                        textDecoration: done ? 'line-through' : 'none',
                        color: done ? '#8899BB' : '#fff',
                      }}
                    >
                      {habit.name}
                    </div>
                    <div className="text-xs text-text-muted flex items-center gap-1">
                      <Zap size={9} fill="currentColor" style={{ color: '#F5C842' }} />
                      <span>+{habit.xp_per_completion} XP</span>
                    </div>
                  </div>
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center transition-all shrink-0"
                    style={
                      done
                        ? { background: '#00FF88', transform: 'scale(1.1)' }
                        : { border: '2px solid rgba(255,255,255,0.15)' }
                    }
                  >
                    {done && <Check size={13} strokeWidth={3} style={{ color: '#050914' }} />}
                  </div>
                </button>
              )
            })}
          </div>

          {allDone && (
            <div
              className="mt-4 p-3 rounded-xl text-center"
              style={{ background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.3)' }}
            >
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
      </div>
    </>
  )
}
