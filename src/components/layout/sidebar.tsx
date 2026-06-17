'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { getLevelInfo, getXpProgressToNextLevel } from '@/lib/xp';
import { CommandPalette } from '@/components/command-palette';
import { useRealtimeCtx } from '@/hooks/use-realtime-context';
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
  Heart,
  Trophy,
  Medal,
  Shield,
  Sparkles,
  Users,
  Layers,
  Bell,
  Store,
  Swords,
  Timer,
} from 'lucide-react';
import { NotificationBell } from './notification-bell';

const NAV_SECTIONS = [
  {
    label: 'Principal',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/score', label: 'Score & XP', icon: BarChart3 },
      { href: '/conquistas', label: 'Conquistas', icon: Trophy },
      { href: '/ranking', label: 'Ranking', icon: Medal },
      { href: '/guilds', label: 'Guilds', icon: Users },
      { href: '/seasons', label: 'Temporada', icon: Layers },
      { href: '/desafios', label: 'Desafios', icon: Swords },
      { href: '/loja', label: 'Loja XP', icon: Store },
    ],
  },
  {
    label: 'Evolução',
    items: [
      { href: '/habitos', label: 'Hábitos', icon: Target },
      { href: '/metas', label: 'Metas', icon: Flag },
      { href: '/treinos', label: 'Treinos', icon: Dumbbell },
      { href: '/saude', label: 'Saúde', icon: Heart },
    ],
  },
  {
    label: 'Organização',
    items: [
      { href: '/tarefas', label: 'Tarefas', icon: CheckSquare },
      { href: '/foco', label: 'Modo Foco', icon: Timer },
      { href: '/financas', label: 'Finanças', icon: Wallet },
      { href: '/calendario', label: 'Calendário', icon: Calendar },
    ],
  },
  {
    label: 'IA',
    items: [{ href: '/coach', label: 'Coach IA', icon: Bot }],
  },
  {
    label: 'Conta',
    items: [{ href: '/notificacoes', label: 'Notificações', icon: Bell }],
  },
];

export function Sidebar({
  profile,
  unreadNotifications = 0,
}: {
  profile: { name: string; xp_total: number; level: number; streak_current: number };
  unreadNotifications?: number;
}) {
  const pathname = usePathname();
  const { profile: live, xpBump } = useRealtimeCtx();

  const levelInfo = getLevelInfo(live.level);
  const progress = getXpProgressToNextLevel(live.xp_total);
  const levelColors: Record<number, string> = {
    1: '#8899BB',
    2: '#7C3AED',
    3: '#3B82F6',
    4: '#00FF88',
    5: '#FF4D00',
    6: '#EC4899',
    7: '#F5C842',
    8: '#F5C842',
  };
  const levelColor = levelColors[live.level] ?? '#F5C842';
  const nearMiss = progress.percentage >= 80 && progress.needed > 0;

  const initials = profile.name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <aside className="sticky top-0 hidden h-screen w-64 flex-col overflow-hidden border-r border-border bg-bg-card md:flex">
      {/* Logo */}
      <div className="flex items-center justify-between border-b border-border p-5">
        <Link href="/dashboard" className="block">
          <span className="heading-display gradient-text text-2xl">⚡ Ascendia</span>
        </Link>
        <NotificationBell initialUnread={unreadNotifications} />
      </div>

      {/* Profile card */}
      <div className="relative overflow-hidden border-b border-border p-4">
        {/* Subtle glow */}
        <div className="bg-brand-orange/8 pointer-events-none absolute -right-4 -top-4 h-24 w-24 rounded-full blur-2xl" />

        <div className="mb-3 flex items-center gap-3">
          {/* Avatar */}
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold"
            style={{ background: 'linear-gradient(135deg, #FF4D00, #7C3AED)', color: 'white' }}
          >
            {initials || '?'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">{profile.name}</div>
            <div className="mt-0.5 flex items-center gap-1.5">
              <span className="text-[11px] font-bold" style={{ color: levelColor }}>
                {levelInfo.emoji} {levelInfo.title}
              </span>
              <span className="text-[10px] text-text-muted">Nv {live.level}</span>
            </div>
          </div>
        </div>

        {/* XP progress */}
        <div className="relative space-y-1.5">
          {xpBump && (
            <div
              key={xpBump.timestamp}
              className="pointer-events-none absolute -top-1 right-0 animate-xp-bump text-[11px] font-black"
              style={{ color: '#F5C842', zIndex: 10 }}
            >
              +{xpBump.amount} XP ⚡
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1 text-[11px] text-text-muted">
              <Zap size={10} className="text-brand-gold" />
              {live.xp_total.toLocaleString('pt-BR')} XP
            </span>
            {progress.needed > 0 && (
              <span
                className={`text-[10px] ${nearMiss ? 'animate-pulse font-bold' : 'text-text-muted'}`}
                style={{ color: nearMiss ? '#F5C842' : undefined }}
              >
                {nearMiss
                  ? `🔥 só faltam ${(progress.needed - progress.current).toLocaleString('pt-BR')}!`
                  : `${(progress.needed - progress.current).toLocaleString('pt-BR')} até nv ${live.level + 1}`}
              </span>
            )}
            {progress.needed === 0 && (
              <span className="text-[10px] text-brand-gold">Máximo! 🏆</span>
            )}
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-bg">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${progress.percentage}%`,
                background: nearMiss
                  ? 'linear-gradient(90deg, #F5C842, #FF4D00)'
                  : 'linear-gradient(90deg, #FF4D00, #7C3AED)',
              }}
            />
          </div>
        </div>

        {/* Streak */}
        {live.streak_current > 0 && (
          <div className="mt-2.5 flex items-center gap-1.5">
            <Flame size={12} className="text-brand-orange" />
            <span className="text-[11px] font-bold text-brand-orange">{live.streak_current}</span>
            <span className="text-[11px] text-text-muted">dias de sequência</span>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="border-b border-border px-3 py-2.5">
        <CommandPalette />
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-4 overflow-y-auto p-3">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            <div className="mb-1 px-3 text-[10px] uppercase tracking-widest text-text-muted">
              {section.label}
            </div>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all',
                      active
                        ? 'bg-gradient-brand font-semibold text-white shadow-sm shadow-brand-orange/20'
                        : 'text-text-secondary hover:bg-bg-elevated hover:text-white'
                    )}
                  >
                    <Icon size={16} className={active ? 'text-white' : ''} />
                    {item.label}
                    {item.href === '/coach' && (
                      <span className="ml-auto rounded-full bg-brand-purple/30 px-1.5 py-0.5 text-[10px] font-bold text-brand-purple">
                        IA
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="space-y-0.5 border-t border-border p-3">
        <Link
          href="/perfil"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-text-secondary transition-all hover:bg-bg-elevated hover:text-white"
        >
          <User size={16} />
          Meu Perfil
        </Link>
        <form action="/api/auth/logout" method="POST">
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-text-secondary transition-all hover:bg-brand-red/10 hover:text-brand-red"
          >
            <LogOut size={16} />
            Sair
          </button>
        </form>
      </div>
    </aside>
  );
}
