/**
 * Funções server-only para conceder XP. NUNCA importe em Client Components.
 * Para constantes e helpers puros, use src/lib/xp.ts
 *
 * grantXP usa a RPC grant_xp_atomic (migration 007) que:
 * - Incrementa xp_total com delta atômico (sem race condition)
 * - Atualiza level se necessário
 * - Insere no ledger xp_transactions
 * Tudo em 1 round trip ao banco.
 */

import { createServiceClient } from '@/lib/supabase/server'
import { calculateLevel, type XpSourceType, type GrantXpResult } from '@/lib/xp'
import { sendPushNotification } from '@/lib/webpush'

// ════════ FUNÇÃO PRINCIPAL ════════
/**
 * Concede XP de forma atômica via RPC PostgreSQL.
 * Sem race condition: dois requests simultâneos somam XP corretamente.
 */
export async function grantXP(
  userId: string,
  amount: number,
  reason: string,
  sourceType: XpSourceType,
  sourceId?: string
): Promise<GrantXpResult> {
  const supabase = createServiceClient()

  // 1 round trip atômico: incrementa xp, atualiza level, insere ledger
  const { data, error } = await supabase.rpc('grant_xp_atomic', {
    p_user_id:     userId,
    p_amount:      amount,
    p_reason:      reason,
    p_source_type: sourceType,
    p_source_id:   sourceId ?? null,
  })

  let result: { xp_total_after: number; xp_before: number; level_new: number; level_old: number; leveled_up: boolean }

  if (error) {
    // Fallback: RPC não existe ainda (migration 008 não executada) — usa método clássico
    const { data: profile } = await supabase
      .from('profiles')
      .select('xp_total, level')
      .eq('id', userId)
      .single()

    const xpBefore = (profile?.xp_total as number) ?? 0
    const xpAfter  = xpBefore + amount
    const lvlOld   = (profile?.level as number) ?? 1
    const lvlNew   = calculateLevel(xpAfter)

    await supabase.from('xp_transactions').insert({
      user_id:        userId,
      amount,
      reason,
      source_type:    sourceType,
      source_id:      sourceId ?? null,
      xp_total_after: xpAfter,
      level_after:    lvlNew,
    })

    await supabase
      .from('profiles')
      .update({ xp_total: xpAfter, level: lvlNew, last_activity_date: new Date().toISOString().split('T')[0] })
      .eq('id', userId)

    result = { xp_total_after: xpAfter, xp_before: xpBefore, level_new: lvlNew, level_old: lvlOld, leveled_up: lvlNew > lvlOld }
  } else {
    result = data as { xp_total_after: number; xp_before: number; level_new: number; level_old: number; leveled_up: boolean }
  }

  const { xp_total_after, xp_before, level_new, level_old, leveled_up } = result

  // 2. Achievements de level-up
  const achievementsUnlocked: string[] = []
  if (leveled_up) {
    const unlocked = await tryUnlockAchievement(userId, `level_${level_new}`)
    if (unlocked) achievementsUnlocked.push(`level_${level_new}`)
  }

  // 3. XP milestones — notificação push quando cruza marco importante
  //    xp_before é calculado como xp_total_after - amount (atômico garante isso)
  const XP_MILESTONES = [1000, 5000, 10000, 25000, 50000, 100000]
  const crossedMilestone = XP_MILESTONES.find(
    (m) => xp_before < m && xp_total_after >= m
  )

  if (crossedMilestone) {
    const milestoneTitle = `⚡ ${crossedMilestone.toLocaleString('pt-BR')} XP — Marco atingido!`
    const milestoneBody  = `Você acumulou ${crossedMilestone.toLocaleString('pt-BR')} XP no Ascendia. Evolução real!`

    await supabase.from('notifications').insert({
      user_id:       userId,
      type:          'xp_milestone',
      title:         milestoneTitle,
      body:          milestoneBody,
      action_url:    '/score',
      scheduled_for: new Date().toISOString(),
      sent_at:       new Date().toISOString(),
    })

    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('id, endpoint, keys_p256dh, keys_auth')
      .eq('user_id', userId)

    if (subs && subs.length > 0) {
      for (const sub of subs) {
        const pushResult = await sendPushNotification(
          sub.endpoint, sub.keys_p256dh, sub.keys_auth,
          { title: milestoneTitle, body: milestoneBody, url: '/score' }
        )
        if (pushResult.gone) {
          await supabase.from('push_subscriptions').delete().eq('id', sub.id)
        }
      }
    }
  }

  return {
    xpEarned:             amount,
    xpTotalAfter:         xp_total_after,
    newLevel:             level_new,
    leveledUp:            leveled_up,
    previousLevel:        level_old,
    achievementsUnlocked,
  }
}

// ════════ ACHIEVEMENTS ════════
/**
 * Tenta desbloquear uma conquista. Retorna true se foi desbloqueada agora.
 * Idempotente: se já desbloqueada, retorna false silenciosamente.
 * Race-safe: PK composta (user_id, achievement_id) rejeita duplicatas.
 */
export async function tryUnlockAchievement(
  userId: string,
  slug: string
): Promise<boolean> {
  const supabase = createServiceClient()

  const { data: rawAchievement } = await supabase
    .from('achievements')
    .select('id, xp_reward, name, description')
    .eq('slug', slug)
    .single()

  if (!rawAchievement) return false

  const achievement = rawAchievement as {
    id: string
    xp_reward: number
    name: string
    description: string
  }

  // Verificar se já tem — a PK composta também protege, mas evita erro desnecessário
  const { data: existing } = await supabase
    .from('user_achievements')
    .select('user_id')
    .eq('user_id', userId)
    .eq('achievement_id', achievement.id)
    .maybeSingle()

  if (existing) return false

  const { error } = await supabase.from('user_achievements').insert({
    user_id:        userId,
    achievement_id: achievement.id,
  })

  // 23505 = unique violation → já desbloqueado por race condition (idempotente)
  if (error) return false

  // Conceder XP da conquista via RPC (atômico, sem recursão de achievements)
  if (achievement.xp_reward > 0) {
    await supabase.rpc('grant_xp_atomic', {
      p_user_id:     userId,
      p_amount:      achievement.xp_reward,
      p_reason:      `Conquista: ${achievement.name}`,
      p_source_type: 'achievement',
      p_source_id:   achievement.id,
    })
  }

  // Notificação in-app + push
  const notifTitle = `🏆 Conquista: ${achievement.name}`
  const notifBody  = `+${achievement.xp_reward} XP — ${achievement.description}`

  await supabase.from('notifications').insert({
    user_id:       userId,
    type:          'achievement',
    title:         notifTitle,
    body:          notifBody,
    action_url:    '/conquistas',
    scheduled_for: new Date().toISOString(),
    sent_at:       new Date().toISOString(),
  })

  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('id, endpoint, keys_p256dh, keys_auth')
    .eq('user_id', userId)

  if (subs && subs.length > 0) {
    for (const sub of subs) {
      const result = await sendPushNotification(
        sub.endpoint, sub.keys_p256dh, sub.keys_auth,
        { title: notifTitle, body: notifBody, url: '/conquistas' }
      )
      if (result.gone) {
        await supabase.from('push_subscriptions').delete().eq('id', sub.id)
      }
    }
  }

  return true
}

// ════════ HELPERS DE CONTAGEM ════════
export async function getUserStats(userId: string) {
  const supabase = createServiceClient()

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
    supabase
      .from('profiles')
      .select('perfect_days')
      .eq('id', userId)
      .single(),
  ])

  return {
    totalWorkouts:    workouts.count ?? 0,
    totalTasks:       tasks.count ?? 0,
    totalTransactions: transactions.count ?? 0,
    perfectDays:      perfectDays.data?.perfect_days ?? 0,
  }
}
