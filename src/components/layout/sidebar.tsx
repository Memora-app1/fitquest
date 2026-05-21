'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  CheckSquare,
  Dumbbell,
  Wallet,
  BarChart3,
  Bot,
  Calendar,
  Target,
  User,
  LogOut,
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/habitos', label: 'Hábitos', icon: Target },
  { href: '/treinos', label: 'Treinos', icon: Dumbbell },
  { href: '/tarefas', label: 'Tarefas', icon: CheckSquare },
  { href: '/financas', label: 'Finanças', icon: Wallet },
  { href: '/score', label: 'Score', icon: BarChart3 },
  { href: '/calendario', label: 'Calendário', icon: Calendar },
  { href: '/coach', label: 'Coach IA', icon: Bot },
]

export function Sidebar({
  profile,
}: {
  profile: { name: string; xp_total: number; level: number; streak_current: number }
}) {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex w-64 bg-bg-card border-r border-border flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <Link href="/dashboard" className="block">
          <span className="heading-display text-2xl gradient-text">⚡ FitQuest</span>
        </Link>
      </div>

      {/* Stats compactos */}
      <div className="p-4 border-b border-border space-y-2">
        <div className="text-xs text-text-muted uppercase tracking-wider">Você</div>
        <div className="font-bold">{profile.name}</div>
        <div className="flex gap-3 text-sm">
          <span className="text-brand-gold font-bold">Nv {profile.level}</span>
          <span className="text-text-secondary">{profile.xp_total} XP</span>
        </div>
        {profile.streak_current > 0 && (
          <div className="text-sm">
            🔥 <span className="font-bold">{profile.streak_current}</span>{' '}
            <span className="text-text-secondary">dias</span>
          </div>
        )}
      </div>

      {/* Navegação */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                active
                  ? 'bg-gradient-brand text-white font-medium shadow-lg shadow-brand-orange/20'
                  : 'text-text-secondary hover:bg-bg-elevated hover:text-white'
              )}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-border space-y-1">
        <Link
          href="/perfil"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-text-secondary hover:bg-bg-elevated hover:text-white transition-colors"
        >
          <User size={18} />
          Perfil
        </Link>
        <form action="/api/auth/logout" method="POST">
          <button
            type="submit"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-text-secondary hover:bg-bg-elevated hover:text-brand-red transition-colors"
          >
            <LogOut size={18} />
            Sair
          </button>
        </form>
      </div>
    </aside>
  )
}
