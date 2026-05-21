/**
 * Cron a cada 5 minutos
 * Envia notificações agendadas que ainda não foram enviadas
 *
 * 📌 Por enquanto, marca como enviadas e loga.
 * Quando configurar Web Push, expandir aqui com a lib web-push.
 */

import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export const maxDuration = 30

export async function GET() {
  const supabase = createServiceClient()

  // Buscar notificações pendentes (scheduled_for no passado, sent_at nulo)
  const { data: pending } = await supabase
    .from('notifications')
    .select('id, user_id, title, body, type, action_url')
    .lte('scheduled_for', new Date().toISOString())
    .is('sent_at', null)
    .limit(100)

  if (!pending || pending.length === 0) {
    return NextResponse.json({ ok: true, sent: 0 })
  }

  let sent = 0
  for (const notif of pending) {
    try {
      // 📌 TODO: implementar envio Web Push aqui
      // const { data: subs } = await supabase
      //   .from('push_subscriptions')
      //   .select('endpoint, keys_p256dh, keys_auth')
      //   .eq('user_id', notif.user_id)
      // for (const sub of subs ?? []) { await webpush.sendNotification(...) }

      await supabase
        .from('notifications')
        .update({ sent_at: new Date().toISOString() })
        .eq('id', notif.id)

      sent++
    } catch (err) {
      console.error(`notification error ${notif.id}`, err)
    }
  }

  return NextResponse.json({ ok: true, sent, total: pending.length })
}
