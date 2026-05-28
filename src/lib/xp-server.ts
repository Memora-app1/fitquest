/**
 * Funções server-only para conceder XP. NUNCA importe em Client Components.
 * Para constantes e helpers puros, use src/lib/xp.ts
 */

import { createServiceClient } from '@/lib/supabase/server'
import { calculateLevel, type XpSourceType, type GrantXpResult } from '@/lib/xp'
import { sendPushNotification } from '@/lib/webpush'

// ════════ FUNÇÃO PRINCIPAL ════════
/**
 * Concede XP a um usuário de forma transacional.
 *
 * @param userId - ID do usuário
 * @param amount - Quantidade de XP (pode ser negativo, mas raro)
 * @param reason - Descrição em português ("Hábito: Treinar concluído")
 * @param sourceType - Tipo da fonte do XP
 * @param sourceId - ID do objeto que gerou o XP (habit_id, task_id, etc)
 */
export async function grantXP(
  userId: string,
  amount: number,
  reason: string,
  sourceType: XpSourceType,
  sourceId?: string
): Promise<GrantXpResult> {
  const supabase = createServiceClient()

  // 1. Buscar XP atual e level
  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('xp_total, level')
    .eq('id', userId)
    .single()

  if (fetchError || !profile) {
    throw new Error(`grantXP: profile não encontrado para ${userId}`)
  }

  const previousLevel = profile.level
  const xpTotalAfter = Math.max(0, profile.xp_total + amount)
  const newLevel = calculateLevel(xpTotalAfter)
  const leveledUp = newLevel > previousLevel

  // 2. Inserir transação no ledger
  const { error: txError } = await supabase.from('xp_transactions').insert({
    user_id: userId,
    amount,
    reason,
    source_type: sourceType,
    source_id: sourceId ?? null,
    xp_total_after: xpTotalAfter,
    level_after: newLevel,
  })

  if (txError) {
    console.error('grantXP: falha ao inserir transaction', txError)
    throw new Error('Falha ao registrar XP')
  }

  // 3. Atualizar profile
  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      xp_total: xpTotalAfter,
      level: newLevel,
      last_activity_date: new Date().toISOString().split('T')[0],
    })
    .eq('id', userId)

  if (updateError) {
    console.error('grantXP: falha ao atualizar profile', updateError)
  }

  // 4. Verificar achievements de level
  const achievementsUnlocked: string[] = []
  if (leveledUp) {
    const levelAchievementSlug = `level_${newLevel}`
    const unlocked = await tryUnlockAchievement(userId, levelAchievementSlug)
    if (unlocked) achievementsUnlocked.push(levelAchievementSlug)
  }

  return {
    xpEarned: amount,
    xpTotalAfter,
    newLevel,
    leveledUp,
    previousLevel,
    achievementsUnlocked,
  }
}

// ════════ ACHIEVEMENTS ════════
/**
 * Tenta desbloquear uma conquista. Retorna true se foi desbloqueada agora.
 * Se já estava desbloqueada, retorna false (idempotente).
 */
export async function tryUnlockAchievement(
  userId: string,
  slug: string
): Promise<boolean> {
  const supabase = createServiceClient()

  // Buscar achievement
  const { data: achievement } = await supabase
    .from('achievements')
    .select('id, xp_reward, name, description')
    .eq('slug', slug)
    .single()

  if (!achievement) return false

  // Verificar se já tem
  const { data: existing } = await supabase
    .from('user_achievements')
    .select('user_id')
    .eq('user_id', userId)
    .eq('achievement_id', achievement.id)
    .maybeSingle()

  if (existing) return false

  // Desbloquear
  const { error } = await supabase.from('user_achievements').insert({
    user_id: userId,
    achievement_id: achievement.id,
  })

  if (error) return false

  // Conceder XP da conquista (sem trigger recursivo de achievements)
  if (achievement.xp_reward > 0) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('xp_total')
      .eq('id', userId)
      .single()

    if (profile) {
      const newXp = profile.xp_total + achievement.xp_reward
      const newLvl = calculateLevel(newXp)

      await supabase.from('xp_transactions').insert({
        user_id: userId,
        amount: achievement.xp_reward,
        reason: `Conquista: ${achievement.name}`,
        source_type: 'achievement',
        source_id: achievement.id,
        xp_total_after: newXp,
        level_after: newLvl,
      })

      await supabase
        .from('profiles')
        .update({ xp_total: newXp, level: newLvl })
        .eq('id', userId)
    }
  }

  // Registra notificação + envia push
  const notifTitle = `🏆 Conquista: ${achievement.name}`
  const notifBody = `+${achievement.xp_reward} XP — ${achievement.description}`

  await supabase.from('notifications').insert({
    user_id: userId,
    type: 'achievement',
    title: notifTitle,
    body: notifBody,
    action_url: '/conquistas',
    scheduled_for: new Date().toISOString(),
    sent_at: new Date().toISOString(),
  })

  // Envia push para todos os dispositivos do usuário
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

// ════════ HELPERS DE CONTAGEM (para triggers de count-based achievements) ════════
export async function getUserStats(userId: string) {
  const supabase = createServiceClient()

  const [workouts, tasks, transactions, perfectDays] = await Promise.all([
    supabase.from('workouts').select('id', { count: 'exact', head: true }).eq('user_id', userId).not('finished_at', 'is', null),
    supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'done'),
    supabase.from('transactions').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('profiles').select('perfect_days').eq('id', userId).single(),
  ])

  return {
    totalWorkouts: workouts.count ?? 0,
    totalTasks: tasks.count ?? 0,
    totalTransactions: transactions.count ?? 0,
    perfectDays: perfectDays.data?.perfect_days ?? 0,
  }
}
