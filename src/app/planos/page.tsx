import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Check, Star, Zap, Shield, RefreshCw, Trophy, ChevronDown, Crown } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Planos e Preços — Ascendia',
  description:
    'Escolha o plano Ascendia ideal para você. Mensal R$37, Anual R$25,55/mês ou Vitalício R$597. 7 dias grátis. Cancele quando quiser.',
  openGraph: {
    title: 'Ascendia — Planos e Preços',
    description: 'R$37/mês ou R$597 uma vez. Fitness, produtividade e finanças gamificados.',
  },
};

// Ordem: Anual primeiro (ancoragem — decoy effect aumenta escolha do melhor custo-benefício)
const PLANS = [
  {
    id: 'annual',
    name: 'Anual',
    emoji: '🏆',
    price: 'R$ 25,55',
    priceNote: '/mês',
    description: 'R$ 306,60 cobrado uma vez por ano',
    savingsNote: '✅ Você economiza R$ 137,40 — 31% off',
    badge: '⭐ MAIS POPULAR',
    highlight: true,
    accentColor: '#FF4D00',
    accentRgb: '255,77,0',
    cta: 'Começar grátis por 7 dias →',
    features: [
      '7 dias grátis inclusos',
      'Todos os módulos desbloqueados',
      '31% de desconto vs mensal',
      'Coach IA ilimitado',
      'Suporte prioritário',
      '💚 Pix · Cartão · Boleto',
    ],
  },
  {
    id: 'monthly',
    name: 'Mensal',
    emoji: '📅',
    price: 'R$ 37',
    priceNote: '/mês',
    description: 'Flexibilidade total · sem fidelidade',
    savingsNote: null,
    badge: null,
    highlight: false,
    accentColor: '#3B82F6',
    accentRgb: '59,130,246',
    cta: 'Começar mensal',
    features: [
      'Todos os módulos desbloqueados',
      'Sono + hidratação gamificados',
      'Coach IA ilimitado',
      'Sistema XP e gamificação',
      'Cancele quando quiser',
      '💚 Pix · Cartão · Boleto',
    ],
  },
  {
    id: 'lifetime',
    name: 'Vitalício',
    emoji: '👑',
    price: 'R$ 597',
    priceNote: 'uma única vez',
    description: 'Acesso vitalício · pague uma única vez',
    savingsNote: 'Equivale a 16 meses do plano mensal',
    badge: '💎 MELHOR CUSTO-BENEFÍCIO',
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
      '💚 Pix · Cartão · Transferência',
    ],
  },
];

const FEATURES_COMPARE = [
  { feature: 'Hábitos ilimitados', monthly: true, annual: true, lifetime: true },
  { feature: 'Tarefas Kanban + Eisenhower', monthly: true, annual: true, lifetime: true },
  { feature: 'Controle financeiro', monthly: true, annual: true, lifetime: true },
  { feature: 'Sistema XP e Níveis', monthly: true, annual: true, lifetime: true },
  { feature: 'Treinos com séries/reps/PRs', monthly: true, annual: true, lifetime: true },
  { feature: 'Sono e hidratação (Saúde)', monthly: true, annual: true, lifetime: true },
  { feature: 'Coach IA ilimitado', monthly: true, annual: true, lifetime: true },
  { feature: 'Sincronização Google Agenda', monthly: true, annual: true, lifetime: true },
  { feature: 'Notificações push', monthly: true, annual: true, lifetime: true },
  { feature: '7 dias grátis', monthly: false, annual: true, lifetime: false },
  { feature: 'Suporte prioritário', monthly: false, annual: true, lifetime: true },
  { feature: 'Features antecipadas', monthly: false, annual: true, lifetime: true },
  { feature: 'Acesso vitalício', monthly: false, annual: false, lifetime: true },
];

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
    a: 'Aceitamos cartão de crédito, débito e Pix — tudo via Stripe, seguro e confiável.',
  },
  {
    q: 'O vitalício inclui features futuras?',
    a: 'Sim. Pague uma vez e tenha tudo para sempre — incluindo todas as features que lançaremos no futuro, sem custo adicional.',
  },
  {
    q: 'E se eu não gostar?',
    a: 'Garantia de 7 dias corridos em qualquer plano. Basta enviar um email e devolvemos 100% do valor pago. Sem questionamentos.',
  },
];

const TESTIMONIALS = [
  {
    text: 'Nunca fui consistente em nada na minha vida. Com o Ascendia cheguei a 47 dias de streak. O XP vicia.',
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
];

export default async function PlanosPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string; error?: string }>;
}) {
  const { checkout, error: errorParam } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_status, subscription_plan, trial_end, name')
    .eq('id', user.id)
    .single();

  const isActive =
    profile?.subscription_status === 'active' || profile?.subscription_status === 'lifetime';
  const isTrial = profile?.subscription_status === 'trial';
  const trialEnd =
    isTrial && profile?.trial_end ? new Date(profile.trial_end).toLocaleDateString('pt-BR') : null;

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Background ambient glows */}
      <div
        className="pointer-events-none fixed left-1/4 top-0 h-[600px] w-[600px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(255,77,0,0.04) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }}
      />
      <div
        className="pointer-events-none fixed bottom-0 right-1/4 h-[600px] w-[600px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(124,58,237,0.05) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }}
      />

      <div className="relative z-10 mx-auto max-w-6xl space-y-20 px-4 py-12">
        {/* Banner messages */}
        {errorParam === 'checkout' && (
          <div
            className="rounded-xl p-4 text-center text-sm"
            style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              color: '#EF4444',
            }}
          >
            Algo deu errado no pagamento. Tente novamente ou fale com o suporte.
          </div>
        )}
        {checkout === 'cancelled' && (
          <div
            className="rounded-xl p-4 text-center text-sm"
            style={{
              background: 'rgba(255,77,0,0.1)',
              border: '1px solid rgba(255,77,0,0.3)',
              color: '#FF4D00',
            }}
          >
            Pagamento cancelado. Sem problemas — você pode tentar novamente quando quiser.
          </div>
        )}

        {/* ── Hero header ───────────────────────────────────── */}
        <div className="space-y-5 text-center">
          <Link
            href="/dashboard"
            className="heading-display mb-2 inline-block text-3xl"
            style={{ color: '#FF4D00' }}
          >
            ⚡ Ascendia
          </Link>
          <h1 className="heading-display text-5xl leading-none md:text-7xl">Invista em você.</h1>
          <p className="mx-auto max-w-xl text-lg text-text-secondary">
            Menos que um café por dia. A diferença entre quem fala e quem age.
          </p>

          {isTrial && trialEnd && (
            <div
              className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium"
              style={{
                background: 'rgba(255,77,0,0.12)',
                border: '1px solid rgba(255,77,0,0.35)',
                color: '#FF4D00',
              }}
            >
              <span>⏰</span>
              <span>
                Seu trial termina em <strong>{trialEnd}</strong>
              </span>
            </div>
          )}
          {isActive && (
            <div
              className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium"
              style={{
                background: 'rgba(0,255,136,0.1)',
                border: '1px solid rgba(0,255,136,0.3)',
                color: '#00FF88',
              }}
            >
              <Check size={14} />
              Você já tem uma assinatura ativa —{' '}
              <Link href="/perfil" className="underline underline-offset-2">
                ver detalhes
              </Link>
            </div>
          )}
        </div>

        {/* ── Urgency banner (só para não-assinantes) ──────── */}
        {!isActive && (
          <div
            className="flex animate-slide-up flex-wrap items-center justify-between gap-4 rounded-2xl p-4"
            style={{
              background:
                'linear-gradient(135deg, rgba(255,77,0,0.12) 0%, rgba(13,24,41,0.98) 100%)',
              border: '1px solid rgba(255,77,0,0.35)',
            }}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">⏰</span>
              <div>
                <p className="text-sm font-bold">
                  7 dias grátis no plano Anual — experimente antes de pagar
                </p>
                <p className="text-xs text-text-secondary">
                  Cancele antes do 7º dia e não cobra nada. Sem pegadinhas.
                </p>
              </div>
            </div>
            <div
              className="shrink-0 rounded-xl px-3 py-1.5 text-xs font-black"
              style={{
                background: 'rgba(255,77,0,0.15)',
                border: '1px solid rgba(255,77,0,0.3)',
                color: '#FF4D00',
              }}
            >
              Menos de R$ 1,25/dia
            </div>
          </div>
        )}

        {/* ── Plans grid ───────────────────────────────────── */}
        <div className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className="relative flex flex-col overflow-hidden rounded-2xl p-8 transition-all hover:scale-[1.01]"
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
                className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full"
                style={{
                  background: `radial-gradient(circle, rgba(${plan.accentRgb},0.15) 0%, transparent 70%)`,
                }}
              />

              {/* Badge */}
              {plan.badge && (
                <div
                  className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-4 py-1 text-[11px] font-bold"
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

              <div className="relative z-10 flex flex-1 flex-col">
                {/* Plan header */}
                <div className="mb-7 text-center">
                  <div className="mb-2 text-4xl">{plan.emoji}</div>
                  <h2 className="heading-display mb-4 text-2xl">{plan.name}</h2>
                  <div className="mb-1.5 flex items-baseline justify-center gap-1">
                    <span className="heading-display text-5xl" style={{ color: plan.accentColor }}>
                      {plan.price}
                    </span>
                    <span className="text-sm text-text-secondary">{plan.priceNote}</span>
                  </div>
                  <p className="text-xs text-text-muted">{plan.description}</p>
                  {plan.savingsNote && (
                    <div
                      className="mt-2.5 inline-block rounded-full px-3 py-1 text-xs font-semibold"
                      style={{
                        background: 'rgba(0,255,136,0.1)',
                        border: '1px solid rgba(0,255,136,0.2)',
                        color: '#00FF88',
                      }}
                    >
                      ✅ {plan.savingsNote}
                    </div>
                  )}
                </div>

                {/* Features */}
                <ul className="mb-8 flex-1 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <Check size={15} className="mt-0.5 shrink-0 text-brand-green" />
                      <span className="text-text-secondary">{f}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <form action="/api/checkout" method="POST">
                  <input type="hidden" name="plan" value={plan.id} />
                  <button
                    type="submit"
                    className="w-full rounded-xl py-3.5 text-sm font-bold transition-all"
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
            {
              icon: <Shield size={14} style={{ color: '#00FF88' }} />,
              label: 'Pagamento seguro via Stripe',
            },
            {
              icon: <Zap size={14} style={{ color: '#F5C842' }} fill="currentColor" />,
              label: 'Pix · cartão · boleto',
            },
            {
              icon: <RefreshCw size={14} style={{ color: '#FF4D00' }} />,
              label: 'Garantia de 7 dias — devolução total',
            },
            {
              icon: <Trophy size={14} style={{ color: '#7C3AED' }} />,
              label: '+2.400 pessoas já evoluindo',
            },
          ].map(({ icon, label }) => (
            <span key={label} className="flex items-center gap-2">
              {icon}
              {label}
            </span>
          ))}
        </div>

        {/* ── Feature comparison table ─────────────────────── */}
        <section
          className="overflow-hidden rounded-2xl"
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
                  <th className="w-1/2 p-4 text-left font-medium text-text-muted">
                    Funcionalidade
                  </th>
                  <th className="p-4 text-center font-medium" style={{ color: '#3B82F6' }}>
                    Mensal
                  </th>
                  <th
                    className="p-4 text-center font-medium"
                    style={{ background: 'rgba(255,77,0,0.05)', color: '#FF4D00' }}
                  >
                    Anual
                    <div className="text-[10px] font-normal opacity-70">Recomendado</div>
                  </th>
                  <th className="p-4 text-center font-medium" style={{ color: '#F5C842' }}>
                    Vitalício
                  </th>
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
                      {row.monthly ? (
                        <Check size={16} className="mx-auto text-brand-green" />
                      ) : (
                        <span className="text-lg text-text-muted">—</span>
                      )}
                    </td>
                    <td className="p-4 text-center" style={{ background: 'rgba(255,77,0,0.04)' }}>
                      {row.annual ? (
                        <Check size={16} className="mx-auto text-brand-orange" />
                      ) : (
                        <span className="text-lg text-text-muted">—</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {row.lifetime ? (
                        <Check size={16} className="mx-auto text-brand-gold" />
                      ) : (
                        <span className="text-lg text-text-muted">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── Testimonials ─────────────────────────────────── */}
        <section className="space-y-6">
          <h2 className="heading-display text-center text-2xl">O que estão dizendo</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <div
                key={t.name}
                className="relative space-y-4 overflow-hidden rounded-2xl p-6"
                style={{
                  background: `linear-gradient(135deg, rgba(${t.accentRgb},0.06) 0%, rgba(13,24,41,0.98) 100%)`,
                  border: `1px solid rgba(${t.accentRgb},0.2)`,
                }}
              >
                <div
                  className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full blur-xl"
                  style={{ background: `rgba(${t.accentRgb},0.12)` }}
                />
                <div className="relative z-10">
                  <div className="mb-3 flex gap-0.5">
                    {Array.from({ length: t.stars }).map((_, i) => (
                      <Star key={i} size={14} className="text-brand-gold" fill="currentColor" />
                    ))}
                  </div>
                  <p className="text-sm italic leading-relaxed text-text-secondary">
                    &ldquo;{t.text}&rdquo;
                  </p>
                  <div
                    className="mt-4 pt-3"
                    style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <div className="text-sm font-semibold text-white">{t.name}</div>
                    <div className="text-xs text-text-muted">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── FAQ ──────────────────────────────────────────── */}
        <section className="mx-auto max-w-3xl space-y-4">
          <h2 className="heading-display mb-6 text-center text-2xl">Perguntas frequentes</h2>
          <div className="space-y-3">
            {FAQ.map(({ q, a }) => (
              <details
                key={q}
                className="group overflow-hidden rounded-2xl"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(124,58,237,0.04) 0%, rgba(13,24,41,0.98) 100%)',
                  border: '1px solid rgba(124,58,237,0.15)',
                }}
              >
                <summary className="flex cursor-pointer select-none list-none items-center justify-between p-5 text-sm font-semibold">
                  <span>{q}</span>
                  <ChevronDown
                    size={17}
                    className="ml-3 shrink-0 text-text-muted transition-transform group-open:rotate-180"
                  />
                </summary>
                <div
                  className="px-5 pb-5 text-sm leading-relaxed text-text-secondary"
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
          className="relative space-y-5 overflow-hidden rounded-2xl p-12 text-center"
          style={{
            background:
              'linear-gradient(135deg, rgba(255,77,0,0.1) 0%, rgba(13,24,41,0.99) 60%, rgba(124,58,237,0.06) 100%)',
            border: '1px solid rgba(255,77,0,0.25)',
            boxShadow: '0 24px 60px rgba(0,0,0,0.4), 0 0 60px rgba(255,77,0,0.06)',
          }}
        >
          <div
            className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(255,77,0,0.1) 0%, transparent 70%)',
            }}
          />
          <div
            className="pointer-events-none absolute -bottom-8 -left-8 h-48 w-48 rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)',
            }}
          />
          <div className="relative z-10">
            <div className="mb-2 text-5xl">⚡</div>
            <h2 className="heading-display text-3xl md:text-5xl">Pronto para evoluir?</h2>
            <p className="mx-auto mt-3 max-w-lg text-text-secondary">
              Junte-se a mais de 2.400 pessoas que já transformaram rotina em progresso mensurável.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <form action="/api/checkout" method="POST">
                <input type="hidden" name="plan" value="annual" />
                <button
                  type="submit"
                  className="btn-primary flex items-center gap-2 px-8 py-3.5 text-base"
                >
                  <Zap size={18} fill="currentColor" className="text-brand-gold" />
                  Começar com 7 dias grátis →
                </button>
              </form>
              <Link
                href="/dashboard"
                className="flex items-center justify-center gap-2 rounded-xl px-8 py-3.5 text-base font-medium transition-all"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#8899BB',
                }}
              >
                <Crown size={16} />
                Voltar ao app
              </Link>
            </div>
            <p className="mt-4 text-xs text-text-muted">
              Sem compromisso · Cancele quando quiser · Garantia de 7 dias
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
