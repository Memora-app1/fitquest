import { isCronAuthorized, cronUnauthorized } from '@/lib/cron-auth'
/**
 * Cron diário às 09:00 UTC (~06:00 Brasília)
 * Envia push para tarefas com due_date = hoje que ainda não foram concluídas.
 * Agrupa por usuário — 1 push por usuário com lista de tarefas do dia.
 * Deduplicação via notifications table.
 */

import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendPushNotification } from '@/lib/webpush'
import { todayString } from '@/lib/utils'

export const maxDuration = 60

export async function GET() {
  if (!await isCronAuthorized()) return cronUnauthorized()

  const supabase = createServiceClient()
  const today = todayString()

  // Tarefas com prazo hoje, não arquivadas, não concluídas
  // due_date é TIMESTAMPTZ — comparar com .eq(DATE) só casaria meia-noite UTC.
  // Usa range no fuso de Brasília (UTC-3) para cobrir o dia inteiro.
  const todayStart = `${today}T00:00:00-03:00`
  const todayEnd   = `${today}T23:59:59.999-03:00`

  const { data: tasks } = await supabase
    .from('tasks')
    .select('id, user_id, title, urgent, important')
    .gte('due_date', todayStart)
    .lte('due_date', todayEnd)
    .not('status', 'eq', 'done')
    .not('status', 'eq', 'archived')

  if (!tasks || tasks.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, date: today })
  }

  // Agrupa por usuário
  const byUser = new Map<string, typeof tasks>()
  for (const t of tasks) {
    const uid = t.user_id as string
    if (!byUser.has(uid)) byUser.set(uid, [])
    byUser.get(uid)!.push(t)
  }

  const userIds = [...byUser.keys()]

  // Verifica dedup: já enviou task_reminder hoje?
  const { data: alreadySent } = await supabase
    .from('notifications')
    .select('user_id')
    .eq('type', 'task_reminder')
    .gte('sent_at', `${today}T00:00:00`)
    .in('user_id', userIds)

  const sentSet = new Set((alreadySent ?? []).map((n) => n.user_id as string))

  // Busca subscriptions em lote
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
    const userTasks = byUser.get(userId) ?? []
    const subs = subsByUser.get(userId) ?? []
    if (subs.length === 0) continue

    const criticalCount = userTasks.filter(t => t.urgent && t.important).length
    const title = userTasks.length === 1
      ? `📋 Tarefa de hoje: ${userTasks[0]!.title}`
      : `📋 ${userTasks.length} tarefas vencem hoje`
    const body = criticalCount > 0
      ? `${criticalCount} tarefa${criticalCount > 1 ? 's' : ''} urgente+importante. Complete hoje para ganhar +50 XP!`
      : `Conclua agora e ganhe +30 XP por tarefa. Mantenha sua produtividade!`

    try {
      for (const sub of subs) {
        const result = await sendPushNotification(
          sub.endpoint as string,
          sub.keys_p256dh as string,
          sub.keys_auth as string,
          { title, body, url: '/tarefas' }
        )
        if (result.gone) await supabase.from('push_subscriptions').delete().eq('id', sub.id)
      }

      await supabase.from('notifications').insert({
        user_id: userId,
        type: 'task_reminder',
        title,
        body,
        action_url: '/tarefas',
        scheduled_for: new Date().toISOString(),
        sent_at: new Date().toISOString(),
      })

      sent++
    } catch (err) {
      console.error(`task-reminders error for user ${userId}`, err)
    }
  }

  return NextResponse.json({ ok: true, sent, total: toNotify.length, date: today })
}
