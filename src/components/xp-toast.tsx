'use client'

import { useEffect, useState } from 'react'

interface XpToast {
  id: number
  xp: number
  perfectDay?: boolean
  leveledUp?: number
}

let toastId = 0

export function useXpToast() {
  const [toasts, setToasts] = useState<XpToast[]>([])

  function showXp(xp: number, opts?: { perfectDay?: boolean; leveledUp?: number }) {
    if (xp <= 0) return
    const id = ++toastId
    setToasts((prev) => [...prev, { id, xp, ...opts }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 2500)
  }

  return { toasts, showXp }
}

export function XpToastContainer({ toasts }: { toasts: XpToast[] }) {
  if (toasts.length === 0) return null
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="bg-bg-card border border-brand-gold/40 rounded-xl px-4 py-2 flex items-center gap-2 animate-slide-up shadow-lg"
        >
          <span className="text-brand-gold font-bold text-sm animate-xp-bump">
            +{t.xp} XP
          </span>
          {t.perfectDay && (
            <span className="text-brand-gold text-xs">⭐ Dia Perfeito!</span>
          )}
          {t.leveledUp && (
            <span className="text-brand-purple text-xs font-bold">
              🎉 Level {t.leveledUp}!
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
