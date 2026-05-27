import { createClient } from '@/lib/supabase/server'
import { BarChart3 } from 'lucide-react'
import { VolumeChartLazy } from './volume-chart-lazy'
import type { WeekData } from './volume-chart'

function getWeekStart(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay() // 0=Sun, 1=Mon, …
  const diff = (day === 0 ? -6 : 1 - day) // shift to Monday
  d.setDate(d.getDate() + diff)
  return d
}

function toISO(date: Date): string {
  return date.toISOString().split('T')[0]!
}

export async function WorkoutTrends({ userId }: { userId: string }) {
  const supabase = await createClient()

  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const currentWeekStart = getWeekStart(now)

  // 8 weeks back from current week start
  const eightWeeksAgo = new Date(currentWeekStart.getTime() - 7 * 7 * 86400000)
  const eightWeeksAgoStr = toISO(eightWeeksAgo)

  const { data: rawWorkouts } = await supabase
    .from('workouts')
    .select('started_at, total_volume_kg')
    .eq('user_id', userId)
    .gte('started_at', eightWeeksAgoStr + 'T00:00:00')
    .order('started_at', { ascending: true })

  const workouts = rawWorkouts ?? []

  if (workouts.length === 0) return null

  // Build 8 weekly buckets (Mon-Sun)
  const weeks: { weekStart: Date; weekEnd: Date; label: string; isCurrent: boolean }[] = []
  for (let i = 7; i >= 0; i--) {
    const weekStart = new Date(currentWeekStart.getTime() - i * 7 * 86400000)
    const weekEnd = new Date(weekStart.getTime() + 6 * 86400000)
    const isCurrent = i === 0
    const label = isCurrent ? 'Esta' : `S-${i}`
    weeks.push({ weekStart, weekEnd, label, isCurrent })
  }

  // Aggregate workouts into weekly buckets
  const weekData: WeekData[] = weeks.map(w => {
    const weekStartStr = toISO(w.weekStart)
    const weekEndStr = toISO(new Date(w.weekStart.getTime() + 6 * 86400000))
    const weekWorkouts = workouts.filter(wo => {
      const day = wo.started_at.split('T')[0]!
      return day >= weekStartStr && day <= weekEndStr
    })
    const volume = weekWorkouts.reduce((s, wo) => s + (wo.total_volume_kg ?? 0), 0)
    return {
      week: w.label,
      volume: Math.round(volume),
      workouts: weekWorkouts.length,
      isCurrent: w.isCurrent,
      weekStart: weekStartStr,
    }
  })

  // Only render if there's at least 2 weeks of data
  const weeksWithData = weekData.filter(w => w.workouts > 0).length
  if (weeksWithData < 1) return null

  // Compute trend: compare avg volume of weeks 5-8 vs weeks 1-4
  const older = weekData.slice(0, 4)
  const newer = weekData.slice(4)
  const olderAvg = older.filter(w => w.volume > 0).reduce((s, w) => s + w.volume, 0) / Math.max(1, older.filter(w => w.volume > 0).length)
  const newerAvg = newer.filter(w => w.volume > 0).reduce((s, w) => s + w.volume, 0) / Math.max(1, newer.filter(w => w.volume > 0).length)
  const trend = olderAvg > 0 ? Math.round(((newerAvg - olderAvg) / olderAvg) * 100) : null

  return (
    <div
      className="rounded-2xl p-5 md:p-6 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(255,77,0,0.07) 0%, rgba(13,24,41,0.98) 60%, rgba(245,200,66,0.04) 100%)',
        border: '1px solid rgba(255,77,0,0.16)',
      }}
    >
      {/* Corner glow */}
      <div
        className="absolute -top-8 -right-8 w-40 h-40 rounded-full pointer-events-none blur-3xl"
        style={{ background: 'rgba(255,77,0,0.08)' }}
      />

      <div className="relative z-10 space-y-5">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(255,77,0,0.12)', border: '1px solid rgba(255,77,0,0.22)' }}
              >
                <BarChart3 size={12} style={{ color: '#FF4D00' }} />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-text-muted">
                Progressão de Volume
              </span>
            </div>
            <h2 className="text-xl font-black leading-tight">Últimas 8 semanas</h2>
            <p className="text-sm text-text-muted mt-0.5">
              Volume levantado (kg) e frequência por semana
            </p>
          </div>

          {/* Trend badge */}
          {trend !== null && (
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold shrink-0"
              style={{
                background: trend >= 0 ? 'rgba(0,255,136,0.1)' : 'rgba(255,77,0,0.1)',
                border: `1px solid ${trend >= 0 ? 'rgba(0,255,136,0.2)' : 'rgba(255,77,0,0.2)'}`,
                color: trend >= 0 ? '#00FF88' : '#FF4D00',
              }}
            >
              {trend >= 0 ? '📈' : '📉'}
              <span>
                Volume {trend >= 0 ? 'subindo' : 'caindo'}{' '}
                <span className="font-black">{Math.abs(trend)}%</span>
              </span>
            </div>
          )}
        </div>

        {/* ── Chart ───────────────────────────────────────────────────── */}
        <VolumeChartLazy data={weekData} />

      </div>
    </div>
  )
}
