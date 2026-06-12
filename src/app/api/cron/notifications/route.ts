import { isCronAuthorized, cronUnauthorized } from '@/lib/cron-auth';
/**
 * Cron diário às 08:00 UTC
 * Envia notificações agendadas via Web Push
 * Batches subscription lookup to avoid N+1.
 */

import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { sendPushNotification } from '@/lib/webpush';

export const maxDuration = 30;

export async function GET() {
  if (!(await isCronAuthorized())) return cronUnauthorized();
  const supabase = createServiceClient();

  const { data: pending } = await supabase
    .from('notifications')
    .select('id, user_id, title, body, type, action_url')
    .lte('scheduled_for', new Date().toISOString())
    .is('sent_at', null)
    .limit(100);

  if (!pending || pending.length === 0) {
    return NextResponse.json({ ok: true, sent: 0 });
  }

  // Batch subscription lookup — 1 query for all user IDs
  const userIds = [...new Set(pending.map((n) => n.user_id as string))];
  const { data: allSubs } = await supabase
    .from('push_subscriptions')
    .select('id, user_id, endpoint, keys_p256dh, keys_auth')
    .in('user_id', userIds);

  const subsByUser = new Map<string, typeof allSubs>();
  for (const sub of allSubs ?? []) {
    const uid = sub.user_id as string;
    if (!subsByUser.has(uid)) subsByUser.set(uid, []);
    subsByUser.get(uid)!.push(sub);
  }

  let sent = 0;
  let failed = 0;

  for (const notif of pending) {
    try {
      const subs = subsByUser.get(notif.user_id as string) ?? [];

      for (const sub of subs) {
        const result = await sendPushNotification(sub.endpoint, sub.keys_p256dh, sub.keys_auth, {
          title: notif.title,
          body: notif.body,
          url: (notif.action_url as string | null) ?? '/dashboard',
        });

        if (result.gone) {
          await supabase.from('push_subscriptions').delete().eq('id', sub.id);
        }
      }

      await supabase
        .from('notifications')
        .update({ sent_at: new Date().toISOString() })
        .eq('id', notif.id);

      sent++;
    } catch (err) {
      console.error(`notification error ${notif.id}`, err);
      failed++;
    }
  }

  return NextResponse.json({ ok: true, sent, failed, total: pending.length });
}
