import Link from 'next/link'
import { Dumbbell, CheckSquare, Wallet, Target, Bot } from 'lucide-react'

const ACTIONS = [
  {
    href: '/treinos/novo',
    label: 'Treino',
    sub: '+300 XP',
    icon: Dumbbell,
    color: 'text-brand-orange',
    bg: 'bg-brand-orange/10 group-hover:bg-brand-orange/20',
    border: 'hover:border-brand-orange/50',
  },
  {
    href: '/tarefas',
    label: 'Tarefa',
    sub: '+30–50 XP',
    icon: CheckSquare,
    color: 'text-brand-purple',
    bg: 'bg-brand-purple/10 group-hover:bg-brand-purple/20',
    border: 'hover:border-brand-purple/50',
  },
  {
    href: '/financas/transacoes',
    label: 'Transação',
    sub: '+25 XP',
    icon: Wallet,
    color: 'text-brand-green',
    bg: 'bg-brand-green/10 group-hover:bg-brand-green/20',
    border: 'hover:border-brand-green/50',
  },
  {
    href: '/habitos',
    label: 'Hábito',
    sub: '+50 XP',
    icon: Target,
    color: 'text-brand-gold',
    bg: 'bg-brand-gold/10 group-hover:bg-brand-gold/20',
    border: 'hover:border-brand-gold/50',
  },
  {
    href: '/coach',
    label: 'Coach IA',
    sub: 'Pergunte algo',
    icon: Bot,
    color: 'text-brand-blue',
    bg: 'bg-brand-blue/10 group-hover:bg-brand-blue/20',
    border: 'hover:border-brand-blue/50',
  },
]

export function QuickActions() {
  return (
    <div>
      <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">Ação rápida</h2>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {ACTIONS.map((action) => {
          const Icon = action.icon
          return (
            <Link
              key={action.href}
              href={action.href}
              className={`card p-3 flex flex-col items-center gap-2 text-center transition-all group ${action.border}`}
            >
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${action.bg}`}
              >
                <Icon size={20} className={action.color} />
              </div>
              <div>
                <div className="font-semibold text-sm leading-tight">{action.label}</div>
                <div className="text-[10px] text-text-muted mt-0.5">{action.sub}</div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
