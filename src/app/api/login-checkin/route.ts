/**
 * POST /api/login-checkin
 * Registra o check-in diário de login do usuário.
 * Idempotente: retorna estado atual se já fez check-in hoje.
 *
 * Ciclo de 7 dias:
 *   Dia 1: +20 XP   Dia 2: +30 XP   Dia 3: +50 XP   Dia 4: +75 XP
 *   Dia 5: +100 XP  Dia 6: +150 XP  Dia 7: +300 XP + Loot Box
 *
 * Race condition corrigida via RPC claim_login_atomic (migration 012).
 */

import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { grantXP, createDailyLoot } from '@/lib/xp-server';
import { getLoginReward } from '@/lib/xp';

export const maxDuration = 30;

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  // claim_login_atomic é SECURITY DEFINER e só pode ser chamada pelo service_role
  // (EXECUTE revogado de authenticated na migration 015). Criamos o service client
  // após validar o usuário e reusamos para a notificação mais abaixo.
  const serviceSupabase = createServiceClient();

  const today = new Date().toISOString().split('T')[0]!;
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]!;

  // RPC atômica: lê + atualiza last_login_date e login_streak em 1 round-trip.
  // FOR UPDATE no banco garante que 2 requests simultâneos não concedam XP duplo.
  const { data: claim, error: claimError } = await serviceSupabase.rpc('claim_login_atomic', {
    p_user_id: user.id,
    p_today: today,
    p_yesterday: yesterday,
  });

  if (claimError) {
    console.error('[login-checkin] claim_login_atomic error:', claimError.message);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }

  const result = claim as {
    already_claimed: boolean;
    login_streak: number;
    day_in_cycle: number;
    is_week_complete?: boolean;
  };

  if (result.already_claimed) {
    return NextResponse.json({
      alreadyDone: true,
      loginStreak: result.login_streak,
      dayInCycle: result.day_in_cycle,
    });
  }

  const { login_streak: newStreak, day_in_cycle: dayInCycle, is_week_complete: isDay7 } = result;
  const xpReward = getLoginReward(newStreak);

  // Concede XP (já é atômico via grant_xp_atomic — migration 008)
  const xpResult = await grantXP(
    user.id,
    xpReward,
    `Login diário — Dia ${dayInCycle}`,
    'login',
    `login_${today}`
  );

  // Dia 7 → gera loot box (idempotente via UNIQUE constraint)
  let lootCreated = false;
  if (isDay7) {
    lootCreated = await createDailyLoot(user.id, today, 'login_streak');
  }

  // Notificação in-app de check-in (reusa o service client criado acima)
  await serviceSupabase.from('notifications').insert({
    user_id: user.id,
    type: 'daily_login_reward',
    title: isDay7 ? '🎁 Dia 7 — Loot Box desbloqueada!' : `⚡ Login diário — Dia ${dayInCycle}`,
    body: isDay7
      ? `+${xpReward} XP + caixa surpresa! Abra sua recompensa.`
      : `+${xpReward} XP de bônus de presença. Dia ${dayInCycle}/7.`,
    action_url: '/dashboard',
    scheduled_for: new Date().toISOString(),
    sent_at: new Date().toISOString(),
  });

  return NextResponse.json({
    alreadyDone: false,
    loginStreak: newStreak,
    dayInCycle,
    xpEarned: xpResult.xpEarned,
    leveledUp: xpResult.leveledUp,
    newLevel: xpResult.newLevel,
    lootBox: lootCreated,
    isDay7: isDay7 ?? false,
  });
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('login_streak, last_login_date')
    .eq('id', user.id)
    .single();

  const today = new Date().toISOString().split('T')[0]!;
  const loginStreak = (profile?.login_streak as number) ?? 0;
  const lastLoginDate = profile?.last_login_date as string | null;
  const checkedInToday = lastLoginDate === today;
  const dayInCycle = loginStreak > 0 ? ((loginStreak - 1) % 7) + 1 : 0;

  return NextResponse.json({
    loginStreak,
    lastLoginDate,
    checkedInToday,
    dayInCycle,
    nextXpReward: getLoginReward(loginStreak + (checkedInToday ? 0 : 1)),
  });
}
