import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components/layout/app-shell'
import Link from 'next/link'
import { formatDateBR } from '@/lib/utils'

export const dynamic = 'force-dynamic'

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  trial: { label: 'Trial (7 dias)', color: 'text-brand-gold' },
  active: { label: 'Ativo', color: 'text-brand-green' },
  cancelled: { label: 'Cancelado', color: 'text-brand-red' },
  expired: { label: 'Expirado', color: 'text-brand-red' },
  lifetime: { label: 'Vitalício', color: 'text-brand-gold' },
}

const PLAN_LABELS: Record<string, string> = {
  monthly: 'Mensal (R$ 37/mês)',
  annual: 'Anual (R$ 306,60/ano)',
  lifetime: 'Vitalício (pago)',
}

export default async function PerfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, subscription_status, subscription_plan, trial_end, subscription_end, created_at')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/onboarding')

  const status = STATUS_LABELS[profile.subscription_status] ?? { label: profile.subscription_status, color: '' }

  return (
    <AppShell>
      <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="heading-display text-4xl">Perfil</h1>
          <p className="text-text-secondary">Suas informações e configurações.</p>
        </div>

        <div className="card p-6 space-y-4">
          <div>
            <div className="text-xs text-text-muted uppercase">Nome</div>
            <div className="text-lg font-bold">{profile.name}</div>
          </div>
          <div>
            <div className="text-xs text-text-muted uppercase">Email</div>
            <div>{user.email}</div>
          </div>
          <div>
            <div className="text-xs text-text-muted uppercase">Membro desde</div>
            <div>{formatDateBR(profile.created_at)}</div>
          </div>
        </div>

        <div className="card p-6 space-y-4">
          <h2 className="text-xl font-bold">Assinatura</h2>
          <div>
            <div className="text-xs text-text-muted uppercase">Status</div>
            <div className={`font-bold ${status.color}`}>{status.label}</div>
          </div>
          {profile.subscription_plan && (
            <div>
              <div className="text-xs text-text-muted uppercase">Plano</div>
              <div>{PLAN_LABELS[profile.subscription_plan]}</div>
            </div>
          )}
          {profile.trial_end && profile.subscription_status === 'trial' && (
            <div>
              <div className="text-xs text-text-muted uppercase">Trial termina em</div>
              <div className="text-brand-gold">{formatDateBR(profile.trial_end)}</div>
            </div>
          )}
          {profile.subscription_end && (
            <div>
              <div className="text-xs text-text-muted uppercase">Renovação</div>
              <div>{formatDateBR(profile.subscription_end)}</div>
            </div>
          )}
          <Link href="/planos" className="btn-primary inline-block">
            Gerenciar assinatura
          </Link>
        </div>

        <form action="/api/auth/logout" method="POST">
          <button type="submit" className="btn-ghost w-full text-brand-red border-brand-red/40 hover:bg-brand-red/10">
            Sair da conta
          </button>
        </form>
      </div>
    </AppShell>
  )
}
