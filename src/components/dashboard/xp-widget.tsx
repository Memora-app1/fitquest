import Link from 'next/link'
import { getLevelInfo, getXpProgressToNextLevel } from '@/lib/xp'
import { Trophy, ChevronRight, Zap } from 'lucide-react'

export function XpWidget({ xpTotal, level }: { xpTotal: number; level: number }) {
  const info = getLevelInfo(level)
  const { current, needed, percentage } = getXpProgressToNextLevel(xpTotal)

  const isMaxLevel = needed === 0

  return (
    <div
      className="rounded-2xl p-6 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(245,200,66,0.1) 0%, rgba(13,24,41,0.98) 60%, rgba(255,77,0,0.05) 100%)',
        border: '1px solid rgba(245,200,66,0.25)',
        boxShadow: '0 4px 24px rgba(245,200,66,0.06)',
      }}
    >
      {/* Corner glow */}
      <div
        className="absolute -top-6 -right-6 w-32 h-32 rounded-full pointer-events-none blur-2xl"
        style={{ background: 'rgba(245,200,66,0.18)' }}
      />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="flex items-center gap-1.5 text-text-muted text-xs uppercase tracking-wider mb-1.5">
              <Trophy size={11} className="text-brand-gold" />
              Level {level} de 8
            </div>
            <div className="heading-display text-3xl leading-tight">
              {info.emoji} {info.title}
            </div>
          </div>
          <div className="text-right">
            <div className="heading-display text-3xl text-brand-gold leading-tight flex items-center gap-1.5 justify-end">
              <Zap size={20} fill="currentColor" className="text-brand-gold" />
              {xpTotal.toLocaleString('pt-BR')}
            </div>
            <div className="text-xs text-text-muted uppercase tracking-wider">XP Total</div>
          </div>
        </div>

        {isMaxLevel ? (
          <div
            className="text-center py-3 rounded-xl font-bold text-sm"
            style={{ background: 'rgba(245,200,66,0.1)', border: '1px solid rgba(245,200,66,0.2)', color: '#F5C842' }}
          >
            🏆 Nível máximo alcançado!
          </div>
        ) : (
          <>
            <div className="h-3 rounded-full overflow-hidden mb-2" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${percentage}%`,
                  background: 'linear-gradient(90deg, #F5C842, #FF9500)',
                  boxShadow: '0 0 8px rgba(245,200,66,0.4)',
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-text-muted">
              <span>{current.toLocaleString('pt-BR')} XP neste nível</span>
              <span className="text-brand-gold font-medium">
                {(needed - current).toLocaleString('pt-BR')} XP → lv {level + 1}
              </span>
            </div>
          </>
        )}

        <Link
          href="/score"
          className="mt-4 flex items-center justify-center gap-1.5 text-xs text-text-muted hover:text-brand-gold transition-colors"
        >
          Ver conquistas e histórico <ChevronRight size={12} />
        </Link>
      </div>
    </div>
  )
}
