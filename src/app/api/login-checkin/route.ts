/**
 * POST /api/login-checkin
 * Registra o check-in diário de login do usuário.
 * Idempotente: retorna estado atual se já fez check-in hoje.
 *
 * Ciclo de 7 dias:
 *   Dia 1: +20 XP   Dia 2: +30 XP   Dia 3: +50 XP   Dia 4: +75 XP
 *   Dia 5: +100 XP  Dia 6: +150 XP  Dia 7: +300 XP + Loot Box
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import { grantXP, createDailyLoot } from '@/lib/xp-server'
import { getLoginReward } from '@/lib/xp'

export const maxDuration = 30

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const today = new Date().toISOString().split('T')[0]!
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]!

  const { data: profile } = await supabase
    .from('profiles')
    .select('login_streak, last_login_date')
    .eq('id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'profile_not_found' }, { status: 404 })

  const lastLoginDate = profile.last_login_date as string | null
  const currentLoginStreak = (profile.login_streak as number) ?? 0

  // Já fez check-in hoje
  if (lastLoginDate === today) {
    return NextResponse.json({
      alreadyDone: true,
      loginStreak: currentLoginStreak,
      dayInCycle:  ((currentLoginStreak - 1) % 7) + 1,
    })
  }

  // Calcula novo streak
  let newLoginStreak: number
  if (lastLoginDate === yesterday) {
    newLoginStreak = currentLoginStreak + 1
  } else {
    newLoginStreak = 1
  }

  const dayInCycle = ((newLoginStreak - 1) % 7) + 1
  const xpReward   = getLoginReward(newLoginStreak)
  const isDay7     = dayInCycle === 7

  const serviceSupabase = createServiceClient()

  // Atualiza streak de login e data
  await serviceSupabase
    .from('profiles')
    .update({
      login_streak:    newLoginStreak,
      last_login_date: today,
    })
    .eq('id', user.id)

  // Concede XP
  const xpResult = await grantXP(
    user.id,
    xpReward,
    `Login diário — Dia ${dayInCycle}`,
    'login',
    `login_${today}`
  )

  // Dia 7 → gera loot box (idempotente)
  let lootCreated = false
  if (isDay7) {
    lootCreated = await createDailyLoot(user.id, today, 'login_streak')
  }

  // Notificação in-app de check-in
  await serviceSupabase.from('notifications').insert({
    user_id:       user.id,
    type:          'daily_login_reward',
    title:         isDay7
      ? '🎁 Dia 7 — Loot Box desbloqueada!'
      : `⚡ Login diário — Dia ${dayInCycle}`,
    body:          isDay7
      ? `+${xpReward} XP + caixa surpresa! Abra sua recompensa.`
      : `+${xpReward} XP de bônus de presença. Dia ${dayInCycle}/7.`,
    action_url:    '/dashboard',
    scheduled_for: new Date().toISOString(),
    sent_at:       new Date().toISOString(),
  })

  return NextResponse.json({
    alreadyDone:   false,
    loginStreak:   newLoginStreak,
    dayInCycle,
    xpEarned:      xpResult.xpEarned,
    leveledUp:     xpResult.leveledUp,
    newLevel:      xpResult.newLevel,
    lootBox:       lootCreated,
    isDay7,
  })
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('login_streak, last_login_date')
    .eq('id', user.id)
    .single()

  const today          = new Date().toISOString().split('T')[0]!
  const loginStreak    = (profile?.login_streak as number) ?? 0
  const lastLoginDate  = profile?.last_login_date as string | null
  const checkedInToday = lastLoginDate === today
  const dayInCycle     = loginStreak > 0 ? ((loginStreak - 1) % 7) + 1 : 0

  return NextResponse.json({
    loginStreak,
    lastLoginDate,
    checkedInToday,
    dayInCycle,
    nextXpReward: getLoginReward(loginStreak + (checkedInToday ? 0 : 1)),
  })
}
