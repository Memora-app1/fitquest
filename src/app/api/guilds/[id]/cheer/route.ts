/**
 * POST /api/guilds/[id]/cheer
 * Aplaude/incentiva um membro da guild — accountability social leve.
 *
 * Research: ver atividade e incentivar colegas aumenta conclusão de hábitos
 * em até 65%. Cria um loop de reconhecimento dentro da guild.
 *
 * Segurança: remetente e alvo precisam ser membros da MESMA guild.
 * Rate limit: cada membro recebe no máximo 1 aplauso por dia (anti-spam),
 * validado via notifications (sem coluna de remetente → limite por alvo/dia).
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { sendPushNotification } from '@/lib/webpush';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const bodySchema = z.object({ targetUserId: z.string().uuid() });

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Cheer usa sempre o UUID resolvido da guild (o client tem guild.id).
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: 'guild_not_found' }, { status: 404 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }
  const { targetUserId } = parsed.data;

  if (targetUserId === user.id) {
    return NextResponse.json(
      { ok: false, message: 'Você não pode aplaudir a si mesmo 😄' },
      { status: 400 }
    );
  }

  // Remetente é membro desta guild?
  const { data: senderMembership } = await supabase
    .from('guild_members')
    .select('guild_id')
    .eq('user_id', user.id)
    .eq('guild_id', id)
    .maybeSingle();
  if (!senderMembership) {
    return NextResponse.json({ error: 'not_a_member' }, { status: 403 });
  }

  const service = createServiceClient();

  // Alvo é membro da MESMA guild?
  const { data: targetMembership } = await service
    .from('guild_members')
    .select('user_id')
    .eq('guild_id', id)
    .eq('user_id', targetUserId)
    .maybeSingle();
  if (!targetMembership) {
    return NextResponse.json({ error: 'target_not_in_guild' }, { status: 404 });
  }

  // Rate limit: alvo já foi aplaudido hoje?
  const today = new Date().toISOString().split('T')[0]!;
  const { count } = await service
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', targetUserId)
    .eq('type', 'guild_cheer')
    .gte('created_at', `${today}T00:00:00`);
  if ((count ?? 0) > 0) {
    return NextResponse.json({
      ok: false,
      message: 'Esse membro já recebeu um aplauso hoje 👏',
    });
  }

  // Nomes para a mensagem
  const [{ data: senderProfile }, { data: targetProfile }, { data: guild }] = await Promise.all([
    service.from('profiles').select('name').eq('id', user.id).single(),
    service.from('profiles').select('name').eq('id', targetUserId).single(),
    service.from('guilds').select('name, tag').eq('id', id).single(),
  ]);

  const senderName = ((senderProfile?.name as string) ?? 'Um colega').split(' ')[0];
  const targetName = ((targetProfile?.name as string) ?? 'o membro').split(' ')[0];

  const title = `👏 ${senderName} te aplaudiu!`;
  const body = guild
    ? `Continue firme na guild [${guild.tag as string}] ${guild.name as string}!`
    : 'Continue firme — sua consistência inspira a guild!';

  const { error: insertError } = await service.from('notifications').insert({
    user_id: targetUserId,
    type: 'guild_cheer',
    title,
    body,
    action_url: `/guilds/${id}`,
    scheduled_for: new Date().toISOString(),
    sent_at: new Date().toISOString(),
  });
  if (insertError) {
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }

  // Push best-effort (não bloqueia o sucesso)
  const { data: subs } = await service
    .from('push_subscriptions')
    .select('id, endpoint, keys_p256dh, keys_auth')
    .eq('user_id', targetUserId)
    .limit(10);
  const deadSubIds: string[] = [];
  for (const sub of subs ?? []) {
    const result = await sendPushNotification(
      sub.endpoint as string,
      sub.keys_p256dh as string,
      sub.keys_auth as string,
      { title, body, url: `/guilds/${id}` }
    ).catch(() => ({ ok: false, gone: false }));
    if (result.gone) deadSubIds.push(sub.id as string);
  }
  if (deadSubIds.length > 0) {
    await service.from('push_subscriptions').delete().in('id', deadSubIds);
  }

  return NextResponse.json({ ok: true, message: `Você aplaudiu ${targetName}! 👏` });
}
