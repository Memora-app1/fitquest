'use client';

/**
 * PerfectDayOverlay — celebração quando o usuário completa TODOS os hábitos do dia.
 * Dispara via: window.dispatchEvent(new CustomEvent('ascendia:perfect-day'))
 * Auto-dismiss após 5 segundos.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { X, Star, Zap } from 'lucide-react';
import { useScrollLock } from '@/hooks/use-scroll-lock';

const CONFETTI_COLORS = ['#F5C842', '#FF4D00', '#00FF88', '#7C3AED', '#FFFFFF', '#FFB347'];
const CONFETTI_COUNT = 50;

interface Piece {
  id: number;
  left: number;
  color: string;
  delay: number;
  duration: number;
  size: number;
  rotation: number;
}

function generateConfetti(): Piece[] {
  return Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
    id: i,
    left: Math.random() * 105 - 2.5,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)]!,
    delay: Math.random() * 0.8,
    duration: 1.5 + Math.random() * 1.5,
    size: 5 + Math.random() * 7,
    rotation: Math.random() * 360,
  }));
}

function CountdownBar({ duration, onDismiss }: { duration: number; onDismiss: () => void }) {
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
      else onDismiss();
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [duration, onDismiss]);

  return (
    <div
      className="absolute bottom-0 left-0 right-0 h-1 overflow-hidden rounded-b-3xl"
      style={{ background: 'rgba(255,255,255,0.08)' }}
    >
      <div
        className="h-full rounded-b-3xl"
        style={{
          width: `${width}%`,
          background: 'linear-gradient(90deg, #F5C842, #FF4D00)',
          transition: 'width 0.1s linear',
        }}
      />
    </div>
  );
}

export function PerfectDayOverlay() {
  const [visible, setVisible] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [dismissing, setDismissing] = useState(false);
  const [confetti] = useState<Piece[]>(generateConfetti);
  useScrollLock(visible);
  const lastFired = useRef(0);

  const dismiss = useCallback(() => {
    setDismissing(true);
    setTimeout(() => {
      setVisible(false);
      setAnimating(false);
      setDismissing(false);
    }, 400);
  }, []);

  useEffect(() => {
    function handlePerfectDay() {
      // Dedup — ignora se disparado nos últimos 10s
      const now = Date.now();
      if (now - lastFired.current < 10000) return;
      lastFired.current = now;

      setVisible(true);
      setDismissing(false);
      setTimeout(() => setAnimating(true), 30);
    }
    window.addEventListener('ascendia:perfect-day', handlePerfectDay);
    return () => window.removeEventListener('ascendia:perfect-day', handlePerfectDay);
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4"
      style={{
        background: 'rgba(5,9,20,0.82)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        opacity: animating && !dismissing ? 1 : 0,
        transition: 'opacity 0.35s ease',
      }}
      onClick={dismiss}
    >
      {/* Confetti */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {confetti.map((p) => (
          <div
            key={p.id}
            className="confetti-deep"
            style={
              {
                left: `${p.left}%`,
                width: `${p.size}px`,
                height: `${p.size}px`,
                backgroundColor: p.color,
                borderRadius: '2px',
                transform: `rotate(${p.rotation}deg)`,
                '--duration': `${p.duration}s`,
                '--delay': `${p.delay}s`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      {/* Card */}
      <div
        className="relative w-full max-w-xs overflow-hidden rounded-3xl p-8 text-center"
        style={{
          background:
            'linear-gradient(145deg, rgba(245,200,66,0.18) 0%, rgba(13,24,41,0.99) 45%, rgba(255,77,0,0.10) 100%)',
          border: '1px solid rgba(245,200,66,0.55)',
          boxShadow: '0 0 80px rgba(245,200,66,0.22), 0 0 160px rgba(245,200,66,0.08)',
          transform:
            animating && !dismissing ? 'scale(1) translateY(0)' : 'scale(0.75) translateY(40px)',
          transition: 'transform 0.55s cubic-bezier(0.34,1.56,0.64,1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <CountdownBar duration={5000} onDismiss={dismiss} />

        <button
          onClick={dismiss}
          className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full transition-all hover:bg-white/10"
          style={{ color: '#8899BB' }}
        >
          <X size={13} />
        </button>

        {/* Stars row */}
        <div className="mb-4 flex justify-center gap-1">
          {[0, 1, 2].map((i) => (
            <Star
              key={i}
              size={16}
              fill="currentColor"
              className="text-brand-gold"
              style={{
                animation: `bounceIn 0.5s cubic-bezier(0.34,1.56,0.64,1) ${i * 0.12}s both`,
              }}
            />
          ))}
        </div>

        {/* Emoji */}
        <div
          className="mb-3 text-6xl"
          style={{ animation: 'bounceIn 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.1s both' }}
        >
          ⭐
        </div>

        {/* Heading */}
        <div
          className="heading-display mb-1 text-4xl"
          style={{
            color: '#F5C842',
            textShadow: '0 0 30px rgba(245,200,66,0.6)',
          }}
        >
          DIA PERFEITO
        </div>
        <p className="mb-2 text-base font-bold text-white">Todos os hábitos completos!</p>
        <p className="mb-5 text-sm leading-relaxed text-text-secondary">
          Você fechou o dia sem deixar nada pra trás. Isso é raridade — e você conseguiu.
        </p>

        {/* XP badge */}
        <div
          className="mb-5 inline-flex items-center gap-2 rounded-xl px-4 py-2"
          style={{ background: 'rgba(245,200,66,0.10)', border: '1px solid rgba(245,200,66,0.25)' }}
        >
          <Zap size={13} className="text-brand-gold" fill="currentColor" />
          <span className="text-sm font-black text-brand-gold">+200 XP de bônus recebidos</span>
        </div>

        {/* CTA */}
        <button
          onClick={dismiss}
          className="w-full rounded-2xl py-3 text-sm font-black text-white transition-all hover:brightness-110 active:scale-95"
          style={{
            background: 'linear-gradient(135deg, rgba(245,200,66,0.75), rgba(255,77,0,0.60))',
            border: '1px solid rgba(245,200,66,0.4)',
            boxShadow: '0 4px 20px rgba(245,200,66,0.3)',
          }}
        >
          Continuar evoluindo 🚀
        </button>
      </div>
    </div>
  );
}
