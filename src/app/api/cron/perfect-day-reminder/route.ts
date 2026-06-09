import { isCronAuthorized, cronUnauthorized } from '@/lib/cron-auth'
/**
 * Cron às 01:00 UTC (22:00 horário Brasília)
 * Envia push "Quase lá!" para usuários que têm hábitos pendentes hoje.
 * Só envia se o usuário tiver pelo menos 1 hábito feito mas não todos.
 */

import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendPushNotification } from '@/lib/webpush'

export const maxDuration = 120

export async function GET() {
  if (!await isCronAuthorized()) return cronUnauthorized()

  const supabase = await createServiceClient()
  const today    = new Date().toISOString().split('T')[0]!

  // Usuários ativos com assinatura válida
  const { data: users } = await supabase
    .from('profiles')
    .select('id, name, streak_current, recovery_week_active')
    .in('subscription_status', ['trial', 'active', 'lifetime'])

  if (!users || users.length === 0) return NextResponse.json({ ok: true, sent: 0 })

  // Deduplicação: não enviar se já mandou "perfect_day_reminder" hoje
  const { data: alreadySent } = await supabase
    .from('notifications')
    .select('user_id')
    .eq('type', 'perfect_day_reminder')
    .gte('created_at', `${today}T00:00:00`)

  const sentSet = new Set((alreadySent ?? []).map((n) => n.user_id as string))

  let sent    = 0
  let skipped = 0

  for (const user of users) {
    if (sentSet.has(user.id)) { skipped++; continue }
    // Recovery mode ativo = sem pressão
    if (user.recovery_week_active) { skipped++; continue }

    try {
      // Quantos hábitos ativos tem o usuário
      const { count: totalHabits } = await supabase
        .from('habits')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_active', true)

      if (!totalHabits || totalHabits === 0) { skipped++; continue }

      // Quantos já logou hoje
      const { count: doneHabits } = await supabase
        .from('habit_logs')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('logged_date', today)

      const done = doneHabits ?? 0
      const pending = totalHabits - done

      // Só notifica se fez ao menos 1 mas não todos, e há pelo menos 1 pendente
      if (done === 0 || pending === 0) { skipped++; continue }

      const firstName = (user.name as string).split(' ')[0] ?? 'você'
      const title = pending === 1
        ? `🔥 Falta só 1 hábito, ${firstName}!`
        : `⚡ Faltam ${pending} hábitos, ${firstName}!`
      const body = `Complete hoje e ganhe +200 XP de Dia Perfeito${user.streak_current > 0 ? ` + proteja seu streak de ${user.streak_current} dias` : ''}.`

      // Push
      const { data: subs } = await supabase
        .from('push_subscriptions')
        .select('id, endpoint, keys_p256dh, keys_auth')
        .eq('user_id', user.id)

      if (subs && subs.length > 0) {
        for (const sub of subs) {
          const result = await sendPushNotification(
            sub.endpoint, sub.keys_p256dh, sub.keys_auth,
            { title, body, url: '/habitos' }
          )
          if (result.gone) {
            await supabase.from('push_subscriptions').delete().eq('id', sub.id)
          }
        }
      }

      // Notificação in-app
      await supabase.from('notifications').insert({
        user_id:       user.id,
        type:          'perfect_day_reminder',
        title,
        body,
        action_url:    '/habitos',
        scheduled_for: new Date().toISOString(),
        sent_at:       new Date().toISOString(),
      })

      sent++
    } catch (err) {
      console.error(`perfect-day-reminder error for ${user.id}`, err)
    }
  }

  return NextResponse.json({ ok: true, sent, skipped })
}
