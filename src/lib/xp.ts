/**
 * Sistema unificado de XP do FitQuest
 *
 * REGRA DE OURO: toda concessão de XP DEVE passar por grantXP().
 * Nunca atualize profiles.xp_total diretamente.
 *
 * Fluxo:
 * 1. Ação acontece (hábito logado, treino completo, tarefa concluída)
 * 2. grantXP() é chamado
 * 3. Insere xp_transactions (ledger imutável)
 * 4. Atualiza profiles.xp_total e level
 * 5. Verifica achievements desbloqueadas
 * 6. Retorna {xpEarned, newLevel, leveledUp, achievementsUnlocked}
 */

import { createServiceClient } from '@/lib/supabase/server'

// ════════ XP POR AÇÃO ════════
export const XP_REWARDS = {
  // Hábitos
  HABIT_COMPLETED: 50,
  PERFECT_DAY: 200, // bônus quando completa TODOS os hábitos do dia

  // Treinos
  WORKOUT_COMPLETED: 100,
  WORKOUT_SET_BONUS: 5, // por set (max +200 = +300 total)
  WORKOUT_SET_BONUS_MAX: 200,
  PERSONAL_RECORD: 150,

  // Tarefas
  TASK_COMPLETED: 30,
  TASK_URGENT_IMPORTANT: 50, // urgent + important

  // Finanças
  TRANSACTION_LOGGED: 5,
  BILL_PAID_ON_TIME: 20,
  FINANCE_GOAL_HIT: 500,

  // Streak
  STREAK_3_DAYS: 100,
  STREAK_7_DAYS: 300,
  STREAK_30_DAYS: 1000,
  STREAK_90_DAYS: 3000,

  // Outros
  ONBOARDING_COMPLETED: 100,
  FIRST_TIME_BONUS: 100, // primeira vez fazendo algo
} as const

// ════════ LEVELS ════════
export const LEVELS = [
  { level: 1, minXp: 0, maxXp: 500, title: 'Iniciante', emoji: '🌱' },
  { level: 2, minXp: 500, maxXp: 1500, title: 'Dedicado', emoji: '🥉' },
  { level: 3, minXp: 1500, maxXp: 3500, title: 'Consistente', emoji: '🥈' },
  { level: 4, minXp: 3500, maxXp: 7000, title: 'Atleta', emoji: '🥇' },
  { level: 5, minXp: 7000, maxXp: 12000, title: 'Guerreiro', emoji: '⚔️' },
  { level: 6, minXp: 12000, maxXp: 20000, title: 'Elite', emoji: '🛡️' },
  { level: 7, minXp: 20000, maxXp: 35000, title: 'Lendário', emoji: '🏛️' },
  { level: 8, minXp: 35000, maxXp: Infinity, title: 'FitQuest Master', emoji: '👑' },
] as const

export function calculateLevel(xp: number): number {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i]!.minXp) return LEVELS[i]!.level
  }
  return 1
}

export function getLevelInfo(level: number) {
  return LEVELS.find((l) => l.level === level) ?? LEVELS[0]!
}

export function getXpProgressToNextLevel(xp: number): {
  current: number
  needed: number
  percentage: number
} {
  const level = calculateLevel(xp)
  const info = getLevelInfo(level)
  if (info.maxXp === Infinity) {
    return { current: xp - info.minXp, needed: 0, percentage: 100 }
  }
  const current = xp - info.minXp
  const needed = info.maxXp - info.minXp
  const percentage = Math.min(100, Math.round((current / needed) * 100))
  return { current, needed, percentage }
}

// ════════ TIPOS ════════
export type XpSourceType =
  | 'habit'
  | 'workout'
  | 'task'
  | 'transaction'
  | 'goal'
  | 'achievement'
  | 'streak'
  | 'onboarding'
  | 'bonus'

export interface GrantXpResult {
  xpEarned: number
  xpTotalAfter: number
  newLevel: number
  leveledUp: boolean
  previousLevel: number
  achievementsUnlocked: string[]
}

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
    .select('id, xp_reward, name')
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
