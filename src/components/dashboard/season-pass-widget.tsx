/**
 * Season Pass Widget — mostra progresso do usuário na temporada ativa.
 * Server Component: lê diretamente do Supabase.
 */

import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Zap, Shield } from 'lucide-react'
import type { SeasonTier } from '@/lib/supabase/types'

interface Props {
  userId: string
  isPaid: boolean
}

export async function SeasonPassWidget({ userId, isPaid }: Props) {
  const supabase = await createClient()

  // Temporada ativa
  const { data: season } = await supabase
    .from('seasons')
    .select('id, name, theme_emoji, end_date, tiers')
    .eq('is_active', true)
    .single()

  if (!season) return null

  const tiers      = (season.tiers as SeasonTier[]) ?? []
  const endDate    = new Date(season.end_date as string)
  const daysLeft   = Math.max(0, Math.ceil((endDate.getTime() - Date.now()) / 86400000))

  // Progresso do usuário
  const { data: progress } = await supabase
    .from('season_progress')
    .select('season_xp, claimed_tiers')
    .eq('user_id', userId)
    .eq('season_id', season.id)
    .maybeSingle()

  const seasonXp     = (progress?.season_xp as number) ?? 0
  const claimedTiers = (progress?.claimed_tiers as number[]) ?? []

  // Tier atual
  const currentTier = tiers.reduce((highest, t) => {
    return seasonXp >= t.season_xp_required ? t.tier : highest
  }, 0)

  // Próximo tier
  const nextTier = tiers.find((t) => seasonXp < t.season_xp_required)
  const maxXp    = tiers[tiers.length - 1]?.season_xp_required ?? 7000
  const pct      = Math.min(100, Math.round((seasonXp / (nextTier?.season_xp_required ?? maxXp)) * 100))

  // Tiers que podem ser reivindicados
  const claimable = tiers.filter((t) => {
    const unlocked   = seasonXp >= t.season_xp_required
    const claimed    = claimedTiers.includes(t.tier)
    const accessible = t.free || isPaid
    return unlocked && !claimed && accessible
  })

  return (
    <Link href="/season" className="block">
      <div
        className="rounded-2xl p-5 relative overflow-hidden hover:scale-[1.01] transition-transform"
        style={{
          background: 'linear-gradient(135deg, rgba(255,77,0,0.08) 0%, rgba(13,24,41,0.98) 60%, rgba(124,58,237,0.05) 100%)',
          border:     '1px solid rgba(255,77,0,0.18)',
        }}
      >
        {/* Glow */}
        <div
          className="absolute -top-6 -right-6 w-32 h-32 rounded-full pointer-events-none blur-3xl"
          style={{ background: 'rgba(255,77,0,0.08)' }}
        />

        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-base">{season.theme_emoji as string}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
                  Temporada Ativa
                </span>
              </div>
              <p className="font-black text-white text-sm leading-tight">{season.name as string}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[10px] text-text-muted">{daysLeft} dias restantes</p>
              <p className="text-xs font-bold" style={{ color: '#FF4D00' }}>
                Tier {currentTier}/{tiers.length}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-1 mb-3">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-text-muted flex items-center gap-1">
                <Zap size={9} style={{ color: '#F5C842' }} />
                {seasonXp.toLocaleString('pt-BR')} Season XP
              </span>
              {nextTier && (
                <span className="text-[10px] text-text-muted">
                  Próximo: {nextTier.season_xp_required.toLocaleString('pt-BR')}
                </span>
              )}
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width:      `${pct}%`,
                  background: 'linear-gradient(90deg, #FF4D00, #7C3AED)',
                  boxShadow:  '0 0 8px rgba(255,77,0,0.4)',
                }}
              />
            </div>
          </div>

          {/* Próxima recompensa */}
          {nextTier && (
            <div
              className="rounded-xl p-2.5 flex items-center gap-2.5"
              style={{
                background: nextTier.free
                  ? 'rgba(0,255,136,0.06)'
                  : 'rgba(124,58,237,0.06)',
                border: nextTier.free
                  ? '1px solid rgba(0,255,136,0.15)'
                  : '1px solid rgba(124,58,237,0.15)',
              }}
            >
              <span className="text-xl">{nextTier.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white leading-tight truncate">{nextTier.label}</p>
                <p className="text-[10px] text-text-muted">
                  Faltam {(nextTier.season_xp_required - seasonXp).toLocaleString('pt-BR')} Season XP
                </p>
              </div>
              {!nextTier.free && !isPaid && (
                <Shield size={12} className="text-brand-purple shrink-0" />
              )}
            </div>
          )}

          {/* Badge: tem tier para reivindicar */}
          {claimable.length > 0 && (
            <div
              className="mt-2 rounded-lg px-3 py-1.5 flex items-center gap-2"
              style={{ background: 'rgba(245,200,66,0.10)', border: '1px solid rgba(245,200,66,0.25)' }}
            >
              <span className="text-sm">🎁</span>
              <p className="text-[11px] font-bold" style={{ color: '#F5C842' }}>
                {claimable.length} recompensa{claimable.length > 1 ? 's' : ''} para reivindicar!
              </p>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
