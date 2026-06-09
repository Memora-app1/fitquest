/**
 * League Widget — posição do usuário no ranking semanal global.
 * Server Component.
 */

import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { getLeagueDivision } from '@/lib/xp'
import { TrendingUp } from 'lucide-react'

interface Props {
  userId: string
}

export async function LeagueWidget({ userId }: Props) {
  const supabase = await createClient()

  // XP do usuário esta semana
  const { data: profile } = await supabase
    .from('profiles')
    .select('league_xp_this_week, name')
    .eq('id', userId)
    .single()

  const myWeeklyXp = (profile?.league_xp_this_week as number) ?? 0

  // Conta quantos usuários têm mais XP que eu esta semana
  const { count: aboveMe } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .in('subscription_status', ['trial', 'active', 'lifetime'])
    .gt('league_xp_this_week', myWeeklyXp)

  const { count: totalPlayers } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .in('subscription_status', ['trial', 'active', 'lifetime'])

  const position   = (aboveMe ?? 0) + 1
  const total      = totalPlayers ?? 1
  const division   = getLeagueDivision(position, total)
  const topPercent = total > 0 ? Math.round((position / total) * 100) : 100

  // Top 3 desta semana (para referência)
  const { data: top3 } = await supabase
    .from('profiles')
    .select('id, name, league_xp_this_week')
    .in('subscription_status', ['trial', 'active', 'lifetime'])
    .order('league_xp_this_week', { ascending: false })
    .limit(3)

  return (
    <Link href="/ranking">
      <div
        className="rounded-2xl p-5 relative overflow-hidden hover:scale-[1.01] transition-transform"
        style={{
          background: `linear-gradient(135deg, rgba(${division.rgb},0.08) 0%, rgba(13,24,41,0.98) 100%)`,
          border:     `1px solid rgba(${division.rgb},0.2)`,
        }}
      >
        <div
          className="absolute -top-4 -right-4 w-24 h-24 rounded-full pointer-events-none blur-2xl"
          style={{ background: `rgba(${division.rgb},0.12)` }}
        />

        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-sm">{division.emoji}</span>
                <span
                  className="text-[10px] font-black uppercase tracking-widest"
                  style={{ color: division.color }}
                >
                  {division.name}
                </span>
              </div>
              <p className="font-black text-white text-base">
                #{position} <span className="text-text-muted text-sm font-normal">de {total.toLocaleString('pt-BR')}</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-text-muted">XP semanal</p>
              <p className="text-sm font-black" style={{ color: '#F5C842' }}>
                {myWeeklyXp.toLocaleString('pt-BR')}
              </p>
            </div>
          </div>

          {/* Barra de posição */}
          <div className="space-y-1 mb-3">
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width:      `${Math.max(2, 100 - topPercent)}%`,
                  background: `linear-gradient(90deg, ${division.color}, rgba(${division.rgb},0.5))`,
                }}
              />
            </div>
            <p className="text-[10px] text-text-muted flex items-center gap-1">
              <TrendingUp size={9} />
              Top {topPercent}% dos jogadores ativos
            </p>
          </div>

          {/* Top 3 mini */}
          {top3 && top3.length > 0 && (
            <div className="flex gap-2">
              {top3.map((p, idx) => {
                const medals = ['🥇', '🥈', '🥉']
                return (
                  <div key={p.id as string} className="flex-1 text-center">
                    <p className="text-sm">{medals[idx]}</p>
                    <p className="text-[9px] text-text-muted truncate">{(p.name as string).split(' ')[0]}</p>
                    <p className="text-[9px] font-bold" style={{ color: '#F5C842' }}>
                      {(p.league_xp_this_week as number).toLocaleString('pt-BR')}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
