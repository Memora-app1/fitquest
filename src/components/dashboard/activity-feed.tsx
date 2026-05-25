import { Zap } from 'lucide-react'

interface XpTransaction {
  id: string
  amount: number
  reason: string
  source_type: string
  created_at: string
}

const SOURCE_ICONS: Record<string, string> = {
  habit: '🎯',
  workout: '💪',
  task: '✅',
  perfect_day: '⭐',
  streak_milestone: '🔥',
  achievement: '🏆',
  finance_goal: '💰',
  system: '⚡',
}

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (days > 0) return `${days}d atrás`
  if (hours > 0) return `${hours}h atrás`
  if (mins > 0) return `${mins}min atrás`
  return 'agora'
}

export function ActivityFeed({ transactions }: { transactions: XpTransaction[] }) {
  if (transactions.length === 0) {
    return (
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Zap size={18} className="text-brand-gold" />
          <h2 className="font-bold">Atividade Recente</h2>
        </div>
        <div className="text-center py-6">
          <div className="text-3xl mb-2">🌱</div>
          <p className="text-text-muted text-sm">Comece a ganhar XP registrando seus primeiros hábitos!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 mb-4">
        <Zap size={18} className="text-brand-gold" />
        <h2 className="font-bold">Atividade Recente</h2>
        <span className="text-xs text-text-muted ml-auto">Últimas 48h</span>
      </div>

      <div className="space-y-2">
        {transactions.map((tx) => (
          <div
            key={tx.id}
            className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-bg-elevated transition-colors"
          >
            <div className="text-xl w-8 text-center shrink-0">
              {SOURCE_ICONS[tx.source_type] ?? '⚡'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{tx.reason}</div>
              <div className="text-xs text-text-muted">{timeAgo(tx.created_at)}</div>
            </div>
            <div className="text-brand-gold font-bold text-sm shrink-0">
              +{tx.amount} XP
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
