/**
 * Cron toda segunda-feira às 09:00 UTC (~06:00 Brasília)
 * Envia email de resumo semanal para todos os usuários ativos
 * com assinatura ativa (trial|active|lifetime).
 */

import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendWeeklyDigest, type WeeklyDigestStats } from '@/lib/email'

export const maxDuration = 120

const SOURCE_LABELS: Record<string, { label: string; emoji: string }> = {
  habit:       { label: 'Hábitos',    emoji: '🎯' },
  workout:     { label: 'Treinos',    emoji: '💪' },
  task:        { label: 'Tarefas',    emoji: '✅' },
  health:      { label: 'Saúde',      emoji: '💧' },
  transaction: { label: 'Finanças',   emoji: '💰' },
  streak:      { label: 'Streak',     emoji: '🔥' },
  achievement: { label: 'Conquistas', emoji: '🏆' },
  goal:        { label: 'Metas',      emoji: '🎯' },
  bonus:       { label: 'Bônus',      emoji: '⭐' },
}

export async function GET() {
  const supabase = createServiceClient()

  // 7 dias atrás
  const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000)
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0]!
  const today = new Date().toISOString().split('T')[0]!

  // Usuários elegíveis: assinatura ativa ou trial, com email
  const { data: users } = await supabase
    .from('profiles')
    .select('id, name, xp_total, level, streak_current, streak_longest, perfect_days')
    .in('subscription_status', ['trial', 'active', 'lifetime'])

  if (!users || users.length === 0) {
    return NextResponse.json({ ok: true, sent: 0 })
  }

  // Buscar emails via auth (service role)
  const { data: authUsers } = await supabase.auth.admin.listUsers()
  const emailMap = new Map<string, string>()
  for (const u of authUsers?.users ?? []) {
    if (u.email) emailMap.set(u.id, u.email)
  }

  let sent = 0
  let errors = 0

  for (const user of users) {
    const email = emailMap.get(user.id)
    if (!email) continue

    try {
      // XP desta semana
      const { data: weekXp } = await supabase
        .from('xp_transactions')
        .select('amount, source_type')
        .eq('user_id', user.id)
        .gte('created_at', sevenDaysAgo.toISOString())

      const xpThisWeek = (weekXp ?? []).reduce((s, t) => s + ((t.amount as number) ?? 0), 0)

      // Breakdown por fonte
      const bySource: Record<string, number> = {}
      for (const tx of weekXp ?? []) {
        const src = (tx.source_type as string) ?? 'bonus'
        bySource[src] = (bySource[src] ?? 0) + ((tx.amount as number) ?? 0)
      }
      const topSources = Object.entries(bySource)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([src, xp]) => {
          const cfg = SOURCE_LABELS[src] ?? { label: 'Outros', emoji: '✨' }
          return { label: cfg.label, emoji: cfg.emoji, xp }
        })

      // Hábitos completados esta semana
      const { count: habitsCompleted } = await supabase
        .from('habit_logs')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('logged_date', sevenDaysAgoStr)
        .lte('logged_date', today)

      // Hábitos ativos × 7 dias = target
      const { count: activeHabits } = await supabase
        .from('habits')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_active', true)

      const habitsTarget = (activeHabits ?? 0) * 7

      // Tarefas concluídas esta semana
      const { count: tasksCompleted } = await supabase
        .from('tasks')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'done')
        .gte('completed_at', sevenDaysAgo.toISOString())

      const stats: WeeklyDigestStats = {
        streakCurrent: user.streak_current,
        streakLongest: user.streak_longest,
        xpThisWeek,
        xpTotal: user.xp_total,
        level: user.level,
        habitsCompletedThisWeek: habitsCompleted ?? 0,
        habitsTarget,
        tasksCompletedThisWeek: tasksCompleted ?? 0,
        perfectDays: user.perfect_days,
        topSources,
      }

      await sendWeeklyDigest(email, user.name, stats)
      sent++
    } catch (err) {
      console.error(`weekly-digest error for ${user.id}:`, err)
      errors++
    }
  }

  return NextResponse.json({
    ok: true,
    processed: users.length,
    sent,
    errors,
  })
}
