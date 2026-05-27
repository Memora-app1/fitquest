'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Zap, Flame } from 'lucide-react'
import { CommandPalette } from '@/components/command-palette'

interface MobileHeaderProps {
  name: string
  level: number
  xpTotal: number
  streakCurrent: number
}

export function MobileHeader({ name, level, xpTotal, streakCurrent }: MobileHeaderProps) {
  const [scrolled, setScrolled] = useState(false)

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

  return (
    <header
      className={`md:hidden sticky top-0 z-30 flex items-center justify-between gap-3 px-4 py-3 transition-all ${
        scrolled ? 'backdrop-blur-xl border-b border-border' : ''
      }`}
      style={{
        background: scrolled ? 'rgba(5,9,20,0.92)' : 'transparent',
      }}
    >
      {/* Logo */}
      <Link href="/dashboard" className="shrink-0">
        <span className="heading-display text-xl gradient-text">⚡ FQ</span>
      </Link>

      {/* Stats pill */}
      <div className="flex items-center gap-2 flex-1 justify-center">
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
          style={{ background: 'rgba(245,200,66,0.12)', border: '1px solid rgba(245,200,66,0.2)', color: '#F5C842' }}
        >
          <Zap size={10} fill="currentColor" />
          Nv {level}
        </div>
        {streakCurrent > 0 && (
          <div
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold"
            style={{
              background: streakCurrent >= 7 ? 'rgba(255,77,0,0.12)' : 'rgba(255,255,255,0.06)',
              border: `1px solid ${streakCurrent >= 7 ? 'rgba(255,77,0,0.3)' : 'rgba(255,255,255,0.08)'}`,
              color: streakCurrent >= 7 ? '#FF4D00' : '#8899BB',
            }}
          >
            <Flame size={10} />
            {streakCurrent}
          </div>
        )}
      </div>

      {/* Avatar + search */}
      <div className="flex items-center gap-2 shrink-0">
        <CommandPalette variant="icon" />
        <Link
          href="/perfil"
          className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0"
          style={{ background: 'linear-gradient(135deg, #FF4D00, #7C3AED)', color: 'white' }}
        >
          {initials || '?'}
        </Link>
      </div>
    </header>
  )
}
