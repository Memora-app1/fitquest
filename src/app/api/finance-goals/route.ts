import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { grantXP, tryUnlockAchievement } from '@/lib/xp-server'
import { XP_REWARDS } from '@/lib/xp'

const createSchema = z.object({
  title: z.string().min(1).max(100).trim(),
  icon: z.string().default('🎯'),
  color: z.string().default('#00FF88'),
  target_amount: z.number().positive(),
  current_amount: z.number().min(0).default(0),
  deadline: z.string().nullable().optional(),
  monthly_target: z.number().positive().nullable().optional(),
})

const patchSchema = z.object({
  id: z.string().uuid(),
  current_amount: z.number().min(0).optional(),
  title: z.string().min(1).max(100).trim().optional(),
  target_amount: z.number().positive().optional(),
  deadline: z.string().nullable().optional(),
  monthly_target: z.number().positive().nullable().optional(),
  status: z.enum(['active', 'completed', 'cancelled', 'paused']).optional(),
})

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const parsed = createSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_input', details: parsed.error.flatten() }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('finance_goals')
    .insert({
      ...parsed.data,
      user_id: user.id,
      status: 'active',
    })
    .select()
    .single()

  if (error) {
    console.error('finance-goals POST error', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ goal: data })
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const parsed = patchSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_input', details: parsed.error.flatten() }, { status: 400 })
  }

  const { id, ...updates } = parsed.data

  // Busca estado atual para verificar se já estava completo e obter target_amount
  const { data: existing } = await supabase
    .from('finance_goals')
    .select('target_amount, status, title')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  const wasAlreadyCompleted = existing?.status === 'completed'

  // Se current_amount >= target_amount, marcar como completed automaticamente
  const extraUpdates: Record<string, unknown> = {}
  let willComplete = updates.status === 'completed'

  if (updates.current_amount !== undefined && updates.target_amount === undefined && existing) {
    if (updates.current_amount >= Number(existing.target_amount)) {
      extraUpdates.status = 'completed'
      extraUpdates.completed_at = new Date().toISOString()
      willComplete = true
    }
  }
  if (updates.status === 'completed' && !extraUpdates.completed_at) {
    extraUpdates.completed_at = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('finance_goals')
    .update({ ...updates, ...extraUpdates })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let xpEarned = 0
  let leveledUp = false
  let newLevel = 0

  if (willComplete && !wasAlreadyCompleted) {
    const xpResult = await grantXP(
      user.id,
      XP_REWARDS.FINANCE_GOAL_HIT,
      `Meta financeira atingida: ${existing?.title ?? 'Meta'}`,
      'goal',
      data.id
    )
    xpEarned = xpResult.xpEarned
    await tryUnlockAchievement(user.id, 'finance_goal_completed')
    leveledUp = xpResult.leveledUp
    newLevel = xpResult.newLevel
  }

  return NextResponse.json({ goal: data, xpEarned, leveledUp, newLevel })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'missing_id' }, { status: 400 })

  const { error } = await supabase
    .from('finance_goals')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
