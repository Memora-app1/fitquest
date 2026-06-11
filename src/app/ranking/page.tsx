import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { unstable_cache } from 'next/cache'
import { AppShell } from '@/components/layout/app-shell'
import { Trophy, Flame, Zap, TrendingUp, Crown } from 'lucide-react'
import { getLeagueDivision, getLevelInfo, LEAGUE_DIVISIONS } from '@/lib/xp'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'Ranking — Ascendia',
  description: 'Leaderboard semanal. Compita, suba de divisão e se torne lendário.',
}

export const dynamic = 'force-dynamic'

// Leaderboard top 100 cacheado por 60s — reduz carga no banco sem sacrificar frescura
const getCachedLeaderboard = unstable_cache(
  async () => {
    const db = createServiceClient()
    const [leadersRes, totalRes] = await Promise.all([
      db
        .from('profiles')
        .select('id, name, level, prestige_level, equipped_title, league_xp_this_week, streak_current, avatar_url')
        .in('subscription_status', ['trial', 'active', 'lifetime'])
        .order('league_xp_this_week', { ascending: false })
        .limit(100),
      db
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .in('subscription_status', ['trial', 'active', 'lifetime']),
    ])
    return {
      leaders: leadersRes.data ?? [],
      total:   totalRes.count ?? 0,
    }
  },
  ['ranking-leaderboard'],
  { revalidate: 60, tags: ['ranking'] }
)

export default async function RankingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ leaders, total }, myProfileRes] = await Promise.all([
    getCachedLeaderboard(),
    supabase
      .from('profiles')
      .select('name, level, prestige_level, league_xp_this_week, streak_current, avatar_url')
      .eq('id', user.id)
      .single(),
  ])

  const myProfile = myProfileRes.data

  const myPositionInTop = leaders.findIndex(l => l.id === user.id)
  let myPosition = myPositionInTop >= 0 ? myPositionInTop + 1 : null

  if (myPosition === null && myProfile) {
    const { count } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .in('subscription_status', ['trial', 'active', 'lifetime'])
      .gt('league_xp_this_week', (myProfile.league_xp_this_week as number) ?? 0)
    myPosition = (count ?? 0) + 1
  }

  const myDivision = myPosition ? getLeagueDivision(myPosition, total) : null
  const myWeeklyXp = (myProfile?.league_xp_this_week as number) ?? 0

  // Separa top 3 do resto
  const podium = leaders.slice(0, 3)
  const rest   = leaders.slice(3)

  const MEDAL = ['🥇', '🥈', '🥉']

  function getInitials(name: string) {
    return name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('')
  }

  return (
    <AppShell>
      <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-6">

        {/* Header */}
        <div
          className="rounded-2xl p-6 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(245,200,66,0.10) 0%, rgba(13,24,41,0.98) 60%, rgba(124,58,237,0.06) 100%)',
            border: '1px solid rgba(245,200,66,0.25)',
          }}
        >
          <div className="absolute -top-8 -right-8 w-48 h-48 rounded-full pointer-events-none blur-3xl"
            style={{ background: 'rgba(245,200,66,0.10)' }} />
          <div className="relative z-10 flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Trophy size={14} style={{ color: '#F5C842' }} />
                <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#F5C842' }}>
                  Ranking Semanal
                </span>
              </div>
              <h1 className="heading-display text-4xl">Liga Ascendia</h1>
              <p className="text-text-secondary text-sm mt-1">
                XP acumulado esta semana · {total.toLocaleString('pt-BR')} jogadores
              </p>
            </div>
            {myDivision && myPosition && (
              <div
                className="text-right px-4 py-3 rounded-xl"
                style={{ background: `rgba(${myDivision.rgb},0.10)`, border: `1px solid rgba(${myDivision.rgb},0.25)` }}
              >
                <div className="text-2xl">{myDivision.emoji}</div>
                <div className="font-black text-sm" style={{ color: myDivision.color }}>{myDivision.name}</div>
                <div className="text-xs text-text-muted">#{myPosition.toLocaleString('pt-BR')}</div>
                {myWeeklyXp > 0 && (
                  <div className="text-xs font-bold mt-0.5" style={{ color: '#F5C842' }}>
                    ⚡ {myWeeklyXp.toLocaleString('pt-BR')} XP
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Divisões — legenda */}
        <div className="grid grid-cols-5 gap-2">
          {LEAGUE_DIVISIONS.map(div => (
            <div
              key={div.name}
              className="rounded-xl p-2.5 text-center"
              style={{
                background: `rgba(${div.rgb},0.06)`,
                border: myDivision?.name === div.name
                  ? `1px solid rgba(${div.rgb},0.5)`
                  : `1px solid rgba(${div.rgb},0.15)`,
                boxShadow: myDivision?.name === div.name ? `0 0 12px rgba(${div.rgb},0.2)` : 'none',
              }}
            >
              <div className="text-base">{div.emoji}</div>
              <div className="text-[10px] font-bold mt-0.5" style={{ color: div.color }}>{div.name}</div>
              <div className="text-[9px] text-text-muted">Top {100 - div.minPct}%</div>
            </div>
          ))}
        </div>

        {/* Pódio top 3 */}
        {podium.length > 0 && (
          <div
            className="rounded-2xl p-5 relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(245,200,66,0.08) 0%, rgba(13,24,41,0.98) 100%)',
              border: '1px solid rgba(245,200,66,0.18)',
            }}
          >
            <div className="flex items-end justify-center gap-4 py-2">
              {[podium[1], podium[0], podium[2]].map((player, displayIdx) => {
                if (!player) return <div key={displayIdx} className="w-20" />
                const realIdx = displayIdx === 0 ? 1 : displayIdx === 1 ? 0 : 2
                const height = realIdx === 0 ? 'h-28' : realIdx === 1 ? 'h-20' : 'h-16'
                const division = getLeagueDivision(realIdx + 1, total)
                const isMe = player.id === user.id
                const levelInfo = getLevelInfo(player.level as number)
                const initials = getInitials(player.name as string)

                return (
                  <div key={player.id} className="flex flex-col items-center gap-1.5 w-24">
                    <div className="text-xl">{MEDAL[realIdx]}</div>

                    {/* Avatar */}
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-black relative ${isMe ? 'ring-2 ring-offset-2 ring-offset-bg' : ''}`}
                      style={{
                        background: `rgba(${division.rgb},0.2)`,
                        border: `2px solid rgba(${division.rgb},0.5)`,
                        '--tw-ring-color': division.color,
                      } as React.CSSProperties}
                    >
                      {player.avatar_url ? (
                        <Image
                          src={player.avatar_url as string}
                          alt={player.name as string}
                          width={48}
                          height={48}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span style={{ color: division.color }}>{initials}</span>
                      )}
                      <span className="absolute -bottom-1 -right-1 text-xs">{levelInfo.emoji}</span>
                    </div>

                    {/* Name */}
                    <div className="text-center">
                      <div className="text-xs font-bold truncate w-20 text-center" style={{ color: isMe ? '#FF4D00' : '#fff' }}>
                        {(player.name as string).split(' ')[0]}
                        {isMe && ' (você)'}
                      </div>
                      <div className="flex items-center justify-center gap-0.5 text-[10px]" style={{ color: '#F5C842' }}>
                        <Zap size={8} fill="currentColor" />
                        {((player.league_xp_this_week as number) ?? 0).toLocaleString('pt-BR')}
                      </div>
                    </div>

                    {/* Barra de pódio */}
                    <div
                      className={`w-20 ${height} rounded-t-xl`}
                      style={{ background: `linear-gradient(180deg, rgba(${division.rgb},0.3) 0%, rgba(${division.rgb},0.08) 100%)` }}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Lista completa */}
        <div className="space-y-2">
          {rest.map((player, idx) => {
            const position = idx + 4
            const division = getLeagueDivision(position, total)
            const isMe = player.id === user.id
            const levelInfo = getLevelInfo(player.level as number)
            const initials = getInitials(player.name as string)
            const weeklyXp = (player.league_xp_this_week as number) ?? 0
            const streak = (player.streak_current as number) ?? 0

            return (
              <div
                key={player.id}
                className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
                style={{
                  background: isMe
                    ? 'rgba(255,77,0,0.08)'
                    : 'rgba(255,255,255,0.025)',
                  border: isMe
                    ? '1px solid rgba(255,77,0,0.25)'
                    : '1px solid rgba(255,255,255,0.05)',
                }}
              >
                {/* Position */}
                <div className="w-8 text-center text-sm font-black text-text-muted shrink-0">
                  {position}
                </div>

                {/* Avatar */}
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-black shrink-0"
                  style={{ background: `rgba(${division.rgb},0.15)`, border: `1px solid rgba(${division.rgb},0.3)` }}
                >
                  {player.avatar_url ? (
                    <Image
                      src={player.avatar_url as string}
                      alt={player.name as string}
                      width={36}
                      height={36}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span style={{ color: division.color }}>{initials}</span>
                  )}
                </div>

                {/* Name + title */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs">{levelInfo.emoji}</span>
                    <span className={`text-sm font-semibold truncate ${isMe ? 'text-brand-orange' : ''}`}>
                      {(player.name as string).split(' ')[0]}
                      {isMe && ' (você)'}
                    </span>
                    {player.equipped_title && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                        style={{ background: `rgba(${division.rgb},0.15)`, color: division.color }}>
                        {player.equipped_title as string}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-text-muted">
                    <span>Nv {player.level as number}</span>
                    {streak > 0 && (
                      <span className="flex items-center gap-0.5">
                        <Flame size={8} style={{ color: '#FF4D00' }} fill="currentColor" />
                        {streak}d
                      </span>
                    )}
                  </div>
                </div>

                {/* Division badge */}
                <div className="shrink-0 text-sm">{division.emoji}</div>

                {/* XP */}
                <div className="text-right shrink-0">
                  <div className="flex items-center gap-0.5 text-xs font-black" style={{ color: '#F5C842' }}>
                    <Zap size={10} fill="currentColor" />
                    {weeklyXp.toLocaleString('pt-BR')}
                  </div>
                  <div className="text-[9px] text-text-muted">XP/sem</div>
                </div>
              </div>
            )
          })}

          {/* Minha posição se não estiver no top 100 */}
          {myPosition && myPosition > 100 && myProfile && (
            <>
              <div className="flex items-center gap-2 py-1">
                <div className="flex-1 h-px bg-white/06" />
                <span className="text-xs text-text-muted">···</span>
                <div className="flex-1 h-px bg-white/06" />
              </div>
              <div
                className="flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{ background: 'rgba(255,77,0,0.08)', border: '1px solid rgba(255,77,0,0.25)' }}
              >
                <div className="w-8 text-center text-sm font-black text-text-muted">
                  {myPosition.toLocaleString('pt-BR')}
                </div>
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-black shrink-0"
                  style={{ background: 'rgba(255,77,0,0.15)', border: '1px solid rgba(255,77,0,0.3)' }}
                >
                  {getInitials(myProfile.name as string)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-brand-orange">
                    {(myProfile.name as string).split(' ')[0]} (você)
                  </div>
                  <div className="text-[10px] text-text-muted">Nv {myProfile.level as number}</div>
                </div>
                <div className="flex items-center gap-0.5 text-xs font-black" style={{ color: '#F5C842' }}>
                  <Zap size={10} fill="currentColor" />
                  {myWeeklyXp.toLocaleString('pt-BR')}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Motivação */}
        {myPosition && myPosition > 10 && (
          <div
            className="rounded-xl p-4 flex items-center gap-3"
            style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)' }}
          >
            <TrendingUp size={18} style={{ color: '#7C3AED' }} />
            <div>
              <p className="text-sm font-semibold">Suba no ranking</p>
              <p className="text-xs text-text-muted">
                Cada hábito, treino e tarefa desta semana te aproxima do topo.
                {myDivision && ` Você está na ${myDivision.name}.`}
              </p>
            </div>
          </div>
        )}

        {myPosition === 1 && (
          <div
            className="rounded-xl p-4 flex items-center gap-3"
            style={{ background: 'rgba(245,200,66,0.1)', border: '1px solid rgba(245,200,66,0.3)' }}
          >
            <Crown size={18} style={{ color: '#F5C842' }} />
            <p className="text-sm font-bold" style={{ color: '#F5C842' }}>
              Você está no topo! Defenda sua posição até o reset de segunda-feira.
            </p>
          </div>
        )}

      </div>
    </AppShell>
  )
}
