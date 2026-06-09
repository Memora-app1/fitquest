import { isCronAuthorized, cronUnauthorized } from '@/lib/cron-auth'
/**
 * Cron toda segunda-feira às 03:30 UTC (00:30 Brasília)
 * Reseta league_xp_this_week de todos os profiles e guild weekly_xp.
 * Usa a RPC reset_weekly_league_xp() definida na migration 009.
 */

import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export const maxDuration = 60

export async function GET() {
  if (!await isCronAuthorized()) return cronUnauthorized()

  const supabase = createServiceClient()

  const { error } = await supabase.rpc('reset_weekly_league_xp')
  if (error) {
    console.error('league-reset rpc error', error)
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, message: 'Weekly league XP reset.' })
}
