'use client'

import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, CheckSquare, Dumbbell, Heart, Bot } from 'lucide-react'
import { useState, useEffect } from 'react'

interface NavItem {
  href:  string
  label: string
  icon:  React.ElementType
  badgeKey?: 'tasks'
}

const ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Home',    icon: LayoutDashboard },
  { href: '/tarefas',   label: 'Tarefas', icon: CheckSquare, badgeKey: 'tasks' },
  { href: '/treinos',   label: 'Fitness', icon: Dumbbell },
  { href: '/saude',     label: 'Saúde',   icon: Heart },
  { href: '/coach',     label: 'Coach',   icon: Bot },
]

function haptic() {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(8)
  }
}

interface BottomNavProps {
  criticalTasks?: number
}

export function BottomNav({ criticalTasks = 0 }: BottomNavProps) {
  const pathname = usePathname()
  const router   = useRouter()

  const [mounted, setMounted]         = useState(false)
  const [bouncingHref, setBouncingHref] = useState<string | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60)
    return () => clearTimeout(t)
  }, [])

  function handleTap(href: string, isActive: boolean) {
    haptic()
    setBouncingHref(href)
    setTimeout(() => setBouncingHref(null), 400)

    if (isActive) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      router.push(href)
    }
  }

  function getBadgeCount(item: NavItem): number {
    if (item.badgeKey === 'tasks') return criticalTasks
    return 0
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
        transform: mounted ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 0.45s cubic-bezier(0.34, 1.3, 0.64, 1)',
      }}
    >
      <div className="grid grid-cols-5">
        {ITEMS.map((item) => {
          const Icon      = item.icon
          const active    = pathname === item.href || pathname.startsWith(`${item.href}/`)
          const bouncing  = bouncingHref === item.href
          const badge     = getBadgeCount(item)
          const showBadge = badge > 0 && !active

          return (
            <button
              key={item.href}
              onClick={() => handleTap(item.href, active)}
              className={cn(
                'flex flex-col items-center justify-center gap-1 pt-2 pb-1.5 relative',
                active ? 'text-brand-orange' : 'text-text-muted'
              )}
              style={{ minHeight: 52 }}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
            >
              {/* Indicador de topo — spring width */}
              <div
                className="absolute top-0 left-1/2 -translate-x-1/2 rounded-full"
                style={{
                  width:      active ? 24 : 0,
                  height:     2,
                  background: active ? '#FF4D00' : 'transparent',
                  boxShadow:  active ? '0 0 8px rgba(255,77,0,0.8)' : 'none',
                  transition: 'width 0.38s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.25s ease',
                }}
              />

              {/* Pill de fundo — fade + scale spring */}
              <div
                className="absolute inset-x-2 top-1.5 bottom-1.5 rounded-2xl pointer-events-none"
                style={{
                  background: 'rgba(255,77,0,0.08)',
                  opacity:    active ? 1 : 0,
                  transform:  active ? 'scale(1)' : 'scale(0.75)',
                  transition: 'opacity 0.22s ease, transform 0.35s cubic-bezier(0.34, 1.5, 0.64, 1)',
                }}
              />

              {/* Ícone com spring bounce ao tocar — wrapper para posicionar badge */}
              <div className="relative z-10">
                <Icon
                  size={22}
                  style={{
                    filter: active ? 'drop-shadow(0 0 8px rgba(255,77,0,0.7))' : 'none',
                    transition: 'filter 0.2s ease',
                    animation: bouncing
                      ? 'navIconBounce 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
                      : 'none',
                    transform: !bouncing && active ? 'translateY(-1px)' : undefined,
                  }}
                />

                {/* Badge de tarefas críticas */}
                {showBadge && (
                  <span
                    className="absolute -top-1 -right-1.5 min-w-[14px] h-3.5 rounded-full flex items-center justify-center text-[8px] font-black px-0.5"
                    style={{
                      background:  '#EF4444',
                      color:       '#fff',
                      border:      '1.5px solid #050914',
                      lineHeight:  1,
                      animation:   'navIconBounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both',
                    }}
                  >
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </div>

              {/* Label */}
              <span
                className={cn(
                  'text-[10px] relative z-10',
                  active ? 'font-bold text-brand-orange' : 'font-medium text-text-muted'
                )}
                style={{ transition: 'color 0.2s ease' }}
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
