/**
 * Cron diário às 03:00 UTC (00:00 Brasília)
 * Atualiza streaks de todos os usuários ativos
 */

import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { updateUserStreak } from '@/lib/streak'

export const maxDuration = 60

export async function GET() {
  const supabase = createServiceClient()

  // Buscar todos os usuários ativos (logaram alguma coisa nos últimos 60 dias)
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 60)

  const { data: users } = await supabase
    .from('profiles')
    .select('id')
    .or(`last_activity_date.gte.${cutoff.toISOString().split('T')[0]},streak_current.gt.0`)

  if (!users) return NextResponse.json({ ok: true, processed: 0 })

  let updated = 0
  let reset = 0

  // Processa em lotes pra não exceder timeout
  for (const user of users) {
    try {
      const result = await updateUserStreak(user.id)
      if (result.newStreak > result.previousStreak) updated++
      if (result.newStreak === 0 && result.previousStreak > 0) reset++
    } catch (err) {
      console.error(`streak error for ${user.id}`, err)
    }
  }

  return NextResponse.json({ ok: true, processed: users.length, updated, reset })
}
