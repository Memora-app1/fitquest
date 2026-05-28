'use client'

/**
 * MobileFab — FAB contextual por rota, aparece apenas no mobile.
 * Cada seção do app tem uma ação rápida primária.
 * Fica acima do bottom nav, à direita.
 */

import { usePathname, useRouter } from 'next/navigation'
import { Plus, Dumbbell, Droplets, CheckSquare, DollarSign } from 'lucide-react'

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
    icon: Plus,
    label: 'Novo hábito',
    color: '#FF4D00',
    rgb: '255,77,0',
    action: 'navigate',
    href: '/habitos?new=1',
  },
  '/treinos': {
    icon: Dumbbell,
    label: 'Iniciar treino',
    color: '#00FF88',
    rgb: '0,255,136',
    action: 'navigate',
    href: '/treinos/novo',
  },
  '/tarefas': {
    icon: CheckSquare,
    label: 'Nova tarefa',
    color: '#7C3AED',
    rgb: '124,58,237',
    action: 'navigate',
    href: '/tarefas?new=1',
  },
  '/financas': {
    icon: DollarSign,
    label: 'Nova transação',
    color: '#F5C842',
    rgb: '245,200,66',
    action: 'navigate',
    href: '/financas?new=1',
  },
  '/saude': {
    icon: Droplets,
    label: '+200ml água',
    color: '#00D9FF',
    rgb: '0,217,255',
    action: 'water',
  },
}

async function quickAddWater() {
  try {
    await fetch('/api/health/water', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount_ml: 200 }),
    })
    if (navigator.vibrate) navigator.vibrate([8, 30, 8])
    // Dispara evento customizado para o WaterTracker atualizar
    window.dispatchEvent(new CustomEvent('ascendia:water-added', { detail: { amount: 200 } }))
  } catch {
    // silencioso — fallback sem erro visível
  }
}

export function MobileFab() {
  const pathname = usePathname()
  const router   = useRouter()

  // Encontra config para a rota atual (sem sub-rotas)
  const base   = '/' + pathname.split('/')[1]
  const config = FAB_MAP[base]

  // Não mostra em rotas sem config ou em coach (já tem mini-fab)
  if (!config || base === '/coach' || base === '/dashboard') return null

  const activeConfig = config
  const Icon = activeConfig.icon

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
      className="md:hidden fixed z-40 flex items-center gap-2 rounded-2xl shadow-2xl active:scale-90 transition-transform duration-100"
      style={{
        bottom: `calc(env(safe-area-inset-bottom, 0px) + 72px)`,
        right: 16,
        background: `linear-gradient(135deg, rgba(${activeConfig.rgb},0.9), rgba(${activeConfig.rgb},0.7))`,
        border: `1px solid rgba(${activeConfig.rgb},0.5)`,
        boxShadow: `0 8px 32px rgba(${activeConfig.rgb},0.35), 0 2px 8px rgba(0,0,0,0.4)`,
        backdropFilter: 'blur(12px)',
        padding: '10px 16px',
        color: '#fff',
      }}
      aria-label={activeConfig.label}
    >
      <Icon size={18} strokeWidth={2.5} />
      <span className="text-xs font-bold tracking-wide">{activeConfig.label}</span>
    </button>
  )
}
