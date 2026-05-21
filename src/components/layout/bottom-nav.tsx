'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, CheckSquare, Dumbbell, Wallet, Bot } from 'lucide-react'

const ITEMS = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/tarefas', label: 'Tarefas', icon: CheckSquare },
  { href: '/treinos', label: 'Fitness', icon: Dumbbell },
  { href: '/financas', label: 'Finanças', icon: Wallet },
  { href: '/coach', label: 'Coach', icon: Bot },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-bg-card border-t border-border safe-area-pb">
      <div className="grid grid-cols-5">
        {ITEMS.map((item) => {
          const Icon = item.icon
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 py-3 transition-colors',
                active ? 'text-brand-orange' : 'text-text-muted'
              )}
            >
              <Icon size={20} />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
