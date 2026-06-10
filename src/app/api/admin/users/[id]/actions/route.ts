import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getAdminSession, hasMinRole, auditLog } from '@/lib/admin'
import { z } from 'zod'

const ActionSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('grant_xp'),
    amount: z.number().int().min(-100000).max(100000),
    reason: z.string().min(1).max(200),
  }),
  z.object({
    action: z.literal('suspend'),
    reason: z.string().min(1).max(500),
    days:   z.number().int().positive().nullable(),
  }),
  z.object({ action: z.literal('unsuspend') }),
  z.object({ action: z.literal('reset_streak') }),
])

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const session = await getAdminSession(user)

  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  const { id: userId } = await params
  const body = await request.json()
  const parsed = ActionSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Payload inválido' }, { status: 400 })
  }

  const db = createServiceClient()
  const cmd = parsed.data

  // ── grant_xp ──────────────────────────────────────────────────────────────
  if (cmd.action === 'grant_xp') {
    if (!hasMinRole(session, 'support')) {
      return NextResponse.json({ error: 'Permissão insuficiente' }, { status: 403 })
    }

    const { data: profile, error: pErr } = await db
      .from('profiles')
      .select('xp_total, level')
      .eq('id', userId)
      .single()

    if (pErr || !profile) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    const newXp    = Math.max(0, (profile.xp_total ?? 0) + cmd.amount)
    const newLevel = calculateLevel(newXp)

    await db.from('xp_transactions').insert({
      user_id:         userId,
      amount:          cmd.amount,
      reason:          `[Admin] ${cmd.reason}`,
      source_type:     cmd.amount > 0 ? 'admin_grant' : 'admin_deduct',
      xp_total_after:  newXp,
      level_after:     newLevel,
    })

    await db.from('profiles').update({ xp_total: newXp, level: newLevel }).eq('id', userId)

    await auditLog({
      adminId:    session.userId,
      adminRole:  session.role,
      action:     'user.xp_grant',
      targetType: 'user',
      targetId:   userId,
      payload:    { amount: cmd.amount, reason: cmd.reason, newXp },
    })

    return NextResponse.json({ message: `XP ajustado: ${cmd.amount > 0 ? '+' : ''}${cmd.amount} XP` })
  }

  // ── suspend ────────────────────────────────────────────────────────────────
  if (cmd.action === 'suspend') {
    if (!hasMinRole(session, 'moderator')) {
      return NextResponse.json({ error: 'Permissão insuficiente' }, { status: 403 })
    }

    const endsAt = cmd.days
      ? new Date(Date.now() + cmd.days * 86400000).toISOString()
      : null

    await db.from('user_suspensions').insert({
      user_id:   userId,
      admin_id:  session.userId,
      reason:    cmd.reason,
      type:      cmd.days ? 'temporary' : 'permanent',
      starts_at: new Date().toISOString(),
      ends_at:   endsAt,
    })

    await db.from('profiles').update({
      is_suspended:      true,
      suspended_until:   endsAt,
      suspension_reason: cmd.reason,
    }).eq('id', userId)

    await auditLog({
      adminId:    session.userId,
      adminRole:  session.role,
      action:     'user.suspend',
      targetType: 'user',
      targetId:   userId,
      payload:    { reason: cmd.reason, days: cmd.days },
    })

    return NextResponse.json({ message: 'Usuário suspenso com sucesso.' })
  }

  // ── unsuspend ──────────────────────────────────────────────────────────────
  if (cmd.action === 'unsuspend') {
    if (!hasMinRole(session, 'moderator')) {
      return NextResponse.json({ error: 'Permissão insuficiente' }, { status: 403 })
    }

    await db.from('user_suspensions')
      .update({ lifted_at: new Date().toISOString(), lifted_by: session.userId })
      .eq('user_id', userId)
      .is('lifted_at', null)

    await db.from('profiles').update({
      is_suspended:      false,
      suspended_until:   null,
      suspension_reason: null,
    }).eq('id', userId)

    await auditLog({
      adminId:    session.userId,
      adminRole:  session.role,
      action:     'user.unsuspend',
      targetType: 'user',
      targetId:   userId,
    })

    return NextResponse.json({ message: 'Suspensão levantada.' })
  }

  // ── reset_streak ───────────────────────────────────────────────────────────
  if (cmd.action === 'reset_streak') {
    if (!hasMinRole(session, 'admin')) {
      return NextResponse.json({ error: 'Permissão insuficiente' }, { status: 403 })
    }

    await db.from('profiles').update({ streak_current: 0 }).eq('id', userId)

    await auditLog({
      adminId:    session.userId,
      adminRole:  session.role,
      action:     'user.reset_streak',
      targetType: 'user',
      targetId:   userId,
    })

    return NextResponse.json({ message: 'Streak resetado para 0.' })
  }

  return NextResponse.json({ error: 'Ação desconhecida' }, { status: 400 })
}

function calculateLevel(xp: number): number {
  if (xp >= 35000) return 8
  if (xp >= 20000) return 7
  if (xp >= 12000) return 6
  if (xp >= 7000)  return 5
  if (xp >= 3500)  return 4
  if (xp >= 1500)  return 3
  if (xp >= 500)   return 2
  return 1
}
