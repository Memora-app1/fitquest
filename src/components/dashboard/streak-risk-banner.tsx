'use client';

/**
 * StreakRiskBanner — banner de emergência que aparece depois das 20:00 local
 * quando o usuário tem streak ativo mas ainda não logou nenhuma atividade hoje.
 *
 * - Usa tempo LOCAL do dispositivo (não UTC).
 * - Dismissável por 24h via localStorage.
 * - Botão "Usar Freeze" consome 1 freeze via POST /api/streak-freeze.
 */

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Flame, X, Clock, Zap, Shield, CheckCircle } from 'lucide-react';

interface StreakRiskBannerProps {
  streakCurrent: number;
  hasActivityToday: boolean;
  freezes?: number;
}

const DISMISS_KEY = 'asc_streak_risk_dismissed';
const SHOW_AFTER_HOUR = 20;

function getTimeLeftToMidnight(): string {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const diff = midnight.getTime() - now.getTime();
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  if (hours > 0) return `${hours}h ${minutes}min`;
  return `${minutes}min`;
}

function wasDismissedToday(): boolean {
  if (typeof localStorage === 'undefined') return false;
  try {
    const stored = localStorage.getItem(DISMISS_KEY);
    if (!stored) return false;
    return new Date(stored).toDateString() === new Date().toDateString();
  } catch {
    return false;
  }
}

function markDismissedToday() {
  try {
    localStorage.setItem(DISMISS_KEY, new Date().toISOString());
  } catch {
    /* ignore */
  }
}

export function StreakRiskBanner({
  streakCurrent,
  hasActivityToday,
  freezes = 0,
}: StreakRiskBannerProps) {
  const [shouldShow, setShouldShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');
  const [mounted, setMounted] = useState(false);
  const [freezeLoading, setFreezeLoading] = useState(false);
  const [freezeActivated, setFreezeActivated] = useState(false);
  const [freezesLeft, setFreezesLeft] = useState(freezes);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setMounted(true);
    setDismissed(wasDismissedToday());
    setFreezesLeft(freezes);
  }, [freezes]);

  useEffect(() => {
    if (!mounted) return;
    let prevShow = false;
    function evaluate() {
      const hour = new Date().getHours();
      const show = streakCurrent > 0 && !hasActivityToday && hour >= SHOW_AFTER_HOUR;
      setShouldShow(show);
      if (show) setTimeLeft(getTimeLeftToMidnight());

      // Haptic na primeira vez que o banner aparece
      if (show && !prevShow && navigator.vibrate) {
        const hour2 = new Date().getHours();
        if (hour2 >= 22) {
          navigator.vibrate([100, 40, 200, 40, 100]); // urgência alta
        } else {
          navigator.vibrate([40, 20, 80]); // aviso suave
        }
      }
      prevShow = show;
    }
    evaluate();
    intervalRef.current = setInterval(evaluate, 30000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [mounted, streakCurrent, hasActivityToday]);

  async function handleUseFreeze() {
    if (freezeLoading || freezesLeft <= 0) return;
    setFreezeLoading(true);
    try {
      const res = await fetch('/api/streak-freeze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'use' }),
      });
      if (res.ok) {
        const data = (await res.json()) as { freezesRemaining?: number };
        setFreezesLeft(data.freezesRemaining ?? 0);
        setFreezeActivated(true);
      }
    } finally {
      setFreezeLoading(false);
    }
  }

  function handleDismiss() {
    markDismissedToday();
    setDismissed(true);
  }

  if (!mounted || !shouldShow || dismissed) return null;

  const hour = new Date().getHours();
  const isUltraUrgent = hour >= 22;

  // ── Freeze activated state ──────────────────────────────────────────────
  if (freezeActivated) {
    return (
      <div
        className="relative animate-slide-up overflow-hidden rounded-2xl p-4 md:p-5"
        style={{
          background:
            'linear-gradient(135deg, rgba(0,217,255,0.12) 0%, rgba(13,24,41,0.98) 60%, rgba(0,255,136,0.06) 100%)',
          border: '1px solid rgba(0,217,255,0.3)',
        }}
      >
        <button
          onClick={handleDismiss}
          className="absolute right-3 top-3 z-20 flex h-7 w-7 items-center justify-center rounded-full text-text-muted transition-colors hover:text-white"
          style={{ background: 'rgba(255,255,255,0.06)' }}
          aria-label="Dispensar"
        >
          <X size={13} />
        </button>

        <div className="flex items-center gap-4">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
            style={{ background: 'rgba(0,217,255,0.15)', border: '1px solid rgba(0,217,255,0.35)' }}
          >
            <Shield size={24} style={{ color: '#00D9FF' }} fill="currentColor" />
          </div>
          <div className="min-w-0 flex-1 pr-6">
            <div className="mb-0.5 flex items-center gap-2">
              <CheckCircle size={13} style={{ color: '#00FF88' }} />
              <span
                className="text-[10px] font-black uppercase tracking-widest"
                style={{ color: '#00D9FF' }}
              >
                Streak protegido
              </span>
            </div>
            <h3 className="text-base font-black leading-tight">Freeze ativado! 🛡️</h3>
            <p className="mt-0.5 text-xs text-text-secondary">
              Seu streak de <strong className="text-white">{streakCurrent} dias</strong> está
              protegido até amanhã.
              {freezesLeft > 0 && ` Restam ${freezesLeft} freeze${freezesLeft !== 1 ? 's' : ''}.`}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Risk state ────────────────────────────────────────────────────────────
  return (
    <div
      className="streak-risk-card relative animate-slide-up overflow-hidden rounded-2xl p-4 md:p-5"
      style={{
        background: isUltraUrgent
          ? 'linear-gradient(135deg, rgba(239,68,68,0.18) 0%, rgba(13,24,41,0.99) 55%, rgba(255,77,0,0.10) 100%)'
          : 'linear-gradient(135deg, rgba(239,68,68,0.12) 0%, rgba(13,24,41,0.98) 60%, rgba(255,77,0,0.06) 100%)',
      }}
    >
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full blur-3xl"
        style={{ background: 'rgba(239,68,68,0.12)' }}
      />
      <div
        className="pointer-events-none absolute -bottom-8 -left-8 h-32 w-32 rounded-full blur-2xl"
        style={{ background: 'rgba(255,77,0,0.06)' }}
      />

      <button
        onClick={handleDismiss}
        className="absolute right-3 top-3 z-20 flex h-7 w-7 items-center justify-center rounded-full text-text-muted transition-colors hover:text-white"
        style={{ background: 'rgba(255,255,255,0.06)' }}
        aria-label="Dispensar aviso"
      >
        <X size={13} />
      </button>

      <div className="relative z-10 flex items-start gap-4">
        <div
          className="flex h-12 w-12 shrink-0 animate-streak-fire items-center justify-center rounded-2xl"
          style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.35)' }}
        >
          <Flame size={24} style={{ color: '#EF4444' }} fill="currentColor" />
        </div>

        <div className="min-w-0 flex-1 pr-6">
          <div className="mb-1 flex items-center gap-2">
            <span
              className="text-[10px] font-black uppercase tracking-widest"
              style={{ color: '#EF4444' }}
            >
              {isUltraUrgent ? '🚨 Vai zerar em minutos' : '⚠️ Sequência em risco'}
            </span>
          </div>

          <h3 className="mb-0.5 text-base font-black leading-tight">
            {isUltraUrgent
              ? `Não deixa zerar agora! ${timeLeft} restantes`
              : `${streakCurrent} dias vão a zero em ${timeLeft}`}
          </h3>
          <p className="mb-3 text-xs text-text-secondary">
            {isUltraUrgent ? (
              <>
                Você chegou a <strong className="text-white">{streakCurrent} dias</strong>. Seria
                uma pena perder tudo por uma atividade.
              </>
            ) : (
              <>
                Registre qualquer atividade para manter sua sequência de{' '}
                <strong className="text-white">
                  {streakCurrent} dia{streakCurrent !== 1 ? 's' : ''}
                </strong>
                . Não deixa o streak ir a zero.
              </>
            )}
          </p>

          {/* Countdown */}
          <div
            className="mb-3 flex items-center gap-2 rounded-xl px-3 py-2"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}
          >
            <Clock size={12} style={{ color: '#EF4444' }} />
            <span className="text-xs font-bold" style={{ color: '#EF4444' }}>
              {timeLeft} restantes
            </span>
            <div
              className="ml-2 h-1 flex-1 overflow-hidden rounded-full"
              style={{ background: 'rgba(255,255,255,0.06)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${Math.min(100, ((24 - new Date().getHours()) / 4) * 100)}%`,
                  background: 'linear-gradient(90deg, #EF4444, #FF4D00)',
                }}
              />
            </div>
          </div>

          {/* CTA buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/habitos"
              className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all hover:scale-105"
              style={{
                background: 'rgba(239,68,68,0.15)',
                border: '1px solid rgba(239,68,68,0.35)',
                color: '#EF4444',
              }}
            >
              <Flame size={12} />
              Registrar hábito
            </Link>
            <Link
              href="/treinos/novo"
              className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all hover:scale-105"
              style={{
                background: 'rgba(255,77,0,0.12)',
                border: '1px solid rgba(255,77,0,0.25)',
                color: '#FF4D00',
              }}
            >
              <Zap size={12} fill="currentColor" />
              Treinar agora
            </Link>

            {/* Freeze button — só aparece se tem freezes disponíveis */}
            {freezesLeft > 0 && (
              <button
                onClick={handleUseFreeze}
                disabled={freezeLoading}
                className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60"
                style={{
                  background: 'rgba(0,217,255,0.1)',
                  border: '1px solid rgba(0,217,255,0.3)',
                  color: '#00D9FF',
                }}
              >
                <Shield size={12} fill="currentColor" />
                {freezeLoading ? 'Ativando...' : `Usar freeze (${freezesLeft})`}
              </button>
            )}

            <Link
              href="/tarefas"
              className="px-2 py-2 text-xs text-text-muted transition-colors hover:text-white"
            >
              Ver tarefas →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
