import Link from 'next/link';
import type { Metadata } from 'next';
import { LandingNavbar } from '@/components/landing-navbar';
import { LandingSocialProof } from '@/components/landing-social-proof';

export const metadata: Metadata = {
  title: 'Ascendia — Sua vida inteira em um só sistema',
  description:
    'Life OS gamificado: fitness, produtividade, finanças e coach IA. Cada ação vira XP. 7 dias grátis, cancele quando quiser.',
};

const FEATURES = [
  {
    icon: '💪',
    title: 'Fitness & Hábitos',
    desc: 'Registre treinos com sets/reps, bata recordes pessoais e construa hábitos com streak de fogo. Cada rep conta.',
    tag: 'XP por série',
    rgb: '255,77,0',
  },
  {
    icon: '✅',
    title: 'Produtividade',
    desc: 'Kanban completo + Matriz Eisenhower. Identifique o que é urgente, importante e elimine o ruído da sua vida.',
    tag: 'XP por tarefa',
    rgb: '124,58,237',
  },
  {
    icon: '💰',
    title: 'Controle Financeiro',
    desc: 'Registre receitas, despesas e metas. Saiba sua taxa de poupança, veja onde seu dinheiro vai e evolua.',
    tag: 'XP por registro',
    rgb: '0,255,136',
  },
  {
    icon: '🤖',
    title: 'Coach IA',
    desc: 'Assistente que conhece TODA sua vida — cruza seus dados de fitness, tarefas e finanças para conselhos reais.',
    tag: 'Anthropic Claude',
    rgb: '245,200,66',
  },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Registre sua vida',
    desc: 'Treinos, hábitos, tarefas e finanças em um único lugar. Mobile-first, rápido de usar.',
    icon: '📝',
    rgb: '255,77,0',
  },
  {
    step: '02',
    title: 'Ganhe XP por tudo',
    desc: 'Cada ação real vira XP. Completar hábito, terminar tarefa, registrar gasto — tudo recompensado.',
    icon: '⚡',
    rgb: '124,58,237',
  },
  {
    step: '03',
    title: 'Suba de nível',
    desc: 'De Iniciante a Ascendia Master. Desbloqueie conquistas e mantenha sua sequência acesa.',
    icon: '🏆',
    rgb: '245,200,66',
  },
];

const LEVELS = [
  { level: 1, title: 'Iniciante', range: '0–500 XP', emoji: '🌱', rgb: '0,255,136' },
  { level: 3, title: 'Consistente', range: '1.500–3.500 XP', emoji: '⚡', rgb: '255,77,0' },
  { level: 5, title: 'Guerreiro', range: '7.000–12.000 XP', emoji: '🔥', rgb: '239,68,68' },
  { level: 8, title: 'Ascendia Master', range: '35.000+ XP', emoji: '👑', rgb: '245,200,66' },
];

const TESTIMONIALS = [
  {
    text: 'Finalmente um app que conecta academia, trabalho e dinheiro. Antes eu tinha 3 apps diferentes. Agora tenho um.',
    author: 'Lucas M.',
    role: 'Engenheiro de Software',
    emoji: '💻',
    rgb: '255,77,0',
  },
  {
    text: 'A Matriz Eisenhower mudou minha semana. O Coach IA cruzou meu burnout com meus gastos e fez sentido na hora.',
    author: 'Ana C.',
    role: 'Gestora de Produto',
    emoji: '📊',
    rgb: '124,58,237',
  },
  {
    text: 'O sistema de XP parece bobo, mas funciona. Entrar no app virou hábito porque a recompensa é imediata.',
    author: 'Rafael S.',
    role: 'Personal Trainer',
    emoji: '🏋️',
    rgb: '0,255,136',
  },
];

const STATS = [
  { value: 'R$ 37', label: 'por mês, tudo incluído', sub: 'ou R$ 25,55/mês no plano anual' },
  { value: '7 dias', label: 'de teste gratuito', sub: 'sem cartão de crédito' },
  { value: '4 em 1', label: 'fitness + tarefas + finanças + IA', sub: 'tudo conectado' },
  { value: '27+', label: 'conquistas desbloqueáveis', sub: 'sistema de progressão real' },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen text-white">
      <LandingNavbar />

      {/* ─── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-6 text-center">
        {/* Background glow */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-1/4 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-brand-orange/10 blur-[120px]" />
          <div className="absolute bottom-1/4 left-1/3 h-[300px] w-[400px] rounded-full bg-brand-purple/10 blur-[100px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-3xl animate-fade-in space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-orange/30 bg-brand-orange/15 px-4 py-1.5 text-sm font-medium text-brand-orange">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-orange" />7 dias grátis
            · Sem cartão de crédito · Cancele quando quiser
          </div>

          <h1 className="heading-display text-6xl leading-none md:text-8xl">
            <span className="gradient-text">Ascendia</span>
          </h1>

          <p className="mx-auto max-w-2xl text-balance text-xl leading-relaxed text-text-secondary md:text-2xl">
            O <strong className="text-white">único app</strong> que gamifica academia, produtividade
            e finanças ao mesmo tempo.
          </p>

          <p className="mx-auto max-w-lg text-text-muted">
            Cada ação vira XP. Cada dia vira evolução. Seu Coach IA sabe de tudo e conecta os
            pontos.
          </p>

          <div className="flex flex-col justify-center gap-4 pt-2 sm:flex-row">
            <Link
              href="/signup"
              className="btn-primary animate-pulse-glow px-8 py-4 text-lg"
              style={{ boxShadow: '0 0 30px rgba(255,77,0,0.4), 0 0 60px rgba(255,77,0,0.15)' }}
            >
              Começar grátis agora →
            </Link>
            <Link href="/planos" className="btn-ghost px-8 py-4 text-lg">
              Ver planos e preços
            </Link>
          </div>

          {/* Social proof mini */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <div className="flex -space-x-2">
              {['JP', 'MA', 'RS', 'CA', 'FE'].map((i, k) => (
                <div
                  key={k}
                  className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-bg text-[10px] font-bold"
                  style={{ background: `hsl(${k * 60 + 20}, 70%, 45%)`, color: '#fff' }}
                >
                  {i}
                </div>
              ))}
            </div>
            <p className="text-sm text-text-secondary">
              <strong className="text-white">+500 brasileiros</strong> já subiram de nível esta
              semana
            </p>
          </div>

          {/* Live activity ticker */}
          <div
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs"
            style={{ background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.2)' }}
          >
            <span className="inline-block h-1.5 w-1.5 animate-ping rounded-full bg-green-400" />
            <span className="font-semibold text-green-400">Ao vivo:</span>
            <span className="text-text-secondary">
              João completou 3 hábitos e ganhou +150 XP agora
            </span>
          </div>

          <p className="text-xs text-text-muted">
            Já tem conta?{' '}
            <Link href="/login" className="text-brand-orange hover:underline">
              Entrar agora
            </Link>
          </p>
        </div>
      </section>

      {/* ─── Números ──────────────────────────────────────────────────── */}
      <section className="border-y border-white/5 bg-bg-card/50 px-6 py-16">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 text-center md:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="space-y-1">
              <div className="heading-display text-3xl text-brand-orange md:text-4xl">
                {s.value}
              </div>
              <div className="text-sm font-medium text-white">{s.label}</div>
              <div className="text-xs text-text-muted">{s.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Como funciona ────────────────────────────────────────────── */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-4xl">
          <div className="mb-16 space-y-3 text-center">
            <h2 className="heading-display text-4xl md:text-5xl">Como funciona</h2>
            <p className="mx-auto max-w-xl text-lg text-text-secondary">
              Simples de usar, poderoso de acompanhar.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {HOW_IT_WORKS.map((step, i) => (
              <div
                key={step.step}
                className="relative space-y-4 overflow-hidden rounded-2xl p-8 text-center transition-all"
                style={{
                  background: `linear-gradient(135deg, rgba(${step.rgb},0.07) 0%, rgba(13,24,41,0.98) 100%)`,
                  border: `1px solid rgba(${step.rgb},0.2)`,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                }}
              >
                {i < 2 && (
                  <div className="absolute -right-3 top-1/2 z-10 hidden text-2xl text-border md:block">
                    →
                  </div>
                )}
                <div className="text-5xl">{step.icon}</div>
                <div className="font-mono text-xs font-bold text-brand-orange">{step.step}</div>
                <h3 className="text-lg font-bold">{step.title}</h3>
                <p className="text-sm leading-relaxed text-text-secondary">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features ─────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-b from-transparent to-brand-purple/5 px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-16 space-y-3 text-center">
            <h2 className="heading-display text-4xl md:text-5xl">
              Um sistema.
              <br />
              <span className="gradient-text">Quatro superpoderes.</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="relative space-y-4 overflow-hidden rounded-2xl p-8 transition-all"
                style={{
                  background: `linear-gradient(135deg, rgba(${f.rgb},0.08) 0%, rgba(13,24,41,0.98) 100%)`,
                  border: `1px solid rgba(${f.rgb},0.25)`,
                  boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
                }}
              >
                <div
                  className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full blur-xl"
                  style={{ background: `rgba(${f.rgb},0.15)` }}
                />
                <div className="relative z-10">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-4xl">{f.icon}</span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-text-muted">
                      {f.tag}
                    </span>
                  </div>
                  <h3 className="mb-3 text-xl font-bold">{f.title}</h3>
                  <p className="leading-relaxed text-text-secondary">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Gamificação / Níveis ─────────────────────────────────────── */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-4xl">
          <div className="mb-16 space-y-3 text-center">
            <h2 className="heading-display text-4xl md:text-5xl">
              Sua evolução.
              <br />
              <span className="gradient-text">Visível e real.</span>
            </h2>
            <p className="mx-auto max-w-xl text-lg text-text-secondary">
              8 níveis de progressão, 27+ conquistas, streak diário e XP por cada ação. Não é só um
              app — é um sistema de recompensas para a sua vida.
            </p>
          </div>

          {/* Level cards */}
          <div className="mb-12 grid grid-cols-2 gap-3 md:grid-cols-4">
            {LEVELS.map((l) => (
              <div
                key={l.level}
                className="space-y-2 rounded-2xl p-5 text-center transition-all"
                style={{
                  background: `linear-gradient(135deg, rgba(${l.rgb},0.07) 0%, rgba(13,24,41,0.98) 100%)`,
                  border: `1px solid rgba(${l.rgb},0.2)`,
                }}
              >
                <div className="text-3xl">{l.emoji}</div>
                <div className="font-mono text-xs text-text-muted">LVL {l.level}</div>
                <div className="text-sm font-bold">{l.title}</div>
                <div className="text-[11px] text-text-muted">{l.range}</div>
              </div>
            ))}
          </div>

          {/* XP preview */}
          <div
            className="space-y-4 rounded-2xl p-6"
            style={{
              background:
                'linear-gradient(135deg, rgba(245,200,66,0.07) 0%, rgba(13,24,41,0.99) 100%)',
              border: '1px solid rgba(245,200,66,0.2)',
            }}
          >
            <div className="mb-2 text-sm font-medium text-text-secondary">
              Exemplo de XP em uma semana típica:
            </div>
            <div className="space-y-2">
              {[
                { action: '💪 3 treinos completos', xp: '+900 XP' },
                { action: '🎯 7 hábitos diários (streak)', xp: '+350 XP' },
                { action: '✅ 12 tarefas concluídas', xp: '+600 XP' },
                { action: '🏆 Novo recorde pessoal no supino', xp: '+150 XP' },
                { action: '⭐ 2 dias perfeitos (100% hábitos)', xp: '+400 XP' },
              ].map((item) => (
                <div
                  key={item.action}
                  className="flex items-center justify-between border-b border-border py-1.5 last:border-0"
                >
                  <span className="text-sm text-text-secondary">{item.action}</span>
                  <span className="text-sm font-bold text-brand-gold">{item.xp}</span>
                </div>
              ))}
              <div className="flex items-center justify-between pt-2 font-bold">
                <span className="text-white">Total da semana</span>
                <span className="heading-display text-xl text-brand-gold">+2.400 XP</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Depoimentos ──────────────────────────────────────────────── */}
      <section className="bg-gradient-to-b from-brand-purple/5 to-transparent px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-16 text-center">
            <h2 className="heading-display text-4xl md:text-5xl">
              Quem já usa,
              <br />
              <span className="gradient-text">não volta atrás.</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <div
                key={t.author}
                className="relative space-y-4 overflow-hidden rounded-2xl p-6"
                style={{
                  background: `linear-gradient(135deg, rgba(${t.rgb},0.07) 0%, rgba(13,24,41,0.98) 100%)`,
                  border: `1px solid rgba(${t.rgb},0.2)`,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                }}
              >
                <div className="text-3xl">{t.emoji}</div>
                <p className="text-sm leading-relaxed text-text-secondary">
                  &ldquo;{t.text}&rdquo;
                </p>
                <div>
                  <div className="text-sm font-bold">{t.author}</div>
                  <div className="text-xs text-text-muted">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA Final ────────────────────────────────────────────────── */}
      <section className="px-6 py-32">
        <div className="mx-auto max-w-3xl space-y-8 text-center">
          <div className="text-5xl">🚀</div>
          <h2 className="heading-display text-4xl md:text-6xl">
            Sua melhor versão
            <br />
            <span className="gradient-text">começa hoje.</span>
          </h2>
          <p className="mx-auto max-w-xl text-lg text-text-secondary">
            Suba de nível na academia, no trabalho e no banco. O Ascendia conecta tudo e te dá a
            visão completa de quem você está se tornando.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/signup"
              className="btn-primary inline-block px-10 py-4 text-lg shadow-[0_0_40px_rgba(255,77,0,0.25)]"
            >
              Criar conta grátis →
            </Link>
            <Link href="/planos" className="btn-ghost inline-block px-10 py-4 text-lg">
              Ver preços
            </Link>
          </div>
          <p className="text-xs text-text-muted">
            7 dias grátis · Cancele quando quiser · Sem pegadinhas
          </p>
        </div>
      </section>

      {/* ─── Footer ───────────────────────────────────────────────────── */}
      <LandingSocialProof />

      <footer className="border-t border-white/5 px-6 py-10 text-center text-sm text-text-muted">
        <div className="mb-4 flex flex-wrap justify-center gap-6">
          <Link href="/planos" className="transition-colors hover:text-white">
            Planos
          </Link>
          <Link href="/termos" className="transition-colors hover:text-white">
            Termos de Uso
          </Link>
          <Link href="/privacidade" className="transition-colors hover:text-white">
            Privacidade
          </Link>
          <Link href="/login" className="transition-colors hover:text-white">
            Entrar
          </Link>
          <Link href="/signup" className="transition-colors hover:text-white">
            Criar conta
          </Link>
        </div>
        <p>© {new Date().getFullYear()} Ascendia · Feito no Brasil 🇧🇷</p>
      </footer>
    </main>
  );
}
