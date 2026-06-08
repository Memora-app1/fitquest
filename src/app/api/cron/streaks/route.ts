import { isCronAuthorized, cronUnauthorized } from '@/lib/cron-auth'
/**
 * Cron diário às 03:00 UTC (00:00 Brasília)
 * Atualiza streaks de todos os usuários ativos via batch_process_streaks().
 *
 * Antes: loop sequencial com ~8 queries por usuário → trava com 2k usuários.
 * Agora: 1 query SQL para todos + processamento de milestones só para quem cruzou.
 */

import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { grantXP, tryUnlockAchievement, grantStreakFreeze } from '@/lib/xp-server'
import { XP_REWARDS } from '@/lib/xp'

export const maxDuration = 60

type StreakMilestone = {
  xp?:    number
  reason?: string
  slug:   string
  freezes: number
}

const STREAK_MILESTONES: Record<number, StreakMilestone> = {
  3:   { xp: XP_REWARDS.STREAK_3_DAYS,  reason: 'Streak de 3 dias 🔥',  slug: 'streak_3',   freezes: 0 },
  7:   { xp: XP_REWARDS.STREAK_7_DAYS,  reason: 'Streak de 7 dias ⚡',  slug: 'streak_7',   freezes: 1 },
  30:  { xp: XP_REWARDS.STREAK_30_DAYS, reason: 'Streak de 30 dias 🏆', slug: 'streak_30',  freezes: 2 },
  90:  { xp: XP_REWARDS.STREAK_90_DAYS, reason: 'Streak de 90 dias 💎', slug: 'streak_90',  freezes: 3 },
  180: { slug: 'streak_180', freezes: 3 },
  365: { slug: 'streak_365', freezes: 5 },
}

async function processStreakMilestone(userId: string, milestone: number): Promise<void> {
  const config = STREAK_MILESTONES[milestone]
  if (!config) return

  if (config.xp && config.reason) {
    await grantXP(userId, config.xp, config.reason, 'streak')
  }
  await tryUnlockAchievement(userId, config.slug)
  if (config.freezes > 0) {
    await grantStreakFreeze(userId, config.freezes)
  }
}

export async function GET() {
  if (!await isCronAuthorized()) return cronUnauthorized()

  const supabase = createServiceClient()

  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 60)

  // 1 query SQL para todos os usuários ativos em vez de N × 8
  const { data: changed, error } = await supabase.rpc('batch_process_streaks', {
    p_cutoff_date: cutoff.toISOString().split('T')[0],
  })

  if (error) {
    console.error('batch_process_streaks error', error)
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  const results = (changed ?? []) as { user_id: string; old_streak: number; new_streak: number; used_freeze: boolean }[]

  let updated = 0
  let reset   = 0

  // Processa milestones apenas para o subconjunto pequeno que cruzou um marco
  const milestoneKeys = Object.keys(STREAK_MILESTONES).map(Number)
  const milestoneUsers = results.filter(
    u => u.new_streak > u.old_streak && milestoneKeys.includes(u.new_streak)
  )

  for (const user of results) {
    if (user.new_streak > user.old_streak) updated++
    if (user.new_streak === 0 && user.old_streak > 0) reset++
  }

  for (const user of milestoneUsers) {
    try {
      await processStreakMilestone(user.user_id, user.new_streak)
    } catch (err) {
      console.error(`streak milestone error for ${user.user_id}`, err)
    }
  }

  return NextResponse.json({
    ok:        true,
    processed: results.length,
    updated,
    reset,
    milestones: milestoneUsers.length,
  })
}
