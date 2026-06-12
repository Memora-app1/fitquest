/**
 * Sistema de Streak (sequência de dias ativos)
 *
 * REGRA: usuário tem streak ativo se logou pelo menos 1 hábito OU completou
 * 1 treino OU concluiu 1 tarefa no dia.
 *
 * O cron diário às 03:00 UTC (00:00 Brasília) verifica todos os usuários
 * e atualiza streak_current.
 */

import { createServiceClient } from '@/lib/supabase/server';
import { XP_REWARDS } from './xp';
import { grantXP, tryUnlockAchievement } from './xp-server';

/**
 * Concede streak freezes ao usuário (máx 10).
 */
async function grantStreakFreeze(
  userId: string,
  amount: number,
  supabase: ReturnType<typeof createServiceClient>
) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('streak_freezes')
    .eq('id', userId)
    .single();

  if (!profile) return;
  const current = (profile.streak_freezes as number) ?? 0;
  const newTotal = Math.min(current + amount, 10);
  if (newTotal > current) {
    await supabase.from('profiles').update({ streak_freezes: newTotal }).eq('id', userId);
  }
}

/**
 * Verifica se o usuário teve atividade num dia específico
 */
export async function hadActivityOnDate(userId: string, date: Date): Promise<boolean> {
  const supabase = createServiceClient();
  const dateStr = date.toISOString().split('T')[0]!;

  // Verifica em paralelo: hábitos, treinos finalizados, tarefas concluídas
  const [habits, workouts, tasks] = await Promise.all([
    supabase
      .from('habit_logs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('logged_date', dateStr),
    supabase
      .from('workouts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('finished_at', `${dateStr}T00:00:00`)
      .lte('finished_at', `${dateStr}T23:59:59`),
    supabase
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'done')
      .gte('completed_at', `${dateStr}T00:00:00`)
      .lte('completed_at', `${dateStr}T23:59:59`),
  ]);

  return (habits.count ?? 0) > 0 || (workouts.count ?? 0) > 0 || (tasks.count ?? 0) > 0;
}

/**
 * Atualiza o streak de um usuário específico.
 * Chamado pelo cron diário ou ao logar atividade.
 */
export async function updateUserStreak(userId: string): Promise<{
  previousStreak: number;
  newStreak: number;
  isLongest: boolean;
}> {
  const supabase = createServiceClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('streak_current, streak_longest, last_activity_date, streak_freezes')
    .eq('id', userId)
    .single();

  if (!profile) {
    return { previousStreak: 0, newStreak: 0, isLongest: false };
  }

  const previousStreak = profile.streak_current;
  const availableFreezes = (profile.streak_freezes as number) ?? 0;
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Verifica atividade de ontem
  const hadActivityYesterday = await hadActivityOnDate(userId, yesterday);
  const hadActivityToday = await hadActivityOnDate(userId, today);

  let newStreak = previousStreak;
  let usedFreeze = false;

  if (hadActivityToday) {
    // Logou hoje
    if (hadActivityYesterday || previousStreak === 0) {
      newStreak = previousStreak + 1;
    } else {
      // Pulou ontem mas logou hoje → reinicia em 1
      newStreak = 1;
    }
  } else if (!hadActivityYesterday) {
    // Não logou ontem nem hoje → usa freeze se disponível, senão reseta
    if (previousStreak > 0 && availableFreezes > 0) {
      // Freeze automático: preserva streak, desconta 1 freeze
      usedFreeze = true;
      newStreak = previousStreak;
    } else {
      newStreak = 0;
    }
  }
  // Se não logou hoje mas logou ontem, mantém (ainda tem o dia todo)

  // Desconta freeze se foi usado
  if (usedFreeze) {
    await supabase
      .from('profiles')
      .update({ streak_freezes: Math.max(0, availableFreezes - 1) })
      .eq('id', userId);
  }

  const newLongest = Math.max(profile.streak_longest, newStreak);
  const isLongest = newStreak > profile.streak_longest;

  await supabase
    .from('profiles')
    .update({
      streak_current: newStreak,
      streak_longest: newLongest,
    })
    .eq('id', userId);

  // Verifica milestones e concede XP/conquistas/freezes
  // Pesquisa: streak freeze aumenta retenção em 48% (Duolingo data)
  if (newStreak > previousStreak) {
    if (newStreak === 3) {
      await grantXP(userId, XP_REWARDS.STREAK_3_DAYS, 'Streak de 3 dias 🔥', 'streak');
      await tryUnlockAchievement(userId, 'streak_3');
    } else if (newStreak === 7) {
      await grantXP(userId, XP_REWARDS.STREAK_7_DAYS, 'Streak de 7 dias ⚡', 'streak');
      await tryUnlockAchievement(userId, 'streak_7');
      // Concede 1 streak freeze ao atingir 7 dias (loss aversion começa aqui)
      await grantStreakFreeze(userId, 1, supabase);
    } else if (newStreak === 30) {
      await grantXP(userId, XP_REWARDS.STREAK_30_DAYS, 'Streak de 30 dias 🏆', 'streak');
      await tryUnlockAchievement(userId, 'streak_30');
      // Concede 2 freezes ao atingir 30 dias
      await grantStreakFreeze(userId, 2, supabase);
    } else if (newStreak === 90) {
      await grantXP(userId, XP_REWARDS.STREAK_90_DAYS, 'Streak de 90 dias 💎', 'streak');
      await tryUnlockAchievement(userId, 'streak_90');
      // Concede 3 freezes ao atingir 90 dias
      await grantStreakFreeze(userId, 3, supabase);
    } else if (newStreak === 180) {
      await tryUnlockAchievement(userId, 'streak_180');
      await grantStreakFreeze(userId, 3, supabase);
    } else if (newStreak === 365) {
      await tryUnlockAchievement(userId, 'streak_365');
      await grantStreakFreeze(userId, 5, supabase);
    }
  }

  return { previousStreak, newStreak, isLongest };
}
