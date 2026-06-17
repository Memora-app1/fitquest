import type { Metadata } from 'next';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { todayString } from '@/lib/utils';
import { AppShell } from '@/components/layout/app-shell';
import { WaterTracker } from '@/components/saude/water-tracker';
import { SleepTracker } from '@/components/saude/sleep-tracker';
import { RecoveryScore } from '@/components/saude/recovery-score';
import { HealthRings } from '@/components/saude/health-rings';
import { HealthTrend } from '@/components/saude/health-trend';
import { MoodCheckin } from '@/components/saude/mood-checkin';
import { HealthStreak } from '@/components/saude/health-streak';
import type { MoodLog } from '@/lib/supabase/types';
import { Droplets, Moon, TrendingUp, Trophy, Heart } from 'lucide-react';
import { WATER_GOAL_ML } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Saúde',
  description: 'Monitore sono, hidratação, humor e energia. Ganhe XP cuidando da sua saúde.',
};

export const dynamic = 'force-dynamic';

function formatDuration(h: number | null): string {
  if (!h) return '—';
  const hours = Math.floor(h);
  const mins = Math.round((h - hours) * 60);
  return mins === 0 ? `${hours}h` : `${hours}h${mins}m`;
}

export default async function SaudePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const todayStr = todayString();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().slice(0, 10);

  const [
    { data: waterToday },
    { data: waterLast7 },
    { data: sleepLast7 },
    { data: moodToday },
    { data: moodRecent },
  ] = await Promise.all([
    supabase
      .from('water_logs')
      .select('id, amount_ml, created_at')
      .eq('user_id', user.id)
      .eq('date', todayStr)
      .order('created_at', { ascending: false })
      .limit(100),
    supabase
      .from('water_logs')
      .select('date, amount_ml')
      .eq('user_id', user.id)
      .gte('date', sevenDaysAgoStr)
      .order('date', { ascending: false })
      .limit(500),
    supabase
      .from('sleep_logs')
      .select('id, date, bed_time, wake_time, duration_hours, quality, xp_earned')
      .eq('user_id', user.id)
      .gte('date', sevenDaysAgoStr)
      .order('date', { ascending: false })
      .limit(7),
    supabase
      .from('mood_logs')
      .select('id, user_id, date, mood, energy, stress, note, xp_earned, created_at, updated_at')
      .eq('user_id', user.id)
      .eq('date', todayStr)
      .maybeSingle(),
    supabase
      .from('mood_logs')
      .select('date, mood, energy, stress')
      .eq('user_id', user.id)
      .gte('date', sevenDaysAgoStr)
      .order('date', { ascending: false })
      .limit(5),
  ]);

  // Water tracker
  const initialEntries = (waterToday ?? []).map((e) => ({
    id: e.id as string,
    amount_ml: e.amount_ml as number,
    created_at: e.created_at as string,
  }));
  const initialTotal = initialEntries.reduce((s, e) => s + e.amount_ml, 0);

  // Water by day (stats + trend)
  const waterByDay: Record<string, number> = {};
  for (const row of waterLast7 ?? []) {
    const d = row.date as string;
    waterByDay[d] = (waterByDay[d] ?? 0) + (row.amount_ml as number);
  }
  const waterDays = Object.values(waterByDay);
  const avgWater7d =
    waterDays.length > 0 ? Math.round(waterDays.reduce((s, v) => s + v, 0) / waterDays.length) : 0;
  const daysGoalReached = waterDays.filter((v) => v >= WATER_GOAL_ML).length;

  // Trend data
  const waterTrendDays = Object.entries(waterByDay)
    .map(([date, total]) => ({ date, total }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Sleep logs
  const sleepLogs = (sleepLast7 ?? []).map((l) => ({
    id: l.id as string,
    date: l.date as string,
    bed_time: l.bed_time as string | null,
    wake_time: l.wake_time as string | null,
    duration_hours: l.duration_hours as number | null,
    quality: l.quality as number | null,
    xp_earned: (l.xp_earned as number) ?? 0,
  }));

  const sleepWithDuration = sleepLogs.filter(
    (l) => l.duration_hours !== null && l.duration_hours > 0
  );
  const avgSleep7d =
    sleepWithDuration.length > 0
      ? Math.round(
          (sleepWithDuration.reduce((s, l) => s + (l.duration_hours ?? 0), 0) /
            sleepWithDuration.length) *
            10
        ) / 10
      : null;
  const daysGoodSleep = sleepWithDuration.filter((l) => (l.duration_hours ?? 0) >= 7).length;

  const sleepTrendDays = sleepLogs
    .map((l) => ({
      date: l.date,
      hours: l.duration_hours,
      quality: l.quality,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Health score
  const waterPct = Math.min(100, Math.round((initialTotal / WATER_GOAL_ML) * 100));
  const healthScore = Math.round((daysGoalReached / 7) * 50 + (daysGoodSleep / 7) * 50);

  // Mood
  const todayMoodLog = moodToday as MoodLog | null;
  const recentMoodLogs = (moodRecent ?? []).map((r) => ({
    date: r.date as string,
    mood: r.mood as number,
    energy: r.energy as number,
    stress: r.stress as number,
  }));

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-8">
        {/* ── Hero Header ─────────────────────────────────────────────── */}
        <div
          className="relative overflow-hidden rounded-2xl p-6"
          style={{
            background:
              'linear-gradient(135deg, rgba(0,217,255,0.08) 0%, rgba(13,24,41,0.98) 60%, rgba(124,58,237,0.06) 100%)',
            border: '1px solid rgba(0,217,255,0.2)',
          }}
        >
          <div
            className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(0,217,255,0.12) 0%, transparent 70%)',
            }}
          />
          <div
            className="pointer-events-none absolute -bottom-6 -left-6 h-28 w-28 rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 70%)',
            }}
          />
          <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <Heart size={14} style={{ color: '#00D9FF' }} />
                <span
                  className="text-xs font-semibold uppercase tracking-widest"
                  style={{ color: '#00D9FF' }}
                >
                  Saúde & Bem-estar
                </span>
              </div>
              <h1 className="heading-display text-4xl md:text-5xl">Saúde</h1>
              <p className="mt-1 text-text-secondary">
                {waterPct >= 100
                  ? '💧 Meta de água atingida hoje!'
                  : `${waterPct}% da meta de água · ${formatDuration(avgSleep7d)} de sono em média`}
              </p>
            </div>

            {healthScore > 0 && (
              <div className="flex flex-col items-end">
                <div
                  className="text-3xl font-black"
                  style={{
                    color:
                      healthScore >= 70 ? '#00FF88' : healthScore >= 40 ? '#F5C842' : '#FF4D00',
                  }}
                >
                  {healthScore}
                </div>
                <div className="text-xs uppercase tracking-wider text-text-muted">score saúde</div>
              </div>
            )}
          </div>
        </div>

        {/* ── Stats ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            {
              icon: Droplets,
              color: '#00D9FF',
              rgb: '0,217,255',
              label: 'Média Água',
              value: avgWater7d >= 1000 ? `${(avgWater7d / 1000).toFixed(1)}L` : `${avgWater7d}ml`,
              sub: 'últimos 7 dias',
            },
            {
              icon: Trophy,
              color: '#00FF88',
              rgb: '0,255,136',
              label: 'Meta Água',
              value: `${daysGoalReached}/7`,
              sub: 'dias atingidos',
            },
            {
              icon: Moon,
              color: '#7C3AED',
              rgb: '124,58,237',
              label: 'Média Sono',
              value: formatDuration(avgSleep7d),
              sub: 'últimos 7 dias',
            },
            {
              icon: TrendingUp,
              color: '#F5C842',
              rgb: '245,200,66',
              label: 'Noites Boas',
              value: `${daysGoodSleep}/7`,
              sub: 'noites com 7h+',
            },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="relative overflow-hidden rounded-2xl p-4"
                style={{
                  background: `linear-gradient(135deg, rgba(${stat.rgb},0.08) 0%, rgba(13,24,41,0.98) 100%)`,
                  border: `1px solid rgba(${stat.rgb},0.2)`,
                }}
              >
                <div
                  className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full blur-xl"
                  style={{ background: `rgba(${stat.rgb},0.2)` }}
                />
                <div className="relative z-10">
                  <div className="mb-2 flex items-center gap-2">
                    <Icon size={13} style={{ color: stat.color }} />
                    <span className="text-[10px] uppercase tracking-wider text-text-muted">
                      {stat.label}
                    </span>
                  </div>
                  <div className="heading-display text-2xl" style={{ color: stat.color }}>
                    {stat.value}
                  </div>
                  <div className="mt-0.5 text-[10px] text-text-muted">{stat.sub}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Heavy analytics — streamed independently */}
        <Suspense fallback={<div className="shimmer h-40 rounded-2xl" />}>
          <HealthRings userId={user.id} />
        </Suspense>

        <Suspense fallback={<div className="shimmer h-40 rounded-2xl" />}>
          <HealthStreak userId={user.id} />
        </Suspense>

        <div className="grid gap-4 md:grid-cols-2">
          <MoodCheckin todayLog={todayMoodLog} recentLogs={recentMoodLogs} />
          <Suspense fallback={<div className="shimmer h-48 rounded-2xl" />}>
            <RecoveryScore userId={user.id} />
          </Suspense>
        </div>

        <HealthTrend waterDays={waterTrendDays} sleepDays={sleepTrendDays} />

        {/* ── Trackers ───────────────────────────────────────────────── */}
        <div className="grid gap-4 md:grid-cols-2">
          <WaterTracker initialEntries={initialEntries} initialTotal={initialTotal} />
          <SleepTracker initialLogs={sleepLogs} todayStr={todayStr} />
        </div>

        {/* ── XP tips ───────────────────────────────────────────────── */}
        <div
          className="rounded-2xl p-5"
          style={{ background: 'rgba(245,200,66,0.06)', border: '1px solid rgba(245,200,66,0.15)' }}
        >
          <div className="mb-3 flex items-center gap-2 text-xs font-bold text-brand-gold">
            ⚡ Como ganhar XP com saúde
          </div>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
            {[
              { label: 'Meta de hidratação (2L)', xp: '+30 XP', color: '#00D9FF' },
              { label: 'Registrar sono do dia', xp: '+20 XP', color: '#7C3AED' },
              { label: 'Sono ideal (8h ou mais)', xp: '+10 XP bônus', color: '#00FF88' },
              { label: 'Check-in diário', xp: '+10 XP', color: '#F5C842' },
            ].map((tip) => (
              <div
                key={tip.label}
                className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <span className="text-xs text-text-secondary">{tip.label}</span>
                <span className="shrink-0 text-xs font-black" style={{ color: tip.color }}>
                  {tip.xp}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
