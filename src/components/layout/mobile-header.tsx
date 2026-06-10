'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Zap, Flame } from 'lucide-react'
import { CommandPalette } from '@/components/command-palette'
import { NotificationBell } from './notification-bell'
import { useRealtimeCtx } from '@/hooks/use-realtime-context'
import { getXpProgressToNextLevel } from '@/lib/xp'

interface MobileHeaderProps {
  name: string
  level: number
  xpTotal: number
  streakCurrent: number
  unreadNotifications?: number
}

export function MobileHeader({
  name,
  level: _level,
  xpTotal: _xpTotal,
  streakCurrent: _streakCurrent,
  unreadNotifications = 0,
}: MobileHeaderProps) {
  const [scrolled, setScrolled] = useState(false)
  const { profile: live, xpBump } = useRealtimeCtx()

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')

  // Progresso de XP para o próximo level
  const xpProgress   = getXpProgressToNextLevel(live.xp_total)
  const isMaxLevel   = xpProgress.needed === 0
  const xpPct        = isMaxLevel ? 100 : xpProgress.percentage
  const almostLevel  = !isMaxLevel && xpPct >= 80  // últimos 20% → barra pulsa

  return (
    <header
      className={`md:hidden sticky top-0 z-30 transition-all safe-area-pt ${
        scrolled ? 'backdrop-blur-xl border-b border-border' : ''
      }`}
      style={{
        background: scrolled ? 'rgba(5,9,20,0.92)' : 'transparent',
      }}
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        {/* Logo */}
        <Link href="/dashboard" className="shrink-0 active:opacity-70 transition-opacity">
          <span className="heading-display text-xl gradient-text">⚡ Ascendia</span>
        </Link>

        {/* Stats pills */}
        <div className="flex items-center gap-2 flex-1 justify-center relative">
          {/* XP bump flutuante */}
          {xpBump && (
            <div
              key={xpBump.timestamp}
              className="absolute -top-5 left-1/2 -translate-x-1/2 text-[11px] font-black animate-xp-bump pointer-events-none whitespace-nowrap"
              style={{ color: '#F5C842', zIndex: 10 }}
            >
              +{xpBump.amount} XP ⚡
            </div>
          )}

          {/* Pill de level */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all"
            style={{
              background: 'rgba(245,200,66,0.12)',
              border:     '1px solid rgba(245,200,66,0.2)',
              color:      '#F5C842',
            }}
          >
            <Zap size={10} fill="currentColor" />
            Nv {live.level}
          </div>

          {/* Pill de streak */}
          {live.streak_current > 0 && (
            <div
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all"
              style={{
                background: live.streak_current >= 7 ? 'rgba(255,77,0,0.12)' : 'rgba(255,255,255,0.06)',
                border:     `1px solid ${live.streak_current >= 7 ? 'rgba(255,77,0,0.3)' : 'rgba(255,255,255,0.08)'}`,
                color:      live.streak_current >= 7 ? '#FF4D00' : '#8899BB',
              }}
            >
              <Flame size={10} />
              {live.streak_current}
            </div>
          )}
        </div>

        {/* Ações */}
        <div className="flex items-center gap-2 shrink-0">
          <NotificationBell initialUnread={unreadNotifications} />
          <CommandPalette variant="icon" />
          <Link
            href="/perfil"
            className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0"
            style={{ background: 'linear-gradient(135deg, #FF4D00, #7C3AED)', color: 'white' }}
          >
            {initials || '?'}
          </Link>
        </div>
      </div>

      {/* Barra de progresso de XP — persiste no topo para motivar */}
      {!isMaxLevel && (
        <div
          className="h-0.5 w-full overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.04)' }}
          title={`${xpProgress.current.toLocaleString('pt-BR')} / ${xpProgress.needed.toLocaleString('pt-BR')} XP`}
          aria-label={`Progresso XP: ${xpPct}%`}
        >
          <div
            className="h-full rounded-full"
            style={{
              width:      `${xpPct}%`,
              background: almostLevel
                ? 'linear-gradient(90deg, #F5C842, #FF9500)'
                : 'linear-gradient(90deg, rgba(245,200,66,0.5), rgba(255,149,0,0.5))',
              boxShadow:   almostLevel ? '0 0 6px rgba(245,200,66,0.6)' : 'none',
              transition:  'width 0.8s cubic-bezier(0.34, 1.2, 0.64, 1)',
              animation:   almostLevel ? 'pulseGlow 1.8s ease-in-out infinite' : 'none',
            }}
          />
        </div>
      )}
    </header>
  )
}
