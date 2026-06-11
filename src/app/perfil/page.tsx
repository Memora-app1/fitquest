import type { Metadata } from 'next'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components/layout/app-shell'
import Link from 'next/link'
import { formatDateBR } from '@/lib/utils'
import { PerfilForm } from '@/components/perfil/perfil-form'
import { XpHistory } from '@/components/perfil/xp-history'
import { AchievementsShowcase } from '@/components/perfil/achievements-showcase'
import { XpLevelJourney } from '@/components/perfil/xp-level-journey'
import { DailyActivityMap } from '@/components/perfil/daily-activity-map'
import { RpgCharacter } from '@/components/perfil/rpg-character'
import { ReferralWidget } from '@/components/perfil/referral-widget'
import { Trophy, Flame, Zap, Star, Calendar, Target, Dumbbell, CheckSquare, Crown, ExternalLink } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Perfil',
  description: 'Gerencie sua conta, assinatura e preferências do Ascendia.',
}

export const dynamic = 'force-dynamic'

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string; border: string; emoji: string }> = {
  trial:     { label: 'Trial (7 dias grátis)', color: '#F5C842', bg: 'rgba(245,200,66,0.1)', border: 'rgba(245,200,66,0.3)', emoji: '⏳' },
  active:    { label: 'Ativo', color: '#00FF88', bg: 'rgba(0,255,136,0.1)', border: 'rgba(0,255,136,0.3)', emoji: '✅' },
  cancelled: { label: 'Cancelado', color: '#EF4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)', emoji: '❌' },
  expired:   { label: 'Expirado', color: '#EF4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)', emoji: '🔴' },
  lifetime:  { label: 'Vitalício', color: '#F5C842', bg: 'rgba(245,200,66,0.1)', border: 'rgba(245,200,66,0.3)', emoji: '👑' },
}

const PLAN_LABELS: Record<string, string> = {
  monthly:  'Mensal (R$ 37/mês)',
  annual:   'Anual (R$ 306,60/ano)',
  lifetime: 'Vitalício — acesso para sempre',
}

const LEVEL_TITLES: Record<number, string> = {
  1: 'Iniciante', 2: 'Dedicado', 3: 'Consistente', 4: 'Atleta',
  5: 'Guerreiro', 6: 'Elite', 7: 'Lendário', 8: 'Ascendia Master',
}

const LEVEL_COLORS: Record<number, string> = {
  1: '#8899BB', 2: '#7C3AED', 3: '#3B82F6', 4: '#00FF88',
  5: '#FF4D00', 6: '#EC4899', 7: '#F5C842', 8: '#F5C842',
}

export default async function PerfilPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profileRes, workoutsRes, habitsRes, tasksRes, achievementsRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('name, avatar_url, bio, subscription_status, subscription_plan, trial_end, subscription_end, created_at, xp_total, level, streak_current, streak_longest, perfect_days, stripe_customer_id')
      .eq('id', user.id)
      .single(),
    supabase
      .from('workouts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id),
    supabase
      .from('habits')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_active', true),
    supabase
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'done'),
    supabase
      .from('user_achievements')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id),
  ])

  if (!profileRes.data) redirect('/onboarding')

  const profile = profileRes.data
  const status = STATUS_LABELS[profile.subscription_status] ?? {
    label: profile.subscription_status, color: '#8899BB', bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.1)', emoji: '❓',
  }
  const levelTitle = LEVEL_TITLES[profile.level] ?? 'Avançado'
  const levelColor = LEVEL_COLORS[profile.level] ?? '#F5C842'

  const statsItems = [
    {
      icon: <Zap size={16} className="text-brand-gold" fill="currentColor" />,
      label: 'XP Total',
      value: profile.xp_total.toLocaleString('pt-BR'),
      accent: '#F5C842',
    },
    {
      icon: <Star size={16} className="text-brand-purple" />,
      label: 'Nível',
      value: `${profile.level} — ${levelTitle}`,
      accent: levelColor,
    },
    {
      icon: <Flame size={16} className="text-brand-orange" fill="currentColor" />,
      label: 'Streak Atual',
      value: `${profile.streak_current} dias`,
      accent: '#FF4D00',
    },
    {
      icon: <Flame size={16} className="text-brand-red" fill="currentColor" />,
      label: 'Recorde de Streak',
      value: `${profile.streak_longest} dias`,
      accent: '#EF4444',
    },
    {
      icon: <Star size={16} className="text-brand-gold" fill="currentColor" />,
      label: 'Dias Perfeitos',
      value: `${profile.perfect_days}`,
      accent: '#F5C842',
    },
    {
      icon: <Dumbbell size={16} className="text-brand-green" />,
      label: 'Treinos',
      value: `${workoutsRes.count ?? 0}`,
      accent: '#00FF88',
    },
    {
      icon: <Target size={16} className="text-brand-orange" />,
      label: 'Hábitos Ativos',
      value: `${habitsRes.count ?? 0}`,
      accent: '#FF4D00',
    },
    {
      icon: <CheckSquare size={16} className="text-brand-purple" />,
      label: 'Tarefas Concluídas',
      value: `${tasksRes.count ?? 0}`,
      accent: '#7C3AED',
    },
    {
      icon: <Trophy size={16} className="text-brand-gold" />,
      label: 'Conquistas',
      value: `${achievementsRes.count ?? 0}`,
      accent: '#F5C842',
    },
    {
      icon: <Calendar size={16} className="text-text-secondary" />,
      label: 'Membro desde',
      value: formatDateBR(profile.created_at),
      accent: '#8899BB',
    },
  ]

  return (
    <AppShell>
      <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-6">

        {/* ── Hero Header ─────────────────────────────────────────────── */}
        <div
          className="rounded-2xl p-6 relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${levelColor}10 0%, rgba(13,24,41,0.98) 60%, rgba(124,58,237,0.05) 100%)`,
            border: `1px solid ${levelColor}25`,
          }}
        >
          <div
            className="absolute -top-8 -right-8 w-40 h-40 rounded-full pointer-events-none"
            style={{ background: `radial-gradient(circle, ${levelColor}15 0%, transparent 70%)` }}
          />
          <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="heading-display text-4xl md:text-5xl">Perfil</h1>
              <p className="text-text-secondary mt-1">{profile.name}</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div
                className="px-3 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5"
                style={{ background: `${levelColor}15`, border: `1px solid ${levelColor}30`, color: levelColor }}
              >
                <Star size={13} />
                Lv {profile.level} — {levelTitle}
              </div>
              {profile.subscription_status === 'lifetime' && (
                <div
                  className="px-3 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5"
                  style={{ background: 'rgba(245,200,66,0.15)', border: '1px solid rgba(245,200,66,0.3)', color: '#F5C842' }}
                >
                  <Crown size={13} />
                  Vitalício
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Edit Forms */}
        <PerfilForm
          userId={user.id}
          initialName={profile.name}
          initialAvatarUrl={profile.avatar_url}
          initialBio={profile.bio}
          email={user.email ?? ''}
        />

        {/* ── XP Level roadmap + source breakdown + monthly chart ─────── */}
        <XpLevelJourney
          userId={user.id}
          xpTotal={profile.xp_total}
          currentLevel={profile.level}
        />

        {/* Referral — indicação de amigos com XP bônus */}
        <ReferralWidget />

        {/* Heavy analytics — streamed independently */}
        <Suspense fallback={<div className="h-40 rounded-2xl shimmer" />}>
          <DailyActivityMap userId={user.id} />
        </Suspense>
        <Suspense fallback={<div className="h-48 rounded-2xl shimmer" />}>
          <XpHistory userId={user.id} />
        </Suspense>
        <Suspense fallback={<div className="h-48 rounded-2xl shimmer" />}>
          <AchievementsShowcase userId={user.id} />
        </Suspense>
        <Suspense fallback={<div className="h-56 rounded-2xl shimmer" />}>
          <RpgCharacter userId={user.id} />
        </Suspense>

        {/* Stats */}
        <section>
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Trophy size={18} className="text-brand-gold" />
            Suas estatísticas
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {statsItems.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl p-4 relative overflow-hidden transition-all hover:scale-[1.02]"
                style={{
                  background: `linear-gradient(135deg, ${stat.accent}08 0%, rgba(13,24,41,0.98) 100%)`,
                  border: `1px solid ${stat.accent}20`,
                }}
              >
                <div
                  className="absolute -top-3 -right-3 w-10 h-10 rounded-full pointer-events-none blur-xl"
                  style={{ backgroundColor: stat.accent, opacity: 0.15 }}
                />
                <div className="relative z-10">
                  <div className="flex items-center gap-1.5 mb-2">
                    {stat.icon}
                    <span className="text-xs text-text-muted uppercase tracking-wider leading-tight">{stat.label}</span>
                  </div>
                  <div className="font-bold text-sm">{stat.value}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Subscription */}
        <section
          className="rounded-2xl p-6 space-y-4"
          style={{
            background: `linear-gradient(135deg, ${status.bg.replace('0.1)', '0.06)')} 0%, rgba(13,24,41,0.98) 100%)`,
            border: `1px solid ${status.border}`,
          }}
        >
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Crown size={18} style={{ color: status.color }} />
            Assinatura
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-text-muted uppercase mb-1.5 tracking-wider">Status</div>
              <div
                className="font-bold flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl w-fit"
                style={{ background: status.bg, border: `1px solid ${status.border}`, color: status.color }}
              >
                <span>{status.emoji}</span>
                <span>{status.label}</span>
              </div>
            </div>

            {profile.subscription_plan && (
              <div>
                <div className="text-xs text-text-muted uppercase mb-1.5 tracking-wider">Plano</div>
                <div className="font-medium text-sm">{PLAN_LABELS[profile.subscription_plan] ?? profile.subscription_plan}</div>
              </div>
            )}

            {profile.trial_end && profile.subscription_status === 'trial' && (
              <div>
                <div className="text-xs text-text-muted uppercase mb-1.5 tracking-wider">Trial termina em</div>
                <div className="text-brand-gold font-bold text-sm">{formatDateBR(profile.trial_end)}</div>
              </div>
            )}

            {profile.subscription_end && (
              <div>
                <div className="text-xs text-text-muted uppercase mb-1.5 tracking-wider">Próxima renovação</div>
                <div className="text-sm">{formatDateBR(profile.subscription_end)}</div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href="/planos" className="btn-primary inline-flex items-center gap-2">
              <Star size={16} />
              Ver planos
            </Link>
            {profile.stripe_customer_id && (
              profile.subscription_status === 'active' || profile.subscription_status === 'cancelled'
            ) && (
              <form action="/api/billing-portal" method="POST">
                <button
                  type="submit"
                  className="btn-ghost inline-flex items-center gap-2"
                >
                  <ExternalLink size={16} />
                  Portal Stripe
                </button>
              </form>
            )}
          </div>
        </section>

        {/* Danger zone */}
        <section
          className="rounded-2xl p-6"
          style={{
            background: 'rgba(239,68,68,0.04)',
            border: '1px solid rgba(239,68,68,0.2)',
          }}
        >
          <h2 className="text-lg font-bold text-brand-red mb-3">Zona de perigo</h2>
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="btn-ghost w-full text-brand-red border-brand-red/40 hover:bg-brand-red/10"
            >
              Sair da conta
            </button>
          </form>
        </section>
      </div>
    </AppShell>
  )
}
