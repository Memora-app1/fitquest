import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { todayString } from '@/lib/utils'
import { WaterTracker } from '@/components/saude/water-tracker'
import { SleepTracker } from '@/components/saude/sleep-tracker'
import { Droplets, Moon, TrendingUp, Trophy } from 'lucide-react'

const WATER_GOAL_ML = 2000

export const dynamic = 'force-dynamic'

export default async function SaudePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const todayStr = todayString()

  // Calcular datas para os últimos 7 dias
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

  // Totais de hoje
  const initialEntries = (waterToday ?? []).map(e => ({
    id: e.id as string,
    amount_ml: e.amount_ml as number,
    created_at: e.created_at as string,
  }))
  const initialTotal = initialEntries.reduce((s, e) => s + e.amount_ml, 0)

  // Stats de água (7 dias)
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

  // Stats de sono (7 dias)
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

  function formatDuration(h: number | null): string {
    if (!h) return '—'
    const hours = Math.floor(h)
    const mins = Math.round((h - hours) * 60)
    return mins === 0 ? `${hours}h` : `${hours}h${mins}m`
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6 pb-24 md:pb-8">
      {/* Header */}
      <div>
        <h1 className="heading-display text-3xl md:text-4xl gradient-text mb-1">SAÚDE</h1>
        <p className="text-text-muted text-sm">Monitore seu sono e hidratação diários</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            icon: Droplets,
            color: '#00D9FF',
            bg: 'rgba(0,217,255,0.1)',
            border: 'rgba(0,217,255,0.25)',
            label: 'Média Água',
            value: avgWater7d >= 1000 ? `${(avgWater7d / 1000).toFixed(1)}L` : `${avgWater7d}ml`,
            sub: 'últimos 7 dias',
          },
          {
            icon: Trophy,
            color: '#00FF88',
            bg: 'rgba(0,255,136,0.1)',
            border: 'rgba(0,255,136,0.25)',
            label: 'Meta Água',
            value: `${daysGoalReached}/7`,
            sub: 'dias atingidos',
          },
          {
            icon: Moon,
            color: '#7C3AED',
            bg: 'rgba(124,58,237,0.1)',
            border: 'rgba(124,58,237,0.25)',
            label: 'Média Sono',
            value: formatDuration(avgSleep7d),
            sub: 'últimos 7 dias',
          },
          {
            icon: TrendingUp,
            color: '#F5C842',
            bg: 'rgba(245,200,66,0.1)',
            border: 'rgba(245,200,66,0.25)',
            label: 'Noites Boas',
            value: `${daysGoodSleep}/7`,
            sub: 'noites com 7h+',
          },
        ].map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className="rounded-2xl p-4"
              style={{ background: stat.bg, border: `1px solid ${stat.border}` }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon size={14} style={{ color: stat.color }} />
                <span className="text-[10px] text-text-muted uppercase tracking-wider">{stat.label}</span>
              </div>
              <div className="text-2xl font-black" style={{ color: stat.color }}>
                {stat.value}
              </div>
              <div className="text-[10px] text-text-muted mt-0.5">{stat.sub}</div>
            </div>
          )
        })}
      </div>

      {/* Trackers */}
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

      {/* XP info */}
      <div
        className="rounded-2xl p-4"
        style={{ background: 'rgba(245,200,66,0.06)', border: '1px solid rgba(245,200,66,0.2)' }}
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
            <div key={tip.label} className="flex items-center justify-between gap-3 rounded-xl px-3 py-2"
              style={{ background: 'rgba(255,255,255,0.03)' }}>
              <span className="text-xs text-text-secondary">{tip.label}</span>
              <span className="text-xs font-black shrink-0" style={{ color: tip.color }}>{tip.xp}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
