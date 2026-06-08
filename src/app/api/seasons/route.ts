/**
 * Seasons API
 *
 * GET  /api/seasons          — temporada ativa + progresso do usuário
 * POST /api/seasons/claim    — reivindica recompensa de um tier
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import { grantXP } from '@/lib/xp-server'
import type { SeasonTier } from '@/lib/supabase/types'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  // Temporada ativa
  const { data: season } = await supabase
    .from('seasons')
    .select('id, name, theme_emoji, tagline, start_date, end_date, tiers')
    .eq('is_active', true)
    .single()

  if (!season) {
    return NextResponse.json({ season: null, progress: null })
  }

  // Progresso do usuário nesta temporada
  const { data: progress } = await supabase
    .from('season_progress')
    .select('season_xp, current_tier, claimed_tiers')
    .eq('user_id', user.id)
    .eq('season_id', season.id)
    .maybeSingle()

  const seasonXp    = (progress?.season_xp as number) ?? 0
  const claimedTiers = (progress?.claimed_tiers as number[]) ?? []
  const tiers       = (season.tiers as SeasonTier[]) ?? []

  // Calcula qual é o tier atual baseado no season_xp
  const currentTier = tiers.reduce((highest, t) => {
    return seasonXp >= t.season_xp_required ? t.tier : highest
  }, 0)

  // Tiers disponíveis para reivindicar (desbloqueados mas não reivindicados)
  const subscription = await supabase
    .from('profiles')
    .select('subscription_status')
    .eq('id', user.id)
    .single()

  const isPaid = ['active', 'lifetime'].includes((subscription.data?.subscription_status as string) ?? '')

  const claimableTiers = tiers.filter((t) => {
    const isUnlocked  = seasonXp >= t.season_xp_required
    const isClaimed   = claimedTiers.includes(t.tier)
    const isAccessible = t.free || isPaid
    return isUnlocked && !isClaimed && isAccessible
  })

  // Dias restantes na temporada
  const endDate    = new Date(season.end_date as string)
  const daysLeft   = Math.max(0, Math.ceil((endDate.getTime() - Date.now()) / 86400000))
  const totalDays  = Math.ceil((endDate.getTime() - new Date(season.start_date as string).getTime()) / 86400000)
  const daysPassed = totalDays - daysLeft

  // XP para o próximo tier
  const nextTier = tiers.find((t) => seasonXp < t.season_xp_required)
  const xpToNextTier = nextTier ? nextTier.season_xp_required - seasonXp : 0

  return NextResponse.json({
    season: {
      id:          season.id,
      name:        season.name,
      theme_emoji: season.theme_emoji,
      tagline:     season.tagline,
      start_date:  season.start_date,
      end_date:    season.end_date,
      tiers,
      days_left:   daysLeft,
      days_passed: daysPassed,
      total_days:  totalDays,
    },
    progress: {
      season_xp:      seasonXp,
      current_tier:   currentTier,
      claimed_tiers:  claimedTiers,
      claimable_tiers: claimableTiers,
      xp_to_next_tier: xpToNextTier,
      next_tier:       nextTier ?? null,
      is_paid:         isPaid,
    },
  })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({})) as { tier?: number }
  const tierNum = body.tier

  if (!tierNum || typeof tierNum !== 'number') {
    return NextResponse.json({ error: 'invalid_tier' }, { status: 400 })
  }

  // Temporada ativa
  const { data: season } = await supabase
    .from('seasons')
    .select('id, tiers')
    .eq('is_active', true)
    .single()

  if (!season) return NextResponse.json({ error: 'no_active_season' }, { status: 404 })

  const tiers = (season.tiers as SeasonTier[]) ?? []
  const tier  = tiers.find((t) => t.tier === tierNum)
  if (!tier) return NextResponse.json({ error: 'tier_not_found' }, { status: 404 })

  // Progresso atual
  const { data: progress } = await supabase
    .from('season_progress')
    .select('season_xp, claimed_tiers')
    .eq('user_id', user.id)
    .eq('season_id', season.id)
    .maybeSingle()

  const seasonXp    = (progress?.season_xp as number) ?? 0
  const claimedTiers = (progress?.claimed_tiers as number[]) ?? []

  if (seasonXp < tier.season_xp_required) {
    return NextResponse.json({ error: 'xp_insufficient', xp_needed: tier.season_xp_required - seasonXp }, { status: 400 })
  }
  if (claimedTiers.includes(tierNum)) {
    return NextResponse.json({ error: 'already_claimed' }, { status: 409 })
  }

  // Verifica se é tier premium (precisa de plano ativo)
  if (!tier.free) {
    const { data: profileSub } = await supabase
      .from('profiles')
      .select('subscription_status')
      .eq('id', user.id)
      .single()

    const isPaid = ['active', 'lifetime'].includes((profileSub?.subscription_status as string) ?? '')
    if (!isPaid) {
      return NextResponse.json({ error: 'premium_required', message: 'Este tier requer um plano ativo.' }, { status: 403 })
    }
  }

  const serviceSupabase = createServiceClient()
  const newClaimed = [...claimedTiers, tierNum]

  // Upsert do progresso com novo tier reivindicado
  await serviceSupabase
    .from('season_progress')
    .upsert({
      user_id:       user.id,
      season_id:     season.id,
      season_xp:     seasonXp,
      current_tier:  tierNum,
      claimed_tiers: newClaimed,
      updated_at:    new Date().toISOString(),
    }, { onConflict: 'user_id,season_id' })

  let reward_message = ''

  // Aplica a recompensa do tier
  if (tier.type === 'xp' && typeof tier.value === 'number') {
    await grantXP(user.id, tier.value, `Season Pass — Tier ${tierNum}`, 'season', `season_tier_${tierNum}`)
    reward_message = `+${tier.value} XP`

  } else if (tier.type === 'streak_freeze' && typeof tier.value === 'number') {
    const { data: prof } = await serviceSupabase
      .from('profiles')
      .select('streak_freezes')
      .eq('id', user.id)
      .single()
    const current = (prof?.streak_freezes as number) ?? 0
    await serviceSupabase
      .from('profiles')
      .update({ streak_freezes: Math.min(current + tier.value, 10) })
      .eq('id', user.id)
    reward_message = `+${tier.value} Streak Freeze${tier.value > 1 ? 's' : ''}`

  } else if (tier.type === 'title' && tier.slug) {
    // Busca o cosmético e aplica
    const { data: cosm } = await serviceSupabase
      .from('cosmetics')
      .select('id')
      .eq('slug', tier.slug)
      .single()

    if (cosm) {
      await serviceSupabase.from('user_cosmetics').upsert({
        user_id:    user.id,
        cosmetic_id: (cosm as { id: string }).id,
        equipped:   false,
      }, { onConflict: 'user_id,cosmetic_id' })

      await serviceSupabase
        .from('profiles')
        .update({ equipped_title: typeof tier.value === 'string' ? tier.value : String(tier.value) })
        .eq('id', user.id)
    }
    reward_message = `Título: ${typeof tier.value === 'string' ? tier.value : String(tier.value)}`

  } else if (tier.type === 'frame' && tier.slug) {
    const { data: cosm } = await serviceSupabase
      .from('cosmetics')
      .select('id')
      .eq('slug', tier.slug)
      .single()

    if (cosm) {
      await serviceSupabase.from('user_cosmetics').upsert({
        user_id:    user.id,
        cosmetic_id: (cosm as { id: string }).id,
        equipped:   false,
      }, { onConflict: 'user_id,cosmetic_id' })
    }
    reward_message = `Frame: ${tier.label}`
  }

  return NextResponse.json({
    ok:             true,
    tier:           tierNum,
    reward_type:    tier.type,
    reward_message,
    claimed_tiers:  newClaimed,
  })
}
