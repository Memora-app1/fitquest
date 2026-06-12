'use client';

/**
 * Login Checkin Widget — calendário de 7 dias com recompensas diárias.
 * Faz o check-in automaticamente na primeira visita do dia e exibe a animação.
 */

import { useEffect, useState } from 'react';
import { Zap, Gift, Calendar } from 'lucide-react';
import { getLoginReward } from '@/lib/xp';

interface CheckinResult {
  alreadyDone: boolean;
  loginStreak: number;
  dayInCycle: number;
  xpEarned?: number;
  leveledUp?: boolean;
  lootBox?: boolean;
  isDay7?: boolean;
}

interface Props {
  lastLoginDate: string | null;
  loginStreak: number;
}

const DAY_REWARDS = [20, 30, 50, 75, 100, 150, 300];

export function LoginCheckinWidget({ lastLoginDate, loginStreak }: Props) {
  const [result, setResult] = useState<CheckinResult | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [checking, setChecking] = useState(false);

  const today = new Date().toISOString().split('T')[0]!;
  const alreadyCheckedIn = lastLoginDate === today;

  // Ciclo atual
  const currentDayInCycle = loginStreak > 0 ? ((loginStreak - 1) % 7) + 1 : 0;

  useEffect(() => {
    if (alreadyCheckedIn) return;
    if (checking) return;

    setChecking(true);
    fetch('/api/login-checkin', { method: 'POST' })
      .then((r) => r.json())
      .then((data: CheckinResult) => {
        setResult(data);
        if (!data.alreadyDone) {
          setShowCelebration(true);
          setTimeout(() => setShowCelebration(false), 4000);
        }
      })
      .catch(() => {
        /* ignora */
      })
      .finally(() => setChecking(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const displayStreak = result?.loginStreak ?? loginStreak;
  const displayDayCycle = result?.dayInCycle ?? currentDayInCycle;

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-5"
      style={{
        background:
          'linear-gradient(135deg, rgba(124,58,237,0.08) 0%, rgba(13,24,41,0.98) 70%, rgba(255,77,0,0.05) 100%)',
        border: '1px solid rgba(124,58,237,0.18)',
      }}
    >
      {/* Glow */}
      <div
        className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full blur-3xl"
        style={{ background: 'rgba(124,58,237,0.10)' }}
      />

      {/* Celebração de check-in */}
      {showCelebration && result && !result.alreadyDone && (
        <div
          className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl"
          style={{ background: 'rgba(13,24,41,0.92)', backdropFilter: 'blur(4px)' }}
        >
          <div className="animate-bounce-in text-center">
            <div className="mb-2 text-4xl">{result.isDay7 ? '🎁' : '⚡'}</div>
            <div className="text-xl font-black text-white">
              {result.isDay7 ? 'Dia 7 — Loot Box!' : `Dia ${result.dayInCycle} — Check-in!`}
            </div>
            <div className="mt-2 flex items-center justify-center gap-1">
              <Zap size={14} style={{ color: '#F5C842' }} fill="currentColor" />
              <span className="text-lg font-black" style={{ color: '#F5C842' }}>
                +{result.xpEarned} XP
              </span>
            </div>
            {result.lootBox && (
              <p className="mt-1 text-xs text-text-secondary">Caixa de recompensa desbloqueada!</p>
            )}
          </div>
        </div>
      )}

      <div className="relative z-10">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-lg"
              style={{
                background: 'rgba(124,58,237,0.15)',
                border: '1px solid rgba(124,58,237,0.3)',
              }}
            >
              <Calendar size={13} style={{ color: '#7C3AED' }} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-text-muted">
                Login Diário
              </p>
              <p className="text-sm font-black text-white">
                {displayStreak > 0
                  ? `${displayStreak} dia${displayStreak !== 1 ? 's' : ''} seguido${displayStreak !== 1 ? 's' : ''}`
                  : 'Comece hoje!'}
              </p>
            </div>
          </div>
          {alreadyCheckedIn && (
            <span
              className="rounded-full px-2 py-1 text-[10px] font-bold"
              style={{
                background: 'rgba(0,255,136,0.12)',
                color: '#00FF88',
                border: '1px solid rgba(0,255,136,0.2)',
              }}
            >
              ✓ Check-in feito
            </span>
          )}
        </div>

        {/* Calendário de 7 dias */}
        <div className="grid grid-cols-7 gap-1.5">
          {DAY_REWARDS.map((xpAmt, idx) => {
            const dayNum = idx + 1;
            const isDone = displayDayCycle >= dayNum;
            const isToday = displayDayCycle === dayNum && alreadyCheckedIn;
            const isNext = displayDayCycle + 1 === dayNum;
            const isDay7 = dayNum === 7;

            return (
              <div key={dayNum} className="flex flex-col items-center gap-1">
                <div
                  className="relative flex aspect-square w-full items-center justify-center rounded-xl text-base transition-all"
                  style={{
                    background: isDone
                      ? isDay7
                        ? 'linear-gradient(135deg, rgba(245,200,66,0.25), rgba(255,77,0,0.15))'
                        : 'rgba(124,58,237,0.2)'
                      : isNext
                        ? 'rgba(255,255,255,0.05)'
                        : 'rgba(255,255,255,0.03)',
                    border: isDone
                      ? isDay7
                        ? '1px solid rgba(245,200,66,0.4)'
                        : '1px solid rgba(124,58,237,0.4)'
                      : isNext
                        ? '1px solid rgba(255,255,255,0.12)'
                        : '1px solid rgba(255,255,255,0.05)',
                    boxShadow: isToday ? '0 0 12px rgba(124,58,237,0.4)' : 'none',
                  }}
                >
                  {isDay7 ? (isDone ? '🎁' : '📦') : isDone ? '✅' : '○'}
                </div>
                <span
                  className="text-[9px] font-black"
                  style={{
                    color: isDone ? (isDay7 ? '#F5C842' : '#7C3AED') : '#8899BB',
                  }}
                >
                  +{xpAmt}
                </span>
              </div>
            );
          })}
        </div>

        {/* Próxima recompensa */}
        {!alreadyCheckedIn && displayDayCycle < 7 && (
          <div className="mt-3 flex items-center gap-2">
            <Gift size={11} className="text-text-muted" />
            <p className="text-[11px] text-text-muted">
              Volte amanhã para ganhar{' '}
              <span className="font-bold" style={{ color: '#F5C842' }}>
                +{getLoginReward(displayStreak + 1)} XP
              </span>
              {displayDayCycle === 6 ? ' + Loot Box!' : ''}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
