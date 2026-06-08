/**
 * API de Referral
 * GET  /api/referral         — retorna o código do usuário autenticado
 * POST /api/referral         — registra uso de código de referral (ao criar conta)
 *
 * Requer migration 006-referral-system.sql executada no banco.
 * Ambos os usuários (referido + referenciador) recebem +200 XP.
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { grantXP } from '@/lib/xp-server'

const XP_REFERRAL = 200

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('referral_code, referral_count, name')
    .eq('id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'profile_not_found' }, { status: 404 })

  return NextResponse.json({
    code: profile.referral_code ?? null,
    count: profile.referral_count ?? 0,
    xpPerReferral: XP_REFERRAL,
  })
}

const bodySchema = z.object({
  code: z.string().min(4).max(12).toUpperCase(),
})

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const parsed = bodySchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_code' }, { status: 400 })
  }

  const { code } = parsed.data

  // Verifica se o usuário já foi referenciado
  const { data: myProfile } = await supabase
    .from('profiles')
    .select('referred_by, referral_code')
    .eq('id', user.id)
    .single()

  if (!myProfile) return NextResponse.json({ error: 'profile_not_found' }, { status: 404 })

  if (myProfile.referred_by) {
    return NextResponse.json({ error: 'already_referred' }, { status: 409 })
  }

  // Não pode usar o próprio código
  if (myProfile.referral_code === code) {
    return NextResponse.json({ error: 'own_code' }, { status: 400 })
  }

  // Busca o referenciador pelo código
  const { data: referrer } = await supabase
    .from('profiles')
    .select('id')
    .eq('referral_code', code)
    .single()

  if (!referrer) {
    return NextResponse.json({ error: 'code_not_found' }, { status: 404 })
  }

  // Marca o usuário como referenciado
  await supabase
    .from('profiles')
    .update({ referred_by: code })
    .eq('id', user.id)

  // Incremento atômico — evita read-modify-write com registros simultâneos
  await supabase.rpc('increment_referral_count', { p_user_id: referrer.id })

  // Concede XP para ambos em paralelo
  await Promise.all([
    grantXP(user.id, XP_REFERRAL, `Bônus de indicação — código ${code} 🤝`, 'bonus', `referral_new_${code}`),
    grantXP(referrer.id, XP_REFERRAL, `Indicação aceita! Novo usuário no Ascendia 🎉`, 'bonus', `referral_sent_${user.id}`),
  ])

  return NextResponse.json({ ok: true, xpEarned: XP_REFERRAL })
}
