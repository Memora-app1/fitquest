import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { XP_REWARDS } from '@/lib/xp'
import { grantXP, tryUnlockAchievement, createDailyLoot } from '@/lib/xp-server'
import { updateUserStreak } from '@/lib/streak'
import { todayString } from '@/lib/utils'

export const maxDuration = 30

const bodySchema = z.object({
  habitId: z.string().uuid(),
  value: z.number().optional().default(1),
  note: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_input', issues: parsed.error.issues }, { status: 400 })
  }

  const { habitId, value, note } = parsed.data
  const today = todayString()

  // Buscar hábito (e validar dono)
  const { data: habit, error: habitError } = await supabase
    .from('habits')
    .select('id, name, xp_per_completion, user_id')
    .eq('id', habitId)
    .eq('user_id', user.id)
    .single()

  if (habitError || !habit) {
    return NextResponse.json({ error: 'habit_not_found' }, { status: 404 })
  }

  // Inserir log (unique constraint vai falhar se já existe hoje)
  const { error: logError } = await supabase.from('habit_logs').insert({
    habit_id: habitId,
    user_id: user.id,
    logged_date: today,
    value,
    note: note ?? null,
    xp_earned: habit.xp_per_completion,
  })

  if (logError) {
    // 23505 = unique violation = já logado hoje
    if (logError.code === '23505') {
      return NextResponse.json({ error: 'already_logged_today' }, { status: 409 })
    }
    return NextResponse.json({ error: 'db_error', detail: logError.message }, { status: 500 })
  }

  // Conceder XP
  const xpResult = await grantXP(
    user.id,
    habit.xp_per_completion,
    `Hábito: ${habit.name}`,
    'habit',
    habitId
  )

  // Conquistas first-time + count milestones
  const { count } = await supabase
    .from('habit_logs')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
  if (count === 1)    await tryUnlockAchievement(user.id, 'first_habit')
  if (count === 100)  await tryUnlockAchievement(user.id, 'habits_100')
  if (count === 500)  await tryUnlockAchievement(user.id, 'habits_500')
  if (count === 1000) await tryUnlockAchievement(user.id, 'habits_1000')

  // Verificar "Dia Perfeito" — todos os hábitos ativos foram logados hoje?
  const [habitsCount, logsToday] = await Promise.all([
    supabase
      .from('habits')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_active', true),
    supabase
      .from('habit_logs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('logged_date', today),
  ])

  let perfectDayBonus = 0
  if (
    habitsCount.count &&
    logsToday.count &&
    habitsCount.count > 0 &&
    logsToday.count === habitsCount.count
  ) {
    // RPC atômico: verifica + concede XP + incrementa perfect_days em uma transação
    // Previne race condition quando múltiplos hábitos completam simultaneamente
    const { data: pdResult } = await supabase.rpc('maybe_grant_perfect_day', {
      p_user_id: user.id,
    })
    const pd = pdResult as { granted: boolean; perfect_days: number } | null

    if (pd?.granted) {
      perfectDayBonus = XP_REWARDS.PERFECT_DAY
      await tryUnlockAchievement(user.id, 'perfect_day')
      if (pd.perfect_days % 7 === 0) {
        await tryUnlockAchievement(user.id, 'perfect_week')
      }
      // Loot box do Dia Perfeito (idempotente via UNIQUE constraint)
      await createDailyLoot(user.id, today, 'perfect_day')
    }
  }

  // Atualizar streak
  await updateUserStreak(user.id)

  return NextResponse.json({
    success:              true,
    xpEarned:             xpResult.xpEarned + perfectDayBonus,
    leveledUp:            xpResult.leveledUp,
    newLevel:             xpResult.newLevel,
    perfectDay:           perfectDayBonus > 0,
    achievementsUnlocked: xpResult.achievementsUnlocked,
  })
}
