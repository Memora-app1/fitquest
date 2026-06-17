import type { Metadata } from 'next';
import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { todayString } from '@/lib/utils';
import { HabitsList } from '@/components/habitos/habits-list';
import { HabitHeatmap } from '@/components/habitos/habit-heatmap';
import { HabitStatsBreakdown } from '@/components/habitos/habit-stats-breakdown';
import { HabitCompletionCalendar } from '@/components/habitos/habit-completion-calendar';
import { HabitYearHeatmap } from '@/components/habitos/habit-year-heatmap';
import { HabitCorrelationMatrix } from '@/components/habitos/habit-correlation-matrix';
import { HabitTimeOfDayHeatmap } from '@/components/habitos/habit-time-of-day-heatmap';
import { HabitStreakRecords } from '@/components/habitos/habit-streak-records';
import { Flame, Target, Zap, Calendar, Star } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Hábitos',
  description:
    'Acompanhe seus hábitos diários, mantenha sua sequência e ganhe XP a cada dia consistente.',
};

export const dynamic = 'force-dynamic';

export default async function HabitosPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>;
}) {
  const { new: openNew } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const today = todayString();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]!;
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]!;

  const [habitsRes, logsRes, weekLogsRes, monthLogsRes, xpFromHabitsRes, profileRes] =
    await Promise.all([
      supabase
        .from('habits')
        .select(
          'id, user_id, name, description, icon, color, category, target_type, target_value, target_period, target_unit, frequency_per_week, reminder_time, xp_per_completion, display_order, is_active, created_at, updated_at'
        )
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('display_order')
        .limit(50),
      supabase
        .from('habit_logs')
        .select('habit_id, logged_date')
        .eq('user_id', user.id)
        .eq('logged_date', today)
        .limit(50),
      supabase
        .from('habit_logs')
        .select('habit_id, logged_date')
        .eq('user_id', user.id)
        .gte('logged_date', sevenDaysAgo)
        .limit(500),
      supabase
        .from('habit_logs')
        .select('habit_id, logged_date')
        .eq('user_id', user.id)
        .gte('logged_date', thirtyDaysAgo)
        .limit(2000),
      supabase
        .from('xp_transactions')
        .select('amount')
        .eq('user_id', user.id)
        .eq('source_type', 'habit')
        .gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString())
        .limit(2000),
      supabase.from('profiles').select('streak_current, perfect_days').eq('id', user.id).single(),
    ]);

  const habits = habitsRes.data ?? [];
  const monthLogs = monthLogsRes.data ?? [];
  const weekLogs = weekLogsRes.data ?? [];

  const loggedTodayCount = (logsRes.data ?? []).length;
  const totalHabits = habits.length;
  const todayCompletionRate =
    totalHabits > 0 ? Math.round((loggedTodayCount / totalHabits) * 100) : 0;

  const weekSlots = totalHabits * 7;
  const weekLogged = weekLogs.length;
  const weekRate = weekSlots > 0 ? Math.round((weekLogged / weekSlots) * 100) : 0;

  const xpLast30 = (xpFromHabitsRes.data ?? []).reduce((s, t) => s + (t.amount ?? 0), 0);

  const dayMap = new Map<string, Set<string>>();
  for (const log of monthLogs) {
    if (!dayMap.has(log.logged_date)) dayMap.set(log.logged_date, new Set());
    dayMap.get(log.logged_date)!.add(log.habit_id);
  }
  const perfectDaysMonth =
    totalHabits > 0
      ? Array.from(dayMap.values()).filter((s) => habits.every((h) => s.has(h.id))).length
      : 0;

  const profile = profileRes.data;
  const streak = profile?.streak_current ?? 0;
  const isPerfectToday = totalHabits > 0 && loggedTodayCount === totalHabits;

  // ── At-risk habit detection: não feito há 3+ dias ─────────────────
  const loggedTodaySet = new Set((logsRes.data ?? []).map((l) => l.habit_id));
  const lastLoggedMap = new Map<string, string>();
  for (const log of monthLogs) {
    const current = lastLoggedMap.get(log.habit_id);
    if (!current || log.logged_date > current) {
      lastLoggedMap.set(log.habit_id, log.logged_date);
    }
  }
  const atRiskHabits = habits
    .filter((h) => {
      if (loggedTodaySet.has(h.id)) return false;
      const last = lastLoggedMap.get(h.id);
      if (!last) return false; // hábito nunca logado = novo, não em risco
      const daysSince = Math.floor((Date.now() - new Date(last).getTime()) / 86400000);
      return daysSince >= 3;
    })
    .map((h) => ({
      id: h.id,
      name: h.name as string,
      icon: h.icon as string,
      daysSince: Math.floor(
        (Date.now() - new Date(lastLoggedMap.get(h.id)!).getTime()) / 86400000
      ),
    }));
  const atRiskIds = new Set(atRiskHabits.map((h) => h.id));

  // ── Adaptive difficulty: hábitos "dominados" (90%+ em 21+ dias) ───
  const DAYS_FOR_MASTERY = 21;
  const masteryThresholdDate = new Date(Date.now() - DAYS_FOR_MASTERY * 86400000)
    .toISOString()
    .split('T')[0]!;
  const masteredHabits = habits
    .filter((h) => {
      const logsInPeriod = monthLogs.filter(
        (l) => l.habit_id === h.id && l.logged_date >= masteryThresholdDate
      ).length;
      const rate = logsInPeriod / DAYS_FOR_MASTERY;
      const isMaxXp = (h.xp_per_completion as number) >= 100; // já no nível difícil
      return rate >= 0.9 && !isMaxXp;
    })
    .map((h) => ({ id: h.id, name: h.name as string, icon: h.icon as string }));

  // Today's accent color based on completion
  const todayAccent =
    todayCompletionRate === 100 ? '#00FF88' : todayCompletionRate >= 50 ? '#F5C842' : '#FF4D00';

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
        {/* ── Hero Header ─────────────────────────────────────────────── */}
        <div
          className="relative overflow-hidden rounded-2xl p-6"
          style={{
            background: isPerfectToday
              ? 'linear-gradient(135deg, rgba(0,255,136,0.1) 0%, rgba(13,24,41,0.98) 60%, rgba(245,200,66,0.05) 100%)'
              : 'linear-gradient(135deg, rgba(255,77,0,0.08) 0%, rgba(13,24,41,0.98) 60%, rgba(124,58,237,0.05) 100%)',
            border: `1px solid ${isPerfectToday ? 'rgba(0,255,136,0.2)' : 'rgba(255,77,0,0.2)'}`,
          }}
        >
          <div
            className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full"
            style={{
              background: `radial-gradient(circle, ${isPerfectToday ? 'rgba(0,255,136,0.12)' : 'rgba(255,77,0,0.12)'} 0%, transparent 70%)`,
            }}
          />
          <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="heading-display text-4xl md:text-5xl">Hábitos</h1>
              <p className="mt-1 text-text-secondary">
                {totalHabits > 0
                  ? isPerfectToday
                    ? '⭐ Dia perfeito — todos os hábitos completos!'
                    : `${loggedTodayCount}/${totalHabits} completos hoje · ${weekRate}% essa semana`
                  : 'Sua rotina vira sua identidade.'}
              </p>
            </div>

            {streak > 0 && (
              <div
                className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold"
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
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {/* Today */}
            <div
              className="relative overflow-hidden rounded-2xl p-4"
              style={{
                background: `linear-gradient(135deg, ${todayAccent}10 0%, rgba(13,24,41,0.98) 100%)`,
                border: `1px solid ${todayAccent}25`,
              }}
            >
              <div
                className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full blur-xl"
                style={{ backgroundColor: todayAccent, opacity: 0.2 }}
              />
              <div className="relative z-10">
                <div className="mb-2 flex items-center gap-1.5">
                  <Target size={13} style={{ color: todayAccent }} />
                  <span className="text-xs uppercase tracking-wider text-text-muted">Hoje</span>
                </div>
                <div className="heading-display text-2xl" style={{ color: todayAccent }}>
                  {todayCompletionRate}%
                </div>
                <div className="mt-0.5 text-xs text-text-muted">
                  {loggedTodayCount}/{totalHabits} hábitos
                </div>
                <div
                  className="mt-2 h-1.5 overflow-hidden rounded-full"
                  style={{ background: 'rgba(255,255,255,0.06)' }}
                >
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
              className="relative overflow-hidden rounded-2xl p-4"
              style={{
                background:
                  'linear-gradient(135deg, rgba(124,58,237,0.08) 0%, rgba(13,24,41,0.98) 100%)',
                border: '1px solid rgba(124,58,237,0.2)',
              }}
            >
              <div
                className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full blur-xl"
                style={{ background: 'rgba(124,58,237,0.2)' }}
              />
              <div className="relative z-10">
                <div className="mb-2 flex items-center gap-1.5">
                  <Calendar size={13} className="text-brand-purple" />
                  <span className="text-xs uppercase tracking-wider text-text-muted">Semana</span>
                </div>
                <div className="heading-display text-2xl text-brand-purple">{weekRate}%</div>
                <div className="mt-0.5 text-xs text-text-muted">taxa de conclusão</div>
                <div
                  className="mt-2 h-1.5 overflow-hidden rounded-full"
                  style={{ background: 'rgba(255,255,255,0.06)' }}
                >
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
              className="relative overflow-hidden rounded-2xl p-4"
              style={{
                background:
                  streak >= 7
                    ? 'linear-gradient(135deg, rgba(255,77,0,0.1) 0%, rgba(13,24,41,0.98) 100%)'
                    : 'linear-gradient(135deg, rgba(239,68,68,0.06) 0%, rgba(13,24,41,0.98) 100%)',
                border:
                  streak >= 7 ? '1px solid rgba(255,77,0,0.25)' : '1px solid rgba(239,68,68,0.2)',
              }}
            >
              <div
                className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full blur-xl"
                style={{
                  background: streak >= 7 ? 'rgba(255,77,0,0.2)' : 'rgba(239,68,68,0.15)',
                }}
              />
              <div className="relative z-10">
                <div className="mb-2 flex items-center gap-1.5">
                  <Flame
                    size={13}
                    className={streak >= 7 ? 'text-brand-orange' : 'text-brand-red'}
                    fill="currentColor"
                  />
                  <span className="text-xs uppercase tracking-wider text-text-muted">Streak</span>
                </div>
                <div
                  className={`heading-display text-2xl ${streak >= 7 ? 'text-brand-orange' : 'text-brand-red'}`}
                >
                  {streak}
                </div>
                <div className="mt-0.5 text-xs text-text-muted">
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
              className="relative overflow-hidden rounded-2xl p-4"
              style={{
                background:
                  'linear-gradient(135deg, rgba(245,200,66,0.08) 0%, rgba(13,24,41,0.98) 100%)',
                border: '1px solid rgba(245,200,66,0.2)',
              }}
            >
              <div
                className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full blur-xl"
                style={{ background: 'rgba(245,200,66,0.2)' }}
              />
              <div className="relative z-10">
                <div className="mb-2 flex items-center gap-1.5">
                  <Zap size={13} className="text-brand-gold" fill="currentColor" />
                  <span className="text-xs uppercase tracking-wider text-text-muted">XP (30d)</span>
                </div>
                <div className="heading-display text-2xl text-brand-gold">
                  +{xpLast30.toLocaleString('pt-BR')}
                </div>
                <div className="mt-0.5 flex items-center gap-1 text-xs text-text-muted">
                  <Star size={10} className="text-brand-gold" fill="currentColor" />
                  {perfectDaysMonth} dias perfeitos
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Heavy analytics — stream independently.
            lazy-section = content-visibility:auto → browser pula layout/paint
            de seções off-screen, reduzindo LCP ~20-40% no mobile. */}
        <div className="lazy-section-tall">
          <Suspense fallback={<div className="shimmer h-48 rounded-2xl" />}>
            <HabitHeatmap
              userId={user.id}
              habits={habits.map((h) => ({ id: h.id, name: h.name, icon: h.icon, color: h.color }))}
            />
          </Suspense>
        </div>

        <div className="lazy-section-tall">
          <Suspense fallback={<div className="shimmer h-64 rounded-2xl" />}>
            <HabitStatsBreakdown userId={user.id} />
          </Suspense>
        </div>

        <div className="lazy-section-tall">
          <Suspense fallback={<div className="shimmer h-56 rounded-2xl" />}>
            <HabitCompletionCalendar userId={user.id} />
          </Suspense>
        </div>

        <div className="lazy-section">
          <Suspense fallback={<div className="shimmer h-40 rounded-2xl" />}>
            <HabitYearHeatmap userId={user.id} />
          </Suspense>
        </div>

        <div className="lazy-section-tall">
          <Suspense fallback={<div className="shimmer h-64 rounded-2xl" />}>
            <HabitCorrelationMatrix userId={user.id} />
          </Suspense>
        </div>

        <div className="lazy-section">
          <Suspense fallback={<div className="shimmer h-48 rounded-2xl" />}>
            <HabitTimeOfDayHeatmap userId={user.id} />
          </Suspense>
        </div>

        <div className="lazy-section">
          <Suspense fallback={<div className="shimmer h-48 rounded-2xl" />}>
            <HabitStreakRecords userId={user.id} />
          </Suspense>
        </div>

        {/* ── At-risk habits banner ───────────────────────────────────── */}
        {atRiskHabits.length > 0 && (
          <div
            className="rounded-2xl p-4"
            style={{
              background: 'linear-gradient(135deg, rgba(245,200,66,0.07) 0%, rgba(13,24,41,0.98) 100%)',
              border: '1px solid rgba(245,200,66,0.2)',
            }}
          >
            <div className="mb-3 flex items-center gap-2">
              <span className="text-base">⚠️</span>
              <span className="text-sm font-bold text-brand-gold">
                {atRiskHabits.length === 1
                  ? '1 hábito em risco de abandono'
                  : `${atRiskHabits.length} hábitos em risco de abandono`}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {atRiskHabits.map((h) => (
                <div
                  key={h.id}
                  className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold"
                  style={{
                    background: 'rgba(245,200,66,0.1)',
                    border: '1px solid rgba(245,200,66,0.2)',
                    color: '#F5C842',
                  }}
                >
                  <span>{h.icon}</span>
                  <span>{h.name}</span>
                  <span className="text-text-muted">· {h.daysSince}d</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-text-muted">
              Complete esses hábitos hoje para manter a consistência e não perder o progresso.
            </p>
          </div>
        )}

        {/* ── Mastered habits — suggest upgrading difficulty ──────────── */}
        {masteredHabits.length > 0 && (
          <div
            className="rounded-2xl p-4"
            style={{
              background: 'linear-gradient(135deg, rgba(0,255,136,0.06) 0%, rgba(13,24,41,0.98) 100%)',
              border: '1px solid rgba(0,255,136,0.2)',
            }}
          >
            <div className="mb-2 flex items-center gap-2">
              <span className="text-base">🏅</span>
              <span className="text-sm font-bold text-brand-green">
                {masteredHabits.length === 1
                  ? '1 hábito dominado — hora de subir o nível!'
                  : `${masteredHabits.length} hábitos dominados — hora de subir o nível!`}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {masteredHabits.map((h) => (
                <div
                  key={h.id}
                  className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold"
                  style={{
                    background: 'rgba(0,255,136,0.08)',
                    border: '1px solid rgba(0,255,136,0.2)',
                    color: '#00FF88',
                  }}
                >
                  <span>{h.icon}</span>
                  <span>{h.name}</span>
                  <span className="text-text-muted">· 90%+</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-text-muted">
              Você está dominando esses hábitos. Edite-os para aumentar a dificuldade e ganhar mais XP.
            </p>
          </div>
        )}

        <HabitsList
          habits={habits}
          loggedToday={new Set((logsRes.data ?? []).map((l) => l.habit_id))}
          weekLogs={monthLogs}
          initialShowCreate={openNew === '1'}
          atRiskIds={atRiskIds}
        />
      </div>
    </AppShell>
  );
}
