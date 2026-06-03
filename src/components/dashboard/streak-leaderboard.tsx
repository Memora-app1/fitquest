import { createClient } from '@/lib/supabase/server'
import { TrendingUp, Flame } from 'lucide-react'

export async function StreakLeaderboard({ userId }: { userId: string }) {
  const supabase = await createClient()

  const [profileRes, allStreaksRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('streak_current, name')
      .eq('id', userId)
      .single(),
    // Conta distribuição de streaks para calcular percentil
    supabase
      .from('profiles')
      .select('streak_current')
      .gt('streak_current', 0),
  ])

  const userStreak = profileRes.data?.streak_current ?? 0
  const userName = profileRes.data?.name ?? ''
  const allStreaks = (allStreaksRes.data ?? []).map(p => p.streak_current as number)

  if (userStreak === 0 || allStreaks.length < 2) return null

  // Calcula percentil: quantos usuários têm streak MENOR que o do usuário
  const below = allStreaks.filter(s => s < userStreak).length
  const percentile = Math.round((below / allStreaks.length) * 100)

  if (percentile < 10) return null // só mostra se for top 90%+

  const firstName = userName.split(' ')[0] ?? 'Você'

  // Determina badge baseado no percentil
  const badge =
    percentile >= 95 ? { label: 'Top 5%', color: '#F5C842', emoji: '👑' } :
    percentile >= 90 ? { label: 'Top 10%', color: '#F5C842', emoji: '🏆' } :
    percentile >= 75 ? { label: 'Top 25%', color: '#FF4D00', emoji: '🥇' } :
    percentile >= 50 ? { label: 'Top 50%', color: '#00FF88', emoji: '🔥' } :
                       { label: 'Top 40%', color: '#7C3AED', emoji: '⚡' }

  return (
    <div
      className="rounded-2xl p-5 relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${badge.color}0C 0%, rgba(13,24,41,0.98) 100%)`,
        border: `1px solid ${badge.color}22`,
      }}
    >
      <div
        className="absolute -top-6 -right-6 w-28 h-28 rounded-full pointer-events-none blur-2xl"
        style={{ backgroundColor: badge.color, opacity: 0.10 }}
      />

      <div className="relative z-10 flex items-center gap-4">
        {/* Icon */}
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
          style={{ background: `${badge.color}12`, border: `1px solid ${badge.color}25` }}
        >
          {badge.emoji}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span
              className="text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-full"
              style={{ background: `${badge.color}18`, color: badge.color }}
            >
              {badge.label} de streak
            </span>
          </div>
          <p className="text-sm font-semibold leading-snug">
            {firstName} está entre os{' '}
            <span style={{ color: badge.color }} className="font-black">
              {100 - percentile}% mais consistentes
            </span>{' '}
            do Ascendia esta semana.
          </p>
          <p className="text-[11px] text-text-muted mt-0.5">
            Baseado em {allStreaks.length} usuários ativos
          </p>
        </div>

        {/* Streak badge */}
        <div className="text-right shrink-0">
          <div
            className="flex items-center gap-1 font-black text-xl"
            style={{ color: badge.color }}
          >
            <Flame size={18} fill="currentColor" />
            {userStreak}d
          </div>
          <div
            className="flex items-center gap-1 text-[10px] text-text-muted mt-0.5"
          >
            <TrendingUp size={9} />
            Top {100 - percentile}%
          </div>
        </div>
      </div>
    </div>
  )
}
