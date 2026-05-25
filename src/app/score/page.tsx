import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components/layout/app-shell'
import { getLevelInfo, getXpProgressToNextLevel } from '@/lib/xp'
import { XpChartLazy as XpChart } from '@/components/score/xp-chart-lazy'
import { Lock } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Seu Score',
  description: 'Acompanhe seu nível, XP total, streak e conquistas desbloqueadas no FitQuest.',
}

export const dynamic = 'force-dynamic'

const RARITY_STYLES: Record<string, { label: string; class: string }> = {
  common: { label: 'Comum', class: 'text-text-muted' },
  rare: { label: 'Raro', class: 'text-brand-blue' },
  epic: { label: 'Épico', class: 'text-brand-purple' },
  legendary: { label: 'Lendário', class: 'text-brand-gold' },
}

export default async function ScorePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profileRes, unlockedRes, allAchievementsRes, xpLastWeekRes, workoutsCountRes, tasksCountRes, habitsCountRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('level, xp_total, streak_current, streak_longest, perfect_days')
      .eq('id', user.id)
      .single(),
    supabase
      .from('user_achievements')
      .select('achievement_id, unlocked_at')
      .eq('user_id', user.id),
    supabase
      .from('achievements')
      .select('id, name, description, icon, category, xp_reward, rarity')
      .order('rarity'),
    supabase
      .from('xp_transactions')
      .select('amount, created_at')
      .eq('user_id', user.id)
      .gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString()),
    supabase
      .from('workouts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id),
    supabase
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'done'),
    supabase
      .from('habit_logs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id),
  ])

  const profile = profileRes.data
  if (!profile) redirect('/onboarding')

  const levelInfo = getLevelInfo(profile.level)
  const progress = getXpProgressToNextLevel(profile.xp_total)
  const xpThisWeek = (xpLastWeekRes.data ?? []).reduce((s, t) => s + (t.amount || 0), 0)

  const unlockedSet = new Set((unlockedRes.data ?? []).map((u) => u.achievement_id))
  const unlockedDates = new Map((unlockedRes.data ?? []).map((u) => [u.achievement_id, u.unlocked_at]))
  const allAchievements = allAchievementsRes.data ?? []
  const unlockedAchievements = allAchievements.filter((a) => unlockedSet.has(a.id))
  const lockedAchievements = allAchievements.filter((a) => !unlockedSet.has(a.id))

  // Build XP daily chart
  const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  const xpByDay: Record<string, number> = {}
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    xpByDay[d.toISOString().split('T')[0]!] = 0
  }
  for (const tx of xpLastWeekRes.data ?? []) {
    const key = tx.created_at.split('T')[0]
    if (key && key in xpByDay) xpByDay[key] = (xpByDay[key] ?? 0) + (tx.amount || 0)
  }
  const dailyXp = Object.entries(xpByDay).map(([date, xp]) => ({
    day: DAY_LABELS[new Date(date + 'T12:00:00').getDay()]!,
    xp,
  }))

  return (
    <AppShell>
      <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="heading-display text-4xl">Seu Score</h1>
          <p className="text-text-secondary">Sua evolução em números.</p>
        </div>

        {/* Level hero */}
        <div className="card-glow p-8 text-center">
          <div className="text-7xl mb-3">{levelInfo.emoji}</div>
          <div className="heading-display text-5xl gradient-text">{levelInfo.title}</div>
          <div className="text-text-secondary mt-1 font-medium">Level {profile.level} de 8</div>

          <div className="mt-6 max-w-md mx-auto">
            <div className="flex justify-between text-xs text-text-muted mb-1.5">
              <span>{profile.xp_total.toLocaleString('pt-BR')} XP</span>
              {progress.needed > 0 && (
                <span>{(progress.needed - progress.current).toLocaleString('pt-BR')} XP para nível {profile.level + 1}</span>
              )}
            </div>
            <div className="h-4 bg-bg-elevated rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-brand transition-all duration-500"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
            {progress.needed === 0 && (
              <div className="text-brand-gold font-bold text-sm mt-2">🏆 Nível máximo alcançado!</div>
            )}
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Streak atual" value={`🔥 ${profile.streak_current}`} sub="dias" />
          <StatCard label="Recorde" value={`${profile.streak_longest}`} sub="dias" />
          <StatCard label="XP essa semana" value={`+${xpThisWeek.toLocaleString('pt-BR')}`} />
          <StatCard label="Dias perfeitos" value={`${profile.perfect_days}`} />
          <StatCard label="Treinos" value={`${workoutsCountRes.count ?? 0}`} />
          <StatCard label="Tarefas concluídas" value={`${tasksCountRes.count ?? 0}`} />
          <StatCard label="Hábitos registrados" value={`${habitsCountRes.count ?? 0}`} />
          <StatCard
            label="Conquistas"
            value={`${unlockedAchievements.length}/${allAchievements.length}`}
          />
        </div>

        {/* XP Chart */}
        <section className="card p-6">
          <h2 className="text-lg font-bold mb-4">XP — últimos 7 dias</h2>
          <XpChart data={dailyXp} />
        </section>

        {/* Conquistas desbloqueadas */}
        {unlockedAchievements.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-2xl font-bold">Conquistas</h2>
              <span className="text-sm bg-brand-gold/20 text-brand-gold px-3 py-0.5 rounded-full font-medium">
                {unlockedAchievements.length} desbloqueadas
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {unlockedAchievements.map((a) => {
                const rarityStyle = RARITY_STYLES[a.rarity] ?? RARITY_STYLES.common!
                const unlockedAt = unlockedDates.get(a.id)
                return (
                  <div key={a.id} className="card p-4 text-center relative overflow-hidden">
                    <div className="absolute top-2 right-2">
                      <span className={`text-[10px] font-bold uppercase ${rarityStyle.class}`}>
                        {rarityStyle.label}
                      </span>
                    </div>
                    <div className="text-4xl mb-2 mt-1">{a.icon}</div>
                    <div className="font-bold text-sm">{a.name}</div>
                    <div className="text-xs text-text-muted mt-1 line-clamp-2">{a.description}</div>
                    <div className="text-xs text-brand-gold mt-2 font-medium">+{a.xp_reward} XP</div>
                    {unlockedAt && (
                      <div className="text-[10px] text-text-muted mt-1">
                        {new Date(unlockedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Conquistas bloqueadas */}
        {lockedAchievements.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-xl font-bold text-text-secondary">Em progresso</h2>
              <span className="text-sm bg-bg-elevated text-text-muted px-3 py-0.5 rounded-full">
                {lockedAchievements.length} restantes
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {lockedAchievements.map((a) => {
                const rarityStyle = RARITY_STYLES[a.rarity] ?? RARITY_STYLES.common!
                return (
                  <div key={a.id} className="card p-4 text-center opacity-50 relative">
                    <div className="absolute top-2 right-2">
                      <Lock size={12} className="text-text-muted" />
                    </div>
                    <div className="text-4xl mb-2 mt-1 grayscale">{a.icon}</div>
                    <div className="font-bold text-sm text-text-secondary">{a.name}</div>
                    <div className="text-xs text-text-muted mt-1 line-clamp-2">{a.description}</div>
                    <div className={`text-[10px] mt-2 font-bold uppercase ${rarityStyle.class}`}>
                      {rarityStyle.label} · +{a.xp_reward} XP
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {allAchievements.length === 0 && (
          <div className="card p-8 text-center text-text-secondary">
            <div className="text-4xl mb-3">🏆</div>
            <p>Nenhuma conquista cadastrada ainda. Continue jogando para desbloquear!</p>
          </div>
        )}
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
