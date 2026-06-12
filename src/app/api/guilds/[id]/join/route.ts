/**
 * POST /api/guilds/[id]/join
 * Entra em uma guild via ID ou invite_code.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const INVITE_CODE_RE = /^[A-Z0-9]{4,10}$/;

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Validate id format before using in queries — prevents filter injection via .or()
  if (!UUID_RE.test(id) && !INVITE_CODE_RE.test(id)) {
    return NextResponse.json({ error: 'guild_not_found' }, { status: 404 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  // Verifica se já está em uma guild
  const { data: existing } = await supabase
    .from('guild_members')
    .select('guild_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      {
        error: 'already_in_guild',
        message: 'Você já faz parte de uma guild. Saia antes de entrar em outra.',
      },
      { status: 400 }
    );
  }

  // Busca a guild usando .eq() tipado (sem interpolação em .or())
  const baseQuery = supabase
    .from('guilds')
    .select('id, name, tag, max_members, is_public');
  const { data: guild } = await (UUID_RE.test(id)
    ? baseQuery.eq('id', id)
    : baseQuery.eq('invite_code', id.toUpperCase())
  ).single();

  if (!guild) {
    return NextResponse.json({ error: 'guild_not_found' }, { status: 404 });
  }

  const guildId = guild.id as string;

  // Verifica limite de membros
  const { count } = await supabase
    .from('guild_members')
    .select('user_id', { count: 'exact', head: true })
    .eq('guild_id', guildId);

  if ((count ?? 0) >= (guild.max_members as number)) {
    return NextResponse.json(
      {
        error: 'guild_full',
        message: `A guild [${guild.tag}] está cheia (${guild.max_members} membros).`,
      },
      { status: 400 }
    );
  }

  const serviceSupabase = createServiceClient();

  const { error } = await serviceSupabase.from('guild_members').insert({
    guild_id: guildId,
    user_id: user.id,
    role: 'member',
  });

  if (error) {
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    guild_id: guildId,
    name: guild.name,
    tag: guild.tag,
    message: `Bem-vindo à guild [${guild.tag}] ${guild.name}!`,
  });
}
