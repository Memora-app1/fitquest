/**
 * Cron diário às 09:00 UTC (~06:00 Brasília)
 * Envia push notification para metas com prazo nos próximos 7 dias
 * ou metas financeiras próximas de atingir a meta.
 * Deduplicação via notifications table.
 */

import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendPushNotification } from '@/lib/webpush'

export const maxDuration = 60

function getDaysBetween(a: Date, b: Date): number {
  return Math.ceil((b.getTime() - a.getTime()) / 86400000)
}

export async function GET() {
  const supabase = createServiceClient()

  const now = new Date()
  const today = now.toISOString().split('T')[0]!
  const in7Days = new Date(now.getTime() + 7 * 86400000).toISOString().split('T')[0]!

  // Busca metas ativas com deadline nos próximos 7 dias
  const { data: goalsWithDeadline } = await supabase
    .from('goals')
    .select('id, user_id, title, icon, deadline, current_value, target_value, unit')
    .eq('status', 'active')
    .not('deadline', 'is', null)
    .gte('deadline', today)
    .lte('deadline', in7Days)

  // Busca metas financeiras ativas com progresso >= 80%
  const { data: financeGoals } = await supabase
    .from('finance_goals')
    .select('id, user_id, title, icon, current_amount, target_amount, deadline')
    .eq('status', 'active')

  const nearlyCompleteFinance = (financeGoals ?? []).filter((g) => {
    const pct = g.target_amount > 0 ? (g.current_amount / g.target_amount) : 0
    return pct >= 0.8 && pct < 1
  })

  let sent = 0
  let failed = 0

  // ── Metas pessoais com prazo próximo ─────────────────────────────
  for (const goal of goalsWithDeadline ?? []) {
    const userId = goal.user_id as string
    const deadline = new Date(goal.deadline + 'T12:00:00')
    const daysLeft = getDaysBetween(now, deadline)

    try {
      // Deduplica: 1 notificação por meta por semana
      const { data: already } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', userId)
        .eq('type', 'task_reminder')
        .eq('source_id', goal.id)
        .gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString())
        .limit(1)

      if (already && already.length > 0) continue

      const pct = goal.target_value > 0 ? Math.round((goal.current_value / goal.target_value) * 100) : 0

      const title = daysLeft === 0
        ? `Meta vence HOJE: ${goal.icon ?? '🎯'} ${goal.title}`
        : daysLeft === 1
        ? `Meta vence AMANHÃ: ${goal.icon ?? '🎯'} ${goal.title}`
        : `${daysLeft} dias para a meta: ${goal.icon ?? '🎯'} ${goal.title}`

      const body = `${pct}% concluído (${goal.current_value}/${goal.target_value} ${goal.unit}). ${
        pct >= 80 ? 'Você está quase lá!' : 'Acelere para atingir o prazo!'
      }`

      const { data: subs } = await supabase
        .from('push_subscriptions')
        .select('id, endpoint, keys_p256dh, keys_auth')
        .eq('user_id', userId)

      if (subs && subs.length > 0) {
        for (const sub of subs) {
          const result = await sendPushNotification(
            sub.endpoint, sub.keys_p256dh, sub.keys_auth,
            { title, body, url: '/metas' }
          )
          if (result.gone) await supabase.from('push_subscriptions').delete().eq('id', sub.id)
        }
      }

      await supabase.from('notifications').insert({
        user_id: userId,
        type: 'task_reminder',
        title,
        body,
        source_id: goal.id,
        action_url: '/metas',
        scheduled_for: new Date().toISOString(),
        sent_at: new Date().toISOString(),
      })

      sent++
    } catch (err) {
      console.error(`goal-reminder error for goal ${goal.id}`, err)
      failed++
    }
  }

  // ── Metas financeiras quase atingidas ────────────────────────────
  for (const goal of nearlyCompleteFinance) {
    const userId = goal.user_id as string
    const pct = Math.round((goal.current_amount / goal.target_amount) * 100)

    try {
      const { data: already } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', userId)
        .eq('type', 'finance_due')
        .eq('source_id', goal.id)
        .gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString())
        .limit(1)

      if (already && already.length > 0) continue

      const remaining = goal.target_amount - goal.current_amount
      const title = `${pct}% da meta: ${goal.icon ?? '💰'} ${goal.title}`
      const body = `Faltam apenas R$ ${remaining.toFixed(2).replace('.', ',')} para você atingir o objetivo!`

      const { data: subs } = await supabase
        .from('push_subscriptions')
        .select('id, endpoint, keys_p256dh, keys_auth')
        .eq('user_id', userId)

      if (subs && subs.length > 0) {
        for (const sub of subs) {
          const result = await sendPushNotification(
            sub.endpoint, sub.keys_p256dh, sub.keys_auth,
            { title, body, url: '/financas/metas' }
          )
          if (result.gone) await supabase.from('push_subscriptions').delete().eq('id', sub.id)
        }
      }

      await supabase.from('notifications').insert({
        user_id: userId,
        type: 'finance_due',
        title,
        body,
        source_id: goal.id,
        action_url: '/financas/metas',
        scheduled_for: new Date().toISOString(),
        sent_at: new Date().toISOString(),
      })

      sent++
    } catch (err) {
      console.error(`goal-reminder error for finance goal ${goal.id}`, err)
      failed++
    }
  }

  return NextResponse.json({
    ok: true,
    sent,
    failed,
    goalsChecked: (goalsWithDeadline ?? []).length,
    financeGoalsChecked: nearlyCompleteFinance.length,
  })
}
