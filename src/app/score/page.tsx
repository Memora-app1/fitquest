import type { Metadata } from 'next'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components/layout/app-shell'
import { getLevelInfo, getXpProgressToNextLevel } from '@/lib/xp'
import { XpChartLazy as XpChart } from '@/components/score/xp-chart-lazy'
import { XpSourceBreakdown } from '@/components/score/xp-source-breakdown'
import { Lock, Zap, Flame, Star, Trophy, Dumbbell, CheckSquare, Target, TrendingUp } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Seu Score',
  description: 'Acompanhe seu nível, XP total, streak e conquistas desbloqueadas no Ascendia.',
}

export const dynamic = 'force-dynamic'

const RARITY_CONFIG: Record<string, { label: string; color: string; glow: string; badge: string }> = {
  common:    { label: 'Comum',   color: '#8899BB', glow: 'rgba(136,153,187,0.15)', badge: 'text-text-muted bg-bg-elevated' },
  rare:      { label: 'Raro',    color: '#3B82F6', glow: 'rgba(59,130,246,0.2)',   badge: 'text-blue-400 bg-blue-500/10' },
  epic:      { label: 'Épico',   color: '#7C3AED', glow: 'rgba(124,58,237,0.25)',  badge: 'text-brand-purple bg-brand-purple/10' },
  legendary: { label: 'Lendário', color: '#F5C842', glow: 'rgba(245,200,66,0.3)',  badge: 'text-brand-gold bg-brand-gold/10' },
}

// Builds the SVG arc path for the circular progress ring
function buildArcPath(cx: number, cy: number, r: number, pct: number) {
  const angle = (pct / 100) * 360
  const rad = (angle - 90) * (Math.PI / 180)
  const x = cx + r * Math.cos(rad)
  const y = cy + r * Math.sin(rad)
  const large = angle > 180 ? 1 : 0
  return `M ${cx} ${cy - r} A ${r} ${r} 0 ${large} 1 ${x} ${y}`
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

  const levelColors: Record<number, string> = {
    1: '#8899BB', 2: '#7C3AED', 3: '#3B82F6', 4: '#00FF88',
    5: '#FF4D00', 6: '#EC4899', 7: '#F5C842', 8: '#F5C842',
  }
  const levelColor = levelColors[profile.level] ?? '#F5C842'

  const arcPath = buildArcPath(60, 60, 50, progress.percentage)

  return (
    <AppShell>
      <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">

        {/* Page header */}
        <div
          className="rounded-2xl p-6 relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${levelColor}0D 0%, rgba(13,24,41,0.98) 60%, rgba(124,58,237,0.04) 100%)`,
            border: `1px solid ${levelColor}25`,
          }}
        >
          <div
            className="absolute -top-8 -right-8 w-40 h-40 rounded-full pointer-events-none"
            style={{ background: `radial-gradient(circle, ${levelColor}15 0%, transparent 70%)` }}
          />
          <div className="relative z-10 flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="heading-display text-4xl md:text-5xl">Seu Score</h1>
              <p className="text-text-secondary mt-1">Sua evolução em números.</p>
            </div>
            {xpThisWeek > 0 && (
              <div
                className="flex items-center gap-2 text-sm px-3 py-2 rounded-xl"
                style={{ background: 'rgba(245,200,66,0.1)', border: '1px solid rgba(245,200,66,0.25)' }}
              >
                <TrendingUp size={14} className="text-brand-gold" />
                <span className="font-bold text-brand-gold">+{xpThisWeek.toLocaleString('pt-BR')} XP</span>
                <span className="text-text-muted">essa semana</span>
              </div>
            )}
          </div>
        </div>

        {/* Level hero */}
        <div
          className="rounded-2xl p-8 relative overflow-hidden"
          style={{
            background: `radial-gradient(ellipse at 30% 50%, ${levelColor}10 0%, transparent 60%), #0D1829`,
            border: `1px solid ${levelColor}30`,
            boxShadow: `0 24px 60px rgba(0,0,0,0.5), 0 0 40px ${levelColor}08`,
          }}
        >
          {/* Decorative glow */}
          <div
            className="absolute -top-8 -right-8 w-48 h-48 rounded-full blur-[60px] pointer-events-none opacity-30"
            style={{ backgroundColor: levelColor }}
          />

          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Circular arc progress */}
            <div className="relative shrink-0">
              <svg width="120" height="120" className="rotate-0">
                {/* Track */}
                <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
                {/* Progress arc */}
                {progress.percentage > 0 && (
                  <path
                    d={arcPath}
                    fill="none"
                    stroke={levelColor}
                    strokeWidth="8"
                    strokeLinecap="round"
                    style={{ filter: `drop-shadow(0 0 8px ${levelColor})` }}
                  />
                )}
              </svg>
              {/* Center content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-3xl">{levelInfo.emoji}</div>
                <div className="heading-display text-lg leading-tight" style={{ color: levelColor }}>
                  Nv {profile.level}
                </div>
              </div>
            </div>

            {/* Level info */}
            <div className="flex-1 text-center md:text-left">
              <div className="text-text-muted text-sm uppercase tracking-widest mb-1">Nível {profile.level} de 8</div>
              <div className="heading-display text-5xl md:text-6xl gradient-text leading-none mb-3">
                {levelInfo.title}
              </div>

              {progress.needed > 0 ? (
                <div className="space-y-2 max-w-md">
                  <div className="flex justify-between text-xs text-text-muted">
                    <span className="flex items-center gap-1">
                      <Zap size={11} className="text-brand-gold" />
                      {profile.xp_total.toLocaleString('pt-BR')} XP
                    </span>
                    <span style={{ color: levelColor }}>
                      {(progress.needed - progress.current).toLocaleString('pt-BR')} XP até nível {profile.level + 1}
                    </span>
                  </div>
                  <div className="h-2.5 bg-bg-elevated rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700 relative"
                      style={{
                        width: `${progress.percentage}%`,
                        background: `linear-gradient(90deg, ${levelColor}99, ${levelColor})`,
                        boxShadow: `0 0 10px ${levelColor}60`,
                      }}
                    />
                  </div>
                  <div className="text-xs text-text-muted">{progress.percentage}% para o próximo nível</div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-brand-gold font-bold">
                  <Trophy size={18} />
                  Nível máximo alcançado!
                </div>
              )}
            </div>

            {/* XP total badge */}
            <div className="text-center md:text-right shrink-0">
              <div className="heading-display text-4xl text-brand-gold">
                {profile.xp_total.toLocaleString('pt-BR')}
              </div>
              <div className="text-xs text-text-muted uppercase tracking-widest">XP Total</div>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            icon={<Flame size={20} className="text-brand-orange" />}
            label="Streak atual"
            value={`${profile.streak_current}`}
            sub="dias"
            accent="#FF4D00"
            prefix="🔥"
          />
          <StatCard
            icon={<Flame size={20} className="text-brand-red" />}
            label="Recorde"
            value={`${profile.streak_longest}`}
            sub="dias"
            accent="#EF4444"
          />
          <StatCard
            icon={<Star size={20} className="text-brand-gold" />}
            label="Dias perfeitos"
            value={`${profile.perfect_days}`}
            sub="completos"
            accent="#F5C842"
          />
          <StatCard
            icon={<Trophy size={20} className="text-brand-purple" />}
            label="Conquistas"
            value={`${unlockedAchievements.length}/${allAchievements.length}`}
            sub="desbloqueadas"
            accent="#7C3AED"
          />
          <StatCard
            icon={<Dumbbell size={20} className="text-brand-green" />}
            label="Treinos"
            value={`${workoutsCountRes.count ?? 0}`}
            accent="#00FF88"
          />
          <StatCard
            icon={<CheckSquare size={20} className="text-brand-purple" />}
            label="Tarefas"
            value={`${tasksCountRes.count ?? 0}`}
            sub="concluídas"
            accent="#7C3AED"
          />
          <StatCard
            icon={<Target size={20} className="text-brand-orange" />}
            label="Hábitos"
            value={`${habitsCountRes.count ?? 0}`}
            sub="registrados"
            accent="#FF4D00"
          />
          <StatCard
            icon={<Zap size={20} className="text-brand-gold" />}
            label="XP essa semana"
            value={`+${xpThisWeek.toLocaleString('pt-BR')}`}
            accent="#F5C842"
          />
        </div>

        {/* XP Chart */}
        <section
          className="rounded-2xl p-6"
          style={{
            background: 'linear-gradient(135deg, rgba(245,200,66,0.06) 0%, rgba(13,24,41,0.98) 100%)',
            border: '1px solid rgba(245,200,66,0.15)',
          }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold">XP — últimos 7 dias</h2>
            <span
              className="text-sm font-bold px-3 py-1 rounded-xl"
              style={{ background: 'rgba(245,200,66,0.12)', border: '1px solid rgba(245,200,66,0.25)', color: '#F5C842' }}
            >
              +{xpThisWeek.toLocaleString('pt-BR')} XP
            </span>
          </div>
          <XpChart data={dailyXp} />
        </section>

        {/* XP source breakdown — 90 days */}
        <Suspense fallback={<div className="h-48 rounded-2xl shimmer" />}>
          <XpSourceBreakdown userId={user.id} />
        </Suspense>

        {/* Unlocked achievements */}
        {unlockedAchievements.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-2xl font-bold">Conquistas</h2>
              <span className="text-sm bg-brand-gold/20 text-brand-gold px-3 py-0.5 rounded-full font-bold border border-brand-gold/20">
                {unlockedAchievements.length} desbloqueadas
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {unlockedAchievements.map((a) => {
                const cfg = RARITY_CONFIG[a.rarity] ?? RARITY_CONFIG.common!
                const unlockedAt = unlockedDates.get(a.id)
                return (
                  <div
                    key={a.id}
                    className="rounded-2xl p-4 text-center relative overflow-hidden transition-transform hover:scale-[1.02]"
                    style={{
                      background: `linear-gradient(135deg, ${cfg.color}0A 0%, rgba(13,24,41,0.98) 100%)`,
                      border: `1px solid ${cfg.color}30`,
                      boxShadow: `0 0 20px ${cfg.glow}`,
                    }}
                  >
                    {/* Rarity glow background */}
                    <div
                      className="absolute inset-0 opacity-5 pointer-events-none"
                      style={{ background: `radial-gradient(circle at 50% 30%, ${cfg.color} 0%, transparent 70%)` }}
                    />

                    {/* Rarity badge */}
                    <div className="absolute top-2 right-2">
                      <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full ${cfg.badge}`}>
                        {cfg.label}
                      </span>
                    </div>

                    <div className="text-4xl mb-2 mt-2 relative z-10">{a.icon}</div>
                    <div className="font-bold text-sm relative z-10">{a.name}</div>
                    <div className="text-xs text-text-muted mt-1 line-clamp-2 relative z-10">{a.description}</div>
                    <div className="mt-2 relative z-10">
                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{ color: cfg.color, backgroundColor: `${cfg.color}15` }}
                      >
                        +{a.xp_reward} XP
                      </span>
                    </div>
                    {unlockedAt && (
                      <div className="text-[10px] text-text-muted mt-1.5 relative z-10">
                        {new Date(unlockedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: '2-digit' })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Locked achievements */}
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
                const cfg = RARITY_CONFIG[a.rarity] ?? RARITY_CONFIG.common!
                return (
                  <div
                    key={a.id}
                    className="rounded-2xl p-4 text-center relative overflow-hidden opacity-45 hover:opacity-60 transition-opacity"
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <div className="absolute top-2 right-2">
                      <Lock size={12} className="text-text-muted" />
                    </div>
                    <div className="text-4xl mb-2 mt-2 grayscale">{a.icon}</div>
                    <div className="font-bold text-sm text-text-secondary">{a.name}</div>
                    <div className="text-xs text-text-muted mt-1 line-clamp-2">{a.description}</div>
                    <div className="mt-2">
                      <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full ${cfg.badge}`}>
                        {cfg.label} · +{a.xp_reward} XP
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {allAchievements.length === 0 && (
          <div
            className="rounded-2xl p-10 text-center text-text-secondary"
            style={{
              background: 'linear-gradient(135deg, rgba(245,200,66,0.07) 0%, rgba(13,24,41,0.99) 100%)',
              border: '1px solid rgba(245,200,66,0.2)',
            }}
          >
            <div className="text-5xl mb-4">🏆</div>
            <p className="font-medium">Nenhuma conquista cadastrada ainda.</p>
            <p className="text-sm text-text-muted mt-1">Continue usando o Ascendia para desbloquear conquistas!</p>
          </div>
        )}
      </div>
    </AppShell>
  )
}

function StatCard({
  icon,
  label,
  value,
  sub,
  accent,
  prefix,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub?: string
  accent: string
  prefix?: string
}) {
  return (
    <div
      className="rounded-2xl p-4 relative overflow-hidden transition-all hover:scale-[1.02]"
      style={{
        background: `linear-gradient(135deg, ${accent}0D 0%, rgba(13,24,41,0.98) 100%)`,
        border: `1px solid ${accent}22`,
        boxShadow: `0 4px 16px ${accent}06`,
      }}
    >
      <div
        className="absolute -top-4 -right-4 w-16 h-16 rounded-full blur-xl pointer-events-none"
        style={{ backgroundColor: accent, opacity: 0.15 }}
      />
      <div className="flex items-center gap-2 mb-2 relative z-10">
        {icon}
        <span className="text-xs text-text-muted uppercase tracking-wider">{label}</span>
      </div>
      <div className="heading-display text-3xl leading-tight relative z-10">
        {prefix}{value}
      </div>
      {sub && <div className="text-xs text-text-secondary mt-0.5 relative z-10">{sub}</div>}
    </div>
  )
}
