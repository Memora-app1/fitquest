'use client';

import { useEffect, useState } from 'react';
import { Zap, Flame, Target, CheckSquare, TrendingUp } from 'lucide-react';

interface LifeScoreProps {
  totalScore: number;
  habitsScore: number;
  streakScore: number;
  xpScore: number;
  taskScore: number;
  streakCurrent: number;
  habitsCompleted: number;
  habitsTotal: number;
  xpToday: number;
  criticalTasks: number;
}

const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function getScorePalette(score: number): { color: string; rgb: string } {
  if (score >= 80) return { color: '#00FF88', rgb: '0,255,136' };
  if (score >= 60) return { color: '#F5C842', rgb: '245,200,66' };
  if (score >= 40) return { color: '#FF4D00', rgb: '255,77,0' };
  return { color: '#EF4444', rgb: '239,68,68' };
}

function getScoreTier(score: number): { label: string; message: string } {
  if (score >= 90) return { label: 'PERFEITO', message: 'Dia perfeito — você é imparável! 🏆' };
  if (score >= 80) return { label: 'ELITE', message: 'Excelente! Sua rotina está no ponto. ⭐' };
  if (score >= 60) return { label: 'CONSISTENTE', message: 'Boa consistência. Continue assim! 🔥' };
  if (score >= 40)
    return { label: 'PROGREDINDO', message: 'Bom começo. Registre mais hábitos! 💪' };
  return { label: 'INICIANTE', message: 'Hoje é um novo dia. Vamos lá! 🌅' };
}

function AnimatedRing({ score, color }: { score: number; color: string }) {
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(score), 120);
    return () => clearTimeout(t);
  }, [score]);

  const offset = CIRCUMFERENCE * (1 - animated / 100);

  return (
    <svg width="128" height="128" viewBox="0 0 128 128" className="shrink-0">
      {/* Track ring */}
      <circle
        cx="64"
        cy="64"
        r={RADIUS}
        fill="none"
        stroke="rgba(255,255,255,0.05)"
        strokeWidth="11"
      />
      {/* Glow ring behind */}
      <circle
        cx="64"
        cy="64"
        r={RADIUS}
        fill="none"
        stroke={color}
        strokeWidth="11"
        strokeLinecap="round"
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={offset}
        transform="rotate(-90 64 64)"
        style={{
          transition: 'stroke-dashoffset 1.3s cubic-bezier(0.34,1.56,0.64,1)',
          filter: `drop-shadow(0 0 6px ${color}70)`,
          opacity: 0.25,
        }}
      />
      {/* Main arc */}
      <circle
        cx="64"
        cy="64"
        r={RADIUS}
        fill="none"
        stroke={color}
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={offset}
        transform="rotate(-90 64 64)"
        style={{
          transition: 'stroke-dashoffset 1.3s cubic-bezier(0.34,1.56,0.64,1)',
        }}
      />
    </svg>
  );
}

interface BarItem {
  label: string;
  score: number;
  detail: string;
  icon: typeof Target;
  color: string;
}

function ScoreBar({ item, delay }: { item: BarItem; delay: number }) {
  const [width, setWidth] = useState(0);
  const Icon = item.icon;

  useEffect(() => {
    const t = setTimeout(() => setWidth(item.score), 200 + delay);
    return () => clearTimeout(t);
  }, [item.score, delay]);

  return (
    <div>
      <div className="mb-0.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Icon size={11} style={{ color: item.color }} />
          <span className="text-xs text-text-muted">{item.label}</span>
        </div>
        <span className="text-xs font-medium" style={{ color: item.color }}>
          {item.detail}
        </span>
      </div>
      <div
        className="h-1 overflow-hidden rounded-full"
        style={{ background: 'rgba(255,255,255,0.06)' }}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${width}%`,
            backgroundColor: item.color,
            boxShadow: `0 0 4px ${item.color}50`,
            transition: 'width 0.8s cubic-bezier(0.34,1.56,0.64,1)',
          }}
        />
      </div>
    </div>
  );
}

export function LifeScore({
  totalScore,
  habitsScore,
  streakScore,
  xpScore,
  taskScore,
  streakCurrent,
  habitsCompleted,
  habitsTotal,
  xpToday,
  criticalTasks,
}: LifeScoreProps) {
  const { color, rgb } = getScorePalette(totalScore);
  const { label, message } = getScoreTier(totalScore);

  const [animatedTotal, setAnimatedTotal] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setAnimatedTotal(totalScore), 120);
    return () => clearTimeout(t);
  }, [totalScore]);

  const BREAKDOWN: BarItem[] = [
    {
      label: 'Hábitos',
      score: habitsScore,
      detail: habitsTotal > 0 ? `${habitsCompleted}/${habitsTotal}` : '—',
      icon: Target,
      color: '#FF4D00',
    },
    {
      label: 'Streak',
      score: streakScore,
      detail: `${streakCurrent} dia${streakCurrent !== 1 ? 's' : ''}`,
      icon: Flame,
      color: streakCurrent >= 7 ? '#FF4D00' : '#F59E0B',
    },
    {
      label: 'XP Hoje',
      score: xpScore,
      detail: xpToday > 0 ? `+${xpToday}` : '0',
      icon: Zap,
      color: '#F5C842',
    },
    {
      label: 'Foco',
      score: taskScore,
      detail:
        criticalTasks === 0 ? '✓ Limpo' : `${criticalTasks} crítica${criticalTasks > 1 ? 's' : ''}`,
      icon: CheckSquare,
      color: criticalTasks === 0 ? '#00FF88' : '#EF4444',
    },
  ];

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-6"
      style={{
        background: `linear-gradient(135deg, rgba(${rgb},0.08) 0%, rgba(13,24,41,0.98) 60%, rgba(124,58,237,0.04) 100%)`,
        border: `1px solid rgba(${rgb},0.22)`,
        boxShadow: `0 24px 60px rgba(0,0,0,0.4), 0 0 40px rgba(${rgb},0.05)`,
      }}
    >
      {/* Top-right glow */}
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-44 w-44 rounded-full"
        style={{ background: `radial-gradient(circle, rgba(${rgb},0.14) 0%, transparent 70%)` }}
      />
      {/* Bottom-left subtle glow */}
      <div
        className="pointer-events-none absolute -bottom-6 -left-6 h-24 w-24 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)' }}
      />

      <div className="relative z-10">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} style={{ color }} />
            <h2 className="text-lg font-bold">Life Score</h2>
          </div>
          <span
            className="rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wider"
            style={{
              background: `rgba(${rgb},0.14)`,
              color,
              border: `1px solid rgba(${rgb},0.3)`,
            }}
          >
            {label}
          </span>
        </div>

        {/* Ring + breakdown side by side */}
        <div className="flex items-center gap-5">
          {/* Ring with number in center */}
          <div className="relative shrink-0">
            <AnimatedRing score={totalScore} color={color} />
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <div
                className="heading-display leading-none"
                style={{
                  fontSize: '2rem',
                  color,
                  transition: 'color 0.6s ease',
                }}
              >
                {Math.round(animatedTotal)}
              </div>
              <div className="mt-0.5 text-[11px] tracking-wider text-text-muted">/ 100</div>
            </div>
          </div>

          {/* Breakdown bars */}
          <div className="flex-1 space-y-2.5">
            <p className="mb-3 text-xs leading-snug text-text-secondary">{message}</p>
            {BREAKDOWN.map((item, i) => (
              <ScoreBar key={item.label} item={item} delay={i * 100} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
