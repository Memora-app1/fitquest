'use client'

import { useState, useEffect } from 'react'
import { Zap, Shield, Flame, Star, ShoppingBag, Check, Loader2 } from 'lucide-react'

interface ShopItem {
  id: string
  name: string
  description: string
  emoji: string
  cost: number
  maxOwn: number
}

interface ShopState {
  xp: number
  streak_freezes: number
  items: ShopItem[]
}

const ITEM_ICONS: Record<string, React.ElementType> = {
  streak_freeze:    Shield,
  perfect_day_boost: Star,
  xp_multiplier:   Flame,
}

const ITEM_COLORS: Record<string, { color: string; rgb: string }> = {
  streak_freeze:    { color: '#00D9FF', rgb: '0,217,255' },
  perfect_day_boost:{ color: '#F5C842', rgb: '245,200,66' },
  xp_multiplier:   { color: '#FF4D00', rgb: '255,77,0' },
}

export function XpShop() {
  const [state, setState] = useState<ShopState | null>(null)
  const [loading, setLoading] = useState(true)
  const [buying, setBuying] = useState<string | null>(null)
  const [flash, setFlash] = useState<{ id: string; success: boolean; msg: string } | null>(null)

  useEffect(() => {
    fetch('/api/shop')
      .then(r => r.json())
      .then(data => { setState(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function handleBuy(itemId: string, cost: number) {
    if (buying) return
    setBuying(itemId)
    setFlash(null)

    try {
      const res = await fetch('/api/shop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item: itemId }),
      })
      const data = await res.json()

      if (!res.ok) {
        setFlash({ id: itemId, success: false, msg: data.message ?? 'Erro ao comprar.' })
      } else {
        setFlash({ id: itemId, success: true, msg: data.message })
        setState(prev => {
          if (!prev) return prev
          return {
            ...prev,
            xp: data.xpRemaining,
            streak_freezes: itemId === 'streak_freeze'
              ? prev.streak_freezes + 1
              : prev.streak_freezes,
          }
        })
        if (navigator.vibrate) navigator.vibrate([30, 15, 60])
        setTimeout(() => setFlash(null), 3000)
      }
    } catch {
      setFlash({ id: itemId, success: false, msg: 'Erro de conexão.' })
    } finally {
      setBuying(null)
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl p-6 animate-pulse" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="h-4 w-24 bg-white/10 rounded mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[1, 2, 3].map(i => <div key={i} className="h-32 bg-white/05 rounded-xl" />)}
        </div>
      </div>
    )
  }

  if (!state) return null

  return (
    <div
      className="rounded-2xl p-5 md:p-6 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(245,200,66,0.06) 0%, rgba(13,24,41,0.98) 100%)',
        border: '1px solid rgba(245,200,66,0.15)',
      }}
    >
      <div
        className="absolute -top-8 -right-8 w-40 h-40 rounded-full pointer-events-none blur-3xl"
        style={{ background: 'rgba(245,200,66,0.07)' }}
      />

      <div className="relative z-10 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(245,200,66,0.15)', border: '1px solid rgba(245,200,66,0.25)' }}
            >
              <ShoppingBag size={13} style={{ color: '#F5C842' }} />
            </div>
            <div>
              <h2 className="font-bold text-base leading-tight">XP Shop</h2>
              <p className="text-[11px] text-text-muted">Gaste XP em vantagens de gameplay</p>
            </div>
          </div>
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
            style={{ background: 'rgba(245,200,66,0.12)', border: '1px solid rgba(245,200,66,0.25)' }}
          >
            <Zap size={12} style={{ color: '#F5C842' }} fill="currentColor" />
            <span className="font-black text-sm" style={{ color: '#F5C842' }}>
              {state.xp.toLocaleString('pt-BR')} XP
            </span>
          </div>
        </div>

        {/* Items */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {state.items.map(item => {
            const Icon = ITEM_ICONS[item.id] ?? Zap
            const colors = ITEM_COLORS[item.id] ?? { color: '#8899BB', rgb: '136,153,187' }
            const canAfford = state.xp >= item.cost
            const isBuying = buying === item.id
            const itemFlash = flash?.id === item.id ? flash : null

            const owned = item.id === 'streak_freeze' ? state.streak_freezes : 0
            const atMax = item.id === 'streak_freeze' && owned >= item.maxOwn

            return (
              <div
                key={item.id}
                className="rounded-xl p-4 relative overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, rgba(${colors.rgb},0.07) 0%, rgba(13,24,41,0.98) 100%)`,
                  border: `1px solid rgba(${colors.rgb},0.2)`,
                  opacity: canAfford ? 1 : 0.6,
                }}
              >
                <div
                  className="absolute -top-3 -right-3 w-12 h-12 rounded-full pointer-events-none blur-lg"
                  style={{ background: `rgba(${colors.rgb},0.15)` }}
                />

                <div className="relative z-10 space-y-3">
                  {/* Icon + name */}
                  <div className="flex items-start gap-2.5">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                      style={{ background: `rgba(${colors.rgb},0.12)`, border: `1px solid rgba(${colors.rgb},0.2)` }}
                    >
                      {item.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm leading-tight">{item.name}</div>
                      <div className="text-[10px] text-text-muted mt-0.5 leading-relaxed">{item.description}</div>
                    </div>
                  </div>

                  {/* Owned count (only for freeze) */}
                  {item.id === 'streak_freeze' && owned > 0 && (
                    <div className="flex items-center gap-1 text-[10px]" style={{ color: colors.color }}>
                      <Shield size={9} fill="currentColor" />
                      {owned} disponível{owned !== 1 ? 'is' : ''}
                    </div>
                  )}

                  {/* Flash message */}
                  {itemFlash && (
                    <div
                      className="flex items-center gap-1.5 text-[10px] font-semibold px-2 py-1 rounded-lg"
                      style={{
                        background: itemFlash.success ? 'rgba(0,255,136,0.1)' : 'rgba(239,68,68,0.1)',
                        color: itemFlash.success ? '#00FF88' : '#EF4444',
                      }}
                    >
                      {itemFlash.success ? <Check size={10} /> : null}
                      {itemFlash.msg}
                    </div>
                  )}

                  {/* Buy button */}
                  <button
                    onClick={() => handleBuy(item.id, item.cost)}
                    disabled={!canAfford || isBuying || atMax}
                    className="w-full py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background: canAfford && !atMax
                        ? `linear-gradient(135deg, rgba(${colors.rgb},0.3), rgba(${colors.rgb},0.15))`
                        : 'rgba(255,255,255,0.04)',
                      border: `1px solid rgba(${colors.rgb},${canAfford && !atMax ? '0.4' : '0.1'})`,
                      color: canAfford && !atMax ? colors.color : '#556677',
                    }}
                  >
                    {isBuying ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : atMax ? (
                      'Máximo atingido'
                    ) : (
                      <>
                        <Zap size={10} fill="currentColor" />
                        {item.cost.toLocaleString('pt-BR')} XP
                      </>
                    )}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {state.xp < 300 && (
          <p className="text-xs text-text-muted text-center">
            Continue completando hábitos e tarefas para acumular XP e desbloquear itens.
          </p>
        )}
      </div>
    </div>
  )
}
