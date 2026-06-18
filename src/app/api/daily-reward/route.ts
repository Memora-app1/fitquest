/**
 * POST /api/daily-reward — reivindica a recompensa de login diário.
 * Idempotente: retorna a recompensa já reivindicada se já foi hoje.
 *
 * Regras:
 * - 1 claim por dia (baseado em data BR UTC-3)
 * - Login streak de 7 dias dá loot box bônus
 * - XP aumenta conforme o ciclo de 7 dias
 *
 * Race condition corrigida via RPC claim_login_atomic (migration 012).
 */

import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { grantXP, createDailyLoot } from '@/lib/xp-server';
import { getLoginReward } from '@/lib/xp';

const SP_OFFSET = -3 * 3600000;

function todayBR(): string {
  return new Date(Date.now() + SP_OFFSET).toISOString().split('T')[0]!;
}

function yesterdayBR(): string {
  return new Date(Date.now() + SP_OFFSET - 86400000).toISOString().split('T')[0]!;
}

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const today = todayBR();
  const yesterday = yesterdayBR();

  // RPC atômica: lê + atualiza last_login_date e login_streak em 1 round-trip.
  // FOR UPDATE no banco garante que 2 requests simultâneos não concedam XP duplo.
  // claim_login_atomic é SECURITY DEFINER e só pode ser chamada pelo service_role
  // (EXECUTE revogado de authenticated na migration 015) — usamos o service client
  // após validar o usuário logado acima.
  const db = createServiceClient();
  const { data: claim, error: claimError } = await db.rpc('claim_login_atomic', {
    p_user_id: user.id,
    p_today: today,
    p_yesterday: yesterday,
  });

  if (claimError) {
    console.error('[daily-reward] claim_login_atomic error:', claimError.message);
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
      alreadyClaimed: true,
      loginStreak: result.login_streak,
      xpReward: getLoginReward(result.login_streak),
      day: result.day_in_cycle,
    });
  }

  const { login_streak: newStreak, day_in_cycle: dayInCycle, is_week_complete: isWeekComplete } =
    result;
  const xpReward = getLoginReward(newStreak);

  // Concede XP (já é atômico via grant_xp_atomic — migration 008)
  const xpResult = await grantXP(
    user.id,
    xpReward,
    `Login diário — Dia ${dayInCycle} do ciclo`,
    'login',
    `login_${today}`
  );

  // Dia 7 do ciclo: cria loot box bônus (idempotente via UNIQUE constraint)
  if (isWeekComplete) {
    await createDailyLoot(user.id, today, 'login_day7');
  }

  return NextResponse.json({
    alreadyClaimed: false,
    loginStreak: newStreak,
    xpReward: xpResult.xpEarned,
    leveledUp: xpResult.leveledUp,
    newLevel: xpResult.newLevel,
    day: dayInCycle,
    isWeekComplete: isWeekComplete ?? false,
  });
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const today = todayBR();

  const { data: profile } = await supabase
    .from('profiles')
    .select('last_login_date, login_streak')
    .eq('id', user.id)
    .single();

  const currentStreak = (profile?.login_streak as number) ?? 0;
  const alreadyClaimed = profile?.last_login_date === today;
  const dayInCycle = currentStreak > 0 ? ((currentStreak - 1) % 7) + 1 : 0;

  return NextResponse.json({
    alreadyClaimed,
    loginStreak: currentStreak,
    xpReward: getLoginReward(currentStreak + (alreadyClaimed ? 0 : 1)),
    day: alreadyClaimed ? dayInCycle : (currentStreak % 7) + 1,
  });
}
