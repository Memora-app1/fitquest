import { isCronAuthorized, cronUnauthorized } from '@/lib/cron-auth'
/**
 * Cron diário às 23:00 UTC (~20:00 Brasília)
 * Envia push notification para usuários com streak ativo que ainda não
 * registraram nenhuma atividade hoje — aviso de emergência antes da meia-noite.
 *
 * Evita duplicidade: só envia se não há notificação streak_alert
 * registrada hoje para o usuário.
 */

import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendPushNotification } from '@/lib/webpush'

export const maxDuration = 60

const TODAY = () => new Date().toISOString().split('T')[0]!

async function hadActivityToday(
  supabase: ReturnType<typeof createServiceClient>,
  userId: string
): Promise<boolean> {
  const today = TODAY()

  const [habits, workouts, tasks] = await Promise.all([
    supabase
      .from('habit_logs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('logged_date', today),
    supabase
      .from('workouts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('finished_at', `${today}T00:00:00`)
      .lte('finished_at', `${today}T23:59:59`),
    supabase
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'done')
      .gte('completed_at', `${today}T00:00:00`)
      .lte('completed_at', `${today}T23:59:59`),
  ])

  return (
    (habits.count ?? 0) > 0 ||
    (workouts.count ?? 0) > 0 ||
    (tasks.count ?? 0) > 0
  )
}

export async function GET() {
  if (!await isCronAuthorized()) return cronUnauthorized()
  const supabase = createServiceClient()
  const today = TODAY()

  // Usuários com streak ativo
  const { data: atRiskUsers } = await supabase
    .from('profiles')
    .select('id, name, streak_current')
    .gt('streak_current', 0)

  if (!atRiskUsers || atRiskUsers.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, skipped: 0 })
  }

  let sent = 0
  let skipped = 0

  for (const user of atRiskUsers) {
    try {
      // Verificar se já teve atividade hoje
      const hasActivity = await hadActivityToday(supabase, user.id)
      if (hasActivity) {
        skipped++
        continue
      }

      // Verificar se já enviamos alert hoje
      const { count: alreadySent } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('type', 'streak_alert')
        .gte('created_at', `${today}T00:00:00`)

      if ((alreadySent ?? 0) > 0) {
        skipped++
        continue
      }

      // Buscar dispositivos push
      const { data: subs } = await supabase
        .from('push_subscriptions')
        .select('endpoint, p256dh, auth')
        .eq('user_id', user.id)

      if (!subs || subs.length === 0) {
        skipped++
        continue
      }

      const streak = user.streak_current
      const title =
        streak >= 30
          ? `🔥 ${streak} dias de streak em perigo!`
          : streak >= 7
          ? `⚠️ Seu streak de ${streak} dias está em risco`
          : `⚠️ Registre uma atividade hoje`

      const body =
        streak >= 30
          ? `Faltam menos de 1h para meia-noite. Não perca ${streak} dias seguidos agora!`
          : streak >= 7
          ? `Seu streak de ${streak} dias acaba à meia-noite. Registre um hábito rápido!`
          : `Você tem um streak ativo. Registre algo antes da meia-noite para mantê-lo.`

      // Enviar para todos os devices do usuário
      const deadSubs: string[] = []
      for (const sub of subs) {
        const result = await sendPushNotification(
          sub.endpoint as string,
          sub.p256dh as string,
          sub.auth as string,
          {
            title,
            body,
            url: '/habitos',
          }
        )
        if (result.gone) deadSubs.push(sub.endpoint as string)
      }

      // Limpar subscriptions expiradas
      if (deadSubs.length > 0) {
        await supabase
          .from('push_subscriptions')
          .delete()
          .in('endpoint', deadSubs)
      }

      // Registrar notificação enviada (deduplicação)
      await supabase.from('notifications').insert({
        user_id: user.id,
        type: 'streak_alert',
        title,
        body,
        scheduled_for: new Date().toISOString(),
        sent_at: new Date().toISOString(),
      })

      sent++
    } catch (err) {
      console.error(`streak-alert error for ${user.id}:`, err)
    }
  }

  return NextResponse.json({
    ok: true,
    processed: atRiskUsers.length,
    sent,
    skipped,
  })
}
