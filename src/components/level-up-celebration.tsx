'use client'

/**
 * LevelUpCelebration — Overlay cinematográfico de tela cheia ao subir de nível.
 *
 * Uso: qualquer componente client dispara com:
 *   window.dispatchEvent(new CustomEvent('ascendia:levelup', { detail: { level: N } }))
 *
 * O componente vive em AppShell e escuta o evento globalmente.
 * Auto-dismiss após 6 segundos.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { X, Zap, Star, TrendingUp } from 'lucide-react'
import { getLevelInfo, LEVELS } from '@/lib/xp'

// ─── Confetti config ─────────────────────────────────────────────────────────
const CONFETTI_COLORS = [
  '#FF4D00', '#F5C842', '#7C3AED', '#00FF88',
  '#00D9FF', '#EC4899', '#FFFFFF', '#FFB347',
]
const CONFETTI_COUNT = 60

interface ConfettiPiece {
  id: number
  left: number
  color: string
  delay: number
  duration: number
  size: number
  rotation: number
  shape: 'square' | 'circle' | 'rect'
}

function generateConfetti(): ConfettiPiece[] {
  return Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
    id: i,
    left: Math.random() * 105 - 2.5,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)]!,
    delay: Math.random() * 1.2,
    duration: 2.0 + Math.random() * 2.0,
    size: 5 + Math.random() * 9,
    rotation: Math.random() * 360,
    shape: (['square', 'circle', 'rect'] as const)[Math.floor(Math.random() * 3)]!,
  }))
}

// ─── Animated counter hook ────────────────────────────────────────────────────
function useCountUp(target: number, duration = 1200): number {
  const [value, setValue] = useState(0)
  const rafRef = useRef<number | null>(null)
  const startRef = useRef<number | null>(null)

  useEffect(() => {
    startRef.current = null
    setValue(0)

    function tick(ts: number) {
      if (!startRef.current) startRef.current = ts
      const elapsed = ts - startRef.current
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(eased * target))
      if (progress < 1) rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [target, duration])

  return value
}

// ─── Countdown progress bar ───────────────────────────────────────────────────
function DismissCountdown({ duration, onDismiss }: { duration: number; onDismiss: () => void }) {
  const [width, setWidth] = useState(100)
  const rafRef = useRef<number | null>(null)
  const startRef = useRef<number | null>(null)

  useEffect(() => {
    startRef.current = null
    function tick(ts: number) {
      if (!startRef.current) startRef.current = ts
      const elapsed = ts - startRef.current
      const remaining = Math.max(0, 1 - elapsed / duration)
      setWidth(remaining * 100)
      if (remaining > 0) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        onDismiss()
      }
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [duration, onDismiss])

  return (
    <div
      className="absolute bottom-0 left-0 right-0 h-1 rounded-b-3xl overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.08)' }}
    >
      <div
        className="h-full rounded-b-3xl"
        style={{
          width: `${width}%`,
          background: 'linear-gradient(90deg, #7C3AED, #FF4D00)',
          transition: 'width 0.1s linear',
        }}
      />
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
interface LevelUpData {
  level: number
  title: string
  emoji: string
  minXp: number
}

const LEVEL_MESSAGES: Record<number, string> = {
  2: 'Você está apenas começando. Continue assim!',
  3: 'Consistência é a sua nova superpotência.',
  4: 'Você pensa diferente. Age diferente. Evolui.',
  5: 'Poucos chegam aqui. Você é um Guerreiro.',
  6: 'Você está no grupo dos 5% mais consistentes.',
  7: 'Lendário. Literalmente.',
  8: '👑 Ascendia Master. Não existe nível acima disso.',
}

export function LevelUpCelebration() {
  const [celebration, setCelebration] = useState<LevelUpData | null>(null)
  const [confetti] = useState<ConfettiPiece[]>(generateConfetti)
  const [dismissing, setDismissing] = useState(false)
  const [visible, setVisible] = useState(false)

  const dismiss = useCallback(() => {
    setDismissing(true)
    setTimeout(() => {
      setCelebration(null)
      setDismissing(false)
      setVisible(false)
    }, 450)
  }, [])

  useEffect(() => {
    function handleLevelUp(e: Event) {
      const ce = e as CustomEvent<{ level: number }>
      const info = getLevelInfo(ce.detail.level)
      setCelebration({
        level: ce.detail.level,
        title: info.title,
        emoji: info.emoji,
        minXp: info.minXp,
      })
      setDismissing(false)
      setTimeout(() => setVisible(true), 10)
    }
    window.addEventListener('ascendia:levelup', handleLevelUp)
    return () => window.removeEventListener('ascendia:levelup', handleLevelUp)
  }, [])

  const displayLevel = useCountUp(celebration?.level ?? 0, 1000)

  if (!celebration) return null

  const message = LEVEL_MESSAGES[celebration.level] ?? 'Você subiu de nível. Continue evoluindo!'

  // Accent colors per level tier
  const levelColor =
    celebration.level >= 8 ? '#F5C842' :
    celebration.level >= 7 ? '#F5C842' :
    celebration.level >= 6 ? '#EC4899' :
    celebration.level >= 5 ? '#FF4D00' :
    celebration.level >= 4 ? '#00FF88' :
    celebration.level >= 3 ? '#3B82F6' :
    '#7C3AED'

  const levelRgb =
    celebration.level >= 8 ? '245,200,66' :
    celebration.level >= 7 ? '245,200,66' :
    celebration.level >= 6 ? '236,72,153' :
    celebration.level >= 5 ? '255,77,0' :
    celebration.level >= 4 ? '0,255,136' :
    celebration.level >= 3 ? '59,130,246' :
    '124,58,237'

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{
        background: 'rgba(5,9,20,0.90)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        opacity: visible && !dismissing ? 1 : 0,
        transition: 'opacity 0.4s cubic-bezier(0.4,0,0.2,1)',
      }}
      onClick={dismiss}
    >
      {/* ── Confetti rain ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {confetti.map((p) => (
          <div
            key={p.id}
            className="confetti-deep"
            style={{
              left: `${p.left}%`,
              width: p.shape === 'rect' ? `${p.size * 0.5}px` : `${p.size}px`,
              height: `${p.size}px`,
              backgroundColor: p.color,
              borderRadius: p.shape === 'circle' ? '50%' : p.shape === 'rect' ? '1px' : '2px',
              transform: `rotate(${p.rotation}deg)`,
              '--duration': `${p.duration}s`,
              '--delay': `${p.delay}s`,
            } as React.CSSProperties}
          />
        ))}
      </div>

      {/* ── Ambient glow rings ── */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(circle, rgba(${levelRgb},0.10) 0%, transparent 65%)`,
          animation: 'pulseGlow 3s ease-in-out infinite',
        }}
      />

      {/* ── Main card ── */}
      <div
        className="relative rounded-3xl p-8 md:p-10 text-center max-w-sm w-full overflow-hidden"
        style={{
          background: `linear-gradient(145deg, rgba(${levelRgb},0.15) 0%, rgba(13,24,41,0.99) 45%, rgba(255,77,0,0.08) 100%)`,
          border: `1px solid rgba(${levelRgb},0.50)`,
          boxShadow: `0 0 80px rgba(${levelRgb},0.25), 0 0 160px rgba(${levelRgb},0.08), inset 0 1px 0 rgba(255,255,255,0.06)`,
          transform: visible && !dismissing ? 'scale(1) translateY(0)' : 'scale(0.7) translateY(40px)',
          transition: 'transform 0.6s cubic-bezier(0.34,1.56,0.64,1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Dismiss countdown */}
        <DismissCountdown duration={6000} onDismiss={dismiss} />

        {/* Close button */}
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-all hover:bg-white/10"
          style={{ color: '#8899BB' }}
        >
          <X size={15} />
        </button>

        <div className="relative z-10 space-y-4">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest"
            style={{
              background: `rgba(${levelRgb},0.15)`,
              border: `1px solid rgba(${levelRgb},0.35)`,
              color: levelColor,
            }}
          >
            <Star size={9} fill="currentColor" />
            Nível desbloqueado
          </div>

          {/* Big emoji */}
          <div
            className="text-7xl leading-none block"
            style={{ animation: 'bounceIn 0.7s cubic-bezier(0.34,1.56,0.64,1) 0.2s both' }}
          >
            {celebration.emoji}
          </div>

          {/* LEVEL N — animated count-up */}
          <div>
            <div
              className="heading-display text-7xl md:text-8xl leading-none"
              style={{
                color: levelColor,
                textShadow: `0 0 40px rgba(${levelRgb},0.6), 0 0 80px rgba(${levelRgb},0.3)`,
              }}
            >
              LEVEL {displayLevel}
            </div>
            <div className="text-2xl font-black text-white mt-1">{celebration.title}</div>
          </div>

          {/* Message */}
          <p className="text-text-secondary text-sm max-w-xs mx-auto leading-relaxed">
            {message}
          </p>

          {/* XP milestone */}
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl"
            style={{
              background: 'rgba(245,200,66,0.08)',
              border: '1px solid rgba(245,200,66,0.2)',
            }}
          >
            <Zap size={13} className="text-brand-gold" fill="currentColor" />
            <span className="text-xs font-bold text-brand-gold">
              {celebration.minXp.toLocaleString('pt-BR')} XP atingidos
            </span>
          </div>

          {/* Stats row */}
          <div className="flex items-center justify-center gap-4 text-center">
            <div>
              <div className="text-xs font-black" style={{ color: levelColor }}>
                {LEVELS.length - celebration.level}
              </div>
              <div className="text-[10px] text-text-muted">níveis restantes</div>
            </div>
            <div className="w-px h-6 bg-white/10" />
            <div>
              <div className="text-xs font-black" style={{ color: levelColor }}>
                {celebration.level}/8
              </div>
              <div className="text-[10px] text-text-muted">progresso</div>
            </div>
          </div>

          {/* CTA button */}
          <button
            onClick={dismiss}
            className="w-full py-3.5 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2"
            style={{
              background: `linear-gradient(135deg, rgba(${levelRgb},0.85), rgba(${levelRgb},0.60))`,
              border: `1px solid rgba(${levelRgb},0.4)`,
              color: '#fff',
              boxShadow: `0 4px 24px rgba(${levelRgb},0.35)`,
            }}
          >
            <TrendingUp size={15} />
            Continuar evoluindo
          </button>
        </div>
      </div>
    </div>
  )
}
