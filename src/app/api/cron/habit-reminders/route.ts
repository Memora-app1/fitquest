import { isCronAuthorized, cronUnauthorized } from '@/lib/cron-auth'
/**
 * Cron horário — envia push de lembrete para hábitos com reminder_time na hora atual.
 * Horário de referência: America/Sao_Paulo (UTC-3, sem DST desde 2019).
 * Só envia se o hábito ainda não foi logado hoje.
 * Deduplicação: verifica notifications table antes de enviar.
 */

import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendPushNotification } from '@/lib/webpush'

export const maxDuration = 60

// Brasília é UTC-3 sem horário de verão desde 2019
const SP_OFFSET_HOURS = -3

function getSaoPauloHour(): number {
  const utcHour = new Date().getUTCHours()
  return ((utcHour + SP_OFFSET_HOURS) + 24) % 24
}

function getTodayBR(): string {
  const now = new Date()
  const utcMs = now.getTime()
  const spMs = utcMs + SP_OFFSET_HOURS * 3600000
  return new Date(spMs).toISOString().split('T')[0]!
}

export async function GET() {
  if (!await isCronAuthorized()) return cronUnauthorized()
  const supabase = createServiceClient()

  const currentHour = getSaoPauloHour()
  const today = getTodayBR()

  // Formato 'HH:00:00' — reminder_time é armazenado como TIME no PG
  const hourStr = String(currentHour).padStart(2, '0') + ':00:00'

  // Busca hábitos com lembrete na hora atual
  const { data: habits } = await supabase
    .from('habits')
    .select('id, user_id, name, icon')
    .eq('is_active', true)
    .eq('reminder_time', hourStr)

  if (!habits || habits.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, hour: currentHour })
  }

  // Para cada hábito, verifica se já foi logado hoje
  const habitIds = habits.map((h) => h.id)
  const { data: logsToday } = await supabase
    .from('habit_logs')
    .select('habit_id')
    .in('habit_id', habitIds)
    .eq('logged_date', today)

  const loggedSet = new Set((logsToday ?? []).map((l) => l.habit_id))

  // Filtra só hábitos não logados
  const toRemind = habits.filter((h) => !loggedSet.has(h.id))

  if (toRemind.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, skipped: habits.length })
  }

  // Agrupa por user_id para evitar múltiplos push no mesmo usuário
  const byUser: Record<string, Array<{ id: string; name: string; icon: string }>> = {}
  for (const h of toRemind) {
    const uid = h.user_id as string
    if (!byUser[uid]) byUser[uid] = []
    byUser[uid].push({ id: h.id, name: h.name as string, icon: h.icon as string })
  }

  let sent = 0
  let failed = 0

  for (const [userId, userHabits] of Object.entries(byUser)) {
    try {
      // Verifica deduplicação: já enviou lembrete de hábito hoje?
      const { data: alreadySent } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', userId)
        .eq('type', 'habit_reminder')
        .gte('created_at', `${today}T00:00:00`)
        .limit(1)

      if (alreadySent && alreadySent.length > 0) continue

      // Monta mensagem
      const habitNames = userHabits.map((h) => h.icon + ' ' + h.name).join(', ')
      const title = userHabits.length === 1
        ? `Hora do hábito: ${userHabits[0]!.icon} ${userHabits[0]!.name}`
        : `${userHabits.length} hábitos te esperam`
      const body = userHabits.length === 1
        ? 'Registre agora e mantenha seu streak!'
        : `${habitNames}. Não quebre sua sequência!`

      // Busca subscriptions do usuário
      const { data: subs } = await supabase
        .from('push_subscriptions')
        .select('id, endpoint, keys_p256dh, keys_auth')
        .eq('user_id', userId)

      if (subs && subs.length > 0) {
        for (const sub of subs) {
          const result = await sendPushNotification(
            sub.endpoint,
            sub.keys_p256dh,
            sub.keys_auth,
            { title, body, url: '/habitos' }
          )
          if (result.gone) {
            await supabase.from('push_subscriptions').delete().eq('id', sub.id)
          }
        }
      }

      // Registra no banco para deduplicação e histórico
      await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type: 'habit_reminder',
          title,
          body,
          action_url: '/habitos',
          scheduled_for: new Date().toISOString(),
          sent_at: new Date().toISOString(),
        })

      sent++
    } catch (err) {
      console.error(`habit reminder error for user ${userId}`, err)
      failed++
    }
  }

  return NextResponse.json({ ok: true, sent, failed, hour: currentHour, usersChecked: Object.keys(byUser).length })
}
