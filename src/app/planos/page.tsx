import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Check, Star, Zap, Shield, RefreshCw, Trophy, ChevronDown } from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Planos e Preços — FitQuest',
  description: 'Escolha o plano FitQuest ideal para você. Mensal R$37, Anual R$25,55/mês ou Vitalício R$597. 7 dias grátis. Cancele quando quiser.',
  openGraph: {
    title: 'FitQuest — Planos e Preços',
    description: 'R$37/mês ou R$597 uma vez. Fitness, produtividade e finanças gamificados.',
  },
}

const PLANS = [
  {
    id: 'monthly',
    name: 'Mensal',
    emoji: '📅',
    price: 'R$ 37',
    priceNote: '/mês',
    description: 'Flexibilidade total',
    savingsNote: null,
    badge: null,
    highlight: false,
    cta: 'Começar mensal',
    features: [
      'Todos os módulos desbloqueados',
      'Coach IA ilimitado',
      'Sistema XP e gamificação',
      'Sincronização Google Agenda',
      'Notificações push',
      'Cancele quando quiser',
    ],
  },
  {
    id: 'annual',
    name: 'Anual',
    emoji: '🏆',
    price: 'R$ 25,55',
    priceNote: '/mês',
    description: 'R$ 306,60 cobrado uma vez por ano',
    savingsNote: 'Você economiza R$ 137,40 por ano',
    badge: 'MAIS POPULAR',
    highlight: true,
    cta: 'Começar anual — mais barato',
    features: [
      'Tudo do plano mensal',
      '7 dias grátis inclusos',
      '31% de desconto vs mensal',
      'Suporte prioritário',
      'Acesso antecipado a novidades',
      'Renovação anual automática',
    ],
  },
  {
    id: 'lifetime',
    name: 'Vitalício',
    emoji: '👑',
    price: 'R$ 597',
    priceNote: 'uma única vez',
    description: 'Pague uma vez, use para sempre',
    savingsNote: 'Equivale a 16 meses do plano mensal',
    badge: 'MELHOR CUSTO-BENEFÍCIO',
    highlight: false,
    cta: 'Garantir acesso vitalício',
    features: [
      'Acesso para sempre, sem mensalidades',
      'Todas as features atuais e futuras',
      'Suporte prioritário vitalício',
      'Sem renovação, sem preocupação',
      'ROI em apenas 16 meses',
      'Para quem leva a sério a evolução',
    ],
  },
]

const FEATURES_COMPARE = [
  { feature: 'Hábitos ilimitados', monthly: true, annual: true, lifetime: true },
  { feature: 'Tarefas Kanban + Eisenhower', monthly: true, annual: true, lifetime: true },
  { feature: 'Controle financeiro', monthly: true, annual: true, lifetime: true },
  { feature: 'Sistema XP e Níveis', monthly: true, annual: true, lifetime: true },
  { feature: 'Treinos com séries/reps/PRs', monthly: true, annual: true, lifetime: true },
  { feature: 'Coach IA ilimitado', monthly: true, annual: true, lifetime: true },
  { feature: 'Sincronização Google Agenda', monthly: true, annual: true, lifetime: true },
  { feature: 'Notificações push', monthly: true, annual: true, lifetime: true },
  { feature: '7 dias grátis', monthly: false, annual: true, lifetime: false },
  { feature: 'Suporte prioritário', monthly: false, annual: true, lifetime: true },
  { feature: 'Features antecipadas', monthly: false, annual: true, lifetime: true },
  { feature: 'Acesso vitalício', monthly: false, annual: false, lifetime: true },
]

const FAQ = [
  {
    q: 'Posso cancelar a qualquer hora?',
    a: 'Sim. Planos mensais e anuais podem ser cancelados a qualquer momento. Você mantém acesso até o fim do período já pago. Sem multa, sem burocracia.',
  },
  {
    q: 'O trial do plano anual é realmente grátis?',
    a: 'Sim, 7 dias sem cobrar nada. Não pedimos cartão para começar o trial — você só informa quando decidir assinar.',
  },
  {
    q: 'Qual plano você recomenda?',
    a: 'Para a maioria das pessoas, o Anual é a melhor escolha: 31% de desconto, 7 dias grátis para testar sem compromisso. Para quem tem certeza que vai usar por anos, o Vitalício é o melhor investimento.',
  },
  {
    q: 'Quais formas de pagamento são aceitas?',
    a: 'Aceitamos cartão de crédito, débito, Pix e boleto bancário — tudo via Mercado Pago, seguro e confiável.',
  },
  {
    q: 'O vitalício inclui features futuras?',
    a: 'Sim. Pague uma vez e tenha tudo para sempre — incluindo todas as features que lançaremos no futuro, sem custo adicional.',
  },
  {
    q: 'E se eu não gostar?',
    a: 'Garantia de 7 dias corridos em qualquer plano. Basta enviar um email e devolvemos 100% do valor pago. Sem questionamentos.',
  },
]

export default async function PlanosPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string; error?: string }>
}) {
  const { checkout, error: errorParam } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_status, subscription_plan, trial_end, name')
    .eq('id', user.id)
    .single()

  const isActive = profile?.subscription_status === 'active' || profile?.subscription_status === 'lifetime'
  const isTrial = profile?.subscription_status === 'trial'
  const trialEnd = isTrial && profile?.trial_end
    ? new Date(profile.trial_end).toLocaleDateString('pt-BR')
    : null

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Background glows */}
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-brand-orange/5 blur-[150px] rounded-full pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[500px] h-[500px] bg-brand-purple/5 blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 py-12 space-y-16 relative z-10">

        {/* Banner messages */}
        {errorParam === 'checkout' && (
          <div className="bg-brand-red/10 border border-brand-red/30 rounded-xl p-4 text-center text-brand-red">
            Algo deu errado no pagamento. Tente novamente ou fale com o suporte.
          </div>
        )}
        {checkout === 'cancelled' && (
          <div className="bg-brand-orange/10 border border-brand-orange/30 rounded-xl p-4 text-center text-brand-orange">
            Pagamento cancelado. Sem problemas — você pode tentar novamente quando quiser.
          </div>
        )}

        {/* Hero header */}
        <div className="text-center space-y-4">
          <Link href="/dashboard" className="inline-block heading-display text-3xl gradient-text mb-2">
            ⚡ FitQuest
          </Link>
          <h1 className="heading-display text-5xl md:text-7xl leading-none">
            Invista em você.
          </h1>
          <p className="text-text-secondary text-lg max-w-xl mx-auto">
            Menos que um café por dia. A diferença entre quem fala e quem age.
          </p>

          {/* Trial/Status badge */}
          {isTrial && trialEnd && (
            <div className="inline-flex items-center gap-2 bg-brand-orange/15 border border-brand-orange/40 rounded-full px-5 py-2 text-sm">
              <span className="text-brand-orange">⏰</span>
              <span>Seu trial termina em <strong>{trialEnd}</strong></span>
            </div>
          )}
          {isActive && (
            <div className="inline-flex items-center gap-2 bg-brand-green/10 border border-brand-green/30 rounded-full px-5 py-2 text-sm text-brand-green">
              <Check size={14} /> Você já tem uma assinatura ativa —{' '}
              <Link href="/perfil" className="underline">ver detalhes</Link>
            </div>
          )}
        </div>

        {/* Plans grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl p-8 flex flex-col ${
                plan.highlight
                  ? 'bg-gradient-to-b from-bg-card to-bg-elevated border-2 border-brand-orange/60 shadow-2xl shadow-brand-orange/20'
                  : 'card'
              }`}
            >
              {/* Badge */}
              {plan.badge && (
                <div className={`absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                  plan.highlight
                    ? 'bg-gradient-brand text-white'
                    : 'bg-brand-gold/20 border border-brand-gold/40 text-brand-gold'
                }`}>
                  {plan.badge}
                </div>
              )}

              {/* Plan header */}
              <div className="text-center mb-6">
                <div className="text-4xl mb-2">{plan.emoji}</div>
                <h2 className="heading-display text-2xl mb-4">{plan.name}</h2>
                <div className="flex items-baseline justify-center gap-1 mb-1">
                  <span className={`heading-display text-5xl ${plan.highlight ? 'text-brand-orange' : ''}`}>
                    {plan.price}
                  </span>
                  <span className="text-text-secondary text-sm">{plan.priceNote}</span>
                </div>
                <p className="text-xs text-text-muted">{plan.description}</p>
                {plan.savingsNote && (
                  <div className="mt-2 text-xs font-semibold text-brand-green bg-brand-green/10 border border-brand-green/20 rounded-full px-3 py-1 inline-block">
                    ✅ {plan.savingsNote}
                  </div>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <Check size={16} className="text-brand-green shrink-0 mt-0.5" />
                    <span className="text-text-secondary">{f}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <form action="/api/checkout" method="POST">
                <input type="hidden" name="plan" value={plan.id} />
                <button
                  type="submit"
                  className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all ${
                    plan.highlight
                      ? 'btn-primary'
                      : plan.id === 'lifetime'
                        ? 'bg-brand-gold/20 border border-brand-gold/40 text-brand-gold hover:bg-brand-gold/30'
                        : 'btn-ghost border-border hover:border-brand-orange/40 hover:text-brand-orange'
                  }`}
                >
                  {plan.cta}
                </button>
              </form>
            </div>
          ))}
        </div>

        {/* Trust signals row */}
        <div className="flex flex-wrap justify-center gap-6 text-sm text-text-muted">
          <span className="flex items-center gap-2">
            <Shield size={14} className="text-brand-green" />
            Pagamento seguro via Mercado Pago
          </span>
          <span className="flex items-center gap-2">
            <Zap size={14} className="text-brand-gold" />
            Pix · cartão · boleto
          </span>
          <span className="flex items-center gap-2">
            <RefreshCw size={14} className="text-brand-orange" />
            Garantia de 7 dias — devolução total
          </span>
          <span className="flex items-center gap-2">
            <Trophy size={14} className="text-brand-purple" />
            +2.400 pessoas já evoluindo
          </span>
        </div>

        {/* Feature comparison table */}
        <section className="card overflow-hidden">
          <div className="p-6 border-b border-border">
            <h2 className="heading-display text-2xl">Comparação completa</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 text-text-muted font-medium w-1/2">Funcionalidade</th>
                  <th className="text-center p-4 font-medium">Mensal</th>
                  <th className="text-center p-4 font-medium bg-brand-orange/5">
                    <span className="text-brand-orange">Anual</span>
                    <div className="text-[10px] text-brand-orange/70 font-normal">Recomendado</div>
                  </th>
                  <th className="text-center p-4 font-medium">Vitalício</th>
                </tr>
              </thead>
              <tbody>
                {FEATURES_COMPARE.map((row, i) => (
                  <tr key={row.feature} className={`border-b border-border/50 ${i % 2 === 0 ? '' : 'bg-bg-elevated/30'}`}>
                    <td className="p-4 text-text-secondary">{row.feature}</td>
                    <td className="p-4 text-center">
                      {row.monthly
                        ? <Check size={16} className="text-brand-green mx-auto" />
                        : <span className="text-text-muted text-lg leading-none">—</span>
                      }
                    </td>
                    <td className="p-4 text-center bg-brand-orange/5">
                      {row.annual
                        ? <Check size={16} className="text-brand-orange mx-auto" />
                        : <span className="text-text-muted text-lg leading-none">—</span>
                      }
                    </td>
                    <td className="p-4 text-center">
                      {row.lifetime
                        ? <Check size={16} className="text-brand-gold mx-auto" />
                        : <span className="text-text-muted text-lg leading-none">—</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Social proof / testimonials */}
        <section className="space-y-4">
          <h2 className="heading-display text-2xl text-center">O que estão dizendo</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                text: 'Nunca fui consistente em nada na minha vida. Com o FitQuest cheguei a 47 dias de streak. O XP vicia.',
                name: 'Rafael M.',
                role: 'Desenvolvedor, 28 anos',
                stars: 5,
              },
              {
                text: 'Finalmente um app que une fitness, finanças e produtividade. Uso o coach todo dia antes de começar o trabalho.',
                name: 'Juliana S.',
                role: 'Designer, 31 anos',
                stars: 5,
              },
              {
                text: 'Comprei o vitalício e não me arrependi nem um segundo. Subir de nível é genuinamente motivador.',
                name: 'Carlos A.',
                role: 'Empreendedor, 35 anos',
                stars: 5,
              },
            ].map((t) => (
              <div key={t.name} className="card p-5 space-y-3">
                <div className="flex gap-0.5">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} size={14} className="text-brand-gold" fill="currentColor" />
                  ))}
                </div>
                <p className="text-sm text-text-secondary italic">&ldquo;{t.text}&rdquo;</p>
                <div>
                  <div className="font-semibold text-sm">{t.name}</div>
                  <div className="text-xs text-text-muted">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="max-w-3xl mx-auto space-y-4">
          <h2 className="heading-display text-2xl text-center mb-6">Perguntas frequentes</h2>
          <div className="space-y-3">
            {FAQ.map(({ q, a }) => (
              <details key={q} className="card group">
                <summary className="p-5 font-semibold cursor-pointer flex items-center justify-between select-none list-none">
                  <span>{q}</span>
                  <ChevronDown
                    size={18}
                    className="text-text-muted transition-transform group-open:rotate-180 shrink-0"
                  />
                </summary>
                <div className="px-5 pb-5 text-sm text-text-secondary leading-relaxed border-t border-border/50 pt-4">
                  {a}
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <div className="card-glow p-10 text-center space-y-4">
          <div className="text-4xl">⚡</div>
          <h2 className="heading-display text-3xl md:text-4xl">
            Pronto para evoluir?
          </h2>
          <p className="text-text-secondary max-w-lg mx-auto">
            Junte-se a mais de 2.400 pessoas que já transformaram rotina em progresso mensurável.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <form action="/api/checkout" method="POST">
              <input type="hidden" name="plan" value="annual" />
              <button type="submit" className="btn-primary px-8 py-3.5 text-base">
                Começar com 7 dias grátis →
              </button>
            </form>
            <Link href="/dashboard" className="btn-ghost px-8 py-3.5 text-base flex items-center justify-center">
              Voltar ao app
            </Link>
          </div>
          <p className="text-xs text-text-muted">
            Sem compromisso · Cancele quando quiser · Garantia de 7 dias
          </p>
        </div>

      </div>
    </main>
  )
}
