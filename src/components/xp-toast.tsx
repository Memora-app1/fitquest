'use client'

import { useState } from 'react'
import { Zap } from 'lucide-react'

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
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 2800)
  }

  return { toasts, showXp }
}

export function XpToastContainer({ toasts }: { toasts: XpToast[] }) {
  if (toasts.length === 0) return null
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2.5 pointer-events-none">
      {toasts.map((t) => (
        <XpToastItem key={t.id} toast={t} />
      ))}
    </div>
  )
}

function XpToastItem({ toast: t }: { toast: XpToast }) {
  if (t.leveledUp) {
    return (
      <div
        className="animate-slide-up rounded-2xl px-5 py-3 flex items-center gap-3 shadow-2xl shadow-brand-purple/40"
        style={{
          background: 'linear-gradient(135deg, #7C3AED22, #0D1829)',
          border: '1px solid rgba(124,58,237,0.5)',
        }}
      >
        <div className="text-2xl animate-xp-bump">🎉</div>
        <div>
          <div className="font-bold text-brand-purple leading-tight">Level {t.leveledUp}!</div>
          <div className="text-xs text-text-secondary">+{t.xp} XP</div>
        </div>
      </div>
    )
  }

  if (t.perfectDay) {
    return (
      <div
        className="animate-slide-up rounded-2xl px-5 py-3 flex items-center gap-3 shadow-2xl shadow-brand-gold/30"
        style={{
          background: 'linear-gradient(135deg, #F5C84222, #0D1829)',
          border: '1px solid rgba(245,200,66,0.5)',
        }}
      >
        <div className="text-2xl animate-xp-bump">⭐</div>
        <div>
          <div className="font-bold text-brand-gold leading-tight">Dia Perfeito!</div>
          <div className="text-xs text-text-secondary">+{t.xp} XP</div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="animate-slide-up rounded-2xl px-4 py-2.5 flex items-center gap-2.5 shadow-lg shadow-brand-gold/20"
      style={{
        background: 'rgba(13, 24, 41, 0.95)',
        border: '1px solid rgba(245, 200, 66, 0.35)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <Zap size={16} className="text-brand-gold shrink-0 animate-xp-bump" fill="currentColor" />
      <span className="heading-display text-lg text-brand-gold leading-none">
        +{t.xp}
      </span>
      <span className="text-sm text-text-secondary font-medium">XP</span>
    </div>
  )
}
