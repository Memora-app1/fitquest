'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Zap, Target } from 'lucide-react';
import Link from 'next/link';
import { useXpToast, XpToastContainer } from '@/components/xp-toast';
import { EmptyState } from '@/components/empty-state';

interface Habit {
  id: string;
  name: string;
  icon: string;
  color: string;
  xp_per_completion: number;
}

// ── Swipeable habit item ─────────────────────────────────────────────────────

function HabitItem({
  habit,
  done,
  isPending,
  onLog,
}: {
  habit: Habit;
  done: boolean;
  isPending: boolean;
  onLog: () => void;
}) {
  const [deltaX, setDeltaX] = useState(0);
  const [checkBounce, setCheckBounce] = useState(false);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const dirRef = useRef<'h' | 'v' | null>(null);
  const prevDoneRef = useRef(done);
  const THRESHOLD = 64;

  // Bounce no check quando done vira true
  useEffect(() => {
    if (done && !prevDoneRef.current) {
      setCheckBounce(true);
      setTimeout(() => setCheckBounce(false), 450);
    }
    prevDoneRef.current = done;
  }, [done]);

  function onTouchStart(e: React.TouchEvent) {
    if (done || isPending) return;
    startXRef.current = e.touches[0]!.clientX;
    startYRef.current = e.touches[0]!.clientY;
    dirRef.current = null;
  }

  function onTouchMove(e: React.TouchEvent) {
    if (done || isPending) return;
    const dx = e.touches[0]!.clientX - startXRef.current;
    const dy = e.touches[0]!.clientY - startYRef.current;

    if (!dirRef.current) {
      if (Math.abs(dy) > Math.abs(dx) + 5) dirRef.current = 'v';
      else if (Math.abs(dx) > 8) dirRef.current = 'h';
    }

    if (dirRef.current === 'h' && dx > 0) {
      setDeltaX(Math.min(THRESHOLD * 1.4, dx));
    }
  }

  function onTouchEnd() {
    if (deltaX >= THRESHOLD && !done && !isPending) {
      setDeltaX(0);
      onLog();
    } else {
      setDeltaX(0);
    }
    dirRef.current = null;
  }

  const swipeProgress = Math.min(1, deltaX / THRESHOLD);

  return (
    <div
      className="relative overflow-hidden rounded-xl"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{ touchAction: 'pan-y' }}
    >
      {/* Fundo verde revelado pelo swipe */}
      <div
        className="pointer-events-none absolute inset-0 flex items-center rounded-xl pl-4"
        style={{
          background: `rgba(0,255,136,${0.06 + swipeProgress * 0.14})`,
          opacity: swipeProgress > 0.08 ? 1 : 0,
          transition: swipeProgress === 0 ? 'opacity 0.2s ease' : 'none',
        }}
      >
        <Check
          size={20}
          strokeWidth={3}
          style={{
            color: '#00FF88',
            opacity: swipeProgress,
            transform: `scale(${0.4 + swipeProgress * 0.6}) rotate(${swipeProgress * -10}deg)`,
            transition: swipeProgress === 0 ? 'opacity 0.2s ease' : 'none',
          }}
        />
        <span
          className="ml-2 text-xs font-bold"
          style={{
            color: '#00FF88',
            opacity: Math.max(0, swipeProgress - 0.5) * 2,
          }}
        >
          +{habit.xp_per_completion} XP
        </span>
      </div>

      {/* Item principal */}
      <button
        onClick={() => {
          if (!done && !isPending) onLog();
        }}
        disabled={done || isPending}
        className="relative flex w-full items-center gap-3 rounded-xl p-3.5 text-left active:brightness-110"
        style={{
          minHeight: 56,
          background: done ? `${habit.color}12` : 'rgba(255,255,255,0.04)',
          border: done ? `1px solid ${habit.color}35` : '1px solid rgba(255,255,255,0.08)',
          transform: `translateX(${deltaX}px)`,
          transition:
            deltaX > 0
              ? 'none'
              : 'transform 0.35s cubic-bezier(0.34, 1.4, 0.64, 1), background 0.4s ease, border-color 0.4s ease',
          willChange: 'transform',
        }}
      >
        {/* Ícone do hábito */}
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl"
          style={{
            backgroundColor: `${habit.color}${done ? '30' : '18'}`,
            transition: 'background-color 0.3s ease',
          }}
        >
          {habit.icon}
        </div>

        {/* Nome + XP */}
        <div className="min-w-0 flex-1 text-left">
          <div
            className="truncate text-sm font-medium"
            style={{
              textDecoration: done ? 'line-through' : 'none',
              color: done ? '#5A6B85' : '#fff',
              transition: 'color 0.3s ease',
            }}
          >
            {habit.name}
          </div>
          <div className="flex items-center gap-1 text-xs text-text-muted">
            <Zap size={9} fill="currentColor" style={{ color: '#F5C842' }} />
            <span>+{habit.xp_per_completion} XP</span>
          </div>
        </div>

        {/* Círculo de confirmação com bounce ao completar */}
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
          style={
            done
              ? {
                  background: '#00FF88',
                  boxShadow: '0 0 12px rgba(0,255,136,0.4)',
                  animation: checkBounce
                    ? 'checkPulse 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
                    : 'none',
                }
              : {
                  border: '2px solid rgba(255,255,255,0.15)',
                  transition: 'border-color 0.2s ease',
                }
          }
        >
          {done && <Check size={13} strokeWidth={3} style={{ color: '#050914' }} />}
        </div>
      </button>
    </div>
  );
}

// ── Container principal ──────────────────────────────────────────────────────

export function HabitsToday({
  habits,
  loggedToday,
}: {
  habits: Habit[];
  loggedToday: Set<string>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [optimisticLogged, setOptimisticLogged] = useState(loggedToday);
  const [xpGainedToday, setXpGainedToday] = useState(0);
  const { toasts, showXp } = useXpToast();

  function playHabitSound(isPerfectDay = false) {
    try {
      const ctx = new (
        window.AudioContext ||
        (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext!
      )();
      if (isPerfectDay) {
        [
          [523, 0],
          [659, 0.1],
          [784, 0.2],
        ].forEach(([freq, when]) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.value = freq!;
          osc.type = 'sine';
          gain.gain.setValueAtTime(0.15, ctx.currentTime + when!);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + when! + 0.3);
          osc.start(ctx.currentTime + when!);
          osc.stop(ctx.currentTime + when! + 0.3);
        });
      } else {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 784;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.15);
      }
    } catch {
      /* silencioso se Web Audio não suportado */
    }
  }

  async function toggleHabit(habitId: string) {
    if (optimisticLogged.has(habitId) || isPending) return;
    if (navigator.vibrate) navigator.vibrate([10, 5, 20]);

    const next = new Set(optimisticLogged);
    next.add(habitId);
    setOptimisticLogged(next);

    startTransition(async () => {
      const res = await fetch('/api/habits/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ habitId }),
      });

      if (!res.ok) {
        next.delete(habitId);
        setOptimisticLogged(new Set(next));
      } else {
        const data = (await res.json()) as {
          xpEarned?: number;
          perfectDay?: boolean;
          leveledUp?: boolean;
          newLevel?: number;
          achievementsUnlocked?: string[];
        };
        const earned = data.xpEarned ?? 0;
        setXpGainedToday((prev) => prev + earned);
        showXp(earned, {
          perfectDay: data.perfectDay,
          leveledUp: data.leveledUp ? data.newLevel : undefined,
        });

        if (data.perfectDay) {
          if (navigator.vibrate) navigator.vibrate([50, 20, 100, 20, 150]);
          playHabitSound(true);
          window.dispatchEvent(new CustomEvent('ascendia:perfect-day'));
        } else {
          if (navigator.vibrate) navigator.vibrate([30, 10, 50]);
          playHabitSound(false);
        }

        window.dispatchEvent(new CustomEvent('ascendia:habit-logged'));

        if (data.leveledUp && data.newLevel) {
          window.dispatchEvent(
            new CustomEvent('ascendia:levelup', { detail: { level: data.newLevel } })
          );
        }
        for (const slug of data.achievementsUnlocked ?? []) {
          window.dispatchEvent(new CustomEvent('ascendia:achievement', { detail: { slug } }));
        }
        router.refresh();
      }
    });
  }

  const completedCount = optimisticLogged.size;
  const total = habits.length;
  const allDone = total > 0 && completedCount === total;
  const progressPct = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  const accentColor = allDone ? '#00FF88' : progressPct >= 50 ? '#FF4D00' : '#7C3AED';
  const accentRgb = allDone ? '0,255,136' : progressPct >= 50 ? '255,77,0' : '124,58,237';

  if (total === 0) {
    return (
      <EmptyState
        emoji="🎯"
        title="Nenhum hábito ainda"
        description="Crie seu primeiro hábito e ganhe 50 XP toda vez que completar. Uma ação por dia muda tudo."
        ctaLabel="+ Criar primeiro hábito"
        ctaHref="/habitos"
        tip="Cada hábito concluído = +50 XP. Dia perfeito = +200 XP bônus."
        socialProof="Usuários do Ascendia com 3+ hábitos retêm o streak por 2x mais tempo."
      />
    );
  }

  return (
    <>
      <XpToastContainer toasts={toasts} />
      <div
        className="relative overflow-hidden rounded-2xl p-6"
        style={{
          background: `linear-gradient(135deg, rgba(${accentRgb},0.07) 0%, rgba(13,24,41,0.98) 100%)`,
          border: `1px solid rgba(${accentRgb},0.2)`,
          transition: 'background 0.5s ease, border-color 0.5s ease',
        }}
      >
        {/* Corner glow */}
        <div
          className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full blur-xl"
          style={{ background: `rgba(${accentRgb},0.15)`, transition: 'background 0.5s ease' }}
        />

        <div className="relative z-10">
          {/* Header */}
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target size={16} style={{ color: accentColor }} />
              <h2 className="text-lg font-bold">Hábitos de Hoje</h2>
            </div>
            <div className="flex items-center gap-3">
              {xpGainedToday > 0 && (
                <span
                  className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold"
                  style={{ background: 'rgba(245,200,66,0.12)', color: '#F5C842' }}
                >
                  <Zap size={10} fill="currentColor" /> +{xpGainedToday} XP
                </span>
              )}
              <span
                className="rounded-lg px-2 py-1 text-sm font-bold"
                style={{ background: `rgba(${accentRgb},0.12)`, color: accentColor }}
              >
                {completedCount}/{total} {allDone && '⭐'}
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mb-4">
            <div
              className="h-2 overflow-hidden rounded-full"
              style={{ background: 'rgba(255,255,255,0.06)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progressPct}%`,
                  background: allDone
                    ? 'linear-gradient(90deg, #00FF88, #00CC6A)'
                    : progressPct >= 50
                      ? 'linear-gradient(90deg, #FF4D00, #F59E0B)'
                      : 'linear-gradient(90deg, #7C3AED, #FF4D00)',
                  boxShadow: progressPct > 0 ? `0 0 8px rgba(${accentRgb},0.5)` : 'none',
                }}
              />
            </div>
            <div className="mt-1 flex justify-between">
              <span className="text-xs text-text-muted">{progressPct}% completo</span>
              {!allDone && (
                <span className="text-xs text-text-muted">deslize → para completar</span>
              )}
            </div>
          </div>

          {/* Lista de hábitos */}
          <div className="space-y-2">
            {habits.map((habit) => (
              <HabitItem
                key={habit.id}
                habit={habit}
                done={optimisticLogged.has(habit.id)}
                isPending={isPending}
                onLog={() => toggleHabit(habit.id)}
              />
            ))}
          </div>

          {allDone && (
            <div
              className="mt-4 rounded-xl p-3 text-center"
              style={{ background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.3)' }}
            >
              <div className="text-sm font-bold text-brand-green">⭐ Dia Perfeito!</div>
              <div className="mt-0.5 text-xs text-text-secondary">+200 XP bônus creditado</div>
            </div>
          )}

          <Link
            href="/habitos"
            className="mt-3 block text-center text-xs text-text-muted transition-colors hover:text-brand-orange"
          >
            Gerenciar hábitos →
          </Link>
        </div>
      </div>
    </>
  );
}
