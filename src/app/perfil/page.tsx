import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components/layout/app-shell'
import Link from 'next/link'
import { formatDateBR } from '@/lib/utils'
import { PerfilForm } from '@/components/perfil/perfil-form'
import { Trophy, Flame, Zap, Star, Calendar, Target, Dumbbell, CheckSquare } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Perfil',
  description: 'Gerencie sua conta, assinatura e preferências do FitQuest.',
}

export const dynamic = 'force-dynamic'

const STATUS_LABELS: Record<string, { label: string; color: string; emoji: string }> = {
  trial: { label: 'Trial (7 dias grátis)', color: 'text-brand-gold', emoji: '⏳' },
  active: { label: 'Ativo', color: 'text-brand-green', emoji: '✅' },
  cancelled: { label: 'Cancelado', color: 'text-brand-red', emoji: '❌' },
  expired: { label: 'Expirado', color: 'text-brand-red', emoji: '🔴' },
  lifetime: { label: 'Vitalício', color: 'text-brand-gold', emoji: '👑' },
}

const PLAN_LABELS: Record<string, string> = {
  monthly: 'Mensal (R$ 37/mês)',
  annual: 'Anual (R$ 306,60/ano)',
  lifetime: 'Vitalício — acesso para sempre',
}

const LEVEL_TITLES: Record<number, string> = {
  1: 'Iniciante',
  2: 'Dedicado',
  3: 'Consistente',
  4: 'Atleta',
  5: 'Guerreiro',
  6: 'Elite',
  7: 'Lendário',
  8: 'FitQuest Master',
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
      .select('name, avatar_url, bio, subscription_status, subscription_plan, trial_end, subscription_end, created_at, xp_total, level, streak_current, streak_longest, perfect_days')
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
    label: profile.subscription_status,
    color: '',
    emoji: '❓',
  }

  const levelTitle = LEVEL_TITLES[profile.level] ?? 'Avançado'

  const statsItems = [
    {
      icon: <Zap size={20} className="text-brand-gold" />,
      label: 'XP Total',
      value: profile.xp_total.toLocaleString('pt-BR'),
    },
    {
      icon: <Star size={20} className="text-brand-purple" />,
      label: 'Nível',
      value: `${profile.level} — ${levelTitle}`,
    },
    {
      icon: <Flame size={20} className="text-brand-orange" />,
      label: 'Streak Atual',
      value: `${profile.streak_current} dias`,
    },
    {
      icon: <Flame size={20} className="text-brand-red" />,
      label: 'Recorde de Streak',
      value: `${profile.streak_longest} dias`,
    },
    {
      icon: <Star size={20} className="text-brand-gold" />,
      label: 'Dias Perfeitos',
      value: `${profile.perfect_days}`,
    },
    {
      icon: <Dumbbell size={20} className="text-brand-green" />,
      label: 'Treinos Feitos',
      value: `${workoutsRes.count ?? 0}`,
    },
    {
      icon: <Target size={20} className="text-brand-blue" />,
      label: 'Hábitos Ativos',
      value: `${habitsRes.count ?? 0}`,
    },
    {
      icon: <CheckSquare size={20} className="text-brand-purple" />,
      label: 'Tarefas Concluídas',
      value: `${tasksRes.count ?? 0}`,
    },
    {
      icon: <Trophy size={20} className="text-brand-gold" />,
      label: 'Conquistas',
      value: `${achievementsRes.count ?? 0}`,
    },
    {
      icon: <Calendar size={20} className="text-text-secondary" />,
      label: 'Membro desde',
      value: formatDateBR(profile.created_at),
    },
  ]

  return (
    <AppShell>
      <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="heading-display text-4xl">Perfil</h1>
          <p className="text-text-secondary">Suas informações, conquistas e configurações.</p>
        </div>

        {/* Edit Forms */}
        <PerfilForm
          userId={user.id}
          initialName={profile.name}
          initialAvatarUrl={profile.avatar_url}
          initialBio={profile.bio}
          email={user.email ?? ''}
        />

        {/* Stats */}
        <section>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Trophy size={20} className="text-brand-gold" />
            Suas estatísticas
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {statsItems.map((stat) => (
              <div key={stat.label} className="card p-4">
                <div className="flex items-center gap-2 mb-2">
                  {stat.icon}
                  <span className="text-xs text-text-muted uppercase tracking-wider">{stat.label}</span>
                </div>
                <div className="font-bold text-base">{stat.value}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Subscription */}
        <section className="card p-6 space-y-4">
          <h2 className="text-xl font-bold">Assinatura</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-text-muted uppercase mb-1">Status</div>
              <div className={`font-bold flex items-center gap-1 ${status.color}`}>
                <span>{status.emoji}</span>
                <span>{status.label}</span>
              </div>
            </div>

            {profile.subscription_plan && (
              <div>
                <div className="text-xs text-text-muted uppercase mb-1">Plano</div>
                <div className="font-medium">{PLAN_LABELS[profile.subscription_plan]}</div>
              </div>
            )}

            {profile.trial_end && profile.subscription_status === 'trial' && (
              <div>
                <div className="text-xs text-text-muted uppercase mb-1">Trial termina em</div>
                <div className="text-brand-gold font-bold">{formatDateBR(profile.trial_end)}</div>
              </div>
            )}

            {profile.subscription_end && (
              <div>
                <div className="text-xs text-text-muted uppercase mb-1">Próxima renovação</div>
                <div>{formatDateBR(profile.subscription_end)}</div>
              </div>
            )}
          </div>

          <Link href="/planos" className="btn-primary inline-flex items-center gap-2">
            <Star size={16} />
            Gerenciar assinatura
          </Link>
        </section>

        {/* Danger zone */}
        <section className="card p-6 border-brand-red/20">
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
