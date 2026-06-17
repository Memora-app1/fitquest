'use client';

/**
 * AchievementToast — toast premium que aparece ao desbloquear conquistas.
 * Dispara via: window.dispatchEvent(new CustomEvent('ascendia:achievement', {
 *   detail: { slug: 'first_habit' }
 * }))
 */

import { useState, useEffect, useRef } from 'react';
import { Trophy, Zap, X } from 'lucide-react';
import { ACHIEVEMENT_MAP, RARITY_STYLE, isShareWorthy } from '@/lib/achievements';

const TOAST_DURATION = 4000;

interface AchievementItem {
  id: number;
  slug: string;
  timestamp: number;
}

let toastId = 0;

export function AchievementToast() {
  const [queue, setQueue] = useState<AchievementItem[]>([]);

  useEffect(() => {
    function handle(e: Event) {
      const ce = e as CustomEvent<{ slug: string }>;
      const slug = ce.detail?.slug;
      const meta = slug ? ACHIEVEMENT_MAP[slug] : undefined;
      if (!meta) return;
      // Conquistas épicas/lendárias são celebradas pelo AchievementShareModal — não duplicar com toast.
      if (isShareWorthy(meta.rarity)) return;
      const id = ++toastId;
      setQueue((prev) => [...prev, { id, slug, timestamp: Date.now() }]);
      setTimeout(() => setQueue((prev) => prev.filter((t) => t.id !== id)), TOAST_DURATION + 600);
    }
    window.addEventListener('ascendia:achievement', handle);
    return () => window.removeEventListener('ascendia:achievement', handle);
  }, []);

  if (queue.length === 0) return null;

  return (
    <div className="pointer-events-none fixed bottom-36 left-4 z-50 flex max-w-[280px] flex-col-reverse gap-2 md:bottom-8 md:left-6">
      {queue.map((item) => (
        <AchievementItem
          key={item.id}
          item={item}
          onDismiss={() => setQueue((p) => p.filter((t) => t.id !== item.id))}
        />
      ))}
    </div>
  );
}

function AchievementItem({ item, onDismiss }: { item: AchievementItem; onDismiss: () => void }) {
  const [entering, setEntering] = useState(true); // começa fora de cena
  const [exiting, setExiting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const data = ACHIEVEMENT_MAP[item.slug]!;
  const style = RARITY_STYLE[data.rarity];

  useEffect(() => {
    // Haptic + som ao entrar — diferenciado por raridade
    if (navigator.vibrate) {
      if (data.rarity === 'legendary') navigator.vibrate([80, 30, 150, 30, 200]);
      else if (data.rarity === 'epic') navigator.vibrate([50, 20, 100, 20, 150]);
      else if (data.rarity === 'rare') navigator.vibrate([30, 15, 70]);
      else navigator.vibrate([20, 10, 40]);
    }

    // Entra na cena após 1 tick
    const t0 = setTimeout(() => setEntering(false), 16);

    timerRef.current = setTimeout(() => {
      setExiting(true);
      setTimeout(onDismiss, 400);
    }, TOAST_DURATION);

    return () => {
      clearTimeout(t0);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="pointer-events-auto relative overflow-hidden rounded-2xl"
      style={{
        background: `linear-gradient(135deg, rgba(${style.rgb},0.18) 0%, rgba(13,24,41,0.97) 100%)`,
        border: `1px solid ${style.border}`,
        boxShadow: `0 8px 32px rgba(${style.rgb},0.2), 0 0 0 1px rgba(${style.rgb},0.08) inset`,
        transform: exiting
          ? 'translateX(calc(-100% - 1.5rem))'
          : entering
            ? 'translateX(calc(-100% - 1.5rem))'
            : 'translateX(0)',
        opacity: exiting || entering ? 0 : 1,
        transition: entering
          ? 'none'
          : 'transform 0.38s cubic-bezier(0.34, 1.3, 0.64, 1), opacity 0.22s ease',
      }}
    >
      {/* Left accent */}
      <div
        className="absolute bottom-0 left-0 top-0 w-1"
        style={{ background: `linear-gradient(180deg, ${style.color}, rgba(${style.rgb},0.4))` }}
      />

      <div className="flex items-start gap-3 px-4 py-3 pl-5">
        {/* Trophy icon */}
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg"
          style={{
            background: `rgba(${style.rgb},0.12)`,
            border: `1px solid rgba(${style.rgb},0.25)`,
          }}
        >
          {data.emoji}
        </div>

        <div className="min-w-0 flex-1">
          {/* Header row */}
          <div className="mb-0.5 flex items-center gap-1.5">
            <Trophy size={10} style={{ color: style.color }} fill="currentColor" />
            <span
              className="text-[10px] font-black uppercase tracking-widest"
              style={{ color: style.color }}
            >
              {style.label}
            </span>
          </div>
          <div className="text-sm font-black leading-tight text-white">{data.name}</div>
          {data.xp > 0 && (
            <div className="mt-1 flex items-center gap-1">
              <Zap size={9} fill="currentColor" className="text-brand-gold" />
              <span className="text-[10px] font-bold text-brand-gold">+{data.xp} XP</span>
            </div>
          )}
        </div>

        <button
          onClick={() => {
            setExiting(true);
            setTimeout(onDismiss, 400);
          }}
          className="mt-0.5 shrink-0 rounded-lg p-1 transition-all hover:bg-white/10"
          style={{ color: '#5A6B85' }}
        >
          <X size={12} />
        </button>
      </div>

      {/* Progress bar */}
      <ProgressBar duration={TOAST_DURATION} rgb={style.rgb} />
    </div>
  );
}

function ProgressBar({ duration, rgb }: { duration: number; rgb: string }) {
  const [width, setWidth] = useState(100);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    startRef.current = null;
    function tick(ts: number) {
      if (!startRef.current) startRef.current = ts;
      const remaining = Math.max(0, 1 - (ts - startRef.current) / duration);
      setWidth(remaining * 100);
      if (remaining > 0) rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [duration]);

  return (
    <div
      className="absolute bottom-0 left-0 right-0 h-0.5 overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.04)' }}
    >
      <div
        className="h-full"
        style={{
          width: `${width}%`,
          background: `rgba(${rgb},0.7)`,
          transition: 'width 0.1s linear',
        }}
      />
    </div>
  );
}
