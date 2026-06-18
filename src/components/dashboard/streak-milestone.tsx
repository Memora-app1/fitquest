/**
 * Streak Milestone — celebração quando o usuário atinge marcos de streak.
 * Aparece em marcos: 3, 7, 14, 21, 30, 60, 90, 180, 365 dias.
 * Faz confete e mostra o ícone do marco conquistado.
 */

import { createClient } from '@/lib/supabase/server';
import { Flame, Star, Crown, Zap } from 'lucide-react';
import { StreakShareButton } from './streak-share-button';

const MILESTONES = [
  {
    days: 3,
    emoji: '🔥',
    title: '3 Dias de Fogo!',
    sub: 'Você está aquecendo!',
    color: '#FF4D00',
    rgb: '255,77,0',
  },
  {
    days: 7,
    emoji: '⚡',
    title: 'Uma Semana Completa!',
    sub: 'Consistência é poder.',
    color: '#F5C842',
    rgb: '245,200,66',
  },
  {
    days: 14,
    emoji: '💪',
    title: '14 Dias Invicto!',
    sub: 'Dois semanas de dedicação.',
    color: '#00FF88',
    rgb: '0,255,136',
  },
  {
    days: 21,
    emoji: '🌟',
    title: '21 Dias! Novo Hábito',
    sub: 'Ciência diz que virou hábito.',
    color: '#00D9FF',
    rgb: '0,217,255',
  },
  {
    days: 30,
    emoji: '🏆',
    title: '30 Dias! Um Mês!',
    sub: 'Você é imparável.',
    color: '#F5C842',
    rgb: '245,200,66',
  },
  {
    days: 60,
    emoji: '👑',
    title: '60 Dias de Lenda!',
    sub: 'Dois meses de excelência.',
    color: '#7C3AED',
    rgb: '124,58,237',
  },
  {
    days: 90,
    emoji: '🌙',
    title: '90 Dias de Mestre!',
    sub: 'Três meses. Você é diferente.',
    color: '#00D9FF',
    rgb: '0,217,255',
  },
  {
    days: 180,
    emoji: '💎',
    title: '6 Meses de Elite!',
    sub: 'Você é um dos 1%.',
    color: '#00FF88',
    rgb: '0,255,136',
  },
  {
    days: 365,
    emoji: '🌌',
    title: '1 Ano de Lenda!',
    sub: 'Você mudou de vida. Parabéns.',
    color: '#F5C842',
    rgb: '245,200,66',
  },
];

export async function StreakMilestone({ userId }: { userId: string }) {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('streak_current, name')
    .eq('id', userId)
    .single();

  if (!profile || profile.streak_current === 0) return null;

  const milestone = MILESTONES.find((m) => m.days === profile.streak_current);
  if (!milestone) return null;

  const firstName = (profile.name ?? '').split(' ')[0] ?? 'você';

  return (
    <div
      className="relative animate-level-up overflow-hidden rounded-2xl p-5 md:p-6"
      style={{
        background: `linear-gradient(135deg, rgba(${milestone.rgb},0.12) 0%, rgba(13,24,41,0.98) 55%, rgba(${milestone.rgb},0.06) 100%)`,
        border: `2px solid rgba(${milestone.rgb},0.4)`,
        boxShadow: `0 0 30px rgba(${milestone.rgb},0.15), 0 0 60px rgba(${milestone.rgb},0.08)`,
      }}
    >
      {/* Animated glow rings */}
      <div
        className="pointer-events-none absolute -right-12 -top-12 h-56 w-56 animate-spin-slow rounded-full blur-3xl"
        style={{
          background: `conic-gradient(from 0deg, rgba(${milestone.rgb},0.12), transparent, rgba(${milestone.rgb},0.08), transparent)`,
        }}
      />
      <div
        className="pointer-events-none absolute -bottom-10 -left-10 h-40 w-40 rounded-full blur-2xl"
        style={{ background: `rgba(${milestone.rgb},0.06)` }}
      />

      {/* Confetti pieces (purely decorative) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {['🎊', '✨', '⭐', '🌟', '💫'].map((c, i) => (
          <span
            key={i}
            className="confetti-piece absolute text-lg"
            style={{
              left: `${10 + i * 20}%`,
              top: '-5%',
              animationDelay: `${i * 0.15}s`,
              fontSize: i % 2 === 0 ? '1rem' : '0.75rem',
            }}
          >
            {c}
          </span>
        ))}
      </div>

      <div className="relative z-10">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            {/* Badge */}
            <div
              className="mb-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest"
              style={{
                background: `rgba(${milestone.rgb},0.15)`,
                border: `1px solid rgba(${milestone.rgb},0.3)`,
                color: milestone.color,
              }}
            >
              <Flame size={10} />
              Marco de Streak
            </div>

            <h2 className="mb-1 text-2xl font-black">{milestone.title}</h2>
            <p className="mb-1 text-sm text-text-secondary">{milestone.sub}</p>
            <p className="text-xs text-text-muted">
              Parabéns, <span className="font-semibold text-white">{firstName}</span>! Continue
              assim.
            </p>
          </div>

          {/* Big milestone emoji */}
          <div
            className="flex h-20 w-20 shrink-0 animate-bounce-in items-center justify-center rounded-2xl text-4xl"
            style={{
              background: `rgba(${milestone.rgb},0.12)`,
              border: `2px solid rgba(${milestone.rgb},0.3)`,
              boxShadow: `0 0 20px rgba(${milestone.rgb},0.2)`,
            }}
          >
            {milestone.emoji}
          </div>
        </div>

        {/* Streak counter */}
        <div
          className="mt-4 flex items-center gap-4 rounded-xl px-4 py-3"
          style={{
            background: `rgba(${milestone.rgb},0.08)`,
            border: `1px solid rgba(${milestone.rgb},0.15)`,
          }}
        >
          <Flame size={20} style={{ color: milestone.color }} className="shrink-0" />
          <div>
            <div className="flex items-baseline gap-1">
              <span className="heading-display text-3xl" style={{ color: milestone.color }}>
                {milestone.days}
              </span>
              <span className="text-sm text-text-secondary">dias consecutivos</span>
            </div>
            <div className="text-[10px] text-text-muted">
              Próximo marco: {MILESTONES.find((m) => m.days > milestone.days)?.days ?? '∞'} dias
            </div>
          </div>

          <div className="ml-auto flex items-center gap-1">
            {[Star, Zap, Crown].slice(0, Math.ceil(milestone.days / 100) + 1).map((Icon, i) => (
              <div
                key={i}
                className="flex h-6 w-6 items-center justify-center rounded-lg"
                style={{
                  background: `rgba(${milestone.rgb},0.15)`,
                  border: `1px solid rgba(${milestone.rgb},0.25)`,
                }}
              >
                <Icon size={12} style={{ color: milestone.color }} />
              </div>
            ))}
          </div>
        </div>

        {/* Compartilhar marco — virality num pico emocional */}
        <div className="mt-4 flex justify-center">
          <StreakShareButton
            userId={userId}
            days={milestone.days}
            title={milestone.title}
            color={milestone.color}
            rgb={milestone.rgb}
          />
        </div>
      </div>
    </div>
  );
}
