import { isCronAuthorized, cronUnauthorized } from '@/lib/cron-auth'
/**
 * Cron diário às 00:00 UTC (~21:00 Brasília)
 * Envia push de resumo do dia para usuários que tiveram atividade hoje.
 * Celebra o progresso do dia antes de dormir — momento ideal para retenção.
 *
 * Deduplicação: tipo 'daily_recap' com sent_at de hoje.
 */

import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendPushNotification } from '@/lib/webpush'

export const maxDuration = 120

export async function GET() {
  if (!await isCronAuthorized()) return cronUnauthorized()

  const supabase = createServiceClient()
  const today = new Date().toISOString().split('T')[0]!

  // Usuários ativos
  const { data: users } = await supabase
    .from('profiles')
    .select('id, name, streak_current')
    .in('subscription_status', ['trial', 'active', 'lifetime'])

  if (!users || users.length === 0) {
    return NextResponse.json({ ok: true, sent: 0 })
  }

  // Verificar quais já receberam recap hoje
  const { data: alreadySentList } = await supabase
    .from('notifications')
    .select('user_id')
    .eq('type', 'daily_recap')
    .gte('created_at', `${today}T00:00:00`)

  const alreadySentSet = new Set((alreadySentList ?? []).map(n => n.user_id as string))

  let sent = 0
  let skipped = 0

  for (const user of users) {
    if (alreadySentSet.has(user.id)) { skipped++; continue }

    try {
      // Busca atividade do dia em paralelo
      const [habitLogs, xpToday, workouts] = await Promise.all([
        supabase
          .from('habit_logs')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('logged_date', today),
        supabase
          .from('xp_transactions')
          .select('amount')
          .eq('user_id', user.id)
          .gte('created_at', `${today}T00:00:00`),
        supabase
          .from('workouts')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', `${today}T00:00:00`),
      ])

      const habitCount = habitLogs.count ?? 0
      const xpEarned = (xpToday.data ?? []).reduce((s, t) => s + ((t.amount as number) ?? 0), 0)
      const workoutCount = workouts.count ?? 0

      // Só envia se teve alguma atividade
      if (habitCount === 0 && xpEarned === 0 && workoutCount === 0) {
        skipped++
        continue
      }

      const firstName = user.name.split(' ')[0] ?? user.name
      const streak = user.streak_current

      // Constrói mensagem contextual
      let title = ''
      let body = ''

      if (xpEarned >= 500) {
        title = `⚡ Dia épico, ${firstName}!`
        body = `+${xpEarned.toLocaleString('pt-BR')} XP hoje`
      } else if (habitCount >= 3) {
        title = `🎯 ${habitCount} hábitos hoje, ${firstName}!`
        body = xpEarned > 0 ? `+${xpEarned.toLocaleString('pt-BR')} XP ganhos` : 'Consistência é a chave.'
      } else if (workoutCount > 0) {
        title = `💪 Treino feito, ${firstName}!`
        body = `+${xpEarned.toLocaleString('pt-BR')} XP · ${streak > 0 ? `${streak} dias de streak 🔥` : 'Continue amanhã!'}`
      } else {
        title = `✅ Progresso de hoje, ${firstName}`
        body = xpEarned > 0
          ? `+${xpEarned.toLocaleString('pt-BR')} XP${streak > 0 ? ` · streak ${streak} dias 🔥` : ''}`
          : 'Cada passo conta. Até amanhã!'
      }

      // Adiciona streak se for alto
      if (streak >= 7 && !body.includes('streak')) {
        body += ` · 🔥 ${streak} dias`
      }

      // Busca push subscriptions
      const { data: subs } = await supabase
        .from('push_subscriptions')
        .select('id, endpoint, keys_p256dh, keys_auth')
        .eq('user_id', user.id)

      if (!subs || subs.length === 0) { skipped++; continue }

      for (const sub of subs) {
        const result = await sendPushNotification(
          sub.endpoint, sub.keys_p256dh, sub.keys_auth,
          { title, body, url: '/dashboard' }
        )
        if (result.gone) await supabase.from('push_subscriptions').delete().eq('id', sub.id)
      }

      // Registra para deduplicação
      await supabase.from('notifications').insert({
        user_id: user.id,
        type: 'daily_recap',
        title,
        body,
        action_url: '/dashboard',
        scheduled_for: new Date().toISOString(),
        sent_at: new Date().toISOString(),
      })

      sent++
    } catch (err) {
      console.error(`daily-recap error for ${user.id}:`, err)
    }
  }

  return NextResponse.json({ ok: true, processed: users.length, sent, skipped })
}
