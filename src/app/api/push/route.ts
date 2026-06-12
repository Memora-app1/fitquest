import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const subscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const parsed = subscribeSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: 'invalid_input' }, { status: 400 });

  const { endpoint, keys } = parsed.data;

  // Upsert para evitar duplicatas do mesmo endpoint
  await supabase.from('push_subscriptions').upsert(
    {
      user_id: user.id,
      endpoint,
      keys_p256dh: keys.p256dh,
      keys_auth: keys.auth,
    },
    { onConflict: 'endpoint' }
  );

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { endpoint } = (await req.json()) as { endpoint: string };
  if (!endpoint) return NextResponse.json({ error: 'missing endpoint' }, { status: 400 });

  await supabase
    .from('push_subscriptions')
    .delete()
    .eq('user_id', user.id)
    .eq('endpoint', endpoint);

  return NextResponse.json({ ok: true });
}
