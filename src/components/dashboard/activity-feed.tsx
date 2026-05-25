import { Zap } from 'lucide-react'

interface XpTransaction {
  id: string
  amount: number
  reason: string
  source_type: string
  created_at: string
}

const SOURCE_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
  habit:            { icon: '🎯', color: '#FF4D00', label: 'Hábito' },
  workout:          { icon: '💪', color: '#00FF88', label: 'Treino' },
  task:             { icon: '✅', color: '#7C3AED', label: 'Tarefa' },
  perfect_day:      { icon: '⭐', color: '#F5C842', label: 'Dia perfeito' },
  streak_milestone: { icon: '🔥', color: '#FF4D00', label: 'Streak' },
  achievement:      { icon: '🏆', color: '#F5C842', label: 'Conquista' },
  finance_goal:     { icon: '💰', color: '#00FF88', label: 'Meta' },
  transaction:      { icon: '💳', color: '#3B82F6', label: 'Finanças' },
  system:           { icon: '⚡', color: '#F5C842', label: 'Sistema' },
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
  const totalXpShown = transactions.reduce((sum, t) => sum + (t.amount || 0), 0)

  if (transactions.length === 0) {
    return (
      <div
        className="rounded-2xl p-6"
        style={{
          background: 'linear-gradient(135deg, rgba(245,200,66,0.05) 0%, rgba(13,24,41,0.98) 100%)',
          border: '1px solid rgba(245,200,66,0.15)',
        }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Zap size={18} className="text-brand-gold" fill="currentColor" />
          <h2 className="font-bold">Atividade Recente</h2>
        </div>
        <div className="text-center py-8">
          <div className="text-4xl mb-3">🌱</div>
          <p className="text-text-secondary text-sm font-medium">Nenhuma atividade ainda</p>
          <p className="text-text-muted text-xs mt-1">Registre um hábito ou complete uma tarefa para ganhar XP</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="rounded-2xl p-6"
      style={{
        background: 'linear-gradient(135deg, rgba(245,200,66,0.06) 0%, rgba(13,24,41,0.98) 100%)',
        border: '1px solid rgba(245,200,66,0.15)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Zap size={18} className="text-brand-gold" fill="currentColor" />
          <h2 className="font-bold">Atividade Recente</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted">48h</span>
          <span
            className="text-xs font-bold px-2.5 py-1 rounded-full"
            style={{ background: 'rgba(245,200,66,0.15)', border: '1px solid rgba(245,200,66,0.3)', color: '#F5C842' }}
          >
            +{totalXpShown} XP
          </span>
        </div>
      </div>

      <div className="space-y-1.5">
        {transactions.map((tx) => {
          const cfg = SOURCE_CONFIG[tx.source_type] ?? SOURCE_CONFIG.system!
          return (
            <div
              key={tx.id}
              className="flex items-center gap-3 p-2.5 rounded-xl transition-colors hover:bg-white/[0.03]"
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0"
                style={{ background: `${cfg.color}15`, border: `1px solid ${cfg.color}25` }}
              >
                {cfg.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{tx.reason}</div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full"
                    style={{ backgroundColor: `${cfg.color}15`, color: cfg.color, border: `1px solid ${cfg.color}20` }}
                  >
                    {cfg.label}
                  </span>
                  <span className="text-[10px] text-text-muted">{timeAgo(tx.created_at)}</span>
                </div>
              </div>
              <div className="text-brand-gold font-bold text-sm shrink-0 flex items-center gap-0.5">
                <Zap size={10} fill="currentColor" className="text-brand-gold" />
                +{tx.amount}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
