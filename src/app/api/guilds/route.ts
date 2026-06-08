/**
 * Guilds API
 *
 * GET  /api/guilds          — lista guilds públicas (com contagem de membros)
 * POST /api/guilds          — cria uma nova guild (requer nível 3+)
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'

const createSchema = z.object({
  name:         z.string().min(3).max(40),
  tag:          z.string().min(2).max(6).toUpperCase(),
  motto:        z.string().max(100).optional(),
  avatar_emoji: z.string().max(4).default('⚡'),
})

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('q') ?? ''
  const limit  = Math.min(parseInt(searchParams.get('limit') ?? '20', 10), 50)

  let query = supabase
    .from('guilds')
    .select('id, name, tag, motto, avatar_emoji, xp_total, weekly_xp, max_members, is_public, created_at, invite_code')
    .eq('is_public', true)
    .order('weekly_xp', { ascending: false })
    .limit(limit)

  if (search) {
    query = query.ilike('name', `%${search}%`)
  }

  const { data: guilds } = await query

  if (!guilds) return NextResponse.json({ guilds: [], myGuild: null })

  // Conta membros de cada guild
  const guildIds = guilds.map((g) => g.id)
  const { data: memberCounts } = await supabase
    .from('guild_members')
    .select('guild_id')
    .in('guild_id', guildIds)

  const countMap: Record<string, number> = {}
  for (const m of memberCounts ?? []) {
    const id = m.guild_id as string
    countMap[id] = (countMap[id] ?? 0) + 1
  }

  // Guild do usuário atual
  const { data: myMembership } = await supabase
    .from('guild_members')
    .select('guild_id, role')
    .eq('user_id', user.id)
    .maybeSingle()

  const enriched = guilds.map((g) => ({
    ...g,
    member_count: countMap[g.id as string] ?? 0,
    is_member:    myMembership != null && myMembership.guild_id === g.id,
    my_role:      myMembership != null && myMembership.guild_id === g.id ? (myMembership.role ?? null) : null,
  }))

  return NextResponse.json({
    guilds:   enriched,
    myGuild:  myMembership?.guild_id ?? null,
  })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  // Verifica nível mínimo (3)
  const { data: profile } = await supabase
    .from('profiles')
    .select('level')
    .eq('id', user.id)
    .single()

  if (!profile || (profile.level as number) < 3) {
    return NextResponse.json({
      error: 'level_required',
      message: 'Você precisa ser nível 3 para criar uma guild.',
    }, { status: 403 })
  }

  // Verifica se já está em uma guild
  const { data: existing } = await supabase
    .from('guild_members')
    .select('guild_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({
      error: 'already_in_guild',
      message: 'Você já faz parte de uma guild. Saia antes de criar uma nova.',
    }, { status: 400 })
  }

  const parsed = createSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_input', issues: parsed.error.issues }, { status: 400 })
  }

  const { name, tag, motto, avatar_emoji } = parsed.data
  const serviceSupabase = createServiceClient()

  // Cria a guild
  const { data: guild, error: guildError } = await serviceSupabase
    .from('guilds')
    .insert({
      name,
      tag,
      motto:        motto ?? null,
      avatar_emoji,
      created_by:   user.id,
    })
    .select('id, name, tag, invite_code')
    .single()

  if (guildError) {
    if (guildError.code === '23505') {
      return NextResponse.json({ error: 'name_taken', message: 'Esse nome de guild já existe.' }, { status: 409 })
    }
    return NextResponse.json({ error: 'db_error', detail: guildError.message }, { status: 500 })
  }

  const g = guild as { id: string; name: string; tag: string; invite_code: string }

  // Adiciona criador como owner
  await serviceSupabase.from('guild_members').insert({
    guild_id: g.id,
    user_id:  user.id,
    role:     'owner',
  })

  return NextResponse.json({
    ok:   true,
    guild: { id: g.id, name: g.name, tag: g.tag, invite_code: g.invite_code },
    message: `Guild [${tag}] ${name} criada com sucesso!`,
  }, { status: 201 })
}
