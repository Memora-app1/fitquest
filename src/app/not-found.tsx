import Link from 'next/link'
import type { Metadata } from 'next'
import { Home, LayoutDashboard, Dumbbell, CheckSquare, Wallet } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Página não encontrada — Ascendia',
  robots: { index: false },
}

const QUICK_LINKS = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', color: 'text-brand-orange', bg: 'bg-brand-orange/10', rgb: '255,77,0' },
  { href: '/habitos', icon: CheckSquare, label: 'Hábitos', color: 'text-brand-purple', bg: 'bg-brand-purple/10', rgb: '124,58,237' },
  { href: '/treinos', icon: Dumbbell, label: 'Treinos', color: 'text-brand-green', bg: 'bg-brand-green/10', rgb: '0,255,136' },
  { href: '/financas', icon: Wallet, label: 'Finanças', color: 'text-brand-gold', bg: 'bg-brand-gold/10', rgb: '245,200,66' },
]

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-orange/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-purple/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-lg relative z-10 animate-slide-up">
        <div
          className="p-10 text-center space-y-6 rounded-2xl relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(255,77,0,0.07) 0%, rgba(124,58,237,0.05) 50%, rgba(13,24,41,0.99) 100%)',
            border: '1px solid rgba(255,77,0,0.2)',
            boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
          }}
        >
          <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(255,77,0,0.1) 0%, transparent 70%)' }} />
          <div className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 70%)' }} />
          {/* 404 */}
          <div className="relative">
            <div className="heading-display text-[120px] leading-none gradient-text opacity-20 select-none">
              404
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-6xl">🏋️</div>
            </div>
          </div>

          {/* Text */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Página não encontrada</h1>
            <p className="text-text-secondary">
              Essa página foi embora treinar e ainda não voltou.
            </p>
            <p className="text-sm text-text-muted">
              Mas não deixe isso parar seu progresso — veja onde você quer ir:
            </p>
          </div>

          {/* Quick links grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {QUICK_LINKS.map((link) => {
              const Icon = link.icon
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="p-3 flex flex-col items-center gap-2 text-center transition-all group rounded-xl"
                  style={{
                    background: `rgba(${link.rgb},0.05)`,
                    border: `1px solid rgba(${link.rgb},0.2)`,
                  }}
                >
                  <div className={`w-9 h-9 rounded-xl ${link.bg} flex items-center justify-center`}>
                    <Icon size={18} className={link.color} />
                  </div>
                  <span className="text-xs font-medium text-text-secondary group-hover:text-white transition-colors">
                    {link.label}
                  </span>
                </Link>
              )
            })}
          </div>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/dashboard" className="btn-primary flex-1 flex items-center justify-center gap-2">
              <LayoutDashboard size={16} />
              Ir ao Dashboard
            </Link>
            <Link href="/" className="btn-ghost flex-1 flex items-center justify-center gap-2">
              <Home size={16} />
              Página inicial
            </Link>
          </div>

          {/* XP joke */}
          <div className="text-xs text-text-muted flex items-center justify-center gap-1.5">
            <span>+0 XP por encontrar o 404</span>
            <span className="text-brand-gold">😅</span>
          </div>
        </div>
      </div>
    </main>
  )
}
