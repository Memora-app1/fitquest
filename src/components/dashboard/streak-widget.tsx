import { Flame } from 'lucide-react'

export function StreakWidget({
  current,
  longest,
}: {
  current: number
  longest: number
}) {
  return (
    <div className="card-glow p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 text-text-secondary text-sm">
            <Flame size={14} />
            STREAK ATUAL
          </div>
          <div className="heading-display text-5xl text-brand-orange mt-1 flex items-center gap-2">
            🔥 {current}
          </div>
          <div className="text-text-secondary text-sm">
            {current === 1 ? 'dia consecutivo' : 'dias consecutivos'}
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-text-secondary">{longest}</div>
          <div className="text-xs text-text-muted uppercase">Recorde</div>
        </div>
      </div>

      {current === 0 && (
        <div className="text-sm text-text-muted">
          Registre 1 atividade hoje pra começar uma nova sequência
        </div>
      )}
      {current > 0 && current < 7 && (
        <div className="text-sm text-text-secondary">
          Faltam <span className="text-brand-orange font-bold">{7 - current}</span> dias
          pra conquista "Fogo Aceso"
        </div>
      )}
      {current >= 7 && current < 30 && (
        <div className="text-sm text-text-secondary">
          Faltam <span className="text-brand-orange font-bold">{30 - current}</span> dias
          pra conquista "Mês Implacável"
        </div>
      )}
      {current >= 30 && (
        <div className="text-sm text-brand-green">⚡ Você é uma máquina. Continue!</div>
      )}
    </div>
  )
}
