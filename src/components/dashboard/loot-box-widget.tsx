'use client'

/**
 * Loot Box Widget — exibe e abre caixas de recompensa pendentes.
 * Aparece no dashboard quando há uma loot box não aberta.
 */

import { useState } from 'react'
import { Gift, Zap } from 'lucide-react'

interface PendingLoot {
  id: string
  date: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  reward_type: string
  reward_value: number
  reward_meta: string | null
  source: string
}

interface OpenResult {
  ok: boolean
  rarity: string
  reward_type: string
  reward_value: number
  message: string
}

interface Props {
  initialLoot: PendingLoot | null
}

const RARITY_CONFIG = {
  common:    { label: 'Comum',    color: '#8899BB', rgb: '136,153,187', emoji: '⬜', glow: 'rgba(136,153,187,0.25)' },
  rare:      { label: 'Raro',     color: '#3B82F6', rgb: '59,130,246',  emoji: '🔷', glow: 'rgba(59,130,246,0.3)' },
  epic:      { label: 'Épico',    color: '#7C3AED', rgb: '124,58,237',  emoji: '💜', glow: 'rgba(124,58,237,0.35)' },
  legendary: { label: 'Lendário', color: '#F5C842', rgb: '245,200,66',  emoji: '🌟', glow: 'rgba(245,200,66,0.4)' },
}

export function LootBoxWidget({ initialLoot }: Props) {
  const [loot, setLoot]          = useState<PendingLoot | null>(initialLoot)
  const [opening, setOpening]    = useState(false)
  const [opened, setOpened]      = useState<OpenResult | null>(null)
  const [animating, setAnimating] = useState(false)

  if (!loot && !opened) return null

  async function openLoot() {
    if (opening) return
    setOpening(true)
    setAnimating(true)

    try {
      const res  = await fetch('/api/loot', { method: 'POST' })
      const data = await res.json() as OpenResult

      setTimeout(() => {
        setOpened(data)
        setLoot(null)
        setAnimating(false)
      }, 1500)
    } catch {
      setOpening(false)
      setAnimating(false)
    }
  }

  // Estado: recompensa revelada
  if (opened) {
    const rc = RARITY_CONFIG[opened.rarity as keyof typeof RARITY_CONFIG] ?? RARITY_CONFIG.common
    return (
      <div
        className="rounded-2xl p-5 relative overflow-hidden animate-bounce-in"
        style={{
          background: `linear-gradient(135deg, rgba(${rc.rgb},0.12) 0%, rgba(13,24,41,0.98) 100%)`,
          border:     `1px solid rgba(${rc.rgb},0.35)`,
          boxShadow:  `0 0 24px ${rc.glow}`,
        }}
      >
        <div className="text-center">
          <div className="text-5xl mb-3">{rc.emoji}</div>
          <p className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: rc.color }}>
            Loot {rc.label}
          </p>
          <p className="text-xl font-black text-white">{opened.message}</p>
          <p className="text-xs text-text-muted mt-2">Recompensa adicionada à sua conta!</p>
        </div>
      </div>
    )
  }

  // Estado: caixa a ser aberta
  const source = loot?.source === 'perfect_day' ? 'Dia Perfeito' : 'Login Semanal'

  return (
    <div
      className="rounded-2xl p-5 relative overflow-hidden cursor-pointer"
      style={{
        background: 'linear-gradient(135deg, rgba(245,200,66,0.08) 0%, rgba(13,24,41,0.98) 70%, rgba(124,58,237,0.05) 100%)',
        border:     '1px solid rgba(245,200,66,0.25)',
        boxShadow:  animating ? '0 0 32px rgba(245,200,66,0.3)' : '0 0 0px transparent',
        transition: 'box-shadow 0.5s ease',
      }}
      onClick={openLoot}
      role="button"
      aria-label="Abrir Loot Box"
    >
      {/* Glow animado enquanto abre */}
      {animating && (
        <div
          className="absolute inset-0 rounded-2xl animate-pulse pointer-events-none"
          style={{ background: 'radial-gradient(circle at center, rgba(245,200,66,0.15), transparent 70%)' }}
        />
      )}

      <div className="relative z-10 flex items-center gap-4">
        {/* Ícone */}
        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0 ${animating ? 'animate-bounce' : ''}`}
          style={{
            background: 'linear-gradient(135deg, rgba(245,200,66,0.2), rgba(124,58,237,0.15))',
            border:     '1px solid rgba(245,200,66,0.3)',
          }}
        >
          {animating ? '✨' : '📦'}
        </div>

        {/* Texto */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Gift size={11} style={{ color: '#F5C842' }} />
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#F5C842' }}>
              Recompensa Disponível
            </span>
          </div>
          <p className="font-black text-white text-base leading-tight">
            {animating ? 'Abrindo...' : 'Caixa de Recompensa'}
          </p>
          <p className="text-[11px] text-text-muted mt-0.5">
            {animating ? 'Aguarde a surpresa...' : `De: ${source} · Toque para abrir`}
          </p>
        </div>

        {/* XP hint */}
        {!animating && (
          <div
            className="shrink-0 flex items-center gap-1 text-[11px] font-black px-2 py-1 rounded-lg"
            style={{ background: 'rgba(245,200,66,0.12)', color: '#F5C842', border: '1px solid rgba(245,200,66,0.2)' }}
          >
            <Zap size={10} fill="currentColor" />
            ?XP
          </div>
        )}
      </div>
    </div>
  )
}
