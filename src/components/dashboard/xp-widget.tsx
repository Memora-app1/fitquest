import Link from 'next/link';
import { getLevelInfo, getXpProgressToNextLevel } from '@/lib/xp';
import { Trophy, ChevronRight, Zap } from 'lucide-react';

export function XpWidget({ xpTotal, level }: { xpTotal: number; level: number }) {
  const info = getLevelInfo(level);
  const { current, needed, percentage } = getXpProgressToNextLevel(xpTotal);

  const isMaxLevel = needed === 0;

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-6"
      style={{
        background:
          'linear-gradient(135deg, rgba(245,200,66,0.1) 0%, rgba(13,24,41,0.98) 60%, rgba(255,77,0,0.05) 100%)',
        border: '1px solid rgba(245,200,66,0.25)',
        boxShadow: '0 4px 24px rgba(245,200,66,0.06)',
      }}
    >
      {/* Corner glow */}
      <div
        className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full blur-2xl"
        style={{ background: 'rgba(245,200,66,0.18)' }}
      />

      <div className="relative z-10">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <div className="mb-1.5 flex items-center gap-1.5 text-xs uppercase tracking-wider text-text-muted">
              <Trophy size={11} className="text-brand-gold" />
              Level {level} de 8
            </div>
            <div
              className="heading-display text-3xl leading-tight"
              style={{ viewTransitionName: 'xp-level-title' }}
            >
              {info.emoji} {info.title}
            </div>
          </div>
          <div className="text-right">
            <div
              className="heading-display flex items-center justify-end gap-1.5 text-3xl leading-tight text-brand-gold"
              style={{ viewTransitionName: 'xp-total-counter' }}
            >
              <Zap size={20} fill="currentColor" className="text-brand-gold" />
              {xpTotal.toLocaleString('pt-BR')}
            </div>
            <div className="text-xs uppercase tracking-wider text-text-muted">XP Total</div>
          </div>
        </div>

        {isMaxLevel ? (
          <div
            className="rounded-xl py-3 text-center text-sm font-bold"
            style={{
              background: 'rgba(245,200,66,0.1)',
              border: '1px solid rgba(245,200,66,0.2)',
              color: '#F5C842',
            }}
          >
            🏆 Nível máximo alcançado!
          </div>
        ) : (
          <>
            <div
              className="mb-2 h-3 overflow-hidden rounded-full"
              style={{ background: 'rgba(255,255,255,0.06)' }}
            >
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
              <span className="font-medium text-brand-gold">
                {(needed - current).toLocaleString('pt-BR')} XP → lv {level + 1}
              </span>
            </div>
          </>
        )}

        <Link
          href="/score"
          className="mt-4 flex items-center justify-center gap-1.5 text-xs text-text-muted transition-colors hover:text-brand-gold"
        >
          Ver conquistas e histórico <ChevronRight size={12} />
        </Link>
      </div>
    </div>
  );
}
