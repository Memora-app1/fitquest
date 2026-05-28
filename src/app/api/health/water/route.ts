import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { todayString } from '@/lib/utils'
import { grantXP } from '@/lib/xp-server'

export const WATER_GOAL_ML = 2000

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

  // Concede XP apenas quando cruza o threshold da meta (não a cada adição acima do limite)
  if (totalBefore < WATER_GOAL_ML && totalAfter >= WATER_GOAL_ML) {
    const result = await grantXP(user.id, 30, 'Meta de hidratação atingida! 💧', 'health', data.id)
    xpEarned = result.xpEarned
  }

  return NextResponse.json({
    id: data.id,
    amount_ml: data.amount_ml,
    created_at: data.created_at,
    totalToday: totalAfter,
    xpEarned,
    goalReached: totalAfter >= WATER_GOAL_ML,
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
