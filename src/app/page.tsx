import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'FitQuest — Sua vida inteira em um só sistema',
  description:
    'Life OS gamificado: fitness, produtividade, finanças e coach IA. Cada ação vira XP. 7 dias grátis, cancele quando quiser.',
}

const FEATURES = [
  {
    icon: '💪',
    title: 'Fitness & Hábitos',
    desc: 'Registre treinos com sets/reps, bata recordes pessoais e construa hábitos com streak de fogo. Cada rep conta.',
    tag: 'XP por série',
    color: 'border-brand-orange/30 hover:border-brand-orange/60',
  },
  {
    icon: '✅',
    title: 'Produtividade',
    desc: 'Kanban completo + Matriz Eisenhower. Identifique o que é urgente, importante e elimine o ruído da sua vida.',
    tag: 'XP por tarefa',
    color: 'border-brand-purple/30 hover:border-brand-purple/60',
  },
  {
    icon: '💰',
    title: 'Controle Financeiro',
    desc: 'Registre receitas, despesas e metas. Saiba sua taxa de poupança, veja onde seu dinheiro vai e evolua.',
    tag: 'XP por registro',
    color: 'border-brand-green/30 hover:border-brand-green/60',
  },
  {
    icon: '🤖',
    title: 'Coach IA',
    desc: 'Assistente que conhece TODA sua vida — cruza seus dados de fitness, tarefas e finanças para conselhos reais.',
    tag: 'Anthropic Claude',
    color: 'border-brand-gold/30 hover:border-brand-gold/60',
  },
]

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Registre sua vida',
    desc: 'Treinos, hábitos, tarefas e finanças em um único lugar. Mobile-first, rápido de usar.',
    icon: '📝',
  },
  {
    step: '02',
    title: 'Ganhe XP por tudo',
    desc: 'Cada ação real vira XP. Completar hábito, terminar tarefa, registrar gasto — tudo recompensado.',
    icon: '⚡',
  },
  {
    step: '03',
    title: 'Suba de nível',
    desc: 'De Iniciante a FitQuest Master. Desbloqueie conquistas e mantenha sua sequência acesa.',
    icon: '🏆',
  },
]

const LEVELS = [
  { level: 1, title: 'Iniciante', range: '0–500 XP', emoji: '🌱' },
  { level: 3, title: 'Consistente', range: '1.500–3.500 XP', emoji: '⚡' },
  { level: 5, title: 'Guerreiro', range: '7.000–12.000 XP', emoji: '🔥' },
  { level: 8, title: 'FitQuest Master', range: '35.000+ XP', emoji: '👑' },
]

const TESTIMONIALS = [
  {
    text: 'Finalmente um app que conecta academia, trabalho e dinheiro. Antes eu tinha 3 apps diferentes. Agora tenho um.',
    author: 'Lucas M.',
    role: 'Engenheiro de Software',
    emoji: '💻',
  },
  {
    text: 'A Matriz Eisenhower mudou minha semana. O Coach IA cruzou meu burnout com meus gastos e fez sentido na hora.',
    author: 'Ana C.',
    role: 'Gestora de Produto',
    emoji: '📊',
  },
  {
    text: 'O sistema de XP parece bobo, mas funciona. Entrar no app virou hábito porque a recompensa é imediata.',
    author: 'Rafael S.',
    role: 'Personal Trainer',
    emoji: '🏋️',
  },
]

const STATS = [
  { value: 'R$ 37', label: 'por mês, tudo incluído', sub: 'ou R$ 25,55/mês no plano anual' },
  { value: '7 dias', label: 'de teste gratuito', sub: 'sem cartão de crédito' },
  { value: '4 em 1', label: 'fitness + tarefas + finanças + IA', sub: 'tudo conectado' },
  { value: '27+', label: 'conquistas desbloqueáveis', sub: 'sistema de progressão real' },
]

export default function LandingPage() {
  return (
    <main className="min-h-screen text-white">

      {/* ─── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative flex flex-col items-center justify-center min-h-screen p-6 text-center overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-brand-orange/10 blur-[120px] rounded-full" />
          <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[300px] bg-brand-purple/10 blur-[100px] rounded-full" />
        </div>

        <div className="relative max-w-3xl mx-auto space-y-8 animate-fade-in z-10">
          <div className="inline-flex items-center gap-2 bg-brand-orange/15 border border-brand-orange/30 rounded-full px-4 py-1.5 text-sm text-brand-orange font-medium">
            <span className="w-1.5 h-1.5 bg-brand-orange rounded-full animate-pulse" />
            7 dias grátis · Sem cartão de crédito
          </div>

          <h1 className="heading-display text-6xl md:text-8xl leading-none">
            <span className="gradient-text">FitQuest</span>
          </h1>

          <p className="text-xl md:text-2xl text-text-secondary text-balance max-w-2xl mx-auto leading-relaxed">
            O <strong className="text-white">único app</strong> que gamifica academia,
            produtividade e finanças ao mesmo tempo.
          </p>

          <p className="text-text-muted max-w-lg mx-auto">
            Cada ação vira XP. Cada dia vira evolução. Seu Coach IA sabe de tudo e conecta os pontos.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
            <Link href="/signup" className="btn-primary text-lg px-8 py-4 shadow-[0_0_30px_rgba(255,77,0,0.3)]">
              Começar 7 dias grátis →
            </Link>
            <Link href="/planos" className="btn-ghost text-lg px-8 py-4">
              Ver planos
            </Link>
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
      <section className="py-16 px-6 border-y border-white/5 bg-bg-card/50">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {STATS.map((s) => (
            <div key={s.label} className="space-y-1">
              <div className="heading-display text-3xl md:text-4xl text-brand-orange">{s.value}</div>
              <div className="text-sm font-medium text-white">{s.label}</div>
              <div className="text-xs text-text-muted">{s.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Como funciona ────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16 space-y-3">
            <h2 className="heading-display text-4xl md:text-5xl">
              Como funciona
            </h2>
            <p className="text-text-secondary text-lg max-w-xl mx-auto">
              Simples de usar, poderoso de acompanhar.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {HOW_IT_WORKS.map((step, i) => (
              <div
                key={step.step}
                className="relative card p-8 text-center space-y-4 hover:border-brand-orange/30 transition-all"
              >
                {i < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 text-border text-2xl z-10">→</div>
                )}
                <div className="text-5xl">{step.icon}</div>
                <div className="text-brand-orange font-mono text-xs font-bold">{step.step}</div>
                <h3 className="font-bold text-lg">{step.title}</h3>
                <p className="text-text-secondary text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features ─────────────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-gradient-to-b from-transparent to-brand-purple/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16 space-y-3">
            <h2 className="heading-display text-4xl md:text-5xl">
              Um sistema.<br />
              <span className="gradient-text">Quatro superpoderes.</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className={`card p-8 space-y-4 transition-all ${f.color}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-4xl">{f.icon}</span>
                  <span className="text-xs bg-white/5 border border-white/10 px-2.5 py-1 rounded-full text-text-muted">
                    {f.tag}
                  </span>
                </div>
                <h3 className="text-xl font-bold">{f.title}</h3>
                <p className="text-text-secondary leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Gamificação / Níveis ─────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16 space-y-3">
            <h2 className="heading-display text-4xl md:text-5xl">
              Sua evolução.<br />
              <span className="gradient-text">Visível e real.</span>
            </h2>
            <p className="text-text-secondary text-lg max-w-xl mx-auto">
              8 níveis de progressão, 27+ conquistas, streak diário e XP por cada ação.
              Não é só um app — é um sistema de recompensas para a sua vida.
            </p>
          </div>

          {/* Level cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-12">
            {LEVELS.map((l) => (
              <div
                key={l.level}
                className="card p-5 text-center space-y-2 hover:border-brand-gold/40 transition-colors"
              >
                <div className="text-3xl">{l.emoji}</div>
                <div className="text-xs text-text-muted font-mono">LVL {l.level}</div>
                <div className="font-bold text-sm">{l.title}</div>
                <div className="text-[11px] text-text-muted">{l.range}</div>
              </div>
            ))}
          </div>

          {/* XP preview */}
          <div className="card p-6 space-y-4">
            <div className="text-sm text-text-secondary font-medium mb-2">Exemplo de XP em uma semana típica:</div>
            <div className="space-y-2">
              {[
                { action: '💪 3 treinos completos', xp: '+900 XP' },
                { action: '🎯 7 hábitos diários (streak)', xp: '+350 XP' },
                { action: '✅ 12 tarefas concluídas', xp: '+600 XP' },
                { action: '🏆 Novo recorde pessoal no supino', xp: '+150 XP' },
                { action: '⭐ 2 dias perfeitos (100% hábitos)', xp: '+400 XP' },
              ].map((item) => (
                <div key={item.action} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                  <span className="text-sm text-text-secondary">{item.action}</span>
                  <span className="font-bold text-brand-gold text-sm">{item.xp}</span>
                </div>
              ))}
              <div className="flex items-center justify-between pt-2 font-bold">
                <span className="text-white">Total da semana</span>
                <span className="text-brand-gold heading-display text-xl">+2.400 XP</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Depoimentos ──────────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-gradient-to-b from-brand-purple/5 to-transparent">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="heading-display text-4xl md:text-5xl">
              Quem já usa,<br />
              <span className="gradient-text">não volta atrás.</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t) => (
              <div key={t.author} className="card p-6 space-y-4">
                <div className="text-3xl">{t.emoji}</div>
                <p className="text-text-secondary leading-relaxed text-sm">
                  &ldquo;{t.text}&rdquo;
                </p>
                <div>
                  <div className="font-bold text-sm">{t.author}</div>
                  <div className="text-xs text-text-muted">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA Final ────────────────────────────────────────────────── */}
      <section className="py-32 px-6">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <div className="text-5xl">🚀</div>
          <h2 className="heading-display text-4xl md:text-6xl">
            Sua melhor versão<br />
            <span className="gradient-text">começa hoje.</span>
          </h2>
          <p className="text-text-secondary text-lg max-w-xl mx-auto">
            Suba de nível na academia, no trabalho e no banco.
            O FitQuest conecta tudo e te dá a visão completa de quem você está se tornando.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="btn-primary inline-block text-lg px-10 py-4 shadow-[0_0_40px_rgba(255,77,0,0.25)]"
            >
              Criar conta grátis →
            </Link>
            <Link href="/planos" className="btn-ghost inline-block text-lg px-10 py-4">
              Ver preços
            </Link>
          </div>
          <p className="text-xs text-text-muted">
            7 dias grátis · Cancele quando quiser · Sem pegadinhas
          </p>
        </div>
      </section>

      {/* ─── Footer ───────────────────────────────────────────────────── */}
      <footer className="py-10 px-6 border-t border-white/5 text-center text-sm text-text-muted">
        <div className="flex flex-wrap justify-center gap-6 mb-4">
          <Link href="/planos" className="hover:text-white transition-colors">Planos</Link>
          <Link href="/termos" className="hover:text-white transition-colors">Termos de Uso</Link>
          <Link href="/privacidade" className="hover:text-white transition-colors">Privacidade</Link>
          <Link href="/login" className="hover:text-white transition-colors">Entrar</Link>
          <Link href="/signup" className="hover:text-white transition-colors">Criar conta</Link>
        </div>
        <p>© {new Date().getFullYear()} FitQuest · Feito no Brasil 🇧🇷</p>
      </footer>
    </main>
  )
}
