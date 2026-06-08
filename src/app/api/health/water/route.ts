import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { todayString } from '@/lib/utils'
import { grantXP, tryUnlockAchievement } from '@/lib/xp-server'
import { WATER_GOAL_ML } from '@/lib/constants'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = await req.json() as { amount_ml?: unknown }
  const amount = Number(body.amount_ml)
  if (!amount || !Number.isInteger(amount) || amount <= 0 || amount > 5000) {
    return NextResponse.json({ error: 'invalid_amount' }, { status: 400 })
  }

  const today = todayString()

  // Buscar total antes de inserir para verificar se meta foi cruzada
  const { data: beforeLogs } = await supabase
    .from('water_logs')
    .select('amount_ml')
    .eq('user_id', user.id)
    .eq('date', today)

  const totalBefore = (beforeLogs ?? []).reduce((s, l) => s + (l.amount_ml ?? 0), 0)

  const { data, error } = await supabase
    .from('water_logs')
    .insert({ user_id: user.id, date: today, amount_ml: amount })
    .select('id, amount_ml, created_at')
    .single()

  if (error || !data) {
    console.error('water POST error', error)
    return NextResponse.json({ error: 'insert_failed' }, { status: 500 })
  }

  const totalAfter = totalBefore + amount
  let xpEarned = 0
  let leveledUp = false
  let newLevel = 0
  const achievementsUnlocked: string[] = []

  // Concede XP apenas quando cruza o threshold da meta (não a cada adição acima do limite)
  if (totalBefore < WATER_GOAL_ML && totalAfter >= WATER_GOAL_ML) {
    const result = await grantXP(user.id, 30, 'Meta de hidratação atingida! 💧', 'health', data.id)
    xpEarned = result.xpEarned
    leveledUp = result.leveledUp
    newLevel = result.newLevel

    if (await tryUnlockAchievement(user.id, 'first_water_goal')) achievementsUnlocked.push('first_water_goal')

    // Check water_goal_7: 7+ consecutive days hitting the goal
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
    const sinceStr = sevenDaysAgo.toISOString().slice(0, 10)
    const { data: weekLogs } = await supabase
      .from('water_logs')
      .select('date, amount_ml')
      .eq('user_id', user.id)
      .gte('date', sinceStr)
    const waterByDay: Record<string, number> = {}
    for (const l of weekLogs ?? []) {
      const d = l.date as string
      waterByDay[d] = (waterByDay[d] ?? 0) + (l.amount_ml as number ?? 0)
    }
    const daysAtGoal = Object.values(waterByDay).filter(v => v >= WATER_GOAL_ML).length
    if (daysAtGoal >= 7 && await tryUnlockAchievement(user.id, 'water_goal_7')) {
      achievementsUnlocked.push('water_goal_7')
    }
  }

  return NextResponse.json({
    id: data.id,
    amount_ml: data.amount_ml,
    created_at: data.created_at,
    totalToday: totalAfter,
    xpEarned,
    leveledUp,
    newLevel,
    goalReached: totalAfter >= WATER_GOAL_ML,
    achievementsUnlocked,
  })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'missing_id' }, { status: 400 })

  const { error } = await supabase
    .from('water_logs')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: 'delete_failed' }, { status: 500 })
  return NextResponse.json({ success: true })
}
