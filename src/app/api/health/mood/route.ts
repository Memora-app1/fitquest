import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { grantXP } from '@/lib/xp-server'
import { todayString } from '@/lib/utils'

const MOOD_XP = 10

const upsertSchema = z.object({
  mood:   z.number().int().min(1).max(5),
  energy: z.number().int().min(1).max(5),
  stress: z.number().int().min(1).max(5),
  note:   z.string().max(300).optional(),
})

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const days = Number(req.nextUrl.searchParams.get('days') ?? '7')
  const since = new Date(Date.now() - days * 86400000).toISOString().split('T')[0]!

  const { data, error } = await supabase
    .from('mood_logs')
    .select('id, date, mood, energy, stress, note, xp_earned')
    .eq('user_id', user.id)
    .gte('date', since)
    .order('date', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ logs: data ?? [] })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const parsed = upsertSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_input', issues: parsed.error.issues }, { status: 400 })
  }

  const today = todayString()

  // Verifica se já existe registro hoje (para saber se é first-time e concede XP)
  const { data: existing } = await supabase
    .from('mood_logs')
    .select('id, xp_earned')
    .eq('user_id', user.id)
    .eq('date', today)
    .maybeSingle()

  const isFirstToday = !existing

  const { data, error } = await supabase
    .from('mood_logs')
    .upsert(
      {
        user_id: user.id,
        date: today,
        ...parsed.data,
        xp_earned: isFirstToday ? MOOD_XP : (existing?.xp_earned ?? 0),
      },
      { onConflict: 'user_id,date' }
    )
    .select('id, date, mood, energy, stress, note, xp_earned')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let xpEarned = 0
  let leveledUp = false
  let newLevel = 0

  if (isFirstToday) {
    const xpResult = await grantXP(user.id, MOOD_XP, 'Check-in de saúde diário', 'health', data.id)
    xpEarned = xpResult.xpEarned
    leveledUp = xpResult.leveledUp
    newLevel = xpResult.newLevel
  }

  return NextResponse.json({ log: data, xpEarned, leveledUp, newLevel })
}
