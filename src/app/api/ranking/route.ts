/**
 * GET /api/ranking
 * Retorna o ranking global por XP semanal (league_xp_this_week).
 * Inclui a divisão (Bronze → Diamante) baseada na posição percentual.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getLeagueDivision } from '@/lib/xp';

export const revalidate = 300; // cache 5 minutos

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  // Top 100 por XP semanal
  const { data: leaders } = await supabase
    .from('profiles')
    .select(
      'id, name, level, prestige_level, equipped_title, equipped_frame, league_xp_this_week, streak_current, avatar_url'
    )
    .in('subscription_status', ['trial', 'active', 'lifetime'])
    .order('league_xp_this_week', { ascending: false })
    .limit(100);

  const players = leaders ?? [];
  const total = players.length;

  const ranked = players.map((p, idx) => ({
    position: idx + 1,
    id: p.id,
    name: p.name as string,
    level: p.level as number,
    prestige: (p.prestige_level as number) ?? 0,
    equippedTitle: p.equipped_title as string | null,
    weeklyXp: (p.league_xp_this_week as number) ?? 0,
    streak: (p.streak_current as number) ?? 0,
    avatarUrl: p.avatar_url as string | null,
    isCurrentUser: p.id === user.id,
    division: getLeagueDivision(idx + 1, total),
  }));

  // Posição do usuário atual (pode não estar no top 100)
  const myEntry = ranked.find((r) => r.isCurrentUser);
  let myPosition = myEntry?.position ?? null;

  if (!myEntry) {
    const { data: myProfile } = await supabase
      .from('profiles')
      .select('league_xp_this_week, level, prestige_level, equipped_title, streak_current')
      .eq('id', user.id)
      .single();

    if (myProfile) {
      const myWeeklyXp = (myProfile.league_xp_this_week as number) ?? 0;
      // Conta quantos têm mais XP que eu esta semana
      const { count } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .in('subscription_status', ['trial', 'active', 'lifetime'])
        .gt('league_xp_this_week', myWeeklyXp);

      myPosition = (count ?? 0) + 1;
    }
  }

  // Conta total de players ativos
  const { count: totalPlayers } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .in('subscription_status', ['trial', 'active', 'lifetime']);

  return NextResponse.json({
    leaderboard: ranked,
    myPosition,
    totalPlayers: totalPlayers ?? total,
    myDivision: myPosition ? getLeagueDivision(myPosition, totalPlayers ?? total) : null,
  });
}
