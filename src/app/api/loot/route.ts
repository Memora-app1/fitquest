/**
 * Loot Box API
 *
 * GET  /api/loot          — retorna loot box pendente (não aberta) do dia
 * POST /api/loot/open     — abre a loot box e aplica a recompensa
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import { grantXP } from '@/lib/xp-server'
import { todayString } from '@/lib/utils'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const today = todayString()

  // Busca loot pendente (qualquer dia não aberto, mais recente primeiro)
  const { data: loot } = await supabase
    .from('daily_loot')
    .select('id, date, rarity, reward_type, reward_value, reward_meta, source, opened_at')
    .eq('user_id', user.id)
    .is('opened_at', null)
    .order('date', { ascending: false })
    .limit(1)
    .maybeSingle()

  return NextResponse.json({
    pending: loot ?? null,
    today,
  })
}

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  // Busca o loot pendente mais antigo primeiro
  const { data: loot } = await supabase
    .from('daily_loot')
    .select('id, date, rarity, reward_type, reward_value, reward_meta, source')
    .eq('user_id', user.id)
    .is('opened_at', null)
    .order('date', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (!loot) {
    return NextResponse.json({ error: 'no_pending_loot' }, { status: 404 })
  }

  const serviceSupabase = createServiceClient()

  // Marca como aberta
  await serviceSupabase
    .from('daily_loot')
    .update({ opened_at: new Date().toISOString() })
    .eq('id', loot.id)

  const rewardType  = loot.reward_type  as 'xp' | 'streak_freeze' | 'cosmetic'
  const rewardValue = loot.reward_value as number
  const rewardMeta  = loot.reward_meta  as string | null

  let message = ''

  // Aplica a recompensa
  if (rewardType === 'xp') {
    await grantXP(user.id, rewardValue, `Loot Box ${loot.rarity}`, 'loot', loot.id)
    message = `+${rewardValue} XP`

  } else if (rewardType === 'streak_freeze') {
    const { data: profile } = await serviceSupabase
      .from('profiles')
      .select('streak_freezes')
      .eq('id', user.id)
      .single()
    const current = (profile?.streak_freezes as number) ?? 0
    await serviceSupabase
      .from('profiles')
      .update({ streak_freezes: Math.min(current + rewardValue, 10) })
      .eq('id', user.id)
    message = `+${rewardValue} Streak Freeze${rewardValue > 1 ? 's' : ''}`

  } else if (rewardType === 'cosmetic' && rewardMeta) {
    try {
      const meta = JSON.parse(rewardMeta) as { cosmetic_id: string; slug: string; name: string }
      // Insere cosmético (idempotente via PK composta)
      await serviceSupabase.from('user_cosmetics').insert({
        user_id:    user.id,
        cosmetic_id: meta.cosmetic_id,
        equipped:   false,
      })
      message = `Cosmético: ${meta.name}`
    } catch {
      // Fallback: concede XP
      await grantXP(user.id, 200, 'Loot Box (cosmético fallback)', 'loot', loot.id)
      message = '+200 XP'
    }
  }

  // Notificação
  const rarityLabels: Record<string, string> = {
    common: 'Comum', rare: 'Raro', epic: 'Épico', legendary: 'Lendário'
  }
  const rarityEmojis: Record<string, string> = {
    common: '⬜', rare: '🔷', epic: '💜', legendary: '🌟'
  }

  await serviceSupabase.from('notifications').insert({
    user_id:       user.id,
    type:          'loot_box',
    title:         `${rarityEmojis[loot.rarity] ?? '📦'} Loot ${rarityLabels[loot.rarity] ?? loot.rarity}!`,
    body:          message,
    action_url:    '/dashboard',
    scheduled_for: new Date().toISOString(),
    sent_at:       new Date().toISOString(),
  })

  return NextResponse.json({
    ok:          true,
    loot_id:     loot.id,
    rarity:      loot.rarity,
    reward_type: rewardType,
    reward_value: rewardValue,
    reward_meta:  rewardMeta,
    message,
  })
}
