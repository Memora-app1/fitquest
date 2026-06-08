/**
 * Cron diário às 14:00 UTC (~11:00 Brasília)
 * Envia push "Na mesma data, 1 ano atrás..." para usuários com atividades registradas há exatamente 365 dias.
 * Deduplicação via notifications table (tipo: coach_insight, source_id: 'memory_{date}').
 */

import { NextResponse } from 'next/server'
import { isCronAuthorized, cronUnauthorized } from '@/lib/cron-auth'
import { createServiceClient } from '@/lib/supabase/server'
import { sendPushNotification } from '@/lib/webpush'

export const maxDuration = 60

export async function GET() {
  if (!await isCronAuthorized()) return cronUnauthorized()
  const supabase = createServiceClient()

  const today = new Date()
  const oneYearAgo = new Date(today)
  oneYearAgo.setFullYear(today.getFullYear() - 1)
  const oneYearAgoStr = oneYearAgo.toISOString().split('T')[0]!
  const todayStr = today.toISOString().split('T')[0]!
  // Usamos 'memory_' + date no título para dedup — source_id é UUID e não pode receber texto


  // Usuários que logaram hábitos 1 ano atrás
  const { data: habitLogs } = await supabase
    .from('habit_logs')
    .select('user_id, habit_id')
    .eq('logged_date', oneYearAgoStr)

  if (!habitLogs || habitLogs.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, date: oneYearAgoStr })
  }

  // Agrupa por usuário e conta hábitos únicos
  const byUser = new Map<string, number>()
  for (const log of habitLogs) {
    const uid = log.user_id as string
    byUser.set(uid, (byUser.get(uid) ?? 0) + 1)
  }

  const userIds = [...byUser.keys()]

  // Deduplicação: tipo coach_insight + título contendo a data de 1 ano atrás + enviado hoje
  const { data: alreadySent } = await supabase
    .from('notifications')
    .select('user_id')
    .eq('type', 'coach_insight')
    .gte('created_at', `${todayStr}T00:00:00`)
    .ilike('title', `%${oneYearAgoStr}%`)
    .in('user_id', userIds)

  const sentSet = new Set((alreadySent ?? []).map((n) => n.user_id as string))

  // Busca push subscriptions em lote
  const toNotify = userIds.filter((uid) => !sentSet.has(uid))
  if (toNotify.length === 0) return NextResponse.json({ ok: true, sent: 0, skipped: userIds.length })

  const { data: allSubs } = await supabase
    .from('push_subscriptions')
    .select('id, user_id, endpoint, keys_p256dh, keys_auth')
    .in('user_id', toNotify)

  const subsByUser = new Map<string, typeof allSubs>()
  for (const sub of allSubs ?? []) {
    const uid = sub.user_id as string
    if (!subsByUser.has(uid)) subsByUser.set(uid, [])
    subsByUser.get(uid)!.push(sub)
  }

  let sent = 0

  for (const userId of toNotify) {
    const habitCount = byUser.get(userId) ?? 0
    const subs = subsByUser.get(userId) ?? []

    const title = `📸 ${habitCount} hábito${habitCount !== 1 ? 's' : ''} registrado${habitCount !== 1 ? 's' : ''} há 1 ano!`
    const body = `No mesmo dia de ${oneYearAgo.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })} do ano passado, você estava construindo sua rotina. Continue assim!`

    try {
      for (const sub of subs) {
        const result = await sendPushNotification(
          sub.endpoint as string,
          sub.keys_p256dh as string,
          sub.keys_auth as string,
          { title, body, url: '/habitos' }
        )
        if (result.gone) await supabase.from('push_subscriptions').delete().eq('id', sub.id)
      }

      await supabase.from('notifications').insert({
        user_id: userId,
        type: 'coach_insight',
        title,
        body,
        action_url: '/habitos',
        scheduled_for: today.toISOString(),
        sent_at: today.toISOString(),
      })

      sent++
    } catch (err) {
      console.error(`memories cron error for user ${userId}`, err)
    }
  }

  return NextResponse.json({ ok: true, sent, total: toNotify.length, date: oneYearAgoStr, todayStr })
}
