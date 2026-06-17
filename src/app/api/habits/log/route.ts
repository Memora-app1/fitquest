import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { XP_REWARDS } from '@/lib/xp';
import { grantXP, tryUnlockAchievement, createDailyLoot } from '@/lib/xp-server';
import { updateUserStreak } from '@/lib/streak';
import { todayString } from '@/lib/utils';

export const maxDuration = 30;

const bodySchema = z.object({
  habitId: z.string().uuid(),
  value: z.number().optional().default(1),
  note: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid_input', issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { habitId, value, note } = parsed.data;
  const today = todayString();

  // Buscar hábito + perfil em paralelo (perfil necessário para Bônus de Volta)
  const [{ data: habit, error: habitError }, { data: profile }] = await Promise.all([
    supabase
      .from('habits')
      .select('id, name, xp_per_completion, user_id')
      .eq('id', habitId)
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('profiles')
      .select('streak_current, streak_longest, last_activity_date')
      .eq('id', user.id)
      .single(),
  ]);

  if (habitError || !habit) {
    return NextResponse.json({ error: 'habit_not_found' }, { status: 404 });
  }

  // Inserir log (unique constraint vai falhar se já existe hoje)
  const { error: logError } = await supabase.from('habit_logs').insert({
    habit_id: habitId,
    user_id: user.id,
    logged_date: today,
    value,
    note: note ?? null,
    xp_earned: habit.xp_per_completion,
  });

  if (logError) {
    // 23505 = unique violation = já logado hoje
    if (logError.code === '23505') {
      return NextResponse.json({ error: 'already_logged_today' }, { status: 409 });
    }
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }

  // Golpe Crítico — 10% de chance de XP 2× (variable reward schedule)
  const criticalHit = Math.random() < 0.1;
  const finalXp = criticalHit ? habit.xp_per_completion * 2 : habit.xp_per_completion;

  // Conceder XP
  const xpResult = await grantXP(
    user.id,
    finalXp,
    criticalHit ? `⚡ CRÍTICO: ${habit.name}` : `Hábito: ${habit.name}`,
    'habit',
    habitId
  );

  // Bônus de Volta — premia o retorno após 2+ dias de ausência (idempotente via source_id)
  let comebackBonusXp = 0;
  if (
    profile &&
    (profile.streak_current as number) === 0 &&
    (profile.streak_longest as number) > 0
  ) {
    const lastActivity = profile.last_activity_date as string | null;
    const daysSinceActivity = lastActivity
      ? Math.floor((Date.now() - new Date(lastActivity).getTime()) / 86400000)
      : 999;
    if (daysSinceActivity >= 2) {
      const comebackResult = await grantXP(
        user.id,
        100,
        `🎉 Bônus de Volta! Bem-vindo de volta após ${daysSinceActivity} dias`,
        'bonus',
        `comeback_bonus_${today}`
      );
      comebackBonusXp = comebackResult.xpEarned;
    }
  }

  // Conquistas first-time + count milestones
  const { count } = await supabase
    .from('habit_logs')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id);
  if (count === 1) await tryUnlockAchievement(user.id, 'first_habit');
  if (count === 100) await tryUnlockAchievement(user.id, 'habits_100');
  if (count === 500) await tryUnlockAchievement(user.id, 'habits_500');
  if (count === 1000) await tryUnlockAchievement(user.id, 'habits_1000');

  // Verificar "Dia Perfeito" — todos os hábitos ativos foram logados hoje?
  const [habitsCount, logsToday] = await Promise.all([
    supabase
      .from('habits')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_active', true),
    supabase
      .from('habit_logs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('logged_date', today),
  ]);

  let perfectDayBonus = 0;
  if (
    habitsCount.count &&
    logsToday.count &&
    habitsCount.count > 0 &&
    logsToday.count === habitsCount.count
  ) {
    // RPC atômico: verifica + concede XP + incrementa perfect_days em uma transação
    // Previne race condition quando múltiplos hábitos completam simultaneamente
    const { data: pdResult } = await supabase.rpc('maybe_grant_perfect_day', {
      p_user_id: user.id,
    });
    const pd = pdResult as { granted: boolean; perfect_days: number } | null;

    if (pd?.granted) {
      perfectDayBonus = XP_REWARDS.PERFECT_DAY;
      await tryUnlockAchievement(user.id, 'perfect_day');
      if (pd.perfect_days % 7 === 0) {
        await tryUnlockAchievement(user.id, 'perfect_week');
      }
      // Loot box do Dia Perfeito (idempotente via UNIQUE constraint)
      await createDailyLoot(user.id, today, 'perfect_day');
    }
  }

  // Atualizar streak
  await updateUserStreak(user.id);

  return NextResponse.json({
    success: true,
    xpEarned: xpResult.xpEarned + perfectDayBonus + comebackBonusXp,
    leveledUp: xpResult.leveledUp,
    newLevel: xpResult.newLevel,
    perfectDay: perfectDayBonus > 0,
    criticalHit: criticalHit,
    comebackBonus: comebackBonusXp > 0,
    achievementsUnlocked: xpResult.achievementsUnlocked,
  });
}
