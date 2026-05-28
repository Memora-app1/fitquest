/**
 * XpToday — widget server-side mostrando o XP ganho hoje.
 * Aparece apenas quando há XP registrado no dia atual.
 * Breakdown por fonte com barra de progresso animada.
 */

import { createClient } from '@/lib/supabase/server'
import { todayString } from '@/lib/utils'
import { Zap, TrendingUp } from 'lucide-react'

const SOURCE_LABELS: Record<string, { label: string; color: string; rgb: string; emoji: string }> = {
  habit:       { label: 'Hábitos',     color: '#FF4D00', rgb: '255,77,0',    emoji: '🎯' },
  workout:     { label: 'Treinos',     color: '#00FF88', rgb: '0,255,136',   emoji: '💪' },
  task:        { label: 'Tarefas',     color: '#7C3AED', rgb: '124,58,237',  emoji: '✅' },
  health:      { label: 'Saúde',       color: '#00D9FF', rgb: '0,217,255',   emoji: '💧' },
  transaction: { label: 'Finanças',    color: '#F5C842', rgb: '245,200,66',  emoji: '💰' },
  streak:      { label: 'Streak',      color: '#FF4D00', rgb: '255,77,0',    emoji: '🔥' },
  achievement: { label: 'Conquistas',  color: '#F5C842', rgb: '245,200,66',  emoji: '🏆' },
  onboarding:  { label: 'Onboarding',  color: '#3B82F6', rgb: '59,130,246',  emoji: '🚀' },
  goal:        { label: 'Metas',       color: '#00FF88', rgb: '0,255,136',   emoji: '🎯' },
  bonus:       { label: 'Bônus',       color: '#F5C842', rgb: '245,200,66',  emoji: '⭐' },
}

const FALLBACK_SOURCE = { label: 'Outros', color: '#8899BB', rgb: '136,153,187', emoji: '✨' }

export async function XpToday({ userId }: { userId: string }) {
  const supabase = await createClient()
  const today = todayString()

  const { data } = await supabase
    .from('xp_transactions')
    .select('amount, source_type, reason, created_at')
    .eq('user_id', userId)
    .gte('created_at', `${today}T00:00:00`)
    .lte('created_at', `${today}T23:59:59`)
    .order('created_at', { ascending: false })

  const transactions = data ?? []
  const totalXp = transactions.reduce((s, t) => s + ((t.amount as number) ?? 0), 0)

  if (totalXp <= 0) return null

  // Aggregate by source_type
  const bySource: Record<string, number> = {}
  for (const tx of transactions) {
    const src = (tx.source_type as string) ?? 'bonus'
    bySource[src] = (bySource[src] ?? 0) + ((tx.amount as number) ?? 0)
  }

  const topSources = Object.entries(bySource)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)

  const txCount = transactions.length

  return (
    <div
      className="rounded-2xl p-5 md:p-6 relative overflow-hidden animate-fade-in"
      style={{
        background: 'linear-gradient(135deg, rgba(245,200,66,0.08) 0%, rgba(13,24,41,0.98) 55%, rgba(255,77,0,0.04) 100%)',
        border: '1px solid rgba(245,200,66,0.2)',
      }}
    >
      {/* Glow */}
      <div
        className="absolute -top-8 -right-8 w-40 h-40 rounded-full pointer-events-none blur-3xl"
        style={{ background: 'rgba(245,200,66,0.08)' }}
      />
      <div
        className="absolute -bottom-6 -left-6 w-28 h-28 rounded-full pointer-events-none blur-2xl"
        style={{ background: 'rgba(255,77,0,0.05)' }}
      />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(245,200,66,0.15)', border: '1px solid rgba(245,200,66,0.3)' }}
              >
                <Zap size={12} className="text-brand-gold" fill="currentColor" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-text-muted">
                XP de Hoje
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span
                className="heading-display text-4xl leading-none animate-counter"
                style={{ color: '#F5C842', textShadow: '0 0 20px rgba(245,200,66,0.4)' }}
              >
                +{totalXp.toLocaleString('pt-BR')}
              </span>
              <span className="text-sm text-text-muted font-bold">XP</span>
            </div>
          </div>

          <div className="text-right">
            <div
              className="flex items-center gap-1.5 justify-end px-3 py-1.5 rounded-xl"
              style={{ background: 'rgba(0,255,136,0.06)', border: '1px solid rgba(0,255,136,0.15)' }}
            >
              <TrendingUp size={11} style={{ color: '#00FF88' }} />
              <span className="text-xs font-bold" style={{ color: '#00FF88' }}>
                {txCount} ação{txCount !== 1 ? 'ões' : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Source breakdown */}
        {topSources.length > 0 && (
          <div className="space-y-2.5">
            {topSources.map(([source, amount]) => {
              const config = SOURCE_LABELS[source] ?? FALLBACK_SOURCE
              const pct = totalXp > 0 ? Math.round((amount / totalXp) * 100) : 0
              return (
                <div key={source}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm leading-none">{config.emoji}</span>
                      <span className="text-xs text-text-secondary">{config.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-text-muted">{pct}%</span>
                      <span
                        className="text-xs font-black px-1.5 py-0.5 rounded-full"
                        style={{
                          color: config.color,
                          background: `rgba(${config.rgb},0.12)`,
                        }}
                      >
                        +{amount.toLocaleString('pt-BR')} XP
                      </span>
                    </div>
                  </div>
                  <div
                    className="h-1 rounded-full overflow-hidden"
                    style={{ background: 'rgba(255,255,255,0.05)' }}
                  >
                    <div
                      className="h-full rounded-full animate-progress-fill"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: config.color,
                        opacity: 0.8,
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
