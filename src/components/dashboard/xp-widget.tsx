import { getLevelInfo, getXpProgressToNextLevel } from '@/lib/xp'
import { Trophy } from 'lucide-react'

export function XpWidget({ xpTotal, level }: { xpTotal: number; level: number }) {
  const info = getLevelInfo(level)
  const { current, needed, percentage } = getXpProgressToNextLevel(xpTotal)

  return (
    <div className="card-glow p-6 relative">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 text-text-secondary text-sm">
            <Trophy size={14} />
            LEVEL {level}
          </div>
          <div className="heading-display text-4xl mt-1">
            {info.emoji} {info.title}
          </div>
        </div>
        <div className="text-right">
          <div className="heading-display text-3xl text-brand-gold">
            {xpTotal.toLocaleString('pt-BR')}
          </div>
          <div className="text-xs text-text-muted uppercase">XP Total</div>
        </div>
      </div>

      {needed > 0 ? (
        <>
          <div className="h-3 bg-bg-elevated rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-brand transition-all duration-500"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-text-muted mt-2">
            <span>{current.toLocaleString('pt-BR')} XP</span>
            <span>
              {(needed - current).toLocaleString('pt-BR')} XP até nível {level + 1}
            </span>
          </div>
        </>
      ) : (
        <div className="text-center py-2 text-brand-gold font-bold">
          🏆 Nível máximo alcançado
        </div>
      )}
    </div>
  )
}
