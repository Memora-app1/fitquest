/**
 * XpVelocityBanner — compara XP desta semana com a média das últimas 4 semanas.
 * Mostra mensagem motivacional positiva quando acima do ritmo, ou incentivo quando abaixo.
 * Server Component — sem client state.
 */

import { createClient } from '@/lib/supabase/server'
import { TrendingUp, TrendingDown, Zap } from 'lucide-react'

interface Props {
  userId: string
}

export async function XpVelocityBanner({ userId }: Props) {
  const supabase = await createClient()

  const now = new Date()
  const startOfWeek = new Date(now)
  // Semana começa na segunda-feira
  const dayOfWeek = startOfWeek.getDay() || 7
  startOfWeek.setDate(startOfWeek.getDate() - (dayOfWeek - 1))
  startOfWeek.setHours(0, 0, 0, 0)

  const fourWeeksAgo = new Date(startOfWeek)
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28)

  const [thisWeekRes, prevWeeksRes] = await Promise.all([
    supabase
      .from('xp_transactions')
      .select('amount')
      .eq('user_id', userId)
      .gte('created_at', startOfWeek.toISOString()),
    supabase
      .from('xp_transactions')
      .select('amount, created_at')
      .eq('user_id', userId)
      .gte('created_at', fourWeeksAgo.toISOString())
      .lt('created_at', startOfWeek.toISOString()),
  ])

  const thisWeekXp = (thisWeekRes.data ?? []).reduce((s, r) => s + (r.amount ?? 0), 0)

  // Calcula média semanal das últimas 4 semanas
  const prevXp = (prevWeeksRes.data ?? []).reduce((s, r) => s + (r.amount ?? 0), 0)
  const avgWeekly = Math.round(prevXp / 4)

  // Não mostra se não tem histórico ou XP zero nesta semana
  if (avgWeekly === 0 || thisWeekXp === 0) return null

  const daysSinceMonday = dayOfWeek - 1
  // XP esperado até agora se estivesse no ritmo médio (proporcional aos dias da semana)
  const expectedSoFar = Math.round((avgWeekly / 7) * Math.max(1, daysSinceMonday))

  if (expectedSoFar === 0) return null

  const pctDiff = Math.round(((thisWeekXp - expectedSoFar) / expectedSoFar) * 100)
  const isAhead = pctDiff >= 0
  const absDiff = Math.abs(pctDiff)

  // Só mostra se diferença for relevante (>= 10%)
  if (absDiff < 10) return null

  const color    = isAhead ? '#00FF88' : '#FF4D00'
  const rgb      = isAhead ? '0,255,136' : '255,77,0'
  const bgRgb    = isAhead ? '0,255,136' : '255,77,0'

  const message = isAhead
    ? absDiff >= 50
      ? `Semana explosiva! +${absDiff}% acima do seu ritmo habitual 🚀`
      : `Você está ${absDiff}% acima do ritmo desta semana! Mantenha o gás.`
    : absDiff >= 50
      ? `Semana fraca até agora. Você pode recuperar — ainda há tempo.`
      : `${absDiff}% abaixo do ritmo. Um hábito agora já muda o placar.`

  const sub = isAhead
    ? `${thisWeekXp.toLocaleString('pt-BR')} XP esta semana · média ${avgWeekly.toLocaleString('pt-BR')} XP`
    : `${thisWeekXp.toLocaleString('pt-BR')} XP esta semana · objetivo ${expectedSoFar.toLocaleString('pt-BR')} XP`

  const Icon = isAhead ? TrendingUp : TrendingDown

  return (
    <div
      className="rounded-2xl px-4 py-3 flex items-center gap-3 relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, rgba(${rgb},0.07) 0%, rgba(13,24,41,0.98) 100%)`,
        border: `1px solid rgba(${bgRgb},0.2)`,
      }}
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `rgba(${rgb},0.12)`, border: `1px solid rgba(${rgb},0.25)` }}
      >
        <Icon size={18} style={{ color }} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold leading-snug">{message}</p>
        <p className="text-[11px] text-text-muted mt-0.5">{sub}</p>
      </div>

      <div
        className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-black"
        style={{ background: `rgba(${rgb},0.12)`, border: `1px solid rgba(${rgb},0.2)`, color }}
      >
        <Zap size={10} fill="currentColor" />
        {isAhead ? `+${absDiff}%` : `-${absDiff}%`}
      </div>
    </div>
  )
}
