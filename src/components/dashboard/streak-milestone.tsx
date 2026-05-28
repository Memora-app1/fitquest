/**
 * Streak Milestone — celebração quando o usuário atinge marcos de streak.
 * Aparece em marcos: 3, 7, 14, 21, 30, 60, 90, 180, 365 dias.
 * Faz confete e mostra o ícone do marco conquistado.
 */

import { createClient } from '@/lib/supabase/server'
import { Flame, Star, Crown, Zap } from 'lucide-react'

const MILESTONES = [
  { days: 3,   emoji: '🔥', title: '3 Dias de Fogo!',     sub: 'Você está aquecendo!',          color: '#FF4D00', rgb: '255,77,0' },
  { days: 7,   emoji: '⚡', title: 'Uma Semana Completa!', sub: 'Consistência é poder.',          color: '#F5C842', rgb: '245,200,66' },
  { days: 14,  emoji: '💪', title: '14 Dias Invicto!',     sub: 'Dois semanas de dedicação.',     color: '#00FF88', rgb: '0,255,136' },
  { days: 21,  emoji: '🌟', title: '21 Dias! Novo Hábito', sub: 'Ciência diz que virou hábito.',  color: '#00D9FF', rgb: '0,217,255' },
  { days: 30,  emoji: '🏆', title: '30 Dias! Um Mês!',     sub: 'Você é imparável.',              color: '#F5C842', rgb: '245,200,66' },
  { days: 60,  emoji: '👑', title: '60 Dias de Lenda!',    sub: 'Dois meses de excelência.',      color: '#7C3AED', rgb: '124,58,237' },
  { days: 90,  emoji: '🌙', title: '90 Dias de Mestre!',   sub: 'Três meses. Você é diferente.',  color: '#00D9FF', rgb: '0,217,255' },
  { days: 180, emoji: '💎', title: '6 Meses de Elite!',    sub: 'Você é um dos 1%.',              color: '#00FF88', rgb: '0,255,136' },
  { days: 365, emoji: '🌌', title: '1 Ano de Lenda!',      sub: 'Você mudou de vida. Parabéns.',  color: '#F5C842', rgb: '245,200,66' },
]

export async function StreakMilestone({ userId }: { userId: string }) {
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('streak_current, name')
    .eq('id', userId)
    .single()

  if (!profile || profile.streak_current === 0) return null

  const milestone = MILESTONES.find(m => m.days === profile.streak_current)
  if (!milestone) return null

  const firstName = (profile.name ?? '').split(' ')[0] ?? 'você'

  return (
    <div
      className="rounded-2xl p-5 md:p-6 relative overflow-hidden animate-level-up"
      style={{
        background: `linear-gradient(135deg, rgba(${milestone.rgb},0.12) 0%, rgba(13,24,41,0.98) 55%, rgba(${milestone.rgb},0.06) 100%)`,
        border: `2px solid rgba(${milestone.rgb},0.4)`,
        boxShadow: `0 0 30px rgba(${milestone.rgb},0.15), 0 0 60px rgba(${milestone.rgb},0.08)`,
      }}
    >
      {/* Animated glow rings */}
      <div
        className="absolute -top-12 -right-12 w-56 h-56 rounded-full pointer-events-none blur-3xl animate-spin-slow"
        style={{ background: `conic-gradient(from 0deg, rgba(${milestone.rgb},0.12), transparent, rgba(${milestone.rgb},0.08), transparent)` }}
      />
      <div
        className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full pointer-events-none blur-2xl"
        style={{ background: `rgba(${milestone.rgb},0.06)` }}
      />

      {/* Confetti pieces (purely decorative) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {['🎊', '✨', '⭐', '🌟', '💫'].map((c, i) => (
          <span
            key={i}
            className="absolute text-lg confetti-piece"
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
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-3"
              style={{
                background: `rgba(${milestone.rgb},0.15)`,
                border: `1px solid rgba(${milestone.rgb},0.3)`,
                color: milestone.color,
              }}
            >
              <Flame size={10} />
              Marco de Streak
            </div>

            <h2 className="text-2xl font-black mb-1">{milestone.title}</h2>
            <p className="text-sm text-text-secondary mb-1">{milestone.sub}</p>
            <p className="text-xs text-text-muted">
              Parabéns, <span className="text-white font-semibold">{firstName}</span>! Continue assim.
            </p>
          </div>

          {/* Big milestone emoji */}
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl shrink-0 animate-bounce-in"
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
              Próximo marco: {
                MILESTONES.find(m => m.days > milestone.days)?.days ?? '∞'
              } dias
            </div>
          </div>

          <div className="ml-auto flex items-center gap-1">
            {[Star, Zap, Crown].slice(0, Math.ceil(milestone.days / 100) + 1).map((Icon, i) => (
              <div
                key={i}
                className="w-6 h-6 rounded-lg flex items-center justify-center"
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
      </div>
    </div>
  )
}
