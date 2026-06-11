'use client'

/**
 * DailyLoginReward — modal de recompensa de login diário.
 * Abre automaticamente uma vez por dia ao entrar no dashboard.
 * Ciclo de 7 dias com XP crescente. Dia 7 = loot box bônus.
 */

import { useState, useEffect, useCallback } from 'react'
import { Zap, X, Star, Gift } from 'lucide-react'
import { useXpToast, XpToastContainer } from '@/components/xp-toast'
import { useScrollLock } from '@/hooks/use-scroll-lock'

const DAY_REWARDS = [20, 30, 50, 75, 100, 150, 300]
const DAY_EMOJIS  = ['🌟', '⚡', '🔥', '💪', '🏆', '💎', '🎁']

const DISMISS_KEY = 'asc_login_reward_dismissed'

function wasDismissedToday(): boolean {
  try {
    return localStorage.getItem(DISMISS_KEY) === new Date().toISOString().split('T')[0]
  } catch { return false }
}

function markDismissedToday() {
  try { localStorage.setItem(DISMISS_KEY, new Date().toISOString().split('T')[0]!) } catch { /* noop */ }
}

export function DailyLoginReward() {
  const [open, setOpen] = useState(false)
  const [claiming, setClaiming] = useState(false)
  const [claimed, setClaimed] = useState(false)
  useScrollLock(open)
  const [data, setData] = useState<{
    loginStreak: number
    xpReward: number
    day: number
    isWeekComplete?: boolean
    leveledUp?: boolean
    newLevel?: number
  } | null>(null)
  const { toasts, showXp } = useXpToast()

  const check = useCallback(async () => {
    if (wasDismissedToday()) return
    try {
      const res = await fetch('/api/daily-reward')
      if (!res.ok) return
      const json = await res.json()
      if (!json.alreadyClaimed) {
        setData(json)
        setOpen(true)
      }
    } catch { /* silencioso */ }
  }, [])

  useEffect(() => {
    const t = setTimeout(check, 1200)
    return () => clearTimeout(t)
  }, [check])

  async function handleClaim() {
    if (claiming || claimed) return
    setClaiming(true)
    try {
      const res = await fetch('/api/daily-reward', { method: 'POST' })
      const json = await res.json()
      if (res.ok && !json.alreadyClaimed) {
        setData(json)
        setClaimed(true)
        showXp(json.xpReward ?? 0, { leveledUp: json.leveledUp ? json.newLevel : undefined })
        if (json.leveledUp && json.newLevel) {
          window.dispatchEvent(new CustomEvent('ascendia:levelup', { detail: { level: json.newLevel } }))
        }
      }
    } finally {
      setClaiming(false)
    }
  }

  function handleClose() {
    markDismissedToday()
    setOpen(false)
  }

  if (!open || !data) return <XpToastContainer toasts={toasts} />

  const day = data.day ?? 1
  const streak = data.loginStreak ?? 1
  const xp = data.xpReward ?? DAY_REWARDS[day - 1] ?? 20
  const emoji = DAY_EMOJIS[day - 1] ?? '🌟'
  const isWeek = data.isWeekComplete

  return (
    <>
      <XpToastContainer toasts={toasts} />
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
        <div
          className="w-full max-w-sm animate-slide-up rounded-3xl relative overflow-hidden"
          style={{
            background: isWeek
              ? 'linear-gradient(145deg, rgba(245,200,66,0.2) 0%, rgba(13,24,41,0.98) 50%, rgba(124,58,237,0.15) 100%)'
              : 'linear-gradient(145deg, rgba(124,58,237,0.15) 0%, rgba(13,24,41,0.98) 60%, rgba(255,77,0,0.08) 100%)',
            border: isWeek ? '1px solid rgba(245,200,66,0.4)' : '1px solid rgba(124,58,237,0.35)',
            boxShadow: isWeek ? '0 0 60px rgba(245,200,66,0.2)' : '0 0 40px rgba(124,58,237,0.15)',
          }}
        >
          {/* Glow top */}
          <div
            className="absolute -top-8 left-1/2 -translate-x-1/2 w-40 h-40 rounded-full pointer-events-none blur-3xl"
            style={{ background: isWeek ? 'rgba(245,200,66,0.3)' : 'rgba(124,58,237,0.25)' }}
          />

          {/* Close */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full flex items-center justify-center text-text-muted hover:text-white transition-colors"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          >
            <X size={14} />
          </button>

          <div className="relative z-10 p-7 text-center space-y-5">
            {/* Badge */}
            <div>
              <div
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-3"
                style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', color: '#9F5AF7' }}
              >
                <Star size={9} fill="currentColor" />
                {isWeek ? 'Semana Completa!' : 'Recompensa Diária'}
              </div>

              {/* Big emoji */}
              <div className="text-6xl mb-2 animate-bounce-in">{isWeek ? '🎁' : emoji}</div>

              <h2 className="text-xl font-black">
                {isWeek ? 'Semana perfeita! 🎉' : `Dia ${day} de 7`}
              </h2>
              <p className="text-text-secondary text-sm mt-1">
                {streak} dia{streak !== 1 ? 's' : ''} consecutivo{streak !== 1 ? 's' : ''}
              </p>
            </div>

            {/* 7-day dots */}
            <div className="flex items-center justify-center gap-2">
              {DAY_EMOJIS.map((e, i) => {
                const thisDay = i + 1
                const isPast    = thisDay < day
                const isCurrent = thisDay === day
                return (
                  <div
                    key={i}
                    className="flex flex-col items-center gap-1"
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-base transition-all"
                      style={{
                        background: isCurrent ? 'rgba(124,58,237,0.25)' : isPast ? 'rgba(0,255,136,0.15)' : 'rgba(255,255,255,0.04)',
                        border: isCurrent ? '2px solid rgba(124,58,237,0.6)' : isPast ? '1px solid rgba(0,255,136,0.3)' : '1px solid rgba(255,255,255,0.06)',
                        transform: isCurrent ? 'scale(1.1)' : 'scale(1)',
                        opacity: isPast ? 0.8 : isCurrent ? 1 : 0.45,
                      }}
                    >
                      {isPast ? '✓' : e}
                    </div>
                    <div className="text-[9px] text-text-muted font-bold">
                      +{DAY_REWARDS[i]}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* XP reward */}
            <div
              className="py-3 px-5 rounded-2xl flex items-center justify-center gap-3"
              style={{ background: 'rgba(245,200,66,0.08)', border: '1px solid rgba(245,200,66,0.2)' }}
            >
              {isWeek ? <Gift size={20} className="text-brand-gold" /> : <Zap size={20} className="text-brand-gold" fill="currentColor" />}
              <span className="text-2xl font-black text-brand-gold">+{xp} XP</span>
              {isWeek && <span className="text-xs text-text-muted">+ Loot Box</span>}
            </div>

            {/* CTA */}
            {claimed ? (
              <div className="flex items-center justify-center gap-2 text-brand-green font-bold py-2">
                ✓ Recompensa coletada!
              </div>
            ) : (
              <button
                onClick={handleClaim}
                disabled={claiming}
                className="w-full py-3.5 rounded-2xl font-black text-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
                style={{
                  background: 'linear-gradient(135deg, #7C3AED, #FF4D00)',
                  color: '#fff',
                  boxShadow: '0 4px 20px rgba(124,58,237,0.35)',
                }}
              >
                {claiming ? 'Coletando…' : '⚡ Coletar recompensa'}
              </button>
            )}

            {!claimed && (
              <button onClick={handleClose} className="text-xs text-text-muted hover:text-white transition-colors">
                Coletar depois
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
