/**
 * Comeback Card — mostra quando o usuário perdeu o streak ontem.
 * Transforma o "fracasso" em motivação para hoje.
 * Aparece somente quando streak_current === 0 E havia uma streak anterior.
 */

import { createClient } from '@/lib/supabase/server'
import { todayString } from '@/lib/utils'
import { Flame, TrendingUp, Zap } from 'lucide-react'
import Link from 'next/link'

export async function ComebackCard({ userId }: { userId: string }) {
  const supabase = await createClient()
  const today = todayString()

  const [profileRes, habitLogsRes, xpRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('streak_current, streak_longest, xp_total, level, name')
      .eq('id', userId)
      .single(),
    supabase
      .from('habit_logs')
      .select('habit_id')
      .eq('user_id', userId)
      .eq('logged_date', today),
    supabase
      .from('xp_transactions')
      .select('amount')
      .eq('user_id', userId)
      .gte('created_at', `${today}T00:00:00`)
  ])

  const profile = profileRes.data
  if (!profile) return null

  // Só mostra se streak atual é 0 E já teve streak antes
  const isComeback = profile.streak_current === 0 && profile.streak_longest > 0
  if (!isComeback) return null

  const habitsDoneToday = (habitLogsRes.data ?? []).length
  const xpToday = (xpRes.data ?? []).reduce((s, t) => s + (t.amount ?? 0), 0)
  const startedComebackToday = habitsDoneToday > 0 || xpToday > 0

  const firstName = (profile.name ?? '').split(' ')[0] ?? 'você'

  return (
    <div
      className="rounded-2xl p-5 md:p-6 relative overflow-hidden animate-bounce-in"
      style={{
        background: 'linear-gradient(135deg, rgba(255,77,0,0.10) 0%, rgba(13,24,41,0.98) 55%, rgba(124,58,237,0.08) 100%)',
        border: '1px solid rgba(255,77,0,0.25)',
      }}
    >
      {/* Animated glow */}
      <div
        className="absolute -top-10 -right-10 w-48 h-48 rounded-full pointer-events-none blur-3xl animate-glow-orange"
        style={{ background: 'rgba(255,77,0,0.07)' }}
      />
      <div
        className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full pointer-events-none blur-2xl"
        style={{ background: 'rgba(124,58,237,0.06)' }}
      />

      <div className="relative z-10">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            {/* Label */}
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(255,77,0,0.15)', border: '1px solid rgba(255,77,0,0.3)' }}
              >
                <Flame size={12} style={{ color: '#FF4D00' }} />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#FF4D00' }}>
                Hora do Comeback
              </span>
            </div>

            {/* Headline */}
            <h2 className="text-xl font-black mb-1">
              {startedComebackToday
                ? `${firstName}, você já começou! 🔥`
                : `${firstName}, hoje é o dia do comeback! 💪`}
            </h2>
            <p className="text-sm text-text-secondary mb-4">
              {startedComebackToday
                ? `Você perdeu o streak de ${profile.streak_longest}d, mas já deu o primeiro passo hoje. Continue!`
                : `Você chegou a ${profile.streak_longest} dias de streak. Uma nova sequência começa agora.`}
            </p>

            {/* Stats row */}
            <div className="flex items-center gap-4 mb-4">
              <div className="text-center">
                <div className="text-xl font-black" style={{ color: '#FF4D00' }}>
                  {profile.streak_longest}d
                </div>
                <div className="text-[9px] text-text-muted uppercase tracking-wider">recorde</div>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center">
                <div className="text-xl font-black" style={{ color: '#F5C842' }}>
                  Lv {profile.level}
                </div>
                <div className="text-[9px] text-text-muted uppercase tracking-wider">seu nível</div>
              </div>
              {xpToday > 0 && (
                <>
                  <div className="w-px h-8 bg-white/10" />
                  <div className="text-center">
                    <div className="flex items-center gap-0.5 justify-center">
                      <Zap size={12} style={{ color: '#F5C842' }} fill="currentColor" />
                      <span className="text-xl font-black" style={{ color: '#F5C842' }}>+{xpToday}</span>
                    </div>
                    <div className="text-[9px] text-text-muted uppercase tracking-wider">hoje</div>
                  </div>
                </>
              )}
            </div>

            {/* CTA buttons */}
            <div className="flex items-center gap-3 flex-wrap">
              <Link
                href="/habitos"
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:scale-105"
                style={{
                  background: 'rgba(255,77,0,0.15)',
                  border: '1px solid rgba(255,77,0,0.35)',
                  color: '#FF4D00',
                }}
              >
                <Flame size={14} />
                Registrar Hábito
              </Link>
              <Link
                href="/treinos/novo"
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:scale-105"
                style={{
                  background: 'rgba(124,58,237,0.12)',
                  border: '1px solid rgba(124,58,237,0.25)',
                  color: '#9F5AF7',
                }}
              >
                <TrendingUp size={14} />
                Treinar Agora
              </Link>
            </div>
          </div>

          {/* Big comeback emoji */}
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shrink-0 animate-float"
            style={{
              background: 'rgba(255,77,0,0.1)',
              border: '1px solid rgba(255,77,0,0.2)',
            }}
          >
            {startedComebackToday ? '🔥' : '⚡'}
          </div>
        </div>

        {/* Progress hint */}
        {!startedComebackToday && (
          <div
            className="mt-4 rounded-xl px-4 py-3 flex items-center gap-3"
            style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)' }}
          >
            <span className="text-lg">🏆</span>
            <p className="text-xs text-text-secondary">
              Registre <strong className="text-white">1 hábito</strong> hoje para começar sua nova sequência.
              Seu recorde de <strong className="text-brand-orange">{profile.streak_longest} dias</strong> ainda pode ser superado.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
