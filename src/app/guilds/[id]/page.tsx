import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/layout/app-shell'
import { GuildDetailClient } from '@/components/guilds/guild-detail-client'

export const dynamic = 'force-dynamic'

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('guilds')
    .select('name, tag, motto')
    .or(`id.eq.${id},invite_code.eq.${id.toUpperCase()}`)
    .single()
  if (!data) return { title: 'Guild' }
  return {
    title: `[${data.tag as string}] ${data.name as string}`,
    description: (data.motto as string) ?? 'Guild no Ascendia',
  }
}

export default async function GuildDetailPage(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/api/guilds/${id}`, {
    headers: { Cookie: '' },
    cache: 'no-store',
  }).catch(() => null)

  // Fallback: fetch directly via supabase if API call fails (avoids self-call issues in dev)
  let guildData: {
    guild: {
      id: string; name: string; tag: string; motto: string | null;
      avatar_emoji: string; xp_total: number; weekly_xp: number;
      max_members: number; invite_code: string; is_public: boolean;
      created_by: string; created_at: string; member_count: number;
    }
    members: Array<{
      user_id: string; role: string; joined_at: string;
      weekly_xp: number; last_week_xp: number; position: number;
      isCurrentUser: boolean;
      profile: { name: string; level: number; prestige_level: number; streak_current: number; equipped_title: string | null } | null
    }>
    myRole: string | null
    isMember: boolean
    isOwner: boolean
  } | null = null

  if (res?.ok) {
    guildData = await res.json() as typeof guildData
  } else {
    // Direct DB fetch fallback
    const { data: guild } = await supabase
      .from('guilds')
      .select('id, name, tag, motto, avatar_emoji, xp_total, weekly_xp, max_members, invite_code, is_public, created_by, created_at')
      .or(`id.eq.${id},invite_code.eq.${id.toUpperCase()}`)
      .single()

    if (!guild) notFound()

    const guildId = guild.id as string

    const { data: members } = await supabase
      .from('guild_members')
      .select('user_id, role, joined_at, weekly_xp, last_week_xp')
      .eq('guild_id', guildId)
      .order('weekly_xp', { ascending: false })

    const memberIds = (members ?? []).map((m) => m.user_id as string)
    let profilesMap: Record<string, { name: string; level: number; prestige_level: number; streak_current: number; equipped_title: string | null }> = {}

    if (memberIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, level, prestige_level, streak_current, equipped_title')
        .in('id', memberIds)
      for (const p of profiles ?? []) {
        profilesMap[p.id as string] = {
          name: p.name as string, level: p.level as number,
          prestige_level: (p.prestige_level as number) ?? 0,
          streak_current: (p.streak_current as number) ?? 0,
          equipped_title: p.equipped_title as string | null,
        }
      }
    }

    const enrichedMembers = (members ?? []).map((m, idx) => ({
      user_id: m.user_id as string,
      role: m.role as string,
      joined_at: m.joined_at as string,
      weekly_xp: (m.weekly_xp as number) ?? 0,
      last_week_xp: (m.last_week_xp as number) ?? 0,
      position: idx + 1,
      isCurrentUser: m.user_id === user.id,
      profile: profilesMap[m.user_id as string] ?? null,
    }))

    const myMembership = enrichedMembers.find((m) => m.isCurrentUser)

    type GuildShape = NonNullable<typeof guildData>['guild']
    guildData = {
      guild: Object.assign({} as GuildShape, guild, { member_count: memberIds.length }),
      members: enrichedMembers,
      myRole: myMembership?.role ?? null,
      isMember: !!myMembership,
      isOwner: guild.created_by === user.id,
    }
  }

  if (!guildData) notFound()

  return (
    <AppShell>
      <GuildDetailClient data={guildData} />
    </AppShell>
  )
}
