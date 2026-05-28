'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, CheckSquare, Dumbbell, Heart, Bot } from 'lucide-react'

const ITEMS = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/tarefas', label: 'Tarefas', icon: CheckSquare },
  { href: '/treinos', label: 'Fitness', icon: Dumbbell },
  { href: '/saude', label: 'Saúde', icon: Heart },
  { href: '/coach', label: 'Coach', icon: Bot },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 safe-area-pb"
      style={{ background: 'rgba(5, 9, 20, 0.92)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className="grid grid-cols-5">
        {ITEMS.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 py-2.5 transition-all relative',
                active ? 'text-brand-orange' : 'text-text-muted hover:text-text-secondary'
              )}
            >
              {/* Active background pill */}
              {active && (
                <div className="absolute top-1 left-1/2 -translate-x-1/2 w-8 h-8 bg-brand-orange/15 rounded-xl" />
              )}
              <Icon
                size={20}
                className={cn('relative z-10', active && 'drop-shadow-[0_0_6px_rgba(255,77,0,0.6)]')}
              />
              <span className={cn(
                'text-[10px] font-medium relative z-10',
                active ? 'text-brand-orange font-semibold' : 'text-text-muted'
              )}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
