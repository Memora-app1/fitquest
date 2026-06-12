/**
 * League Widget — posição do usuário no ranking semanal global.
 * Server Component.
 */

import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { getLeagueDivision, LEAGUE_DIVISIONS } from '@/lib/xp';
import { TrendingUp, ArrowUp } from 'lucide-react';

interface Props {
  userId: string;
}

export async function LeagueWidget({ userId }: Props) {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('league_xp_this_week, name')
    .eq('id', userId)
    .single();

  const myWeeklyXp = (profile?.league_xp_this_week as number) ?? 0;

  const [aboveMeRes, totalRes, top3Res] = await Promise.all([
    supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .in('subscription_status', ['trial', 'active', 'lifetime'])
      .gt('league_xp_this_week', myWeeklyXp),
    supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .in('subscription_status', ['trial', 'active', 'lifetime']),
    supabase
      .from('profiles')
      .select('id, name, league_xp_this_week')
      .in('subscription_status', ['trial', 'active', 'lifetime'])
      .order('league_xp_this_week', { ascending: false })
      .limit(3),
  ]);

  const position = (aboveMeRes.count ?? 0) + 1;
  const total = totalRes.count ?? 1;
  const division = getLeagueDivision(position, total);
  const topPercent = total > 0 ? Math.round((position / total) * 100) : 100;
  const top3 = top3Res.data ?? [];

  // Calcula posições necessárias para próxima divisão
  const divIdx = LEAGUE_DIVISIONS.findIndex((d) => d.name === division.name);
  const nextDiv = divIdx > 0 ? LEAGUE_DIVISIONS[divIdx - 1] : null;
  const positionsToNext = nextDiv
    ? position - Math.floor(total * (1 - nextDiv.minPct / 100))
    : null;

  return (
    <Link href="/ranking">
      <div
        className="relative overflow-hidden rounded-2xl p-5 transition-transform hover:scale-[1.01]"
        style={{
          background: `linear-gradient(135deg, rgba(${division.rgb},0.08) 0%, rgba(13,24,41,0.98) 100%)`,
          border: `1px solid rgba(${division.rgb},0.2)`,
        }}
      >
        <div
          className="pointer-events-none absolute -right-4 -top-4 h-24 w-24 rounded-full blur-2xl"
          style={{ background: `rgba(${division.rgb},0.12)` }}
        />

        <div className="relative z-10">
          <div className="mb-3 flex items-start justify-between">
            <div>
              <div className="mb-0.5 flex items-center gap-1.5">
                <span className="text-sm">{division.emoji}</span>
                <span
                  className="text-[10px] font-black uppercase tracking-widest"
                  style={{ color: division.color }}
                >
                  {division.name}
                </span>
              </div>
              <p className="text-base font-black text-white">
                #{position}{' '}
                <span className="text-sm font-normal text-text-muted">
                  de {total.toLocaleString('pt-BR')}
                </span>
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
          <div className="mb-3 space-y-1">
            <div
              className="h-1.5 overflow-hidden rounded-full"
              style={{ background: 'rgba(255,255,255,0.06)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${Math.max(2, 100 - topPercent)}%`,
                  background: `linear-gradient(90deg, ${division.color}, rgba(${division.rgb},0.5))`,
                }}
              />
            </div>
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-1 text-[10px] text-text-muted">
                <TrendingUp size={9} />
                Top {topPercent}% dos jogadores
              </p>
              {/* Nudge social: posições para próxima divisão */}
              {nextDiv &&
                positionsToNext !== null &&
                positionsToNext > 0 &&
                positionsToNext <= 50 && (
                  <p
                    className="flex items-center gap-0.5 text-[10px] font-bold"
                    style={{ color: nextDiv.color }}
                  >
                    <ArrowUp size={9} />
                    {positionsToNext} pos. para {nextDiv.emoji} {nextDiv.name}
                  </p>
                )}
              {nextDiv && positionsToNext !== null && positionsToNext === 1 && (
                <p
                  className="flex animate-pulse items-center gap-0.5 text-[10px] font-black"
                  style={{ color: nextDiv.color }}
                >
                  <ArrowUp size={9} />1 passo para {nextDiv.name}!
                </p>
              )}
            </div>
          </div>

          {/* Top 3 mini */}
          {top3.length > 0 && (
            <div className="flex gap-2">
              {top3.map((p, idx) => {
                const medals = ['🥇', '🥈', '🥉'];
                return (
                  <div key={p.id as string} className="flex-1 text-center">
                    <p className="text-sm">{medals[idx]}</p>
                    <p className="truncate text-[9px] text-text-muted">
                      {(p.name as string).split(' ')[0]}
                    </p>
                    <p className="text-[9px] font-bold" style={{ color: '#F5C842' }}>
                      {(p.league_xp_this_week as number).toLocaleString('pt-BR')}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
