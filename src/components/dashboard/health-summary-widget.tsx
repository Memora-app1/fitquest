import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Droplets, Moon, ArrowRight } from 'lucide-react'
import { todayString } from '@/lib/utils'

const WATER_GOAL_ML = 2000

function sleepColor(h: number | null): string {
  if (!h || h === 0) return '#8899BB'
  if (h >= 8) return '#00FF88'
  if (h >= 7) return '#F5C842'
  if (h >= 6) return '#FF4D00'
  return '#EF4444'
}

function formatDuration(h: number | null): string {
  if (!h) return '—'
  const hours = Math.floor(h)
  const mins = Math.round((h - hours) * 60)
  return mins === 0 ? `${hours}h` : `${hours}h${mins}m`
}

export async function HealthSummaryWidget({ userId }: { userId: string }) {
  const supabase = await createClient()
  const today = todayString()

  const [{ data: waterLogs }, { data: sleepLog }] = await Promise.all([
    supabase
      .from('water_logs')
      .select('amount_ml')
      .eq('user_id', userId)
      .eq('date', today),
    supabase
      .from('sleep_logs')
      .select('duration_hours, quality')
      .eq('user_id', userId)
      .eq('date', today)
      .maybeSingle(),
  ])

  const waterTotal = (waterLogs ?? []).reduce((s, l) => s + ((l.amount_ml as number) ?? 0), 0)
  const waterPct = Math.min(Math.round((waterTotal / WATER_GOAL_ML) * 100), 100)
  const waterGoalDone = waterTotal >= WATER_GOAL_ML

  const sleepHours = (sleepLog?.duration_hours as number | null) ?? null
  const sleepLogged = sleepLog !== null

  return (
    <Link
      href="/saude"
      className="group rounded-2xl p-4 flex items-center justify-between gap-4 transition-all hover:scale-[1.01]"
      style={{
        background: 'linear-gradient(135deg, rgba(0,217,255,0.06) 0%, rgba(13,24,41,0.98) 60%, rgba(124,58,237,0.05) 100%)',
        border: waterGoalDone && sleepLogged
          ? '1px solid rgba(0,255,136,0.3)'
          : '1px solid rgba(255,255,255,0.07)',
      }}
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {/* Water */}
        <div className="flex flex-col items-center gap-1 shrink-0">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{
              background: waterGoalDone ? 'rgba(0,255,136,0.12)' : 'rgba(0,217,255,0.1)',
              border: `1px solid ${waterGoalDone ? 'rgba(0,255,136,0.3)' : 'rgba(0,217,255,0.25)'}`,
            }}
          >
            <Droplets size={16} style={{ color: waterGoalDone ? '#00FF88' : '#00D9FF' }} />
          </div>
          <span className="text-[10px] font-bold" style={{ color: waterGoalDone ? '#00FF88' : '#00D9FF' }}>
            {waterTotal >= 1000 ? `${(waterTotal / 1000).toFixed(1)}L` : `${waterTotal}ml`}
          </span>
        </div>

        {/* Water bar */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-white">Saúde hoje</span>
            <span className="text-[10px] text-text-muted">
              {waterGoalDone ? '✅ Água OK' : `${WATER_GOAL_ML - waterTotal}ml p/ meta`}
            </span>
          </div>
          <div
            className="h-2 rounded-full overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${waterPct}%`,
                background: waterGoalDone
                  ? 'linear-gradient(90deg, #00FF88, #00CC6A)'
                  : 'linear-gradient(90deg, #00D9FF, #0099CC)',
              }}
            />
          </div>
        </div>

        {/* Sleep */}
        <div className="flex flex-col items-center gap-1 shrink-0">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{
              background: sleepLogged ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${sleepLogged ? 'rgba(124,58,237,0.4)' : 'rgba(255,255,255,0.08)'}`,
            }}
          >
            <Moon size={16} style={{ color: sleepLogged ? sleepColor(sleepHours) : '#8899BB' }} />
          </div>
          <span className="text-[10px] font-bold" style={{ color: sleepLogged ? sleepColor(sleepHours) : '#8899BB' }}>
            {sleepLogged ? formatDuration(sleepHours) : 'Registrar'}
          </span>
        </div>
      </div>

      <ArrowRight
        size={14}
        className="text-text-muted group-hover:text-white transition-colors shrink-0"
      />
    </Link>
  )
}
