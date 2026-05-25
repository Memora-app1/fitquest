import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components/layout/app-shell'
import { todayString } from '@/lib/utils'
import { HabitsList } from '@/components/habitos/habits-list'
import { Flame, Target, Zap, Calendar, Star } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Hábitos',
  description: 'Acompanhe seus hábitos diários, mantenha sua sequência e ganhe XP a cada dia consistente.',
}

export const dynamic = 'force-dynamic'

export default async function HabitosPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>
}) {
  const { new: openNew } = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const today = todayString()
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]!
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]!

  const [habitsRes, logsRes, weekLogsRes, monthLogsRes, xpFromHabitsRes, profileRes] = await Promise.all([
    supabase
      .from('habits')
      .select(
        'id, user_id, name, description, icon, color, category, target_type, target_value, target_period, target_unit, frequency_per_week, reminder_time, xp_per_completion, display_order, is_active, created_at, updated_at',
      )
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('display_order'),
    supabase
      .from('habit_logs')
      .select('habit_id, logged_date')
      .eq('user_id', user.id)
      .eq('logged_date', today),
    supabase
      .from('habit_logs')
      .select('habit_id, logged_date')
      .eq('user_id', user.id)
      .gte('logged_date', sevenDaysAgo),
    supabase
      .from('habit_logs')
      .select('habit_id, logged_date')
      .eq('user_id', user.id)
      .gte('logged_date', thirtyDaysAgo),
    supabase
      .from('xp_transactions')
      .select('amount')
      .eq('user_id', user.id)
      .eq('source_type', 'habit')
      .gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString()),
    supabase
      .from('profiles')
      .select('streak_current, perfect_days')
      .eq('id', user.id)
      .single(),
  ])

  const habits = habitsRes.data ?? []
  const monthLogs = monthLogsRes.data ?? []
  const weekLogs = weekLogsRes.data ?? []

  const loggedTodayCount = (logsRes.data ?? []).length
  const totalHabits = habits.length
  const todayCompletionRate = totalHabits > 0 ? Math.round((loggedTodayCount / totalHabits) * 100) : 0

  const weekSlots = totalHabits * 7
  const weekLogged = weekLogs.length
  const weekRate = weekSlots > 0 ? Math.round((weekLogged / weekSlots) * 100) : 0

  const xpLast30 = (xpFromHabitsRes.data ?? []).reduce((s, t) => s + (t.amount ?? 0), 0)

  const dayMap = new Map<string, Set<string>>()
  for (const log of monthLogs) {
    if (!dayMap.has(log.logged_date)) dayMap.set(log.logged_date, new Set())
    dayMap.get(log.logged_date)!.add(log.habit_id)
  }
  const perfectDaysMonth =
    totalHabits > 0
      ? Array.from(dayMap.values()).filter((s) => habits.every((h) => s.has(h.id))).length
      : 0

  const profile = profileRes.data
  const streak = profile?.streak_current ?? 0
  const isPerfectToday = totalHabits > 0 && loggedTodayCount === totalHabits

  // Today's accent color based on completion
  const todayAccent =
    todayCompletionRate === 100
      ? '#00FF88'
      : todayCompletionRate >= 50
      ? '#F5C842'
      : '#FF4D00'

  return (
    <AppShell>
      <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">

        {/* ── Hero Header ─────────────────────────────────────────────── */}
        <div
          className="rounded-2xl p-6 relative overflow-hidden"
          style={{
            background: isPerfectToday
              ? 'linear-gradient(135deg, rgba(0,255,136,0.1) 0%, rgba(13,24,41,0.98) 60%, rgba(245,200,66,0.05) 100%)'
              : 'linear-gradient(135deg, rgba(255,77,0,0.08) 0%, rgba(13,24,41,0.98) 60%, rgba(124,58,237,0.05) 100%)',
            border: `1px solid ${isPerfectToday ? 'rgba(0,255,136,0.2)' : 'rgba(255,77,0,0.2)'}`,
          }}
        >
          <div
            className="absolute -top-8 -right-8 w-40 h-40 rounded-full pointer-events-none"
            style={{
              background: `radial-gradient(circle, ${isPerfectToday ? 'rgba(0,255,136,0.12)' : 'rgba(255,77,0,0.12)'} 0%, transparent 70%)`,
            }}
          />
          <div className="relative z-10 flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="heading-display text-4xl md:text-5xl">Hábitos</h1>
              <p className="text-text-secondary mt-1">
                {totalHabits > 0
                  ? isPerfectToday
                    ? '⭐ Dia perfeito — todos os hábitos completos!'
                    : `${loggedTodayCount}/${totalHabits} completos hoje · ${weekRate}% essa semana`
                  : 'Sua rotina vira sua identidade.'}
              </p>
            </div>

            {streak > 0 && (
              <div
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold"
                style={{
                  background: streak >= 7 ? 'rgba(255,77,0,0.15)' : 'rgba(255,255,255,0.06)',
                  border: `1px solid ${streak >= 7 ? 'rgba(255,77,0,0.4)' : 'rgba(255,255,255,0.08)'}`,
                  color: streak >= 7 ? '#FF4D00' : '#8899BB',
                }}
              >
                <Flame size={16} fill="currentColor" />
                {streak} dias de streak
              </div>
            )}
          </div>
        </div>

        {/* ── Stats ───────────────────────────────────────────────────── */}
        {totalHabits > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Today */}
            <div
              className="rounded-2xl p-4 relative overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${todayAccent}10 0%, rgba(13,24,41,0.98) 100%)`,
                border: `1px solid ${todayAccent}25`,
              }}
            >
              <div
                className="absolute -top-4 -right-4 w-16 h-16 rounded-full pointer-events-none blur-xl"
                style={{ backgroundColor: todayAccent, opacity: 0.2 }}
              />
              <div className="relative z-10">
                <div className="flex items-center gap-1.5 mb-2">
                  <Target size={13} style={{ color: todayAccent }} />
                  <span className="text-xs text-text-muted uppercase tracking-wider">Hoje</span>
                </div>
                <div className="heading-display text-2xl" style={{ color: todayAccent }}>
                  {todayCompletionRate}%
                </div>
                <div className="text-xs text-text-muted mt-0.5">
                  {loggedTodayCount}/{totalHabits} hábitos
                </div>
                <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${todayCompletionRate}%`,
                      backgroundColor: todayAccent,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Week */}
            <div
              className="rounded-2xl p-4 relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(124,58,237,0.08) 0%, rgba(13,24,41,0.98) 100%)',
                border: '1px solid rgba(124,58,237,0.2)',
              }}
            >
              <div
                className="absolute -top-4 -right-4 w-16 h-16 rounded-full pointer-events-none blur-xl"
                style={{ background: 'rgba(124,58,237,0.2)' }}
              />
              <div className="relative z-10">
                <div className="flex items-center gap-1.5 mb-2">
                  <Calendar size={13} className="text-brand-purple" />
                  <span className="text-xs text-text-muted uppercase tracking-wider">Semana</span>
                </div>
                <div className="heading-display text-2xl text-brand-purple">{weekRate}%</div>
                <div className="text-xs text-text-muted mt-0.5">taxa de conclusão</div>
                <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${weekRate}%`,
                      background: 'linear-gradient(90deg, #7C3AED, #9F5AF7)',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Streak */}
            <div
              className="rounded-2xl p-4 relative overflow-hidden"
              style={{
                background:
                  streak >= 7
                    ? 'linear-gradient(135deg, rgba(255,77,0,0.1) 0%, rgba(13,24,41,0.98) 100%)'
                    : 'linear-gradient(135deg, rgba(239,68,68,0.06) 0%, rgba(13,24,41,0.98) 100%)',
                border: streak >= 7 ? '1px solid rgba(255,77,0,0.25)' : '1px solid rgba(239,68,68,0.2)',
              }}
            >
              <div
                className="absolute -top-4 -right-4 w-16 h-16 rounded-full pointer-events-none blur-xl"
                style={{
                  background: streak >= 7 ? 'rgba(255,77,0,0.2)' : 'rgba(239,68,68,0.15)',
                }}
              />
              <div className="relative z-10">
                <div className="flex items-center gap-1.5 mb-2">
                  <Flame size={13} className={streak >= 7 ? 'text-brand-orange' : 'text-brand-red'} fill="currentColor" />
                  <span className="text-xs text-text-muted uppercase tracking-wider">Streak</span>
                </div>
                <div className={`heading-display text-2xl ${streak >= 7 ? 'text-brand-orange' : 'text-brand-red'}`}>
                  {streak}
                </div>
                <div className="text-xs text-text-muted mt-0.5">
                  {streak === 0
                    ? 'Comece hoje'
                    : streak === 1
                    ? 'Primeiro dia!'
                    : streak >= 30
                    ? '🔥 Incrível!'
                    : 'dias em sequência'}
                </div>
              </div>
            </div>

            {/* XP + perfect days */}
            <div
              className="rounded-2xl p-4 relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(245,200,66,0.08) 0%, rgba(13,24,41,0.98) 100%)',
                border: '1px solid rgba(245,200,66,0.2)',
              }}
            >
              <div
                className="absolute -top-4 -right-4 w-16 h-16 rounded-full pointer-events-none blur-xl"
                style={{ background: 'rgba(245,200,66,0.2)' }}
              />
              <div className="relative z-10">
                <div className="flex items-center gap-1.5 mb-2">
                  <Zap size={13} className="text-brand-gold" fill="currentColor" />
                  <span className="text-xs text-text-muted uppercase tracking-wider">XP (30d)</span>
                </div>
                <div className="heading-display text-2xl text-brand-gold">
                  +{xpLast30.toLocaleString('pt-BR')}
                </div>
                <div className="text-xs text-text-muted mt-0.5 flex items-center gap-1">
                  <Star size={10} className="text-brand-gold" fill="currentColor" />
                  {perfectDaysMonth} dias perfeitos
                </div>
              </div>
            </div>
          </div>
        )}

        <HabitsList
          habits={habits}
          loggedToday={new Set((logsRes.data ?? []).map((l) => l.habit_id))}
          weekLogs={monthLogs}
          initialShowCreate={openNew === '1'}
        />
      </div>
    </AppShell>
  )
}
