/**
 * XP Shop — troca XP por itens de gameplay.
 *
 * POST /api/shop   { item: 'streak_freeze' | 'xp_boost_2x_1h' }
 *
 * Idempotência: verifica XP suficiente antes de descontar.
 * XP negativo = gasto (ledger imutável registra tudo).
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import { calculateLevel } from '@/lib/xp'

export const SHOP_ITEMS = {
  streak_freeze: {
    id: 'streak_freeze',
    name: 'Streak Freeze',
    description: 'Protege seu streak por 1 dia se você falhar. Máximo 10.',
    emoji: '🛡️',
    cost: 500,
    maxOwn: 10,
  },
} as const

type ShopItemId = keyof typeof SHOP_ITEMS

const bodySchema = z.object({
  item: z.enum(['streak_freeze']),
})

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const parsed = bodySchema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: 'invalid_item' }, { status: 400 })

  const { item } = parsed.data
  const shopItem = SHOP_ITEMS[item]

  // Busca XP atual do usuário
  const { data: profile } = await supabase
    .from('profiles')
    .select('xp_total, level, streak_freezes')
    .eq('id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'profile_not_found' }, { status: 404 })

  const currentXp = profile.xp_total as number

  if (currentXp < shopItem.cost) {
    return NextResponse.json({
      error: 'insufficient_xp',
      message: `Você precisa de ${shopItem.cost} XP mas tem ${currentXp}.`,
      needed: shopItem.cost,
      current: currentXp,
    }, { status: 400 })
  }

  // Verifica limite de posse
  if (item === 'streak_freeze') {
    const currentFreezes = (profile.streak_freezes as number) ?? 0
    if (currentFreezes >= shopItem.maxOwn) {
      return NextResponse.json({
        error: 'max_owned',
        message: `Você já tem o máximo de ${shopItem.maxOwn} streak freezes.`,
      }, { status: 400 })
    }
  }

  // Desconta XP via service client (transação)
  const serviceSupabase = createServiceClient()
  const newXp = currentXp - shopItem.cost
  const newLevel = calculateLevel(newXp)

  await serviceSupabase.from('xp_transactions').insert({
    user_id: user.id,
    amount: -shopItem.cost,
    reason: `XP Shop: ${shopItem.name}`,
    source_type: 'bonus',
    source_id: `shop_${item}_${Date.now()}`,
    xp_total_after: newXp,
    level_after: newLevel,
  })

  await serviceSupabase
    .from('profiles')
    .update({ xp_total: newXp, level: newLevel })
    .eq('id', user.id)

  // Aplica o item
  if (item === 'streak_freeze') {
    const currentFreezes = (profile.streak_freezes as number) ?? 0
    await serviceSupabase
      .from('profiles')
      .update({ streak_freezes: currentFreezes + 1 })
      .eq('id', user.id)
  }

  return NextResponse.json({
    ok: true,
    item,
    xpSpent: shopItem.cost,
    xpRemaining: newXp,
    message: `${shopItem.emoji} ${shopItem.name} adicionado!`,
  })
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('xp_total, streak_freezes')
    .eq('id', user.id)
    .single()

  return NextResponse.json({
    xp: profile?.xp_total ?? 0,
    streak_freezes: profile?.streak_freezes ?? 0,
    items: Object.values(SHOP_ITEMS),
  })
}
