import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Check } from 'lucide-react'

export const dynamic = 'force-dynamic'

const PLANS = [
  {
    id: 'monthly',
    name: 'Mensal',
    price: 'R$ 37',
    period: '/mês',
    description: 'Flexibilidade total',
    highlight: false,
    features: [
      'Todos os módulos liberados',
      'Coach IA ilimitado',
      'Sincronização Google Agenda',
      'Notificações push',
      'Cancele quando quiser',
    ],
  },
  {
    id: 'annual',
    name: 'Anual',
    price: 'R$ 25,55',
    period: '/mês',
    badge: 'ECONOMIZE 31%',
    description: 'R$ 306,60 cobrados anualmente',
    highlight: true,
    features: [
      'Tudo do plano mensal',
      '7 dias grátis para teste',
      'Equivale a R$ 25,55/mês',
      'Suporte prioritário',
      'Acesso antecipado a features',
    ],
  },
  {
    id: 'lifetime',
    name: 'Vitalício',
    price: 'R$ 597',
    period: 'única vez',
    badge: 'MELHOR CUSTO-BENEFÍCIO',
    description: 'Pague uma vez, use pra sempre',
    highlight: false,
    features: [
      'Acesso para sempre, sem mensalidades',
      'Todas as features atuais e futuras',
      'Suporte prioritário vitalício',
      'Sem renovação, sem dor de cabeça',
      'Equivale a 16 meses do plano mensal',
    ],
  },
]

export default async function PlanosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_status, subscription_plan, trial_end')
    .eq('id', user.id)
    .single()

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto space-y-8 py-12">
        <div className="text-center space-y-3">
          <Link href="/dashboard" className="inline-block heading-display text-3xl gradient-text">
            ⚡ FitQuest
          </Link>
          <h1 className="heading-display text-4xl md:text-6xl">Escolha seu plano</h1>
          <p className="text-text-secondary text-lg">
            Cancele quando quiser. Sem pegadinhas.
          </p>
          {profile?.subscription_status === 'trial' && profile.trial_end && (
            <div className="inline-block bg-brand-orange/20 border border-brand-orange/40 rounded-full px-4 py-2 text-sm">
              ⏰ Seu trial termina em {new Date(profile.trial_end).toLocaleDateString('pt-BR')}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`card p-8 relative ${
                plan.highlight
                  ? 'border-brand-orange/60 shadow-2xl shadow-brand-orange/20 md:scale-105'
                  : ''
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-brand px-4 py-1 rounded-full text-xs font-bold whitespace-nowrap">
                  {plan.badge}
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="heading-display text-3xl mb-2">{plan.name}</h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="heading-display text-5xl text-brand-orange">{plan.price}</span>
                  <span className="text-text-secondary">{plan.period}</span>
                </div>
                <p className="text-sm text-text-muted mt-2">{plan.description}</p>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex gap-2 text-sm">
                    <Check size={18} className="text-brand-green shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <form action="/api/checkout" method="POST">
                <input type="hidden" name="plan" value={plan.id} />
                <button
                  type="submit"
                  className={`w-full py-3 rounded-xl font-bold transition-all ${
                    plan.highlight
                      ? 'btn-primary'
                      : 'btn-ghost border-brand-orange/40 text-brand-orange hover:bg-brand-orange/10'
                  }`}
                >
                  Assinar {plan.name}
                </button>
              </form>
            </div>
          ))}
        </div>

        <div className="text-center text-sm text-text-muted space-y-2 pt-8">
          <p>🔒 Pagamento seguro via Mercado Pago</p>
          <p>💳 Aceitamos Pix, cartão de crédito e boleto</p>
          <p>↩️ Garantia de 7 dias — devolução do valor sem perguntas</p>
        </div>
      </div>
    </main>
  )
}
