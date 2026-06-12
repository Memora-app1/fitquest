/**
 * GET  /api/notifications — lista as 20 notificações mais recentes do usuário
 * PATCH /api/notifications — marca uma ou todas como lidas
 * DELETE /api/notifications?id=UUID — deleta 1 notificação (ou ?all=1 para todas lidas)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const patchSchema = z.object({
  id: z.string().uuid().optional(), // se omitido, marca TODAS como lidas
});

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: notifications } = await supabase
    .from('notifications')
    .select('id, type, title, body, icon, action_url, sent_at, read_at, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20);

  const unreadCount = (notifications ?? []).filter((n) => !n.read_at).length;

  return NextResponse.json({
    notifications: notifications ?? [],
    unreadCount,
  });
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
  }

  const now = new Date().toISOString();

  let query = supabase
    .from('notifications')
    .update({ read_at: now })
    .eq('user_id', user.id)
    .is('read_at', null);

  if (parsed.data.id) {
    query = query.eq('id', parsed.data.id);
  }

  const { error } = await query;

  if (error) return NextResponse.json({ error: 'internal_error' }, { status: 500 });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const all = searchParams.get('all') === '1';

  if (all) {
    // Remove todas as notificações já lidas do usuário
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', user.id)
      .not('read_at', 'is', null);
    if (error) return NextResponse.json({ error: 'internal_error' }, { status: 500 });
    return NextResponse.json({ ok: true, deleted: 'all_read' });
  }

  if (!id) return NextResponse.json({ error: 'missing_id' }, { status: 400 });

  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
