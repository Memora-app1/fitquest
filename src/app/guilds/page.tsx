import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components/layout/app-shell'
import { GuildsClient } from '@/components/guilds/guilds-client'

export const metadata: Metadata = {
  title: 'Guilds',
  description: 'Entre em um clã, conquiste em grupo e domine o ranking.',
}

export const dynamic = 'force-dynamic'

export default async function GuildsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Guild do usuário
  const { data: membership } = await supabase
    .from('guild_members')
    .select('guild_id, role')
    .eq('user_id', user.id)
    .maybeSingle()

  // Guilds públicas + contagem de membros
  const { data: guilds } = await supabase
    .from('guilds')
    .select('id, name, tag, motto, avatar_emoji, xp_total, weekly_xp, max_members, invite_code')
    .eq('is_public', true)
    .order('weekly_xp', { ascending: false })
    .limit(30)

  const guildList = guilds ?? []
  const guildIds  = guildList.map((g) => g.id as string)

  let memberCountMap: Record<string, number> = {}
  if (guildIds.length > 0) {
    const { data: members } = await supabase
      .from('guild_members')
      .select('guild_id')
      .in('guild_id', guildIds)
    for (const m of members ?? []) {
      const id = m.guild_id as string
      memberCountMap[id] = (memberCountMap[id] ?? 0) + 1
    }
  }

  const enriched = guildList.map((g) => ({
    id:           g.id as string,
    name:         g.name as string,
    tag:          g.tag as string,
    motto:        g.motto as string | null,
    avatar_emoji: g.avatar_emoji as string,
    xp_total:     (g.xp_total as number) ?? 0,
    weekly_xp:    (g.weekly_xp as number) ?? 0,
    max_members:  (g.max_members as number) ?? 20,
    invite_code:  g.invite_code as string,
    member_count: memberCountMap[g.id as string] ?? 0,
    is_member:    membership?.guild_id === g.id,
  }))

  // Nível do usuário (para checar se pode criar guild)
  const { data: profile } = await supabase
    .from('profiles')
    .select('level')
    .eq('id', user.id)
    .single()

  return (
    <AppShell>
      <GuildsClient
        guilds={enriched}
        myGuildId={membership?.guild_id ?? null}
        myRole={membership?.role ?? null}
        userLevel={(profile?.level as number) ?? 1}
      />
    </AppShell>
  )
}
