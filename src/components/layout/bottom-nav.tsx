'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, CheckSquare, Dumbbell, Heart, Bot } from 'lucide-react'

const ITEMS = [
  { href: '/dashboard', label: 'Home',    icon: LayoutDashboard },
  { href: '/tarefas',   label: 'Tarefas', icon: CheckSquare },
  { href: '/treinos',   label: 'Fitness', icon: Dumbbell },
  { href: '/saude',     label: 'Saúde',   icon: Heart },
  { href: '/coach',     label: 'Coach',   icon: Bot },
]

function haptic() {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(8)
  }
}

export function BottomNav() {
  const pathname = usePathname()
  const router   = useRouter()

  function handleTap(href: string, isActive: boolean) {
    haptic()
    if (isActive) {
      // Já está na rota — scroll suave ao topo
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      router.push(href)
    }
  }

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40"
      style={{
        background: 'rgba(5, 9, 20, 0.94)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div className="grid grid-cols-5">
        {ITEMS.map((item) => {
          const Icon   = item.icon
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`)

          return (
            <button
              key={item.href}
              onClick={() => handleTap(item.href, active)}
              className={cn(
                'flex flex-col items-center justify-center gap-1 pt-2 pb-1.5',
                'relative transition-all duration-150',
                'active:scale-90 active:opacity-70',
                active ? 'text-brand-orange' : 'text-text-muted'
              )}
              style={{ minHeight: 52 }}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
            >
              {/* Top indicator bar — active */}
              <div
                className="absolute top-0 left-1/2 -translate-x-1/2 rounded-full transition-all duration-300"
                style={{
                  width:      active ? 24 : 0,
                  height:     2,
                  background: active ? '#FF4D00' : 'transparent',
                  boxShadow:  active ? '0 0 8px rgba(255,77,0,0.8)' : 'none',
                }}
              />

              {/* Background pill — active */}
              {active && (
                <div
                  className="absolute inset-x-2 top-1.5 bottom-1.5 rounded-2xl pointer-events-none"
                  style={{ background: 'rgba(255,77,0,0.08)' }}
                />
              )}

              <Icon
                size={22}
                className="relative z-10 transition-transform duration-150"
                style={{
                  filter: active ? 'drop-shadow(0 0 8px rgba(255,77,0,0.7))' : 'none',
                  transform: active ? 'translateY(-1px)' : 'none',
                }}
              />
              <span
                className={cn(
                  'text-[10px] relative z-10 transition-all duration-150',
                  active ? 'font-bold text-brand-orange' : 'font-medium text-text-muted'
                )}
              >
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
