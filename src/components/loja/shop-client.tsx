'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Zap, Shield, Package, Flame, RefreshCw, CheckCircle, XCircle, Loader2 } from 'lucide-react'

interface ShopItem {
  id:          string
  name:        string
  description: string
  emoji:       string
  cost:        number
  maxOwn:      number | null
  category:    string
}

interface Props {
  xp:            number
  streakFreezes: number
  items:         ShopItem[]
}

const ICON_MAP: Record<string, React.ElementType> = {
  streak_freeze:    Shield,
  loot_box:         Package,
  xp_boost_2x:      Zap,
  streak_recovery:  RefreshCw,
}

const COLOR_MAP: Record<string, { color: string; rgb: string }> = {
  streak_freeze:    { color: '#3B82F6', rgb: '59,130,246'   },
  loot_box:         { color: '#F5C842', rgb: '245,200,66'   },
  xp_boost_2x:      { color: '#FF4D00', rgb: '255,77,0'     },
  streak_recovery:  { color: '#00FF88', rgb: '0,255,136'    },
}

const CATEGORY_LABELS: Record<string, string> = {
  protection: 'Proteção',
  loot:       'Recompensas',
  boost:      'Boost',
}

export function ShopClient({ xp, streakFreezes, items }: Props) {
  const router   = useRouter()
  const [pending, startTransition] = useTransition()
  const [buying,  setBuying]       = useState<string | null>(null)
  const [toast,   setToast]        = useState<{ ok: boolean; msg: string } | null>(null)
  const [confirm, setConfirm]      = useState<ShopItem | null>(null)

  function showToast(ok: boolean, msg: string) {
    setToast({ ok, msg })
    setTimeout(() => setToast(null), 3500)
  }

  async function handleBuy(item: ShopItem) {
    setConfirm(null)
    setBuying(item.id)
    try {
      const res = await fetch('/api/shop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item: item.id }),
      })
      const data = await res.json()
      if (!res.ok) {
        showToast(false, data.message ?? 'Erro ao comprar item.')
      } else {
        showToast(true, `${item.emoji} ${item.name} adicionado!`)
        startTransition(() => router.refresh())
      }
    } catch {
      showToast(false, 'Erro de rede. Tente novamente.')
    } finally {
      setBuying(null)
    }
  }

  // Group by category
  const categories = Array.from(new Set(items.map((i) => i.category)))

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-8">

      {/* XP balance hero */}
      <div
        className="rounded-2xl p-6 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(245,200,66,0.10) 0%, rgba(13,24,41,0.98) 60%, rgba(255,77,0,0.05) 100%)',
          border: '1px solid rgba(245,200,66,0.25)',
        }}
      >
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full pointer-events-none blur-3xl" style={{ background: 'rgba(245,200,66,0.10)' }} />
        <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="text-xs text-text-muted uppercase tracking-widest mb-1">Seu saldo</div>
            <div className="flex items-center gap-2">
              <Zap size={28} className="text-brand-gold" fill="currentColor" />
              <span className="heading-display text-5xl" style={{ color: '#F5C842' }}>
                {xp.toLocaleString('pt-BR')}
              </span>
              <span className="text-text-secondary text-lg">XP</span>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold"
              style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.3)', color: '#3B82F6' }}
            >
              <Shield size={14} />
              {streakFreezes} freeze{streakFreezes !== 1 ? 's' : ''}
            </div>
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold"
              style={{ background: 'rgba(255,77,0,0.10)', border: '1px solid rgba(255,77,0,0.25)', color: '#FF4D00' }}
            >
              <Flame size={14} />
              Streak protegido
            </div>
          </div>
        </div>
      </div>

      {/* Items by category */}
      {categories.map((cat) => {
        const catItems = items.filter((i) => i.category === cat)
        return (
          <section key={cat}>
            <h2 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3 px-1">
              {CATEGORY_LABELS[cat] ?? cat}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {catItems.map((item) => {
                const Icon       = ICON_MAP[item.id] ?? Zap
                const colors     = COLOR_MAP[item.id] ?? { color: '#F5C842', rgb: '245,200,66' }
                const canAfford  = xp >= item.cost
                const isBuying   = buying === item.id
                const atMax      = item.id === 'streak_freeze' && streakFreezes >= 10

                return (
                  <div
                    key={item.id}
                    className="rounded-2xl p-5 relative overflow-hidden transition-all"
                    style={{
                      background: `linear-gradient(135deg, rgba(${colors.rgb},0.07) 0%, rgba(13,24,41,0.98) 100%)`,
                      border: `1px solid rgba(${colors.rgb},0.2)`,
                      opacity: atMax ? 0.6 : 1,
                    }}
                  >
                    <div
                      className="absolute -top-4 -right-4 w-20 h-20 rounded-full pointer-events-none blur-2xl"
                      style={{ background: `rgba(${colors.rgb},0.12)` }}
                    />
                    <div className="relative z-10">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-xl"
                            style={{ background: `rgba(${colors.rgb},0.12)`, border: `1px solid rgba(${colors.rgb},0.25)` }}
                          >
                            {item.emoji}
                          </div>
                          <div>
                            <div className="font-bold text-sm text-white">{item.name}</div>
                            <div className="text-[11px] text-text-muted">{CATEGORY_LABELS[item.category] ?? item.category}</div>
                          </div>
                        </div>
                        {/* XP cost badge */}
                        <div
                          className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black shrink-0"
                          style={{ background: `rgba(${colors.rgb},0.12)`, border: `1px solid rgba(${colors.rgb},0.25)`, color: colors.color }}
                        >
                          <Zap size={10} fill="currentColor" />
                          {item.cost.toLocaleString('pt-BR')}
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-text-secondary mb-4 leading-relaxed">{item.description}</p>

                      {/* Buy button */}
                      {atMax ? (
                        <div className="flex items-center gap-2 text-xs text-text-muted">
                          <CheckCircle size={14} className="text-brand-green" />
                          Máximo atingido ({streakFreezes}/10)
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirm(item)}
                          disabled={!canAfford || isBuying || pending}
                          className="w-full py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-95"
                          style={
                            canAfford
                              ? { background: `rgba(${colors.rgb},0.15)`, border: `1px solid rgba(${colors.rgb},0.35)`, color: colors.color }
                              : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#8899BB' }
                          }
                        >
                          {isBuying ? (
                            <span className="flex items-center justify-center gap-2">
                              <Loader2 size={14} className="animate-spin" />
                              Comprando…
                            </span>
                          ) : !canAfford ? (
                            `Faltam ${(item.cost - xp).toLocaleString('pt-BR')} XP`
                          ) : (
                            `Comprar por ${item.cost.toLocaleString('pt-BR')} XP`
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )
      })}

      {/* Confirm modal */}
      {confirm && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
          onClick={() => setConfirm(null)}
        >
          <div
            className="w-full max-w-sm rounded-3xl p-6 space-y-4"
            style={{ background: '#0D1829', border: '1px solid rgba(255,255,255,0.1)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="text-5xl mb-2">{confirm.emoji}</div>
              <h3 className="font-black text-white text-lg">{confirm.name}</h3>
              <p className="text-text-secondary text-sm mt-1">{confirm.description}</p>
            </div>

            <div
              className="rounded-xl p-3 text-center"
              style={{ background: 'rgba(245,200,66,0.08)', border: '1px solid rgba(245,200,66,0.2)' }}
            >
              <div className="text-xs text-text-muted mb-0.5">Custo</div>
              <div className="flex items-center justify-center gap-1.5 font-black text-xl" style={{ color: '#F5C842' }}>
                <Zap size={16} fill="currentColor" />
                {confirm.cost.toLocaleString('pt-BR')} XP
              </div>
              <div className="text-xs text-text-muted mt-0.5">
                Saldo após: {(xp - confirm.cost).toLocaleString('pt-BR')} XP
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setConfirm(null)}
                className="flex-1 py-3 rounded-xl font-bold text-sm"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#8899BB' }}
              >
                Cancelar
              </button>
              <button
                onClick={() => handleBuy(confirm)}
                className="flex-1 py-3 rounded-xl font-bold text-sm"
                style={{ background: 'rgba(245,200,66,0.15)', border: '1px solid rgba(245,200,66,0.35)', color: '#F5C842' }}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm shadow-xl animate-slide-up"
          style={{
            background: toast.ok ? 'rgba(0,255,136,0.12)' : 'rgba(239,68,68,0.12)',
            border: toast.ok ? '1px solid rgba(0,255,136,0.35)' : '1px solid rgba(239,68,68,0.35)',
            color: toast.ok ? '#00FF88' : '#EF4444',
            backdropFilter: 'blur(12px)',
          }}
        >
          {toast.ok
            ? <CheckCircle size={16} />
            : <XCircle size={16} />
          }
          {toast.msg}
        </div>
      )}
    </div>
  )
}
