'use client'

import { useState, useEffect, useRef } from 'react'
import { Zap, TrendingUp } from 'lucide-react'

interface XpToast {
  id: number
  xp: number
  perfectDay?: boolean
  leveledUp?: number
  criticalHit?: boolean
  timestamp: number
}

const TOAST_DURATION = 3200
let toastId = 0

export function useXpToast() {
  const [toasts, setToasts] = useState<XpToast[]>([])

  function showXp(xp: number, opts?: { perfectDay?: boolean; leveledUp?: number; criticalHit?: boolean }) {
    if (xp <= 0) return
    const id = ++toastId
    const timestamp = Date.now()
    setToasts((prev) => [...prev, { id, xp, ...opts, timestamp }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), TOAST_DURATION + 400)
  }

  return { toasts, showXp }
}

export function XpToastContainer({ toasts }: { toasts: XpToast[] }) {
  if (toasts.length === 0) return null
  return (
    <div className="fixed bottom-36 right-4 md:bottom-8 md:right-6 z-50 flex flex-col-reverse gap-2.5 pointer-events-none">
      {toasts.map((t) => (
        <XpToastItem key={t.id} toast={t} />
      ))}
    </div>
  )
}

function useCountUp(target: number, duration = 600): number {
  const [value, setValue] = useState(0)
  const rafRef = useRef<number | null>(null)
  const startRef = useRef<number | null>(null)

  useEffect(() => {
    startRef.current = null
    function tick(timestamp: number) {
      if (!startRef.current) startRef.current = timestamp
      const elapsed = timestamp - startRef.current
      const progress = Math.min(elapsed / duration, 1)
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(eased * target))
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick)
      }
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [target, duration])

  return value
}

function ProgressBar({ duration }: { duration: number }) {
  const [width, setWidth] = useState(100)
  const rafRef = useRef<number | null>(null)
  const startRef = useRef<number | null>(null)

  useEffect(() => {
    startRef.current = null
    function tick(timestamp: number) {
      if (!startRef.current) startRef.current = timestamp
      const elapsed = timestamp - startRef.current
      const remaining = Math.max(0, 1 - elapsed / duration)
      setWidth(remaining * 100)
      if (remaining > 0) {
        rafRef.current = requestAnimationFrame(tick)
      }
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [duration])

  return (
    <div
      className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.06)' }}
    >
      <div
        className="h-full rounded-full"
        style={{
          width: `${width}%`,
          background: 'linear-gradient(90deg, rgba(245,200,66,0.8), rgba(255,77,0,0.8))',
          transition: 'width 0.1s linear',
        }}
      />
    </div>
  )
}

function XpToastItem({ toast: t }: { toast: XpToast }) {
  const [exiting, setExiting] = useState(false)
  const countedXp = useCountUp(t.xp, 500)

  useEffect(() => {
    const timer = setTimeout(() => setExiting(true), TOAST_DURATION - 100)
    return () => clearTimeout(timer)
  }, [])

  const baseStyle: React.CSSProperties = {
    transition: 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.25s ease',
    transform: exiting ? 'translateX(calc(100% + 1.5rem))' : 'translateX(0)',
    opacity: exiting ? 0 : 1,
  }

  if (t.leveledUp) {
    return (
      <div
        className="relative rounded-2xl px-5 py-3.5 flex items-center gap-3 shadow-2xl overflow-hidden"
        style={{
          ...baseStyle,
          background: 'linear-gradient(135deg, rgba(124,58,237,0.25) 0%, rgba(13,24,41,0.98) 100%)',
          border: '1px solid rgba(124,58,237,0.5)',
          boxShadow: '0 8px 32px rgba(124,58,237,0.3)',
          minWidth: 220,
        }}
      >
        {/* Glow pulse */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(circle at 20% 50%, rgba(124,58,237,0.15) 0%, transparent 70%)' }}
        />
        <div className="text-3xl animate-bounce relative z-10">🎉</div>
        <div className="relative z-10">
          <div className="font-black text-brand-purple leading-tight text-base">
            Level {t.leveledUp} desbloqueado!
          </div>
          <div className="text-xs text-text-secondary flex items-center gap-1 mt-0.5">
            <Zap size={10} fill="currentColor" className="text-brand-gold" />
            +{t.xp} XP desta ação
          </div>
        </div>
        <ProgressBar duration={TOAST_DURATION} />
      </div>
    )
  }

  if (t.criticalHit) {
    return (
      <div
        className="relative rounded-2xl px-5 py-3.5 flex items-center gap-3 shadow-2xl overflow-hidden"
        style={{
          ...baseStyle,
          background: 'linear-gradient(135deg, rgba(255,77,0,0.28) 0%, rgba(245,200,66,0.18) 50%, rgba(13,24,41,0.98) 100%)',
          border: '1px solid rgba(255,77,0,0.6)',
          boxShadow: '0 8px 32px rgba(255,77,0,0.35)',
          minWidth: 230,
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(circle at 10% 50%, rgba(255,77,0,0.18) 0%, transparent 60%)' }}
        />
        <div className="text-3xl relative z-10" style={{ animation: 'bounceIn 0.4s cubic-bezier(0.34,1.56,0.64,1)' }}>⚡</div>
        <div className="relative z-10">
          <div className="font-black text-brand-orange leading-tight text-base tracking-wide uppercase">
            Golpe Crítico!
          </div>
          <div className="text-xs text-brand-gold flex items-center gap-1 mt-0.5 font-bold">
            <Zap size={10} fill="currentColor" />
            +{t.xp} XP · 2× multiplicador
          </div>
        </div>
        <ProgressBar duration={TOAST_DURATION} />
      </div>
    )
  }

  if (t.perfectDay) {
    return (
      <div
        className="relative rounded-2xl px-5 py-3.5 flex items-center gap-3 shadow-2xl overflow-hidden"
        style={{
          ...baseStyle,
          background: 'linear-gradient(135deg, rgba(245,200,66,0.2) 0%, rgba(13,24,41,0.98) 100%)',
          border: '1px solid rgba(245,200,66,0.5)',
          boxShadow: '0 8px 32px rgba(245,200,66,0.25)',
          minWidth: 220,
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(circle at 20% 50%, rgba(245,200,66,0.12) 0%, transparent 70%)' }}
        />
        <div className="text-3xl animate-bounce relative z-10">⭐</div>
        <div className="relative z-10">
          <div className="font-black text-brand-gold leading-tight text-base">Dia Perfeito!</div>
          <div className="text-xs text-text-secondary flex items-center gap-1 mt-0.5">
            <Zap size={10} fill="currentColor" className="text-brand-gold" />
            +{t.xp} XP de bônus
          </div>
        </div>
        <ProgressBar duration={TOAST_DURATION} />
      </div>
    )
  }

  return (
    <div
      className="relative rounded-2xl overflow-hidden"
      style={{
        ...baseStyle,
        background: 'rgba(13,24,41,0.97)',
        border: '1px solid rgba(245,200,66,0.4)',
        backdropFilter: 'blur(16px)',
        boxShadow: '0 4px 24px rgba(245,200,66,0.15), 0 0 0 1px rgba(245,200,66,0.08) inset',
      }}
    >
      {/* Left accent bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
        style={{ background: 'linear-gradient(180deg, #F5C842, #FF4D00)' }}
      />

      <div className="flex items-center gap-3 px-4 pl-5 py-3">
        {/* Icon with glow */}
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 relative"
          style={{ background: 'rgba(245,200,66,0.12)', border: '1px solid rgba(245,200,66,0.25)' }}
        >
          <div
            className="absolute inset-0 rounded-xl blur-md"
            style={{ background: 'rgba(245,200,66,0.15)' }}
          />
          <Zap size={16} className="text-brand-gold relative z-10" fill="currentColor" />
        </div>

        {/* Count-up XP */}
        <div className="flex items-baseline gap-1">
          <span className="heading-display text-xl text-brand-gold leading-none">
            +{countedXp}
          </span>
          <span className="text-sm text-brand-gold/70 font-bold">XP</span>
        </div>

        {/* Trending indicator */}
        <TrendingUp size={13} className="text-brand-gold/50 ml-auto" />
      </div>

      <ProgressBar duration={TOAST_DURATION} />
    </div>
  )
}
