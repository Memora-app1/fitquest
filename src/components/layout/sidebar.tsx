'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { getLevelInfo, getXpProgressToNextLevel } from '@/lib/xp'
import { CommandPalette } from '@/components/command-palette'
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
  Flag,
  Zap,
  Flame,
} from 'lucide-react'

const NAV_SECTIONS = [
  {
    label: 'Principal',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/score', label: 'Score & XP', icon: BarChart3 },
    ],
  },
  {
    label: 'Evolução',
    items: [
      { href: '/habitos', label: 'Hábitos', icon: Target },
      { href: '/metas', label: 'Metas', icon: Flag },
      { href: '/treinos', label: 'Treinos', icon: Dumbbell },
    ],
  },
  {
    label: 'Organização',
    items: [
      { href: '/tarefas', label: 'Tarefas', icon: CheckSquare },
      { href: '/financas', label: 'Finanças', icon: Wallet },
      { href: '/calendario', label: 'Calendário', icon: Calendar },
    ],
  },
  {
    label: 'IA',
    items: [
      { href: '/coach', label: 'Coach IA', icon: Bot },
    ],
  },
]

export function Sidebar({
  profile,
}: {
  profile: { name: string; xp_total: number; level: number; streak_current: number }
}) {
  const pathname = usePathname()
  const levelInfo = getLevelInfo(profile.level)
  const progress = getXpProgressToNextLevel(profile.xp_total)
  const levelColors: Record<number, string> = {
    1: '#8899BB', 2: '#7C3AED', 3: '#3B82F6', 4: '#00FF88',
    5: '#FF4D00', 6: '#EC4899', 7: '#F5C842', 8: '#F5C842',
  }
  const levelColor = levelColors[profile.level] ?? '#F5C842'

  const initials = profile.name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')

  return (
    <aside className="hidden md:flex w-64 bg-bg-card border-r border-border flex-col h-screen sticky top-0 overflow-hidden">
      {/* Logo */}
      <div className="p-5 border-b border-border">
        <Link href="/dashboard" className="block">
          <span className="heading-display text-2xl gradient-text">⚡ FitQuest</span>
        </Link>
      </div>

      {/* Profile card */}
      <div className="p-4 border-b border-border relative overflow-hidden">
        {/* Subtle glow */}
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-brand-orange/8 blur-2xl rounded-full pointer-events-none" />

        <div className="flex items-center gap-3 mb-3">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
            style={{ background: 'linear-gradient(135deg, #FF4D00, #7C3AED)', color: 'white' }}
          >
            {initials || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm truncate">{profile.name}</div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[11px] font-bold" style={{ color: levelColor }}>
                {levelInfo.emoji} {levelInfo.title}
              </span>
              <span className="text-[10px] text-text-muted">Nv {profile.level}</span>
            </div>
          </div>
        </div>

        {/* XP progress */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-[11px] text-text-muted flex items-center gap-1">
              <Zap size={10} className="text-brand-gold" />
              {profile.xp_total.toLocaleString('pt-BR')} XP
            </span>
            {progress.needed > 0 && (
              <span className="text-[10px] text-text-muted">
                {(progress.needed - progress.current).toLocaleString('pt-BR')} até nv {profile.level + 1}
              </span>
            )}
            {progress.needed === 0 && (
              <span className="text-[10px] text-brand-gold">Máximo! 🏆</span>
            )}
          </div>
          <div className="h-1.5 bg-bg rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${progress.percentage}%`,
                background: 'linear-gradient(90deg, #FF4D00, #7C3AED)',
              }}
            />
          </div>
        </div>

        {/* Streak */}
        {profile.streak_current > 0 && (
          <div className="mt-2.5 flex items-center gap-1.5">
            <Flame size={12} className="text-brand-orange" />
            <span className="text-[11px] font-bold text-brand-orange">{profile.streak_current}</span>
            <span className="text-[11px] text-text-muted">dias de sequência</span>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="px-3 py-2.5 border-b border-border">
        <CommandPalette />
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 overflow-y-auto space-y-4">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            <div className="text-[10px] text-text-muted uppercase tracking-widest px-3 mb-1">
              {section.label}
            </div>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon
                const active =
                  pathname === item.href || pathname.startsWith(`${item.href}/`)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm',
                      active
                        ? 'bg-gradient-brand text-white font-semibold shadow-sm shadow-brand-orange/20'
                        : 'text-text-secondary hover:bg-bg-elevated hover:text-white'
                    )}
                  >
                    <Icon size={16} className={active ? 'text-white' : ''} />
                    {item.label}
                    {item.href === '/coach' && (
                      <span className="ml-auto text-[10px] font-bold bg-brand-purple/30 text-brand-purple px-1.5 py-0.5 rounded-full">
                        IA
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-border space-y-0.5">
        <Link
          href="/perfil"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-text-secondary hover:bg-bg-elevated hover:text-white transition-all text-sm"
        >
          <User size={16} />
          Meu Perfil
        </Link>
        <form action="/api/auth/logout" method="POST">
          <button
            type="submit"
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-text-secondary hover:bg-brand-red/10 hover:text-brand-red transition-all text-sm"
          >
            <LogOut size={16} />
            Sair
          </button>
        </form>
      </div>
    </aside>
  )
}
