import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Check, Star, Zap, Shield, RefreshCw, Trophy, ChevronDown, Crown } from 'lucide-react'

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
    accentColor: '#3B82F6',
    accentRgb: '59,130,246',
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
    accentColor: '#FF4D00',
    accentRgb: '255,77,0',
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
    accentColor: '#F5C842',
    accentRgb: '245,200,66',
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

const TESTIMONIALS = [
  {
    text: 'Nunca fui consistente em nada na minha vida. Com o FitQuest cheguei a 47 dias de streak. O XP vicia.',
    name: 'Rafael M.',
    role: 'Desenvolvedor, 28 anos',
    stars: 5,
    accentRgb: '255,77,0',
  },
  {
    text: 'Finalmente um app que une fitness, finanças e produtividade. Uso o coach todo dia antes de começar o trabalho.',
    name: 'Juliana S.',
    role: 'Designer, 31 anos',
    stars: 5,
    accentRgb: '124,58,237',
  },
  {
    text: 'Comprei o vitalício e não me arrependi nem um segundo. Subir de nível é genuinamente motivador.',
    name: 'Carlos A.',
    role: 'Empreendedor, 35 anos',
    stars: 5,
    accentRgb: '245,200,66',
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
      {/* Background ambient glows */}
      <div
        className="fixed top-0 left-1/4 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(255,77,0,0.04) 0%, transparent 70%)', filter: 'blur(80px)' }}
      />
      <div
        className="fixed bottom-0 right-1/4 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.05) 0%, transparent 70%)', filter: 'blur(80px)' }}
      />

      <div className="max-w-6xl mx-auto px-4 py-12 space-y-20 relative z-10">

        {/* Banner messages */}
        {errorParam === 'checkout' && (
          <div
            className="rounded-xl p-4 text-center text-sm"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444' }}
          >
            Algo deu errado no pagamento. Tente novamente ou fale com o suporte.
          </div>
        )}
        {checkout === 'cancelled' && (
          <div
            className="rounded-xl p-4 text-center text-sm"
            style={{ background: 'rgba(255,77,0,0.1)', border: '1px solid rgba(255,77,0,0.3)', color: '#FF4D00' }}
          >
            Pagamento cancelado. Sem problemas — você pode tentar novamente quando quiser.
          </div>
        )}

        {/* ── Hero header ───────────────────────────────────── */}
        <div className="text-center space-y-5">
          <Link href="/dashboard" className="inline-block heading-display text-3xl mb-2" style={{ color: '#FF4D00' }}>
            ⚡ FitQuest
          </Link>
          <h1 className="heading-display text-5xl md:text-7xl leading-none">
            Invista em você.
          </h1>
          <p className="text-text-secondary text-lg max-w-xl mx-auto">
            Menos que um café por dia. A diferença entre quem fala e quem age.
          </p>

          {isTrial && trialEnd && (
            <div
              className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium"
              style={{ background: 'rgba(255,77,0,0.12)', border: '1px solid rgba(255,77,0,0.35)', color: '#FF4D00' }}
            >
              <span>⏰</span>
              <span>Seu trial termina em <strong>{trialEnd}</strong></span>
            </div>
          )}
          {isActive && (
            <div
              className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium"
              style={{ background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.3)', color: '#00FF88' }}
            >
              <Check size={14} />
              Você já tem uma assinatura ativa —{' '}
              <Link href="/perfil" className="underline underline-offset-2">ver detalhes</Link>
            </div>
          )}
        </div>

        {/* ── Plans grid ───────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className="relative rounded-2xl p-8 flex flex-col overflow-hidden transition-all hover:scale-[1.01]"
              style={{
                background: plan.highlight
                  ? `linear-gradient(135deg, rgba(${plan.accentRgb},0.1) 0%, rgba(13,24,41,0.99) 100%)`
                  : `linear-gradient(135deg, rgba(${plan.accentRgb},0.06) 0%, rgba(13,24,41,0.98) 100%)`,
                border: plan.highlight
                  ? `2px solid rgba(${plan.accentRgb},0.5)`
                  : `1px solid rgba(${plan.accentRgb},0.25)`,
                boxShadow: plan.highlight
                  ? `0 24px 60px rgba(0,0,0,0.4), 0 0 50px rgba(${plan.accentRgb},0.12)`
                  : 'none',
              }}
            >
              {/* Corner glow */}
              <div
                className="absolute -top-8 -right-8 w-36 h-36 rounded-full pointer-events-none"
                style={{ background: `radial-gradient(circle, rgba(${plan.accentRgb},0.15) 0%, transparent 70%)` }}
              />

              {/* Badge */}
              {plan.badge && (
                <div
                  className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[11px] font-bold whitespace-nowrap"
                  style={
                    plan.highlight
                      ? {
                          background: `linear-gradient(90deg, rgba(${plan.accentRgb},0.9), rgba(${plan.accentRgb},0.7))`,
                          color: '#fff',
                          boxShadow: `0 4px 16px rgba(${plan.accentRgb},0.4)`,
                        }
                      : {
                          background: 'rgba(245,200,66,0.15)',
                          border: '1px solid rgba(245,200,66,0.35)',
                          color: '#F5C842',
                        }
                  }
                >
                  {plan.badge}
                </div>
              )}

              <div className="relative z-10 flex flex-col flex-1">
                {/* Plan header */}
                <div className="text-center mb-7">
                  <div className="text-4xl mb-2">{plan.emoji}</div>
                  <h2 className="heading-display text-2xl mb-4">{plan.name}</h2>
                  <div className="flex items-baseline justify-center gap-1 mb-1.5">
                    <span className="heading-display text-5xl" style={{ color: plan.accentColor }}>
                      {plan.price}
                    </span>
                    <span className="text-text-secondary text-sm">{plan.priceNote}</span>
                  </div>
                  <p className="text-xs text-text-muted">{plan.description}</p>
                  {plan.savingsNote && (
                    <div
                      className="mt-2.5 text-xs font-semibold rounded-full px-3 py-1 inline-block"
                      style={{ background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.2)', color: '#00FF88' }}
                    >
                      ✅ {plan.savingsNote}
                    </div>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <Check size={15} className="text-brand-green shrink-0 mt-0.5" />
                      <span className="text-text-secondary">{f}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <form action="/api/checkout" method="POST">
                  <input type="hidden" name="plan" value={plan.id} />
                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl font-bold text-sm transition-all"
                    style={
                      plan.highlight
                        ? {
                            background: `rgba(${plan.accentRgb},0.85)`,
                            color: '#fff',
                            boxShadow: `0 4px 20px rgba(${plan.accentRgb},0.35)`,
                          }
                        : {
                            background: `rgba(${plan.accentRgb},0.12)`,
                            border: `1px solid rgba(${plan.accentRgb},0.35)`,
                            color: plan.accentColor,
                          }
                    }
                  >
                    {plan.cta}
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>

        {/* ── Trust signals ─────────────────────────────────── */}
        <div className="flex flex-wrap justify-center gap-6 text-sm text-text-muted">
          {[
            { icon: <Shield size={14} style={{ color: '#00FF88' }} />, label: 'Pagamento seguro via Mercado Pago' },
            { icon: <Zap size={14} style={{ color: '#F5C842' }} fill="currentColor" />, label: 'Pix · cartão · boleto' },
            { icon: <RefreshCw size={14} style={{ color: '#FF4D00' }} />, label: 'Garantia de 7 dias — devolução total' },
            { icon: <Trophy size={14} style={{ color: '#7C3AED' }} />, label: '+2.400 pessoas já evoluindo' },
          ].map(({ icon, label }) => (
            <span key={label} className="flex items-center gap-2">
              {icon}
              {label}
            </span>
          ))}
        </div>

        {/* ── Feature comparison table ─────────────────────── */}
        <section
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(255,77,0,0.04) 0%, rgba(13,24,41,0.98) 100%)',
            border: '1px solid rgba(255,77,0,0.15)',
          }}
        >
          <div className="p-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <h2 className="heading-display text-2xl">Comparação completa</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <th className="text-left p-4 text-text-muted font-medium w-1/2">Funcionalidade</th>
                  <th className="text-center p-4 font-medium" style={{ color: '#3B82F6' }}>Mensal</th>
                  <th
                    className="text-center p-4 font-medium"
                    style={{ background: 'rgba(255,77,0,0.05)', color: '#FF4D00' }}
                  >
                    Anual
                    <div className="text-[10px] opacity-70 font-normal">Recomendado</div>
                  </th>
                  <th className="text-center p-4 font-medium" style={{ color: '#F5C842' }}>Vitalício</th>
                </tr>
              </thead>
              <tbody>
                {FEATURES_COMPARE.map((row, i) => (
                  <tr
                    key={row.feature}
                    style={{
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      background: i % 2 !== 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
                    }}
                  >
                    <td className="p-4 text-text-secondary">{row.feature}</td>
                    <td className="p-4 text-center">
                      {row.monthly ? <Check size={16} className="text-brand-green mx-auto" /> : <span className="text-text-muted text-lg">—</span>}
                    </td>
                    <td className="p-4 text-center" style={{ background: 'rgba(255,77,0,0.04)' }}>
                      {row.annual ? <Check size={16} className="text-brand-orange mx-auto" /> : <span className="text-text-muted text-lg">—</span>}
                    </td>
                    <td className="p-4 text-center">
                      {row.lifetime ? <Check size={16} className="text-brand-gold mx-auto" /> : <span className="text-text-muted text-lg">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── Testimonials ─────────────────────────────────── */}
        <section className="space-y-6">
          <h2 className="heading-display text-2xl text-center">O que estão dizendo</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {TESTIMONIALS.map((t) => (
              <div
                key={t.name}
                className="rounded-2xl p-6 space-y-4 relative overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, rgba(${t.accentRgb},0.06) 0%, rgba(13,24,41,0.98) 100%)`,
                  border: `1px solid rgba(${t.accentRgb},0.2)`,
                }}
              >
                <div
                  className="absolute -top-4 -right-4 w-16 h-16 rounded-full pointer-events-none blur-xl"
                  style={{ background: `rgba(${t.accentRgb},0.12)` }}
                />
                <div className="relative z-10">
                  <div className="flex gap-0.5 mb-3">
                    {Array.from({ length: t.stars }).map((_, i) => (
                      <Star key={i} size={14} className="text-brand-gold" fill="currentColor" />
                    ))}
                  </div>
                  <p className="text-sm text-text-secondary italic leading-relaxed">&ldquo;{t.text}&rdquo;</p>
                  <div className="mt-4 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="font-semibold text-sm text-white">{t.name}</div>
                    <div className="text-xs text-text-muted">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── FAQ ──────────────────────────────────────────── */}
        <section className="max-w-3xl mx-auto space-y-4">
          <h2 className="heading-display text-2xl text-center mb-6">Perguntas frequentes</h2>
          <div className="space-y-3">
            {FAQ.map(({ q, a }) => (
              <details
                key={q}
                className="group rounded-2xl overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, rgba(124,58,237,0.04) 0%, rgba(13,24,41,0.98) 100%)',
                  border: '1px solid rgba(124,58,237,0.15)',
                }}
              >
                <summary className="p-5 font-semibold cursor-pointer flex items-center justify-between select-none list-none text-sm">
                  <span>{q}</span>
                  <ChevronDown
                    size={17}
                    className="text-text-muted transition-transform group-open:rotate-180 shrink-0 ml-3"
                  />
                </summary>
                <div
                  className="px-5 pb-5 text-sm text-text-secondary leading-relaxed"
                  style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}
                >
                  {a}
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* ── Final CTA ────────────────────────────────────── */}
        <div
          className="rounded-2xl p-12 text-center space-y-5 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(255,77,0,0.1) 0%, rgba(13,24,41,0.99) 60%, rgba(124,58,237,0.06) 100%)',
            border: '1px solid rgba(255,77,0,0.25)',
            boxShadow: '0 24px 60px rgba(0,0,0,0.4), 0 0 60px rgba(255,77,0,0.06)',
          }}
        >
          <div
            className="absolute -top-12 -right-12 w-64 h-64 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(255,77,0,0.1) 0%, transparent 70%)' }}
          />
          <div
            className="absolute -bottom-8 -left-8 w-48 h-48 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)' }}
          />
          <div className="relative z-10">
            <div className="text-5xl mb-2">⚡</div>
            <h2 className="heading-display text-3xl md:text-5xl">
              Pronto para evoluir?
            </h2>
            <p className="text-text-secondary max-w-lg mx-auto mt-3">
              Junte-se a mais de 2.400 pessoas que já transformaram rotina em progresso mensurável.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
              <form action="/api/checkout" method="POST">
                <input type="hidden" name="plan" value="annual" />
                <button
                  type="submit"
                  className="btn-primary px-8 py-3.5 text-base flex items-center gap-2"
                >
                  <Zap size={18} fill="currentColor" className="text-brand-gold" />
                  Começar com 7 dias grátis →
                </button>
              </form>
              <Link
                href="/dashboard"
                className="px-8 py-3.5 text-base flex items-center justify-center gap-2 rounded-xl font-medium transition-all"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#8899BB' }}
              >
                <Crown size={16} />
                Voltar ao app
              </Link>
            </div>
            <p className="text-xs text-text-muted mt-4">
              Sem compromisso · Cancele quando quiser · Garantia de 7 dias
            </p>
          </div>
        </div>

      </div>
    </main>
  )
}
