import { isCronAuthorized, cronUnauthorized } from '@/lib/cron-auth'
/**
 * Cron diário às 10:00 UTC (07:00 Brasília)
 * Envia emails automáticos para usuários em trial:
 * - D1: boas-vindas (criou conta há 1 dia)
 * - D5: urgência ("trial acaba em 2 dias")
 * - D6: último aviso ("acaba amanhã")
 */

import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendTrialEndingEmail, sendWelcomeEmail } from '@/lib/email'

export const maxDuration = 60

export async function GET() {
  if (!await isCronAuthorized()) return cronUnauthorized()
  const supabase = createServiceClient()
  const now = new Date()

  const results = { welcome: 0, ending: 0, errors: 0 }

  // D1 — boas-vindas: criaram conta ontem (trial_end é em ~6 dias)
  const d1Start = new Date(now)
  d1Start.setDate(d1Start.getDate() - 1)
  d1Start.setHours(0, 0, 0, 0)
  const d1End = new Date(d1Start)
  d1End.setHours(23, 59, 59, 999)

  // D5 — trial acaba em 2 dias (trial_end entre amanhã e depois)
  const d5Start = new Date(now)
  d5Start.setDate(d5Start.getDate() + 2)
  d5Start.setHours(0, 0, 0, 0)
  const d5End = new Date(d5Start)
  d5End.setHours(23, 59, 59, 999)

  // D6 — trial acaba amanhã
  const d6Start = new Date(now)
  d6Start.setDate(d6Start.getDate() + 1)
  d6Start.setHours(0, 0, 0, 0)
  const d6End = new Date(d6Start)
  d6End.setHours(23, 59, 59, 999)

  const [d1Users, d5Users, d6Users] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, name, email:id')
      .eq('subscription_status', 'trial')
      .gte('subscription_started_at', d1Start.toISOString())
      .lte('subscription_started_at', d1End.toISOString()),
    supabase
      .from('profiles')
      .select('id, name, email:id')
      .eq('subscription_status', 'trial')
      .gte('trial_end', d5Start.toISOString())
      .lte('trial_end', d5End.toISOString()),
    supabase
      .from('profiles')
      .select('id, name, email:id')
      .eq('subscription_status', 'trial')
      .gte('trial_end', d6Start.toISOString())
      .lte('trial_end', d6End.toISOString()),
  ])

  // Buscar emails dos usuários (auth.users — via service client)
  async function getUserEmail(userId: string): Promise<string | null> {
    const { data } = await supabase.auth.admin.getUserById(userId)
    return data?.user?.email ?? null
  }

  // D1 — boas-vindas
  for (const user of d1Users.data ?? []) {
    try {
      const email = await getUserEmail(user.id)
      if (email) {
        await sendWelcomeEmail(email, user.name ?? 'Atleta')
        results.welcome++
      }
    } catch (err) {
      console.error('trial email D1 error', user.id, err)
      results.errors++
    }
  }

  // D5 — acaba em 2 dias
  for (const user of d5Users.data ?? []) {
    try {
      const email = await getUserEmail(user.id)
      if (email) {
        await sendTrialEndingEmail(email, user.name ?? 'Atleta', 2)
        results.ending++
      }
    } catch (err) {
      console.error('trial email D5 error', user.id, err)
      results.errors++
    }
  }

  // D6 — acaba amanhã
  for (const user of d6Users.data ?? []) {
    try {
      const email = await getUserEmail(user.id)
      if (email) {
        await sendTrialEndingEmail(email, user.name ?? 'Atleta', 1)
        results.ending++
      }
    } catch (err) {
      console.error('trial email D6 error', user.id, err)
      results.errors++
    }
  }

  return NextResponse.json({ ok: true, ...results })
}
