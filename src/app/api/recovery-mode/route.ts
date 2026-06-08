/**
 * POST /api/recovery-mode
 * Ativa ou desativa o Modo Silêncio (Recovery Week).
 *
 * Regra: 1 vez por mês. Enquanto ativo, o streak NÃO reseta.
 * Ao sair do Recovery Mode, concede +200 XP de bônus por autocuidado.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import { grantXP } from '@/lib/xp-server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({})) as { action?: string }
  const action = body.action === 'deactivate' ? 'deactivate' : 'activate'

  const { data: profile } = await supabase
    .from('profiles')
    .select('recovery_week_active, recovery_week_used_month, streak_current')
    .eq('id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'profile_not_found' }, { status: 404 })

  const currentMonth          = new Date().getMonth() + 1
  const isActive              = profile.recovery_week_active as boolean
  const usedMonth             = profile.recovery_week_used_month as number | null
  const serviceSupabase       = createServiceClient()

  if (action === 'activate') {
    if (isActive) {
      return NextResponse.json({ error: 'already_active', message: 'Modo Silêncio já está ativo.' }, { status: 400 })
    }
    if (usedMonth === currentMonth) {
      return NextResponse.json({ error: 'already_used_this_month', message: 'Você já usou o Modo Silêncio este mês. Disponível novamente no próximo mês.' }, { status: 400 })
    }

    await serviceSupabase
      .from('profiles')
      .update({
        recovery_week_active:     true,
        recovery_week_used_month: currentMonth,
      })
      .eq('id', user.id)

    await serviceSupabase.from('notifications').insert({
      user_id:       user.id,
      type:          'streak_alert',
      title:         '🌙 Modo Silêncio ativado',
      body:          'Seu streak está protegido por 7 dias. Cuide de si — você merece.',
      action_url:    '/dashboard',
      scheduled_for: new Date().toISOString(),
      sent_at:       new Date().toISOString(),
    })

    return NextResponse.json({
      ok:      true,
      action:  'activated',
      message: '🌙 Modo Silêncio ativado. Seu streak está protegido por 7 dias.',
    })
  } else {
    if (!isActive) {
      return NextResponse.json({ error: 'not_active', message: 'Modo Silêncio não está ativo.' }, { status: 400 })
    }

    await serviceSupabase
      .from('profiles')
      .update({ recovery_week_active: false })
      .eq('id', user.id)

    // Bônus por autocuidado ao voltar
    const xpResult = await grantXP(user.id, 200, 'Retorno do Modo Silêncio 🌟', 'bonus', `recovery_${new Date().toISOString().split('T')[0]}`)

    await serviceSupabase.from('notifications').insert({
      user_id:       user.id,
      type:          'streak_alert',
      title:         '🌟 Bem-vindo de volta!',
      body:          `Modo Silêncio encerrado. +200 XP de bônus por cuidar de você.`,
      action_url:    '/dashboard',
      scheduled_for: new Date().toISOString(),
      sent_at:       new Date().toISOString(),
    })

    return NextResponse.json({
      ok:        true,
      action:    'deactivated',
      xpEarned:  xpResult.xpEarned,
      message:   '🌟 Bem-vindo de volta! +200 XP de bônus.',
    })
  }
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('recovery_week_active, recovery_week_used_month')
    .eq('id', user.id)
    .single()

  const currentMonth = new Date().getMonth() + 1
  const usedMonth    = profile?.recovery_week_used_month as number | null

  return NextResponse.json({
    active:               (profile?.recovery_week_active as boolean) ?? false,
    usedThisMonth:        usedMonth === currentMonth,
    availableNextMonth:   usedMonth === currentMonth ? new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString().split('T')[0] : null,
  })
}
