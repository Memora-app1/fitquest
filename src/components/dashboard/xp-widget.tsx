import Link from 'next/link'
import { getLevelInfo, getXpProgressToNextLevel } from '@/lib/xp'
import { Trophy, ChevronRight } from 'lucide-react'

export function XpWidget({ xpTotal, level }: { xpTotal: number; level: number }) {
  const info = getLevelInfo(level)
  const { current, needed, percentage } = getXpProgressToNextLevel(xpTotal)

  const isMaxLevel = needed === 0

  return (
    <div className="card-glow p-6 relative overflow-hidden">
      {/* Decorative glow */}
      <div className="absolute -top-4 -right-4 w-24 h-24 bg-brand-gold/10 blur-2xl rounded-full pointer-events-none" />

      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="flex items-center gap-2 text-text-muted text-xs uppercase tracking-wider mb-1">
            <Trophy size={12} />
            Level {level} de 8
          </div>
          <div className="heading-display text-3xl leading-tight">
            {info.emoji} {info.title}
          </div>
        </div>
        <div className="text-right">
          <div className="heading-display text-3xl text-brand-gold leading-tight">
            {xpTotal.toLocaleString('pt-BR')}
          </div>
          <div className="text-xs text-text-muted uppercase tracking-wider">XP Total</div>
        </div>
      </div>

      {isMaxLevel ? (
        <div className="text-center py-3 text-brand-gold font-bold text-sm">
          🏆 Nível máximo alcançado!
        </div>
      ) : (
        <>
          <div className="h-3 bg-bg-elevated rounded-full overflow-hidden mb-2">
            <div
              className="h-full bg-gradient-brand rounded-full transition-all duration-700"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-text-muted">
            <span>{current.toLocaleString('pt-BR')} XP neste nível</span>
            <span className="text-brand-gold">
              {(needed - current).toLocaleString('pt-BR')} até nível {level + 1}
            </span>
          </div>
        </>
      )}

      <Link
        href="/score"
        className="mt-4 flex items-center justify-center gap-1.5 text-xs text-text-muted hover:text-brand-orange transition-colors"
      >
        Ver conquistas e histórico <ChevronRight size={12} />
      </Link>
    </div>
  )
}
