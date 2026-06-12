/**
 * POST /api/daily-reward — reivindica a recompensa de login diário.
 * Idempotente: retorna a recompensa já reivindicada se já foi hoje.
 *
 * Regras:
 * - 1 claim por dia (baseado em data BR UTC-3)
 * - Login streak de 7 dias dá loot box bônus
 * - XP aumenta conforme o ciclo de 7 dias
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { grantXP, createDailyLoot } from '@/lib/xp-server';
import { getLoginReward } from '@/lib/xp';

const SP_OFFSET = -3 * 3600000;

function todayBR(): string {
  return new Date(Date.now() + SP_OFFSET).toISOString().split('T')[0]!;
}

export async function POST() {
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

  if (!profile) return NextResponse.json({ error: 'profile_not_found' }, { status: 404 });

  const lastLogin = profile.last_login_date as string | null;
  const currentStreak = (profile.login_streak as number) ?? 0;

  // Já reivindicou hoje?
  if (lastLogin === today) {
    const xpForToday = getLoginReward(currentStreak);
    return NextResponse.json({
      alreadyClaimed: true,
      loginStreak: currentStreak,
      xpReward: xpForToday,
      day: ((currentStreak - 1) % 7) + 1,
    });
  }

  // Calcula novo streak
  const yesterday = new Date(Date.now() + SP_OFFSET - 86400000).toISOString().split('T')[0]!;
  const newStreak = lastLogin === yesterday ? currentStreak + 1 : 1;
  const dayInCycle = ((newStreak - 1) % 7) + 1;
  const xpReward = getLoginReward(newStreak);
  const isWeekComplete = dayInCycle === 7;

  // Atualiza perfil
  await supabase
    .from('profiles')
    .update({
      last_login_date: today,
      login_streak: newStreak,
    })
    .eq('id', user.id);

  // Concede XP
  const xpResult = await grantXP(
    user.id,
    xpReward,
    `Login diário — Dia ${dayInCycle} do ciclo`,
    'login'
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
    isWeekComplete,
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
  const dayInCycle = ((currentStreak - 1) % 7) + 1;

  return NextResponse.json({
    alreadyClaimed,
    loginStreak: currentStreak,
    xpReward: getLoginReward(currentStreak + (alreadyClaimed ? 0 : 1)),
    day: alreadyClaimed ? dayInCycle : (currentStreak % 7) + 1,
  });
}
