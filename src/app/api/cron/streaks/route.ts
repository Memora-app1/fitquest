import { isCronAuthorized, cronUnauthorized } from '@/lib/cron-auth';
/**
 * Cron diário às 03:00 UTC (00:00 Brasília)
 * Atualiza streaks de todos os usuários ativos via batch_process_streaks().
 *
 * Antes: loop sequencial com ~8 queries por usuário → trava com 2k usuários.
 * Agora: 1 query SQL para todos + processamento de milestones só para quem cruzou.
 * recordUsers: batch push_subscriptions + batch insert notifications + batch delete dead subs.
 */

import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { grantXP, tryUnlockAchievement, grantStreakFreeze } from '@/lib/xp-server';
import { sendPushNotification } from '@/lib/webpush';
import { XP_REWARDS } from '@/lib/xp';

// Thresholds que geram notificação "você fez história" (exceto os de milestone)
const RECORD_NOTIFY_THRESHOLDS = [10, 15, 20, 25, 50, 75, 100, 150, 200, 250, 300];

export const maxDuration = 60;

type StreakMilestone = {
  xp?: number;
  reason?: string;
  slug: string;
  freezes: number;
};

const STREAK_MILESTONES: Record<number, StreakMilestone> = {
  3: { xp: XP_REWARDS.STREAK_3_DAYS, reason: 'Streak de 3 dias 🔥', slug: 'streak_3', freezes: 0 },
  7: { xp: XP_REWARDS.STREAK_7_DAYS, reason: 'Streak de 7 dias ⚡', slug: 'streak_7', freezes: 1 },
  30: {
    xp: XP_REWARDS.STREAK_30_DAYS,
    reason: 'Streak de 30 dias 🏆',
    slug: 'streak_30',
    freezes: 2,
  },
  90: {
    xp: XP_REWARDS.STREAK_90_DAYS,
    reason: 'Streak de 90 dias 💎',
    slug: 'streak_90',
    freezes: 3,
  },
  180: { slug: 'streak_180', freezes: 3 },
  365: { slug: 'streak_365', freezes: 5 },
};

async function processStreakMilestone(userId: string, milestone: number): Promise<void> {
  const config = STREAK_MILESTONES[milestone];
  if (!config) return;

  if (config.xp && config.reason) {
    await grantXP(userId, config.xp, config.reason, 'streak');
  }
  await tryUnlockAchievement(userId, config.slug);
  if (config.freezes > 0) {
    await grantStreakFreeze(userId, config.freezes);
  }
}

export async function GET() {
  if (!(await isCronAuthorized())) return cronUnauthorized();

  const supabase = createServiceClient();

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 60);

  // 1 query SQL para todos os usuários ativos em vez de N × 8
  const { data: changed, error } = await supabase.rpc('batch_process_streaks', {
    p_cutoff_date: cutoff.toISOString().split('T')[0],
  });

  if (error) {
    console.error('batch_process_streaks error', error);
    return NextResponse.json({ ok: false, error: 'rpc_failed' }, { status: 500 });
  }

  const results = (changed ?? []) as {
    user_id: string;
    old_streak: number;
    new_streak: number;
    used_freeze: boolean;
  }[];

  let updated = 0;
  let reset = 0;

  // Processa milestones apenas para o subconjunto pequeno que cruzou um marco
  const milestoneKeys = Object.keys(STREAK_MILESTONES).map(Number);
  const milestoneUsers = results.filter(
    (u) => u.new_streak > u.old_streak && milestoneKeys.includes(u.new_streak)
  );

  for (const user of results) {
    if (user.new_streak > user.old_streak) updated++;
    if (user.new_streak === 0 && user.old_streak > 0) reset++;
  }

  for (const user of milestoneUsers) {
    try {
      await processStreakMilestone(user.user_id, user.new_streak);
    } catch (err) {
      console.error(`streak milestone error for ${user.user_id}`, err);
    }
  }

  // Notificações "você fez história" para thresholds de record pessoal
  const recordUsers = results.filter(
    (u) =>
      u.new_streak > u.old_streak &&
      RECORD_NOTIFY_THRESHOLDS.some((t) => u.old_streak < t && u.new_streak >= t)
  );

  if (recordUsers.length > 0) {
    // ── Batch: 1 query para push_subscriptions de todos os recordUsers ──────────
    const recordUserIds = recordUsers.map((u) => u.user_id);
    const { data: allSubs } = await supabase
      .from('push_subscriptions')
      .select('id, user_id, endpoint, keys_p256dh, keys_auth')
      .in('user_id', recordUserIds);

    const subsByUser = new Map<string, typeof allSubs>();
    for (const sub of allSubs ?? []) {
      const uid = sub.user_id as string;
      if (!subsByUser.has(uid)) subsByUser.set(uid, []);
      subsByUser.get(uid)!.push(sub);
    }

    const notificationsToInsert: {
      user_id: string;
      type: string;
      title: string;
      body: string;
      action_url: string;
      scheduled_for: string;
      sent_at: string;
    }[] = [];
    const deadSubIds: string[] = [];
    const now = new Date().toISOString();

    for (const user of recordUsers) {
      try {
        const threshold = RECORD_NOTIFY_THRESHOLDS.find(
          (t) => user.old_streak < t && user.new_streak >= t
        );
        if (!threshold) continue;

        const title = `🏆 Você fez história — ${user.new_streak} dias!`;
        const body = `Maior streak da sua vida: ${user.new_streak} dias seguidos. Isso é lendário! 🔥`;

        notificationsToInsert.push({
          user_id: user.user_id,
          type: 'streak_record',
          title,
          body,
          action_url: '/score',
          scheduled_for: now,
          sent_at: now,
        });

        const subs = subsByUser.get(user.user_id) ?? [];
        for (const sub of subs) {
          const result = await sendPushNotification(
            sub.endpoint as string,
            sub.keys_p256dh as string,
            sub.keys_auth as string,
            { title, body, url: '/score' }
          );
          if (result.gone) deadSubIds.push(sub.id as string);
        }
      } catch (err) {
        console.error(`streak record notification error for ${user.user_id}`, err);
      }
    }

    // ── Batch insert + batch delete ─────────────────────────────────────────────
    if (notificationsToInsert.length > 0) {
      await supabase.from('notifications').insert(notificationsToInsert);
    }
    if (deadSubIds.length > 0) {
      await supabase.from('push_subscriptions').delete().in('id', deadSubIds);
    }
  }

  return NextResponse.json({
    ok: true,
    processed: results.length,
    updated,
    reset,
    milestones: milestoneUsers.length,
    records: recordUsers.length,
  });
}
