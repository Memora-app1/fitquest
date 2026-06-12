'use client';

import { useState } from 'react';
import { Flame, Trophy, Shield, CheckCircle2 } from 'lucide-react';

function getLast7Days(): string[] {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]!);
  }
  return days;
}

const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export function StreakWidget({
  current,
  longest,
  activeDays = [],
  freezes = 0,
}: {
  current: number;
  longest: number;
  activeDays?: string[];
  freezes?: number;
}) {
  const [freezeCount, setFreezeCount] = useState(freezes);
  const [freezeLoading, setFreezeLoading] = useState(false);
  const [freezeUsed, setFreezeUsed] = useState(false);
  const [freezeError, setFreezeError] = useState<string | null>(null);

  const last7 = getLast7Days();
  const activeSet = new Set(activeDays);
  const todayStr = new Date().toISOString().split('T')[0]!;
  const isOnFire = current >= 7;
  const accentColor = current === 0 ? '#EF4444' : isOnFire ? '#FF4D00' : '#F59E0B';

  let nextMilestone = 7;
  let milestoneName = 'Fogo Aceso';
  if (current >= 7) {
    nextMilestone = 30;
    milestoneName = 'Mês Implacável';
  }
  if (current >= 30) {
    nextMilestone = 100;
    milestoneName = 'Centenário';
  }
  if (current >= 100) {
    nextMilestone = 365;
    milestoneName = 'Um Ano Épico';
  }

  const prevMilestone = current >= 100 ? 100 : current >= 30 ? 30 : current >= 7 ? 7 : 0;
  const progressPct =
    current >= 365
      ? 100
      : Math.min(
          100,
          Math.round(((current - prevMilestone) / (nextMilestone - prevMilestone)) * 100)
        );

  const activeThisWeek = last7.filter((d) => activeSet.has(d)).length;

  async function handleUseFreeze() {
    if (freezeCount <= 0 || freezeLoading || freezeUsed) return;
    setFreezeLoading(true);
    setFreezeError(null);
    try {
      const res = await fetch('/api/streak-freeze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'use' }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFreezeError(data.message ?? 'Erro ao usar freeze.');
      } else {
        setFreezeCount(data.freezesRemaining ?? freezeCount - 1);
        setFreezeUsed(true);
        if (navigator.vibrate) navigator.vibrate([30, 15, 60]);
      }
    } catch {
      setFreezeError('Erro de conexão.');
    } finally {
      setFreezeLoading(false);
    }
  }

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-6"
      style={{
        background: isOnFire
          ? 'linear-gradient(135deg, rgba(255,77,0,0.1) 0%, rgba(13,24,41,0.98) 60%, rgba(245,200,66,0.05) 100%)'
          : current === 0
            ? 'linear-gradient(135deg, rgba(239,68,68,0.06) 0%, rgba(13,24,41,0.98) 100%)'
            : 'linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(13,24,41,0.98) 100%)',
        border: `1px solid ${accentColor}30`,
        boxShadow: `0 4px 24px ${accentColor}08`,
      }}
    >
      <div
        className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full blur-2xl"
        style={{ backgroundColor: accentColor, opacity: 0.12 }}
      />

      <div className="relative z-10 space-y-4">
        {/* Top row */}
        <div className="flex items-start justify-between">
          <div>
            <div className="mb-1.5 flex items-center gap-1.5 text-xs uppercase tracking-wider text-text-muted">
              <Flame size={11} style={{ color: accentColor }} fill="currentColor" />
              Streak Atual
            </div>
            <div className="heading-display text-5xl leading-none" style={{ color: accentColor }}>
              {current}
            </div>
            <div className="mt-1 text-sm text-text-secondary">
              {current === 0
                ? 'Comece hoje!'
                : current === 1
                  ? 'dia consecutivo 🔥'
                  : 'dias consecutivos'}
            </div>
          </div>
          <div className="space-y-1 text-right">
            <div className="flex items-center justify-end gap-1.5">
              <Trophy size={13} className="text-brand-gold" />
              <div className="heading-display text-2xl text-brand-gold">{longest}</div>
            </div>
            <div className="text-xs uppercase tracking-wide text-text-muted">Recorde</div>
            {activeThisWeek > 0 && (
              <div className="mt-1 text-xs font-medium" style={{ color: '#00FF88' }}>
                {activeThisWeek}/7 essa sem.
              </div>
            )}
            {freezeCount > 0 && (
              <div className="mt-1.5 flex items-center justify-end gap-1">
                {Array.from({ length: Math.min(freezeCount, 5) }).map((_, i) => (
                  <Shield
                    key={i}
                    size={12}
                    fill="currentColor"
                    style={{ color: '#00D9FF', opacity: 0.85 }}
                  />
                ))}
                {freezeCount > 5 && (
                  <span className="text-[10px] font-bold" style={{ color: '#00D9FF' }}>
                    +{freezeCount - 5}
                  </span>
                )}
              </div>
            )}
            {freezeCount === 0 && current > 0 && (
              <div className="mt-1.5 flex items-center justify-end gap-1">
                <Shield size={12} style={{ color: '#5A6B85' }} />
                <span className="text-[10px] text-text-muted">sem freeze</span>
              </div>
            )}
          </div>
        </div>

        {/* 7-day chart */}
        <div className="flex justify-between gap-1">
          {last7.map((day) => {
            const active = activeSet.has(day);
            const isToday = day === todayStr;
            const dayOfWeek = new Date(`${day}T12:00:00`).getDay();
            return (
              <div key={day} className="flex flex-1 flex-col items-center gap-1.5">
                <div
                  className="flex aspect-square w-full max-w-[34px] items-center justify-center rounded-xl text-xs font-bold transition-all"
                  style={{
                    background: active
                      ? `linear-gradient(135deg, ${accentColor}, ${accentColor}CC)`
                      : isToday
                        ? `${accentColor}15`
                        : 'rgba(255,255,255,0.04)',
                    border: active
                      ? 'none'
                      : isToday
                        ? `2px solid ${accentColor}50`
                        : '1px solid rgba(255,255,255,0.08)',
                    boxShadow: active ? `0 0 8px ${accentColor}40` : 'none',
                    color: active ? '#fff' : isToday ? accentColor : '#8899BB',
                  }}
                >
                  {active ? '✓' : isToday ? '·' : ''}
                </div>
                <span
                  className="text-[10px] leading-none"
                  style={{
                    color: isToday ? accentColor : '#8899BB',
                    fontWeight: isToday ? 600 : 400,
                  }}
                >
                  {DAY_LABELS[dayOfWeek]}
                </span>
              </div>
            );
          })}
        </div>

        {/* Progress to next milestone */}
        {current < 365 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-secondary">
                🎯 {milestoneName}{' '}
                <span className="text-text-muted">
                  em {nextMilestone - current} dia{nextMilestone - current !== 1 ? 's' : ''}
                </span>
              </span>
              <span className="text-text-muted">
                {current}/{nextMilestone}
              </span>
            </div>
            <div
              className="h-1.5 overflow-hidden rounded-full"
              style={{ background: 'rgba(255,255,255,0.06)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${progressPct}%`,
                  background: `linear-gradient(90deg, ${accentColor}, ${accentColor}AA)`,
                  boxShadow: `0 0 6px ${accentColor}40`,
                }}
              />
            </div>
          </div>
        )}

        {current >= 365 && (
          <div
            className="rounded-xl py-2 text-center text-sm font-bold"
            style={{
              background: 'rgba(255,77,0,0.1)',
              border: '1px solid rgba(255,77,0,0.2)',
              color: '#FF4D00',
            }}
          >
            ⚡ Um ano épico. Você é uma lenda.
          </div>
        )}

        {current === 0 && (
          <p className="text-center text-xs text-text-muted">
            Registre 1 hábito hoje pra começar uma nova sequência 💪
          </p>
        )}

        {/* Streak Freeze button */}
        {freezeCount > 0 && current > 0 && (
          <div>
            {freezeUsed ? (
              <div
                className="flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold"
                style={{
                  background: 'rgba(0,217,255,0.08)',
                  border: '1px solid rgba(0,217,255,0.2)',
                  color: '#00D9FF',
                }}
              >
                <CheckCircle2 size={13} />
                Freeze ativado! Streak protegido por 1 dia
              </div>
            ) : (
              <button
                onClick={handleUseFreeze}
                disabled={freezeLoading}
                className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all hover:brightness-110 active:scale-95 disabled:opacity-60"
                style={{
                  background: 'rgba(0,217,255,0.08)',
                  border: '1px solid rgba(0,217,255,0.25)',
                  color: '#00D9FF',
                }}
              >
                <Shield size={13} fill="currentColor" />
                {freezeLoading
                  ? 'Ativando...'
                  : `Usar Streak Freeze (${freezeCount} disponível${freezeCount !== 1 ? 'is' : ''})`}
              </button>
            )}
            {freezeError && (
              <p className="mt-1.5 text-center text-xs" style={{ color: '#EF4444' }}>
                {freezeError}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
