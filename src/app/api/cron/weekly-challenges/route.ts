import { isCronAuthorized, cronUnauthorized } from '@/lib/cron-auth';
/**
 * Cron executado às 12:00 e 20:00 UTC diariamente.
 * Concede XP de desafios semanais completados — uma vez por desafio por semana.
 *
 * Idempotência: usa source_id = 'wc_{year}w{week}_{challengeId}' em xp_transactions.
 *
 * Antes: computeChallengesForUser() = 9 queries por usuário = O(9N).
 * Agora: 9 queries para TODOS os usuários + 1 query de idempotência = O(10) fixas.
 */

import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { grantXP } from '@/lib/xp-server';
import { sendPushNotification } from '@/lib/webpush';

export const maxDuration = 120;

import { WATER_GOAL_ML } from '@/lib/constants';
import {
  getISOWeek,
  getWeekStartString as getWeekStart,
  getWeekEndString as getWeekEnd,
} from '@/lib/dates';

interface ChallengeResult {
  id: string;
  xpReward: number;
  completed: boolean;
  label: string;
}

// Dados pré-agregados por usuário para computar desafios sem queries adicionais
interface UserBatchData {
  habitsCount: number;
  habitLogsCount: number;
  workoutsCount: number;
  tasksDoneCount: number;
  totalTasksCount: number;
  weekXp: number;
  transactionsCount: number;
  streakCurrent: number;
  level: number;
  waterGoalDays: number;
}

function computeChallengesFromData(
  data: UserBatchData,
  weekNum: number,
  year: number
): ChallengeResult[] {
  const seed = weekNum + year * 100;
  const {
    habitsCount,
    habitLogsCount,
    workoutsCount,
    tasksDoneCount,
    totalTasksCount,
    weekXp,
    transactionsCount,
    streakCurrent,
    level,
    waterGoalDays,
  } = data;

  const levelMult = 1 + (level - 1) * 0.2;
  const challenges: ChallengeResult[] = [];

  if (habitsCount > 0) {
    const target = Math.max(3, Math.round(habitsCount * 4 * levelMult));
    challenges.push({
      id: 'habits',
      xpReward: Math.round(150 * levelMult),
      completed: habitLogsCount >= target,
      label: 'Mestre dos Hábitos',
    });
  }

  {
    const baseTarget = level <= 2 ? 1 : level <= 4 ? 2 : 3;
    const target = Math.max(1, Math.round(baseTarget * levelMult));
    challenges.push({
      id: 'workouts',
      xpReward: Math.round(200 * levelMult),
      completed: workoutsCount >= target,
      label: 'Guerreiro Fitness',
    });
  }

  if (totalTasksCount > 0) {
    const baseTarget = level <= 2 ? 3 : level <= 4 ? 5 : 7;
    const target = Math.round(baseTarget * levelMult);
    challenges.push({
      id: 'tasks',
      xpReward: Math.round(120 * levelMult),
      completed: tasksDoneCount >= target,
      label: 'Executor Elite',
    });
  }

  {
    const baseXpTarget = level <= 2 ? 200 : level <= 4 ? 500 : level <= 6 ? 1000 : 2000;
    const xpVariance = Math.round(baseXpTarget * 0.2);
    const target = Math.round((baseXpTarget + ((seed * 3571) % xpVariance)) * levelMult);
    challenges.push({
      id: 'xp',
      xpReward: Math.round(250 * levelMult),
      completed: weekXp >= target,
      label: 'Caçador de XP',
    });
  }

  {
    const streakTarget = level <= 2 ? 3 : level <= 4 ? 5 : 7;
    challenges.push({
      id: 'streak',
      xpReward: Math.round(300 * levelMult),
      completed: streakCurrent >= streakTarget,
      label: 'Sequência Implacável',
    });
  }

  challenges.push({
    id: 'health',
    xpReward: Math.round(130 * levelMult),
    completed: waterGoalDays >= 5,
    label: 'Hidratação Plena',
  });

  if (seed % 2 === 0 || transactionsCount > 0) {
    const target = level <= 2 ? 3 : level <= 4 ? 5 : 8;
    challenges.push({
      id: 'finance',
      xpReward: Math.round(100 * levelMult),
      completed: transactionsCount >= target,
      label: 'Controle Financeiro',
    });
  }

  return challenges
    .sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return b.xpReward - a.xpReward;
    })
    .slice(0, 4);
}

export async function GET() {
  if (!(await isCronAuthorized())) return cronUnauthorized();

  const supabase = createServiceClient();
  const now = new Date();
  const weekNum = getISOWeek(now);
  const year = now.getFullYear();
  const weekStart = getWeekStart(now);
  const weekEnd = getWeekEnd(now);

  // ── 1. Usuários ativos (1 query) ─────────────────────────────────────────────
  const { data: users } = await supabase
    .from('profiles')
    .select('id, name, streak_current, level')
    .in('subscription_status', ['trial', 'active', 'lifetime']);

  if (!users || users.length === 0) {
    return NextResponse.json({ ok: true, processed: 0, granted: 0 });
  }

  const userIds = users.map((u) => u.id);

  // ── 2. Batch: 9 queries para TODOS os usuários em paralelo ───────────────────
  const [
    habitLogsRes,
    habitsRes,
    workoutsRes,
    tasksDoneRes,
    tasksAllRes,
    xpRes,
    transactionsRes,
    waterLogsRes,
    alreadyGrantedRes,
  ] = await Promise.all([
    supabase
      .from('habit_logs')
      .select('user_id, habit_id')
      .in('user_id', userIds)
      .gte('logged_date', weekStart)
      .lte('logged_date', weekEnd),
    supabase.from('habits').select('user_id').in('user_id', userIds).eq('is_active', true),
    supabase
      .from('workouts')
      .select('user_id')
      .in('user_id', userIds)
      .gte('created_at', weekStart + 'T00:00:00')
      .lte('created_at', weekEnd + 'T23:59:59'),
    supabase
      .from('tasks')
      .select('user_id')
      .in('user_id', userIds)
      .eq('status', 'done')
      .gte('updated_at', weekStart + 'T00:00:00')
      .lte('updated_at', weekEnd + 'T23:59:59'),
    supabase.from('tasks').select('user_id').in('user_id', userIds).neq('status', 'archived'),
    supabase
      .from('xp_transactions')
      .select('user_id, amount')
      .in('user_id', userIds)
      .gte('created_at', weekStart + 'T00:00:00')
      .lte('created_at', weekEnd + 'T23:59:59'),
    supabase
      .from('transactions')
      .select('user_id')
      .in('user_id', userIds)
      .gte('transaction_date', weekStart)
      .lte('transaction_date', weekEnd),
    supabase
      .from('water_logs')
      .select('user_id, date, amount_ml')
      .in('user_id', userIds)
      .gte('date', weekStart)
      .lte('date', weekEnd),
    // Idempotência: quais source_ids já foram concedidos esta semana para esses usuários?
    supabase
      .from('xp_transactions')
      .select('user_id, source_id')
      .in('user_id', userIds)
      .eq('source_type', 'bonus')
      .ilike('source_id', `wc_${year}w${weekNum}_%`),
  ]);

  // ── 3. Agrega em memória por user_id ─────────────────────────────────────────
  const habitLogCountByUser = new Map<string, number>();
  for (const r of habitLogsRes.data ?? []) {
    const uid = r.user_id as string;
    habitLogCountByUser.set(uid, (habitLogCountByUser.get(uid) ?? 0) + 1);
  }

  const habitCountByUser = new Map<string, number>();
  for (const r of habitsRes.data ?? []) {
    const uid = r.user_id as string;
    habitCountByUser.set(uid, (habitCountByUser.get(uid) ?? 0) + 1);
  }

  const workoutCountByUser = new Map<string, number>();
  for (const r of workoutsRes.data ?? []) {
    const uid = r.user_id as string;
    workoutCountByUser.set(uid, (workoutCountByUser.get(uid) ?? 0) + 1);
  }

  const tasksDoneCountByUser = new Map<string, number>();
  for (const r of tasksDoneRes.data ?? []) {
    const uid = r.user_id as string;
    tasksDoneCountByUser.set(uid, (tasksDoneCountByUser.get(uid) ?? 0) + 1);
  }

  const tasksAllCountByUser = new Map<string, number>();
  for (const r of tasksAllRes.data ?? []) {
    const uid = r.user_id as string;
    tasksAllCountByUser.set(uid, (tasksAllCountByUser.get(uid) ?? 0) + 1);
  }

  const xpByUser = new Map<string, number>();
  for (const r of xpRes.data ?? []) {
    const uid = r.user_id as string;
    xpByUser.set(uid, (xpByUser.get(uid) ?? 0) + ((r.amount as number) ?? 0));
  }

  const transCountByUser = new Map<string, number>();
  for (const r of transactionsRes.data ?? []) {
    const uid = r.user_id as string;
    transCountByUser.set(uid, (transCountByUser.get(uid) ?? 0) + 1);
  }

  // Água: conta dias em que o usuário atingiu a meta
  const waterByUserDay = new Map<string, Map<string, number>>();
  for (const r of waterLogsRes.data ?? []) {
    const uid = r.user_id as string;
    const date = r.date as string;
    const ml = (r.amount_ml as number) ?? 0;
    if (!waterByUserDay.has(uid)) waterByUserDay.set(uid, new Map());
    const dayMap = waterByUserDay.get(uid)!;
    dayMap.set(date, (dayMap.get(date) ?? 0) + ml);
  }
  const waterGoalDaysByUser = new Map<string, number>();
  for (const [uid, dayMap] of waterByUserDay.entries()) {
    const goalDays = [...dayMap.values()].filter((ml) => ml >= WATER_GOAL_ML).length;
    waterGoalDaysByUser.set(uid, goalDays);
  }

  // Idempotência: (user_id, source_id) já concedidos
  const grantedSet = new Set<string>();
  for (const r of alreadyGrantedRes.data ?? []) {
    grantedSet.add(`${r.user_id as string}|${r.source_id as string}`);
  }

  // ── 4. Processa cada usuário em memória ──────────────────────────────────────
  let granted = 0;
  let errors = 0;
  const usersWithNewGrants: { userId: string; name: string; challenge: ChallengeResult }[] = [];

  for (const user of users) {
    try {
      const data: UserBatchData = {
        habitsCount: habitCountByUser.get(user.id) ?? 0,
        habitLogsCount: habitLogCountByUser.get(user.id) ?? 0,
        workoutsCount: workoutCountByUser.get(user.id) ?? 0,
        tasksDoneCount: tasksDoneCountByUser.get(user.id) ?? 0,
        totalTasksCount: tasksAllCountByUser.get(user.id) ?? 0,
        weekXp: xpByUser.get(user.id) ?? 0,
        transactionsCount: transCountByUser.get(user.id) ?? 0,
        streakCurrent: user.streak_current as number,
        level: user.level as number,
        waterGoalDays: waterGoalDaysByUser.get(user.id) ?? 0,
      };

      const challenges = computeChallengesFromData(data, weekNum, year);
      const completedChallenges = challenges.filter((c) => c.completed);

      for (const challenge of completedChallenges) {
        const sourceId = `wc_${year}w${weekNum}_${challenge.id}`;
        const grantKey = `${user.id}|${sourceId}`;

        if (grantedSet.has(grantKey)) continue;

        await grantXP(
          user.id,
          challenge.xpReward,
          `Desafio semanal concluído: ${challenge.label} 🏆`,
          'bonus',
          sourceId
        );

        grantedSet.add(grantKey);
        usersWithNewGrants.push({ userId: user.id, name: user.name as string, challenge });
        granted++;
      }
    } catch (err) {
      console.error(`weekly-challenges cron error for ${user.id}:`, err);
      errors++;
    }
  }

  // ── 5. Push notification para quem recebeu novo XP esta execução ─────────────
  if (usersWithNewGrants.length > 0) {
    const granteeIds = [...new Set(usersWithNewGrants.map((g) => g.userId))];
    const { data: allSubs } = await supabase
      .from('push_subscriptions')
      .select('id, user_id, endpoint, keys_p256dh, keys_auth')
      .in('user_id', granteeIds);

    const subsByUser = new Map<string, typeof allSubs>();
    for (const sub of allSubs ?? []) {
      const uid = sub.user_id as string;
      if (!subsByUser.has(uid)) subsByUser.set(uid, []);
      subsByUser.get(uid)!.push(sub);
    }

    // Envia push só para o primeiro desafio de cada usuário (evitar spam)
    const notifiedUsers = new Set<string>();
    const deadSubIds: string[] = [];

    for (const { userId, challenge } of usersWithNewGrants) {
      if (notifiedUsers.has(userId)) continue;
      const subs = subsByUser.get(userId) ?? [];
      for (const sub of subs) {
        const result = await sendPushNotification(
          sub.endpoint as string,
          sub.keys_p256dh as string,
          sub.keys_auth as string,
          {
            title: `🏆 Desafio concluído: ${challenge.label}`,
            body: `+${challenge.xpReward} XP adicionados ao seu perfil!`,
            url: '/dashboard',
          }
        );
        if (result.gone) deadSubIds.push(sub.id as string);
      }
      notifiedUsers.add(userId);
    }

    if (deadSubIds.length > 0) {
      await supabase.from('push_subscriptions').delete().in('id', deadSubIds);
    }
  }

  return NextResponse.json({
    ok: true,
    processed: users.length,
    granted,
    errors,
    week: `${year}w${weekNum}`,
  });
}
