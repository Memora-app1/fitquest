/**
 * Landing page do FitQuest
 *
 * 📌 Esta página deve conter o funil de quiz que você já criou (HTML único).
 * Para integrar:
 * 1. Copie o conteúdo do <body> do funil
 * 2. Cole aqui dentro do return ()
 * 3. Mova as <style> para globals.css ou um <style jsx> separado
 *
 * Por ora, esta é uma landing simples que aponta para signup.
 */

import Link from 'next/link'

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl text-center space-y-8 animate-fade-in">
        <div className="inline-block bg-gradient-brand p-4 rounded-2xl shadow-2xl shadow-brand-orange/30">
          <span className="text-6xl">⚡</span>
        </div>

        <h1 className="heading-display text-6xl md:text-8xl">
          <span className="gradient-text">FitQuest</span>
        </h1>

        <p className="text-xl md:text-2xl text-text-secondary text-balance">
          Sua vida inteira em <strong className="text-white">um só sistema</strong>.
          Fitness, tarefas, finanças e coach IA — gamificados.
        </p>

        <p className="text-text-muted">
          Cada ação vira XP. Cada dia vira evolução. Cada mês vira nova versão de você.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Link href="/signup" className="btn-primary text-lg px-8 py-4">
            Começar grátis 7 dias →
          </Link>
          <Link href="/login" className="btn-ghost text-lg px-8 py-4">
            Já tenho conta
          </Link>
        </div>

        <div className="pt-12 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          {[
            { icon: '💪', label: 'Hábitos' },
            { icon: '✅', label: 'Tarefas' },
            { icon: '💰', label: 'Finanças' },
            { icon: '🤖', label: 'Coach IA' },
          ].map((f) => (
            <div key={f.label} className="card p-4 text-center">
              <div className="text-3xl mb-2">{f.icon}</div>
              <div className="text-text-secondary">{f.label}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
