/**
 * Sistema de Streak (sequência de dias ativos)
 *
 * REGRA: usuário tem streak ativo se logou pelo menos 1 hábito OU completou
 * 1 treino OU concluiu 1 tarefa no dia.
 *
 * O cron diário às 03:00 UTC (00:00 Brasília) verifica todos os usuários
 * e atualiza streak_current.
 */

import { createServiceClient } from '@/lib/supabase/server'
import { XP_REWARDS } from './xp'
import { grantXP, tryUnlockAchievement } from './xp-server'

/**
 * Verifica se o usuário teve atividade num dia específico
 */
export async function hadActivityOnDate(
  userId: string,
  date: Date
): Promise<boolean> {
  const supabase = createServiceClient()
  const dateStr = date.toISOString().split('T')[0]!

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
  ])

  return (
    (habits.count ?? 0) > 0 || (workouts.count ?? 0) > 0 || (tasks.count ?? 0) > 0
  )
}

/**
 * Atualiza o streak de um usuário específico.
 * Chamado pelo cron diário ou ao logar atividade.
 */
export async function updateUserStreak(userId: string): Promise<{
  previousStreak: number
  newStreak: number
  isLongest: boolean
}> {
  const supabase = createServiceClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('streak_current, streak_longest, last_activity_date')
    .eq('id', userId)
    .single()

  if (!profile) {
    return { previousStreak: 0, newStreak: 0, isLongest: false }
  }

  const previousStreak = profile.streak_current
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  // Verifica atividade de ontem
  const hadActivityYesterday = await hadActivityOnDate(userId, yesterday)
  const hadActivityToday = await hadActivityOnDate(userId, today)

  let newStreak = previousStreak

  if (hadActivityToday) {
    // Logou hoje
    if (hadActivityYesterday || previousStreak === 0) {
      // Manteve a sequência (ou está começando uma nova)
      newStreak = previousStreak + 1
    } else {
      // Pulou ontem mas logou hoje → reinicia em 1
      newStreak = 1
    }
  } else if (!hadActivityYesterday) {
    // Não logou ontem nem hoje → reseta
    newStreak = 0
  }
  // Se não logou hoje mas logou ontem, mantém (ainda tem o dia todo)

  const newLongest = Math.max(profile.streak_longest, newStreak)
  const isLongest = newStreak > profile.streak_longest

  await supabase
    .from('profiles')
    .update({
      streak_current: newStreak,
      streak_longest: newLongest,
    })
    .eq('id', userId)

  // Verifica milestones e concede XP/conquistas
  if (newStreak > previousStreak) {
    if (newStreak === 3) {
      await grantXP(userId, XP_REWARDS.STREAK_3_DAYS, 'Streak de 3 dias', 'streak')
      await tryUnlockAchievement(userId, 'streak_3')
    } else if (newStreak === 7) {
      await grantXP(userId, XP_REWARDS.STREAK_7_DAYS, 'Streak de 7 dias', 'streak')
      await tryUnlockAchievement(userId, 'streak_7')
    } else if (newStreak === 30) {
      await grantXP(userId, XP_REWARDS.STREAK_30_DAYS, 'Streak de 30 dias', 'streak')
      await tryUnlockAchievement(userId, 'streak_30')
    } else if (newStreak === 90) {
      await grantXP(userId, XP_REWARDS.STREAK_90_DAYS, 'Streak de 90 dias', 'streak')
      await tryUnlockAchievement(userId, 'streak_90')
    } else if (newStreak === 180) {
      await tryUnlockAchievement(userId, 'streak_180')
    } else if (newStreak === 365) {
      await tryUnlockAchievement(userId, 'streak_365')
    }
  }

  return { previousStreak, newStreak, isLongest }
}
