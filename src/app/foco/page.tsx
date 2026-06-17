'use client';

/**
 * Modo Foco — timer gamificado inspirado no Forest.
 * Sessões de 15/25/50 min concedendo XP ao completar.
 * Árvore cresce visualmente durante a sessão.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { Zap, Play, Pause, RotateCcw, TreePine, Flame, CheckCircle2 } from 'lucide-react';
import { useXpToast, XpToastContainer } from '@/components/xp-toast';

const PRESETS = [
  { minutes: 15, label: '15 min', emoji: '🌱', desc: 'Sprint rápido', xp: 20 },
  { minutes: 25, label: '25 min', emoji: '🌿', desc: 'Pomodoro clássico', xp: 30, recommended: true },
  { minutes: 50, label: '50 min', emoji: '🌳', desc: 'Sessão profunda', xp: 50 },
];

function generateSessionId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export default function FocoPage() {
  const router = useRouter();
  const { toasts, showXp } = useXpToast();

  const [selectedPreset, setSelectedPreset] = useState(1); // 25min by default
  const [phase, setPhase] = useState<'idle' | 'running' | 'paused' | 'done'>('idle');
  const [taskName, setTaskName] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(PRESETS[1]!.minutes * 60);
  const [totalSeconds, setTotalSeconds] = useState(PRESETS[1]!.minutes * 60);
  const [sessionId] = useState(() => generateSessionId());
  const [sessionsToday, setSessionsToday] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const preset = PRESETS[selectedPreset]!;
  const progress = totalSeconds > 0 ? 1 - secondsLeft / totalSeconds : 1;
  const progressPct = Math.round(progress * 100);

  // Tree growth stage based on progress
  const treeStage =
    progress < 0.25 ? '🌱' : progress < 0.5 ? '🌿' : progress < 0.75 ? '🌲' : '🌳';

  useEffect(() => {
    if (phase !== 'idle') return;
    const p = PRESETS[selectedPreset]!;
    setSecondsLeft(p.minutes * 60);
    setTotalSeconds(p.minutes * 60);
  }, [selectedPreset, phase]);

  useEffect(() => {
    if (phase === 'running') {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1) {
            clearInterval(intervalRef.current!);
            handleComplete();
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const handleComplete = useCallback(async () => {
    setPhase('done');
    if (navigator.vibrate) navigator.vibrate([50, 30, 100, 30, 150]);

    try {
      const res = await fetch('/api/focus-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          durationMinutes: preset.minutes,
          taskName: taskName.trim() || undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json() as { xpEarned?: number; leveledUp?: boolean; newLevel?: number };
        showXp(data.xpEarned ?? preset.xp, {
          leveledUp: data.leveledUp ? data.newLevel : undefined,
        });
        setSessionsToday((n) => n + 1);
        if (data.leveledUp && data.newLevel) {
          window.dispatchEvent(
            new CustomEvent('ascendia:levelup', { detail: { level: data.newLevel } })
          );
        }
      }
    } catch {
      showXp(preset.xp);
    }
  }, [sessionId, preset, taskName, showXp]);

  function reset() {
    setPhase('idle');
    setSecondsLeft(preset.minutes * 60);
    setTotalSeconds(preset.minutes * 60);
  }

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const timeDisplay = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  // SVG ring math
  const RADIUS = 80;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const strokeDash = CIRCUMFERENCE * (1 - progress);

  return (
    <AppShell>
      <XpToastContainer toasts={toasts} />
      <div className="mx-auto max-w-lg space-y-6 p-4 md:p-8">
        {/* Header */}
        <div
          className="relative overflow-hidden rounded-2xl p-6"
          style={{
            background: 'linear-gradient(135deg, rgba(0,255,136,0.08) 0%, rgba(13,24,41,0.98) 100%)',
            border: '1px solid rgba(0,255,136,0.2)',
          }}
        >
          <h1 className="heading-display text-4xl">Modo Foco</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Plante uma árvore. Ganhe XP. Não toque no celular.
          </p>
          {sessionsToday > 0 && (
            <div
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold"
              style={{ background: 'rgba(0,255,136,0.1)', color: '#00FF88', border: '1px solid rgba(0,255,136,0.25)' }}
            >
              <CheckCircle2 size={12} />
              {sessionsToday} sessão{sessionsToday !== 1 ? 'ões' : ''} concluída{sessionsToday !== 1 ? 's' : ''} hoje
            </div>
          )}
        </div>

        {/* Preset selector */}
        {phase === 'idle' && (
          <div className="grid grid-cols-3 gap-3">
            {PRESETS.map((p, i) => (
              <button
                key={p.minutes}
                onClick={() => setSelectedPreset(i)}
                className="relative rounded-2xl p-4 text-center transition-all active:scale-95"
                style={{
                  background: selectedPreset === i ? 'rgba(0,255,136,0.1)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${selectedPreset === i ? 'rgba(0,255,136,0.4)' : 'rgba(255,255,255,0.08)'}`,
                }}
              >
                {p.recommended && (
                  <div
                    className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider"
                    style={{ background: '#00FF88', color: '#050914' }}
                  >
                    Popular
                  </div>
                )}
                <div className="mb-1 text-2xl">{p.emoji}</div>
                <div className="text-sm font-bold">{p.label}</div>
                <div className="text-[10px] text-text-muted">{p.desc}</div>
                <div className="mt-1.5 flex items-center justify-center gap-0.5">
                  <Zap size={9} className="text-brand-gold" fill="currentColor" />
                  <span className="text-[10px] font-bold text-brand-gold">+{p.xp} XP</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Task name input */}
        {phase === 'idle' && (
          <input
            type="text"
            placeholder="Em que você vai se focar? (opcional)"
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            maxLength={100}
            className="input w-full text-sm"
          />
        )}

        {/* Timer ring */}
        <div className="flex flex-col items-center gap-6">
          <div className="relative flex items-center justify-center">
            <svg width={200} height={200} className="-rotate-90">
              {/* Track */}
              <circle
                cx={100}
                cy={100}
                r={RADIUS}
                fill="none"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth={10}
              />
              {/* Progress */}
              {phase !== 'idle' && (
                <circle
                  cx={100}
                  cy={100}
                  r={RADIUS}
                  fill="none"
                  stroke={phase === 'done' ? '#00FF88' : '#00FF88'}
                  strokeWidth={10}
                  strokeLinecap="round"
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={strokeDash}
                  style={{
                    transition: 'stroke-dashoffset 1s linear',
                    filter: 'drop-shadow(0 0 8px rgba(0,255,136,0.6))',
                  }}
                />
              )}
            </svg>

            {/* Center content */}
            <div className="absolute flex flex-col items-center gap-1">
              {phase === 'done' ? (
                <>
                  <div className="text-5xl">🌳</div>
                  <div className="text-sm font-bold" style={{ color: '#00FF88' }}>Sessão concluída!</div>
                </>
              ) : (
                <>
                  <div className="text-4xl">{phase === 'idle' ? preset.emoji : treeStage}</div>
                  <div
                    className="heading-display text-3xl leading-none"
                    style={{ color: phase === 'running' ? '#00FF88' : phase === 'paused' ? '#F5C842' : '#FFFFFF' }}
                  >
                    {timeDisplay}
                  </div>
                  {phase !== 'idle' && (
                    <div className="text-xs text-text-muted">{progressPct}%</div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Task label during session */}
          {phase !== 'idle' && taskName && (
            <div className="text-center">
              <div className="text-xs text-text-muted">Focando em</div>
              <div className="font-bold">{taskName}</div>
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center gap-4">
            {phase === 'idle' && (
              <button
                onClick={() => setPhase('running')}
                className="flex items-center gap-2 rounded-2xl px-8 py-4 text-lg font-black transition-all hover:brightness-110 active:scale-95"
                style={{ background: 'linear-gradient(135deg, #00FF88, #00CC6A)', color: '#050914' }}
              >
                <TreePine size={20} />
                Plantar Árvore
              </button>
            )}

            {phase === 'running' && (
              <>
                <button
                  onClick={() => setPhase('paused')}
                  className="flex h-14 w-14 items-center justify-center rounded-2xl transition-all hover:brightness-110 active:scale-95"
                  style={{ background: 'rgba(245,200,66,0.15)', border: '1px solid rgba(245,200,66,0.3)' }}
                >
                  <Pause size={22} className="text-brand-gold" />
                </button>
                <div
                  className="rounded-2xl px-6 py-3 text-center text-sm font-bold"
                  style={{ background: 'rgba(0,255,136,0.08)', color: '#00FF88', border: '1px solid rgba(0,255,136,0.2)' }}
                >
                  🌱 Árvore crescendo...
                </div>
              </>
            )}

            {phase === 'paused' && (
              <>
                <button
                  onClick={() => setPhase('running')}
                  className="flex h-14 w-14 items-center justify-center rounded-2xl transition-all hover:brightness-110 active:scale-95"
                  style={{ background: 'rgba(0,255,136,0.15)', border: '1px solid rgba(0,255,136,0.3)' }}
                >
                  <Play size={22} style={{ color: '#00FF88' }} />
                </button>
                <button
                  onClick={reset}
                  className="flex h-14 w-14 items-center justify-center rounded-2xl transition-all hover:brightness-110 active:scale-95"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  <RotateCcw size={18} className="text-text-muted" />
                </button>
                <div className="text-sm font-bold text-brand-gold">Pausado</div>
              </>
            )}

            {phase === 'done' && (
              <div className="flex flex-col items-center gap-3">
                <div
                  className="flex items-center gap-2 rounded-2xl px-6 py-3 text-base font-black"
                  style={{ background: 'rgba(0,255,136,0.12)', color: '#00FF88', border: '1px solid rgba(0,255,136,0.3)' }}
                >
                  <Zap size={16} fill="currentColor" />
                  +{preset.xp} XP ganhos!
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={reset}
                    className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all hover:brightness-110 active:scale-95"
                    style={{ background: 'rgba(0,255,136,0.1)', color: '#00FF88', border: '1px solid rgba(0,255,136,0.25)' }}
                  >
                    <TreePine size={14} />
                    Nova sessão
                  </button>
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all active:scale-95"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    Dashboard
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div
          className="rounded-2xl p-4"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="grid grid-cols-3 gap-4 text-center text-xs text-text-muted">
            <div>
              <div className="text-base font-black text-brand-green">{preset.xp} XP</div>
              <div>por sessão</div>
            </div>
            <div>
              <div className="text-base font-black text-brand-gold">{sessionsToday}</div>
              <div>hoje</div>
            </div>
            <div>
              <div className="text-base font-black">{preset.minutes} min</div>
              <div>duração</div>
            </div>
          </div>
        </div>

        {/* Tip */}
        {phase === 'idle' && (
          <p className="text-center text-xs text-text-muted">
            💡 Deixe a tela aberta durante a sessão. Sair antes derruba a árvore e você não ganha XP.
          </p>
        )}
      </div>
    </AppShell>
  );
}
