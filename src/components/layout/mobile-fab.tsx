'use client'

/**
 * MobileFab — FAB contextual por rota, aparece apenas no mobile.
 * Cada seção do app tem uma ação rápida primária.
 * Fica acima do bottom nav, à direita, com spring de entrada/saída por rota.
 */

import { usePathname, useRouter } from 'next/navigation'
import { Plus, Dumbbell, Droplets, CheckSquare, DollarSign } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'

interface FabConfig {
  icon: React.ElementType
  label: string
  color: string
  rgb: string
  action: 'navigate' | 'water'
  href?: string
}

const FAB_MAP: Record<string, FabConfig> = {
  '/habitos': {
    icon:   Plus,
    label:  'Novo hábito',
    color:  '#FF4D00',
    rgb:    '255,77,0',
    action: 'navigate',
    href:   '/habitos?new=1',
  },
  '/treinos': {
    icon:   Dumbbell,
    label:  'Iniciar treino',
    color:  '#00FF88',
    rgb:    '0,255,136',
    action: 'navigate',
    href:   '/treinos/novo',
  },
  '/tarefas': {
    icon:   CheckSquare,
    label:  'Nova tarefa',
    color:  '#7C3AED',
    rgb:    '124,58,237',
    action: 'navigate',
    href:   '/tarefas?new=1',
  },
  '/financas': {
    icon:   DollarSign,
    label:  'Nova transação',
    color:  '#F5C842',
    rgb:    '245,200,66',
    action: 'navigate',
    href:   '/financas?new=1',
  },
  '/saude': {
    icon:   Droplets,
    label:  '+200ml água',
    color:  '#00D9FF',
    rgb:    '0,217,255',
    action: 'water',
  },
}

async function quickAddWater() {
  try {
    await fetch('/api/health/water', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ amount_ml: 200 }),
    })
    if (navigator.vibrate) navigator.vibrate([8, 30, 8])
    window.dispatchEvent(new CustomEvent('ascendia:water-added', { detail: { amount: 200 } }))
  } catch {
    // silencioso — fallback sem erro visível
  }
}

export function MobileFab() {
  const pathname = usePathname()
  const router   = useRouter()

  const base   = '/' + pathname.split('/')[1]
  const config = FAB_MAP[base]
  const shouldShow = !!config && base !== '/coach' && base !== '/dashboard'

  // Mantém o config visível durante a animação de saída
  const lastConfigRef = useRef<FabConfig | null>(null)
  if (config) lastConfigRef.current = config

  const [rendered, setRendered] = useState(false)
  const [animIn,   setAnimIn]   = useState(false)

  useEffect(() => {
    if (shouldShow) {
      setRendered(true)
      // Tick para garantir que o elemento existe no DOM antes de animar
      const t = setTimeout(() => setAnimIn(true), 16)
      return () => clearTimeout(t)
    } else {
      setAnimIn(false)
      const t = setTimeout(() => setRendered(false), 220)
      return () => clearTimeout(t)
    }
  }, [shouldShow])

  if (!rendered) return null

  const activeConfig = lastConfigRef.current!
  const Icon         = activeConfig.icon

  async function handleTap() {
    if (navigator.vibrate) navigator.vibrate(10)
    if (activeConfig.action === 'water') {
      await quickAddWater()
      return
    }
    if (activeConfig.href) {
      router.push(activeConfig.href)
    }
  }

  return (
    <button
      onClick={handleTap}
      className="md:hidden fixed z-40 flex items-center gap-2 rounded-2xl shadow-2xl"
      style={{
        bottom:  `calc(env(safe-area-inset-bottom, 0px) + 72px)`,
        right:   16,
        background: `linear-gradient(135deg, rgba(${activeConfig.rgb},0.9), rgba(${activeConfig.rgb},0.7))`,
        border:  `1px solid rgba(${activeConfig.rgb},0.5)`,
        boxShadow: `0 8px 32px rgba(${activeConfig.rgb},0.35), 0 2px 8px rgba(0,0,0,0.4)`,
        backdropFilter: 'blur(12px)',
        padding: '10px 16px',
        color:   '#fff',
        // Spring de entrada/saída
        animation: animIn
          ? 'fabSpringIn 0.38s cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
          : 'fabSpringOut 0.2s ease-in forwards',
        transformOrigin: 'bottom right',
      }}
      aria-label={activeConfig.label}
    >
      <Icon size={18} strokeWidth={2.5} />
      <span className="text-xs font-bold tracking-wide">{activeConfig.label}</span>
    </button>
  )
}
