'use client';

/**
 * PullToRefresh — arraste para baixo no topo da página para recarregar.
 * Só funciona em mobile (touch events). Detecta se já está no topo.
 * Usa router.refresh() para revalidar dados do servidor.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const THRESHOLD = 72; // px para acionar o refresh
const MAX_PULL = 100; // px máximo de arraste visível
const RESISTANCE = 2.2; // fator de resistência (sensação física)

export function PullToRefresh({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [pull, setPull] = useState(0); // 0–MAX_PULL
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const pulling = useRef(false);
  const hapticFired = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const onTouchStart = useCallback((e: TouchEvent) => {
    // Só inicia se o scroll estiver no topo
    const scrollTop = containerRef.current?.scrollTop ?? window.scrollY;
    if (scrollTop > 0) return;
    startY.current = e.touches[0]!.clientY;
    pulling.current = true;
    hapticFired.current = false;
  }, []);

  const onTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!pulling.current || refreshing) return;
      const dy = (e.touches[0]!.clientY - startY.current) / RESISTANCE;
      if (dy <= 0) {
        setPull(0);
        return;
      }
      const clamped = Math.min(dy, MAX_PULL);
      setPull(clamped);

      // Haptic ao cruzar threshold
      if (clamped >= THRESHOLD && !hapticFired.current) {
        if (navigator.vibrate) navigator.vibrate(15);
        hapticFired.current = true;
      }

      // Previne scroll quando puxando
      if (dy > 4) e.preventDefault();
    },
    [refreshing]
  );

  const onTouchEnd = useCallback(async () => {
    if (!pulling.current) return;
    pulling.current = false;

    if (pull >= THRESHOLD) {
      setRefreshing(true);
      setPull(THRESHOLD); // trava na posição de refresh

      await new Promise((r) => setTimeout(r, 300)); // animação mínima
      router.refresh();

      // Aguarda o router.refresh() processar (~600ms)
      await new Promise((r) => setTimeout(r, 600));
      setRefreshing(false);
    }

    setPull(0);
  }, [pull, router]);

  useEffect(() => {
    const el = document.documentElement;
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [onTouchStart, onTouchMove, onTouchEnd]);

  const progress = Math.min(pull / THRESHOLD, 1);
  const circum = 2 * Math.PI * 9;

  return (
    <div ref={containerRef} className="relative">
      {/* Indicador */}
      {pull > 0 && (
        <div
          className="pointer-events-none fixed left-1/2 z-50 -translate-x-1/2 transition-all duration-100 md:hidden"
          style={{ top: `calc(env(safe-area-inset-top, 0px) + ${pull - 20}px)` }}
        >
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full"
            style={{
              background: 'rgba(13,24,41,0.95)',
              border: '1px solid rgba(255,77,0,0.35)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
              transform: `scale(${0.7 + progress * 0.3})`,
              transition: 'transform 0.1s',
            }}
          >
            {refreshing ? (
              <svg width="18" height="18" viewBox="0 0 18 18" className="animate-spin">
                <circle
                  cx="9"
                  cy="9"
                  r="7"
                  fill="none"
                  stroke="rgba(255,255,255,0.12)"
                  strokeWidth="2"
                />
                <path
                  d="M9 2 A7 7 0 0 1 16 9"
                  fill="none"
                  stroke="#FF4D00"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 18 18">
                <circle
                  cx="9"
                  cy="9"
                  r="7"
                  fill="none"
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth="2"
                />
                <circle
                  cx="9"
                  cy="9"
                  r="7"
                  fill="none"
                  stroke="#FF4D00"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeDasharray={`${circum}`}
                  strokeDashoffset={`${circum * (1 - progress)}`}
                  transform="rotate(-90 9 9)"
                  style={{ transition: 'stroke-dashoffset 0.05s' }}
                />
              </svg>
            )}
          </div>
        </div>
      )}

      {/* Content offset suave enquanto puxa */}
      <div
        style={{
          transform: pull > 0 ? `translateY(${pull * 0.3}px)` : 'none',
          transition: pull === 0 ? 'transform 0.3s cubic-bezier(0.4,0,0.2,1)' : 'none',
        }}
      >
        {children}
      </div>
    </div>
  );
}
