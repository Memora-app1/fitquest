import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components/layout/app-shell'
import { getLevelInfo, getXpProgressToNextLevel } from '@/lib/xp'

export const metadata: Metadata = {
  title: 'Seu Score',
  description: 'Acompanhe seu nível, XP total, streak e conquistas desbloqueadas no FitQuest.',
}

export const dynamic = 'force-dynamic'

export default async function ScorePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profileRes, achievementsRes, xpLastWeekRes, workoutsCountRes, tasksCountRes] = await Promise.all([
    supabase.from('profiles').select('level, xp_total, streak_current, streak_longest, perfect_days').eq('id', user.id).single(),
    supabase
      .from('user_achievements')
      .select('unlocked_at, achievement:achievements(*)')
      .eq('user_id', user.id)
      .order('unlocked_at', { ascending: false }),
    supabase
      .from('xp_transactions')
      .select('amount, created_at')
      .eq('user_id', user.id)
      .gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString()),
    supabase.from('workouts').select('id', { count: 'exact', head: true }).eq('user_id', user.id).not('finished_at', 'is', null),
    supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'done'),
  ])

  const profile = profileRes.data
  if (!profile) redirect('/onboarding')

  const levelInfo = getLevelInfo(profile.level)
  const progress = getXpProgressToNextLevel(profile.xp_total)
  const xpThisWeek = (xpLastWeekRes.data ?? []).reduce((s, t) => s + (t.amount || 0), 0)

  return (
    <AppShell>
      <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="heading-display text-4xl">Seu Score</h1>
          <p className="text-text-secondary">Sua evolução em números.</p>
        </div>

        {/* Level grande */}
        <div className="card-glow p-8 text-center">
          <div className="text-6xl mb-2">{levelInfo.emoji}</div>
          <div className="heading-display text-5xl gradient-text">{levelInfo.title}</div>
          <div className="text-text-secondary mt-1">Level {profile.level}</div>

          <div className="mt-6 max-w-md mx-auto">
            <div className="h-4 bg-bg-elevated rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-brand transition-all"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
            <div className="text-sm text-text-muted mt-2">
              {profile.xp_total.toLocaleString('pt-BR')} XP total
              {progress.needed > 0 && (
                <> · {(progress.needed - progress.current).toLocaleString('pt-BR')} para o próximo nível</>
              )}
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Streak atual" value={`🔥 ${profile.streak_current}`} sub="dias" />
          <StatCard label="Recorde" value={`${profile.streak_longest}`} sub="dias" />
          <StatCard label="XP essa semana" value={`+${xpThisWeek}`} />
          <StatCard label="Dias perfeitos" value={`${profile.perfect_days}`} />
          <StatCard label="Treinos" value={`${workoutsCountRes.count ?? 0}`} />
          <StatCard label="Tarefas concluídas" value={`${tasksCountRes.count ?? 0}`} />
          <StatCard label="Conquistas" value={`${achievementsRes.data?.length ?? 0}`} />
          <StatCard label="Nível atual" value={`${profile.level}/8`} />
        </div>

        {/* Conquistas */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Conquistas</h2>
          {achievementsRes.data && achievementsRes.data.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {achievementsRes.data.map((ua) => {
                const a = ua.achievement as unknown as { name: string; description: string; icon: string; rarity: string }
                if (!a) return null
                return (
                  <div key={a.name} className="card p-4 text-center">
                    <div className="text-4xl mb-2">{a.icon}</div>
                    <div className="font-bold text-sm">{a.name}</div>
                    <div className="text-xs text-text-muted mt-1">{a.description}</div>
                    <div
                      className={`text-[10px] mt-2 font-bold uppercase ${
                        a.rarity === 'legendary'
                          ? 'text-brand-gold'
                          : a.rarity === 'epic'
                          ? 'text-brand-purple'
                          : a.rarity === 'rare'
                          ? 'text-brand-blue'
                          : 'text-text-muted'
                      }`}
                    >
                      {a.rarity}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="card p-8 text-center text-text-secondary">
              Nenhuma conquista ainda. Continue jogando!
            </div>
          )}
        </section>
      </div>
    </AppShell>
  )
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="card p-4">
      <div className="text-xs text-text-muted uppercase tracking-wider">{label}</div>
      <div className="heading-display text-3xl mt-1">{value}</div>
      {sub && <div className="text-xs text-text-secondary">{sub}</div>}
    </div>
  )
}
