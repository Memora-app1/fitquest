'use client'

import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, CheckSquare, Dumbbell, Bot,
  BarChart3, Trophy, Medal, Shield, Sparkles,
  Heart, Wallet, Calendar, Flag, Target, Bell,
  MoreHorizontal, X,
} from 'lucide-react'
import { useState, useEffect, useRef } from 'react'

interface NavItem {
  href:  string
  label: string
  icon:  React.ElementType
  badgeKey?: 'tasks'
}

const MAIN_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Home',    icon: LayoutDashboard },
  { href: '/tarefas',   label: 'Tarefas', icon: CheckSquare, badgeKey: 'tasks' },
  { href: '/treinos',   label: 'Fitness', icon: Dumbbell },
  { href: '/coach',     label: 'Coach',   icon: Bot },
]

const MORE_ITEMS: Array<{ href: string; label: string; icon: React.ElementType; color: string }> = [
  { href: '/score',      label: 'Score & XP',   icon: BarChart3,  color: '#F5C842' },
  { href: '/conquistas', label: 'Conquistas',   icon: Trophy,     color: '#FF4D00' },
  { href: '/ranking',    label: 'Ranking',      icon: Medal,      color: '#7C3AED' },
  { href: '/guilds',     label: 'Guilds',       icon: Shield,     color: '#3B82F6' },
  { href: '/seasons',    label: 'Temporada',    icon: Sparkles,   color: '#00FF88' },
  { href: '/saude',      label: 'Saúde',        icon: Heart,      color: '#EC4899' },
  { href: '/financas',   label: 'Finanças',     icon: Wallet,     color: '#00D9FF' },
  { href: '/habitos',    label: 'Hábitos',      icon: Target,     color: '#FF4D00' },
  { href: '/metas',      label: 'Metas',        icon: Flag,       color: '#F5C842' },
  { href: '/calendario',    label: 'Calendário',    icon: Calendar,  color: '#7C3AED' },
  { href: '/notificacoes', label: 'Notificações',  icon: Bell,      color: '#FF4D00' },
]

function haptic(pattern: number | number[] = 8) {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(pattern)
  }
}

interface BottomNavProps {
  criticalTasks?: number
}

export function BottomNav({ criticalTasks = 0 }: BottomNavProps) {
  const pathname = usePathname()
  const router   = useRouter()

  const [mounted, setMounted]           = useState(false)
  const [bouncingHref, setBouncingHref] = useState<string | null>(null)
  const [showMore, setShowMore]         = useState(false)
  const sheetRef                        = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60)
    return () => clearTimeout(t)
  }, [])

  // Close sheet on route change
  useEffect(() => { setShowMore(false) }, [pathname])

  // Close on outside tap
  useEffect(() => {
    if (!showMore) return
    function handler(e: TouchEvent | MouseEvent) {
      if (sheetRef.current && !sheetRef.current.contains(e.target as Node)) {
        setShowMore(false)
      }
    }
    document.addEventListener('mousedown', handler)
    document.addEventListener('touchstart', handler)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('touchstart', handler)
    }
  }, [showMore])

  // Lock scroll when sheet open
  useEffect(() => {
    document.body.style.overflow = showMore ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [showMore])

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

  function handleMore() {
    haptic([8, 4, 12])
    setShowMore((v) => !v)
  }

  function handleMoreNav(href: string) {
    haptic()
    setShowMore(false)
    router.push(href)
  }

  const isMoreActive = MORE_ITEMS.some(
    (i) => pathname === i.href || pathname.startsWith(`${i.href}/`)
  )

  return (
    <>
      {/* Sheet overlay */}
      {showMore && (
        <div
          className="md:hidden fixed inset-0 z-40"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
        />
      )}

      {/* More sheet */}
      <div
        ref={sheetRef}
        className="md:hidden fixed left-0 right-0 z-50 rounded-t-3xl"
        style={{
          bottom: 'calc(52px + env(safe-area-inset-bottom, 0px))',
          background: 'rgba(13,24,41,0.98)',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          transform: showMore ? 'translateY(0)' : 'translateY(110%)',
          transition: 'transform 0.35s cubic-bezier(0.34, 1.2, 0.64, 1)',
          maxHeight: '65vh',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {/* Handle */}
        <div className="flex items-center justify-between px-5 pt-3 pb-1">
          <div className="w-8 h-1 rounded-full mx-auto" style={{ background: 'rgba(255,255,255,0.15)' }} />
        </div>

        <div className="px-4 pb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-text-muted uppercase tracking-widest">Explorar</span>
            <button onClick={() => setShowMore(false)} className="text-text-muted p-1">
              <X size={16} />
            </button>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {MORE_ITEMS.map((item) => {
              const Icon   = item.icon
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
              return (
                <button
                  key={item.href}
                  onClick={() => handleMoreNav(item.href)}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all active:scale-95"
                  style={{
                    background: active ? `${item.color}18` : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${active ? `${item.color}40` : 'rgba(255,255,255,0.06)'}`,
                  }}
                >
                  <Icon size={20} style={{ color: active ? item.color : '#8899BB' }} />
                  <span
                    className="text-[10px] font-semibold leading-tight text-center"
                    style={{ color: active ? item.color : '#8899BB' }}
                  >
                    {item.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Bottom nav bar */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40"
        style={{
          background: 'rgba(5, 9, 20, 0.96)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderTop: '1px solid rgba(255,255,255,0.07)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          transform: mounted ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.45s cubic-bezier(0.34, 1.3, 0.64, 1)',
        }}
      >
        <div className="grid grid-cols-5">
          {MAIN_ITEMS.map((item) => {
            const Icon     = item.icon
            const active   = pathname === item.href || pathname.startsWith(`${item.href}/`)
            const bouncing = bouncingHref === item.href
            const badge    = item.badgeKey === 'tasks' ? criticalTasks : 0
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
                <div
                  className="absolute inset-x-2 top-1.5 bottom-1.5 rounded-2xl pointer-events-none"
                  style={{
                    background: 'rgba(255,77,0,0.08)',
                    opacity:    active ? 1 : 0,
                    transform:  active ? 'scale(1)' : 'scale(0.75)',
                    transition: 'opacity 0.22s ease, transform 0.35s cubic-bezier(0.34, 1.5, 0.64, 1)',
                  }}
                />
                <div className="relative z-10">
                  <Icon
                    size={22}
                    style={{
                      filter:    active ? 'drop-shadow(0 0 8px rgba(255,77,0,0.7))' : 'none',
                      transition:'filter 0.2s ease',
                      animation: bouncing
                        ? 'navIconBounce 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
                        : 'none',
                      transform: !bouncing && active ? 'translateY(-1px)' : undefined,
                    }}
                  />
                  {showBadge && (
                    <span
                      className="absolute -top-1 -right-1.5 min-w-[14px] h-3.5 rounded-full flex items-center justify-center text-[8px] font-black px-0.5"
                      style={{
                        background: '#EF4444', color: '#fff',
                        border: '1.5px solid #050914', lineHeight: 1,
                        animation: 'navIconBounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both',
                      }}
                    >
                      {badge > 9 ? '9+' : badge}
                    </span>
                  )}
                </div>
                <span
                  className={cn('text-[10px] relative z-10', active ? 'font-bold text-brand-orange' : 'font-medium text-text-muted')}
                  style={{ transition: 'color 0.2s ease' }}
                >
                  {item.label}
                </span>
              </button>
            )
          })}

          {/* "Mais" button */}
          <button
            onClick={handleMore}
            className={cn(
              'flex flex-col items-center justify-center gap-1 pt-2 pb-1.5 relative',
              (showMore || isMoreActive) ? 'text-brand-orange' : 'text-text-muted'
            )}
            style={{ minHeight: 52 }}
            aria-label="Mais"
          >
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 rounded-full"
              style={{
                width:      (showMore || isMoreActive) ? 24 : 0,
                height:     2,
                background: (showMore || isMoreActive) ? '#FF4D00' : 'transparent',
                boxShadow:  (showMore || isMoreActive) ? '0 0 8px rgba(255,77,0,0.8)' : 'none',
                transition: 'width 0.38s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.25s ease',
              }}
            />
            <div
              className="absolute inset-x-2 top-1.5 bottom-1.5 rounded-2xl pointer-events-none"
              style={{
                background: 'rgba(255,77,0,0.08)',
                opacity:    (showMore || isMoreActive) ? 1 : 0,
                transform:  (showMore || isMoreActive) ? 'scale(1)' : 'scale(0.75)',
                transition: 'opacity 0.22s ease, transform 0.35s cubic-bezier(0.34, 1.5, 0.64, 1)',
              }}
            />
            <div className="relative z-10">
              <MoreHorizontal
                size={22}
                style={{
                  filter:    (showMore || isMoreActive) ? 'drop-shadow(0 0 8px rgba(255,77,0,0.7))' : 'none',
                  transition: 'filter 0.2s ease',
                  transform:  showMore ? 'rotate(90deg)' : 'rotate(0deg)',
                  transitionProperty: 'filter, transform',
                  transitionDuration: '0.2s',
                }}
              />
            </div>
            <span
              className={cn('text-[10px] relative z-10', (showMore || isMoreActive) ? 'font-bold text-brand-orange' : 'font-medium text-text-muted')}
              style={{ transition: 'color 0.2s ease' }}
            >
              Mais
            </span>
          </button>
        </div>
      </nav>
    </>
  )
}
