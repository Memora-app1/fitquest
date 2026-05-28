'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export function LandingNavbar() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 80)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: 'rgba(5,9,20,0.90)',
        backdropFilter: visible ? 'blur(20px)' : 'none',
        WebkitBackdropFilter: visible ? 'blur(20px)' : 'none',
        borderBottom: visible ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
        transform: visible ? 'translateY(0)' : 'translateY(-100%)',
      }}
    >
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="heading-display text-xl gradient-text select-none">
          ⚡ Ascendia
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm text-text-secondary hover:text-white transition-colors"
          >
            Entrar
          </Link>
          <Link
            href="/signup"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:scale-105 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #FF4D00, #7C3AED)',
              boxShadow: '0 4px 16px rgba(255,77,0,0.25)',
            }}
          >
            Começar grátis →
          </Link>
        </div>
      </div>
    </nav>
  )
}
