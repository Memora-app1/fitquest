'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, Gamepad2, BarChart3, Megaphone,
  ShieldAlert, ChevronRight, LogOut, Zap, Flag, Bell, Image as ImageIcon,
  Trophy, Lock,
} from 'lucide-react'

interface NavItem {
  label:    string
  href:     string
  icon:     React.ReactNode
  minRole?: string
  children?: { label: string; href: string }[]
}

const NAV: NavItem[] = [
  {
    label: 'Overview',
    href:  '/admin',
    icon:  <LayoutDashboard size={16} />,
  },
  {
    label: 'Usuários',
    href:  '/admin/usuarios',
    icon:  <Users size={16} />,
  },
  {
    label: 'Gamificação',
    href:  '/admin/gamificacao',
    icon:  <Gamepad2 size={16} />,
    children: [
      { label: 'Concessão de XP',  href: '/admin/gamificacao/xp' },
      { label: 'Temporadas',        href: '/admin/gamificacao/temporadas' },
      { label: 'Conquistas',        href: '/admin/gamificacao/conquistas' },
      { label: 'Guilds',            href: '/admin/gamificacao/guilds' },
    ],
  },
  {
    label: 'Analytics',
    href:  '/admin/analytics',
    icon:  <BarChart3 size={16} />,
    children: [
      { label: 'Crescimento',  href: '/admin/analytics/crescimento' },
      { label: 'Retenção',     href: '/admin/analytics/retencao' },
      { label: 'Receita',      href: '/admin/analytics/receita' },
      { label: 'Engajamento',  href: '/admin/analytics/engajamento' },
    ],
  },
  {
    label: 'Operações',
    href:  '/admin/operacoes',
    icon:  <Megaphone size={16} />,
    children: [
      { label: 'Notificações',   href: '/admin/operacoes/notificacoes' },
      { label: 'Banners',        href: '/admin/operacoes/banners' },
      { label: 'Feature Flags',  href: '/admin/operacoes/feature-flags' },
    ],
  },
  {
    label: 'Segurança',
    href:  '/admin/seguranca',
    icon:  <ShieldAlert size={16} />,
    children: [
      { label: 'Audit Log',   href: '/admin/seguranca/audit-log' },
      { label: 'Denúncias',   href: '/admin/seguranca/denuncias' },
      { label: 'Suspensões',  href: '/admin/seguranca/suspensoes' },
    ],
  },
]

function NavLink({ item }: { item: NavItem }) {
  const pathname = usePathname()
  const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))

  if (item.children) {
    const childActive = item.children.some(c => pathname.startsWith(c.href))
    const open = isActive || childActive

    return (
      <div>
        <Link
          href={item.href}
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all"
          style={{
            color:      open ? '#FF4D00' : '#8899BB',
            background: open ? 'rgba(255,77,0,0.08)' : 'transparent',
          }}
        >
          <span style={{ color: open ? '#FF4D00' : '#8899BB' }}>{item.icon}</span>
          <span className="flex-1">{item.label}</span>
          <ChevronRight
            size={12}
            style={{
              color:     open ? '#FF4D00' : '#8899BB',
              transform: open ? 'rotate(90deg)' : 'none',
              transition: 'transform 0.2s',
            }}
          />
        </Link>
        {open && (
          <div className="ml-6 mt-0.5 space-y-0.5">
            {item.children.map(child => {
              const childIsActive = pathname === child.href
              return (
                <Link
                  key={child.href}
                  href={child.href}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{
                    color:      childIsActive ? '#fff' : '#8899BB',
                    background: childIsActive ? 'rgba(255,77,0,0.12)' : 'transparent',
                    borderLeft: childIsActive ? '2px solid #FF4D00' : '2px solid transparent',
                  }}
                >
                  {child.label}
                </Link>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  return (
    <Link
      href={item.href}
      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all"
      style={{
        color:      isActive ? '#FF4D00' : '#8899BB',
        background: isActive ? 'rgba(255,77,0,0.08)' : 'transparent',
      }}
    >
      <span style={{ color: isActive ? '#FF4D00' : '#8899BB' }}>{item.icon}</span>
      {item.label}
    </Link>
  )
}

interface AdminShellProps {
  children:   React.ReactNode
  adminEmail: string
  adminRole:  string
}

export function AdminShell({ children, adminEmail, adminRole }: AdminShellProps) {
  const roleColors: Record<string, string> = {
    super_admin: '#FF4D00',
    admin:       '#7C3AED',
    moderator:   '#00FF88',
    support:     '#3B82F6',
    analyst:     '#F5C842',
  }
  const roleLabels: Record<string, string> = {
    super_admin: 'Super Admin',
    admin:       'Admin',
    moderator:   'Moderador',
    support:     'Suporte',
    analyst:     'Analista',
  }

  const color = roleColors[adminRole] ?? '#8899BB'

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#050914' }}>

      {/* Sidebar */}
      <aside
        className="w-60 shrink-0 flex flex-col border-r overflow-y-auto"
        style={{ borderColor: 'rgba(124,58,237,0.15)', background: '#0A0F1E' }}
      >
        {/* Logo */}
        <div className="px-4 py-5 border-b" style={{ borderColor: 'rgba(124,58,237,0.15)' }}>
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(255,77,0,0.15)', border: '1px solid rgba(255,77,0,0.3)' }}
            >
              <Lock size={14} style={{ color: '#FF4D00' }} />
            </div>
            <div>
              <div className="text-xs font-black tracking-tight" style={{ color: '#fff' }}>
                Ascendia
              </div>
              <div className="text-[10px] font-semibold" style={{ color: '#FF4D00' }}>
                Admin Panel
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV.map(item => (
            <NavLink key={item.href} item={item} />
          ))}
        </nav>

        {/* Admin info */}
        <div className="px-3 py-4 border-t" style={{ borderColor: 'rgba(124,58,237,0.15)' }}>
          <div className="px-3 py-2.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div className="flex items-center gap-2 mb-1">
              <div
                className="w-2 h-2 rounded-full"
                style={{ background: color }}
              />
              <span className="text-[11px] font-bold" style={{ color }}>
                {roleLabels[adminRole] ?? adminRole}
              </span>
            </div>
            <p className="text-[11px] truncate" style={{ color: '#8899BB' }}>{adminEmail}</p>
          </div>
          <Link
            href="/dashboard"
            className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all hover:bg-white/5"
            style={{ color: '#8899BB' }}
          >
            <LogOut size={13} />
            Voltar ao App
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
