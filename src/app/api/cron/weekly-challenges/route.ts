import { isCronAuthorized, cronUnauthorized } from '@/lib/cron-auth'
/**
 * Cron executado às 12:00 e 20:00 UTC diariamente.
 * Concede XP de desafios semanais completados — uma vez por desafio por semana.
 *
 * Idempotência: usa source_id = 'wc_{year}w{week}_{challengeId}' em xp_transactions.
 * Se o registro já existe, não concede novamente.
 */

import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { grantXP } from '@/lib/xp-server'
import { sendPushNotification } from '@/lib/webpush'

export const maxDuration = 120

import { WATER_GOAL_ML } from '@/lib/constants'
import { getISOWeek, getWeekStartString as getWeekStart, getWeekEndString as getWeekEnd } from '@/lib/dates'

interface ChallengeResult {
  id: string
  xpReward: number
  completed: boolean
  label: string
}

async function computeChallengesForUser(
  supabase: ReturnType<typeof createServiceClient>,
  userId: string,
  now: Date
): Promise<ChallengeResult[]> {
  const weekStart = getWeekStart(now)
  const weekEnd = getWeekEnd(now)
  const weekNum = getISOWeek(now)
  const seed = weekNum + now.getFullYear() * 100

  const [
    habitLogsRes, habitsRes, workoutsRes, tasksDoneRes, tasksAllRes,
    xpRes, transactionsRes, profileRes, waterLogsRes,
  ] = await Promise.all([
    supabase.from('habit_logs').select('habit_id').eq('user_id', userId).gte('logged_date', weekStart).lte('logged_date', weekEnd),
    supabase.from('habits').select('id').eq('user_id', userId).eq('is_active', true),
    supabase.from('workouts').select('id').eq('user_id', userId).gte('created_at', weekStart + 'T00:00:00').lte('created_at', weekEnd + 'T23:59:59'),
    supabase.from('tasks').select('id').eq('user_id', userId).eq('status', 'done').gte('updated_at', weekStart + 'T00:00:00').lte('updated_at', weekEnd + 'T23:59:59'),
    supabase.from('tasks').select('id').eq('user_id', userId).neq('status', 'archived'),
    supabase.from('xp_transactions').select('amount').eq('user_id', userId).gte('created_at', weekStart + 'T00:00:00').lte('created_at', weekEnd + 'T23:59:59'),
    supabase.from('transactions').select('id').eq('user_id', userId).gte('transaction_date', weekStart).lte('transaction_date', weekEnd),
    supabase.from('profiles').select('streak_current, level').eq('id', userId).single(),
    supabase.from('water_logs').select('date, amount_ml').eq('user_id', userId).gte('date', weekStart).lte('date', weekEnd),
  ])

  const habitsCount = habitsRes.data?.length ?? 0
  const habitLogsCount = habitLogsRes.data?.length ?? 0
  const workoutsCount = workoutsRes.data?.length ?? 0
  const tasksDoneCount = tasksDoneRes.data?.length ?? 0
  const totalTasksCount = tasksAllRes.data?.length ?? 0
  const weekXp = (xpRes.data ?? []).reduce((s, t) => s + (t.amount ?? 0), 0)
  const transactionsCount = transactionsRes.data?.length ?? 0
  const streakCurrent = profileRes.data?.streak_current ?? 0
  const level = profileRes.data?.level ?? 1

  const waterByDay: Record<string, number> = {}
  for (const row of waterLogsRes.data ?? []) {
    const d = row.date as string
    waterByDay[d] = (waterByDay[d] ?? 0) + (row.amount_ml as number ?? 0)
  }
  const waterGoalDays = Object.values(waterByDay).filter(v => v >= WATER_GOAL_ML).length

  const levelMult = 1 + (level - 1) * 0.2
  const challenges: ChallengeResult[] = []

  if (habitsCount > 0) {
    const target = Math.max(3, Math.round(habitsCount * 4 * levelMult))
    challenges.push({
      id: 'habits',
      xpReward: Math.round(150 * levelMult),
      completed: habitLogsCount >= target,
      label: 'Mestre dos Hábitos',
    })
  }

  {
    const baseTarget = level <= 2 ? 1 : level <= 4 ? 2 : 3
    const target = Math.max(1, Math.round(baseTarget * levelMult))
    challenges.push({
      id: 'workouts',
      xpReward: Math.round(200 * levelMult),
      completed: workoutsCount >= target,
      label: 'Guerreiro Fitness',
    })
  }

  if (totalTasksCount > 0) {
    const baseTarget = level <= 2 ? 3 : level <= 4 ? 5 : 7
    const target = Math.round(baseTarget * levelMult)
    challenges.push({
      id: 'tasks',
      xpReward: Math.round(120 * levelMult),
      completed: tasksDoneCount >= target,
      label: 'Executor Elite',
    })
  }

  {
    const baseXpTarget = level <= 2 ? 200 : level <= 4 ? 500 : level <= 6 ? 1000 : 2000
    const xpVariance = Math.round(baseXpTarget * 0.2)
    const target = Math.round((baseXpTarget + ((seed * 3571) % xpVariance)) * levelMult)
    challenges.push({
      id: 'xp',
      xpReward: Math.round(250 * levelMult),
      completed: weekXp >= target,
      label: 'Caçador de XP',
    })
  }

  {
    const streakTarget = level <= 2 ? 3 : level <= 4 ? 5 : 7
    challenges.push({
      id: 'streak',
      xpReward: Math.round(300 * levelMult),
      completed: streakCurrent >= streakTarget,
      label: 'Sequência Implacável',
    })
  }

  {
    challenges.push({
      id: 'health',
      xpReward: Math.round(130 * levelMult),
      completed: waterGoalDays >= 5,
      label: 'Hidratação Plena',
    })
  }

  if (seed % 2 === 0 || transactionsCount > 0) {
    const target = level <= 2 ? 3 : level <= 4 ? 5 : 8
    challenges.push({
      id: 'finance',
      xpReward: Math.round(100 * levelMult),
      completed: transactionsCount >= target,
      label: 'Controle Financeiro',
    })
  }

  // Replica a lógica de ordenação e corte do componente (top 4 por prioridade)
  return challenges
    .sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1
      return b.xpReward - a.xpReward
    })
    .slice(0, 4)
}

export async function GET() {
  if (!await isCronAuthorized()) return cronUnauthorized()

  const supabase = createServiceClient()
  const now = new Date()
  const weekNum = getISOWeek(now)
  const year = now.getFullYear()

  const { data: users } = await supabase
    .from('profiles')
    .select('id, name')
    .in('subscription_status', ['trial', 'active', 'lifetime'])

  if (!users || users.length === 0) {
    return NextResponse.json({ ok: true, processed: 0, granted: 0 })
  }

  let granted = 0
  let errors = 0

  for (const user of users) {
    try {
      const challenges = await computeChallengesForUser(supabase, user.id, now)
      const completedChallenges = challenges.filter(c => c.completed)

      for (const challenge of completedChallenges) {
        const sourceId = `wc_${year}w${weekNum}_${challenge.id}`

        // Verifica idempotência — já concedemos XP para este desafio esta semana?
        const { count } = await supabase
          .from('xp_transactions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('source_type', 'bonus')
          .eq('source_id', sourceId)

        if ((count ?? 0) > 0) continue // já concedido

        await grantXP(
          user.id,
          challenge.xpReward,
          `Desafio semanal concluído: ${challenge.label} 🏆`,
          'bonus',
          sourceId
        )

        // Push notification para o primeiro desafio completo do dia
        if (granted === 0) {
          const { data: subs } = await supabase
            .from('push_subscriptions')
            .select('id, endpoint, keys_p256dh, keys_auth')
            .eq('user_id', user.id)

          if (subs && subs.length > 0) {
            for (const sub of subs) {
              const result = await sendPushNotification(
                sub.endpoint, sub.keys_p256dh, sub.keys_auth,
                {
                  title: `🏆 Desafio concluído: ${challenge.label}`,
                  body: `+${challenge.xpReward} XP adicionados ao seu perfil!`,
                  url: '/dashboard',
                }
              )
              if (result.gone) await supabase.from('push_subscriptions').delete().eq('id', sub.id)
            }
          }
        }

        granted++
      }
    } catch (err) {
      console.error(`weekly-challenges cron error for ${user.id}:`, err)
      errors++
    }
  }

  return NextResponse.json({
    ok: true,
    processed: users.length,
    granted,
    errors,
    week: `${year}w${weekNum}`,
  })
}
