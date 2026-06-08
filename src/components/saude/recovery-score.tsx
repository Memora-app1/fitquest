import { createClient } from '@/lib/supabase/server'
import { todayString } from '@/lib/utils'
import { Shield, Zap, Moon, Droplets, Dumbbell, TrendingUp } from 'lucide-react'
import { WATER_GOAL_ML } from '@/lib/constants'

interface RecoveryFactor {
  label: string
  score: number
  icon: typeof Shield
  color: string
  detail: string
}

export async function RecoveryScore({ userId }: { userId: string }) {
  const supabase = await createClient()
  const today = todayString()
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]!
  const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0]!
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]!

  const [sleepRes, waterRes, workoutsRes, sleepAvgRes] = await Promise.all([
    supabase
      .from('sleep_logs')
      .select('duration_hours, quality')
      .eq('user_id', userId)
      .eq('date', yesterday)
      .maybeSingle(),
    supabase
      .from('water_logs')
      .select('amount_ml')
      .eq('user_id', userId)
      .eq('date', yesterday),
    supabase
      .from('workouts')
      .select('started_at')
      .eq('user_id', userId)
      .gte('started_at', `${threeDaysAgo}T00:00:00`)
      .order('started_at', { ascending: false }),
    supabase
      .from('sleep_logs')
      .select('duration_hours, quality')
      .eq('user_id', userId)
      .gte('date', sevenDaysAgo)
      .lte('date', today),
  ])

  // ── Sleep factor ──────────────────────────────────────────────────
  const sleepHours = (sleepRes.data?.duration_hours as number | null) ?? null
  const sleepQuality = (sleepRes.data?.quality as number | null) ?? null
  let sleepScore = 50 // neutral if no data
  let sleepDetail = 'Registre o sono para avaliar'
  if (sleepHours !== null) {
    const hourScore = Math.min(100, Math.round((sleepHours / 8) * 100))
    const qualityScore = sleepQuality !== null ? sleepQuality * 20 : 60
    sleepScore = Math.round((hourScore * 0.6) + (qualityScore * 0.4))
    const h = Math.floor(sleepHours)
    const m = Math.round((sleepHours - h) * 60)
    const timeStr = m === 0 ? `${h}h` : `${h}h${m}m`
    sleepDetail = sleepScore >= 80
      ? `${timeStr} ontem — excelente!`
      : sleepScore >= 60
      ? `${timeStr} ontem — adequado`
      : `${timeStr} ontem — insuficiente`
  }

  // ── Hydration factor ──────────────────────────────────────────────
  const waterYesterday = (waterRes.data ?? []).reduce((s, r) => s + (r.amount_ml as number), 0)
  const waterScore = waterYesterday > 0
    ? Math.min(100, Math.round((waterYesterday / WATER_GOAL_ML) * 100))
    : 0
  const waterDetail = waterYesterday === 0
    ? 'Sem registro ontem'
    : waterYesterday >= WATER_GOAL_ML
    ? `${(waterYesterday / 1000).toFixed(1)}L — meta atingida!`
    : `${(waterYesterday / 1000).toFixed(1)}L — abaixo da meta`

  // ── Rest factor (0 workouts in last 2 days = full rest = good) ───
  const workoutsLast3 = (workoutsRes.data ?? []).length
  const workoutsLast1 = (workoutsRes.data ?? []).filter(
    w => w.started_at >= `${yesterday}T00:00:00`
  ).length
  let restScore: number
  let restDetail: string
  if (workoutsLast1 >= 1) {
    restScore = 40
    restDetail = 'Treinou ontem — dê tempo ao músculo'
  } else if (workoutsLast3 >= 2) {
    restScore = 60
    restDetail = 'Volume alto recente — recuperação moderada'
  } else {
    restScore = 90
    restDetail = 'Descanso adequado — pronto para treinar'
  }

  // ── Sleep consistency (7-day average) ────────────────────────────
  const sleepLogs7d = sleepAvgRes.data ?? []
  const sleepWith7d = sleepLogs7d.filter(l => (l.duration_hours as number | null) !== null)
  let consistencyScore = 50
  let consistencyDetail = 'Sem dados suficientes (7d)'
  if (sleepWith7d.length >= 3) {
    const avg = sleepWith7d.reduce((s, l) => s + (l.duration_hours as number), 0) / sleepWith7d.length
    const goodNights = sleepWith7d.filter(l => (l.duration_hours as number) >= 7).length
    consistencyScore = Math.round((goodNights / sleepWith7d.length) * 100)
    consistencyDetail = `${goodNights}/${sleepWith7d.length} noites boas — média ${avg.toFixed(1)}h`
  }

  // ── Overall recovery score ────────────────────────────────────────
  const overallScore = Math.round(
    sleepScore * 0.35 +
    waterScore * 0.25 +
    restScore * 0.25 +
    consistencyScore * 0.15
  )

  const state = overallScore >= 75 ? 'pronto' : overallScore >= 50 ? 'parcial' : 'recuperar'
  const stateConfig = {
    pronto:    { label: 'PRONTO', emoji: '⚡', color: '#00FF88', rgb: '0,255,136', advice: 'Você está recuperado. Hora de dar tudo!' },
    parcial:   { label: 'MODERADO', emoji: '🔄', color: '#F5C842', rgb: '245,200,66', advice: 'Recuperação parcial. Treino leve recomendado.' },
    recuperar: { label: 'RECUPERAR', emoji: '🛌', color: '#00D9FF', rgb: '0,217,255', advice: 'Priorize sono e hidratação antes de treinar pesado.' },
  }
  const sc = stateConfig[state]

  const factors: RecoveryFactor[] = [
    { label: 'Sono ontem', score: sleepScore, icon: Moon, color: '#7C3AED', detail: sleepDetail },
    { label: 'Hidratação', score: waterScore, icon: Droplets, color: '#00D9FF', detail: waterDetail },
    { label: 'Descanso', score: restScore, icon: Dumbbell, color: '#FF4D00', detail: restDetail },
    { label: 'Consistência', score: consistencyScore, icon: TrendingUp, color: '#F5C842', detail: consistencyDetail },
  ]

  return (
    <div
      className="rounded-2xl p-5 md:p-6 relative overflow-hidden animate-fade-in"
      style={{
        background: `linear-gradient(135deg, rgba(${sc.rgb},0.08) 0%, rgba(13,24,41,0.98) 60%, rgba(124,58,237,0.04) 100%)`,
        border: `1px solid rgba(${sc.rgb},0.25)`,
      }}
    >
      {/* Ambient glow */}
      <div
        className="absolute -top-8 -right-8 w-40 h-40 rounded-full pointer-events-none blur-3xl"
        style={{ background: `rgba(${sc.rgb},0.07)` }}
      />

      <div className="relative z-10">
        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center"
                style={{ background: `rgba(${sc.rgb},0.15)`, border: `1px solid rgba(${sc.rgb},0.3)` }}
              >
                <Shield size={12} style={{ color: sc.color }} />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-text-muted">
                Recovery Score
              </span>
            </div>
            <h2 className="text-xl font-black">Prontidão para Treino</h2>

            {/* State badge */}
            <div
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl animate-bounce-in"
              style={{
                background: `rgba(${sc.rgb},0.15)`,
                border: `1px solid rgba(${sc.rgb},0.3)`,
              }}
            >
              <span className="text-sm">{sc.emoji}</span>
              <span className="heading-display text-base" style={{ color: sc.color }}>
                {sc.label}
              </span>
            </div>
          </div>

          {/* Big score ring */}
          <div className="relative shrink-0">
            <svg width="88" height="88">
              <circle cx="44" cy="44" r="36" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
              <circle
                cx="44" cy="44" r="36"
                fill="none"
                stroke={sc.color}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 36}`}
                strokeDashoffset={`${2 * Math.PI * 36 * (1 - overallScore / 100)}`}
                transform="rotate(-90 44 44)"
                style={{ filter: `drop-shadow(0 0 8px ${sc.color}50)`, transition: 'stroke-dashoffset 1.2s ease-out' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="heading-display text-2xl leading-none" style={{ color: sc.color }}>
                {overallScore}
              </span>
              <span className="text-[9px] text-text-muted uppercase tracking-wider">recuperação</span>
            </div>
          </div>
        </div>

        {/* ── Advice ──────────────────────────────────────────────────── */}
        <div
          className="rounded-xl px-4 py-3 mb-5 flex items-center gap-3"
          style={{ background: `rgba(${sc.rgb},0.06)`, border: `1px solid rgba(${sc.rgb},0.12)` }}
        >
          <Zap size={14} style={{ color: sc.color }} className="shrink-0" />
          <p className="text-sm font-semibold" style={{ color: sc.color }}>{sc.advice}</p>
        </div>

        {/* ── Factors ─────────────────────────────────────────────────── */}
        <div className="space-y-3">
          {factors.map((f) => {
            const Icon = f.icon
            const barColor = f.score >= 75 ? '#00FF88' : f.score >= 50 ? '#F5C842' : '#FF4D00'
            return (
              <div key={f.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <Icon size={12} style={{ color: f.color }} />
                    <span className="text-xs font-semibold text-text-secondary">{f.label}</span>
                    <span className="text-[10px] text-text-muted">· {f.detail}</span>
                  </div>
                  <span className="text-xs font-black" style={{ color: barColor }}>{f.score}</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{ width: `${f.score}%`, backgroundColor: barColor }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
