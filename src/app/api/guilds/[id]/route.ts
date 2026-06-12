/**
 * GET /api/guilds/[id]  — detalhe de uma guild (membros, XP, ranking interno)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const INVITE_CODE_RE = /^[A-Z0-9]{4,10}$/;

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!UUID_RE.test(id) && !INVITE_CODE_RE.test(id)) {
    return NextResponse.json({ error: 'guild_not_found' }, { status: 404 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  // Busca guild usando .eq() tipado em vez de .or() com interpolação
  const baseQuery = supabase
    .from('guilds')
    .select(
      'id, name, tag, motto, avatar_emoji, xp_total, weekly_xp, max_members, invite_code, is_public, created_by, created_at'
    );
  const { data: guild } = await (UUID_RE.test(id)
    ? baseQuery.eq('id', id)
    : baseQuery.eq('invite_code', id.toUpperCase())
  ).single();

  if (!guild) return NextResponse.json({ error: 'guild_not_found' }, { status: 404 });

  const guildId = guild.id as string;

  // Membros com perfil
  const { data: members } = await supabase
    .from('guild_members')
    .select('user_id, role, joined_at, weekly_xp, last_week_xp')
    .eq('guild_id', guildId)
    .order('weekly_xp', { ascending: false });

  const memberIds = (members ?? []).map((m) => m.user_id as string);

  const profilesMap: Record<
    string,
    {
      name: string;
      level: number;
      prestige_level: number;
      streak_current: number;
      equipped_title: string | null;
    }
  > = {};
  if (memberIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name, level, prestige_level, streak_current, equipped_title')
      .in('id', memberIds);

    for (const p of profiles ?? []) {
      profilesMap[p.id as string] = {
        name: p.name as string,
        level: p.level as number,
        prestige_level: (p.prestige_level as number) ?? 0,
        streak_current: (p.streak_current as number) ?? 0,
        equipped_title: p.equipped_title as string | null,
      };
    }
  }

  const enrichedMembers = (members ?? []).map((m, idx) => ({
    ...m,
    position: idx + 1,
    profile: profilesMap[m.user_id as string] ?? null,
    isCurrentUser: m.user_id === user.id,
  }));

  const myMembership = enrichedMembers.find((m) => m.isCurrentUser);

  return NextResponse.json({
    guild: { ...guild, member_count: memberIds.length },
    members: enrichedMembers,
    myRole: myMembership?.role ?? null,
    isMember: !!myMembership,
    isOwner: guild.created_by === user.id,
  });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!UUID_RE.test(id) && !INVITE_CODE_RE.test(id)) {
    return NextResponse.json({ error: 'guild_not_found' }, { status: 404 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  // Remove o usuário da guild
  const { error } = await supabase
    .from('guild_members')
    .delete()
    .eq('guild_id', id)
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: 'db_error' }, { status: 500 });

  return NextResponse.json({ ok: true, message: 'Você saiu da guild.' });
}
