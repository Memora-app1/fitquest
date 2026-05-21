import Link from 'next/link'
import { Plus, Dumbbell, CheckSquare, Wallet, Target } from 'lucide-react'

const ACTIONS = [
  { href: '/treinos/novo', label: 'Treino', icon: Dumbbell, color: 'text-brand-orange' },
  { href: '/tarefas?new=1', label: 'Tarefa', icon: CheckSquare, color: 'text-brand-purple' },
  { href: '/financas/transacoes?new=1', label: 'Transação', icon: Wallet, color: 'text-brand-green' },
  { href: '/habitos?new=1', label: 'Hábito', icon: Target, color: 'text-brand-gold' },
]

export function QuickActions() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {ACTIONS.map((action) => {
        const Icon = action.icon
        return (
          <Link
            key={action.href}
            href={action.href}
            className="card p-4 flex items-center gap-3 hover:border-brand-orange/40 transition-all group"
          >
            <div
              className={`w-10 h-10 rounded-lg bg-bg-elevated flex items-center justify-center ${action.color} group-hover:scale-110 transition-transform`}
            >
              <Icon size={18} />
            </div>
            <div>
              <div className="text-xs text-text-muted">Adicionar</div>
              <div className="font-bold">{action.label}</div>
            </div>
            <Plus size={16} className="text-text-muted ml-auto" />
          </Link>
        )
      })}
    </div>
  )
}
