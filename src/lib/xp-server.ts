/**
 * Funções server-only para conceder XP. NUNCA importe em Client Components.
 * Para constantes e helpers puros, use src/lib/xp.ts
 *
 * grantXP usa a RPC grant_xp_atomic (migration 007) que:
 * - Incrementa xp_total com delta atômico (sem race condition)
 * - Atualiza level se necessário
 * - Insere no ledger xp_transactions
 * Tudo em 1 round trip ao banco.
 *
 * Após o grant, chama increment_weekly_stats para atualizar league_xp e season_xp.
 */

import { createServiceClient } from '@/lib/supabase/server';
import { calculateLevel, calculatePrestige, type XpSourceType, type GrantXpResult } from '@/lib/xp';
import { sendPushNotification } from '@/lib/webpush';

// ════════ FUNÇÃO PRINCIPAL ════════
/**
 * Concede XP de forma atômica via RPC PostgreSQL.
 * Atualiza league_xp_this_week e season_xp como side-effect.
 */
export async function grantXP(
  userId: string,
  amount: number,
  reason: string,
  sourceType: XpSourceType,
  sourceId?: string
): Promise<GrantXpResult> {
  const supabase = createServiceClient();

  // Verifica se há boost 2x ativo (reward_meta armazena ISO expiry, opened_at null = ativo)
  const now = new Date().toISOString();
  const { data: boostRow } = await supabase
    .from('daily_loot')
    .select('id, reward_value')
    .eq('user_id', userId)
    .eq('reward_type', 'multiplier')
    .is('opened_at', null)
    .gt('reward_meta', now)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const multiplier = boostRow ? (boostRow.reward_value as number) : 1;
  const finalAmount = multiplier > 1 ? Math.round(amount * multiplier) : amount;
  const finalReason = multiplier > 1 ? `${reason} ⚡ (2x boost)` : reason;

  // 1 round trip atômico: incrementa xp, atualiza level, insere ledger
  const { data, error } = await supabase.rpc('grant_xp_atomic', {
    p_user_id: userId,
    p_amount: finalAmount,
    p_reason: finalReason,
    p_source_type: sourceType,
    p_source_id: sourceId ?? null,
  });

  let result: {
    xp_total_after: number;
    xp_before: number;
    level_new: number;
    level_old: number;
    leveled_up: boolean;
  };

  if (error) {
    // Fallback: RPC não existe ainda — usa método clássico
    const { data: profile } = await supabase
      .from('profiles')
      .select('xp_total, level')
      .eq('id', userId)
      .single();

    const xpBefore = (profile?.xp_total as number) ?? 0;
    const xpAfter = xpBefore + finalAmount;
    const lvlOld = (profile?.level as number) ?? 1;
    const lvlNew = calculateLevel(xpAfter);

    await supabase.from('xp_transactions').insert({
      user_id: userId,
      amount: finalAmount,
      reason: finalReason,
      source_type: sourceType,
      source_id: sourceId ?? null,
      xp_total_after: xpAfter,
      level_after: lvlNew,
    });

    await supabase
      .from('profiles')
      .update({
        xp_total: xpAfter,
        level: lvlNew,
        last_activity_date: new Date().toISOString().split('T')[0],
      })
      .eq('id', userId);

    result = {
      xp_total_after: xpAfter,
      xp_before: xpBefore,
      level_new: lvlNew,
      level_old: lvlOld,
      leveled_up: lvlNew > lvlOld,
    };
  } else {
    result = data as {
      xp_total_after: number;
      xp_before: number;
      level_new: number;
      level_old: number;
      leveled_up: boolean;
    };
  }

  const { xp_total_after, xp_before, level_new, level_old, leveled_up } = result;

  // 2. Atualiza league_xp_this_week + xp_all_time + season_xp (fire-and-forget)
  if (finalAmount > 0) {
    void supabase.rpc('increment_weekly_stats', {
      p_user_id: userId,
      p_xp: finalAmount,
    });
  }

  // 3. Verifica prestige e atualiza se subiu
  const newPrestige = calculatePrestige(xp_total_after);
  const oldPrestige = calculatePrestige(xp_before);
  if (newPrestige > oldPrestige) {
    await supabase.from('profiles').update({ prestige_level: newPrestige }).eq('id', userId);

    const prestigeTitles = [
      '',
      'Ascendido',
      'Ascendido II',
      'Diamante',
      'Diamante II',
      'Imortal',
      'Imortal II',
      'Imortal III',
      'Lendário',
      'Lendário II',
      'Lendário Eterno',
    ];
    const prestigeEmojis = ['', '⭐', '⭐', '💎', '💎', '🔥', '🔥', '🔥', '👑', '👑', '👑'];
    const pTitle = prestigeTitles[newPrestige] ?? 'Ascendido';
    const pEmoji = prestigeEmojis[newPrestige] ?? '⭐';

    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'prestige',
      title: `${pEmoji} Prestige ${newPrestige} — ${pTitle}!`,
      body: `Você acumulou ${xp_total_after.toLocaleString('pt-BR')} XP total. Lendário!`,
      action_url: '/score',
      scheduled_for: new Date().toISOString(),
      sent_at: new Date().toISOString(),
    });
  }

  // 4. Achievements de level-up
  const achievementsUnlocked: string[] = [];
  if (leveled_up) {
    const unlocked = await tryUnlockAchievement(userId, `level_${level_new}`);
    if (unlocked) achievementsUnlocked.push(`level_${level_new}`);
  }

  // 5. XP milestones — push quando cruza marco importante
  const XP_MILESTONES = [1000, 5000, 10000, 25000, 50000, 100000];
  const crossedMilestone = XP_MILESTONES.find((m) => xp_before < m && xp_total_after >= m);

  if (crossedMilestone) {
    const milestoneTitle = `⚡ ${crossedMilestone.toLocaleString('pt-BR')} XP — Marco atingido!`;
    const milestoneBody = `Você acumulou ${crossedMilestone.toLocaleString('pt-BR')} XP no Ascendia. Evolução real!`;

    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'xp_milestone',
      title: milestoneTitle,
      body: milestoneBody,
      action_url: '/score',
      scheduled_for: new Date().toISOString(),
      sent_at: new Date().toISOString(),
    });

    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('id, endpoint, keys_p256dh, keys_auth')
      .eq('user_id', userId);

    if (subs && subs.length > 0) {
      for (const sub of subs) {
        const pushResult = await sendPushNotification(
          sub.endpoint,
          sub.keys_p256dh,
          sub.keys_auth,
          { title: milestoneTitle, body: milestoneBody, url: '/score' }
        );
        if (pushResult.gone) {
          await supabase.from('push_subscriptions').delete().eq('id', sub.id);
        }
      }
    }
  }

  return {
    xpEarned: finalAmount,
    xpTotalAfter: xp_total_after,
    newLevel: level_new,
    leveledUp: leveled_up,
    previousLevel: level_old,
    achievementsUnlocked,
    newPrestige: newPrestige > oldPrestige ? newPrestige : undefined,
    boostActive: multiplier > 1,
  };
}

// ════════ ACHIEVEMENTS ════════
/**
 * Tenta desbloquear uma conquista. Idempotente.
 * Race-safe: PK composta (user_id, achievement_id) rejeita duplicatas.
 */
export async function tryUnlockAchievement(userId: string, slug: string): Promise<boolean> {
  const supabase = createServiceClient();

  const { data: rawAchievement } = await supabase
    .from('achievements')
    .select('id, xp_reward, name, description')
    .eq('slug', slug)
    .single();

  if (!rawAchievement) return false;

  const achievement = rawAchievement as {
    id: string;
    xp_reward: number;
    name: string;
    description: string;
  };

  const { data: existing } = await supabase
    .from('user_achievements')
    .select('user_id')
    .eq('user_id', userId)
    .eq('achievement_id', achievement.id)
    .maybeSingle();

  if (existing) return false;

  const { error } = await supabase.from('user_achievements').insert({
    user_id: userId,
    achievement_id: achievement.id,
  });

  if (error) return false;

  if (achievement.xp_reward > 0) {
    await supabase.rpc('grant_xp_atomic', {
      p_user_id: userId,
      p_amount: achievement.xp_reward,
      p_reason: `Conquista: ${achievement.name}`,
      p_source_type: 'achievement',
      p_source_id: achievement.id,
    });
  }

  const notifTitle = `🏆 Conquista: ${achievement.name}`;
  const notifBody = `+${achievement.xp_reward} XP — ${achievement.description}`;

  await supabase.from('notifications').insert({
    user_id: userId,
    type: 'achievement',
    title: notifTitle,
    body: notifBody,
    action_url: '/conquistas',
    scheduled_for: new Date().toISOString(),
    sent_at: new Date().toISOString(),
  });

  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('id, endpoint, keys_p256dh, keys_auth')
    .eq('user_id', userId);

  if (subs && subs.length > 0) {
    for (const sub of subs) {
      const result = await sendPushNotification(sub.endpoint, sub.keys_p256dh, sub.keys_auth, {
        title: notifTitle,
        body: notifBody,
        url: '/conquistas',
      });
      if (result.gone) {
        await supabase.from('push_subscriptions').delete().eq('id', sub.id);
      }
    }
  }

  return true;
}

// ════════ LOOT BOX ════════
/**
 * Gera um loot box para o usuário (1 por dia, idempotente via UNIQUE constraint).
 * Determina raridade randomicamente server-side.
 */
export async function createDailyLoot(
  userId: string,
  date: string,
  source: 'perfect_day' | 'login_streak' | 'login_day7' = 'perfect_day'
): Promise<boolean> {
  const supabase = createServiceClient();

  const rand = Math.random();
  let rarity: 'common' | 'rare' | 'epic' | 'legendary';
  let rewardType: 'xp' | 'streak_freeze' | 'cosmetic';
  let rewardValue: number;
  let rewardMeta: string | null = null;

  if (rand < 0.6) {
    rarity = 'common';
    rewardType = 'xp';
    rewardValue = 50;
  } else if (rand < 0.85) {
    rarity = 'rare';
    rewardType = 'xp';
    rewardValue = 150;
  } else if (rand < 0.97) {
    rarity = 'epic';
    rewardType = 'streak_freeze';
    rewardValue = 1;
  } else {
    rarity = 'legendary';
    rewardType = 'cosmetic';
    rewardValue = 0;
    const { data: cosm } = await supabase
      .from('cosmetics')
      .select('id, slug, name')
      .eq('source', 'loot')
      .eq('type', 'title');
    if (cosm && cosm.length > 0) {
      const pick = cosm[Math.floor(Math.random() * cosm.length)]!;
      rewardMeta = JSON.stringify({
        cosmetic_id: (pick as { id: string; slug: string; name: string }).id,
        slug: (pick as { id: string; slug: string; name: string }).slug,
        name: (pick as { id: string; slug: string; name: string }).name,
      });
    } else {
      rarity = 'epic';
      rewardType = 'xp';
      rewardValue = 300;
    }
  }

  const { error } = await supabase.from('daily_loot').insert({
    user_id: userId,
    date,
    rarity,
    reward_type: rewardType,
    reward_value: rewardValue,
    reward_meta: rewardMeta,
    source,
  });

  return !error || error.code === '23505';
}

// ════════ STREAK FREEZE ════════
export async function grantStreakFreeze(userId: string, amount: number): Promise<void> {
  const supabase = createServiceClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('streak_freezes')
    .eq('id', userId)
    .single();
  if (!profile) return;
  const current = (profile.streak_freezes as number) ?? 0;
  await supabase
    .from('profiles')
    .update({ streak_freezes: Math.min(10, current + amount) })
    .eq('id', userId);
}

// ════════ HELPERS DE CONTAGEM ════════
export async function getUserStats(userId: string) {
  const supabase = createServiceClient();

  const [workouts, tasks, transactions, perfectDays] = await Promise.all([
    supabase
      .from('workouts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .not('finished_at', 'is', null),
    supabase
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'done'),
    supabase
      .from('transactions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId),
    supabase.from('profiles').select('perfect_days').eq('id', userId).single(),
  ]);

  return {
    totalWorkouts: workouts.count ?? 0,
    totalTasks: tasks.count ?? 0,
    totalTransactions: transactions.count ?? 0,
    perfectDays: perfectDays.data?.perfect_days ?? 0,
  };
}
