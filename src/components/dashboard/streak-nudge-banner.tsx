/**
 * StreakNudgeBanner — aparece quando o usuário está a 1 dia de um marco de streak com bônus XP.
 * Exibe antecipação positiva: "Amanhã é seu 7º dia! Vale +300 XP".
 * Server Component — sem estado cliente necessário.
 */

import { Flame, Zap, ChevronRight } from 'lucide-react'
import Link from 'next/link'

interface Props {
  streakCurrent: number
}

const XP_MILESTONES = [
  { day: 7,  xp: 300,  emoji: '⚡', label: 'Uma Semana Completa',  color: '#F5C842', rgb: '245,200,66' },
  { day: 30, xp: 1000, emoji: '🏆', label: 'Um Mês de Consistência', color: '#F5C842', rgb: '245,200,66' },
  { day: 90, xp: 3000, emoji: '🌙', label: '90 Dias de Mestre',      color: '#00D9FF', rgb: '0,217,255' },
]

export function StreakNudgeBanner({ streakCurrent }: Props) {
  // Só mostra quando o PRÓXIMO dia atinge um marco de XP
  const nextDay = streakCurrent + 1
  const milestone = XP_MILESTONES.find(m => m.day === nextDay)
  if (!milestone) return null

  const xpFormatted = milestone.xp.toLocaleString('pt-BR')

  return (
    <div
      className="rounded-2xl p-4 md:p-5 relative overflow-hidden animate-slide-up"
      style={{
        background: `linear-gradient(135deg, rgba(${milestone.rgb},0.10) 0%, rgba(13,24,41,0.98) 60%, rgba(255,77,0,0.05) 100%)`,
        border: `1px solid rgba(${milestone.rgb},0.3)`,
      }}
    >
      <div
        className="absolute -top-6 -right-6 w-32 h-32 rounded-full pointer-events-none blur-3xl"
        style={{ background: `rgba(${milestone.rgb},0.10)` }}
      />

      <div className="relative z-10 flex items-center gap-4">
        {/* Ícone de streak */}
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
          style={{
            background: `rgba(${milestone.rgb},0.12)`,
            border: `1px solid rgba(${milestone.rgb},0.3)`,
          }}
        >
          <Flame size={22} style={{ color: '#FF4D00' }} fill="currentColor" />
        </div>

        {/* Texto */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: milestone.color }}>
              {milestone.emoji} Streak D{streakCurrent}
            </span>
          </div>
          <h3 className="text-sm font-black leading-tight">
            Amanhã é seu {milestone.day}° dia!{' '}
            <span style={{ color: '#F5C842' }}>+{xpFormatted} XP</span>
          </h3>
          <p className="text-xs text-text-secondary mt-0.5">
            Continue hoje para desbloquear <strong className="text-white">{milestone.label}</strong> e garantir o bônus.
          </p>
        </div>

        {/* XP badge + CTA */}
        <div className="shrink-0 flex flex-col items-end gap-2">
          <div
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-black"
            style={{ background: `rgba(${milestone.rgb},0.12)`, border: `1px solid rgba(${milestone.rgb},0.25)`, color: milestone.color }}
          >
            <Zap size={10} fill="currentColor" />
            +{xpFormatted}
          </div>
          <Link
            href="/habitos"
            className="flex items-center gap-0.5 text-[10px] font-bold text-text-muted hover:text-white transition-colors"
          >
            Registrar hoje <ChevronRight size={10} />
          </Link>
        </div>
      </div>

      {/* Barra de progresso da semana (visual: streak atual / milestone) */}
      <div className="relative z-10 mt-3">
        <div className="flex items-center justify-between text-[9px] text-text-muted mb-1">
          <span>Dia {streakCurrent}</span>
          <span>Meta: {milestone.day} dias</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${Math.round((streakCurrent / milestone.day) * 100)}%`,
              background: `linear-gradient(90deg, #FF4D00, ${milestone.color})`,
            }}
          />
        </div>
      </div>
    </div>
  )
}
