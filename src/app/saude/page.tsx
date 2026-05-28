import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { todayString } from '@/lib/utils'
import { AppShell } from '@/components/layout/app-shell'
import { WaterTracker } from '@/components/saude/water-tracker'
import { SleepTracker } from '@/components/saude/sleep-tracker'
import { RecoveryScore } from '@/components/saude/recovery-score'
import { Droplets, Moon, TrendingUp, Trophy, Heart } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Saúde',
  description: 'Monitore seu sono e hidratação diários. Ganhe XP cuidando da sua saúde.',
}

export const dynamic = 'force-dynamic'

const WATER_GOAL_ML = 2000

function formatDuration(h: number | null): string {
  if (!h) return '—'
  const hours = Math.floor(h)
  const mins = Math.round((h - hours) * 60)
  return mins === 0 ? `${hours}h` : `${hours}h${mins}m`
}

export default async function SaudePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const todayStr = todayString()
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().slice(0, 10)

  const [
    { data: waterToday },
    { data: waterLast7 },
    { data: sleepLast7 },
  ] = await Promise.all([
    supabase
      .from('water_logs')
      .select('id, amount_ml, created_at')
      .eq('user_id', user.id)
      .eq('date', todayStr)
      .order('created_at', { ascending: false }),
    supabase
      .from('water_logs')
      .select('date, amount_ml')
      .eq('user_id', user.id)
      .gte('date', sevenDaysAgoStr)
      .order('date', { ascending: false }),
    supabase
      .from('sleep_logs')
      .select('id, date, bed_time, wake_time, duration_hours, quality, xp_earned')
      .eq('user_id', user.id)
      .gte('date', sevenDaysAgoStr)
      .order('date', { ascending: false })
      .limit(7),
  ])

  const initialEntries = (waterToday ?? []).map(e => ({
    id: e.id as string,
    amount_ml: e.amount_ml as number,
    created_at: e.created_at as string,
  }))
  const initialTotal = initialEntries.reduce((s, e) => s + e.amount_ml, 0)

  const waterByDay: Record<string, number> = {}
  for (const row of waterLast7 ?? []) {
    const d = row.date as string
    waterByDay[d] = (waterByDay[d] ?? 0) + (row.amount_ml as number)
  }
  const waterDays = Object.values(waterByDay)
  const avgWater7d = waterDays.length > 0
    ? Math.round(waterDays.reduce((s, v) => s + v, 0) / waterDays.length)
    : 0
  const daysGoalReached = waterDays.filter(v => v >= WATER_GOAL_ML).length

  const sleepLogs = (sleepLast7 ?? []).map(l => ({
    id: l.id as string,
    date: l.date as string,
    bed_time: l.bed_time as string | null,
    wake_time: l.wake_time as string | null,
    duration_hours: l.duration_hours as number | null,
    quality: l.quality as number | null,
    xp_earned: (l.xp_earned as number) ?? 0,
  }))

  const sleepWithDuration = sleepLogs.filter(l => l.duration_hours !== null && l.duration_hours > 0)
  const avgSleep7d = sleepWithDuration.length > 0
    ? Math.round(sleepWithDuration.reduce((s, l) => s + (l.duration_hours ?? 0), 0) / sleepWithDuration.length * 10) / 10
    : null
  const daysGoodSleep = sleepWithDuration.filter(l => (l.duration_hours ?? 0) >= 7).length

  const waterPct = Math.min(100, Math.round((initialTotal / WATER_GOAL_ML) * 100))
  const healthScore = Math.round(
    (daysGoalReached / 7) * 50 +
    (daysGoodSleep / 7) * 50
  )

  return (
    <AppShell>
      <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">

        {/* ── Hero Header ─────────────────────────────────────────────── */}
        <div
          className="rounded-2xl p-6 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(0,217,255,0.08) 0%, rgba(13,24,41,0.98) 60%, rgba(124,58,237,0.06) 100%)',
            border: '1px solid rgba(0,217,255,0.2)',
          }}
        >
          <div
            className="absolute -top-8 -right-8 w-40 h-40 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(0,217,255,0.12) 0%, transparent 70%)' }}
          />
          <div
            className="absolute -bottom-6 -left-6 w-28 h-28 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 70%)' }}
          />
          <div className="relative z-10 flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Heart size={14} style={{ color: '#00D9FF' }} />
                <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#00D9FF' }}>
                  Saúde & Bem-estar
                </span>
              </div>
              <h1 className="heading-display text-4xl md:text-5xl">Saúde</h1>
              <p className="text-text-secondary mt-1">
                {waterPct >= 100
                  ? '💧 Meta de água atingida hoje!'
                  : `${waterPct}% da meta de água · ${formatDuration(avgSleep7d)} de sono em média`}
              </p>
            </div>

            {healthScore > 0 && (
              <div
                className="flex flex-col items-end"
              >
                <div
                  className="text-3xl font-black"
                  style={{ color: healthScore >= 70 ? '#00FF88' : healthScore >= 40 ? '#F5C842' : '#FF4D00' }}
                >
                  {healthScore}
                </div>
                <div className="text-xs text-text-muted uppercase tracking-wider">score saúde</div>
              </div>
            )}
          </div>
        </div>

        {/* ── Stats ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
            const Icon = stat.icon
            return (
              <div
                key={stat.label}
                className="rounded-2xl p-4 relative overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, rgba(${stat.rgb},0.08) 0%, rgba(13,24,41,0.98) 100%)`,
                  border: `1px solid rgba(${stat.rgb},0.2)`,
                }}
              >
                <div
                  className="absolute -top-4 -right-4 w-16 h-16 rounded-full pointer-events-none blur-xl"
                  style={{ background: `rgba(${stat.rgb},0.2)` }}
                />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon size={13} style={{ color: stat.color }} />
                    <span className="text-[10px] text-text-muted uppercase tracking-wider">{stat.label}</span>
                  </div>
                  <div className="heading-display text-2xl" style={{ color: stat.color }}>
                    {stat.value}
                  </div>
                  <div className="text-[10px] text-text-muted mt-0.5">{stat.sub}</div>
                </div>
              </div>
            )
          })}
        </div>

        {/* ── Trackers ───────────────────────────────────────────────── */}
        <div className="grid md:grid-cols-2 gap-4">
          <WaterTracker
            initialEntries={initialEntries}
            initialTotal={initialTotal}
          />
          <SleepTracker
            initialLogs={sleepLogs}
            todayStr={todayStr}
          />
        </div>

        {/* ── Recovery score ────────────────────────────────────────── */}
        <RecoveryScore userId={user.id} />

        {/* ── XP tips ───────────────────────────────────────────────── */}
        <div
          className="rounded-2xl p-5"
          style={{ background: 'rgba(245,200,66,0.06)', border: '1px solid rgba(245,200,66,0.15)' }}
        >
          <div className="text-xs font-bold text-brand-gold mb-3 flex items-center gap-2">
            ⚡ Como ganhar XP com saúde
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {[
              { label: 'Meta de hidratação (2L)', xp: '+30 XP', color: '#00D9FF' },
              { label: 'Registrar sono do dia', xp: '+20 XP', color: '#7C3AED' },
              { label: 'Sono ideal (8h ou mais)', xp: '+10 XP bônus', color: '#00FF88' },
            ].map(tip => (
              <div
                key={tip.label}
                className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
              >
                <span className="text-xs text-text-secondary">{tip.label}</span>
                <span className="text-xs font-black shrink-0" style={{ color: tip.color }}>{tip.xp}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
