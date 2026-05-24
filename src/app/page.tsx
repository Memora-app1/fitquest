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
    desc: 'Registre treinos, acompanhe séries/reps e bata recordes pessoais. Hábitos diários com streak de fogo.',
  },
  {
    icon: '✅',
    title: 'Produtividade',
    desc: 'Kanban completo + Matriz Eisenhower. Foque no que realmente importa, elimine o ruído.',
  },
  {
    icon: '💰',
    title: 'Finanças',
    desc: 'Controle gastos, receitas e metas financeiras. Saiba exatamente onde seu dinheiro vai.',
  },
  {
    icon: '🤖',
    title: 'Coach IA',
    desc: 'Assistente que conhece TODA sua vida — cruza fitness, tarefas e finanças para dar conselhos reais.',
  },
]

const STATS = [
  { value: 'XP', label: 'Cada ação recompensada' },
  { value: '8', label: 'Níveis de evolução' },
  { value: '27+', label: 'Conquistas desbloqueáveis' },
  { value: '7', label: 'Dias grátis para testar' },
]

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
        <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
          <div className="inline-block bg-brand-orange/15 border border-brand-orange/30 rounded-full px-4 py-1.5 text-sm text-brand-orange font-medium">
            7 dias grátis · Sem cartão de crédito
          </div>

          <h1 className="heading-display text-6xl md:text-8xl">
            <span className="gradient-text">FitQuest</span>
          </h1>

          <p className="text-xl md:text-2xl text-text-secondary text-balance max-w-2xl mx-auto">
            Sua vida inteira em <strong className="text-white">um só sistema</strong>.
            Fitness, tarefas, finanças e coach IA — tudo gamificado.
          </p>

          <p className="text-text-muted">
            Cada ação vira XP. Cada dia vira evolução. Cada mês vira nova versão de você.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
            <Link href="/signup" className="btn-primary text-lg px-8 py-4">
              Começar grátis →
            </Link>
            <Link href="/planos" className="btn-ghost text-lg px-8 py-4">
              Ver planos e preços
            </Link>
          </div>

          <p className="text-xs text-text-muted">
            Já tem conta?{' '}
            <Link href="/login" className="text-brand-orange hover:underline">
              Entrar
            </Link>
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-6 border-y border-white/5">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {STATS.map((s) => (
            <div key={s.label} className="space-y-1">
              <div className="heading-display text-4xl text-brand-orange">{s.value}</div>
              <div className="text-sm text-text-secondary">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14 space-y-3">
            <h2 className="heading-display text-4xl md:text-5xl">
              Um sistema.<br />
              <span className="gradient-text">Quatro superpoderes.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="card p-8 space-y-4 hover:border-brand-orange/40 transition-colors">
                <div className="text-4xl">{f.icon}</div>
                <h3 className="text-xl font-bold">{f.title}</h3>
                <p className="text-text-secondary leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social proof / gamification highlight */}
      <section className="py-20 px-6 bg-gradient-to-b from-transparent to-brand-purple/5">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h2 className="heading-display text-4xl md:text-5xl">
            A vida que você quer<br />
            <span className="gradient-text">começa hoje.</span>
          </h2>
          <p className="text-text-secondary text-lg">
            Suba de nível na academia, no trabalho e no banco. O FitQuest conecta tudo
            e te dá a visão completa de quem você está se tornando.
          </p>
          <Link href="/signup" className="btn-primary inline-block text-lg px-10 py-4">
            Criar conta grátis →
          </Link>
          <p className="text-xs text-text-muted">
            Garantia de 7 dias · Cancele quando quiser · Sem pegadinhas
          </p>
        </div>
      </section>

      {/* Footer simples */}
      <footer className="py-10 px-6 border-t border-white/5 text-center text-sm text-text-muted">
        <div className="flex flex-wrap justify-center gap-6 mb-4">
          <Link href="/planos" className="hover:text-white transition-colors">Planos</Link>
          <Link href="/termos" className="hover:text-white transition-colors">Termos de Uso</Link>
          <Link href="/privacidade" className="hover:text-white transition-colors">Privacidade</Link>
          <Link href="/login" className="hover:text-white transition-colors">Entrar</Link>
        </div>
        <p>© {new Date().getFullYear()} FitQuest · Feito no Brasil 🇧🇷</p>
      </footer>
    </main>
  )
}
