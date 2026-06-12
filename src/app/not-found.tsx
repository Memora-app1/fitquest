import Link from 'next/link';
import type { Metadata } from 'next';
import { Home, LayoutDashboard, Dumbbell, CheckSquare, Wallet } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Página não encontrada — Ascendia',
  robots: { index: false },
};

const QUICK_LINKS = [
  {
    href: '/dashboard',
    icon: LayoutDashboard,
    label: 'Dashboard',
    color: 'text-brand-orange',
    bg: 'bg-brand-orange/10',
    rgb: '255,77,0',
  },
  {
    href: '/habitos',
    icon: CheckSquare,
    label: 'Hábitos',
    color: 'text-brand-purple',
    bg: 'bg-brand-purple/10',
    rgb: '124,58,237',
  },
  {
    href: '/treinos',
    icon: Dumbbell,
    label: 'Treinos',
    color: 'text-brand-green',
    bg: 'bg-brand-green/10',
    rgb: '0,255,136',
  },
  {
    href: '/financas',
    icon: Wallet,
    label: 'Finanças',
    color: 'text-brand-gold',
    bg: 'bg-brand-gold/10',
    rgb: '245,200,66',
  },
];

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden p-6">
      {/* Background glows */}
      <div className="pointer-events-none absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-brand-orange/5 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-brand-purple/5 blur-[120px]" />

      <div className="relative z-10 w-full max-w-lg animate-slide-up">
        <div
          className="relative space-y-6 overflow-hidden rounded-2xl p-10 text-center"
          style={{
            background:
              'linear-gradient(135deg, rgba(255,77,0,0.07) 0%, rgba(124,58,237,0.05) 50%, rgba(13,24,41,0.99) 100%)',
            border: '1px solid rgba(255,77,0,0.2)',
            boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
          }}
        >
          <div
            className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(255,77,0,0.1) 0%, transparent 70%)',
            }}
          />
          <div
            className="pointer-events-none absolute -bottom-8 -left-8 h-40 w-40 rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 70%)',
            }}
          />
          {/* 404 */}
          <div className="relative">
            <div className="heading-display gradient-text select-none text-[120px] leading-none opacity-20">
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
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {QUICK_LINKS.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group flex flex-col items-center gap-2 rounded-xl p-3 text-center transition-all"
                  style={{
                    background: `rgba(${link.rgb},0.05)`,
                    border: `1px solid rgba(${link.rgb},0.2)`,
                  }}
                >
                  <div className={`h-9 w-9 rounded-xl ${link.bg} flex items-center justify-center`}>
                    <Icon size={18} className={link.color} />
                  </div>
                  <span className="text-xs font-medium text-text-secondary transition-colors group-hover:text-white">
                    {link.label}
                  </span>
                </Link>
              );
            })}
          </div>

          {/* CTA buttons */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/dashboard"
              className="btn-primary flex flex-1 items-center justify-center gap-2"
            >
              <LayoutDashboard size={16} />
              Ir ao Dashboard
            </Link>
            <Link href="/" className="btn-ghost flex flex-1 items-center justify-center gap-2">
              <Home size={16} />
              Página inicial
            </Link>
          </div>

          {/* XP joke */}
          <div className="flex items-center justify-center gap-1.5 text-xs text-text-muted">
            <span>+0 XP por encontrar o 404</span>
            <span className="text-brand-gold">😅</span>
          </div>
        </div>
      </div>
    </main>
  );
}
