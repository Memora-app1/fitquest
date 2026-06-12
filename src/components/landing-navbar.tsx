'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export function LandingNavbar() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 80);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      className="fixed left-0 right-0 top-0 z-50 transition-all duration-300"
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
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
        <Link href="/" className="heading-display gradient-text select-none text-xl">
          ⚡ Ascendia
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm text-text-secondary transition-colors hover:text-white"
          >
            Entrar
          </Link>
          <Link
            href="/signup"
            className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold text-white transition-all hover:scale-105 active:scale-95"
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
  );
}
