import Link from 'next/link'
import { Dumbbell, CheckSquare, Wallet, Target, Bot, Heart } from 'lucide-react'

const ACTIONS = [
  {
    href: '/treinos/novo',
    label: 'Treino',
    sub: '+300 XP',
    icon: Dumbbell,
    color: '#FF4D00',
    glow: 'rgba(255,77,0,0.18)',
    bg: 'rgba(255,77,0,0.08)',
    border: 'rgba(255,77,0,0.2)',
    hoverBorder: 'rgba(255,77,0,0.5)',
  },
  {
    href: '/tarefas',
    label: 'Tarefa',
    sub: '+30–50 XP',
    icon: CheckSquare,
    color: '#7C3AED',
    glow: 'rgba(124,58,237,0.18)',
    bg: 'rgba(124,58,237,0.08)',
    border: 'rgba(124,58,237,0.2)',
    hoverBorder: 'rgba(124,58,237,0.5)',
  },
  {
    href: '/financas/transacoes',
    label: 'Transação',
    sub: '+25 XP',
    icon: Wallet,
    color: '#00FF88',
    glow: 'rgba(0,255,136,0.18)',
    bg: 'rgba(0,255,136,0.08)',
    border: 'rgba(0,255,136,0.2)',
    hoverBorder: 'rgba(0,255,136,0.5)',
  },
  {
    href: '/habitos',
    label: 'Hábito',
    sub: '+50 XP',
    icon: Target,
    color: '#F5C842',
    glow: 'rgba(245,200,66,0.18)',
    bg: 'rgba(245,200,66,0.08)',
    border: 'rgba(245,200,66,0.2)',
    hoverBorder: 'rgba(245,200,66,0.5)',
  },
  {
    href: '/saude',
    label: 'Saúde',
    sub: '+50 XP',
    icon: Heart,
    color: '#00D9FF',
    glow: 'rgba(0,217,255,0.18)',
    bg: 'rgba(0,217,255,0.08)',
    border: 'rgba(0,217,255,0.2)',
    hoverBorder: 'rgba(0,217,255,0.5)',
  },
  {
    href: '/coach',
    label: 'Coach IA',
    sub: 'Pergunte algo',
    icon: Bot,
    color: '#3B82F6',
    glow: 'rgba(59,130,246,0.18)',
    bg: 'rgba(59,130,246,0.08)',
    border: 'rgba(59,130,246,0.2)',
    hoverBorder: 'rgba(59,130,246,0.5)',
  },
]

export function QuickActions() {
  return (
    <div>
      <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Ação rápida</h2>
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
        {ACTIONS.map((action) => {
          const Icon = action.icon
          return (
            <Link
              key={action.href}
              href={action.href}
              className="group rounded-2xl p-4 flex flex-col items-center gap-2.5 text-center transition-all duration-200 hover:scale-[1.03] relative overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${action.bg} 0%, rgba(13,24,41,0.98) 100%)`,
                border: `1px solid ${action.border}`,
              }}
            >
              {/* corner glow */}
              <div
                className="absolute -top-4 -right-4 w-12 h-12 rounded-full pointer-events-none blur-xl opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ backgroundColor: action.color }}
              />
              <div
                className="relative z-10 w-12 h-12 rounded-xl flex items-center justify-center transition-all"
                style={{
                  background: `${action.color}15`,
                  border: `1px solid ${action.color}30`,
                }}
              >
                <Icon size={22} style={{ color: action.color }} />
              </div>
              <div className="relative z-10">
                <div className="font-semibold text-sm leading-tight">{action.label}</div>
                <div
                  className="text-[10px] mt-0.5 font-medium"
                  style={{ color: `${action.color}CC` }}
                >
                  {action.sub}
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
