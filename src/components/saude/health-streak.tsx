/**
 * HealthStreak — streak de dias consecutivos batendo meta de água + registrando sono.
 * Server component. Calcula streak retroativamente sobre os últimos 60 dias.
 */

import { createClient } from '@/lib/supabase/server'
import { Droplets, Moon, Flame, Trophy } from 'lucide-react'
import { WATER_GOAL_ML } from '@/lib/constants'

function calcStreak(
  waterByDay: Record<string, number>,
  sleepDays: Set<string>,
  todayStr: string,
): { current: number; longest: number; last30: boolean[] } {
  let current = 0
  let longest = 0
  let counting = true
  const last30: boolean[] = []

  for (let i = 0; i < 60; i++) {
    const d = new Date(todayStr + 'T12:00:00')
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]!

    const hitWater = (waterByDay[dateStr] ?? 0) >= WATER_GOAL_ML
    const hitSleep = sleepDays.has(dateStr)
    const isGood   = hitWater && hitSleep

    if (i < 30) last30.unshift(isGood)

    if (counting) {
      if (isGood) {
        current++
        if (current > longest) longest = current
      } else {
        counting = false
      }
    }
  }

  return { current, longest, last30 }
}

export async function HealthStreak({ userId }: { userId: string }) {
  const supabase = await createClient()

  const since60 = new Date(Date.now() - 60 * 86400000).toISOString().split('T')[0]!
  const today   = new Date().toISOString().split('T')[0]!

  const [waterRes, sleepRes] = await Promise.all([
    supabase
      .from('water_logs')
      .select('date, amount_ml')
      .eq('user_id', userId)
      .gte('date', since60),
    supabase
      .from('sleep_logs')
      .select('date')
      .eq('user_id', userId)
      .gte('date', since60),
  ])

  // Agrupa água por dia
  const waterByDay: Record<string, number> = {}
  for (const row of waterRes.data ?? []) {
    const d = row.date as string
    waterByDay[d] = (waterByDay[d] ?? 0) + (row.amount_ml as number)
  }

  const sleepDays = new Set((sleepRes.data ?? []).map(r => r.date as string))

  const { current, longest, last30 } = calcStreak(waterByDay, sleepDays, today)

  // Verifica hoje
  const todayWater = waterByDay[today] ?? 0
  const todaySleep = sleepDays.has(today)
  const todayStatus = {
    water: todayWater >= WATER_GOAL_ML,
    sleep: todaySleep,
  }

  if (current === 0 && longest === 0 && !last30.some(Boolean)) {
    return (
      <div
        className="rounded-2xl p-5 relative overflow-hidden animate-fade-in"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
            style={{ background: 'rgba(255,77,0,0.1)', border: '1px solid rgba(255,77,0,0.2)' }}>
            🔥
          </div>
          <div>
            <div className="font-bold text-sm">Streak de Saúde</div>
            <p className="text-xs text-text-muted mt-0.5">
              Beba 2L de água e registre o sono para iniciar sua sequência.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const streakColor = current >= 7 ? '#00FF88' : current >= 3 ? '#F5C842' : '#FF4D00'
  const streakRgb   = current >= 7 ? '0,255,136' : current >= 3 ? '245,200,66' : '255,77,0'

  return (
    <div
      className="rounded-2xl p-5 md:p-6 relative overflow-hidden animate-fade-in"
      style={{
        background: `linear-gradient(135deg, rgba(${streakRgb},0.07) 0%, rgba(13,24,41,0.98) 55%, rgba(124,58,237,0.04) 100%)`,
        border: `1px solid rgba(${streakRgb},0.2)`,
      }}
    >
      <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full pointer-events-none blur-3xl"
        style={{ background: `rgba(${streakRgb},0.07)` }} />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center"
              style={{ background: `rgba(${streakRgb},0.15)`, border: `1px solid rgba(${streakRgb},0.3)` }}>
              <Flame size={12} style={{ color: streakColor }} />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-text-muted">
              Streak de Saúde
            </span>
          </div>
          {longest > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg"
              style={{ background: 'rgba(245,200,66,0.08)', border: '1px solid rgba(245,200,66,0.15)' }}>
              <Trophy size={10} style={{ color: '#F5C842' }} />
              <span className="text-[10px] font-black" style={{ color: '#F5C842' }}>
                recorde {longest}d
              </span>
            </div>
          )}
        </div>

        {/* Counter + today status */}
        <div className="flex items-center gap-5 mb-5">
          <div>
            <div className="heading-display text-5xl leading-none" style={{ color: streakColor }}>
              {current}
            </div>
            <div className="text-xs text-text-muted">dias seguidos</div>
          </div>

          <div className="flex-1 space-y-2">
            {/* Água hoje */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{
                background: todayStatus.water ? 'rgba(0,217,255,0.08)' : 'rgba(255,255,255,0.03)',
                border: todayStatus.water ? '1px solid rgba(0,217,255,0.2)' : '1px solid rgba(255,255,255,0.05)',
              }}>
              <Droplets size={12} style={{ color: todayStatus.water ? '#00D9FF' : '#5A6B85' }} />
              <span className="text-xs font-semibold" style={{ color: todayStatus.water ? '#00D9FF' : '#5A6B85' }}>
                Água {todayStatus.water ? '✓' : `${Math.round((todayWater / WATER_GOAL_ML) * 100)}%`}
              </span>
            </div>
            {/* Sono hoje */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{
                background: todayStatus.sleep ? 'rgba(124,58,237,0.08)' : 'rgba(255,255,255,0.03)',
                border: todayStatus.sleep ? '1px solid rgba(124,58,237,0.2)' : '1px solid rgba(255,255,255,0.05)',
              }}>
              <Moon size={12} style={{ color: todayStatus.sleep ? '#7C3AED' : '#5A6B85' }} />
              <span className="text-xs font-semibold" style={{ color: todayStatus.sleep ? '#7C3AED' : '#5A6B85' }}>
                Sono {todayStatus.sleep ? '✓ registrado' : 'pendente'}
              </span>
            </div>
          </div>
        </div>

        {/* Heatmap 30 dias */}
        <div>
          <div className="text-[10px] text-text-muted uppercase tracking-wider mb-2">Últimos 30 dias</div>
          <div className="flex gap-1 flex-wrap">
            {last30.map((good, i) => (
              <div
                key={i}
                className="w-5 h-5 rounded-md transition-all"
                style={{
                  background: good
                    ? `rgba(${streakRgb},0.7)`
                    : 'rgba(255,255,255,0.05)',
                  boxShadow: good ? `0 0 6px rgba(${streakRgb},0.3)` : 'none',
                }}
                title={`Dia ${i + 1}`}
              />
            ))}
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[9px] text-text-muted">30 dias atrás</span>
            <span className="text-[9px] text-text-muted">hoje</span>
          </div>
        </div>
      </div>
    </div>
  )
}
